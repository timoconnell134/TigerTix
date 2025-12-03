import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext';
import LlmAssistant from './LlmAssistant';

const CLIENT_API =
    process.env.REACT_APP_CLIENT_API || 'http://localhost:6001/api';


function HomePage() {
    const [events, setEvents] = useState([]);
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const { user, logout } = useContext(UserContext);
    const navigate = useNavigate();

    /**
     * Load the list of events from the client service.
     */
    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${CLIENT_API}/events`);
            if (!res.ok) {
                throw new Error('Failed to load events');
            }
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

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Buy a ticket for a specific event.
     * Requires the user to be logged in with a valid JWT.
     * If the token is expired/invalid (401), logs the user out and redirects to /login.
     */
    const buyTicket = async (id, name, date) => {
        if (!user) {
            setMsg('You must be logged in to purchase tickets.');
            return;
        }

        try {
            const res = await fetch(`${CLIENT_API}/events/${id}/purchase`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });

            if (res.ok) {
                setMsg(`Ticket purchased for ${name} on ${date}.`);
                await load();
            } else {
                // Handle token expiration / invalid token
                if (res.status === 401) {
                    setMsg('Session expired. Please log in again.');
                    logout();
                    navigate('/login');
                    return;
                }

                const body = await res.json().catch(() => ({}));
                setMsg(body.error || 'Purchase failed.');
            }
        } catch (e) {
            console.error(e);
            setMsg('Network error.');
        }
    };

    return (
        <main id="main" className="site-main">
            {/* Status / announcements */}
            <div role="status" aria-live="polite" className="status">
                {msg}
            </div>

            <div className="controls">
                <button disabled={loading} onClick={load}>
                    {loading ? 'Loading…' : 'Reload Events'}
                </button>
            </div>

            <h2>Available Events</h2>

            {events.length === 0 && !loading && (
                <p>No events available yet.</p>
            )}

            <ul className="event-list">
                {events.map((evt) => (
                    <li key={evt.id} className="event-item">
                        <div className="event-info">
                            <strong>{evt.name}</strong> — {evt.date} — tickets: {evt.tickets}
                        </div>
                        <button
                            disabled={evt.tickets <= 0}
                            onClick={() => buyTicket(evt.id, evt.name, evt.date)}
                        >
                            {evt.tickets > 0 ? 'Buy Ticket' : 'Sold Out'}
                        </button>
                    </li>
                ))}
            </ul>

            {/* LLM assistant still works and can refresh events after booking */}
            <LlmAssistant onBooked={load} />
        </main>
    );
}

export default HomePage;
