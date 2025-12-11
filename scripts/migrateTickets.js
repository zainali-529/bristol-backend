const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const migrateTickets = async () => {
  const Ticket = mongoose.model('Ticket', new mongoose.Schema({}, { strict: false }));

  try {
    console.log('Starting ticket migration...');

    const tickets = await Ticket.find({});
    console.log(`Found ${tickets.length} tickets to migrate`);

    for (const ticket of tickets) {
      const updates = {};

      if (ticket.unreadByAdmin === undefined) {
        updates.unreadByAdmin = 0;
      }

      if (ticket.unreadByDeveloper === undefined) {
        updates.unreadByDeveloper = 0;
      }

      if (!ticket.lastReplyAt) {
        updates.lastReplyAt = ticket.createdAt;
      }

      if (!ticket.lastRepliedBy) {
        updates.lastRepliedBy = ticket.createdBy;
      }

      if (ticket.comments && ticket.comments.length > 0) {
        ticket.comments.forEach((comment) => {
          if (comment.isRead === undefined) {
            comment.isRead = false;
          }
          if (!comment.readBy) {
            comment.readBy = [];
          }
          if (comment.attachments && Array.isArray(comment.attachments)) {
            comment.attachments = comment.attachments.map((att) => {
              if (typeof att === 'string') {
                return {
                  url: att,
                  filename: att.split('/').pop() || 'attachment',
                  fileType: 'unknown',
                  size: 0,
                };
              }
              return att;
            });
          }
        });
        updates.comments = ticket.comments;
      }

      if (ticket.attachments && Array.isArray(ticket.attachments)) {
        updates.attachments = ticket.attachments.map((att) => {
          if (typeof att === 'string') {
            return {
              url: att,
              filename: att.split('/').pop() || 'attachment',
              fileType: 'unknown',
              size: 0,
            };
          }
          return att;
        });
      }

      if (Object.keys(updates).length > 0) {
        await Ticket.updateOne({ _id: ticket._id }, { $set: updates });
        console.log(`Migrated ticket: ${ticket._id}`);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};

const run = async () => {
  await connectDB();
  await migrateTickets();
  await mongoose.disconnect();
  console.log('Database disconnected');
  process.exit(0);
};

run();
