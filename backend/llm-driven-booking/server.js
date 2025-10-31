require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes/llmRoutes');

const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());
app.use('/api/llm', routes);

app.get('/api/llm/health', (_req, res) => res.json({ ok: true }));

// 404 + error handlers
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`LLM service on http://localhost:${PORT}`));
