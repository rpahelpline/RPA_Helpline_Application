import { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { projectApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import {
  Users, Filter, CheckCircle, XCircle, Eye, Clock, 
  Calendar, DollarSign, FileText, User, ArrowRight,
  MessageSquare, ExternalLink, Timer
} from 'lucide-react';

export const ProjectApplicationsManager = memo(({ projectId, onClose }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadApplications();
  }, [projectId]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await projectApi.getApplications(projectId);
      const apps = response.applications || [];
      // Debug: Log the structure to see what we're getting
      if (apps.length > 0) {
        console.log('Application data structure:', apps[0]);
      }
      setApplications(apps);
    } catch (err) {
      console.error('Failed to load applications:', err);
      toast.error(err.error || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    setUpdating(applicationId);
    try {
      await projectApi.updateApplicationStatus(projectId, applicationId, { status: newStatus });
      toast.success(`Application ${newStatus} successfully`);
      await loadApplications();
    } catch (err) {
      console.error('Failed to update application:', err);
      toast.error(err.error || 'Failed to update application status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { color: 'bg-yellow-500/20 text-yellow-500', icon: Clock, label: 'PENDING' };
      case 'viewed':
        return { color: 'bg-blue-500/20 text-blue-500', icon: Eye, label: 'VIEWED' };
      case 'reviewed':
        return { color: 'bg-blue-500/20 text-blue-500', icon: Eye, label: 'REVIEWED' };
      case 'shortlisted':
        return { color: 'bg-purple-500/20 text-purple-500', icon: CheckCircle, label: 'SHORTLISTED' };
      case 'interview':
        return { color: 'bg-indigo-500/20 text-indigo-500', icon: Eye, label: 'INTERVIEW' };
      case 'accepted':
        return { color: 'bg-green-500/20 text-green-500', icon: CheckCircle, label: 'ACCEPTED' };
      case 'rejected':
        return { color: 'bg-red-500/20 text-red-500', icon: XCircle, label: 'REJECTED' };
      default:
        return { color: 'bg-muted text-muted-foreground', icon: Clock, label: status?.toUpperCase() || 'UNKNOWN' };
    }
  };

  const filteredApplications = statusFilter === 'all' 
    ? applications 
    : applications.filter(app => app.status?.toLowerCase() === statusFilter.toLowerCase());

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(app => app.status?.toLowerCase() === 'pending').length,
    reviewed: applications.filter(app => app.status?.toLowerCase() === 'reviewed').length,
    shortlisted: applications.filter(app => app.status?.toLowerCase() === 'shortlisted').length,
    accepted: applications.filter(app => app.status?.toLowerCase() === 'accepted').length,
    rejected: applications.filter(app => app.status?.toLowerCase() === 'rejected').length,
  };

  const statusOptions = [
    { value: 'all', label: 'All', count: statusCounts.all },
    { value: 'pending', label: 'Pending', count: statusCounts.pending },
    { value: 'reviewed', label: 'Reviewed', count: statusCounts.reviewed },
    { value: 'shortlisted', label: 'Shortlisted', count: statusCounts.shortlisted },
    { value: 'accepted', label: 'Accepted', count: statusCounts.accepted },
    { value: 'rejected', label: 'Rejected', count: statusCounts.rejected },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-display font-bold text-foreground tracking-wider">
            PROJECT APPLICATIONS
          </h2>
          <Badge variant="outline" className="font-mono text-xs">
            {applications.length} Total
          </Badge>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="font-mono text-xs">
            Close
          </Button>
        )}
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors ${
              statusFilter === option.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {option.label} ({option.count})
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const statusConfig = getStatusConfig(application.status);
            const StatusIcon = statusConfig.icon;
            // Backend returns 'freelancer' not 'applicant'
            const applicant = application.freelancer || application.applicant;

            return (
              <Card key={application.id} className="tech-panel border-border bg-card/50 hover-lift">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Applicant Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {applicant?.avatar_url ? (
                          <img 
                            src={applicant.avatar_url} 
                            alt={applicant.full_name || 'Applicant'}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-display font-bold text-lg">
                            {(applicant?.full_name?.charAt(0) || applicant?.display_name?.charAt(0) || 'A').toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display font-bold text-foreground">
                              {applicant?.full_name || applicant?.display_name || 'Applicant'}
                            </h3>
                            <Badge className={`${statusConfig.color} font-mono text-xs`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          {applicant?.headline && (
                            <p className="text-sm text-muted-foreground">{applicant.headline}</p>
                          )}
                        </div>
                      </div>

                      {/* Application Details */}
                      {application.cover_letter && (
                        <div className="mb-3">
                          <p className="text-xs font-mono text-muted-foreground mb-1">COVER LETTER</p>
                          <p className="text-sm text-foreground line-clamp-3">{application.cover_letter}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {application.proposed_rate && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Rate: ₹{typeof application.proposed_rate === 'number' ? application.proposed_rate.toLocaleString() : application.proposed_rate}/hr
                          </span>
                        )}
                        {(application.proposed_duration || application.estimated_duration) && (
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            Duration: {application.proposed_duration || application.estimated_duration}
                          </span>
                        )}
                        {application.created_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Applied: {new Date(application.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        {applicant?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/profile/${applicant.id}`)}
                            className="font-mono text-xs"
                          >
                            <User className="w-3 h-3 mr-1" />
                            PROFILE
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/projects/${projectId}`)}
                          className="font-mono text-xs"
                        >
                          <ArrowRight className="w-3 h-3 mr-1" />
                          PROJECT
                        </Button>
                      </div>

                      {/* Status Update Buttons */}
                      {application.status?.toLowerCase() !== 'accepted' && 
                       application.status?.toLowerCase() !== 'rejected' && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {application.status?.toLowerCase() === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(application.id, 'viewed')}
                                disabled={updating === application.id}
                                className="font-mono text-xs bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30"
                              >
                                {updating === application.id ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <>
                                    <Eye className="w-3 h-3 mr-1" />
                                    REVIEW
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(application.id, 'shortlisted')}
                                disabled={updating === application.id}
                                className="font-mono text-xs bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30"
                              >
                                {updating === application.id ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    SHORTLIST
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                          {(application.status?.toLowerCase() === 'viewed' || 
                            application.status?.toLowerCase() === 'shortlisted') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(application.id, 'accepted')}
                              disabled={updating === application.id}
                              className="font-mono text-xs bg-green-500/10 hover:bg-green-500/20 border-green-500/30"
                            >
                              {updating === application.id ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  ACCEPT
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(application.id, 'rejected')}
                            disabled={updating === application.id}
                            className="font-mono text-xs bg-red-500/10 hover:bg-red-500/20 border-red-500/30"
                          >
                            {updating === application.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                REJECT
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="tech-panel border-border">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold text-foreground mb-2">
              {statusFilter === 'all' ? 'No Applications Yet' : `No ${statusFilter} Applications`}
            </h3>
            <p className="text-muted-foreground">
              {statusFilter === 'all' 
                ? 'Applications will appear here when freelancers apply to this project'
                : `No applications with status "${statusFilter}" found`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

ProjectApplicationsManager.displayName = 'ProjectApplicationsManager';

