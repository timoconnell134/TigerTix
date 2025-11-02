// tests/llm/parseWithLLM.test.js

// 1) Provide a dummy key so the SDK constructor (if ever reached) won't throw
process.env.OPENAI_API_KEY = 'test-key';

// 2) Mock the OpenAI client so no real network calls are made.
//    { virtual: true } ensures Jest doesn't try to resolve the real package.
jest.mock('openai', () => {
    return function Mock() {
        return {
            chat: {
                completions: {
                    create: async () => ({
                        choices: [
                            { message: { content: '{"event":"Jazz Night","tickets":2,"intent":"book"}' } }
                        ]
                    })
                }
            }
        };
    };
}, { virtual: true });

// 3) Require the parser AFTER setting up the mock so the mock is used.
const { parseWithLLM } = require('../../backend/llm-driven-booking/nlp/llmParser');

test('parses intent/event/tickets via LLM', async () => {
    const out = await parseWithLLM('Book two tickets for Jazz Night');
    expect(out).toEqual({ event: 'Jazz Night', tickets: 2, intent: 'book' });
});

test('falls back to keyword/number parsing when LLM returns non-JSON', async () => {
    // Rewire modules so we can swap the mock implementation for this test
    jest.resetModules();

    // Re-apply dummy key and a new mock that returns bad JSON
    process.env.OPENAI_API_KEY = 'test-key';
    jest.doMock('openai', () => {
        return function Bad() {
            return {
                chat: {
                    completions: {
                        create: async () => ({
                            choices: [{ message: { content: 'not-json' } }]
                        })
                    }
                }
            };
        };
    }, { virtual: true });

    // Re-require the parser so it picks up the new mock
    const { parseWithLLM: alt } = require('../../backend/llm-driven-booking/nlp/llmParser');

    const out = await alt('Book 3 for Rock Fest');
    expect(out.intent).toBe('book');
    expect(out.event).toBe('Rock Fest');
    expect(out.tickets).toBe(3);
});
