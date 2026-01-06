import { memo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { freelancerApi, jobApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { Container } from '../../components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ArrowLeft, Briefcase, Building2, MapPin, Clock, Calendar,
  CheckCircle, XCircle, AlertCircle, Eye, ArrowRight, FileText,
  Filter, Search, TrendingUp, MessageSquare, Phone, Video
} from 'lucide-react';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
// Get timeline events for an application
const getTimelineEvents = (application) => {
  const events = [];
  if (application.created_at) {
    events.push({
      date: new Date(application.created_at),
      label: 'Application Submitted',
      icon: FileText,
      color: 'text-primary'
    });
  }
  if (application.status === 'reviewed' && application.updated_at) {
    events.push({
      date: new Date(application.updated_at),
      label: 'Under Review',
      icon: Eye,
      color: 'text-blue-500'
    });
  }
  if (application.status === 'shortlisted' && application.updated_at) {
    events.push({
      date: new Date(application.updated_at),
      label: 'Shortlisted',
      icon: CheckCircle,
      color: 'text-green-500'
    });
  }
  if ((application.status === 'interview' || application.status === 'phone_screen') && application.updated_at) {
    events.push({
      date: new Date(application.updated_at),
      label: application.status === 'phone_screen' ? 'Phone Screen Scheduled' : 'Interview Scheduled',
      icon: application.status === 'phone_screen' ? Phone : Video,
      color: 'text-purple-500'
    });
  }
  if (application.status === 'accepted' && application.updated_at) {
    events.push({
      date: new Date(application.updated_at),
      label: 'Offer Received',
      icon: CheckCircle,
      color: 'text-green-500'
    });
  }
  if (application.status === 'rejected' && application.updated_at) {
    events.push({
      date: new Date(application.updated_at),
      label: 'Application Rejected',
      icon: XCircle,
      color: 'text-red-500'
    });
  }
  return events.sort((a, b) => a.date - b.date);
};

// ============================================================================
// APPLICATION CARD COMPONENT
// ============================================================================
const ApplicationCard = memo(({ application, type }) => {
  const navigate = useNavigate();

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { color: 'bg-yellow-500/20 text-yellow-500', icon: Clock, label: 'PENDING' };
      case 'reviewed':
        return { color: 'bg-blue-500/20 text-blue-500', icon: Eye, label: 'REVIEWED' };
      case 'shortlisted':
        return { color: 'bg-green-500/20 text-green-500', icon: CheckCircle, label: 'SHORTLISTED' };
      case 'interview':
        return { color: 'bg-purple-500/20 text-purple-500', icon: Calendar, label: 'INTERVIEW' };
      case 'offer':
        return { color: 'bg-primary/20 text-primary', icon: CheckCircle, label: 'OFFER' };
      case 'rejected':
        return { color: 'bg-red-500/20 text-red-500', icon: XCircle, label: 'REJECTED' };
      case 'withdrawn':
        return { color: 'bg-muted text-muted-foreground', icon: XCircle, label: 'WITHDRAWN' };
      default:
        return { color: 'bg-muted text-muted-foreground', icon: AlertCircle, label: status?.toUpperCase() || 'UNKNOWN' };
    }
  };

  const statusConfig = getStatusConfig(application.status);
  const StatusIcon = statusConfig.icon;

  // Get the job or project details
  const item = type === 'job' ? application.job : application.project;
  const employer = type === 'job' ? item?.employer : item?.client;

  return (
    <Card className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge className={`${statusConfig.color} font-mono text-xs`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
              {type === 'job' && (
                <Badge variant="outline" className="font-mono text-xs">JOB</Badge>
              )}
              {type === 'project' && (
                <Badge variant="outline" className="font-mono text-xs">PROJECT</Badge>
              )}
            </div>
            <h3 className="text-base font-display font-bold text-foreground tracking-wider group-hover:text-primary transition-colors">
              {item?.title || 'Untitled'}
            </h3>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              {employer && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {employer.company_name || employer.full_name || 'Company'}
                </span>
              )}
              {item?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {item.location}
                </span>
              )}
              {item?.is_remote && (
                <Badge variant="outline" className="text-xs">Remote</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Application Details */}
        <div className="mb-3 p-2.5 rounded-lg bg-muted/30">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground font-mono mb-1">APPLIED ON</p>
              <p className="text-foreground">
                {application.created_at ? new Date(application.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            {application.expected_salary && (
              <div>
                <p className="text-xs text-muted-foreground font-mono mb-1">EXPECTED SALARY</p>
                <p className="text-foreground">₹{application.expected_salary.toLocaleString()}</p>
              </div>
            )}
            {application.proposed_rate && (
              <div>
                <p className="text-xs text-muted-foreground font-mono mb-1">PROPOSED RATE</p>
                <p className="text-foreground">₹{application.proposed_rate}/hr</p>
              </div>
            )}
          </div>
        </div>

        {/* Cover Letter Preview */}
        {application.cover_letter && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground font-mono mb-1">COVER LETTER</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{application.cover_letter}</p>
          </div>
        )}

        {/* Timeline */}
        {getTimelineEvents(application).length > 0 && (
          <div className="mb-3 p-2.5 rounded-lg bg-muted/20">
            <p className="text-xs text-muted-foreground font-mono mb-1.5">APPLICATION TIMELINE</p>
            <div className="space-y-1.5">
              {getTimelineEvents(application).map((event, idx) => {
                const EventIcon = event.icon;
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <EventIcon className={`w-3 h-3 ${event.color}`} />
                    <span className="text-muted-foreground">{event.label}</span>
                    <span className="text-muted-foreground/50 ml-auto">
                      {event.date.toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            {application.updated_at && application.updated_at !== application.created_at && (
              <>Updated {new Date(application.updated_at).toLocaleDateString()}</>
            )}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs"
            onClick={() => navigate(type === 'job' ? `/jobs/${item?.id}` : `/projects/${item?.id}`)}
          >
            VIEW {type === 'job' ? 'JOB' : 'PROJECT'}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
ApplicationCard.displayName = 'ApplicationCard';

// ============================================================================
// MAIN MY APPLICATIONS PAGE
// ============================================================================
export const MyApplications = memo(() => {
  const navigate = useNavigate();
  const { isAuthenticated, profile, user } = useAuthStore();
  const role = profile?.user_type || user?.user_type || null;
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('all');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'job', 'project'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/sign-in');
    }
  }, [isAuthenticated, navigate]);

  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        // For now, we'll use mock data since the backend might not have a unified applications endpoint
        // In production, you'd fetch from the actual API
        const response = await freelancerApi.getMyApplications({ limit: 50 });
        setApplications(response.applications || []);
      } catch (error) {
        console.error('Failed to fetch applications:', error);
        // Use empty array as fallback
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated]);

  // Filter applications by status, type, and search
  const filteredApplications = applications.filter(app => {
    // Status filter
    if (activeTab !== 'all' && app.status?.toLowerCase() !== activeTab) {
      return false;
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      const appType = app.job_id ? 'job' : 'project';
      if (appType !== typeFilter) return false;
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const item = app.job || app.project;
      const title = item?.title?.toLowerCase() || '';
      const company = (item?.employer?.company_name || item?.employer?.full_name || item?.client?.company_name || item?.client?.full_name || '').toLowerCase();
      if (!title.includes(query) && !company.includes(query)) {
        return false;
      }
    }
    
    return true;
  });

  // Get counts for tabs
  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status?.toLowerCase() === 'pending').length,
    reviewed: applications.filter(a => a.status?.toLowerCase() === 'reviewed').length,
    shortlisted: applications.filter(a => a.status?.toLowerCase() === 'shortlisted').length,
    interview: applications.filter(a => a.status?.toLowerCase() === 'interview' || a.status?.toLowerCase() === 'phone_screen').length,
    accepted: applications.filter(a => a.status?.toLowerCase() === 'accepted').length,
    rejected: applications.filter(a => a.status?.toLowerCase() === 'rejected').length,
  };

  return (
    <div className="min-h-screen pt-20">
      <Container className="py-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-foreground font-mono uppercase tracking-wider text-xs mb-3 hover:text-secondary transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            BACK TO DASHBOARD
          </Link>

          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-foreground tracking-wider">
                  MY APPLICATIONS
                </h1>
                <p className="text-muted-foreground text-xs">Track your job and project applications</p>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mb-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Tabs and Type Filter */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'reviewed', label: 'Reviewed' },
                { id: 'shortlisted', label: 'Shortlisted' },
                { id: 'interview', label: 'Interview' },
                { id: 'accepted', label: 'Accepted' },
                { id: 'rejected', label: 'Rejected' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-mono transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'tech-panel text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-muted'
                  }`}>
                    {counts[tab.id] || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-card border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Types</option>
                <option value="job">Jobs</option>
                <option value="project">Projects</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : filteredApplications.length > 0 ? (
          <div className="space-y-3">
            {filteredApplications.map(application => (
              <ApplicationCard 
                key={application.id} 
                application={application}
                type={application.job_id ? 'job' : 'project'}
              />
            ))}
          </div>
        ) : (
          <Card className="tech-panel border-border bg-card/50">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-display font-bold text-foreground mb-2">
                No Applications Found
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {activeTab === 'all' 
                  ? "You haven't applied to any jobs or projects yet."
                  : `No ${activeTab} applications.`}
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/jobs')}
                  className="font-mono text-xs"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  BROWSE JOBS
                </Button>
                <Button
                  onClick={() => navigate('/projects')}
                  className="font-mono text-xs"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  BROWSE PROJECTS
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </Container>
    </div>
  );
});

MyApplications.displayName = 'MyApplications';

