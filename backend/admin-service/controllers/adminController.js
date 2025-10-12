const { createEvent } = require('../models/adminModel');

/**
 * Handles the creation of a new event.
 *
 * Purpose:
 *  - Validates input from the client.
 *  - Calls the model to create a new event in the database.
 *  - Returns the created event or an error response.
 *
 * Expected Inputs (parameters):
 *  - req: Express request object
 *      - req.body.name (string): Name of the event
 *      - req.body.date (string, ISO YYYY-MM-DD)
 *      - req.body.tickets (integer >= 0): Number of tickets available
 *  - res: Express response object
 *
 * Expected Outputs (return values):
 *  - 201: JSON of the newly created event
 *  - 400: JSON { error, details? } on invalid input
 *  - 500: JSON { error } via central error handler for unexpected errors
 *
 * Side Effects:
 *  - Creates a new event record in the database via createEvent
 */
exports.postEvent = async (req, res, next) => {
    try {
        const { name, date, tickets } = req.body || {};

        // normalization
        const trimmedName = typeof name === 'string' ? name.trim() : '';
        const ticketsNum = typeof tickets === 'string' ? Number(tickets) : tickets;

        // ISO date check (YYYY-MM-DD) and real calendar date validation
        const isoDate = /^\d{4}-\d{2}-\d{2}$/;
        const dateLooksISO = typeof date === 'string' && isoDate.test(date);
        const dateIsValid = dateLooksISO && (() => {
            const d = new Date(date);
            // Ensure it round-trips to the same YYYY-MM-DD and isn't Invalid Date
            return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
        })();

        // Validate required fields
        if (!trimmedName || !dateIsValid || !Number.isInteger(ticketsNum) || ticketsNum < 0) {
            return res.status(400).json({
                error: 'Invalid input',
                details: {
                    name: !!trimmedName || 'required',
                    date: dateIsValid ? true : 'use YYYY-MM-DD and a real calendar date',
                    tickets: Number.isInteger(ticketsNum) && ticketsNum >= 0 ? true : 'integer >= 0 required'
                }
            });
        }

        const out = await createEvent({ name: trimmedName, date, tickets: ticketsNum });
        return res.status(201).json(out);
    } catch (e) {
        // Let centralized error middleware produce a consistent 500
        return next(e);
    }
};
