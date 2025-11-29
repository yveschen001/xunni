import type { Env } from '~/types';

export interface GeminiTranslationResult {
  text: string;
  sourceLanguage?: string;
  success: boolean;
  error?: string;
}

const DEFAULT_GEMINI_MODELS = ['gemini-2.0-flash-exp', 'gemini-2.5-flash-lite'];

export async function translateWithGemini(
  text: string,
  targetLanguage: string,
  sourceLanguage: string | undefined,
  env: Env
): Promise<GeminiTranslationResult> {
  const apiKey = env.GOOGLE_GEMINI_API_KEY;
  const projectId = env.GEMINI_PROJECT_ID;

  if (!apiKey) {
    throw new Error('Missing GOOGLE_GEMINI_API_KEY for Gemini translation');
  }
  if (!projectId) {
    throw new Error('Missing GEMINI_PROJECT_ID for Gemini translation request');
  }

  const prompt = buildGeminiPrompt(text, targetLanguage, sourceLanguage);
  const modelList =
    env.GEMINI_MODELS?.split(',')
      .map((model) => model.trim())
      .filter(Boolean) || DEFAULT_GEMINI_MODELS;

  let lastError: Error | string | null = null;

  for (const model of modelList) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      console.error(`[translateWithGemini] Trying model: ${model}`);
      console.error(`[translateWithGemini] URL: ${url.replace(apiKey, '***')}`);
      console.error(`[translateWithGemini] Prompt: ${prompt.substring(0, 100)}...`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      console.error(`[translateWithGemini] Response status: ${response.status}`);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[translateWithGemini] API error: ${errorBody}`);
        throw new Error(`Gemini API error (model ${model}): ${response.status} - ${errorBody}`);
      }

      interface GeminiResponse {
        candidates?: Array<{
          content?:
            | {
                parts?: Array<{ text?: string }>;
              }
            | string;
        }>;
      }

      const data = (await response.json()) as GeminiResponse;
      console.error(`[translateWithGemini] Response data:`, JSON.stringify(data).substring(0, 200));

      const candidate = data?.candidates?.[0];
      const translatedText =
        (typeof candidate?.content?.parts?.[0]?.text === 'string' &&
          candidate.content.parts[0].text.trim()) ||
        (Array.isArray(candidate?.content?.parts)
          ? candidate.content.parts
              .map((part: { text?: string }) => part.text || '')
              .join(' ')
              .trim()
          : '') ||
        (typeof candidate?.content === 'string' && candidate.content.trim()) ||
        '';

      if (!translatedText) {
        console.error(`[translateWithGemini] Empty translation from model ${model}`);
        throw new Error(`Gemini model ${model} returned empty translation`);
      }

      console.error(`[translateWithGemini] ✅ Translation successful with model ${model}`);
      return {
        text: translatedText,
        sourceLanguage: sourceLanguage || 'auto',
        success: true,
      };
    } catch (error) {
      console.error('[translateWithGemini] Error with model', model, error);
      lastError = error instanceof Error ? error : String(error);
    }
  }

  return {
    text,
    sourceLanguage: sourceLanguage || 'auto',
    success: false,
    error: lastError instanceof Error ? lastError.message : String(lastError || 'Unknown error'),
  };
}

function buildGeminiPrompt(text: string, targetLanguage: string, sourceLanguage?: string): string {
  const languageMap: Record<string, string> = {
    'zh-TW': 'Traditional Chinese (Taiwan)',
    'zh-CN': 'Simplified Chinese',
    en: 'English',
    ja: 'Japanese',
    ko: 'Korean',
    th: 'Thai',
    vi: 'Vietnamese',
    id: 'Indonesian',
    ms: 'Malay',
    tl: 'Filipino',
    es: 'Spanish',
    pt: 'Portuguese',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    ru: 'Russian',
    ar: 'Arabic',
    hi: 'Hindi',
    bn: 'Bengali',
    tr: 'Turkish',
    pl: 'Polish',
    uk: 'Ukrainian',
    nl: 'Dutch',
    sv: 'Swedish',
    no: 'Norwegian',
    da: 'Danish',
    fi: 'Finnish',
    cs: 'Czech',
    el: 'Greek',
    he: 'Hebrew',
    fa: 'Persian',
    ur: 'Urdu',
    sw: 'Swahili',
    ro: 'Romanian',
  };

  const targetLangName = languageMap[targetLanguage] || targetLanguage;
  const sourceLangName = sourceLanguage
    ? languageMap[sourceLanguage] || sourceLanguage
    : 'the source language';

  return `You are a professional translator. Translate the following text from ${sourceLangName} to ${targetLangName}.

CRITICAL RULES:
1. Return ONLY the translated text
2. Do NOT add any explanations, notes, or comments
3. Do NOT explain translation choices
4. Do NOT add context or clarifications
5. Use natural, localized expressions appropriate for ${targetLangName}
6. Preserve the original tone and style
7. If the text contains internet slang or informal expressions, translate them to equivalent natural expressions in ${targetLangName}

Text to translate:
${text}`;
}
