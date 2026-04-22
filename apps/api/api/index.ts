/**
 * Handler para Vercel Functions.
 *
 * Vercel detecta automáticamente cualquier archivo dentro de `api/` como una
 * Serverless Function. `hono/vercel` expone un `handle` que convierte la app
 * Hono (estándar Web Fetch) en el formato que Vercel espera.
 *
 * IMPORTANTE: no usamos `@hono/node-server` aquí (eso es solo para el server
 * local de desarrollo, ver `src/server.ts`). En Vercel el runtime Node soporta
 * `Request`/`Response` globales directamente.
 */

import { handle } from 'hono/vercel';
import app from '../src/index.js';

export const config = {
  runtime: 'nodejs',
};

export default handle(app);
