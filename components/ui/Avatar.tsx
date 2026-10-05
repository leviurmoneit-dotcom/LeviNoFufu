const hue = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 17);
export default function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const h = hue(name || '?');
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.42, background: `hsl(${h} 45% 32%)`, color: `hsl(${h} 70% 88%)` }} aria-hidden="true">
      {(name || '?').trim().slice(0, 1).toUpperCase()}
    </span>
  );
}
