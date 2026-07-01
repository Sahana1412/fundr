const { body, validationResult } = require('express-validator');

// Middleware to check validation results
const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format error messages to be user-friendly
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  next();
};

// Campaign Validation Rules
const campaignValidationRules = [
  body('name')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Full Name must be at least 3 characters long')
    .escape(),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('phone')
    .trim()
    .matches(/^(?:(?:\+|0{0,2})91[\s-]?)?[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian phone number (e.g., 9876543210)'),
  body('title')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Campaign Title must be at least 3 characters long')
    .escape(),
  body('description')
    .trim()
    .isLength({ min: 30 })
    .withMessage('Description must be at least 30 characters long')
    .escape(),
  body('category')
    .trim()
    .isIn(['Medical', 'Education', 'Startup', 'Emergency', 'Community', 'Animal Welfare', 'Environment'])
    .withMessage('Please select a valid category'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .escape(),
  body('targetAmount')
    .custom((value) => {
      const parsed = parseFloat(value);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error('Target Amount must be a positive number');
      }
      return true;
    }),
  body('upiId')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[\w.-]+@[\w.-]+$/)
    .withMessage('Please provide a valid UPI ID format (e.g., example@upi)')
];

// Donation Validation Rules
const donationValidationRules = [
  body('amount')
    .custom((value) => {
      const parsed = parseFloat(value);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error('Donation amount must be a positive number');
      }
      return true;
    }),
  body('transactionReference')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Transaction reference must be under 100 characters')
    .escape()
];

module.exports = {
  campaignValidationRules,
  donationValidationRules,
  validateResults
};
