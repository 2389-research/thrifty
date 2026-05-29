#!/usr/bin/env python3
"""
atelier dispatch engine — the loop is in CODE, models are tools. No LLM orchestration,
no API key (bare `claude -p --model X --bare`, subscription OAuth).

Modes:
  dispatch.py --plan            : ONE Sonnet call -> contract.md + units.jsonl (from spec.md [+ agenda.md])
  dispatch.py                   : execute — loop units.jsonl, bare Haiku calls write <FILE> blocks to disk
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

def call_model(prompt, model, system=None):
    cmd = ["claude","-p",prompt,"--model",model,"--bare","--output-format","json"]
    if system: cmd += ["--system-prompt", system]
    p = subprocess.run(cmd, capture_output=True, text=True, timeout=900)
    try:
        d = json.loads(p.stdout); return d.get("result",""), float(d.get("total_cost_usd",0) or 0)
    except Exception:
        sys.stderr.write(f"[dispatch] parse fail: {p.stdout[:200]} {p.stderr[:200]}\n"); return p.stdout, 0.0

FILE_RE = re.compile(r'<FILE path="([^"]+)">\r?\n?(.*?)\r?\n?</FILE>', re.DOTALL)
def write_files(text, root="."):
    written = []
    for m in FILE_RE.finditer(text):
        rel, content = m.group(1), m.group(2)
        path = os.path.join(root, rel)
        pathlib.Path(os.path.dirname(path) or ".").mkdir(parents=True, exist_ok=True)
        open(path, "w").write(content if content.endswith("\n") else content + "\n")
        written.append(rel)
    return written

def plan():
    spec = open("spec.md").read() if os.path.exists("spec.md") else ""
    agenda = open("agenda.md").read() if os.path.exists("agenda.md") else ""
    prompt = ("You are the contract writer. " + ("The architect gave the AGENDA below; honor it. " if agenda else "")
        + "Investigate the task, then produce EXACTLY two files, each wrapped as "
        "<FILE path=\"...\">...</FILE>, nothing else:\n"
        "1) contract.md — cross-unit surface ONLY (shared interfaces/seam, conventions, ownership, dep graph). Lean.\n"
        "2) units.jsonl — one JSON per line: "
        '{"id":"UNIT-001","tier":"haiku","kind":"generate","deps":[],"brief":"terse brief + acceptance criteria"}. '
        "STRICT: exactly ONE output file per unit — never bundle two files into one unit "
        "(the executor is a small model and does best on a single focused file). If a "
        "feature needs a source file and a test file, that's TWO units.\n\n"
        + (f"AGENDA:\n{agenda}\n\n" if agenda else "") + f"TASK SPEC:\n{spec}\n")
    text, cost = call_model(prompt, "sonnet", system=SYS_PLAN)
    files = write_files(text)
    json.dump({"plan_cost_usd": round(cost,5), "files": files}, open("plan_manifest.json","w"), indent=2)
    print(f"[plan] sonnet ${cost:.4f} -> {files}")
    return cost

def execute():
    contract = open("contract.md").read() if os.path.exists("contract.md") else ""
    units = [json.loads(l) for l in open("units.jsonl") if l.strip()]
    pending = {u["id"]: u for u in units}; done, manifest, total = set(), [], 0.0
    def prompt_for(u):
        return f"CONTRACT:\n{contract}\n\nYOUR UNIT BRIEF (write exactly one file):\n{u.get('brief','')}\n"
    while pending:
        ready = [u for u in pending.values() if all(d in done for d in u.get("deps", []))] or list(pending.values())
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
            futs = {ex.submit(call_model, prompt_for(u), u.get("tier","haiku"), SYS_EXEC): u for u in ready}
            for fut in concurrent.futures.as_completed(futs):
                u = futs[fut]; text, cost = fut.result(); total += cost
                files = write_files(text)
                manifest.append({"id":u["id"],"tier":u.get("tier"),"cost_usd":round(cost,5),"files":files})
                done.add(u["id"]); del pending[u["id"]]
    json.dump({"units":manifest,"dispatch_cost_usd":round(total,4)}, open("manifest.json","w"), indent=2)
    print(f"[execute] {len(manifest)} units, haiku ${total:.4f}")
    return total

def run_gate(cmd):
    p = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=600)
    return p.returncode == 0, (p.stdout + p.stderr)[-4000:]

def fix(gate_out):
    files = sorted(set(glob.glob("src/**/*", recursive=True) + glob.glob("test/**/*", recursive=True)))
    files = [f for f in files if os.path.isfile(f)]
    blob = "\n".join(f'<FILE path="{f}">\n{open(f).read()}\n</FILE>' for f in files)
    prompt = ("Some tests are failing. Diagnose and fix. Output corrected versions of ONLY the files "
        "that need changing, each wrapped <FILE path=\"...\">...</FILE>, no prose.\n\n"
        f"GATE OUTPUT (failures):\n{gate_out}\n\nCURRENT FILES:\n{blob}\n")
    text, cost = call_model(prompt, "sonnet",
        system='Output ONLY corrected files, each wrapped as <FILE path="...">...</FILE>, nothing else.')
    changed = write_files(text)
    print(f"[fix] sonnet ${cost:.4f} -> changed {changed}")
    return cost

def run_pipeline(gate_cmd):
    pc = plan(); dc = execute(); fc = 0.0; rounds = 0
    ok, out = run_gate(gate_cmd)
    while not ok and rounds < 2:
        rounds += 1; fc += fix(out); ok, out = run_gate(gate_cmd)
    json.dump({"plan_cost_usd":round(pc,5),"dispatch_cost_usd":round(dc,5),"fix_cost_usd":round(fc,5),
               "fix_rounds":rounds,"gate_pass":ok,"total_cost_usd":round(pc+dc+fc,4)},
              open("run_manifest.json","w"), indent=2)
    print(f"[run] gate {'PASS' if ok else 'FAIL'} after {rounds} fix round(s) | "
          f"plan ${pc:.4f} + exec ${dc:.4f} + fix ${fc:.4f} = ${pc+dc+fc:.4f}")

def main():
    if "--run" in sys.argv:
        i = sys.argv.index("--run"); gate = sys.argv[i+1] if i+1 < len(sys.argv) else "node --test"
        run_pipeline(gate)
    elif "--plan" in sys.argv:
        plan()
    else:
        execute()

if __name__ == "__main__":
    main()
