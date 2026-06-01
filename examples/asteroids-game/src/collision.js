import { sub, length } from './vector.js';

export function circleHit(a, b) {
  const delta = sub(b.pos, a.pos);
  const dist = length(delta);
  return dist < a.radius + b.radius;
}

export function bulletsVsAsteroids(bullets, asteroids) {
  const hits = [];

  for (const bullet of bullets) {
    if (!bullet.alive) continue;

    for (const asteroid of asteroids) {
      if (!asteroid.alive) continue;

      if (circleHit(bullet, asteroid)) {
        hits.push({ bullet, asteroid });
        break; // consume the bullet on first hit — one bullet can't hit two asteroids in a tick
      }
    }
  }

  return hits;
}

export function shipVsAsteroids(ship, asteroids) {
  for (const asteroid of asteroids) {
    if (!asteroid.alive) continue;

    if (circleHit(ship, asteroid)) {
      return asteroid;
    }
  }

  return null;
}
