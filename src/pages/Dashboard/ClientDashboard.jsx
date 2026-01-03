import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Briefcase, DollarSign, Clock, Star, ArrowRight, MapPin, Building2,
  CheckCircle, Calendar, Eye, Users, Target, Code, Plus, MessageSquare,
  FileText, Award, TrendingUp, ExternalLink
} from 'lucide-react';

// ============================================================================
// POSTED PROJECT CARD COMPONENT
// ============================================================================
const PostedProjectCard = memo(({ project }) => (
  <Card className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 group">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h4 className="font-display font-bold text-foreground tracking-wider mb-1 group-hover:text-primary transition-colors">
            {project.title}
          </h4>
          <p className="text-xs text-muted-foreground font-mono">{project.budget} • {project.type}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-mono ${
          project.status === 'ACTIVE' ? 'bg-green-500/20 text-green-500' :
          project.status === 'IN_PROGRESS' ? 'bg-secondary/20 text-secondary' :
          project.status === 'REVIEW' ? 'bg-accent/20 text-accent' :
          'bg-muted text-muted-foreground'
        }`}>
          {project.status}
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {project.proposals} proposals
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {project.views} views
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Posted {project.posted}
        </span>
      </div>
      
      {project.assignee && (
        <div className="p-3 rounded-lg bg-muted/50 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
              {project.assignee.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-display text-foreground">{project.assignee.name}</p>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-nasa-gold fill-nasa-gold" />
                <span className="text-xs text-muted-foreground">{project.assignee.rating}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              <MessageSquare className="w-3 h-3 mr-1" /> Chat
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        {project.progress !== undefined ? (
          <div className="flex-1 mr-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-primary font-mono">{project.progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Deadline: {project.deadline}</span>
        )}
        <Link to={`/projects/${project.id}`}>
          <Button variant="outline" size="sm" className="font-mono text-xs tracking-wider">
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
export const ClientDashboard = memo(() => {
  // Mock data for posted projects
  const postedProjects = useMemo(() => [
    {
      id: '1',
      title: 'Invoice Processing Automation',
      budget: '₹50,000 - ₹80,000',
      type: 'Fixed Price',
      status: 'IN_PROGRESS',
      proposals: 15,
      views: 234,
      posted: '3 days ago',
      progress: 45,
      assignee: { name: 'John Smith', rating: 4.9 },
    },
    {
      id: '2',
      title: 'HR Onboarding Bot',
      budget: '₹35,000 - ₹50,000',
      type: 'Fixed Price',
      status: 'ACTIVE',
      proposals: 8,
      views: 156,
      posted: '1 day ago',
      deadline: 'Jan 15, 2025',
    },
    {
      id: '3',
      title: 'Data Migration Scripts',
      budget: '₹750/hr',
      type: 'Hourly',
      status: 'REVIEW',
      proposals: 12,
      views: 189,
      posted: '5 days ago',
      progress: 90,
      assignee: { name: 'Sarah Chen', rating: 5.0 },
    },
  ], []);

  // Mock data for recommended talent
  const recommendedTalent = useMemo(() => [
    {
      id: '1',
      name: 'Alex Johnson',
      title: 'Senior UiPath Developer',
      rating: 4.9,
      completedProjects: 47,
      rate: '₹850/hr',
      skills: ['UiPath', 'RE Framework', 'SQL', 'Python', 'APIs'],
      available: true,
    },
    {
      id: '2',
      name: 'Maria Garcia',
      title: 'AA Solution Architect',
      rating: 5.0,
      completedProjects: 32,
      rate: '₹950/hr',
      skills: ['Automation Anywhere', 'IQ Bot', 'Architecture', 'Training'],
      available: true,
    },
    {
      id: '3',
      name: 'David Kim',
      title: 'Blue Prism Expert',
      rating: 4.8,
      completedProjects: 28,
      rate: '₹800/hr',
      skills: ['Blue Prism', 'Digital Workers', 'API Integration'],
      available: false,
    },
  ], []);

  // Spending data
  const spendingData = useMemo(() => ({
    thisMonth: '₹1.25L',
    lastMonth: '₹82,000',
    totalSpent: '₹8.75L',
    activeContracts: 5,
  }), []);

  return (
    <div className="space-y-8">
      {/* Section: My Projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            MY PROJECTS
          </h2>
          <div className="flex items-center gap-2">
            <Link to="/register/project">
              <Button className="bg-primary hover:bg-primary/90 font-mono text-xs tracking-wider glow-red">
                <Plus className="w-4 h-4 mr-1" />
                POST PROJECT
              </Button>
            </Link>
            <Link to="/projects/my">
              <Button variant="ghost" className="font-mono text-xs tracking-wider text-secondary">
                VIEW ALL <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-4">
          {postedProjects.map((project) => (
            <PostedProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* Section: Spending Overview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-secondary" />
            SPENDING OVERVIEW
          </h2>
        </div>
        
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="tech-panel border-border bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">THIS MONTH</p>
              <p className="text-2xl font-display font-bold text-secondary">{spendingData.thisMonth}</p>
              <p className="text-xs text-accent flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +52% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">LAST MONTH</p>
              <p className="text-2xl font-display font-bold text-foreground">{spendingData.lastMonth}</p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">TOTAL SPENT</p>
              <p className="text-2xl font-display font-bold text-primary">{spendingData.totalSpent}</p>
              <p className="text-xs text-muted-foreground mt-1">Since joining</p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">ACTIVE CONTRACTS</p>
              <p className="text-2xl font-display font-bold text-accent">{spendingData.activeContracts}</p>
              <p className="text-xs text-muted-foreground mt-1">In progress</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section: Recommended Talent */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            RECOMMENDED TALENT
          </h2>
          <Link to="/talent">
            <Button variant="ghost" className="font-mono text-xs tracking-wider text-secondary">
              BROWSE ALL <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          {recommendedTalent.map((talent) => (
            <TalentCard key={talent.id} talent={talent} />
          ))}
        </div>
      </section>

      {/* Section: Quick Actions */}
      <section>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="tech-panel border-border bg-card/50 hover-lift cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground tracking-wider group-hover:text-primary transition-colors">
                  CONTRACTS
                </h3>
                <p className="text-sm text-muted-foreground">Manage agreements</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
          
          <Card className="tech-panel border-border bg-card/50 hover-lift cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <MessageSquare className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground tracking-wider group-hover:text-secondary transition-colors">
                  MESSAGES
                </h3>
                <p className="text-sm text-muted-foreground">Chat with talent</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-secondary transition-colors" />
            </CardContent>
          </Card>
          
          <Card className="tech-panel border-border bg-card/50 hover-lift cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <Award className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground tracking-wider group-hover:text-accent transition-colors">
                  REVIEWS
                </h3>
                <p className="text-sm text-muted-foreground">Rate your talent</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
});

ClientDashboard.displayName = 'ClientDashboard';
