const router = require('express').Router();
const { listEvents, buy } = require('../controllers/clientController');

router.get('/events', listEvents);                 // List events
router.post('/events/:id/purchase', buy);          // Buy one ticket

module.exports = router;
