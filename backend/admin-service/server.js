const express = require('express');
const cors = require('cors');
const routes = require('./routes/adminRoutes');
const setup = require('./setup');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

setup().then(() => {
    app.listen(5001, () => console.log('Admin service on http://localhost:5001'));
});