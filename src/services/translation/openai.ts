/**
 * OpenAI Translation Service
 * 
 * High-quality translation for VIP users using GPT-4o-mini.
 */

import type { Env } from '~/types';

export interface OpenAITranslationResult {
  text: string;
  cost: number; // Estimated tokens used
  sourceLanguage?: string;
}

/**
 * Translate text using OpenAI GPT-4o-mini
 */
export async function translateWithOpenAI(
  text: string,
  targetLanguage: string,
  sourceLanguage: string | undefined,
  env: Env
): Promise<OpenAITranslationResult> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // Build prompt
  const prompt = sourceLanguage
    ? `Translate the following text from ${sourceLanguage} to ${targetLanguage}. Only return the translated text, nothing else:\n\n${text}`
    : `Translate the following text to ${targetLanguage}. Only return the translated text, nothing else:\n\n${text}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Translate the text accurately and naturally.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    const translatedText = data.choices[0]?.message?.content?.trim();
    
    if (!translatedText) {
      throw new Error('Empty translation result from OpenAI');
    }

    // Estimate cost (tokens used)
    const tokensUsed = data.usage?.total_tokens || 0;

    return {
      text: translatedText,
      cost: tokensUsed,
      sourceLanguage: sourceLanguage || 'auto',
    };
  } catch (error) {
    console.error('[translateWithOpenAI] Error:', error);
    throw error;
  }
}

/**
 * Detect language using OpenAI (optional)
 */
export async function detectLanguage(
  text: string,
  env: Env
): Promise<string> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a language detector. Return only the ISO 639-1 language code (e.g., "en", "zh", "ja").',
          },
          {
            role: 'user',
            content: `Detect the language of this text:\n\n${text}`,
          },
        ],
        temperature: 0,
        max_tokens: 10,
      }),
      signal: AbortSignal.timeout(3000), // 3s timeout
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const languageCode = data.choices[0]?.message?.content?.trim().toLowerCase();
    
    return languageCode || 'en';
  } catch (error) {
    console.error('[detectLanguage] Error:', error);
    return 'en'; // Default to English
  }
}

