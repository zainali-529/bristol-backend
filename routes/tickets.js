const express = require('express');
const { body, param, query } = require('express-validator');
const { auth: protect, adminAuth: admin } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { uploadMiddleware } = require('../middleware/uploadAttachments');
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addComment,
  markCommentsAsRead,
  pollTicketUpdates,
} = require('../controllers/ticketController');

const router = express.Router();

// Validation rules
const validateCreate = [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').trim().isLength({ min: 1, max: 5000 }),
  body('status').optional().isIn(['open', 'in-progress', 'resolved', 'closed']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('category').optional().isIn(['bug', 'feature', 'request', 'discussion']),
  body('attachments').optional().isArray(),
];

const validateUpdate = [
  body('status').optional().isIn(['open', 'in-progress', 'resolved', 'closed', 'awaiting-admin-reply', 'awaiting-developer-reply']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('category').optional().isIn(['bug', 'feature', 'request', 'discussion']),
];

const validateId = [param('id').isMongoId()];

const validateQuery = [
  query('status').optional().isIn(['open', 'in-progress', 'resolved', 'closed', 'awaiting-admin-reply', 'awaiting-developer-reply']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('category').optional().isIn(['bug', 'feature', 'request', 'discussion']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim().isLength({ max: 200 }),
  query('since').optional().isISO8601(),
];

// Routes
router.post('/', protect, rateLimiter(), validateCreate, createTicket);
router.get('/', protect, validateQuery, getTickets);
router.get('/:id', protect, validateId, getTicketById);
router.patch('/:id', protect, validateId, validateUpdate, updateTicket);
router.post('/:id/comments', protect, uploadMiddleware, validateId, [body('message').trim().isLength({ min: 1, max: 5000 })], addComment);
router.patch('/:id/read', protect, validateId, markCommentsAsRead);
router.get('/:id/poll', protect, validateId, validateQuery, pollTicketUpdates);

module.exports = router;
