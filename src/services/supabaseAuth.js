import { supabase, isSupabaseConfigured, getSupabaseClient } from '../config/supabase';
import { api } from './api';

/**
 * Supabase Auth OTP Service
 * Uses Supabase's built-in OTP authentication
 */

/**
 * Send OTP to email using Supabase Auth
 */
export async function sendEmailOTP(email) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  }

  try {
    const client = getSupabaseClient();
    
    // For email verification, try with shouldCreateUser: true first
    // Supabase Auth will handle existing users gracefully - if user exists, it just sends OTP
    // If user doesn't exist, it creates them temporarily for verification
    let { data, error } = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // Always allow - Supabase handles existing users gracefully
        emailRedirectTo: undefined
      }
    });

    // If we get a 422 error and it might be because user already exists, try with shouldCreateUser: false
    if (error && error.status === 422 && (error.message?.includes('already') || error.message?.includes('exists'))) {
      console.log('Retrying OTP send with shouldCreateUser: false for existing user');
      const retryResult = await client.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // User exists, don't create
          emailRedirectTo: undefined
        }
      });
      
      if (!retryResult.error) {
        data = retryResult.data;
        error = null;
      } else {
        // If retry also fails, use the original error
        error = retryResult.error;
      }
    }

    if (error) {
      // Provide more helpful error messages
      if (error.status === 422) {
        // 422 can mean invalid email format or Supabase Auth configuration issue
        // Try to provide more specific guidance
        if (error.message?.includes('email') || error.message?.includes('Email')) {
          throw new Error('Unable to send OTP. Please check that your email address is valid and try again.');
        }
        throw new Error('Unable to send OTP. Please check your email address and try again. If the problem persists, contact support.');
      }
      if (error.status === 429) {
        throw new Error('Too many requests. Please wait a moment before trying again.');
      }
      // Check for specific Supabase errors
      if (error.message?.includes('User already registered') || error.message?.includes('already exists')) {
        // User exists in Supabase Auth - this is fine, OTP should still be sent
        // Supabase might have sent the OTP anyway, so we'll treat this as success
        console.warn('User already exists in Supabase Auth, but OTP may have been sent:', error.message);
        return { success: true, data: null, warning: 'User already registered, but OTP may have been sent' };
      }
      throw new Error(error.message || 'Failed to send OTP. Please try again.');
    }

    return { success: true, data };
  } catch (error) {
    // Re-throw with better error handling
    if (error.message) {
      throw error;
    }
    throw new Error('Failed to send OTP. Please try again.');
  }
}

/**
 * Verify email OTP using Supabase Auth
 */
export async function verifyEmailOTP(email, otp) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    });

    if (error) {
      throw new Error(error.message || 'Invalid or expired OTP');
    }

    return { success: true, data };
  } catch (error) {
    throw error;
  }
}

/**
 * Send OTP to phone using Supabase Auth
 */
export async function sendPhoneOTP(phone) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  }

  try {
    // Ensure phone has country code
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        shouldCreateUser: false
      }
    });

    if (error) {
      // In test mode, Supabase might return an error but OTP is still generated
      // Check Supabase Dashboard → Authentication → Logs for the OTP
      if (error.message?.includes('test') || error.message?.includes('SMS')) {
        throw new Error('SMS not configured. Check Supabase Dashboard → Authentication → Logs for OTP code (Test Mode).');
      }
      throw new Error(error.message || 'Failed to send SMS OTP. Enable Test Mode in Supabase Dashboard for free OTP.');
    }

    return { 
      success: true, 
      data,
      // In test mode, show helpful message
      testMode: process.env.NODE_ENV === 'development' ? 'Check Supabase Dashboard → Authentication → Logs for OTP' : undefined
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Verify phone OTP using Supabase Auth
 */
export async function verifyPhoneOTP(phone, otp) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  }

  try {
    // Ensure phone has country code
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    const client = getSupabaseClient();
    const { data, error } = await client.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms'
    });

    if (error) {
      throw new Error(error.message || 'Invalid or expired OTP');
    }

    return { success: true, data };
  } catch (error) {
    throw error;
  }
}

/**
 * Resend OTP (email or phone)
 */
export async function resendOTP(type, identifier) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  }

  try {
    let formattedIdentifier = identifier;
    
    if (type === 'phone') {
      formattedIdentifier = identifier.startsWith('+') ? identifier : `+91${identifier}`;
    }

    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithOtp({
      [type]: formattedIdentifier,
      options: {
        shouldCreateUser: type === 'email' ? true : false // Allow creating email users, but not phone users
      }
    });

    if (error) {
      if (error.status === 422) {
        throw new Error('Unable to resend OTP. Please check your email/phone and try again.');
      }
      if (error.status === 429) {
        throw new Error('Too many requests. Please wait a moment before trying again.');
      }
      throw new Error(error.message || 'Failed to resend OTP');
    }

    return { success: true, data };
  } catch (error) {
    throw error;
  }
}

/**
 * Update verification status in backend after Supabase Auth verification
 * This syncs Supabase Auth verification with our custom users table
 */
export async function syncVerificationStatus(type, identifier) {
  try {
    return await api.post('/otp/sync-verification', { type, identifier });
  } catch (error) {
    // Don't throw - syncing is not critical
    console.warn('Failed to sync verification status:', error);
    return { success: false };
  }
}

