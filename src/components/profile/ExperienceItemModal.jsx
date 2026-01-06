import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { profileApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Calendar, Building2, MapPin, X, Plus } from 'lucide-react';

export const ExperienceItemModal = ({ isOpen, onClose, experience, onSave }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    company_url: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
    achievements: [],
    technologies_used: []
  });
  const [achievementText, setAchievementText] = useState('');
  const [technologyText, setTechnologyText] = useState('');

  useEffect(() => {
    if (experience) {
      // Convert full date (YYYY-MM-DD) to month format (YYYY-MM) for month input
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
      };

      setFormData({
        title: experience.title || '',
        company_name: experience.company_name || '',
        company_url: experience.company_url || '',
        location: experience.location || '',
        start_date: experience.start_date ? formatDateForInput(experience.start_date) : '',
        end_date: experience.end_date ? formatDateForInput(experience.end_date) : '',
        is_current: experience.is_current || false,
        description: experience.description || '',
        achievements: experience.achievements || [],
        technologies_used: experience.technologies_used || []
      });
      setAchievementText('');
      setTechnologyText('');
    } else {
      setFormData({
        title: '',
        company_name: '',
        company_url: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
        achievements: [],
        technologies_used: []
      });
      setAchievementText('');
      setTechnologyText('');
    }
  }, [experience, isOpen]);

  const handleAddAchievement = () => {
    if (achievementText.trim()) {
      setFormData(prev => ({
        ...prev,
        achievements: [...prev.achievements, achievementText.trim()]
      }));
      setAchievementText('');
    }
  };

  const handleRemoveAchievement = (index) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const handleAddTechnology = () => {
    if (technologyText.trim()) {
      setFormData(prev => ({
        ...prev,
        technologies_used: [...prev.technologies_used, technologyText.trim()]
      }));
      setTechnologyText('');
    }
  };

  const handleRemoveTechnology = (index) => {
    setFormData(prev => ({
      ...prev,
      technologies_used: prev.technologies_used.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.company_name.trim() || !formData.start_date) {
      toast.error('Title, company name, and start date are required');
      return;
    }

    setLoading(true);
    try {
      // Convert month input (YYYY-MM) to full date (YYYY-MM-01)
      const formatDate = (monthValue) => {
        if (!monthValue) return null;
        // If it's already a full date, return as is
        if (monthValue.includes('-') && monthValue.split('-').length === 3) {
          return monthValue;
        }
        // If it's a month value (YYYY-MM), add -01 to make it a full date
        if (monthValue.includes('-') && monthValue.split('-').length === 2) {
          return `${monthValue}-01`;
        }
        return monthValue;
      };

      const data = {
        ...formData,
        start_date: formatDate(formData.start_date),
        end_date: formData.is_current ? null : formatDate(formData.end_date) || null
      };

      if (experience) {
        await profileApi.updateExperience(experience.id, data);
        toast.success('Experience updated successfully');
      } else {
        await profileApi.addExperience(data);
        toast.success('Experience added successfully');
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save experience:', error);
      toast.error(error.error || 'Failed to save experience');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={experience ? 'Edit Experience' : 'Add Experience'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Senior RPA Developer"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company Name *</label>
            <Input
              value={formData.company_name}
              onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              placeholder="e.g., ABC Corporation"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company URL</label>
            <Input
              type="url"
              value={formData.company_url}
              onChange={(e) => setFormData(prev => ({ ...prev, company_url: e.target.value }))}
              placeholder="https://company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Mumbai, India"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date *</label>
            <Input
              type="month"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <Input
              type="month"
              value={formData.end_date}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              disabled={formData.is_current}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_current"
            checked={formData.is_current}
            onChange={(e) => setFormData(prev => ({ ...prev, is_current: e.target.checked, end_date: e.target.checked ? '' : prev.end_date }))}
            className="w-4 h-4"
          />
          <label htmlFor="is_current" className="text-sm font-medium cursor-pointer">
            I currently work here
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your role and responsibilities..."
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Achievements</label>
          <div className="flex gap-2 mb-2">
            <Input
              value={achievementText}
              onChange={(e) => setAchievementText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAchievement();
                }
              }}
              placeholder="Add an achievement"
            />
            <Button type="button" onClick={handleAddAchievement} variant="outline" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.achievements.map((achievement, index) => (
              <div key={index} className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm">
                <span>{achievement}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAchievement(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Technologies Used</label>
          <div className="flex gap-2 mb-2">
            <Input
              value={technologyText}
              onChange={(e) => setTechnologyText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTechnology();
                }
              }}
              placeholder="Add a technology"
            />
            <Button type="button" onClick={handleAddTechnology} variant="outline" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.technologies_used.map((tech, index) => (
              <div key={index} className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm">
                <span>{tech}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTechnology(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : experience ? 'Update' : 'Add'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

