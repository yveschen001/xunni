/**
 * OpenAI Service
 * Based on @doc/TRANSLATION_STRATEGY.md
 *
 * Provides translation and content moderation using OpenAI API.
 */

import type { Env, TranslationResult } from '~/types';

// ============================================================================
// OpenAI API Client
// ============================================================================

export class OpenAIService {
  private apiKey: string;
  private model: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor(env: Env) {
    this.apiKey = env.OPENAI_API_KEY;
    this.model = env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  /**
   * Translate text using OpenAI
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    try {
      const prompt = this.buildTranslationPrompt(text, targetLanguage, sourceLanguage);

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
              content:
                'You are a professional translator. Translate the given text naturally and accurately. Return only the translated text without any explanations.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[OpenAI] Translation failed:', error);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      interface OpenAIResponse {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      }
      const data = (await response.json()) as OpenAIResponse;
      const translatedText = data.choices?.[0]?.message?.content?.trim();

      if (!translatedText) {
        throw new Error('No translation returned');
      }

      return {
        translated_text: translatedText,
        provider: 'openai',
        success: true,
      };
    } catch (error) {
      console.error('[OpenAI] Translation error:', error);
      return {
        translated_text: text, // Return original text on error
        provider: 'openai',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Moderate content using OpenAI
   */
  async moderateContent(text: string): Promise<{
    flagged: boolean;
    categories?: string[];
    score?: number;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/moderations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[OpenAI] Moderation failed:', error);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      interface ModerationResponse {
        results?: Array<{
          flagged?: boolean;
          categories?: Record<string, boolean>;
        }>;
      }
      const data = (await response.json()) as ModerationResponse;
      const result = data.results?.[0];

      const flaggedCategories: string[] = [];
      if (result.categories) {
        for (const [category, flagged] of Object.entries(result.categories)) {
          if (flagged) {
            flaggedCategories.push(category);
          }
        }
      }

      return {
        flagged: result.flagged,
        categories: flaggedCategories,
        score: result.category_scores
          ? Math.max(...Object.values(result.category_scores as Record<string, number>))
          : undefined,
      };
    } catch (error) {
      console.error('[OpenAI] Moderation error:', error);
      // On error, return not flagged to avoid blocking legitimate content
      return {
        flagged: false,
      };
    }
  }

  /**
   * Build translation prompt
   */
  private buildTranslationPrompt(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): string {
    if (sourceLanguage) {
      return `Translate the following text from ${sourceLanguage} to ${targetLanguage}:\n\n${text}`;
    }
    return `Translate the following text to ${targetLanguage}:\n\n${text}`;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create OpenAI service instance
 */
export function createOpenAIService(env: Env): OpenAIService {
  return new OpenAIService(env);
}

