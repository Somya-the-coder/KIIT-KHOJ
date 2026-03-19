export function initCursorEffects() {
  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-canvas';
  canvas.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 9999;
  `;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let mouse = { x: -100, y: -100 };
  let bubbles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    // Add bubble on move
    if (Math.random() > 0.5) {
      bubbles.push({
        x: e.clientX + (Math.random() - 0.5) * 20,
        y: e.clientY + (Math.random() - 0.5) * 20,
        r: Math.random() * 4 + 1,
        alpha: 0.6,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 1.5 - 0.5,
        color: Math.random() > 0.5 ? '124,58,237' : '6,182,212',
      });
    }
  });

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Glow circle at cursor
    const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 150);
    gradient.addColorStop(0, 'rgba(124, 58, 237, 0.06)');
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(mouse.x - 150, mouse.y - 150, 300, 300);

    // Draw bubbles
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.x += b.vx;
      b.y += b.vy;
      b.alpha -= 0.008;
      b.r *= 0.998;

      if (b.alpha <= 0) {
        bubbles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${b.color}, ${b.alpha})`;
      ctx.fill();

      // Glow
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${b.color}, ${b.alpha * 0.2})`;
      ctx.fill();
    }

    // Cap bubbles
    if (bubbles.length > 80) {
      bubbles.splice(0, bubbles.length - 80);
    }

    requestAnimationFrame(animate);
  }
  animate();
}
