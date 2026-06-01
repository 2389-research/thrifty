# Benchmark 05 — comparison brief (generality probe: non-code)

Non-code probe — exercises the **assertional** verification path (Sonnet reads and
judges) instead of a runnable gate, and tests whether the split tier holds up on
prose. No tests; quality is judged against a concrete checklist.

Write `BRIEF.md`: a one-page internal comparison of **three task-queue approaches** —
in-memory, SQLite-backed, and Redis-backed — for a small web backend. Use only the
facts below (don't invent capabilities); decompose into one section per approach plus
a TL;DR + a "How to choose" decision list.

## Source facts (the only permitted material; cite as [in-mem]/[sqlite]/[redis])
- [in-mem] zero deps, fastest, lost on restart; fine for dev / single process.
- [sqlite] one file, durable, no server; good to mid-scale; single-writer contention
  under high concurrency.
- [redis] separate server, durable-ish, fast, scales to many workers; operational
  overhead of running Redis.

## Verifiable acceptance criteria (the gate — a reader checks these)
- One `##` section per approach, each 60–110 words, ≥1 bracket citation, naming its
  best-fit use case + its main drawback.
- A TL;DR (2–3 sentences) contrasting the three on durability vs operational cost.
- A `## How to choose` list with ≥3 "If <situation> → use **<approach>**" bullets.
- Neutral second-person voice, present tense, no first person; no invented facts
  beyond the source list.

## Done = 
`BRIEF.md` satisfies every checklist item above (verified by reading).
