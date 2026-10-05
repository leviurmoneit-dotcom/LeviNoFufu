'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowUpRight, Camera, Check, ChevronRight, Copy, Images, MapPin, Map, PartyPopper, Star, Trophy, Users, Wifi, WifiOff, X } from 'lucide-react';
import RatingSheet from '../components/RatingSheet';
import StandSheet from '../components/StandSheet';
import Avatar from '../components/ui/Avatar';
import CountUp from '../components/ui/CountUp';
import ShinyText from '../components/ui/ShinyText';
import SpotlightCard from '../components/ui/SpotlightCard';
import Stars from '../components/ui/Stars';
import { formatScore, stands, stopNumber, type Rating, type Stand } from '../lib/data';
import type { RouteRequest } from '../components/TourMap';
import { average, createStore, inviteLink, liveConfigured, loadGroupCode, loadProfile, newGroupCode, normalizeCode, reviewId, saveGroupCode, saveProfile, type Profile, type Review, type ReviewStore } from '../lib/reviews';

const TourMap = dynamic(() => import('../components/TourMap'), { ssr: false, loading: () => <div className="map-skeleton">Karte wird geladen …</div> });
const WinterCup = dynamic(() => import('../components/WinterCup'), { ssr: false });
const BackgroundScene = dynamic(() => import('../components/BackgroundScene'), { ssr: false });

type View = 'tour' | 'ranking' | 'photos' | 'group';
const nav: { id: View; label: string; icon: typeof Map }[] = [
  { id: 'tour', label: 'Tour', icon: Map },
  { id: 'ranking', label: 'Ranking', icon: Trophy },
  { id: 'photos', label: 'Fotos', icon: Images },
  { id: 'group', label: 'Gruppe', icon: Users },
];
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const standById = (id: string) => stands.find(s => s.id === id)!;
const CURRENT_KEY = 'glueh26-current';
function loadCurrent() { try { const id = localStorage.getItem(CURRENT_KEY) || ''; return stands.some(s => s.id === id) ? id : ''; } catch { return ''; } }
function saveCurrent(id: string) { try { localStorage.setItem(CURRENT_KEY, id); } catch {} }

export default function Home() {
  const [view, setView] = useState<View>('tour');
  const [profile, setProfile] = useState<Profile>({ id: '', name: '' });
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const [store, setStore] = useState<ReviewStore | null>(null);
  const [group, setGroup] = useState('');
  const [gate, setGate] = useState(false);
  const [codeDraft, setCodeDraft] = useState('');
  const unsubscribeRef = useRef<() => void>(() => {});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(stands[0].id);
  const [current, setCurrent] = useState('');
  const [route, setRoute] = useState<RouteRequest | null>(null);
  const [firstName, setFirstName] = useState(false);
  const [openStand, setOpenStand] = useState<Stand | null>(null);
  const [rateStand, setRateStand] = useState<Stand | null>(null);
  const [askName, setAskName] = useState<null | (() => void)>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const photoDialog = useRef<HTMLDialogElement>(null), nameDialog = useRef<HTMLDialogElement>(null);

  const notify = (message: string) => { setToast(message); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 3200); };

  const refresh = useCallback(async (s: ReviewStore) => {
    try { setReviews(await s.list()); setLoadError(''); }
    catch { setLoadError('Bewertungen konnten gerade nicht geladen werden. Prüfe deine Verbindung.'); }
  }, []);

  const connect = useCallback(async (code: string) => {
    unsubscribeRef.current();
    const s = await createStore(() => profileRef.current, code);
    setStore(s);
    await refresh(s);
    const offChange = s.subscribe(() => refresh(s));
    const offHere = s.onHere((id, by) => {
      if (!stands.some(x => x.id === id)) return;
      setCurrent(id); saveCurrent(id); setSelected(id);
      notify(`${by || 'Jemand'}: Wir sind jetzt bei ${standById(id).name}.`);
    });
    unsubscribeRef.current = () => { offChange(); offHere(); };
  }, [refresh]);

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      setProfile(p); profileRef.current = p;
      if (!p.name.trim()) { setFirstName(true); setNameDraft(''); setAskName(() => () => {}); }
      const c = loadCurrent();
      if (c) { setCurrent(c); setSelected(c); }
      const code = loadGroupCode();
      setGroup(code);
      if (liveConfigured() && !code) { setGate(true); return; }
      await connect(code);
    })();
    return () => { unsubscribeRef.current(); clearTimeout(toastTimer.current); };
  }, [connect]);

  async function joinGroup(code: string) {
    const c = normalizeCode(code);
    if (c.length < 6) return;
    saveGroupCode(c); setGroup(c); setGate(false);
    await connect(c);
  }

  async function foundGroup() {
    const code = newGroupCode();
    shareInvite(code); // vor dem ersten await, damit das Teilen-Menü als Nutzeraktion zählt
    await joinGroup(code);
  }

  useEffect(() => { if (lightbox) photoDialog.current?.showModal(); else photoDialog.current?.close(); }, [lightbox]);
  useEffect(() => { if (askName) nameDialog.current?.showModal(); else nameDialog.current?.close(); }, [askName]);

  const byStand = useMemo(() => {
    const m: Record<string, Review[]> = {};
    for (const s of stands) m[s.id] = [];
    for (const r of reviews) (m[r.standId] ||= []).push(r);
    return m;
  }, [reviews]);
  const standAvg = (id: string) => average(byStand[id].map(r => average(r.values)));
  const people = useMemo(() => {
    const m: Record<string, { name: string; count: number; sum: number }> = {};
    for (const r of reviews) { const e = (m[r.authorId] ||= { name: r.author, count: 0, sum: 0 }); e.count++; e.sum += average(r.values); }
    return Object.entries(m).map(([id, e]) => ({ id, ...e, avg: e.sum / e.count })).sort((a, b) => b.count - a.count);
  }, [reviews]);
  const ownRated = useMemo(() => new Set(reviews.filter(r => r.authorId === profile.id).map(r => r.standId)), [reviews, profile.id]);
  const ranked = useMemo(() => stands.filter(s => byStand[s.id].length).sort((a, b) => standAvg(b.id) - standAvg(a.id) || byStand[b.id].length - byStand[a.id].length), [byStand]); // eslint-disable-line react-hooks/exhaustive-deps
  const photos = useMemo(() => reviews.flatMap(r => r.photos.map(p => ({ ...p, author: r.author, stand: stands.find(s => s.id === r.standId) }))).filter(p => p.stand), [reviews]);
  const now = current || stands.find(s => !ownRated.has(s.id))?.id || stands[0].id;
  const nowStand = standById(now);
  const nowIndex = stands.findIndex(s => s.id === now);
  const after = [...stands.slice(nowIndex + 1), ...stands.slice(0, nowIndex)];
  const nextStand = after.find(s => !ownRated.has(s.id)) || after[0];
  const allDone = ownRated.size === stands.length;
  const groupSize = people.length;
  const live = store?.mode === 'live';
  const hint = live ? 'Deine Bewertung und Fotos sieht die ganze Gruppe.' : 'Noch nicht verbunden: Bewertung und Fotos bleiben vorerst auf diesem Gerät.';

  function withName(next: () => void) {
    if (profile.name.trim()) next();
    else { setNameDraft(''); setAskName(() => next); }
  }
  function startRating(stand: Stand) { withName(() => setRateStand(stand)); }
  function moveHere(id: string) {
    setCurrent(id); saveCurrent(id); setSelected(id);
    store?.shareHere(id, profile.name.trim());
    notify(live ? `Alle sehen jetzt: ${standById(id).name}.` : `Jetzt hier: ${standById(id).name}.`);
  }
  function startRoute(id: string) {
    setOpenStand(null); setView('tour'); setSelected(id);
    setRoute({ to: id, from: now, n: Date.now() });
    setTimeout(() => document.getElementById('map-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
  }
  async function saveRating(r: Rating) {
    if (!store || !rateStand) return;
    const review: Review = { id: reviewId(rateStand.id, profile.id), standId: rateStand.id, authorId: profile.id, author: profile.name.trim(), ...r };
    await store.save(review);
    // Der Stand bleibt "Jetzt hier", bis jemand auf "Weiter" tippt.
    if (!current) { setCurrent(rateStand.id); saveCurrent(rateStand.id); }
    await refresh(store);
    notify('Bewertung gespeichert. Prost!');
  }
  async function deleteRating(review: Review) {
    if (!store) return;
    try { await store.remove(review); await refresh(store); notify('Bewertung gelöscht.'); }
    catch { notify('Löschen hat nicht geklappt. Bitte erneut versuchen.'); }
  }
  function saveName(e: React.FormEvent) {
    e.preventDefault();
    const name = nameDraft.trim();
    if (!name) return;
    const p = { ...profile, name };
    setProfile(p); profileRef.current = p; saveProfile(p);
    const next = askName; setAskName(null); setFirstName(false);
    next?.();
  }
  function changeView(v: View) { setView(v); window.scrollTo({ top: 0, behavior: 'instant' }); }
  const share = () => shareInvite(group);
  async function shareInvite(code: string) {
    const url = code ? inviteLink(code) : location.href.split('#')[0];
    try {
      if (navigator.share) await navigator.share({ title: 'Glühwein Tour 26', url });
      else { await navigator.clipboard.writeText(url); notify('Link kopiert.'); }
    } catch {}
  }
  const ownRating = (s: Stand): Rating | undefined => { const r = byStand[s.id].find(x => x.authorId === profile.id); return r && { values: r.values, comment: r.comment, photos: r.photos, updated: r.updated }; };

  return (
    <div className="app">
      <BackgroundScene />
      <header className="topbar">
        <span className="brand"><span className="brand-dot" />Glühwein Tour <b>26</b></span>
        <button type="button" className={`sync ${live ? 'is-live' : ''}`} onClick={() => changeView('group')}>
          {live ? <Wifi size={14} /> : <WifiOff size={14} />}{live ? 'Live' : 'Lokal'}
        </button>
      </header>

      <main className="content">
        {gate && <section className="gate">
          <ShinyText>Willkommen</ShinyText>
          <h1>Eure Runde<br />beitreten.</h1>
          <p>Gib den Gruppencode ein, den du per Link oder Nachricht bekommen hast. Oder gründe eine neue Gruppe und lade deine Leute ein.</p>
          <form className="card gate-form" onSubmit={e => { e.preventDefault(); joinGroup(codeDraft); }}>
            <label htmlFor="code-input">Gruppencode</label>
            <input id="code-input" value={codeDraft} onChange={e => setCodeDraft(e.target.value.toUpperCase())} placeholder="GLUEH-XXXXXX" autoComplete="off" autoCapitalize="characters" spellCheck={false} />
            <button type="submit" className="btn primary wide" disabled={normalizeCode(codeDraft).length < 6}>Beitreten</button>
          </form>
          <button type="button" className="btn ghost wide" onClick={foundGroup}>Neue Gruppe gründen & Link teilen</button>
          {group && <button type="button" className="btn ghost wide" onClick={() => setGate(false)}>Abbrechen</button>}
        </section>}
        {!gate && loadError && <p className="notice" role="alert">{loadError}</p>}

        {!gate && view === 'tour' && <>
          <section className="hero">
            <div className="hero-copy">
              <ShinyText>Bielefeld · Winter 2026</ShinyText>
              <h1>Glühwein<br />Tour <em>26.</em></h1>
              <p>Sieben Stopps durch die Altstadt. Probieren, bewerten, gemeinsam den Favoriten küren.</p>
            </div>
            <div className="hero-cup"><WinterCup /></div>
          </section>

          <section className="stats" aria-label="Stand der Tour">
            <div><strong><CountUp value={stands.length} /></strong><span>Stände</span></div>
            <div><strong><CountUp value={reviews.length} /></strong><span>{reviews.length === 1 ? 'Bewertung' : 'Bewertungen'}</span></div>
            <div><strong><CountUp value={people.length} /></strong><span>{people.length === 1 ? 'Person' : 'Leute'} dabei</span></div>
          </section>

          <section className="card map-card" id="map-card">
            <div className="card-head"><h2>Durch die Altstadt</h2><span className="pill">Karte: 2 Finger</span></div>
            <TourMap selected={selected} current={now} ratedIds={[...ownRated]} route={route} onSelect={id => { setSelected(id); }} onRouteClose={() => setRoute(null)} />
            <button type="button" className="map-selected" onClick={() => setOpenStand(standById(selected))}>
              <span className="num">{stopNumber(selected)}</span>
              <span><strong>{standById(selected).name}{selected === now && <em className="here-tag">Jetzt hier</em>}</strong><small>{plural(byStand[selected].length, 'Bewertung', 'Bewertungen')} · ansehen</small></span>
              <ChevronRight size={18} />
            </button>
          </section>

          <section>
            <div className="section-head"><h2>Alle Stände</h2><span>{ownRated.size} / {stands.length} von dir bewertet</span></div>
            <div className="stand-list">
              {stands.map(s => {
                const rs = byStand[s.id], avg = standAvg(s.id), done = ownRated.has(s.id);
                const everyone = groupSize > 1 && rs.length >= groupSize;
                return (
                  <SpotlightCard key={s.id} className={`stand-card${done ? ' is-done' : ''}${s.id === now ? ' is-now' : ''}`} onClick={() => setOpenStand(s)} label={`${s.name}, ${plural(rs.length, 'Bewertung', 'Bewertungen')}`}>
                    <span className="stand-thumb"><img src={s.image} alt="" />{done && <span className="tick" aria-hidden="true"><Check size={22} strokeWidth={3} /></span>}</span>
                    <span className="stand-main">
                      <span className="stand-num">{stopNumber(s.id)}{s.id === now && <span className="here-tag">Jetzt hier</span>}{done && <span className="done"><Check size={11} /> abgehakt</span>}{everyone && <span className="done all">alle durch</span>}</span>
                      <strong>{s.name}</strong>
                      <small>{s.place} · {s.wine}</small>
                      <span className="stand-meta">
                        {rs.length ? <><Stars value={avg} size={12} /><b>{formatScore(avg)}</b></> : <span className="muted">Noch keine Bewertung</span>}
                        <span className="count">{plural(rs.length, 'Bewertung', 'Bewertungen')}</span>
                      </span>
                    </span>
                    {rs.length > 0 && <span className="stack">{rs.slice(0, 3).map(r => <Avatar key={r.id} name={r.author} size={22} />)}</span>}
                  </SpotlightCard>
                );
              })}
            </div>
            <p className="fine">Sieben belegte Stopps aus 2025. Die Teilnahme 2026 ist noch nicht bestätigt. Die Bilder sind Illustrationen.</p>
          </section>
        </>}

        {!gate && view === 'ranking' && <>
          <PageHead label="Gruppenwertung" title="Ranking" sub="Durchschnitt aller Bewertungen der Gruppe." />
          {ranked.length === 0 ? (
            <div className="card empty-card"><Trophy size={30} /><h2>Noch kein Favorit</h2><p>Sobald jemand bewertet, entsteht hier das Ranking.</p><button type="button" className="btn primary" onClick={() => changeView('tour')}>Zu den Ständen</button></div>
          ) : <>
            <ol className="podium">
              {ranked.slice(0, 3).map((s, i) => (
                <li key={s.id} className={`place-${i + 1}`}>
                  <button type="button" onClick={() => setOpenStand(s)}>
                    <img src={s.image} alt="" />
                    <span className="medal">{i + 1}</span>
                    <strong>{s.name}</strong>
                    <span className="podium-score"><CountUp value={standAvg(s.id)} decimals={1} /></span>
                    <small>{plural(byStand[s.id].length, 'Bewertung', 'Bewertungen')}</small>
                  </button>
                </li>
              ))}
            </ol>
            <ol className="rank-list" start={4}>
              {ranked.slice(3).map((s, i) => (
                <li key={s.id}><button type="button" onClick={() => setOpenStand(s)}><span className="rank">{i + 4}</span><span><strong>{s.name}</strong><small>{plural(byStand[s.id].length, 'Bewertung', 'Bewertungen')}</small></span><b>{formatScore(standAvg(s.id))}</b></button></li>
              ))}
            </ol>
          </>}
          {stands.length > ranked.length && <p className="fine">Noch ohne Bewertung: {stands.filter(s => !byStand[s.id].length).map(s => s.name).join(', ')}.</p>}
        </>}

        {!gate && view === 'photos' && <>
          <PageHead label="Winter 2026" title="Momente" sub={photos.length ? plural(photos.length, 'Foto', 'Fotos') + ' aus der Gruppe' : 'Fotos aus euren Bewertungen erscheinen hier.'} />
          {photos.length === 0 && <div className="card empty-card"><Camera size={30} /><h2>Noch keine Fotos</h2><p>Füge beim Bewerten ein Foto hinzu.</p></div>}
          <div className="masonry">
            {photos.map(p => (
              <button key={p.id} type="button" className="photo" onClick={() => setLightbox({ src: p.src, label: `${p.stand!.name} · ${p.author}` })}>
                <img src={p.src} alt={`${p.stand!.name}, Foto von ${p.author}`} /><span><strong>{p.stand!.name}</strong><small>{p.author}</small></span>
              </button>
            ))}
          </div>
        </>}

        {!gate && view === 'group' && <>
          <PageHead label="Eure Runde" title="Gruppe" sub={people.length ? `${plural(people.length, 'Person hat', 'Leute haben')} schon bewertet.` : 'Noch hat niemand bewertet.'} />
          <section className="card me">
            <Avatar name={profile.name || '?'} size={48} />
            <div><small>Du bewertest als</small><strong>{profile.name || 'noch ohne Namen'}</strong></div>
            <button type="button" className="btn ghost small" onClick={() => { setNameDraft(profile.name); setAskName(() => () => {}); }}>Ändern</button>
          </section>
          <section className={`card sync-card ${live ? 'is-live' : ''}`}>
            {live ? <Wifi size={20} /> : <WifiOff size={20} />}
            <div>
              <strong>{live ? 'Live verbunden' : 'Nur auf diesem Gerät'}</strong>
              <p>{live ? 'Neue Bewertungen der Gruppe erscheinen automatisch.' : 'Die gemeinsame Datenbank ist noch nicht eingerichtet. Bis dahin siehst du nur deine eigenen Bewertungen.'}</p>
            </div>
          </section>
          {live && group && <section className="card code-card">
            <div><small>Gruppencode</small><strong className="tabular">{group}</strong></div>
            <button type="button" className="btn ghost small" onClick={() => { setCodeDraft(''); setGate(true); }}>Wechseln</button>
          </section>}
          <button type="button" className="btn primary wide" onClick={share}><Copy size={17} /> Freunde einladen</button>
          {live && <p className="fine">Der Einladungslink enthält euren Gruppencode. Wer ihn hat, kann mitbewerten.</p>}
          {people.length > 0 && <ul className="people">
            {people.map(p => <li key={p.id}><Avatar name={p.name} size={38} /><span className="person"><strong>{p.name}{p.id === profile.id && <span className="you">Du</span>}</strong><small>{plural(p.count, 'Stand', 'Stände')} bewertet · im Schnitt {formatScore(p.avg)}</small></span><span className="progress"><i style={{ width: `${(p.count / stands.length) * 100}%` }} /></span></li>)}
          </ul>}
          <details className="sources">
            <summary>Standliste 2025 & Quellen</summary>
            <p>Belegte Auswahl, keine vollständige Beschickerliste. Preise und genaue Standpositionen sind nicht gesichert. Für 2026 müssen die Stopps neu geprüft werden.</p>
            {stands.map(s => <div key={s.id}><strong>{s.name} · {s.place}</strong>{s.sources.map(src => <a key={src.url} href={src.url} target="_blank" rel="noreferrer">{src.title}<ArrowUpRight size={12} /></a>)}</div>)}
            <p>Karte: MapLibre, OpenFreeMap, OpenStreetMap. Bilder: eigene Illustrationen.</p>
          </details>
        </>}
      </main>

      {!gate && <div className="now-bar" aria-label="Aktueller Stand">
        <button type="button" className="now-info" onClick={() => setOpenStand(nowStand)}>
          <span className="now-num">{stopNumber(now)}</span>
          <span><small><MapPin size={11} /> Jetzt hier</small><strong>{nowStand.name}</strong></span>
        </button>
        {!ownRated.has(now)
          ? <button type="button" className="btn primary small" onClick={() => startRating(nowStand)}><Star size={15} /> Bewerten</button>
          : allDone
            ? <button type="button" className="btn ghost small" onClick={() => changeView('ranking')}><PartyPopper size={15} /> Ranking</button>
            : <button type="button" className="btn ghost small" onClick={() => moveHere(nextStand.id)}>Weiter: {stopNumber(nextStand.id)} <ChevronRight size={15} /></button>}
      </div>}

      {!gate && <nav className="dock" aria-label="Hauptnavigation">
        {nav.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={view === id ? 'active' : ''} aria-current={view === id ? 'page' : undefined} onClick={() => changeView(id)}><Icon size={20} /><span>{label}</span></button>
        ))}
      </nav>}

      {openStand && <StandSheet key={openStand.id} stand={openStand} reviews={byStand[openStand.id]} ownId={profile.id} isCurrent={openStand.id === now} onHere={() => moveHere(openStand.id)} onRoute={() => startRoute(openStand.id)} onClose={() => setOpenStand(null)} onRate={() => { const s = openStand; setOpenStand(null); startRating(s); }} onDelete={deleteRating} onPhoto={(src, label) => setLightbox({ src, label })} />}
      {rateStand && <RatingSheet key={rateStand.id} stand={rateStand} rating={ownRating(rateStand)} hint={hint} current={rateStand.id === now ? undefined : nowStand} onSwitch={() => { setRateStand(null); startRating(nowStand); }} onClose={() => setRateStand(null)} onSave={saveRating} />}

      <dialog ref={nameDialog} className="sheet name-dialog" aria-labelledby="name-title" onCancel={e => { if (firstName) e.preventDefault(); else setAskName(null); }}>
        <form onSubmit={saveName}>
          <div className="sheet-top"><h2 id="name-title">{firstName ? 'Hi! Wie heißt du?' : 'Wie heißt du?'}</h2>{!firstName && <button type="button" className="icon-btn" aria-label="Schließen" onClick={() => setAskName(null)}><X size={20} /></button>}</div>
          <p className="muted">So sieht die Gruppe, wer bewertet hat. Du kannst den Namen später unter „Gruppe“ ändern.</p>
          <label htmlFor="name-input">Dein Name</label>
          <input id="name-input" value={nameDraft} onChange={e => setNameDraft(e.target.value)} maxLength={30} required autoComplete="given-name" />
          <button className="btn primary wide" type="submit"><Check size={18} /> Speichern</button>
        </form>
      </dialog>
      <dialog ref={photoDialog} className="lightbox" aria-label="Foto" onCancel={() => setLightbox(null)} onClick={() => setLightbox(null)}>
        <button type="button" className="icon-btn" aria-label="Foto schließen"><X /></button>
        {lightbox && <><img src={lightbox.src} alt={lightbox.label} /><p>{lightbox.label}</p></>}
      </dialog>
      {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    </div>
  );
}

function PageHead({ label, title, sub }: { label: string; title: string; sub: string }) {
  return <div className="page-head"><ShinyText>{label}</ShinyText><h1>{title}</h1><p>{sub}</p></div>;
}
