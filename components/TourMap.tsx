'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { LocateFixed, RotateCcw } from 'lucide-react';
import { stands, stopNumber, type TourState } from '../lib/data';
const tourBounds = () => stands.reduce((bounds, stand) => bounds.extend(stand.coords), new maplibregl.LngLatBounds());

type Pt = { id: string; x: number; y: number; ox: number; oy: number };
function layoutStands(w: number, h: number): Pt[] {
  if (!w || !h) return [];
  const lat0 = stands.reduce((a, s) => a + s.coords[1], 0) / stands.length;
  const k = Math.cos((lat0 * Math.PI) / 180);
  const raw = stands.map(s => ({ id: s.id, x: s.coords[0] * k, y: -s.coords[1] }));
  const xs = raw.map(r => r.x), ys = raw.map(r => r.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const padX = 34, top = 34, bottom = 58, dx = Math.max(maxX - minX, 1e-9), dy = Math.max(maxY - minY, 1e-9);
  const availH = h - top - bottom;
  const scale = Math.min((w - padX * 2) / dx, availH / dy);
  const offX = (w - dx * scale) / 2, offY = top + (availH - dy * scale) / 2;
  const pts: Pt[] = raw.map(r => {
    const x = offX + (r.x - minX) * scale, y = offY + (r.y - minY) * scale;
    return { id: r.id, x, y, ox: x, oy: y };
  });
  const minD = 54;
  for (let it = 0; it < 120; it++) {
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      let vx = pts[j].x - pts[i].x, vy = pts[j].y - pts[i].y, d = Math.hypot(vx, vy);
      if (d >= minD) continue;
      if (d < 0.01) { vx = Math.cos(i * 2.4); vy = Math.sin(i * 2.4); d = 1; }
      const push = (minD - d) / 2 / d;
      pts[i].x -= vx * push; pts[i].y -= vy * push; pts[j].x += vx * push; pts[j].y += vy * push;
    }
    for (const p of pts) { p.x = Math.min(w - 28, Math.max(28, p.x)); p.y = Math.min(h - bottom, Math.max(top - 6, p.y)); }
  }
  return pts;
}
function SchemeMap({ selected, state, onSelect }: { selected: string; state: TourState; onSelect: (id: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const pts = useMemo(() => layoutStands(size.w, size.h), [size]);
  return (
    <div ref={box} className="scheme-map" role="group" aria-label="Schema der Stopp-Standorte, Karte nicht verfügbar">
      <svg width={size.w} height={size.h} aria-hidden="true">
        {pts.map(p => <g key={p.id}><line x1={p.ox} y1={p.oy} x2={p.x} y2={p.y} className="scheme-leader" /><circle cx={p.ox} cy={p.oy} r="3" className="scheme-dot" /></g>)}
      </svg>
      {pts.map(p => {
        const s = stands.find(x => x.id === p.id)!;
        return <button key={p.id} type="button" className={`map-marker scheme-marker${p.id === selected ? ' selected' : ''}${state.ratings[p.id] ? ' visited' : ''}`}
          style={{ left: p.x, top: p.y }} aria-label={`${s.name} auswählen`} aria-pressed={p.id === selected} onClick={() => onSelect(p.id)}>{stopNumber(p.id)}</button>;
      })}
      <p className="scheme-note">Keine Kartenkacheln. Schema der Standorte.</p>
    </div>
  );
}
export default function TourMap({selected,state,onSelect}:{selected:string;state:TourState;onSelect:(id:string)=>void}) {
 const host=useRef<HTMLDivElement>(null),map=useRef<maplibregl.Map|null>(null),markers=useRef<maplibregl.Marker[]>([]),select=useRef(onSelect),locationMarker=useRef<maplibregl.Marker|null>(null);
 const [failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false),[locationNote,setLocationNote]=useState(''),[locating,setLocating]=useState(false);
 select.current=onSelect;
 useEffect(()=>{if(!host.current)return;let m:maplibregl.Map;let timer:ReturnType<typeof setTimeout>;try{m=new maplibregl.Map({container:host.current,style:'https://tiles.openfreemap.org/styles/positron',center:stands[0].coords,zoom:16.7,attributionControl:{compact:true},pitch:0});map.current=m;m.scrollZoom.disable();timer=setTimeout(()=>{if(!m.loaded())setFailed(true)},18000);m.on('load',()=>{clearTimeout(timer);setLoaded(true);setFailed(false);for(const layer of m.getStyle().layers){if(layer.type==='background')m.setPaintProperty(layer.id,'background-color','#f3eee4');if(layer.type==='fill'&&/park|landcover|landuse/.test(layer.id))m.setPaintProperty(layer.id,'fill-color','#dde4d4');}stands.forEach(s=>{const button=document.createElement('button');button.className='map-marker';button.textContent=stopNumber(s.id);button.setAttribute('aria-label',`${s.name} auf Karte auswählen`);button.onclick=()=>select.current(s.id);const marker=new maplibregl.Marker({element:button,anchor:'center'}).setLngLat(s.coords).addTo(m);markers.current.push(marker)});});m.on('error',()=>{if(!m.isStyleLoaded())setFailed(true)});}catch{setFailed(true)}return()=>{clearTimeout(timer);markers.current.forEach(x=>x.remove());markers.current=[];map.current?.remove();map.current=null}},[]);
 useEffect(()=>{markers.current.forEach((marker,i)=>{const el=marker.getElement();el.classList.toggle('selected',stands[i].id===selected);el.classList.toggle('visited',!!state.ratings[stands[i].id]);el.setAttribute('aria-pressed',String(stands[i].id===selected))});},[selected,state,loaded]);
 useEffect(()=>{const stop=stands.find(s=>s.id===selected);if(loaded&&stop)map.current?.easeTo({center:stop.coords,zoom:16.7,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:450})},[selected,loaded]);
 function locate(){if(!navigator.geolocation){setLocationNote('Standort ist hier nicht verfügbar. Alle Stopps bleiben auf der Karte.');return}setLocating(true);navigator.geolocation.getCurrentPosition(p=>{setLocating(false);setLocationNote('Dein Standort wird nur auf diesem Gerät angezeigt.');if(!map.current)return;locationMarker.current?.remove();locationMarker.current=new maplibregl.Marker({color:'#407864'}).setLngLat([p.coords.longitude,p.coords.latitude]).addTo(map.current);map.current.easeTo({center:[p.coords.longitude,p.coords.latitude],zoom:15})},()=>{setLocating(false);setLocationNote('Standort nicht verfügbar. Wähle deinen nächsten Stopp direkt auf der Karte.')},{timeout:10000})}
 return <div className="map-wrap"><div ref={host} className="map" aria-label="Interaktive Karte der Weihnachtsmarkt-Stopps aus 2025 in Bielefeld"/><div className="map-label"><span className="live-dot"/> Bielefeld, Innenstadt</div>{!loaded&&!failed&&<div className="map-loading">Deine Tourkarte wird geladen …</div>}{failed&&<SchemeMap selected={selected} state={state} onSelect={onSelect}/>}{!failed&&<div className="map-tools"><button aria-label="Meinen Standort anzeigen" disabled={locating||failed} onClick={locate}><LocateFixed size={19}/></button><button aria-label="Alle Tourstopps anzeigen" disabled={failed} onClick={()=>map.current?.fitBounds(tourBounds(),{padding:{top:28,bottom:45,left:30,right:30},maxZoom:15,duration:0})}><RotateCcw size={18}/></button></div>}<div className="map-legend"><span><i className="gold"/>Ausgewählt</span><span><i className="green"/>Bewertet</span><span><i/>Offen</span></div>{locationNote&&<p className="location-note" role="status">{locationNote}</p>}</div>
}
