# AppEntrevistasCV

App multiplataforma (iOS + Android + Web) para practicar entrevistas de trabajo por voz, diseñada especialmente para personas introvertidas. El usuario habla, la app responde con voz, y se simula una conversación de entrevista (a veces incómoda a propósito) con Claude como motor conversacional.

Este repo contiene solo la **estructura base**: scaffolding, tipos compartidos, interfaces y stubs. La lógica de negocio (prompts, motor de voz funcional, flujo de entrevista) la implementa el siguiente agente.

## Stack

- Monorepo con **pnpm workspaces**
- `apps/mobile`: Expo SDK 52 + React Native + `react-native-web` (universal iOS/Android/Web)
- `apps/api`: Node + **Hono** como proxy fino al API de Claude (desplegable en Vercel)
- `packages/shared`: tipos TypeScript compartidos
- LLM: Claude Sonnet 4.6 (`claude-sonnet-4-6`) vía `@anthropic-ai/sdk` — solo en backend
- TTS: `expo-speech` (wrapper preparado)
- STT: `Web Speech API` (web) / `@react-native-voice/voice` (nativo) tras interfaz `SpeechRecognizer`
- Estado: **Zustand**

## Requisitos

- Node 20+
- pnpm 9+ (`npm install -g pnpm`)
- Para iOS: Xcode + simulador
- Para Android: Android Studio + emulador
- Una clave de API de Anthropic (Claude)

## Setup inicial

```bash
# 1. Copia el archivo de variables de entorno
cp .env.example .env
# Edita .env y rellena ANTHROPIC_API_KEY

# 2. Instala dependencias del monorepo
pnpm install

# 3. Levanta el backend (Hono) en un terminal
pnpm --filter api dev
# Corre en http://localhost:3000

# 4. Levanta la app Expo en otro terminal
pnpm --filter mobile start
# Desde ahí: 'w' para web, 'i' para iOS, 'a' para Android
```

## Estructura

```
AppEntrevistasCV/
├── apps/
│   ├── mobile/         # Expo + React Native + react-native-web
│   └── api/            # Hono proxy a Claude (Vercel-ready)
├── packages/
│   └── shared/         # Tipos TS compartidos
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env.example
└── README.md
```

## Notas

- La clave de Anthropic **nunca** se usa desde el cliente mobile. Todo pasa por `apps/api`.
- Hoy todos los endpoints devuelven `501 Not Implemented`; el siguiente agente los rellena.
- `expo-speech` y los reconocedores de voz están como stubs que lanzan "Not implemented".

## Despliegue

Ver [`docs/deployment.md`](docs/deployment.md) para el detalle de cómo desplegar:

- **Backend (Hono)** en Vercel Functions.
- **Web estática (Expo web)** en Vercel.
- **Móvil nativo (iOS/Android)** con EAS.

Para reproducir la suite de CI localmente:

```bash
pnpm typecheck
pnpm test
```
# AppCV
