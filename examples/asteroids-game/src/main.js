import { createGame, update, fire } from './game.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { addScore } from './leaderboard.js';

function init() {
  // Only run this in a browser environment with a canvas
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('2D canvas context is unavailable');
    return;
  }
  const input = createInput(window);
  input.attach();

  const state = createGame({ storage: window.localStorage });

  let lastTime = performance.now();
  let lastFireState = false;
  let scoreSubmitted = false;

  function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05); // cap only extreme frame gaps (don't force 60 FPS)
    lastTime = now;

    // Fire on rising edge of fire input
    const currentFireState = input.state.fire;
    if (currentFireState && !lastFireState) {
      fire(state);
    }
    lastFireState = currentFireState;

    // Update and render
    update(state, input.state, dt);
    render(ctx, state);

    // On game over transition, add score to leaderboard exactly once
    if (state.status === 'gameover' && !scoreSubmitted) {
      scoreSubmitted = true; // dedicated flag — don't corrupt state.lives as a sentinel
      const name = prompt('Game Over! Enter your name:', 'PLAYER') || 'PLAYER';
      addScore(state.leaderboard, name, state.score.value);
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}

// Only call init if we're in a browser; run once when the DOM is ready.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
