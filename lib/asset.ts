// Präfix für Dateien aus /public. Leer bei Hosting auf der Domain-Wurzel (Vercel),
// "/<Repo-Name>" bei GitHub Pages (gesetzt im Pages-Workflow).
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export const asset = (path: string) => `${BASE_PATH}${path}`;
