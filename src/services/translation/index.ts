/**
 * Translation Service
 * 
 * Unified translation service with VIP/Free tier support.
 */

import type { Env } from '~/types';
import { translateWithOpenAI } from './openai';
import { translateWithGoogle } from './google';

export enum TranslationProvider {
  OPENAI = 'openai',
  GOOGLE = 'google',
  MYMEMORY = 'mymemory',
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
  env: Env
): Promise<TranslationResult> {
  // Normalize language codes
  const normalizedTarget = normalizeLanguageCode(targetLanguage);
  const normalizedSource = sourceLanguage ? normalizeLanguageCode(sourceLanguage) : undefined;

  // Skip translation if source and target are the same
  if (normalizedSource && normalizedSource === normalizedTarget) {
    return {
      text,
      provider: TranslationProvider.GOOGLE,
      sourceLanguage: normalizedSource,
      targetLanguage: normalizedTarget,
      fallback: false,
    };
  }

  if (isVip) {
    // VIP: Try OpenAI first, fallback to Google
    try {
      const result = await translateWithOpenAI(
        text,
        normalizedTarget,
        normalizedSource,
        env
      );

      return {
        text: result.text,
        provider: TranslationProvider.OPENAI,
        sourceLanguage: result.sourceLanguage || normalizedSource || 'auto',
        targetLanguage: normalizedTarget,
        fallback: false,
        cost: result.cost,
      };
    } catch (error) {
      console.error('[translateText] OpenAI failed, falling back to Google:', error);

      // Fallback to Google
      try {
        const result = await translateWithGoogle(
          text,
          normalizedTarget,
          normalizedSource,
          env
        );

        return {
          text: result.text,
          provider: TranslationProvider.GOOGLE,
          sourceLanguage: result.sourceLanguage || normalizedSource || 'auto',
          targetLanguage: normalizedTarget,
          fallback: true, // Fallback was used
          error: 'OpenAI translation failed, using Google Translate',
        };
      } catch (googleError) {
        console.error('[translateText] Google also failed:', googleError);
        
        // Both failed, return original text
        return {
          text,
          provider: TranslationProvider.GOOGLE,
          sourceLanguage: normalizedSource || 'auto',
          targetLanguage: normalizedTarget,
          fallback: true,
          error: 'All translation services failed',
        };
      }
    }
  } else {
    // Free: Use Google only
    try {
      const result = await translateWithGoogle(
        text,
        normalizedTarget,
        normalizedSource,
        env
      );

      return {
        text: result.text,
        provider: TranslationProvider.GOOGLE,
        sourceLanguage: result.sourceLanguage || normalizedSource || 'auto',
        targetLanguage: normalizedTarget,
        fallback: false,
      };
    } catch (error) {
      console.error('[translateText] Google translation failed:', error);
      
      // Failed, return original text
      return {
        text,
        provider: TranslationProvider.GOOGLE,
        sourceLanguage: normalizedSource || 'auto',
        targetLanguage: normalizedTarget,
        fallback: true,
        error: 'Translation service failed',
      };
    }
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

