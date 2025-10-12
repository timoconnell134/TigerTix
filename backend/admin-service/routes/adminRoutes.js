const router = require('express').Router();
const { postEvent } = require('../controllers/adminController');
router.post('/events', postEvent);
module.exports = router;