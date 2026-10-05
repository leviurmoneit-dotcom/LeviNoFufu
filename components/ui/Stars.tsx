/** Fünf Sterne, anteilig gefüllt. */
export default function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const row = (
    <svg width={size * 5 + 8} height={size} viewBox="0 0 108 20" aria-hidden="true">
      {[0, 1, 2, 3, 4].map(i => <path key={i} transform={`translate(${i * 22} 0)`} d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8z" />)}
    </svg>
  );
  return (
    <span className="stars" role="img" aria-label={`${value.toFixed(1).replace('.', ',')} von 5 Sternen`}>
      <span className="stars-base">{row}</span>
      <span className="stars-fill" style={{ width: `${pct}%` }}>{row}</span>
    </span>
  );
}
