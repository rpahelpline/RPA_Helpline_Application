import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Target, DollarSign, Clock, Star, ArrowRight, Users, 
  CheckCircle, Calendar, Eye, TrendingUp, Briefcase, BarChart3,
  Award, ExternalLink, FileText, MessageSquare, Building2
} from 'lucide-react';

// ============================================================================
// PROJECT CARD COMPONENT
// ============================================================================
const ProjectCard = memo(({ project }) => (
  <Card className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 group">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
              project.status === 'IN_PROGRESS' ? 'bg-secondary/20 text-secondary' :
              project.status === 'PLANNING' ? 'bg-accent/20 text-accent' :
              project.status === 'COMPLETED' ? 'bg-green-500/20 text-green-500' :
              'bg-primary/20 text-primary'
            }`}>
              {project.status.replace('_', ' ')}
            </span>
            {project.priority === 'HIGH' && (
              <span className="text-xs text-primary font-mono">HIGH PRIORITY</span>
            )}
          </div>
          <h4 className="font-display font-bold text-foreground tracking-wider mb-1 group-hover:text-primary transition-colors">
            {project.title}
          </h4>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Building2 className="w-3 h-3" />
            {project.client}
          </p>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
      
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {project.teamSize} team members
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {project.deadline}
        </span>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Progress</span>
          <span className="text-primary font-mono">{project.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <span className="text-lg font-display font-bold text-secondary">{project.budget}</span>
        <Link to={`/projects/${project.id}`}>
          <Button variant="outline" size="sm" className="font-mono text-xs tracking-wider">
            VIEW DETAILS
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
));
ProjectCard.displayName = 'ProjectCard';

// ============================================================================
// OPPORTUNITY CARD COMPONENT
// ============================================================================
const OpportunityCard = memo(({ opportunity }) => (
  <Card className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h4 className="font-display font-bold text-foreground tracking-wider mb-1">
            {opportunity.title}
          </h4>
          <p className="text-xs text-muted-foreground">{opportunity.company}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-mono ${
          opportunity.type === 'PROJECT' ? 'bg-primary/20 text-primary' :
          opportunity.type === 'CONSULTING' ? 'bg-secondary/20 text-secondary' :
          'bg-accent/20 text-accent'
        }`}>
          {opportunity.type}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{opportunity.location}</span>
        <span className="text-secondary font-display font-bold">{opportunity.budget}</span>
      </div>
    </CardContent>
  </Card>
));
OpportunityCard.displayName = 'OpportunityCard';

// ============================================================================
// MAIN DEVELOPER (BA/PM) DASHBOARD COMPONENT
// ============================================================================
export const DeveloperDashboard = memo(() => {
  // Mock projects data
  const projects = useMemo(() => [
    {
      id: '1',
      title: 'Enterprise RPA Implementation',
      client: 'FinTech Global Corp',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      progress: 65,
      teamSize: 8,
      deadline: 'Feb 28, 2025',
      budget: '₹12.5L',
      description: 'Leading the implementation of enterprise-wide RPA solution across multiple departments including finance, HR, and operations.',
    },
    {
      id: '2',
      title: 'Automation Roadmap Development',
      client: 'Healthcare Systems Inc',
      status: 'PLANNING',
      priority: 'MEDIUM',
      progress: 25,
      teamSize: 4,
      deadline: 'Jan 30, 2025',
      budget: '₹4.5L',
      description: 'Developing comprehensive automation strategy and roadmap for healthcare operations.',
    },
    {
      id: '3',
      title: 'Process Mining & Analysis',
      client: 'Manufacturing Plus',
      status: 'COMPLETED',
      priority: 'LOW',
      progress: 100,
      teamSize: 3,
      deadline: 'Dec 15, 2024',
      budget: '₹2.8L',
      description: 'Completed process mining analysis identifying 15 automation opportunities.',
    },
  ], []);

  // Mock opportunities
  const opportunities = useMemo(() => [
    { id: '1', title: 'RPA CoE Setup', company: 'Global Bank', type: 'CONSULTING', location: 'Remote', budget: '₹1,500/hr' },
    { id: '2', title: 'Automation Assessment', company: 'Retail Corp', type: 'PROJECT', location: 'Mumbai', budget: '₹3.5L' },
    { id: '3', title: 'Team Training Lead', company: 'Tech Startup', type: 'TRAINING', location: 'Remote', budget: '₹50,000' },
  ], []);

  // Stats
  const stats = useMemo(() => ({
    activeProjects: 4,
    totalValue: '₹19.8L',
    teamMembers: 15,
    completedThisYear: 12,
  }), []);

  return (
    <div className="space-y-8">
      {/* Section: Overview Stats */}
      <section>
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="tech-panel border-border bg-card/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">ACTIVE PROJECTS</p>
              <p className="text-2xl font-display font-bold text-primary">{stats.activeProjects}</p>
              <p className="text-xs text-muted-foreground mt-1">Currently managing</p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">TOTAL PROJECT VALUE</p>
              <p className="text-2xl font-display font-bold text-secondary">{stats.totalValue}</p>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +22% YoY
              </p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">TEAM MEMBERS</p>
              <p className="text-2xl font-display font-bold text-accent">{stats.teamMembers}</p>
              <p className="text-xs text-muted-foreground mt-1">Across all projects</p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">COMPLETED THIS YEAR</p>
              <p className="text-2xl font-display font-bold text-green-500">{stats.completedThisYear}</p>
              <p className="text-xs text-muted-foreground mt-1">Projects delivered</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section: Current Projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            CURRENT PROJECTS
          </h2>
          <Link to="/projects">
            <Button variant="ghost" className="font-mono text-xs tracking-wider text-secondary">
              VIEW ALL <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* Section: New Opportunities */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-secondary" />
            NEW OPPORTUNITIES
          </h2>
          <Link to="/opportunities">
            <Button variant="ghost" className="font-mono text-xs tracking-wider text-secondary">
              BROWSE ALL <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      </section>

      {/* Section: Quick Actions */}
      <section>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="tech-panel border-border bg-card/50 hover-lift cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground tracking-wider group-hover:text-primary transition-colors">
                  PROJECT ANALYTICS
                </h3>
                <p className="text-sm text-muted-foreground">View performance</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
          
          <Card className="tech-panel border-border bg-card/50 hover-lift cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <FileText className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground tracking-wider group-hover:text-secondary transition-colors">
                  DOCUMENTATION
                </h3>
                <p className="text-sm text-muted-foreground">Project templates</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-secondary transition-colors" />
            </CardContent>
          </Card>
          
          <Card className="tech-panel border-border bg-card/50 hover-lift cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <MessageSquare className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground tracking-wider group-hover:text-accent transition-colors">
                  TEAM CHAT
                </h3>
                <p className="text-sm text-muted-foreground">Collaborate</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
});

DeveloperDashboard.displayName = 'DeveloperDashboard';
