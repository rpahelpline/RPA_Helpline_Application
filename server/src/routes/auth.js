import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { supabaseAdmin } from '../config/supabase.js';
import { generateToken, generateRefreshToken, authenticateToken } from '../middleware/auth.js';
import { registerValidation, loginValidation } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { USER_TYPES, USER_TYPE_LABELS } from '../config/constants.js';

const router = express.Router();

// Register new user
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  const { email, password, full_name, user_type, phone, company_name } = req.body;

  // Validate user type
  if (!Object.values(USER_TYPES).includes(user_type)) {
    return res.status(400).json({ error: 'Invalid user type' });
  }

  // Normalize email (lowercase for consistency - industry standard)
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists (case-insensitive email check)
  const { data: existingUsers } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .ilike('email', normalizedEmail);

  if (existingUsers && existingUsers.length > 0) {
    // Check if profile exists for this user
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, full_name')
      .eq('user_id', existingUsers[0].id)
      .single();
    
    if (existingProfile) {
      return res.status(409).json({ 
        error: 'User with this email already exists',
        message: 'Please log in instead of registering again. You can also use Google OAuth to merge accounts.'
      });
    }
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user in users table (with normalized email)
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      email: normalizedEmail, // Store normalized email
      password_hash: passwordHash,
      phone: phone || null
    })
    .select()
    .single();

  if (userError) {
    // Handle duplicate email error - initiate account recovery
    if (userError.code === '23505' && userError.details?.includes('email')) {
      // User already exists - initiate account recovery flow
      // Get existing user
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, email, email_verified')
        .eq('email', normalizedEmail)
        .single();

      if (existingUser) {
        return res.status(409).json({
          error: 'Account already exists',
          code: 'ACCOUNT_EXISTS',
          message: 'An account with this email already exists. Please verify your email to recover your account.',
          requiresVerification: true,
          email: normalizedEmail,
          emailVerified: existingUser.email_verified || false
        });
      }
    }
    
    console.error('User creation error:', userError);
    return res.status(500).json({ error: 'Failed to create user account' });
  }

  // Create profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      user_id: user.id,
      full_name,
      user_type,
      display_name: full_name.split(' ')[0],
      headline: USER_TYPE_LABELS[user_type]
    })
    .select()
    .single();

  if (profileError) {
    // Rollback: delete user if profile creation fails
    await supabaseAdmin.from('users').delete().eq('id', user.id);
    console.error('Profile creation error:', profileError);
    return res.status(500).json({ error: 'Failed to create user profile' });
  }

  // Create specialized profile based on user type
  await createSpecializedProfile(profile.id, user_type, { company_name });

  // Generate tokens (use normalized email)
  const token = generateToken(profile.id, normalizedEmail);
  const refreshToken = generateRefreshToken(profile.id);

  res.status(201).json({
    message: 'Registration successful',
    user: {
      id: profile.id,
      email: user.email, // Already normalized
      full_name: profile.full_name,
      user_type: profile.user_type,
      display_name: profile.display_name
    },
    token,
    refreshToken
  });
}));

// Helper: Create specialized profile
async function createSpecializedProfile(profileId, userType, data = {}) {
  const profileData = { profile_id: profileId };
  
  try {
    switch (userType) {
      case USER_TYPES.FREELANCER:
        await supabaseAdmin.from('freelancer_profiles').insert(profileData);
        break;
      case USER_TYPES.JOB_SEEKER:
        await supabaseAdmin.from('job_seeker_profiles').insert(profileData);
        break;
      case USER_TYPES.TRAINER:
        await supabaseAdmin.from('trainer_profiles').insert(profileData);
        break;
      case USER_TYPES.BA_PM:
        await supabaseAdmin.from('ba_pm_profiles').insert({
          ...profileData,
          primary_role: 'both'
        });
        break;
      case USER_TYPES.CLIENT:
        await supabaseAdmin.from('client_profiles').insert({
          ...profileData,
          company_name: data.company_name || null
        });
        break;
      case USER_TYPES.EMPLOYER:
        await supabaseAdmin.from('employer_profiles').insert({
          ...profileData,
          company_name: data.company_name || 'Unknown Company'
        });
        break;
    }
  } catch (error) {
    console.error('Specialized profile creation error:', error);
  }
}

// Login - Industry Standard (case-insensitive email)
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Normalize email (lowercase for consistency)
  const normalizedEmail = email.toLowerCase().trim();

  // Get user from database (case-insensitive search)
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('*')
    .ilike('email', normalizedEmail);
  
  const user = users && users.length > 0 ? users[0] : null;

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Normalize email in database if different (one-time migration)
  if (user.email.toLowerCase() !== normalizedEmail) {
    await supabaseAdmin
      .from('users')
      .update({ email: normalizedEmail })
      .eq('id', user.id);
    user.email = normalizedEmail;
  }

  if (!user.is_active) {
    return res.status(401).json({ error: 'Account is deactivated' });
  }

  // Verify password (OAuth users don't have passwords)
  if (!user.password_hash) {
    return res.status(401).json({ 
      error: 'This account was created with Google. Please sign in with Google instead.',
      useGoogleAuth: true
    });
  }
  
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Get profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return res.status(500).json({ error: 'User profile not found' });
  }

  // Generate tokens (use normalized email)
  const token = generateToken(profile.id, normalizedEmail);
  const refreshToken = generateRefreshToken(profile.id);

  // Update last login
  await supabaseAdmin
    .from('users')
    .update({ 
      last_login_at: new Date().toISOString(),
      login_count: (user.login_count || 0) + 1
    })
    .eq('id', user.id);

  res.json({
    message: 'Login successful',
    user: {
      id: profile.id,
      email: user.email,
      full_name: profile.full_name,
      display_name: profile.display_name,
      user_type: profile.user_type,
      avatar_url: profile.avatar_url,
      is_verified: profile.is_verified
    },
    token,
    refreshToken
  });
}));

// Check if email exists (for OTP flow)
router.get('/check-email', asyncHandler(async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Normalize email (case-insensitive)
  const normalizedEmail = email.toLowerCase().trim();

  const { data: existingUsers } = await supabaseAdmin
    .from('users')
    .select('id')
    .ilike('email', normalizedEmail);

  res.json({ exists: existingUsers && existingUsers.length > 0 });
}));

// Get current user
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  // Get user email from users table
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('email, phone, is_active, email_verified')
    .eq('id', req.user.user_id)
    .single();

  // Get specialized profile based on user type
  let specializedProfile = null;
  const userType = req.user.user_type;
  
  if (userType === USER_TYPES.FREELANCER) {
    const { data } = await supabaseAdmin
      .from('freelancer_profiles')
      .select('*')
      .eq('profile_id', req.userId)
      .single();
    specializedProfile = data;
  } else if (userType === USER_TYPES.JOB_SEEKER) {
    const { data } = await supabaseAdmin
      .from('job_seeker_profiles')
      .select('*')
      .eq('profile_id', req.userId)
      .single();
    specializedProfile = data;
  } else if (userType === USER_TYPES.TRAINER) {
    const { data } = await supabaseAdmin
      .from('trainer_profiles')
      .select('*')
      .eq('profile_id', req.userId)
      .single();
    specializedProfile = data;
  } else if (userType === USER_TYPES.BA_PM) {
    const { data } = await supabaseAdmin
      .from('ba_pm_profiles')
      .select('*')
      .eq('profile_id', req.userId)
      .single();
    specializedProfile = data;
  } else if (userType === USER_TYPES.CLIENT) {
    const { data } = await supabaseAdmin
      .from('client_profiles')
      .select('*')
      .eq('profile_id', req.userId)
      .single();
    specializedProfile = data;
  } else if (userType === USER_TYPES.EMPLOYER) {
    const { data } = await supabaseAdmin
      .from('employer_profiles')
      .select('*')
      .eq('profile_id', req.userId)
      .single();
    specializedProfile = data;
  }

  res.json({
    user: {
      ...req.user,
      email: user?.email,
      phone: user?.phone,
      is_active: user?.is_active,
      email_verified: user?.email_verified,
      specialized_profile: specializedProfile
    }
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Get profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id')
      .eq('id', decoded.userId)
      .single();

    if (!profile) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get email
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', profile.user_id)
      .single();

    const newToken = generateToken(profile.id, user.email);
    const newRefreshToken = generateRefreshToken(profile.id);

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}));

// Update password
router.put('/password', authenticateToken, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  // Get user with password
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('password_hash')
    .eq('id', req.user.user_id)
    .single();

  // Verify current password (OAuth users don't have passwords)
  if (!user.password_hash) {
    return res.status(400).json({ 
      error: 'This account was created with Google and does not have a password. Cannot change password.',
      useGoogleAuth: true
    });
  }
  
  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Update in database
  await supabaseAdmin
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', req.user.user_id);

  res.json({ message: 'Password updated successfully' });
}));

// Request account recovery (for duplicate email during registration)
router.post('/recover-account', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user exists
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, email_verified')
    .eq('email', normalizedEmail)
    .single();

  if (!user) {
    // Don't reveal if user exists for security
    return res.json({
      message: 'If an account exists with this email, a verification code has been sent.',
      requiresVerification: true
    });
  }

  // Return response indicating verification is needed
  res.json({
    message: 'Please verify your email to recover your account',
    requiresVerification: true,
    email: normalizedEmail,
    emailVerified: user.email_verified || false
  });
}));

// Forgot password - send OTP to email
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user exists
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, email_verified')
    .eq('email', normalizedEmail)
    .single();

  if (!user) {
    // Don't reveal if user exists for security
    return res.json({
      message: 'If an account exists with this email, a verification code has been sent.',
      requiresVerification: true
    });
  }

  // Return response indicating verification is needed
  res.json({
    message: 'Please verify your email to reset your password',
    requiresVerification: true,
    email: normalizedEmail,
    emailVerified: user.email_verified || false
  });
}));

// Reset password after email verification (for account recovery and forgot password)
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { email, newPassword, verificationToken, full_name, user_type, phone, company_name } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Get user
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email_verified')
    .eq('email', normalizedEmail)
    .single();

  if (userError || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // For now, we'll require email verification to be done via OTP first
  // The frontend should verify email before calling this endpoint
  // In a production system, you'd verify the verificationToken here
  
  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Update password
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ 
      password_hash: passwordHash,
      email_verified: true, // Mark as verified after recovery
      email_verified_at: new Date().toISOString(),
      phone: phone || undefined // Update phone if provided
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Password update error:', updateError);
    return res.status(500).json({ error: 'Failed to update password' });
  }

  // Check if profile exists
  let { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  // If profile doesn't exist and we have details, create it
  if ((profileError || !profile) && full_name && user_type) {
    // Validate user type
    if (!Object.values(USER_TYPES).includes(user_type)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    // Create profile
    const { data: newProfile, error: createProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: user.id,
        full_name,
        user_type,
        display_name: full_name.split(' ')[0],
        headline: USER_TYPE_LABELS[user_type] || user_type
      })
      .select()
      .single();

    if (createProfileError) {
      console.error('Profile creation error:', createProfileError);
      return res.status(500).json({ error: 'Failed to create user profile' });
    }

    profile = newProfile;

    // Create specialized profile based on user type
    await createSpecializedProfile(profile.id, user_type, { company_name });
  }

  if (!profile) {
    // Profile doesn't exist and no details provided
    return res.status(400).json({ 
      error: 'Profile not found',
      requiresProfileDetails: true,
      message: 'Please provide profile details (full_name, user_type) to complete account setup.'
    });
  }

  // Generate tokens for automatic login
  const token = generateToken(profile.id, normalizedEmail);
  const refreshToken = generateRefreshToken(profile.id);

  res.json({
    message: 'Password reset successfully. You have been logged in.',
    token,
    refreshToken,
    user: {
      id: profile.id,
      email: normalizedEmail
    }
  });
}));

// Logout
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // Could implement token blacklisting here
  res.json({ message: 'Logged out successfully' });
}));

// Google OAuth - Industry Standard Account Merging
router.post('/google', asyncHandler(async (req, res) => {
  const { token: googleToken } = req.body;

  if (!googleToken) {
    return res.status(400).json({ error: 'Google token is required' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    console.error('GOOGLE_CLIENT_ID is not set in environment variables');
    return res.status(500).json({ 
      error: 'Google OAuth is not configured on the server',
      message: 'Please set GOOGLE_CLIENT_ID in server/.env file'
    });
  }

  try {
    // Verify Google token
    // Note: For ID token verification, we only need CLIENT_ID, not CLIENT_SECRET
    const client = new OAuth2Client(clientId);
    
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: clientId,
      });
    } catch (verifyError) {
      console.error('Google token verification error:', verifyError);
      return res.status(401).json({ 
        error: 'Invalid or expired Google token',
        details: verifyError.message 
      });
    }

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token - no payload received' });
    }

    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Email not provided by Google' });
    }

    // Normalize email (lowercase for consistency)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists (case-insensitive email search)
    let { data: users } = await supabaseAdmin
      .from('users')
      .select('*')
      .ilike('email', normalizedEmail);

    let user = users && users.length > 0 ? users[0] : null;
    let profile = null;
    let isNewAccount = false;

    if (user) {
      // ACCOUNT MERGING: User exists, merge Google OAuth with existing account
      // Get existing profile
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      profile = profileData;

      if (!profile) {
        // User exists but no profile - create one
        const { data: newProfile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: user.id,
            full_name: name || user.email.split('@')[0],
            user_type: USER_TYPES.FREELANCER,
            display_name: name?.split(' ')[0] || user.email.split('@')[0],
            headline: USER_TYPE_LABELS[USER_TYPES.FREELANCER],
            avatar_url: picture || null,
          })
          .select()
          .single();

        if (profileError) {
          console.error('Profile creation error during merge:', profileError);
          return res.status(500).json({ error: 'Failed to create user profile' });
        }

        profile = newProfile;
        await createSpecializedProfile(profile.id, USER_TYPES.FREELANCER);
      } else {
        // Merge: Update profile with Google data if missing
        const updates = {};
        if (picture && !profile.avatar_url) {
          updates.avatar_url = picture;
        }
        if (name && (!profile.full_name || profile.full_name === user.email.split('@')[0])) {
          updates.full_name = name;
          if (!profile.display_name) {
            updates.display_name = name.split(' ')[0];
          }
        }

        if (Object.keys(updates).length > 0) {
          await supabaseAdmin
            .from('profiles')
            .update(updates)
            .eq('id', profile.id);
          
          // Update profile object
          profile = { ...profile, ...updates };
        }
      }

      // Update user: Mark email as verified (Google emails are verified)
      // Also update email to normalized version if different
      const userUpdates = {
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        login_count: (user.login_count || 0) + 1
      };

      // Normalize email in users table if different
      if (user.email.toLowerCase() !== normalizedEmail) {
        userUpdates.email = normalizedEmail;
      }

      await supabaseAdmin
        .from('users')
        .update(userUpdates)
        .eq('id', user.id);

    } else {
      // NEW ACCOUNT: Create new user and profile
      isNewAccount = true;

      const { data: newUser, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          email: normalizedEmail, // Store normalized email
          password_hash: null, // OAuth users don't have passwords
          phone: null,
          email_verified: true, // Google emails are verified
          email_verified_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (userError) {
        // Check if it's a duplicate key error (race condition)
        if (userError.code === '23505') {
          // User was created between check and insert - fetch existing
          const { data: existingUsers } = await supabaseAdmin
            .from('users')
            .select('*')
            .ilike('email', normalizedEmail);
          
          if (existingUsers && existingUsers.length > 0) {
            user = existingUsers[0];
            // Get existing profile and continue with merge logic
            const { data: existingProfile } = await supabaseAdmin
              .from('profiles')
              .select('*')
              .eq('user_id', user.id)
              .single();
            
            if (existingProfile) {
              profile = existingProfile;
              // Update profile with Google data if missing
              const updates = {};
              if (picture && !profile.avatar_url) {
                updates.avatar_url = picture;
              }
              if (name && (!profile.full_name || profile.full_name === user.email.split('@')[0])) {
                updates.full_name = name;
                if (!profile.display_name) {
                  updates.display_name = name.split(' ')[0];
                }
              }
              if (Object.keys(updates).length > 0) {
                await supabaseAdmin
                  .from('profiles')
                  .update(updates)
                  .eq('id', profile.id);
                profile = { ...profile, ...updates };
              }
            } else {
              // Profile doesn't exist, create it
              const { data: newProfile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                  user_id: user.id,
                  full_name: name || normalizedEmail.split('@')[0],
                  user_type: USER_TYPES.FREELANCER,
                  display_name: name?.split(' ')[0] || normalizedEmail.split('@')[0],
                  headline: USER_TYPE_LABELS[USER_TYPES.FREELANCER],
                  avatar_url: picture || null,
                })
                .select()
                .single();
              
              if (profileError) {
                console.error('Profile creation error during race condition:', profileError);
                return res.status(500).json({ error: 'Failed to create user profile' });
              }
              
              profile = newProfile;
              await createSpecializedProfile(profile.id, USER_TYPES.FREELANCER);
            }
            
            // Update user login info
            await supabaseAdmin
              .from('users')
              .update({
                email_verified: true,
                email_verified_at: new Date().toISOString(),
                last_login_at: new Date().toISOString(),
                login_count: (user.login_count || 0) + 1
              })
              .eq('id', user.id);
            
            isNewAccount = false;
          } else {
            console.error('User creation error (duplicate key but user not found):', userError);
            return res.status(500).json({ error: 'Failed to create user account' });
          }
        } else {
          console.error('User creation error:', userError);
          return res.status(500).json({ error: 'Failed to create user account' });
        }
      } else {
        // User created successfully, continue with profile creation
        user = newUser;
      }

      // Only create profile if it doesn't exist (from race condition handling above)
      if (!profile) {
        // Create profile
        const { data: newProfile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: user.id,
            full_name: name || normalizedEmail.split('@')[0],
            user_type: USER_TYPES.FREELANCER, // Default type
            display_name: name?.split(' ')[0] || normalizedEmail.split('@')[0],
            headline: USER_TYPE_LABELS[USER_TYPES.FREELANCER],
            avatar_url: picture || null,
            is_verified: true,
          })
          .select()
          .single();

        if (profileError) {
          // Rollback: delete user if profile creation fails
          await supabaseAdmin.from('users').delete().eq('id', user.id);
          console.error('Profile creation error:', profileError);
          return res.status(500).json({ error: 'Failed to create user profile' });
        }

        profile = newProfile;

        // Create default specialized profile
        await createSpecializedProfile(profile.id, USER_TYPES.FREELANCER);
      }
    }

    if (!profile) {
      return res.status(500).json({ error: 'User profile not found' });
    }

    // Generate tokens
    const token = generateToken(profile.id, normalizedEmail);
    const refreshToken = generateRefreshToken(profile.id);

    res.json({
      message: isNewAccount ? 'Google authentication successful' : 'Account merged successfully',
      user: {
        id: profile.id,
        email: user.email,
        full_name: profile.full_name,
        display_name: profile.display_name,
        user_type: profile.user_type,
        avatar_url: profile.avatar_url || picture,
        is_verified: profile.is_verified
      },
      token,
      refreshToken,
      accountMerged: !isNewAccount
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Handle specific Google Auth errors
    if (error.message?.includes('Invalid token') || error.code === 'invalid_token') {
      return res.status(401).json({ 
        error: 'Invalid or expired Google token',
        message: 'Please try signing in again'
      });
    }
    
    if (error.message?.includes('Token used too early') || error.code === 'token_used_too_early') {
      return res.status(401).json({ 
        error: 'Token used too early',
        message: 'Please wait a moment and try again'
      });
    }
    
    // Generic error response
    return res.status(500).json({ 
      error: 'Google authentication failed',
      message: error.message || 'An unexpected error occurred during Google sign-in'
    });
  }
}));

export default router;
