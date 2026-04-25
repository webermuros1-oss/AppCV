import { API_ROUTES } from '@app/shared';
import type {
  ApiErrorBody,
  StartSessionRequest,
  StartSessionResponse,
  SendTurnRequest,
  SendTurnResponse,
  EndSessionRequest,
  EndSessionResponse,
} from '@app/shared';

declare const process: { env: Record<string, string | undefined> };

function readApiUrl(): string {
  // Acceso directo con punto: el plugin de Babel de Expo solo inlinea
  // process.env.EXPO_PUBLIC_* cuando se lee así, no con corchetes.
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (typeof url === 'string' && url.length > 0) return url;
  return 'http://localhost:3000';
}

export const API_BASE_URL = readApiUrl();

export interface ApiClient {
  startSession(req: StartSessionRequest): Promise<StartSessionResponse>;
  sendTurn(req: SendTurnRequest): Promise<SendTurnResponse>;
  endSession(req: EndSessionRequest): Promise<EndSessionResponse>;
}

async function post<TReq, TRes>(
  baseUrl: string,
  path: string,
  body: TReq,
): Promise<TRes> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error de red.';
    throw new Error(`No se pudo contactar con el backend (${baseUrl}): ${msg}`);
  }

  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const errBody = (await response.json()) as ApiErrorBody;
      if (errBody?.error?.message) {
        message = errBody.error.message;
      }
    } catch {
      // respuesta sin body JSON, se queda el status por defecto
    }
    throw new Error(message);
  }

  return (await response.json()) as TRes;
}

export function createApiClient(baseUrl: string = API_BASE_URL): ApiClient {
  return {
    startSession(req) {
      return post<StartSessionRequest, StartSessionResponse>(
        baseUrl,
        API_ROUTES.startSession,
        req,
      );
    },
    sendTurn(req) {
      return post<SendTurnRequest, SendTurnResponse>(
        baseUrl,
        API_ROUTES.sendTurn,
        req,
      );
    },
    endSession(req) {
      return post<EndSessionRequest, EndSessionResponse>(
        baseUrl,
        API_ROUTES.endSession,
        req,
      );
    },
  };
}

export const apiClient: ApiClient = createApiClient();
