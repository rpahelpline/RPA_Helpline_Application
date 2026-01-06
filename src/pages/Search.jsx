import { memo, useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, Briefcase, FolderKanban, Users, ArrowRight, X } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { jobApi, projectApi, profileApi } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../store/authStore';
import { useDebounce } from '../hooks/useDebounce';

export const SearchPage = memo(() => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { role } = useAuthStore();
  const toastRef = useRef(toast);
  
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  
  // Set default tab based on role
  const getDefaultTab = () => {
    if (role === 'job_seeker') return 'jobs';
    if (role === 'freelancer') return 'projects';
    if (role === 'client' || role === 'employer') return 'profiles';
    if (role === 'ba_pm' || role === 'developer') return 'projects';
    return 'all';
  };
  
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam || getDefaultTab();
  });
  
  const debouncedQuery = useDebounce(searchQuery, 500);
  
  const [results, setResults] = useState({
    jobs: [],
    projects: [],
    profiles: []
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    jobs: { page: 1, total: 0, totalPages: 0 },
    projects: { page: 1, total: 0, totalPages: 0 },
    profiles: { page: 1, total: 0, totalPages: 0 }
  });

  // Keep toast ref updated
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // Track previous query to prevent unnecessary URL updates
  const previousQueryRef = useRef(debouncedQuery);

  // Update URL when query changes (only if different from previous)
  useEffect(() => {
    const newQuery = debouncedQuery.trim();
    const previousQuery = previousQueryRef.current.trim();
    
    // Only update URL if query actually changed
    if (newQuery !== previousQuery) {
      previousQueryRef.current = debouncedQuery;
      
      if (newQuery) {
        setSearchParams({ q: newQuery }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }
  }, [debouncedQuery, setSearchParams]);

  // Perform search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ jobs: [], projects: [], profiles: [] });
      setPagination({
        jobs: { page: 1, total: 0, totalPages: 0 },
        projects: { page: 1, total: 0, totalPages: 0 },
        profiles: { page: 1, total: 0, totalPages: 0 }
      });
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const performSearch = async () => {
      setLoading(true);
      try {
        const [jobsRes, projectsRes, profilesRes] = await Promise.allSettled([
          jobApi.getAll({ search: debouncedQuery.trim(), limit: 20, page: 1 }),
          projectApi.getAll({ search: debouncedQuery.trim(), limit: 20, page: 1 }),
          profileApi.getAll({ search: debouncedQuery.trim(), limit: 20, page: 1 })
        ]);

        if (isCancelled) return;

        setResults({
          jobs: jobsRes.status === 'fulfilled' ? (jobsRes.value.jobs || []) : [],
          projects: projectsRes.status === 'fulfilled' ? (projectsRes.value.projects || []) : [],
          profiles: profilesRes.status === 'fulfilled' ? (profilesRes.value.profiles || []) : []
        });

        setPagination({
          jobs: jobsRes.status === 'fulfilled' ? (jobsRes.value.pagination || { page: 1, total: 0, totalPages: 0 }) : { page: 1, total: 0, totalPages: 0 },
          projects: projectsRes.status === 'fulfilled' ? (projectsRes.value.pagination || { page: 1, total: 0, totalPages: 0 }) : { page: 1, total: 0, totalPages: 0 },
          profiles: profilesRes.status === 'fulfilled' ? (profilesRes.value.pagination || { page: 1, total: 0, totalPages: 0 }) : { page: 1, total: 0, totalPages: 0 }
        });
      } catch (error) {
        if (isCancelled) return;
        console.error('Search error:', error);
        toastRef.current?.error('Failed to perform search');
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    performSearch();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  const totalResults = results.jobs.length + results.projects.length + results.profiles.length;

  // Role-based tab ordering and visibility
  const getTabs = () => {
    const allTabs = [
      { id: 'all', label: 'All', count: totalResults, icon: Search },
      { id: 'jobs', label: 'Jobs', count: results.jobs.length, icon: Briefcase },
      { id: 'projects', label: 'Projects', count: results.projects.length, icon: FolderKanban },
      { id: 'profiles', label: 'Profiles', count: results.profiles.length, icon: Users }
    ];

    // Reorder tabs based on role
    if (role === 'job_seeker') {
      // Job seekers see jobs first
      return [
        allTabs.find(t => t.id === 'jobs'),
        allTabs.find(t => t.id === 'all'),
        allTabs.find(t => t.id === 'projects'),
        allTabs.find(t => t.id === 'profiles')
      ].filter(Boolean);
    } else if (role === 'freelancer' || role === 'ba_pm' || role === 'developer') {
      // Freelancers/developers see projects first
      return [
        allTabs.find(t => t.id === 'projects'),
        allTabs.find(t => t.id === 'all'),
        allTabs.find(t => t.id === 'jobs'),
        allTabs.find(t => t.id === 'profiles')
      ].filter(Boolean);
    } else if (role === 'client' || role === 'employer') {
      // Hiring members see profiles first
      return [
        allTabs.find(t => t.id === 'profiles'),
        allTabs.find(t => t.id === 'all'),
        allTabs.find(t => t.id === 'jobs'),
        allTabs.find(t => t.id === 'projects')
      ].filter(Boolean);
    }
    
    // Default order
    return allTabs;
  };

  const tabs = getTabs();

  return (
    <div className="min-h-screen pt-16 pb-8 relative">
      {/* Background */}
      <div className="fixed inset-0 star-field opacity-40 pointer-events-none" />
      <div className="fixed inset-0 grid-overlay opacity-20 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-wider mb-2">
            SEARCH <span className="text-primary">RESULTS</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Search across jobs, projects, and profiles
          </p>
        </div>

        {/* Search Bar */}
        <div className="tech-panel-strong rounded-xl p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs, profiles, projects..."
              className="w-full pl-10 pr-10 py-2.5 bg-background border-2 border-border rounded-lg text-foreground placeholder-muted-foreground font-mono text-sm focus:outline-none focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-mono transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'tech-panel text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : !debouncedQuery.trim() ? (
          <Card className="tech-panel-strong border-border">
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-display font-bold text-foreground mb-2">Start Searching</h3>
              <p className="text-muted-foreground">Enter a search query to find jobs, projects, and profiles</p>
            </CardContent>
          </Card>
        ) : totalResults === 0 ? (
          <Card className="tech-panel-strong border-border">
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-display font-bold text-foreground mb-2">No Results Found</h3>
              <p className="text-muted-foreground mb-6">No results found for "{debouncedQuery}"</p>
              <Button onClick={() => setSearchQuery('')} variant="outline" className="font-mono text-xs tracking-wider">
                CLEAR SEARCH
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Jobs */}
            {(activeTab === 'all' || activeTab === 'jobs') && results.jobs.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Jobs ({pagination.jobs.total})
                  </h2>
                  <Link to={`/jobs?search=${encodeURIComponent(debouncedQuery)}`}>
                    <Button variant="outline" size="sm" className="font-mono text-xs">
                      View All <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {results.jobs.map((job) => (
                    <Card
                      key={job.id}
                      className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 cursor-pointer group"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <CardContent className="p-4">
                        <h3 className="text-base font-display font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                          {job.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {job.employer?.company_name || job.location || 'Company'}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{job.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {(activeTab === 'all' || activeTab === 'projects') && results.projects.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                    <FolderKanban className="w-5 h-5" />
                    Projects ({pagination.projects.total})
                  </h2>
                  <Link to={`/projects?search=${encodeURIComponent(debouncedQuery)}`}>
                    <Button variant="outline" size="sm" className="font-mono text-xs">
                      View All <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {results.projects.map((project) => (
                    <Card
                      key={project.id}
                      className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 cursor-pointer group"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <CardContent className="p-4">
                        <h3 className="text-base font-display font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                          {project.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {project.client?.full_name || 'Client'}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Profiles */}
            {(activeTab === 'all' || activeTab === 'profiles') && results.profiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Profiles ({pagination.profiles.total})
                  </h2>
                  <Link to={`/talent?search=${encodeURIComponent(debouncedQuery)}`}>
                    <Button variant="outline" size="sm" className="font-mono text-xs">
                      View All <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.profiles.map((profile) => (
                    <Card
                      key={profile.id}
                      className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 cursor-pointer group"
                      onClick={() => navigate(`/profile/${profile.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-display font-bold">
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              profile.full_name?.charAt(0)?.toUpperCase() || 'U'
                            )}
                          </div>
                          <div>
                            <h3 className="text-base font-display font-bold text-foreground group-hover:text-primary transition-colors">
                              {profile.full_name}
                            </h3>
                            {profile.headline && (
                              <p className="text-xs text-muted-foreground">{profile.headline}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

SearchPage.displayName = 'SearchPage';

