export const vec = (x = 0, y = 0) => ({ x, y });

export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v, s) {
  return { x: v.x * s, y: v.y * s };
}

export function length(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalize(v) {
  const len = length(v);
  if (len === 0) {
    return { x: 0, y: 0 };
  }
  return { x: v.x / len, y: v.y / len };
}

export function rotate(v, rad) {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
}

export function fromAngle(rad, mag = 1) {
  return { x: Math.cos(rad) * mag, y: Math.sin(rad) * mag };
}

export function limit(v, max) {
  const len = length(v);
  if (len <= max) {
    return { x: v.x, y: v.y };
  }
  const scale_factor = max / len;
  return { x: v.x * scale_factor, y: v.y * scale_factor };
}

export function wrap(pos, bounds) {
  let x = pos.x;
  let y = pos.y;

  if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
    return { x, y }; // invalid/zero bounds — nothing to wrap against; avoid an infinite loop
  }

  // Wrap x coordinate toroidally
  while (x < 0) {
    x += bounds.width;
  }
  while (x >= bounds.width) {
    x -= bounds.width;
  }

  // Wrap y coordinate toroidally
  while (y < 0) {
    y += bounds.height;
  }
  while (y >= bounds.height) {
    y -= bounds.height;
  }

  return { x, y };
}
