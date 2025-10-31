const { parseWithLLM } = require('../nlp/llmParser');
const { confirmBooking } = require('../models/llmModel');

exports.parseText = async (req, res) => {
    try {
        const text = (req.body?.text || '').trim();
        if (!text) return res.status(400).json({ error: 'Missing text' });
        const result = await parseWithLLM(text);
        return res.json(result);
    } catch (e) {
        const hint = "Try: 'Book 2 tickets for Jazz Night'";
        return res.status(400).json({ error: e.message || 'Could not understand request', hint });
    }
};

exports.confirm = async (req, res) => {
    try {
        const { event, tickets } = req.body || {};
        const qty = Number.isInteger(tickets) ? tickets : Number(tickets);
        if (!event || !Number.isFinite(qty) || qty < 1) {
            return res.status(400).json({ error: 'Invalid input' });
        }
        const out = await confirmBooking({ eventName: String(event), qty: Math.floor(qty) });
        return res.json({
            ok: true,
            message: `Booked ${out.qty} ticket(s) for ${out.eventName}.`,
            bookingId: out.bookingId
        });
    } catch (e) {
        if (e.code === 404) return res.status(404).json({ error: 'Event not found' });
        if (e.code === 409) return res.status(409).json({ error: 'Not enough tickets' });
        console.error(e);
        return res.status(500).json({ error: 'Server error' });
    }
};
