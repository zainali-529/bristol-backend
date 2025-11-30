const Quote = require('../models/Quote');
const { validationResult } = require('express-validator');
const { sendEmail } = require('../services/emailService');
const config = require('../config/config');

// Email templates for quotes
const quoteEmailTemplates = {
  adminNotification: (quoteData) => {
    const primaryColor = '#AE613A';
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Quote Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px; background: linear-gradient(135deg, ${primaryColor} 0%, #8B4A2E 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">New Quote Request</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                You have received a new quote request from your website.
              </p>
              
              <div style="background-color: #f9f9f9; border-left: 4px solid ${primaryColor}; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">Business Information</h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333; width: 180px;">Business Name:</td>
                    <td style="padding: 8px 0; color: #666666;">${quoteData.businessName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333;">Business Type:</td>
                    <td style="padding: 8px 0; color: #666666;">${quoteData.businessType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333;">Postcode:</td>
                    <td style="padding: 8px 0; color: #666666;">${quoteData.postcode}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333;">Number of Sites:</td>
                    <td style="padding: 8px 0; color: #666666;">${quoteData.numberOfSites}</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #f9f9f9; border-left: 4px solid ${primaryColor}; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">Energy Usage</h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333; width: 180px;">Electricity Usage:</td>
                    <td style="padding: 8px 0; color: #666666;">${quoteData.electricityUsage} kWh/year</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333;">Current Elec. Cost:</td>
                    <td style="padding: 8px 0; color: #666666;">£${quoteData.currentElectricityCost || 'N/A'} /month</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333;">Gas Usage:</td>
                    <td style="padding: 8px 0; color: #666666;">${quoteData.gasUsage} kWh/year</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333;">Current Gas Cost:</td>
                    <td style="padding: 8px 0; color: #666666;">£${quoteData.currentGasCost || 'N/A'} /month</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #f9f9f9; border-left: 4px solid ${primaryColor}; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">Current Supplier & Preferences</h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333; width: 180px;">Electricity Supplier:</td>
                    <td style="padding: 8px 0; color: #666666;">${quoteData.currentElectricitySupplier || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333;">Gas Supplier:</td>
                    <td style="padding: 8px 0; color: #666666;">${quoteData.currentGasSupplier || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333;">Contract End Date:</td>
                    <td style="padding: 8px 0; color: #666666;">${new Date(quoteData.contractEndDate).toLocaleDateString('en-GB')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333;">Green Energy:</td>
                    <td style="padding: 8px 0; color: #666666;">${quoteData.greenEnergyPreference === 'yes' ? 'Yes' : quoteData.greenEnergyPreference === 'consider' ? 'Consider if cost-effective' : 'No preference'}</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #f9f9f9; border-left: 4px solid ${primaryColor}; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">Contact Details</h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333; width: 180px;">Contact Name:</td>
                    <td style="padding: 8px 0; color: #666666;">${quoteData.contactName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333;">Email:</td>
                    <td style="padding: 8px 0; color: #666666;">
                      <a href="mailto:${quoteData.email}" style="color: ${primaryColor}; text-decoration: none;">${quoteData.email}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333;">Phone:</td>
                    <td style="padding: 8px 0; color: #666666;">
                      <a href="tel:${quoteData.phone}" style="color: ${primaryColor}; text-decoration: none;">${quoteData.phone}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333;">Preferred Contact:</td>
                    <td style="padding: 8px 0; color: #666666;">${quoteData.preferredContactMethod}</td>
                  </tr>
                </table>
              </div>
              
              ${quoteData.additionalNotes ? `
              <div style="background-color: #f9f9f9; border-left: 4px solid ${primaryColor}; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">Additional Notes</h3>
                <p style="margin: 0; color: #666666; line-height: 1.6;">${quoteData.additionalNotes.replace(/\n/g, '<br>')}</p>
              </div>
              ` : ''}
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0; color: #666666; font-size: 14px;">
                  Submitted: ${new Date(quoteData.createdAt).toLocaleString('en-GB', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                This is an automated email from Bristol Utilities Quote Request System.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  },

  thankYouEmail: (quoteData) => {
    const primaryColor = '#AE613A';
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote Request Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, ${primaryColor} 0%, #8B4A2E 100%); border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Quote Request Received!</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">We're preparing your personalized quote</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Dear <strong>${quoteData.contactName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Thank you for requesting a quote from <strong>Bristol Utilities</strong>! We have successfully received your quote request for <strong>${quoteData.businessName}</strong> and our energy experts are now reviewing your requirements.
              </p>
              
              <div style="background-color: #f9f9f9; border-left: 4px solid ${primaryColor}; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px; font-weight: 600;">Your Quote Request Summary:</p>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; color: #666666; font-size: 14px;">Business:</td>
                    <td style="padding: 4px 0; color: #333333; font-size: 14px; font-weight: 500;">${quoteData.businessName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #666666; font-size: 14px;">Location:</td>
                    <td style="padding: 4px 0; color: #333333; font-size: 14px;">${quoteData.postcode}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #666666; font-size: 14px;">Submitted:</td>
                    <td style="padding: 4px 0; color: #333333; font-size: 14px;">${new Date(quoteData.createdAt).toLocaleString('en-GB', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</td>
                  </tr>
                </table>
              </div>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Our team will analyze your energy requirements and prepare a customized quote tailored to your business needs. We typically respond to quote requests within <strong>24 hours</strong> during business days.
              </p>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                If you have any urgent questions or need immediate assistance, please don't hesitate to contact us directly.
              </p>
              
              <div style="margin: 30px 0; text-align: center;">
                <a href="mailto:support@bristolutilities.co.uk" style="display: inline-block; padding: 12px 30px; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  Contact Support
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px; font-weight: 600;">Best regards,</p>
              <p style="margin: 0; color: #666666; font-size: 14px;">The Bristol Utilities Team</p>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px;">
                  Bristol Utilities<br>
                  Your trusted energy partner
                </p>
                <p style="margin: 0; color: #999999; font-size: 11px;">
                  This is an automated confirmation email. Please do not reply to this message.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  },
};

// @desc    Create new quote request (Public - User Site)
// @route   POST /api/quotes
// @access  Public
const createQuote = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      businessType,
      businessName,
      postcode,
      numberOfSites,
      electricityUsage,
      gasUsage,
      currentElectricityCost,
      currentGasCost,
      currentElectricitySupplier,
      currentGasSupplier,
      contractEndDate,
      greenEnergyPreference,
      contactName,
      email,
      phone,
      preferredContactMethod,
      additionalNotes,
    } = req.body;

    // Create new quote
    const quote = new Quote({
      businessType,
      businessName,
      postcode: postcode.toUpperCase(),
      numberOfSites,
      electricityUsage,
      gasUsage,
      currentElectricityCost: currentElectricityCost || '',
      currentGasCost: currentGasCost || '',
      currentElectricitySupplier: currentElectricitySupplier || '',
      currentGasSupplier: currentGasSupplier || '',
      contractEndDate,
      greenEnergyPreference,
      contactName,
      email: email.toLowerCase(),
      phone,
      preferredContactMethod,
      additionalNotes: additionalNotes || '',
    });

    const savedQuote = await quote.save();

    // Prepare quote data for emails
    const quoteData = {
      businessName: savedQuote.businessName,
      businessType: savedQuote.businessType,
      postcode: savedQuote.postcode,
      numberOfSites: savedQuote.numberOfSites,
      electricityUsage: savedQuote.electricityUsage,
      gasUsage: savedQuote.gasUsage,
      currentElectricityCost: savedQuote.currentElectricityCost,
      currentGasCost: savedQuote.currentGasCost,
      currentElectricitySupplier: savedQuote.currentElectricitySupplier,
      currentGasSupplier: savedQuote.currentGasSupplier,
      contractEndDate: savedQuote.contractEndDate,
      greenEnergyPreference: savedQuote.greenEnergyPreference,
      contactName: savedQuote.contactName,
      email: savedQuote.email,
      phone: savedQuote.phone,
      preferredContactMethod: savedQuote.preferredContactMethod,
      additionalNotes: savedQuote.additionalNotes,
      createdAt: savedQuote.createdAt,
    };

    // Send emails asynchronously (don't block the response)
    Promise.all([
      // Send admin notification email
      sendEmail({
        to: config.ADMIN_EMAIL,
        subject: `New Quote Request from ${savedQuote.businessName}`,
        html: quoteEmailTemplates.adminNotification(quoteData),
        fromName: 'Bristol Utilities Quote System',
      }).catch(error => {
        console.error('Failed to send admin notification email:', error);
      }),
      
      // Send thank you email to user
      sendEmail({
        to: savedQuote.email,
        subject: 'Your Quote Request Has Been Received - Bristol Utilities',
        html: quoteEmailTemplates.thankYouEmail(quoteData),
        fromName: 'Bristol Utilities',
      }).catch(error => {
        console.error('Failed to send thank you email:', error);
      }),
    ]);

    res.status(201).json({
      success: true,
      message: 'Quote request submitted successfully! We will get back to you within 24 hours.',
      data: {
        id: savedQuote._id,
        businessName: savedQuote.businessName,
        email: savedQuote.email,
        createdAt: savedQuote.createdAt
      }
    });

  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quote request. Please try again later.'
    });
  }
};

// @desc    Get all quotes (Admin only)
// @route   GET /api/quotes/admin
// @access  Private (Admin)
const getAllQuotes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build filter object
    const filter = {};
    if (status && ['new', 'reviewing', 'quoted', 'accepted', 'rejected', 'closed'].includes(status)) {
      filter.status = status;
    }

    // Add search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { businessName: searchRegex },
        { contactName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { postcode: searchRegex },
        { businessType: searchRegex }
      ];
    }

    // Add date range filtering
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get quotes with pagination and filtering
    const quotes = await Quote.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalQuotes = await Quote.countDocuments(filter);
    const totalPages = Math.ceil(totalQuotes / limit);

    res.status(200).json({
      success: true,
      data: quotes,
      pagination: {
        currentPage: page,
        totalPages,
        totalQuotes,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get all quotes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotes'
    });
  }
};

// @desc    Get single quote by ID (Admin only)
// @route   GET /api/quotes/admin/:id
// @access  Private (Admin)
const getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    // Mark as reviewing if it was new
    if (quote.status === 'new') {
      quote.status = 'reviewing';
      await quote.save();
    }

    res.status(200).json({
      success: true,
      data: quote
    });

  } catch (error) {
    console.error('Get quote by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid quote ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch quote'
    });
  }
};

// @desc    Update quote (Admin only)
// @route   PUT /api/quotes/admin/:id
// @access  Private (Admin)
const updateQuote = async (req, res) => {
  try {
    const { status, quoteValue, quoteCurrency, adminNotes } = req.body;
    const updateData = { updatedAt: Date.now() };

    // Validate status if provided
    if (status && !['new', 'reviewing', 'quoted', 'accepted', 'rejected', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: new, reviewing, quoted, accepted, rejected, or closed'
      });
    }

    // Add fields to update if provided
    if (status) updateData.status = status;
    if (quoteValue !== undefined) updateData.quoteValue = quoteValue;
    if (quoteCurrency) updateData.quoteCurrency = quoteCurrency;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    // Check if at least one field is being updated
    if (!status && quoteValue === undefined && !quoteCurrency && adminNotes === undefined) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update'
      });
    }

    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quote updated successfully',
      data: quote
    });

  } catch (error) {
    console.error('Update quote error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid quote ID format'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update quote'
    });
  }
};

// @desc    Update quote status (Admin only)
// @route   PUT /api/quotes/admin/:id/status
// @access  Private (Admin)
const updateQuoteStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['new', 'reviewing', 'quoted', 'accepted', 'rejected', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: new, reviewing, quoted, accepted, rejected, or closed'
      });
    }

    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quote status updated successfully',
      data: quote
    });

  } catch (error) {
    console.error('Update quote status error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid quote ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update quote status'
    });
  }
};

// @desc    Delete quote (Admin only)
// @route   DELETE /api/quotes/admin/:id
// @access  Private (Admin)
const deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quote deleted successfully',
      data: {
        id: quote._id,
        businessName: quote.businessName,
        email: quote.email
      }
    });

  } catch (error) {
    console.error('Delete quote error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid quote ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete quote'
    });
  }
};

// @desc    Get quote statistics (Admin only)
// @route   GET /api/quotes/admin/stats
// @access  Private (Admin)
const getQuoteStats = async (req, res) => {
  try {
    const stats = await Quote.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalQuotes = await Quote.countDocuments();
    const todayQuotes = await Quote.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    // Format stats
    const formattedStats = {
      total: totalQuotes,
      today: todayQuotes,
      byStatus: {
        new: 0,
        reviewing: 0,
        quoted: 0,
        accepted: 0,
        rejected: 0,
        closed: 0
      }
    };

    stats.forEach(stat => {
      formattedStats.byStatus[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: formattedStats
    });

  } catch (error) {
    console.error('Get quote stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quote statistics'
    });
  }
};

module.exports = {
  createQuote,
  getAllQuotes,
  getQuoteById,
  updateQuote,
  updateQuoteStatus,
  deleteQuote,
  getQuoteStats
};

