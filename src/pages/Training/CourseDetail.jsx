import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, GraduationCap, Clock, Users, DollarSign, Calendar,
  BookOpen, CheckCircle, Star, User, Globe, Monitor, Video, Play,
  Loader2, Edit, Trash2, MessageCircle
} from 'lucide-react';
import { Container } from '../../components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { trainingApi, messageApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';

const formatIcons = {
  online: <Globe className="w-5 h-5" />,
  offline: <Monitor className="w-5 h-5" />,
  hybrid: <Video className="w-5 h-5" />,
  self_paced: <BookOpen className="w-5 h-5" />,
};

const levelColors = {
  beginner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  intermediate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  advanced: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  all_levels: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, role } = useAuthStore();
  const toast = useToast();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    try {
      const response = await trainingApi.getById(id);
      if (response.program) {
        setCourse(response.program);
        // Check if current user is enrolled
        if (response.program.enrollments && user) {
          setIsEnrolled(response.program.enrollments.some(e => e.user_id === user.id));
        }
      } else {
        toast.error('Course not found');
        navigate('/courses');
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
      toast.error('Failed to load course');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate, toast]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/sign-in', { state: { returnTo: `/courses/${id}` } });
      return;
    }
    
    setEnrolling(true);
    try {
      await trainingApi.enroll(id);
      toast.success('Successfully enrolled in the course!');
      setIsEnrolled(true);
      // Refresh course data
      fetchCourse();
    } catch (error) {
      console.error('Enrollment failed:', error);
      toast.error(error.message || 'Failed to enroll. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }
    
    setDeleting(true);
    try {
      await trainingApi.delete(id);
      toast.success('Course deleted successfully');
      navigate('/courses');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error.message || 'Failed to delete course');
    } finally {
      setDeleting(false);
    }
  };

  const handleContactTrainer = async () => {
    if (!isAuthenticated) {
      navigate('/sign-in', { state: { returnTo: `/courses/${id}` } });
      return;
    }
    
    try {
      const response = await messageApi.createConversation({
        recipient_id: course.trainer_id,
        initial_message: `Hi, I'm interested in your course: "${course.title}". I have some questions...`
      });
      
      if (response.conversation) {
        navigate(`/messages?conversation=${response.conversation.id}`);
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to start conversation. Please try again.');
    }
  };

  const isOwner = user && course?.trainer_id === user.id;

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Card className="p-8 text-center">
          <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
          <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist.</p>
          <Link to="/courses">
            <Button variant="primary">Browse Courses</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <Container>
        {/* Back Link */}
        <Link 
          to="/courses" 
          className="inline-flex items-center gap-2 text-foreground font-mono uppercase tracking-wider text-sm mb-8 hover:text-secondary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          BACK TO COURSES
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card>
              {course.thumbnail_url && (
                <div className="aspect-video bg-muted overflow-hidden rounded-t-lg">
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={`${levelColors[course.level] || ''}`}>
                    {course.level?.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    {formatIcons[course.format]}
                    {course.format?.replace('_', ' ')}
                  </span>
                </div>
                
                <h1 className="text-2xl md:text-3xl font-display font-bold mb-4">
                  {course.title}
                </h1>
                
                <p className="text-muted-foreground leading-relaxed">
                  {course.description}
                </p>
                
                {/* Stats */}
                <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-border">
                  {course.duration && (
                    <span className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      {course.duration}
                    </span>
                  )}
                  {course.enrolled_count >= 0 && (
                    <span className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-primary" />
                      {course.enrolled_count} students enrolled
                    </span>
                  )}
                  {course.average_rating > 0 && (
                    <span className="flex items-center gap-2 text-sm">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {course.average_rating.toFixed(1)} ({course.total_reviews} reviews)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Technologies */}
            {course.technologies?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Technologies Covered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {course.technologies.map((tech, index) => (
                      <Badge key={index} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prerequisites */}
            {course.prerequisites && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prerequisites</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {course.prerequisites}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Learning Outcomes */}
            {course.learning_outcomes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What You'll Learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {course.learning_outcomes.split('\n').filter(Boolean).map((outcome, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{outcome}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Syllabus */}
            {course.syllabus && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Syllabus</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {course.syllabus}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing & Enrollment */}
            <Card className="sticky top-24">
              <CardContent className="p-6">
                {/* Price */}
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-primary">
                    {course.price === 0 ? 'FREE' : `₹${course.price?.toLocaleString()}`}
                  </span>
                </div>

                {/* Next Batch */}
                {course.next_batch_date && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                    <Calendar className="w-4 h-4" />
                    Next batch: {new Date(course.next_batch_date).toLocaleDateString()}
                  </div>
                )}

                {/* Max Students */}
                {course.max_students && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                    <Users className="w-4 h-4" />
                    {course.max_students - (course.enrolled_count || 0)} seats left
                  </div>
                )}

                {/* CTA Buttons */}
                {isOwner ? (
                  <div className="space-y-3">
                    <Link to={`/courses/${id}/edit`} className="block">
                      <Button variant="primary" className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Course
                      </Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Delete Course
                    </Button>
                  </div>
                ) : isEnrolled ? (
                  <Button variant="secondary" className="w-full" disabled>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Already Enrolled
                  </Button>
                ) : (
                  <Button 
                    variant="primary" 
                    className="w-full glow-red"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Enroll Now
                      </>
                    )}
                  </Button>
                )}

                {/* Contact Trainer */}
                {!isOwner && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={handleContactTrainer}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Trainer
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Trainer Info */}
            {course.trainer && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About the Trainer</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link to={`/profile/${course.trainer_id}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                    {course.trainer.avatar_url ? (
                      <img 
                        src={course.trainer.avatar_url} 
                        alt={course.trainer.full_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{course.trainer.full_name}</h3>
                      {course.trainer.company_name && (
                        <p className="text-sm text-muted-foreground">{course.trainer.company_name}</p>
                      )}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Course Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Course Includes</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-primary" />
                    {course.duration} of content
                  </li>
                  <li className="flex items-center gap-3">
                    {formatIcons[course.format]}
                    {course.format?.replace('_', ' ')} format
                  </li>
                  {course.technologies?.length > 0 && (
                    <li className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-primary" />
                      {course.technologies.length} technologies covered
                    </li>
                  )}
                  <li className="flex items-center gap-3">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    Certificate of completion
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CourseDetail;


