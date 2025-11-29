import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deleteOldAnalyticsEvents, deleteOldConversationMessages } from '../../src/services/cleanup';

// Mock DB
const mockD1 = {
  prepare: vi.fn(),
};

const mockDbClient = {
  d1: mockD1,
};

// Mock createDatabaseClient
vi.mock('../../src/db/client', () => ({
  createDatabaseClient: () => mockDbClient,
}));

const mockEnv = {
  DB: {},
};

describe('Cleanup Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteOldAnalyticsEvents', () => {
    it('should call DELETE with correct date cutoff', async () => {
      // Mock run to return 0 changes (completed immediately)
      const mockRun = vi.fn().mockResolvedValue({ meta: { changes: 0 } });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      mockD1.prepare.mockReturnValue({ bind: mockBind });

      await deleteOldAnalyticsEvents(mockEnv as any);

      expect(mockD1.prepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM analytics_events WHERE created_at < ? LIMIT ?'));
      
      // Check if cutoff is roughly 90 days ago
      const cutoffArg = mockBind.mock.calls[0][0];
      const expectedCutoff = new Date();
      expectedCutoff.setDate(expectedCutoff.getDate() - 90);
      
      const actualDate = new Date(cutoffArg);
      expect(Math.abs(actualDate.getTime() - expectedCutoff.getTime())).toBeLessThan(1000 * 60); // within 1 minute
    });

    it('should loop until no rows returned', async () => {
      const mockRun = vi.fn()
        .mockResolvedValueOnce({ meta: { changes: 1000 } }) // First batch full
        .mockResolvedValueOnce({ meta: { changes: 500 } }); // Second batch partial (finished)

      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      mockD1.prepare.mockReturnValue({ bind: mockBind });

      const result = await deleteOldAnalyticsEvents(mockEnv as any);

      expect(result.deleted).toBe(1500);
      expect(result.completed).toBe(true);
      expect(mockRun).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteOldConversationMessages', () => {
    it('should run both phases', async () => {
      const mockRun = vi.fn()
        .mockResolvedValueOnce({ meta: { changes: 0 } }) // Phase 1 done
        .mockResolvedValueOnce({ meta: { changes: 0 } }); // Phase 2 done

      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      mockD1.prepare.mockReturnValue({ bind: mockBind });

      await deleteOldConversationMessages(mockEnv as any);

      // Verify Phase 1 query (Global > 3 years)
      expect(mockD1.prepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM conversation_messages WHERE created_at < ? LIMIT ?'));
      
      // Verify Phase 2 query (Non-VIP > 1 year)
      // Since prepare is called multiple times, we check calls
      const calls = mockD1.prepare.mock.calls;
      const phase2Query = calls.find((call: any[]) => call[0].includes('JOIN users'));
      expect(phase2Query).toBeDefined();
      expect(phase2Query[0]).toContain('users ua');
      expect(phase2Query[0]).toContain('users ub');
    });
  });
});

