import { memo, useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { freelancerApi, jobApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { 
  Briefcase, DollarSign, Clock, Star, ArrowRight, MapPin, Building2,
  CheckCircle, Calendar, Eye, Users, Target, BookmarkPlus, FileText,
  Award, TrendingUp, ExternalLink, BookOpen, Send, XCircle, AlertCircle
} from 'lucide-react';

// ============================================================================
// JOB CARD COMPONENT
// ============================================================================
const JobCard = memo(({ job, saved = false }) => (
  <Card className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 group">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Building2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h4 className="font-display font-bold text-foreground tracking-wider mb-1 group-hover:text-primary transition-colors">
              {job.title}
            </h4>
            <p className="text-sm text-muted-foreground">{job.company}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {job.type}
              </span>
            </div>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-primary transition-colors">
          <BookmarkPlus className={`w-5 h-5 ${saved ? 'fill-primary text-primary' : ''}`} />
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {job.skills.slice(0, 4).map((skill, i) => (
          <span key={i} className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-mono">
            {skill}
          </span>
        ))}
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div className="flex items-center gap-4">
          <span className="text-lg font-display font-bold text-secondary">{job.salary}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-mono ${
            job.urgency === 'URGENT' ? 'bg-primary/20 text-primary' : 
            job.urgency === 'HOT' ? 'bg-accent/20 text-accent' :
            'bg-secondary/20 text-secondary'
          }`}>
            {job.urgency}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{job.posted}</span>
          <Link to={`/jobs/${job.id}`}>
            <Button variant="outline" size="sm" className="font-mono text-xs tracking-wider">
              APPLY NOW
            </Button>
          </Link>
        </div>
      </div>
    </CardContent>
  </Card>
));
JobCard.displayName = 'JobCard';

// ============================================================================
// APPLICATION CARD COMPONENT
// ============================================================================
const ApplicationCard = memo(({ application }) => {
  const navigate = useNavigate();

  const getStatusConfig = (status) => {
    switch (status) {
      case 'INTERVIEW':
      case 'SHORTLISTED':
        return { color: 'bg-green-500/20 text-green-500', icon: CheckCircle };
      case 'REVIEWED':
        return { color: 'bg-blue-500/20 text-blue-500', icon: Eye };
      case 'PENDING':
        return { color: 'bg-yellow-500/20 text-yellow-500', icon: Clock };
      case 'REJECTED':
        return { color: 'bg-destructive/20 text-destructive', icon: XCircle };
      default:
        return { color: 'bg-muted text-muted-foreground', icon: AlertCircle };
    }
  };

  const statusConfig = getStatusConfig(application.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card 
      className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 cursor-pointer"
      onClick={() => navigate(application.type === 'job' ? `/jobs/${application.itemId}` : `/projects/${application.itemId}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <h4 className="font-display font-bold text-foreground tracking-wider mb-1">
              {application.position}
            </h4>
            <p className="text-xs text-muted-foreground font-mono flex items-center gap-2">
              <Building2 className="w-3 h-3" />
              {application.company}
            </p>
          </div>
          <Badge className={`${statusConfig.color} font-mono text-xs`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {application.status}
          </Badge>
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Application Progress</span>
            <span className="text-primary font-mono">{application.progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                application.status === 'INTERVIEW' || application.status === 'SHORTLISTED' ? 'bg-green-500' :
                application.status === 'REVIEWED' ? 'bg-blue-500' :
                application.status === 'REJECTED' ? 'bg-destructive' :
                'bg-gradient-to-r from-primary to-secondary'
              }`}
              style={{ width: `${application.progress}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Applied: {application.applied}
          </span>
          {application.nextStep && (
            <span className="text-primary">{application.nextStep}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
ApplicationCard.displayName = 'ApplicationCard';

// ============================================================================
// MAIN JOB SEEKER DASHBOARD COMPONENT
// ============================================================================
export const JobSeekerDashboard = memo(() => {
  // Mock data for recommended jobs
  const recommendedJobs = useMemo(() => [
    {
      id: '1',
      title: 'Senior UiPath Developer',
      company: 'TechCorp Industries',
      location: 'Remote',
      type: 'Full-time',
      salary: '₹12L - ₹15L',
      skills: ['UiPath', 'RE Framework', 'SQL', 'Python'],
      urgency: 'URGENT',
      posted: '2 days ago',
    },
    {
      id: '2',
      title: 'RPA Solution Architect',
      company: 'AutomateNow Inc',
      location: 'New York, NY',
      type: 'Full-time',
      salary: '₹14L - ₹18L',
      skills: ['UiPath', 'Automation Anywhere', 'Architecture', 'Leadership'],
      urgency: 'HOT',
      posted: '1 week ago',
    },
    {
      id: '3',
      title: 'Automation Anywhere Lead',
      company: 'Digital First',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '₹13L - ₹16L',
      skills: ['Automation Anywhere', 'IQ Bot', 'Team Lead', 'Agile'],
      urgency: 'NEW',
      posted: 'Just now',
    },
  ], []);

  // State for real applications data
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);

  // Fetch real applications
  useEffect(() => {
    const fetchApplications = async () => {
      setApplicationsLoading(true);
      try {
        const response = await freelancerApi.getMyApplications({ limit: 10 });
        const apps = response.applications || [];
        // Transform to match component expectations
        const transformed = apps.map(app => ({
          id: app.id,
          position: app.job?.title || app.project?.title || 'Untitled',
          company: app.job?.employer?.company_name || app.job?.employer?.full_name || app.project?.client?.company_name || 'Company',
          status: app.status?.toUpperCase() || 'PENDING',
          progress: app.status === 'pending' ? 25 : app.status === 'reviewed' ? 50 : app.status === 'shortlisted' ? 75 : app.status === 'rejected' ? 100 : 50,
          applied: app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Recently',
          nextStep: app.status === 'shortlisted' ? 'Awaiting interview' : app.status === 'reviewed' ? 'Under review' : null,
          type: app.job_id ? 'job' : 'project',
          itemId: app.job_id || app.project_id
        }));
        setApplications(transformed);
      } catch (error) {
        console.error('Failed to fetch applications:', error);
        setApplications([]);
      } finally {
        setApplicationsLoading(false);
      }
    };
    fetchApplications();
  }, []);

  // Calculate stats from real data
  const stats = useMemo(() => ({
    totalApplications: applications.length,
    interviews: applications.filter(a => a.status === 'INTERVIEW' || a.status === 'SHORTLISTED').length,
    profileViews: 0, // Would need separate API
    savedJobs: 0, // Would need separate API
  }), [applications]);

  return (
    <div className="space-y-8">
      {/* Section: Application Stats */}
      <section>
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="tech-panel border-border bg-card/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">TOTAL APPLICATIONS</p>
              <p className="text-2xl font-display font-bold text-primary">{stats.totalApplications}</p>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +3 this week
              </p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">INTERVIEWS</p>
              <p className="text-2xl font-display font-bold text-green-500">{stats.interviews}</p>
              <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">PROFILE VIEWS</p>
              <p className="text-2xl font-display font-bold text-secondary">{stats.profileViews}</p>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                <Eye className="w-3 h-3" /> +28 this week
              </p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">SAVED JOBS</p>
              <p className="text-2xl font-display font-bold text-accent">{stats.savedJobs}</p>
              <Link to="/saved-jobs" className="text-xs text-secondary hover:underline mt-1 inline-block">
                View all →
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section: My Applications */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            MY APPLICATIONS
          </h2>
          <Link to="/applications">
            <Button variant="ghost" className="font-mono text-xs tracking-wider text-secondary">
              VIEW ALL <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
        
        {applicationsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : applications.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {applications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        ) : (
          <Card className="tech-panel border-border bg-card/50">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No applications yet</p>
              <Link to="/jobs">
                <Button className="font-mono text-xs">
                  BROWSE JOBS <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Section: Recommended Jobs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
            <Target className="w-5 h-5 text-secondary" />
            RECOMMENDED FOR YOU
          </h2>
          <Link to="/jobs">
            <Button variant="ghost" className="font-mono text-xs tracking-wider text-secondary">
              BROWSE ALL JOBS <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="space-y-4">
          {recommendedJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>

      {/* Section: Career Resources */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent" />
            CAREER RESOURCES
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="tech-panel border-border bg-card/50 hover-lift cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground tracking-wider group-hover:text-primary transition-colors">
                  RESUME BUILDER
                </h3>
                <p className="text-sm text-muted-foreground">Create ATS-friendly resume</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
          
          <Card className="tech-panel border-border bg-card/50 hover-lift cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <Award className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground tracking-wider group-hover:text-secondary transition-colors">
                  SKILL ASSESSMENTS
                </h3>
                <p className="text-sm text-muted-foreground">Verify your expertise</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-secondary transition-colors" />
            </CardContent>
          </Card>
          
          <Card className="tech-panel border-border bg-card/50 hover-lift cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground tracking-wider group-hover:text-accent transition-colors">
                  INTERVIEW PREP
                </h3>
                <p className="text-sm text-muted-foreground">Practice RPA interviews</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
});

JobSeekerDashboard.displayName = 'JobSeekerDashboard';
