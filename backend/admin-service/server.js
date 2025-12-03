const express = require('express');
const cors = require('cors');
const routes = require('./routes/adminRoutes');
const setup = require('./setup');
/**
 * Admin Service Server
 * 
 * Purpose:
 *  - Sets up and starts the Express server for the admin microservice.
 *  - Configures middleware, routes, and CORS for handling requests.
 * 
 * Expected Inputs:
 *  - None (server reads configuration from setup and environment)
 * 
 * Expected Outputs:
 *  - Starts listening on the defined PORT (5000) and logs the URL.
 * 
 * Side Effects:
 *  - Initializes any necessary setup via `setup()`.
 *  - Exposes `/api/admin` endpoints for client requests.
 */
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/admin', routes);


const PORT = process.env.PORT || 5000;


setup().then(() => {
    app.listen(PORT, () => console.log(`Admin service on http://localhost:${PORT}`));
});


app.use((req, res, next) => {
    res.status(404).json({ error: 'Not found' });
});


app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Server error' });
});
