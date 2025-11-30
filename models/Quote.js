const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  // Step 1: Business Information
  businessType: {
    type: String,
    required: [true, 'Business type is required'],
    trim: true,
    maxlength: [100, 'Business type cannot exceed 100 characters']
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [200, 'Business name cannot exceed 200 characters']
  },
  postcode: {
    type: String,
    required: [true, 'Postcode is required'],
    trim: true,
    maxlength: [10, 'Postcode cannot exceed 10 characters'],
    uppercase: true
  },
  numberOfSites: {
    type: String,
    required: [true, 'Number of sites is required'],
    trim: true
  },
  
  // Step 2: Energy Usage
  electricityUsage: {
    type: String,
    required: [true, 'Electricity usage is required'],
    trim: true
  },
  gasUsage: {
    type: String,
    required: [true, 'Gas usage is required'],
    trim: true
  },
  currentElectricityCost: {
    type: String,
    trim: true,
    default: ''
  },
  currentGasCost: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Step 3: Current Supplier
  currentElectricitySupplier: {
    type: String,
    trim: true,
    default: ''
  },
  currentGasSupplier: {
    type: String,
    trim: true,
    default: ''
  },
  contractEndDate: {
    type: String,
    required: [true, 'Contract end date is required'],
    trim: true
  },
  greenEnergyPreference: {
    type: String,
    required: [true, 'Green energy preference is required'],
    trim: true,
    enum: ['yes', 'consider', 'no']
  },
  
  // Step 4: Contact Details
  contactName: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
    maxlength: [100, 'Contact name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  preferredContactMethod: {
    type: String,
    required: [true, 'Preferred contact method is required'],
    trim: true,
    enum: ['email', 'phone', 'either']
  },
  additionalNotes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Additional notes cannot exceed 2000 characters'],
    default: ''
  },
  
  // Status and Admin fields
  status: {
    type: String,
    enum: ['new', 'reviewing', 'quoted', 'accepted', 'rejected', 'closed'],
    default: 'new'
  },
  quoteValue: {
    type: Number,
    default: null
  },
  quoteCurrency: {
    type: String,
    default: 'GBP'
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [5000, 'Admin notes cannot exceed 5000 characters'],
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
quoteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
quoteSchema.index({ createdAt: -1 });
quoteSchema.index({ status: 1 });
quoteSchema.index({ email: 1 });
quoteSchema.index({ businessName: 1 });

module.exports = mongoose.model('Quote', quoteSchema);

