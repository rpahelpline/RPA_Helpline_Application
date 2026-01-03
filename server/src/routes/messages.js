import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginationValidation } from '../middleware/validate.js';
import { PAGINATION } from '../config/constants.js';

const router = express.Router();

// Get all conversations
router.get('/conversations', authenticateToken, paginationValidation, asyncHandler(async (req, res) => {
  const { 
    page = PAGINATION.DEFAULT_PAGE, 
    limit = PAGINATION.DEFAULT_LIMIT 
  } = req.query;

  const offset = (page - 1) * limit;

  // Get conversations where user is participant
  const { data: participations, error: partError } = await supabaseAdmin
    .from('conversation_participants')
    .select('conversation_id, unread_count, last_read_at, is_muted')
    .eq('user_id', req.userId)
    .eq('is_active', true);

  if (partError) {
    console.error('Conversations fetch error:', partError);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }

  const conversationIds = participations.map(p => p.conversation_id);

  if (conversationIds.length === 0) {
    return res.json({
      conversations: [],
      pagination: { page: 1, limit, total: 0, totalPages: 0 }
    });
  }

  // Get conversations with details
  const { data: conversations, count } = await supabaseAdmin
    .from('conversations')
    .select('*', { count: 'exact' })
    .in('id', conversationIds)
    .eq('status', 'active')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  // Get other participants for each conversation
  const conversationsWithParticipants = await Promise.all(
    conversations.map(async (conv) => {
      const { data: participants } = await supabaseAdmin
        .from('conversation_participants')
        .select(`
          user_id,
          role,
          user:profiles!conversation_participants_user_id_fkey(id, full_name, avatar_url, user_type)
        `)
        .eq('conversation_id', conv.id)
        .neq('user_id', req.userId);

      const participation = participations.find(p => p.conversation_id === conv.id);

      return {
        ...conv,
        participants: participants.map(p => p.user),
        unread_count: participation?.unread_count || 0,
        is_muted: participation?.is_muted || false
      };
    })
  );

  res.json({
    conversations: conversationsWithParticipants,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Get single conversation with messages
router.get('/conversations/:id', authenticateToken, paginationValidation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    page = PAGINATION.DEFAULT_PAGE, 
    limit = 50
  } = req.query;

  const offset = (page - 1) * limit;

  // Check if user is participant
  const { data: participation } = await supabaseAdmin
    .from('conversation_participants')
    .select('*')
    .eq('conversation_id', id)
    .eq('user_id', req.userId)
    .single();

  if (!participation) {
    return res.status(403).json({ error: 'You are not a participant in this conversation' });
  }

  // Get conversation
  const { data: conversation } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single();

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Get messages
  const { data: messages, count } = await supabaseAdmin
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
    `, { count: 'exact' })
    .eq('conversation_id', id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Get participants
  const { data: participants } = await supabaseAdmin
    .from('conversation_participants')
    .select(`
      user_id,
      role,
      user:profiles!conversation_participants_user_id_fkey(id, full_name, avatar_url, user_type)
    `)
    .eq('conversation_id', id)
    .eq('is_active', true);

  // Mark messages as read
  await supabaseAdmin
    .from('conversation_participants')
    .update({ 
      last_read_at: new Date().toISOString(),
      unread_count: 0
    })
    .eq('conversation_id', id)
    .eq('user_id', req.userId);

  res.json({
    conversation: {
      ...conversation,
      participants: participants.map(p => ({ ...p.user, role: p.role }))
    },
    messages: messages.reverse(), // Oldest first for display
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Start new conversation
router.post('/conversations', authenticateToken, asyncHandler(async (req, res) => {
  const { 
    recipient_id,
    subject,
    message,
    conversation_type = 'direct',
    project_id,
    job_id
  } = req.body;

  if (!recipient_id || !message) {
    return res.status(400).json({ error: 'Recipient and message are required' });
  }

  if (recipient_id === req.userId) {
    return res.status(400).json({ error: 'Cannot start conversation with yourself' });
  }

  // Check if direct conversation already exists between users
  if (conversation_type === 'direct') {
    const { data: existingConvs } = await supabaseAdmin
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', req.userId);

    if (existingConvs && existingConvs.length > 0) {
      const convIds = existingConvs.map(c => c.conversation_id);
      
      const { data: recipientConvs } = await supabaseAdmin
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', recipient_id)
        .in('conversation_id', convIds);

      if (recipientConvs && recipientConvs.length > 0) {
        // Check if it's a direct conversation
        const { data: directConv } = await supabaseAdmin
          .from('conversations')
          .select('id')
          .in('id', recipientConvs.map(c => c.conversation_id))
          .eq('conversation_type', 'direct')
          .single();

        if (directConv) {
          // Add message to existing conversation
          const { data: newMessage } = await supabaseAdmin
            .from('messages')
            .insert({
              conversation_id: directConv.id,
              sender_id: req.userId,
              content: message
            })
            .select()
            .single();

          // Update conversation
          await supabaseAdmin
            .from('conversations')
            .update({ 
              last_message_at: new Date().toISOString(),
              last_message_preview: message.substring(0, 100)
            })
            .eq('id', directConv.id);

          // Update unread count for recipient
          await supabaseAdmin
            .from('conversation_participants')
            .update({ unread_count: supabaseAdmin.raw('unread_count + 1') })
            .eq('conversation_id', directConv.id)
            .eq('user_id', recipient_id);

          return res.json({
            message: 'Message sent',
            conversation_id: directConv.id,
            new_message: newMessage
          });
        }
      }
    }
  }

  // Create new conversation
  const { data: conversation, error: convError } = await supabaseAdmin
    .from('conversations')
    .insert({
      conversation_type,
      subject,
      project_id,
      job_id,
      last_message_at: new Date().toISOString(),
      last_message_preview: message.substring(0, 100)
    })
    .select()
    .single();

  if (convError) {
    console.error('Conversation creation error:', convError);
    return res.status(500).json({ error: 'Failed to create conversation' });
  }

  // Add participants
  await supabaseAdmin
    .from('conversation_participants')
    .insert([
      { conversation_id: conversation.id, user_id: req.userId },
      { conversation_id: conversation.id, user_id: recipient_id, unread_count: 1 }
    ]);

  // Add first message
  const { data: firstMessage } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      sender_id: req.userId,
      content: message
    })
    .select()
    .single();

  res.status(201).json({
    message: 'Conversation started',
    conversation,
    first_message: firstMessage
  });
}));

// Send message
router.post('/conversations/:id/messages', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, reply_to_id, attachments } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  // Check if user is participant
  const { data: participation } = await supabaseAdmin
    .from('conversation_participants')
    .select('*')
    .eq('conversation_id', id)
    .eq('user_id', req.userId)
    .single();

  if (!participation) {
    return res.status(403).json({ error: 'You are not a participant in this conversation' });
  }

  // Create message
  const { data: message, error } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: id,
      sender_id: req.userId,
      content,
      reply_to_id,
      attachments: attachments || null
    })
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Message creation error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }

  // Update conversation
  await supabaseAdmin
    .from('conversations')
    .update({ 
      last_message_at: new Date().toISOString(),
      last_message_preview: content.substring(0, 100)
    })
    .eq('id', id);

  // Update unread count for other participants
  await supabaseAdmin
    .from('conversation_participants')
    .update({ unread_count: supabaseAdmin.raw('unread_count + 1') })
    .eq('conversation_id', id)
    .neq('user_id', req.userId);

  res.status(201).json({ message });
}));

// Delete message (soft delete)
router.delete('/conversations/:convId/messages/:msgId', authenticateToken, asyncHandler(async (req, res) => {
  const { convId, msgId } = req.params;

  // Check ownership
  const { data: message } = await supabaseAdmin
    .from('messages')
    .select('sender_id')
    .eq('id', msgId)
    .eq('conversation_id', convId)
    .single();

  if (!message || message.sender_id !== req.userId) {
    return res.status(403).json({ error: 'You can only delete your own messages' });
  }

  await supabaseAdmin
    .from('messages')
    .update({ 
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', msgId);

  res.json({ message: 'Message deleted' });
}));

// Mute/unmute conversation
router.patch('/conversations/:id/mute', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_muted } = req.body;

  await supabaseAdmin
    .from('conversation_participants')
    .update({ is_muted })
    .eq('conversation_id', id)
    .eq('user_id', req.userId);

  res.json({ message: is_muted ? 'Conversation muted' : 'Conversation unmuted' });
}));

export default router;


