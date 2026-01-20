import { useState, useEffect, memo, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { profileApi, uploadApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { Container } from '../../components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ProfileNameEditModal, BioEditModal, SocialLinksEditModal, ExperienceEditModal, PhoneEditModal } from '../../components/profile/ProfileEditModals';
import { ExperienceItemModal } from '../../components/profile/ExperienceItemModal';
import { SkillsEditModal } from '../../components/profile/SkillsEditModal';
import { PlatformsEditModal } from '../../components/profile/PlatformsEditModal';
import { ResumeUploadModal } from '../../components/profile/ResumeUploadModal';
import { ResumeViewer } from '../../components/profile/ResumeViewer';
import { LocationEditModal } from '../../components/profile/LocationEditModal';
import { FreelancerProfile } from '../../components/profile/FreelancerProfile';
import { JobSeekerProfile } from '../../components/profile/JobSeekerProfile';
import { TrainerProfile } from '../../components/profile/TrainerProfile';
import { BAPMProfile } from '../../components/profile/BAPMProfile';
import { ClientProfile } from '../../components/profile/ClientProfile';
import { EmployerProfile } from '../../components/profile/EmployerProfile';
import {
  MapPin, Globe, Linkedin, Mail, MessageSquare, Award, Briefcase,
  Star, Calendar, ExternalLink, CheckCircle, Building2, Clock,
  Users, GraduationCap, FileText, Edit, Save, X, Upload, Code, Zap,
  Target, Eye, Plus, Trash2, User, Download, ExternalLink as ExternalLinkIcon, Phone
} from 'lucide-react';

// Proficiency level colors
const getProficiencyColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'expert': return 'bg-green-500';
    case 'advanced': return 'bg-blue-500';
    case 'intermediate': return 'bg-yellow-500';
    case 'beginner': return 'bg-gray-500';
    default: return 'bg-gray-400';
  }
};

const getProficiencyLabel = (level) => {
  switch (level?.toLowerCase()) {
    case 'expert': return 'Expert';
    case 'advanced': return 'Advanced';
    case 'intermediate': return 'Intermediate';
    case 'beginner': return 'Beginner';
    default: return 'Basic';
  }
};

export const ProfileDashboard = memo(() => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const toast = useToast();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showExperienceItemModal, setShowExperienceItemModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showPlatformsModal, setShowPlatformsModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showResumeViewer, setShowResumeViewer] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [currentExperience, setCurrentExperience] = useState(null);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { profile: profileData } = await profileApi.getMyProfile();
      setProfile(profileData);
    } catch (err) {
      console.error('Failed to load profile:', err);
      // Don't show error toast for rate limiting - it's temporary
      if (err.status === 429) {
        console.warn('Rate limited - profile will load automatically once limit resets');
      } else {
        toast.error(err.error || 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadProfile();
  };

  const handleRequestVerification = async () => {
    if (requestingVerification) return;
    
    setRequestingVerification(true);
    try {
      const response = await profileApi.requestVerification();
      toast.success(response.message || 'Verification request submitted successfully');
    } catch (err) {
      console.error('Verification request error:', err);
      toast.error(err.error || 'Failed to request verification');
    } finally {
      setRequestingVerification(false);
    }
  };

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingCover(true);
    try {
      const response = await uploadApi.uploadToSupabase('avatars', file);
      const imageUrl = response.file?.url || response.url;
      
      if (!imageUrl) {
        throw new Error('No URL returned from upload');
      }

      await profileApi.updateProfile({ cover_image_url: imageUrl });
      toast.success('Cover image updated successfully');
      await loadProfile();
    } catch (err) {
      console.error('Cover upload error:', err);
      toast.error(err.error || err.message || 'Failed to upload cover image');
    } finally {
      setUploadingCover(false);
      // Reset input
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const response = await uploadApi.uploadToSupabase('avatars', file);
      const imageUrl = response.file?.url || response.url;
      
      if (!imageUrl) {
        throw new Error('No URL returned from upload');
      }

      await profileApi.updateProfile({ avatar_url: imageUrl });
      toast.success('Avatar updated successfully');
      await loadProfile();
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error(err.error || err.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      // Reset input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profile) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load profile</p>
          <Button onClick={loadProfile} className="mt-4">Retry</Button>
        </div>
      </Container>
    );
  }

  const specializedProfile = profile.specialized_profile;
  const userType = profile.user_type;

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Section */}
      <div className="relative">
        {profile.cover_image_url ? (
          <div className="h-64 md:h-80 w-full overflow-hidden relative group">
            <img
              src={profile.cover_image_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverImageUpload}
                disabled={uploadingCover}
                className="hidden"
              />
              <div className="flex items-center gap-2 text-white">
                {uploadingCover ? (
                  <>
                    <LoadingSpinner className="w-5 h-5" />
                    <span className="text-sm font-mono">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span className="text-sm font-mono">Change Cover</span>
                  </>
                )}
              </div>
            </label>
          </div>
        ) : (
          <div className="h-64 md:h-80 w-full bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent relative group">
            <label className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverImageUpload}
                disabled={uploadingCover}
                className="hidden"
              />
              <div className="flex items-center gap-2 text-muted-foreground">
                {uploadingCover ? (
                  <>
                    <LoadingSpinner className="w-5 h-5" />
                    <span className="text-sm font-mono">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span className="text-sm font-mono">Upload Cover Image</span>
                  </>
                )}
              </div>
            </label>
          </div>
        )}
        
        {/* Profile Header Card - Overlapping */}
        <Container className="relative -mt-20 md:-mt-24">
          <div className="max-w-6xl mx-auto">
            <Card className="tech-panel border-border bg-card shadow-xl">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0 -mt-16 md:-mt-20">
                    <div className="relative group">
                      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl md:text-5xl font-display font-bold border-4 border-background shadow-lg">
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
                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-2 border-background">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      )}
                      {!profile.is_verified && (
                        <button
                          onClick={handleRequestVerification}
                          disabled={requestingVerification}
                          className="absolute -bottom-1 -right-1 bg-yellow-500 hover:bg-yellow-600 rounded-full p-1.5 border-2 border-background cursor-pointer transition-colors group"
                          title="Request Verification"
                        >
                          <CheckCircle className="w-5 h-5 text-white" />
                        </button>
                      )}
                      <label className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                          className="hidden"
                        />
                        {uploadingAvatar ? (
                          <LoadingSpinner className="w-6 h-6 text-white" />
                        ) : (
                          <Upload className="w-6 h-6 text-white" />
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Name and Info */}
                  <div className="flex-1 pt-4 md:pt-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                            {profile.full_name}
                          </h1>
                          {profile.is_verified && (
                            <Badge variant="default" className="bg-green-500 text-white flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </Badge>
                          )}
                          {!profile.is_verified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRequestVerification}
                              disabled={requestingVerification}
                              className="h-7 text-xs"
                            >
                              {requestingVerification ? 'Requesting...' : 'Request Verification'}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowNameModal(true)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                        {profile.headline ? (
                          <p className="text-lg md:text-xl text-muted-foreground mb-3 font-medium">
                            {profile.headline}
                          </p>
                        ) : (
                          <button
                            onClick={() => setShowNameModal(true)}
                            className="text-lg md:text-xl text-muted-foreground/50 hover:text-muted-foreground mb-3 font-medium flex items-center gap-2"
                          >
                            Add headline <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                          {profile.city && profile.country ? (
                            <button
                              onClick={() => setShowLocationModal(true)}
                              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                            >
                              <MapPin className="w-4 h-4" />
                              {profile.city}, {profile.country}
                              <Edit className="w-3 h-3 opacity-50" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowLocationModal(true)}
                              className="flex items-center gap-1.5 text-muted-foreground/50 hover:text-muted-foreground"
                            >
                              <MapPin className="w-4 h-4" />
                              Add location
                            </button>
                          )}
                          {profile.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-4 h-4" />
                              <a 
                                href={`mailto:${profile.email}`}
                                className="hover:text-foreground transition-colors"
                              >
                                {profile.email}
                              </a>
                            </div>
                          )}
                          {profile.phone ? (
                            <div className="group flex items-center gap-1.5">
                              <Phone className="w-4 h-4" />
                              <a 
                                href={`tel:${profile.phone}`}
                                className="hover:text-foreground transition-colors"
                              >
                                {profile.phone}
                              </a>
                              <button
                                onClick={() => setShowPhoneModal(true)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-muted-foreground hover:text-foreground"
                                title="Edit Phone Number"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowPhoneModal(true)}
                              className="flex items-center gap-1.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                              title="Add Phone Number"
                            >
                              <Phone className="w-4 h-4" />
                              Add phone number
                            </button>
                          )}
                          {profile.user_type && (
                            <Badge variant="outline" className="font-mono uppercase text-xs">
                              {profile.user_type.replace('_', ' ')}
                            </Badge>
                          )}
                          {profile.is_available && (
                            <Badge variant="success" className="font-mono text-xs flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                              Available
                            </Badge>
                          )}
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center gap-2">
                          {profile.website_url ? (
                            <div className="group relative">
                              <a
                                href={profile.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-primary/10 rounded-lg"
                                title={profile.website_url}
                              >
                                <Globe className="w-5 h-5" />
                              </a>
                              <button
                                onClick={() => setShowSocialModal(true)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                title="Edit Website"
                              >
                                <Edit className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowSocialModal(true)}
                              className="text-muted-foreground/50 hover:text-primary transition-colors p-2 hover:bg-primary/10 rounded-lg"
                              title="Add Website"
                            >
                              <Globe className="w-5 h-5" />
                            </button>
                          )}
                          {profile.linkedin_url ? (
                            <div className="group relative">
                              <a
                                href={profile.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-primary/10 rounded-lg"
                                title={profile.linkedin_url}
                              >
                                <Linkedin className="w-5 h-5" />
                              </a>
                              <button
                                onClick={() => setShowSocialModal(true)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                title="Edit LinkedIn"
                              >
                                <Edit className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowSocialModal(true)}
                              className="text-muted-foreground/50 hover:text-primary transition-colors p-2 hover:bg-primary/10 rounded-lg"
                              title="Add LinkedIn"
                            >
                              <Linkedin className="w-5 h-5" />
                            </button>
                          )}
                          {profile.public_email ? (
                            <div className="group relative">
                              <a
                                href={`mailto:${profile.public_email}`}
                                className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-primary/10 rounded-lg"
                                title={profile.public_email}
                              >
                                <Mail className="w-5 h-5" />
                              </a>
                              <button
                                onClick={() => setShowSocialModal(true)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                title="Edit Email"
                              >
                                <Edit className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowSocialModal(true)}
                              className="text-muted-foreground/50 hover:text-primary transition-colors p-2 hover:bg-primary/10 rounded-lg"
                              title="Add Email"
                            >
                              <Mail className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              <Card className="tech-panel border-border bg-card/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-display flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      About
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBioModal(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {profile.bio ? (
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {profile.bio}
                    </p>
                  ) : (
                    <button
                      onClick={() => setShowBioModal(true)}
                      className="text-muted-foreground/50 hover:text-muted-foreground w-full text-left py-4 border-2 border-dashed border-border rounded-lg flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add bio
                    </button>
                  )}
                </CardContent>
              </Card>

              {/* Experience Section - LinkedIn-style */}
              <Card className="tech-panel border-border bg-card/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-display flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-primary" />
                      Experience
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCurrentExperience(null);
                        setShowExperienceItemModal(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {profile.experience && profile.experience.length > 0 ? (
                    <div className="space-y-4">
                      {profile.experience.map((exp, index) => {
                        const startDate = new Date(exp.start_date);
                        const endDate = exp.end_date ? new Date(exp.end_date) : null;
                        const startMonth = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        const endMonth = endDate ? endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present';
                        const duration = exp.is_current ? `${startMonth} - Present` : `${startMonth} - ${endMonth}`;
                        
                        return (
                          <div key={exp.id} className="relative pl-6 pb-4 border-l-2 border-border last:border-l-0 last:pb-0">
                            <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-primary -translate-x-[7px]" />
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-display font-semibold text-foreground mb-1">{exp.title}</h4>
                                <div className="flex items-center gap-2 mb-1">
                                  {exp.company_url ? (
                                    <a
                                      href={exp.company_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline flex items-center gap-1"
                                    >
                                      <Building2 className="w-4 h-4" />
                                      <span className="font-medium">{exp.company_name}</span>
                                      <ExternalLinkIcon className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Building2 className="w-4 h-4" />
                                      <span>{exp.company_name}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {duration}
                                  </span>
                                  {exp.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {exp.location}
                                    </span>
                                  )}
                                </div>
                                {exp.description && (
                                  <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">{exp.description}</p>
                                )}
                                {exp.achievements && exp.achievements.length > 0 && (
                                  <ul className="text-sm text-muted-foreground space-y-1 mb-2">
                                    {exp.achievements.map((achievement, idx) => (
                                      <li key={idx} className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>{achievement}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                {exp.technologies_used && exp.technologies_used.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {exp.technologies_used.map((tech, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {tech}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentExperience(exp);
                                    setShowExperienceItemModal(true);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    if (window.confirm('Are you sure you want to delete this experience?')) {
                                      try {
                                        await profileApi.removeExperience(exp.id);
                                        toast.success('Experience removed successfully');
                                        handleRefresh();
                                      } catch (error) {
                                        toast.error(error.error || 'Failed to remove experience');
                                      }
                                    }
                                  }}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-sm text-muted-foreground mb-4">No work experience added yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentExperience(null);
                          setShowExperienceItemModal(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Experience
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Role-Specific Profile Sections */}
              {userType === 'freelancer' && (
                <FreelancerProfile 
                  profile={profile} 
                  specializedProfile={specializedProfile}
                  onRefresh={loadProfile}
                  onEditSkills={() => setShowSkillsModal(true)}
                  onEditPlatforms={() => setShowPlatformsModal(true)}
                />
              )}
              {userType === 'job_seeker' && (
                <JobSeekerProfile 
                  profile={profile} 
                  specializedProfile={specializedProfile}
                  onRefresh={loadProfile}
                  onEditSkills={() => setShowSkillsModal(true)}
                />
              )}
              {userType === 'trainer' && (
                <TrainerProfile 
                  profile={profile} 
                  specializedProfile={specializedProfile}
                  onRefresh={loadProfile}
                />
              )}
              {(userType === 'ba_pm' || userType === 'developer') && (
                <BAPMProfile 
                  profile={profile} 
                  specializedProfile={specializedProfile}
                  onRefresh={loadProfile}
                  onEditSkills={() => setShowSkillsModal(true)}
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
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Resume Section */}
              <Card className="tech-panel border-border bg-card/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Resume
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowResumeModal(true)}
                      className="h-7 px-2"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {profile.resume_url ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowResumeViewer(true)}
                        className="flex items-center gap-2 text-primary hover:underline flex-1"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">View Resume</span>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = profile.resume_url;
                          link.download = 'resume.pdf';
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="h-7 px-2"
                        title="Download Resume"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-muted-foreground mb-2">No resume uploaded</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowResumeModal(true)}
                      >
                        <Upload className="w-3 h-3 mr-2" />
                        Upload Resume
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Skills Section */}
              <Card className="tech-panel border-border bg-card/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Skills
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSkillsModal(true)}
                      className="h-7 px-2"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {profile.skills && profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.slice(0, 10).map((item, index) => {
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
                            className={`px-2 py-1 rounded border text-xs ${proficiencyColors[proficiency] || proficiencyColors.intermediate}`}
                          >
                            {skillName}
                          </div>
                        );
                      })}
                      {profile.skills.length > 10 && (
                        <div className="text-xs text-muted-foreground px-2 py-1">
                          +{profile.skills.length - 10} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-muted-foreground mb-2">No skills added</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSkillsModal(true)}
                      >
                        <Plus className="w-3 h-3 mr-2" />
                        Add Skills
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card className="tech-panel border-border bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.profile_views !== undefined && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Profile Views</span>
                      </div>
                      <span className="text-foreground font-display font-semibold">{profile.profile_views}</span>
                    </div>
                  )}
                  {specializedProfile?.completed_projects !== undefined && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Projects</span>
                      </div>
                      <span className="text-foreground font-display font-semibold">
                        {specializedProfile.completed_projects}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Join Date */}
              <Card className="tech-panel border-border bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Joined {new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="tech-panel border-border bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate(`/profile/${currentUser?.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Public Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Container>

      {/* Edit Modals */}
      <SkillsEditModal
        isOpen={showSkillsModal}
        onClose={() => setShowSkillsModal(false)}
        profile={profile}
        onSave={loadProfile}
      />
      <PlatformsEditModal
        isOpen={showPlatformsModal}
        onClose={() => setShowPlatformsModal(false)}
        profile={profile}
        onSave={loadProfile}
      />
      <ResumeUploadModal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        profile={profile}
        onSave={loadProfile}
      />
      <ResumeViewer
        isOpen={showResumeViewer}
        onClose={() => setShowResumeViewer(false)}
        resumeUrl={profile?.resume_url}
        fileName="resume.pdf"
      />
      <LocationEditModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        profile={profile}
        onSave={loadProfile}
      />
      <ProfileNameEditModal
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        profile={profile}
        onSave={handleRefresh}
      />
      <BioEditModal
        isOpen={showBioModal}
        onClose={() => setShowBioModal(false)}
        bio={profile?.bio}
        onSave={handleRefresh}
      />
      <SocialLinksEditModal
        isOpen={showSocialModal}
        onClose={() => setShowSocialModal(false)}
        profile={profile}
        onSave={handleRefresh}
      />
      <PhoneEditModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        profile={profile}
        onSave={handleRefresh}
      />
      {profile && (
        <>
          <ExperienceEditModal
            isOpen={showExperienceModal}
            onClose={() => setShowExperienceModal(false)}
            profile={profile}
            specializedProfile={specializedProfile}
            onSave={handleRefresh}
          />
          <ExperienceItemModal
            isOpen={showExperienceItemModal}
            onClose={() => {
              setShowExperienceItemModal(false);
              setCurrentExperience(null);
            }}
            experience={currentExperience}
            onSave={handleRefresh}
          />
        </>
      )}
    </div>
  );
});

ProfileDashboard.displayName = 'ProfileDashboard';

