/**
 * Translation Service
 *
 * Unified translation service with VIP/Free tier support.
 */

import type { Env } from '~/types';
import { translateWithGemini } from '../gemini';
import { translateWithOpenAI } from './openai';

import { TranslationLogService } from '~/services/translation_log';
import { createDatabaseClient } from '~/db/client';

export enum TranslationProvider {
  OPENAI = 'openai',
  GOOGLE = 'google',
  MYMEMORY = 'mymemory',
  GEMINI = 'gemini',
}

export interface TranslationResult {
  text: string;
  provider: TranslationProvider;
  sourceLanguage: string;
  targetLanguage: string;
  fallback: boolean; // Whether fallback was used
  cost?: number; // Tokens or API calls
  error?: string; // Error message if any
}

/**
 * Translate text with automatic provider selection based on VIP status
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string | undefined,
  isVip: boolean,
  env: Env,
  userId?: string // Optional for logging
): Promise<TranslationResult> {
  const db = createDatabaseClient(env.DB);
  const logService = new TranslationLogService(db);
  const normalizedTarget = normalizeLanguageCode(targetLanguage);

  const normalizedSource = sourceLanguage ? normalizeLanguageCode(sourceLanguage) : undefined;

  // Skip translation if source and target are the same
  if (normalizedSource && normalizedSource === normalizedTarget) {
    return {
      text,
      provider: TranslationProvider.GEMINI,
      sourceLanguage: normalizedSource,
      targetLanguage: normalizedTarget,
      fallback: false,
    };
  }

  if (isVip) {
    try {
      const result = await translateWithOpenAI(text, normalizedTarget, normalizedSource, env);

      // Log success usage
      if (userId) {
        // Use ctx.waitUntil if available in env, or fire and forget
        // Here we just await to ensure it runs, or we can use executionCtx if passed
        // For simplicity in this context, we await but catch errors inside logUsage
        await logService.logUsage(TranslationProvider.OPENAI, {
          tokens: result.cost,
          success: true
        });
      }

      return {
        text: result.text,
        provider: TranslationProvider.OPENAI,
        sourceLanguage: result.sourceLanguage || normalizedSource || 'auto',
        targetLanguage: normalizedTarget,
        fallback: false,
        cost: result.cost,
      };
    } catch (error) {
      console.error('[translateText] OpenAI failed, falling back to Gemini:', error);

      // Log fallback event
      if (userId) {
        await logService.logFallback(
          userId,
          TranslationProvider.OPENAI,
          TranslationProvider.GEMINI,
          error instanceof Error ? error.message : String(error)
        );
        // Also log failed usage for OpenAI
        await logService.logUsage(TranslationProvider.OPENAI, { success: false });
      }

      const geminiResult = await translateWithGemini(text, normalizedTarget, normalizedSource, env);

      if (geminiResult.success) {
        if (userId) {
          await logService.logUsage(TranslationProvider.GEMINI, { success: true });
        }
        return {
          text: geminiResult.text,
          provider: TranslationProvider.GEMINI,
          sourceLanguage: geminiResult.sourceLanguage || normalizedSource || 'auto',
          targetLanguage: normalizedTarget,
          fallback: true,
          error: geminiResult.error || 'OpenAI translation failed, using Gemini',
        };
      }

      console.error('[translateText] Gemini fallback also failed:', geminiResult.error);
      if (userId) {
        await logService.logUsage(TranslationProvider.GEMINI, { success: false });
      }
      
      return {
        text,
        provider: TranslationProvider.GEMINI,
        sourceLanguage: normalizedSource || 'auto',
        targetLanguage: normalizedTarget,
        fallback: true,
        error: 'OpenAI and Gemini translation both failed',
      };
    }
  }

  try {
    const geminiResult = await translateWithGemini(text, normalizedTarget, normalizedSource, env);

    if (geminiResult.success) {
      if (userId) {
        await logService.logUsage(TranslationProvider.GEMINI, { success: true });
      }
      return {
        text: geminiResult.text,
        provider: TranslationProvider.GEMINI,
        sourceLanguage: geminiResult.sourceLanguage || normalizedSource || 'auto',
        targetLanguage: normalizedTarget,
        fallback: false,
      };
    }

    throw new Error(geminiResult.error || 'Gemini translation failed');
  } catch (error) {
    console.error('[translateText] Gemini translation failed:', error);
    if (userId) {
      await logService.logUsage(TranslationProvider.GEMINI, { success: false });
    }
    return {
      text,
      provider: TranslationProvider.GEMINI,
      sourceLanguage: normalizedSource || 'auto',
      targetLanguage: normalizedTarget,
      fallback: true,
      error: error instanceof Error ? error.message : 'Gemini translation failed',
    };
  }
}

/**
 * Normalize language code to ISO 639-1 format
 *
 * Examples:
 * - zh-TW -> zh
 * - en-US -> en
 * - ja-JP -> ja
 */
function normalizeLanguageCode(code: string): string {
  // Extract base language code (before hyphen)
  const baseCode = code.split('-')[0].toLowerCase();

  // Special cases
  if (baseCode === 'zh') {
    // Keep zh-TW and zh-CN distinction
    if (code.toLowerCase().includes('tw') || code.toLowerCase().includes('hant')) {
      return 'zh-TW';
    }
    if (code.toLowerCase().includes('cn') || code.toLowerCase().includes('hans')) {
      return 'zh-CN';
    }
    return 'zh-CN'; // Default to simplified
  }

  return baseCode;
}

/**
 * Check if translation is needed
 */
export function needsTranslation(
  sourceLanguage: string | undefined,
  targetLanguage: string
): boolean {
  if (!sourceLanguage) {
    return true; // Unknown source, assume translation needed
  }

  const normalizedSource = normalizeLanguageCode(sourceLanguage);
  const normalizedTarget = normalizeLanguageCode(targetLanguage);

  return normalizedSource !== normalizedTarget;
}
