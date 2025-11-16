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
  const location = env.GEMINI_LOCATION || 'us-central1';

  if (!apiKey) {
    throw new Error('Missing GOOGLE_GEMINI_API_KEY for Gemini translation');
  }
  if (!projectId) {
    throw new Error('Missing GEMINI_PROJECT_ID for Gemini translation request');
  }

  const prompt = buildGeminiPrompt(text, targetLanguage, sourceLanguage);
  const modelList =
    env.GEMINI_MODELS?.split(',').map(model => model.trim()).filter(Boolean) || DEFAULT_GEMINI_MODELS;

  let lastError: Error | string | null = null;

  for (const model of modelList) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      console.log(`[translateWithGemini] Trying model: ${model}`);
      console.log(`[translateWithGemini] URL: ${url.replace(apiKey, '***')}`);
      console.log(`[translateWithGemini] Prompt: ${prompt.substring(0, 100)}...`);

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

      console.log(`[translateWithGemini] Response status: ${response.status}`);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[translateWithGemini] API error: ${errorBody}`);
        throw new Error(`Gemini API error (model ${model}): ${response.status} - ${errorBody}`);
      }

      const data = (await response.json()) as any;
      console.log(`[translateWithGemini] Response data:`, JSON.stringify(data).substring(0, 200));

      const candidate = data?.candidates?.[0];
      const translatedText =
        (typeof candidate?.content?.parts?.[0]?.text === 'string' &&
          candidate.content.parts[0].text.trim()) ||
        (Array.isArray(candidate?.content?.parts)
          ? candidate.content.parts.map((part: any) => part.text || '').join(' ').trim()
          : '') ||
        (typeof candidate?.content === 'string' && candidate.content.trim()) ||
        '';

      if (!translatedText) {
        console.error(`[translateWithGemini] Empty translation from model ${model}`);
        throw new Error(`Gemini model ${model} returned empty translation`);
      }

      console.log(`[translateWithGemini] ✅ Translation successful with model ${model}`);
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
  if (sourceLanguage) {
    return `Translate the following text from ${sourceLanguage} to ${targetLanguage}:\n\n${text}`;
  }
  return `Translate the following text to ${targetLanguage}:\n\n${text}`;
}

