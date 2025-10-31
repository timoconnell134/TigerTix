import React, { useRef, useState } from 'react';

const API_LLM = 'http://localhost:7000/api/llm';
const API_CLIENT = 'http://localhost:6001/api';

export default function LlmAssistant({ onBooked }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hi! I can help you book tickets. Try: “Show events” or “Book 2 tickets for Jazz Night.”' }
    ]);
    const [input, setInput] = useState('');
    const [pending, setPending] = useState(false);
    const liveRef = useRef(null);

    const push = (role, text) => {
        setMessages(m => [...m, { role, text }]);
        // announce latest assistant text for screen readers
        if (role === 'assistant') {
            setTimeout(() => {
                if (liveRef.current) liveRef.current.textContent = text;
            }, 0);
        }
    };

    async function handleSend() {
        const text = input.trim();
        if (!text || pending) return;
        setPending(true);
        push('user', text);
        setInput('');

        try {
            const res = await fetch(`${API_LLM}/parse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await res.json();

            if (!res.ok) {
                push('assistant', data?.error || 'Sorry, I could not understand. Try: “Book 2 tickets for Jazz Night.”');
                setPending(false);
                return;
            }

            const { intent, event, tickets } = data;

            if (intent === 'greet') {
                push('assistant', 'Hello! Ask me to “show events” or say “book 2 tickets for Jazz Night”.');
            } else if (intent === 'show' || !event) {
                // fetch available events
                const evRes = await fetch(`${API_CLIENT}/events`);
                const events = await evRes.json();
                const avail = (events || []).filter(e => e.tickets > 0);
                if (avail.length === 0) push('assistant', 'No events with available tickets right now.');
                else {
                    const list = avail.map(e => `• ${e.name} — ${e.date} (${e.tickets} left)`).join('\n');
                    push('assistant', `Here are events with tickets:\n${list}\n\nYou can say: “Book 1 ticket for ${avail[0].name}.”`);
                }
            } else if (intent === 'book') {
                // confirmation step only (no booking yet)
                push('assistant', `I’m about to book ${tickets} ticket(s) for “${event}”. Confirm below.`);
                setMessages(m => [...m, { role: 'confirm', event, tickets }]);
            } else {
                push('assistant', 'I can show events or help book tickets.');
            }
        } catch {
            push('assistant', 'Network error. Please try again.');
        } finally {
            setPending(false);
        }
    }

    async function handleConfirm(event, tickets) {
        if (pending) return;
        setPending(true);
        try {
            const res = await fetch(`${API_LLM}/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event, tickets })
            });
            const data = await res.json();
            if (res.ok) {
                push('assistant', data.message || `Booked ${tickets} ticket(s) for ${event}.`);
                if (onBooked) onBooked(); // refresh main list in parent
            } else {
                push('assistant', data?.error || 'Booking failed.');
            }
        } catch {
            push('assistant', 'Network error during booking.');
        } finally {
            // remove all pending confirm prompts
            setMessages(m => m.filter(msg => msg.role !== 'confirm'));
            setPending(false);
        }
    }

    return (
        <section aria-labelledby="llm-heading" className="llm-assistant">
            <h2 id="llm-heading">LLM Booking Assistant (Beta)</h2>

            {/* live region for screen readers */}
            <div role="status" aria-live="polite" className="sr-live" ref={liveRef} />

            <div className="llm-log" aria-label="Chat transcript">
                {messages.map((m, idx) => {
                    if (m.role === 'confirm') {
                        return (
                            <div key={idx} className="msg assistant">
                                <div className="confirm-box">
                                    <span>Confirm booking {m.tickets} ticket(s) for “{m.event}”?</span>
                                    <div className="confirm-actions">
                                        <button
                                            onClick={() => handleConfirm(m.event, m.tickets)}
                                            aria-label={`Confirm booking for ${m.event}`}>
                                            Confirm Booking
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div key={idx} className={`msg ${m.role}`}>
                            <pre>{m.text}</pre>
                        </div>
                    );
                })}
            </div>

            <div className="llm-input">
                <label htmlFor="llm-text" className="visually-hidden">Message</label>
                <input
                    id="llm-text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' ? handleSend() : null}
                    placeholder="e.g., Book 2 tickets for Jazz Night"
                    disabled={pending}
                    aria-disabled={pending}
                />
                <button onClick={handleSend} disabled={pending} aria-label="Send message">
                    {pending ? 'Working…' : 'Send'}
                </button>
            </div>
        </section>
    );
}
