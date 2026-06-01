export function createInput(target = (typeof window !== 'undefined' ? window : null)) {
  const state = {
    thrust: false,
    left: false,
    right: false,
    fire: false,
  };

  const keyMap = {
    ArrowUp: 'thrust',
    KeyW: 'thrust',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    Space: 'fire',
  };

  const onKeyDown = (e) => {
    const action = keyMap[e.code];
    if (action) {
      state[action] = true;
      e.preventDefault();
    }
  };

  const onKeyUp = (e) => {
    const action = keyMap[e.code];
    if (action) {
      state[action] = false;
      e.preventDefault();
    }
  };

  const attach = () => {
    if (target) {
      target.addEventListener('keydown', onKeyDown);
      target.addEventListener('keyup', onKeyUp);
    }
  };

  const detach = () => {
    if (target) {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
    }
  };

  return { state, attach, detach };
}
