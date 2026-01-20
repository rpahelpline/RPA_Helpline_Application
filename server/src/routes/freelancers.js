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
    available_only,
    is_available
  } = req.query;

  const offset = (page - 1) * limit;

  // Query freelancer_profiles with join to profiles
  // freelancer_profiles has profile_id referencing profiles(id)
  // Use explicit foreign key name for reliability
  let query = supabaseAdmin
    .from('freelancer_profiles')
    .select(`
      *,
      profile:profiles!freelancer_profiles_profile_id_fkey(
        id,
        user_id,
        full_name,
        email,
        avatar_url,
        is_available,
        headline,
        bio,
        country,
        city,
        user_type
      )
    `, { count: 'exact' });

  // Filter by technology - check if technologies column exists or filter through related tables
  // Note: Technologies might be in a separate relationship table, skip for now if not in schema
  if (technology) {
    // Technology filtering would need to go through user_skills or platform relationships
    // For now, we'll search in title and profile headline/bio
    query = query.or(`title.ilike.%${technology}%,profile.headline.ilike.%${technology}%`);
  }

  // Filter by hourly rate (using hourly_rate_min and hourly_rate_max)
  if (min_rate) {
    query = query.gte('hourly_rate_min', parseFloat(min_rate));
  }
  if (max_rate) {
    query = query.lte('hourly_rate_max', parseFloat(max_rate));
  }

  // Filter by experience
  if (min_experience) {
    query = query.gte('experience_years', parseInt(min_experience));
  }

  // Filter by availability - handle both is_available and available_only parameters
  // Accept boolean true/false, string 'true'/'false', or undefined
  const shouldFilterAvailable = is_available !== undefined 
    ? (is_available === true || is_available === 'true')
    : (available_only === 'true' || available_only === true);
    
  if (shouldFilterAvailable) {
    // Filter by availability_status in freelancer_profiles (enum: 'available', 'partially_available', 'busy', 'not_available')
    query = query.in('availability_status', ['available', 'partially_available']);
  }

  // Search in title and profile fields
  // Note: Supabase PostgREST syntax for searching joined fields
  if (search) {
    query = query.or(`title.ilike.%${search}%`);
  }

  // Sorting - map hourly_rate to hourly_rate_min for sorting
  const sortMapping = {
    'hourly_rate': 'hourly_rate_min',
    'rating': 'average_rating'
  };
  const actualSortField = sortMapping[sort] || sort;
  const validSortFields = ['created_at', 'hourly_rate_min', 'hourly_rate_max', 'experience_years', 'average_rating', 'title'];
  const sortField = validSortFields.includes(actualSortField) ? actualSortField : 'created_at';
  query = query.order(sortField, { ascending: order === 'asc' });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: freelancers, error, count } = await query;

  if (error) {
    console.error('Error fetching freelancers:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    // Return more detailed error in development, generic error in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Failed to fetch freelancers: ${error.message || JSON.stringify(error)}`
      : 'Failed to fetch freelancers';
    return res.status(500).json({ error: errorMessage, details: process.env.NODE_ENV === 'development' ? error : undefined });
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
    .from('project_applications')
    .select('*', { count: 'exact', head: true })
    .eq('applicant_id', freelancer.user_id)
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

// Get my applications (for all applying roles)
router.get('/me/applications', authenticateToken, requireRole('freelancer', 'developer', 'job_seeker', 'jobseeker', 'trainer', 'ba_pm'), paginationValidation, asyncHandler(async (req, res) => {
  const { 
    page = PAGINATION.DEFAULT_PAGE, 
    limit = PAGINATION.DEFAULT_LIMIT,
    status
  } = req.query;

  const offset = (page - 1) * limit;

  // Fetch project applications
  // Note: project_applications uses freelancer_id, not applicant_id
  let projectQuery = supabaseAdmin
    .from('project_applications')
    .select(`
      *,
      project:projects(id, title, budget_min, budget_max, status, urgency, location, work_arrangement)
    `, { count: 'exact' })
    .eq('freelancer_id', req.userId);

  if (status) {
    projectQuery = projectQuery.eq('status', status);
  }

  const { data: projectApplications, error: projectError } = await projectQuery;

  // Fetch job applications
  let jobQuery = supabaseAdmin
    .from('job_applications')
    .select(`
      *,
      job:jobs(id, title, salary_min, salary_max, work_arrangement, employment_type, locations)
    `, { count: 'exact' })
    .eq('applicant_id', req.userId);

  if (status) {
    jobQuery = jobQuery.eq('status', status);
  }

  const { data: jobApplications, error: jobError } = await jobQuery;

  if (projectError) {
    console.error('Error fetching project applications:', projectError);
    // Don't fail completely, just log and continue with empty array
  }
  
  if (jobError) {
    console.error('Error fetching job applications:', jobError);
    // Don't fail completely, just log and continue with empty array
  }
  
  // If both queries failed, return error
  if (projectError && jobError) {
    return res.status(500).json({ 
      error: 'Failed to fetch applications',
      details: {
        projectError: projectError.message,
        jobError: jobError.message
      }
    });
  }

  // Combine and format applications
  const allApplications = [
    ...(projectApplications || []).map(app => ({
      ...app,
      type: 'project',
      job_id: null,
      // Map work_arrangement to is_remote for compatibility
      project: app.project ? {
        ...app.project,
        is_remote: app.project.work_arrangement === 'remote'
      } : app.project
    })),
    ...(jobApplications || []).map(app => ({
      ...app,
      type: 'job',
      project_id: null,
      // Map work_arrangement to is_remote and employment_type to job_type for compatibility
      job: app.job ? {
        ...app.job,
        is_remote: app.job.work_arrangement === 'remote',
        job_type: app.job.employment_type,
        location: app.job.locations && Array.isArray(app.job.locations) && app.job.locations.length > 0
          ? app.job.locations[0].city || app.job.locations[0].country || 'Location TBD'
          : null
      } : app.job
    }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Apply pagination manually
  const total = allApplications.length;
  const paginatedApplications = allApplications.slice(offset, offset + limit);

  res.json({
    applications: paginatedApplications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
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




