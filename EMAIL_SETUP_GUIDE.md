# Email Setup Guide

## 📧 Email Configuration for Contact Form Notifications

This guide will help you set up email notifications for contact form submissions.

---

## 📦 Installation

First, install nodemailer:

```bash
cd backend
npm install nodemailer
```

---

## 🔧 Environment Variables

Add these variables to your `.env` file in the `backend` directory:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@bristolutilities.co.uk
```

---

## 📝 Gmail Setup (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "Bristol Utilities Backend"
4. Click "Generate"
5. Copy the 16-character password
6. Use this password in `EMAIL_PASS` (not your regular Gmail password)

### Step 3: Update .env File
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  # The 16-character app password
ADMIN_EMAIL=admin@bristolutilities.co.uk
```

---

## 📧 Other Email Providers

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Yahoo Mail
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

### Custom SMTP Server
```env
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=587  # or 465 for SSL
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-password
ADMIN_EMAIL=admin@yourdomain.com
```

---

## ✨ Features

### 1. Admin Notification Email
When a contact form is submitted, the admin receives a beautifully formatted email with:
- Contact's name, email, phone
- Service inquiry
- Full message
- Submission timestamp
- Clickable email and phone links

### 2. Thank You Email
The user receives a professional thank you email with:
- Personalized greeting
- Confirmation of submission
- Submission details
- Expected response time
- Contact support button

---

## 🎨 Email Templates

Both email templates are:
- ✅ Fully responsive (mobile-friendly)
- ✅ Beautiful HTML design
- ✅ Brand colors (primary: #AE613A)
- ✅ Professional layout
- ✅ Accessible and readable

---

## 🔍 Testing

### Test Email Sending
You can test the email service by submitting a contact form from your website. Check:
1. Admin email inbox for notification
2. User email inbox for thank you message

### Debug Mode
If emails aren't sending, check:
1. Server console logs for errors
2. Email credentials are correct
3. Firewall/network allows SMTP connections
4. App password is correct (for Gmail)

---

## 🚨 Troubleshooting

### Emails Not Sending

**Issue:** "Invalid login" or "Authentication failed"
- **Solution:** Use App Password for Gmail, not regular password
- **Solution:** Check EMAIL_USER and EMAIL_PASS are correct

**Issue:** "Connection timeout"
- **Solution:** Check EMAIL_HOST and EMAIL_PORT
- **Solution:** Verify firewall allows SMTP connections

**Issue:** "Emails going to spam"
- **Solution:** Add SPF/DKIM records to your domain
- **Solution:** Use a professional email address (not free Gmail)

### Common Errors

**Error:** `getaddrinfo ENOENT`
- **Solution:** Check internet connection
- **Solution:** Verify EMAIL_HOST is correct

**Error:** `Invalid credentials`
- **Solution:** Regenerate app password
- **Solution:** Check EMAIL_USER format

---

## 📋 Email Flow

```
User Submits Contact Form
         ↓
Contact Saved to Database
         ↓
    ┌────┴────┐
    ↓         ↓
Admin Email  User Thank You Email
(Notification)  (Confirmation)
```

---

## 🔐 Security Notes

1. **Never commit `.env` file** to version control
2. **Use App Passwords** instead of regular passwords
3. **Keep credentials secure** and rotate regularly
4. **Use environment variables** for all sensitive data

---

## 📝 Example .env File

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/bristol_utilities

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
ADMIN_EMAIL=admin@bristolutilities.co.uk
```

---

## ✅ Verification Checklist

- [ ] Nodemailer installed (`npm install nodemailer`)
- [ ] `.env` file created with email credentials
- [ ] App password generated (for Gmail)
- [ ] ADMIN_EMAIL set to your admin email
- [ ] Test contact form submission
- [ ] Check admin email inbox
- [ ] Check user email inbox
- [ ] Verify email formatting looks good

---

## 🎯 Next Steps

1. Install nodemailer: `npm install nodemailer`
2. Configure `.env` file with your email credentials
3. Test by submitting a contact form
4. Customize email templates if needed (in `backend/services/emailService.js`)

---

**Status:** ✅ Email service ready - Just needs nodemailer installation and .env configuration!

