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

  // Check if user already exists
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user in users table
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      email,
      password_hash: passwordHash,
      phone: phone || null
    })
    .select()
    .single();

  if (userError) {
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

  // Generate tokens
  const token = generateToken(profile.id, email);
  const refreshToken = generateRefreshToken(profile.id);

  res.status(201).json({
    message: 'Registration successful',
    user: {
      id: profile.id,
      email: user.email,
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

// Login
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Get user from database
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!user.is_active) {
    return res.status(401).json({ error: 'Account is deactivated' });
  }

  // Verify password
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

  // Generate tokens
  const token = generateToken(profile.id, email);
  const refreshToken = generateRefreshToken(profile.id);

  // Update last login
  await supabaseAdmin
    .from('users')
    .update({ 
      last_login_at: new Date().toISOString(),
      login_count: user.login_count + 1
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

  // Verify current password
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

// Logout
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // Could implement token blacklisting here
  res.json({ message: 'Logged out successfully' });
}));

// Google OAuth
router.post('/google', asyncHandler(async (req, res) => {
  const { token: googleToken } = req.body;

  if (!googleToken) {
    return res.status(400).json({ error: 'Google token is required' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'Google OAuth is not configured on the server' });
  }

  try {
    // Verify Google token
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Email not provided by Google' });
    }

    // Check if user exists
    let { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    let profile = null;

    if (user) {
      // User exists, get profile
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      profile = profileData;

      // Update last login
      await supabaseAdmin
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          login_count: (user.login_count || 0) + 1
        })
        .eq('id', user.id);
    } else {
      // Create new user
      const { data: newUser, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          email,
          password_hash: null, // OAuth users don't have passwords
          phone: null,
          email_verified: true, // Google emails are verified
        })
        .select()
        .single();

      if (userError) {
        console.error('User creation error:', userError);
        return res.status(500).json({ error: 'Failed to create user account' });
      }

      user = newUser;

      // Create profile with default user type (can be updated later)
      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: user.id,
          full_name: name || email.split('@')[0],
          user_type: USER_TYPES.FREELANCER, // Default type
          display_name: name?.split(' ')[0] || email.split('@')[0],
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

    if (!profile) {
      return res.status(500).json({ error: 'User profile not found' });
    }

    // Generate tokens
    const token = generateToken(profile.id, email);
    const refreshToken = generateRefreshToken(profile.id);

    res.json({
      message: 'Google authentication successful',
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
      refreshToken
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    if (error.message?.includes('Invalid token')) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }
    return res.status(500).json({ error: 'Google authentication failed' });
  }
}));

export default router;
