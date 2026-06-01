# Benchmark 07 — taskgraph (Go, multi-package)

Third-stack probe: a Go module with real algorithmic content and multiple packages —
to check atelier/Haiku isn't tuned to JS/Python idiom. This is the Go analogue of the
large benchmarks.

Build a Go module `taskgraph` (Go 1.21+, standard library only, tests via
`go test ./...`): a **dependency-DAG scheduler**. Nodes are tasks with an integer
weight (duration); a directed edge `from → to` means **`from` must run before `to`**
(`from` is a prerequisite of `to`).

## Algorithms (the real logic)
- **Topological order** — a linear order respecting all edges (every `from` before its
  `to`). Detect cycles and report them as an error rather than looping forever.
- **Waves (level schedule)** — group nodes into waves where wave 0 = nodes with no
  prerequisites, and each later wave = nodes whose every prerequisite appears in an
  earlier wave. This is the max-parallelism schedule. Cyclic input is an error.
- **Critical path** — the longest path through the DAG by **summed node weight**
  (following edge direction). Return the path (node ids in order) and its total weight.
  Cyclic input is an error.
- Determinism: wherever ties are possible (topo order within a level, wave membership
  ordering), break them by ascending node id so output is reproducible and testable.

## Requirements (each a natural file/unit in package `graph`, plus a CLI in `main`)
- `graph/graph.go` — `type Graph` with `New() *Graph`, `AddNode(id string, weight int)`,
  `AddEdge(from, to string) error` (error if either node is missing), and accessors as
  needed (e.g. `Nodes() []string`, `Weight(id) int`). Adding a duplicate node id should
  not clobber silently in a surprising way — pick a sane, documented behavior.
- `graph/topo.go` — `TopoSort(g *Graph) ([]string, error)` (Kahn's algorithm; ascending-id
  tie-break; returns an error whose message says "cycle" on a cyclic graph).
- `graph/schedule.go` — `Waves(g *Graph) ([][]string, error)` (level schedule as above;
  ids within each wave sorted ascending; error on cycle).
- `graph/critical.go` — `CriticalPath(g *Graph) (path []string, total int, err error)`
  (longest weighted path; deterministic tie-break; error on cycle).
- `main.go` (package main) — `go run . <topo|waves|critical> <file.json>` where the JSON
  is `{"nodes":[{"id":"a","weight":3}], "edges":[["a","b"],["a","c"]]}`. Parses the
  file, builds the graph, runs the requested command, prints the result (one line per
  wave for `waves`; the path and total for `critical`). A missing file, malformed JSON,
  an edge referencing an unknown node, or a cyclic graph exits non-zero with a message
  on stderr.
- `*_test.go` files covering: AddEdge error on missing node; topo order on a real DAG
  and the cycle error; waves on a diamond dependency (a→b, a→c, b→d, c→d gives waves
  [[a],[b,c],[d]]); critical path picks the longest-weight chain (not the longest by
  node count); and a CLI integration test (via `os/exec` running `go run .` or a built
  binary) over a fixture JSON you create.

## Done =
`go test ./...` passes; `go run . waves fixture.json` prints the level schedule and
`go run . critical fixture.json` prints the critical path + total; cyclic or malformed
input exits non-zero.
