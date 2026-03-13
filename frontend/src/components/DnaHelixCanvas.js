'use client';

import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 120;
const RUNG_DOT_COUNT = 40; // more dots per rung so they read as a solid line
const HELIX_CYAN = '#22d3ee';
const HELIX_BLUE = '#1e40af';
const RUNG_COLOR = 'rgba(34, 211, 238, 0.85)'; // visible cyan for rung dots

export default function DnaHelixCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let animationFrame = 0;

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = canvas.width = parent.clientWidth;
      height = canvas.height = parent.clientHeight;
    }

    function animate() {
      const time = Date.now() * 0.001;
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height)
      );
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#020617');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const radius = Math.min(width, height) * 0.22;
      const speed = 0.5;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const y = (i / PARTICLE_COUNT) * height;
        const angle = y * 0.005 + time * speed;

        // Helix 1
        drawPoint(
          ctx,
          centerX + Math.cos(angle) * radius,
          y,
          angle,
          HELIX_CYAN
        );
        // Helix 2 (180° offset)
        drawPoint(
          ctx,
          centerX + Math.cos(angle + Math.PI) * radius,
          y,
          angle + Math.PI,
          HELIX_BLUE
        );

        // Rungs: draw as dots (same style as strands) instead of thin lines
        if (i % 6 === 0) {
          const x1 = centerX + Math.cos(angle) * radius;
          const x2 = centerX + Math.cos(angle + Math.PI) * radius;
          drawRungDots(ctx, x1, x2, y, time, angle);
        }
      }

      animationFrame = requestAnimationFrame(animate);
    }

    function drawPoint(ctx, x, y, angle, color) {
      const z = Math.sin(angle);
      const size = 2 + (z + 1) * 2;
      const alpha = 0.2 + (z + 1) * 0.4;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      if (z > 0.5) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    }

    /** Draw rung as a row of dots (same dot style as helix strands) */
    function drawRungDots(ctx, x1, x2, y, time, angle) {
      for (let d = 0; d < RUNG_DOT_COUNT; d++) {
        const t = (d + 1) / (RUNG_DOT_COUNT + 1);
        const x = x1 + (x2 - x1) * t;
        // Slight pulse and size variation so dots feel animated like the sides
        const pulse = 0.7 + 0.3 * Math.sin(time * 2 + angle + d * 0.5);
        const size = 1.5 + pulse * 1.8;
        const alpha = 0.5 + pulse * 0.45;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = RUNG_COLOR;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = HELIX_CYAN;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    resize();
    animate();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(animationFrame);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block', pointerEvents: 'none' }}
      aria-hidden
    />
  );
}
