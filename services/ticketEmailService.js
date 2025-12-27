const { sendEmail } = require('./emailService');
const config = require('../config/config');

const brandColor = '#AE613A';

const templates = {
  ticketCreated: (ticket) => `
<!doctype html>
<html><body style="font-family:Segoe UI,Arial,sans-serif">
  <div style="max-width:700px;margin:auto;border:1px solid #eee;border-radius:8px;overflow:hidden">
    <div style="background:linear-gradient(135deg, ${brandColor}, #8B4A2E);color:#fff;padding:16px 20px">
      <h2 style="margin:0;font-size:18px">New Ticket Created</h2>
    </div>
    <div style="padding:20px">
      <p style="margin:0 0 12px 0">A new ticket has been created.</p>
      <table role="presentation" style="width:100%;border-collapse:collapse">
        <tr><td style="padding:4px 0;width:140px;font-weight:600">Title</td><td>${ticket.title}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600">Priority</td><td>${ticket.priority}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600">Category</td><td>${ticket.category}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600">Status</td><td>${ticket.status}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600">Created By</td><td>${ticket.createdBy?.name || 'Admin'}</td></tr>
      </table>
      <div style="margin-top:12px;padding:12px;background:#f9f9f9;border-left:4px solid ${brandColor}">
        ${ticket.description}
      </div>
    </div>
  </div>
  <p style="color:#888;text-align:center;font-size:12px;margin-top:8px">Bristol Utilities Ticketing</p>
</body></html>`,

  statusChanged: ({ ticket, oldStatus }) => `
<!doctype html>
<html><body style="font-family:Segoe UI,Arial,sans-serif">
  <div style="max-width:700px;margin:auto;border:1px solid #eee;border-radius:8px;overflow:hidden">
    <div style="background:linear-gradient(135deg, ${brandColor}, #8B4A2E);color:#fff;padding:16px 20px">
      <h2 style="margin:0;font-size:18px">Ticket Status Updated</h2>
    </div>
    <div style="padding:20px">
      <p style="margin:0 0 12px 0">Status changed from <strong>${oldStatus}</strong> to <strong>${ticket.status}</strong>.</p>
      <p style="margin:0 0 8px 0"><strong>${ticket.title}</strong></p>
    </div>
  </div>
</body></html>`,

  priorityEscalated: ({ ticket, oldPriority }) => `
<!doctype html>
<html><body style="font-family:Segoe UI,Arial,sans-serif">
  <div style="max-width:700px;margin:auto;border:1px solid #eee;border-radius:8px;overflow:hidden">
    <div style="background:#8B0000;color:#fff;padding:16px 20px">
      <h2 style="margin:0;font-size:18px">Priority Escalation</h2>
    </div>
    <div style="padding:20px">
      <p style="margin:0 0 12px 0">Priority changed from <strong>${oldPriority}</strong> to <strong>${ticket.priority}</strong>.</p>
      <p style="margin:0 0 8px 0"><strong>${ticket.title}</strong></p>
    </div>
  </div>
</body></html>`,
};

const getDeveloperEmails = () => {
  const raw = process.env.DEVELOPER_EMAILS || '';
  const list = raw.split(',').map((e) => e.trim()).filter(Boolean);
  return list.length ? list : [config.ADMIN_EMAIL].filter(Boolean);
};

const notifyDevelopers = async ({ subject, html }) => {
  const recipients = getDeveloperEmails();
  const results = await Promise.all(
    recipients.map((to) =>
      sendEmail({ to, subject, html, fromName: 'Bristol Utilities Tickets' }).catch((e) => ({ success: false, error: e.message }))
    )
  );
  return results;
};

const sendTicketCreatedEmail = async (ticket) => {
  if (ticket.notificationPreferences?.developer === false) return;
  const html = templates.ticketCreated(ticket);
  return notifyDevelopers({ subject: `New Ticket: ${ticket.title}`, html });
};

const sendTicketStatusChangedEmail = async (ticket, oldStatus) => {
  if (ticket.notificationPreferences?.developer === false) return;
  const html = templates.statusChanged({ ticket, oldStatus });
  return notifyDevelopers({ subject: `Status Updated: ${ticket.title}`, html });
};

const sendPriorityEscalationEmail = async (ticket, oldPriority) => {
  if (ticket.notificationPreferences?.developer === false) return;
  const html = templates.priorityEscalated({ ticket, oldPriority });
  return notifyDevelopers({ subject: `Priority Escalation: ${ticket.title}`, html });
};

const sendReplyNotification = async ({ ticket, newReply, repliedBy }) => {
  const recentComments = ticket.comments.slice(-3);
  
  let conversationContext = '';
  recentComments.forEach((comment) => {
    conversationContext += `
      <div style="margin-bottom:12px;padding:10px;background:${comment.authorRole === 'admin' ? '#fff4e6' : '#e6f3ff'};border-left:3px solid ${comment.authorRole === 'admin' ? brandColor : '#2196F3'};border-radius:4px">
        <div style="font-weight:600;margin-bottom:4px">${comment.authorName} (${comment.authorRole})</div>
        <div style="font-size:14px">${comment.message}</div>
        ${comment.attachments && comment.attachments.length > 0 ? `
          <div style="margin-top:8px;font-size:12px;color:#666">
            📎 ${comment.attachments.length} attachment(s)
          </div>
        ` : ''}
      </div>
    `;
  });

  const attachmentLinks = newReply.attachments && newReply.attachments.length > 0
    ? newReply.attachments.map(att => `
        <div style="margin-top:8px">
          <a href="${att.url}" style="color:${brandColor};text-decoration:none;font-size:14px">
            📎 ${att.filename || 'Attachment'}
          </a>
        </div>
      `).join('')
    : '';

  const html = `
<!doctype html>
<html><body style="font-family:Segoe UI,Arial,sans-serif">
  <div style="max-width:700px;margin:auto;border:1px solid #eee;border-radius:8px;overflow:hidden">
    <div style="background:linear-gradient(135deg, ${brandColor}, #8B4A2E);color:#fff;padding:16px 20px">
      <h2 style="margin:0;font-size:18px">New Reply on Ticket: ${ticket.title}</h2>
    </div>
    <div style="padding:20px">
      <p style="margin:0 0 12px 0;font-size:14px;color:#666">
        <strong>${newReply.authorName}</strong> (${newReply.authorRole}) replied to the ticket:
      </p>
      <div style="margin:16px 0;padding:14px;background:#f9f9f9;border-left:4px solid ${brandColor};border-radius:4px">
        ${newReply.message}
      </div>
      ${attachmentLinks}
      
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee">
        <h3 style="font-size:14px;color:#666;margin:0 0 12px 0">Recent Conversation:</h3>
        ${conversationContext}
      </div>
    </div>
  </div>
  <p style="color:#888;text-align:center;font-size:12px;margin-top:12px">Bristol Utilities Ticketing System</p>
</body></html>`;

  let recipients = [];
  if (repliedBy?.role === 'admin') {
    // Admin replied -> Notify Developer/User
    if (ticket.notificationPreferences?.developer !== false) {
      recipients = getDeveloperEmails();
    }
  } else {
    // Developer/User replied -> Notify Admin
    if (ticket.notificationPreferences?.admin !== false) {
      recipients = [process.env.ADMIN_EMAIL || 'admin@bristolutilities.com'];
    }
  }
  
  if (recipients.length === 0) return;
  
  const results = await Promise.all(
    recipients.map((to) =>
      sendEmail({ 
        to, 
        subject: `New Reply on Ticket: ${ticket.title}`, 
        html, 
        fromName: 'Bristol Utilities Tickets' 
      }).catch((e) => ({ success: false, error: e.message }))
    )
  );
  
  return results;
};

module.exports = {
  sendTicketCreatedEmail,
  sendTicketStatusChangedEmail,
  sendPriorityEscalationEmail,
  sendReplyNotification,
};

