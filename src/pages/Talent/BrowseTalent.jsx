import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { profileApi, taxonomyApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useAuthStore } from '../../store/authStore';
import { Container } from '../../components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Search, Filter, MapPin, Star, Users, Briefcase, ChevronDown,
  Grid3X3, List, X, MessageSquare, Eye, CheckCircle, Award,
  Clock, Globe, ArrowRight
} from 'lucide-react';

// ============================================================================
// TALENT CARD COMPONENT
// ============================================================================
const TalentCard = memo(({ profile, viewMode }) => {
  const navigate = useNavigate();

  if (viewMode === 'list') {
    return (
      <Card 
        className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 cursor-pointer group"
        onClick={() => navigate(`/profile/${profile.id}`)}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-display font-bold flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
              ) : (
                profile.full_name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-display font-bold text-foreground tracking-wider group-hover:text-primary transition-colors">
                      {profile.full_name}
                    </h3>
                    {profile.is_verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {profile.is_available && (
                      <Badge variant="success" className="text-xs font-mono">AVAILABLE</Badge>
                    )}
                  </div>
                  {profile.headline && (
                    <p className="text-sm text-muted-foreground">{profile.headline}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {profile.city && profile.country && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {profile.city}, {profile.country}
                      </span>
                    )}
                    {profile.user_type && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {profile.user_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.skills.slice(0, 5).map((skill, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-mono">
                      {skill.skill?.name || skill}
                    </span>
                  ))}
                  {profile.skills.length > 5 && (
                    <span className="px-2 py-1 text-muted-foreground text-xs">
                      +{profile.skills.length - 5} more
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {profile.profile_views !== undefined && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {profile.profile_views} views
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="font-mono text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/messages?userId=${profile.id}`);
                    }}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    MESSAGE
                  </Button>
                  <Button 
                    size="sm" 
                    className="font-mono text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${profile.id}`);
                    }}
                  >
                    VIEW PROFILE
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
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
      className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 cursor-pointer group h-full"
      onClick={() => navigate(`/profile/${profile.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-display font-bold mb-3">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              profile.full_name?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-display font-bold text-foreground tracking-wider group-hover:text-primary transition-colors">
              {profile.full_name}
            </h3>
            {profile.is_verified && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
          {profile.headline && (
            <p className="text-xs text-muted-foreground line-clamp-2">{profile.headline}</p>
          )}
          {profile.city && profile.country && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {profile.city}, {profile.country}
            </p>
          )}
        </div>

        {profile.is_available && (
          <div className="flex justify-center mb-4">
            <Badge variant="success" className="text-xs font-mono">AVAILABLE</Badge>
          </div>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 mb-4">
            {profile.skills.slice(0, 3).map((skill, i) => (
              <span key={i} className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-mono">
                {skill.skill?.name || skill}
              </span>
            ))}
            {profile.skills.length > 3 && (
              <span className="px-2 py-1 text-muted-foreground text-xs">+{profile.skills.length - 3}</span>
            )}
          </div>
        )}

        <Button 
          className="w-full font-mono text-xs tracking-wider"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${profile.id}`);
          }}
        >
          VIEW PROFILE
        </Button>
      </CardContent>
    </Card>
  );
});
TalentCard.displayName = 'TalentCard';

// ============================================================================
// FILTER PILL COMPONENT
// ============================================================================
const FilterPill = memo(({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-mono transition-all ${
      active
        ? 'bg-primary text-white'
        : 'tech-panel text-muted-foreground hover:text-foreground hover:border-secondary'
    }`}
  >
    {label}
  </button>
));
FilterPill.displayName = 'FilterPill';

// ============================================================================
// MAIN BROWSE TALENT PAGE
// ============================================================================
export const BrowseTalent = memo(() => {
  const navigate = useNavigate();
  const toast = useToast();
  const { role, isAuthenticated } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [selectedUserType, setSelectedUserType] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // API state
  const [profiles, setProfiles] = useState([]);
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
  }, [debouncedSearchQuery, selectedUserType, selectedCountry, availableOnly, sortBy]);

  // Fetch profiles from API
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearchQuery.trim() || undefined,
          user_type: selectedUserType !== 'all' ? selectedUserType : undefined,
          country: selectedCountry !== 'all' ? selectedCountry : undefined,
          is_available: availableOnly ? 'true' : undefined,
          sort: sortBy === 'newest' ? 'created_at' : sortBy === 'views' ? 'profile_views' : 'full_name',
          order: sortBy === 'name' ? 'asc' : 'desc'
        };

        // Remove undefined params
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        const response = await profileApi.getAll(params);
        setProfiles(response.profiles || []);
        setPagination(prev => ({
          ...prev,
          ...response.pagination
        }));
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
        toast.error(error.error || 'Failed to load talent');
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, selectedUserType, selectedCountry, availableOnly, sortBy, pagination.page]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedUserType('all');
    setSelectedCountry('all');
    setAvailableOnly(false);
  }, []);

  const hasActiveFilters = searchQuery || selectedUserType !== 'all' || selectedCountry !== 'all' || availableOnly;

  // Check if user is authorized (only hiring members can browse talent)
  useEffect(() => {
    if (isAuthenticated && role !== 'client' && role !== 'employer') {
      toast.error('Only hiring members can browse talent. Switch to a hiring role to access this feature.');
      navigate('/dashboard');
    }
  }, [isAuthenticated, role, navigate, toast]);

  // Show access denied message for non-hiring roles
  if (isAuthenticated && role !== 'client' && role !== 'employer') {
    return (
      <Container className="py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            Access Restricted
          </h2>
          <p className="text-muted-foreground mb-6">
            Only hiring members (clients and employers) can browse talent. Switch to a hiring role to access this feature.
          </p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Go to Dashboard
          </Button>
        </div>
      </Container>
    );
  }

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
                <Users className="w-3 h-3 text-secondary" />
                <span className="text-xs font-mono text-secondary tracking-wider">TALENT DIRECTORY</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-wider">
                BROWSE <span className="text-primary">TALENT</span>
              </h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Find skilled RPA professionals for your projects and team.
            </p>
          </div>
        </div>

        {/* Search & Controls Bar */}
        <div className="tech-panel-strong rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, skills, headline..."
                className="w-full pl-10 pr-3 py-2.5 bg-background border-2 border-border rounded-lg text-foreground placeholder-muted-foreground font-mono text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* User Type Filter */}
            <div className="relative">
              <select
                value={selectedUserType}
                onChange={(e) => setSelectedUserType(e.target.value)}
                className="appearance-none px-3 py-2.5 pr-8 bg-background border-2 border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="freelancer">Freelancers</option>
                <option value="job_seeker">Job Seekers</option>
                <option value="trainer">Trainers</option>
                <option value="ba_pm">BA/PM</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none px-3 py-2.5 pr-8 bg-background border-2 border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="views">Most Viewed</option>
                <option value="name">Name A-Z</option>
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
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">Available only</span>
            </label>

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

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-muted-foreground font-mono text-sm">
            {loading ? (
              <span>Loading talent...</span>
            ) : (
              <>
                Showing <span className="text-foreground font-bold">{profiles.length}</span> of{' '}
                <span className="text-foreground font-bold">{pagination.total}</span> professionals
              </>
            )}
          </p>
        </div>

        {/* Talent Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : profiles.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}>
            {profiles.map((profile) => (
              <TalentCard key={profile.id} profile={profile} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <Card className="tech-panel-strong border-border">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-display font-bold text-foreground mb-2">No Talent Found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your search or filters</p>
              <Button onClick={clearFilters} variant="outline" className="font-mono text-xs tracking-wider">
                CLEAR ALL FILTERS
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Load More / Pagination */}
        {!loading && profiles.length > 0 && pagination.totalPages > pagination.page && (
          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              size="lg" 
              className="font-mono tracking-wider"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              LOAD MORE
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Page {pagination.page} of {pagination.totalPages}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

BrowseTalent.displayName = 'BrowseTalent';

