import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// Get all RPA platforms (cached for 5 minutes - rarely changes)
router.get('/platforms', cacheMiddleware(300), asyncHandler(async (req, res) => {
  const { data: platforms, error } = await supabaseAdmin
    .from('rpa_platforms')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    console.error('Platforms fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch platforms' });
  }

  res.json({ platforms });
}));

// Get single platform
router.get('/platforms/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const { data: platform, error } = await supabaseAdmin
    .from('rpa_platforms')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !platform) {
    return res.status(404).json({ error: 'Platform not found' });
  }

  // Get related certifications
  const { data: certifications } = await supabaseAdmin
    .from('certifications')
    .select('*')
    .eq('platform_id', platform.id)
    .eq('is_active', true);

  // Get freelancer count for this platform
  const { count: freelancerCount } = await supabaseAdmin
    .from('user_platforms')
    .select('*', { count: 'exact', head: true })
    .eq('platform_id', platform.id);

  res.json({
    platform: {
      ...platform,
      certifications: certifications || [],
      freelancer_count: freelancerCount || 0
    }
  });
}));

// Get all skill categories with skills (cached for 5 minutes)
router.get('/skills', cacheMiddleware(300), asyncHandler(async (req, res) => {
  const { category } = req.query;

  // Get categories
  const { data: categories, error: catError } = await supabaseAdmin
    .from('skill_categories')
    .select('*')
    .order('display_order');

  if (catError) {
    console.error('Categories fetch error:', catError);
    return res.status(500).json({ error: 'Failed to fetch skill categories' });
  }

  // Get skills
  let skillsQuery = supabaseAdmin
    .from('skills')
    .select('*')
    .eq('is_active', true);

  if (category) {
    const cat = categories.find(c => c.slug === category);
    if (cat) {
      skillsQuery = skillsQuery.eq('category_id', cat.id);
    }
  }

  const { data: skills, error: skillError } = await skillsQuery.order('name');

  if (skillError) {
    console.error('Skills fetch error:', skillError);
    return res.status(500).json({ error: 'Failed to fetch skills' });
  }

  // Group skills by category
  const categorizedSkills = categories.map(cat => ({
    ...cat,
    skills: skills.filter(s => s.category_id === cat.id)
  }));

  res.json({
    categories: categorizedSkills,
    all_skills: skills
  });
}));

// Get all certifications (cached for 5 minutes)
router.get('/certifications', cacheMiddleware(300), asyncHandler(async (req, res) => {
  const { platform, level } = req.query;

  let query = supabaseAdmin
    .from('certifications')
    .select(`
      *,
      platform:rpa_platforms(id, name, slug, logo_url)
    `)
    .eq('is_active', true);

  if (platform) {
    const { data: plat } = await supabaseAdmin
      .from('rpa_platforms')
      .select('id')
      .eq('slug', platform)
      .single();
    
    if (plat) {
      query = query.eq('platform_id', plat.id);
    }
  }

  if (level) {
    query = query.eq('level', level);
  }

  const { data: certifications, error } = await query.order('name');

  if (error) {
    console.error('Certifications fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch certifications' });
  }

  res.json({ certifications });
}));

// Get industries list (cached for 1 hour - static data)
router.get('/industries', cacheMiddleware(3600), asyncHandler(async (req, res) => {
  const industries = [
    'Banking & Finance',
    'Healthcare',
    'Insurance',
    'Retail & E-commerce',
    'Manufacturing',
    'Telecommunications',
    'Energy & Utilities',
    'Government',
    'Education',
    'Real Estate',
    'Logistics & Supply Chain',
    'Pharmaceuticals',
    'Automotive',
    'Media & Entertainment',
    'Hospitality',
    'Technology',
    'Legal',
    'Consulting',
    'Other'
  ];

  res.json({ industries });
}));

// Get company sizes (cached for 1 hour - static data)
router.get('/company-sizes', cacheMiddleware(3600), asyncHandler(async (req, res) => {
  const sizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1000+', label: '1000+ employees' }
  ];

  res.json({ sizes });
}));

// Get experience levels
router.get('/experience-levels', asyncHandler(async (req, res) => {
  const levels = [
    { value: 'entry', label: 'Entry Level (0-1 years)' },
    { value: 'junior', label: 'Junior (1-3 years)' },
    { value: 'mid', label: 'Mid-Level (3-5 years)' },
    { value: 'senior', label: 'Senior (5-8 years)' },
    { value: 'lead', label: 'Lead/Principal (8-12 years)' },
    { value: 'architect', label: 'Architect/Expert (12+ years)' }
  ];

  res.json({ levels });
}));

// Search across platforms, skills, certifications
router.get('/search', asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  // Search platforms
  const { data: platforms } = await supabaseAdmin
    .from('rpa_platforms')
    .select('id, name, slug, logo_url')
    .eq('is_active', true)
    .ilike('name', `%${q}%`)
    .limit(5);

  // Search skills
  const { data: skills } = await supabaseAdmin
    .from('skills')
    .select('id, name, slug')
    .eq('is_active', true)
    .ilike('name', `%${q}%`)
    .limit(10);

  // Search certifications
  const { data: certifications } = await supabaseAdmin
    .from('certifications')
    .select('id, name, slug, level')
    .eq('is_active', true)
    .ilike('name', `%${q}%`)
    .limit(5);

  res.json({
    platforms: platforms || [],
    skills: skills || [],
    certifications: certifications || []
  });
}));

export default router;




