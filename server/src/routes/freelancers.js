import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { freelancerProfileValidation, paginationValidation, idValidation } from '../middleware/validate.js';
import { PAGINATION } from '../config/constants.js';

const router = express.Router();

// Get all freelancers (with filters)
router.get('/', optionalAuth, paginationValidation, asyncHandler(async (req, res) => {
  const { 
    page = PAGINATION.DEFAULT_PAGE, 
    limit = PAGINATION.DEFAULT_LIMIT,
    technology,
    min_rate,
    max_rate,
    min_experience,
    search,
    sort = 'created_at',
    order = 'desc',
    available_only = 'true'
  } = req.query;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('freelancer_profiles')
    .select(`
      *,
      user:profiles!freelancer_profiles_user_id_fkey(id, full_name, email, avatar_url)
    `, { count: 'exact' });

  // Filter by technology
  if (technology) {
    query = query.contains('technologies', [technology]);
  }

  // Filter by hourly rate
  if (min_rate) {
    query = query.gte('hourly_rate', parseFloat(min_rate));
  }
  if (max_rate) {
    query = query.lte('hourly_rate', parseFloat(max_rate));
  }

  // Filter by experience
  if (min_experience) {
    query = query.gte('experience_years', parseInt(min_experience));
  }

  // Filter by availability
  if (available_only === 'true') {
    query = query.eq('is_available', true);
  }

  // Search
  if (search) {
    query = query.or(`title.ilike.%${search}%,bio.ilike.%${search}%`);
  }

  // Sorting
  const validSortFields = ['created_at', 'hourly_rate', 'experience_years', 'rating'];
  const sortField = validSortFields.includes(sort) ? sort : 'created_at';
  query = query.order(sortField, { ascending: order === 'asc' });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: freelancers, error, count } = await query;

  if (error) {
    console.error('Error fetching freelancers:', error);
    return res.status(500).json({ error: 'Failed to fetch freelancers' });
  }

  res.json({
    freelancers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Get freelancer by ID
router.get('/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: freelancer, error } = await supabaseAdmin
    .from('freelancer_profiles')
    .select(`
      *,
      user:profiles!freelancer_profiles_user_id_fkey(id, full_name, email, avatar_url, phone)
    `)
    .eq('id', id)
    .single();

  if (error || !freelancer) {
    return res.status(404).json({ error: 'Freelancer not found' });
  }

  // Get reviews
  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, avatar_url)
    `)
    .eq('freelancer_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  freelancer.reviews = reviews || [];

  // Get completed projects count
  const { count: completedCount } = await supabaseAdmin
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('freelancer_id', freelancer.user_id)
    .eq('status', 'completed');

  freelancer.completed_projects = completedCount || 0;

  res.json({ freelancer });
}));

// Get or create my freelancer profile
router.get('/me/profile', authenticateToken, requireRole('freelancer', 'developer'), asyncHandler(async (req, res) => {
  const { data: profile, error } = await supabaseAdmin
    .from('freelancer_profiles')
    .select('*')
    .eq('user_id', req.userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching freelancer profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }

  if (!profile) {
    // Return empty profile structure
    return res.json({ 
      profile: null,
      message: 'Profile not yet created'
    });
  }

  res.json({ profile });
}));

// Create or update freelancer profile
router.put('/me/profile', authenticateToken, requireRole('freelancer', 'developer'), freelancerProfileValidation, asyncHandler(async (req, res) => {
  const {
    title,
    bio,
    hourly_rate,
    experience_years,
    technologies,
    certifications,
    portfolio_url,
    linkedin_url,
    github_url,
    is_available
  } = req.body;

  // Check if profile exists
  const { data: existing } = await supabaseAdmin
    .from('freelancer_profiles')
    .select('id')
    .eq('user_id', req.userId)
    .single();

  const profileData = {
    user_id: req.userId,
    title: title || null,
    bio: bio || null,
    hourly_rate: hourly_rate || null,
    experience_years: experience_years || 0,
    technologies: technologies || [],
    certifications: certifications || [],
    portfolio_url: portfolio_url || null,
    linkedin_url: linkedin_url || null,
    github_url: github_url || null,
    is_available: is_available !== undefined ? is_available : true,
    updated_at: new Date().toISOString()
  };

  let result;
  if (existing) {
    // Update existing profile
    result = await supabaseAdmin
      .from('freelancer_profiles')
      .update(profileData)
      .eq('user_id', req.userId)
      .select()
      .single();
  } else {
    // Create new profile
    profileData.created_at = new Date().toISOString();
    result = await supabaseAdmin
      .from('freelancer_profiles')
      .insert(profileData)
      .select()
      .single();
  }

  if (result.error) {
    console.error('Error saving freelancer profile:', result.error);
    return res.status(500).json({ error: 'Failed to save profile' });
  }

  res.json({ 
    message: existing ? 'Profile updated successfully' : 'Profile created successfully',
    profile: result.data 
  });
}));

// Get my applications
router.get('/me/applications', authenticateToken, requireRole('freelancer', 'developer'), paginationValidation, asyncHandler(async (req, res) => {
  const { 
    page = PAGINATION.DEFAULT_PAGE, 
    limit = PAGINATION.DEFAULT_LIMIT,
    status
  } = req.query;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('applications')
    .select(`
      *,
      project:projects(id, title, budget_min, budget_max, status, urgency)
    `, { count: 'exact' })
    .eq('freelancer_id', req.userId);

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
    applications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Update availability
router.patch('/me/availability', authenticateToken, requireRole('freelancer', 'developer'), asyncHandler(async (req, res) => {
  const { is_available } = req.body;

  if (typeof is_available !== 'boolean') {
    return res.status(400).json({ error: 'is_available must be a boolean' });
  }

  const { data, error } = await supabaseAdmin
    .from('freelancer_profiles')
    .update({ 
      is_available,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', req.userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating availability:', error);
    return res.status(500).json({ error: 'Failed to update availability' });
  }

  res.json({ message: 'Availability updated', is_available: data.is_available });
}));

export default router;


