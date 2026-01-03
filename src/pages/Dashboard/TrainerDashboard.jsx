import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  GraduationCap, DollarSign, Clock, Star, ArrowRight, Users, 
  CheckCircle, Calendar, Eye, TrendingUp, Play, BookOpen,
  Award, ExternalLink, Video, FileText, Plus
} from 'lucide-react';

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
              course.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-500' :
              course.status === 'DRAFT' ? 'bg-accent/20 text-accent' :
              'bg-secondary/20 text-secondary'
            }`}>
              {course.status}
            </span>
            {course.bestseller && (
              <span className="flex items-center gap-1 text-xs text-nasa-gold">
                <Award className="w-3 h-3" /> BESTSELLER
              </span>
            )}
          </div>
          <h4 className="font-display font-bold text-foreground tracking-wider mb-1 group-hover:text-primary transition-colors">
            {course.title}
          </h4>
          <p className="text-xs text-muted-foreground">{course.platform} • {course.level}</p>
        </div>
        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
          <Play className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {course.students} students
        </span>
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3 text-nasa-gold fill-nasa-gold" />
          {course.rating}
        </span>
        <span className="flex items-center gap-1">
          <Video className="w-3 h-3" />
          {course.lessons} lessons
        </span>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <span className="text-lg font-display font-bold text-secondary">${course.revenue}</span>
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
// STUDENT CARD COMPONENT
// ============================================================================
const StudentCard = memo(({ student }) => (
  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-card transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
        {student.name.charAt(0)}
      </div>
      <div>
        <p className="text-sm font-display text-foreground">{student.name}</p>
        <p className="text-xs text-muted-foreground">{student.course}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-xs text-muted-foreground">Progress</p>
      <p className="text-sm font-display font-bold text-secondary">{student.progress}%</p>
    </div>
  </div>
));
StudentCard.displayName = 'StudentCard';

// ============================================================================
// MAIN TRAINER DASHBOARD COMPONENT
// ============================================================================
export const TrainerDashboard = memo(() => {
  // Mock courses data
  const courses = useMemo(() => [
    {
      id: '1',
      title: 'UiPath Complete Developer Course',
      platform: 'UiPath',
      level: 'Beginner to Advanced',
      status: 'PUBLISHED',
      students: 1245,
      rating: 4.9,
      lessons: 48,
      revenue: 12450,
      bestseller: true,
    },
    {
      id: '2',
      title: 'Automation Anywhere IQ Bot Mastery',
      platform: 'Automation Anywhere',
      level: 'Intermediate',
      status: 'PUBLISHED',
      students: 856,
      rating: 4.8,
      lessons: 32,
      revenue: 8560,
      bestseller: false,
    },
    {
      id: '3',
      title: 'Blue Prism Architecture & Best Practices',
      platform: 'Blue Prism',
      level: 'Advanced',
      status: 'DRAFT',
      students: 0,
      rating: 0,
      lessons: 12,
      revenue: 0,
      bestseller: false,
    },
  ], []);

  // Mock recent students
  const recentStudents = useMemo(() => [
    { id: '1', name: 'John Smith', course: 'UiPath Complete Developer', progress: 75 },
    { id: '2', name: 'Sarah Chen', course: 'UiPath Complete Developer', progress: 92 },
    { id: '3', name: 'Mike Johnson', course: 'AA IQ Bot Mastery', progress: 45 },
    { id: '4', name: 'Emily Davis', course: 'UiPath Complete Developer', progress: 100 },
    { id: '5', name: 'Alex Wilson', course: 'AA IQ Bot Mastery', progress: 28 },
  ], []);

  // Stats
  const stats = useMemo(() => ({
    totalStudents: 2101,
    totalRevenue: '₹2.1L',
    avgRating: 4.85,
    completionRate: '78%',
  }), []);

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
              <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +156 this month
              </p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">TOTAL REVENUE</p>
              <p className="text-2xl font-display font-bold text-secondary">{stats.totalRevenue}</p>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +18% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-nasa-gold" />
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">AVG. RATING</p>
              <p className="text-2xl font-display font-bold text-nasa-gold flex items-center gap-2">
                <Star className="w-5 h-5 fill-nasa-gold" />
                {stats.avgRating}
              </p>
            </CardContent>
          </Card>
          <Card className="tech-panel border-border bg-card/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
            <CardContent className="p-4">
              <p className="text-xs font-mono text-muted-foreground mb-1">COMPLETION RATE</p>
              <p className="text-2xl font-display font-bold text-accent">{stats.completionRate}</p>
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
        
        <div className="grid lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* Section: Recent Students */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-foreground tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-secondary" />
            RECENT STUDENTS
          </h2>
          <Link to="/students">
            <Button variant="ghost" className="font-mono text-xs tracking-wider text-secondary">
              VIEW ALL <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
        
        <Card className="tech-panel border-border bg-card/50">
          <CardContent className="p-4">
            <div className="space-y-2">
              {recentStudents.map((student) => (
                <StudentCard key={student.id} student={student} />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Section: Quick Actions */}
      <section>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="tech-panel border-border bg-card/50 hover-lift cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground tracking-wider group-hover:text-primary transition-colors">
                  COURSE MATERIALS
                </h3>
                <p className="text-sm text-muted-foreground">Upload resources</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
          
          <Card className="tech-panel border-border bg-card/50 hover-lift cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <Award className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground tracking-wider group-hover:text-secondary transition-colors">
                  CERTIFICATIONS
                </h3>
                <p className="text-sm text-muted-foreground">Issue certificates</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-secondary transition-colors" />
            </CardContent>
          </Card>
          
          <Card className="tech-panel border-border bg-card/50 hover-lift cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground tracking-wider group-hover:text-accent transition-colors">
                  ANALYTICS
                </h3>
                <p className="text-sm text-muted-foreground">View insights</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
});

TrainerDashboard.displayName = 'TrainerDashboard';
