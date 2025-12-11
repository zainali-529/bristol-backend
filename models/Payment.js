const mongoose = require('mongoose');

const screenshotSchema = new mongoose.Schema({
  url: { type: String, trim: true },
  publicId: { type: String, trim: true },
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  featureKey: { type: String, required: true, trim: true, lowercase: true },
  product: { type: String, required: true, trim: true },
  pricePKR: { type: Number, default: 0 },
  priceGBP: { type: Number, default: 0 },

  adminName: { type: String, trim: true },
  adminEmail: { type: String, trim: true },

  transactionId: { type: String, trim: true },
  amountPaid: { type: String, trim: true },
  paymentDate: { type: Date },
  notes: { type: String, trim: true, maxlength: 2000 },

  screenshot: screenshotSchema,

  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedBy: { type: String, trim: true },
  reviewedBy: { type: String, trim: true },
  approvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);

