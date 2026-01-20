import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageApi, notificationApi, freelancerApi, jobApi, projectApi, profileApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PortfolioEditModal } from '../../components/profile/PortfolioEditModal';
import {
  MessageSquare, Send, Bell, CheckCheck, Trash2, Briefcase, FileText,
  Clock, CheckCircle, XCircle, AlertCircle, Eye, Calendar, Building2,
  MapPin, ArrowRight, Target, Plus, ExternalLink, Settings
} from 'lucide-react';

// ============================================================================
// MESSAGES CONTENT
// ============================================================================
export const MessagesContent = memo(({ onClose }) => {
  const { user, isAuthenticated } = useAuthStore();
  const toast = useToast();
  const messagesEndRef = useRef(null);
  const fetchingRef = useRef(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Prevent duplicate calls
    if (fetchingRef.current) return;

    const fetchConversations = async () => {
      fetchingRef.current = true;
      setLoading(true);
      let cancelled = false;

      try {
        const response = await messageApi.getConversations({ limit: 20 });
        if (!cancelled) {
          setConversations(response.conversations || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch conversations:', error);
          setConversations([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          fetchingRef.current = false;
        }
      }

      return () => {
        cancelled = true;
      };
    };

    fetchConversations();
  }, [isAuthenticated]);

  // Fetch messages function (reusable for initial load and polling)
  const fetchMessages = useCallback(async () => {
    if (!activeConversation || activeConversation.id === 'new') {
      setMessages([]);
      return;
    }

    try {
      const response = await messageApi.getConversation(activeConversation.id, { limit: 50 });
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, [activeConversation]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Poll for new messages every 5 seconds when viewing a conversation
  useEffect(() => {
    if (!activeConversation || activeConversation.id === 'new') return;

    const pollInterval = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollInterval);
  }, [activeConversation, fetchMessages]);

  // Poll for conversation list updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const pollConversations = async () => {
      try {
        const response = await messageApi.getConversations({ limit: 20 });
        setConversations(response.conversations || []);
      } catch (error) {
        console.debug('Failed to poll conversations:', error);
      }
    };

    const interval = setInterval(pollConversations, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      if (activeConversation.id === 'new') {
        const response = await messageApi.startConversation({
          recipient_id: activeConversation.target_user_id,
          initial_message: newMessage,
        });

        if (response.conversation) {
          setActiveConversation(response.conversation);
          setMessages(response.message ? [response.message] : []);
        }
      } else {
        await messageApi.sendMessage(activeConversation.id, { content: newMessage });
        const response = await messageApi.getConversation(activeConversation.id, { limit: 50 });
        setMessages(response.messages || []);
      }
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const otherParticipant = activeConversation?.participants?.find(p => !p.is_current_user)?.user;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display font-bold text-foreground">MESSAGES</h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Conversations List */}
        <div className="w-80 border-r border-border pr-4 overflow-y-auto">
          {loading ? (
            <LoadingSpinner />
          ) : conversations.length > 0 ? (
            <div className="space-y-1">
              {conversations.map(conv => {
                const other = conv.participants?.find(p => !p.is_current_user)?.user;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      activeConversation?.id === conv.id
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                        {other?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-sm truncate">{other?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.last_message?.content || 'No messages'}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No conversations</p>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeConversation ? (
            <>
              <div className="border-b border-border pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                    {otherParticipant?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-display font-bold">{otherParticipant?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">Active now</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map(msg => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isOwn ? 'bg-primary text-white' : 'bg-card border border-border'} px-4 py-2 rounded-2xl`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!newMessage.trim() || sending}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
MessagesContent.displayName = 'MessagesContent';

// ============================================================================
// NOTIFICATIONS CONTENT
// ============================================================================
export const NotificationsContent = memo(({ onClose }) => {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await notificationApi.getAll({ limit: 100 });
        setNotifications(response.notifications || []);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">NOTIFICATIONS</h2>
          <p className="text-sm text-muted-foreground">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark All Read
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-mono transition-all ${
            filter === 'all' ? 'bg-primary text-white' : 'tech-panel text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-full text-sm font-mono transition-all ${
            filter === 'unread' ? 'bg-primary text-white' : 'tech-panel text-muted-foreground hover:text-foreground'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <Card className="tech-panel border-border bg-card/50 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="divide-y divide-border/50">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-card/50 transition-colors ${!notification.is_read ? 'bg-primary/5' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-display font-bold text-sm mb-1">{notification.title || 'Notification'}</h4>
                    <p className={`text-sm ${notification.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {notification.message || notification.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.is_read && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarkRead(notification.id)}>
                        <CheckCheck className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(notification.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CardContent className="p-12 text-center">
            <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-display font-bold text-foreground mb-2">No Notifications</h3>
            <p className="text-muted-foreground">
              {filter === 'unread' ? "You're all caught up!" : "You don't have any notifications yet."}
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
});
NotificationsContent.displayName = 'NotificationsContent';

// ============================================================================
// OPPORTUNITIES CONTENT (Projects for Freelancers)
// ============================================================================
export const OpportunitiesContent = memo(({ onClose }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const response = await projectApi.getAll({ status: 'open', limit: 20 });
        setProjects(response.projects || []);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        toast.error('Failed to load opportunities');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  return (
    <div className="w-full flex flex-col min-h-[600px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground tracking-wider mb-1">OPPORTUNITIES</h2>
          <p className="text-sm text-muted-foreground">Browse available RPA projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/projects')} className="font-mono text-xs">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="font-mono text-xs">
              Close
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <Card
              key={project.id}
              className="tech-panel border-border bg-card/50 hover-lift cursor-pointer transition-all duration-300 group"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {project.title}
                    </h3>
                    {project.client?.full_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <Building2 className="w-3 h-3" />
                        {project.client.full_name}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{project.description}</p>
                <div className="flex items-center gap-3 text-xs">
                  {project.budget_min && project.budget_max && (
                    <span className="flex items-center gap-1 text-foreground font-mono font-semibold">
                      <Briefcase className="w-3 h-3" />
                      ₹{project.budget_min.toLocaleString()} - ₹{project.budget_max.toLocaleString()}
                    </span>
                  )}
                  {project.urgency && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        project.urgency === 'high' ? 'border-primary text-primary' : 
                        project.urgency === 'medium' ? 'border-secondary text-secondary' : 
                        'border-muted-foreground text-muted-foreground'
                      }`}
                    >
                      {project.urgency.toUpperCase()}
                    </Badge>
                  )}
                </div>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {project.technologies.slice(0, 3).map((tech, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {project.technologies.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.technologies.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="tech-panel border-border bg-card/50">
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-display font-bold text-foreground mb-2">No Opportunities Found</h3>
            <p className="text-muted-foreground mb-4">Check back later for new projects</p>
            <Button onClick={() => navigate('/projects')} variant="outline" className="font-mono text-xs">
              Browse All Projects <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
OpportunitiesContent.displayName = 'OpportunitiesContent';

// ============================================================================
// APPLICATIONS CONTENT
// ============================================================================
export const ApplicationsContent = memo(({ onClose }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchApplications = async () => {
      setLoading(true);
      try {
        // All applying roles can fetch their applications
        const applyingRoles = ['freelancer', 'job_seeker', 'jobseeker', 'ba_pm', 'trainer', 'developer'];
        if (applyingRoles.includes(user?.user_type)) {
          const response = await freelancerApi.getMyApplications({ limit: 50 });
          setApplications(response.applications || []);
        } else {
          // For hiring roles, set empty array
          setApplications([]);
        }
      } catch (error) {
        console.error('Failed to fetch applications:', error);
        // Don't show error toast - just show empty state
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user?.user_type, user?.id]);

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { color: 'bg-yellow-500/20 text-yellow-500', icon: Clock, label: 'PENDING' };
      case 'reviewed':
        return { color: 'bg-blue-500/20 text-blue-500', icon: Eye, label: 'REVIEWED' };
      case 'shortlisted':
        return { color: 'bg-green-500/20 text-green-500', icon: CheckCircle, label: 'SHORTLISTED' };
      case 'rejected':
        return { color: 'bg-red-500/20 text-red-500', icon: XCircle, label: 'REJECTED' };
      default:
        return { color: 'bg-muted text-muted-foreground', icon: AlertCircle, label: status?.toUpperCase() || 'UNKNOWN' };
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display font-bold text-foreground">APPLICATIONS</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/applications')}>
            View All
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : applications.length > 0 ? (
        <div className="space-y-4 overflow-y-auto flex-1">
          {applications.map(app => {
            const statusConfig = getStatusConfig(app.status);
            const StatusIcon = statusConfig.icon;
            const item = app.job || app.project;
            const employer = app.job ? item?.employer : item?.client;

            return (
              <Card
                key={app.id}
                className="tech-panel border-border bg-card/50 hover-lift cursor-pointer"
                onClick={() => navigate(`/applications`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${statusConfig.color} font-mono text-xs`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        {app.job && <Badge variant="outline" className="text-xs">JOB</Badge>}
                        {app.project && <Badge variant="outline" className="text-xs">PROJECT</Badge>}
                      </div>
                      <h3 className="font-display font-bold text-foreground mb-2">{item?.title || 'Untitled'}</h3>
                      {employer && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {employer.company_name || employer.full_name || 'Company'}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Applied on {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="tech-panel border-border bg-card/50">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-display font-bold text-foreground mb-2">No Applications</h3>
            <p className="text-muted-foreground">You haven't applied to any jobs or projects yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
ApplicationsContent.displayName = 'ApplicationsContent';

// ============================================================================
// PORTFOLIO CONTENT
// ============================================================================
export const PortfolioContent = memo(({ onClose }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    mountedRef.current = true;

    const fetchProfile = async () => {
      // Prevent duplicate calls
      if (fetchingRef.current) return;
      
      fetchingRef.current = true;
      setLoading(true);

      try {
        const response = await profileApi.getMyProfile();
        if (!cancelled && mountedRef.current) {
          console.log('Portfolio API Response:', response);
          console.log('Portfolio data:', response.profile?.portfolio);
          console.log('Portfolio type:', typeof response.profile?.portfolio);
          console.log('Portfolio is array:', Array.isArray(response.profile?.portfolio));
          setProfile(response.profile);
        }
      } catch (error) {
        if (!cancelled && mountedRef.current) {
          console.error('Failed to fetch profile:', error);
          // Don't show error for rate limiting - it's temporary
          if (error.status !== 429) {
            toast.error('Failed to load portfolio');
          }
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
          fetchingRef.current = false;
        }
      }
    };

    fetchProfile();
    
    return () => {
      cancelled = true;
      mountedRef.current = false;
      fetchingRef.current = false;
    };
  }, []); // Empty dependency array - only fetch once on mount

  const handleDelete = async (portfolioId) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;
    
    setDeleting(portfolioId);
    try {
      await profileApi.removePortfolio(portfolioId);
      toast.success('Portfolio item deleted successfully');
      // Refresh portfolio by fetching again
      fetchingRef.current = false;
      setLoading(true);
      const response = await profileApi.getMyProfile();
      setProfile(response.profile);
      setLoading(false);
    } catch (error) {
      console.error('Failed to delete portfolio item:', error);
      toast.error('Failed to delete portfolio item');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="w-full flex flex-col min-h-[600px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground tracking-wider mb-1">PORTFOLIO</h2>
          <p className="text-sm text-muted-foreground">Showcase your RPA projects and achievements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setEditingItem(null);
              setShowEditModal(true);
            }} 
            className="font-mono text-xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="font-mono text-xs">
              Close
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : profile?.portfolio && Array.isArray(profile.portfolio) && profile.portfolio.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Add New Portfolio Item Card */}
          <Card 
            className="tech-panel border-2 border-dashed border-primary/30 bg-card/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group cursor-pointer"
            onClick={() => {
              setEditingItem(null);
              setShowEditModal(true);
            }}
          >
            <CardContent className="p-5 flex flex-col items-center justify-center min-h-[280px] text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:border-primary/50 group-hover:scale-110 transition-all duration-300">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                Add New Project
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Showcase your RPA work and achievements
              </p>
              <Badge variant="outline" className="text-xs font-mono border-primary/30 text-primary">
                Click to Add
              </Badge>
            </CardContent>
          </Card>
          
          {profile.portfolio.map((item, index) => (
            <Card key={item.id || index} className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 group relative">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h4 className="font-display font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.is_featured && (
                      <Badge variant="default" className="text-xs">Featured</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem(item);
                        setShowEditModal(true);
                      }}
                      title="Edit"
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      disabled={deleting === item.id}
                      title="Delete"
                    >
                      {deleting === item.id ? (
                        <LoadingSpinner className="w-3 h-3" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{item.description}</p>
                )}
                <div className="space-y-2">
                  {item.project_type && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Briefcase className="w-3 h-3" />
                      <span>{item.project_type}</span>
                    </div>
                  )}
                  {item.completion_date && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Completed {new Date(item.completion_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {item.platforms_used && item.platforms_used.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.platforms_used.slice(0, 3).map((platform, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                      {item.platforms_used.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.platforms_used.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                  {item.project_url && (
                    <a
                      href={item.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Project <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {item.demo_url && (
                    <a
                      href={item.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-secondary hover:underline flex items-center gap-1 font-mono"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Demo <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {item.github_url && (
                    <a
                      href={item.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-mono"
                      onClick={(e) => e.stopPropagation()}
                    >
                      GitHub <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md w-full">
            <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-12 h-12 text-primary opacity-70" />
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground mb-3">Start Building Your Portfolio</h3>
            <p className="text-muted-foreground mb-8">Showcase your RPA projects and achievements to attract opportunities</p>
            <Card 
              className="tech-panel border-2 border-dashed border-primary/30 bg-card/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group cursor-pointer"
              onClick={() => {
                setEditingItem(null);
                setShowEditModal(true);
              }}
            >
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:border-primary/50 group-hover:scale-110 transition-all duration-300">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  Add Your First Project
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Share your work and let others see your expertise
                </p>
                <Badge variant="outline" className="text-xs font-mono border-primary/30 text-primary">
                  Get Started
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <PortfolioEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        portfolioItem={editingItem}
        onSave={async () => {
          fetchingRef.current = false;
          setLoading(true);
          try {
            const response = await profileApi.getMyProfile();
            setProfile(response.profile);
          } catch (error) {
            console.error('Failed to refresh portfolio:', error);
          } finally {
            setLoading(false);
          }
        }}
      />
    </div>
  );
});
PortfolioContent.displayName = 'PortfolioContent';

// ============================================================================
// SETTINGS CONTENT
// ============================================================================
export const SettingsContent = memo(({ onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display font-bold text-foreground">SETTINGS</h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <Card className="tech-panel border-border bg-card/50 flex-1">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/dashboard?section=profile')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/dashboard?section=profile')}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Manage Portfolio
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/dashboard?section=profile')}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Skills & Certifications
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
SettingsContent.displayName = 'SettingsContent';

