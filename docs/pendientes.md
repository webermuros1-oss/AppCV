# Pendientes

Backlog vivo del proyecto. Actualizar cuando se complete o añada algo.

## Leyenda de prioridades
- **P0**: bloquea uso real (no se puede demo).
- **P1**: importante antes de producción real (UX, seguridad, calidad).
- **P2**: nice-to-have, polish, features adicionales.

## Leyenda de áreas
`backend` · `mobile` · `voz` · `ui` · `tests` · `deploy` · `producto`

---

## P0 — Bloqueantes reales

- [ ] [producto] Probar entrevista real end-to-end con clave Claude válida — validar que TTS se oye, STT transcribe y Claude responde coherente. Sin esto no sabemos si el producto funciona.
- [x] [deploy] ~~Rotar `ANTHROPIC_API_KEY` expuesta por el usuario en el chat~~ — clave rotada.

---

## P1 — Antes de producción

### Backend / producto
- [ ] [backend] Migrar `sessionStore` en memoria a KV externo (Upstash / Vercel KV) — hoy una instancia reciclada de Vercel pierde sesiones activas (documentado en `docs/deployment.md`).
- [ ] [backend] Cerrar CORS a dominio(s) reales — hoy `app.use('*', cors())` en `apps/api/src/index.ts:30` acepta cualquier origen.
- [ ] [backend] Añadir rate limit a `/session/*` — sin límite hay riesgo de abuso de la clave Claude.
- [ ] [backend] Añadir logger estructurado (pino o similar) — hoy solo `console` implícito; producción necesita trazas con `sessionId`.
- [ ] [backend] Validación de entrada más estricta en rutas — `apps/api/src/index.ts` comprueba `typeof` manualmente; considerar `zod` o `valibot` para `StartSessionRequest` (p. ej. `toughness` fuera de 1..5, `jobRole` vacío tras trim, límites de longitud).
- [ ] [backend] Streaming de la respuesta del entrevistador — la UI espera el turno completo; aceptable con `max_tokens` bajos pero mejora percibida con SSE.
- [x] ~~[backend] Sesiones en memoria sin TTL~~ — `getSession` poda inline + `setInterval` cleanup cada 5 min ya implementados en `apps/api/src/sessionStore.ts`.

### Voz / móvil
- [ ] [voz] Pedir permiso de micrófono explícitamente al entrar en `SessionScreen` — hoy solo está declarado en `Info.plist` y `android.permissions`; falta `Permissions.askAsync` o `expo-av` prompt.
- [ ] [voz] STT web solo funciona en navegadores Chromium — Firefox/Safari muestran error del `webSpeechRecognizer`; evaluar fallback grabar-audio → Whisper.
- [ ] [voz] Reemplazar `@react-native-voice/voice@3.2.4` — marcado como deprecated en `pnpm-lock.yaml:1415` ("Use expo-speech-recognition instead"); evaluar `expo-speech-recognition` o grabar + Whisper.
- [ ] [voz] TTS con `expo-speech` suena robótico — upgrade a ElevenLabs ya abstraído tras `VoiceEngine`; decisión diferida.
- [ ] [voz] En `SessionScreen.tsx` el `stop()` del recognizer al apagar micro no está garantizado si `onResult` llega después — revisar race.

### UI
- [ ] [ui] Sin diseño real — `HomeScreen`, `SessionScreen`, `ReportScreen` usan `StyleSheet` con paleta inconsistente (`#0a6`, `#06c`, `#222`); definir tokens de color/tipografía/espaciado.
- [ ] [ui] Sin estados de carga ricos — solo `ActivityIndicator` básico en transiciones (start session, end session, esperando respuesta).
- [ ] [ui] Accesibilidad: falta `accessibilityLabel`, orden de foco, contraste; screen readers no describen los botones de toughness (1..5).
- [ ] [ui] No es responsive para web desktop — todas las pantallas usan medidas mobile; en web queda columna estrecha por defecto, sin layout fluido.
- [ ] [ui] Validación de formulario en `HomeScreen` solo comprueba "no vacío tras trim"; falta límite de longitud, mensajes por campo.
- [ ] [ui] Sin manejo claro de errores recuperables ("la red se cayó, reintenta") — hoy solo pinta `error` del store en rojo.
- [ ] [ui] En `SessionScreen` si `voiceRef.current?.speak()` falla se silencia con `// si falla TTS no queremos romper la UI` — mejor mostrar un indicador sutil de "TTS no disponible".

### Tests
- [ ] [tests] 0% cobertura de UI — añadir `@testing-library/react-native` para `HomeScreen`/`SessionScreen`/`ReportScreen` (mockeando `voice` y `store`).
- [ ] [tests] 0% cobertura de adaptadores voz/storage — antes de reemplazar cualquiera, escribir test primero.
- [ ] [tests] Sin E2E — evaluar Playwright contra `expo export -p web` con `SpeechRecognition` mockeado.
- [ ] [tests] Añadir test del contrato API con el mobile (p.ej. mock server) para evitar drift de tipos shared.

### Deploy
- [ ] [deploy] Deploy automático desde CI no configurado — `docs/deployment.md` indica que Vercel se conecta aparte; si se quiere, añadir `EXPO_TOKEN` / `VERCEL_TOKEN` a GitHub secrets y workflow de deploy.
- [ ] [deploy] Placeholder `"owner": "TODO-EXPO-USERNAME"` en `apps/mobile/app.json:5` — reemplazar con cuenta real antes de primer EAS build.
- [ ] [deploy] `Storage.ts` tiene `TODO(logica-negocio)` en su doc — aclarar si los adapters ya están cubiertos o cablearlos a UI (ver P2 persistir historial).

---

## P2 — Mejoras y features

### Producto / features
- [ ] [producto] Persistir historial local de entrevistas — `asyncStorageAdapter` y `localStorageAdapter` existen pero no se usan; añadir pantalla "Mis entrevistas".
- [ ] [producto] Modo "silencios reales" para `toughness=5` con timers programados — hoy solo se instruye al modelo a escribir `(...)`.
- [ ] [producto] Exportar reporte como PDF / compartir.
- [ ] [producto] Exponer `durationMin` en `HomeScreen` (ya existe en el tipo `SessionConfig`, hoy hardcoded a 10).
- [ ] [producto] i18n — hoy `es-ES` hardcoded en TTS/STT y prompts; añadir EN al menos.
- [ ] [producto] Modo "entrevista guiada" — usuario elige lista de preguntas típicas del rol.
- [ ] [producto] Pantalla de ayuda / tutorial para primera vez.
- [ ] [producto] Métricas agregadas entre entrevistas (progreso temporal de claridad/confianza/muletillas).
- [ ] [producto] Detección de cierre de entrevista (`detectClosing` en `apps/api/src/index.ts:54`) es frágil — lista fija en español; puede fallar con variantes; considerar flag explícito del modelo.

---

## Decisiones diferidas (preguntas abiertas, no tareas)

- ¿Cuándo migrar a KV externo? Tras el primer reinicio observado que pierda una sesión activa, o al cruzar ~10 usuarios concurrentes.
- ¿Cuándo invertir en TTS de pago (ElevenLabs)? Cuando el feedback diga que la voz robótica mata la inmersión del "modo incómodo".
- ¿Modo offline? Probablemente no — requeriría LLM local; fuera de scope.
- ¿Unificar STT nativo + web detrás de un único backend (grabar + Whisper server-side)? Resolvería deprecación y compatibilidad Firefox/Safari de una vez.

---

## Ya resuelto (referencia histórica, no re-proponer)

- Scaffolding monorepo (Expo SDK 52 + Hono + `packages/shared`) con pnpm workspaces.
- Lógica end-to-end: 3 rutas backend (`startSession`/`sendTurn`/`endSession`) con Claude Sonnet 4.6, 3 pantallas mobile, voz integrada por plataforma.
- 61 tests en verde (47 api + 14 mobile, store Zustand).
- Gotchas pnpm+RN+Windows resueltos (node-linker hoisted, entry local, sin exports map, factory por plataforma `.native.ts` / `.web.ts`).
- Configs de deploy: `vercel.json` (api + mobile), `eas.json` con tres profiles, `Info.plist` y `android.permissions` con textos ES, CI GitHub Actions (install + typecheck + test).
- Documentación de despliegue completa en `docs/deployment.md`.
