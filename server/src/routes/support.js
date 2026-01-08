import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for support submissions (prevent spam)
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 submissions per 15 minutes per IP
  message: { error: 'Too many submissions. Please wait before submitting again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Submit support inquiry (public endpoint)
router.post('/submit', submitLimiter, asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validation
  if (!name || !email || !message) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      message: 'Name, email, and message are required'
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      error: 'Invalid email address'
    });
  }

  // Message length validation
  if (message.trim().length < 10) {
    return res.status(400).json({ 
      error: 'Message too short',
      message: 'Message must be at least 10 characters long'
    });
  }

  // Get client IP and user agent
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';

  try {
    // Insert submission
    const { data, error } = await supabaseAdmin
      .from('support_submissions')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject?.trim() || 'General Inquiry',
        message: message.trim(),
        status: 'pending',
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single();

    if (error) {
      console.error('Support submission error:', error);
      return res.status(500).json({ 
        error: 'Failed to submit your message',
        message: 'Please try again later'
      });
    }

    res.status(201).json({
      message: 'Your message has been submitted successfully',
      id: data.id
    });
  } catch (error) {
    console.error('Support submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit your message',
      message: 'Please try again later'
    });
  }
}));

// Get all support submissions (admin only)
router.get('/submissions', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status, 
    search 
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Build query
  let query = supabaseAdmin
    .from('support_submissions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  // Filter by status
  if (status && ['pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
    query = query.eq('status', status);
  }

  // Search in name, email, subject, or message
  if (search && search.trim()) {
    const searchTerm = search.trim();
    query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching support submissions:', error);
    return res.status(500).json({ error: 'Failed to fetch support submissions' });
  }

  res.json({
    submissions: data || [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / parseInt(limit))
    }
  });
}));

// Get single submission (admin only)
router.get('/submissions/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('support_submissions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Submission not found' });
    }
    console.error('Error fetching support submission:', error);
    return res.status(500).json({ error: 'Failed to fetch submission' });
  }

  res.json(data);
}));

// Update submission status (admin only)
router.patch('/submissions/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body;

  // Validate status
  if (status && !['pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const updateData = {};
  if (status) updateData.status = status;
  if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

  // If marking as resolved, set resolved_by and resolved_at
  if (status === 'resolved') {
    updateData.resolved_by = req.user.user_id;
    updateData.resolved_at = new Date().toISOString();
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('support_submissions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Submission not found' });
    }
    console.error('Error updating support submission:', error);
    return res.status(500).json({ error: 'Failed to update submission' });
  }

  res.json(data);
}));

// Delete submission (admin only)
router.delete('/submissions/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from('support_submissions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting support submission:', error);
    return res.status(500).json({ error: 'Failed to delete submission' });
  }

  res.json({ message: 'Submission deleted successfully' });
}));

export default router;

