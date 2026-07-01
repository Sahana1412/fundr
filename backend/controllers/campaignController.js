const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Helper function to delete file safely
const deleteFile = (filePath) => {
  if (filePath) {
    const fullPath = path.join(__dirname, '..', filePath);
    fs.unlink(fullPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error(`Failed to delete file ${fullPath}:`, err);
      }
    });
  }
};

// @desc    Get all campaigns (with filters, search, sort)
// @route   GET /api/campaigns
// @access  Public
exports.getCampaigns = async (req, res, next) => {
  try {
    const { category, search, sort } = req.query;
    let query = {};

    // 1. Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // 2. Search filter (case-insensitive regex match on title, description, name, or location)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { name: searchRegex },
        { location: searchRegex }
      ];
    }

    // Initialize query builder
    let campaignsQuery = Campaign.find(query);

    // 3. Sorting
    if (sort) {
      switch (sort) {
        case 'Newest':
          campaignsQuery = campaignsQuery.sort({ createdAt: -1 });
          break;
        case 'Oldest':
          campaignsQuery = campaignsQuery.sort({ createdAt: 1 });
          break;
        case 'Most Funded':
          campaignsQuery = campaignsQuery.sort({ fundsRaised: -1 });
          break;
        case 'Least Funded':
          campaignsQuery = campaignsQuery.sort({ fundsRaised: 1 });
          break;
        case 'Highest Goal':
          campaignsQuery = campaignsQuery.sort({ targetAmount: -1 });
          break;
        default:
          campaignsQuery = campaignsQuery.sort({ createdAt: -1 });
      }
    } else {
      campaignsQuery = campaignsQuery.sort({ createdAt: -1 });
    }

    const campaigns = await campaignsQuery;
    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single campaign
// @route   GET /api/campaigns/:id
// @access  Public
exports.getCampaignById = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      res.status(404);
      throw new Error('Campaign not found');
    }

    // Fetch latest donations for this campaign
    const donations = await Donation.find({ campaignId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: campaign,
      donations: donations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new campaign
// @route   POST /api/campaigns
// @access  Public (Simulated credentials return)
exports.createCampaign = async (req, res, next) => {
  try {
    const { name, email, phone, title, description, category, location, targetAmount, upiId } = req.body;

    // Check if profileImage file was uploaded
    if (!req.files || !req.files.profileImage) {
      res.status(400);
      throw new Error('Profile image is required');
    }

    // Extract file paths (Multer saves to directory, we store web-accessible path)
    const profileImagePath = `uploads/${req.files.profileImage[0].filename}`;
    const governmentIdPath = req.files.governmentId ? `uploads/${req.files.governmentId[0].filename}` : undefined;
    const qrImagePath = req.files.qrImage ? `uploads/${req.files.qrImage[0].filename}` : undefined;

    // Generate unique secret token for future edit/delete operations
    const creatorToken = crypto.randomBytes(16).toString('hex');

    const campaign = await Campaign.create({
      name,
      email,
      phone,
      title,
      description,
      category,
      location,
      targetAmount: parseFloat(targetAmount),
      upiId,
      profileImage: profileImagePath,
      governmentId: governmentIdPath,
      qrImage: qrImagePath,
      creatorToken
    });

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign,
      creatorToken // Send this only once, so client can store it in localStorage
    });
  } catch (error) {
    // If database insertion failed, clean up uploaded files
    if (req.files) {
      if (req.files.profileImage) deleteFile(`uploads/${req.files.profileImage[0].filename}`);
      if (req.files.governmentId) deleteFile(`uploads/${req.files.governmentId[0].filename}`);
      if (req.files.qrImage) deleteFile(`uploads/${req.files.qrImage[0].filename}`);
    }
    next(error);
  }
};

// @desc    Update a campaign
// @route   PUT /api/campaigns/:id
// @access  Private (Owner verified via custom X-Creator-Token header)
exports.updateCampaign = async (req, res, next) => {
  try {
    const creatorToken = req.headers['x-creator-token'];
    if (!creatorToken) {
      res.status(401);
      throw new Error('Authorization token is required to modify this campaign');
    }

    let campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      res.status(404);
      throw new Error('Campaign not found');
    }

    // Verify creator token
    if (campaign.creatorToken !== creatorToken) {
      res.status(403);
      throw new Error('Unauthorized. Invalid creator token.');
    }

    const { name, email, phone, title, description, category, location, targetAmount, upiId, status } = req.body;
    
    // Build update object
    const updateData = {
      name,
      email,
      phone,
      title,
      description,
      category,
      location,
      targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
      upiId,
      status
    };

    // Remove undefined properties
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    // Handle new uploads if any
    if (req.files) {
      if (req.files.profileImage) {
        // Delete old profile image
        deleteFile(campaign.profileImage);
        updateData.profileImage = `uploads/${req.files.profileImage[0].filename}`;
      }
      if (req.files.governmentId) {
        // Delete old gov ID
        if (campaign.governmentId) deleteFile(campaign.governmentId);
        updateData.governmentId = `uploads/${req.files.governmentId[0].filename}`;
      }
      if (req.files.qrImage) {
        // Delete old QR image
        if (campaign.qrImage) deleteFile(campaign.qrImage);
        updateData.qrImage = `uploads/${req.files.qrImage[0].filename}`;
      }
    }

    // Save update
    campaign = await Campaign.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaign
    });
  } catch (error) {
    // Clean up newly uploaded files on error
    if (req.files) {
      if (req.files.profileImage) deleteFile(`uploads/${req.files.profileImage[0].filename}`);
      if (req.files.governmentId) deleteFile(`uploads/${req.files.governmentId[0].filename}`);
      if (req.files.qrImage) deleteFile(`uploads/${req.files.qrImage[0].filename}`);
    }
    next(error);
  }
};

// @desc    Delete a campaign
// @route   DELETE /api/campaigns/:id
// @access  Private (Owner verified via custom X-Creator-Token header)
exports.deleteCampaign = async (req, res, next) => {
  try {
    const creatorToken = req.headers['x-creator-token'];
    if (!creatorToken) {
      res.status(401);
      throw new Error('Authorization token is required to delete this campaign');
    }

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      res.status(404);
      throw new Error('Campaign not found');
    }

    // Verify creator token
    if (campaign.creatorToken !== creatorToken) {
      res.status(403);
      throw new Error('Unauthorized. Invalid creator token.');
    }

    // Clean up uploaded files from filesystem
    deleteFile(campaign.profileImage);
    if (campaign.governmentId) deleteFile(campaign.governmentId);
    if (campaign.qrImage) deleteFile(campaign.qrImage);

    // Delete all donations related to this campaign
    await Donation.deleteMany({ campaignId: req.params.id });

    // Delete campaign
    await Campaign.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Campaign and its donation history deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregate site-wide statistics
// @route   GET /api/stats
// @access  Public
exports.getStats = async (req, res, next) => {
  try {
    const totalCampaigns = await Campaign.countDocuments();
    
    // Aggregation for total funds raised
    const fundsResult = await Campaign.aggregate([
      { $group: { _id: null, totalRaised: { $sum: '$fundsRaised' } } }
    ]);
    const totalMoneyRaised = fundsResult.length > 0 ? fundsResult[0].totalRaised : 0;

    // People Helped: Defined as number of campaigns that have raised at least some money (fundsRaised > 0)
    const peopleHelped = await Campaign.countDocuments({ fundsRaised: { $gt: 0 } });

    // Success Rate: Defined as percentage of campaigns that reached or exceeded targetAmount
    let successRate = 0;
    if (totalCampaigns > 0) {
      const successfulCampaigns = await Campaign.countDocuments({
        $expr: { $gte: ['$fundsRaised', '$targetAmount'] }
      });
      successRate = Math.round((successfulCampaigns / totalCampaigns) * 100);
    }

    res.status(200).json({
      success: true,
      data: {
        totalCampaigns,
        totalMoneyRaised,
        peopleHelped,
        successRate
      }
    });
  } catch (error) {
    next(error);
  }
};
