'use client';
import { useEffect, useRef } from 'react';
import type { Theme } from '../lib/themes';
import * as THREE from 'three';

// Nachtmarkt-Atmosphäre: warmer Nebel als Shader und unscharfe Lichter (Bokeh) als Punktwolke.
// Niedrige Auflösung, ~30 fps, pausiert im Hintergrund, bei reduzierter Bewegung nur ein Standbild.
const fog = `
uniform float uTime; uniform vec2 uRes; uniform vec3 uNight; uniform vec3 uPlum; uniform vec3 uGlow; uniform float uGlowStrength; varying vec2 vUv;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.02;a*=.5;}return v;}
void main(){
  vec2 uv=vUv; vec2 p=uv*vec2(uRes.x/uRes.y,1.)*2.2;
  float t=uTime*.03;
  float f=fbm(p+vec2(t,-t*.6)+fbm(p*1.7-t));
  vec3 col=mix(uNight,uPlum,smoothstep(.25,.9,f)*.85);
  float glow=smoothstep(.9,0.,length(uv-vec2(.8,.9)))*.16+smoothstep(1.,0.,length(uv-vec2(.1,.12)))*.06;
  col+=uGlow*glow*uGlowStrength*(.55+.45*f);
  col*=.82+.18*smoothstep(1.4,.2,length(uv-.5));
  gl_FragColor=vec4(col,1.);
}`;
const bokehVert = `
uniform float uTime; uniform float uScale; attribute float aSize; attribute float aSeed; varying float vSeed;
void main(){ vSeed=aSeed; vec3 p=position;
  p.y+=sin(uTime*.25+aSeed*6.28)*.06; p.x+=cos(uTime*.18+aSeed*12.)*.04;
  vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=aSize*uScale/(-mv.z); }`;
const bokehFrag = `
uniform float uTime; uniform vec3 uWarm1; uniform vec3 uWarm2; varying float vSeed;
void main(){ vec2 c=gl_PointCoord-.5; float d=length(c); if(d>.5)discard;
  float a=smoothstep(.5,.32,d)*(.35+.25*sin(uTime*.9+vSeed*20.));
  vec3 warm=mix(uWarm1,uWarm2,step(.7,vSeed));
  gl_FragColor=vec4(warm,a*.32); }`;

type Palette = Theme['scene'];
export default function BackgroundScene({ palette }: { palette: Palette }) {
  const ref = useRef<HTMLDivElement>(null);
  const apply = useRef<(p: Palette) => void>(() => {});
  const current = useRef(palette);
  current.current = palette;
  useEffect(() => { apply.current(palette); }, [palette]);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' }); } catch { return; }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1) * 0.6);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 20);
    camera.position.z = 3;
    const fogMat = new THREE.ShaderMaterial({ vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}', fragmentShader: fog, uniforms: { uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uNight: { value: new THREE.Vector3() }, uPlum: { value: new THREE.Vector3() }, uGlow: { value: new THREE.Vector3() }, uGlowStrength: { value: 1 } }, depthWrite: false });
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fogMat);
    bg.frustumCulled = false; bg.renderOrder = -1;
    scene.add(bg);

    const N = 70, pos = new Float32Array(N * 3), size = new Float32Array(N), seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 5; pos[i * 3 + 1] = (Math.random() - 0.2) * 3.4; pos[i * 3 + 2] = -Math.random() * 3;
      size[i] = 10 + Math.random() * 34; seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const bokehMat = new THREE.ShaderMaterial({ vertexShader: bokehVert, fragmentShader: bokehFrag, uniforms: { uTime: { value: 0 }, uScale: { value: 1 }, uWarm1: { value: new THREE.Vector3() }, uWarm2: { value: new THREE.Vector3() } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    scene.add(new THREE.Points(geo, bokehMat));

    apply.current = p => {
      fogMat.uniforms.uNight.value.set(...p.night); fogMat.uniforms.uPlum.value.set(...p.plum);
      fogMat.uniforms.uGlow.value.set(...p.glow); fogMat.uniforms.uGlowStrength.value = p.glowStrength;
      bokehMat.uniforms.uWarm1.value.set(...p.warm1); bokehMat.uniforms.uWarm2.value.set(...p.warm2);
      if (reduced) renderer.render(scene, camera);
    };
    apply.current(current.current);
    const resize = () => {
      const w = innerWidth, h = innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      fogMat.uniforms.uRes.value.set(w, h);
      bokehMat.uniforms.uScale.value = h * renderer.getPixelRatio() * 0.01;
    };
    resize();
    addEventListener('resize', resize);

    let raf = 0, last = 0;
    const start = performance.now();
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (t - last < 33) return;
      last = t;
      const s = (t - start) / 1000;
      fogMat.uniforms.uTime.value = s; bokehMat.uniforms.uTime.value = s;
      renderer.render(scene, camera);
    };
    const draw = () => { if (reduced) { renderer.render(scene, camera); return; } if (!raf && !document.hidden) raf = requestAnimationFrame(frame); };
    const vis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else draw(); };
    document.addEventListener('visibilitychange', vis);
    draw();
    return () => {
      cancelAnimationFrame(raf); removeEventListener('resize', resize); document.removeEventListener('visibilitychange', vis);
      geo.dispose(); bokehMat.dispose(); fogMat.dispose(); bg.geometry.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <div ref={ref} className="scene" aria-hidden="true" />;
}
