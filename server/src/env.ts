import { fileURLToPath } from 'node:url';
import { z } from 'zod';

try {
  process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)));
} catch {
  try {
    process.loadEnvFile(); // fallback to current working directory or cloud environment variables
  } catch {
    // no .env file, which is normal in production
  }
}

const Env = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url().default('https://placeholder.supabase.co'),
  SUPABASE_ANON_KEY: z.string().min(1).default('placeholder-anon-key'),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().min(1).default('gemini-3.5-flash'),
  AI_DAILY_LIMIT: z.coerce.number().int().positive().default(40),
});

const parsed = Env.safeParse(process.env);
if (!parsed.success || (parsed.data.NODE_ENV === 'production' && parsed.data.SUPABASE_URL === 'https://placeholder.supabase.co')) {
  const problems = parsed.success
    ? ['  SUPABASE_URL: Must be configured in production']
    : Object.entries(parsed.error.flatten().fieldErrors).map(([key, errors]) => `  ${key}: ${errors?.join(', ')}`);
  console.error(`Invalid environment. Fix these variables (see server/.env.example):\n${problems.join('\n')}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
