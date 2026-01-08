import { memo, useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { 
  Users, Briefcase, Code, ArrowRight, CheckCircle, MessageSquare, 
  Cpu, Target, Activity, Rocket, Search, Shield, Zap, Award,
  Globe, TrendingUp, Clock, Star, ChevronDown, Play, Sparkles,
  GraduationCap, Building2, UserCheck, Layers, Terminal, Database,
  Bot, Workflow, CircuitBoard, Radio, Satellite, Navigation
} from "lucide-react";

// ============================================================================
// ANIMATED COUNTER COMPONENT
// ============================================================================
const AnimatedCounter = memo(({ end, duration = 2000, suffix = "", prefix = "" }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime;
    const startValue = 0;
    const endValue = parseFloat(end);

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;
      
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, isVisible]);

  const displayValue = typeof end === 'string' && end.includes('.') 
    ? count.toFixed(1) 
    : Math.floor(count);

  return (
    <span ref={countRef}>
      {prefix}{displayValue}{suffix}
    </span>
  );
});
AnimatedCounter.displayName = 'AnimatedCounter';

// ============================================================================
// FLOATING PARTICLES COMPONENT
// ============================================================================
const FloatingParticles = memo(() => {
  const particles = useMemo(() => 
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animation: `float ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
});
FloatingParticles.displayName = 'FloatingParticles';

// ============================================================================
// TYPING ANIMATION COMPONENT
// ============================================================================
const TypingText = memo(({ texts, className = "" }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentFullText = texts[currentTextIndex];
    const typingSpeed = isDeleting ? 50 : 100;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentFullText.length) {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentTextIndex, texts]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse text-primary">|</span>
    </span>
  );
});
TypingText.displayName = 'TypingText';

// ============================================================================
// SCROLL REVEAL COMPONENT
// ============================================================================
const ScrollReveal = memo(({ children, className = "", delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
});
ScrollReveal.displayName = 'ScrollReveal';

// ============================================================================
// SERVICE CARD COMPONENT
// ============================================================================
const ServiceCard = memo(({ service, index }) => (
  <ScrollReveal delay={index * 100}>
    <Card className="group tech-panel hover-lift border-border hover:border-primary/50 overflow-hidden bg-card/50 h-full transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/30 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/20">
            <service.icon className="h-7 w-7 text-primary" />
          </div>
          <span className="text-xs font-mono text-muted-foreground bg-card/80 px-2 py-1 rounded">{service.code}</span>
        </div>
        <CardTitle className="text-lg font-display tracking-wider group-hover:text-primary transition-colors">
          {service.title}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm leading-relaxed">
          {service.desc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {service.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-sm group/item">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full group-hover/item:scale-150 transition-transform" />
              <span className="text-muted-foreground group-hover/item:text-foreground transition-colors">{feature}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 pt-4 border-t border-border/50">
          <Link 
            to={service.link} 
            className="inline-flex items-center gap-2 text-sm font-display text-primary hover:text-primary/80 transition-colors group/link"
          >
            <span>EXPLORE MODULE</span>
            <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </CardContent>
    </Card>
  </ScrollReveal>
));
ServiceCard.displayName = 'ServiceCard';

// ============================================================================
// PLATFORM BADGE COMPONENT
// ============================================================================
const PlatformBadge = memo(({ platform, index }) => (
  <ScrollReveal delay={index * 50}>
    <div className="group relative">
      <div className="px-8 py-5 tech-panel rounded-lg hover-lift cursor-pointer border-glow-blue overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        <div className="relative flex items-center gap-3">
          <platform.icon className="w-5 h-5 text-secondary opacity-70 group-hover:opacity-100 transition-opacity" />
          <span className="text-sm font-display tracking-widest text-foreground group-hover:text-secondary transition-colors">
            {platform.name}
          </span>
        </div>
      </div>
    </div>
  </ScrollReveal>
));
PlatformBadge.displayName = 'PlatformBadge';

// ============================================================================
// JOB CARD COMPONENT
// ============================================================================
const JobCard = memo(({ job, index }) => (
  <ScrollReveal delay={index * 80}>
    <Card className="tech-panel hover-lift border-border hover:border-primary/50 group bg-card/50 h-full transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <CardTitle className="text-base font-display tracking-wider mb-1.5 group-hover:text-primary transition-colors">
              {job.title}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm font-mono flex items-center gap-2">
              <Building2 className="w-3 h-3" />
              {job.company}
            </CardDescription>
          </div>
          <span className={`text-[10px] font-mono px-3 py-1.5 rounded-full font-bold ${
            job.priority === 'CRITICAL' ? 'bg-primary/20 text-primary border border-primary/30' :
            job.priority === 'HIGH' ? 'bg-accent/20 text-accent border border-accent/30' :
            'bg-secondary/20 text-secondary border border-secondary/30'
          }`}>
            {job.priority}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-mono flex items-center gap-2">
              <Globe className="w-3 h-3" />
              {job.location}
            </span>
            <span className="font-display font-bold text-secondary">{job.salary}</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <span className="text-xs font-mono text-muted-foreground bg-card px-2 py-1 rounded">{job.type}</span>
            <Link 
              to="/jobs" 
              className="text-xs font-display text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              VIEW DETAILS
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  </ScrollReveal>
));
JobCard.displayName = 'JobCard';

// ============================================================================
// USER TYPE CARD COMPONENT
// ============================================================================
const UserTypeCard = memo(({ type, index }) => (
  <ScrollReveal delay={index * 100}>
    <Link to={type.link}>
      <div className="group relative tech-panel-strong rounded-xl p-8 hover-lift cursor-pointer border-glow-red overflow-hidden h-full transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
        
        <div className="relative">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 ${type.bgColor} group-hover:scale-110`}>
            <type.icon className={`w-8 h-8 ${type.iconColor}`} />
          </div>
          
          <h3 className="text-xl font-display font-bold text-foreground mb-2 tracking-wider group-hover:text-primary transition-colors">
            {type.title}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {type.description}
          </p>
          
          <div className="space-y-2 mb-6">
            {type.benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-secondary" />
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2 text-primary font-display text-sm group-hover:gap-3 transition-all">
            <span>GET STARTED</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  </ScrollReveal>
));
UserTypeCard.displayName = 'UserTypeCard';

// ============================================================================
// MAIN HOME COMPONENT
// ============================================================================
export const Home = memo(() => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToSection = useCallback((sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Memoized static data
  const statsData = useMemo(() => [
    { value: "500", label: "ACTIVE SPECIALISTS", suffix: "+", icon: Users },
    { value: "1200", label: "PROJECTS COMPLETED", suffix: "+", icon: Briefcase },
    { value: "99.8", label: "SUCCESS RATE", suffix: "%", icon: TrendingUp },
    { value: "24", label: "HOUR RESPONSE", suffix: "H", icon: Clock },
  ], []);

  const heroTexts = useMemo(() => [
    "Automation Specialists",
    "UiPath Developers",
    "RPA Consultants",
    "Bot Engineers",
    "Process Architects"
  ], []);

  const servicesData = useMemo(() => [
    { 
      icon: MessageSquare, 
      title: "RPA CONSULTATION", 
      code: "CON-01", 
      desc: "Connect with certified RPA experts for consultation, troubleshooting, and strategic automation guidance.",
      features: ["Expert consultations", "Rapid diagnostics", "Architecture review", "Best practices"],
      link: "/register/freelancer"
    },
    { 
      icon: Users, 
      title: "HIRE TALENT", 
      code: "HIR-02", 
      desc: "Access a global network of verified automation specialists ready for immediate deployment.",
      features: ["Verified profiles", "Skill assessments", "Flexible engagement", "Fast matching"],
      link: "/register/client"
    },
    { 
      icon: Briefcase, 
      title: "FIND JOBS", 
      code: "JOB-03", 
      desc: "Discover exciting career opportunities in robotic process automation across leading organizations.",
      features: ["Remote positions", "Competitive pay", "Top companies", "Career growth"],
      link: "/register/job-seeker"
    },
    { 
      icon: GraduationCap, 
      title: "RPA TRAINING", 
      code: "TRN-04", 
      desc: "Master RPA platforms with expert-led training programs and hands-on certification courses.",
      features: ["Certified courses", "Hands-on labs", "Expert instructors", "Career support"],
      link: "/register/trainer"
    },
  ], []);

  const platformsData = useMemo(() => [
    { name: "UIPATH", icon: Bot },
    { name: "AUTOMATION ANYWHERE", icon: Workflow },
    { name: "BLUE PRISM", icon: CircuitBoard },
    { name: "POWER AUTOMATE", icon: Zap },
    { name: "WORKFUSION", icon: Database },
    { name: "PEGA", icon: Layers },
  ], []);

  const userTypes = useMemo(() => [
    {
      title: "RPA FREELANCER",
      description: "Offer your automation expertise on a project basis. Set your rates, choose your projects.",
      icon: Code,
      bgColor: "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30",
      iconColor: "text-primary",
      link: "/register/freelancer",
      benefits: ["Flexible schedule", "Premium rates", "Global clients", "Build portfolio"]
    },
    {
      title: "JOB SEEKER",
      description: "Find full-time positions at leading companies. Build your career in automation.",
      icon: Briefcase,
      bgColor: "bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30",
      iconColor: "text-secondary",
      link: "/register/job-seeker",
      benefits: ["Full-time roles", "Benefits packages", "Career growth", "Top employers"]
    },
    {
      title: "RPA TRAINER",
      description: "Share your expertise and train the next generation of automation professionals.",
      icon: GraduationCap,
      bgColor: "bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30",
      iconColor: "text-accent",
      link: "/register/trainer",
      benefits: ["Set curriculum", "Online courses", "Certification", "Passive income"]
    },
    {
      title: "BA / PROJECT MANAGER",
      description: "Lead automation initiatives. Bridge business needs with technical implementation.",
      icon: Target,
      bgColor: "bg-gradient-to-br from-nasa-gold/20 to-nasa-gold/5 border border-nasa-gold/30",
      iconColor: "text-nasa-gold",
      link: "/register/developer",
      benefits: ["Strategic roles", "Team leadership", "High impact", "Executive visibility"]
    },
  ], []);

  const hiringTypes = useMemo(() => [
    {
      title: "HIRE DEVELOPER",
      description: "Find expert RPA developers for your automation projects",
      icon: Code,
      link: "/register/client",
      stats: "500+ developers"
    },
    {
      title: "HIRE TRAINER",
      description: "Get certified trainers for your team's RPA education",
      icon: GraduationCap,
      link: "/register/client",
      stats: "100+ trainers"
    },
    {
      title: "HIRE BA/PM",
      description: "Strategic automation leaders for your initiatives",
      icon: Target,
      link: "/register/client",
      stats: "200+ analysts"
    },
    {
      title: "HIRE FREELANCER",
      description: "Flexible talent for short-term automation projects",
      icon: Users,
      link: "/register/client",
      stats: "300+ freelancers"
    },
  ], []);

  const jobsData = useMemo(() => [
    { title: "Senior UiPath Developer", company: "TechCorp Inc", location: "REMOTE", salary: "$120K-$150K", type: "FULL-TIME", priority: "HIGH" },
    { title: "RPA Solution Architect", company: "AutomateNow", location: "NEW YORK", salary: "$140K-$180K", type: "FULL-TIME", priority: "CRITICAL" },
    { title: "Automation Anywhere Lead", company: "Digital First", location: "SAN FRANCISCO", salary: "$130K-$160K", type: "FULL-TIME", priority: "HIGH" },
    { title: "Blue Prism Developer", company: "FinanceBot", location: "REMOTE", salary: "$100K-$130K", type: "CONTRACT", priority: "MEDIUM" },
    { title: "RPA Business Analyst", company: "ProcessPro", location: "CHICAGO", salary: "$90K-$110K", type: "FULL-TIME", priority: "MEDIUM" },
    { title: "Junior RPA Developer", company: "StartupBot", location: "REMOTE", salary: "$70K-$90K", type: "FULL-TIME", priority: "LOW" },
  ], []);

  const phasesData = useMemo(() => [
    { 
      phase: "PHASE 01", 
      title: "DISCOVERY", 
      desc: "Process analysis and automation opportunity assessment to maximize ROI and mission success.",
      icon: Search,
      features: ["Process mapping", "ROI analysis", "Risk assessment"]
    },
    { 
      phase: "PHASE 02", 
      title: "DEVELOPMENT", 
      desc: "Certified specialists build robust automation systems with comprehensive testing protocols.",
      icon: Cpu,
      features: ["Bot development", "Integration", "Testing"]
    },
    { 
      phase: "PHASE 03", 
      title: "DEPLOYMENT", 
      desc: "Seamless go-live execution with training, documentation, and ongoing support.",
      icon: Rocket,
      features: ["Training", "Go-live support", "Optimization"]
    },
  ], []);

  const featuresData = useMemo(() => [
    { icon: Shield, title: "Verified Experts", desc: "All specialists undergo rigorous verification and skill assessment" },
    { icon: Zap, title: "Fast Matching", desc: "AI-powered matching connects you with ideal candidates in hours" },
    { icon: Award, title: "Quality Guaranteed", desc: "Satisfaction guarantee on all engagements and projects" },
    { icon: Globe, title: "Global Network", desc: "Access talent from 50+ countries across all time zones" },
  ], []);

  return (
    <div className="relative overflow-hidden">
      <FloatingParticles />
      
      {/* ================================================================== */}
      {/* HERO SECTION */}
      {/* ================================================================== */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-16 px-6">
        {/* Animated background gradient */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at 50% ${50 + scrollY * 0.02}%, hsl(var(--primary) / 0.15) 0%, transparent 50%)`,
          }}
        />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-16">
                {/* Status Badge */}
                <div className="inline-flex items-center gap-3 px-5 py-2.5 tech-panel rounded-full mb-10 border-glow-blue">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-mono text-secondary uppercase tracking-wider">System Status: All Systems Operational</span>
                </div>
                
                {/* Main Heading */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold mb-6 leading-none tracking-wider">
                  <span className="text-foreground block mb-2">YOUR COMMAND CENTER FOR</span>
                  <span className="text-primary bg-gradient-to-r from-primary via-primary to-accent bg-clip-text">
                    RPA EXCELLENCE
                  </span>
                </h1>
                
                {/* Hero Headline */}
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-6 text-secondary">
                  Hire RPA developer in <span className="text-primary font-black">30 mins</span>
                </h2>
                
                {/* Typing Animation */}
                <div className="text-xl md:text-2xl text-muted-foreground mb-4 h-10 flex items-center justify-center">
                  <span className="mr-2">Find World-Class</span>
                  <TypingText 
                    texts={heroTexts} 
                    className="text-secondary font-display font-bold"
                  />
                </div>
                
                <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                  The premier platform connecting businesses with elite RPA talent. 
                  Whether you&apos;re looking to hire specialists, find your next opportunity, 
                  or scale your automation expertise—your mission starts here.
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/register')}
                    className="bg-primary hover:bg-primary/90 text-sm px-10 py-7 font-display tracking-wider glow-red group text-lg"
                  >
                    <Rocket className="mr-2 h-5 w-5" />
                    START YOUR MISSION
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => navigate('/sign-in')}
                    className="text-sm px-10 py-7 font-display tracking-wider border-secondary/50 text-secondary hover:bg-secondary/10 hover:border-secondary text-lg"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    EXPLORE PLATFORM
                  </Button>
                </div>

                {/* Scroll indicator */}
                <button 
                  onClick={() => handleScrollToSection('stats')}
                  className="animate-bounce text-muted-foreground hover:text-secondary transition-colors"
                >
                  <ChevronDown className="w-8 h-8 mx-auto" />
                </button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* STATS SECTION */}
      {/* ================================================================== */}
      <section id="stats" className="py-20 px-6 relative">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="tech-panel-strong rounded-2xl p-10 corner-brackets relative overflow-hidden">
              <div className="absolute inset-0 data-stream-bg opacity-30" />
              
              <div className="relative">
                <div className="text-xs font-mono text-muted-foreground mb-8 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-secondary animate-pulse" />
                  <span className="tracking-wider">LIVE TELEMETRY DATA • UPDATED IN REAL-TIME</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                  {statsData.map((stat, index) => (
                    <div key={index} className="text-center group">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-secondary/10 border border-secondary/30 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                        <stat.icon className="w-6 h-6 text-secondary" />
                      </div>
                      <div className="text-4xl md:text-5xl font-display font-bold text-secondary mb-2">
                        <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                      </div>
                      <div className="text-xs font-mono text-muted-foreground tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================== */}
      {/* USER TYPES SECTION - Register as... */}
      {/* ================================================================== */}
      <section id="register" className="py-24 px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 tech-panel rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono text-primary tracking-wider">CAREERS IN AUTOMATION</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-wider mb-6">
                REGISTER <span className="text-primary">AS</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose your path in the automation revolution. Whether you&apos;re an expert seeking opportunities 
                or looking to level up your skills—we have a place for you.
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userTypes.map((type, index) => (
              <UserTypeCard key={type.title} type={type} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* HIRING SECTION - Hire a... */}
      {/* ================================================================== */}
      <section id="hire" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent" />
        
        <div className="container mx-auto relative">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 tech-panel rounded-full mb-6">
                <Building2 className="w-4 h-4 text-secondary" />
                <span className="text-xs font-mono text-secondary tracking-wider">HIRING AND TALENT</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-wider mb-6">
                HIRE <span className="text-secondary">A</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Access our elite network of verified RPA professionals. 
                Find the perfect specialist for your automation needs.
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {hiringTypes.map((type, index) => (
              <ScrollReveal key={type.title} delay={index * 100}>
                <Link to={type.link}>
                  <div className="group tech-panel rounded-xl p-6 hover-lift border-glow-blue h-full transition-all duration-300 hover:border-secondary/50">
                    <div className="w-14 h-14 rounded-lg bg-secondary/10 border border-secondary/30 flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                      <type.icon className="w-7 h-7 text-secondary" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-foreground mb-2 tracking-wider group-hover:text-secondary transition-colors">
                      {type.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">{type.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-secondary">{type.stats}</span>
                      <ArrowRight className="w-4 h-4 text-secondary group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <div className="text-center">
              <Link to="/register/client">
                <Button size="lg" className="bg-secondary hover:bg-secondary/90 font-display text-sm tracking-wider glow-blue group px-10">
                  POST A PROJECT
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SERVICES SECTION */}
      {/* ================================================================== */}
      <section id="services" className="py-24 px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs font-mono text-secondary mb-4 tracking-widest">// SYSTEM MODULES</p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-wider mb-6">
                CORE <span className="text-primary">OPERATIONS</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive services to support your entire automation journey
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicesData.map((service, index) => (
              <ServiceCard key={service.code} service={service} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* PLATFORMS SECTION */}
      {/* ================================================================== */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs font-mono text-secondary mb-4 tracking-widest">// CERTIFIED PLATFORMS</p>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-wider mb-6">
                SUPPORTED <span className="text-primary">SYSTEMS</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Expert specialists across all major RPA platforms
              </p>
            </div>
          </ScrollReveal>
          
          <div className="flex flex-wrap justify-center gap-4 items-center">
            {platformsData.map((platform, index) => (
              <PlatformBadge key={platform.name} platform={platform} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FEATURES SECTION */}
      {/* ================================================================== */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        
        <div className="container mx-auto relative">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs font-mono text-secondary mb-4 tracking-widest">// PLATFORM ADVANTAGES</p>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-wider mb-6">
                WHY <span className="text-primary">CHOOSE US</span>
              </h2>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuresData.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 100}>
                <div className="text-center p-8 tech-panel rounded-xl hover-lift">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-foreground mb-3 tracking-wider">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* JOBS SECTION */}
      {/* ================================================================== */}
      <section id="jobs" className="py-24 px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs font-mono text-secondary mb-4 tracking-widest">// ACTIVE ASSIGNMENTS</p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-wider mb-6">
                MISSION <span className="text-primary">BRIEFINGS</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Latest automation opportunities from top organizations worldwide
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {jobsData.map((job, index) => (
              <JobCard key={job.title} job={job} index={index} />
            ))}
          </div>
          
          <ScrollReveal>
            <div className="text-center">
              <Link to="/jobs">
                <Button size="lg" variant="outline" className="font-display text-sm tracking-wider border-secondary/50 text-secondary hover:bg-secondary/10 hover:border-secondary group px-10">
                  VIEW ALL OPPORTUNITIES
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================== */}
      {/* PROCESS SECTION */}
      {/* ================================================================== */}
      <section id="process" className="py-24 px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs font-mono text-secondary mb-4 tracking-widest">// MISSION PROTOCOL</p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-wider mb-6">
                PROJECT <span className="text-primary">LIFECYCLE</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our proven three-phase methodology ensures successful automation delivery
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {phasesData.map((phase, index) => (
              <ScrollReveal key={phase.phase} delay={index * 150}>
                <div className="relative group h-full">
                  {/* Connection line */}
                  {index < phasesData.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-primary/30" />
                  )}
                  
                  <div className="tech-panel-strong rounded-2xl p-10 hover-lift h-full corner-brackets relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                    
                    <div className="relative">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-sm font-mono text-primary bg-primary/10 px-3 py-1 rounded-full">{phase.phase}</span>
                        <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                      </div>
                      
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <phase.icon className="h-8 w-8 text-primary" />
                      </div>
                      
                      <h3 className="text-2xl font-display font-bold text-foreground mb-4 tracking-wider group-hover:text-primary transition-colors">
                        {phase.title}
                      </h3>
                      
                      <p className="text-muted-foreground mb-6 leading-relaxed">{phase.desc}</p>
                      
                      <div className="space-y-2">
                        {phase.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-secondary" />
                            <span className="text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FINAL CTA SECTION */}
      {/* ================================================================== */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="tech-panel-strong rounded-3xl p-12 md:p-16 text-center relative overflow-hidden border-glow-red">
              {/* Background effects */}
              <div className="absolute inset-0 data-stream-bg opacity-40" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 tech-panel rounded-full mb-8">
                  <Radio className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-xs font-mono text-primary tracking-wider">TRANSMISSION READY</span>
                </div>
                
                <Rocket className="h-16 w-16 text-primary mx-auto mb-8 animate-bounce" />
                
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6 tracking-wider">
                  READY FOR <span className="text-primary">LAUNCH</span>?
                </h2>
                
                <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                  Join thousands of automation professionals and companies who have 
                  already transformed their operations with RPA Helpline.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/register">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 font-display text-sm tracking-wider glow-red group px-10 py-7 text-lg">
                      <Satellite className="mr-2 h-5 w-5" />
                      BEGIN TRANSMISSION
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/sign-in">
                    <Button size="lg" variant="outline" className="font-display text-sm tracking-wider border-foreground/30 hover:bg-foreground/10 px-10 py-7 text-lg">
                      <Navigation className="mr-2 h-5 w-5" />
                      CONTACT SUPPORT
                    </Button>
                  </Link>
                </div>
                
                <div className="mt-12 pt-8 border-t border-border/50">
                  <p className="text-sm text-muted-foreground font-mono">
                    <span className="text-secondary">500+</span> specialists • <span className="text-secondary">1200+</span> projects • <span className="text-secondary">50+</span> countries
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
});

Home.displayName = 'Home';
