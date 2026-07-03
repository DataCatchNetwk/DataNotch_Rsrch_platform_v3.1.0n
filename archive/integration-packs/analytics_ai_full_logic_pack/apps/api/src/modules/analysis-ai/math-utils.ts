export function mean(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
export function median(xs: number[]) {
  const a = [...xs].sort((x, y) => x - y);
  if (!a.length) return 0;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}
export function variance(xs: number[]) {
  const m = mean(xs);
  return mean(xs.map((x) => (x - m) ** 2));
}
export function std(xs: number[]) {
  return Math.sqrt(variance(xs));
}
export function mode<T>(xs: T[]) {
  const counts = new Map<T, number>();
  xs.forEach((x) => counts.set(x, (counts.get(x) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}
export function pearson(x: number[], y: number[]) {
  const mx = mean(x), my = mean(y);
  const num = x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0);
  const den = Math.sqrt(x.reduce((s, xi) => s + (xi - mx) ** 2, 0) * y.reduce((s, yi) => s + (yi - my) ** 2, 0));
  return den ? num / den : 0;
}
export function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}
export function quantile(xs: number[], q: number) {
  const a = [...xs].sort((x, y) => x - y);
  if (!a.length) return 0;
  const pos = (a.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return a[base + 1] !== undefined ? a[base] + rest * (a[base + 1] - a[base]) : a[base];
}
