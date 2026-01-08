import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';

// OTP configuration
const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 5,
  RESEND_COOLDOWN_SECONDS: 60
};

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Store OTP in database
 */
export async function storeOTP(userId, type, identifier, otp) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_CONFIG.EXPIRY_MINUTES);

  // Invalidate any existing OTPs for this user and type
  await supabaseAdmin
    .from('otp_verifications')
    .update({ is_used: true })
    .eq('user_id', userId)
    .eq('type', type)
    .eq('is_used', false);

  // Insert new OTP
  const { data, error } = await supabaseAdmin
    .from('otp_verifications')
    .insert({
      user_id: userId,
      type, // 'email' or 'phone'
      identifier, // email address or phone number
      otp_code: otp,
      expires_at: expiresAt.toISOString(),
      attempts: 0,
      is_used: false
    })
    .select()
    .single();

  if (error) {
    console.error('OTP storage error:', error);
    throw new Error('Failed to store OTP');
  }

  return data;
}

/**
 * Verify OTP
 */
export async function verifyOTP(userId, type, identifier, otp) {
  // Get the most recent unused OTP
  const { data: otpRecord, error } = await supabaseAdmin
    .from('otp_verifications')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .eq('identifier', identifier)
    .eq('is_used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !otpRecord) {
    return { valid: false, error: 'Invalid or expired OTP' };
  }

  // Check if OTP is expired
  if (new Date(otpRecord.expires_at) < new Date()) {
    return { valid: false, error: 'OTP has expired' };
  }

  // Check if max attempts exceeded
  if (otpRecord.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
    return { valid: false, error: 'Maximum verification attempts exceeded' };
  }

  // Increment attempts
  await supabaseAdmin
    .from('otp_verifications')
    .update({ attempts: otpRecord.attempts + 1 })
    .eq('id', otpRecord.id);

  // Verify OTP
  if (otpRecord.otp_code !== otp) {
    return { valid: false, error: 'Invalid OTP code' };
  }

  // Mark OTP as used
  await supabaseAdmin
    .from('otp_verifications')
    .update({ is_used: true, verified_at: new Date().toISOString() })
    .eq('id', otpRecord.id);

  return { valid: true };
}

/**
 * Check if user can resend OTP (cooldown check)
 */
export async function canResendOTP(userId, type) {
  const { data } = await supabaseAdmin
    .from('otp_verifications')
    .select('created_at')
    .eq('user_id', userId)
    .eq('type', type)
    .eq('is_used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    return { canResend: true };
  }

  const lastSent = new Date(data.created_at);
  const now = new Date();
  const secondsSinceLastSent = (now - lastSent) / 1000;

  if (secondsSinceLastSent < OTP_CONFIG.RESEND_COOLDOWN_SECONDS) {
    const remainingSeconds = Math.ceil(OTP_CONFIG.RESEND_COOLDOWN_SECONDS - secondsSinceLastSent);
    return { 
      canResend: false, 
      remainingSeconds 
    };
  }

  return { canResend: true };
}

/**
 * Clean up expired OTPs (can be called by a cron job)
 */
export async function cleanupExpiredOTPs() {
  const { error } = await supabaseAdmin
    .from('otp_verifications')
    .update({ is_used: true })
    .lt('expires_at', new Date().toISOString())
    .eq('is_used', false);

  if (error) {
    console.error('OTP cleanup error:', error);
  }
}







