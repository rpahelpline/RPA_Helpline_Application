import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginationValidation, idValidation } from '../middleware/validate.js';
import { PAGINATION } from '../config/constants.js';

const router = express.Router();

// Get all jobs
router.get('/', optionalAuth, paginationValidation, asyncHandler(async (req, res) => {
  const { 
    page = PAGINATION.DEFAULT_PAGE, 
    limit = PAGINATION.DEFAULT_LIMIT,
    type,
    location,
    technology,
    min_salary,
    max_salary,
    remote,
    search,
    sort = 'created_at',
    order = 'desc'
  } = req.query;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('jobs')
    .select(`
      *,
      employer:profiles!jobs_employer_id_fkey(id, full_name, company_name, avatar_url)
    `, { count: 'exact' })
    .eq('status', 'active');

  // Filters
  if (type) {
    query = query.eq('job_type', type);
  }

  if (location) {
    query = query.ilike('location', `%${location}%`);
  }

  if (technology) {
    query = query.contains('technologies', [technology]);
  }

  if (min_salary) {
    query = query.gte('salary_min', parseFloat(min_salary));
  }

  if (max_salary) {
    query = query.lte('salary_max', parseFloat(max_salary));
  }

  if (remote === 'true') {
    query = query.eq('is_remote', true);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,company_name.ilike.%${search}%`);
  }

  // Sorting
  const validSortFields = ['created_at', 'salary_min', 'salary_max', 'title'];
  const sortField = validSortFields.includes(sort) ? sort : 'created_at';
  query = query.order(sortField, { ascending: order === 'asc' });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: jobs, error, count } = await query;

  if (error) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }

  res.json({
    jobs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Get job by ID
router.get('/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: job, error } = await supabaseAdmin
    .from('jobs')
    .select(`
      *,
      employer:profiles!jobs_employer_id_fkey(id, full_name, company_name, avatar_url, email)
    `)
    .eq('id', id)
    .single();

  if (error || !job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Get application count
  const { count } = await supabaseAdmin
    .from('job_applications')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', id);

  job.application_count = count || 0;

  res.json({ job });
}));

// Create job posting
router.post('/', authenticateToken, requireRole('employer', 'client'), asyncHandler(async (req, res) => {
  const {
    title,
    description,
    job_type,
    location,
    is_remote,
    salary_min,
    salary_max,
    technologies,
    requirements,
    benefits,
    application_deadline
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  const { data: job, error } = await supabaseAdmin
    .from('jobs')
    .insert({
      employer_id: req.userId,
      title,
      description,
      job_type: job_type || 'full_time',
      location: location || null,
      is_remote: is_remote || false,
      salary_min: salary_min || null,
      salary_max: salary_max || null,
      technologies: technologies || [],
      requirements: requirements || null,
      benefits: benefits || null,
      application_deadline: application_deadline || null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      employer:profiles!jobs_employer_id_fkey(id, full_name, company_name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error creating job:', error);
    return res.status(500).json({ error: 'Failed to create job posting' });
  }

  res.status(201).json({ message: 'Job posted successfully', job });
}));

// Update job
router.put('/:id', authenticateToken, idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check ownership
  const { data: existing } = await supabaseAdmin
    .from('jobs')
    .select('employer_id')
    .eq('id', id)
    .single();

  if (!existing || existing.employer_id !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const updates = { 
    ...req.body,
    updated_at: new Date().toISOString()
  };

  // Don't allow changing employer_id
  delete updates.employer_id;

  const { data: job, error } = await supabaseAdmin
    .from('jobs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating job:', error);
    return res.status(500).json({ error: 'Failed to update job' });
  }

  res.json({ message: 'Job updated successfully', job });
}));

// Delete job
router.delete('/:id', authenticateToken, idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check ownership
  const { data: existing } = await supabaseAdmin
    .from('jobs')
    .select('employer_id')
    .eq('id', id)
    .single();

  if (!existing || existing.employer_id !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { error } = await supabaseAdmin
    .from('jobs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting job:', error);
    return res.status(500).json({ error: 'Failed to delete job' });
  }

  res.json({ message: 'Job deleted successfully' });
}));

// Apply to job
router.post('/:id/apply', authenticateToken, requireRole('job_seeker', 'freelancer', 'developer'), idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cover_letter, resume_url, expected_salary } = req.body;

  // Check if job exists and is active
  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('id, status, employer_id')
    .eq('id', id)
    .single();

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.status !== 'active') {
    return res.status(400).json({ error: 'Job is not accepting applications' });
  }

  // Check for existing application
  const { data: existingApp } = await supabaseAdmin
    .from('job_applications')
    .select('id')
    .eq('job_id', id)
    .eq('applicant_id', req.userId)
    .single();

  if (existingApp) {
    return res.status(409).json({ error: 'You have already applied to this job' });
  }

  const { data: application, error } = await supabaseAdmin
    .from('job_applications')
    .insert({
      job_id: id,
      applicant_id: req.userId,
      cover_letter: cover_letter || null,
      resume_url: resume_url || null,
      expected_salary: expected_salary || null,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error applying to job:', error);
    return res.status(500).json({ error: 'Failed to submit application' });
  }

  res.status(201).json({ message: 'Application submitted successfully', application });
}));

// Get my job postings (as employer)
router.get('/me/postings', authenticateToken, requireRole('employer', 'client'), paginationValidation, asyncHandler(async (req, res) => {
  const { 
    page = PAGINATION.DEFAULT_PAGE, 
    limit = PAGINATION.DEFAULT_LIMIT,
    status
  } = req.query;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('jobs')
    .select('*', { count: 'exact' })
    .eq('employer_id', req.userId);

  if (status) {
    query = query.eq('status', status);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: jobs, error, count } = await query;

  if (error) {
    console.error('Error fetching job postings:', error);
    return res.status(500).json({ error: 'Failed to fetch job postings' });
  }

  res.json({
    jobs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

export default router;


