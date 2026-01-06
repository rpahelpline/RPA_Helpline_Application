import { memo, useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Briefcase, Clock, Star, ArrowRight, Eye, Users, Plus, MessageSquare,
  FileText, BarChart3, Filter, CheckCircle
} from 'lucide-react';
import { jobApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

// ============================================================================
// POSTED JOB CARD COMPONENT
// ============================================================================
const PostedJobCard = memo(({ job }) => (
  <Card className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 group">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h4 className="font-display font-bold text-foreground tracking-wider mb-1 group-hover:text-primary transition-colors">
            {job.title}
          </h4>
          <p className="text-xs text-muted-foreground font-mono">{job.salary} • {job.type}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-mono ${
          job.status === 'ACTIVE' ? 'bg-green-500/20 text-green-500' :
          job.status === 'FILLED' ? 'bg-blue-500/20 text-blue-500' :
          'bg-muted text-muted-foreground'
        }`}>
          {job.status}
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {job.applicants} applicants
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {job.views} views
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Posted {job.posted}
        </span>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <span className="text-xs text-muted-foreground">{job.location}</span>
        <Link to={`/jobs/${job.id}`}>
          <Button variant="outline" size="sm" className="font-mono text-xs tracking-wider">
            MANAGE
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
));
PostedJobCard.displayName = 'PostedJobCard';

// ============================================================================
// MAIN EMPLOYER DASHBOARD COMPONENT
// ============================================================================
export const EmployerDashboard = memo(({ initialTab = 'jobs' }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'jobs') {
        const response = await jobApi.getMyPostings({ limit: 50 });
        setJobs(response.jobs || []);
      } else if (activeTab === 'applications') {
        // Load all applications across all jobs
        const jobsResponse = await jobApi.getMyPostings({ limit: 100 });
        const allApplications = [];
        for (const job of jobsResponse.jobs || []) {
          try {
            const appsResponse = await jobApi.getApplications(job.id);
            if (appsResponse.applications) {
              appsResponse.applications.forEach(app => {
                allApplications.push({ ...app, job_title: job.title, job_id: job.id });
              });
            }
          } catch (err) {
            console.error(`Failed to load applications for job ${job.id}:`, err);
          }
        }
        setApplications(allApplications);
      } else if (activeTab === 'analytics') {
        // Load analytics data
        const jobsResponse = await jobApi.getMyPostings({ limit: 100 });
        const analyticsData = {
          totalJobs: jobsResponse.pagination?.total || 0,
          totalApplications: 0,
          totalViews: 0,
          activeJobs: 0,
          filledJobs: 0
        };
        
        for (const job of jobsResponse.jobs || []) {
          if (job.status === 'active') {
            analyticsData.activeJobs++;
          } else if (job.status === 'filled') {
            analyticsData.filledJobs++;
          }
          analyticsData.totalViews += job.views || 0;
          
          try {
            const statsResponse = await jobApi.getApplicationStats(job.id);
            if (statsResponse.stats) {
              analyticsData.totalApplications += statsResponse.stats.total || 0;
            }
          } catch (err) {
            // Ignore errors for stats
          }
        }
        setStats(analyticsData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error(err.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'jobs', label: 'My Jobs', icon: Briefcase },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-mono text-sm tracking-wider transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  MY JOBS
                </h2>
                <Link to="/post-job">
                  <Button className="bg-primary hover:bg-primary/90 font-mono text-xs tracking-wider">
                    <Plus className="w-4 h-4 mr-1" />
                    POST JOB
                  </Button>
                </Link>
              </div>
              
              {jobs.length > 0 ? (
                <div className="grid lg:grid-cols-3 gap-4">
                  {jobs.map((job) => (
                    <PostedJobCard 
                      key={job.id} 
                      job={{
                        ...job,
                        salary: job.salary_min && job.salary_max 
                          ? `₹${job.salary_min.toLocaleString()} - ₹${job.salary_max.toLocaleString()}`
                          : job.salary_min 
                            ? `₹${job.salary_min.toLocaleString()}+`
                            : 'Not specified',
                        type: job.job_type?.replace('_', ' ') || 'Full-time',
                        applicants: job.application_count || 0,
                        views: job.views || 0,
                        posted: job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recently',
                        status: job.status?.toUpperCase() || 'ACTIVE',
                        location: job.location || 'Remote'
                      }} 
                    />
                  ))}
                </div>
              ) : (
                <Card className="tech-panel border-border">
                  <CardContent className="p-12 text-center">
                    <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-display font-bold text-foreground mb-2">No Jobs Yet</h3>
                    <p className="text-muted-foreground mb-6">Start by posting your first job</p>
                    <Link to="/post-job">
                      <Button className="bg-primary hover:bg-primary/90 font-mono text-xs tracking-wider">
                        <Plus className="w-4 h-4 mr-2" />
                        POST YOUR FIRST JOB
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  APPLICATIONS
                </h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="font-mono text-xs">
                    <Filter className="w-4 h-4 mr-2" />
                    FILTER
                  </Button>
                </div>
              </div>
              
              {applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <Card key={application.id} className="tech-panel border-border bg-card/50">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                                {application.applicant?.full_name?.charAt(0) || 'A'}
                              </div>
                              <div>
                                <h4 className="font-display font-bold text-foreground">
                                  {application.applicant?.full_name || 'Applicant'}
                                </h4>
                                <p className="text-sm text-muted-foreground">{application.job_title}</p>
                              </div>
                            </div>
                            {application.cover_letter && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {application.cover_letter}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {application.expected_salary && (
                                <span>Expected: ₹{application.expected_salary.toLocaleString()}/year</span>
                              )}
                              <span>Applied: {new Date(application.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-mono ${
                              application.status === 'accepted' ? 'bg-green-500/20 text-green-500' :
                              application.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                              application.status === 'interview' || application.status === 'phone_screen' ? 'bg-blue-500/20 text-blue-500' :
                              'bg-yellow-500/20 text-yellow-500'
                            }`}>
                              {application.status?.toUpperCase() || 'PENDING'}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/profile/${application.applicant?.id}`)}
                                className="font-mono text-xs"
                              >
                                VIEW PROFILE
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/jobs/${application.job_id}`)}
                                className="font-mono text-xs"
                              >
                                VIEW JOB
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="tech-panel border-border">
                  <CardContent className="p-12 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-display font-bold text-foreground mb-2">No Applications Yet</h3>
                    <p className="text-muted-foreground">Applications will appear here when candidates apply to your jobs</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'analytics' && stats && (
            <div className="space-y-6">
              <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                ANALYTICS
              </h2>
              
              <div className="grid md:grid-cols-4 gap-4">
                <Card className="tech-panel border-border bg-card/50">
                  <CardContent className="p-4">
                    <p className="text-xs font-mono text-muted-foreground mb-1">TOTAL JOBS</p>
                    <p className="text-2xl font-display font-bold text-primary">{stats.totalJobs}</p>
                  </CardContent>
                </Card>
                <Card className="tech-panel border-border bg-card/50">
                  <CardContent className="p-4">
                    <p className="text-xs font-mono text-muted-foreground mb-1">TOTAL APPLICATIONS</p>
                    <p className="text-2xl font-display font-bold text-secondary">{stats.totalApplications}</p>
                  </CardContent>
                </Card>
                <Card className="tech-panel border-border bg-card/50">
                  <CardContent className="p-4">
                    <p className="text-xs font-mono text-muted-foreground mb-1">ACTIVE JOBS</p>
                    <p className="text-2xl font-display font-bold text-accent">{stats.activeJobs}</p>
                  </CardContent>
                </Card>
                <Card className="tech-panel border-border bg-card/50">
                  <CardContent className="p-4">
                    <p className="text-xs font-mono text-muted-foreground mb-1">TOTAL VIEWS</p>
                    <p className="text-2xl font-display font-bold text-foreground">{stats.totalViews}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});

EmployerDashboard.displayName = 'EmployerDashboard';

