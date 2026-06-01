import { WIDTH, HEIGHT } from './constants.js';
import { drawParticles } from './effects.js';
import { getTop } from './leaderboard.js';

export function render(ctx, state) {
  // Clear canvas with dark background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Draw asteroids
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  for (const asteroid of state.asteroids) {
    drawAsteroid(ctx, asteroid);
  }

  // Draw bullets
  ctx.fillStyle = '#fff';
  for (const bullet of state.bullets) {
    ctx.beginPath();
    ctx.arc(bullet.pos.x, bullet.pos.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw ship (triangle)
  if (state.ship) {
    drawShip(ctx, state.ship);
  }

  // Draw particles
  drawParticles(ctx, state.particles);

  // Draw HUD (score, lives, wave)
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${state.score.value}`, 20, 30);
  ctx.fillText(`Lives: ${state.lives}`, 20, 55);
  ctx.fillText(`Wave: ${state.wave}`, 20, 80);

  // Draw game over overlay if applicable
  if (state.status === 'gameover') {
    drawGameOverOverlay(ctx, state);
  }
}

function drawAsteroid(ctx, asteroid) {
  ctx.beginPath();
  ctx.arc(asteroid.pos.x, asteroid.pos.y, asteroid.radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawShip(ctx, ship) {
  const x = ship.pos.x;
  const y = ship.pos.y;
  const angle = ship.angle;
  const radius = ship.radius;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(radius, 0); // tip
  ctx.lineTo(-radius * 0.5, -radius * 0.8); // left back
  ctx.lineTo(-radius * 0.3, 0); // bottom
  ctx.lineTo(-radius * 0.5, radius * 0.8); // right back
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

function drawGameOverOverlay(ctx, state) {
  // Semi-transparent dark overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // "GAME OVER" text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 80);

  // Leaderboard
  const topScores = getTop(state.leaderboard, 10);
  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HIGH SCORES', WIDTH / 2, HEIGHT / 2 - 20);

  ctx.font = '16px monospace';
  let y = HEIGHT / 2 + 20;
  for (let i = 0; i < topScores.length; i++) {
    const entry = topScores[i];
    ctx.fillText(`${i + 1}. ${entry.name}: ${entry.score}`, WIDTH / 2, y);
    y += 25;
  }
}
