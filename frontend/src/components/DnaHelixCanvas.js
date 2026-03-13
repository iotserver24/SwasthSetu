'use client';

import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 120;
const HELIX_CYAN = '#22d3ee';
const HELIX_BLUE = '#1e40af';

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

        if (i % 6 === 0) {
          ctx.beginPath();
          ctx.moveTo(centerX + Math.cos(angle) * radius, y);
          ctx.lineTo(centerX + Math.cos(angle + Math.PI) * radius, y);
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.12)';
          ctx.stroke();
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
