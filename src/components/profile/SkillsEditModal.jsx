import { useState, useEffect, memo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { profileApi, taxonomyApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useTaxonomy } from '../../contexts/TaxonomyContext';
import { X, Plus, Trash2, Search } from 'lucide-react';
import { Badge } from '../ui/Badge';

const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' }
];

const SkillItem = memo(({ skillName, skillId, proficiency, yearsExp, onRemove, onUpdate }) => {
  const [localProficiency, setLocalProficiency] = useState(proficiency);
  const [localYears, setLocalYears] = useState(yearsExp);

  useEffect(() => {
    setLocalProficiency(proficiency);
    setLocalYears(yearsExp);
  }, [proficiency, yearsExp]);

  const handleProficiencyChange = (newProficiency) => {
    setLocalProficiency(newProficiency);
    onUpdate(skillId, newProficiency, localYears);
  };

  const handleYearsChange = (newYears) => {
    const val = parseInt(newYears) || 0;
    setLocalYears(val);
    onUpdate(skillId, localProficiency, val);
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{skillName}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(skillId)}
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

SkillItem.displayName = 'SkillItem';

export const SkillsEditModal = ({ isOpen, onClose, profile, onSave }) => {
  const toast = useToast();
  const { skills: contextSkills, loading: taxonomyLoading } = useTaxonomy();
  const [loading, setLoading] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSkills, setUserSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);

  useEffect(() => {
    if (profile && isOpen) {
      setUserSkills(profile.skills || []);
    }
  }, [profile, isOpen]);

  // Refresh skills when profile updates
  useEffect(() => {
    if (profile?.skills) {
      setUserSkills(profile.skills || []);
    }
  }, [profile?.skills]);

  useEffect(() => {
    const loadAvailableSkills = async () => {
      setLoadingSkills(true);
      try {
        const response = await taxonomyApi.getSkills();
        // API returns { categories: [], all_skills: [] }
        const allSkills = response.all_skills || [];
        const userSkillIds = new Set((profile?.skills || []).map(s => s.skill?.id));
        const available = allSkills.filter(skill => !userSkillIds.has(skill.id));
        setAvailableSkills(available);
      } catch (error) {
        console.error('Failed to load skills:', error);
        toast.error('Failed to load available skills');
        setAvailableSkills([]);
      } finally {
        setLoadingSkills(false);
      }
    };
    
    if (isOpen) {
      loadAvailableSkills();
    } else {
      // Reset when modal closes
      setAvailableSkills([]);
      setSearchQuery('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, profile?.skills]);

  const filteredAvailableSkills = availableSkills.filter(skill =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSkill = async (skill) => {
    setLoading(true);
    try {
      await profileApi.addSkill({
        skill_id: skill.id,
        proficiency_level: 'intermediate',
        years_experience: 0
      });
      toast.success('Skill added successfully');
      const updated = await profileApi.getMyProfile();
      setUserSkills(updated.profile.skills || []);
      const userSkillIds = new Set(updated.profile.skills.map(s => s.skill?.id));
      setAvailableSkills(availableSkills.filter(s => !userSkillIds.has(s.id)));
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to add skill:', error);
      toast.error(error.error || 'Failed to add skill');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSkill = async (skillId) => {
    setLoading(true);
    try {
      await profileApi.removeSkill(skillId);
      toast.success('Skill removed successfully');
      const updated = await profileApi.getMyProfile();
      setUserSkills(updated.profile.skills || []);
      const removedSkill = userSkills.find(s => s.skill?.id === skillId);
      if (removedSkill?.skill) {
        setAvailableSkills([...availableSkills, removedSkill.skill]);
      }
    } catch (error) {
      console.error('Failed to remove skill:', error);
      toast.error(error.error || 'Failed to remove skill');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProficiency = async (skillId, proficiencyLevel, yearsExperience) => {
    setLoading(true);
    try {
      await profileApi.addSkill({
        skill_id: skillId,
        proficiency_level: proficiencyLevel,
        years_experience: parseInt(yearsExperience) || 0
      });
      toast.success('Skill updated successfully');
      const updated = await profileApi.getMyProfile();
      setUserSkills(updated.profile.skills || []);
    } catch (error) {
      console.error('Failed to update skill:', error);
      toast.error(error.error || 'Failed to update skill');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSave();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Skills" size="lg">
      <div className="space-y-4">
        {/* Current Skills */}
        <div>
          <h3 className="text-sm font-medium mb-2">Your Skills</h3>
          {userSkills.length > 0 ? (
            <div className="space-y-2">
              {userSkills.map((item) => {
                const skillName = item.skill?.name || 'Unknown';
                const skillId = item.skill?.id;
                const currentProficiency = item.proficiency_level || 'intermediate';
                const currentYears = item.years_experience || 0;
                
                return (
                  <SkillItem
                    key={skillId}
                    skillName={skillName}
                    skillId={skillId}
                    proficiency={currentProficiency}
                    yearsExp={currentYears}
                    onRemove={handleRemoveSkill}
                    onUpdate={handleUpdateProficiency}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No skills added yet</p>
          )}
        </div>

        {/* Add Skills */}
        <div>
          <h3 className="text-sm font-medium mb-2">Add Skills</h3>
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills..."
              className="pl-8"
            />
          </div>
          <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
            {loadingSkills ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading skills...</p>
            ) : filteredAvailableSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {filteredAvailableSkills.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 hover:border-primary"
                    onClick={() => handleAddSkill(skill)}
                  >
                    {skill.name}
                    <Plus className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {searchQuery ? 'No skills found' : availableSkills.length === 0 && !loadingSkills ? 'No skills available' : 'All skills added'}
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

