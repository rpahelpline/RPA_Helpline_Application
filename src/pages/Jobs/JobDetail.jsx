import { useState, useEffect, memo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobApi, profileApi, uploadApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { Container } from '../../components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Textarea';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { LoadingSpinner, SkeletonLoader } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/ui/Modal';
import { JobApplicationsManager } from '../../components/applications/JobApplicationsManager';
import {
  ArrowLeft, MapPin, Building2, Clock, DollarSign, Briefcase,
  CheckCircle, Calendar, Users, Mail, MessageSquare, Globe,
  ExternalLink, Loader2, FileText, Upload, X
} from 'lucide-react';

export const JobDetail = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, profile } = useAuthStore();
  const role = profile?.user_type || user?.user_type || null;
  const toast = useToast();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    cover_letter: '',
    expected_salary: '',
    resume_url: ''
  });
  const [userResume, setUserResume] = useState(null);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadedResumeName, setUploadedResumeName] = useState(null);
  const applyResumeInputRef = useRef(null);

  useEffect(() => {
    const loadJob = async () => {
      try {
        setLoading(true);
        setError(null);
        const { job: jobData } = await jobApi.getById(id);
        setJob(jobData);
      } catch (err) {
        console.error('Failed to load job:', err);
        setError(err.error || 'Failed to load job');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadJob();
    }
  }, [id]);

  // Load user's resume URL
  useEffect(() => {
    const loadUserResume = async () => {
      if (!isAuthenticated) return;
      try {
        const { profile } = await profileApi.getMyProfile();
        if (profile?.resume_url) {
          setUserResume(profile.resume_url);
          setApplicationData(prev => ({ ...prev, resume_url: profile.resume_url }));
        }
      } catch (err) {
        console.error('Failed to load user resume:', err);
      }
    };
    loadUserResume();
  }, [isAuthenticated]);

  const handleResumeUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a PDF or Word document (.pdf, .doc, .docx)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    setUploadingResume(true);
    if (applyResumeInputRef.current) applyResumeInputRef.current.value = '';
    try {
      let url;
      try {
        const res = await uploadApi.uploadToSupabase('resumes', file);
        url = res?.file?.url ?? res?.url;
      } catch (supabaseErr) {
        const local = await uploadApi.uploadFile('resume', file);
        const path = local?.file?.url ?? local?.url ?? '';
        const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
        url = path.startsWith('http') ? path : `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
      }
      if (!url) throw new Error('No resume URL returned');
      setApplicationData(prev => ({ ...prev, resume_url: url }));
      setUploadedResumeName(file.name);
      toast.success('Resume uploaded');
    } catch (err) {
      console.error('Resume upload failed:', err);
      toast.error(err?.error || err?.message || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const useProfileResume = () => {
    if (userResume) {
      setApplicationData(prev => ({ ...prev, resume_url: userResume }));
      setUploadedResumeName(null);
    }
  };

  const clearResume = () => {
    setApplicationData(prev => ({ ...prev, resume_url: '' }));
    setUploadedResumeName(null);
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      toast.warning('Please sign in to apply');
      navigate('/sign-in', { state: { returnTo: `/jobs/${id}` } });
      return;
    }

    const applyingRoles = ['job_seeker', 'freelancer', 'ba_pm', 'trainer', 'developer', 'jobseeker'];
    if (!applyingRoles.includes(role)) {
      toast.warning('Only job seekers, freelancers, trainers, developers, and BA/PMs can apply to jobs');
      return;
    }

    if (!showApplyForm) {
      setShowApplyForm(true);
      return;
    }

    // Validate form
    if (!applicationData.cover_letter.trim()) {
      toast.error('Please provide a cover letter');
      return;
    }

    // Store previous state for potential rollback
    const previousJob = { ...job };
    const previousApplicationCount = job.application_count || 0;

    setApplying(true);

    // Optimistic update - show success immediately
    setJob(prev => ({
      ...prev,
      application_count: (prev.application_count || 0) + 1,
      has_applied: true
    }));
    setShowApplyForm(false);
    toast.success('Application submitted successfully!');

    try {
      await jobApi.apply(id, {
        cover_letter: applicationData.cover_letter,
        resume_url: applicationData.resume_url || null,
        expected_salary: applicationData.expected_salary ? parseFloat(applicationData.expected_salary) : null
      });
      // Application successful - optimistic update was correct
    } catch (err) {
      // Rollback on error
      setJob(previousJob);
      setShowApplyForm(true);
      toast.error(err.error || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 md:pt-20">
        <Container className="py-6 md:py-12 px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <SkeletonLoader lines={3} className="mb-4 md:mb-6" />
            <SkeletonLoader lines={5} />
          </div>
        </Container>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen pt-16 md:pt-20">
        <Container className="py-8 md:py-12 px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-3 md:mb-4">
              Job Not Found
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">{error || 'The job you are looking for does not exist.'}</p>
            <Button onClick={() => navigate('/jobs')} variant="outline" className="min-h-[44px]">
              Back to Jobs
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  const formatSalary = () => {
    if (job.salary_min && job.salary_max) {
      return `₹${job.salary_min.toLocaleString()} - ₹${job.salary_max.toLocaleString()}`;
    } else if (job.salary_min) {
      return `₹${job.salary_min.toLocaleString()}+`;
    } else if (job.salary_max) {
      return `Up to ₹${job.salary_max.toLocaleString()}`;
    }
    return 'Not specified';
  };

  const formatJobType = (type) => {
    if (!type) return 'Full-time';
    return type.replace('_', '-').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <Container className="py-6 md:py-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 text-foreground font-mono uppercase tracking-wider text-xs mb-4 hover:text-secondary transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            BACK TO JOBS
          </Link>
          {/* Mobile-first grid: sidebar shows first on mobile (order-first), second on lg */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <Card className="tech-panel border-border bg-card/50">
                <CardHeader className="px-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 md:gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <CardTitle className="text-xl sm:text-2xl font-display">{job.title}</CardTitle>
                        {(job.status === 'open' || job.status === 'active') && (
                          <Badge variant="success" className="font-mono text-xs">
                            OPEN
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {job.company_name || job.employer?.company_name || 'Company'}
                        </span>
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                        )}
                        {job.is_remote && (
                          <Badge variant="outline" className="font-mono text-xs">
                            REMOTE
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="flex flex-wrap gap-3 md:gap-4 text-xs sm:text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-secondary" />
                      <span className="text-muted-foreground">Type:</span>
                      <span className="text-foreground font-display">{formatJobType(job.job_type)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-secondary" />
                      <span className="text-muted-foreground">Salary:</span>
                      <span className="text-foreground font-display">{formatSalary()}</span>
                    </div>
                    {job.application_count !== undefined && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-secondary" />
                        <span className="text-muted-foreground">Applicants:</span>
                        <span className="text-foreground font-display">{job.application_count}</span>
                      </div>
                    )}
                    {job.created_at && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-secondary" />
                        <span className="text-muted-foreground">Posted:</span>
                        <span className="text-foreground">
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="mb-4 md:mb-6">
                    <h2 className="text-sm md:text-base font-black text-foreground mb-2 font-display uppercase">
                      DESCRIPTION
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {job.description}
                    </p>
                  </div>

                  {/* Technologies */}
                  {job.technologies && job.technologies.length > 0 && (
                    <div className="mb-4 md:mb-6">
                      <h2 className="text-sm md:text-base font-black text-foreground mb-2 font-display uppercase">
                        TECHNOLOGIES
                      </h2>
                      <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {job.technologies.map((tech, index) => (
                          <Badge key={index} variant="outline" className="font-mono text-[10px] md:text-xs px-2 py-1">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requirements */}
                  {job.requirements && (
                    <div className="mb-4 md:mb-6">
                      <h2 className="text-sm md:text-base font-black text-foreground mb-2 font-display uppercase">
                        REQUIREMENTS
                      </h2>
                      <div className="text-sm md:text-base text-muted-foreground whitespace-pre-wrap">
                        {typeof job.requirements === 'string'
                          ? job.requirements
                          : Array.isArray(job.requirements)
                            ? job.requirements.map((req, i) => <div key={i} className="mb-1">• {req}</div>)
                            : JSON.stringify(job.requirements)
                        }
                      </div>
                    </div>
                  )}

                  {/* About the company */}
                  {(job.company_description || job.company_website) && (
                    <div className="mb-4 md:mb-6">
                      <h2 className="text-sm md:text-base font-black text-foreground mb-2 font-display uppercase">
                        ABOUT THE COMPANY
                      </h2>
                      {job.company_description && (
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap mb-2">
                          {job.company_description}
                        </p>
                      )}
                      {job.company_website && (
                        <a
                          href={job.company_website.startsWith('http') ? job.company_website : `https://${job.company_website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Globe className="w-4 h-4" />
                          Visit company website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Benefits */}
                  {job.benefits && (
                    <div>
                      <h2 className="text-sm md:text-base font-black text-foreground mb-2 font-display uppercase">
                        BENEFITS
                      </h2>
                      <div className="text-sm md:text-base text-muted-foreground">
                        {typeof job.benefits === 'string'
                          ? job.benefits
                          : Array.isArray(job.benefits)
                            ? (
                              <ul className="list-disc list-inside space-y-1">
                                {job.benefits.map((benefit, i) => (
                                  <li key={i}>{benefit}</li>
                                ))}
                              </ul>
                            )
                            : JSON.stringify(job.benefits)
                        }
                      </div>
                    </div>
                  )}

                  {/* Application Deadline */}
                  {job.application_deadline && (
                    <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-xs md:text-sm">
                        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-secondary flex-shrink-0" />
                        <span className="text-muted-foreground">Application Deadline:</span>
                        <span className="text-foreground font-display">
                          {new Date(job.application_deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Apply Form */}
              {showApplyForm && (
                <Card className="tech-panel border-border bg-card/50">
                  <CardHeader className="px-4 sm:px-6 py-4">
                    <CardTitle className="text-base md:text-lg font-display">APPLY FOR THIS JOB</CardTitle>
                    <CardDescription className="text-xs md:text-sm">Fill out the form below to submit your application</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 space-y-3 md:space-y-4">
                    <div>
                      <Label className="text-xs md:text-sm">COVER LETTER *</Label>
                      <Textarea
                        value={applicationData.cover_letter}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, cover_letter: e.target.value }))}
                        placeholder="Tell us why you're a great fit for this position..."
                        rows={5}
                        className="bg-background border-input text-foreground placeholder-muted-foreground font-mono text-sm mt-1.5"
                      />
                    </div>

                    <div>
                      <Label className="text-xs md:text-sm">EXPECTED SALARY (Optional)</Label>
                      <Input
                        type="number"
                        value={applicationData.expected_salary}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, expected_salary: e.target.value }))}
                        placeholder="e.g., 500000"
                        className="bg-background border-input text-foreground placeholder-muted-foreground font-mono text-sm mt-1.5"
                      />
                    </div>

                    <div>
                      <Label className="text-xs md:text-sm mb-1.5 block">RESUME (Optional)</Label>
                      <div className="space-y-2">
                        <input
                          ref={applyResumeInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleResumeUpload}
                          className="hidden"
                        />
                        {applicationData.resume_url ? (
                          <div className="p-2.5 md:p-3 rounded-lg bg-muted/50 flex flex-wrap items-center gap-2">
                            <FileText className="w-4 h-4 text-secondary flex-shrink-0" />
                            <span className="text-foreground truncate text-sm">
                              {uploadedResumeName ? `Uploaded: ${uploadedResumeName}` : 'Using profile resume'}
                            </span>
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <a
                              href={applicationData.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline ml-auto"
                            >
                              View
                            </a>
                            <div className="flex gap-1 w-full sm:w-auto flex-wrap">
                              {userResume && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="font-mono text-xs"
                                  onClick={useProfileResume}
                                >
                                  Use profile
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="font-mono text-xs"
                                disabled={uploadingResume}
                                onClick={() => applyResumeInputRef.current?.click()}
                              >
                                {uploadingResume ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
                                {uploadingResume ? 'Uploading...' : 'Upload different'}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="font-mono text-xs text-red-500 hover:text-red-600"
                                onClick={clearResume}
                              >
                                <X className="w-3.5 h-3.5 mr-1" />
                                Clear
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {userResume && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="font-mono text-xs"
                                onClick={useProfileResume}
                              >
                                <FileText className="w-3.5 h-3.5 mr-1" />
                                Use profile resume
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="font-mono text-xs"
                              disabled={uploadingResume}
                              onClick={() => applyResumeInputRef.current?.click()}
                            >
                              {uploadingResume ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5 mr-1" />
                              )}
                              {uploadingResume ? 'Uploading...' : 'Upload resume'}
                            </Button>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">PDF or Word, max 5MB. You can use your profile resume or upload one for this application.</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={handleApply}
                        disabled={applying}
                        className="flex-1 font-mono text-xs tracking-wider min-h-[44px]"
                      >
                        {applying ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            SUBMITTING...
                          </>
                        ) : (
                          'SUBMIT APPLICATION'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowApplyForm(false)}
                        className="font-mono text-xs min-h-[44px] sm:w-auto"
                      >
                        CANCEL
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Shows first on mobile via order */}
            <div className="space-y-4 md:space-y-6 order-first lg:order-last">
              {/* Apply Card - Sticky on desktop */}
              {(job.status === 'open' || job.status === 'active') && (
                <Card className="tech-panel border-glow-red lg:sticky lg:top-20">
                  <CardContent className="p-4 md:p-6">
                    <div className="text-center mb-3 md:mb-4">
                      <p className="text-xl md:text-2xl font-display font-bold text-secondary mb-1 md:mb-2">
                        {formatSalary()}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground font-mono">
                        {formatJobType(job.job_type)}
                      </p>
                    </div>

                    {/* Show Manage Applications if user is the job poster */}
                    {isAuthenticated && user && job.employer_id === user.id && (
                      <Button
                        onClick={() => setShowApplicationsModal(true)}
                        className="w-full font-mono text-xs tracking-wider glow-red min-h-[44px]"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        MANAGE APPLICATIONS
                      </Button>
                    )}

                    {/* Show Apply button only for applying roles */}
                    {!showApplyForm && isAuthenticated && user && job.employer_id !== user.id &&
                      ['job_seeker', 'freelancer', 'ba_pm', 'trainer', 'developer', 'jobseeker'].includes(role) && (
                        <Button
                          onClick={handleApply}
                          className="w-full font-mono text-xs tracking-wider glow-red min-h-[44px]"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          APPLY NOW
                        </Button>
                      )}

                    {/* Show sign in prompt for non-authenticated users */}
                    {!isAuthenticated && (
                      <>
                        <Button
                          onClick={() => navigate('/sign-in', { state: { returnTo: `/jobs/${id}` } })}
                          className="w-full font-mono text-xs tracking-wider glow-red min-h-[44px]"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          SIGN IN TO APPLY
                        </Button>
                        <p className="text-muted-foreground text-[10px] md:text-xs mt-2 text-center font-mono">
                          Sign in to apply for this position
                        </p>
                      </>
                    )}

                    {/* Show message for roles that can't apply */}
                    {isAuthenticated && user && job.employer_id !== user.id &&
                      !['job_seeker', 'freelancer', 'ba_pm', 'trainer', 'developer', 'jobseeker'].includes(role) && (
                        <p className="text-muted-foreground text-[10px] md:text-xs text-center font-mono">
                          Only job seekers, freelancers, trainers, developers, and BA/PMs can apply to jobs
                        </p>
                      )}
                  </CardContent>
                </Card>
              )}

              {/* Company Info */}
              {(job.company_name || job.employer?.company_name || job.employer) && (
                <Card className="tech-panel border-border bg-card/50">
                  <CardHeader className="px-4 sm:px-6 py-3 md:py-4">
                    <CardTitle className="text-sm md:text-base font-display">COMPANY</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 space-y-3">
                    <div className="flex items-center gap-2.5 md:gap-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-bold text-foreground text-sm md:text-base truncate">
                          {job.company_name || job.employer?.company_name || 'Company'}
                        </p>
                        {job.employer?.full_name && (
                          <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                            {job.employer.full_name}
                          </p>
                        )}
                      </div>
                    </div>
                    {job.company_website && (
                      <a
                        href={job.company_website.startsWith('http') ? job.company_website : `https://${job.company_website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        Company website
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {job.employer?.id && (
                      <Link
                        to={`/profile/${job.employer.id}`}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        View Company Profile <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Job Details */}
              <Card className="tech-panel border-border bg-card/50">
                <CardHeader className="px-4 sm:px-6 py-3 md:py-4">
                  <CardTitle className="text-sm md:text-base font-display">JOB DETAILS</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 space-y-2.5 md:space-y-3">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground mb-1">STATUS</p>
                    <Badge variant={(job.status === 'open' || job.status === 'active') ? 'success' : 'default'} className="text-xs">
                      {job.status?.toUpperCase() || 'ACTIVE'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground mb-1">LOCATION</p>
                    <p className="text-foreground font-display text-sm">
                      {job.is_remote ? 'Remote' : job.location || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground mb-1">JOB TYPE</p>
                    <p className="text-foreground font-display text-sm">{formatJobType(job.job_type)}</p>
                  </div>
                  {job.created_at && (
                    <div>
                      <p className="text-xs font-mono text-muted-foreground mb-1">POSTED</p>
                      <p className="text-foreground font-display text-sm">
                        {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Applications Management Modal */}
        <Modal
          isOpen={showApplicationsModal}
          onClose={() => setShowApplicationsModal(false)}
          size="xl"
          title="Manage Applications"
        >
          <JobApplicationsManager
            jobId={id}
            onClose={() => setShowApplicationsModal(false)}
          />
        </Modal>
      </Container>
    </div>
  );
});

JobDetail.displayName = 'JobDetail';

