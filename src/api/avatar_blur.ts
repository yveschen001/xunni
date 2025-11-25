/**
 * Avatar Blur API
 *
 * Proxies and blurs avatar images for free users using imgproxy.net (free service)
 */

import type { Env } from '~/types';

/**
 * Apply blur effect to image using imgproxy.net free service
 * Returns the blurred image directly
 */
export async function handleAvatarBlur(request: Request, _env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // Use imgproxy.net free service for blur effect
    // Format: https://images.weserv.nl/?url={image_url}&blur=15
    const blurredUrl = `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&blur=15&output=jpg`;

    // Fetch the blurred image
    const imageResponse = await fetch(blurredUrl);

    if (!imageResponse.ok) {
      console.error('[AvatarBlur] Failed to fetch blurred image:', imageResponse.statusText);
      // Fallback: return original image with low quality
      return fetch(imageUrl);
    }

    // Return the blurred image
    return new Response(imageResponse.body, {
      headers: {
        'Content-Type': imageResponse.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[AvatarBlur] Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
