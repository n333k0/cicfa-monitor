// Great-circle helpers for packet interpolation along attack arcs.
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

export function slerp(
  lon1: number, lat1: number, lon2: number, lat2: number, t: number,
): [number, number] {
  const φ1 = lat1 * D2R, λ1 = lon1 * D2R;
  const φ2 = lat2 * D2R, λ2 = lon2 * D2R;
  const x1 = Math.cos(φ1) * Math.cos(λ1), y1 = Math.cos(φ1) * Math.sin(λ1), z1 = Math.sin(φ1);
  const x2 = Math.cos(φ2) * Math.cos(λ2), y2 = Math.cos(φ2) * Math.sin(λ2), z2 = Math.sin(φ2);
  let dot = x1 * x2 + y1 * y2 + z1 * z2;
  dot = Math.max(-1, Math.min(1, dot));
  const Ω = Math.acos(dot);
  if (Ω < 1e-6) return [lon1, lat1];
  const sinΩ = Math.sin(Ω);
  const a = Math.sin((1 - t) * Ω) / sinΩ;
  const b = Math.sin(t * Ω) / sinΩ;
  const x = a * x1 + b * x2, y = a * y1 + b * y2, z = a * z1 + b * z2;
  const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lon = Math.atan2(y, x);
  return [lon * R2D, lat * R2D];
}

export function haversineKm(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const dφ = (lat2 - lat1) * D2R;
  const dλ = (lon2 - lon1) * D2R;
  const a = Math.sin(dφ / 2) ** 2 +
    Math.cos(lat1 * D2R) * Math.cos(lat2 * D2R) * Math.sin(dλ / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
