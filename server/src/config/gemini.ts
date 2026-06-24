import { GoogleGenAI } from '@google/genai';
import { env } from './env';
import { logger } from '../utils/logger';

let aiClient: GoogleGenAI;

try {
  aiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  logger.info('✔ Google Gen AI SDK initialized successfully');
} catch (error) {
  logger.error({ error }, '❌ Failed to initialize Google Gen AI SDK');
  process.exit(1);
}

export const ai = aiClient;
