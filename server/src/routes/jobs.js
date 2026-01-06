import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginationValidation, idValidation } from '../middleware/validate.js';
import { PAGINATION } from '../config/constants.js';

const router = express.Router();

// Helper to extract location string from locations JSONB
const extractLocation = (job) => {
  if (job.locations && Array.isArray(job.locations) && job.locations.length > 0) {
    const primaryLocation = job.locations.find(loc => loc.is_primary) || job.locations[0];
    if (primaryLocation.city && primaryLocation.country) {
      return `${primaryLocation.city}, ${primaryLocation.country}`;
    } else if (primaryLocation.city) {
      return primaryLocation.city;
    }
  }
  return null;
};

// Transform a single job using pre-fetched platform/skill maps (no DB calls)
const transformSingleJob = (job, platformMap, skillMap) => {
  if (!job) return job;
  
  const location = extractLocation(job);
  
  // Map UUIDs to names using pre-fetched maps
  const technologies = [];
  if (job.required_platforms && Array.isArray(job.required_platforms)) {
    job.required_platforms.forEach(id => {
      const name = platformMap.get(id);
      if (name) technologies.push(name);
    });
  }
  if (job.required_skills && Array.isArray(job.required_skills)) {
    job.required_skills.forEach(id => {
      const name = skillMap.get(id);
      if (name) technologies.push(name);
    });
  }
  
  return {
    ...job,
    job_type: job.employment_type || job.job_type,
    is_remote: job.work_arrangement === 'remote' || job.is_remote === true,
    location: location || job.location,
    technologies: technologies.length > 0 ? technologies : (job.technologies || []),
    employment_type: job.employment_type,
    work_arrangement: job.work_arrangement,
    locations: job.locations,
    required_platforms: job.required_platforms,
    required_skills: job.required_skills
  };
};

// Batch transform jobs - fetches all platform/skill names in 2 queries instead of N*2
const transformJobs = async (jobs) => {
  if (!jobs || jobs.length === 0) return [];
  
  // Collect all unique UUIDs across all jobs
  const platformIds = new Set();
  const skillIds = new Set();
  
  jobs.forEach(job => {
    (job.required_platforms || []).forEach(id => platformIds.add(id));
    (job.required_skills || []).forEach(id => skillIds.add(id));
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
  
  // Transform all jobs using the maps (no more DB calls)
  return jobs.map(job => transformSingleJob(job, platformMap, skillMap));
};

// Transform single job (for single job fetch - still needs DB calls)
const transformJob = async (job) => {
  if (!job) return job;
  
  // For single job, just use transformJobs with array of 1
  const [transformed] = await transformJobs([job]);
  return transformed;
};

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
        .single();
      
      if (platform) {
        platformUuids.push(trimmedName);
        continue;
      }

      const { data: skill } = await supabaseAdmin
        .from('skills')
        .select('id')
        .eq('id', trimmedName)
        .eq('is_active', true)
        .single();
      
      if (skill) {
        skillUuids.push(trimmedName);
        continue;
      }
    }

    // Try to find as platform first
    let { data: platform } = await supabaseAdmin
      .from('rpa_platforms')
      .select('id')
      .eq('name', trimmedName)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!platform) {
      const { data: platformData } = await supabaseAdmin
        .from('rpa_platforms')
        .select('id')
        .ilike('name', trimmedName)
        .eq('is_active', true)
        .limit(1)
        .single();
      platform = platformData;
    }

    if (platform && platform.id) {
      platformUuids.push(platform.id);
      continue;
    }

    // Try to find as skill
    let { data: skill } = await supabaseAdmin
      .from('skills')
      .select('id')
      .eq('name', trimmedName)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!skill) {
      const { data: skillData } = await supabaseAdmin
        .from('skills')
        .select('id')
        .ilike('name', trimmedName)
        .eq('is_active', true)
        .limit(1)
        .single();
      skill = skillData;
    }

    if (skill && skill.id) {
      skillUuids.push(skill.id);
    }
  }

  return { platformUuids, skillUuids };
};

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
      employer:profiles!jobs_employer_id_fkey(id, full_name, avatar_url)
    `, { count: 'exact' })
    .eq('status', 'open');

  // Filters
  if (type) {
    query = query.eq('employment_type', type);
  }

  if (location) {
    // Search in locations JSONB - use textSearch or containment
    // For now, we'll skip location filtering if it's complex JSONB
    // TODO: Implement proper JSONB location search
  }

  if (technology) {
    // Search in both required_platforms and required_skills
    // First, try to find if it's a platform by name
    const { data: platform } = await supabaseAdmin
      .from('rpa_platforms')
      .select('id')
      .eq('is_active', true)
      .ilike('name', technology)
      .limit(1)
      .maybeSingle();
    
    if (platform && platform.id) {
      query = query.contains('required_platforms', [platform.id]);
    } else {
      // Try as a skill by name
      const { data: skill } = await supabaseAdmin
        .from('skills')
        .select('id')
        .eq('is_active', true)
        .ilike('name', technology)
        .limit(1)
        .maybeSingle();
      
      if (skill && skill.id) {
        query = query.contains('required_skills', [skill.id]);
      }
    }
  }

  if (min_salary) {
    query = query.gte('salary_min', parseFloat(min_salary));
  }

  if (max_salary) {
    query = query.lte('salary_max', parseFloat(max_salary));
  }

  if (remote === 'true') {
    query = query.eq('work_arrangement', 'remote');
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
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

  // Transform jobs for frontend compatibility
  const transformedJobs = await transformJobs(jobs);

  // Fetch company names from employer_profiles for all jobs
  if (transformedJobs && transformedJobs.length > 0) {
    const employerIds = transformedJobs.map(j => j.employer_id).filter(Boolean);
    if (employerIds.length > 0) {
      const { data: employerProfiles } = await supabaseAdmin
        .from('employer_profiles')
        .select('profile_id, company_name')
        .in('profile_id', employerIds);

      // Create a map for quick lookup
      const companyMap = {};
      (employerProfiles || []).forEach(ep => {
        companyMap[ep.profile_id] = ep.company_name;
      });

      // Add company_name to each job's employer object
      transformedJobs.forEach(job => {
        if (job.employer && companyMap[job.employer_id]) {
          job.employer.company_name = companyMap[job.employer_id];
        }
      });
    }
  }

  res.json({
    jobs: transformedJobs || [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}));

// Get my job postings (employer/client) - MUST be before /:id route
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

  // Get application counts for each job
  if (jobs && jobs.length > 0) {
    const jobIds = jobs.map(j => j.id);
    const { data: applicationCounts } = await supabaseAdmin
      .from('job_applications')
      .select('job_id')
      .in('job_id', jobIds);

    const countMap = {};
    (applicationCounts || []).forEach(app => {
      countMap[app.job_id] = (countMap[app.job_id] || 0) + 1;
    });

    jobs.forEach(job => {
      job.application_count = countMap[job.id] || 0;
    });
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
      employer:profiles!jobs_employer_id_fkey(id, full_name, avatar_url)
    `)
    .eq('id', id)
    .single();

  if (error || !job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Get company name from employer_profiles if it exists
  if (job.employer_id) {
    const { data: employerProfile } = await supabaseAdmin
      .from('employer_profiles')
      .select('company_name')
      .eq('profile_id', job.employer_id)
      .single();
    
    if (employerProfile && job.employer) {
      job.employer.company_name = employerProfile.company_name;
    }
  }

  // Get application count
  const { count } = await supabaseAdmin
    .from('job_applications')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', id);

  job.application_count = count || 0;

  res.json({ job: await transformJob(job) });
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

  // Convert is_remote boolean to work_arrangement string
  let workArrangement = 'onsite';
  if (is_remote === true || is_remote === 'true') {
    workArrangement = 'remote';
  } else if (location && is_remote) {
    workArrangement = 'hybrid';
  }

  // Convert location string to locations JSONB array format
  let locationsArray = null;
  if (location) {
    // Parse location string (e.g., "New York, NY" or "Mumbai, India")
    const locationParts = location.split(',').map(s => s.trim());
    locationsArray = [{
      city: locationParts[0] || location,
      country: locationParts[1] || null,
      is_primary: true
    }];
  }

  // Convert technology names to UUIDs and separate platforms/skills
  const { platformUuids, skillUuids } = await convertTechnologiesToUuids(technologies);

  const { data: job, error } = await supabaseAdmin
    .from('jobs')
    .insert({
      employer_id: req.userId,
      title,
      description,
      employment_type: job_type || 'full_time',
      locations: locationsArray,
      work_arrangement: workArrangement,
      salary_min: salary_min || null,
      salary_max: salary_max || null,
      required_platforms: platformUuids.length > 0 ? platformUuids : null,
      required_skills: skillUuids.length > 0 ? skillUuids : null,
      preferred_qualifications: requirements || null,
      benefits: benefits ? (Array.isArray(benefits) ? benefits : [benefits]) : null,
      application_deadline: application_deadline || null,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      employer:profiles!jobs_employer_id_fkey(id, full_name, avatar_url)
    `)
    .single();

  // Get company name from employer_profiles if it exists
  if (job && job.employer_id) {
    const { data: employerProfile } = await supabaseAdmin
      .from('employer_profiles')
      .select('company_name')
      .eq('profile_id', job.employer_id)
      .single();
    
    if (employerProfile && job.employer) {
      job.employer.company_name = employerProfile.company_name;
    }
  }

  if (error) {
    console.error('Error creating job:', error);
    return res.status(500).json({ error: 'Failed to create job posting' });
  }

  if (!job || !job.id) {
    console.error('Job created but no data returned');
    return res.status(500).json({ error: 'Failed to create job posting - no data returned' });
  }

  res.status(201).json({ message: 'Job posted successfully', job: await transformJob(job) });
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

  // Map frontend field names to database column names
  if (updates.job_type !== undefined) {
    updates.employment_type = updates.job_type;
    delete updates.job_type;
  }

  if (updates.is_remote !== undefined) {
    // Convert is_remote boolean to work_arrangement string
    if (updates.is_remote === true || updates.is_remote === 'true') {
      updates.work_arrangement = 'remote';
    } else if (updates.location && updates.is_remote) {
      updates.work_arrangement = 'hybrid';
    } else {
      updates.work_arrangement = 'onsite';
    }
    delete updates.is_remote;
  }

  // Convert location string to locations JSONB array format
  if (updates.location !== undefined) {
    if (updates.location) {
      const locationParts = updates.location.split(',').map(s => s.trim());
      updates.locations = [{
        city: locationParts[0] || updates.location,
        country: locationParts[1] || null,
        is_primary: true
      }];
    } else {
      updates.locations = null;
    }
    delete updates.location;
  }

  // Convert technologies to required_platforms and required_skills
  if (updates.technologies !== undefined) {
    const { platformUuids, skillUuids } = await convertTechnologiesToUuids(updates.technologies);
    updates.required_platforms = platformUuids.length > 0 ? platformUuids : null;
    updates.required_skills = skillUuids.length > 0 ? skillUuids : null;
    delete updates.technologies;
  }

  // Convert requirements to preferred_qualifications
  if (updates.requirements !== undefined) {
    updates.preferred_qualifications = updates.requirements;
    delete updates.requirements;
  }

  // Ensure benefits is an array
  if (updates.benefits !== undefined) {
    updates.benefits = Array.isArray(updates.benefits) ? updates.benefits : (updates.benefits ? [updates.benefits] : null);
  }

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

  res.json({ message: 'Job updated successfully', job: await transformJob(job) });
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
router.post('/:id/apply', authenticateToken, requireRole('job_seeker', 'jobseeker', 'freelancer', 'ba_pm', 'trainer', 'developer'), idValidation, asyncHandler(async (req, res) => {
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

  if (job.status !== 'open') {
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

// Get all applications for a job (employer only, must be job owner)
router.get('/:id/applications', authenticateToken, requireRole('employer', 'client'), idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, sort = 'created_at', order = 'desc' } = req.query;

  // Verify the job exists and belongs to the user
  const { data: job, error: jobError } = await supabaseAdmin
    .from('jobs')
    .select('id, employer_id')
    .eq('id', id)
    .single();

  if (jobError || !job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.employer_id !== req.userId) {
    return res.status(403).json({ error: 'You can only view applications for your own jobs' });
  }

  let query = supabaseAdmin
    .from('job_applications')
    .select(`
      *,
      applicant:profiles!job_applications_applicant_id_fkey(
        id,
        full_name,
        avatar_url,
        headline
      )
    `)
    .eq('job_id', id);

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

// Update application status (employer only, must be job owner)
router.put('/:id/applications/:applicationId', authenticateToken, requireRole('employer', 'client'), idValidation, asyncHandler(async (req, res) => {
  const { id, applicationId } = req.params;
  const { status, notes, interview_scheduled_at, rejected_reason } = req.body;

  // Verify the job exists and belongs to the user
  const { data: job, error: jobError } = await supabaseAdmin
    .from('jobs')
    .select('id, employer_id')
    .eq('id', id)
    .single();

  if (jobError || !job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.employer_id !== req.userId) {
    return res.status(403).json({ error: 'You can only update applications for your own jobs' });
  }

  // Verify the application exists and belongs to this job
  const { data: application, error: appError } = await supabaseAdmin
    .from('job_applications')
    .select('id, job_id')
    .eq('id', applicationId)
    .eq('job_id', id)
    .single();

  if (appError || !application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  // Build update object
  const updateData = {
    last_status_change: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (status) {
    updateData.status = status;
    if (status === 'reviewed' || status === 'viewed') {
      updateData.viewed_at = new Date().toISOString();
    } else if (status === 'rejected') {
      updateData.rejected_at = new Date().toISOString();
      if (rejected_reason) {
        updateData.rejection_reason = rejected_reason;
      }
    }
  }

  if (notes) {
    updateData.employer_notes = notes;
  }

  if (interview_scheduled_at) {
    updateData.interview_scheduled_at = interview_scheduled_at;
  }

  const { data: updatedApplication, error: updateError } = await supabaseAdmin
    .from('job_applications')
    .update(updateData)
    .eq('id', applicationId)
    .select(`
      *,
      applicant:profiles!job_applications_applicant_id_fkey(
        id,
        full_name,
        avatar_url,
        headline,
        email
      )
    `)
    .single();

  if (updateError) {
    console.error('Error updating application:', updateError);
    return res.status(500).json({ error: 'Failed to update application' });
  }

  res.json({ application: updatedApplication });
}));

// Get application statistics for a job
router.get('/:id/applications/stats', authenticateToken, requireRole('employer', 'client'), idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify the job exists and belongs to the user
  const { data: job, error: jobError } = await supabaseAdmin
    .from('jobs')
    .select('id, employer_id')
    .eq('id', id)
    .single();

  if (jobError || !job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.employer_id !== req.userId) {
    return res.status(403).json({ error: 'You can only view statistics for your own jobs' });
  }

  const { data: applications, error } = await supabaseAdmin
    .from('job_applications')
    .select('status')
    .eq('job_id', id);

  if (error) {
    console.error('Error fetching application stats:', error);
    return res.status(500).json({ error: 'Failed to fetch application statistics' });
  }

  const stats = {
    total: applications?.length || 0,
    pending: applications?.filter(a => a.status === 'pending').length || 0,
    reviewed: applications?.filter(a => a.status === 'reviewed').length || 0,
    interview: applications?.filter(a => a.status === 'interview' || a.status === 'phone_screen' || a.status === 'technical_round').length || 0,
    accepted: applications?.filter(a => a.status === 'accepted').length || 0,
    rejected: applications?.filter(a => a.status === 'rejected').length || 0,
    withdrawn: applications?.filter(a => a.status === 'withdrawn').length || 0
  };

  res.json({ stats });
}));

export default router;




