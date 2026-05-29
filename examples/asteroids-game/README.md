# Asteroids (atelier dogfood example)

A playable browser Asteroids game built across 7 atelier units. Vanilla JS, HTML5
Canvas, ES modules, zero dependencies.

## Run it

This game uses **ES modules**, which browsers refuse to load over `file://`
(modules require an HTTP origin — opening `index.html` directly will fail with a
CORS error). Serve it over HTTP instead:

```bash
cd examples/asteroids-game
python3 -m http.server 8777      # or: npx serve -l 8777
# then open http://localhost:8777
```

Or use the helper:

```bash
./serve.sh        # serves on http://localhost:8777
```

**Controls:** Arrow keys or WASD to turn/thrust, Space to fire.

## Verify the logic

Pure-logic modules are unit-tested with Node's built-in runner:

```bash
node --test       # 66 tests
```

## Layout

- `src/` — `constants`, `vector`, `entities`, `collision`, `scoring`,
  `leaderboard`, `effects`, `input`, `render`, `game`, `main`
- `test/` — unit tests for the pure-logic modules
- `index.html`, `style.css` — the page
- `docs/atelier/asteroids/` — the atelier run that produced this (CONTRACT, briefs,
  LEDGER)
