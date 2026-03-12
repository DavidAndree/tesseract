import { useEffect, useRef } from 'react';

export default function Tesseract() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const vertices: number[][] = [];
    for (let i = 0; i < 16; i++) {
      vertices.push([
        (i & 1) ? 1 : -1,
        (i & 2) ? 1 : -1,
        (i & 4) ? 1 : -1,
        (i & 8) ? 1 : -1,
      ]);
    }

    const edges: [number, number][] = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        let diff = 0;
        for (let k = 0; k < 4; k++) {
          if (vertices[i][k] !== vertices[j][k]) diff++;
        }
        if (diff === 1) edges.push([i, j]);
      }
    }

    let frameId: number;
    let startTime = performance.now();

    const draw = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const a1 = elapsed * 0.4;
      const a2 = elapsed * 0.28;
      const a3 = elapsed * 0.18;
      const c1 = Math.cos(a1), s1 = Math.sin(a1);
      const c2 = Math.cos(a2), s2 = Math.sin(a2);
      const c3 = Math.cos(a3), s3 = Math.sin(a3);

      const projected = vertices.map(v => {
        let [x, y, z, ww] = v;

        const nx = x * c1 - ww * s1;
        const nw = x * s1 + ww * c1;
        x = nx; ww = nw;

        const ny = y * c2 - z * s2;
        const nz = y * s2 + z * c2;
        y = ny; z = nz;

        const nx2 = x * c3 - z * s3;
        const nz2 = x * s3 + z * c3;
        x = nx2; z = nz2;

        const d4 = 3;
        const s4 = d4 / (d4 - ww);
        x *= s4; y *= s4; z *= s4;

        const d3 = 5;
        const s3d = d3 / (d3 - z);
        const px = x * s3d * w * 0.17 + w / 2;
        const py = y * s3d * h * 0.17 + h / 2;

        return { x: px, y: py, depth: ww, z };
      });

      edges.forEach(([i, j]) => {
        const p1 = projected[i];
        const p2 = projected[j];
        const avgW = (p1.depth + p2.depth) / 2;
        const alpha = 0.15 + (avgW + 1) * 0.35;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(0, 229, 255, ${Math.max(0.08, Math.min(0.9, alpha))})`;
        ctx.lineWidth = 0.8 + (avgW + 1) * 0.3;
        ctx.stroke();
      });

      projected.forEach(p => {
        const r = 1.5 + (p.depth + 1) * 1.2;
        const alpha = 0.3 + (p.depth + 1) * 0.35;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, r), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 255, ${Math.max(0.15, Math.min(1, alpha))})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, r) + 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 255, ${Math.max(0.02, alpha * 0.12)})`;
        ctx.fill();
      });

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={280}
      style={{
        imageRendering: 'auto',
        background: '#000',
        display: 'block',
        margin: '0 auto'
      }}
    />
  );
}