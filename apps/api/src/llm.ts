/**
 * Cliente LLM (Google Gemini). Singleton lazy: solo se instancia cuando se pide.
 */

import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODEL = 'gemini-2.5-flash-lite' as const;

let _client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (_client) return _client;

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GOOGLE_API_KEY no definido. Configúralo en .env (ver .env.example).',
    );
  }

  _client = new GoogleGenAI({ apiKey });
  return _client;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatParams {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
}

export async function chat(params: ChatParams): Promise<string> {
  const client = getGeminiClient();

  const contents = params.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: {
      systemInstruction: params.system,
      maxOutputTokens: params.maxTokens ?? 1024,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Respuesta de Gemini sin texto.');
  }
  return text.trim();
}
