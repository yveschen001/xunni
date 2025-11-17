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

  // Build language map for better localization (34 languages)
  const languageMap: Record<string, string> = {
    'zh-TW': 'Traditional Chinese (Taiwan)', 'zh-CN': 'Simplified Chinese', 'en': 'English',
    'ja': 'Japanese', 'ko': 'Korean', 'th': 'Thai', 'vi': 'Vietnamese', 'id': 'Indonesian',
    'ms': 'Malay', 'tl': 'Filipino', 'es': 'Spanish', 'pt': 'Portuguese', 'fr': 'French',
    'de': 'German', 'it': 'Italian', 'ru': 'Russian', 'ar': 'Arabic', 'hi': 'Hindi',
    'bn': 'Bengali', 'tr': 'Turkish', 'pl': 'Polish', 'uk': 'Ukrainian', 'nl': 'Dutch',
    'sv': 'Swedish', 'no': 'Norwegian', 'da': 'Danish', 'fi': 'Finnish', 'cs': 'Czech',
    'el': 'Greek', 'he': 'Hebrew', 'fa': 'Persian', 'ur': 'Urdu', 'sw': 'Swahili', 'ro': 'Romanian',
  };

  const targetLangName = languageMap[targetLanguage] || targetLanguage;
  const sourceLangName = sourceLanguage ? languageMap[sourceLanguage] || sourceLanguage : 'the source language';

  // Build prompt
  const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}.

CRITICAL RULES:
1. Return ONLY the translated text
2. Do NOT add any explanations, notes, or comments
3. Do NOT explain translation choices or provide alternatives
4. Do NOT add context, clarifications, or meta-commentary
5. Use natural, localized expressions appropriate for ${targetLangName}
6. Preserve the original tone and style
7. If the text contains internet slang or informal expressions, translate them to equivalent natural expressions in ${targetLangName}

Text to translate:
${text}`;

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
            content: 'You are a professional translator. Your task is to translate text accurately and naturally. Return ONLY the translated text without any explanations, notes, or meta-commentary.',
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

    interface OpenAITranslationResponse {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
      usage?: {
        total_tokens?: number;
      };
    }
    const data = await response.json() as OpenAITranslationResponse;
    const translatedText = data.choices?.[0]?.message?.content?.trim();
    
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

    interface LanguageDetectionResponse {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    }
    const data = await response.json() as LanguageDetectionResponse;
    const languageCode = data.choices[0]?.message?.content?.trim().toLowerCase();
    
    return languageCode || 'en';
  } catch (error) {
    console.error('[detectLanguage] Error:', error);
    return 'en'; // Default to English
  }
}

