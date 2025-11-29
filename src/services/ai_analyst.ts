import type { Env } from '~/types';

/**
 * AI Analyst Service
 * Uses Gemini to analyze operational data and provide insights
 */
export class AIAnalystService {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(env: Env) {
    this.apiKey = env.GOOGLE_GEMINI_API_KEY || env.OPENAI_API_KEY || ''; // Fallback
    // Use gemini-1.5-flash if available, or fall back to pro
    this.model = 'gemini-1.5-flash';
    this.baseURL = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
  }

  /**
   * Analyze daily statistics and provide a summary
   */
  async analyzeDailyStats(stats: Record<string, any>): Promise<string> {
    if (!this.apiKey) {
      return '⚠️ AI API Key not configured. Unable to generate analysis.';
    }

    const prompt = `
    You are a Data Analyst for a social app "XunNi" (Virtual You).
    Analyze the following daily operational statistics (JSON format).
    
    Data:
    ${JSON.stringify(stats, null, 2)}
    
    Task:
    Provide a concise daily summary report in Traditional Chinese (繁體中文).
    
    Requirements:
    1. **Overall Trend**: Briefly summarize the key performance of the day.
    2. **Anomalies**: Highlight any metrics that have changed significantly (>20% increase or decrease) if previous data is available (or based on general sense if not).
    3. **Insights**: Provide 1-2 actionable insights or observations based on the data (e.g., "Ad revenue is up, check if new ad provider is performing well").
    4. **Tone**: Professional, objective, yet concise.
    5. **Format**: Use bullet points. Do NOT use Markdown headers like ##. Use bolding ** for emphasis.
    
    Output Example:
    📊 **今日數據摘要**
    *   用戶活躍度保持穩定，新增用戶數較昨日成長 **15%**。
    *   廣告觀看次數出現異常下跌 (**-25%**)，建議檢查廣告供應商連線狀態。
    *   漂流瓶互動率提升，顯示新版配對算法可能產生了正面效果。
    `;

    try {
      return await this.callGemini(prompt);
    } catch (error) {
      console.error('[AIAnalystService] Analysis failed:', error);
      return '⚠️ AI Analysis failed. Please check logs.';
    }
  }

  private async callGemini(prompt: string): Promise<string> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      // Try fallback to gemini-pro if flash fails (e.g. 404 model not found)
      if (response.status === 404 && this.model === 'gemini-1.5-flash') {
        console.warn('[AIAnalystService] gemini-1.5-flash not found, falling back to gemini-pro');
        this.model = 'gemini-pro';
        this.baseURL = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
        return this.callGemini(prompt);
      }
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No content generated.';
  }
}
