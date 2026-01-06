import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Code, Zap, FileText, CheckCircle, Calendar, Building2, ExternalLink, Edit, Plus, Star, Target } from 'lucide-react';
import { PortfolioEditModal } from './PortfolioEditModal';
import { useState } from 'react';

const getProficiencyLabel = (level) => {
  switch (level?.toLowerCase()) {
    case 'expert': return 'Expert';
    case 'advanced': return 'Advanced';
    case 'intermediate': return 'Intermediate';
    case 'beginner': return 'Beginner';
    default: return 'Basic';
  }
};

export const FreelancerProfile = memo(({ profile, specializedProfile, onRefresh, onEditSkills, onEditPlatforms }) => {
  const navigate = useNavigate();
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [currentPortfolioItem, setCurrentPortfolioItem] = useState(null);

  const handleEditPortfolio = (item = null) => {
    setCurrentPortfolioItem(item);
    setShowPortfolioModal(true);
  };

  return (
    <>
      {/* Skills Section */}
      {profile.skills && profile.skills.length > 0 && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Skills & Expertise
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditSkills}
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
                const yearsExp = item.years_experience || 0;
                const proficiencyColors = {
                  expert: 'bg-green-500/20 text-green-500 border-green-500/30',
                  advanced: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
                  intermediate: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
                  beginner: 'bg-gray-500/20 text-gray-500 border-gray-500/30'
                };
                
                return (
                  <div
                    key={item.skill?.id || index}
                    className={`group relative px-3 py-1.5 rounded-lg border transition-all hover:scale-105 ${proficiencyColors[proficiency] || proficiencyColors.intermediate}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-display font-semibold">{skillName}</span>
                      {yearsExp > 0 && (
                        <span className="text-xs font-mono opacity-70">
                          {yearsExp}y
                        </span>
                      )}
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-current/50">
                        {getProficiencyLabel(proficiency).charAt(0)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platforms Section */}
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
                onClick={onEditSkills}
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
                const proficiency = item.proficiency_level || 'intermediate';
                const yearsExp = item.years_experience || 0;
                const isPrimary = item.is_primary;
                const proficiencyColors = {
                  expert: 'bg-green-500/20 text-green-500 border-green-500/30',
                  advanced: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
                  intermediate: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
                  beginner: 'bg-gray-500/20 text-gray-500 border-gray-500/30'
                };
                
                return (
                  <div
                    key={item.platform?.id || index}
                    className={`group relative px-3 py-2 rounded-lg border transition-all hover:scale-105 flex items-center gap-2 ${
                      isPrimary
                        ? 'border-primary bg-primary/10 text-primary'
                        : proficiencyColors[proficiency] || proficiencyColors.intermediate
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-display font-semibold">{platformName}</span>
                      {isPrimary && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                          P
                        </Badge>
                      )}
                      {yearsExp > 0 && (
                        <span className="text-xs font-mono opacity-70">
                          {yearsExp}y
                        </span>
                      )}
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-current/50">
                        {getProficiencyLabel(proficiency).charAt(0)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Section */}
      <Card className="tech-panel border-border bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Portfolio
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditPortfolio()}
              className="h-7 px-2"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {profile.portfolio && profile.portfolio.length > 0 ? (
            <div className="space-y-3">
              {profile.portfolio.map((item, index) => (
                <div
                  key={item.id || index}
                  className="group p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-display font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        {item.is_featured && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                            ★ Featured
                          </Badge>
                        )}
                        {item.project_type && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                            {item.project_type}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPortfolio(item)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  {(item.client_name || item.completion_date) && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      {item.client_name && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>{item.client_name}</span>
                        </div>
                      )}
                      {item.completion_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(item.completion_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {(item.platforms_used?.length > 0 || item.skills_used?.length > 0) && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {item.platforms_used?.slice(0, 4).map((platform, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                          {platform}
                        </Badge>
                      ))}
                      {item.skills_used?.slice(0, 4).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {(item.project_url || item.demo_url || item.github_url) && (
                    <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                      {item.project_url && (
                        <a
                          href={item.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Project
                        </a>
                      )}
                      {item.demo_url && (
                        <a
                          href={item.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Demo
                        </a>
                      )}
                      {item.github_url && (
                        <a
                          href={item.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
                        >
                          <ExternalLink className="w-3 h-3" />
                          GitHub
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">No portfolio items yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditPortfolio()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Project
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testimonials (if available) */}
      {specializedProfile?.testimonials && specializedProfile.testimonials.length > 0 && (
        <Card className="tech-panel border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Testimonials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {specializedProfile.testimonials.map((testimonial, index) => (
                <div key={index} className="p-4 rounded-lg border border-border">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">
                        {testimonial.client_name?.charAt(0) || 'C'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground mb-1">{testimonial.content}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.client_name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <PortfolioEditModal
        isOpen={showPortfolioModal}
        onClose={() => {
          setShowPortfolioModal(false);
          setCurrentPortfolioItem(null);
        }}
        portfolioItem={currentPortfolioItem}
        onSave={onRefresh}
      />
    </>
  );
});

FreelancerProfile.displayName = 'FreelancerProfile';

