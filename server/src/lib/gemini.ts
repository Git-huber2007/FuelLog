import { GoogleGenAI } from '@google/genai';
import type { ZodType, ZodTypeDef } from 'zod';
import { env } from '../env';
import { HttpError } from '../middleware/errors';

let ai: GoogleGenAI | undefined; // created on first use so the server still boots without a key

export const aiEnabled = () => env.GEMINI_API_KEY !== '';

const getCandidateModels = () => [
  env.GEMINI_MODEL,
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
].filter((m, i, arr) => Boolean(m) && arr.indexOf(m) === i);

export async function generateJson<T>(opts: {
  system: string;
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
  responseSchema: object;
  validate: ZodType<T, ZodTypeDef, unknown>;
}): Promise<T> {
  ai ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const deadline = Date.now() + 25_000;
  let lastStatus: number | undefined;
  let badAnswerRetries = 0;

  const candidateModels = getCandidateModels();

  for (const model of candidateModels) {
    const remaining = deadline - Date.now();
    if (remaining <= 500) {
      break;
    }

    let text: string | undefined;
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: opts.parts }],
        config: {
          systemInstruction: opts.system,
          responseMimeType: 'application/json',
          responseSchema: opts.responseSchema,
          temperature: 0.2,
          maxOutputTokens: 2048,
          abortSignal: AbortSignal.timeout(remaining),
        },
      });
      text = res.text;
    } catch (err) {
      if (err instanceof HttpError) throw err;
      const status = (err as { status?: number; statusCode?: number } | null | undefined)?.status
        ?? (err as { status?: number; statusCode?: number } | null | undefined)?.statusCode;
      const name = (err as Error | null | undefined)?.name ?? 'error';
      const msg = (err as Error | null | undefined)?.message ?? '';
      console.error(`Gemini generateContent error on model ${model}: ${status ?? name} - ${msg.slice(0, 100)}`);

      lastStatus = status;
      // Fall back to the next candidate model on transient failures (busy, quota, not found)
      if ((status === 503 || status === 429 || status === 404) && deadline - Date.now() > 2_000) {
        continue;
      }
      throw new HttpError(502, 'ai_unavailable', 'The AI service did not answer. Try again in a moment, or log it manually.');
    }

    try {
      return opts.validate.parse(JSON.parse(text ?? ''));
    } catch {
      badAnswerRetries++;
      if (badAnswerRetries > 1 || deadline - Date.now() <= 2_000) {
        throw new HttpError(502, 'ai_bad_response', 'The AI gave an answer we could not use. Try rewording it, or log it manually.');
      }
    }
  }

  if (lastStatus === 429) {
    throw new HttpError(429, 'ai_quota_exceeded', 'The AI service daily rate limit or quota has been reached. Try again later, or log your entry manually.');
  }
  if (lastStatus === 503) {
    throw new HttpError(503, 'ai_unavailable', 'The AI service is experiencing high demand. Try again in a moment, or log it manually.');
  }
  throw new HttpError(502, 'ai_unavailable', 'The AI service did not answer. Try again in a moment, or log it manually.');
}

