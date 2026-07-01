const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Creator name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters long']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Campaign title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long']
    },
    description: {
      type: String,
      required: [true, 'Campaign description is required'],
      minlength: [30, 'Description must be at least 30 characters long']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Medical', 'Education', 'Startup', 'Emergency', 'Community', 'Animal Welfare', 'Environment'],
        message: '{VALUE} is not a supported category'
      }
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target amount must be a positive number']
    },
    fundsRaised: {
      type: Number,
      default: 0,
      min: [0, 'Funds raised cannot be negative']
    },
    profileImage: {
      type: String,
      required: [true, 'Campaign image is required']
    },
    governmentId: {
      type: String
    },
    qrImage: {
      type: String
    },
    upiId: {
      type: String,
      trim: true
    },
    donationCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Paused'],
      default: 'Active'
    },
    creatorToken: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Virtual for percentage completed
campaignSchema.virtual('percentageCompleted').get(function () {
  if (!this.targetAmount) return 0;
  const percentage = (this.fundsRaised / this.targetAmount) * 100;
  return Math.min(Math.round(percentage), 100);
});

// Set toJSON to include virtuals
campaignSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Campaign', campaignSchema);
