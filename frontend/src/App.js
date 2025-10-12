import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const res = await fetch('http://localhost:6001/api/events');
      const data = await res.json();
      setEvents(data);
    } catch (e) {
      console.error(e);
      setMsg('Failed to load events');
    }
  };

  useEffect(() => { load(); }, []);

  const buyTicket = async (id, name) => {
    setMsg('Purchasing...');
    try {
      const res = await fetch(`http://localhost:6001/api/events/${id}/purchase`, {
        method: 'POST'
      });
      if (res.ok) {
        setMsg(`Ticket purchased for: ${name}`);
        await load(); // refresh counts
      } else {
        const { error } = await res.json().catch(() => ({ error: 'Purchase failed' }));
        setMsg(error || 'Purchase failed');
      }
    } catch {
      setMsg('Network error');
    }
  };

  return (
    <div className="App" style={{ maxWidth: 640, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>Clemson Campus Events</h1>
      <p aria-live="polite">{msg}</p>
      <ul>
        {events.map(evt => (
          <li key={evt.id} style={{ marginBottom: '0.5rem' }}>
            <strong>{evt.name}</strong> — {evt.date} — tickets left: {evt.tickets}{' '}
            <button onClick={() => buyTicket(evt.id, evt.name)} disabled={evt.tickets <= 0}>
              {evt.tickets > 0 ? 'Buy Ticket' : 'Sold Out'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
