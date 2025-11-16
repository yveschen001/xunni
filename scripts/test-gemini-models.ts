/**
 * Test which Gemini models are available and working
 */

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

const MODELS_TO_TEST = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.5-flash-lite',
  'gemini-2.1',
  'gemini-pro',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
];

async function testModel(model: string): Promise<{ success: boolean; error?: string; response?: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Translate the following text from zh-TW to en:\n\n你好',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return { success: false, error: `${response.status} - ${errorBody}` };
    }

    const data = (await response.json()) as any;
    const translatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!translatedText) {
      return { success: false, error: 'Empty response' };
    }

    return { success: true, response: translatedText };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function main() {
  if (!API_KEY) {
    console.error('❌ GOOGLE_GEMINI_API_KEY not set');
    process.exit(1);
  }

  console.log('🧪 Testing Gemini Models\n');
  console.log('='.repeat(80));

  for (const model of MODELS_TO_TEST) {
    process.stdout.write(`Testing ${model.padEnd(30)} ... `);
    const result = await testModel(model);
    
    if (result.success) {
      console.log(`✅ SUCCESS - ${result.response?.substring(0, 50)}...`);
    } else {
      console.log(`❌ FAILED - ${result.error}`);
    }
  }

  console.log('='.repeat(80));
}

main();

