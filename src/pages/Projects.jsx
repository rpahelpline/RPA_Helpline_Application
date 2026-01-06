import { memo, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, MapPin, Building2, Clock, DollarSign, Star,
  ChevronDown, CheckCircle, ArrowRight, Eye, Users, Briefcase,
  SlidersHorizontal, X, Grid3X3, List, Zap, Award, Globe,
  ArrowUpRight, Bot, Workflow, CircuitBoard, Layers, Database, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { projectApi } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';

// ============================================================================
// FILTER PILL COMPONENT
// ============================================================================
const FilterPill = memo(({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-mono transition-all ${
      active
        ? 'bg-primary text-white'
        : 'tech-panel text-muted-foreground hover:text-foreground hover:border-secondary'
    }`}
  >
    {label}
    {count !== undefined && (
      <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
        active ? 'bg-white/20' : 'bg-muted'
      }`}>
        {count}
      </span>
    )}
  </button>
));
FilterPill.displayName = 'FilterPill';

// ============================================================================
// PROJECT CARD COMPONENT - Optimized with intersection observer
// ============================================================================
const ProjectCard = memo(({ project, viewMode }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  if (viewMode === 'list') {
    return (
      <Card 
        ref={cardRef}
        className={`tech-panel border-border bg-card/50 hover-lift transition-all duration-300 cursor-pointer group ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        onClick={() => navigate(`/projects/${project.id}`)}
        style={{
          transitionDelay: isVisible ? '0ms' : '100ms',
          willChange: isVisible ? 'auto' : 'opacity, transform',
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Company Logo */}
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                      project.urgency === 'HIGH' ? 'bg-primary/20 text-primary' : 
                      project.urgency === 'MEDIUM' ? 'bg-accent/20 text-accent' : 
                      'bg-secondary/20 text-secondary'
                    }`}>
                      {project.urgency} PRIORITY
                    </span>
                    {project.verified && (
                      <span className="flex items-center gap-1 text-xs text-green-500">
                        <CheckCircle className="w-3 h-3" /> VERIFIED
                      </span>
                    )}
                    {project.featured && (
                      <span className="flex items-center gap-1 text-xs text-nasa-gold">
                        <Zap className="w-3 h-3" /> FEATURED
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-display font-bold text-foreground tracking-wider group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {project.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {project.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {project.duration}
                    </span>
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-display font-bold text-secondary">{project.budget}</p>
                  <p className="text-xs text-muted-foreground font-mono">{project.type}</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {project.skills.slice(0, 4).map((skill, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-mono">
                      {skill}
                    </span>
                  ))}
                  {project.skills.length > 4 && (
                    <span className="px-2 py-1 text-muted-foreground text-xs">
                      +{project.skills.length - 4} more
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {project.proposals} proposals
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {project.views} views
                  </span>
                  <span>{project.posted}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid View
  return (
    <Card 
      ref={cardRef}
      className={`tech-panel border-border bg-card/50 hover-lift transition-all duration-300 cursor-pointer group h-full ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      onClick={() => navigate(`/projects/${project.id}`)}
      style={{
        transitionDelay: isVisible ? '0ms' : '100ms',
        willChange: isVisible ? 'auto' : 'opacity, transform',
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
              project.urgency === 'HIGH' ? 'bg-primary/20 text-primary' : 
              project.urgency === 'MEDIUM' ? 'bg-accent/20 text-accent' : 
              'bg-secondary/20 text-secondary'
            }`}>
              {project.urgency}
            </span>
            {project.verified && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
          <p className="text-lg font-display font-bold text-secondary">{project.budget}</p>
        </div>
        
        <CardTitle className="text-base font-display tracking-wider group-hover:text-primary transition-colors line-clamp-2">
          {project.title}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
          <Building2 className="w-3 h-3" />
          {project.company}
          <span className="text-muted-foreground/50">•</span>
          <MapPin className="w-3 h-3" />
          {project.location}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{project.description}</p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {project.skills.slice(0, 3).map((skill, i) => (
            <span key={i} className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-mono">
              {skill}
            </span>
          ))}
          {project.skills.length > 3 && (
            <span className="px-2 py-1 text-muted-foreground text-xs">+{project.skills.length - 3}</span>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {project.duration}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {project.proposals}
            </span>
          </div>
          <span>{project.posted}</span>
        </div>
      </CardContent>
    </Card>
  );
});
ProjectCard.displayName = 'ProjectCard';

// ============================================================================
// PLATFORM FILTER COMPONENT
// ============================================================================
const PlatformFilter = memo(({ platforms, selected, onToggle }) => (
  <div className="space-y-2">
    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">RPA PLATFORMS</p>
    <div className="space-y-1">
      {platforms.map((platform) => (
        <label 
          key={platform.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-card transition-colors cursor-pointer group"
        >
          <input
            type="checkbox"
            checked={selected.includes(platform.id)}
            onChange={() => onToggle(platform.id)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <platform.icon className="w-4 h-4 text-muted-foreground group-hover:text-secondary transition-colors" />
          <span className="text-sm text-foreground flex-1">{platform.name}</span>
          <span className="text-xs text-muted-foreground">{platform.count}</span>
        </label>
      ))}
    </div>
  </div>
));
PlatformFilter.displayName = 'PlatformFilter';

// ============================================================================
// MAIN PROJECTS PAGE COMPONENT
// ============================================================================
export const Projects = memo(() => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, role } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // API state
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Reset pagination when search or filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [debouncedSearchQuery, selectedPlatforms, sortBy]);

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearchQuery.trim() || undefined,
          technology: selectedPlatforms.length > 0 ? selectedPlatforms[0] : undefined,
          status: 'open',
          sort: sortBy === 'newest' ? 'created_at' : sortBy === 'budget-high' ? 'budget_max' : 'created_at',
          order: sortBy === 'budget-high' ? 'desc' : 'desc'
        };

        // Remove undefined params
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        const response = await projectApi.getAll(params);
        setProjects(response.projects || []);
        setPagination(prev => ({
          ...prev,
          ...response.pagination
        }));
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        toast.error(error.error || 'Failed to load projects');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, selectedPlatforms, sortBy, pagination.page]);

  // Transform backend project data to frontend format
  const transformedProjects = useMemo(() => {
    return projects.map(project => ({
      id: project.id,
      title: project.title,
      company: project.client?.company_name || project.client?.full_name || 'Client',
      location: 'Remote', // Backend doesn't have location field yet
      budget: project.budget_min && project.budget_max
        ? `₹${project.budget_min.toLocaleString()} - ₹${project.budget_max.toLocaleString()}`
        : project.budget_min
          ? `₹${project.budget_min.toLocaleString()}+`
          : 'Not specified',
      type: 'Fixed Price', // Backend doesn't distinguish yet
      urgency: project.urgency?.toUpperCase() || 'MEDIUM',
      verified: project.client?.is_verified || false,
      featured: false, // Backend doesn't have this field yet
      description: project.description || '',
      skills: project.technologies || [],
      duration: project.deadline ? `Until ${new Date(project.deadline).toLocaleDateString()}` : 'Not specified',
      proposals: project.application_count || 0,
      views: 0, // Backend doesn't track views yet
      posted: project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Recently',
      platform: project.technologies?.[0]?.toLowerCase() || 'other'
    }));
  }, [projects]);

  // Platform filters (static for now, could be fetched from taxonomy API)
  const platforms = useMemo(() => [
    { id: 'uipath', name: 'UiPath', icon: Bot, count: 0 },
    { id: 'aa', name: 'Automation Anywhere', icon: Workflow, count: 0 },
    { id: 'blueprism', name: 'Blue Prism', icon: CircuitBoard, count: 0 },
    { id: 'powerautomate', name: 'Power Automate', icon: Zap, count: 0 },
    { id: 'workfusion', name: 'WorkFusion', icon: Database, count: 0 },
    { id: 'pega', name: 'Pega', icon: Layers, count: 0 },
  ], []);

  // Filter projects (client-side filtering for urgency and type)
  const filteredProjects = useMemo(() => {
    let result = [...transformedProjects];

    // Platform filter (client-side, backend already filters by technology)
    if (selectedPlatforms.length > 0) {
      result = result.filter(p => 
        selectedPlatforms.some(platform => 
          p.skills.some(skill => skill.toLowerCase().includes(platform.toLowerCase()))
        )
      );
    }

    // Type filter (client-side, backend doesn't support this yet)
    if (selectedType !== 'all') {
      // Skip for now as backend doesn't distinguish fixed/hourly
    }

    // Urgency filter (client-side)
    if (selectedUrgency !== 'all') {
      result = result.filter(p => p.urgency === selectedUrgency);
    }

    // Sort (most sorting done by backend, but we can do client-side for proposals)
    if (sortBy === 'proposals') {
      result.sort((a, b) => a.proposals - b.proposals);
    }

    return result;
  }, [transformedProjects, selectedPlatforms, selectedType, selectedUrgency, sortBy]);

  // Toggle platform filter
  const togglePlatform = useCallback((platformId) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedPlatforms([]);
    setSelectedType('all');
    setSelectedUrgency('all');
    setSearchQuery('');
  }, []);

  const hasActiveFilters = selectedPlatforms.length > 0 || selectedType !== 'all' || selectedUrgency !== 'all' || searchQuery;

  return (
    <div className="min-h-screen pt-16 pb-8 relative">
      {/* Background */}
      <div className="fixed inset-0 star-field opacity-40 pointer-events-none" />
      <div className="fixed inset-0 grid-overlay opacity-20 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 tech-panel rounded-full mb-2">
                <Briefcase className="w-3 h-3 text-secondary" />
                <span className="text-xs font-mono text-secondary tracking-wider">MISSION OPPORTUNITIES</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-wider">
                BROWSE <span className="text-primary">PROJECTS</span>
              </h1>
            </div>
            <div className="flex flex-col gap-3">
              {(role === 'client' || role === 'employer') ? (
                <Button
                  onClick={() => navigate('/register/project')}
                  className="bg-primary hover:bg-primary/90 font-mono text-xs tracking-wider"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  POST PROJECT
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground max-w-md text-right">
                  Only clients and employers can post projects. Looking for work? Browse available projects below.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Search & Controls Bar */}
        <div className="tech-panel-strong rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, skills, companies..."
                className="w-full pl-10 pr-3 py-2.5 bg-background border-2 border-border rounded-lg text-foreground placeholder-muted-foreground font-mono text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none px-3 py-2.5 pr-8 bg-background border-2 border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="budget-high">Top Budget</option>
                <option value="proposals">Least Proposals</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'tech-panel text-muted-foreground hover:text-foreground'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'tech-panel text-muted-foreground hover:text-foreground'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-secondary text-white' : 'tech-panel text-muted-foreground hover:text-foreground'}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider mr-1">TYPE:</span>
            {['all', 'fixed', 'hourly'].map((type) => (
              <FilterPill
                key={type}
                label={type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                active={selectedType === type}
                onClick={() => setSelectedType(type)}
              />
            ))}
            
            <div className="w-px h-6 bg-border mx-2" />
            
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider mr-2">URGENCY:</span>
            {['all', 'HIGH', 'MEDIUM', 'LOW'].map((urgency) => (
              <FilterPill
                key={urgency}
                label={urgency === 'all' ? 'All' : urgency}
                active={selectedUrgency === urgency}
                onClick={() => setSelectedUrgency(urgency)}
              />
            ))}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <X className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          {showFilters && (
            <aside className="w-56 flex-shrink-0 hidden lg:block">
              <div className="tech-panel rounded-xl p-4 sticky top-20">
                <PlatformFilter
                  platforms={platforms}
                  selected={selectedPlatforms}
                  onToggle={togglePlatform}
                />
                
                <div className="my-6 border-t border-border" />
                
                {/* Budget Range */}
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">BUDGET RANGE</p>
                  <div className="space-y-2">
                    {['Any', '$1K - $5K', '$5K - $10K', '$10K - $25K', '$25K+'].map((range) => (
                      <label key={range} className="flex items-center gap-3 p-2 rounded-lg hover:bg-card transition-colors cursor-pointer">
                        <input type="radio" name="budget" className="w-4 h-4 text-primary focus:ring-primary" />
                        <span className="text-sm text-foreground">{range}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="my-6 border-t border-border" />
                
                {/* Project Duration */}
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">DURATION</p>
                  <div className="space-y-2">
                    {['Any', 'Less than 1 week', '1-4 weeks', '1-3 months', '3+ months'].map((duration) => (
                      <label key={duration} className="flex items-center gap-3 p-2 rounded-lg hover:bg-card transition-colors cursor-pointer">
                        <input type="radio" name="duration" className="w-4 h-4 text-primary focus:ring-primary" />
                        <span className="text-sm text-foreground">{duration}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* Projects Grid/List */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-muted-foreground font-mono text-sm">
                {loading ? (
                  <span>Loading projects...</span>
                ) : (
                  <>
                    Showing <span className="text-foreground font-bold">{filteredProjects.length}</span> of{' '}
                    <span className="text-foreground font-bold">{pagination.total}</span> projects
                  </>
                )}
              </p>
              {hasActiveFilters && (
                <div className="flex items-center gap-2">
                  {selectedPlatforms.map((p) => {
                    const platform = platforms.find(pl => pl.id === p);
                    return platform ? (
                      <span key={p} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-mono">
                        {platform.name}
                        <button onClick={() => togglePlatform(p)} className="hover:text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Projects */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'space-y-4'}>
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} viewMode={viewMode} />
                ))}
              </div>
            ) : (
              <Card className="tech-panel-strong border-border">
                <CardContent className="p-12 text-center">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">No Projects Found</h3>
                  <p className="text-muted-foreground mb-6">Try adjusting your filters or search terms</p>
                  <Button onClick={clearFilters} variant="outline" className="font-mono text-xs tracking-wider">
                    CLEAR ALL FILTERS
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Load More / Pagination */}
            {!loading && filteredProjects.length > 0 && pagination.totalPages > pagination.page && (
              <div className="mt-6 text-center">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="font-mono tracking-wider"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  LOAD MORE PROJECTS
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

Projects.displayName = 'Projects';
