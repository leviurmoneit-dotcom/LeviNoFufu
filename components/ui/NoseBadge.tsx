/** Ehrentitel der Gruppe: kleiner Nasen-Orden neben dem Namen. */
export default function NoseBadge({ compact = false }: { compact?: boolean }) {
  return <span className={`nose-badge${compact ? ' compact' : ''}`} title="Nasenmeister"><span aria-hidden="true">👃</span>{compact ? <span className="sr-only">Nasenmeister</span> : 'Nasenmeister'}</span>;
}
