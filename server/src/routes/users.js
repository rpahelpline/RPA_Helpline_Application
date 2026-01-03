import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginationValidation, idValidation } from '../middleware/validate.js';
import { PAGINATION } from '../config/constants.js';

const router = express.Router();

// Get all users (admin only or filtered by type)
router.get('/', optionalAuth, paginationValidation, asyncHandler(async (req, res) => {
  const { 
    page = PAGINATION.DEFAULT_PAGE, 
    limit = PAGINATION.DEFAULT_LIMIT,
    user_type,
    search
  } = req.query;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, user_type, avatar_url, company_name, created_at', { count: 'exact' });

  // Filter by user type
  if (user_type) {
    query = query.eq('user_type', user_type);
  }

  // Search by name or email
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Pagination
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: users, error, count } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }

  res.json({
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Get user by ID
router.get('/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: user, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, user_type, avatar_url, phone, company_name, bio, created_at')
    .eq('id', id)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
}));

// Update current user profile
router.put('/me', authenticateToken, asyncHandler(async (req, res) => {
  const { full_name, phone, company_name, bio, avatar_url } = req.body;

  const updates = {
    updated_at: new Date().toISOString()
  };

  if (full_name !== undefined) updates.full_name = full_name;
  if (phone !== undefined) updates.phone = phone;
  if (company_name !== undefined) updates.company_name = company_name;
  if (bio !== undefined) updates.bio = bio;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url;

  const { data: user, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', req.userId)
    .select('id, email, full_name, user_type, avatar_url, phone, company_name, bio')
    .single();

  if (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }

  res.json({ message: 'Profile updated successfully', user });
}));

// Get user's dashboard stats
router.get('/me/stats', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const userType = req.user.user_type;

  let stats = {};

  if (userType === 'client' || userType === 'employer') {
    // Get client stats
    const { count: projectsCount } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', userId);

    const { count: activeProjectsCount } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', userId)
      .eq('status', 'in_progress');

    stats = {
      totalProjects: projectsCount || 0,
      activeProjects: activeProjectsCount || 0
    };
  } else if (userType === 'freelancer' || userType === 'developer') {
    // Get freelancer stats
    const { count: applicationsCount } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('freelancer_id', userId);

    const { count: activeJobsCount } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('freelancer_id', userId)
      .eq('status', 'accepted');

    stats = {
      totalApplications: applicationsCount || 0,
      activeJobs: activeJobsCount || 0
    };
  }

  res.json({ stats });
}));

// Delete user account (self)
router.delete('/me', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.userId;

  // Delete from Supabase Auth
  await supabaseAdmin.auth.admin.deleteUser(userId);

  // Delete profile (cascade should handle related data)
  await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId);

  res.json({ message: 'Account deleted successfully' });
}));

export default router;

