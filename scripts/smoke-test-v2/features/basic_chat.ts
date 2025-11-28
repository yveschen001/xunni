import { TestSuite, TestContext } from '../runner';

export const basicChatTests: TestSuite = {
  name: 'Basic Chat Interaction',
  tests: [
    {
      name: 'Send Text Message (Router Check)',
      fn: async (ctx: TestContext) => {
        // Simulate sending a text message
        // This triggers the router logic that previously failed with ReferenceError: routerI18n
        const messageText = 'Hello, this is a test message';
        
        // We use the mock telegram service logic if we are running locally, 
        // but for staging we need to actually send a request to the webhook OR simulate it if we are just testing the worker logic?
        // Wait, the smoke test runner usually runs against the WORKER URL if configured for E2E?
        // Or does it run unit tests locally?
        
        // The current smoke test V2 seems to be designed for running LOCALLY with mocks.
        // But the user asked "Can your fully automated tests also test the Staging environment?" and I said YES.
        // If I run against Staging, I need to send actual HTTP requests to the Staging Webhook URL.
        
        // Let's assume we want to verify via HTTP request to Staging Webhook.
        if (!ctx.config?.webhookUrl) {
            console.log('Skipping E2E webhook test (no webhookUrl provided)');
            return;
        }

        const payload = {
            update_id: Date.now(),
            message: {
                message_id: 12345,
                from: {
                    id: 396943893, // Use user's ID or dummy
                    is_bot: false,
                    first_name: 'Test',
                    language_code: 'zh-TW'
                },
                chat: {
                    id: 396943893,
                    type: 'private'
                },
                date: Math.floor(Date.now() / 1000),
                text: messageText
            }
        };

        console.log(`Sending webhook request to ${ctx.config.webhookUrl}...`);
        const response = await fetch(ctx.config.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add secret if needed
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
        }

        // We can't easily verify the bot's RESPONSE content here without listening to Telegram API (which we can't do easily).
        // But getting a 200 OK from Webhook usually means no unhandled exception crashed the worker (unless it crashed async).
        // The ReferenceError happened inside handleWebhook -> routeUpdate.
        // If routeUpdate throws, handleWebhook catches it and returns 500?
        // Let's check router.ts handleWebhook.
        // catch (error) { return new Response('Internal Server Error', { status: 500 }); }
        
        // So if we get 200, it means NO ReferenceError.
        console.log('Webhook returned 200 OK. Router logic likely survived.');
      }
    }
  ]
};

