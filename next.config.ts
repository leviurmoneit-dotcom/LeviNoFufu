import type { NextConfig } from 'next';
import { writeFileSync } from 'node:fs';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;
// Versionskennung des Builds: steckt im Code und in public/version.json. Weichen beide ab, gibt es eine neue Version.
const buildId = process.env.GITHUB_SHA?.slice(0, 12) || Date.now().toString(36);
writeFileSync(new URL('./public/version.json', import.meta.url), JSON.stringify({ v: buildId }));
const config: NextConfig = { output: 'export', basePath, images: { unoptimized: true }, devIndicators: false, env: { NEXT_PUBLIC_BUILD_ID: buildId } };
export default config;
