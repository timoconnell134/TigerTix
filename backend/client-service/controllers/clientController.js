const { getEvents, purchaseTicket } = require('../models/clientModel');

/**
 * List all available events.
 * 
 * Purpose:
 *  - Fetches all events from the database and returns them as JSON.
 * 
 * Expected Inputs:
 *  - _req (Request object from Express, unused here)
 * 
 * Expected Outputs:
 *  - JSON array of event objects: [{ id, name, date, tickets }, ...]
 *  - HTTP 500 if there is a server error.
 * 
 * Side Effects:
 *  - Reads from the shared SQLite database via the client model.
 */

exports.listEvents = async (_req, res) => {
    try {
        const rows = await getEvents();
        res.json(rows);
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Purchase a ticket for a specific event.
 * 
 * Purpose:
 *  - Decreases the ticket count for the event with the given ID.
 *  - Returns success or an appropriate error if the event is sold out or not found.
 * 
 * Expected Inputs:
 *  - req.params.id (Number): ID of the event to purchase a ticket for
 * 
 * Expected Outputs:
 *  - JSON { ok: true } on success
 *  - HTTP 404 if the event is not found
 *  - HTTP 409 if the event is sold out
 *  - HTTP 500 for server errors
 * 
 * Side Effects:
 *  - Updates the ticket count in the shared SQLite database
 */

exports.buy = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        await purchaseTicket(id);
        res.json({ ok: true });
    } catch (e) {
        if (e.code === 404) return res.status(404).json({ error: 'Not found' });
        if (e.code === 409) return res.status(409).json({ error: 'Sold out' });
        res.status(500).json({ error: 'Server error' });
    }
};
