import { describe, it, expect } from 'vitest';
import { validateBottleContent } from '~/domain/bottle';

describe('validateBottleContent', () => {
  it('should reject empty content', () => {
    const result = validateBottleContent('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('不能為空');
  });

  it('should reject content with only whitespace', () => {
    const result = validateBottleContent('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('不能為空');
  });

  it('should reject content shorter than 12 characters', () => {
    const result = validateBottleContent('短內容');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('太短');
    expect(result.error).toContain('12');
  });

  it('should accept content with exactly 12 characters', () => {
    const result = validateBottleContent('這是一個測試漂流瓶內容啊'); // 13 characters
    expect(result.valid).toBe(true);
  });

  it('should accept content with more than 12 characters', () => {
    const result = validateBottleContent('這是一個測試漂流瓶內容，包含更多的文字來測試驗證功能。');
    expect(result.valid).toBe(true);
  });

  it('should reject content longer than 500 characters', () => {
    const longContent = 'a'.repeat(501);
    const result = validateBottleContent(longContent);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('太長');
    expect(result.error).toContain('500');
  });

  it('should accept content with exactly 500 characters', () => {
    const content = 'a'.repeat(500);
    const result = validateBottleContent(content);
    expect(result.valid).toBe(true);
  });

  it('should trim content before checking length', () => {
    const result = validateBottleContent('  這是一個測試漂流瓶內容啊  '); // 13 characters after trim
    expect(result.valid).toBe(true);
  });

  it('should reject trimmed content shorter than 12 characters', () => {
    const result = validateBottleContent('  短內容  ');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('太短');
  });
});
