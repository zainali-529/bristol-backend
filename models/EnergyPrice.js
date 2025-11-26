const mongoose = require('mongoose');

const priceEntrySchema = new mongoose.Schema({
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  change: {
    type: Number,
    default: 0 // Percentage change from previous entry
  },
  trend: {
    type: String,
    enum: ['up', 'down', 'stable'],
    default: 'stable'
  }
}, { _id: false });

const energyPriceSchema = new mongoose.Schema({
  // Electricity prices
  electricity: {
    current: {
      type: Number,
      required: [true, 'Current electricity price is required'],
      min: [0, 'Price cannot be negative']
    },
    history: [priceEntrySchema],
    average: Number,
    high: Number,
    low: Number,
    unit: {
      type: String,
      default: '£/kWh'
    }
  },

  // Gas prices
  gas: {
    current: {
      type: Number,
      required: [true, 'Current gas price is required'],
      min: [0, 'Price cannot be negative']
    },
    history: [priceEntrySchema],
    average: Number,
    high: Number,
    low: Number,
    unit: {
      type: String,
      default: '£/kWh'
    }
  },

  // Market insights
  insights: {
    marketStatus: {
      type: String,
      enum: ['rising', 'falling', 'stable'],
      default: 'stable'
    },
    recommendation: {
      type: String,
      maxlength: [500, 'Recommendation cannot exceed 500 characters'],
      default: 'Monitor prices closely'
    },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral'
    }
  },

  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
energyPriceSchema.index({ createdAt: -1 });
energyPriceSchema.index({ isActive: 1 });
energyPriceSchema.index({ 'electricity.history.date': -1 });
energyPriceSchema.index({ 'gas.history.date': -1 });

// Pre-save middleware to calculate statistics
energyPriceSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Calculate electricity statistics
  if (this.electricity.history && this.electricity.history.length > 0) {
    const elecPrices = this.electricity.history.map(h => h.price);
    this.electricity.average = elecPrices.reduce((a, b) => a + b, 0) / elecPrices.length;
    this.electricity.high = Math.max(...elecPrices);
    this.electricity.low = Math.min(...elecPrices);
  }

  // Calculate gas statistics
  if (this.gas.history && this.gas.history.length > 0) {
    const gasPrices = this.gas.history.map(h => h.price);
    this.gas.average = gasPrices.reduce((a, b) => a + b, 0) / gasPrices.length;
    this.gas.high = Math.max(...gasPrices);
    this.gas.low = Math.min(...gasPrices);
  }

  next();
});

// Static method to get current active prices
energyPriceSchema.statics.getCurrentPrices = function() {
  return this.findOne({ isActive: true })
    .sort({ createdAt: -1 })
    .select('electricity.current electricity.unit gas.current gas.unit insights updatedAt');
};

// Static method to get price history for a time range
energyPriceSchema.statics.getPriceHistory = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.findOne({ isActive: true })
    .sort({ createdAt: -1 })
    .select('electricity gas insights updatedAt');
};

// Method to add new price entry
energyPriceSchema.methods.addPriceEntry = function(type, price) {
  const lastEntry = this[type].history[this[type].history.length - 1];
  
  let change = 0;
  let trend = 'stable';
  
  if (lastEntry) {
    change = ((price - lastEntry.price) / lastEntry.price) * 100;
    if (change > 0.5) trend = 'up';
    else if (change < -0.5) trend = 'down';
  }

  this[type].current = price;
  this[type].history.push({
    price,
    date: new Date(),
    change: parseFloat(change.toFixed(2)),
    trend
  });

  return this;
};

module.exports = mongoose.model('EnergyPrice', energyPriceSchema);

