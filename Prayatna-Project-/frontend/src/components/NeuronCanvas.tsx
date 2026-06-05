import { useEffect, useRef } from 'react';

const NODE_COUNT = 200;
const MAX_CONN_DIST = 180;
const FOV = 380;
const DEPTH = 700;
const ROTATE_SPEED = 0.055;
const AUTO_ROTATE = 0.0003;

interface Node3D {
  x: number; y: number; z: number;   // 3D world coords
  vx: number; vy: number; vz: number; // slow drift
  baseX: number; baseY: number; baseZ: number;
}

export default function NeuronCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ nx: 0, ny: 0 }); // normalized -1..1
  const rot = useRef({ x: 0, y: 0 });     // current rotation angles
  const raf = useRef(0);
  const nodes = useRef<Node3D[]>([]);
  const autoAngle = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Spawn nodes spread across full viewport
    nodes.current = Array.from({ length: NODE_COUNT }, () => {
      const bx = (Math.random() - 0.5) * window.innerWidth  * 1.1;
      const by = (Math.random() - 0.5) * window.innerHeight * 1.1;
      const bz = (Math.random() - 0.5) * DEPTH;
      return {
        x: bx, y: by, z: bz,
        baseX: bx, baseY: by, baseZ: bz,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        vz: (Math.random() - 0.5) * 0.18,
      };
    });

    const onMove = (e: MouseEvent) => {
      mouse.current.nx = (e.clientX / window.innerWidth  - 0.5) * 2; // -1..1
      mouse.current.ny = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;

      // Auto rotate + mouse-driven target rotation
      autoAngle.current += AUTO_ROTATE;
      const targetRX = mouse.current.ny * 0.55; // pitch
      const targetRY = mouse.current.nx * 0.65 + autoAngle.current; // yaw + drift
      rot.current.x += (targetRX - rot.current.x) * ROTATE_SPEED;
      rot.current.y += (targetRY - rot.current.y) * ROTATE_SPEED;

      const rx = rot.current.x, ry = rot.current.y;
      const cosX = Math.cos(rx), sinX = Math.sin(rx);
      const cosY = Math.cos(ry), sinY = Math.sin(ry);

      // Slow drift for each node
      for (const n of nodes.current) {
        n.x += n.vx; n.y += n.vy; n.z += n.vz;
        // Soft spring back to base
        n.vx += (n.baseX - n.x) * 0.0005;
        n.vy += (n.baseY - n.y) * 0.0005;
        n.vz += (n.baseZ - n.z) * 0.0005;
        n.vx *= 0.99; n.vy *= 0.99; n.vz *= 0.99;
      }

      // Project 3D → 2D with Y-then-X rotation
      const projected = nodes.current.map(n => {
        // Rotate Y (yaw)
        const x1 =  n.x * cosY + n.z * sinY;
        const z1 = -n.x * sinY + n.z * cosY;
        // Rotate X (pitch)
        const y2 =  n.y * cosX - z1 * sinX;
        const z2 =  n.y * sinX + z1 * cosX;
        // Perspective divide
        const scale = FOV / (FOV + z2 + DEPTH * 0.5);
        return {
          sx: cx + x1 * scale,
          sy: cy + y2 * scale,
          scale,
          z2,
          r: Math.max(1, 3.5 * scale),
          alpha: Math.min(1, Math.max(0.15, scale * 1.2)),
        };
      });

      // Sort back-to-front so near nodes draw on top
      const order = projected.map((_, i) => i).sort((a, b) => projected[a].z2 - projected[b].z2);

      // Draw connections
      for (let ii = 0; ii < order.length; ii++) {
        const i = order[ii];
        const pi = projected[i];
        for (let jj = ii + 1; jj < order.length; jj++) {
          const j = order[jj];
          const pj = projected[j];
          // Use screen distance for performance
          const dx = pi.sx - pj.sx, dy = pi.sy - pj.sy;
          const screenDist = Math.sqrt(dx * dx + dy * dy);
          if (screenDist > MAX_CONN_DIST) continue;
          const a = (1 - screenDist / MAX_CONN_DIST) * Math.min(pi.alpha, pj.alpha) * 0.55;
          if (a < 0.01) continue;
          ctx.beginPath();
          ctx.moveTo(pi.sx, pi.sy);
          ctx.lineTo(pj.sx, pj.sy);
          ctx.strokeStyle = `rgba(45,212,191,${a})`;
          ctx.lineWidth = Math.min(pi.scale, pj.scale) * 1.2;
          ctx.stroke();
        }
      }

      // Draw nodes
      for (const i of order) {
        const p = projected[i];
        // Glow
        const g = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, p.r * 5);
        g.addColorStop(0, `rgba(45,212,191,${p.alpha * 0.35})`);
        g.addColorStop(1, 'rgba(45,212,191,0)');
        ctx.beginPath(); ctx.arc(p.sx, p.sy, p.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        // Core
        ctx.beginPath(); ctx.arc(p.sx, p.sy, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(45,212,191,${p.alpha * 0.9})`;
        ctx.fill();
      }

      raf.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 0 }}
    />
  );
}
