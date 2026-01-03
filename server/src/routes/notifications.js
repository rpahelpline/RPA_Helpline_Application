import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginationValidation } from '../middleware/validate.js';
import { PAGINATION } from '../config/constants.js';

const router = express.Router();

// Get my notifications
router.get('/', authenticateToken, paginationValidation, asyncHandler(async (req, res) => {
  const { 
    page = PAGINATION.DEFAULT_PAGE, 
    limit = PAGINATION.DEFAULT_LIMIT,
    unread_only = 'false'
  } = req.query;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('notifications')
    .select(`
      *,
      from_user:profiles!notifications_from_user_id_fkey(id, full_name, avatar_url)
    `, { count: 'exact' })
    .eq('user_id', req.userId);

  if (unread_only === 'true') {
    query = query.eq('is_read', false);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: notifications, error, count } = await query;

  if (error) {
    console.error('Notifications fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }

  // Get unread count
  const { count: unreadCount } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.userId)
    .eq('is_read', false);

  res.json({
    notifications,
    unread_count: unreadCount || 0,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Mark notification as read
router.patch('/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ 
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', req.userId);

  if (error) {
    console.error('Notification update error:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }

  res.json({ message: 'Notification marked as read' });
}));

// Mark all notifications as read
router.patch('/read-all', authenticateToken, asyncHandler(async (req, res) => {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ 
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('user_id', req.userId)
    .eq('is_read', false);

  if (error) {
    console.error('Notifications update error:', error);
    return res.status(500).json({ error: 'Failed to mark notifications as read' });
  }

  res.json({ message: 'All notifications marked as read' });
}));

// Delete notification
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', req.userId);

  res.json({ message: 'Notification deleted' });
}));

// Delete all read notifications
router.delete('/', authenticateToken, asyncHandler(async (req, res) => {
  await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('user_id', req.userId)
    .eq('is_read', true);

  res.json({ message: 'Read notifications deleted' });
}));

// Helper function to create notification
export async function createNotification({
  userId,
  type,
  title,
  content,
  actionUrl,
  actionText,
  referenceType,
  referenceId,
  fromUserId
}) {
  try {
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        notification_type: type,
        title,
        content,
        action_url: actionUrl,
        action_text: actionText,
        reference_type: referenceType,
        reference_id: referenceId,
        from_user_id: fromUserId
      });
  } catch (error) {
    console.error('Create notification error:', error);
  }
}

export default router;


