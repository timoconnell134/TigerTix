import React, { useEffect, useMemo, useRef, useState } from 'react';

/** Service endpoints (match your running services) */
const API_LLM = 'http://localhost:7000/api/llm';   // /parse, /confirm
const API_CLIENT = 'http://localhost:6001/api';    // /events

/** Speech helpers  */
function hasSpeechRecognition() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
function makeRecognizer() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false; // rubric: show final text
    rec.maxAlternatives = 1;
    return rec;
}
function beep(durationMs = 120, freq = 880, gain = 0.12) {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(gain, ctx.currentTime);
        osc.start();
        setTimeout(() => { osc.stop(); ctx.close(); }, durationMs);
    } catch { /* audio might be blocked until a user gesture */ }
}
function speak(text) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 1;   // clear pacing for accessibility
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
}

/** Component */
export default function LlmAssistant({ onBooked }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hi! I can help you book tickets. Try: “Show events” or “Book 2 tickets for Movie Night.”' }
    ]);
    const [input, setInput] = useState('');
    const [pending, setPending] = useState(false);

    // Voice state
    const [listening, setListening] = useState(false);
    const srSupported = useMemo(() => hasSpeechRecognition(), []);
    const recRef = useRef(null);
    const liveRef = useRef(null);           // polite announcements for SR users
    const lastProposalRef = useRef(null);   // remember {event, tickets} for confirm

    /** Initialize SpeechRecognition */
    useEffect(() => {
        if (!srSupported) return;
        recRef.current = makeRecognizer();
        if (!recRef.current) return;

        recRef.current.onresult = (e) => {
            const text = (e.results?.[0]?.[0]?.transcript) || '';
            // Show recognized text BEFORE sending to LLM (rubric)
            push('user', text);
            handleSend(text); // send voice text to LLM
        };
        recRef.current.onend = () => setListening(false);
        recRef.current.onerror = () => setListening(false);
    }, [srSupported]);

    /** Utility: push message + live announcement */
    function push(role, text) {
        setMessages((m) => [...m, { role, text }]);
        if (role === 'assistant') {
            // announce briefly for screen readers
            setTimeout(() => { if (liveRef.current) liveRef.current.textContent = text; }, 0);
        }
    }

    /** Start the microphone, play a short beep, and begin SpeechRecognition.
 *  Side effects: updates `listening` state; may show alert on unsupported browsers. */
    function startMic() {
        if (!recRef.current) return alert('Speech recognition not supported in this browser.');
        beep();
        setListening(true);
        try { recRef.current.start(); } catch { /* already started */ }
    }

  /** Send either typed input or transcribed voice text to the LLM parse endpoint.
 *  @param {string=} textFromVoice  Optional text from SpeechRecognition.
 *  Side effects: clears input, toggles `pending`, pushes messages, speaks replies. */
    async function handleSend(textFromVoice) {
        const text = (textFromVoice ?? input).trim();
        if (!text || pending) return;
        if (!textFromVoice) {
            // typed: show user bubble first
            push('user', text);
        }
        setInput('');
        setPending(true);

        try {
            const res = await fetch(`${API_LLM}/parse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await res.json();

            if (!res.ok) {
                const msg = data?.error || 'Sorry, I couldn’t understand that. Try “Show events” or “Book 2 for Movie Night.”';
                push('assistant', msg); speak(msg);
                return;
            }

            // Expected shape from your service: { intent, event, tickets, ... }
            const { intent, event, tickets } = data;

            if (intent === 'greet') {
                const reply = 'Hello! Say “show events” to hear what’s available.';
                push('assistant', reply); speak(reply);
                return;
            }

            if (intent === 'show' || !event) {
                // Fetch events from client-service
                try {
                    const evRes = await fetch(`${API_CLIENT}/events`);
                    const events = await evRes.json();
                    const avail = (events || []).filter((e) => e.tickets > 0);
                    if (avail.length === 0) {
                        const reply = 'There are no events with tickets right now.';
                        push('assistant', reply); speak(reply);
                    } else {
                        // Keep spoken list short to reduce cognitive load
                        const top = avail.slice(0, 3);
                        const list = top.map((e) => `• ${e.name} — ${e.date} (${e.tickets} left)`).join('\n');
                        const reply = `Here are some events with tickets:\n${list}\n\nYou can say: “Book 1 ticket for ${top[0].name}.”`;
                        push('assistant', reply);
                        speak(`Here are some events with tickets. ${top.map(e => `${e.name}, ${e.tickets} left`).join('. ')}.`);
                    }
                } catch {
                    const reply = 'I had trouble loading events. Please try again.';
                    push('assistant', reply); speak(reply);
                }
                return;
            }

            if (intent === 'book') {
                // Proposal only — DO NOT auto-book
                lastProposalRef.current = { event, tickets };
                const reply = `I can book ${tickets} ticket${tickets > 1 ? 's' : ''} for “${event}”. Use Confirm when ready.`;
                push('assistant', reply); speak(`I can prepare ${tickets} tickets for ${event}. Please confirm.`);
                // Render a confirm prompt in the transcript
                setMessages((m) => [...m, { role: 'confirm', event, tickets }]);
                return;
            }

            const fallback = 'I can show events or help propose a booking.';
            push('assistant', fallback); speak(fallback);
        } catch {
            push('assistant', 'Network error. Please try again.');
            speak('Network error. Please try again.');
        } finally {
            setPending(false);
        }
    }

   /** Confirm a proposed booking via the LLM confirm endpoint.
 *  @param {string} event   Event name
 *  @param {number} tickets Ticket count
 *  Side effects: toggles `pending`, prunes confirm prompts, triggers parent refresh. */
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
                const msg = data.message || `Booked ${tickets} ticket(s) for ${event}.`;
                push('assistant', msg); speak(msg);
                if (onBooked) onBooked(); // refresh parent event list
            } else {
                const err = data?.error || 'Booking failed.';
                push('assistant', err); speak('Booking failed.');
            }
        } catch {
            push('assistant', 'Network error during booking.');
            speak('Network error during booking.');
        } finally {
            // remove pending confirm prompts
            setMessages((m) => m.filter((x) => x.role !== 'confirm'));
            setPending(false);
        }
    }

    return (
        <section aria-labelledby="llm-heading" className="llm-assistant">
            <h2 id="llm-heading">LLM Booking Assistant (Beta)</h2>

            {/* Screen-reader friendly announcements */}
            <div role="status" aria-live="polite" className="sr-live" ref={liveRef} />

            {/* Transcript */}
            <div className="llm-log" role="log" aria-live="polite" aria-label="Chat transcript">
                {messages.map((m, idx) => {
                    if (m.role === 'confirm') {
                        return (
                            <div key={idx} className="msg assistant">
                                <div className="confirm-box">
                                    <span>Confirm booking {m.tickets} ticket(s) for “{m.event}”?</span>
                                    <div className="confirm-actions">
                                        <button
                                            onClick={() => handleConfirm(m.event, m.tickets)}
                                            aria-label={`Confirm booking for ${m.event}`}
                                            disabled={pending}
                                        >
                                            Confirm
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

            {/* Input row with Send + Mic */}
            <div className="llm-input">
                <label htmlFor="llm-text" className="visually-hidden">Message</label>
                <input
                    id="llm-text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => (e.key === 'Enter' ? handleSend() : null)}
                    placeholder="e.g., Book 2 tickets for Movie Night"
                    disabled={pending}
                    aria-disabled={pending}
                />
                <button onClick={() => handleSend()} disabled={pending} aria-label="Send message">
                    {pending ? 'Working…' : 'Send'}
                </button>
                <button
                    onClick={startMic}
                    aria-pressed={listening}
                    aria-label="Start voice input"
                    disabled={!srSupported || pending}
                    title={srSupported ? 'Start voice input' : 'Speech recognition not supported'}
                >
                    🎤 Mic
                </button>
            </div>
        </section>
    );
}
