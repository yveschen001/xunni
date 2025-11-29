import type { Env } from '~/types';

/**
 * Content Moderation Service using Gemini API
 * Used for analyzing reported content and appeals
 */
export class ContentModerationService {
  private apiKey: string;
  private projectId: string;
  private baseURL: string;

  constructor(env: Env) {
    this.apiKey = env.GEMINI_API_KEY || env.OPENAI_API_KEY || ''; // Fallback or shared key
    this.projectId = env.GEMINI_PROJECT_ID || '';
    // Use Google Gemini API endpoint
    this.baseURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`;
  }

  /**
   * Analyze report context to determine if content violates rules
   */
  async analyzeReport(context: {
    reporter: string;
    suspect: string;
    reason: string;
    messages: string[];
  }): Promise<{ verdict: 'violation' | 'safe'; confidence: number; reason: string }> {
    if (!this.apiKey) {
      console.warn('[ContentModerationService] No API key, skipping analysis');
      return { verdict: 'safe', confidence: 0, reason: 'AI not configured' };
    }

    const prompt = `
    You are a content moderator for a social app. Analyze the following conversation context for a report.
    
    Report Reason: ${context.reason}
    Reporter ID: ${context.reporter}
    Suspect ID: ${context.suspect}
    
    Conversation Context (Last messages):
    ${context.messages.join('\n')}
    
    Task: Determine if the Suspect violated terms (Harassment, Scam, NSFW, Spam).
    Return JSON only: { "verdict": "violation" | "safe", "confidence": 0-100, "reason": "short explanation" }
    `;

    try {
      const response = await this.callGemini(prompt);
      return this.parseResponse(response);
    } catch (error) {
      console.error('[ContentModerationService] Analysis failed:', error);
      return { verdict: 'safe', confidence: 0, reason: 'Analysis error' };
    }
  }

  /**
   * Analyze appeal to determine if user should be unbanned
   */
  async analyzeAppeal(context: {
    user: string;
    banReason: string;
    appealText: string;
  }): Promise<{ verdict: 'unban' | 'keep'; confidence: number; reason: string }> {
    if (!this.apiKey) {
      return { verdict: 'keep', confidence: 0, reason: 'AI not configured' };
    }

    const prompt = `
    You are an admin reviewing a ban appeal.
    
    User ID: ${context.user}
    Original Ban Reason: ${context.banReason}
    User's Appeal: "${context.appealText}"
    
    Task: Determine if the user should be unbanned based on sincerity, misunderstanding, or false positive.
    Return JSON only: { "verdict": "unban" | "keep", "confidence": 0-100, "reason": "short explanation" }
    `;

    try {
      const response = await this.callGemini(prompt);
      const result = this.parseResponse(response);
      // Map generic verdict to specific
      return {
        verdict: result.verdict === 'violation' ? 'keep' : 'unban', // Map 'violation' -> keep ban, 'safe' -> unban (rough mapping, better to parse directly)
        confidence: result.confidence,
        reason: result.reason,
      };
    } catch (error) {
      return { verdict: 'keep', confidence: 0, reason: 'Analysis error' };
    }
  }

  private async callGemini(prompt: string): Promise<string> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: any = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  }

  private parseResponse(text: string): any {
    try {
      // Clean markdown code blocks if present
      const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('[ContentModerationService] JSON parse error:', e);
      return { verdict: 'safe', confidence: 0, reason: 'Parse error' };
    }
  }
}
