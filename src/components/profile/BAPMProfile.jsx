import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Target, BarChart3, Briefcase, Code, Zap, Edit } from 'lucide-react';

const getProficiencyLabel = (level) => {
  switch (level?.toLowerCase()) {
    case 'expert': return 'Expert';
    case 'advanced': return 'Advanced';
    case 'intermediate': return 'Intermediate';
    case 'beginner': return 'Beginner';
    default: return 'Basic';
  }
};

export const BAPMProfile = memo(({ profile, specializedProfile, onEditSkills, onRefresh }) => {
  const navigate = useNavigate();
  
  // Ensure callbacks are defined (no-op if not provided)
  const handleEditSkills = onEditSkills || (() => {});

  return (
    <>
      {/* Project Management Experience */}
      {specializedProfile?.pm_experience && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Project Management Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {specializedProfile.years_experience && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Years of Experience</span>
                  <span className="text-lg font-display font-bold text-foreground">
                    {specializedProfile.years_experience} years
                  </span>
                </div>
              )}
              {specializedProfile.team_size && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Team Size Managed</span>
                  <span className="text-lg font-display font-bold text-foreground">
                    Up to {specializedProfile.team_size} members
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Methodologies */}
      {specializedProfile?.methodologies && specializedProfile.methodologies.length > 0 && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Methodologies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {specializedProfile.methodologies.map((method, index) => (
                <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                  {method}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Skills
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditSkills}
                className="h-7 px-2"
              >
                <Edit className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((item, index) => {
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
                    className={`px-3 py-1.5 rounded-lg border ${proficiencyColors[proficiency] || proficiencyColors.intermediate}`}
                  >
                    <span className="text-sm font-display font-semibold">{skillName}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platforms */}
      {profile.platforms && profile.platforms.length > 0 && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" />
                RPA Platforms
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditSkills}
                className="h-7 px-2"
              >
                <Edit className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.platforms.map((item, index) => {
                const platformName = item.platform?.name || 'Unknown';
                const isPrimary = item.is_primary;
                
                return (
                  <div
                    key={item.platform?.id || index}
                    className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${
                      isPrimary
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    {item.platform?.logo_url ? (
                      <img
                        src={item.platform.logo_url}
                        alt={platformName}
                        className="w-5 h-5 rounded object-contain flex-shrink-0"
                      />
                    ) : (
                      <Code className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="text-sm font-display font-semibold">{platformName}</span>
                    {isPrimary && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                        P
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics & Metrics */}
      {specializedProfile && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Analytics & Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {specializedProfile.projects_delivered !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Projects Delivered</span>
                  <span className="text-lg font-display font-bold text-foreground">
                    {specializedProfile.projects_delivered || 0}
                  </span>
                </div>
              )}
              {specializedProfile.success_rate !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="text-lg font-display font-bold text-foreground">
                    {specializedProfile.success_rate}%
                  </span>
                </div>
              )}
              {specializedProfile.on_time_delivery_rate !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">On-Time Delivery</span>
                  <span className="text-lg font-display font-bold text-foreground">
                    {specializedProfile.on_time_delivery_rate}%
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Leadership */}
      {specializedProfile?.team_leadership && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Team Leadership
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{specializedProfile.team_leadership}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
});

BAPMProfile.displayName = 'BAPMProfile';

