import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Load events from the CLIENT service (port 6001)
  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:6001/api/events');
      if (!res.ok) throw new Error('Failed to load events');
      const data = await res.json();
      setEvents(data);
      setMsg('');
    } catch (e) {
      console.error(e);
      setMsg('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Purchase one ticket for a given event
  const buyTicket = async (id, name, date) => {
    setMsg('Purchasing…');
    try {
      const res = await fetch(`http://localhost:6001/api/events/${id}/purchase`, {
        method: 'POST'
      });
      if (res.ok) {
        setMsg(`Ticket purchased for ${name} on ${date}.`);
        await load(); // refresh to show updated ticket count
      } else {
        const body = await res.json().catch(() => ({}));
        setMsg(body.error || 'Purchase failed.');
      }
    } catch {
      setMsg('Network error. Please try again.');
    }
  };

  return (
    <>
      {/* Skip link for keyboard/screen reader users */}
      <a className="skip-link" href="#main">Skip to main content</a>

      <header className="site-header" role="banner">
        <h1>Clemson Campus Events</h1>
      </header>

      <main id="main" className="site-main" role="main">
        {/* Live region for announcements/confirmations */}
        <div role="status" aria-live="polite" className="status">
          {msg}
        </div>

        <div className="controls">
          <button onClick={load} aria-label="Reload events list" disabled={loading}>
            {loading ? 'Loading…' : 'Reload Events'}
          </button>
        </div>

        <section aria-labelledby="events-heading">
          <h2 id="events-heading">Available Events</h2>

          {events.length === 0 && !loading && (
            <p>No events available yet.</p>
          )}

          <ul className="event-list">
            {events.map(evt => (
              <li key={evt.id} className="event-item">
                <div className="event-info">
                  <span className="event-name">{evt.name}</span>
                  <span className="event-date"> — {evt.date}</span>
                  <span className="event-tix">
                    {' '}— tickets left: <strong>{evt.tickets}</strong>
                  </span>
                </div>

                <div className="event-actions">
                  <button
                    aria-label={`Buy ticket for ${evt.name} on ${evt.date}`}
                    onClick={() => buyTicket(evt.id, evt.name, evt.date)}
                    disabled={evt.tickets <= 0}
                    aria-disabled={evt.tickets <= 0}
                  >
                    {evt.tickets > 0 ? 'Buy Ticket' : 'Sold Out'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="site-footer" role="contentinfo">
        <small>© {new Date().getFullYear()} TigerTix (Sprint 1)</small>
      </footer>
    </>
  );
}

export default App;
