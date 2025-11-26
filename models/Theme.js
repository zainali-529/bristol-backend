const mongoose = require('mongoose');
const { generateColorVariations, generateComplementaryColors, normalizeHexColor } = require('../utils/colorUtils');

const themeSchema = new mongoose.Schema({
  // Primary Color Configuration
  primaryColor: {
    type: String,
    required: [true, 'Primary color is required'],
    default: '#AE613A',
    validate: {
      validator: function(v) {
        const hexRegex = /^#?[0-9A-Fa-f]{6}$/;
        return hexRegex.test(v);
      },
      message: 'Primary color must be a valid hex color'
    }
  },

  // Generated Color Variations (auto-generated from primaryColor)
  colorVariations: {
    primary: String,
    primary100: String,
    primary80: String,
    primary60: String,
    primary40: String,
    primary30: String,
    primary20: String,
    primary10: String,
    primary5: String,
  },

  // Secondary Color (optional)
  secondaryColor: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional
        const hexRegex = /^#?[0-9A-Fa-f]{6}$/;
        return hexRegex.test(v);
      },
      message: 'Secondary color must be a valid hex color'
    }
  },

  // Accent Colors
  accentColor: {
    type: String,
    default: null,
  },

  // Typography
  typography: {
    fontFamily: {
      type: String,
      default: 'Poppins, system-ui, Avenir, Helvetica, Arial, sans-serif'
    },
    fontSize: {
      base: { type: String, default: '16px' },
      small: { type: String, default: '14px' },
      large: { type: String, default: '18px' },
      xlarge: { type: String, default: '24px' },
    },
    fontWeight: {
      normal: { type: Number, default: 400 },
      medium: { type: Number, default: 500 },
      semibold: { type: Number, default: 600 },
      bold: { type: Number, default: 700 },
    },
  },

  // Spacing & Layout
  spacing: {
    xs: { type: String, default: '0.25rem' },
    sm: { type: String, default: '0.5rem' },
    md: { type: String, default: '1rem' },
    lg: { type: String, default: '1.5rem' },
    xl: { type: String, default: '2rem' },
    xxl: { type: String, default: '3rem' },
  },

  // Border Radius
  borderRadius: {
    sm: { type: String, default: '0.25rem' },
    md: { type: String, default: '0.5rem' },
    lg: { type: String, default: '0.75rem' },
    xl: { type: String, default: '1rem' },
    full: { type: String, default: '9999px' },
  },

  // Branding
  branding: {
    logoUrl: {
      type: String,
      default: null
    },
    faviconUrl: {
      type: String,
      default: null
    },
    companyName: {
      type: String,
      default: 'Bristol Utilities'
    },
    tagline: {
      type: String,
      default: null
    },
  },

  // Dark Mode Support
  darkMode: {
    enabled: {
      type: Boolean,
      default: true
    },
    primaryColor: {
      type: String,
      default: null // If null, uses same as light mode
    },
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Metadata
  version: {
    type: Number,
    default: 1
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

// Indexes
themeSchema.index({ isActive: 1 });
themeSchema.index({ createdAt: -1 });

// Pre-save middleware to generate color variations
themeSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Normalize primary color
  if (this.primaryColor) {
    this.primaryColor = normalizeHexColor(this.primaryColor);
    
    // Generate color variations
    const variations = generateColorVariations(this.primaryColor);
    this.colorVariations = variations;
  }

  // Normalize secondary color if provided
  if (this.secondaryColor) {
    this.secondaryColor = normalizeHexColor(this.secondaryColor);
  }

  // Normalize accent color if provided
  if (this.accentColor) {
    this.accentColor = normalizeHexColor(this.accentColor);
  }

  // Normalize dark mode primary color if provided
  if (this.darkMode && this.darkMode.primaryColor) {
    this.darkMode.primaryColor = normalizeHexColor(this.darkMode.primaryColor);
  }

  next();
});

// Static method to get active theme
themeSchema.statics.getActiveTheme = function() {
  return this.findOne({ isActive: true })
    .sort({ createdAt: -1 });
};

// Method to generate CSS variables object
themeSchema.methods.toCSSVariables = function() {
  const vars = {
    // Primary colors
    '--primary': this.colorVariations.primary,
    '--primary-100': this.colorVariations.primary100,
    '--primary-80': this.colorVariations.primary80,
    '--primary-60': this.colorVariations.primary60,
    '--primary-40': this.colorVariations.primary40,
    '--primary-30': this.colorVariations.primary30,
    '--primary-20': this.colorVariations.primary20,
    '--primary-10': this.colorVariations.primary10,
    '--primary-5': this.colorVariations.primary5,
    '--primary-foreground': '#ffffff',
    '--ring': this.colorVariations.primary,
  };

  // Secondary color
  if (this.secondaryColor) {
    vars['--secondary'] = this.secondaryColor;
  }

  // Accent color
  if (this.accentColor) {
    vars['--accent'] = this.accentColor;
  }

  // Border radius
  if (this.borderRadius) {
    vars['--radius'] = this.borderRadius.md;
    vars['--radius-sm'] = this.borderRadius.sm;
    vars['--radius-lg'] = this.borderRadius.lg;
    vars['--radius-xl'] = this.borderRadius.xl;
  }

  return vars;
};

module.exports = mongoose.model('Theme', themeSchema);


