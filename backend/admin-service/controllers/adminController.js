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
 *      - req.body.date (string, ISO format recommended): Date of the event
 *      - req.body.tickets (integer >= 0): Number of tickets available
 *  - res: Express response object
 * 
 * Expected Outputs (return values):
 *  - On success: JSON object of the newly created event with HTTP status 201
 *  - On client error: JSON object with error message and HTTP status 400
 *  - On server error: JSON object with error message and HTTP status 500
 * 
 * Side Effects:
 *  - Creates a new event record in the database via createEvent model function
 */
exports.postEvent = async (req, res) => {
    try {
        const { name, date, tickets } = req.body || {};
        if (!name || !date || !Number.isInteger(tickets) || tickets < 0) {
            return res.status(400).json({ error: 'Invalid input' });
        }
        const out = await createEvent({ name, date, tickets });
        res.status(201).json(out);
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
};