import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  MapPin, Star, CheckCircle, MessageSquare, Eye, Award,
  Briefcase, ArrowRight
} from 'lucide-react';

// ============================================================================
// COMPACT PROFILE CARD (for grids)
// ============================================================================
export const ProfileCard = memo(({ profile, showActions = true }) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 cursor-pointer group h-full"
      onClick={() => navigate(`/profile/${profile.id}`)}
    >
      <CardContent className="p-6">
        {/* Avatar & Name */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-display font-bold overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                profile.full_name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            {profile.is_verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center ring-2 ring-background">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-display font-bold text-foreground tracking-wider group-hover:text-primary transition-colors line-clamp-1">
              {profile.full_name}
            </h3>
          </div>

          {profile.headline && (
            <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem]">{profile.headline}</p>
          )}

          {/* Location */}
          {profile.city && profile.country && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {profile.city}, {profile.country}
            </p>
          )}
        </div>

        {/* Availability Badge */}
        {profile.is_available && (
          <div className="flex justify-center mb-3">
            <Badge className="bg-green-500/20 text-green-500 font-mono text-xs">
              AVAILABLE
            </Badge>
          </div>
        )}

        {/* User Type Badge */}
        {profile.user_type && (
          <div className="flex justify-center mb-4">
            <Badge variant="outline" className="font-mono text-xs capitalize">
              {profile.user_type.replace('_', ' ')}
            </Badge>
          </div>
        )}

        {/* Skills Preview */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 mb-4 min-h-[3rem]">
            {profile.skills.slice(0, 3).map((skill, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-mono"
              >
                {skill.skill?.name || skill}
              </span>
            ))}
            {profile.skills.length > 3 && (
              <span className="px-2 py-0.5 text-muted-foreground text-xs">
                +{profile.skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 font-mono text-xs"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/messages?userId=${profile.id}`);
              }}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              MSG
            </Button>
            <Button
              size="sm"
              className="flex-1 font-mono text-xs"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${profile.id}`);
              }}
            >
              VIEW
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ProfileCard.displayName = 'ProfileCard';

// ============================================================================
// HORIZONTAL PROFILE CARD (for lists)
// ============================================================================
export const ProfileCardHorizontal = memo(({ profile, showActions = true }) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="tech-panel border-border bg-card/50 hover-lift transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/profile/${profile.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-display font-bold overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                profile.full_name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            {profile.is_verified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center ring-2 ring-background">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-display font-bold text-foreground tracking-wider group-hover:text-primary transition-colors">
                    {profile.full_name}
                  </h3>
                  {profile.is_available && (
                    <Badge className="bg-green-500/20 text-green-500 font-mono text-xs">
                      AVAILABLE
                    </Badge>
                  )}
                </div>
                {profile.headline && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{profile.headline}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {profile.city && profile.country && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {profile.city}, {profile.country}
                    </span>
                  )}
                  {profile.user_type && (
                    <Badge variant="outline" className="font-mono text-xs capitalize">
                      {profile.user_type.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {profile.skills.slice(0, 5).map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-mono"
                  >
                    {skill.skill?.name || skill}
                  </span>
                ))}
                {profile.skills.length > 5 && (
                  <span className="px-2 py-0.5 text-muted-foreground text-xs">
                    +{profile.skills.length - 5} more
                  </span>
                )}
              </div>
            )}

            {/* Footer */}
            {showActions && (
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {profile.profile_views !== undefined && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {profile.profile_views} views
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/messages?userId=${profile.id}`);
                    }}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    MESSAGE
                  </Button>
                  <Button
                    size="sm"
                    className="font-mono text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${profile.id}`);
                    }}
                  >
                    VIEW PROFILE
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ProfileCardHorizontal.displayName = 'ProfileCardHorizontal';

// ============================================================================
// MINI PROFILE CARD (for sidebars, recommendations)
// ============================================================================
export const ProfileCardMini = memo(({ profile }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/profile/${profile.id}`)}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-card cursor-pointer transition-colors group"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
        ) : (
          profile.full_name?.charAt(0)?.toUpperCase() || 'U'
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-sm font-display font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {profile.full_name}
          </p>
          {profile.is_verified && <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground truncate">{profile.headline || profile.user_type}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </div>
  );
});

ProfileCardMini.displayName = 'ProfileCardMini';


