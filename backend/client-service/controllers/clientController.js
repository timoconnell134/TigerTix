const { getEvents, purchaseTicket } = require('../models/clientModel');

exports.listEvents = async (_req, res) => {
    try {
        const rows = await getEvents();
        res.json(rows);
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
};

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
