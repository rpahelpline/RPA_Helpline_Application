import { useState, useEffect, memo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { profileApi, messageApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { Container } from '../../components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner, SkeletonLoader } from '../../components/common/LoadingSpinner';
import {
  MapPin, Globe, Linkedin, Mail, MessageSquare, Award, Briefcase,
  Star, Calendar, ExternalLink, CheckCircle, Building2, Clock,
  Users, GraduationCap, FileText, ArrowLeft, Code, Zap, Target,
  TrendingUp, Eye, Download, Send, User
} from 'lucide-react';
import { FreelancerProfile } from '../../components/profile/FreelancerProfile';
import { JobSeekerProfile } from '../../components/profile/JobSeekerProfile';
import { TrainerProfile } from '../../components/profile/TrainerProfile';
import { BAPMProfile } from '../../components/profile/BAPMProfile';
import { ClientProfile } from '../../components/profile/ClientProfile';
import { EmployerProfile } from '../../components/profile/EmployerProfile';
import { ResumeViewer } from '../../components/profile/ResumeViewer';

// Proficiency level colors
const getProficiencyColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'expert':
      return 'bg-green-500';
    case 'advanced':
      return 'bg-blue-500';
    case 'intermediate':
      return 'bg-yellow-500';
    case 'beginner':
      return 'bg-gray-500';
    default:
      return 'bg-gray-400';
  }
};

const getProficiencyLabel = (level) => {
  switch (level?.toLowerCase()) {
    case 'expert':
      return 'Expert';
    case 'advanced':
      return 'Advanced';
    case 'intermediate':
      return 'Intermediate';
    case 'beginner':
      return 'Beginner';
    default:
      return 'Basic';
  }
};

export const PublicProfile = memo(() => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const toast = useToast();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingConversation, setStartingConversation] = useState(false);
  const [showResumeViewer, setShowResumeViewer] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setError('User ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const { profile: profileData } = await profileApi.getById(userId);
        setProfile(profileData);
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError(err.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const handleStartConversation = async () => {
    if (!isAuthenticated) {
      toast.warning('Please sign in to send a message');
      navigate('/sign-in');
      return;
    }

    if (currentUser?.id === userId) {
      toast.warning('Cannot message yourself');
      return;
    }

    setStartingConversation(true);
    try {
      navigate(`/messages?userId=${userId}`);
    } catch (err) {
      toast.error(err.error || 'Failed to start conversation');
    } finally {
      setStartingConversation(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-12">
        <div className="max-w-6xl mx-auto">
          <SkeletonLoader lines={3} className="mb-6" />
          <SkeletonLoader lines={5} />
        </div>
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container className="py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            Profile Not Found
          </h2>
          <p className="text-muted-foreground mb-6">{error || 'The profile you are looking for does not exist.'}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            Go Home
          </Button>
        </div>
      </Container>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const specializedProfile = profile.specialized_profile;
  const userType = profile.user_type;

  return (
    <div className="min-h-screen bg-background pt-20">
      <Container>
        <div className="max-w-6xl mx-auto">
          {/* Back Button - Compact */}
          <div className="mb-4">
            <Link
              to={-1}
              className="inline-flex items-center gap-2 text-foreground font-mono uppercase tracking-wider text-xs hover:text-secondary transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              BACK
            </Link>
          </div>

          {/* Compact Profile Header */}
          <Card className="tech-panel border-border bg-card shadow-lg mb-4">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Avatar - Compact */}
                <div className="flex-shrink-0 flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-display font-bold border-2 border-background shadow-md">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        profile.full_name?.charAt(0)?.toUpperCase() || 'U'
                      )}
                    </div>
                    {profile.is_verified && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-background">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Name and Info - Compact */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl font-display font-bold text-foreground mb-1 truncate">
                        {profile.full_name}
                      </h1>
                      {profile.headline && (
                        <p className="text-sm text-muted-foreground mb-2 font-medium truncate">
                          {profile.headline}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                        {profile.city && profile.country && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {profile.city}, {profile.country}
                          </span>
                        )}
                        {profile.user_type && (
                          <Badge variant="outline" className="font-mono uppercase text-[10px] px-1.5 py-0 h-4">
                            {profile.user_type.replace('_', ' ')}
                          </Badge>
                        )}
                        {profile.is_available && (
                          <Badge variant="success" className="font-mono text-[10px] px-1.5 py-0 h-4 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                            Available
                          </Badge>
                        )}
                      </div>

                      {/* Social Links - Compact */}
                      <div className="flex items-center gap-2">
                        {profile.website_url && (
                          <a
                            href={profile.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors p-1.5 hover:bg-primary/10 rounded"
                            title="Website"
                          >
                            <Globe className="w-4 h-4" />
                          </a>
                        )}
                        {profile.linkedin_url && (
                          <a
                            href={profile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors p-1.5 hover:bg-primary/10 rounded"
                            title="LinkedIn"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                        {profile.public_email && (
                          <a
                            href={`mailto:${profile.public_email}`}
                            className="text-muted-foreground hover:text-primary transition-colors p-1.5 hover:bg-primary/10 rounded"
                            title="Email"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons - Compact */}
                    {!isOwnProfile && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={handleStartConversation}
                          disabled={startingConversation}
                          size="sm"
                          className="font-mono text-xs tracking-wider h-8"
                        >
                          <MessageSquare className="w-3 h-3 mr-1.5" />
                          {startingConversation ? 'Starting...' : 'Message'}
                        </Button>
                        {profile.public_email && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="font-mono text-xs h-8"
                          >
                            <a href={`mailto:${profile.public_email}`}>
                              <Send className="w-3 h-3 mr-1.5" />
                              Email
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content - Compact Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* About Section - Compact */}
              {profile.bio && (
                <Card className="tech-panel border-border bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-display flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-4">
                      {profile.bio}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Experience Section - LinkedIn-style */}
              {profile.experience && profile.experience.length > 0 && (
                <Card className="tech-panel border-border bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-display flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" />
                      Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {profile.experience.map((exp, index) => {
                        const startDate = new Date(exp.start_date);
                        const endDate = exp.end_date ? new Date(exp.end_date) : null;
                        const startMonth = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        const endMonth = endDate ? endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present';
                        const duration = exp.is_current ? `${startMonth} - Present` : `${startMonth} - ${endMonth}`;
                        
                        return (
                          <div key={exp.id} className="relative pl-5 pb-3 border-l-2 border-border last:border-l-0 last:pb-0">
                            <div className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full bg-primary -translate-x-[6px]" />
                            <div>
                              <h4 className="font-display font-semibold text-sm text-foreground mb-0.5">{exp.title}</h4>
                              <div className="flex items-center gap-1.5 mb-1">
                                {exp.company_url ? (
                                  <a
                                    href={exp.company_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1 text-xs"
                                  >
                                    <Building2 className="w-3 h-3" />
                                    <span>{exp.company_name}</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Building2 className="w-3 h-3" />
                                    <span>{exp.company_name}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
                                <span className="flex items-center gap-0.5">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {duration}
                                </span>
                                {exp.location && (
                                  <span className="flex items-center gap-0.5">
                                    <MapPin className="w-2.5 h-2.5" />
                                    {exp.location}
                                  </span>
                                )}
                              </div>
                              {exp.description && (
                                <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{exp.description}</p>
                              )}
                              {exp.technologies_used && exp.technologies_used.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {exp.technologies_used.slice(0, 5).map((tech, idx) => (
                                    <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                      {tech}
                                    </Badge>
                                  ))}
                                  {exp.technologies_used.length > 5 && (
                                    <span className="text-[10px] text-muted-foreground">+{exp.technologies_used.length - 5}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Role-Specific Profile Sections */}
              {userType === 'freelancer' && (
                <FreelancerProfile 
                  profile={profile} 
                  specializedProfile={specializedProfile}
                  onRefresh={() => {}}
                />
              )}
              {userType === 'job_seeker' && (
                <JobSeekerProfile 
                  profile={profile} 
                  specializedProfile={specializedProfile}
                />
              )}
              {userType === 'trainer' && (
                <TrainerProfile 
                  profile={profile} 
                  specializedProfile={specializedProfile}
                />
              )}
              {(userType === 'ba_pm' || userType === 'developer') && (
                <BAPMProfile 
                  profile={profile} 
                  specializedProfile={specializedProfile}
                />
              )}
              {userType === 'client' && (
                <ClientProfile 
                  profile={profile} 
                  specializedProfile={specializedProfile}
                />
              )}
              {userType === 'employer' && (
                <EmployerProfile 
                  profile={profile} 
                  specializedProfile={specializedProfile}
                />
              )}

              {/* Portfolio - Compact (for non-freelancer roles that might have portfolio) */}
              {userType !== 'freelancer' && profile.portfolio && profile.portfolio.length > 0 && (
                <Card className="tech-panel border-border bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-display flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Portfolio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {profile.portfolio.map((item, index) => (
                        <div key={item.id || index} className="p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-display font-semibold text-foreground flex-1">{item.title}</h4>
                            {item.is_featured && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">★</Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.platforms_used && item.platforms_used.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {item.platforms_used.slice(0, 3).map((platform, idx) => (
                                  <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                    {platform}
                                  </Badge>
                                ))}
                                {item.platforms_used.length > 3 && (
                                  <span className="text-[10px] text-muted-foreground">+{item.platforms_used.length - 3}</span>
                                )}
                              </div>
                            )}
                            {item.project_url && (
                              <a
                                href={item.project_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] text-primary hover:underline flex items-center gap-1 font-mono"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reviews */}
              {profile.reviews && profile.reviews.length > 0 && (
                <Card className="tech-panel border-border bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-xl font-display flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary" />
                      Reviews ({profile.reviews.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {profile.reviews.map((review, index) => (
                        <div key={review.id || index} className="border-b border-border pb-4 last:border-0 last:pb-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                                {review.reviewer?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <p className="text-sm font-display font-semibold text-foreground">
                                  {review.reviewer?.full_name || 'Anonymous'}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < Math.floor(review.overall_rating)
                                          ? 'text-yellow-500 fill-yellow-500'
                                          : 'text-muted-foreground'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {review.title && (
                            <h5 className="font-display font-semibold text-foreground mb-2">{review.title}</h5>
                          )}
                          {review.content && (
                            <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Compact */}
            <div className="space-y-4">
              {/* Resume Section */}
              <Card className="tech-panel border-border bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-display flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Resume
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {profile.resume_url ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowResumeViewer(true)}
                        className="flex items-center gap-2 text-primary hover:underline text-sm flex-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>View Resume</span>
                      </button>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = profile.resume_url;
                          link.download = 'resume.pdf';
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="text-primary hover:text-primary/80 p-1"
                        title="Download Resume"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No resume uploaded</p>
                  )}
                </CardContent>
              </Card>

              {/* Skills Section */}
              <Card className="tech-panel border-border bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-display flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {profile.skills && profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.slice(0, 12).map((item, index) => {
                        const skillName = item.skill?.name || 'Unknown';
                        const proficiency = item.proficiency_level || 'intermediate';
                        const proficiencyColors = {
                          expert: 'bg-green-500/20 text-green-500 border-green-500/30',
                          advanced: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
                          intermediate: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
                          beginner: 'bg-gray-500/20 text-gray-500 border-gray-500/30'
                        };
                        
                        return (
                          <div
                            key={item.skill?.id || index}
                            className={`px-2 py-0.5 rounded border text-[10px] ${proficiencyColors[proficiency] || proficiencyColors.intermediate}`}
                          >
                            {skillName}
                          </div>
                        );
                      })}
                      {profile.skills.length > 12 && (
                        <div className="text-[10px] text-muted-foreground px-2 py-0.5">
                          +{profile.skills.length - 12} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No skills added</p>
                  )}
                </CardContent>
              </Card>

              {/* Join Date - Compact */}
              <Card className="tech-panel border-border bg-card/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Joined {new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Container>

      {/* Resume Viewer Modal */}
      {profile?.resume_url && (
        <ResumeViewer
          isOpen={showResumeViewer}
          onClose={() => setShowResumeViewer(false)}
          resumeUrl={profile.resume_url}
          fileName="resume.pdf"
        />
      )}
    </div>
  );
});

PublicProfile.displayName = 'PublicProfile';
