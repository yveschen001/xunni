import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from '~/types';
import type { OfficialAd, OfficialAdType } from '~/domain/official_ad';
import {
  createOfficialAd,
  updateOfficialAd,
  updateOfficialAdStatus,
  getAllOfficialAds,
  getOfficialAdById,
} from '~/db/queries/official_ads';
import { logAdminAction } from '~/db/queries/admin_logs';
import { assertAdmin } from '~/domain/admin/auth';
import { TranslationService } from '~/services/translation';
import { validateOfficialAd } from '~/domain/official_ad';

export class AdminAdsService {
  private db: D1Database;
  private env: Env;
  private adminId: string;
  private translationService: TranslationService;

  constructor(db: D1Database, env: Env, adminId: string) {
    this.db = db;
    this.env = env;
    this.adminId = adminId;
    this.translationService = new TranslationService(env);
  }

  /**
   * Create a new official ad with auto-translation
   */
  async createAd(params: {
    ad_type: OfficialAdType;
    title: string;
    content: string;
    url?: string;
    target_entity_id?: string;
    reward_quota?: number;
    requires_verification?: boolean;
    start_date?: string;
    end_date?: string;
    max_views?: number;
  }): Promise<number> {
    // 1. Auth check
    assertAdmin(this.env, this.adminId);

    // 2. Validate input
    validateOfficialAd(params);

    // 3. Auto-translate title and content
    const [titleI18n, contentI18n] = await Promise.all([
      this.translationService.batchTranslate(params.title),
      this.translationService.batchTranslate(params.content),
    ]);

    // 4. Create ad
    const adId = await createOfficialAd(this.db, {
      ...params,
      is_enabled: true, // Default enabled
      title_i18n: JSON.stringify(titleI18n),
      content_i18n: JSON.stringify(contentI18n),
    });

    // 5. Log action
    await logAdminAction(
      this.db,
      this.adminId,
      'ad_create',
      { ...params, ad_id: adId },
      String(adId)
    );

    return adId;
  }

  /**
   * Edit an existing ad with auto-translation for updated text
   */
  async editAd(
    adId: number,
    updates: {
      title?: string;
      content?: string;
      url?: string;
      target_entity_id?: string;
      reward_quota?: number;
      requires_verification?: boolean;
      start_date?: string;
      end_date?: string;
      max_views?: number;
    }
  ): Promise<boolean> {
    // 1. Auth check
    assertAdmin(this.env, this.adminId);

    // 2. Get existing ad
    const existingAd = await getOfficialAdById(this.db, adId);
    if (!existingAd) {
      throw new Error('Ad not found');
    }

    const updateData: Partial<OfficialAd> = { ...updates };

    // 3. Handle translations if text changed
    if (updates.title && updates.title !== existingAd.title) {
      const titleI18n = await this.translationService.batchTranslate(updates.title);
      updateData.title_i18n = JSON.stringify(titleI18n);
    }

    if (updates.content && updates.content !== existingAd.content) {
      const contentI18n = await this.translationService.batchTranslate(updates.content);
      updateData.content_i18n = JSON.stringify(contentI18n);
    }

    // 4. Update ad
    const success = await updateOfficialAd(this.db, adId, updateData);

    // 5. Log action
    if (success) {
      await logAdminAction(
        this.db,
        this.adminId,
        'ad_edit',
        { ad_id: adId, updates },
        String(adId)
      );
    }

    return success;
  }

  /**
   * Duplicate an ad
   */
  async duplicateAd(adId: number): Promise<number> {
    // 1. Auth check
    assertAdmin(this.env, this.adminId);

    // 2. Get existing ad
    const sourceAd = await getOfficialAdById(this.db, adId);
    if (!sourceAd) {
      throw new Error('Ad not found');
    }

    // 3. Prepare new ad data
    const newTitle = `${sourceAd.title} (Copy)`;

    // Parse existing translations and append (Copy) to all languages?
    // For simplicity, re-translate the new title to ensure consistency
    const [titleI18n, contentI18n] = await Promise.all([
      this.translationService.batchTranslate(newTitle),
      // Reuse content translations or re-translate? Reuse is faster/cheaper if content is same.
      // But we should verify if contentI18n exists.
      sourceAd.content_i18n
        ? Promise.resolve(JSON.parse(sourceAd.content_i18n))
        : this.translationService.batchTranslate(sourceAd.content),
    ]);

    // 4. Create duplicate (Paused by default)
    const newAdId = await createOfficialAd(this.db, {
      ad_type: sourceAd.ad_type,
      title: newTitle,
      content: sourceAd.content,
      url: sourceAd.url,
      target_entity_id: sourceAd.target_entity_id,
      reward_quota: sourceAd.reward_quota,
      requires_verification: sourceAd.requires_verification,
      is_enabled: false, // Paused by default
      start_date: sourceAd.start_date,
      end_date: sourceAd.end_date,
      max_views: sourceAd.max_views,
      title_i18n: JSON.stringify(titleI18n),
      content_i18n: JSON.stringify(contentI18n),
    });

    // 5. Log action
    await logAdminAction(
      this.db,
      this.adminId,
      'ad_duplicate',
      { source_ad_id: adId, new_ad_id: newAdId },
      String(newAdId)
    );

    return newAdId;
  }

  /**
   * Toggle ad status (Pause/Resume)
   */
  async toggleAdStatus(adId: number, isEnabled: boolean): Promise<void> {
    // 1. Auth check
    assertAdmin(this.env, this.adminId);

    // 2. Update status
    await updateOfficialAdStatus(this.db, adId, isEnabled);

    // 3. Log action
    await logAdminAction(
      this.db,
      this.adminId,
      isEnabled ? 'ad_resume' : 'ad_pause',
      { ad_id: adId },
      String(adId)
    );
  }

  /**
   * Soft delete an ad
   */
  async deleteAd(adId: number): Promise<void> {
    // 1. Auth check
    assertAdmin(this.env, this.adminId);

    // 2. Soft delete
    await updateOfficialAd(this.db, adId, {
      deleted_at: new Date().toISOString(),
      is_enabled: false, // Also disable it
    });

    // 3. Log action
    await logAdminAction(this.db, this.adminId, 'ad_delete', { ad_id: adId }, String(adId));
  }

  /**
   * Get all ads (excluding deleted)
   */
  async getAds(): Promise<OfficialAd[]> {
    // 1. Auth check
    assertAdmin(this.env, this.adminId);

    // 2. Get ads
    return getAllOfficialAds(this.db, false);
  }
}
