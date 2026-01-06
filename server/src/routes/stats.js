import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get dashboard statistics for the current user
router.get('/dashboard', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const userType = req.user.user_type;
  
  let stats = {};

  // Common stats for all users
  const { data: profileData } = await supabaseAdmin
    .from('profiles')
    .select('profile_views, profile_completion, created_at')
    .eq('id', userId)
    .single();

  stats.profile_views = profileData?.profile_views || 0;
  stats.profile_completion = profileData?.profile_completion || 0;
  stats.member_since = profileData?.created_at;

  // Role-specific stats
  if (userType === 'freelancer' || userType === 'ba_pm') {
    // Get active projects (where user is a freelancer)
    const { count: activeProjects } = await supabaseAdmin
      .from('project_applications')
      .select('*', { count: 'exact', head: true })
      .eq('applicant_id', userId)
      .in('status', ['hired', 'in_progress']);

    // Get pending applications
    const { count: pendingApplications } = await supabaseAdmin
      .from('project_applications')
      .select('*', { count: 'exact', head: true })
      .eq('applicant_id', userId)
      .eq('status', 'pending');

    // Get completed projects
    const { count: completedProjects } = await supabaseAdmin
      .from('project_applications')
      .select('*', { count: 'exact', head: true })
      .eq('applicant_id', userId)
      .eq('status', 'completed');

    stats.active_projects = activeProjects || 0;
    stats.pending_applications = pendingApplications || 0;
    stats.completed_projects = completedProjects || 0;
  }

  if (userType === 'job_seeker') {
    // Get job applications
    const { count: totalApplications } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('applicant_id', userId);

    const { count: pendingApplications } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('applicant_id', userId)
      .eq('status', 'pending');

    const { count: interviewApplications } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('applicant_id', userId)
      .in('status', ['shortlisted', 'interview']);

    stats.total_applications = totalApplications || 0;
    stats.pending_applications = pendingApplications || 0;
    stats.interviews = interviewApplications || 0;
  }

  if (userType === 'client' || userType === 'employer') {
    // Get posted projects
    const { count: totalProjects } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', userId);

    const { count: activeProjects } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', userId)
      .in('status', ['open', 'in_progress']);

    // Get posted jobs
    const { count: totalJobs } = await supabaseAdmin
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('employer_id', userId);

    const { count: activeJobs } = await supabaseAdmin
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('employer_id', userId)
      .eq('status', 'open');

    // Get total applications received
    const { data: projectIds } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('client_id', userId);

    let receivedApplications = 0;
    if (projectIds && projectIds.length > 0) {
      const { count } = await supabaseAdmin
        .from('project_applications')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds.map(p => p.id));
      receivedApplications = count || 0;
    }

    stats.total_projects = totalProjects || 0;
    stats.active_projects = activeProjects || 0;
    stats.total_jobs = totalJobs || 0;
    stats.active_jobs = activeJobs || 0;
    stats.received_applications = receivedApplications;
  }

  if (userType === 'trainer') {
    // Get courses (if courses table exists)
    // For now, return placeholder stats
    stats.active_courses = 0;
    stats.total_students = 0;
    stats.total_enrollments = 0;
  }

  // Get unread messages count
  const { count: unreadMessages } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('is_read', false);

  // Get unread notifications count
  const { count: unreadNotifications } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  stats.unread_messages = unreadMessages || 0;
  stats.unread_notifications = unreadNotifications || 0;

  res.json({ stats });
}));

// Get activity feed
router.get('/activity', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const limit = parseInt(req.query.limit) || 10;

  // Get recent notifications as activity
  const { data: notifications } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  // Format as activity items
  const activity = (notifications || []).map(n => ({
    id: n.id,
    action: n.message || n.title,
    time: n.created_at,
    type: n.notification_type,
    action_url: n.action_url
  }));

  res.json({ activity });
}));

// Get recommended projects for freelancers
router.get('/recommended-projects', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const limit = parseInt(req.query.limit) || 6;

  // Get user's skills and platforms
  const { data: userSkills } = await supabaseAdmin
    .from('user_skills')
    .select('skill:skills(name)')
    .eq('profile_id', userId);

  const { data: userPlatforms } = await supabaseAdmin
    .from('user_platforms')
    .select('platform:rpa_platforms(name)')
    .eq('profile_id', userId);

  // Get open projects
  let query = supabaseAdmin
    .from('projects')
    .select(`
      id,
      title,
      description,
      budget_min,
      budget_max,
      budget_type,
      status,
      urgency,
      location,
      is_remote,
      created_at,
      required_skills,
      client:profiles!projects_client_id_fkey(id, full_name, avatar_url, is_verified)
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(limit);

  const { data: projects, error } = await query;

  if (error) {
    console.error('Error fetching recommended projects:', error);
    return res.status(500).json({ error: 'Failed to fetch recommended projects' });
  }

  // Calculate match score based on skills (simplified)
  const skillNames = userSkills?.map(s => s.skill?.name?.toLowerCase()) || [];
  const platformNames = userPlatforms?.map(p => p.platform?.name?.toLowerCase()) || [];

  const scoredProjects = (projects || []).map(project => {
    let matchScore = 0;
    const projectSkills = (project.required_skills || []).map(s => s.toLowerCase());
    
    projectSkills.forEach(skill => {
      if (skillNames.includes(skill) || platformNames.includes(skill)) {
        matchScore += 1;
      }
    });

    return {
      ...project,
      match_score: matchScore,
      match_percentage: projectSkills.length > 0 
        ? Math.round((matchScore / projectSkills.length) * 100) 
        : 0
    };
  }).sort((a, b) => b.match_score - a.match_score);

  res.json({ projects: scoredProjects });
}));

// Get recommended jobs for job seekers
router.get('/recommended-jobs', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const limit = parseInt(req.query.limit) || 6;

  // Get open jobs
  const { data: jobs, error } = await supabaseAdmin
    .from('jobs')
    .select(`
      id,
      title,
      description,
      job_type,
      location,
      is_remote,
      salary_min,
      salary_max,
      technologies,
      status,
      created_at,
      employer:profiles!jobs_employer_id_fkey(id, full_name, avatar_url, is_verified)
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recommended jobs:', error);
    return res.status(500).json({ error: 'Failed to fetch recommended jobs' });
  }

  res.json({ jobs: jobs || [] });
}));

export default router;

