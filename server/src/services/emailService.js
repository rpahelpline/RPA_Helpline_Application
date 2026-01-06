// Email service for sending OTP and notifications
// Supports multiple providers: SendGrid, AWS SES, Nodemailer

import nodemailer from 'nodemailer';

// Email configuration
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'noreply@rpahelpline.com',
  fromName: process.env.EMAIL_FROM_NAME || 'RPA Helpline',
};

// Create transporter based on environment
let transporter = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  // Use SendGrid if configured
  if (process.env.SENDGRID_API_KEY) {
    transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }
  // Use SMTP if configured
  else if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  // Development: Use Ethereal or console logging
  else {
    // For development, log emails to console
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }

  return transporter;
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(email, otp, name = 'User') {
  const mailOptions = {
    from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.from}>`,
    to: email,
    subject: 'Your RPA Helpline Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RPA Helpline</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Thank you for registering with RPA Helpline. Please use the following code to verify your email address:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} RPA Helpline. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${name}!
      
      Your RPA Helpline verification code is: ${otp}
      
      This code will expire in 10 minutes.
      
      If you didn't request this code, please ignore this email.
    `
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    
    // In development, log the email
    if (process.env.NODE_ENV === 'development') {
      console.log('Email sent (dev mode):', {
        to: email,
        otp,
        preview: nodemailer.getTestMessageUrl(info)
      });
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(email, name) {
  const mailOptions = {
    from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.from}>`,
    to: email,
    subject: 'Welcome to RPA Helpline!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to RPA Helpline!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Welcome to RPA Helpline - your command center for RPA excellence!</p>
            <p>Your account has been successfully created and verified. You can now:</p>
            <ul>
              <li>Complete your profile</li>
              <li>Browse projects and opportunities</li>
              <li>Connect with RPA professionals</li>
              <li>Start your RPA journey</li>
            </ul>
            <p>Get started by completing your profile to unlock all features.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await getTransporter().sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Welcome email error:', error);
    // Don't throw - welcome email is not critical
    return { success: false };
  }
}


