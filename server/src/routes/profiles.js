import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginationValidation, idValidation } from '../middleware/validate.js';
import { PAGINATION, USER_TYPES } from '../config/constants.js';

const router = express.Router();

// Get my profile
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const profile = req.user;
  
  // Get platforms
  const { data: platforms } = await supabaseAdmin
    .from('user_platforms')
    .select(`
      *,
      platform:rpa_platforms(id, name, slug, logo_url)
    `)
    .eq('profile_id', req.userId);

  // Get skills
  const { data: skills } = await supabaseAdmin
    .from('user_skills')
    .select(`
      *,
      skill:skills(id, name, slug, category_id)
    `)
    .eq('profile_id', req.userId);

  // Get certifications
  const { data: certifications } = await supabaseAdmin
    .from('user_certifications')
    .select(`
      *,
      certification:certifications(id, name, slug, level, platform_id)
    `)
    .eq('profile_id', req.userId);

  // Get experience
  const { data: experience } = await supabaseAdmin
    .from('user_experience')
    .select('*')
    .eq('profile_id', req.userId)
    .order('is_current', { ascending: false })
    .order('start_date', { ascending: false });

  // Get education
  const { data: education } = await supabaseAdmin
    .from('user_education')
    .select('*')
    .eq('profile_id', req.userId)
    .order('start_date', { ascending: false });

  // Get portfolio
  const { data: portfolio } = await supabaseAdmin
    .from('user_portfolio')
    .select('*')
    .eq('profile_id', req.userId)
    .order('display_order')
    .order('created_at', { ascending: false });

  res.json({
    profile: {
      ...profile,
      platforms: platforms || [],
      skills: skills || [],
      certifications: certifications || [],
      experience: experience || [],
      education: education || [],
      portfolio: portfolio || []
    }
  });
}));

// Update my profile
router.put('/me', authenticateToken, asyncHandler(async (req, res) => {
  const {
    full_name,
    display_name,
    headline,
    bio,
    country,
    state,
    city,
    timezone,
    public_email,
    website_url,
    linkedin_url,
    is_available,
    is_profile_public
  } = req.body;

  const updates = {};
  
  if (full_name !== undefined) updates.full_name = full_name;
  if (display_name !== undefined) updates.display_name = display_name;
  if (headline !== undefined) updates.headline = headline;
  if (bio !== undefined) updates.bio = bio;
  if (country !== undefined) updates.country = country;
  if (state !== undefined) updates.state = state;
  if (city !== undefined) updates.city = city;
  if (timezone !== undefined) updates.timezone = timezone;
  if (public_email !== undefined) updates.public_email = public_email;
  if (website_url !== undefined) updates.website_url = website_url;
  if (linkedin_url !== undefined) updates.linkedin_url = linkedin_url;
  if (is_available !== undefined) updates.is_available = is_available;
  if (is_profile_public !== undefined) updates.is_profile_public = is_profile_public;

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', req.userId)
    .select()
    .single();

  if (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }

  res.json({ message: 'Profile updated successfully', profile });
}));

// Get profile by ID (public)
router.get('/:id', idValidation, optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // Check if profile is public or viewer is owner
  if (!profile.is_profile_public && (!req.userId || req.userId !== id)) {
    return res.status(403).json({ error: 'This profile is private' });
  }

  // Increment view count
  if (!req.userId || req.userId !== id) {
    await supabaseAdmin
      .from('profiles')
      .update({ profile_views: profile.profile_views + 1 })
      .eq('id', id);
  }

  // Get public info based on user type
  let specializedProfile = null;
  
  if (profile.user_type === USER_TYPES.FREELANCER) {
    const { data } = await supabaseAdmin
      .from('freelancer_profiles')
      .select('*')
      .eq('profile_id', id)
      .single();
    specializedProfile = data;
  } else if (profile.user_type === USER_TYPES.TRAINER) {
    const { data } = await supabaseAdmin
      .from('trainer_profiles')
      .select('*')
      .eq('profile_id', id)
      .single();
    specializedProfile = data;
  } else if (profile.user_type === USER_TYPES.BA_PM) {
    const { data } = await supabaseAdmin
      .from('ba_pm_profiles')
      .select('*')
      .eq('profile_id', id)
      .single();
    specializedProfile = data;
  }

  // Get platforms
  const { data: platforms } = await supabaseAdmin
    .from('user_platforms')
    .select(`
      proficiency_level,
      years_experience,
      is_primary,
      platform:rpa_platforms(id, name, slug, logo_url)
    `)
    .eq('profile_id', id);

  // Get skills
  const { data: skills } = await supabaseAdmin
    .from('user_skills')
    .select(`
      proficiency_level,
      years_experience,
      skill:skills(id, name, slug)
    `)
    .eq('profile_id', id);

  // Get certifications
  const { data: certifications } = await supabaseAdmin
    .from('user_certifications')
    .select(`
      credential_id,
      credential_url,
      issued_date,
      expiry_date,
      is_verified,
      certification:certifications(id, name, slug, level)
    `)
    .eq('profile_id', id);

  // Get portfolio
  const { data: portfolio } = await supabaseAdmin
    .from('user_portfolio')
    .select('*')
    .eq('profile_id', id)
    .order('is_featured', { ascending: false })
    .order('display_order');

  // Get reviews
  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select(`
      id,
      overall_rating,
      title,
      content,
      created_at,
      reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, avatar_url)
    `)
    .eq('reviewee_id', id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(10);

  res.json({
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      cover_image_url: profile.cover_image_url,
      user_type: profile.user_type,
      country: profile.country,
      city: profile.city,
      timezone: profile.timezone,
      headline: profile.headline,
      bio: profile.bio,
      public_email: profile.public_email,
      website_url: profile.website_url,
      linkedin_url: profile.linkedin_url,
      is_available: profile.is_available,
      is_verified: profile.is_verified,
      verification_badge: profile.verification_badge,
      created_at: profile.created_at,
      specialized_profile: specializedProfile,
      platforms: platforms || [],
      skills: skills || [],
      certifications: certifications || [],
      portfolio: portfolio || [],
      reviews: reviews || []
    }
  });
}));

// Add/Update platform expertise
router.post('/me/platforms', authenticateToken, asyncHandler(async (req, res) => {
  const { platform_id, proficiency_level, years_experience, is_primary } = req.body;

  if (!platform_id) {
    return res.status(400).json({ error: 'Platform ID is required' });
  }

  // If setting as primary, unset other primaries
  if (is_primary) {
    await supabaseAdmin
      .from('user_platforms')
      .update({ is_primary: false })
      .eq('profile_id', req.userId);
  }

  // Upsert platform
  const { data, error } = await supabaseAdmin
    .from('user_platforms')
    .upsert({
      profile_id: req.userId,
      platform_id,
      proficiency_level: proficiency_level || 'intermediate',
      years_experience: years_experience || 0,
      is_primary: is_primary || false
    }, { onConflict: 'profile_id,platform_id' })
    .select()
    .single();

  if (error) {
    console.error('Platform add error:', error);
    return res.status(500).json({ error: 'Failed to add platform' });
  }

  res.json({ message: 'Platform added successfully', platform: data });
}));

// Remove platform
router.delete('/me/platforms/:platformId', authenticateToken, asyncHandler(async (req, res) => {
  const { platformId } = req.params;

  await supabaseAdmin
    .from('user_platforms')
    .delete()
    .eq('profile_id', req.userId)
    .eq('platform_id', platformId);

  res.json({ message: 'Platform removed successfully' });
}));

// Add/Update skill
router.post('/me/skills', authenticateToken, asyncHandler(async (req, res) => {
  const { skill_id, proficiency_level, years_experience } = req.body;

  if (!skill_id) {
    return res.status(400).json({ error: 'Skill ID is required' });
  }

  const { data, error } = await supabaseAdmin
    .from('user_skills')
    .upsert({
      profile_id: req.userId,
      skill_id,
      proficiency_level: proficiency_level || 'intermediate',
      years_experience: years_experience || 0
    }, { onConflict: 'profile_id,skill_id' })
    .select()
    .single();

  if (error) {
    console.error('Skill add error:', error);
    return res.status(500).json({ error: 'Failed to add skill' });
  }

  res.json({ message: 'Skill added successfully', skill: data });
}));

// Remove skill
router.delete('/me/skills/:skillId', authenticateToken, asyncHandler(async (req, res) => {
  const { skillId } = req.params;

  await supabaseAdmin
    .from('user_skills')
    .delete()
    .eq('profile_id', req.userId)
    .eq('skill_id', skillId);

  res.json({ message: 'Skill removed successfully' });
}));

// Add certification
router.post('/me/certifications', authenticateToken, asyncHandler(async (req, res) => {
  const { 
    certification_id, 
    custom_certification_name,
    issuing_organization,
    credential_id,
    credential_url,
    issued_date,
    expiry_date
  } = req.body;

  const { data, error } = await supabaseAdmin
    .from('user_certifications')
    .insert({
      profile_id: req.userId,
      certification_id: certification_id || null,
      custom_certification_name,
      issuing_organization,
      credential_id,
      credential_url,
      issued_date,
      expiry_date
    })
    .select()
    .single();

  if (error) {
    console.error('Certification add error:', error);
    return res.status(500).json({ error: 'Failed to add certification' });
  }

  res.json({ message: 'Certification added successfully', certification: data });
}));

// Remove certification
router.delete('/me/certifications/:certId', authenticateToken, asyncHandler(async (req, res) => {
  const { certId } = req.params;

  await supabaseAdmin
    .from('user_certifications')
    .delete()
    .eq('profile_id', req.userId)
    .eq('id', certId);

  res.json({ message: 'Certification removed successfully' });
}));

// Add experience
router.post('/me/experience', authenticateToken, asyncHandler(async (req, res) => {
  const { 
    title,
    company_name,
    company_url,
    location,
    start_date,
    end_date,
    is_current,
    description,
    achievements,
    technologies_used
  } = req.body;

  if (!title || !company_name || !start_date) {
    return res.status(400).json({ error: 'Title, company name and start date are required' });
  }

  const { data, error } = await supabaseAdmin
    .from('user_experience')
    .insert({
      profile_id: req.userId,
      title,
      company_name,
      company_url,
      location,
      start_date,
      end_date: is_current ? null : end_date,
      is_current: is_current || false,
      description,
      achievements: achievements || [],
      technologies_used: technologies_used || []
    })
    .select()
    .single();

  if (error) {
    console.error('Experience add error:', error);
    return res.status(500).json({ error: 'Failed to add experience' });
  }

  res.json({ message: 'Experience added successfully', experience: data });
}));

// Update experience
router.put('/me/experience/:expId', authenticateToken, asyncHandler(async (req, res) => {
  const { expId } = req.params;
  const updates = req.body;

  const { data, error } = await supabaseAdmin
    .from('user_experience')
    .update(updates)
    .eq('profile_id', req.userId)
    .eq('id', expId)
    .select()
    .single();

  if (error) {
    console.error('Experience update error:', error);
    return res.status(500).json({ error: 'Failed to update experience' });
  }

  res.json({ message: 'Experience updated successfully', experience: data });
}));

// Delete experience
router.delete('/me/experience/:expId', authenticateToken, asyncHandler(async (req, res) => {
  const { expId } = req.params;

  await supabaseAdmin
    .from('user_experience')
    .delete()
    .eq('profile_id', req.userId)
    .eq('id', expId);

  res.json({ message: 'Experience removed successfully' });
}));

// Add portfolio item
router.post('/me/portfolio', authenticateToken, asyncHandler(async (req, res) => {
  const { 
    title,
    description,
    project_type,
    project_url,
    demo_url,
    github_url,
    thumbnail_url,
    images,
    video_url,
    client_name,
    is_client_confidential,
    completion_date,
    duration_months,
    platforms_used,
    skills_used,
    key_results,
    is_featured
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const { data, error } = await supabaseAdmin
    .from('user_portfolio')
    .insert({
      profile_id: req.userId,
      title,
      description,
      project_type,
      project_url,
      demo_url,
      github_url,
      thumbnail_url,
      images: images || [],
      video_url,
      client_name,
      is_client_confidential: is_client_confidential || false,
      completion_date,
      duration_months,
      platforms_used: platforms_used || [],
      skills_used: skills_used || [],
      key_results: key_results || [],
      is_featured: is_featured || false
    })
    .select()
    .single();

  if (error) {
    console.error('Portfolio add error:', error);
    return res.status(500).json({ error: 'Failed to add portfolio item' });
  }

  res.json({ message: 'Portfolio item added successfully', portfolio: data });
}));

// Delete portfolio item
router.delete('/me/portfolio/:portfolioId', authenticateToken, asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;

  await supabaseAdmin
    .from('user_portfolio')
    .delete()
    .eq('profile_id', req.userId)
    .eq('id', portfolioId);

  res.json({ message: 'Portfolio item removed successfully' });
}));

// Search profiles
router.get('/', optionalAuth, paginationValidation, asyncHandler(async (req, res) => {
  const { 
    page = PAGINATION.DEFAULT_PAGE, 
    limit = PAGINATION.DEFAULT_LIMIT,
    user_type,
    platform,
    skill,
    country,
    city,
    is_available,
    min_rate,
    max_rate,
    search,
    sort = 'created_at',
    order = 'desc'
  } = req.query;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('is_profile_public', true);

  // Filters
  if (user_type) {
    query = query.eq('user_type', user_type);
  }

  if (country) {
    query = query.eq('country', country);
  }

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  if (is_available === 'true') {
    query = query.eq('is_available', true);
  }

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,headline.ilike.%${search}%,bio.ilike.%${search}%`);
  }

  // Sorting
  const validSortFields = ['created_at', 'full_name', 'profile_views'];
  const sortField = validSortFields.includes(sort) ? sort : 'created_at';
  query = query.order(sortField, { ascending: order === 'asc' });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: profiles, error, count } = await query;

  if (error) {
    console.error('Profiles search error:', error);
    return res.status(500).json({ error: 'Failed to search profiles' });
  }

  res.json({
    profiles,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

export default router;




