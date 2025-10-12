const express = require('express');
const cors = require('cors');
const routes = require('./routes/adminRoutes');
const setup = require('./setup');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

const PORT = 5000;
setup().then(() => {
    app.listen(PORT, () => console.log(`Admin service on http://localhost:${PORT}`));
});
