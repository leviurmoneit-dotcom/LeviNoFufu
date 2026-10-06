/** Farbwelten mit gleichem Aufbau. Die CSS-Variablen steuern die Oberfläche, `scene` den Three.js-Hintergrund. */
type Vec3 = [number, number, number];
export type Theme = {
  id: string; name: string; hint: string; light?: boolean;
  vars: Record<string, string>;
  scene: { night: Vec3; plum: Vec3; glow: Vec3; warm1: Vec3; warm2: Vec3; glowStrength: number };
};

const dark = (o: { bg: string; bgRgb: string; ink: string; inkRgb: string; muted: string; accent: string; accentRgb: string; accentInk: string; berry: string; berryRgb: string; pine: string; pineRgb: string; pineDeep: string; panelRgb: string; panelSolid: string; sceneGlow: string }) => ({
  '--bg': o.bg, '--bg-rgb': o.bgRgb, '--ink': o.ink, '--ink-rgb': o.inkRgb, '--muted': o.muted,
  '--amber': o.accent, '--accent-rgb': o.accentRgb, '--amber-ink': o.accentInk,
  '--cranberry': o.berry, '--berry-rgb': o.berryRgb, '--pine': o.pine, '--pine-rgb': o.pineRgb, '--pine-deep': o.pineDeep,
  '--panel-rgb': o.panelRgb, '--panel-solid': o.panelSolid, '--scene-glow': o.sceneGlow,
  '--map-filter': 'invert(.92) hue-rotate(180deg) saturate(.45) brightness(.9) sepia(.15)', 'color-scheme': 'dark',
});

export const themes: Theme[] = [
  {
    id: 'marktnacht', name: 'Marktnacht', hint: 'Aubergine & Laternenlicht',
    vars: dark({ bg: '#120e16', bgRgb: '18, 14, 22', ink: '#f7efe7', inkRgb: '255, 244, 236', muted: '#bcaeb6', accent: '#f3b66a', accentRgb: '243, 182, 106', accentInk: '#2a1708', berry: '#e05770', berryRgb: '224, 87, 112', pine: '#7cc3a5', pineRgb: '124, 195, 165', pineDeep: '#2d5a49', panelRgb: '24, 18, 28', panelSolid: '#1a141e', sceneGlow: '#3a1527' }),
    scene: { night: [.075, .055, .09], plum: [.24, .08, .16], glow: [.95, .62, .30], warm1: [1, .72, .42], warm2: [1, .45, .48], glowStrength: 1 },
  },
  {
    id: 'tannenwald', name: 'Tannenwald', hint: 'Tannengrün & Gold',
    vars: dark({ bg: '#0b130f', bgRgb: '11, 19, 15', ink: '#eef4ec', inkRgb: '238, 246, 236', muted: '#a9b8ad', accent: '#e6c46e', accentRgb: '230, 196, 110', accentInk: '#231a05', berry: '#e0665c', berryRgb: '224, 102, 92', pine: '#8fd1a0', pineRgb: '143, 209, 160', pineDeep: '#2f6a45', panelRgb: '15, 26, 20', panelSolid: '#13201a', sceneGlow: '#173a28' }),
    scene: { night: [.035, .065, .05], plum: [.06, .2, .12], glow: [.95, .8, .4], warm1: [1, .86, .5], warm2: [.7, 1, .72], glowStrength: 1 },
  },
  {
    id: 'mitternacht', name: 'Mitternacht', hint: 'Nachtblau & Eis',
    vars: dark({ bg: '#0a0e1b', bgRgb: '10, 14, 27', ink: '#ecf1fa', inkRgb: '236, 242, 252', muted: '#a3adc4', accent: '#8cbfff', accentRgb: '140, 191, 255', accentInk: '#071430', berry: '#f07096', berryRgb: '240, 112, 150', pine: '#7adcc8', pineRgb: '122, 220, 200', pineDeep: '#1f5a55', panelRgb: '16, 22, 40', panelSolid: '#121a30', sceneGlow: '#1b2c5a' }),
    scene: { night: [.035, .045, .1], plum: [.08, .12, .3], glow: [.55, .75, 1], warm1: [.75, .85, 1], warm2: [1, .82, .95], glowStrength: 1 },
  },
  {
    id: 'zuckerstange', name: 'Zuckerstange', hint: 'Kirschrot & Zuckerweiß',
    vars: dark({ bg: '#19070a', bgRgb: '25, 7, 10', ink: '#fff0ee', inkRgb: '255, 240, 238', muted: '#d2adb0', accent: '#ff7a7a', accentRgb: '255, 122, 122', accentInk: '#2a0306', berry: '#ffc06e', berryRgb: '255, 192, 110', pine: '#8fd6aa', pineRgb: '143, 214, 170', pineDeep: '#2f6a45', panelRgb: '36, 11, 15', panelSolid: '#2a0d11', sceneGlow: '#5a1218' }),
    scene: { night: [.1, .025, .035], plum: [.36, .05, .08], glow: [1, .7, .62], warm1: [1, .92, .88], warm2: [1, .5, .5], glowStrength: 1 },
  },
  {
    id: 'schnee', name: 'Schneeweiß', hint: 'Hell & klar', light: true,
    vars: {
      '--bg': '#f4efe8', '--bg-rgb': '244, 239, 232', '--ink': '#231c1f', '--ink-rgb': '35, 28, 31', '--muted': '#6c6164',
      '--amber': '#b8432f', '--accent-rgb': '184, 67, 47', '--amber-ink': '#ffffff',
      '--cranberry': '#b8284f', '--berry-rgb': '184, 40, 79', '--pine': '#2b7a57', '--pine-rgb': '43, 122, 87', '--pine-deep': '#2b7a57',
      '--panel-rgb': '255, 252, 248', '--panel-solid': '#fffcf8', '--scene-glow': '#f3dcc6', '--map-filter': 'none', 'color-scheme': 'light',
    },
    scene: { night: [.95, .93, .9], plum: [.93, .86, .82], glow: [.95, .55, .3], warm1: [1, .8, .6], warm2: [1, .7, .7], glowStrength: .5 },
  },
];

export const THEME_KEY = 'glueh26-theme';
export const themeById = (id: string) => themes.find(t => t.id === id) || themes[0];
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(theme.vars)) root.style.setProperty(k, v);
  root.dataset.theme = theme.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.vars['--bg']);
}
/** Läuft vor dem ersten Zeichnen (im <head>), damit kein falsches Farbschema aufblitzt. */
export const themeBootScript = `try{var t=${JSON.stringify(Object.fromEntries(themes.map(t => [t.id, t.vars])))}[localStorage.getItem('${THEME_KEY}')];if(t)for(var k in t)document.documentElement.style.setProperty(k,t[k])}catch(e){}`;
