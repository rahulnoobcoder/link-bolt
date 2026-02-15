import { useEffect, useRef } from 'react';

// Subtle animated dots — feels like encrypted network nodes
// Pure canvas, no libraries, ~60fps, does not block interactions

const COLORS = [
  { r: 99, g: 102, b: 241 },   // indigo
  { r: 59, g: 130, b: 246 },   // blue
  { r: 20, g: 184, b: 166 },   // teal
  { r: 139, g: 92, b: 246 },   // purple
];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function createDot(w, h) {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return {
    x: rand(0, w),
    y: rand(0, h),
    r: rand(1.2, 2.8),
    opacity: 0,
    maxOpacity: rand(0.12, 0.32),
    fadeSpeed: rand(0.002, 0.006),
    phase: rand(0, Math.PI * 2),
    driftX: rand(-0.08, 0.08),
    driftY: rand(-0.06, 0.06),
    color,
    alive: true,
    fadingIn: true,
  };
}

export default function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w, h, dots, animId;
    const DOT_DENSITY = 0.00006; // dots per px²

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = document.documentElement.scrollHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      resize();
      const count = Math.floor(w * h * DOT_DENSITY);
      dots = Array.from({ length: count }, () => createDot(w, h));
    }

    let time = 0;
    function frame() {
      time += 0.016;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];

        // Fade lifecycle
        if (d.fadingIn) {
          d.opacity += d.fadeSpeed;
          if (d.opacity >= d.maxOpacity) {
            d.opacity = d.maxOpacity;
            d.fadingIn = false;
          }
        }

        // Breathing
        const breath = Math.sin(time * 1.5 + d.phase) * 0.4 + 0.6;
        const alpha = d.opacity * breath;

        // Drift
        d.x += d.driftX;
        d.y += d.driftY;

        // Wrap
        if (d.x < -5) d.x = w + 5;
        if (d.x > w + 5) d.x = -5;
        if (d.y < -5) d.y = h + 5;
        if (d.y > h + 5) d.y = -5;

        // Draw glow
        const { r, g, b } = d.color;
        const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 5);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha * 1.2})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Draw core
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 1.5})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(frame);
    }

    init();
    frame();

    const handleResize = () => {
      resize();
      // Re-populate if page height changed significantly
      const targetCount = Math.floor(w * h * DOT_DENSITY);
      while (dots.length < targetCount) dots.push(createDot(w, h));
      if (dots.length > targetCount + 50) dots.length = targetCount;
    };

    window.addEventListener('resize', handleResize);

    // Watch for height changes (route transitions etc.)
    const observer = new MutationObserver(handleResize);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
