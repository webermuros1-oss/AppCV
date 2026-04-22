/**
 * Cliente Anthropic. Singleton lazy: solo se instancia cuando se pide.
 */

import Anthropic from '@anthropic-ai/sdk';

export const CLAUDE_MODEL = 'claude-sonnet-4-6' as const;

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (_client) return _client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY no definido. Configúralo en .env (ver .env.example).',
    );
  }

  _client = new Anthropic({ apiKey });
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
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: params.maxTokens ?? 1024,
    system: params.system,
    messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const firstBlock = response.content[0];
  if (!firstBlock || firstBlock.type !== 'text') {
    throw new Error('Respuesta de Claude sin bloque de texto.');
  }
  return firstBlock.text.trim();
}
