const WhyTrustUs = require('../models/WhyTrustUs');

// @desc    Get active trust cards for public display (landing page)
// @route   GET /api/why-trust-us
// @access  Public
const getTrustCards = async (req, res) => {
  try {
    const cards = await WhyTrustUs.getActiveCards();
    
    res.json({
      success: true,
      count: cards.length,
      data: cards
    });
  } catch (error) {
    console.error('Error fetching trust cards:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trust cards'
    });
  }
};

// @desc    Get trust cards document for admin
// @route   GET /api/why-trust-us/admin
// @access  Private/Admin
const getAdminTrustCards = async (req, res) => {
  try {
    const doc = await WhyTrustUs.getSingle();
    
    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    console.error('Error fetching admin trust cards:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trust cards'
    });
  }
};

// @desc    Update trust cards (all 3 cards)
// @route   PUT /api/why-trust-us/admin
// @access  Private/Admin
const updateTrustCards = async (req, res) => {
  try {
    const { cards, isActive } = req.body;
    
    // Validate cards array
    if (!cards || !Array.isArray(cards)) {
      return res.status(400).json({
        success: false,
        message: 'Cards array is required'
      });
    }
    
    if (cards.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Exactly 3 cards are required'
      });
    }
    
    // Validate each card
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      
      if (!card.icon || !card.title || !card.description) {
        return res.status(400).json({
          success: false,
          message: `Card ${i + 1}: Icon, title, and description are required`
        });
      }
      
      if (card.icon.length > 50) {
        return res.status(400).json({
          success: false,
          message: `Card ${i + 1}: Icon name cannot exceed 50 characters`
        });
      }
      
      if (card.title.length > 100) {
        return res.status(400).json({
          success: false,
          message: `Card ${i + 1}: Title cannot exceed 100 characters`
        });
      }
      
      if (card.description.length > 300) {
        return res.status(400).json({
          success: false,
          message: `Card ${i + 1}: Description cannot exceed 300 characters`
        });
      }
    }
    
    // Get the single document
    let doc = await WhyTrustUs.getSingle();
    
    // Update cards with proper order
    doc.cards = cards.map((card, index) => ({
      icon: card.icon.trim(),
      title: card.title.trim(),
      description: card.description.trim(),
      order: index + 1
    }));
    
    // Update status if provided
    if (typeof isActive === 'boolean') {
      doc.isActive = isActive;
    }
    
    await doc.save();
    
    res.json({
      success: true,
      message: 'Trust cards updated successfully',
      data: doc
    });
  } catch (error) {
    console.error('Error updating trust cards:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating trust cards'
    });
  }
};

// @desc    Update single card by order (1, 2, or 3)
// @route   PATCH /api/why-trust-us/admin/card/:order
// @access  Private/Admin
const updateSingleCard = async (req, res) => {
  try {
    const { order } = req.params;
    const { icon, title, description } = req.body;
    
    // Validate order
    const cardOrder = parseInt(order);
    if (isNaN(cardOrder) || cardOrder < 1 || cardOrder > 3) {
      return res.status(400).json({
        success: false,
        message: 'Order must be 1, 2, or 3'
      });
    }
    
    // Get the single document
    let doc = await WhyTrustUs.getSingle();
    
    // Find and update the specific card
    const cardIndex = doc.cards.findIndex(c => c.order === cardOrder);
    
    if (cardIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Card with order ${cardOrder} not found`
      });
    }
    
    // Update card fields
    if (icon !== undefined) {
      if (!icon || icon.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Icon cannot be empty'
        });
      }
      if (icon.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Icon name cannot exceed 50 characters'
        });
      }
      doc.cards[cardIndex].icon = icon.trim();
    }
    
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot be empty'
        });
      }
      if (title.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot exceed 100 characters'
        });
      }
      doc.cards[cardIndex].title = title.trim();
    }
    
    if (description !== undefined) {
      if (!description || description.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot be empty'
        });
      }
      if (description.length > 300) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot exceed 300 characters'
        });
      }
      doc.cards[cardIndex].description = description.trim();
    }
    
    await doc.save();
    
    res.json({
      success: true,
      message: `Card ${cardOrder} updated successfully`,
      data: doc
    });
  } catch (error) {
    console.error('Error updating single card:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating card'
    });
  }
};

// @desc    Update status (active/inactive)
// @route   PATCH /api/why-trust-us/admin/status
// @access  Private/Admin
const updateStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }
    
    let doc = await WhyTrustUs.getSingle();
    doc.isActive = isActive;
    await doc.save();
    
    res.json({
      success: true,
      message: `Why Trust Us section ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: doc
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating status'
    });
  }
};

module.exports = {
  getTrustCards,
  getAdminTrustCards,
  updateTrustCards,
  updateSingleCard,
  updateStatus
};

