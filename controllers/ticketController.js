const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const { sendTicketCreatedEmail, sendTicketStatusChangedEmail, sendPriorityEscalationEmail } = require('../services/ticketEmailService');
const config = require('../config/config');

const buildFilters = (query) => {
  const filters = {};
  if (query.status) filters.status = query.status;
  if (query.priority) filters.priority = query.priority;
  if (query.category) filters.category = query.category;
  if (query.search) {
    filters.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }
  return filters;
};

const createTicket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const payload = {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status || 'open',
      priority: req.body.priority || 'medium',
      category: req.body.category || 'bug',
      attachments: Array.isArray(req.body.attachments) ? req.body.attachments : [],
      createdBy: {
        id: req.user?.id || 'admin_001',
        name: req.user?.name || 'Admin',
        email: req.user?.email || config.ADMIN_EMAIL,
        role: req.user?.role || 'admin',
      },
    };

    const ticket = await Ticket.create([payload], { session });
    const created = ticket[0];

    await session.commitTransaction();
    session.endSession();

    const link = `${req.protocol}://${req.get('host')}/api/tickets/${created._id}`;
    const notifyPayload = { ...created.toObject(), link };
    sendTicketCreatedEmail(notifyPayload).catch(() => {});

    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Create ticket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create ticket' });
  }
};

const getTickets = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const filters = buildFilters(req.query);
    const tickets = await Ticket.find(filters)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    const total = await Ticket.countDocuments(filters);
    return res.json({ success: true, total, page: parseInt(page), totalPages: Math.ceil(total / limit), data: tickets });
  } catch (err) {
    console.error('List tickets error:', err);
    return res.status(500).json({ success: false, message: 'Failed to list tickets' });
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    return res.json({ success: true, data: ticket });
  } catch (err) {
    console.error('Get ticket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
  }
};

const updateTicket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const oldStatus = ticket.status;
    const oldPriority = ticket.priority;
    const oldCategory = ticket.category;

    if (req.body.status) ticket.status = req.body.status;
    if (req.body.priority) ticket.priority = req.body.priority;
    if (req.body.category) ticket.category = req.body.category;

    await ticket.save();

    const link = `${req.protocol}://${req.get('host')}/api/tickets/${ticket._id}`;
    const notifyPayload = { ...ticket.toObject(), link };
    if (req.body.status && req.body.status !== oldStatus) {
      sendTicketStatusChangedEmail(notifyPayload, oldStatus).catch(() => {});
    }
    if (req.body.priority && req.body.priority !== oldPriority && ['high', 'critical'].includes(ticket.priority)) {
      sendPriorityEscalationEmail(notifyPayload, oldPriority).catch(() => {});
    }

    return res.json({ success: true, data: ticket });
  } catch (err) {
    console.error('Update ticket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update ticket' });
  }
};

const addComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const ticket = await Ticket.findById(req.params.id).session(session);
    if (!ticket) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const userRole = req.user?.role || 'admin';
    const attachments = req.uploadedFiles || [];

    const comment = {
      authorName: req.user?.name || 'Admin',
      authorRole: userRole,
      message: req.body.message,
      attachments: attachments,
      isRead: false,
    };
    ticket.comments.push(comment);

    ticket.lastRepliedBy = {
      id: req.user?.id,
      name: req.user?.name || 'Admin',
      role: userRole,
    };
    ticket.lastReplyAt = new Date();

    if (userRole === 'admin') {
      ticket.status = 'awaiting-developer-reply';
      ticket.unreadByDeveloper = (ticket.unreadByDeveloper || 0) + 1;
    } else {
      ticket.status = 'awaiting-admin-reply';
      ticket.unreadByAdmin = (ticket.unreadByAdmin || 0) + 1;
    }

    await ticket.save({ session });

    const newComment = ticket.comments[ticket.comments.length - 1];

    await session.commitTransaction();
    session.endSession();

    const socketService = require('../services/socketService');
    if (socketService && socketService.emitNewReply) {
      socketService.emitNewReply(ticket._id.toString(), {
        comment: newComment,
        ticket: ticket,
        timestamp: new Date(),
      });
    }

    const { sendReplyNotification } = require('../services/ticketEmailService');
    sendReplyNotification({
      ticket: ticket.toObject(),
      newReply: newComment,
      repliedBy: req.user,
    }).catch(() => {});

    return res.status(201).json({ success: true, data: newComment });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Add comment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

const markCommentsAsRead = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const userRole = req.user?.role || 'admin';
    const userId = req.user?.id;

    ticket.comments.forEach((comment) => {
      if (comment.authorRole !== userRole) {
        comment.isRead = true;
        if (!comment.readBy) comment.readBy = [];
        const alreadyRead = comment.readBy.some(r => r.userId === userId);
        if (!alreadyRead) {
          comment.readBy.push({
            userId: userId,
            readAt: new Date(),
          });
        }
      }
    });

    if (userRole === 'admin') {
      ticket.unreadByAdmin = 0;
    } else {
      ticket.unreadByDeveloper = 0;
    }

    await ticket.save();

    return res.json({
      success: true,
      data: {
        unreadByAdmin: ticket.unreadByAdmin,
        unreadByDeveloper: ticket.unreadByDeveloper,
      },
    });
  } catch (err) {
    console.error('Mark as read error:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};

const pollTicketUpdates = async (req, res) => {
  try {
    const { since } = req.query;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    let newComments = ticket.comments;
    if (since) {
      const sinceDate = new Date(since);
      newComments = ticket.comments.filter(
        (comment) => new Date(comment.createdAt) > sinceDate
      );
    }

    return res.json({
      success: true,
      data: {
        comments: newComments,
        status: ticket.status,
        unreadByAdmin: ticket.unreadByAdmin,
        unreadByDeveloper: ticket.unreadByDeveloper,
        lastReplyAt: ticket.lastReplyAt,
      },
    });
  } catch (err) {
    console.error('Poll updates error:', err);
    return res.status(500).json({ success: false, message: 'Failed to poll updates' });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addComment,
  markCommentsAsRead,
  pollTicketUpdates,
};
