import { memo, useMemo, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Briefcase, DollarSign, Clock, Star, ArrowRight, MapPin, Building2,
  CheckCircle, Calendar, Eye, Users, Target, Code, Plus, MessageSquare,
  FileText, Award, TrendingUp, ExternalLink, BarChart3, Filter
} from 'lucide-react';
import { projectApi, freelancerApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

// ============================================================================
// POSTED PROJECT CARD COMPONENT
// ============================================================================
const PostedProjectCard = memo(({ project }) => (
  <Card className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 group">
    <CardContent className="p-3 md:p-5">
      <div className="flex items-start justify-between gap-3 md:gap-4 mb-3 md:mb-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-bold text-foreground tracking-wider mb-1 text-sm md:text-base group-hover:text-primary transition-colors truncate">
            {project.title}
          </h4>
          <p className="text-[10px] md:text-xs text-muted-foreground font-mono truncate">{project.budget} • {project.type}</p>
        </div>
        <span className={`px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-mono flex-shrink-0 ${project.status === 'ACTIVE' ? 'bg-green-500/20 text-green-500' :
          project.status === 'IN_PROGRESS' ? 'bg-secondary/20 text-secondary' :
            project.status === 'REVIEW' ? 'bg-accent/20 text-accent' :
              'bg-muted text-muted-foreground'
          }`}>
          {project.status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-muted-foreground mb-3 md:mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {project.proposals} proposals
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {project.views} views
        </span>
        <span className="hidden sm:flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Posted {project.posted}
        </span>
      </div>

      {project.assignee && (
        <div className="p-2.5 md:p-3 rounded-lg bg-muted/50 mb-3 md:mb-4">
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[10px] md:text-xs font-bold flex-shrink-0">
              {project.assignee.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-display text-foreground truncate">{project.assignee.name}</p>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-nasa-gold fill-nasa-gold" />
                <span className="text-[10px] md:text-xs text-muted-foreground">{project.assignee.rating}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs min-h-[32px] hidden sm:flex">
              <MessageSquare className="w-3 h-3 mr-1" /> Chat
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-border/50">
        {project.progress !== undefined ? (
          <div className="flex-1 mr-3 md:mr-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-primary font-mono">{project.progress}%</span>
            </div>
            <div className="h-1 md:h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="text-[10px] md:text-xs text-muted-foreground">Deadline: {project.deadline}</span>
        )}
        <Link to={`/projects/${project.id}`}>
          <Button variant="outline" size="sm" className="font-mono text-xs tracking-wider min-h-[36px]">
            MANAGE
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
));
PostedProjectCard.displayName = 'PostedProjectCard';

// ============================================================================
// TALENT CARD COMPONENT
// ============================================================================
const TalentCard = memo(({ talent }) => (
  <Card className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 group">
    <CardContent className="p-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-display font-bold">
          {talent.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h4 className="font-display font-bold text-foreground tracking-wider group-hover:text-primary transition-colors">
            {talent.name}
          </h4>
          <p className="text-xs text-muted-foreground mb-2">{talent.title}</p>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-nasa-gold">
              <Star className="w-3 h-3 fill-nasa-gold" />
              {talent.rating}
            </span>
            <span className="text-muted-foreground">{talent.completedProjects} projects</span>
            <span className="text-secondary font-display font-bold">{talent.rate}</span>
          </div>
        </div>
        {talent.available && (
          <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs">
            Available
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1 mt-3">
        {talent.skills.slice(0, 3).map((skill, i) => (
          <span key={i} className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-mono">
            {skill}
          </span>
        ))}
        {talent.skills.length > 3 && (
          <span className="px-2 py-0.5 text-muted-foreground text-xs">+{talent.skills.length - 3}</span>
        )}
      </div>
    </CardContent>
  </Card>
));
TalentCard.displayName = 'TalentCard';

// ============================================================================
// MAIN CLIENT DASHBOARD COMPONENT
// ============================================================================
export const ClientDashboard = memo(({ initialTab = 'projects' }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recommendedTalent, setRecommendedTalent] = useState([]);
  const [talentLoading, setTalentLoading] = useState(true);
  const talentFetchRef = useRef(false);

  // Fetch recommended talent
  useEffect(() => {
    if (talentFetchRef.current) return;
    talentFetchRef.current = true;

    const fetchTalent = async () => {
      setTalentLoading(true);
      try {
        const response = await freelancerApi.getAll({ limit: 3, is_available: true });
        const freelancers = response.freelancers || [];
        const transformed = freelancers.map(f => {
          const profile = f.profile || {};
          const hourlyRate = f.hourly_rate_min && f.hourly_rate_max
            ? `₹${f.hourly_rate_min}/hr - ₹${f.hourly_rate_max}/hr`
            : f.hourly_rate_min
            ? `₹${f.hourly_rate_min}/hr+`
            : f.hourly_rate_max
            ? `Up to ₹${f.hourly_rate_max}/hr`
            : 'Negotiable';
          
          return {
            id: f.id,
            name: profile.full_name || 'Freelancer',
            title: f.title || profile.headline || 'RPA Developer',
            rating: f.average_rating || 0,
            completedProjects: f.completed_projects || 0,
            rate: hourlyRate,
            skills: [], // Skills would need to be fetched separately or added to the query
            available: f.availability_status === 'available' || f.availability_status === 'partially_available' || profile.is_available !== false,
          };
        });
        setRecommendedTalent(transformed);
      } catch (error) {
        console.error('Failed to fetch talent:', error);
        setRecommendedTalent([]);
      } finally {
        setTalentLoading(false);
      }
    };

    fetchTalent();
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'projects') {
        const response = await projectApi.getMyProjects({ limit: 50 });
        setProjects(response.projects || []);
      } else if (activeTab === 'applications') {
        // Load all applications across all projects
        const projectsResponse = await projectApi.getMyProjects({ limit: 100 });
        const allApplications = [];
        for (const project of projectsResponse.projects || []) {
          try {
            const appsResponse = await projectApi.getApplications(project.id);
            if (appsResponse.applications) {
              appsResponse.applications.forEach(app => {
                allApplications.push({ ...app, project_title: project.title, project_id: project.id });
              });
            }
          } catch (err) {
            console.error(`Failed to load applications for project ${project.id}:`, err);
          }
        }
        setApplications(allApplications);
      } else if (activeTab === 'analytics') {
        // Load analytics data
        const projectsResponse = await projectApi.getMyProjects({ limit: 100 });
        const analyticsData = {
          totalProjects: projectsResponse.pagination?.total || 0,
          totalApplications: 0,
          totalViews: 0,
          activeProjects: 0,
          completedProjects: 0
        };

        for (const project of projectsResponse.projects || []) {
          if (project.status === 'open' || project.status === 'in_progress') {
            analyticsData.activeProjects++;
          } else if (project.status === 'completed') {
            analyticsData.completedProjects++;
          }
          analyticsData.totalViews += project.views || 0;

          try {
            const statsResponse = await projectApi.getApplicationStats(project.id);
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
    { id: 'projects', label: 'My Projects', icon: Briefcase },
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
            className={`px-4 py-2 font-mono text-sm tracking-wider transition-colors border-b-2 ${activeTab === tab.id
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
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  MY PROJECTS
                </h2>
                <Link to="/register/project">
                  <Button className="bg-primary hover:bg-primary/90 font-mono text-xs tracking-wider">
                    <Plus className="w-4 h-4 mr-1" />
                    POST PROJECT
                  </Button>
                </Link>
              </div>

              {projects.length > 0 ? (
                <div className="grid lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <PostedProjectCard
                      key={project.id}
                      project={{
                        ...project,
                        budget: project.budget_min && project.budget_max
                          ? `₹${project.budget_min.toLocaleString()} - ₹${project.budget_max.toLocaleString()}`
                          : project.budget_min
                            ? `₹${project.budget_min.toLocaleString()}+`
                            : 'Not specified',
                        type: 'Fixed Price',
                        proposals: project.application_count || 0,
                        views: project.views || 0,
                        posted: project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Recently',
                        status: project.status?.toUpperCase() || 'ACTIVE'
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Card className="tech-panel border-border">
                  <CardContent className="p-12 text-center">
                    <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-display font-bold text-foreground mb-2">No Projects Yet</h3>
                    <p className="text-muted-foreground mb-6">Start by posting your first project</p>
                    <Link to="/register/project">
                      <Button className="bg-primary hover:bg-primary/90 font-mono text-xs tracking-wider">
                        <Plus className="w-4 h-4 mr-2" />
                        POST YOUR FIRST PROJECT
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
                                {(application.freelancer || application.applicant)?.full_name?.charAt(0) || 'A'}
                              </div>
                              <div>
                                <h4 className="font-display font-bold text-foreground">
                                  {(application.freelancer || application.applicant)?.full_name || 'Applicant'}
                                </h4>
                                <p className="text-sm text-muted-foreground">{application.project_title}</p>
                              </div>
                            </div>
                            {application.cover_letter && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {application.cover_letter}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {application.proposed_rate && (
                                <span>Rate: ₹{application.proposed_rate.toLocaleString()}/hr</span>
                              )}
                              {application.proposed_duration && (
                                <span>Duration: {application.proposed_duration}</span>
                              )}
                              <span>Applied: {new Date(application.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-mono ${application.status === 'accepted' ? 'bg-green-500/20 text-green-500' :
                              application.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                                application.status === 'shortlisted' ? 'bg-blue-500/20 text-blue-500' :
                                  'bg-yellow-500/20 text-yellow-500'
                              }`}>
                              {application.status?.toUpperCase() || 'PENDING'}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/profile/${(application.freelancer || application.applicant)?.id}`)}
                                className="font-mono text-xs"
                              >
                                VIEW PROFILE
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/projects/${application.project_id}`)}
                                className="font-mono text-xs"
                              >
                                VIEW PROJECT
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
                    <p className="text-muted-foreground">Applications will appear here when freelancers apply to your projects</p>
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
                    <p className="text-xs font-mono text-muted-foreground mb-1">TOTAL PROJECTS</p>
                    <p className="text-2xl font-display font-bold text-primary">{stats.totalProjects}</p>
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
                    <p className="text-xs font-mono text-muted-foreground mb-1">ACTIVE PROJECTS</p>
                    <p className="text-2xl font-display font-bold text-accent">{stats.activeProjects}</p>
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

      {/* Recommended Talent Section (shown on projects tab) */}
      {activeTab === 'projects' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              RECOMMENDED TALENT
            </h2>
          </div>

          {talentLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : recommendedTalent.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {recommendedTalent.map((talent) => (
                <TalentCard key={talent.id} talent={talent} />
              ))}
            </div>
          ) : (
            <Card className="tech-panel border-border bg-card/50">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No freelancers available at the moment</p>
              </CardContent>
            </Card>
          )}
        </section>
      )}
    </div>
  );
});

ClientDashboard.displayName = 'ClientDashboard';
