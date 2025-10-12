const router = require('express').Router();
const { postEvent } = require('../controllers/adminController');
/**
 * Route: POST /events
 * 
 * Purpose:
 *  - Handles HTTP POST requests to create a new event.
 *  - Delegates the request to the adminController's postEvent function.
 * 
 * Expected Inputs (via req.body):
 *  - name (string): Name of the event
 *  - date (string, ISO format recommended): Date of the event
 *  - tickets (integer >= 0): Number of tickets available
 * 
 * Expected Outputs:
 *  - On success: JSON object of the newly created event with HTTP status 201
 *  - On error: JSON object with error message (400 for invalid input, 500 for server error)
 * 
 * Side Effects:
 *  - Creates a new event in the database via the controller and model
 */
router.post('/events', postEvent);
module.exports = router;