import { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { adminApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Container } from '../../components/layout/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Users, Briefcase, FolderKanban, CheckCircle, TrendingUp, Clock,
  AlertCircle, BarChart3, Settings, Shield, Edit, Trash2, Eye,
  Plus, Search, Filter, Download, Code, Zap, Crown, X, Check, Clock3,
  GraduationCap, FileText, MessageSquare, Award, Bell, Send, HelpCircle
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';

export const AdminDashboard = memo(() => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getStats();
      setStats(response.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
      toast.error(err.error || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      change: `+${stats?.recentUsers || 0} this week`
    },
    {
      title: 'Active Jobs',
      value: `${stats?.activeJobs || 0} / ${stats?.totalJobs || 0}`,
      icon: Briefcase,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      change: 'Open positions'
    },
    {
      title: 'Active Projects',
      value: `${stats?.activeProjects || 0} / ${stats?.totalProjects || 0}`,
      icon: FolderKanban,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      change: 'In progress'
    },
    {
      title: 'Verified Profiles',
      value: stats?.verifiedProfiles || 0,
      icon: CheckCircle,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      change: `${Math.round(((stats?.verifiedProfiles || 0) / (stats?.totalUsers || 1)) * 100)}% verified`
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'verification-requests', label: 'Verification', icon: Shield, badge: stats?.pendingVerificationRequests || 0 },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'training', label: 'Training', icon: GraduationCap },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'platforms', label: 'Platforms', icon: Code },
    { id: 'skills', label: 'Skills', icon: Zap },
    { id: 'certifications', label: 'Certs', icon: Award },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      <Container>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground mb-2 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-primary" />
                  Admin Panel
                </h1>
                <p className="text-muted-foreground">Manage users, jobs, projects, and system settings</p>
              </div>
              <Badge variant="default" className="bg-primary text-white px-4 py-2">
                Admin Access
              </Badge>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="tech-panel border-border bg-card/50 hover-lift">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                    <h3 className="text-2xl font-display font-bold text-foreground mb-1">
                      {stat.value}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs transition-colors whitespace-nowrap ${activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <Badge variant="default" className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px]">
                        {tab.badge}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'overview' && <OverviewTab stats={stats} />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'verification-requests' && <VerificationRequestsTab />}
            {activeTab === 'support' && <SupportSubmissionsTab />}
            {activeTab === 'jobs' && <JobsTab />}
            {activeTab === 'projects' && <ProjectsTab />}
            {activeTab === 'applications' && <ApplicationsTab />}
            {activeTab === 'training' && <TrainingTab />}
            {activeTab === 'messages' && <MessagesTab />}
            {activeTab === 'platforms' && <PlatformsTab />}
            {activeTab === 'skills' && <SkillsTab />}
            {activeTab === 'certifications' && <CertificationsTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </Container>
    </div>
  );
});

AdminDashboard.displayName = 'AdminDashboard';

// Overview Tab
const OverviewTab = memo(({ stats }) => {
  return (
    <div className="space-y-6">
      <Card className="tech-panel border-border bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg font-display">User Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats?.userTypeCounts && Object.entries(stats.userTypeCounts).map(([type, count]) => (
              <div key={type} className="p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1 uppercase">{type.replace('_', ' ')}</p>
                <p className="text-2xl font-display font-bold text-foreground">{count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// Users Tab
const UsersTab = memo(() => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({ user_type: '', search: '', is_verified: '' });
  const toast = useToast();

  useEffect(() => {
    loadUsers();
  }, [pagination.page, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });
      setUsers(response.users || []);
      setPagination(prev => ({ ...prev, total: response.pagination?.total || 0 }));
    } catch (err) {
      toast.error(err.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId, badge = 'basic') => {
    try {
      await adminApi.verifyUser(userId, { verification_badge: badge });
      toast.success('User verified successfully');
      loadUsers();
    } catch (err) {
      toast.error(err.error || 'Failed to verify user');
    }
  };

  const handleToggleAdmin = async (userId, currentAdminStatus) => {
    if (!confirm(`Are you sure you want to ${currentAdminStatus ? 'remove' : 'grant'} admin privileges to this user?`)) {
      return;
    }
    try {
      await adminApi.updateUser(userId, { is_admin: !currentAdminStatus });
      toast.success(`Admin privileges ${currentAdminStatus ? 'removed' : 'granted'} successfully`);
      loadUsers();
    } catch (err) {
      toast.error(err.error || 'Failed to update admin status');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      await adminApi.deleteUser(userId);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (err) {
      toast.error(err.error || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="tech-panel border-border bg-card/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="flex-1"
            />
            <select
              value={filters.user_type}
              onChange={(e) => setFilters(prev => ({ ...prev, user_type: e.target.value }))}
              className="px-3 py-2 bg-background border border-border rounded-lg text-foreground"
            >
              <option value="">All Types</option>
              <option value="freelancer">Freelancer</option>
              <option value="job_seeker">Job Seeker</option>
              <option value="trainer">Trainer</option>
              <option value="ba_pm">BA/PM</option>
              <option value="client">Client</option>
              <option value="employer">Employer</option>
            </select>
            <select
              value={filters.is_verified}
              onChange={(e) => setFilters(prev => ({ ...prev, is_verified: e.target.value }))}
              className="px-3 py-2 bg-background border border-border rounded-lg text-foreground"
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
            </select>
            <Button onClick={loadUsers} className="w-full">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="tech-panel border-border bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg font-display">Users ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-xs font-mono text-muted-foreground uppercase">User</th>
                    <th className="text-left p-3 text-xs font-mono text-muted-foreground uppercase">Type</th>
                    <th className="text-left p-3 text-xs font-mono text-muted-foreground uppercase">Status</th>
                    <th className="text-left p-3 text-xs font-mono text-muted-foreground uppercase">Verified</th>
                    <th className="text-left p-3 text-xs font-mono text-muted-foreground uppercase">Admin</th>
                    <th className="text-left p-3 text-xs font-mono text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-display font-semibold text-foreground">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {user.user_type?.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {user.is_active ? (
                          <Badge variant="default" className="bg-green-500 text-white text-xs">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Inactive</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        {user.is_verified ? (
                          <Badge variant="default" className="bg-yellow-500 text-white text-xs">
                            ✓ Verified
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerify(user.id)}
                            className="text-xs h-7"
                          >
                            Verify
                          </Button>
                        )}
                      </td>
                      <td className="p-3">
                        {user.is_admin ? (
                          <Badge variant="default" className="bg-purple-500 text-white text-xs flex items-center gap-1 w-fit">
                            <Crown className="w-3 h-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleAdmin(user.id, false)}
                            className="text-xs h-7"
                          >
                            Make Admin
                          </Button>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {user.is_admin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleAdmin(user.id, true)}
                              className="h-7 w-7 p-0 text-purple-500 hover:text-purple-600"
                              title="Remove Admin"
                            >
                              <Crown className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`/profile/${user.id}`, '_blank')}
                            className="h-7 w-7 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {/* TODO: Edit modal */ }}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(user.id)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

UsersTab.displayName = 'UsersTab';

// Verification Requests Tab
const VerificationRequestsTab = memo(() => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [statusFilter, setStatusFilter] = useState('pending');
  const toast = useToast();

  useEffect(() => {
    loadRequests();
  }, [pagination.page, statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getVerificationRequests({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter
      });
      setRequests(response.requests || []);
      setPagination(prev => ({ ...prev, total: response.pagination?.total || 0 }));
    } catch (err) {
      toast.error(err.error || 'Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, profileId, badge = 'basic') => {
    try {
      await adminApi.verifyUser(profileId, { verification_badge: badge, request_id: requestId });
      toast.success('Verification request approved');
      loadRequests();
    } catch (err) {
      toast.error(err.error || 'Failed to approve verification');
    }
  };

  const handleReject = async (requestId, notes = '') => {
    if (!confirm('Are you sure you want to reject this verification request?')) {
      return;
    }
    try {
      await adminApi.rejectVerificationRequest(requestId, { review_notes: notes });
      toast.success('Verification request rejected');
      loadRequests();
    } catch (err) {
      toast.error(err.error || 'Failed to reject verification request');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="tech-panel border-border bg-card/50">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 bg-background border border-border rounded-lg text-foreground"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <Button onClick={loadRequests} className="w-full">
              <Search className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="tech-panel border-border bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg font-display">
            Verification Requests ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No verification requests found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-xs font-mono text-muted-foreground uppercase">User</th>
                    <th className="text-left p-3 text-xs font-mono text-muted-foreground uppercase">Type</th>
                    <th className="text-left p-3 text-xs font-mono text-muted-foreground uppercase">Profile Completion</th>
                    <th className="text-left p-3 text-xs font-mono text-muted-foreground uppercase">Requested</th>
                    <th className="text-left p-3 text-xs font-mono text-muted-foreground uppercase">Status</th>
                    <th className="text-left p-3 text-xs font-mono text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => {
                    const profile = request.profile;
                    const user = request.user;
                    return (
                      <tr key={request.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {profile?.avatar_url ? (
                              <img src={profile.avatar_url} alt={profile.full_name} className="w-10 h-10 rounded-full" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-display font-semibold text-foreground">{profile?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{user?.email || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {profile?.user_type?.replace('_', ' ') || 'N/A'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${request.profile_completion || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{request.profile_completion || 0}%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleTimeString()}
                          </p>
                        </td>
                        <td className="p-3">
                          {request.status === 'pending' ? (
                            <Badge variant="default" className="bg-yellow-500 text-white text-xs flex items-center gap-1 w-fit">
                              <Clock3 className="w-3 h-3" />
                              Pending
                            </Badge>
                          ) : request.status === 'approved' ? (
                            <Badge variant="default" className="bg-green-500 text-white text-xs flex items-center gap-1 w-fit">
                              <Check className="w-3 h-3" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-red-500 text-white text-xs flex items-center gap-1 w-fit">
                              <X className="w-3 h-3" />
                              Rejected
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`/profile/${profile?.id}`, '_blank')}
                              className="h-7 w-7 p-0"
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const badge = prompt('Enter verification badge (basic/pro/expert):', 'basic');
                                    if (badge && ['basic', 'pro', 'expert'].includes(badge.toLowerCase())) {
                                      handleApprove(request.id, profile?.id, badge.toLowerCase());
                                    }
                                  }}
                                  className="h-7 text-xs text-green-600 hover:text-green-700"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const notes = prompt('Rejection reason (optional):', '');
                                    handleReject(request.id, notes);
                                  }}
                                  className="h-7 text-xs text-red-600 hover:text-red-700"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

VerificationRequestsTab.displayName = 'VerificationRequestsTab';

// Jobs Tab
const JobsTab = memo(() => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const toast = useToast();

  useEffect(() => {
    loadJobs();
  }, [pagination.page]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getJobs({
        page: pagination.page,
        limit: pagination.limit
      });
      setJobs(response.jobs || []);
      setPagination(prev => ({ ...prev, total: response.pagination?.total || 0 }));
    } catch (err) {
      toast.error(err.error || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      await adminApi.deleteJob(jobId);
      toast.success('Job deleted successfully');
      loadJobs();
    } catch (err) {
      toast.error(err.error || 'Failed to delete job');
    }
  };

  return (
    <Card className="tech-panel border-border bg-card/50">
      <CardHeader>
        <CardTitle className="text-lg font-display">Jobs ({pagination.total})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No jobs found</div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="p-4 rounded-lg border border-border hover:border-primary/50 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-display font-semibold text-foreground">{job.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{job.employer?.full_name || 'Unknown'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{job.status}</Badge>
                    {job.location && (
                      <span className="text-xs text-muted-foreground">{job.location}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => window.open(`/jobs/${job.id}`, '_blank')}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(job.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Projects Tab
const ProjectsTab = memo(() => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const toast = useToast();

  useEffect(() => {
    loadProjects();
  }, [pagination.page]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getProjects({
        page: pagination.page,
        limit: pagination.limit
      });
      setProjects(response.projects || []);
      setPagination(prev => ({ ...prev, total: response.pagination?.total || 0 }));
    } catch (err) {
      toast.error(err.error || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await adminApi.deleteProject(projectId);
      toast.success('Project deleted successfully');
      loadProjects();
    } catch (err) {
      toast.error(err.error || 'Failed to delete project');
    }
  };

  return (
    <Card className="tech-panel border-border bg-card/50">
      <CardHeader>
        <CardTitle className="text-lg font-display">Projects ({pagination.total})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No projects found</div>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <div key={project.id} className="p-4 rounded-lg border border-border hover:border-primary/50 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-display font-semibold text-foreground">{project.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{project.client?.full_name || 'Unknown'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{project.status}</Badge>
                    {project.budget_min && project.budget_max && (
                      <span className="text-xs text-muted-foreground">
                        ${project.budget_min} - ${project.budget_max}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => window.open(`/projects/${project.id}`, '_blank')}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(project.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Platforms Tab
const PlatformsTab = memo(() => {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const toast = useToast();

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPlatforms();
      setPlatforms(response.platforms || []);
    } catch (err) {
      toast.error(err.error || 'Failed to load platforms');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (platformId) => {
    if (!confirm('Are you sure you want to delete this platform?')) return;
    try {
      await adminApi.deletePlatform(platformId);
      toast.success('Platform deleted successfully');
      loadPlatforms();
    } catch (err) {
      toast.error(err.error || 'Failed to delete platform');
    }
  };

  return (
    <Card className="tech-panel border-border bg-card/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display">Platforms ({platforms.length})</CardTitle>
          <Button size="sm" onClick={() => { setEditingPlatform(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Platform
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform) => (
              <div key={platform.id} className="p-4 rounded-lg border border-border hover:border-primary/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {platform.logo_url && (
                      <img src={platform.logo_url} alt={platform.name} className="w-8 h-8 rounded" />
                    )}
                    <h4 className="font-display font-semibold text-foreground">{platform.name}</h4>
                  </div>
                  {platform.is_active ? (
                    <Badge variant="default" className="bg-green-500 text-white text-xs">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Inactive</Badge>
                  )}
                </div>
                {platform.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{platform.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setEditingPlatform(platform); setShowModal(true); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(platform.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Skills Tab
const SkillsTab = memo(() => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const toast = useToast();

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSkills();
      setSkills(response.skills || []);
    } catch (err) {
      toast.error(err.error || 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (skillId) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    try {
      await adminApi.deleteSkill(skillId);
      toast.success('Skill deleted successfully');
      loadSkills();
    } catch (err) {
      toast.error(err.error || 'Failed to delete skill');
    }
  };

  return (
    <Card className="tech-panel border-border bg-card/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display">Skills ({skills.length})</CardTitle>
          <Button size="sm" onClick={() => { setEditingSkill(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Skill
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <div key={skill.id} className="p-4 rounded-lg border border-border hover:border-primary/50">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-display font-semibold text-foreground">{skill.name}</h4>
                  {skill.is_active ? (
                    <Badge variant="default" className="bg-green-500 text-white text-xs">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Inactive</Badge>
                  )}
                </div>
                {skill.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{skill.description}</p>
                )}
                {skill.category && (
                  <Badge variant="outline" className="text-xs mb-2">{skill.category}</Badge>
                )}
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setEditingSkill(skill); setShowModal(true); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(skill.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Settings Tab
const SettingsTab = memo(() => {
  return (
    <Card className="tech-panel border-border bg-card/50">
      <CardHeader>
        <CardTitle className="text-lg font-display">System Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-border">
            <h4 className="font-display font-semibold text-foreground mb-2">System Information</h4>
            <p className="text-sm text-muted-foreground">Admin panel version 1.0.0</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
SettingsTab.displayName = 'SettingsTab';

// Analytics Tab
const AnalyticsTab = memo(() => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const toast = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAnalytics({ period });
      setAnalytics(response.analytics);
    } catch (err) {
      toast.error(err.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-foreground"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="tech-panel border-border bg-card/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">New Users</p>
            <p className="text-2xl font-bold">{analytics?.users?.total || 0}</p>
          </CardContent>
        </Card>
        <Card className="tech-panel border-border bg-card/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Jobs Posted</p>
            <p className="text-2xl font-bold">{analytics?.jobs?.total || 0}</p>
          </CardContent>
        </Card>
        <Card className="tech-panel border-border bg-card/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Projects</p>
            <p className="text-2xl font-bold">{analytics?.projects?.total || 0}</p>
          </CardContent>
        </Card>
        <Card className="tech-panel border-border bg-card/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Applications</p>
            <p className="text-2xl font-bold">{analytics?.applications?.total || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Platforms */}
      <Card className="tech-panel border-border bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg font-display">Top Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.topPlatforms?.map((platform, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm font-medium">{platform.name}</span>
                <div className="flex items-center gap-2 flex-1 mx-4">
                  <div className="h-2 bg-muted rounded-full flex-1 overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(platform.count / (analytics.topPlatforms[0].count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{platform.count} users</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
AnalyticsTab.displayName = 'AnalyticsTab';

// Applications Tab
const ApplicationsTab = memo(() => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const toast = useToast();

  useEffect(() => {
    loadApplications();
  }, [pagination.page, statusFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getApplications({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter
      });
      setApplications(response.applications || []);
      setPagination(prev => ({ ...prev, total: response.pagination?.total || 0 }));
    } catch (err) {
      toast.error(err.error || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await adminApi.updateApplication(id, { status: newStatus });
      toast.success('Application status updated');
      loadApplications();
    } catch (err) {
      toast.error(err.error || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-foreground"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
          <option value="hired">Hired</option>
        </select>
      </div>

      <Card className="tech-panel border-border bg-card/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase">Applicant</th>
                    <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase">Job</th>
                    <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase">Applied</th>
                    <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase">Status</th>
                    <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {app.applicant?.avatar_url ? (
                            <img src={app.applicant.avatar_url} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{app.applicant?.full_name}</p>
                            <p className="text-xs text-muted-foreground">{app.applicant?.headline}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{app.job?.title}</p>
                        <Badge variant="outline" className="text-[10px]">{app.job?.status}</Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <Badge variant={app.status === 'hired' ? 'default' : 'outline'} className={
                          app.status === 'hired' ? 'bg-green-500' :
                            app.status === 'rejected' ? 'text-red-500 border-red-500/30' : ''
                        }>
                          {app.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                          className="text-xs bg-transparent border border-border rounded px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                          <option value="hired">Hired</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
ApplicationsTab.displayName = 'ApplicationsTab';

// Training Tab
const TrainingTab = memo(() => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const toast = useToast();

  useEffect(() => {
    loadPrograms();
  }, [pagination.page]);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getTrainingPrograms({
        page: pagination.page,
        limit: pagination.limit
      });
      setPrograms(response.programs || []);
      setPagination(prev => ({ ...prev, total: response.pagination?.total || 0 }));
    } catch (err) {
      toast.error(err.error || 'Failed to load training programs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this training program?')) return;
    try {
      await adminApi.deleteTrainingProgram(id);
      toast.success('Program deleted successfully');
      loadPrograms();
    } catch (err) {
      toast.error(err.error || 'Failed to delete program');
    }
  };

  return (
    <Card className="tech-panel border-border bg-card/50">
      <CardHeader>
        <CardTitle className="text-lg font-display">Training Programs ({pagination.total})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <div className="space-y-4">
            {programs.map((program) => (
              <div key={program.id} className="p-4 rounded-lg border border-border hover:border-primary/50 flex items-start justify-between">
                <div className="flex gap-4">
                  {program.thumbnail_url ? (
                    <img src={program.thumbnail_url} className="w-24 h-16 object-cover rounded-lg" />
                  ) : (
                    <div className="w-24 h-16 bg-muted rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-display font-semibold text-foreground">{program.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{program.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {program.trainer?.full_name}
                      </div>
                      <Badge variant="outline" className="text-[10px]">{program.level}</Badge>
                      <Badge variant="secondary" className="text-[10px]">${program.price}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => window.open(`/training/${program.id}`, '_blank')}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(program.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
TrainingTab.displayName = 'TrainingTab';

// Messages Tab
const MessagesTab = memo(() => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [flaggedFilter, setFlaggedFilter] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadMessages();
  }, [pagination.page, flaggedFilter]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getMessages({
        page: pagination.page,
        limit: pagination.limit,
        flagged: flaggedFilter
      });
      setMessages(response.messages || []);
      setPagination(prev => ({ ...prev, total: response.pagination?.total || 0 }));
    } catch (err) {
      toast.error(err.error || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async (id, isFlagged) => {
    try {
      await adminApi.flagMessage(id, {
        is_flagged: isFlagged,
        flag_reason: isFlagged ? 'Flagged by admin' : null
      });
      toast.success(isFlagged ? 'Message flagged' : 'Message unflagged');
      loadMessages();
    } catch (err) {
      toast.error(err.error || 'Failed to update flag status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await adminApi.deleteMessage(id);
      toast.success('Message deleted');
      loadMessages();
    } catch (err) {
      toast.error(err.error || 'Failed to delete message');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center gap-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={flaggedFilter}
            onChange={(e) => setFlaggedFilter(e.target.checked)}
            className="rounded border-border bg-background"
          />
          Show Flagged Only
        </label>
      </div>

      <Card className="tech-panel border-border bg-card/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : (
            <div className="divide-y divide-border">
              {messages.map((msg) => (
                <div key={msg.id} className={`p-4 hover:bg-muted/30 ${msg.is_flagged ? 'bg-red-500/5' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      {msg.sender?.avatar_url ? (
                        <img src={msg.sender.avatar_url} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{msg.sender?.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                          {msg.is_flagged && (
                            <Badge variant="destructive" className="text-[10px] h-4">Flagged</Badge>
                          )}
                        </div>
                        <p className="text-sm mt-1 text-foreground/90">{msg.content}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleFlag(msg.id, !msg.is_flagged)}
                        className={msg.is_flagged ? 'text-green-500' : 'text-yellow-500'}
                        title={msg.is_flagged ? 'Unflag' : 'Flag as inappropriate'}
                      >
                        <AlertCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(msg.id)}
                        className="text-red-500"
                        title="Delete message"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
MessagesTab.displayName = 'MessagesTab';

// Certifications Tab
const CertificationsTab = memo(() => {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const toast = useToast();

  useEffect(() => {
    loadCertifications();
  }, []);

  const loadCertifications = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getCertifications();
      setCertifications(response.certifications || []);
    } catch (err) {
      toast.error(err.error || 'Failed to load certifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this certification?')) return;
    try {
      await adminApi.deleteCertification(id);
      toast.success('Certification deleted');
      loadCertifications();
    } catch (err) {
      toast.error(err.error || 'Failed to delete certification');
    }
  };

  return (
    <Card className="tech-panel border-border bg-card/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display">Certifications ({certifications.length})</CardTitle>
          <Button size="sm" onClick={() => { setEditingCert(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Certification
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifications.map((cert) => (
              <div key={cert.id} className="p-4 rounded-lg border border-border hover:border-primary/50">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-display font-semibold text-foreground">{cert.name}</h4>
                  {cert.is_active ? (
                    <Badge variant="default" className="bg-green-500 text-white text-xs">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Inactive</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{cert.platform?.name}</p>
                <Badge variant="secondary" className="text-[10px] mb-3">{cert.level}</Badge>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setEditingCert(cert); setShowModal(true); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(cert.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
CertificationsTab.displayName = 'CertificationsTab';

// Notifications Tab
const NotificationsTab = memo(() => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', type: 'announcement' });
  const [sending, setSending] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadNotifications();
  }, [pagination.page]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getNotifications({
        page: pagination.page,
        limit: pagination.limit
      });
      setNotifications(response.notifications || []);
      setPagination(prev => ({ ...prev, total: response.pagination?.total || 0 }));
    } catch (err) {
      toast.error(err.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message) return;

    try {
      setSending(true);
      await adminApi.sendBroadcast(broadcastForm);
      toast.success('Broadcast sent successfully');
      setBroadcastForm({ title: '', message: '', type: 'announcement' });
      loadNotifications();
    } catch (err) {
      toast.error(err.error || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Broadcast Form */}
      <Card className="tech-panel border-border bg-card/50 h-fit">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Broadcast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase mb-1 block">Title</label>
              <Input
                value={broadcastForm.title}
                onChange={(e) => setBroadcastForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Announcement Title"
                required
              />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase mb-1 block">Type</label>
              <select
                value={broadcastForm.type}
                onChange={(e) => setBroadcastForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
              >
                <option value="announcement">Announcement</option>
                <option value="alert">Alert</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase mb-1 block">Message</label>
              <textarea
                value={broadcastForm.message}
                onChange={(e) => setBroadcastForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Type your message here..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground min-h-[100px]"
                required
              />
            </div>
            <Button type="submit" disabled={sending} className="w-full">
              {sending ? <LoadingSpinner size="sm" /> : 'Send Broadcast'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="tech-panel border-border bg-card/50 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-display">Notification History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-4 rounded-lg border border-border bg-background/50">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground">{notif.title}</h4>
                    <Badge variant="outline" className="text-[10px]">{notif.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>To: {notif.user?.full_name || 'System Broadcast'}</span>
                    <span>{new Date(notif.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
NotificationsTab.displayName = 'NotificationsTab';

// Support Submissions Tab
const SupportSubmissionsTab = memo(() => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adminNotes, setAdminNotes] = useState('');
  const toast = useToast();

  useEffect(() => {
    loadSubmissions();
  }, [status, search, page]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (status !== 'all') params.status = status;
      if (search) params.search = search;
      
      const response = await adminApi.getSupportSubmissions(params);
      setSubmissions(response.submissions || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load support submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await adminApi.updateSupportSubmission(id, { status: newStatus });
      toast.success('Status updated successfully');
      loadSubmissions();
      if (selectedSubmission?.id === id) {
        setSelectedSubmission({ ...selectedSubmission, status: newStatus });
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveNotes = async (id) => {
    try {
      await adminApi.updateSupportSubmission(id, { admin_notes: adminNotes });
      toast.success('Notes saved successfully');
      loadSubmissions();
    } catch (error) {
      toast.error('Failed to save notes');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    try {
      await adminApi.deleteSupportSubmission(id);
      toast.success('Submission deleted successfully');
      loadSubmissions();
      if (selectedSubmission?.id === id) {
        setSelectedSubmission(null);
      }
    } catch (error) {
      toast.error('Failed to delete submission');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      in_progress: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      resolved: 'bg-green-500/20 text-green-500 border-green-500/30',
      closed: 'bg-gray-500/20 text-gray-500 border-gray-500/30'
    };
    return variants[status] || variants.pending;
  };

  return (
    <div className="space-y-6">
      <Card className="tech-panel border-border">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-display">Support Submissions</CardTitle>
              <CardDescription>Manage customer support inquiries and feedback</CardDescription>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search submissions..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 rounded-md border border-border bg-background text-foreground text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No support submissions found
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <Card
                    key={submission.id}
                    className={`cursor-pointer transition-all ${
                      selectedSubmission?.id === submission.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setAdminNotes(submission.admin_notes || '');
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-1">{submission.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{submission.email}</p>
                          {submission.subject && (
                            <p className="text-sm font-medium text-foreground mb-2">
                              {submission.subject}
                            </p>
                          )}
                        </div>
                        <Badge className={getStatusBadge(submission.status)}>
                          {submission.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {submission.message}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(submission.created_at).toLocaleString()}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(submission.id);
                          }}
                          className="h-6 text-xs"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>

              {selectedSubmission && (
                <Card className="tech-panel border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-display">Submission Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Status</Label>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {['pending', 'in_progress', 'resolved', 'closed'].map((s) => (
                          <Button
                            key={s}
                            variant={selectedSubmission.status === s ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => handleStatusUpdate(selectedSubmission.id, s)}
                          >
                            {s.replace('_', ' ').toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Name</Label>
                      <p className="text-foreground">{selectedSubmission.name}</p>
                    </div>

                    <div>
                      <Label>Email</Label>
                      <p className="text-foreground">{selectedSubmission.email}</p>
                    </div>

                    <div>
                      <Label>Subject</Label>
                      <p className="text-foreground">
                        {selectedSubmission.subject || 'General Inquiry'}
                      </p>
                    </div>

                    <div>
                      <Label>Message</Label>
                      <p className="text-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
                        {selectedSubmission.message}
                      </p>
                    </div>

                    <div>
                      <Label>Admin Notes</Label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add internal notes..."
                        rows={4}
                        className="mt-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveNotes(selectedSubmission.id)}
                        className="mt-2"
                      >
                        Save Notes
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
                      <p>Submitted: {new Date(selectedSubmission.created_at).toLocaleString()}</p>
                      {selectedSubmission.resolved_at && (
                        <p>Resolved: {new Date(selectedSubmission.resolved_at).toLocaleString()}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
SupportSubmissionsTab.displayName = 'SupportSubmissionsTab';

