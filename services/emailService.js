const nodemailer = require('nodemailer');
const config = require('../config/config');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    secure: config.EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASS,
    },
  });
};

// Email templates
const emailTemplates = {
  // Admin notification email template
  adminNotification: (contactData) => {
    const primaryColor = '#AE613A'; // Your brand color
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px; background: linear-gradient(135deg, ${primaryColor} 0%, #8B4A2E 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">New Contact Form Submission</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                You have received a new contact form submission from your website.
              </p>
              
              <div style="background-color: #f9f9f9; border-left: 4px solid ${primaryColor}; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333; width: 120px;">Name:</td>
                    <td style="padding: 8px 0; color: #666666;">${contactData.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333;">Email:</td>
                    <td style="padding: 8px 0; color: #666666;">
                      <a href="mailto:${contactData.email}" style="color: ${primaryColor}; text-decoration: none;">${contactData.email}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333;">Phone:</td>
                    <td style="padding: 8px 0; color: #666666;">
                      <a href="tel:${contactData.phone}" style="color: ${primaryColor}; text-decoration: none;">${contactData.phone}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333;">Service:</td>
                    <td style="padding: 8px 0; color: #666666;">${contactData.service}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333; vertical-align: top;">Message:</td>
                    <td style="padding: 8px 0; color: #666666; line-height: 1.6;">${contactData.message.replace(/\n/g, '<br>')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #333333;">Submitted:</td>
                    <td style="padding: 8px 0; color: #666666;">${new Date(contactData.createdAt).toLocaleString('en-GB', { 
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
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0; color: #666666; font-size: 14px;">
                  Please respond to this inquiry as soon as possible.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                This is an automated email from Bristol Utilities Contact Form System.
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

  // Thank you email template for user
  thankYouEmail: (contactData) => {
    const primaryColor = '#AE613A'; // Your brand color
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Contacting Us</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, ${primaryColor} 0%, #8B4A2E 100%); border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Thank You!</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">We've received your message</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Dear <strong>${contactData.name}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Thank you for reaching out to <strong>Bristol Utilities</strong>! We have successfully received your contact form submission and appreciate you taking the time to get in touch with us.
              </p>
              
              <div style="background-color: #f9f9f9; border-left: 4px solid ${primaryColor}; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px; font-weight: 600;">Your Submission Details:</p>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; color: #666666; font-size: 14px;">Service:</td>
                    <td style="padding: 4px 0; color: #333333; font-size: 14px; font-weight: 500;">${contactData.service}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #666666; font-size: 14px;">Submitted:</td>
                    <td style="padding: 4px 0; color: #333333; font-size: 14px;">${new Date(contactData.createdAt).toLocaleString('en-GB', { 
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
                Our team will review your inquiry and get back to you as soon as possible, typically within 24-48 hours during business days.
              </p>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                If you have any urgent questions or concerns, please feel free to contact us directly at our support email or phone number.
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
  // Admin password reset email template
  passwordReset: (resetUrl) => {
    const primaryColor = '#AE613A';
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Admin Password</title>
  <style>body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f5f5f5;margin:0;padding:0}</style>
  </head>
<body>
  <table role="presentation" style="width:100%;background:#f5f5f5;border-collapse:collapse">
    <tr><td align="center" style="padding:40px 20px">
      <table role="presentation" style="max-width:600px;width:100%;background:#fff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);border-collapse:collapse">
        <tr>
          <td style="padding:30px;background:linear-gradient(135deg, ${primaryColor} 0%, #8B4A2E 100%);border-radius:8px 8px 0 0">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:600">Password Reset</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:30px;color:#333">
            <p style="margin:0 0 12px 0">You requested to reset your admin password.</p>
            <p style="margin:0 0 20px 0">Click the button below to set a new password. This link expires in 30 minutes.</p>
            <p>
              <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:${primaryColor};color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Reset Password</a>
            </p>
            <p style="margin-top:24px;color:#666;font-size:12px">If you did not request this, ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 30px;background:#f9f9f9;border-radius:0 0 8px 8px;text-align:center">
            <p style="margin:0;color:#999;font-size:12px">Bristol Utilities Admin Portal</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `;
  }
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${options.fromName || 'Bristol Utilities'}" <${config.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.subject, // Fallback text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send admin notification email
const sendAdminNotification = async (contactData, adminEmail) => {
  const html = emailTemplates.adminNotification(contactData);
  
  return await sendEmail({
    to: adminEmail,
    subject: `New Contact Form Submission from ${contactData.name}`,
    html: html,
    fromName: 'Bristol Utilities Contact Form',
  });
};

// Send thank you email to user
const sendThankYouEmail = async (contactData) => {
  const html = emailTemplates.thankYouEmail(contactData);
  
  return await sendEmail({
    to: contactData.email,
    subject: 'Thank You for Contacting Bristol Utilities',
    html: html,
    fromName: 'Bristol Utilities',
  });
};

module.exports = {
  sendEmail,
  sendAdminNotification,
  sendThankYouEmail,
  emailTemplates,
};
