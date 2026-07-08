import { env } from '../config/env.js';
import { HttpError } from '../middleware/error.js';

export function isOpenAiConfigured(): boolean {
  return !!env.OPENAI_API_KEY;
}

/**
 * Call OpenAI's chat completions with a forced JSON-object response and return
 * the parsed result. Throws HttpError (503 unconfigured / 502 upstream / 502
 * unparseable) so callers can surface a clean error — no secrets leaked.
 */
export async function openAiJson<T>(opts: {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}): Promise<T> {
  if (!env.OPENAI_API_KEY) throw new HttpError(503, 'AI is not configured');

  let res: Response;
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: opts.model ?? 'gpt-4o-mini',
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 2000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.user },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    // Network error or timeout — don't leave the caller hanging.
    throw new HttpError(504, 'AI request timed out — please try again');
  }

  if (!res.ok) {
    throw new HttpError(502, `AI request failed (${res.status})`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? '';
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new HttpError(502, 'AI returned an unreadable response — please try again');
  }
}
