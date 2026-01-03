import { memo, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, MapPin, Building2, Clock, DollarSign, Star,
  ChevronDown, CheckCircle, ArrowRight, Eye, Users, Briefcase,
  SlidersHorizontal, X, Grid3X3, List, Zap, Award, Globe,
  BookmarkPlus, Heart, ExternalLink, Laptop, Building, Home as HomeIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

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
// JOB CARD COMPONENT
// ============================================================================
const JobCard = memo(({ job, viewMode, onSave, saved = false }) => {
  const navigate = useNavigate();

  const handleSave = useCallback((e) => {
    e.stopPropagation();
    onSave?.(job.id);
  }, [job.id, onSave]);

  const WorkTypeIcon = job.workType === 'Remote' ? Laptop : job.workType === 'Hybrid' ? Building : HomeIcon;

  if (viewMode === 'list') {
    return (
      <Card 
        className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 cursor-pointer group"
        onClick={() => navigate(`/jobs/${job.id}`)}
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
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {job.featured && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-nasa-gold/20 text-nasa-gold text-xs font-mono">
                        <Zap className="w-3 h-3" /> FEATURED
                      </span>
                    )}
                    {job.urgent && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-mono">
                        URGENT
                      </span>
                    )}
                    {job.new && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-xs font-mono">
                        NEW
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-display font-bold text-foreground tracking-wider group-hover:text-primary transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {job.company}
                    </span>
                    {job.rating && (
                      <span className="flex items-center gap-1 text-nasa-gold">
                        <Star className="w-3 h-3 fill-nasa-gold" />
                        {job.rating}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    className={`p-2 rounded-lg transition-colors ${saved ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                  >
                    <Heart className={`w-5 h-5 ${saved ? 'fill-primary' : ''}`} />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{job.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <WorkTypeIcon className="w-4 h-4" />
                  {job.workType}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Briefcase className="w-4 h-4" />
                  {job.employmentType}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {job.experience}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {job.skills.slice(0, 4).map((skill, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-mono">
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 4 && (
                    <span className="px-2 py-1 text-muted-foreground text-xs">
                      +{job.skills.length - 4} more
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <p className="text-xl font-display font-bold text-secondary">
                    {job.salary?.includes('₹') ? job.salary : `₹${job.salary || 'Not specified'}`}
                  </p>
                  <Link to={`/jobs/${job.id}`} onClick={(e) => e.stopPropagation()}>
                    <Button className="bg-primary hover:bg-primary/90 font-mono text-xs tracking-wider">
                      APPLY NOW
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {job.applicants} applicants
                </span>
                <span>{job.posted}</span>
                {job.benefits && job.benefits.length > 0 && (
                  <span className="text-secondary">+ {job.benefits.length} benefits</span>
                )}
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
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {job.featured && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-nasa-gold/20 text-nasa-gold text-xs font-mono">
                <Zap className="w-3 h-3" />
              </span>
            )}
            {job.urgent && (
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-mono">
                URGENT
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            className={`p-1 rounded transition-colors ${saved ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
          >
            <Heart className={`w-4 h-4 ${saved ? 'fill-primary' : ''}`} />
          </button>
        </div>
        
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Building2 className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{job.company}</p>
            {job.rating && (
              <span className="flex items-center gap-1 text-xs text-nasa-gold">
                <Star className="w-3 h-3 fill-nasa-gold" />
                {job.rating}
              </span>
            )}
          </div>
        </div>
        
        <CardTitle className="text-base font-display tracking-wider group-hover:text-primary transition-colors line-clamp-2">
          {job.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {job.location}
          </span>
          <span className="flex items-center gap-1">
            <WorkTypeIcon className="w-3 h-3" />
            {job.workType}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {job.skills.slice(0, 3).map((skill, i) => (
            <span key={i} className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-mono">
              {skill}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="px-2 py-1 text-muted-foreground text-xs">+{job.skills.length - 3}</span>
          )}
        </div>
        
        <p className="text-lg font-display font-bold text-secondary mb-4">
          {job.salary?.includes('₹') ? job.salary : `₹${job.salary || 'Not specified'}`}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs text-muted-foreground">
          <span>{job.posted}</span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {job.applicants}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});
JobCard.displayName = 'JobCard';

// ============================================================================
// MAIN JOBS PAGE COMPONENT
// ============================================================================
export const Jobs = memo(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedWorkType, setSelectedWorkType] = useState('all');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('all');
  const [savedJobs, setSavedJobs] = useState([]);
  const [sortBy, setSortBy] = useState('newest');

  // Mock jobs data
  const allJobs = useMemo(() => [
    {
      id: '1',
      title: 'Senior UiPath Developer',
      company: 'TechCorp Industries',
      location: 'San Francisco, CA',
      workType: 'Remote',
      employmentType: 'Full-time',
      experience: '5+ years',
      salary: '$140,000 - $180,000',
      description: 'We are looking for a Senior UiPath Developer to lead our automation initiatives. You will design, develop, and maintain RPA solutions for our enterprise clients.',
      skills: ['UiPath', 'RE Framework', 'Orchestrator', 'SQL', 'Python', 'APIs'],
      benefits: ['Health Insurance', '401(k)', 'Remote Work', 'Stock Options', 'Learning Budget'],
      applicants: 45,
      posted: '2 days ago',
      featured: true,
      urgent: true,
      new: false,
      rating: 4.8,
    },
    {
      id: '2',
      title: 'RPA Solution Architect',
      company: 'AutomateNow Inc',
      location: 'New York, NY',
      workType: 'Hybrid',
      employmentType: 'Full-time',
      experience: '7+ years',
      salary: '$160,000 - $200,000',
      description: 'Join our team as an RPA Solution Architect to design scalable automation solutions and lead technical strategy across multiple enterprise clients.',
      skills: ['UiPath', 'Automation Anywhere', 'Blue Prism', 'Architecture', 'Leadership'],
      benefits: ['Health Insurance', 'Unlimited PTO', 'Equity', 'Remote Flexibility'],
      applicants: 28,
      posted: '1 week ago',
      featured: true,
      urgent: false,
      new: false,
      rating: 4.9,
    },
    {
      id: '3',
      title: 'Automation Anywhere Developer',
      company: 'Digital First Solutions',
      location: 'Chicago, IL',
      workType: 'Remote',
      employmentType: 'Full-time',
      experience: '3-5 years',
      salary: '$100,000 - $130,000',
      description: 'Seeking an experienced AA Developer to build and maintain automation bots for our financial services clients.',
      skills: ['Automation Anywhere', 'IQ Bot', 'Python', 'SQL', 'APIs'],
      benefits: ['Health Insurance', '401(k) Match', 'Flexible Hours'],
      applicants: 62,
      posted: '3 days ago',
      featured: false,
      urgent: true,
      new: true,
      rating: 4.5,
    },
    {
      id: '4',
      title: 'Junior RPA Developer',
      company: 'StartupBot Technologies',
      location: 'Austin, TX',
      workType: 'On-site',
      employmentType: 'Full-time',
      experience: '0-2 years',
      salary: '$65,000 - $85,000',
      description: 'Great opportunity for early career professionals! Join our growing team and learn from experienced RPA developers.',
      skills: ['UiPath', 'Basic Programming', 'SQL', 'Excel'],
      benefits: ['Health Insurance', 'Mentorship Program', 'Career Growth'],
      applicants: 124,
      posted: 'Just now',
      featured: false,
      urgent: false,
      new: true,
      rating: 4.3,
    },
    {
      id: '5',
      title: 'Blue Prism Technical Lead',
      company: 'Enterprise Automation Corp',
      location: 'Boston, MA',
      workType: 'Hybrid',
      employmentType: 'Full-time',
      experience: '5-7 years',
      salary: '$130,000 - $160,000',
      description: 'Lead a team of Blue Prism developers and drive automation excellence across our global organization.',
      skills: ['Blue Prism', 'Team Leadership', 'Process Mining', 'Agile'],
      benefits: ['Comprehensive Benefits', 'Bonus', 'Stock Options', 'Flexible Schedule'],
      applicants: 34,
      posted: '5 days ago',
      featured: false,
      urgent: false,
      new: false,
      rating: 4.7,
    },
    {
      id: '6',
      title: 'RPA Business Analyst',
      company: 'Global Consulting Partners',
      location: 'Remote',
      workType: 'Remote',
      employmentType: 'Contract',
      experience: '3+ years',
      salary: '$70 - $90/hour',
      description: 'Analyze business processes and identify automation opportunities for our Fortune 500 clients.',
      skills: ['Process Analysis', 'Requirements Gathering', 'UiPath', 'Documentation'],
      benefits: ['Flexible Hours', 'Remote Work', 'Diverse Projects'],
      applicants: 89,
      posted: '1 day ago',
      featured: true,
      urgent: false,
      new: true,
      rating: 4.6,
    },
  ], []);

  // Filter jobs
  const filteredJobs = useMemo(() => {
    let result = [...allJobs];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(j => 
        j.title.toLowerCase().includes(query) ||
        j.company.toLowerCase().includes(query) ||
        j.skills.some(s => s.toLowerCase().includes(query))
      );
    }

    // Location filter
    if (locationQuery) {
      const query = locationQuery.toLowerCase();
      result = result.filter(j => j.location.toLowerCase().includes(query));
    }

    // Work type filter
    if (selectedWorkType !== 'all') {
      result = result.filter(j => j.workType === selectedWorkType);
    }

    // Employment type filter
    if (selectedEmploymentType !== 'all') {
      result = result.filter(j => j.employmentType === selectedEmploymentType);
    }

    // Experience filter
    if (selectedExperience !== 'all') {
      result = result.filter(j => j.experience.includes(selectedExperience));
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        break; // Already sorted
      case 'salary-high':
        result.sort((a, b) => {
          const aMax = parseInt(a.salary.replace(/[^0-9]/g, '')) || 0;
          const bMax = parseInt(b.salary.replace(/[^0-9]/g, '')) || 0;
          return bMax - aMax;
        });
        break;
      case 'applicants':
        result.sort((a, b) => a.applicants - b.applicants);
        break;
      default:
        break;
    }

    return result;
  }, [allJobs, searchQuery, locationQuery, selectedWorkType, selectedEmploymentType, selectedExperience, sortBy]);

  // Toggle save job
  const toggleSaveJob = useCallback((jobId) => {
    setSavedJobs(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setLocationQuery('');
    setSelectedWorkType('all');
    setSelectedEmploymentType('all');
    setSelectedExperience('all');
  }, []);

  const hasActiveFilters = searchQuery || locationQuery || selectedWorkType !== 'all' || selectedEmploymentType !== 'all' || selectedExperience !== 'all';

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
                <span className="text-xs font-mono text-secondary tracking-wider">CAREER OPPORTUNITIES</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-wider">
                RPA <span className="text-primary">JOB BOARD</span>
              </h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Find your dream job in robotic process automation from top companies worldwide.
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
                placeholder="Job title, skills, or company..."
                className="w-full pl-10 pr-3 py-2.5 bg-background border-2 border-border rounded-lg text-foreground placeholder-muted-foreground font-mono text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Location Input */}
            <div className="relative w-full lg:w-52">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Location..."
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
                <option value="newest">Recent</option>
                <option value="salary-high">Top Salary</option>
                <option value="applicants">Least Applicants</option>
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
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider mr-1">WORK:</span>
            {['all', 'Remote', 'Hybrid', 'On-site'].map((type) => (
              <FilterPill
                key={type}
                label={type === 'all' ? 'All' : type}
                active={selectedWorkType === type}
                onClick={() => setSelectedWorkType(type)}
              />
            ))}
            
            <div className="w-px h-6 bg-border mx-2" />
            
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider mr-1">TYPE:</span>
            {['all', 'Full-time', 'Contract', 'Part-time'].map((type) => (
              <FilterPill
                key={type}
                label={type === 'all' ? 'All' : type}
                active={selectedEmploymentType === type}
                onClick={() => setSelectedEmploymentType(type)}
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

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-muted-foreground font-mono text-sm">
            Showing <span className="text-foreground font-bold">{filteredJobs.length}</span> jobs
            {savedJobs.length > 0 && (
              <span className="ml-4 text-secondary">
                <Heart className="w-4 h-4 inline mr-1 fill-secondary" />
                {savedJobs.length} saved
              </span>
            )}
          </p>
        </div>

        {/* Jobs */}
        {filteredJobs.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredJobs.map((job) => (
              <JobCard 
                key={job.id} 
                job={job} 
                viewMode={viewMode}
                onSave={toggleSaveJob}
                saved={savedJobs.includes(job.id)}
              />
            ))}
          </div>
        ) : (
          <Card className="tech-panel-strong border-border">
            <CardContent className="p-12 text-center">
              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-display font-bold text-foreground mb-2">No Jobs Found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your search or filters</p>
              <Button onClick={clearFilters} variant="outline" className="font-mono text-xs tracking-wider">
                CLEAR ALL FILTERS
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Load More */}
        {filteredJobs.length > 0 && (
          <div className="mt-6 text-center">
            <Button variant="outline" size="lg" className="font-mono tracking-wider">
              LOAD MORE JOBS
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

Jobs.displayName = 'Jobs';


