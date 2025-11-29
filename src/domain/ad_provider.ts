/**
 * Ad Provider Domain Logic
 *
 * Purpose:
 *   Business logic for selecting ad providers
 *   Support multiple selection strategies
 *   Handle fallback and error recovery
 *
 * Strategies:
 *   1. Priority: Always select highest priority provider
 *   2. Weighted Random: Random selection based on weight
 *   3. Round Robin: Rotate through providers evenly
 *
 * Future Extensions:
 *   - Geo-targeting (select provider based on user location)
 *   - Time-based rules (different providers for different times)
 *   - User-segment targeting (new users vs returning users)
 *   - Performance-based selection (prefer providers with higher completion rates)
 */

// ============================================================================
// Constants
// ============================================================================

export const AD_PROVIDER_CONSTANTS = {
  DEFAULT_STRATEGY: 'priority' as AdProviderStrategy,
  MIN_COMPLETION_RATE: 0.5, // 50% minimum completion rate
  ERROR_THRESHOLD: 10, // Max errors before disabling provider
} as const;

// ============================================================================
// Types
// ============================================================================

export type AdProviderStrategy = 'priority' | 'weighted_random' | 'round_robin';

export interface AdProvider {
  id: number;
  provider_name: string;
  provider_display_name: string;
  is_enabled: boolean;
  priority: number;
  weight: number;
  config: string; // JSON string
  script_url: string;
  fallback_script_urls?: string; // JSON array
  total_requests: number;
  total_views: number;
  total_completions: number;
  total_errors: number;
  completion_rate: number;
  last_error?: string;
  last_error_at?: string;
  last_success_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdProviderConfig {
  [key: string]: any;
}

export interface AdProviderSelection {
  provider: AdProvider;
  strategy_used: AdProviderStrategy;
  fallback_available: boolean;
}

export interface AdProviderHealth {
  is_healthy: boolean;
  completion_rate: number;
  error_rate: number;
  recent_errors: number;
  recommendation: string;
}

// ============================================================================
// Provider Selection Logic
// ============================================================================

/**
 * Select ad provider based on strategy
 *
 * @param providers - List of available providers
 * @param strategy - Selection strategy
 * @param lastUsedProvider - Last used provider name (for round robin)
 * @returns Selected provider
 *
 * @example
 * const selection = selectAdProvider(providers, 'priority');
 * console.log(`Selected: ${selection.provider.provider_display_name}`);
 */
export function selectAdProvider(
  providers: AdProvider[],
  strategy: AdProviderStrategy = AD_PROVIDER_CONSTANTS.DEFAULT_STRATEGY,
  lastUsedProvider?: string
): AdProviderSelection | null {
  // Filter enabled and healthy providers
  const availableProviders = providers.filter((p) => p.is_enabled && isProviderHealthy(p));

  if (availableProviders.length === 0) {
    return null;
  }

  let selectedProvider: AdProvider;

  switch (strategy) {
    case 'priority':
      selectedProvider = selectByPriority(availableProviders);
      break;

    case 'weighted_random':
      selectedProvider = selectByWeightedRandom(availableProviders);
      break;

    case 'round_robin':
      selectedProvider = selectByRoundRobin(availableProviders, lastUsedProvider);
      break;

    default:
      selectedProvider = selectByPriority(availableProviders);
  }

  return {
    provider: selectedProvider,
    strategy_used: strategy,
    fallback_available: availableProviders.length > 1,
  };
}

/**
 * Select provider by priority (highest first)
 *
 * @param providers - Available providers
 * @returns Provider with highest priority
 */
export function selectByPriority(providers: AdProvider[]): AdProvider {
  return providers.reduce((highest, current) =>
    current.priority > highest.priority ? current : highest
  );
}

/**
 * Select provider by weighted random
 *
 * @param providers - Available providers
 * @returns Randomly selected provider based on weight
 *
 * @example
 * // Provider A: weight 70, Provider B: weight 30
 * // Provider A has 70% chance, Provider B has 30% chance
 */
export function selectByWeightedRandom(providers: AdProvider[]): AdProvider {
  const totalWeight = providers.reduce((sum, p) => sum + p.weight, 0);

  if (totalWeight === 0) {
    // If all weights are 0, select randomly
    return providers[Math.floor(Math.random() * providers.length)];
  }

  let random = Math.random() * totalWeight;

  for (const provider of providers) {
    random -= provider.weight;
    if (random <= 0) {
      return provider;
    }
  }

  // Fallback (should never reach here)
  return providers[0];
}

/**
 * Select provider by round robin
 *
 * @param providers - Available providers
 * @param lastUsedProvider - Last used provider name
 * @returns Next provider in rotation
 *
 * @example
 * // Providers: [A, B, C]
 * // Last used: A → Select B
 * // Last used: B → Select C
 * // Last used: C → Select A
 */
export function selectByRoundRobin(providers: AdProvider[], lastUsedProvider?: string): AdProvider {
  if (!lastUsedProvider || providers.length === 1) {
    return providers[0];
  }

  // Sort by priority to ensure consistent order
  const sortedProviders = [...providers].sort((a, b) => b.priority - a.priority);

  // Find last used provider index
  const lastIndex = sortedProviders.findIndex((p) => p.provider_name === lastUsedProvider);

  if (lastIndex === -1) {
    // Last used provider not found, return first
    return sortedProviders[0];
  }

  // Return next provider (wrap around if at end)
  const nextIndex = (lastIndex + 1) % sortedProviders.length;
  return sortedProviders[nextIndex];
}

/**
 * Get fallback provider (next available after current)
 *
 * @param providers - All available providers
 * @param currentProvider - Current provider that failed
 * @returns Fallback provider or null if none available
 */
export function getFallbackProvider(
  providers: AdProvider[],
  currentProvider: AdProvider
): AdProvider | null {
  const availableProviders = providers
    .filter(
      (p) =>
        p.is_enabled && p.provider_name !== currentProvider.provider_name && isProviderHealthy(p)
    )
    .sort((a, b) => b.priority - a.priority);

  return availableProviders.length > 0 ? availableProviders[0] : null;
}

// ============================================================================
// Provider Health Check
// ============================================================================

/**
 * Check if provider is healthy
 *
 * @param provider - Provider to check
 * @returns True if healthy
 *
 * Criteria:
 *   - Completion rate >= 50% (if has data)
 *   - Error rate < 50%
 *   - Not too many recent errors
 */
export function isProviderHealthy(provider: AdProvider): boolean {
  // If no data yet, consider healthy
  if (provider.total_requests === 0) {
    return true;
  }

  // Check completion rate (only if we have enough data)
  if (provider.total_views >= 10) {
    const completionRate = provider.total_completions / provider.total_views;
    if (completionRate < AD_PROVIDER_CONSTANTS.MIN_COMPLETION_RATE) {
      return false;
    }
  }

  // Check error rate (only if we have enough data)
  if (provider.total_requests >= 10) {
    const errorRate = provider.total_errors / provider.total_requests;
    if (errorRate > 0.5) {
      return false;
    }
  }

  return true;
}

/**
 * Get provider health status
 *
 * @param provider - Provider to check
 * @returns Health status with recommendation
 */
export function getProviderHealth(provider: AdProvider): AdProviderHealth {
  const completionRate =
    provider.total_views > 0 ? provider.total_completions / provider.total_views : 0;

  const errorRate =
    provider.total_requests > 0 ? provider.total_errors / provider.total_requests : 0;

  const isHealthy = isProviderHealthy(provider);

  let recommendation = '';
  if (!isHealthy) {
    if (completionRate < AD_PROVIDER_CONSTANTS.MIN_COMPLETION_RATE) {
      recommendation = 'Low completion rate. Consider replacing provider.';
    } else if (errorRate > 0.5) {
      recommendation = 'High error rate. Check provider configuration.';
    }
  } else if (completionRate > 0.8) {
    recommendation = 'Excellent performance. Keep using.';
  } else {
    recommendation = 'Good performance. Monitor regularly.';
  }

  return {
    is_healthy: isHealthy,
    completion_rate: Math.round(completionRate * 100) / 100,
    error_rate: Math.round(errorRate * 100) / 100,
    recent_errors: provider.total_errors,
    recommendation,
  };
}

// ============================================================================
// Provider Configuration
// ============================================================================

/**
 * Parse provider config from JSON string
 *
 * @param configJson - JSON string
 * @returns Parsed config object
 */
export function parseProviderConfig(configJson: string): AdProviderConfig {
  try {
    return JSON.parse(configJson);
  } catch (error) {
    console.error('[parseProviderConfig] Failed to parse config:', error);
    return {};
  }
}

/**
 * Parse fallback script URLs from JSON string
 *
 * @param fallbackJson - JSON string (array of URLs)
 * @returns Array of URLs
 */
export function parseFallbackUrls(fallbackJson?: string): string[] {
  if (!fallbackJson) {
    return [];
  }

  try {
    const urls = JSON.parse(fallbackJson);
    return Array.isArray(urls) ? urls : [];
  } catch (error) {
    console.error('[parseFallbackUrls] Failed to parse fallback URLs:', error);
    return [];
  }
}

/**
 * Get script URL with fallback
 *
 * @param provider - Provider
 * @param useFallback - Whether to use fallback URL
 * @returns Script URL
 */
export function getScriptUrl(provider: AdProvider, useFallback: boolean = false): string {
  if (!useFallback) {
    return provider.script_url;
  }

  const fallbackUrls = parseFallbackUrls(provider.fallback_script_urls);
  return fallbackUrls.length > 0 ? fallbackUrls[0] : provider.script_url;
}

// ============================================================================
// Provider Statistics
// ============================================================================

/**
 * Calculate provider statistics
 *
 * @param provider - Provider
 * @returns Statistics object
 */
export function calculateProviderStats(provider: AdProvider) {
  const completionRate =
    provider.total_views > 0 ? (provider.total_completions / provider.total_views) * 100 : 0;

  const errorRate =
    provider.total_requests > 0 ? (provider.total_errors / provider.total_requests) * 100 : 0;

  const successRate =
    provider.total_requests > 0
      ? ((provider.total_requests - provider.total_errors) / provider.total_requests) * 100
      : 0;

  return {
    total_requests: provider.total_requests,
    total_views: provider.total_views,
    total_completions: provider.total_completions,
    total_errors: provider.total_errors,
    completion_rate: Math.round(completionRate * 100) / 100,
    error_rate: Math.round(errorRate * 100) / 100,
    success_rate: Math.round(successRate * 100) / 100,
  };
}

/**
 * Compare providers by performance
 *
 * @param providers - List of providers
 * @returns Sorted providers (best first)
 */
export function compareProvidersByPerformance(providers: AdProvider[]): AdProvider[] {
  return [...providers].sort((a, b) => {
    const aStats = calculateProviderStats(a);
    const bStats = calculateProviderStats(b);

    // Primary: completion rate
    if (aStats.completion_rate !== bStats.completion_rate) {
      return bStats.completion_rate - aStats.completion_rate;
    }

    // Secondary: error rate (lower is better)
    if (aStats.error_rate !== bStats.error_rate) {
      return aStats.error_rate - bStats.error_rate;
    }

    // Tertiary: total completions
    return bStats.total_completions - aStats.total_completions;
  });
}

/**
 * Format provider status for display
 *
 * @param provider - Provider
 * @param i18n - Optional i18n instance for translation
 * @returns Formatted status string
 */
export function formatProviderStatus(provider: AdProvider, i18n?: any): string {
  const stats = calculateProviderStats(provider);
  const health = getProviderHealth(provider);

  const statusEmoji = provider.is_enabled ? '✅' : '❌';
  const healthEmoji = health.is_healthy ? '💚' : '⚠️';

  const healthStatus = health.is_healthy
    ? i18n?.t('adProvider.health.good') || '良好'
    : i18n?.t('adProvider.health.needsAttention') || '需要關注';

  return `
${statusEmoji} **${provider.provider_display_name}**
${healthEmoji} 健康狀態: ${healthStatus}
📊 完成率: ${stats.completion_rate}%
❌ 錯誤率: ${stats.error_rate}%
📈 總請求: ${stats.total_requests}
✅ 總完成: ${stats.total_completions}
💡 建議: ${health.recommendation}
  `.trim();
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate provider data
 *
 * @param provider - Provider data to validate
 * @returns True if valid, throws error if invalid
 */
export function validateProvider(provider: Partial<AdProvider>): boolean {
  if (!provider.provider_name) {
    throw new Error('provider_name is required');
  }

  if (!provider.provider_display_name) {
    throw new Error('provider_display_name is required');
  }

  if (!provider.script_url) {
    throw new Error('script_url is required');
  }

  // Validate URL format
  try {
    new URL(provider.script_url);
  } catch {
    throw new Error('script_url must be a valid URL');
  }

  // Validate priority
  if (provider.priority !== undefined && provider.priority < 0) {
    throw new Error('priority must be >= 0');
  }

  // Validate weight
  if (provider.weight !== undefined && provider.weight < 0) {
    throw new Error('weight must be >= 0');
  }

  return true;
}

// ============================================================================
// Future Extensions (commented out for now)
// ============================================================================

/**
 * Select provider based on user location
 *
 * @param providers - Available providers
 * @param userCountry - User's country code
 * @returns Best provider for user's location
 *
 * @future
 * - Different providers for different regions
 * - Optimize for local ad inventory
 * - Comply with regional regulations
 */
export function selectByGeoTargeting(
  providers: AdProvider[],
  _userCountry: string
): AdProvider | null {
  // TODO: Implement when we add geo-targeting
  return selectByPriority(providers);
}

/**
 * Select provider based on time of day
 *
 * @param providers - Available providers
 * @param hour - Hour of day (0-23)
 * @returns Best provider for current time
 *
 * @future
 * - Different providers for peak/off-peak hours
 * - Optimize ad fill rates
 * - Load balancing
 */
export function selectByTimeOfDay(providers: AdProvider[], _hour: number): AdProvider | null {
  // TODO: Implement when we add time-based rules
  return selectByPriority(providers);
}
