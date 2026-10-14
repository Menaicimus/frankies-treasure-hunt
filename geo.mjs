const rad = d => d * Math.PI / 180;
export function distance(a, b) {
  const h = Math.sin(rad(b.lat-a.lat)/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(b.lng-a.lng)/2)**2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}
export function bearing(a, b) {
  return (Math.atan2(Math.sin(rad(b.lng-a.lng))*Math.cos(rad(b.lat)), Math.cos(rad(a.lat))*Math.sin(rad(b.lat))-Math.sin(rad(a.lat))*Math.cos(rad(b.lat))*Math.cos(rad(b.lng-a.lng))) * 180/Math.PI + 360) % 360;
}
export const distanceHue = meters => 120 * (1 - Math.min(1, Math.max(0, (meters - 10) / 190)));
export const arrowAngle = (target, heading) => (target - heading + 360) % 360;
