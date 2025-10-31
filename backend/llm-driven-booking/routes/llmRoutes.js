const router = require('express').Router();
const { parseText, confirm } = require('../controllers/llmController');

router.post('/parse', parseText);   // returns structured JSON only
router.post('/confirm', confirm);   // performs the booking transaction

module.exports = router;
