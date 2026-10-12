import { GoogleGenAI } from '@google/genai';
import type { ZodType, ZodTypeDef } from 'zod';
import { env } from '../env';
import { HttpError } from '../middleware/errors';

const MODEL = env.GEMINI_MODEL;
let ai: GoogleGenAI | undefined; // created on first use so the server still boots without a key

export const aiEnabled = () => env.GEMINI_API_KEY !== '';

export async function generateJson<T>(opts: {
  system: string;
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
  responseSchema: object;
  validate: ZodType<T, ZodTypeDef, unknown>;
}): Promise<T> {
  ai ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const deadline = Date.now() + 25_000;
  let retriedTransient = false;

  for (let attempt = 1; ; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 500) {
      throw new HttpError(502, 'ai_unavailable', 'The AI service did not answer. Try again in a moment, or log it manually.');
    }
    let text: string | undefined;
    try {
      const res = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts: opts.parts }],
        config: {
          systemInstruction: opts.system,
          responseMimeType: 'application/json',
          responseSchema: opts.responseSchema,
          temperature: 0.2,
          maxOutputTokens: 2048,
          abortSignal: AbortSignal.timeout(remaining),
          // Flash models think by default and thinking tokens count against maxOutputTokens, which truncates the JSON.
          ...(MODEL.includes('flash') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
      });
      text = res.text;
    } catch (err) {
      const status = (err as { status?: number; statusCode?: number } | null | undefined)?.status
        ?? (err as { status?: number; statusCode?: number } | null | undefined)?.statusCode;
      const name = (err as Error | null | undefined)?.name ?? 'error';
      console.error(`Gemini generateContent error: ${status ?? name}`);

      const isBusy = status === 503 || status === 429;
      if (isBusy && !retriedTransient && deadline - Date.now() > 2_000) {
        retriedTransient = true;
        await new Promise((r) => setTimeout(r, 1_000));
        continue;
      }
      throw new HttpError(502, 'ai_unavailable', 'The AI service did not answer. Try again in a moment, or log it manually.');
    }
    try {
      return opts.validate.parse(JSON.parse(text ?? ''));
    } catch {
      if (attempt === 2 || deadline - Date.now() <= 2_000) {
        throw new HttpError(502, 'ai_bad_response', 'The AI gave an answer we could not use. Try rewording it, or log it manually.');
      }
    }
  }
}
