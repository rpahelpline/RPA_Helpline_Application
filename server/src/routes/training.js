import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginationValidation, idValidation } from '../middleware/validate.js';
import { PAGINATION } from '../config/constants.js';

const router = express.Router();

// Get all training programs
router.get('/', optionalAuth, paginationValidation, asyncHandler(async (req, res) => {
  const { 
    page = PAGINATION.DEFAULT_PAGE, 
    limit = PAGINATION.DEFAULT_LIMIT,
    technology,
    level,
    format,
    min_price,
    max_price,
    search,
    sort = 'created_at',
    order = 'desc'
  } = req.query;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('training_programs')
    .select(`
      *,
      trainer:profiles!training_programs_trainer_id_fkey(id, full_name, avatar_url, company_name)
    `, { count: 'exact' })
    .eq('status', 'active');

  // Filters
  if (technology) {
    query = query.contains('technologies', [technology]);
  }

  if (level) {
    query = query.eq('level', level);
  }

  if (format) {
    query = query.eq('format', format);
  }

  if (min_price) {
    query = query.gte('price', parseFloat(min_price));
  }

  if (max_price) {
    query = query.lte('price', parseFloat(max_price));
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Sorting
  const validSortFields = ['created_at', 'price', 'duration_hours', 'rating', 'title'];
  const sortField = validSortFields.includes(sort) ? sort : 'created_at';
  query = query.order(sortField, { ascending: order === 'asc' });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: programs, error, count } = await query;

  if (error) {
    console.error('Error fetching training programs:', error);
    return res.status(500).json({ error: 'Failed to fetch training programs' });
  }

  res.json({
    programs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Get training program by ID
router.get('/:id', idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: program, error } = await supabaseAdmin
    .from('training_programs')
    .select(`
      *,
      trainer:profiles!training_programs_trainer_id_fkey(id, full_name, avatar_url, company_name, email, bio)
    `)
    .eq('id', id)
    .single();

  if (error || !program) {
    return res.status(404).json({ error: 'Training program not found' });
  }

  // Get enrollment count
  const { count: enrollmentCount } = await supabaseAdmin
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('program_id', id);

  program.enrollment_count = enrollmentCount || 0;

  // Get reviews
  const { data: reviews } = await supabaseAdmin
    .from('program_reviews')
    .select(`
      *,
      reviewer:profiles!program_reviews_reviewer_id_fkey(id, full_name, avatar_url)
    `)
    .eq('program_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  program.reviews = reviews || [];

  res.json({ program });
}));

// Create training program
router.post('/', authenticateToken, requireRole('trainer'), asyncHandler(async (req, res) => {
  const {
    title,
    description,
    technologies,
    level,
    format,
    duration_hours,
    price,
    curriculum,
    prerequisites,
    max_students,
    start_date,
    end_date
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  const { data: program, error } = await supabaseAdmin
    .from('training_programs')
    .insert({
      trainer_id: req.userId,
      title,
      description,
      technologies: technologies || [],
      level: level || 'beginner',
      format: format || 'online',
      duration_hours: duration_hours || null,
      price: price || 0,
      curriculum: curriculum || null,
      prerequisites: prerequisites || null,
      max_students: max_students || null,
      start_date: start_date || null,
      end_date: end_date || null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      trainer:profiles!training_programs_trainer_id_fkey(id, full_name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error creating training program:', error);
    return res.status(500).json({ error: 'Failed to create training program' });
  }

  res.status(201).json({ message: 'Training program created successfully', program });
}));

// Update training program
router.put('/:id', authenticateToken, idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check ownership
  const { data: existing } = await supabaseAdmin
    .from('training_programs')
    .select('trainer_id')
    .eq('id', id)
    .single();

  if (!existing || existing.trainer_id !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const updates = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  delete updates.trainer_id;

  const { data: program, error } = await supabaseAdmin
    .from('training_programs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating training program:', error);
    return res.status(500).json({ error: 'Failed to update training program' });
  }

  res.json({ message: 'Training program updated successfully', program });
}));

// Delete training program
router.delete('/:id', authenticateToken, idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check ownership
  const { data: existing } = await supabaseAdmin
    .from('training_programs')
    .select('trainer_id')
    .eq('id', id)
    .single();

  if (!existing || existing.trainer_id !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { error } = await supabaseAdmin
    .from('training_programs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting training program:', error);
    return res.status(500).json({ error: 'Failed to delete training program' });
  }

  res.json({ message: 'Training program deleted successfully' });
}));

// Enroll in training program
router.post('/:id/enroll', authenticateToken, idValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if program exists and is active
  const { data: program } = await supabaseAdmin
    .from('training_programs')
    .select('id, status, max_students, trainer_id')
    .eq('id', id)
    .single();

  if (!program) {
    return res.status(404).json({ error: 'Training program not found' });
  }

  if (program.status !== 'active') {
    return res.status(400).json({ error: 'Training program is not accepting enrollments' });
  }

  if (program.trainer_id === req.userId) {
    return res.status(400).json({ error: 'Cannot enroll in your own program' });
  }

  // Check for existing enrollment
  const { data: existingEnrollment } = await supabaseAdmin
    .from('enrollments')
    .select('id')
    .eq('program_id', id)
    .eq('student_id', req.userId)
    .single();

  if (existingEnrollment) {
    return res.status(409).json({ error: 'You are already enrolled in this program' });
  }

  // Check max students
  if (program.max_students) {
    const { count } = await supabaseAdmin
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', id);

    if (count >= program.max_students) {
      return res.status(400).json({ error: 'Program is full' });
    }
  }

  const { data: enrollment, error } = await supabaseAdmin
    .from('enrollments')
    .insert({
      program_id: id,
      student_id: req.userId,
      status: 'active',
      enrolled_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error enrolling in program:', error);
    return res.status(500).json({ error: 'Failed to enroll in program' });
  }

  res.status(201).json({ message: 'Enrolled successfully', enrollment });
}));

// Get my enrollments
router.get('/me/enrollments', authenticateToken, paginationValidation, asyncHandler(async (req, res) => {
  const { 
    page = PAGINATION.DEFAULT_PAGE, 
    limit = PAGINATION.DEFAULT_LIMIT,
    status
  } = req.query;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('enrollments')
    .select(`
      *,
      program:training_programs(id, title, technologies, level, format, price)
    `, { count: 'exact' })
    .eq('student_id', req.userId);

  if (status) {
    query = query.eq('status', status);
  }

  query = query
    .order('enrolled_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: enrollments, error, count } = await query;

  if (error) {
    console.error('Error fetching enrollments:', error);
    return res.status(500).json({ error: 'Failed to fetch enrollments' });
  }

  res.json({
    enrollments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Get my training programs (as trainer)
router.get('/me/programs', authenticateToken, requireRole('trainer'), paginationValidation, asyncHandler(async (req, res) => {
  const { 
    page = PAGINATION.DEFAULT_PAGE, 
    limit = PAGINATION.DEFAULT_LIMIT,
    status
  } = req.query;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('training_programs')
    .select('*', { count: 'exact' })
    .eq('trainer_id', req.userId);

  if (status) {
    query = query.eq('status', status);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: programs, error, count } = await query;

  if (error) {
    console.error('Error fetching training programs:', error);
    return res.status(500).json({ error: 'Failed to fetch training programs' });
  }

  res.json({
    programs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

export default router;




