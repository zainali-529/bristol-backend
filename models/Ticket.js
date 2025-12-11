const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: { type: String, required: true },
  fileType: { type: String },
  size: { type: Number },
}, { _id: false });

const CommentSchema = new mongoose.Schema(
  {
    authorName: { type: String, required: true },
    authorRole: { type: String, enum: ['admin', 'developer'], required: true },
    message: { type: String, required: true },
    attachments: [AttachmentSchema],
    isRead: { type: Boolean, default: false },
    readBy: [{
      userId: { type: String },
      readAt: { type: Date },
    }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const TicketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed', 'awaiting-admin-reply', 'awaiting-developer-reply'],
      default: 'open',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    category: {
      type: String,
      enum: ['bug', 'feature', 'request', 'discussion'],
      default: 'bug',
      index: true,
    },
    createdBy: {
      id: { type: String },
      name: { type: String },
      email: { type: String },
      role: { type: String, enum: ['admin', 'developer'], default: 'admin' },
    },
    attachments: [AttachmentSchema],
    comments: [CommentSchema],
    lastRepliedBy: {
      id: { type: String },
      name: { type: String },
      role: { type: String, enum: ['admin', 'developer'] },
    },
    lastReplyAt: { type: Date },
    unreadByAdmin: { type: Number, default: 0 },
    unreadByDeveloper: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TicketSchema.index({ title: 'text', description: 'text' });
TicketSchema.index({ lastReplyAt: -1 });
TicketSchema.index({ 'lastRepliedBy.role': 1 });

module.exports = mongoose.model('Ticket', TicketSchema);

