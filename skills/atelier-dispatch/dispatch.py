#!/usr/bin/env python3
"""
atelier dispatch engine — the loop is in CODE, models are tools. No LLM orchestration,
no API key (bare `claude -p --model X --bare`, subscription OAuth).

Terminology (matches the pipelines repo): spec -> Sonnet writes the contract (cross-sprint
surface, pins ambiguous decisions) + sprints (self-contained units of work) -> Haiku
executes each sprint -> Sonnet fixes on failure (bounded).

Modes:
  dispatch.py --plan            : ONE Sonnet call -> contract.md + sprints.jsonl (from spec.md [+ agenda.md])
  dispatch.py                   : execute — loop sprints.jsonl, bare Haiku calls write <FILE> blocks to disk
  dispatch.py --run "<gate cmd>": FULL pipeline — plan -> execute -> gate -> bounded fix loop -> run_manifest.json

The whole tiered build runs with zero turn-by-turn orchestration: Sonnet architects,
Haiku executes, the gate runs as a subprocess, Sonnet fixes on failure (bounded). A
strong model need only write agenda.md first (optional) and fire this once.
"""
import json, subprocess, re, os, sys, pathlib, concurrent.futures, glob

# --bare strips the system prompt; we supply a tiny focused one per role so the small
# model has format/behavior discipline without the ~40k Claude Code harness.
SYS_EXEC = ('You are an expert programmer. You write EXACTLY ONE file from the brief, '
            'honoring the contract. Output ONLY that file wrapped as '
            '<FILE path="relative/path">...</FILE> — no prose, no markdown fences, '
            'nothing before or after the FILE block. Be terse and correct.')
SYS_PLAN = ('You are a software architect. Output ONLY the requested files, each wrapped '
            'as <FILE path="...">...</FILE>, nothing else. Be precise and lean.')
SYS_BRIEF = ('You are a planner. Output ONLY a terse build brief in markdown — bullets plus '
             'concrete acceptance criteria for a capable executor. No preamble, no code fences.')

def log(msg):
    # flushed so progress streams live to a watcher (the orchestrator tailing this in the
    # background) instead of buffering until the process exits.
    print(msg, flush=True)

def call_model(prompt, model, system=None):
    cmd = ["claude","-p",prompt,"--model",model,"--bare","--output-format","json"]
    if system: cmd += ["--system-prompt", system]
    # `claude -p` intermittently exits rc!=0 (transient API/rate/network blip) or returns
    # unparseable output. These almost always clear on a retry, so try once more before
    # giving up — a single flaky call must not silently drop a plan or a sprint's artifact.
    for attempt in (1, 2):
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=900)
        if p.returncode != 0:
            sys.stderr.write(f"[dispatch] model call FAILED rc={p.returncode} ({model}) attempt {attempt}/2: {p.stderr[:300]}\n")
            continue
        try:
            d = json.loads(p.stdout)
            return d.get("result", ""), float(d.get("total_cost_usd", 0) or 0)
        except (ValueError, TypeError) as e:
            sys.stderr.write(f"[dispatch] parse fail ({model}) attempt {attempt}/2: {e}: {p.stdout[:200]} {p.stderr[:200]}\n")
    # both attempts failed — surface empty rather than treating junk as file content
    return "", 0.0

FILE_RE = re.compile(r'<FILE path="([^"]+)">\r?\n?(.*?)\r?\n?</FILE>', re.DOTALL)
def write_files(text, root="."):
    """Write each <FILE> block, but REFUSE any path that escapes the workspace root
    (a model-emitted `../../x` or `/etc/x` must never overwrite arbitrary files)."""
    written = []
    root_path = pathlib.Path(root).resolve()
    for m in FILE_RE.finditer(text):
        rel, content = m.group(1), m.group(2)
        target = (root_path / rel).resolve()
        if target != root_path and root_path not in target.parents:
            sys.stderr.write(f"[dispatch] REFUSED path outside workspace: {rel}\n")
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content if content.endswith("\n") else content + "\n")
        written.append(rel)
    return written

def plan():
    spec = open("spec.md").read() if os.path.exists("spec.md") else ""
    agenda = open("agenda.md").read() if os.path.exists("agenda.md") else ""
    prompt = ("You are the contract writer. " + ("The architect gave the AGENDA below; honor it. " if agenda else "")
        + "Investigate the task, then produce EXACTLY two files, each wrapped as "
        "<FILE path=\"...\">...</FILE>, nothing else:\n"
        "1) contract.md — cross-sprint surface ONLY (shared interfaces/seam, conventions, ownership, dep graph). "
        "Where the spec is genuinely ambiguous, COMMIT to one answer here so the executor never has to invent it. Lean.\n"
        "2) sprints.jsonl — one JSON per line (a sprint = one self-contained unit of work): "
        '{"id":"SPRINT-001","tier":"haiku","kind":"generate","deps":[],"brief":"terse brief + acceptance criteria"}. '
        "STRICT: exactly ONE output file per sprint — never bundle two files into one sprint "
        "(the executor is a small model and does best on a single focused file). If a "
        "feature needs a source file and a test file, that's TWO sprints.\n"
        "EVERY generate sprint runs on Haiku (set tier to \"haiku\") — there is NO Sonnet "
        "executor tier. Decomposition is YOUR job: size and specify each sprint so Haiku can "
        "execute it from the contract + brief with zero judgment left. If a unit feels too "
        "hard or too large for Haiku, SPLIT it into smaller sprints — never escalate to a "
        "stronger executor (that's what burns the cost win). Sonnet is used only here, for "
        "planning, and for the post-gate fix loop.\n\n"
        + (f"AGENDA:\n{agenda}\n\n" if agenda else "") + f"TASK SPEC:\n{spec}\n")
    log("[plan] architecting contract + sprints (sonnet)...")
    text, cost = call_model(prompt, "sonnet", system=SYS_PLAN)
    files = write_files(text)
    ok = {"contract.md", "sprints.jsonl"}.issubset(set(files))
    n = sum(1 for line in open("sprints.jsonl") if line.strip()) if os.path.exists("sprints.jsonl") else 0
    json.dump({"plan_cost_usd": round(cost,5), "files": files, "ok": ok}, open("plan_manifest.json","w"), indent=2)
    if not ok:   # model call failed or produced incomplete output — don't proceed to execute
        sys.stderr.write(f"[plan] FAILED: expected contract.md + sprints.jsonl, got {files}. Aborting.\n")
        sys.exit(1)
    log(f"[plan] done: contract.md + sprints.jsonl - {n} sprints, ${cost:.4f}")
    return cost

def execute():
    root = os.getcwd()
    contract = open("contract.md").read() if os.path.exists("contract.md") else ""
    sprints = [json.loads(line) for line in open("sprints.jsonl") if line.strip()]
    pending = {s["id"]: s for s in sprints}
    done, manifest, total = set(), [], 0.0
    log(f"[execute] building {len(sprints)} sprints on Haiku...")
    def call_for(s):
        # kind "brief" -> emit markdown (saved to briefs/<id>.md); else -> emit <FILE> blocks
        if s.get("kind") == "brief":
            return call_model(f"CONTRACT:\n{contract}\n\nWrite the brief for this sprint:\n{s.get('brief','')}\n",
                              s.get("tier","sonnet"), SYS_BRIEF)
        # Code generation ALWAYS runs on Haiku, regardless of any tier the plan wrote.
        # The planner's job is to decompose to Haiku-executable granularity, not to escalate
        # the executor — escalating is what burns the cost win. Sonnet stays reserved for
        # planning and the bounded post-gate fix loop. (A genuine miss is caught by the fix
        # loop, not by a more expensive executor.)
        return call_model(f"CONTRACT:\n{contract}\n\nYOUR SPRINT BRIEF (write exactly one file):\n{s.get('brief','')}\n",
                          "haiku", SYS_EXEC)
    while pending:
        ready = [s for s in pending.values() if all(d in done for d in s.get("deps", []))]
        if not ready:   # unresolved deps or a cycle — do NOT silently run everything
            sys.stderr.write(f"[dispatch] ERROR: unresolved deps / dependency cycle among {sorted(pending)}; aborting.\n")
            break
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
            futs = {ex.submit(call_for, s): s for s in ready}
            for fut in concurrent.futures.as_completed(futs):
                s = futs[fut]
                text, cost = fut.result()
                total += cost
                if s.get("kind") == "brief":
                    out = s.get("out", f"briefs/{s['id']}.md")
                    op = (pathlib.Path(root) / out).resolve()
                    if op != pathlib.Path(root).resolve() and pathlib.Path(root).resolve() in op.parents:
                        op.parent.mkdir(parents=True, exist_ok=True)
                        op.write_text(text)
                        files = [out]
                    else:
                        sys.stderr.write(f"[dispatch] REFUSED brief path outside workspace: {out}\n")
                        files = []
                else:
                    files = write_files(text, root)
                # record the model that ACTUALLY ran, not the plan's intent: generate sprints
                # are forced to Haiku above, so a plan that wrote tier:"sonnet" must not show
                # up as sonnet in the manifest (these manifests are our cost-attribution truth).
                actual_tier = s.get("tier","sonnet") if s.get("kind") == "brief" else "haiku"
                manifest.append({"id":s["id"],"tier":actual_tier,"kind":s.get("kind","generate"),
                                 "cost_usd":round(cost,5),"files":files,"ok":bool(files)})
                del pending[s["id"]]
                if files:
                    done.add(s["id"])
                    log(f"[execute]   ok {s['id']} -> {', '.join(files)}  ${cost:.4f}  ({len(manifest)}/{len(sprints)})")
                else:
                    # a failed sprint is NOT marked done — its dependents stay unsatisfied and
                    # the next wave aborts, rather than building against missing artifacts.
                    log(f"[execute]   FAILED {s['id']}: no output - dependents will not run  ({len(manifest)}/{len(sprints)})")
                    sys.stderr.write(f"[dispatch] FAILED sprint {s['id']}: no output — dependents will not run.\n")
    json.dump({"sprints":manifest,"dispatch_cost_usd":round(total,4),
               "all_ok":all(m["ok"] for m in manifest) and not pending}, open("manifest.json","w"), indent=2)
    log(f"[execute] done: {len(manifest)} sprints, ${total:.4f}" + ("" if not pending else f" (ABORTED: {len(pending)} unrun)"))
    return total

def run_gate(cmd):
    p = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=600)
    return p.returncode == 0, (p.stdout + p.stderr)[-4000:]

def fix(gate_out):
    # discover source/test files by extension across the whole workspace, so the repair
    # context covers JS (src/, test/), Python (pkg/, tests/), and Go (graph/, main.go)
    # layouts — not just src/ + test/.
    exts = (".js", ".mjs", ".ts", ".py", ".go")
    files = sorted(f for f in glob.glob("**/*", recursive=True)
                   if os.path.isfile(f) and f.endswith(exts) and "node_modules/" not in f)
    blob = "\n".join(f'<FILE path="{f}">\n{open(f).read()}\n</FILE>' for f in files)
    prompt = ("Some tests are failing. Diagnose and fix. Output corrected versions of ONLY the files "
        "that need changing, each wrapped <FILE path=\"...\">...</FILE>, no prose.\n\n"
        f"GATE OUTPUT (failures):\n{gate_out}\n\nCURRENT FILES:\n{blob}\n")
    log("[fix] gate failed - Sonnet diagnosing + repairing...")
    text, cost = call_model(prompt, "sonnet",
        system='Output ONLY corrected files, each wrapped as <FILE path="...">...</FILE>, nothing else.')
    changed = write_files(text)
    log(f"[fix] done: changed {changed}  ${cost:.4f}")
    return cost

def run_pipeline(gate_cmd):
    pc = plan()
    dc = execute()
    fc = 0.0
    rounds = 0
    log(f"[gate] running: {gate_cmd}")
    ok, out = run_gate(gate_cmd)
    log(f"[gate] {'PASS' if ok else 'FAIL'}")
    while not ok and rounds < 2:
        rounds += 1
        fc += fix(out)
        log(f"[gate] re-running after fix {rounds}: {gate_cmd}")
        ok, out = run_gate(gate_cmd)
        log(f"[gate] {'PASS' if ok else 'FAIL'}")
    json.dump({"plan_cost_usd":round(pc,5),"dispatch_cost_usd":round(dc,5),"fix_cost_usd":round(fc,5),
               "fix_rounds":rounds,"gate_pass":ok,"total_cost_usd":round(pc+dc+fc,4)},
              open("run_manifest.json","w"), indent=2)
    log(f"[done] gate {'PASS' if ok else 'FAIL'} after {rounds} fix round(s) -> run_manifest.json")
    log(f"[done] plan ${pc:.4f} + exec ${dc:.4f} + fix ${fc:.4f} = ${pc+dc+fc:.4f}")

def main():
    try:
        sys.stdout.reconfigure(line_buffering=True)  # stream progress; harmless if unsupported
    except (AttributeError, ValueError):
        pass
    if "--run" in sys.argv:
        i = sys.argv.index("--run")
        gate = sys.argv[i + 1] if i + 1 < len(sys.argv) else "node --test"
        run_pipeline(gate)
    elif "--plan" in sys.argv:
        plan()
    else:
        execute()

if __name__ == "__main__":
    main()
