import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY || '';

/**
 * Validates if Groq API is configured on the server.
 * Note: GROQ_API_KEY must NEVER be exposed as NEXT_PUBLIC_ to the client.
 */
export const isGroqConfigured = Boolean(
  apiKey &&
  !apiKey.includes('placeholder') &&
  apiKey.length > 5
);

let cachedClient: Groq | null = null;

export function getGroqClient(): Groq | null {
  if (!isGroqConfigured) return null;
  if (!cachedClient) {
    cachedClient = new Groq({ apiKey });
  }
  return cachedClient;
}

/**
 * Current vision-capable models on Groq (ordered by current active support).
 * 1. qwen/qwen3.8-27b (Featured multimodal vision model on Groq)
 * 2. llama-3.2-11b-vision-preview (Fallback vision model)
 * 3. llama-3.2-90b-vision-preview
 */
export const GROQ_VISION_MODELS = [
  'qwen/qwen3.8-27b',
  'llama-3.2-11b-vision-preview',
  'llama-3.2-90b-vision-preview',
];

/**
 * Fast reasoning and text models for incident extraction.
 */
export const GROQ_TEXT_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];
