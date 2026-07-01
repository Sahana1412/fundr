const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');

// @desc    Simulate receiving a donation
// @route   POST /api/donate/:id
// @access  Public
exports.createDonation = async (req, res, next) => {
  try {
    const { amount, transactionReference } = req.body;
    const campaignId = req.params.id;

    // 1. Verify Campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      res.status(404);
      throw new Error('Campaign not found');
    }

    if (campaign.status === 'Completed' || campaign.status === 'Paused') {
      res.status(400);
      throw new Error(`This campaign is currently ${campaign.status.toLowerCase()} and cannot accept donations.`);
    }

    // Convert amount to positive float
    const donationAmount = parseFloat(amount);

    // 2. Log the donation record in DB
    // NOTE: This is a simulated donation. In a real application, this would be triggered 
    // by a webhook from a payment gateway (like Stripe, Razorpay, or a UPI merchant API) 
    // after verifying the payment signature and status.
    const donation = await Donation.create({
      campaignId,
      amount: donationAmount,
      transactionReference: transactionReference || `SIM-UPI-${Date.now()}`
    });

    // 3. Update the Campaign totals
    campaign.fundsRaised += donationAmount;
    campaign.donationCount += 1;

    // Optional: Auto-complete campaign if goal is met
    if (campaign.fundsRaised >= campaign.targetAmount) {
      campaign.status = 'Completed';
    }

    await campaign.save();

    res.status(201).json({
      success: true,
      message: 'Donation logged successfully! Thank you for your support.',
      data: donation,
      campaignFunds: campaign.fundsRaised,
      campaignDonations: campaign.donationCount
    });
  } catch (error) {
    next(error);
  }
};
