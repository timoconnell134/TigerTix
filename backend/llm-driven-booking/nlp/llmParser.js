const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const numberWords = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

function fallbackParse(text) {
    const lower = text.toLowerCase();
    let intent = 'greet';
    if (/(book|buy|purchase)/.test(lower)) intent = 'book';
    else if (/(show|list|see).*events|^events$| events/.test(lower)) intent = 'show';

    let tickets = 1;
    const digit = lower.match(/\b(\d+)\b/);
    if (digit) tickets = parseInt(digit[1], 10);
    else {
        const word = Object.keys(numberWords).find(w => lower.includes(w));
        if (word) tickets = numberWords[word];
    }

    let event = null;
    const m = text.match(/for\s+(.+)$/i);
    if (m) event = m[1].trim().replace(/[.?!]+$/, '');
    return { event, tickets, intent };
}

exports.parseWithLLM = async (text) => {
    try {
        const sys = `You are a strict JSON parser for event bookings.
Return ONLY valid JSON with keys: event (string or null), tickets (integer >=1), intent in {"book","show","greet"}.`;
        const user = `Text: "${text}"`;
        const resp = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
            temperature: 0
        });
        const raw = resp.choices?.[0]?.message?.content?.trim() || '';
        const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
        if (s === -1 || e === -1) throw new Error('bad-json');
        const parsed = JSON.parse(raw.slice(s, e + 1));
        const event = typeof parsed.event === 'string' ? parsed.event.trim() : null;
        const t = Number(parsed.tickets);
        const tickets = Number.isFinite(t) && t >= 1 ? Math.floor(t) : 1;
        const intent = ['book', 'show', 'greet'].includes(parsed.intent) ? parsed.intent : 'greet';
        if (!event && intent === 'book') {
            const fb = fallbackParse(text);
            return { event: fb.event, tickets, intent: 'book' };
        }
        return { event, tickets, intent };
    } catch {
        const out = fallbackParse(text);
        if (!out.event && out.intent === 'book') throw new Error('Could not understand request');
        return out;
    }
};
