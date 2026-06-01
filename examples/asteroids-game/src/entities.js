import { vec, add, scale, fromAngle, limit, wrap } from './vector.js';
import { WIDTH, HEIGHT, BOUNDS, SHIP, BULLET, ASTEROID } from './constants.js';

export function createShip(x = WIDTH / 2, y = HEIGHT / 2) {
  return {
    type: 'ship',
    pos: { x, y },
    vel: { x: 0, y: 0 },
    angle: -Math.PI / 2,
    radius: SHIP.radius,
    alive: true,
  };
}

export function createAsteroid(x, y, size = 'large') {
  const radius = ASTEROID[size];
  if (radius === undefined) {
    throw new Error(`Unknown asteroid size: ${size} (expected one of ${Object.keys(ASTEROID).join(', ')})`);
  }
  // Random small drift velocity
  const driftAngle = Math.random() * Math.PI * 2;
  const driftSpeed = Math.random() * 50 + 25; // 25-75 units/sec
  const vel = fromAngle(driftAngle, driftSpeed);

  return {
    type: 'asteroid',
    pos: { x, y },
    vel,
    angle: 0,
    radius,
    alive: true,
  };
}

export function createBullet(pos, angle) {
  const vel = fromAngle(angle, BULLET.speed);

  return {
    type: 'bullet',
    pos: { x: pos.x, y: pos.y },
    vel,
    angle,
    radius: BULLET.radius,
    alive: true,
    life: BULLET.life,
  };
}

export function updateShip(ship, input, dt) {
  // Turn
  if (input.left) {
    ship.angle -= SHIP.turnRate * dt;
  }
  if (input.right) {
    ship.angle += SHIP.turnRate * dt;
  }

  // Thrust
  if (input.thrust) {
    const thrustVec = fromAngle(ship.angle, SHIP.accel * dt);
    ship.vel = add(ship.vel, thrustVec);
  }

  // Apply friction, frame-rate independent (SHIP.friction is tuned for ~60 FPS)
  ship.vel = scale(ship.vel, Math.pow(SHIP.friction, dt * 60));

  // Clamp to max speed
  ship.vel = limit(ship.vel, SHIP.maxSpeed);

  // Integrate position
  ship.pos = add(ship.pos, scale(ship.vel, dt));

  // Wrap
  ship.pos = wrap(ship.pos, BOUNDS);
}

export function updateAsteroid(a, dt) {
  // Integrate position
  a.pos = add(a.pos, scale(a.vel, dt));

  // Wrap
  a.pos = wrap(a.pos, BOUNDS);
}

export function updateBullet(b, dt) {
  // Integrate position
  b.pos = add(b.pos, scale(b.vel, dt));

  // Wrap
  b.pos = wrap(b.pos, BOUNDS);

  // Decrement life
  b.life -= dt;

  // Mark as dead if life expired
  if (b.life <= 0) {
    b.alive = false;
  }
}

export function splitAsteroid(a) {
  const size = a.radius === ASTEROID.large ? 'large' : a.radius === ASTEROID.medium ? 'medium' : 'small';

  if (size === 'large') {
    // Split into 2 medium asteroids
    return [
      createAsteroid(a.pos.x, a.pos.y, 'medium'),
      createAsteroid(a.pos.x, a.pos.y, 'medium'),
    ];
  } else if (size === 'medium') {
    // Split into 2 small asteroids
    return [
      createAsteroid(a.pos.x, a.pos.y, 'small'),
      createAsteroid(a.pos.x, a.pos.y, 'small'),
    ];
  } else {
    // Small asteroids don't split
    return [];
  }
}
