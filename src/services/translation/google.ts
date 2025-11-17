/**
 * Google Translate Service
 * 
 * Free translation for all users, fallback for VIP users.
 */

import type { Env } from '~/types';

export interface GoogleTranslationResult {
  text: string;
  sourceLanguage?: string;
}

/**
 * Translate text using Google Translate API
 * 
 * Note: This is a simplified implementation using Google Cloud Translation API.
 * You need to set up GOOGLE_TRANSLATE_API_KEY in your environment.
 */
export async function translateWithGoogle(
  text: string,
  targetLanguage: string,
  sourceLanguage: string | undefined,
  env: Env
): Promise<GoogleTranslationResult> {
  const apiKey = env.GOOGLE_TRANSLATE_API_KEY;
  
  // If no API key, use a free alternative (MyMemory API)
  if (!apiKey) {
    return await translateWithMyMemory(text, targetLanguage, sourceLanguage);
  }

  try {
    const url = new URL('https://translation.googleapis.com/language/translate/v2');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('q', text);
    url.searchParams.set('target', targetLanguage);
    if (sourceLanguage) {
      url.searchParams.set('source', sourceLanguage);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Translate API error: ${response.status} - ${error}`);
    }

    interface GoogleTranslateResponse {
      data?: {
        translations?: Array<{
          translatedText?: string;
          detectedSourceLanguage?: string;
        }>;
      };
    }
    const data = await response.json() as GoogleTranslateResponse;
    const translatedText = data.data?.translations?.[0]?.translatedText;
    const detectedSourceLanguage = data.data?.translations?.[0]?.detectedSourceLanguage;

    if (!translatedText) {
      throw new Error('Empty translation result from Google');
    }

    return {
      text: translatedText,
      sourceLanguage: detectedSourceLanguage || sourceLanguage || 'auto',
    };
  } catch (error) {
    console.error('[translateWithGoogle] Error:', error);
    throw error;
  }
}

/**
 * Fallback: Use MyMemory Translation API (free, no API key required)
 * 
 * Limitations:
 * - 5000 chars/day limit per IP
 * - Lower quality than Google Translate
 * - Good for development/testing
 */
async function translateWithMyMemory(
  text: string,
  targetLanguage: string,
  sourceLanguage: string | undefined
): Promise<GoogleTranslationResult> {
  try {
    const url = new URL('https://api.mymemory.translated.net/get');
    url.searchParams.set('q', text);
    url.searchParams.set('langpair', `${sourceLanguage || 'auto'}|${targetLanguage}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      throw new Error(`MyMemory API error: ${response.status}`);
    }

    interface MyMemoryResponse {
      responseData?: {
        translatedText?: string;
      };
    }
    const data = await response.json() as MyMemoryResponse;
    const translatedText = data.responseData?.translatedText;

    if (!translatedText) {
      throw new Error('Empty translation result from MyMemory');
    }

    return {
      text: translatedText,
      sourceLanguage: sourceLanguage || 'auto',
    };
  } catch (error) {
    console.error('[translateWithMyMemory] Error:', error);
    throw error;
  }
}

