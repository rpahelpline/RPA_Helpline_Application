import { memo, useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { statsApi, profileApi, projectApi } from '../../services/api';
import { 
  Briefcase, Clock, Star, ArrowRight, MapPin, Building2,
  CheckCircle, Calendar, Eye, Target, Code, Zap, Award,
  ExternalLink, BookOpen, Users, FileText
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
  const [recommendedProjects, setRecommendedProjects] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  // Fetch real data from API
  useEffect(() => {
    // Prevent duplicate calls
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    
    const fetchData = async () => {
      let cancelled = false;
      try {
        // Fetch recommended projects
        try {
          const projectsRes = await statsApi.getRecommendedProjects({ limit: 3 });
          if (!cancelled) {
            const formattedProjects = (projectsRes.projects || []).map(p => ({
              id: p.id,
              title: p.title,
              company: p.client?.full_name || 'Company',
              location: p.is_remote ? 'Remote' : p.location || 'Location TBD',
              budget: p.budget_min && p.budget_max 
                ? `₹${p.budget_min.toLocaleString()} - ₹${p.budget_max.toLocaleString()}`
                : 'Budget TBD',
              type: p.budget_type === 'fixed' ? 'Fixed Price' : 'Hourly',
              urgency: p.urgency || 'MEDIUM',
              verified: p.client?.is_verified || false,
              description: p.description || '',
              skills: p.required_skills || [],
              duration: p.duration || 'Flexible',
              proposals: p.application_count || 0,
            }));
            setRecommendedProjects(formattedProjects);
          }
        } catch (error) {
          if (!cancelled) console.error('Failed to fetch recommended projects:', error);
        }

        // Fetch user profile with skills (only if needed)
        // Note: This is a separate call from the main dashboard profile fetch
        // We need skills data specifically for the freelancer dashboard
        try {
          const profileRes = await profileApi.getMyProfile();
          if (!cancelled && profileRes.profile) {
            const userSkills = (profileRes.profile.skills || []).map(s => ({
              name: s.skill?.name || 'Skill',
              level: s.proficiency_level === 'expert' ? 5 : s.proficiency_level === 'advanced' ? 4 : s.proficiency_level === 'intermediate' ? 3 : 2,
              proficiency: s.proficiency_level === 'expert' ? 95 : s.proficiency_level === 'advanced' ? 80 : s.proficiency_level === 'intermediate' ? 65 : 40,
              projects: s.years_experience || 0,
            }));
            setSkills(userSkills.slice(0, 4)); // Show top 4 skills
          }
        } catch (error) {
          if (!cancelled) console.error('Failed to fetch profile:', error);
          // Don't set skills on error - leave empty array
        }

        // For active projects, we'd need user's hired projects
        // For now, leave empty until we have that data
        if (!cancelled) {
          setActiveProjects([]);
        }
      } catch (error) {
        if (!cancelled) console.error('Failed to fetch dashboard data:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
          fetchingRef.current = false;
        }
      }

      return () => {
        cancelled = true;
      };
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section: Skills & Expertise */}
      {skills.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              SKILLS & EXPERTISE
            </h2>
            <Link to="/dashboard?section=profile">
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
      )}

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
        
        {recommendedProjects.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-4">
            {recommendedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <Card className="tech-panel border-border bg-card/50">
            <CardContent className="p-8 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No recommended projects at the moment.</p>
              <Link to="/projects">
                <Button className="font-mono text-xs">BROWSE ALL PROJECTS</Button>
              </Link>
            </CardContent>
          </Card>
        )}
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
