import { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { adminApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Container } from '../../components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Users, Briefcase, FolderKanban, CheckCircle, TrendingUp, Clock,
  AlertCircle, BarChart3, Settings, Shield, Edit, Trash2, Eye,
  Plus, Search, Filter, Download, Code, Zap, Crown, X, Check, Clock3
} from 'lucide-react';
import { Input } from '../../components/ui/Input';

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
    { id: 'users', label: 'Users', icon: Users },
    { id: 'verification-requests', label: 'Verification Requests', icon: Shield, badge: stats?.pendingVerificationRequests || 0 },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'platforms', label: 'Platforms', icon: Code },
    { id: 'skills', label: 'Skills', icon: Zap },
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs transition-colors whitespace-nowrap ${
                      activeTab === tab.id
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
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'verification-requests' && <VerificationRequestsTab />}
            {activeTab === 'jobs' && <JobsTab />}
            {activeTab === 'projects' && <ProjectsTab />}
            {activeTab === 'platforms' && <PlatformsTab />}
            {activeTab === 'skills' && <SkillsTab />}
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
                            onClick={() => {/* TODO: Edit modal */}}
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

