import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, Briefcase, Users, FolderKanban, ArrowRight } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { jobApi, projectApi, profileApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';

export const GlobalSearch = memo(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState({
    jobs: [],
    projects: [],
    profiles: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();
  const toastRef = useRef(toast);

  // Keep toast ref updated
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const debouncedQuery = useDebounce(searchQuery, 500);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showResults]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setShowResults(true);
      }
      // Escape to close
      if (e.key === 'Escape' && showResults) {
        setShowResults(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showResults]);

  // Search when query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ jobs: [], projects: [], profiles: [] });
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const performSearch = async () => {
      setLoading(true);
      try {
        const [jobsRes, projectsRes, profilesRes] = await Promise.allSettled([
          jobApi.getAll({ search: debouncedQuery.trim(), limit: 5, page: 1 }),
          projectApi.getAll({ search: debouncedQuery.trim(), limit: 5, page: 1 }),
          profileApi.getAll({ search: debouncedQuery.trim(), limit: 5, page: 1 })
        ]);

        if (isCancelled) return;

        setResults({
          jobs: jobsRes.status === 'fulfilled' ? (jobsRes.value.jobs || []) : [],
          projects: projectsRes.status === 'fulfilled' ? (projectsRes.value.projects || []) : [],
          profiles: profilesRes.status === 'fulfilled' ? (profilesRes.value.profiles || []) : []
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

  const handleResultClick = useCallback((type, id) => {
    setShowResults(false);
    setSearchQuery('');
    inputRef.current?.blur();
    if (type === 'job') {
      navigate(`/jobs/${id}`);
    } else if (type === 'project') {
      navigate(`/projects/${id}`);
    } else if (type === 'profile') {
      navigate(`/profile/${id}`);
    }
  }, [navigate]);

  const handleViewAll = useCallback(() => {
    setShowResults(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
    inputRef.current?.blur();
  }, [navigate, searchQuery]);

  const handleInputFocus = () => {
    if (searchQuery.trim() || hasResults) {
      setShowResults(true);
    }
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) {
      setShowResults(true);
    }
  };

  const totalResults = results.jobs.length + results.projects.length + results.profiles.length;
  const hasResults = totalResults > 0;

  return (
    <div className="relative flex-1 max-w-2xl" ref={searchRef}>
      {/* Search Input - Inline */}
      <div className="relative w-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowResults(false);
                inputRef.current?.blur();
              }
            }}
            placeholder="Search jobs, profiles, projects..."
            className="w-full pl-10 pr-10 py-2 tech-panel rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery('');
                setShowResults(false);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {!searchQuery && (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-mono pointer-events-none hidden lg:block">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Results Dropdown */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-2 tech-panel-strong rounded-xl shadow-2xl border border-border overflow-hidden z-50 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : debouncedQuery.trim() && !hasResults ? (
              <div className="p-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No results found for "{debouncedQuery}"</p>
              </div>
            ) : hasResults ? (
              <div>
                {/* Tabs */}
                <div className="flex items-center gap-1 px-4 pt-4 border-b border-border">
                  {['all', 'jobs', 'projects', 'profiles'].map((tab) => {
                    const counts = {
                      all: totalResults,
                      jobs: results.jobs.length,
                      projects: results.projects.length,
                      profiles: results.profiles.length
                    };
                    const icons = {
                      all: Search,
                      jobs: Briefcase,
                      projects: FolderKanban,
                      profiles: Users
                    };
                    const Icon = icons[tab];
                    const count = counts[tab];

                    if (count === 0 && tab !== 'all') return null;

                    return (
                      <button
                        key={tab}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab(tab);
                        }}
                        className={`px-3 py-2 text-xs font-mono rounded-lg transition-colors ${
                          activeTab === tab
                            ? 'bg-primary text-white'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                        type="button"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <Icon className="w-3 h-3 inline mr-1" />
                        {tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Results List */}
                <div className="p-4">
                  {/* Jobs */}
                  {(activeTab === 'all' || activeTab === 'jobs') && results.jobs.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Briefcase className="w-3 h-3" />
                          Jobs
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {results.jobs.map((job) => (
                          <button
                            key={job.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResultClick('job', job.id);
                            }}
                            className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                            type="button"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-display font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                  {job.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {job.employer?.company_name || job.location || 'Job'}
                                </p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {(activeTab === 'all' || activeTab === 'projects') && results.projects.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <FolderKanban className="w-3 h-3" />
                          Projects
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {results.projects.map((project) => (
                          <button
                            key={project.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResultClick('project', project.id);
                            }}
                            className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                            type="button"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-display font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                  {project.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {project.client?.full_name || 'Project'}
                                </p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Profiles */}
                  {(activeTab === 'all' || activeTab === 'profiles') && results.profiles.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Users className="w-3 h-3" />
                          Profiles
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {results.profiles.map((profile) => (
                          <button
                            key={profile.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResultClick('profile', profile.id);
                            }}
                            className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                            type="button"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-display font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                  {profile.full_name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {profile.headline || profile.user_type || 'Profile'}
                                </p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View All Button */}
                  {hasResults && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewAll();
                      }}
                      className="w-full mt-4 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-mono text-xs tracking-wider transition-colors flex items-center justify-center gap-2"
                      type="button"
                    >
                      View all results for "{debouncedQuery}"
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
});

GlobalSearch.displayName = 'GlobalSearch';

