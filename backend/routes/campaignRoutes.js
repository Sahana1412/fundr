const express = require('express');
const router = express.Router();
const {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getStats
} = require('../controllers/campaignController');
const { campaignUploadFields } = require('../middleware/upload');
const { campaignValidationRules, validateResults } = require('../middleware/validation');

// Statistics Route (must be before /campaigns/:id to prevent matching ':id')
router.get('/stats', getStats);

// Campaigns List and Create Routes
router.route('/campaigns')
  .get(getCampaigns)
  .post(campaignUploadFields, campaignValidationRules, validateResults, createCampaign);

// Campaign Detail, Edit, and Delete Routes
router.route('/campaigns/:id')
  .get(getCampaignById)
  .put(campaignUploadFields, campaignValidationRules, validateResults, updateCampaign)
  .delete(deleteCampaign);

module.exports = router;
