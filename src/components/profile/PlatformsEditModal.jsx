import { useState, useEffect, memo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { profileApi, taxonomyApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useTaxonomy } from '../../contexts/TaxonomyContext';
import { X, Plus, Trash2, Search, Star } from 'lucide-react';
import { Badge } from '../ui/Badge';

const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' }
];

const PlatformItem = memo(({ platformName, platformId, proficiency, yearsExp, isPrimary, onRemove, onUpdate, onSetPrimary }) => {
  const [localProficiency, setLocalProficiency] = useState(proficiency);
  const [localYears, setLocalYears] = useState(yearsExp);

  useEffect(() => {
    setLocalProficiency(proficiency);
    setLocalYears(yearsExp);
  }, [proficiency, yearsExp]);

  const handleProficiencyChange = (newProficiency) => {
    setLocalProficiency(newProficiency);
    onUpdate(platformId, newProficiency, localYears, isPrimary);
  };

  const handleYearsChange = (newYears) => {
    const val = parseInt(newYears) || 0;
    setLocalYears(val);
    onUpdate(platformId, localProficiency, val, isPrimary);
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{platformName}</span>
          {isPrimary && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary text-primary">
              <Star className="w-3 h-3 mr-0.5" />
              Primary
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSetPrimary(platformId)}
            className="h-6 px-2 text-xs"
            disabled={isPrimary}
          >
            {isPrimary ? 'Primary' : 'Set Primary'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(platformId)}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={localProficiency}
            onChange={(e) => handleProficiencyChange(e.target.value)}
            className="text-xs h-7 px-2 border rounded bg-background"
          >
            {PROFICIENCY_LEVELS.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
          <Input
            type="number"
            value={localYears}
            onChange={(e) => handleYearsChange(e.target.value)}
            placeholder="Years"
            className="text-xs h-7 w-20"
            min="0"
          />
          <span className="text-xs text-muted-foreground">years</span>
        </div>
      </div>
    </div>
  );
});

PlatformItem.displayName = 'PlatformItem';

export const PlatformsEditModal = ({ isOpen, onClose, profile, onSave }) => {
  const toast = useToast();
  const { platforms: contextPlatforms, loading: taxonomyLoading } = useTaxonomy();
  const [loading, setLoading] = useState(false);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userPlatforms, setUserPlatforms] = useState([]);
  const [availablePlatforms, setAvailablePlatforms] = useState([]);

  useEffect(() => {
    if (profile && isOpen) {
      setUserPlatforms(profile.platforms || []);
    }
  }, [profile, isOpen]);

  // Refresh platforms when profile updates
  useEffect(() => {
    if (profile?.platforms) {
      setUserPlatforms(profile.platforms || []);
    }
  }, [profile?.platforms]);

  useEffect(() => {
    const loadAvailablePlatforms = async () => {
      setLoadingPlatforms(true);
      try {
        const response = await taxonomyApi.getPlatforms();
        const allPlatforms = response.platforms || [];
        const userPlatformIds = new Set((profile?.platforms || []).map(p => p.platform?.id));
        const available = allPlatforms.filter(platform => !userPlatformIds.has(platform.id));
        setAvailablePlatforms(available);
      } catch (error) {
        console.error('Failed to load platforms:', error);
        toast.error('Failed to load available platforms');
        setAvailablePlatforms([]);
      } finally {
        setLoadingPlatforms(false);
      }
    };
    
    if (isOpen) {
      loadAvailablePlatforms();
    } else {
      // Reset when modal closes
      setAvailablePlatforms([]);
      setSearchQuery('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, profile?.platforms]);

  const filteredAvailablePlatforms = availablePlatforms.filter(platform =>
    platform.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPlatform = async (platform) => {
    setLoading(true);
    try {
      await profileApi.addPlatform({
        platform_id: platform.id,
        proficiency_level: 'intermediate',
        years_experience: 0,
        is_primary: userPlatforms.length === 0 // Set as primary if it's the first one
      });
      toast.success('Platform added successfully');
      const updated = await profileApi.getMyProfile();
      setUserPlatforms(updated.profile.platforms || []);
      const userPlatformIds = new Set(updated.profile.platforms.map(p => p.platform?.id));
      setAvailablePlatforms(availablePlatforms.filter(p => !userPlatformIds.has(p.id)));
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to add platform:', error);
      toast.error(error.error || 'Failed to add platform');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlatform = async (platformId) => {
    setLoading(true);
    try {
      await profileApi.removePlatform(platformId);
      toast.success('Platform removed successfully');
      const updated = await profileApi.getMyProfile();
      setUserPlatforms(updated.profile.platforms || []);
      const removedPlatform = userPlatforms.find(p => p.platform?.id === platformId);
      if (removedPlatform?.platform) {
        setAvailablePlatforms([...availablePlatforms, removedPlatform.platform]);
      }
    } catch (error) {
      console.error('Failed to remove platform:', error);
      toast.error(error.error || 'Failed to remove platform');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlatform = async (platformId, proficiencyLevel, yearsExperience, isPrimary) => {
    setLoading(true);
    try {
      await profileApi.addPlatform({
        platform_id: platformId,
        proficiency_level: proficiencyLevel,
        years_experience: parseInt(yearsExperience) || 0,
        is_primary: isPrimary || false
      });
      toast.success('Platform updated successfully');
      const updated = await profileApi.getMyProfile();
      setUserPlatforms(updated.profile.platforms || []);
    } catch (error) {
      console.error('Failed to update platform:', error);
      toast.error(error.error || 'Failed to update platform');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (platformId) => {
    setLoading(true);
    try {
      await profileApi.addPlatform({
        platform_id: platformId,
        is_primary: true
      });
      toast.success('Primary platform updated');
      const updated = await profileApi.getMyProfile();
      setUserPlatforms(updated.profile.platforms || []);
    } catch (error) {
      console.error('Failed to set primary platform:', error);
      toast.error(error.error || 'Failed to set primary platform');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Platforms" size="lg">
      <div className="space-y-4">
        {/* Current Platforms */}
        <div>
          <h3 className="text-sm font-medium mb-2">Your Platforms</h3>
          {userPlatforms.length > 0 ? (
            <div className="space-y-2">
              {userPlatforms.map((item) => {
                const platformName = item.platform?.name || 'Unknown';
                const platformId = item.platform?.id;
                const currentProficiency = item.proficiency_level || 'intermediate';
                const currentYears = item.years_experience || 0;
                const currentIsPrimary = item.is_primary || false;
                
                return (
                  <PlatformItem
                    key={platformId}
                    platformName={platformName}
                    platformId={platformId}
                    proficiency={currentProficiency}
                    yearsExp={currentYears}
                    isPrimary={currentIsPrimary}
                    onRemove={handleRemovePlatform}
                    onUpdate={handleUpdatePlatform}
                    onSetPrimary={handleSetPrimary}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No platforms added yet</p>
          )}
        </div>

        {/* Add Platforms */}
        <div>
          <h3 className="text-sm font-medium mb-2">Add Platforms</h3>
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search platforms..."
              className="pl-8"
            />
          </div>
          <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
            {loadingPlatforms ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading platforms...</p>
            ) : filteredAvailablePlatforms.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {filteredAvailablePlatforms.map((platform) => (
                  <Badge
                    key={platform.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 hover:border-primary"
                    onClick={() => handleAddPlatform(platform)}
                  >
                    {platform.name}
                    <Plus className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {searchQuery ? 'No platforms found' : availablePlatforms.length === 0 && !loadingPlatforms ? 'No platforms available' : 'All platforms added'}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};

