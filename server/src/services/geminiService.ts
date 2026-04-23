import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEYS = Array.from(
  new Set(
    [
      process.env.GEMINI_KEY_1,
      process.env.GEMINI_KEY_2,
      process.env.GEMINI_KEY_3,
      process.env.GEMINI_KEY_4,
      process.env.GEMINI_KEY_5,
      process.env.GEMINI_KEY_6,
      process.env.GEMINI_API_KEY, // legacy fallback
    ]
      .map((key) => key?.trim())
      .filter(Boolean)
  )
) as string[];

const ROTATION_ERROR_HINTS = [
  '429',
  'quota',
  'rate',
  'limit',
  'resource_exhausted',
  'api key not valid',
  'permission denied',
  'invalid api key',
];

const RETRYABLE_ERROR_HINTS = [
  'timeout',
  'timed out',
  'unavailable',
  '503',
  'internal',
  'network',
  'connection',
];

const MAX_TOTAL_ATTEMPTS = Math.max(2, GEMINI_KEYS.length * 2);

let currentKeyIndex = 0;

function ensureKeysConfigured(): void {
  if (!GEMINI_KEYS.length) {
    throw new Error('No Gemini API keys are configured on the server.');
  }
}

function getClient(): GoogleGenerativeAI {
  ensureKeysConfigured();
  return new GoogleGenerativeAI(GEMINI_KEYS[currentKeyIndex]);
}

function rotateKey(): boolean {
  if (GEMINI_KEYS.length <= 1) return false;
  const next = (currentKeyIndex + 1) % GEMINI_KEYS.length;
  if (next === currentKeyIndex) return false;
  currentKeyIndex = next;
  console.log(`🔄 Rotated to Gemini key #${currentKeyIndex + 1}`);
  return true;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.toLowerCase();
  return String(error || '').toLowerCase();
}

function shouldRotate(error: unknown): boolean {
  const message = errorMessage(error);
  return ROTATION_ERROR_HINTS.some((hint) => message.includes(hint));
}

function shouldRetry(error: unknown): boolean {
  const message = errorMessage(error);
  return RETRYABLE_ERROR_HINTS.some((hint) => message.includes(hint));
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getGeminiHealth() {
  return {
    configuredKeys: GEMINI_KEYS.length,
    activeKeyIndex: GEMINI_KEYS.length ? currentKeyIndex + 1 : 0,
  };
}

/**
 * Call Gemini with automatic key rotation on quota/invalid-key errors and
 * retries on transient outages.
 */
export async function generateWithFallback(
  modelName: string,
  prompt: string | (string | object)[],
  attempt = 0
): Promise<string> {
  ensureKeysConfigured();

  let currentAttempt = attempt;
  let lastError: unknown;

  while (currentAttempt < MAX_TOTAL_ATTEMPTS) {
    try {
      const client = getClient();
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt as any);
      return result.response.text();
    } catch (error: unknown) {
      lastError = error;
      const rotated = shouldRotate(error) && rotateKey();
      const retryable = shouldRetry(error);

      if (!rotated && !retryable) {
        throw error;
      }

      currentAttempt += 1;
      if (currentAttempt >= MAX_TOTAL_ATTEMPTS) break;
      await wait(Math.min(1200, 200 + currentAttempt * 250));
    }
  }

  throw new Error(
    `Gemini service is unavailable after retries. ${
      lastError instanceof Error ? lastError.message : 'Please try again.'
    }`
  );
}

export { GEMINI_KEYS };
