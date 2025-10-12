const { createEvent } = require('../models/adminModel');

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