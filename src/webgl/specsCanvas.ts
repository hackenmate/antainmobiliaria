// Interactive 3D Topographic Valley & Parcel Relief Mesh for Realty Anta Terra
export function initSpecsCanvas(canvas: HTMLCanvasElement | null): () => void {
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  let phase = 0;
  let hoverBoost = 0;
  let rafId = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  };

  const onEnter = () => {
    hoverBoost = 0.015;
  };
  const onLeave = () => {
    hoverBoost = 0;
  };

  const parent = canvas.parentElement;
  parent?.addEventListener('pointerenter', onEnter);
  parent?.addEventListener('pointerleave', onLeave);
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const elev = (nx: number, nz: number, t: number) => {
    const ridge1 = Math.sin(nx * 2.8 + t * 0.4) * Math.cos(nz * 2.2) * 0.22;
    const ridge2 = Math.exp(-((nx - 0.35) ** 2 + (nz + 0.2) ** 2) * 3.5) * 0.55;
    const valley = -Math.exp(-((nx + 0.2) ** 2) * 4.0) * 0.14;
    return ridge1 + ridge2 + valley;
  };

  const draw = () => {
    resize();
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const isDark =
      document.documentElement.getAttribute('data-theme') !== 'light';
    const strokeMain = isDark
      ? 'rgba(242, 240, 234, 0.22)'
      : 'rgba(21, 26, 23, 0.18)';
    const strokeAccent = isDark
      ? 'rgba(197, 154, 91, 0.78)'
      : 'rgba(47, 79, 62, 0.75)';

    if (!prefersReduced) {
      phase += 0.006 + hoverBoost;
    }

    const rows = 14;
    const cols = 18;
    const cx = w * 0.56;
    const cy = h * 0.42;
    const spanX = w * 0.72;
    const spanY = h * 0.44;
    const rot = Math.sin(phase * 0.5) * 0.14;

    ctx.lineWidth = Math.max(1, w / 520);

    for (let r = 0; r < rows; r++) {
      const nz = (r / (rows - 1)) * 2 - 1;
      ctx.beginPath();
      ctx.strokeStyle = r === 5 || r === 6 ? strokeAccent : strokeMain;

      for (let c = 0; c < cols; c++) {
        const nx = (c / (cols - 1)) * 2 - 1;
        const yVal = elev(nx, nz, phase);

        const rx = nx * Math.cos(rot) - nz * Math.sin(rot);
        const rz = nx * Math.sin(rot) + nz * Math.cos(rot);

        const px = cx + rx * (spanX * 0.52) - rz * (spanX * 0.14);
        const py = cy + rz * (spanY * 0.44) - yVal * (h * 0.34);

        if (c === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    if (!prefersReduced) {
      rafId = requestAnimationFrame(draw);
    }
  };

  rafId = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(rafId);
    parent?.removeEventListener('pointerenter', onEnter);
    parent?.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('resize', resize);
  };
}
