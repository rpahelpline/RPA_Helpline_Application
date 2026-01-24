import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginationValidation, idValidation } from '../middleware/validate.js';
import { PAGINATION, USER_TYPES } from '../config/constants.js';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================================================
// ADMIN DASHBOARD STATS
// ============================================================================
router.get('/stats', asyncHandler(async (req, res) => {
  // Total users
  const { count: totalUsers } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Users by type
  const { data: usersByType } = await supabaseAdmin
    .from('profiles')
    .select('user_type');

  const userTypeCounts = (usersByType || []).reduce((acc, user) => {
    acc[user.user_type] = (acc[user.user_type] || 0) + 1;
    return acc;
  }, {});

  // Total jobs
  const { count: totalJobs } = await supabaseAdmin
    .from('jobs')
    .select('*', { count: 'exact', head: true });

  // Active jobs
  const { count: activeJobs } = await supabaseAdmin
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open');

  // Total projects
  const { count: totalProjects } = await supabaseAdmin
    .from('projects')
    .select('*', { count: 'exact', head: true });

  // Active projects
  const { count: activeProjects } = await supabaseAdmin
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .in('status', ['open', 'in_progress']);

  // Verified profiles
  const { count: verifiedProfiles } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_verified', true);

  // Pending verification requests
  const { count: pendingVerificationRequests } = await supabaseAdmin
    .from('verification_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Recent registrations (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { count: recentUsers } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString());

  res.json({
    stats: {
      totalUsers: totalUsers || 0,
      userTypeCounts,
      totalJobs: totalJobs || 0,
      activeJobs: activeJobs || 0,
      totalProjects: totalProjects || 0,
      activeProjects: activeProjects || 0,
      verifiedProfiles: verifiedProfiles || 0,
      recentUsers: recentUsers || 0
    }
  });
}));

// ============================================================================
// USER MANAGEMENT
// ============================================================================

// Get all users with pagination
router.get('/users', paginationValidation, asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    user_type,
    search,
    is_verified,
    is_active
  } = req.query;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('profiles')
    .select(`
      *,
      user:users!profiles_user_id_fkey(id, email, phone, is_active, email_verified, created_at)
    `, { count: 'exact' });

  // Filters
  if (user_type) {
    query = query.eq('user_type', user_type);
  }
  if (is_verified !== undefined) {
    query = query.eq('is_verified', is_verified === 'true');
  }
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,headline.ilike.%${search}%`);
  }

  // Get user active status
  if (is_active !== undefined) {
    // This requires a join, so we'll filter after
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: profiles, error, count } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }

  // Filter by is_active if needed
  let filteredProfiles = profiles || [];
  if (is_active !== undefined) {
    filteredProfiles = filteredProfiles.filter(p => {
      const user = Array.isArray(p.user) ? p.user[0] : p.user;
      return user?.is_active === (is_active === 'true');
    });
  }

  res.json({
    users: filteredProfiles.map(p => ({
      ...p,
      email: Array.isArray(p.user) ? p.user[0]?.email : p.user?.email,
      phone: Array.isArray(p.user) ? p.user[0]?.phone : p.user?.phone,
      is_active: Array.isArray(p.user) ? p.user[0]?.is_active : p.user?.is_active,
      email_verified: Array.isArray(p.user) ? p.user[0]?.email_verified : p.user?.email_verified,
      is_admin: Array.isArray(p.user) ? p.user[0]?.is_admin : p.user?.is_admin,
      user: undefined // Remove nested user object
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}));

// Get user by ID
router.get('/users/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      *,
      user:users!profiles_user_id_fkey(*)
    `)
    .eq('id', id)
    .single();

  if (error || !profile) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      ...profile,
      email: Array.isArray(profile.user) ? profile.user[0]?.email : profile.user?.email,
      phone: Array.isArray(profile.user) ? profile.user[0]?.phone : profile.user?.phone,
      is_active: Array.isArray(profile.user) ? profile.user[0]?.is_active : profile.user?.is_active,
      email_verified: Array.isArray(profile.user) ? profile.user[0]?.email_verified : profile.user?.email_verified,
      is_admin: Array.isArray(profile.user) ? profile.user[0]?.is_admin : profile.user?.is_admin,
      user: undefined
    }
  });
}));

// Update user
router.put('/users/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Separate profile and user updates
  const profileUpdates = {};
  const userUpdates = {};

  const profileFields = [
    'full_name', 'display_name', 'headline', 'bio', 'country', 'state', 'city',
    'public_email', 'website_url', 'linkedin_url', 'is_profile_public',
    'is_available', 'is_verified', 'verification_badge', 'avatar_url', 'cover_image_url'
  ];

  const userFields = ['is_active', 'email_verified', 'is_admin'];

  Object.keys(updates).forEach(key => {
    if (profileFields.includes(key)) {
      profileUpdates[key] = updates[key];
    } else if (userFields.includes(key)) {
      userUpdates[key] = updates[key];
    }
  });

  // Update profile
  if (Object.keys(profileUpdates).length > 0) {
    profileUpdates.updated_at = new Date().toISOString();
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', id);

    if (profileError) {
      return res.status(500).json({ error: 'Failed to update profile', details: profileError });
    }
  }

  // Update user
  if (Object.keys(userUpdates).length > 0) {
    // Get user_id from profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('id', id)
      .single();

    if (profile) {
      const { error: userError } = await supabaseAdmin
        .from('users')
        .update(userUpdates)
        .eq('id', profile.user_id);

      if (userError) {
        return res.status(500).json({ error: 'Failed to update user', details: userError });
      }
    }
  }

  // Get updated user
  const { data: updatedProfile } = await supabaseAdmin
    .from('profiles')
    .select(`
      *,
      user:users!profiles_user_id_fkey(*)
    `)
    .eq('id', id)
    .single();

  res.json({
    message: 'User updated successfully',
    user: {
      ...updatedProfile,
      email: Array.isArray(updatedProfile.user) ? updatedProfile.user[0]?.email : updatedProfile.user?.email,
      phone: Array.isArray(updatedProfile.user) ? updatedProfile.user[0]?.phone : updatedProfile.user?.phone,
      is_active: Array.isArray(updatedProfile.user) ? updatedProfile.user[0]?.is_active : updatedProfile.user?.is_active,
      email_verified: Array.isArray(updatedProfile.user) ? updatedProfile.user[0]?.email_verified : updatedProfile.user?.email_verified,
      is_admin: Array.isArray(updatedProfile.user) ? updatedProfile.user[0]?.is_admin : updatedProfile.user?.is_admin,
      user: undefined
    }
  });
}));

// Delete user
router.delete('/users/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get user_id from profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!profile) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Delete profile (cascade will delete user)
  const { error } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }

  res.json({ message: 'User deleted successfully' });
}));

// Verify user
router.post('/users/:id/verify', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { verification_badge, request_id } = req.body;

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .update({
      is_verified: true,
      verified_at: new Date().toISOString(),
      verification_badge: verification_badge || 'basic',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // Update verification request if provided
  if (request_id) {
    await supabaseAdmin
      .from('verification_requests')
      .update({
        status: 'approved',
        reviewed_by: req.user.user_id,
        reviewed_at: new Date().toISOString(),
        verification_badge: verification_badge || 'basic',
        updated_at: new Date().toISOString()
      })
      .eq('id', request_id);
  }

  res.json({
    message: 'User verified successfully',
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      is_verified: profile.is_verified,
      verification_badge: profile.verification_badge,
      verified_at: profile.verified_at
    }
  });
}));

// ============================================================================
// VERIFICATION REQUESTS MANAGEMENT
// ============================================================================

// Get verification requests
router.get('/verification-requests', paginationValidation, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status = 'pending' } = req.query;
  const offset = (page - 1) * limit;

  const { data: requests, error, count } = await supabaseAdmin
    .from('verification_requests')
    .select(`
      *,
      profile:profiles!verification_requests_profile_id_fkey(
        id,
        full_name,
        display_name,
        avatar_url,
        user_type,
        profile_completion,
        is_verified,
        headline,
        bio
      ),
      user:users!verification_requests_user_id_fkey(
        id,
        email,
        email_verified
      ),
      reviewer:users!verification_requests_reviewed_by_fkey(
        id,
        email
      )
    `, { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching verification requests:', error);
    return res.status(500).json({ error: 'Failed to fetch verification requests' });
  }

  res.json({
    requests: requests || [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}));

// Reject verification request
router.post('/verification-requests/:id/reject', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { review_notes } = req.body;

  const { data: request, error } = await supabaseAdmin
    .from('verification_requests')
    .update({
      status: 'rejected',
      reviewed_by: req.user.user_id,
      reviewed_at: new Date().toISOString(),
      review_notes: review_notes || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !request) {
    return res.status(404).json({ error: 'Verification request not found' });
  }

  res.json({
    message: 'Verification request rejected',
    request: {
      id: request.id,
      status: request.status,
      reviewed_at: request.reviewed_at
    }
  });
}));

// ============================================================================
// JOBS MANAGEMENT
// ============================================================================

// Get all jobs
router.get('/jobs', paginationValidation, asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    status,
    search
  } = req.query;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('jobs')
    .select(`
      *,
      employer:profiles!jobs_employer_id_fkey(id, full_name, avatar_url)
    `, { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: jobs, error, count } = await query;

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }

  res.json({
    jobs: jobs || [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}));

// Update job
router.put('/jobs/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // First check if job exists
  const { data: existingJob, error: fetchError } = await supabaseAdmin
    .from('jobs')
    .select('id')
    .eq('id', id)
    .single();

  if (fetchError || !existingJob) {
    console.error(`[Admin] Job not found: ${id}`, fetchError);
    return res.status(404).json({ error: 'Job not found', job_id: id });
  }

  // Update job
  const { data: job, error } = await supabaseAdmin
    .from('jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`[Admin] Error updating job ${id}:`, error);
    return res.status(500).json({ error: 'Failed to update job', details: error.message });
  }

  res.json({ message: 'Job updated successfully', job });
}));

// Delete job
router.delete('/jobs/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First check if job exists
  const { data: existingJob, error: fetchError } = await supabaseAdmin
    .from('jobs')
    .select('id')
    .eq('id', id)
    .single();

  if (fetchError || !existingJob) {
    console.error(`[Admin] Job not found for deletion: ${id}`, fetchError);
    return res.status(404).json({ error: 'Job not found', job_id: id });
  }

  const { error } = await supabaseAdmin
    .from('jobs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`[Admin] Error deleting job ${id}:`, error);
    return res.status(500).json({ error: 'Failed to delete job', details: error.message });
  }

  res.json({ message: 'Job deleted successfully' });
}));

// ============================================================================
// PROJECTS MANAGEMENT
// ============================================================================

// Get all projects
router.get('/projects', paginationValidation, asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    status,
    search
  } = req.query;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('projects')
    .select(`
      *,
      client:profiles!projects_client_id_fkey(id, full_name, avatar_url)
    `, { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: projects, error, count } = await query;

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }

  res.json({
    projects: projects || [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}));

// Update project
router.put('/projects/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // First check if project exists
  const { data: existingProject, error: fetchError } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', id)
    .single();

  if (fetchError || !existingProject) {
    console.error(`[Admin] Project not found: ${id}`, fetchError);
    return res.status(404).json({ error: 'Project not found', project_id: id });
  }

  // Update project
  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`[Admin] Error updating project ${id}:`, error);
    return res.status(500).json({ error: 'Failed to update project', details: error.message });
  }

  res.json({ message: 'Project updated successfully', project });
}));

// Delete project
router.delete('/projects/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First check if project exists
  const { data: existingProject, error: fetchError } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', id)
    .single();

  if (fetchError || !existingProject) {
    console.error(`[Admin] Project not found for deletion: ${id}`, fetchError);
    return res.status(404).json({ error: 'Project not found', project_id: id });
  }

  const { error } = await supabaseAdmin
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`[Admin] Error deleting project ${id}:`, error);
    return res.status(500).json({ error: 'Failed to delete project', details: error.message });
  }

  res.json({ message: 'Project deleted successfully' });
}));

// ============================================================================
// PLATFORMS & SKILLS MANAGEMENT
// ============================================================================

// Get all platforms
router.get('/platforms', asyncHandler(async (req, res) => {
  const { data: platforms, error } = await supabaseAdmin
    .from('rpa_platforms')
    .select('*')
    .order('name');

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch platforms' });
  }

  res.json({ platforms: platforms || [] });
}));

// Create platform
router.post('/platforms', asyncHandler(async (req, res) => {
  const { name, slug, description, logo_url, is_active } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Platform name is required' });
  }

  const { data: platform, error } = await supabaseAdmin
    .from('rpa_platforms')
    .insert({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      logo_url,
      is_active: is_active !== undefined ? is_active : true
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to create platform', details: error });
  }

  res.json({ message: 'Platform created successfully', platform });
}));

// Update platform
router.put('/platforms/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const { data: platform, error } = await supabaseAdmin
    .from('rpa_platforms')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !platform) {
    return res.status(404).json({ error: 'Platform not found' });
  }

  res.json({ message: 'Platform updated successfully', platform });
}));

// Delete platform
router.delete('/platforms/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from('rpa_platforms')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete platform' });
  }

  res.json({ message: 'Platform deleted successfully' });
}));

// Get all skills
router.get('/skills', asyncHandler(async (req, res) => {
  const { data: skills, error } = await supabaseAdmin
    .from('skills')
    .select('*')
    .order('name');

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch skills' });
  }

  res.json({ skills: skills || [] });
}));

// Create skill
router.post('/skills', asyncHandler(async (req, res) => {
  const { name, slug, description, category, is_active } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Skill name is required' });
  }

  const { data: skill, error } = await supabaseAdmin
    .from('skills')
    .insert({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      category,
      is_active: is_active !== undefined ? is_active : true
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to create skill', details: error });
  }

  res.json({ message: 'Skill created successfully', skill });
}));

// Update skill
router.put('/skills/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const { data: skill, error } = await supabaseAdmin
    .from('skills')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !skill) {
    return res.status(404).json({ error: 'Skill not found' });
  }

  res.json({ message: 'Skill updated successfully', skill });
}));

// Delete skill
router.delete('/skills/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from('skills')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete skill' });
  }

  res.json({ message: 'Skill deleted successfully' });
}));

// ============================================================================
// TRAINING PROGRAMS MANAGEMENT
// ============================================================================

// Get all training programs
router.get('/training', paginationValidation, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('training_programs')
    .select(`
      *,
      trainer:profiles(id, full_name, avatar_url)
    `, { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: programs, error, count } = await query;

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch training programs' });
  }

  res.json({
    programs: programs || [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}));

// Update training program
router.put('/training/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const { data: program, error } = await supabaseAdmin
    .from('training_programs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !program) {
    return res.status(404).json({ error: 'Training program not found' });
  }

  res.json({ message: 'Training program updated successfully', program });
}));

// Delete training program
router.delete('/training/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from('training_programs')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete training program' });
  }

  res.json({ message: 'Training program deleted successfully' });
}));

// ============================================================================
// JOB APPLICATIONS MANAGEMENT
// ============================================================================

// Get all job applications
router.get('/applications', paginationValidation, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('job_applications')
    .select(`
      *,
      job:jobs(id, title, status),
      applicant:profiles(id, full_name, avatar_url, headline)
    `, { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: applications, error, count } = await query;

  if (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }

  res.json({
    applications: applications || [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}));

// Update job application status
router.put('/applications/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, review_notes } = req.body;

  const update = {
    updated_at: new Date().toISOString(),
    last_status_change: new Date().toISOString()
  };
  if (status !== undefined) update.status = status;
  if (review_notes !== undefined) update.employer_notes = review_notes;
  if (status !== undefined) update.viewed_at = new Date().toISOString();

  const { data: application, error } = await supabaseAdmin
    .from('job_applications')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error || !application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  res.json({ message: 'Application updated successfully', application });
}));

// Delete job application
router.delete('/applications/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from('job_applications')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete application' });
  }

  res.json({ message: 'Application deleted successfully' });
}));

// ============================================================================
// MESSAGES MODERATION
// ============================================================================

// Get all messages (for moderation)
router.get('/messages', paginationValidation, asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, flagged } = req.query;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('messages')
    .select(`
      *,
      sender:profiles(id, full_name, avatar_url),
      conversation:conversations(id, type)
    `, { count: 'exact' });

  if (search) {
    query = query.ilike('content', `%${search}%`);
  }
  if (flagged === 'true') {
    query = query.eq('is_flagged', true);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: messages, error, count } = await query;

  if (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }

  res.json({
    messages: messages || [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}));

// Flag/unflag message
router.put('/messages/:id/flag', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_flagged, flag_reason } = req.body;

  const { data: message, error } = await supabaseAdmin
    .from('messages')
    .update({
      is_flagged,
      flag_reason,
      flagged_by: req.user.user_id,
      flagged_at: is_flagged ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  res.json({ message: 'Message flag updated', data: message });
}));

// Delete message
router.delete('/messages/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from('messages')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete message' });
  }

  res.json({ message: 'Message deleted successfully' });
}));

// ============================================================================
// CERTIFICATIONS MANAGEMENT
// ============================================================================

// Get all certifications
router.get('/certifications', asyncHandler(async (req, res) => {
  const { data: certifications, error } = await supabaseAdmin
    .from('certifications')
    .select(`
      *,
      platform:rpa_platforms!certifications_platform_id_fkey(id, name)
    `)
    .order('name');

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch certifications' });
  }

  res.json({ certifications: certifications || [] });
}));

// Create certification
router.post('/certifications', asyncHandler(async (req, res) => {
  const { name, slug, level, platform_id, description, verification_url, is_active } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Certification name is required' });
  }

  const { data: certification, error } = await supabaseAdmin
    .from('certifications')
    .insert({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      level,
      platform_id,
      description,
      verification_url,
      is_active: is_active !== undefined ? is_active : true
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to create certification', details: error });
  }

  res.json({ message: 'Certification created successfully', certification });
}));

// Update certification
router.put('/certifications/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const { data: certification, error } = await supabaseAdmin
    .from('certifications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !certification) {
    return res.status(404).json({ error: 'Certification not found' });
  }

  res.json({ message: 'Certification updated successfully', certification });
}));

// Delete certification
router.delete('/certifications/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from('certifications')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete certification' });
  }

  res.json({ message: 'Certification deleted successfully' });
}));

// ============================================================================
// SYSTEM NOTIFICATIONS / ANNOUNCEMENTS
// ============================================================================

// Send broadcast notification to all users or specific types
router.post('/notifications/broadcast', asyncHandler(async (req, res) => {
  const { title, message, type = 'announcement', user_types, priority = 'normal' } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  // Get target users
  let usersQuery = supabaseAdmin.from('profiles').select('user_id');

  if (user_types && user_types.length > 0) {
    usersQuery = usersQuery.in('user_type', user_types);
  }

  const { data: users, error: usersError } = await usersQuery;

  if (usersError) {
    return res.status(500).json({ error: 'Failed to get users' });
  }

  // Create notification for each user
  const notifications = (users || []).map(u => ({
    user_id: u.user_id,
    type,
    title,
    message,
    priority,
    is_read: false,
    created_at: new Date().toISOString()
  }));

  if (notifications.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      console.error('Error sending notifications:', insertError);
      return res.status(500).json({ error: 'Failed to send notifications' });
    }
  }

  res.json({
    message: 'Broadcast sent successfully',
    recipients: notifications.length
  });
}));

// Get all notifications (admin view)
router.get('/notifications', paginationValidation, asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, type } = req.query;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('notifications')
    .select(`
      *,
      user:profiles!notifications_user_id_fkey(id, full_name, avatar_url)
    `, { count: 'exact' });

  if (type) {
    query = query.eq('type', type);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: notifications, error, count } = await query;

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }

  res.json({
    notifications: notifications || [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}));

// ============================================================================
// ENHANCED ANALYTICS
// ============================================================================

router.get('/analytics', asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  // User registrations over time
  const { data: usersByDate } = await supabaseAdmin
    .from('profiles')
    .select('created_at')
    .gte('created_at', daysAgo.toISOString());

  // Jobs posted over time
  const { data: jobsByDate } = await supabaseAdmin
    .from('jobs')
    .select('created_at, status')
    .gte('created_at', daysAgo.toISOString());

  // Projects posted over time
  const { data: projectsByDate } = await supabaseAdmin
    .from('projects')
    .select('created_at, status, budget_min, budget_max')
    .gte('created_at', daysAgo.toISOString());

  // Applications submitted
  const { data: applications } = await supabaseAdmin
    .from('job_applications')
    .select('created_at, status')
    .gte('created_at', daysAgo.toISOString());

  // Messages sent
  const { count: messagesCount } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', daysAgo.toISOString());

  // Training enrollments
  const { count: enrollmentsCount } = await supabaseAdmin
    .from('training_enrollments')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', daysAgo.toISOString());

  // Top platforms by user count
  const { data: topPlatforms } = await supabaseAdmin
    .from('profile_platforms')
    .select('platform_id, rpa_platforms!profile_platforms_platform_id_fkey(name)')
    .limit(100);

  const platformCounts = {};
  (topPlatforms || []).forEach(p => {
    const name = p.rpa_platforms?.name || 'Unknown';
    platformCounts[name] = (platformCounts[name] || 0) + 1;
  });

  res.json({
    analytics: {
      period: parseInt(period),
      users: {
        total: usersByDate?.length || 0,
        byDate: usersByDate || []
      },
      jobs: {
        total: jobsByDate?.length || 0,
        byStatus: (jobsByDate || []).reduce((acc, j) => {
          acc[j.status] = (acc[j.status] || 0) + 1;
          return acc;
        }, {}),
        byDate: jobsByDate || []
      },
      projects: {
        total: projectsByDate?.length || 0,
        byStatus: (projectsByDate || []).reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {}),
        avgBudget: projectsByDate?.length > 0
          ? Math.round(projectsByDate.reduce((sum, p) => sum + ((p.budget_min || 0) + (p.budget_max || 0)) / 2, 0) / projectsByDate.length)
          : 0
      },
      applications: {
        total: applications?.length || 0,
        byStatus: (applications || []).reduce((acc, a) => {
          acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        }, {})
      },
      messages: messagesCount || 0,
      enrollments: enrollmentsCount || 0,
      topPlatforms: Object.entries(platformCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))
    }
  });
}));

export default router;

