const router = require('express').Router();
const processingController = require('../controllers/processing');

// Route to trigger the deeper analysis (mocked)
router.route('/trigger').post(processingController.triggerAnalysis);

module.exports = router;
