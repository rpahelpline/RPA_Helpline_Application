import { useEffect, useState, useMemo, useCallback, memo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { statsApi, notificationApi, profileApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import {
  Rocket, LogOut, Settings, Briefcase, Users, GraduationCap, Building2, Activity,
  Bell, Search, Plus, Eye, MessageSquare, TrendingUp, Clock, Star, FileText,
  CheckCircle, AlertCircle, ChevronRight, Calendar, DollarSign, Award,
  BarChart3, Target, Code, Zap, Globe, ArrowUpRight, Filter, MoreHorizontal, User,
  Menu, X
} from 'lucide-react';
import { ClientDashboard } from './ClientDashboard';
import { EmployerDashboard } from './EmployerDashboard';
import { FreelancerDashboard } from './FreelancerDashboard';
import { DeveloperDashboard } from './DeveloperDashboard';
import { TrainerDashboard } from './TrainerDashboard';
import { JobSeekerDashboard } from './JobSeekerDashboard';
import { ProfileDashboard } from './ProfileDashboard';
import { ThemeSwitcher } from '../../components/ui/ThemeSwitcher';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { GlobalSearch } from '../../components/common/GlobalSearch';
import {
  MessagesContent,
  NotificationsContent,
  ApplicationsContent,
  PortfolioContent,
  SettingsContent
} from './DashboardContent';

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================
const StatCard = memo(({ stat, index }) => (
  <Card className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 group overflow-hidden relative">
    <div className={`absolute top-0 left-0 w-1 h-full ${stat.accentColor}`} />
    <CardContent className="p-3 md:p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] md:text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wider truncate">{stat.label}</p>
          <p className={`text-lg md:text-2xl font-display font-bold tracking-wider ${stat.valueColor}`}>{stat.value}</p>
          {stat.change && (
            <div className={`flex items-center gap-1 mt-1 text-[10px] md:text-xs ${stat.changePositive ? 'text-green-500' : 'text-red-500'}`}>
              <TrendingUp className={`w-3 h-3 ${!stat.changePositive && 'rotate-180'}`} />
              <span>{stat.change}</span>
            </div>
          )}
        </div>
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.iconBg} transition-colors`}>
          <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.iconColor}`} />
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
    <CardHeader className="p-3 md:pb-3">
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${action.iconBg} group-hover:scale-110`}>
          <action.icon className={`h-5 w-5 md:h-7 md:w-7 ${action.iconColor}`} />
        </div>
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
      <CardTitle className="text-sm md:text-lg font-display tracking-wider group-hover:text-primary transition-colors">
        {action.title}
      </CardTitle>
      <CardDescription className="text-muted-foreground text-xs md:text-sm hidden sm:block">
        {action.description}
      </CardDescription>
    </CardHeader>
    {action.badge && (
      <CardContent className="pt-0 px-3 pb-3">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] md:text-xs font-mono ${action.badgeColor}`}>
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
const SidebarNav = memo(({ role, currentSection, setCurrentSection, unreadMessages, unreadNotifications, onMobileNavClick }) => {
  const navigate = useNavigate();

  const navItems = useMemo(() => {
    // Common items for all roles
    const commonItems = [
      { id: 'profile', label: 'My Profile', icon: User, route: null },
      { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessages > 0 ? unreadMessages : null },
      { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications > 0 ? unreadNotifications : null },
    ];

    // Role-specific items
    const roleItems = {
      // HIRING ROLES - They post jobs/projects and manage received applications
      employer: [
        { id: 'overview', label: 'Dashboard', icon: BarChart3 },
        { id: 'my-jobs', label: 'My Jobs', icon: Briefcase },
        { id: 'job-applications', label: 'Job Applications', icon: FileText },
        { id: 'post-job', label: 'Post Job', icon: Plus, route: '/post-job' },
        { id: 'talent', label: 'Find Talent', icon: Users, route: '/talent' },
      ],
      client: [
        { id: 'overview', label: 'Dashboard', icon: BarChart3 },
        { id: 'my-projects', label: 'My Projects', icon: Briefcase },
        { id: 'project-applications', label: 'Project Applications', icon: FileText },
        { id: 'post-project', label: 'Post Project', icon: Plus, route: '/register/project' },
        { id: 'talent', label: 'Find Talent', icon: Users, route: '/talent' },
      ],

      // APPLYING ROLES - They browse and apply to jobs/projects
      freelancer: [
        { id: 'overview', label: 'Dashboard', icon: BarChart3 },
        { id: 'browse-projects', label: 'Browse Projects', icon: Target, route: '/projects' },
        { id: 'browse-jobs', label: 'Browse Jobs', icon: Briefcase, route: '/jobs' },
        { id: 'applications', label: 'My Applications', icon: FileText },
        { id: 'portfolio', label: 'Portfolio', icon: Code },
      ],
      job_seeker: [
        { id: 'overview', label: 'Dashboard', icon: BarChart3 },
        { id: 'browse-jobs', label: 'Browse Jobs', icon: Briefcase, route: '/jobs' },
        { id: 'applications', label: 'My Applications', icon: FileText },
      ],
      trainer: [
        { id: 'overview', label: 'Dashboard', icon: BarChart3 },
        { id: 'my-courses', label: 'My Courses', icon: GraduationCap },
        { id: 'browse-jobs', label: 'Browse Jobs', icon: Briefcase, route: '/jobs' },
        { id: 'applications', label: 'My Applications', icon: FileText },
      ],
      ba_pm: [
        { id: 'overview', label: 'Dashboard', icon: BarChart3 },
        { id: 'browse-projects', label: 'Browse Projects', icon: Target, route: '/projects' },
        { id: 'browse-jobs', label: 'Browse Jobs', icon: Briefcase, route: '/jobs' },
        { id: 'applications', label: 'My Applications', icon: FileText },
      ],
      developer: [
        { id: 'overview', label: 'Dashboard', icon: BarChart3 },
        { id: 'browse-projects', label: 'Browse Projects', icon: Target, route: '/projects' },
        { id: 'browse-jobs', label: 'Browse Jobs', icon: Briefcase, route: '/jobs' },
        { id: 'applications', label: 'My Applications', icon: FileText },
      ],
    };

    return [
      ...commonItems,
      ...(roleItems[role] || roleItems.freelancer),
      { id: 'settings', label: 'Settings', icon: Settings },
    ];
  }, [role, unreadMessages, unreadNotifications]);

  const handleNavClick = (item) => {
    if (item.route) {
      navigate(item.route);
      // Don't set current section for external routes
    } else if (item.section) {
      setCurrentSection(item.section);
    } else {
      setCurrentSection(item.id);
    }
    // Close sidebar on mobile after navigation
    onMobileNavClick?.();
  };

  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleNavClick(item)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-mono text-sm transition-all ${currentSection === item.id
            ? 'bg-primary/10 text-primary border border-primary/30'
            : 'text-muted-foreground hover:bg-card hover:text-foreground'
            }`}
        >
          <div className="flex items-center gap-3">
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </div>
          {item.badge && item.badge > 0 && (
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
  const { user, isAuthenticated, logout } = useAuthStore();
  // Get role from user - profile in store is same as user
  const role = user?.user_type || 'freelancer';
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const fetchingRef = useRef(false);

  // Fetch dashboard data
  useEffect(() => {
    // Prevent duplicate calls
    if (fetchingRef.current) return;

    const fetchDashboardData = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      fetchingRef.current = true;
      let cancelled = false;

      try {
        // Fetch stats (includes unread counts and profile completion)
        try {
          const statsRes = await statsApi.getDashboardStats();
          if (!cancelled) {
            setDashboardStats(statsRes.stats || {});
            setUnreadMessages(statsRes.stats?.unread_messages || 0);
            setUnreadNotifications(statsRes.stats?.unread_notifications || 0);
            setProfileCompletion(statsRes.stats?.profile_completion || 0);
          }
        } catch (error) {
          if (!cancelled) console.error('Failed to fetch stats:', error);
        }

        // Fetch notifications
        try {
          const notifRes = await notificationApi.getAll({ limit: 5 });
          if (!cancelled) {
            setNotifications(notifRes.notifications || []);
          }
        } catch (error) {
          if (!cancelled) console.error('Failed to fetch notifications:', error);
        }

        // Fetch activity
        try {
          const activityRes = await statsApi.getActivity({ limit: 5 });
          if (!cancelled) {
            setRecentActivity(activityRes.activity || []);
          }
        } catch (error) {
          if (!cancelled) console.error('Failed to fetch activity:', error);
        }
      } catch (error) {
        if (!cancelled) console.error('Failed to initialize dashboard:', error);
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

    fetchDashboardData();
  }, [isAuthenticated]);

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
      client: { icon: Building2, label: 'CLIENT', color: 'text-nasa-gold' },
      employer: { icon: Building2, label: 'EMPLOYER', color: 'text-nasa-gold' },
      developer: { icon: Target, label: 'BA / PROJECT MANAGER', color: 'text-primary' },
      ba_pm: { icon: Target, label: 'BA / PROJECT MANAGER', color: 'text-primary' },
    };
    return configs[role] || configs.freelancer;
  }, [role]);

  const userConfig = useMemo(() => getUserTypeConfig(), [getUserTypeConfig]);
  const profile = useMemo(() => user || { full_name: user?.name || user?.email?.split('@')[0] || 'Operator' }, [user]);

  // Stats based on role and real data
  const statsData = useMemo(() => {
    const stats = dashboardStats || {};

    const baseStats = {
      client: [
        {
          label: 'Active Projects',
          value: String(stats.active_projects || 0),
          icon: Briefcase,
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          valueColor: 'text-primary',
          accentColor: 'bg-primary'
        },
        {
          label: 'Total Projects',
          value: String(stats.total_projects || 0),
          icon: Users,
          iconBg: 'bg-secondary/10',
          iconColor: 'text-secondary',
          valueColor: 'text-secondary',
          accentColor: 'bg-secondary'
        },
        {
          label: 'Applications',
          value: String(stats.received_applications || 0),
          icon: FileText,
          iconBg: 'bg-accent/10',
          iconColor: 'text-accent',
          valueColor: 'text-accent',
          accentColor: 'bg-accent'
        },
        {
          label: 'Profile Views',
          value: String(stats.profile_views || 0),
          icon: Eye,
          iconBg: 'bg-nasa-gold/10',
          iconColor: 'text-nasa-gold',
          valueColor: 'text-nasa-gold',
          accentColor: 'bg-nasa-gold'
        },
      ],
      freelancer: [
        {
          label: 'Active Projects',
          value: String(stats.active_projects || 0),
          icon: Briefcase,
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          valueColor: 'text-primary',
          accentColor: 'bg-primary'
        },
        {
          label: 'Profile Views',
          value: String(stats.profile_views || 0),
          icon: Eye,
          iconBg: 'bg-secondary/10',
          iconColor: 'text-secondary',
          valueColor: 'text-secondary',
          accentColor: 'bg-secondary'
        },
        {
          label: 'Applications',
          value: String(stats.pending_applications || 0),
          icon: FileText,
          iconBg: 'bg-accent/10',
          iconColor: 'text-accent',
          valueColor: 'text-accent',
          accentColor: 'bg-accent'
        },
        {
          label: 'Completed',
          value: String(stats.completed_projects || 0),
          icon: CheckCircle,
          iconBg: 'bg-nasa-gold/10',
          iconColor: 'text-nasa-gold',
          valueColor: 'text-nasa-gold',
          accentColor: 'bg-nasa-gold'
        },
      ],
      job_seeker: [
        {
          label: 'Applications',
          value: String(stats.total_applications || 0),
          icon: FileText,
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          valueColor: 'text-primary',
          accentColor: 'bg-primary'
        },
        {
          label: 'Interviews',
          value: String(stats.interviews || 0),
          icon: Calendar,
          iconBg: 'bg-secondary/10',
          iconColor: 'text-secondary',
          valueColor: 'text-secondary',
          accentColor: 'bg-secondary'
        },
        {
          label: 'Profile Views',
          value: String(stats.profile_views || 0),
          icon: Eye,
          iconBg: 'bg-accent/10',
          iconColor: 'text-accent',
          valueColor: 'text-accent',
          accentColor: 'bg-accent'
        },
        {
          label: 'Pending',
          value: String(stats.pending_applications || 0),
          icon: Clock,
          iconBg: 'bg-nasa-gold/10',
          iconColor: 'text-nasa-gold',
          valueColor: 'text-nasa-gold',
          accentColor: 'bg-nasa-gold'
        },
      ],
      trainer: [
        {
          label: 'Active Courses',
          value: String(stats.active_courses || 0),
          icon: GraduationCap,
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          valueColor: 'text-primary',
          accentColor: 'bg-primary'
        },
        {
          label: 'Total Students',
          value: String(stats.total_students || 0),
          icon: Users,
          iconBg: 'bg-secondary/10',
          iconColor: 'text-secondary',
          valueColor: 'text-secondary',
          accentColor: 'bg-secondary'
        },
        {
          label: 'Enrollments',
          value: String(stats.total_enrollments || 0),
          icon: FileText,
          iconBg: 'bg-accent/10',
          iconColor: 'text-accent',
          valueColor: 'text-accent',
          accentColor: 'bg-accent'
        },
        {
          label: 'Profile Views',
          value: String(stats.profile_views || 0),
          icon: Eye,
          iconBg: 'bg-nasa-gold/10',
          iconColor: 'text-nasa-gold',
          valueColor: 'text-nasa-gold',
          accentColor: 'bg-nasa-gold'
        },
      ],
    };
    return baseStats[role] || baseStats.freelancer;
  }, [role, dashboardStats]);

  // Quick actions based on role
  const quickActions = useMemo(() => {
    const baseActions = {
      // HIRING ROLES - Quick actions for posting and managing
      employer: [
        { title: 'POST JOB', description: 'Create a new job listing', icon: Plus, iconBg: 'bg-primary/10 border border-primary/30', iconColor: 'text-primary', link: '/post-job' },
        { title: 'MY JOBS', description: 'Manage your posted jobs', icon: Briefcase, iconBg: 'bg-secondary/10 border border-secondary/30', iconColor: 'text-secondary', link: null, section: 'my-jobs' },
        { title: 'JOB APPLICATIONS', description: 'Review received applications', icon: FileText, iconBg: 'bg-accent/10 border border-accent/30', iconColor: 'text-accent', link: null, section: 'job-applications' },
      ],
      client: [
        { title: 'POST PROJECT', description: 'Create a new RPA project', icon: Plus, iconBg: 'bg-primary/10 border border-primary/30', iconColor: 'text-primary', link: '/register/project' },
        { title: 'MY PROJECTS', description: 'Manage your posted projects', icon: Briefcase, iconBg: 'bg-secondary/10 border border-secondary/30', iconColor: 'text-secondary', link: null, section: 'my-projects' },
        { title: 'PROJECT APPLICATIONS', description: 'Review received proposals', icon: FileText, iconBg: 'bg-accent/10 border border-accent/30', iconColor: 'text-accent', link: null, section: 'project-applications' },
      ],

      // APPLYING ROLES - Quick actions for finding work
      freelancer: [
        { title: 'BROWSE PROJECTS', description: 'Find new opportunities', icon: Target, iconBg: 'bg-primary/10 border border-primary/30', iconColor: 'text-primary', link: '/projects' },
        { title: 'MY APPLICATIONS', description: 'Track your proposals', icon: FileText, iconBg: 'bg-secondary/10 border border-secondary/30', iconColor: 'text-secondary', link: null, section: 'applications' },
        { title: 'MY PORTFOLIO', description: 'Showcase your work', icon: Code, iconBg: 'bg-accent/10 border border-accent/30', iconColor: 'text-accent', link: null, section: 'portfolio' },
      ],
      job_seeker: [
        { title: 'BROWSE JOBS', description: 'Find job openings', icon: Briefcase, iconBg: 'bg-primary/10 border border-primary/30', iconColor: 'text-primary', link: '/jobs' },
        { title: 'MY APPLICATIONS', description: 'Track application status', icon: FileText, iconBg: 'bg-secondary/10 border border-secondary/30', iconColor: 'text-secondary', link: null, section: 'applications' },
        { title: 'UPDATE PROFILE', description: 'Improve your visibility', icon: Settings, iconBg: 'bg-accent/10 border border-accent/30', iconColor: 'text-accent', link: null, section: 'profile' },
      ],
      trainer: [
        { title: 'MY COURSES', description: 'Manage your courses', icon: GraduationCap, iconBg: 'bg-primary/10 border border-primary/30', iconColor: 'text-primary', link: null, section: 'my-courses' },
        { title: 'BROWSE COURSES', description: 'Explore all courses', icon: GraduationCap, iconBg: 'bg-secondary/10 border border-secondary/30', iconColor: 'text-secondary', link: '/courses' },
        { title: 'MY APPLICATIONS', description: 'Track applications', icon: FileText, iconBg: 'bg-accent/10 border border-accent/30', iconColor: 'text-accent', link: null, section: 'applications' },
      ],
      ba_pm: [
        { title: 'BROWSE PROJECTS', description: 'Find PM opportunities', icon: Target, iconBg: 'bg-primary/10 border border-primary/30', iconColor: 'text-primary', link: '/projects' },
        { title: 'MY APPLICATIONS', description: 'Track your proposals', icon: FileText, iconBg: 'bg-secondary/10 border border-secondary/30', iconColor: 'text-secondary', link: null, section: 'applications' },
        { title: 'UPDATE PROFILE', description: 'Improve your visibility', icon: Settings, iconBg: 'bg-accent/10 border border-accent/30', iconColor: 'text-accent', link: null, section: 'profile' },
      ],
      developer: [
        { title: 'BROWSE PROJECTS', description: 'Find dev opportunities', icon: Target, iconBg: 'bg-primary/10 border border-primary/30', iconColor: 'text-primary', link: '/projects' },
        { title: 'MY APPLICATIONS', description: 'Track your proposals', icon: FileText, iconBg: 'bg-secondary/10 border border-secondary/30', iconColor: 'text-secondary', link: null, section: 'applications' },
        { title: 'UPDATE PROFILE', description: 'Improve your visibility', icon: Settings, iconBg: 'bg-accent/10 border border-accent/30', iconColor: 'text-accent', link: null, section: 'profile' },
      ],
    };
    return baseActions[role] || baseActions.freelancer;
  }, [role, setCurrentSection]);

  // Format notifications for display
  const formattedNotifications = useMemo(() => {
    return notifications.slice(0, 4).map(n => ({
      message: n.message || n.title || 'Notification',
      time: n.created_at ? new Date(n.created_at).toLocaleString() : 'Recently',
      icon: Briefcase,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      unread: !n.is_read
    }));
  }, [notifications]);

  // Format activity for display
  const formattedActivity = useMemo(() => {
    return recentActivity.slice(0, 4).map(a => ({
      action: a.action || 'Activity',
      time: a.time ? new Date(a.time).toLocaleString() : 'Recently',
      project: a.action_url ? 'View' : undefined,
      statusColor: 'bg-primary'
    }));
  }, [recentActivity]);

  if (loading) {
    return <PageLoader message="INITIALIZING DASHBOARD..." />;
  }

  const renderContent = () => {
    // Render inline content based on current section
    switch (currentSection) {
      case 'profile':
        return <ProfileDashboard />;
      case 'messages':
        return <MessagesContent onClose={() => setCurrentSection('overview')} />;
      case 'notifications':
        return <NotificationsContent onClose={() => setCurrentSection('overview')} />;
      case 'applications':
        return <ApplicationsContent onClose={() => setCurrentSection('overview')} />;
      case 'portfolio':
        return <PortfolioContent onClose={() => setCurrentSection('overview')} />;
      case 'settings':
        return <SettingsContent onClose={() => setCurrentSection('overview')} />;

      // EMPLOYER SECTIONS
      case 'my-jobs':
        return <EmployerDashboard initialTab="jobs" />;
      case 'job-applications':
        return <EmployerDashboard initialTab="applications" />;

      // CLIENT SECTIONS
      case 'my-projects':
        return <ClientDashboard initialTab="projects" />;
      case 'project-applications':
        return <ClientDashboard initialTab="applications" />;

      // TRAINER SECTIONS
      case 'my-courses':
        return <TrainerDashboard />;
      case 'overview':
      default:
        return (
          <>
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
                    onClick={() => {
                      if (action.section) {
                        setCurrentSection(action.section);
                      } else if (action.link) {
                        navigate(action.link);
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <Card className="tech-panel border-border bg-card/50 h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-display tracking-wider">RECENT ACTIVITY</CardTitle>
                      <button
                        onClick={() => setCurrentSection('notifications')}
                        className="text-xs text-secondary hover:text-secondary/80 font-mono flex items-center gap-1"
                      >
                        VIEW ALL <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {formattedActivity.length > 0 ? (
                      <div className="space-y-1">
                        {formattedActivity.map((activity, index) => (
                          <ActivityItem key={index} activity={activity} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Notifications Panel */}
              <Card className="tech-panel border-border bg-card/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-display tracking-wider">NOTIFICATIONS</CardTitle>
                    {formattedNotifications.filter(n => n.unread).length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs">
                        {formattedNotifications.filter(n => n.unread).length}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {formattedNotifications.length > 0 ? (
                    <div className="space-y-1">
                      {formattedNotifications.map((notification, index) => (
                        <NotificationItem key={index} notification={notification} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  )}
                  <button
                    onClick={() => setCurrentSection('notifications')}
                    className="text-xs text-primary hover:underline mt-4 block"
                  >
                    View all notifications
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Role-specific dashboard content */}
            {renderDashboard()}
          </>
        );
    }
  };

  const renderDashboard = () => {
    // Show role-specific dashboards for overview section
    switch (role) {
      case 'client':
        return <ClientDashboard />;
      case 'employer':
        return <EmployerDashboard />;
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
        <div className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-card transition-colors lg:hidden"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>

            <Link to="/" className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="RPA Helpline Logo"
                className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg object-contain"
              />
              <span className="text-sm sm:text-base md:text-lg font-display font-bold text-foreground tracking-wider hidden sm:block">RPA HELPLINE</span>
            </Link>

            {/* Search Bar - Hidden on mobile */}
            <div className="hidden md:block">
              <GlobalSearch />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            <ThemeSwitcher />

            <button
              onClick={() => setCurrentSection('notifications')}
              className="relative p-1.5 sm:p-2 rounded-lg hover:bg-card transition-colors"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              {unreadNotifications > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>

            <button
              onClick={() => setCurrentSection('messages')}
              className="relative p-1.5 sm:p-2 rounded-lg hover:bg-card transition-colors"
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              {unreadMessages > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-secondary rounded-full" />
              )}
            </button>

            <div className="h-6 sm:h-8 w-px bg-border mx-1 hidden sm:block" />

            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-display text-foreground">{profile.full_name || profile.name || 'Operator'}</p>
                <p className={`text-xs font-mono ${userConfig.color}`}>{userConfig.label}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-display font-bold text-sm sm:text-base">
                {(profile.full_name || profile.name || 'O').charAt(0).toUpperCase()}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground hidden sm:flex"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex pt-[73px]">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed left-0 top-[73px] bottom-0 w-64 tech-panel border-r border-border p-4 overflow-y-auto transition-transform duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
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
                <span className="text-primary font-mono">{profileCompletion}%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <SidebarNav
            role={role}
            currentSection={currentSection}
            setCurrentSection={setCurrentSection}
            unreadMessages={unreadMessages}
            unreadNotifications={unreadNotifications}
            onMobileNavClick={() => {
              // Only close on mobile screens
              if (window.innerWidth < 1024) {
                setSidebarOpen(false);
              }
            }}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-73px)]">
          <div className="p-4 md:p-6 lg:p-8">
            {/* Welcome Header - Only show in overview */}
            {currentSection === 'overview' && (
              <div className="mb-8">
                <div className="inline-flex items-center gap-3 px-4 py-2 tech-panel rounded-full mb-4 border-glow-blue">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-mono text-secondary uppercase tracking-wider">Session Active • All Systems Operational</span>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-wider mb-2">
                    WELCOME BACK, <span className="text-primary">{(profile.full_name || profile.name || 'OPERATOR').split(' ')[0]?.toUpperCase()}</span>
                  </h1>
                  <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your RPA journey today.</p>
                </div>
              </div>
            )}

            {/* Stats Grid - Only show in overview */}
            {currentSection === 'overview' && (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                {statsData.map((stat, index) => (
                  <StatCard key={index} stat={stat} index={index} />
                ))}
              </div>
            )}

            {/* Dynamic Content Based on Section */}
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';
