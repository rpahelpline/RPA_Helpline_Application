import { memo, useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { messageApi, profileApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ArrowLeft, MessageSquare, Send, Search, MoreVertical,
  Phone, Video, Info, CheckCheck, Clock, User
} from 'lucide-react';

// ============================================================================
// CONVERSATION ITEM COMPONENT
// ============================================================================
const ConversationItem = memo(({ conversation, isActive, onClick }) => {
  const otherParticipant = conversation.participants?.find(p => !p.is_current_user)?.user;
  const lastMessage = conversation.last_message;

  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all border-b border-border/50 ${
        isActive 
          ? 'bg-primary/10 border-l-2 border-l-primary' 
          : 'hover:bg-card'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {otherParticipant?.avatar_url ? (
            <img src={otherParticipant.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            otherParticipant?.full_name?.charAt(0)?.toUpperCase() || 'U'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-display font-bold text-foreground truncate text-sm">
              {otherParticipant?.full_name || 'Unknown User'}
            </h4>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {lastMessage?.created_at 
                ? new Date(lastMessage.created_at).toLocaleDateString() 
                : ''}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-1">
            {lastMessage?.content || 'No messages yet'}
          </p>
        </div>
        {conversation.unread_count > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs font-mono">
            {conversation.unread_count}
          </span>
        )}
      </div>
    </div>
  );
});
ConversationItem.displayName = 'ConversationItem';

// ============================================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================================
const MessageBubble = memo(({ message, isOwn }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
      <div
        className={`px-4 py-2 rounded-2xl ${
          isOwn
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-card border border-border rounded-bl-md'
        }`}
      >
        <p className="text-sm">{message.content}</p>
      </div>
      <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <span className="text-xs text-muted-foreground">
          {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
        {isOwn && message.is_read && (
          <CheckCheck className="w-3 h-3 text-primary" />
        )}
      </div>
    </div>
  </div>
));
MessageBubble.displayName = 'MessageBubble';

// ============================================================================
// MAIN MESSAGES PAGE
// ============================================================================
export const Messages = memo(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const toast = useToast();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/sign-in');
    }
  }, [isAuthenticated, navigate]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const response = await messageApi.getConversations({ limit: 50 });
        setConversations(response.conversations || []);
        
        // Check if we should start a new conversation with a specific user
        const targetUserId = searchParams.get('userId');
        if (targetUserId) {
          // Check if conversation already exists
          const existingConv = response.conversations?.find(c => 
            c.participants?.some(p => p.user?.id === targetUserId)
          );
          if (existingConv) {
            setActiveConversation(existingConv);
          } else {
            // Create new conversation placeholder
            try {
              const profileRes = await profileApi.getById(targetUserId);
              if (profileRes.profile) {
                setActiveConversation({
                  id: 'new',
                  participants: [
                    { user: profileRes.profile, is_current_user: false },
                    { user: user, is_current_user: true }
                  ],
                  target_user_id: targetUserId
                });
              }
            } catch (e) {
              console.error('Failed to load target user:', e);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, searchParams, user]);

  // Fetch messages when conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation || activeConversation.id === 'new') {
        setMessages([]);
        return;
      }

      setLoadingMessages(true);
      try {
        const response = await messageApi.getConversation(activeConversation.id, { limit: 100 });
        setMessages(response.messages || []);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      if (activeConversation.id === 'new') {
        // Start new conversation
        const response = await messageApi.startConversation({
          recipient_id: activeConversation.target_user_id,
          initial_message: newMessage
        });
        
        if (response.conversation) {
          setActiveConversation(response.conversation);
          setConversations(prev => [response.conversation, ...prev]);
          setMessages([response.message]);
        }
      } else {
        // Send to existing conversation
        const response = await messageApi.sendMessage(activeConversation.id, {
          content: newMessage
        });
        
        if (response.message) {
          setMessages(prev => [...prev, response.message]);
        }
      }
      
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      toast.error(error.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const otherParticipant = activeConversation?.participants?.find(p => !p.is_current_user)?.user;

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const other = conv.participants?.find(p => !p.is_current_user)?.user;
    return other?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="tech-panel border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-display font-bold text-foreground tracking-wider">MESSAGES</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r border-border flex flex-col bg-card/30">
          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={activeConversation?.id === conv.id}
                  onClick={() => setActiveConversation(conv)}
                />
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No conversations yet
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                    {otherParticipant?.avatar_url ? (
                      <img src={otherParticipant.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      otherParticipant?.full_name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground">
                      {otherParticipant?.full_name || 'Unknown User'}
                    </h3>
                    {otherParticipant?.headline && (
                      <p className="text-xs text-muted-foreground">{otherParticipant.headline}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/profile/${otherParticipant?.id}`)}
                  >
                    <User className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                  </div>
                ) : messages.length > 0 ? (
                  <>
                    {messages.map(message => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={message.sender_id === user?.id}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card/30">
                <div className="flex items-center gap-3">
                  <Input
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-background"
                    disabled={sending}
                  />
                  <Button type="submit" disabled={!newMessage.trim() || sending}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-display font-bold text-foreground mb-2">Select a Conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

Messages.displayName = 'Messages';


