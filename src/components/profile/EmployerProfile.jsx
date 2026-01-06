import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Building2, Briefcase, Users, Target, Edit, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmployerProfile = memo(({ profile, specializedProfile }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Company Information */}
      {specializedProfile && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {specializedProfile.company_name && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Company Name</span>
                  <span className="text-lg font-display font-bold text-foreground">
                    {specializedProfile.company_name}
                  </span>
                </div>
              )}
              {specializedProfile.company_size && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Company Size</span>
                  <span className="text-lg font-display font-bold text-foreground">
                    {specializedProfile.company_size}
                  </span>
                </div>
              )}
              {specializedProfile.industry && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Industry</span>
                  <span className="text-lg font-display font-bold text-foreground">
                    {specializedProfile.industry}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jobs Posted */}
      {specializedProfile?.jobs_posted !== undefined && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Jobs Posted
              </CardTitle>
              <Link to="/jobs">
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg bg-muted/30">
              <span className="text-2xl font-display font-bold text-foreground">
                {specializedProfile.jobs_posted || 0}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Total jobs posted</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hiring Needs */}
      {specializedProfile?.hiring_needs && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Hiring Needs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{specializedProfile.hiring_needs}</p>
          </CardContent>
        </Card>
      )}

      {/* Company Culture */}
      {specializedProfile?.company_culture && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Company Culture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{specializedProfile.company_culture}</p>
          </CardContent>
        </Card>
      )}

      {/* Team Size */}
      {specializedProfile?.team_size && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Team Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg bg-muted/30">
              <span className="text-lg font-display font-bold text-foreground">
                {specializedProfile.team_size} members
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
});

EmployerProfile.displayName = 'EmployerProfile';

