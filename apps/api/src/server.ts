/**
 * Entrypoint de desarrollo local (no usado por Vercel).
 */

import { serve } from '@hono/node-server';
import app from './index.js';

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[api] escuchando en http://localhost:${info.port}`);
});
