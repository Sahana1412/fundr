const express = require('express');
const router = express.Router();
const { createDonation } = require('../controllers/donationController');
const { donationValidationRules, validateResults } = require('../middleware/validation');

// Log simulated donation
router.post('/donate/:id', donationValidationRules, validateResults, createDonation);

module.exports = router;
