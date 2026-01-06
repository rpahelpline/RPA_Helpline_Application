import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginationValidation, idValidation } from '../middleware/validate.js';
import { PAGINATION, USER_TYPES } from '../config/constants.js';

const router = express.Router();

// Helper function to calculate profile completion
const calculateProfileCompletion = (profile, platforms, skills, experience) => {
  let completion = 0;
  const fields = {
    full_name: profile.full_name,
    headline: profile.headline,
    bio: profile.bio,
    country: profile.country,
    city: profile.city,
    public_email: profile.public_email,
    linkedin_url: profile.linkedin_url,
    avatar_url: profile.avatar_url,
    has_skills: skills && skills.length > 0,
    has_platforms: platforms && platforms.length > 0,
    has_experience: experience && experience.length > 0,
  };
  
  const totalFields = Object.keys(fields).length;
  const filledFields = Object.values(fields).filter(v => {
    if (typeof v === 'boolean') return v;
    return v && v !== '';
  }).length;
  
  completion = Math.round((filledFields / totalFields) * 100);
  return Math.min(100, Math.max(0, completion));
};

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

  // Get portfolio with expanded platform and skill names
  const { data: portfolioRaw } = await supabaseAdmin
    .from('user_portfolio')
    .select('*')
    .eq('profile_id', req.userId)
    .order('display_order')
    .order('created_at', { ascending: false });

  // Convert UUID arrays to name arrays for portfolio items
  const portfolio = await Promise.all((portfolioRaw || []).map(async (item) => {
    const portfolioItem = { ...item };
    
    // Convert platform UUIDs to names
    if (item.platforms_used && Array.isArray(item.platforms_used) && item.platforms_used.length > 0) {
      const platformNames = [];
      for (const platformId of item.platforms_used) {
        const { data: platform } = await supabaseAdmin
          .from('rpa_platforms')
          .select('name')
          .eq('id', platformId)
          .single();
        if (platform && platform.name) {
          platformNames.push(platform.name);
        }
      }
      portfolioItem.platforms_used = platformNames;
    }
    
    // Convert skill UUIDs to names
    if (item.skills_used && Array.isArray(item.skills_used) && item.skills_used.length > 0) {
      const skillNames = [];
      for (const skillId of item.skills_used) {
        const { data: skill } = await supabaseAdmin
          .from('skills')
          .select('name')
          .eq('id', skillId)
          .single();
        if (skill && skill.name) {
          skillNames.push(skill.name);
        }
      }
      portfolioItem.skills_used = skillNames;
    }
    
    return portfolioItem;
  }));

  // Calculate profile completion
  const completion = calculateProfileCompletion(profile, platforms, skills, experience);
  
  // Update profile completion in database
  if (profile.profile_completion !== completion) {
    await supabaseAdmin
      .from('profiles')
      .update({ profile_completion: completion })
      .eq('id', req.userId);
  }

  res.json({
    profile: {
      ...profile,
      profile_completion: completion,
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
    is_profile_public,
    // New fields
    alternate_phone,
    current_company,
    resume_url,
    total_experience_years,
    rpa_experience_years,
    // Image fields
    avatar_url,
    cover_image_url
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
  // New fields
  if (alternate_phone !== undefined) updates.alternate_phone = alternate_phone;
  if (current_company !== undefined) updates.current_company = current_company;
  if (resume_url !== undefined) updates.resume_url = resume_url;
  if (total_experience_years !== undefined) updates.total_experience_years = total_experience_years;
  if (rpa_experience_years !== undefined) updates.rpa_experience_years = rpa_experience_years;
  // Image fields
  if (avatar_url !== undefined) updates.avatar_url = avatar_url;
  if (cover_image_url !== undefined) updates.cover_image_url = cover_image_url;

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

  // Recalculate profile completion
  const { data: platforms } = await supabaseAdmin
    .from('user_platforms')
    .select('*')
    .eq('profile_id', req.userId);

  const { data: skills } = await supabaseAdmin
    .from('user_skills')
    .select('*')
    .eq('profile_id', req.userId);

  const { data: experience } = await supabaseAdmin
    .from('user_experience')
    .select('*')
    .eq('profile_id', req.userId);

  const completion = calculateProfileCompletion(profile, platforms, skills, experience);
  
  // Update completion if changed
  if (profile.profile_completion !== completion) {
    await supabaseAdmin
      .from('profiles')
      .update({ profile_completion: completion })
      .eq('id', req.userId);
    profile.profile_completion = completion;
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

  // Get experience
  const { data: experience } = await supabaseAdmin
    .from('user_experience')
    .select('*')
    .eq('profile_id', id)
    .order('is_current', { ascending: false })
    .order('start_date', { ascending: false });

  // Get education
  const { data: education } = await supabaseAdmin
    .from('user_education')
    .select('*')
    .eq('profile_id', id)
    .order('start_date', { ascending: false });

  // Get portfolio with expanded platform and skill names
  const { data: portfolioRaw } = await supabaseAdmin
    .from('user_portfolio')
    .select('*')
    .eq('profile_id', id)
    .order('is_featured', { ascending: false })
    .order('display_order');

  // Convert UUID arrays to name arrays for portfolio items
  const portfolio = await Promise.all((portfolioRaw || []).map(async (item) => {
    const portfolioItem = { ...item };
    
    // Convert platform UUIDs to names
    if (item.platforms_used && Array.isArray(item.platforms_used) && item.platforms_used.length > 0) {
      const platformNames = [];
      for (const platformId of item.platforms_used) {
        const { data: platform } = await supabaseAdmin
          .from('rpa_platforms')
          .select('name')
          .eq('id', platformId)
          .single();
        if (platform && platform.name) {
          platformNames.push(platform.name);
        }
      }
      portfolioItem.platforms_used = platformNames;
    }
    
    // Convert skill UUIDs to names
    if (item.skills_used && Array.isArray(item.skills_used) && item.skills_used.length > 0) {
      const skillNames = [];
      for (const skillId of item.skills_used) {
        const { data: skill } = await supabaseAdmin
          .from('skills')
          .select('name')
          .eq('id', skillId)
          .single();
        if (skill && skill.name) {
          skillNames.push(skill.name);
        }
      }
      portfolioItem.skills_used = skillNames;
    }
    
    return portfolioItem;
  }));

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
      state: profile.state,
      city: profile.city,
      timezone: profile.timezone,
      headline: profile.headline,
      bio: profile.bio,
      public_email: profile.public_email,
      website_url: profile.website_url,
      linkedin_url: profile.linkedin_url,
      resume_url: profile.resume_url,
      is_available: profile.is_available,
      is_verified: profile.is_verified,
      verification_badge: profile.verification_badge,
      created_at: profile.created_at,
      specialized_profile: specializedProfile,
      platforms: platforms || [],
      skills: skills || [],
      certifications: certifications || [],
      experience: experience || [],
      education: education || [],
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

  // Convert platform names to UUIDs
  let platformUuids = [];
  if (platforms_used && Array.isArray(platforms_used) && platforms_used.length > 0) {
    // Check if first item is a UUID (starts with valid UUID pattern) or a string
    const isUuid = platforms_used[0] && typeof platforms_used[0] === 'string' && 
                   /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(platforms_used[0]);
    
    if (!isUuid) {
      // Convert names to UUIDs by looking them up
      for (const platformName of platforms_used) {
        if (typeof platformName === 'string' && platformName.trim()) {
          const trimmedName = platformName.trim();
          // Try exact match first
          let { data: platform } = await supabaseAdmin
            .from('rpa_platforms')
            .select('id')
            .eq('name', trimmedName)
            .eq('is_active', true)
            .limit(1)
            .single();
          
          // If no exact match, try case-insensitive match
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
          }
        }
      }
    } else {
      platformUuids = platforms_used; // Already UUIDs
    }
  }

  // Convert skill names to UUIDs
  let skillUuids = [];
  if (skills_used && Array.isArray(skills_used) && skills_used.length > 0) {
    // Check if first item is a UUID or a string
    const isUuid = skills_used[0] && typeof skills_used[0] === 'string' && 
                   /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(skills_used[0]);
    
    if (!isUuid) {
      // Convert names to UUIDs by looking them up
      for (const skillName of skills_used) {
        if (typeof skillName === 'string' && skillName.trim()) {
          const trimmedName = skillName.trim();
          // Try exact match first
          let { data: skill } = await supabaseAdmin
            .from('skills')
            .select('id')
            .eq('name', trimmedName)
            .eq('is_active', true)
            .limit(1)
            .single();
          
          // If no exact match, try case-insensitive match
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
      }
    } else {
      skillUuids = skills_used; // Already UUIDs
    }
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
      platforms_used: platformUuids,
      skills_used: skillUuids,
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

// Update portfolio item
router.put('/me/portfolio/:portfolioId', authenticateToken, asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;
  const updates = { ...req.body };

  // Check ownership
  const { data: existing } = await supabaseAdmin
    .from('user_portfolio')
    .select('profile_id')
    .eq('id', portfolioId)
    .eq('profile_id', req.userId)
    .single();

  if (!existing) {
    return res.status(404).json({ error: 'Portfolio item not found' });
  }

  // Convert platform names to UUIDs if provided
  if (updates.platforms_used && Array.isArray(updates.platforms_used) && updates.platforms_used.length > 0) {
    const isUuid = updates.platforms_used[0] && typeof updates.platforms_used[0] === 'string' && 
                   /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updates.platforms_used[0]);
    
    if (!isUuid) {
      const platformUuids = [];
      for (const platformName of updates.platforms_used) {
        if (typeof platformName === 'string' && platformName.trim()) {
          const trimmedName = platformName.trim();
          // Try exact match first
          let { data: platform } = await supabaseAdmin
            .from('rpa_platforms')
            .select('id')
            .eq('name', trimmedName)
            .eq('is_active', true)
            .limit(1)
            .single();
          
          // If no exact match, try case-insensitive match
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
          }
        }
      }
      updates.platforms_used = platformUuids;
    }
  }

  // Convert skill names to UUIDs if provided
  if (updates.skills_used && Array.isArray(updates.skills_used) && updates.skills_used.length > 0) {
    const isUuid = updates.skills_used[0] && typeof updates.skills_used[0] === 'string' && 
                   /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updates.skills_used[0]);
    
    if (!isUuid) {
      const skillUuids = [];
      for (const skillName of updates.skills_used) {
        if (typeof skillName === 'string' && skillName.trim()) {
          const trimmedName = skillName.trim();
          // Try exact match first
          let { data: skill } = await supabaseAdmin
            .from('skills')
            .select('id')
            .eq('name', trimmedName)
            .eq('is_active', true)
            .limit(1)
            .single();
          
          // If no exact match, try case-insensitive match
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
      }
      updates.skills_used = skillUuids;
    }
  }

  const { data, error } = await supabaseAdmin
    .from('user_portfolio')
    .update(updates)
    .eq('id', portfolioId)
    .eq('profile_id', req.userId)
    .select()
    .single();

  if (error) {
    console.error('Portfolio update error:', error);
    return res.status(500).json({ error: 'Failed to update portfolio item' });
  }

  res.json({ message: 'Portfolio item updated successfully', portfolio: data });
}));

// Delete portfolio item
router.delete('/me/portfolio/:portfolioId', authenticateToken, asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;

  // Check ownership
  const { data: existing } = await supabaseAdmin
    .from('user_portfolio')
    .select('profile_id')
    .eq('id', portfolioId)
    .eq('profile_id', req.userId)
    .single();

  if (!existing) {
    return res.status(404).json({ error: 'Portfolio item not found' });
  }

  const { error } = await supabaseAdmin
    .from('user_portfolio')
    .delete()
    .eq('profile_id', req.userId)
    .eq('id', portfolioId);

  if (error) {
    console.error('Portfolio delete error:', error);
    return res.status(500).json({ error: 'Failed to delete portfolio item' });
  }

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

// Request verification
router.post('/me/request-verification', authenticateToken, asyncHandler(async (req, res) => {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', req.userId)
    .single();

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  if (profile.is_verified) {
    return res.status(400).json({ error: 'Profile is already verified' });
  }

  // Check profile completion (should be at least 80%)
  if (profile.profile_completion < 80) {
    return res.status(400).json({ 
      error: 'Profile completion must be at least 80% to request verification',
      profile_completion: profile.profile_completion
    });
  }

  // Check if there's already a pending request
  const { data: existingRequest } = await supabaseAdmin
    .from('verification_requests')
    .select('id, status')
    .eq('profile_id', profile.id)
    .eq('status', 'pending')
    .single();

  if (existingRequest) {
    return res.status(400).json({ 
      error: 'You already have a pending verification request',
      request_id: existingRequest.id
    });
  }

  // Create verification request record
  const { data: request, error: requestError } = await supabaseAdmin
    .from('verification_requests')
    .insert({
      profile_id: profile.id,
      user_id: req.user.user_id,
      profile_completion: profile.profile_completion,
      status: 'pending'
    })
    .select()
    .single();

  if (requestError) {
    console.error('Verification request creation error:', requestError);
    return res.status(500).json({ error: 'Failed to create verification request' });
  }

  res.json({
    message: 'Verification request submitted successfully. Our team will review your profile.',
    status: 'pending',
    request_id: request.id
  });
}));

// Verify profile (Admin only)
router.post('/:id/verify', authenticateToken, asyncHandler(async (req, res) => {
  // Check if user is admin
  const { data: adminUser } = await supabaseAdmin
    .from('users')
    .select('is_admin')
    .eq('id', req.user.user_id)
    .single();

  if (!adminUser || !adminUser.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { verification_badge } = req.body; // Optional: 'basic', 'pro', 'expert'

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

  res.json({
    message: 'Profile verified successfully',
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      is_verified: profile.is_verified,
      verification_badge: profile.verification_badge,
      verified_at: profile.verified_at
    }
  });
}));

export default router;




