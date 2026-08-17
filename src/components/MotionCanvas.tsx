import React, { useEffect, useRef } from 'react';

interface GridPoint {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

export const MotionCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking & physics state
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      prevX: width / 2,
      prevY: height / 2,
      vx: 0,
      vy: 0,
      speed: 0,
      active: false,
      lastMoved: Date.now(),
    };

    // Fabric Grid Setup
    const spacing = 48; // Grid node spacing in pixels
    let cols = Math.ceil(width / spacing) + 1;
    let rows = Math.ceil(height / spacing) + 1;
    let grid: GridPoint[][] = [];

    const initGrid = () => {
      cols = Math.ceil(width / spacing) + 1;
      rows = Math.ceil(height / spacing) + 1;
      grid = [];

      for (let r = 0; r < rows; r++) {
        const row: GridPoint[] = [];
        for (let c = 0; c < cols; c++) {
          const bx = c * spacing;
          const by = r * spacing;
          row.push({
            baseX: bx,
            baseY: by,
            x: bx,
            y: by,
            vx: 0,
            vy: 0,
          });
        }
        grid.push(row);
      }
    };

    initGrid();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initGrid();
    };

    window.addEventListener('resize', handleResize);

    const onMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
      mouse.lastMoved = Date.now();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.active = true;
        mouse.lastMoved = Date.now();
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove);

    // Mouse Follower Trail & Shimmer Sparkles
    const trail: TrailPoint[] = [];
    const maxTrail = 18;
    const sparkles: Sparkle[] = [];
    const sparkleColors = [
      'rgba(245, 158, 11, 0.9)', // Amber
      'rgba(251, 191, 36, 0.9)', // Gold
      'rgba(217, 119, 6, 0.85)',  // Warm Ochre
      'rgba(255, 255, 255, 0.95)', // Brilliant silk white
    ];

    let time = 0;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Mouse Lerp and Velocity computation
      const dx = mouse.targetX - mouse.x;
      const dy = mouse.targetY - mouse.y;
      mouse.vx = dx * 0.18;
      mouse.vy = dy * 0.18;
      mouse.x += mouse.vx;
      mouse.y += mouse.vy;
      mouse.speed = Math.hypot(mouse.vx, mouse.vy);

      // Auto-gentle ambient breathing if idle
      const isIdle = Date.now() - mouse.lastMoved > 3000;
      const waveOffset = Math.sin(time * 1.5) * 6;

      // Add point to silk ribbon trail
      if (mouse.speed > 0.4 || !isIdle) {
        trail.unshift({ x: mouse.x, y: mouse.y, age: 0 });
        if (trail.length > maxTrail) trail.pop();

        // Emit gold micro-sparks on movement
        if (Math.random() < Math.min(0.8, mouse.speed * 0.08 + 0.15)) {
          sparkles.push({
            x: mouse.x + (Math.random() - 0.5) * 16,
            y: mouse.y + (Math.random() - 0.5) * 16,
            vx: (Math.random() - 0.5) * 2 - mouse.vx * 0.15,
            vy: (Math.random() - 0.5) * 2 - mouse.vy * 0.15 - 0.5,
            size: 1 + Math.random() * 2.2,
            alpha: 1.0,
            life: 0,
            maxLife: 35 + Math.random() * 25,
            color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
          });
        }
      }

      // --- 1. UPDATE FABRIC GRID WITH SPRING & MOUSE DISTURBANCE ---
      const influenceRadius = 160;
      const influenceRadiusSq = influenceRadius * influenceRadius;
      const spring = 0.06;
      const friction = 0.86;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pt = grid[r][c];

          // Distance to mouse
          const mdx = pt.x - mouse.x;
          const mdy = pt.y - mouse.y;
          const distSq = mdx * mdx + mdy * mdy;

          if (distSq < influenceRadiusSq && distSq > 0.1) {
            const dist = Math.sqrt(distSq);
            // Elastic push/pull & tangential swirl from mouse motion
            const force = (1 - dist / influenceRadius);
            const pushFactor = force * (12 + mouse.speed * 0.8);

            pt.vx += (mdx / dist) * pushFactor * 0.12;
            pt.vy += (mdy / dist) * pushFactor * 0.12;

            // Swirl turbulence based on mouse velocity
            pt.vx += -mouse.vy * force * 0.04;
            pt.vy += mouse.vx * force * 0.04;
          }

          // Gentle ambient fabric ripple
          const idleWave = Math.sin(time * 1.8 + c * 0.35 + r * 0.45) * 1.2;

          // Spring towards base resting position
          const homeX = pt.baseX + (isIdle ? Math.cos(time + r * 0.2) * 2 : 0);
          const homeY = pt.baseY + (isIdle ? idleWave : 0);

          const ax = (homeX - pt.x) * spring;
          const ay = (homeY - pt.y) * spring;

          pt.vx = (pt.vx + ax) * friction;
          pt.vy = (pt.vy + ay) * friction;

          pt.x += pt.vx;
          pt.y += pt.vy;
        }
      }

      // --- 2. DRAW WEFT & WARP THREAD LINES ---
      // Weft (Horizontal Lines)
      ctx.lineWidth = 0.85;
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.18)'; // Gold amber thread
        for (let c = 0; c < cols; c++) {
          const pt = grid[r][c];
          if (c === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            const prev = grid[r][c - 1];
            const mx = (prev.x + pt.x) / 2;
            const my = (prev.y + pt.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
          }
        }
        ctx.stroke();
      }

      // Warp (Vertical Lines)
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.14)';
        for (let r = 0; r < rows; r++) {
          const pt = grid[r][c];
          if (r === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            const prev = grid[r - 1][c];
            const mx = (prev.x + pt.x) / 2;
            const my = (prev.y + pt.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
          }
        }
        ctx.stroke();
      }

      // Intersecting Weave Knots / Micro-Gold Stitch Pins near active disturbance
      for (let r = 0; r < rows; r += 2) {
        for (let c = 0; c < cols; c += 2) {
          const pt = grid[r][c];
          const distToMouse = Math.hypot(pt.x - mouse.x, pt.y - mouse.y);
          if (distToMouse < 220) {
            const glow = (1 - distToMouse / 220);
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.2 + glow * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(251, 191, 36, ${0.15 + glow * 0.6})`;
            ctx.fill();
          }
        }
      }

      // --- 3. DRAW SILK THREAD RIBBON TRAIL FOLLOWING MOUSE ---
      if (trail.length > 2) {
        // Draw glowing ribbon
        ctx.beginPath();
        for (let i = 0; i < trail.length - 1; i++) {
          const p1 = trail[i];
          const p2 = trail[i + 1];
          p1.age++;
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          ctx.strokeStyle = `rgba(251, 191, 36, ${Math.max(0, 0.6 - (i / trail.length) * 0.6)})`;
          ctx.lineWidth = Math.max(0.5, (1 - i / trail.length) * 2.8);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
          ctx.stroke();
        }
      }

      // --- 4. DRAW SHIMMERING PARTICLES / FABRIC FIBERS ---
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.life++;
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.94;
        s.vy *= 0.94;
        s.alpha = Math.max(0, 1 - s.life / s.maxLife);

        if (s.alpha <= 0) {
          sparkles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.fillStyle = s.color.replace(/[\d.]+\)$/, `${s.alpha})`);
        ctx.arc(s.x, s.y, s.size * (1 + s.life / s.maxLife * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }

      // --- 5. DRAW GOLDEN NEEDLE & POINTER SHUTTLE AT CURSOR ---
      if (mouse.active || !isIdle) {
        // Ambient soft golden aura
        const auraGradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 45);
        auraGradient.addColorStop(0, 'rgba(251, 191, 36, 0.25)');
        auraGradient.addColorStop(0.5, 'rgba(217, 119, 6, 0.08)');
        auraGradient.addColorStop(1, 'rgba(217, 119, 6, 0)');

        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 45, 0, Math.PI * 2);
        ctx.fill();

        // Sleek Tailor Needle Eyelet
        const needleAngle = Math.atan2(mouse.vy, mouse.vx) || -Math.PI / 4;
        const needleLength = 16;

        ctx.save();
        ctx.translate(mouse.x, mouse.y);
        ctx.rotate(needleAngle);

        // Needle body
        ctx.beginPath();
        ctx.strokeStyle = '#FDE68A'; // Luminous gold
        ctx.lineWidth = 1.6;
        ctx.moveTo(-needleLength * 0.6, 0);
        ctx.lineTo(needleLength * 0.6, 0);
        ctx.stroke();

        // Needle Eyelet (golden ring)
        ctx.beginPath();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.2;
        ctx.arc(-needleLength * 0.5, 0, 2, 0, Math.PI * 2);
        ctx.stroke();

        // Golden tip point
        ctx.beginPath();
        ctx.fillStyle = '#FFFFFF';
        ctx.arc(needleLength * 0.6, 0, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="ambient-fabric-motion-canvas"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-60 dark:opacity-45 transition-opacity"
    />
  );
};
