import { test, expect } from '@playwright/test';

test.describe('API: /api/turn_response', () => {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

  test('should handle valid chat request with OpenAI', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/turn_response`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        messages: [
          { role: 'user', content: 'Hello, how are you?' }
        ],
        provider: 'openai',
        model: 'gpt-4',
      },
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('choices');
    expect(responseBody.choices).toHaveLength(1);
    expect(responseBody.choices[0]).toHaveProperty('message');
    expect(responseBody.choices[0].message).toHaveProperty('role', 'assistant');
    expect(responseBody.choices[0].message).toHaveProperty('content');
    expect(responseBody.choices[0].message.content).toBeTruthy();
  });

  test('should handle valid chat request with Google', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/turn_response`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        messages: [
          { role: 'user', content: 'Hello, how are you?' }
        ],
        provider: 'google',
        model: 'gemini-pro',
      },
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('candidates');
    expect(responseBody.candidates).toHaveLength(1);
    expect(responseBody.candidates[0]).toHaveProperty('content');
    expect(responseBody.candidates[0].content).toHaveProperty('parts');
    expect(responseBody.candidates[0].content.parts).toHaveLength(1);
    expect(responseBody.candidates[0].content.parts[0]).toHaveProperty('text');
  });

  test('should handle request with agent prompt', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/turn_response`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        messages: [
          { role: 'user', content: 'Help me code' }
        ],
        provider: 'openai',
        model: 'gpt-4',
        agentPrompt: 'You are a coding assistant. Always provide code examples.',
        agentName: 'Code Helper',
        agentTemperature: 0.3,
      },
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('choices');
    expect(responseBody.choices[0].message.content).toBeTruthy();
  });

  test('should handle request with memory context', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/turn_response`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        messages: [
          { role: 'user', content: 'What do you remember about me?' }
        ],
        provider: 'openai',
        model: 'gpt-4',
        memoryContext: 'User prefers TypeScript over JavaScript and works on React projects.',
      },
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('choices');
    expect(responseBody.choices[0].message.content).toBeTruthy();
  });

  test('should handle streaming request', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/turn_response`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        messages: [
          { role: 'user', content: 'Tell me a story' }
        ],
        provider: 'openai',
        model: 'gpt-4',
        stream: true,
      },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/event-stream');
    
    const streamText = await response.text();
    expect(streamText).toContain('data: ');
    expect(streamText).toContain('DONE');
  });

  test('should handle request with tools', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/turn_response`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        messages: [
          { role: 'user', content: 'Search for current weather' }
        ],
        provider: 'openai',
        model: 'gpt-4',
        tools: [
          {
            type: 'function',
            function: {
              name: 'web_search',
              description: 'Search the web',
              parameters: {
                type: 'object',
                properties: {
                  query: { type: 'string' }
                }
              }
            }
          }
        ],
        toolsState: {
          webSearchEnabled: true,
          codeInterpreterEnabled: false,
          fileSearchEnabled: false,
        },
      },
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('choices');
    
    // May or may not have tool calls depending on the model
    if (responseBody.choices[0].message.tool_calls) {
      expect(Array.isArray(responseBody.choices[0].message.tool_calls)).toBe(true);
    }
  });

  test('should handle invalid request body', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/turn_response`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        // Missing required messages field
        provider: 'openai',
      },
    });

    expect(response.status()).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('error');
  });

  test('should handle unsupported provider', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/turn_response`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        provider: 'unsupported',
        model: 'some-model',
      },
    });

    expect(response.status()).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('provider');
  });

  test('should handle API key errors', async ({ request }) => {
    // This test assumes invalid API keys are configured
    const response = await request.post(`${baseUrl}/api/turn_response`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        provider: 'openai',
        model: 'gpt-4',
      },
    });

    // Should either succeed (if valid keys) or fail gracefully
    expect([200, 401, 500]).toContain(response.status());
    
    if (response.status() !== 200) {
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('error');
    }
  });

  test('should handle rate limiting', async ({ request }) => {
    // Make multiple rapid requests to test rate limiting
    const requests = [];
    
    for (let i = 0; i < 10; i++) {
      requests.push(
        request.post(`${baseUrl}/api/turn_response`, {
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            messages: [
              { role: 'user', content: `Request ${i}` }
            ],
            provider: 'openai',
            model: 'gpt-4',
          },
        })
      );
    }

    const responses = await Promise.all(requests);
    
    // Most should succeed, but some might be rate limited
    const successCount = responses.filter(r => r.status() === 200).length;
    const rateLimitCount = responses.filter(r => r.status() === 429).length;
    
    expect(successCount + rateLimitCount).toBe(10);
    
    if (rateLimitCount > 0) {
      const rateLimitResponse = responses.find(r => r.status() === 429);
      const responseBody = await rateLimitResponse!.json();
      expect(responseBody).toHaveProperty('error');
      expect(responseBody.error).toContain('rate limit');
    }
  });

  test('should handle large message content', async ({ request }) => {
    const largeContent = 'A'.repeat(100000); // 100KB
    
    const response = await request.post(`${baseUrl}/api/turn_response`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        messages: [
          { role: 'user', content: largeContent }
        ],
        provider: 'openai',
        model: 'gpt-4',
      },
    });

    // Should either succeed or fail with appropriate error
    expect([200, 400, 413]).toContain(response.status());
    
    if (response.status() === 200) {
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('choices');
    } else {
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('error');
    }
  });

  test('should handle malformed JSON', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/turn_response`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: 'invalid json{',
    });

    expect(response.status()).toBe(400);
  });

  test('should handle missing content-type header', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/turn_response`, {
      data: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        provider: 'openai',
        model: 'gpt-4',
      }),
    });

    // Should still work if server can parse it
    expect([200, 400]).toContain(response.status());
  });

  test('should handle concurrent requests', async ({ request }) => {
    const requests = [];
    
    // Make 5 concurrent requests
    for (let i = 0; i < 5; i++) {
      requests.push(
        request.post(`${baseUrl}/api/turn_response`, {
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            messages: [
              { role: 'user', content: `Concurrent request ${i}` }
            ],
            provider: 'openai',
            model: 'gpt-4',
          },
        })
      );
    }

    const responses = await Promise.all(requests);
    
    // All should handle gracefully
    for (const response of responses) {
      expect([200, 429, 500]).toContain(response.status());
    }
    
    const successCount = responses.filter(r => r.status() === 200).length;
    expect(successCount).toBeGreaterThan(0);
  });

  test('should handle request timeout', async ({ request }) => {
    // This test might need to be adjusted based on actual timeout configuration
    const response = await request.post(`${baseUrl}/api/turn_response`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        messages: [
          { role: 'user', content: 'Generate a very long response' }
        ],
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 4000, // Request maximum tokens to potentially trigger timeout
      },
      timeout: 30000, // 30 second timeout
    });

    // Should either succeed or timeout
    expect([200, 408]).toContain(response.status());
  });

  test('should validate message format', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/turn_response`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        messages: [
          { role: 'invalid_role', content: 'Hello' }
        ],
        provider: 'openai',
        model: 'gpt-4',
      },
    });

    expect(response.status()).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('message');
  });

  test('should handle empty messages array', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/turn_response`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        messages: [],
        provider: 'openai',
        model: 'gpt-4',
      },
    });

    expect(response.status()).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('error');
  });

  test('should handle system message in array', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/turn_response`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello' }
        ],
        provider: 'openai',
        model: 'gpt-4',
      },
    });

    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('choices');
  });
});
