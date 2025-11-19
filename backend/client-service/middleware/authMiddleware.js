const jwt = require('jsonwebtoken');
const SECRET = 'tiger_tix_secret';

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    if (!token) {
        return res.status(401).json({ error: 'Missing token' });
    }

    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Token expired' });
    }
};
