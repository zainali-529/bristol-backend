const Payment = require('../models/Payment');
const FeatureAccess = require('../models/FeatureAccess');

// Admin submits payment request
const createPaymentRequest = async (req, res) => {
  try {
    const {
      featureKey,
      product,
      pricePKR,
      priceGBP,
      name,
      email,
      transactionId,
      amountPaid,
      paymentDate,
      notes,
    } = req.body;

    if (!featureKey || !product) {
      return res.status(400).json({ success: false, message: 'featureKey and product are required' });
    }

    const screenshot = req.file ? { url: req.file.path, publicId: req.file.filename } : undefined;

    const payment = await Payment.create({
      featureKey: String(featureKey).toLowerCase(),
      product,
      pricePKR: Number(pricePKR) || 0,
      priceGBP: Number(priceGBP) || 0,
      adminName: name || req.user?.name,
      adminEmail: email || req.user?.email,
      transactionId,
      amountPaid,
      paymentDate: paymentDate ? new Date(paymentDate) : undefined,
      notes,
      screenshot,
      status: 'pending',
      requestedBy: req.user?.id,
    });

    await FeatureAccess.setUnlocked(featureKey, false);

    return res.status(201).json({ success: true, message: 'Payment request created', data: payment });
  } catch (err) {
    console.error('Create payment request error:', err);
    return res.status(500).json({ success: false, message: 'Server error while creating payment request' });
  }
};

// Developer: list payment requests
const getDeveloperPayments = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const query = status ? { status } : {};
    const payments = await Payment.find(query).sort({ createdAt: -1 }).select('-__v');
    return res.json({ success: true, count: payments.length, data: payments });
  } catch (err) {
    console.error('Get payments error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching payments' });
  }
};

// Developer: approve payment
const approvePaymentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment request not found' });

    payment.status = 'approved';
    payment.reviewedBy = req.user?.id;
    payment.approvedAt = new Date();
    await payment.save();

    await FeatureAccess.setUnlocked(payment.featureKey, true);

    return res.json({ success: true, message: 'Payment approved and feature unlocked', data: payment });
  } catch (err) {
    console.error('Approve payment error:', err);
    return res.status(500).json({ success: false, message: 'Server error while approving payment' });
  }
};

// Developer: reject payment
const rejectPaymentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment request not found' });

    payment.status = 'rejected';
    payment.reviewedBy = req.user?.id;
    payment.approvedAt = undefined;
    if (reason) payment.notes = `${payment.notes ? payment.notes + '\n' : ''}Rejected: ${reason}`;
    await payment.save();

    await FeatureAccess.setUnlocked(payment.featureKey, false);

    return res.json({ success: true, message: 'Payment rejected', data: payment });
  } catch (err) {
    console.error('Reject payment error:', err);
    return res.status(500).json({ success: false, message: 'Server error while rejecting payment' });
  }
};

// Common: get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).select('-__v');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment request not found' });
    return res.json({ success: true, data: payment });
  } catch (err) {
    console.error('Get payment by id error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching payment' });
  }
};

// Admin: get latest payment status for feature
const getAdminPaymentStatus = async (req, res) => {
  try {
    const featureKey = String(req.params.featureKey || '').toLowerCase();
    if (!featureKey) return res.status(400).json({ success: false, message: 'featureKey is required' });
    const payment = await Payment.findOne({ featureKey, requestedBy: req.user?.id })
      .sort({ createdAt: -1 })
      .select('_id status createdAt approvedAt');
    if (!payment) return res.json({ success: true, data: null });
    return res.json({ success: true, data: { id: payment._id, status: payment.status } });
  } catch (err) {
    console.error('Get admin payment status error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching payment status' });
  }
};

module.exports = {
  createPaymentRequest,
  getDeveloperPayments,
  approvePaymentRequest,
  rejectPaymentRequest,
  getPaymentById,
  getAdminPaymentStatus,
};

