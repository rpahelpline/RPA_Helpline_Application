import { memo, useEffect, useState, useCallback } from 'react';
import { adminApi, ApiError } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import {
  AlertCircle, CheckCircle2, ShieldCheck, Users, Briefcase, ClipboardList, Globe2,
  Edit2, Trash2, X, Search, Filter, GraduationCap, MessageSquare, BarChart3,
  Eye, TrendingUp, FileText, Calendar, DollarSign, MapPin
} from 'lucide-react';

// Error Banner
const ErrorBanner = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-destructive hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

// Stat Card
const StatCard = ({ label, value, icon: Icon, onClick }) => (
  <Card
    className={`tech-panel border-border bg-card/60 ${onClick ? 'cursor-pointer hover:border-primary/50 transition-all' : ''}`}
    onClick={onClick}
  >
    <CardContent className="flex items-center justify-between p-4">
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-display font-bold text-foreground">
          {value}
        </p>
      </div>
      {Icon && <Icon className="h-6 w-6 text-secondary" />}
    </CardContent>
  </Card>
);

// Tab Navigation
const TabButton = ({ active, onClick, children, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all ${
      active
        ? 'bg-primary/10 text-primary border border-primary/30'
        : 'text-muted-foreground hover:text-foreground hover:bg-card'
    }`}
  >
    {Icon && <Icon className="h-4 w-4" />}
    {children}
  </button>
);

// Delete Confirmation Modal
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message, itemName }) => {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-foreground">
          {message || `Are you sure you want to delete "${itemName}"?`}
        </p>
        <p className="text-xs text-destructive font-mono">
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="font-mono text-xs">
            CANCEL
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90 font-mono text-xs"
          >
            DELETE
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const AdminDashboard = memo(() => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Users
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [userPagination, setUserPagination] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userEditModalOpen, setUserEditModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, id: null, name: null });

  // Projects
  const [projects, setProjects] = useState([]);
  const [projectPage, setProjectPage] = useState(1);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('');
  const [projectPagination, setProjectPagination] = useState(null);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectEditModalOpen, setProjectEditModalOpen] = useState(false);

  // Jobs
  const [jobs, setJobs] = useState([]);
  const [jobPage, setJobPage] = useState(1);
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const [jobPagination, setJobPagination] = useState(null);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobEditModalOpen, setJobEditModalOpen] = useState(false);

  // Verification requests
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [verificationPage, setVerificationPage] = useState(1);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationPagination, setVerificationPagination] = useState(null);

  // Training
  const [training, setTraining] = useState([]);
  const [trainingPage, setTrainingPage] = useState(1);
  const [trainingPagination, setTrainingPagination] = useState(null);
  const [trainingLoading, setTrainingLoading] = useState(false);

  // Load Stats
  const loadStats = useCallback(async () => {
    try {
      const res = await adminApi.getStats();
      setStats(res.stats || null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load admin stats';
      setError(message);
    }
  }, []);

  // Load Users
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = {
        page: userPage,
        limit: 10,
        ...(userSearch && { search: userSearch }),
        ...(userTypeFilter && { user_type: userTypeFilter }),
      };
      const res = await adminApi.getUsers(params);
      setUsers(res.users || []);
      setUserPagination(res.pagination || null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load users';
      setError(message);
    } finally {
      setUsersLoading(false);
    }
  }, [userPage, userSearch, userTypeFilter]);

  // Load Projects
  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const params = {
        page: projectPage,
        limit: 10,
        ...(projectSearch && { search: projectSearch }),
        ...(projectStatusFilter && { status: projectStatusFilter }),
      };
      const res = await adminApi.getProjects(params);
      setProjects(res.projects || []);
      setProjectPagination(res.pagination || null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load projects';
      setError(message);
    } finally {
      setProjectsLoading(false);
    }
  }, [projectPage, projectSearch, projectStatusFilter]);

  // Load Jobs
  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const params = {
        page: jobPage,
        limit: 10,
        ...(jobSearch && { search: jobSearch }),
        ...(jobStatusFilter && { status: jobStatusFilter }),
      };
      const res = await adminApi.getJobs(params);
      setJobs(res.jobs || []);
      setJobPagination(res.pagination || null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load jobs';
      setError(message);
    } finally {
      setJobsLoading(false);
    }
  }, [jobPage, jobSearch, jobStatusFilter]);

  // Load Verification Requests
  const loadVerificationRequests = useCallback(async () => {
    setVerificationLoading(true);
    try {
      const res = await adminApi.getVerificationRequests({
        page: verificationPage,
        limit: 10,
        status: 'pending',
      });
      setVerificationRequests(res.requests || []);
      setVerificationPagination(res.pagination || null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load verification requests';
      setError(message);
    } finally {
      setVerificationLoading(false);
    }
  }, [verificationPage]);

  // Load Training
  const loadTraining = useCallback(async () => {
    setTrainingLoading(true);
    try {
      const res = await adminApi.getTraining({
        page: trainingPage,
        limit: 10,
      });
      setTraining(res.programs || []);
      setTrainingPagination(res.pagination || null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load training programs';
      setError(message);
    } finally {
      setTrainingLoading(false);
    }
  }, [trainingPage]);

  // Initial load based on active tab
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        await loadStats();
        if (activeTab === 'users') {
          await loadUsers();
        } else if (activeTab === 'projects') {
          await loadProjects();
        } else if (activeTab === 'jobs') {
          await loadJobs();
        } else if (activeTab === 'verification') {
          await loadVerificationRequests();
        } else if (activeTab === 'training') {
          await loadTraining();
        } else if (activeTab === 'overview') {
          // Load limited data for overview (first page only)
          const overviewPromises = [
            adminApi.getProjects({ page: 1, limit: 5 }).then(res => {
              setProjects(res.projects || []);
            }).catch(() => {}),
            adminApi.getJobs({ page: 1, limit: 5 }).then(res => {
              setJobs(res.jobs || []);
            }).catch(() => {}),
            loadVerificationRequests()
          ];
          await Promise.all(overviewPromises);
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [activeTab, loadStats, loadUsers, loadProjects, loadJobs, loadVerificationRequests, loadTraining]);

  // Reload when filters change
  useEffect(() => {
    if (activeTab === 'users' && !loading) {
      loadUsers();
    }
  }, [userPage, userSearch, userTypeFilter, activeTab, loading, loadUsers]);

  useEffect(() => {
    if (activeTab === 'projects' && !loading) {
      loadProjects();
    }
  }, [projectPage, projectSearch, projectStatusFilter, activeTab, loading, loadProjects]);

  useEffect(() => {
    if (activeTab === 'jobs' && !loading) {
      loadJobs();
    }
  }, [jobPage, jobSearch, jobStatusFilter, activeTab, loading, loadJobs]);

  // User Handlers
  const handleEditUser = (user) => {
    setEditingUser({ ...user });
    setUserEditModalOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      setError(null);
      await adminApi.updateUser(editingUser.id, editingUser);
      toast.success('User updated successfully');
      setUserEditModalOpen(false);
      setEditingUser(null);
      await Promise.all([loadUsers(), loadStats()]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update user';
      setError(message);
      toast.error(message);
    }
  };

  const handleToggleUserActive = async (user) => {
    try {
      setError(null);
      await adminApi.updateUser(user.id, { is_active: !user.is_active });
      toast.success(`User ${!user.is_active ? 'activated' : 'deactivated'}`);
      await loadUsers();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update user';
      setError(message);
      toast.error(message);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setError(null);
      await adminApi.deleteUser(deleteConfirm.id);
      toast.success('User deleted successfully');
      setDeleteConfirm({ isOpen: false, type: null, id: null, name: null });
      await Promise.all([loadUsers(), loadStats()]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete user';
      setError(message);
      toast.error(message);
    }
  };

  // Project Handlers
  const handleEditProject = (project) => {
    setEditingProject({ ...project });
    setProjectEditModalOpen(true);
  };

  const handleSaveProject = async () => {
    try {
      setError(null);
      await adminApi.updateProject(editingProject.id, editingProject);
      toast.success('Project updated successfully');
      setProjectEditModalOpen(false);
      setEditingProject(null);
      await Promise.all([loadProjects(), loadStats()]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update project';
      setError(message);
      toast.error(message);
    }
  };

  const handleDeleteProject = async () => {
    try {
      setError(null);
      await adminApi.deleteProject(deleteConfirm.id);
      toast.success('Project deleted successfully');
      setDeleteConfirm({ isOpen: false, type: null, id: null, name: null });
      await Promise.all([loadProjects(), loadStats()]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete project';
      setError(message);
      toast.error(message);
    }
  };

  // Job Handlers
  const handleEditJob = (job) => {
    setEditingJob({ ...job });
    setJobEditModalOpen(true);
  };

  const handleSaveJob = async () => {
    try {
      setError(null);
      await adminApi.updateJob(editingJob.id, editingJob);
      toast.success('Job updated successfully');
      setJobEditModalOpen(false);
      setEditingJob(null);
      await Promise.all([loadJobs(), loadStats()]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update job';
      setError(message);
      toast.error(message);
    }
  };

  const handleDeleteJob = async () => {
    try {
      setError(null);
      await adminApi.deleteJob(deleteConfirm.id);
      toast.success('Job deleted successfully');
      setDeleteConfirm({ isOpen: false, type: null, id: null, name: null });
      await Promise.all([loadJobs(), loadStats()]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete job';
      setError(message);
      toast.error(message);
    }
  };

  // Verification Handlers
  const handleVerifyUser = async (request) => {
    try {
      setError(null);
      await adminApi.verifyUser(request.profile_id, {
        verification_badge: request.requested_badge || 'basic',
        request_id: request.id,
      });
      toast.success('User verified successfully');
      await Promise.all([loadStats(), loadUsers(), loadVerificationRequests()]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to verify user';
      setError(message);
      toast.error(message);
    }
  };

  const handleRejectVerification = async (request) => {
    try {
      setError(null);
      await adminApi.rejectVerificationRequest(request.id, { review_notes: 'Rejected by admin' });
      toast.success('Verification request rejected');
      await loadVerificationRequests();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to reject verification request';
      setError(message);
      toast.error(message);
    }
  };

  // Delete Training
  const handleDeleteTraining = async () => {
    try {
      setError(null);
      await adminApi.deleteTraining(deleteConfirm.id);
      toast.success('Training program deleted successfully');
      setDeleteConfirm({ isOpen: false, type: null, id: null, name: null });
      await Promise.all([loadTraining(), loadStats()]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete training program';
      setError(message);
      toast.error(message);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Render Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          onClick={() => setActiveTab('users')}
        />
        <StatCard
          label="Active Jobs"
          value={stats?.activeJobs ?? 0}
          icon={Briefcase}
          onClick={() => setActiveTab('jobs')}
        />
        <StatCard
          label="Active Projects"
          value={stats?.activeProjects ?? 0}
          icon={ClipboardList}
          onClick={() => setActiveTab('projects')}
        />
        <StatCard
          label="Verified Profiles"
          value={stats?.verifiedProfiles ?? 0}
          icon={ShieldCheck}
        />
      </div>

      {/* User Type Breakdown */}
      <Card className="tech-panel border-border bg-card/70">
        <CardHeader>
          <CardTitle className="text-lg font-display tracking-wider flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-secondary" />
            User Type Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.userTypeCounts ? (
            <div className="flex flex-wrap gap-3 text-sm">
              {Object.entries(stats.userTypeCounts).map(([role, count]) => (
                <Badge key={role} className="bg-muted text-foreground border-border">
                  {role || 'unknown'}: {count}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data available.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Projects & Jobs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="tech-panel border-border bg-card/70">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-display tracking-wider">Recent Projects</CardTitle>
              <CardDescription>Latest posted projects</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('projects')} className="font-mono text-xs">
              VIEW ALL
            </Button>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <LoadingSpinner />
            ) : projects.slice(0, 5).length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects found.</p>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-background/40"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{project.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(project.created_at)}</p>
                    </div>
                    <Badge className={project.status === 'open' ? 'bg-green-500/15 text-green-400 border-green-500/40' : 'bg-muted text-muted-foreground border-border'}>
                      {project.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="tech-panel border-border bg-card/70">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-display tracking-wider">Recent Jobs</CardTitle>
              <CardDescription>Latest job postings</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('jobs')} className="font-mono text-xs">
              VIEW ALL
            </Button>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <LoadingSpinner />
            ) : jobs.slice(0, 5).length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs found.</p>
            ) : (
              <div className="space-y-2">
                {jobs.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-background/40"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(job.created_at)}</p>
                    </div>
                    <Badge className={job.status === 'open' ? 'bg-green-500/15 text-green-400 border-green-500/40' : 'bg-muted text-muted-foreground border-border'}>
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render Users Tab
  const renderUsers = () => (
    <Card className="tech-panel border-border bg-card/70">
      <CardHeader>
        <CardTitle className="text-lg font-display tracking-wider">User Management</CardTitle>
        <CardDescription>Search, filter, edit and manage user accounts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Input
              placeholder="Search by name or headline..."
              value={userSearch}
              onChange={(e) => {
                setUserPage(1);
                setUserSearch(e.target.value);
              }}
              className="flex-1"
            />
          </div>
          <Select
            value={userTypeFilter}
            onChange={(e) => {
              setUserPage(1);
              setUserTypeFilter(e.target.value);
            }}
            className="w-40"
          >
            <option value="">All Roles</option>
            <option value="client">Client</option>
            <option value="employer">Employer</option>
            <option value="freelancer">Freelancer</option>
            <option value="trainer">Trainer</option>
            <option value="job_seeker">Job Seeker</option>
            <option value="ba_pm">BA / PM</option>
            <option value="developer">Developer</option>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border/60 bg-background/40">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/60">
              <tr className="border-b border-border/60 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Verified</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-border/40 last:border-0 hover:bg-card/50">
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {u.full_name || 'Unnamed'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {u.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs font-mono uppercase text-muted-foreground">
                      {u.user_type || 'unknown'}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        className={u.is_active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' : 'bg-muted text-muted-foreground border-border'}
                      >
                        {u.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      {u.is_verified ? (
                        <Badge className="bg-primary/15 text-primary border-primary/40">
                          Verified
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          className="text-[10px] font-mono"
                          onClick={() => handleEditUser(u)}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          className="text-[10px] font-mono"
                          onClick={() => handleToggleUserActive(u)}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          className="text-[10px] font-mono text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm({
                            isOpen: true,
                            type: 'user',
                            id: u.id,
                            name: u.full_name || 'Unknown'
                          })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {userPagination && userPagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs font-mono text-muted-foreground">
            <span>
              Page {userPagination.page} of {userPagination.totalPages} ({userPagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={userPagination.page <= 1}
                onClick={() => setUserPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={userPagination.page >= userPagination.totalPages}
                onClick={() => setUserPage((p) => Math.min(userPagination.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render Projects Tab
  const renderProjects = () => (
    <Card className="tech-panel border-border bg-card/70">
      <CardHeader>
        <CardTitle className="text-lg font-display tracking-wider">Project Management</CardTitle>
        <CardDescription>Manage all freelance projects posted on the platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder="Search projects..."
            value={projectSearch}
            onChange={(e) => {
              setProjectPage(1);
              setProjectSearch(e.target.value);
            }}
            className="flex-1"
          />
          <Select
            value={projectStatusFilter}
            onChange={(e) => {
              setProjectPage(1);
              setProjectStatusFilter(e.target.value);
            }}
            className="w-40"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border/60 bg-background/40">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/60">
              <tr className="border-b border-border/60 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Budget</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projectsLoading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No projects found.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="border-b border-border/40 last:border-0 hover:bg-card/50">
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{project.title}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {project.description?.substring(0, 50)}...
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {project.client?.full_name || 'Unknown'}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        className={
                          project.status === 'open' ? 'bg-green-500/15 text-green-400 border-green-500/40' :
                          project.status === 'in_progress' ? 'bg-blue-500/15 text-blue-400 border-blue-500/40' :
                          project.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' :
                          'bg-muted text-muted-foreground border-border'
                        }
                      >
                        {project.status?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {project.budget_min && project.budget_max
                        ? `₹${project.budget_min.toLocaleString()} - ₹${project.budget_max.toLocaleString()}`
                        : project.budget_min
                        ? `₹${project.budget_min.toLocaleString()}+`
                        : 'Not specified'}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {formatDate(project.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          className="text-[10px] font-mono"
                          onClick={() => handleEditProject(project)}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          className="text-[10px] font-mono text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm({
                            isOpen: true,
                            type: 'project',
                            id: project.id,
                            name: project.title
                          })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {projectPagination && projectPagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs font-mono text-muted-foreground">
            <span>
              Page {projectPagination.page} of {projectPagination.totalPages} ({projectPagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={projectPagination.page <= 1}
                onClick={() => setProjectPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={projectPagination.page >= projectPagination.totalPages}
                onClick={() => setProjectPage((p) => Math.min(projectPagination.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render Jobs Tab
  const renderJobs = () => (
    <Card className="tech-panel border-border bg-card/70">
      <CardHeader>
        <CardTitle className="text-lg font-display tracking-wider">Job Management</CardTitle>
        <CardDescription>Manage all job postings on the platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder="Search jobs..."
            value={jobSearch}
            onChange={(e) => {
              setJobPage(1);
              setJobSearch(e.target.value);
            }}
            className="flex-1"
          />
          <Select
            value={jobStatusFilter}
            onChange={(e) => {
              setJobPage(1);
              setJobStatusFilter(e.target.value);
            }}
            className="w-40"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="filled">Filled</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border/60 bg-background/40">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/60">
              <tr className="border-b border-border/60 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Employer</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Salary</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobsLoading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No jobs found.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="border-b border-border/40 last:border-0 hover:bg-card/50">
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{job.title}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {job.description?.substring(0, 50)}...
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {job.employer?.full_name || 'Unknown'}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        className={
                          job.status === 'open' ? 'bg-green-500/15 text-green-400 border-green-500/40' :
                          job.status === 'filled' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' :
                          'bg-muted text-muted-foreground border-border'
                        }
                      >
                        {job.status?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {job.salary_min && job.salary_max
                        ? `₹${job.salary_min.toLocaleString()} - ₹${job.salary_max.toLocaleString()}`
                        : job.salary_min
                        ? `₹${job.salary_min.toLocaleString()}+`
                        : 'Not specified'}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {job.locations?.[0]?.city || 'Remote'}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {formatDate(job.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          className="text-[10px] font-mono"
                          onClick={() => handleEditJob(job)}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          className="text-[10px] font-mono text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm({
                            isOpen: true,
                            type: 'job',
                            id: job.id,
                            name: job.title
                          })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {jobPagination && jobPagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs font-mono text-muted-foreground">
            <span>
              Page {jobPagination.page} of {jobPagination.totalPages} ({jobPagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={jobPagination.page <= 1}
                onClick={() => setJobPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={jobPagination.page >= jobPagination.totalPages}
                onClick={() => setJobPage((p) => Math.min(jobPagination.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render Verification Tab
  const renderVerification = () => (
    <Card className="tech-panel border-border bg-card/70">
      <CardHeader>
        <CardTitle className="text-lg font-display tracking-wider">Verification Queue</CardTitle>
        <CardDescription>Review and approve pending verification requests.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {verificationLoading ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner />
          </div>
        ) : verificationRequests.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            No pending verification requests.
          </p>
        ) : (
          <div className="space-y-3">
            {verificationRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border border-border/60 bg-background/60 p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {req.profile?.full_name || 'Unknown user'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {req.profile?.user_type || 'unknown'} • {req.profile?.headline || 'No headline'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Reason:</strong> {req.reason || 'Not provided'}
                    </p>
                    {req.document_url && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <strong>Document:</strong> <a href={req.document_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Document</a>
                      </p>
                    )}
                  </div>
                  <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/40">
                    Pending
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-xs font-mono"
                    onClick={() => handleVerifyUser(req)}
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-mono"
                    onClick={() => handleRejectVerification(req)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {verificationPagination && verificationPagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs font-mono text-muted-foreground">
            <span>
              Page {verificationPagination.page} of {verificationPagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={verificationPagination.page <= 1}
                onClick={() => setVerificationPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={verificationPagination.page >= verificationPagination.totalPages}
                onClick={() => setVerificationPage((p) => Math.min(verificationPagination.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render Training Tab
  const renderTraining = () => (
    <Card className="tech-panel border-border bg-card/70">
      <CardHeader>
        <CardTitle className="text-lg font-display tracking-wider">Training Programs</CardTitle>
        <CardDescription>Manage training programs and courses.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {trainingLoading ? (
          <LoadingSpinner />
        ) : training.length === 0 ? (
          <p className="text-sm text-muted-foreground">No training programs found.</p>
        ) : (
          <div className="space-y-3">
            {training.map((program) => (
              <div
                key={program.id}
                className="rounded-lg border border-border/60 bg-background/60 p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{program.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {program.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Level: {program.level || 'N/A'}</span>
                      <span>Format: {program.format || 'N/A'}</span>
                      <span>Price: ₹{program.price || 0}</span>
                    </div>
                  </div>
                  <Badge className={program.status === 'active' ? 'bg-green-500/15 text-green-400 border-green-500/40' : 'bg-muted text-muted-foreground border-border'}>
                    {program.status?.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-mono text-destructive hover:text-destructive"
                    onClick={() => setDeleteConfirm({
                      isOpen: true,
                      type: 'training',
                      id: program.id,
                      name: program.title
                    })}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {trainingPagination && trainingPagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs font-mono text-muted-foreground">
            <span>
              Page {trainingPagination.page} of {trainingPagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={trainingPagination.page <= 1}
                onClick={() => setTrainingPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={trainingPagination.page >= trainingPagination.totalPages}
                onClick={() => setTrainingPage((p) => Math.min(trainingPagination.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">
            Admin Control Center
          </h1>
          <p className="mt-1 text-sm font-mono text-muted-foreground">
            Manage platform users, projects, jobs, and all content.
          </p>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-2">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={BarChart3}
          >
            Overview
          </TabButton>
          <TabButton
            active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
            icon={Users}
          >
            Users
          </TabButton>
          <TabButton
            active={activeTab === 'projects'}
            onClick={() => setActiveTab('projects')}
            icon={ClipboardList}
          >
            Projects
          </TabButton>
          <TabButton
            active={activeTab === 'jobs'}
            onClick={() => setActiveTab('jobs')}
            icon={Briefcase}
          >
            Jobs
          </TabButton>
          <TabButton
            active={activeTab === 'verification'}
            onClick={() => setActiveTab('verification')}
            icon={ShieldCheck}
          >
            Verification
          </TabButton>
          <TabButton
            active={activeTab === 'training'}
            onClick={() => setActiveTab('training')}
            icon={GraduationCap}
          >
            Training
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'projects' && renderProjects()}
          {activeTab === 'jobs' && renderJobs()}
          {activeTab === 'verification' && renderVerification()}
          {activeTab === 'training' && renderTraining()}
        </div>

        {/* Edit User Modal */}
        <Modal
          isOpen={userEditModalOpen}
          onClose={() => {
            setUserEditModalOpen(false);
            setEditingUser(null);
          }}
          title="Edit User"
          size="lg"
        >
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                />
                <Input
                  label="Email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  disabled
                />
              </div>
              <Select
                label="User Type"
                value={editingUser.user_type || ''}
                onChange={(e) => setEditingUser({ ...editingUser, user_type: e.target.value })}
              >
                <option value="client">Client</option>
                <option value="employer">Employer</option>
                <option value="freelancer">Freelancer</option>
                <option value="trainer">Trainer</option>
                <option value="job_seeker">Job Seeker</option>
                <option value="ba_pm">BA / PM</option>
                <option value="developer">Developer</option>
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-mono uppercase tracking-wider text-foreground mb-2">
                    Is Active
                  </label>
                  <Select
                    value={editingUser.is_active ? 'true' : 'false'}
                    onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.value === 'true' })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Disabled</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-mono uppercase tracking-wider text-foreground mb-2">
                    Is Verified
                  </label>
                  <Select
                    value={editingUser.is_verified ? 'true' : 'false'}
                    onChange={(e) => setEditingUser({ ...editingUser, is_verified: e.target.value === 'true' })}
                  >
                    <option value="true">Verified</option>
                    <option value="false">Not Verified</option>
                  </Select>
                </div>
              </div>
              <Textarea
                label="Bio"
                value={editingUser.bio || ''}
                onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                rows={4}
              />
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => {
                  setUserEditModalOpen(false);
                  setEditingUser(null);
                }} className="font-mono text-xs">
                  CANCEL
                </Button>
                <Button onClick={handleSaveUser} className="font-mono text-xs">
                  SAVE CHANGES
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Project Modal */}
        <Modal
          isOpen={projectEditModalOpen}
          onClose={() => {
            setProjectEditModalOpen(false);
            setEditingProject(null);
          }}
          title="Edit Project"
          size="lg"
        >
          {editingProject && (
            <div className="space-y-4">
              <Input
                label="Title"
                value={editingProject.title || ''}
                onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
              />
              <Textarea
                label="Description"
                value={editingProject.description || ''}
                onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                rows={6}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-mono uppercase tracking-wider text-foreground mb-2">
                    Status
                  </label>
                  <Select
                    value={editingProject.status || 'open'}
                    onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value })}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-mono uppercase tracking-wider text-foreground mb-2">
                    Urgency
                  </label>
                  <Select
                    value={editingProject.urgency || 'medium'}
                    onChange={(e) => setEditingProject({ ...editingProject, urgency: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min Budget (₹)"
                  type="number"
                  value={editingProject.budget_min || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, budget_min: parseInt(e.target.value) || null })}
                />
                <Input
                  label="Max Budget (₹)"
                  type="number"
                  value={editingProject.budget_max || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, budget_max: parseInt(e.target.value) || null })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => {
                  setProjectEditModalOpen(false);
                  setEditingProject(null);
                }} className="font-mono text-xs">
                  CANCEL
                </Button>
                <Button onClick={handleSaveProject} className="font-mono text-xs">
                  SAVE CHANGES
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Job Modal */}
        <Modal
          isOpen={jobEditModalOpen}
          onClose={() => {
            setJobEditModalOpen(false);
            setEditingJob(null);
          }}
          title="Edit Job"
          size="lg"
        >
          {editingJob && (
            <div className="space-y-4">
              <Input
                label="Title"
                value={editingJob.title || ''}
                onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
              />
              <Textarea
                label="Description"
                value={editingJob.description || ''}
                onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                rows={6}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-mono uppercase tracking-wider text-foreground mb-2">
                    Status
                  </label>
                  <Select
                    value={editingJob.status || 'open'}
                    onChange={(e) => setEditingJob({ ...editingJob, status: e.target.value })}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="filled">Filled</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </div>
                <Select
                  label="Job Type"
                  value={editingJob.job_type || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, job_type: e.target.value })}
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min Salary (₹)"
                  type="number"
                  value={editingJob.salary_min || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, salary_min: parseInt(e.target.value) || null })}
                />
                <Input
                  label="Max Salary (₹)"
                  type="number"
                  value={editingJob.salary_max || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, salary_max: parseInt(e.target.value) || null })}
                />
              </div>
              <Input
                label="Location"
                value={editingJob.locations?.[0]?.city || ''}
                onChange={(e) => setEditingJob({
                  ...editingJob,
                  locations: [{ city: e.target.value, country: null, is_primary: true }]
                })}
              />
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => {
                  setJobEditModalOpen(false);
                  setEditingJob(null);
                }} className="font-mono text-xs">
                  CANCEL
                </Button>
                <Button onClick={handleSaveJob} className="font-mono text-xs">
                  SAVE CHANGES
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, type: null, id: null, name: null })}
          onConfirm={() => {
            if (deleteConfirm.type === 'user') {
              handleDeleteUser();
            } else if (deleteConfirm.type === 'project') {
              handleDeleteProject();
            } else if (deleteConfirm.type === 'job') {
              handleDeleteJob();
            } else if (deleteConfirm.type === 'training') {
              handleDeleteTraining();
            }
          }}
          title={`Delete ${deleteConfirm.type?.charAt(0).toUpperCase() + deleteConfirm.type?.slice(1)}`}
          itemName={deleteConfirm.name}
        />
      </div>
    </div>
  );
});

AdminDashboard.displayName = 'AdminDashboard';
