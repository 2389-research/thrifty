import { add, scale, fromAngle } from './vector.js';

export function createParticles() {
  return { items: [] };
}

export function emitExplosion(ps, pos, count = 18) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 50 + Math.random() * 150;
    const vel = scale(fromAngle(angle), speed);
    const life = 0.3 + Math.random() * 0.5;
    const hue = Math.random() * 30; // warm colors (red/orange/yellow)
    const color = `hsl(${hue}, 100%, 50%)`;
    const size = 2 + Math.random() * 4;

    ps.items.push({
      pos: { x: pos.x, y: pos.y },
      vel,
      life,
      maxLife: life,
      color,
      size,
    });
  }
}

export function emitThrust(ps, pos, angle) {
  // Emit a few particles opposite to the thrust direction
  const thrustVel = scale(fromAngle(angle), 60);
  const backVel = scale(thrustVel, -1); // opposite direction

  for (let i = 0; i < 3; i++) {
    const spreadAngle = angle + Math.PI + (Math.random() - 0.5);
    const speed = 30 + Math.random() * 50;
    const vel = scale(fromAngle(spreadAngle), speed);
    const life = 0.1 + Math.random() * 0.2;
    const color = `hsl(30, 100%, 60%)`; // orange-ish
    const size = 1 + Math.random() * 2;

    ps.items.push({
      pos: { x: pos.x, y: pos.y },
      vel,
      life,
      maxLife: life,
      color,
      size,
    });
  }
}

export function updateParticles(ps, dt) {
  for (let i = ps.items.length - 1; i >= 0; i--) {
    const p = ps.items[i];
    // Integrate position
    p.pos = add(p.pos, scale(p.vel, dt));
    // Decrement life
    p.life -= dt;
    // Cull dead particles
    if (p.life <= 0) {
      ps.items.splice(i, 1);
    }
  }
}

export function drawParticles(ctx, ps) {
  for (const p of ps.items) {
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
