const mongoose = require('mongoose');

// Schema for individual work step
const workStepSchema = new mongoose.Schema({
  image: {
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true
    },
    publicId: {
      type: String, // Cloudinary public ID for deletion
      trim: true
    },
    alt: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ''
    }
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  icon: {
    type: String, // Lucide icon name (e.g., 'Phone', 'FileText', 'Code', 'Rocket')
    trim: true,
    maxlength: [50, 'Icon name cannot exceed 50 characters']
  },
  order: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  }
}, { _id: false });

const howWeWorkSchema = new mongoose.Schema({
  steps: {
    type: [workStepSchema],
    validate: {
      validator: function(steps) {
        return steps.length === 4;
      },
      message: 'Exactly 4 work steps are required'
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
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
howWeWorkSchema.index({ isActive: 1 });
howWeWorkSchema.index({ updatedAt: -1 });

// Pre-save middleware to update timestamp and ensure order
howWeWorkSchema.pre('save', function(next) {
  // Update timestamp
  this.updatedAt = new Date();
  
  // Ensure steps are properly ordered
  if (this.steps && this.steps.length === 4) {
    this.steps = this.steps.map((step, index) => ({
      ...step,
      order: index + 1
    }));
  }
  
  next();
});

// Static method to get or create the single document
howWeWorkSchema.statics.getSingle = async function() {
  let doc = await this.findOne();
  
  // If no document exists, create one with placeholder values
  if (!doc) {
    doc = await this.create({
      steps: [
        {
          image: {
            url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
            publicId: '',
            alt: 'Book a Discovery Call'
          },
          title: 'Book a Discovery Call',
          description: 'Schedule a free consultation to discuss your business needs and energy requirements. We\'ll understand your current situation, challenges, and goals to provide the best solutions tailored to your business.',
          icon: 'Phone',
          order: 1
        },
        {
          image: {
            url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
            publicId: '',
            alt: 'Strategy Session'
          },
          title: 'Strategy Session',
          description: 'We will review the insights from the discovery call and develop a tailored strategy and proposal. We\'ll create a detailed plan with actionable steps, timelines, and deliverables to meet your project requirements.',
          icon: 'FileText',
          order: 2
        },
        {
          image: {
            url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
            publicId: '',
            alt: 'Design and Development'
          },
          title: 'Design and Development',
          description: 'Our team brings your strategy to life with custom solutions. We handle all aspects of implementation, ensuring seamless integration with your existing systems and processes.',
          icon: 'Code',
          order: 3
        },
        {
          image: {
            url: 'https://images.unsplash.com/photo-1553484771-371a605b060b?w=800&q=80',
            publicId: '',
            alt: 'Launch and Support'
          },
          title: 'Launch and Support',
          description: 'We ensure a smooth launch and provide ongoing support to help you maximize the benefits. Our team remains available to assist with any questions, optimizations, or future enhancements you may need.',
          order: 4
        }
      ],
      isActive: true
    });
  } else if (doc.steps && doc.steps.length === 3) {
    // Migrate existing 3-step document to 4 steps
    // Preserve existing step data but update titles/descriptions if they match old defaults
    const defaultSteps = [
      {
        title: 'Book a Discovery Call',
        description: 'Schedule a free consultation to discuss your business needs and energy requirements. We\'ll understand your current situation, challenges, and goals to provide the best solutions tailored to your business.',
        imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
        imageAlt: 'Book a Discovery Call',
        icon: 'Phone'
      },
      {
        title: 'Strategy Session',
        description: 'We will review the insights from the discovery call and develop a tailored strategy and proposal. We\'ll create a detailed plan with actionable steps, timelines, and deliverables to meet your project requirements.',
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
        imageAlt: 'Strategy Session',
        icon: 'FileText'
      },
      {
        title: 'Design and Development',
        description: 'Our team brings your strategy to life with custom solutions. We handle all aspects of implementation, ensuring seamless integration with your existing systems and processes.',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
        imageAlt: 'Design and Development',
        icon: 'Code'
      }
    ];
    
    // Update existing steps if they match old default titles
    doc.steps = doc.steps.map((step, index) => {
      const oldTitles = ['Just Getting Started?', 'Struggling with High Bills?', 'Planning for Growth?'];
      if (oldTitles.includes(step.title)) {
        // Update to new default but preserve custom image if it's not a placeholder
        const isPlaceholder = step.image?.url?.includes('via.placeholder.com');
        return {
          image: {
            url: isPlaceholder ? defaultSteps[index].imageUrl : step.image.url,
            publicId: step.image?.publicId || '',
            alt: step.image?.alt || defaultSteps[index].imageAlt
          },
          title: defaultSteps[index].title,
          description: defaultSteps[index].description,
          icon: defaultSteps[index].icon || 'Phone',
          order: index + 1
        };
      }
      // Keep existing step but ensure order is correct
      return {
        ...step,
        order: index + 1
      };
    });
    
    // Add the 4th step
    doc.steps.push({
      image: {
        url: 'https://images.unsplash.com/photo-1553484771-371a605b060b?w=800&q=80',
        publicId: '',
        alt: 'Launch and Support'
      },
      title: 'Launch and Support',
      description: 'We ensure a smooth launch and provide ongoing support to help you maximize the benefits. Our team remains available to assist with any questions, optimizations, or future enhancements you may need.',
      icon: 'Rocket',
      order: 4
    });
    
    // Save the migrated document (will have 4 steps now, so validation will pass)
    await doc.save();
  }
  
  return doc;
};

// Static method to get active steps for public display
howWeWorkSchema.statics.getActiveSteps = async function() {
  const doc = await this.getSingle();
  
  if (doc && doc.isActive) {
    return doc.steps.sort((a, b) => a.order - b.order);
  }
  
  return [];
};

module.exports = mongoose.model('HowWeWork', howWeWorkSchema);

