import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { projectValidation, paginationValidation, idValidation } from '../middleware/validate.js';
import { PAGINATION, PROJECT_STATUS } from '../config/constants.js';

const router = express.Router();

// Get all projects (with filters)
router.get('/', optionalAuth, paginationValidation, asyncHandler(async (req, res) => {
  const { 
    page = PAGINATION.DEFAULT_PAGE, 
    limit = PAGINATION.DEFAULT_LIMIT,
    status,
    urgency,
    technology,
    min_budget,
    max_budget,
    search,
    sort = 'created_at',
    order = 'desc'
  } = req.query;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('projects')
    .select(`
      *,
      client:profiles!projects_client_id_fkey(id, full_name, avatar_url, company_name)
    `, { count: 'exact' });

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  } else {
    // By default, show only open projects
    query = query.eq('status', PROJECT_STATUS.OPEN);
  }

  if (urgency) {
    query = query.eq('urgency', urgency);
  }

  if (technology) {
    query = query.contains('technologies', [technology]);
  }

  if (min_budget) {
    query = query.gte('budget_min', parseFloat(min_budget));
  }

  if (max_budget) {
    query = query.lte('budget_max', parseFloat(max_budget));
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Sorting
  const validSortFields = ['created_at', 'budget_min', 'budget_max', 'urgency', 'title'];
  const sortField = validSortFields.includes(sort) ? sort : 'created_at';
  query = query.order(sortField, { ascending: order === 'asc' });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: projects, error, count } = await query;

  if (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }

  res.json({
    projects,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Get single project
router.get('/:id', idValidation, optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .select(`
      *,
      client:profiles!projects_client_id_fkey(id, full_name, avatar_url, company_name, email)
    `)
    .eq('id', id)
    .single();

  if (error || !project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Get application count
  const { count: applicationCount } = await supabaseAdmin
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id);

  project.application_count = applicationCount || 0;

  // If user is the project owner, include applications
  if (req.userId && project.client_id === req.userId) {
    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select(`
        *,
        freelancer:profiles!applications_freelancer_id_fkey(id, full_name, avatar_url, email)
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    project.applications = applications || [];
  }

  res.json({ project });
}));

// Create new project
router.post('/', authenticateToken, requireRole('client', 'employer'), projectValidation, asyncHandler(async (req, res) => {
  const { 
    title, 
    description, 
    budget_min, 
    budget_max, 
    urgency = 'medium',
    technologies = [],
    deadline,
    requirements
  } = req.body;

  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .insert({
      client_id: req.userId,
      title,
      description,
      budget_min: budget_min || null,
      budget_max: budget_max || null,
      urgency,
      technologies,
      deadline: deadline || null,
      requirements: requirements || null,
      status: PROJECT_STATUS.OPEN,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      client:profiles!projects_client_id_fkey(id, full_name, avatar_url, company_name)
    `)
    .single();

  if (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ error: 'Failed to create project' });
  }

  res.status(201).json({ message: 'Project created successfully', project });
}));

// Update project
router.put('/:id', authenticateToken, idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    title, 
    description, 
    budget_min, 
    budget_max, 
    urgency,
    technologies,
    deadline,
    requirements,
    status
  } = req.body;

  // Check ownership
  const { data: existing } = await supabaseAdmin
    .from('projects')
    .select('client_id')
    .eq('id', id)
    .single();

  if (!existing || existing.client_id !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const updates = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (budget_min !== undefined) updates.budget_min = budget_min;
  if (budget_max !== undefined) updates.budget_max = budget_max;
  if (urgency !== undefined) updates.urgency = urgency;
  if (technologies !== undefined) updates.technologies = technologies;
  if (deadline !== undefined) updates.deadline = deadline;
  if (requirements !== undefined) updates.requirements = requirements;
  if (status !== undefined) updates.status = status;

  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      client:profiles!projects_client_id_fkey(id, full_name, avatar_url, company_name)
    `)
    .single();

  if (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({ error: 'Failed to update project' });
  }

  res.json({ message: 'Project updated successfully', project });
}));

// Delete project
router.delete('/:id', authenticateToken, idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check ownership
  const { data: existing } = await supabaseAdmin
    .from('projects')
    .select('client_id')
    .eq('id', id)
    .single();

  if (!existing || existing.client_id !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { error } = await supabaseAdmin
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ error: 'Failed to delete project' });
  }

  res.json({ message: 'Project deleted successfully' });
}));

// Apply to project
router.post('/:id/apply', authenticateToken, requireRole('freelancer', 'developer'), idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cover_letter, proposed_rate, estimated_duration } = req.body;

  // Check if project exists and is open
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, status, client_id')
    .eq('id', id)
    .single();

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.status !== PROJECT_STATUS.OPEN) {
    return res.status(400).json({ error: 'Project is not accepting applications' });
  }

  if (project.client_id === req.userId) {
    return res.status(400).json({ error: 'Cannot apply to your own project' });
  }

  // Check for existing application
  const { data: existingApp } = await supabaseAdmin
    .from('applications')
    .select('id')
    .eq('project_id', id)
    .eq('freelancer_id', req.userId)
    .single();

  if (existingApp) {
    return res.status(409).json({ error: 'You have already applied to this project' });
  }

  // Create application
  const { data: application, error } = await supabaseAdmin
    .from('applications')
    .insert({
      project_id: id,
      freelancer_id: req.userId,
      cover_letter: cover_letter || null,
      proposed_rate: proposed_rate || null,
      estimated_duration: estimated_duration || null,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating application:', error);
    return res.status(500).json({ error: 'Failed to submit application' });
  }

  res.status(201).json({ message: 'Application submitted successfully', application });
}));

// Get my projects (as client)
router.get('/me/projects', authenticateToken, paginationValidation, asyncHandler(async (req, res) => {
  const { 
    page = PAGINATION.DEFAULT_PAGE, 
    limit = PAGINATION.DEFAULT_LIMIT,
    status
  } = req.query;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('projects')
    .select('*', { count: 'exact' })
    .eq('client_id', req.userId);

  if (status) {
    query = query.eq('status', status);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: projects, error, count } = await query;

  if (error) {
    console.error('Error fetching user projects:', error);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }

  res.json({
    projects,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

export default router;




