// SMS service for sending OTP via phone
// Supports multiple providers: Twilio, AWS SNS, custom SMS gateway

/**
 * Send OTP via SMS
 * 
 * In production, integrate with:
 * - Twilio (recommended)
 * - AWS SNS
 * - Custom SMS gateway
 * 
 * For development, we'll log the OTP to console
 */
export async function sendOTPSMS(phoneNumber, otp, countryCode = '+91') {
  const fullPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `${countryCode}${phoneNumber}`;

  // Production: Use Twilio
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilio = await import('twilio');
      const client = twilio.default(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const message = await client.messages.create({
        body: `Your RPA Helpline verification code is: ${otp}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: fullPhoneNumber
      });

      return { success: true, messageId: message.sid };
    } catch (error) {
      console.error('Twilio SMS error:', error);
      throw new Error('Failed to send SMS');
    }
  }

  // Development: Log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('='.repeat(50));
    console.log('SMS OTP (Development Mode)');
    console.log('='.repeat(50));
    console.log(`To: ${fullPhoneNumber}`);
    console.log(`OTP: ${otp}`);
    console.log(`Message: Your RPA Helpline verification code is: ${otp}. Valid for 10 minutes.`);
    console.log('='.repeat(50));
    
    return { success: true, messageId: 'dev-' + Date.now() };
  }

  // Fallback: If no SMS service configured, throw error
  throw new Error('SMS service not configured. Please set up Twilio or another SMS provider.');
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phoneNumber, countryCode = '+91') {
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Indian phone number validation (10 digits)
  if (countryCode === '+91' || countryCode === '91') {
    const digits = cleaned.replace(/^\+?91/, '').replace(/^\+/, '');
    return /^[6-9]\d{9}$/.test(digits);
  }
  
  // Generic validation (10-15 digits)
  const digits = cleaned.replace(/^\+/, '');
  return /^\d{10,15}$/.test(digits);
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phoneNumber, countryCode = '+91') {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (countryCode === '+91' || countryCode === '91') {
    // Format Indian number: +91 XXXXXXXXXX
    if (cleaned.length === 10) {
      return `+91 ${cleaned}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+91 ${cleaned.substring(2)}`;
    }
  }
  
  // Generic formatting
  if (!cleaned.startsWith('+')) {
    return `${countryCode}${cleaned}`;
  }
  
  return cleaned;
}



