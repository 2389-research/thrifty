# Asteroids — Project Contract

**Decomposition mode:** partition (separable modules/files; parallel where deps allow; assembled by imports + index.html)

## Objective
A playable browser Asteroids game in vanilla JS (HTML5 Canvas, ES modules, zero
dependencies, no build step). Open `index.html` to play. Built across 7 units:
math, entities, collision, scoring+leaderboard, particle effects, render+input, and
the game loop/glue. Pure-logic modules are unit-tested with Node's test runner;
DOM/canvas modules are syntax-checked + assertion-verified.

## Stack & conventions (binding)
- **ES modules.** `package.json` has `"type": "module"`. Imports use explicit
  `.js` extensions and relative paths (e.g. `import { add } from './vector.js'`).
- Source in `src/`, tests in `test/` named `*.test.js` using `node:test` +
  `node:assert/strict`. Run all tests: `node --test`.
- **No external dependencies.** Browser/Canvas APIs and Node stdlib only.
- Two-space indent; named exports (no default exports); pure functions return new
  objects and do not mutate inputs UNLESS a function is explicitly an in-place
  `updateX` mutator (those are noted per unit).
- DOM/canvas code must not run at import time (no top-level `document`/`window`
  access) so syntax can be checked and logic imported in Node where applicable.

## World constants (pinned — every unit uses these)
```js
// src/constants.js  — owned by UNIT-001, imported widely
export const WIDTH = 800;
export const HEIGHT = 600;            // canvas size; origin top-left, x right, y down
export const BOUNDS = { width: WIDTH, height: HEIGHT };
export const SHIP = { accel: 250, friction: 0.7, turnRate: 4.0, maxSpeed: 350, radius: 14 };
export const BULLET = { speed: 500, life: 1.2, radius: 2 };       // life in seconds
export const ASTEROID = { large: 46, medium: 24, small: 12 };     // radius by size
export const ASTEROID_SCORES = { large: 20, medium: 50, small: 100 };
```
Coordinates are toroidal: an object leaving one edge reappears on the opposite edge.
Time `dt` is in **seconds** everywhere.

## Interfaces (cross-unit seams — pin exactly)

### Vector — `src/vector.js` (UNIT-001). Operates on plain `{x, y}`; pure.
```js
export const vec = (x = 0, y = 0) => ({ x, y });
export function add(a, b);            // -> {x,y}
export function sub(a, b);            // -> {x,y}
export function scale(v, s);          // -> {x,y}
export function length(v);            // -> number
export function normalize(v);         // -> unit {x,y} (zero vector -> {x:0,y:0})
export function rotate(v, rad);       // -> {x,y} rotated by rad
export function fromAngle(rad, mag = 1); // -> {x,y}
export function limit(v, max);        // -> {x,y} clamped to magnitude max
export function wrap(pos, bounds);    // -> {x,y} toroidally wrapped into bounds
```

### Entities — `src/entities.js` (UNIT-002). Depends on vector + constants.
Every entity is a plain object: `{ type, pos:{x,y}, vel:{x,y}, angle, radius, alive }`
(`type` ∈ `'ship'|'asteroid'|'bullet'`; `angle` in radians; `alive` boolean).
```js
export function createShip(x = WIDTH/2, y = HEIGHT/2); // angle=-PI/2 (up), vel 0
export function createAsteroid(x, y, size = 'large');  // size sets radius (ASTEROID); random drift vel
export function createBullet(pos, angle);              // vel = fromAngle(angle, BULLET.speed); life=BULLET.life
export function updateShip(ship, input, dt);   // IN-PLACE: turn (input.left/right), thrust (input.thrust) w/ accel+friction+maxSpeed, integrate, wrap
export function updateAsteroid(a, dt);         // IN-PLACE: integrate + wrap
export function updateBullet(b, dt);           // IN-PLACE: integrate + wrap; decrement b.life; set alive=false when life<=0
export function splitAsteroid(a);              // -> array: large->2 medium, medium->2 small, small->[]
```
`input` is the shape from UNIT-006: `{ thrust, left, right, fire }` (booleans).

### Collision — `src/collision.js` (UNIT-003). Depends on vector.
```js
export function circleHit(a, b);   // -> boolean: dist(a.pos,b.pos) < a.radius+b.radius
// Returns hit pairs; does not mutate. Each hit: { bullet, asteroid }.
export function bulletsVsAsteroids(bullets, asteroids); // -> [{bullet, asteroid}]
export function shipVsAsteroids(ship, asteroids);       // -> asteroid that hit, or null
```

### Scoring + Leaderboard — `src/scoring.js`, `src/leaderboard.js` (UNIT-004). Pure; storage injectable.
```js
// scoring.js
export function createScore();              // -> { value: 0, multiplier: 1 }
export function scoreForSize(size);         // -> ASTEROID_SCORES[size]
export function addPoints(score, size);     // IN-PLACE: score.value += scoreForSize(size)*score.multiplier
// leaderboard.js  — storage has getItem(key)/setItem(key,val); defaults to in-memory
export const LB_KEY = 'asteroids.highscores';
export function createLeaderboard(storage); // storage optional; default in-memory map
export function addScore(lb, name, score);  // insert {name, score}, persist
export function getTop(lb, n = 10);          // -> entries sorted by score desc, length<=n
```

### Effects — `src/effects.js` (UNIT-005). Logic pure/testable; draw is canvas.
Particle: `{ pos:{x,y}, vel:{x,y}, life, maxLife, color, size }`.
```js
export function createParticles();                 // -> { items: [] }
export function emitExplosion(ps, pos, count = 18); // push burst of particles (radial)
export function emitThrust(ps, pos, angle);         // push a few thruster particles
export function updateParticles(ps, dt);            // IN-PLACE: integrate, life-=dt, cull life<=0
export function drawParticles(ctx, ps);             // canvas draw (fade alpha by life/maxLife)
```

### Input — `src/input.js` (UNIT-006). Browser; no work at import time.
```js
export function createInput(target = (typeof window!=='undefined'?window:null));
// -> { state:{thrust,left,right,fire}, attach(), detach() }
// Arrow keys + WASD: Up/W=thrust, Left/A=left, Right/D=right, Space=fire.
```

### Render — `src/render.js` (UNIT-006). Browser canvas.
```js
export function render(ctx, state); // clears + draws asteroids, bullets, ship (triangle),
// particles (via drawParticles), HUD (score, lives, wave). On state.status==='gameover',
// draws a leaderboard overlay (top entries from state.leaderboard via getTop).
```

### Game state shape (THE central seam — render + game must agree)
```js
// produced by src/game.js (UNIT-007); consumed by render.js (UNIT-006)
state = {
  ship,                 // entity or null (null briefly after death)
  asteroids: [],        // entity[]
  bullets: [],          // entity[]
  particles,            // from createParticles()
  score,                // from createScore()
  lives: 3,
  wave: 1,
  status: 'playing',    // 'playing' | 'gameover'
  leaderboard,          // from createLeaderboard()
}
```

### Game + glue — `src/game.js`, `src/main.js`, `index.html`, `style.css` (UNIT-007)
```js
// game.js
export function createGame(opts = {}); // -> state above; spawns wave 1
export function update(state, input, dt); // advance: update entities, collisions ->
//   split asteroids + emitExplosion + addPoints; bullet/asteroid cull; ship hit -> lose life,
//   emit explosion, respawn or status='gameover'; next wave when asteroids empty (wave++, more rocks)
export function fire(state);            // spawn a bullet from the ship if alive
```
`main.js`: gets canvas 2d context, `createInput().attach()`, runs a
`requestAnimationFrame` loop computing `dt` and calling `update` then `render`; wires
`fire` to the fire input edge; on game over, reads a name (prompt or default) and
calls `addScore`. `index.html` loads `src/main.js` as `<script type="module">` and
holds `<canvas id="game" width=800 height=600>`. `style.css` = minimal dark theme.

## Ownership map
- UNIT-001 → `src/constants.js`, `src/vector.js`, `test/vector.test.js`
- UNIT-002 → `src/entities.js`, `test/entities.test.js`
- UNIT-003 → `src/collision.js`, `test/collision.test.js`
- UNIT-004 → `src/scoring.js`, `src/leaderboard.js`, `test/scoring.test.js`
- UNIT-005 → `src/effects.js`, `test/effects.test.js`
- UNIT-006 → `src/input.js`, `src/render.js`
- UNIT-007 → `src/game.js`, `src/main.js`, `index.html`, `style.css`, `test/game.test.js`

## Dependency graph
```text
UNIT-001  UNIT-004            (independent — wave 1)
   │  \      │
   │   \     │
UNIT-002 UNIT-005             (need 001 — wave 2)
   │   \    │
UNIT-003  UNIT-006            (003 needs 001,002; 006 needs 002,004,005 — wave 3)
        \   │   /
        UNIT-007              (needs all — wave 4)
```

## Fix-loop overrides
None. Defaults apply (surgical ≤2, redo ≤1, replan ≤1).
