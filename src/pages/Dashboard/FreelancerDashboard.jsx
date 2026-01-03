import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Briefcase, DollarSign, Clock, Star, ArrowRight, MapPin, Building2,
  CheckCircle, Calendar, Eye, TrendingUp, Target, Code, Zap, Award,
  ExternalLink, BookOpen, Users
} from 'lucide-react';

// ============================================================================
// PROJECT CARD COMPONENT
// ============================================================================
const ProjectCard = memo(({ project }) => (
  <Card className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 group">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${project.urgency === 'HIGH' ? 'bg-primary/20 text-primary' : project.urgency === 'MEDIUM' ? 'bg-accent/20 text-accent' : 'bg-secondary/20 text-secondary'}`}>
              {project.urgency} PRIORITY
            </span>
            {project.verified && (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <CheckCircle className="w-3 h-3" /> VERIFIED
              </span>
            )}
          </div>
          <CardTitle className="text-base font-display tracking-wider group-hover:text-primary transition-colors">
            {project.title}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
            <Building2 className="w-3 h-3" />
            {project.company}
            <span className="text-muted-foreground/50">•</span>
            <MapPin className="w-3 h-3" />
            {project.location}
          </CardDescription>
        </div>
        <div className="text-right">
          <p className="text-lg font-display font-bold text-secondary">{project.budget}</p>
          <p className="text-xs text-muted-foreground font-mono">{project.type}</p>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {project.skills.map((skill, i) => (
          <span key={i} className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-mono">
            {skill}
          </span>
        ))}
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {project.duration}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {project.proposals} proposals
          </span>
        </div>
        <Link to={`/projects/${project.id}`}>
          <Button variant="outline" size="sm" className="font-mono text-xs tracking-wider group-hover:border-primary group-hover:text-primary">
            VIEW DETAILS
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
));
ProjectCard.displayName = 'ProjectCard';

// ============================================================================
// ACTIVE PROJECT CARD COMPONENT
// ============================================================================
const ActiveProjectCard = memo(({ project }) => (
  <Card className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h4 className="font-display font-bold text-foreground tracking-wider mb-1">{project.title}</h4>
          <p className="text-xs text-muted-foreground font-mono flex items-center gap-2">
            <Building2 className="w-3 h-3" />
            {project.client}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-mono ${
          project.status === 'IN_PROGRESS' ? 'bg-secondary/20 text-secondary' :
          project.status === 'REVIEW' ? 'bg-accent/20 text-accent' :
          'bg-green-500/20 text-green-500'
        }`}>
          {project.status.replace('_', ' ')}
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
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Due: {project.deadline}
        </span>
        <span className="text-secondary font-display font-bold">{project.earnings}</span>
      </div>
    </CardContent>
  </Card>
));
ActiveProjectCard.displayName = 'ActiveProjectCard';

// ============================================================================
// SKILL BADGE COMPONENT
// ============================================================================
const SkillBadge = memo(({ skill }) => (
  <div className="tech-panel rounded-xl p-4 hover-lift transition-all duration-300 group">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-display font-bold text-foreground group-hover:text-primary transition-colors">
        {skill.name}
      </span>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star 
            key={i} 
            className={`w-3 h-3 ${i < skill.level ? 'text-nasa-gold fill-nasa-gold' : 'text-muted-foreground/30'}`} 
          />
        ))}
      </div>
    </div>
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-nasa-gold to-accent rounded-full"
        style={{ width: `${skill.proficiency}%` }}
      />
    </div>
    <p className="text-xs text-muted-foreground mt-2 font-mono">{skill.projects} projects completed</p>
  </div>
));
SkillBadge.displayName = 'SkillBadge';

// ============================================================================
// MAIN FREELANCER DASHBOARD COMPONENT
// ============================================================================
export const FreelancerDashboard = memo(() => {
  // Mock data for recommended projects
  const recommendedProjects = useMemo(() => [
    {
      id: '1',
      title: 'UiPath Process Automation for Finance',
      company: 'FinTech Corp',
      location: 'Remote',
      budget: '₹50,000 - ₹80,000',
      type: 'Fixed Price',
      urgency: 'HIGH',
      verified: true,
      description: 'Looking for an experienced UiPath developer to automate invoice processing and reconciliation workflows. RE Framework experience required.',
      skills: ['UiPath', 'RE Framework', 'SQL', 'Excel'],
      duration: '2-3 weeks',
      proposals: 12,
    },
    {
      id: '2',
      title: 'Automation Anywhere Bot Development',
      company: 'Healthcare Plus',
      location: 'Remote',
      budget: '₹35,000 - ₹50,000',
      type: 'Fixed Price',
      urgency: 'MEDIUM',
      verified: true,
      description: 'Need AA developer to create bots for patient data management and appointment scheduling.',
      skills: ['Automation Anywhere', 'IQ Bot', 'Python', 'APIs'],
      duration: '1-2 weeks',
      proposals: 8,
    },
    {
      id: '3',
      title: 'Blue Prism CoE Setup',
      company: 'Enterprise Solutions',
      location: 'Hybrid - NYC',
      budget: '₹800/hr',
      type: 'Hourly',
      urgency: 'LOW',
      verified: false,
      description: 'Seeking Blue Prism expert to help establish Center of Excellence and develop best practices.',
      skills: ['Blue Prism', 'Process Mining', 'Architecture', 'Training'],
      duration: 'Ongoing',
      proposals: 5,
    },
  ], []);

  // Mock data for active projects
  const activeProjects = useMemo(() => [
    { id: '1', title: 'Invoice Automation Bot', client: 'TechCorp Inc', status: 'IN_PROGRESS', progress: 65, deadline: 'Dec 15, 2024', earnings: '₹42,000' },
    { id: '2', title: 'Data Migration Scripts', client: 'DataFlow LLC', status: 'REVIEW', progress: 90, deadline: 'Dec 10, 2024', earnings: '₹28,000' },
    { id: '3', title: 'HR Onboarding Bot', client: 'HR Solutions', status: 'IN_PROGRESS', progress: 35, deadline: 'Dec 28, 2024', earnings: '₹35,000' },
  ], []);

  // Mock data for skills
  const skills = useMemo(() => [
    { name: 'UiPath', level: 5, proficiency: 95, projects: 24 },
    { name: 'Automation Anywhere', level: 4, proficiency: 80, projects: 18 },
    { name: 'Blue Prism', level: 3, proficiency: 65, projects: 8 },
    { name: 'Python', level: 4, proficiency: 85, projects: 15 },
  ], []);

  // Mock earnings data
  const earningsData = useMemo(() => ({
    thisMonth: '₹48,500',
    lastMonth: '₹32,000',
    pending: '₹21,000',
    totalEarnings: '₹4.25L',
  }), []);

  return (
    <div className="space-y-8">
      {/* Section: Active Projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            ACTIVE PROJECTS
          </h2>
          <Link to="/projects/active">
            <Button variant="ghost" className="font-mono text-xs tracking-wider text-secondary">
              VIEW ALL <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          {activeProjects.map((project) => (
            <ActiveProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* Section: Earnings Overview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-secondary" />
            EARNINGS OVERVIEW
          </h2>
        </div>
        
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="tech-panel border-border bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">THIS MONTH</p>
              <p className="text-2xl font-display font-bold text-secondary">{earningsData.thisMonth}</p>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +52% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">LAST MONTH</p>
              <p className="text-2xl font-display font-bold text-foreground">{earningsData.lastMonth}</p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">PENDING</p>
              <p className="text-2xl font-display font-bold text-accent">{earningsData.pending}</p>
              <p className="text-xs text-muted-foreground mt-1">3 invoices pending</p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">TOTAL EARNINGS</p>
              <p className="text-2xl font-display font-bold text-primary">{earningsData.totalEarnings}</p>
              <p className="text-xs text-muted-foreground mt-1">Since joining</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section: Skills & Expertise */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            SKILLS & EXPERTISE
          </h2>
          <Link to="/profile-setup">
            <Button variant="ghost" className="font-mono text-xs tracking-wider text-secondary">
              UPDATE SKILLS <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-4 gap-4">
          {skills.map((skill) => (
            <SkillBadge key={skill.name} skill={skill} />
          ))}
        </div>
      </section>

      {/* Section: Recommended Projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
            <Zap className="w-5 h-5 text-nasa-gold" />
            RECOMMENDED FOR YOU
          </h2>
          <Link to="/projects">
            <Button variant="ghost" className="font-mono text-xs tracking-wider text-secondary">
              BROWSE ALL <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-4">
          {recommendedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* Section: Quick Links */}
      <section>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="tech-panel border-border bg-card/50 hover-lift cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground tracking-wider group-hover:text-primary transition-colors">
                  LEARNING CENTER
                </h3>
                <p className="text-sm text-muted-foreground">Boost your skills</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
          
          <Card className="tech-panel border-border bg-card/50 hover-lift cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground tracking-wider group-hover:text-secondary transition-colors">
                  COMMUNITY
                </h3>
                <p className="text-sm text-muted-foreground">Connect with peers</p>
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
                  CERTIFICATIONS
                </h3>
                <p className="text-sm text-muted-foreground">Get certified</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
});

FreelancerDashboard.displayName = 'FreelancerDashboard';
