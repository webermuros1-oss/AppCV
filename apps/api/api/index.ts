/**
 * Handler para Vercel Functions (Node.js runtime).
 *
 * Para `runtime: 'nodejs'` usamos `@hono/node-server/vercel`, que convierte
 * el IncomingMessage de Node a un Web `Request` antes de llamar a Hono.
 * `hono/vercel` (sin @hono/node-server) solo sirve para Edge Runtime, donde
 * Vercel ya entrega un Web `Request` directamente.
 */

import { handle } from '@hono/node-server/vercel';
import app from '../src/index.js';

export const config = {
  runtime: 'nodejs',
};

export default handle(app);
