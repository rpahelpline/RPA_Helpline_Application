import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { 
  Rocket, LogOut, Settings, Briefcase, Users, GraduationCap, Building2, Activity,
  Bell, Search, Plus, Eye, MessageSquare, TrendingUp, Clock, Star, FileText,
  CheckCircle, AlertCircle, ChevronRight, Calendar, DollarSign, Award,
  BarChart3, Target, Code, Zap, Globe, ArrowUpRight, Filter, MoreHorizontal
} from 'lucide-react';
import { ClientDashboard } from './ClientDashboard';
import { FreelancerDashboard } from './FreelancerDashboard';
import { DeveloperDashboard } from './DeveloperDashboard';
import { TrainerDashboard } from './TrainerDashboard';
import { JobSeekerDashboard } from './JobSeekerDashboard';
import { ThemeSwitcher } from '../../components/ui/ThemeSwitcher';
import { PageLoader } from '../../components/common/LoadingSpinner';

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================
const StatCard = memo(({ stat, index }) => (
  <Card className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 group overflow-hidden relative">
    <div className={`absolute top-0 left-0 w-1 h-full ${stat.accentColor}`} />
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wider">{stat.label}</p>
          <p className={`text-2xl font-display font-bold tracking-wider ${stat.valueColor}`}>{stat.value}</p>
          {stat.change && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${stat.changePositive ? 'text-green-500' : 'text-red-500'}`}>
              <TrendingUp className={`w-3 h-3 ${!stat.changePositive && 'rotate-180'}`} />
              <span>{stat.change}</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.iconBg} transition-colors`}>
          <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
));
StatCard.displayName = 'StatCard';

// ============================================================================
// QUICK ACTION CARD COMPONENT
// ============================================================================
const QuickActionCard = memo(({ action, onClick }) => (
  <Card 
    className="tech-panel hover-lift border-border hover:border-primary/50 bg-card/50 cursor-pointer group transition-all duration-300"
    onClick={onClick}
  >
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${action.iconBg} group-hover:scale-110`}>
          <action.icon className={`h-7 w-7 ${action.iconColor}`} />
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
      <CardTitle className="text-lg font-display tracking-wider group-hover:text-primary transition-colors">
        {action.title}
      </CardTitle>
      <CardDescription className="text-muted-foreground text-sm">
        {action.description}
      </CardDescription>
    </CardHeader>
    {action.badge && (
      <CardContent className="pt-0">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono ${action.badgeColor}`}>
          {action.badge}
        </span>
      </CardContent>
    )}
  </Card>
));
QuickActionCard.displayName = 'QuickActionCard';

// ============================================================================
// NOTIFICATION ITEM COMPONENT
// ============================================================================
const NotificationItem = memo(({ notification }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-card transition-colors cursor-pointer group">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notification.iconBg}`}>
      <notification.icon className={`w-4 h-4 ${notification.iconColor}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-foreground group-hover:text-primary transition-colors truncate">
        {notification.message}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{notification.time}</p>
    </div>
    {notification.unread && (
      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
    )}
  </div>
));
NotificationItem.displayName = 'NotificationItem';

// ============================================================================
// ACTIVITY ITEM COMPONENT
// ============================================================================
const ActivityItem = memo(({ activity }) => (
  <div className="flex items-start gap-3 p-3 border-b border-border/50 last:border-0">
    <div className={`w-2 h-2 rounded-full mt-2 ${activity.statusColor}`} />
    <div className="flex-1">
      <p className="text-sm text-foreground">{activity.action}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-muted-foreground font-mono">{activity.time}</span>
        {activity.project && (
          <span className="text-xs text-secondary">• {activity.project}</span>
        )}
      </div>
    </div>
  </div>
));
ActivityItem.displayName = 'ActivityItem';

// ============================================================================
// SIDEBAR NAVIGATION COMPONENT
// ============================================================================
const SidebarNav = memo(({ role, currentSection, setCurrentSection }) => {
  const navItems = useMemo(() => {
    const baseItems = [
      { id: 'overview', label: 'Overview', icon: BarChart3 },
      { id: 'messages', label: 'Messages', icon: MessageSquare, badge: 3 },
      { id: 'notifications', label: 'Notifications', icon: Bell, badge: 5 },
    ];

    const roleItems = {
      client: [
        { id: 'projects', label: 'My Projects', icon: Briefcase },
        { id: 'talent', label: 'Find Talent', icon: Users },
        { id: 'contracts', label: 'Contracts', icon: FileText },
      ],
      freelancer: [
        { id: 'opportunities', label: 'Opportunities', icon: Target },
        { id: 'applications', label: 'Applications', icon: FileText },
        { id: 'earnings', label: 'Earnings', icon: DollarSign },
      ],
      job_seeker: [
        { id: 'jobs', label: 'Job Board', icon: Briefcase },
        { id: 'applications', label: 'Applications', icon: FileText },
        { id: 'saved', label: 'Saved Jobs', icon: Star },
      ],
      trainer: [
        { id: 'courses', label: 'My Courses', icon: GraduationCap },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'earnings', label: 'Earnings', icon: DollarSign },
      ],
      ba_pm: [
        { id: 'projects', label: 'Projects', icon: Target },
        { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ],
    };

    return [
      ...baseItems,
      ...(roleItems[role] || roleItems.freelancer),
      { id: 'settings', label: 'Settings', icon: Settings },
    ];
  }, [role]);

  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setCurrentSection(item.id)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-mono text-sm transition-all ${
            currentSection === item.id
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'text-muted-foreground hover:bg-card hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-3">
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </div>
          {item.badge && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
});
SidebarNav.displayName = 'SidebarNav';

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================
export const Dashboard = memo(() => {
  const { user, role, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize in next tick to prevent blocking
        await new Promise(resolve => requestAnimationFrame(resolve));
        // Minimal delay for smooth transition
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/sign-in');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSignOut = useCallback(async () => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  const getUserTypeConfig = useCallback(() => {
    const configs = {
      freelancer: { icon: Code, label: 'RPA FREELANCER', color: 'text-primary' },
      job_seeker: { icon: Briefcase, label: 'JOB SEEKER', color: 'text-secondary' },
      jobseeker: { icon: Briefcase, label: 'JOB SEEKER', color: 'text-secondary' },
      trainer: { icon: GraduationCap, label: 'RPA TRAINER', color: 'text-accent' },
      client: { icon: Building2, label: 'EMPLOYER / CLIENT', color: 'text-nasa-gold' },
      developer: { icon: Target, label: 'BA / PROJECT MANAGER', color: 'text-primary' },
      ba_pm: { icon: Target, label: 'BA / PROJECT MANAGER', color: 'text-primary' },
    };
    return configs[role] || configs.freelancer;
  }, [role]);

  const userConfig = useMemo(() => getUserTypeConfig(), [getUserTypeConfig]);
  const profile = useMemo(() => user || { full_name: user?.name || user?.email?.split('@')[0] || 'Operator' }, [user]);

  // Stats based on role
  const statsData = useMemo(() => {
    const baseStats = {
      client: [
        { label: 'Active Projects', value: '5', icon: Briefcase, iconBg: 'bg-primary/10', iconColor: 'text-primary', valueColor: 'text-primary', accentColor: 'bg-primary', change: '+2 this month', changePositive: true },
        { label: 'Hired Talent', value: '12', icon: Users, iconBg: 'bg-secondary/10', iconColor: 'text-secondary', valueColor: 'text-secondary', accentColor: 'bg-secondary', change: '+3 this week', changePositive: true },
        { label: 'Total Spent', value: '₹2.45L', icon: DollarSign, iconBg: 'bg-accent/10', iconColor: 'text-accent', valueColor: 'text-accent', accentColor: 'bg-accent' },
        { label: 'Avg. Rating', value: '4.9', icon: Star, iconBg: 'bg-nasa-gold/10', iconColor: 'text-nasa-gold', valueColor: 'text-nasa-gold', accentColor: 'bg-nasa-gold' },
      ],
      freelancer: [
        { label: 'Active Projects', value: '3', icon: Briefcase, iconBg: 'bg-primary/10', iconColor: 'text-primary', valueColor: 'text-primary', accentColor: 'bg-primary', change: '+1 this week', changePositive: true },
        { label: 'Total Earnings', value: '₹82K', icon: DollarSign, iconBg: 'bg-secondary/10', iconColor: 'text-secondary', valueColor: 'text-secondary', accentColor: 'bg-secondary', change: '+15%', changePositive: true },
        { label: 'Profile Views', value: '142', icon: Eye, iconBg: 'bg-accent/10', iconColor: 'text-accent', valueColor: 'text-accent', accentColor: 'bg-accent', change: '+28', changePositive: true },
        { label: 'Rating', value: '4.8', icon: Star, iconBg: 'bg-nasa-gold/10', iconColor: 'text-nasa-gold', valueColor: 'text-nasa-gold', accentColor: 'bg-nasa-gold' },
      ],
      job_seeker: [
        { label: 'Applications', value: '8', icon: FileText, iconBg: 'bg-primary/10', iconColor: 'text-primary', valueColor: 'text-primary', accentColor: 'bg-primary', change: '+3 this week', changePositive: true },
        { label: 'Interviews', value: '2', icon: Calendar, iconBg: 'bg-secondary/10', iconColor: 'text-secondary', valueColor: 'text-secondary', accentColor: 'bg-secondary' },
        { label: 'Profile Views', value: '85', icon: Eye, iconBg: 'bg-accent/10', iconColor: 'text-accent', valueColor: 'text-accent', accentColor: 'bg-accent', change: '+12', changePositive: true },
        { label: 'Saved Jobs', value: '15', icon: Star, iconBg: 'bg-nasa-gold/10', iconColor: 'text-nasa-gold', valueColor: 'text-nasa-gold', accentColor: 'bg-nasa-gold' },
      ],
      trainer: [
        { label: 'Active Courses', value: '4', icon: GraduationCap, iconBg: 'bg-primary/10', iconColor: 'text-primary', valueColor: 'text-primary', accentColor: 'bg-primary' },
        { label: 'Total Students', value: '156', icon: Users, iconBg: 'bg-secondary/10', iconColor: 'text-secondary', valueColor: 'text-secondary', accentColor: 'bg-secondary', change: '+23', changePositive: true },
        { label: 'Earnings', value: '₹1.24L', icon: DollarSign, iconBg: 'bg-accent/10', iconColor: 'text-accent', valueColor: 'text-accent', accentColor: 'bg-accent', change: '+18%', changePositive: true },
        { label: 'Avg. Rating', value: '4.9', icon: Star, iconBg: 'bg-nasa-gold/10', iconColor: 'text-nasa-gold', valueColor: 'text-nasa-gold', accentColor: 'bg-nasa-gold' },
      ],
    };
    return baseStats[role] || baseStats.freelancer;
  }, [role]);

  // Quick actions based on role
  const quickActions = useMemo(() => {
    const baseActions = {
      client: [
        { title: 'POST NEW PROJECT', description: 'Create a new RPA project listing', icon: Plus, iconBg: 'bg-primary/10 border border-primary/30', iconColor: 'text-primary', link: '/register/project', badge: 'NEW', badgeColor: 'bg-primary/20 text-primary' },
        { title: 'FIND TALENT', description: 'Browse verified RPA specialists', icon: Search, iconBg: 'bg-secondary/10 border border-secondary/30', iconColor: 'text-secondary', link: '/talent' },
        { title: 'VIEW CONTRACTS', description: 'Manage active contracts', icon: FileText, iconBg: 'bg-accent/10 border border-accent/30', iconColor: 'text-accent', link: '/contracts', badge: '3 Active', badgeColor: 'bg-accent/20 text-accent' },
      ],
      freelancer: [
        { title: 'BROWSE PROJECTS', description: 'Find new opportunities', icon: Target, iconBg: 'bg-primary/10 border border-primary/30', iconColor: 'text-primary', link: '/projects', badge: '24 New', badgeColor: 'bg-primary/20 text-primary' },
        { title: 'MY APPLICATIONS', description: 'Track your proposals', icon: FileText, iconBg: 'bg-secondary/10 border border-secondary/30', iconColor: 'text-secondary', link: '/applications', badge: '5 Pending', badgeColor: 'bg-secondary/20 text-secondary' },
        { title: 'UPDATE PROFILE', description: 'Improve your visibility', icon: Settings, iconBg: 'bg-accent/10 border border-accent/30', iconColor: 'text-accent', link: '/profile-setup' },
      ],
      job_seeker: [
        { title: 'JOB BOARD', description: 'Browse available positions', icon: Briefcase, iconBg: 'bg-primary/10 border border-primary/30', iconColor: 'text-primary', link: '/jobs', badge: '150+ Jobs', badgeColor: 'bg-primary/20 text-primary' },
        { title: 'MY APPLICATIONS', description: 'Track application status', icon: FileText, iconBg: 'bg-secondary/10 border border-secondary/30', iconColor: 'text-secondary', link: '/applications' },
        { title: 'SAVED JOBS', description: 'View bookmarked positions', icon: Star, iconBg: 'bg-accent/10 border border-accent/30', iconColor: 'text-accent', link: '/saved-jobs', badge: '15', badgeColor: 'bg-accent/20 text-accent' },
      ],
      trainer: [
        { title: 'CREATE COURSE', description: 'Design a new training program', icon: Plus, iconBg: 'bg-primary/10 border border-primary/30', iconColor: 'text-primary', link: '/create-course', badge: 'NEW', badgeColor: 'bg-primary/20 text-primary' },
        { title: 'MY STUDENTS', description: 'Manage enrollments', icon: Users, iconBg: 'bg-secondary/10 border border-secondary/30', iconColor: 'text-secondary', link: '/students', badge: '156', badgeColor: 'bg-secondary/20 text-secondary' },
        { title: 'ANALYTICS', description: 'View course performance', icon: BarChart3, iconBg: 'bg-accent/10 border border-accent/30', iconColor: 'text-accent', link: '/analytics' },
      ],
    };
    return baseActions[role] || baseActions.freelancer;
  }, [role]);

  // Recent notifications
  const notifications = useMemo(() => [
    { message: 'New project matching your skills', time: '2 min ago', icon: Briefcase, iconBg: 'bg-primary/10', iconColor: 'text-primary', unread: true },
    { message: 'Application viewed by TechCorp', time: '1 hour ago', icon: Eye, iconBg: 'bg-secondary/10', iconColor: 'text-secondary', unread: true },
    { message: 'New message from Sarah', time: '3 hours ago', icon: MessageSquare, iconBg: 'bg-accent/10', iconColor: 'text-accent', unread: false },
    { message: 'Profile completion reminder', time: 'Yesterday', icon: AlertCircle, iconBg: 'bg-nasa-gold/10', iconColor: 'text-nasa-gold', unread: false },
  ], []);

  // Recent activity
  const recentActivity = useMemo(() => [
    { action: 'Applied to UiPath Developer position', time: '10 min ago', project: 'TechCorp Inc', statusColor: 'bg-primary' },
    { action: 'Profile updated', time: '2 hours ago', statusColor: 'bg-secondary' },
    { action: 'Completed skill assessment', time: 'Yesterday', project: 'UiPath Advanced', statusColor: 'bg-green-500' },
    { action: 'New certification added', time: '2 days ago', project: 'AA Certified', statusColor: 'bg-accent' },
  ], []);

  if (loading) {
    return <PageLoader message="INITIALIZING DASHBOARD..." />;
  }

  const renderDashboard = () => {
    switch (role) {
      case 'client':
        return <ClientDashboard />;
      case 'freelancer':
        return <FreelancerDashboard />;
      case 'developer':
      case 'ba_pm':
        return <DeveloperDashboard />;
      case 'trainer':
        return <TrainerDashboard />;
      case 'jobseeker':
      case 'job_seeker':
        return <JobSeekerDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background effects */}
      <div className="fixed inset-0 star-field opacity-40 pointer-events-none" />
      <div className="fixed inset-0 grid-overlay opacity-20 pointer-events-none" />

      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 tech-panel border-b border-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Rocket className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-display font-bold text-foreground tracking-wider hidden md:block">RPA HELPLINE</span>
            </Link>
            
            {/* Search Bar */}
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 tech-panel rounded-xl w-80">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search projects, talent, jobs..."
                className="bg-transparent border-none outline-none text-sm flex-1 text-foreground placeholder-muted-foreground"
              />
              <kbd className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-mono">⌘K</kbd>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            
            <button className="relative p-2 rounded-lg hover:bg-card transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
            
            <button className="relative p-2 rounded-lg hover:bg-card transition-colors">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full" />
            </button>
            
            <div className="h-8 w-px bg-border mx-2" />
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-display text-foreground">{profile.full_name || profile.name || 'Operator'}</p>
                <p className={`text-xs font-mono ${userConfig.color}`}>{userConfig.label}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-display font-bold">
                {(profile.full_name || profile.name || 'O').charAt(0).toUpperCase()}
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex pt-[73px]">
        {/* Sidebar */}
        <aside className={`fixed left-0 top-[73px] bottom-0 w-64 tech-panel border-r border-border p-4 overflow-y-auto transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          {/* User Profile Card */}
          <div className="tech-panel-strong rounded-xl p-4 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="relative flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-display font-bold text-lg">
                {(profile.full_name || profile.name || 'O').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-foreground truncate">{profile.full_name || profile.name || 'Operator'}</p>
                <p className={`text-xs font-mono ${userConfig.color}`}>{userConfig.label}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Profile Completion</span>
                <span className="text-primary font-mono">75%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-primary to-secondary rounded-full" />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <SidebarNav 
            role={role} 
            currentSection={currentSection} 
            setCurrentSection={setCurrentSection}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-73px)]">
          <div className="p-6 lg:p-8">
            {/* Welcome Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 tech-panel rounded-full mb-4 border-glow-blue">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-xs font-mono text-secondary uppercase tracking-wider">Session Active • All Systems Operational</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-wider mb-2">
                    WELCOME BACK, <span className="text-primary">{(profile.full_name || profile.name || 'OPERATOR').split(' ')[0]?.toUpperCase()}</span>
                  </h1>
                  <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your RPA journey today.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="font-mono text-xs tracking-wider">
                    <Filter className="w-4 h-4 mr-2" />
                    FILTERS
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90 font-mono text-xs tracking-wider glow-red">
                    <Plus className="w-4 h-4 mr-2" />
                    {role === 'client' ? 'POST PROJECT' : 'BROWSE PROJECTS'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statsData.map((stat, index) => (
                <StatCard key={index} stat={stat} index={index} />
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-bold text-foreground tracking-wider">QUICK ACTIONS</h2>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {quickActions.map((action, index) => (
                  <QuickActionCard 
                    key={index} 
                    action={action}
                    onClick={() => action.link && navigate(action.link)}
                  />
                ))}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Notifications */}
              <div className="lg:col-span-2">
                <Card className="tech-panel border-border bg-card/50 h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-display tracking-wider">RECENT ACTIVITY</CardTitle>
                      <Link to="/activity" className="text-xs text-secondary hover:text-secondary/80 font-mono flex items-center gap-1">
                        VIEW ALL <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {recentActivity.map((activity, index) => (
                        <ActivityItem key={index} activity={activity} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notifications Panel */}
              <Card className="tech-panel border-border bg-card/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-display tracking-wider">NOTIFICATIONS</CardTitle>
                    <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs">5</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {notifications.map((notification, index) => (
                      <NotificationItem key={index} notification={notification} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Role-specific dashboard content */}
            {renderDashboard()}
          </div>
        </main>
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';
