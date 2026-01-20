import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { projectValidation, paginationValidation, idValidation } from '../middleware/validate.js';
import { PAGINATION, PROJECT_STATUS } from '../config/constants.js';
import { notifyNewApplication, notifyApplicationStatusChange } from '../services/notificationService.js';

const router = express.Router();

// Helper function to convert technology names to UUIDs and separate platforms/skills
const convertTechnologiesToUuids = async (technologies) => {
  if (!technologies || !Array.isArray(technologies) || technologies.length === 0) {
    return { platformUuids: [], skillUuids: [] };
  }

  const platformUuids = [];
  const skillUuids = [];

  for (const techName of technologies) {
    if (typeof techName !== 'string' || !techName.trim()) continue;

    const trimmedName = techName.trim();
    
    // Check if it's already a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedName);
    if (isUuid) {
      // Try to determine if it's a platform or skill by checking both tables
      const { data: platform } = await supabaseAdmin
        .from('rpa_platforms')
        .select('id')
        .eq('id', trimmedName)
        .eq('is_active', true)
        .maybeSingle();
      
      if (platform) {
        platformUuids.push(trimmedName);
        continue;
      }

      const { data: skill } = await supabaseAdmin
        .from('skills')
        .select('id')
        .eq('id', trimmedName)
        .eq('is_active', true)
        .maybeSingle();
      
      if (skill) {
        skillUuids.push(trimmedName);
        continue;
      }
    }

    // Try to find as platform first
    let { data: platform, error: platformError } = await supabaseAdmin
      .from('rpa_platforms')
      .select('id')
      .eq('name', trimmedName)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!platform && platformError && platformError.code !== 'PGRST116') {
      console.error(`Error looking up platform "${trimmedName}":`, platformError);
    }

    if (!platform) {
      const { data: platformData, error: platformDataError } = await supabaseAdmin
        .from('rpa_platforms')
        .select('id')
        .ilike('name', trimmedName)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      
      if (platformDataError && platformDataError.code !== 'PGRST116') {
        console.error(`Error looking up platform "${trimmedName}" (case-insensitive):`, platformDataError);
      }
      
      platform = platformData;
    }

    if (platform && platform.id) {
      platformUuids.push(platform.id);
      continue;
    }

    // Try to find as skill
    let { data: skill, error: skillError } = await supabaseAdmin
      .from('skills')
      .select('id')
      .eq('name', trimmedName)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!skill && skillError && skillError.code !== 'PGRST116') {
      console.error(`Error looking up skill "${trimmedName}":`, skillError);
    }

    if (!skill) {
      const { data: skillData, error: skillDataError } = await supabaseAdmin
        .from('skills')
        .select('id')
        .ilike('name', trimmedName)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      
      if (skillDataError && skillDataError.code !== 'PGRST116') {
        console.error(`Error looking up skill "${trimmedName}" (case-insensitive):`, skillDataError);
      }
      
      skill = skillData;
    }

    if (skill && skill.id) {
      skillUuids.push(skill.id);
    }
  }

  return { platformUuids, skillUuids };
};

// Transform project from database format to frontend format (convert UUIDs to names)
const transformProject = async (project) => {
  if (!project) return project;
  
  const technologies = [];
  
  // Fetch platform names
  if (project.required_platforms && Array.isArray(project.required_platforms) && project.required_platforms.length > 0) {
    const { data: platforms } = await supabaseAdmin
      .from('rpa_platforms')
      .select('id, name')
      .in('id', project.required_platforms);
    
    if (platforms) {
      platforms.forEach(p => technologies.push(p.name));
    }
  }
  
  // Fetch skill names
  if (project.required_skills && Array.isArray(project.required_skills) && project.required_skills.length > 0) {
    const { data: skills } = await supabaseAdmin
      .from('skills')
      .select('id, name')
      .in('id', project.required_skills);
    
    if (skills) {
      skills.forEach(s => technologies.push(s.name));
    }
  }
  
  return {
    ...project,
    technologies: technologies.length > 0 ? technologies : [],
    // Keep original fields for backward compatibility
    required_platforms: project.required_platforms,
    required_skills: project.required_skills
  };
};

// Transform array of projects (batch fetch for performance)
const transformProjects = async (projects) => {
  if (!projects || projects.length === 0) return [];
  
  // Collect all unique UUIDs across all projects
  const platformIds = new Set();
  const skillIds = new Set();
  
  projects.forEach(project => {
    (project.required_platforms || []).forEach(id => platformIds.add(id));
    (project.required_skills || []).forEach(id => skillIds.add(id));
  });
  
  // Batch fetch platforms (single query)
  let platformMap = new Map();
  if (platformIds.size > 0) {
    const { data: platforms } = await supabaseAdmin
      .from('rpa_platforms')
      .select('id, name')
      .in('id', [...platformIds]);
    if (platforms) {
      platformMap = new Map(platforms.map(p => [p.id, p.name]));
    }
  }
  
  // Batch fetch skills (single query)
  let skillMap = new Map();
  if (skillIds.size > 0) {
    const { data: skills } = await supabaseAdmin
      .from('skills')
      .select('id, name')
      .in('id', [...skillIds]);
    if (skills) {
      skillMap = new Map(skills.map(s => [s.id, s.name]));
    }
  }
  
  // Transform all projects using the maps
  return projects.map(project => {
    const technologies = [];
    (project.required_platforms || []).forEach(id => {
      const name = platformMap.get(id);
      if (name) technologies.push(name);
    });
    (project.required_skills || []).forEach(id => {
      const name = skillMap.get(id);
      if (name) technologies.push(name);
    });
    
    return {
      ...project,
      technologies,
      required_platforms: project.required_platforms,
      required_skills: project.required_skills
    };
  });
};

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
      client:profiles(id, full_name, avatar_url)
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

  // Note: Technology filter would need to check both required_platforms and required_skills
  // For now, we'll skip this filter as it requires more complex logic
  // TODO: Implement technology filter using required_platforms and required_skills

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

  // Fetch company names for clients if projects exist
  if (projects && projects.length > 0) {
    const clientIds = projects.map(p => p.client_id).filter(Boolean);
    if (clientIds.length > 0) {
      const { data: clientProfiles } = await supabaseAdmin
        .from('client_profiles')
        .select('profile_id, company_name')
        .in('profile_id', clientIds);

      // Map company names to projects
      if (clientProfiles) {
        const companyMap = new Map(clientProfiles.map(cp => [cp.profile_id, cp.company_name]));
        projects.forEach(project => {
          if (project.client && companyMap.has(project.client_id)) {
            project.client.company_name = companyMap.get(project.client_id);
          }
        });
      }
    }
  }

  // Transform projects to convert UUIDs to names
  let transformedProjects = [];
  try {
    transformedProjects = await transformProjects(projects || []);
  } catch (transformError) {
    console.error('Error transforming projects:', transformError);
    // Return projects without transformation if transform fails
    transformedProjects = projects || [];
  }

  res.json({
    projects: transformedProjects,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Get my projects (as client) - MUST be before /:id to prevent route conflicts
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

  // Get application counts for each project
  if (projects && projects.length > 0) {
    const projectIds = projects.map(p => p.id);
    const { data: applicationCounts } = await supabaseAdmin
      .from('project_applications')
      .select('project_id')
      .in('project_id', projectIds);

    const countMap = {};
    (applicationCounts || []).forEach(app => {
      countMap[app.project_id] = (countMap[app.project_id] || 0) + 1;
    });

    projects.forEach(project => {
      project.application_count = countMap[project.id] || 0;
    });
  }

  // Transform projects to convert UUIDs to names
  // Transform projects to convert UUIDs to names
  let transformedProjects = [];
  try {
    transformedProjects = await transformProjects(projects || []);
  } catch (transformError) {
    console.error('Error transforming projects:', transformError);
    // Return projects without transformation if transform fails
    transformedProjects = projects || [];
  }

  res.json({
    projects: transformedProjects,
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
      client:profiles(id, full_name, avatar_url)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching project:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return res.status(500).json({ 
      error: 'Failed to fetch project',
      details: error.message || 'Database error occurred'
    });
  }

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Get company name from client_profiles if available (non-blocking)
  if (project.client_id) {
    try {
      const { data: clientProfile } = await supabaseAdmin
        .from('client_profiles')
        .select('company_name')
        .eq('profile_id', project.client_id)
        .maybeSingle();
      
      if (clientProfile && project.client) {
        project.client.company_name = clientProfile.company_name;
      }
    } catch (profileError) {
      // Non-critical error, continue without company name
      console.warn(`Could not fetch client profile for ${project.client_id}:`, profileError);
    }
  }

  // Get application count
  const { count: applicationCount } = await supabaseAdmin
    .from('project_applications')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id);

  project.application_count = applicationCount || 0;

  // Check if current authenticated user has already applied
  if (req.userId) {
    const { data: existingApp } = await supabaseAdmin
      .from('project_applications')
      .select('id')
      .eq('project_id', id)
      .eq('freelancer_id', req.userId)
      .maybeSingle();

    project.has_applied = !!existingApp;
  }

  // If user is the project owner, include applications
  if (req.userId && project.client_id === req.userId) {
    const { data: applications } = await supabaseAdmin
      .from('project_applications')
      .select(`
        *,
        freelancer:profiles!project_applications_freelancer_id_fkey(id, full_name, avatar_url)
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    project.applications = applications || [];
  }

  // Transform project to convert UUIDs to names
  try {
    const transformedProject = await transformProject(project);
    res.json({ project: transformedProject });
  } catch (transformError) {
    console.error('Error transforming project:', transformError);
    // Return project without transformation if transform fails
    res.json({ project });
  }
}));

// Create new project
router.post('/', authenticateToken, requireRole('client', 'employer', 'ba_pm'), projectValidation, asyncHandler(async (req, res) => {
  const { 
    title, 
    description, 
    budget_min, 
    budget_max, 
    urgency: rawUrgency,
    technologies = [],
    deadline,
    requirements
  } = req.body;

  // Map frontend urgency values to database values
  // Frontend: 'low', 'medium', 'high', 'critical'
  // Database: 'low', 'normal', 'high', 'urgent'
  const urgencyMap = {
    'low': 'low',
    'medium': 'normal',
    'high': 'high',
    'critical': 'urgent'
  };
  const urgency = urgencyMap[rawUrgency] || 'normal';

  // Combine description and requirements if requirements provided
  let fullDescription = description || '';
  if (requirements && requirements.trim()) {
    fullDescription = `${description}\n\nAdditional Requirements:\n${requirements}`;
  }

  // Convert technologies from names to UUIDs and separate into platforms/skills
  const { platformUuids, skillUuids } = await convertTechnologiesToUuids(technologies);

  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .insert({
      client_id: req.userId,
      title,
      description: fullDescription,
      budget_min: budget_min || null,
      budget_max: budget_max || null,
      urgency,
      required_platforms: platformUuids.length > 0 ? platformUuids : null,
      required_skills: skillUuids.length > 0 ? skillUuids : null,
      deadline: deadline || null,
      status: PROJECT_STATUS.OPEN,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      client:profiles(id, full_name, avatar_url)
    `)
    .maybeSingle();

  // Get company name from client_profiles if available (non-blocking)
  if (project && project.client_id) {
    try {
      const { data: clientProfile } = await supabaseAdmin
        .from('client_profiles')
        .select('company_name')
        .eq('profile_id', project.client_id)
        .maybeSingle();
      
      if (clientProfile && project.client) {
        project.client.company_name = clientProfile.company_name;
      }
    } catch (profileError) {
      // Non-critical error, continue without company name
      console.warn(`Could not fetch client profile for ${project.client_id}:`, profileError);
    }
  }

  if (error) {
    console.error('Error creating project:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return res.status(500).json({ 
      error: 'Failed to create project',
      details: error.message || 'Database error occurred'
    });
  }

  if (!project || !project.id) {
    console.error('Project created but no data returned');
    return res.status(500).json({ error: 'Failed to create project - no data returned' });
  }

  // Transform project to convert UUIDs to names
  const transformedProject = await transformProject(project);

  res.status(201).json({ message: 'Project created successfully', project: transformedProject });
}));

// Update project
router.put('/:id', authenticateToken, idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    title, 
    description, 
    budget_min, 
    budget_max, 
    urgency: rawUrgency,
    technologies,
    deadline,
    requirements,
    status
  } = req.body;

  // Map frontend urgency values to database values
  const urgencyMap = {
    'low': 'low',
    'medium': 'normal',
    'high': 'high',
    'critical': 'urgent'
  };
  const urgency = rawUrgency ? (urgencyMap[rawUrgency] || rawUrgency) : undefined;

  // Check ownership
  const { data: existing } = await supabaseAdmin
    .from('projects')
    .select('client_id, description')
    .eq('id', id)
    .single();

  if (!existing || existing.client_id !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const updates = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  
  // Handle description and requirements - combine if both provided
  if (description !== undefined || requirements !== undefined) {
    if (requirements && requirements.trim()) {
      // If requirements provided, append to description
      const baseDescription = description !== undefined ? description : existing.description || '';
      updates.description = `${baseDescription}\n\nAdditional Requirements:\n${requirements}`;
    } else if (description !== undefined) {
      updates.description = description;
    }
  }
  
  if (budget_min !== undefined) updates.budget_min = budget_min;
  if (budget_max !== undefined) updates.budget_max = budget_max;
  if (urgency !== undefined) updates.urgency = urgency;
  
  // Convert technologies from names to UUIDs if provided
  if (technologies !== undefined) {
    const { platformUuids, skillUuids } = await convertTechnologiesToUuids(technologies);
    updates.required_platforms = platformUuids.length > 0 ? platformUuids : null;
    updates.required_skills = skillUuids.length > 0 ? skillUuids : null;
  }
  
  if (deadline !== undefined) updates.deadline = deadline;
  if (status !== undefined) updates.status = status;

  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      client:profiles(id, full_name, avatar_url)
    `)
    .maybeSingle();

  // Get company name from client_profiles if available
  if (project && project.client_id) {
    const { data: clientProfile } = await supabaseAdmin
      .from('client_profiles')
      .select('company_name')
      .eq('profile_id', project.client_id)
      .single();
    
    if (clientProfile && project.client) {
      project.client.company_name = clientProfile.company_name;
    }
  }

  if (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({ error: 'Failed to update project' });
  }

  // Transform project to convert UUIDs to names
  const transformedProject = await transformProject(project);

  res.json({ message: 'Project updated successfully', project: transformedProject });
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
router.post('/:id/apply', authenticateToken, requireRole('freelancer', 'ba_pm', 'trainer'), idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cover_letter, proposed_rate, estimated_duration } = req.body;

  // Check if project exists and is open
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, status, client_id, title')
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
    .from('project_applications')
    .select('id')
    .eq('project_id', id)
    .eq('freelancer_id', req.userId)
    .single();

  if (existingApp) {
    return res.status(409).json({ error: 'You have already applied to this project' });
  }

  // Create application
  const { data: application, error } = await supabaseAdmin
    .from('project_applications')
    .insert({
      project_id: id,
      freelancer_id: req.userId,
      cover_letter: cover_letter || null,
      proposed_rate: proposed_rate || null,
      proposed_duration: estimated_duration || null,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating application:', error);
    return res.status(500).json({ error: 'Failed to submit application' });
  }

  // Notify project owner about the new application
  notifyNewApplication({
    ownerId: project.client_id,
    applicantId: req.userId,
    itemId: id,
    itemType: 'project',
    itemTitle: project.title
  }).catch(err => console.error('Failed to send application notification:', err));

  res.status(201).json({ message: 'Application submitted successfully', application });
}));

// Get all applications for a project (client only, must be project owner)
router.get('/:id/applications', authenticateToken, requireRole('client', 'employer'), idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, sort = 'created_at', order = 'desc' } = req.query;

  // Verify the project exists and belongs to the user
  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('id, client_id')
    .eq('id', id)
    .single();

  if (projectError || !project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.client_id !== req.userId) {
    return res.status(403).json({ error: 'You can only view applications for your own projects' });
  }

  let query = supabaseAdmin
    .from('project_applications')
    .select(`
      *,
      freelancer:profiles!project_applications_freelancer_id_fkey(
        id,
        full_name,
        avatar_url,
        headline,
        user_type
      )
    `)
    .eq('project_id', id);

  if (status) {
    query = query.eq('status', status);
  }

  query = query.order(sort, { ascending: order === 'asc' });

  const { data: applications, error } = await query;

  if (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }

  res.json({ applications: applications || [] });
}));

// Update application status (client only, must be project owner)
router.put('/:id/applications/:applicationId', authenticateToken, requireRole('client', 'employer'), idValidation, asyncHandler(async (req, res) => {
  const { id, applicationId } = req.params;
  const { status, notes, interview_scheduled_at, rejected_reason } = req.body;

  // Verify the project exists and belongs to the user
  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('id, client_id, title')
    .eq('id', id)
    .maybeSingle();

  if (projectError) {
    console.error('Error fetching project:', projectError);
    return res.status(500).json({ 
      error: 'Failed to verify project',
      details: projectError.message || 'Database error occurred'
    });
  }

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.client_id !== req.userId) {
    return res.status(403).json({ error: 'You can only update applications for your own projects' });
  }

  // Verify the application exists and belongs to this project
  const { data: application, error: appError } = await supabaseAdmin
    .from('project_applications')
    .select('id, project_id, freelancer_id')
    .eq('id', applicationId)
    .eq('project_id', id)
    .maybeSingle();

  if (appError) {
    console.error('Error fetching application:', appError);
    return res.status(500).json({ 
      error: 'Failed to verify application',
      details: appError.message || 'Database error occurred'
    });
  }

  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  // Build update object
  const updateData = {
    updated_at: new Date().toISOString()
  };

  if (status) {
    // Validate status against allowed values for project_applications
    const allowedStatuses = ['pending', 'viewed', 'shortlisted', 'interview', 'accepted', 'rejected', 'withdrawn'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        message: `Status "${status}" is not valid for project applications. Allowed values: ${allowedStatuses.join(', ')}`
      });
    }
    
    updateData.status = status;
    if (status === 'viewed') {
      updateData.viewed_at = new Date().toISOString();
    } else if (status === 'shortlisted') {
      updateData.shortlisted_at = new Date().toISOString();
    } else if (status === 'rejected') {
      updateData.rejected_at = new Date().toISOString();
      if (rejected_reason) {
        updateData.rejection_reason = rejected_reason;
      }
    }
  }

  if (notes) {
    updateData.interview_notes = notes;
  }

  if (interview_scheduled_at) {
    updateData.interview_scheduled_at = interview_scheduled_at;
  }

  // Log update data for debugging
  console.log('Updating project application:', { applicationId, updateData });

  const { data: updatedApplication, error: updateError } = await supabaseAdmin
    .from('project_applications')
    .update(updateData)
    .eq('id', applicationId)
    .select(`
      *,
      freelancer:profiles!project_applications_freelancer_id_fkey(
        id,
        full_name,
        avatar_url,
        headline
      )
    `)
    .maybeSingle();

  if (updateError) {
    console.error('Error updating application:', updateError);
    console.error('Update error details:', {
      message: updateError.message,
      code: updateError.code,
      details: updateError.details,
      hint: updateError.hint
    });
    return res.status(500).json({ 
      error: 'Failed to update application',
      details: updateError.message || 'Database error occurred'
    });
  }

  if (!updatedApplication) {
    console.error('Update succeeded but no data returned for application:', applicationId);
    return res.status(500).json({ 
      error: 'Update succeeded but no data returned',
      details: 'The application was updated but could not be retrieved'
    });
  }

  // Notify applicant about status change
  if (status) {
    notifyApplicationStatusChange({
      applicantId: application.freelancer_id,
      status,
      itemId: id,
      itemType: 'project',
      itemTitle: project.title,
      fromUserId: req.userId
    }).catch(err => console.error('Failed to send status change notification:', err));
  }

  res.json({ application: updatedApplication });
}));

// Get application statistics for a project
router.get('/:id/applications/stats', authenticateToken, requireRole('client', 'employer'), idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify the project exists and belongs to the user
  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('id, client_id')
    .eq('id', id)
    .single();

  if (projectError || !project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.client_id !== req.userId) {
    return res.status(403).json({ error: 'You can only view statistics for your own projects' });
  }

  const { data: applications, error } = await supabaseAdmin
    .from('project_applications')
    .select('status')
    .eq('project_id', id);

  if (error) {
    console.error('Error fetching application stats:', error);
    return res.status(500).json({ error: 'Failed to fetch application statistics' });
  }

  const stats = {
    total: applications?.length || 0,
    pending: applications?.filter(a => a.status === 'pending').length || 0,
    viewed: applications?.filter(a => a.status === 'viewed').length || 0,
    shortlisted: applications?.filter(a => a.status === 'shortlisted').length || 0,
    interview: applications?.filter(a => a.status === 'interview').length || 0,
    accepted: applications?.filter(a => a.status === 'accepted').length || 0,
    rejected: applications?.filter(a => a.status === 'rejected').length || 0,
    withdrawn: applications?.filter(a => a.status === 'withdrawn').length || 0
  };

  res.json({ stats });
}));

export default router;




