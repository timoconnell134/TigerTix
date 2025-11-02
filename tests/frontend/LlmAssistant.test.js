import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import LlmAssistant from '../../frontend/src/LlmAssistant';

beforeEach(() => {
    // Mock network calls used by the component
    global.fetch = jest.fn(async (url, opts) => {
        if (url.includes('/api/llm/parse')) {
            return { ok: true, json: async () => ({ intent: 'book', event: 'Jazz Night', tickets: 2 }) };
        }
        if (url.includes('/api/llm/confirm')) {
            return { ok: true, json: async () => ({ ok: true, message: 'Booked 2 ticket(s) for Jazz Night.' }) };
        }
        if (url.includes('/api/events')) {
            return { ok: true, json: async () => ([{ id: 1, name: 'Jazz Night', date: '2025-12-10', tickets: 5 }]) };
        }
        return { ok: false, json: async () => ({ error: 'Bad' }) };
    });
});

test('proposes and confirms booking', async () => {
    render(<LlmAssistant onBooked={() => { }} />);

    // 🔧 Narrow the query to the INPUT (not the "Send message" button)
    const input = screen.getByLabelText(/message/i, { selector: 'input' });
    // (Alternatively: screen.getByRole('textbox', { name: /message/i }))

    fireEvent.change(input, { target: { value: 'Book 2 tickets for Jazz Night' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Wait for the confirm prompt to appear
    await waitFor(() => {
        // Use a broad match to avoid issues with fancy quotes
        expect(screen.getByText(/Confirm booking 2 ticket\(s\) for/i)).toBeInTheDocument();
    });

    // Click the Confirm button (has aria-label "Confirm booking for Jazz Night")
    const confirmBtn = screen.getByRole('button', { name: /confirm booking for jazz night/i });
    fireEvent.click(confirmBtn);

    // Success message
    await waitFor(() => {
        expect(screen.getByText(/Booked 2 ticket\(s\) for Jazz Night/i)).toBeInTheDocument();
    });
});
