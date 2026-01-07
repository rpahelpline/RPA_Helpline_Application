import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, Filter, GraduationCap, Clock, Users, DollarSign, 
  ChevronLeft, ChevronRight, BookOpen, Video, Monitor, Globe,
  Star, Calendar, Plus, X
} from 'lucide-react';
import { Container } from '../../components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { trainingApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';

const formatIcons = {
  online: <Globe className="w-4 h-4" />,
  offline: <Monitor className="w-4 h-4" />,
  hybrid: <Video className="w-4 h-4" />,
  self_paced: <BookOpen className="w-4 h-4" />,
};

const levelColors = {
  beginner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  intermediate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  advanced: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  all_levels: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useAuthStore();
  const toast = useToast();
  
  // State
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [level, setLevel] = useState(searchParams.get('level') || '');
  const [format, setFormat] = useState(searchParams.get('format') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  
  const debouncedSearch = useDebounce(search, 300);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(level && { level }),
        ...(format && { format }),
      };
      
      const response = await trainingApi.getAll(params);
      
      if (response.programs) {
        setCourses(response.programs);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalCount(response.pagination?.total || 0);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, level, format, page, toast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (level) params.set('level', level);
    if (format) params.set('format', format);
    if (page > 1) params.set('page', page.toString());
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, level, format, page, setSearchParams]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, level, format]);

  const clearFilters = () => {
    setSearch('');
    setLevel('');
    setFormat('');
    setPage(1);
  };

  const hasActiveFilters = search || level || format;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <Container>
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight uppercase">
                RPA TRAINING PROGRAMS
              </h1>
              <p className="text-muted-foreground font-mono text-sm mt-2">
                ENHANCE YOUR AUTOMATION SKILLS WITH EXPERT-LED COURSES
              </p>
            </div>
            
            {role === 'trainer' && (
              <Link to="/create-course">
                <Button variant="primary" className="font-display uppercase tracking-wider">
                  <Plus className="w-4 h-4 mr-2" />
                  CREATE COURSE
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses..."
                  className="pl-10"
                />
              </div>
              
              <Select value={level} onChange={(e) => setLevel(e.target.value)} className="md:w-44">
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="all_levels">All Levels</option>
              </Select>
              
              <Select value={format} onChange={(e) => setFormat(e.target.value)} className="md:w-44">
                <option value="">All Formats</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
                <option value="self_paced">Self-paced</option>
              </Select>
              
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground font-mono">
          {loading ? 'LOADING...' : `${totalCount} COURSES FOUND`}
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : courses.length === 0 ? (
          <Card className="p-12 text-center">
            <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters to find more courses.'
                : 'There are no training programs available at the moment.'}
            </p>
            {role === 'trainer' && (
              <Link to="/create-course">
                <Button variant="primary">Create Your First Course</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link key={course.id} to={`/courses/${course.id}`}>
                <Card className="h-full hover:border-primary/50 transition-all group">
                  {/* Course Image */}
                  {course.thumbnail_url ? (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <GraduationCap className="w-12 h-12 text-primary/50" />
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    {/* Level & Format badges */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`text-xs ${levelColors[course.level] || ''}`}>
                        {course.level?.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {formatIcons[course.format]}
                        {course.format?.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    
                    {/* Trainer */}
                    {course.trainer && (
                      <p className="text-sm text-muted-foreground mb-3">
                        by {course.trainer.full_name || 'Unknown Trainer'}
                      </p>
                    )}
                    
                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {course.description}
                    </p>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
                      {course.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.duration}
                        </span>
                      )}
                      {course.enrolled_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {course.enrolled_count} enrolled
                        </span>
                      )}
                      {course.average_rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {course.average_rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    
                    {/* Price */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <span className="font-bold text-primary text-lg">
                        {course.price === 0 ? 'FREE' : `₹${course.price?.toLocaleString()}`}
                      </span>
                      {course.next_batch_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Starts {new Date(course.next_batch_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm font-mono">
              PAGE {page} OF {totalPages}
            </span>
            
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
};

export default Courses;




