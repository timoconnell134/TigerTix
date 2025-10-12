const express = require('express');
const cors = require('cors');
const routes = require('./routes/clientRoutes');

/**
 * Client Service Server
 * 
 * Purpose:
 *  - Sets up and starts the Express server for the client microservice.
 *  - Handles fetching events and purchasing tickets via API endpoints.
 * 
 * Expected Inputs:
 *  - Incoming HTTP requests from frontend or other clients.
 * 
 * Expected Outputs:
 *  - JSON responses with event data or purchase confirmations.
 * 
 * Side Effects:
 *  - Listens on port 6001.
 *  - Calls controller/model functions which read/update the shared SQLite database.
 */

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

const PORT = 6001;
app.listen(PORT, () => console.log(`Client service on http://localhost:${PORT}`));

// 404 for unknown routes 
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not found' });
});

// Unexpected Errors
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Server error' });
});
