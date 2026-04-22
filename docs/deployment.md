# Despliegue — AppEntrevistasCV

Esta guía cubre cómo desplegar los tres artefactos del proyecto:

- **Backend (`apps/api`)** — Hono en Vercel Functions.
- **Web (`apps/mobile` compilado a estático)** — Expo web export en Vercel.
- **Móvil nativo (`apps/mobile`)** — Builds iOS/Android con EAS.

Ningún paso se automatiza desde CI; el usuario conecta cada proyecto en Vercel y Expo a mano la primera vez. CI (GitHub Actions) solo corre tests y typecheck.

---

## 1. Backend API (Vercel)

### Configuración

- Handler serverless: `apps/api/api/index.ts` (convención Vercel).
- Usa `hono/vercel` como adapter (envuelve la app fetch-style de Hono para el runtime Node de Vercel).
- `apps/api/vercel.json` tiene `buildCommand: pnpm --filter api typecheck` e `installCommand: pnpm install --frozen-lockfile`.
- `src/server.ts` se conserva como entry local (`pnpm --filter api dev`). Vercel lo ignora.

### Variables de entorno requeridas

| Variable | Dónde | Valor |
|---|---|---|
| `ANTHROPIC_API_KEY` | Project Settings → Environment Variables (Production + Preview) | clave real de Anthropic |

### Setup en Vercel (primera vez)

1. Crea un proyecto en Vercel apuntando al repo.
2. En "Root Directory" pon `apps/api`.
3. "Framework Preset": `Other`.
4. Deja que `vercel.json` defina build/install; no sobrescribas.
5. En Environment Variables añade `ANTHROPIC_API_KEY` para los tres entornos (Production, Preview, Development).
6. Deploy.

### Verificar

```bash
curl https://<tu-api>.vercel.app/health
# {"ok":true}

curl https://<tu-api>.vercel.app/
# {"name":"AppEntrevistasCV API","ok":true}
```

### Notas

- No se precompila a `dist/`; el runtime Node de Vercel compila TS en frío. El `build` script local (`tsc --noEmit`) solo valida tipos.
- CORS está abierto (`cors()` en `src/index.ts`). Ajusta con `origin: [...]` si publicas solo un dominio web.
- Estado de sesión vive en memoria del proceso (ver `project_business_decisions.md`). Vercel puede reciclar instancias, así que sesiones muy largas pueden perder estado. Documentado y aceptado por ahora.

---

## 2. Web estática (Vercel)

### Configuración

- Script: `pnpm --filter mobile build:web` → `expo export -p web` → genera `apps/mobile/dist/`.
- `apps/mobile/vercel.json` apunta ahí y añade un rewrite SPA.

### Variables de entorno requeridas

| Variable | Dónde | Valor |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Project Settings → Environment Variables | URL pública del API en Vercel (p.ej. `https://app-entrevistas-cv-api.vercel.app`) |

Las `EXPO_PUBLIC_*` se inyectan en build time; si cambias la URL hay que re-deployar la web.

### Setup en Vercel

1. Crea un **segundo proyecto** Vercel para `apps/mobile`.
2. Root Directory: `apps/mobile`.
3. Framework Preset: `Other`.
4. Environment Variables: `EXPO_PUBLIC_API_URL` apuntando al API ya desplegado.
5. Deploy.

### Verificar

Abre la URL pública y verifica que se conecta al API (inspector → Network). Si ves CORS error, revisa que el `cors()` de Hono permita el origen.

---

## 3. Móvil nativo (EAS)

### Configuración

- `apps/mobile/app.json`:
  - `ios.bundleIdentifier`: `com.appentrevistascv.app`
  - `android.package`: `com.appentrevistascv.app`
  - `ios.infoPlist.NSMicrophoneUsageDescription` y `NSSpeechRecognitionUsageDescription` ya puestos (ES).
  - `android.permissions` incluye `RECORD_AUDIO`.
  - `owner`: **debes reemplazar `"TODO-EXPO-USERNAME"` por tu username/organización de Expo** antes del primer build.
- `apps/mobile/eas.json` con tres profiles:
  - `development` — dev client, distribución interna, iOS simulator.
  - `preview` — APK para Android, simulator para iOS, distribución interna.
  - `production` — store-ready, `autoIncrement` de versión.

### Flujo típico

```bash
# Una vez por máquina
npm install -g eas-cli
eas login

# Desde apps/mobile (o con pnpm --filter mobile ...)
cd apps/mobile
eas build:configure    # solo la primera vez; genera credenciales

# Builds
pnpm --filter mobile eas:build:preview      # APK/simulator para pruebas internas
pnpm --filter mobile eas:build:production   # listo para App Store / Play Store
```

### Variables de entorno

`EXPO_PUBLIC_API_URL` debe estar disponible en el entorno donde corre `eas build`. En EAS cloud se configura con:

```bash
eas env:create --scope project --name EXPO_PUBLIC_API_URL --value https://<api>.vercel.app
```

O edita `eas.json` añadiendo `env: { EXPO_PUBLIC_API_URL: "..." }` dentro de cada profile.

### Permisos en review de App Store

Apple revisa los textos de `NSMicrophoneUsageDescription` y `NSSpeechRecognitionUsageDescription`. Ya están en español y son descriptivos; si la app acaba con copy en inglés, tradúcelos.

---

## 4. Desarrollo local

```bash
# Setup (primera vez)
cp .env.example .env      # rellena ANTHROPIC_API_KEY
pnpm install

# Backend
pnpm --filter api dev     # http://localhost:3000

# Expo (en otra terminal)
pnpm --filter mobile start
# w = web, i = iOS simulator, a = Android emulator
```

---

## 5. CI (GitHub Actions)

`.github/workflows/ci.yml` se dispara en push a `main` y en cualquier PR. Un solo job:

1. Checkout
2. Setup pnpm 9.12.0 + Node 20 (con cache de pnpm)
3. `pnpm install --frozen-lockfile`
4. `pnpm -r --parallel typecheck`
5. `pnpm test`

### Cómo leer un fallo

- **Install** falla → lockfile desincronizado. Corre `pnpm install` localmente, commitea `pnpm-lock.yaml`.
- **Typecheck** falla → el log lista `error TS....`. Reproduce con `pnpm typecheck`.
- **Tests** falla → reproduce con `pnpm test` o `pnpm --filter <workspace> test`.

No hay deploy automático desde CI; Vercel se conecta al repo aparte y deploya en su propio pipeline.

---

## Checklist — primer deploy

- [ ] `ANTHROPIC_API_KEY` lista en el dashboard.
- [ ] Crear proyecto Vercel para `apps/api`, Root Directory = `apps/api`, añadir env vars, deploy, probar `/health`.
- [ ] Crear proyecto Vercel para `apps/mobile`, Root Directory = `apps/mobile`, añadir `EXPO_PUBLIC_API_URL` = URL del api anterior, deploy.
- [ ] (Opcional, móvil) Reemplazar `owner: "TODO-EXPO-USERNAME"` en `apps/mobile/app.json` por tu username de Expo.
- [ ] (Opcional, móvil) `eas login` y `eas build:configure` desde `apps/mobile`.
- [ ] (Opcional, móvil) Configurar `EXPO_PUBLIC_API_URL` en EAS.
- [ ] (Opcional, móvil) `pnpm --filter mobile eas:build:preview` y probar el APK/simulator build.
- [ ] Conectar el repo a GitHub y verificar que el workflow `CI` pasa en verde.
