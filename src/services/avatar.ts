/**
 * Avatar Service
 * 
 * Handles fetching, caching, and processing user avatars from Telegram
 */

import type { Env } from '~/types';
import type { DatabaseClient } from '~/db/client';

export interface AvatarInfo {
  url: string | null;
  hasAvatar: boolean;
}

export interface AvatarCacheData {
  fileId: string | null;
  originalUrl: string | null;
  blurredUrl: string | null;
  updatedAt: string | null;
}

// Avatar cache duration: 7 days
const AVATAR_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

/**
 * Get user's Telegram profile photo URL and file_id
 */
export async function getUserAvatarInfo(
  env: Env,
  userId: string
): Promise<{ url: string | null; fileId: string | null }> {
  try {
    const botToken = env.TELEGRAM_BOT_TOKEN;
    
    // 1. Get user profile photos
    const photosResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${userId}&limit=1`
    );
    
    if (!photosResponse.ok) {
      return { url: null, fileId: null };
    }
    
    const photosData = await photosResponse.json();
    
    if (!photosData.ok || photosData.result.total_count === 0) {
      return { url: null, fileId: null };
    }
    
    // 2. Get the largest size photo
    const photo = photosData.result.photos[0];
    const largestPhoto = photo[photo.length - 1]; // Last one is the largest
    const fileId = largestPhoto.file_id;
    
    // 3. Get file path
    const fileResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
    );
    
    if (!fileResponse.ok) {
      return { url: null, fileId: null };
    }
    
    const fileData = await fileResponse.json();
    
    if (!fileData.ok) {
      return { url: null, fileId: null };
    }
    
    // 4. Construct URL
    const photoUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
    
    return { url: photoUrl, fileId };
  } catch (error) {
    console.error('[Avatar] Error fetching avatar:', error);
    return { url: null, fileId: null };
  }
}

/**
 * Generate blurred avatar URL using images.weserv.nl
 */
export function generateBlurredAvatarUrl(originalUrl: string, env: Env): string {
  // Use our blur proxy endpoint which calls images.weserv.nl
  return `${env.PUBLIC_URL}/api/avatar/blur?url=${encodeURIComponent(originalUrl)}`;
}

/**
 * Get default avatar URL based on gender
 */
export function getDefaultAvatarUrl(env: Env, gender?: string): string {
  if (gender === 'male') {
    return `${env.PUBLIC_URL}/assets/default-avatar-male.png`;
  } else if (gender === 'female') {
    return `${env.PUBLIC_URL}/assets/default-avatar-female.png`;
  }
  // Neutral/unknown gender
  return `${env.PUBLIC_URL}/assets/default-avatar-neutral.png`;
}

/**
 * Check if avatar cache is expired (7 days)
 */
export function isAvatarCacheExpired(updatedAt: string | null): boolean {
  if (!updatedAt) return true;
  
  const lastUpdate = new Date(updatedAt).getTime();
  const now = Date.now();
  
  return (now - lastUpdate) > AVATAR_CACHE_DURATION;
}

/**
 * Check if user's avatar has changed by comparing file_id
 */
export async function checkAvatarChanged(
  env: Env,
  userId: string,
  cachedFileId: string | null
): Promise<boolean> {
  try {
    const { fileId } = await getUserAvatarInfo(env, userId);
    
    // If user deleted avatar
    if (!fileId && cachedFileId) {
      return true;
    }
    
    // If user added avatar
    if (fileId && !cachedFileId) {
      return true;
    }
    
    // Compare file_id
    return fileId !== cachedFileId;
  } catch (error) {
    console.error('[Avatar] Error checking avatar change:', error);
    return false;
  }
}

/**
 * Update user avatar cache in database
 */
export async function updateUserAvatarCache(
  db: DatabaseClient,
  userId: string,
  fileId: string | null,
  originalUrl: string | null,
  blurredUrl: string | null
): Promise<void> {
  await db.d1
    .prepare(
      `UPDATE users 
       SET avatar_file_id = ?,
           avatar_original_url = ?,
           avatar_blurred_url = ?,
           avatar_updated_at = CURRENT_TIMESTAMP
       WHERE telegram_id = ?`
    )
    .bind(fileId, originalUrl, blurredUrl, userId)
    .run();
}

/**
 * Get user avatar cache from database
 */
export async function getUserAvatarCache(
  db: DatabaseClient,
  userId: string
): Promise<AvatarCacheData | null> {
  const result = await db.d1
    .prepare(
      `SELECT avatar_file_id, avatar_original_url, avatar_blurred_url, avatar_updated_at
       FROM users
       WHERE telegram_id = ?`
    )
    .bind(userId)
    .first<{
      avatar_file_id: string | null;
      avatar_original_url: string | null;
      avatar_blurred_url: string | null;
      avatar_updated_at: string | null;
    }>();
  
  if (!result) return null;
  
  return {
    fileId: result.avatar_file_id,
    originalUrl: result.avatar_original_url,
    blurredUrl: result.avatar_blurred_url,
    updatedAt: result.avatar_updated_at
  };
}

/**
 * Fetch and cache avatar with smart update detection
 */
export async function fetchAndCacheAvatar(
  db: DatabaseClient,
  env: Env,
  userId: string,
  gender?: string
): Promise<{ originalUrl: string | null; blurredUrl: string | null }> {
  // 1. Get avatar from Telegram
  const { url: originalUrl, fileId } = await getUserAvatarInfo(env, userId);
  
  if (!originalUrl) {
    // No avatar, cache this state
    await updateUserAvatarCache(db, userId, null, null, null);
    return { originalUrl: null, blurredUrl: null };
  }
  
  // 2. Generate blurred URL
  const blurredUrl = generateBlurredAvatarUrl(originalUrl, env);
  
  // 3. Cache in database
  await updateUserAvatarCache(db, userId, fileId, originalUrl, blurredUrl);
  
  return { originalUrl, blurredUrl };
}

/**
 * Get avatar URL with smart caching and update detection
 * This is the main function to use
 */
export async function getAvatarUrlWithCache(
  db: DatabaseClient,
  env: Env,
  userId: string,
  isVip: boolean,
  gender?: string,
  forceRefresh: boolean = false
): Promise<string> {
  // 1. Get cache from database
  const cache = await getUserAvatarCache(db, userId);
  
  // 2. Check if we need to update
  const needsUpdate =
    forceRefresh ||                                           // Force refresh
    !cache ||                                                 // No cache
    !cache.updatedAt ||                                       // Never updated
    isAvatarCacheExpired(cache.updatedAt) ||                  // Cache expired (7 days)
    await checkAvatarChanged(env, userId, cache.fileId);      // Avatar changed
  
  if (needsUpdate) {
    console.error('[Avatar] Updating cache for user:', userId, 'Reason:', {
      forceRefresh,
      noCache: !cache,
      expired: cache ? isAvatarCacheExpired(cache.updatedAt) : false
    });
    
    // 3. Fetch and cache new avatar
    const { originalUrl, blurredUrl } = await fetchAndCacheAvatar(db, env, userId, gender);
    
    // 4. Return appropriate URL
    if (!originalUrl) {
      console.error('[Avatar] No original URL, returning default. VIP:', isVip);
      return getDefaultAvatarUrl(env, gender);
    }
    
    const resultUrl = isVip ? originalUrl : (blurredUrl || originalUrl);
    console.error('[Avatar] Returning URL. VIP:', isVip, 'IsOriginal:', resultUrl === originalUrl, 'URL:', resultUrl.substring(0, 100));
    return resultUrl;
  }
  
  // 5. Use cached avatar
  if (!cache.originalUrl) {
    console.error('[Avatar] No cached original URL, returning default. VIP:', isVip);
    return getDefaultAvatarUrl(env, gender);
  }
  
  const resultUrl = isVip ? cache.originalUrl : (cache.blurredUrl || cache.originalUrl);
  console.error('[Avatar] Using cached URL. VIP:', isVip, 'IsOriginal:', resultUrl === cache.originalUrl, 'URL:', resultUrl.substring(0, 100));
  return resultUrl;
}

/**
 * Get avatar URL with blur effect for free users (legacy function for compatibility)
 * For VIP users, return original URL
 */
export function getDisplayAvatarUrl(
  originalUrl: string | null,
  isVip: boolean,
  env: Env,
  gender?: string
): string | null {
  if (!originalUrl) {
    // Return default avatar URL based on gender
    return getDefaultAvatarUrl(env, gender);
  }
  
  if (isVip) {
    // VIP users see clear avatar
    return originalUrl;
  }
  
  // Free users see blurred avatar
  return generateBlurredAvatarUrl(originalUrl, env);
}

/**
 * Get avatar info for a user (legacy function for compatibility)
 */
export async function getAvatarInfo(
  env: Env,
  userId: string,
  isVip: boolean,
  gender?: string
): Promise<AvatarInfo> {
  const { url: originalUrl } = await getUserAvatarInfo(env, userId);
  const displayUrl = getDisplayAvatarUrl(originalUrl, isVip, env, gender);
  
  return {
    url: displayUrl,
    hasAvatar: originalUrl !== null
  };
}
