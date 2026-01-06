import { memo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { 
  GraduationCap, DollarSign, Clock, Star, ArrowRight, Users, 
  CheckCircle, Calendar, Eye, TrendingUp, Play, BookOpen,
  Award, ExternalLink, Video, FileText, Plus, Loader2
} from 'lucide-react';
import { trainingApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';

// ============================================================================
// COURSE CARD COMPONENT
// ============================================================================
const CourseCard = memo(({ course }) => (
  <Card className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 group">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
              course.status === 'active' ? 'bg-green-500/20 text-green-500' :
              course.status === 'draft' ? 'bg-accent/20 text-accent' :
              'bg-secondary/20 text-secondary'
            }`}>
              {course.status?.toUpperCase() || 'ACTIVE'}
            </span>
            {course.average_rating >= 4.5 && (
              <span className="flex items-center gap-1 text-xs text-nasa-gold">
                <Award className="w-3 h-3" /> TOP RATED
              </span>
            )}
          </div>
          <h4 className="font-display font-bold text-foreground tracking-wider mb-1 group-hover:text-primary transition-colors line-clamp-2">
            {course.title}
          </h4>
          <p className="text-xs text-muted-foreground">
            {course.technologies?.slice(0, 2).join(' • ') || 'RPA'} • {course.level?.replace('_', ' ') || 'All Levels'}
          </p>
        </div>
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            className="w-16 h-16 rounded-xl object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {course.enrolled_count || 0} students
        </span>
        {course.average_rating > 0 && (
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-nasa-gold fill-nasa-gold" />
            {course.average_rating?.toFixed(1) || '0.0'}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {course.duration || 'Flexible'}
        </span>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <span className="text-lg font-display font-bold text-secondary">
          {course.price === 0 ? 'FREE' : `₹${course.price?.toLocaleString() || 0}`}
        </span>
        <Link to={`/courses/${course.id}/edit`}>
          <Button variant="outline" size="sm" className="font-mono text-xs tracking-wider">
            MANAGE COURSE
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
));
CourseCard.displayName = 'CourseCard';

// ============================================================================
// ENROLLMENT CARD COMPONENT
// ============================================================================
const EnrollmentCard = memo(({ enrollment }) => (
  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-card transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
        {enrollment.user?.full_name?.charAt(0) || 'U'}
      </div>
      <div>
        <p className="text-sm font-display text-foreground">{enrollment.user?.full_name || 'Unknown User'}</p>
        <p className="text-xs text-muted-foreground">{enrollment.program?.title || 'Course'}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-xs text-muted-foreground">
        {enrollment.status === 'completed' ? 'Completed' : 'Enrolled'}
      </p>
      <p className="text-xs text-muted-foreground">
        {new Date(enrollment.enrolled_at || enrollment.created_at).toLocaleDateString()}
      </p>
    </div>
  </div>
));
EnrollmentCard.displayName = 'EnrollmentCard';

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================
const EmptyState = memo(({ icon: Icon, title, description, action, actionLink }) => (
  <div className="text-center py-8">
    <Icon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm mb-4">{description}</p>
    {action && actionLink && (
      <Link to={actionLink}>
        <Button variant="primary" className="font-mono text-xs">
          {action}
        </Button>
      </Link>
    )}
  </div>
));
EmptyState.displayName = 'EmptyState';

// ============================================================================
// MAIN TRAINER DASHBOARD COMPONENT
// ============================================================================
export const TrainerDashboard = memo(() => {
  const toast = useToast();
  
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    avgRating: 0,
    activeCourses: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch trainer's programs
      const programsResponse = await trainingApi.getMyPrograms({ limit: 6 });
      
      if (programsResponse.programs) {
        setCourses(programsResponse.programs);
        
        // Calculate stats from courses
        const totalStudents = programsResponse.programs.reduce((sum, c) => sum + (c.enrolled_count || 0), 0);
        const totalRevenue = programsResponse.programs.reduce((sum, c) => sum + ((c.price || 0) * (c.enrolled_count || 0)), 0);
        const ratingsSum = programsResponse.programs.reduce((sum, c) => sum + (c.average_rating || 0), 0);
        const ratedCourses = programsResponse.programs.filter(c => c.average_rating > 0).length;
        const activeCourses = programsResponse.programs.filter(c => c.status === 'active').length;
        
        setStats({
          totalStudents,
          totalRevenue,
          avgRating: ratedCourses > 0 ? (ratingsSum / ratedCourses) : 0,
          activeCourses,
        });
      }
      
      // Try to fetch recent enrollments - this might not be implemented yet
      try {
        const enrollmentsResponse = await trainingApi.getMyEnrollments({ limit: 5 });
        if (enrollmentsResponse.enrollments) {
          setEnrollments(enrollmentsResponse.enrollments);
        }
      } catch (err) {
        // Enrollments endpoint might not exist yet, that's okay
        console.log('Enrollments not available:', err.message);
      }
      
    } catch (error) {
      console.error('Failed to fetch trainer data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section: Overview Stats */}
      <section>
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="tech-panel border-border bg-card/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">TOTAL STUDENTS</p>
              <p className="text-2xl font-display font-bold text-primary">{stats.totalStudents}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Users className="w-3 h-3" /> Enrolled across all courses
              </p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">TOTAL REVENUE</p>
              <p className="text-2xl font-display font-bold text-secondary">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <DollarSign className="w-3 h-3" /> From course sales
              </p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-nasa-gold" />
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">AVG. RATING</p>
              <p className="text-2xl font-display font-bold text-nasa-gold flex items-center gap-2">
                <Star className="w-5 h-5 fill-nasa-gold" />
                {stats.avgRating > 0 ? stats.avgRating.toFixed(2) : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Based on student reviews</p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">ACTIVE COURSES</p>
              <p className="text-2xl font-display font-bold text-accent">{stats.activeCourses}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <BookOpen className="w-3 h-3" /> Published and live
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section: My Courses */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            MY COURSES
          </h2>
          <div className="flex items-center gap-2">
            <Link to="/create-course">
              <Button className="bg-primary hover:bg-primary/90 font-mono text-xs tracking-wider glow-red">
                <Plus className="w-4 h-4 mr-1" />
                CREATE COURSE
              </Button>
            </Link>
            <Link to="/courses">
              <Button variant="ghost" className="font-mono text-xs tracking-wider text-secondary">
                VIEW ALL <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
        
        {courses.length === 0 ? (
          <EmptyState 
            icon={BookOpen}
            title="No courses yet"
            description="Create your first course to start teaching and earning."
            action="CREATE YOUR FIRST COURSE"
            actionLink="/create-course"
          />
        ) : (
          <div className="grid lg:grid-cols-3 gap-4">
            {courses.slice(0, 6).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* Section: Recent Enrollments */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-secondary" />
            RECENT ENROLLMENTS
          </h2>
        </div>
        
        <Card className="tech-panel border-border bg-card/50">
          <CardContent className="p-4">
            {enrollments.length === 0 ? (
              <EmptyState 
                icon={Users}
                title="No enrollments yet"
                description="Students will appear here when they enroll in your courses."
              />
            ) : (
              <div className="space-y-2">
                {enrollments.map((enrollment) => (
                  <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Section: Quick Actions */}
      <section>
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/create-course">
            <Card className="tech-panel border-border bg-card/50 hover-lift cursor-pointer group h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-foreground tracking-wider group-hover:text-primary transition-colors">
                    NEW COURSE
                  </h3>
                  <p className="text-sm text-muted-foreground">Create a new training</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/courses">
            <Card className="tech-panel border-border bg-card/50 hover-lift cursor-pointer group h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <BookOpen className="w-6 h-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-foreground tracking-wider group-hover:text-secondary transition-colors">
                    BROWSE COURSES
                  </h3>
                  <p className="text-sm text-muted-foreground">See all courses</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-secondary transition-colors" />
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/jobs">
            <Card className="tech-panel border-border bg-card/50 hover-lift cursor-pointer group h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <GraduationCap className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-foreground tracking-wider group-hover:text-accent transition-colors">
                    FIND OPPORTUNITIES
                  </h3>
                  <p className="text-sm text-muted-foreground">Training jobs & projects</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
});

TrainerDashboard.displayName = 'TrainerDashboard';
