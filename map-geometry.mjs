// Clip an infinite straight line to the visible map rectangle (pixel coordinates).
export function clipLine(a, b, width, height) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (Math.hypot(dx, dy) < 1e-9) return null;
  let low = -Infinity, high = Infinity;
  for (const [start, delta, max] of [[a.x, dx, width], [a.y, dy, height]]) {
    if (Math.abs(delta) < 1e-12) { if (start < 0 || start > max) return null; }
    else {
      const t1 = -start / delta, t2 = (max - start) / delta;
      low = Math.max(low, Math.min(t1, t2)); high = Math.min(high, Math.max(t1, t2));
    }
  }
  if (low > high) return null;
  return [low, high].map(t => ({ x: a.x + t * dx, y: a.y + t * dy }));
}
export const validLocation = p => p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 85 && Math.abs(p.lng) <= 180;
export function validDrawing(d) {
  return d && typeof d.id === 'string' && validLocation(d.origin) && (
    d.type === 'circle' ? Number.isFinite(d.radius) && d.radius >= 0 && d.radius <= 21000000 :
    d.type === 'line' && validLocation(d.target));
}
export function changeDrawings(existing, action, drawing) {
  const rows = Array.isArray(existing) ? existing.filter(validDrawing) : [];
  if (action === 'undo') return rows.slice(0, -1);
  if (!validDrawing(drawing)) throw new Error('Desenho inválido.');
  if (rows.length >= 100) throw new Error('Limite de 100 desenhos neste ponto. Remove o último para adicionar outro.');
  return [...rows, drawing];
}
