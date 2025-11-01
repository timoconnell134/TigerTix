import React, { useEffect, useMemo, useRef, useState } from 'react';

/** ====== Config (matches your services) ====== */
const API_LLM = 'http://localhost:7000/api/llm';   // /parse, /confirm
const API_CLIENT = 'http://localhost:6001/api';    // /events

/** ====== Speech helpers (no extra deps) ====== */
function hasSpeechRecognition() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
function makeRecognizer() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = 'en-US';
  rec.interimResults = false; // show only final result
  rec.maxAlternatives = 1;
  return rec;
}
function beep(durationMs = 120, freq = 880, gain = 0.12) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, durationMs);
  } catch { /* ignore if blocked */ }
}
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 1;   // clear pacing
  u.pitch = 1;
  window.speechSynthesis.cancel(); // avoid overlap
  window.speechSynthesis.speak(u);
}

/** ====== Component ====== */
export default function VoiceAssistant({ onBooked }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! Tap the mic, speak your request, or type it. Try: “Show events” or “Book 2 for Jazz Night.”' }
  ]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [listening, setListening] = useState(false);
  const srSupported = useMemo(() => hasSpeechRecognition(), []);
  const recRef = useRef(null);
  const liveRef = useRef(null);      // polite announcements
  const lastParsedRef = useRef(null); // remember last proposal for confirm

  /** Initialize recognizer */
  useEffect(() => {
    if (!srSupported) return;
    recRef.current = makeRecognizer();
    if (!recRef.current) return;

    recRef.current.onresult = (e) => {
      const text = (e.results[0][0] && e.results[0][0].transcript) || '';
      // Show recognized text BEFORE sending to LLM (rubric)
      push('user', text);
      setInput(''); // clear any typed text
      void sendToLLM(text);
    };
    recRef.current.onend = () => setListening(false);
    recRef.current.onerror = () => setListening(false);
  }, [srSupported]);

  /** A11y: announce assistant updates */
  function push(role, text) {
    setMessages((m) => [...m, { role, text }]);
    if (role === 'assistant') {
      setTimeout(() => { if (liveRef.current) liveRef.current.textContent = text; }, 0);
    }
  }

  /** Mic start */
  function startMic() {
    if (!recRef.current) return alert('Speech recognition not supported in this browser.');
    beep();
    setListening(true);
    try { recRef.current.start(); } catch { /* already started */ }
  }

  /** Manual send */
  async function handleSend() {
    const text = input.trim();
    if (!text || pending) return;
    push('user', text);
    setInput('');
    await sendToLLM(text);
  }

  /** Core LLM call */
  async function sendToLLM(text) {
    setPending(true);
    try {
      const res = await fetch(`${API_LLM}/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();

      if (!res.ok) {
        push('assistant', data?.error || 'Sorry, I couldn’t understand that. Try “Show events” or “Book 2 for Jazz Night.”');
        speak('Sorry, I could not understand that.');
        return;
      }

      // Your llm-service returns { intent, event, tickets } (plus extras)
      const { intent, event, tickets } = data;

      if (intent === 'greet') {
        const reply = 'Hello! Say “show events” to hear what’s available.';
        push('assistant', reply); speak(reply);
      } else if (intent === 'show' || !event) {
        // Load available events from client-service
        const evRes = await fetch(`${API_CLIENT}/events`);
        const events = await evRes.json().catch(() => []);
        const avail = (events || []).filter((e) => e.tickets > 0);
        if (avail.length === 0) {
          const reply = 'There are no events with tickets right now.';
          push('assistant', reply); speak(reply);
        } else {
          // Keep spoken list short (reduce cognitive load)
          const top = avail.slice(0, 3);
          const list = top.map((e) => `• ${e.name} — ${e.date} (${e.tickets} left)`).join('\n');
          const reply = `Here are some events with tickets:\n${list}\n\nYou can say: “Book 1 ticket for ${top[0].name}.”`;
          push('assistant', reply); speak(`Here are some events with tickets. ${top.map(e => `${e.name}, ${e.tickets} left`).join('. ')}.`);
        }
      } else if (intent === 'book') {
        // Proposal only — do NOT auto-book (rubric)
        lastParsedRef.current = { event, tickets };
        const reply = `I can book ${tickets} ticket${tickets > 1 ? 's' : ''} for “${event}”. Use Confirm when ready.`;
        push('assistant', reply); speak(`I can prepare ${tickets} tickets for ${event}. Please confirm.`);
        // Insert a confirm box as a special message
        setMessages((m) => [...m, { role: 'confirm', event, tickets }]);
      } else {
        const reply = 'I can show events or help propose a booking.';
        push('assistant', reply); speak(reply);
      }
    } catch {
      push('assistant', 'Network error. Please try again.');
      speak('Network error. Please try again.');
    } finally {
      setPending(false);
    }
  }

  /** Explicit confirmation (still optional for Task 2, but safe) */
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
    <section aria-labelledby="va-heading" className="llm-assistant">
      <h2 id="va-heading">Voice Assistant (Beta)</h2>

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
                      aria-label={`Confirm booking for ${m.event}`}>
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

      {/* Input row */}
      <div className="llm-input">
        <label htmlFor="va-text" className="visually-hidden">Message</label>
        <input
          id="va-text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => (e.key === 'Enter' ? handleSend() : null)}
          placeholder="e.g., Book 2 tickets for Jazz Night"
          disabled={pending}
          aria-disabled={pending}
        />
        <button onClick={handleSend} disabled={pending} aria-label="Send message">
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
