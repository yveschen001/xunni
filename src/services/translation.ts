
import type { Env } from '~/types';
import { SUPPORTED_LANGUAGES } from '~/i18n/languages';

export class TranslationService {
  private apiKey: string;
  private model: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor(env: Env) {
    this.apiKey = env.OPENAI_API_KEY || '';
    this.model = env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  /**
   * Batch translate text to all supported languages
   * @param text Text to translate
   * @returns Map of language code to translated text
   */
  async batchTranslate(text: string): Promise<Record<string, string>> {
    if (!this.apiKey) {
      console.error('[TranslationService] No OpenAI API key found');
      // Fallback: return original text for all languages
      return this.getFallbackTranslations(text);
    }

    try {
      const targetLanguages = SUPPORTED_LANGUAGES.map((l) => l.code).join(', ');
      const prompt = `
You are a professional translator. Translate the following text into these languages: ${targetLanguages}.
Return ONLY a JSON object where keys are the language codes and values are the translations.
Ensure the tone is friendly and appropriate for a social app.

Text to translate:
"${text}"
`;

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that translates text into multiple languages and returns JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const translations = JSON.parse(content);
      
      // Validate keys and fill missing ones with fallback
      const result: Record<string, string> = {};
      for (const lang of SUPPORTED_LANGUAGES) {
        result[lang.code] = translations[lang.code] || text;
      }

      return result;
    } catch (error) {
      console.error('[TranslationService] Batch translation failed:', error);
      return this.getFallbackTranslations(text);
    }
  }

  private getFallbackTranslations(text: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const lang of SUPPORTED_LANGUAGES) {
      result[lang.code] = text;
    }
    return result;
  }
}

