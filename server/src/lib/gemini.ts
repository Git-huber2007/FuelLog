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
  for (let attempt = 1; ; attempt++) {
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
          abortSignal: AbortSignal.timeout(20_000),
          // 2.5 Flash thinks by default and thinking tokens count against maxOutputTokens, which truncates the JSON.
          ...(MODEL.includes('2.5-flash') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
      });
      text = res.text;
    } catch {
      throw new HttpError(502, 'ai_unavailable', 'The AI service did not answer. Try again in a moment, or log it manually.');
    }
    try {
      return opts.validate.parse(JSON.parse(text ?? ''));
    } catch {
      if (attempt === 2) throw new HttpError(502, 'ai_bad_response', 'The AI gave an answer we could not use. Try rewording it, or log it manually.');
    }
  }
}
