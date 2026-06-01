import { WIDTH, HEIGHT, BOUNDS } from './constants.js';
import { createShip, createAsteroid, createBullet, updateShip, updateAsteroid, updateBullet, splitAsteroid } from './entities.js';
import { bulletsVsAsteroids, shipVsAsteroids } from './collision.js';
import { createScore, addPoints } from './scoring.js';
import { createLeaderboard, addScore } from './leaderboard.js';
import { createParticles, emitExplosion, updateParticles } from './effects.js';

function createWaveAsteroids(wave) {
  const asteroids = [];
  const count = 3 + wave;

  for (let i = 0; i < count; i++) {
    // Spread asteroids around the edges, away from center
    const angle = (Math.PI * 2 * i) / count;
    const distance = Math.min(WIDTH, HEIGHT) / 3;
    const x = WIDTH / 2 + Math.cos(angle) * distance;
    const y = HEIGHT / 2 + Math.sin(angle) * distance;

    asteroids.push(createAsteroid(x, y, 'large'));
  }

  return asteroids;
}

export function createGame(opts = {}) {
  return {
    ship: createShip(),
    asteroids: createWaveAsteroids(1),
    bullets: [],
    particles: createParticles(),
    score: createScore(),
    lives: 3,
    wave: 1,
    status: 'playing',
    leaderboard: createLeaderboard(opts.storage),
  };
}

export function fire(state) {
  if (state.ship && state.status === 'playing') {
    const bullet = createBullet(state.ship.pos, state.ship.angle);
    state.bullets.push(bullet);
  }
}

export function update(state, input, dt) {
  // Update ship
  if (state.ship && state.status === 'playing') {
    updateShip(state.ship, input, dt);
  }

  // Update asteroids
  for (const asteroid of state.asteroids) {
    if (asteroid.alive) {
      updateAsteroid(asteroid, dt);
    }
  }

  // Update bullets
  for (const bullet of state.bullets) {
    if (bullet.alive) {
      updateBullet(bullet, dt);
    }
  }

  // Update particles
  updateParticles(state.particles, dt);

  // Collision: bullets vs asteroids
  const bulletHits = bulletsVsAsteroids(state.bullets, state.asteroids);
  for (const { bullet, asteroid } of bulletHits) {
    bullet.alive = false;           // consume the bullet regardless
    if (!asteroid.alive) continue;  // already destroyed this tick — no double score/explosion/split

    const asteroidSize = asteroid.radius === 46 ? 'large' : asteroid.radius === 24 ? 'medium' : 'small';
    addPoints(state.score, asteroidSize);

    emitExplosion(state.particles, asteroid.pos);

    asteroid.alive = false;
    const fragments = splitAsteroid(asteroid);
    state.asteroids.push(...fragments);
  }

  // Collision: ship vs asteroids
  if (state.ship && state.status === 'playing') {
    const hitAsteroid = shipVsAsteroids(state.ship, state.asteroids);
    if (hitAsteroid) {
      emitExplosion(state.particles, state.ship.pos);
      state.lives -= 1;

      if (state.lives <= 0) {
        state.status = 'gameover';
        state.ship = null;
      } else {
        state.ship = createShip();
      }
    }
  }

  // Cull dead entities
  state.bullets = state.bullets.filter((b) => b.alive);
  state.asteroids = state.asteroids.filter((a) => a.alive);

  // Check for wave completion
  if (state.asteroids.length === 0 && state.status === 'playing') {
    state.wave += 1;
    state.asteroids = createWaveAsteroids(state.wave);
  }
}
