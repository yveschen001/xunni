/**
 * Conversation History Domain Tests
 */

import { describe, it, expect } from 'vitest';
import {
  formatMessageEntry,
  buildHistoryPostContent,
  extractMessages,
} from '~/domain/conversation_history';

describe('Conversation History', () => {
  describe('formatMessageEntry', () => {
    it('should format message entry correctly', () => {
      const time = new Date('2025-01-17T06:26:00Z');
      const result = formatMessageEntry(time, 'sent', '测试消息');

      expect(result).toBe('[06:26] 你：测试消息');
    });
  });

  describe('buildHistoryPostContent', () => {
    it('should build history post content correctly', () => {
      const messages = ['[06:26] 你：消息1', '[06:27] 對方：消息2'];

      const content = buildHistoryPostContent('1117DLHS', 1, messages, 2);

      expect(content).toContain('💬 與 #1117DLHS 的對話記錄（第 1 頁）');
      expect(content).toContain('[06:26] 你：消息1');
      expect(content).toContain('[06:27] 對方：消息2');
      expect(content).toContain('📊 總訊息數：2 則');
    });
  });

  describe('extractMessages', () => {
    it('should extract messages correctly', () => {
      const content = `💬 與 #1117DLHS 的對話記錄（第 1 頁）

━━━━━━━━━━━━━━━━

[06:26] 你：消息1
[06:27] 對方：消息2

━━━━━━━━━━━━━━━━

💡 這是對話的歷史記錄
📊 總訊息數：2 則
📅 最後更新：2025-01-17 06:28

💬 直接按 /reply 回覆訊息聊天`;

      const messages = extractMessages(content);

      expect(messages).toEqual(['[06:26] 你：消息1', '[06:27] 對方：消息2']);
    });

    it('should not duplicate messages when extracting and rebuilding', () => {
      // Initial content with 2 messages
      const initialMessages = ['[06:26] 你：消息1', '[06:27] 對方：消息2'];
      const initialContent = buildHistoryPostContent('1117DLHS', 1, initialMessages, 2);

      // Extract messages
      const extractedMessages = extractMessages(initialContent);

      // Should extract exactly 2 messages
      expect(extractedMessages).toHaveLength(2);
      expect(extractedMessages).toEqual(initialMessages);

      // Add a new message
      const newMessage = '[06:28] 你：消息3';
      extractedMessages.push(newMessage);

      // Rebuild content
      const newContent = buildHistoryPostContent('1117DLHS', 1, extractedMessages, 3);

      // Extract again
      const finalMessages = extractMessages(newContent);

      // Should have exactly 3 messages, no duplicates
      expect(finalMessages).toHaveLength(3);
      expect(finalMessages).toEqual([
        '[06:26] 你：消息1',
        '[06:27] 對方：消息2',
        '[06:28] 你：消息3',
      ]);
    });
  });
});
