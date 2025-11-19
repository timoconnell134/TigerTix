const router = require('express').Router();
const { listEvents, buy } = require('../controllers/clientController');

// Import authentication middleware
const auth = require('../middleware/authMiddleware');


/**
 * Client Service Routes
 * 
 * Purpose:
 *  - Defines API endpoints for the client microservice.
 *  - Delegates requests to controller functions.
 * 
 * Routes:
 *  - GET /api/events         -> Returns a list of all events
 *  - POST /api/events/:id/purchase -> Purchases one ticket for the specified event
 * 
 * Side Effects:
 *  - None directly; side effects occur in controller/model when handling requests
 */

router.get('/events', listEvents);                 // List events
router.post('/events/:id/purchase', auth, buy);          // Buy one ticket

module.exports = router;
