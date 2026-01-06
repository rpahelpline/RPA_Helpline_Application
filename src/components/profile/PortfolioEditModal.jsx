import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { X, Plus, Sparkles } from 'lucide-react';
import { profileApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';

export const PortfolioEditModal = ({ isOpen, onClose, portfolioItem, onSave }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: '',
    project_url: '',
    demo_url: '',
    github_url: '',
    client_name: '',
    completion_date: '',
    platforms_used: [],
    skills_used: [],
    is_featured: false,
  });
  const [newPlatform, setNewPlatform] = useState('');
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (portfolioItem) {
      setFormData({
        title: portfolioItem.title || '',
        description: portfolioItem.description || '',
        project_type: portfolioItem.project_type || '',
        project_url: portfolioItem.project_url || '',
        demo_url: portfolioItem.demo_url || '',
        github_url: portfolioItem.github_url || '',
        client_name: portfolioItem.client_name || '',
        completion_date: portfolioItem.completion_date ? portfolioItem.completion_date.split('T')[0] : '',
        platforms_used: portfolioItem.platforms_used || [],
        skills_used: portfolioItem.skills_used || [],
        is_featured: portfolioItem.is_featured || false,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        project_type: '',
        project_url: '',
        demo_url: '',
        github_url: '',
        client_name: '',
        completion_date: '',
        platforms_used: [],
        skills_used: [],
        is_featured: false,
      });
    }
    setNewPlatform('');
    setNewSkill('');
  }, [portfolioItem, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setLoading(true);
    try {
      if (portfolioItem?.id) {
        await profileApi.updatePortfolio(portfolioItem.id, formData);
        toast.success('Portfolio item updated successfully');
      } else {
        await profileApi.addPortfolio(formData);
        toast.success('Portfolio item added successfully');
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save portfolio:', error);
      toast.error(error.error || 'Failed to save portfolio item');
    } finally {
      setLoading(false);
    }
  };

  const addPlatform = () => {
    if (newPlatform.trim() && !formData.platforms_used.includes(newPlatform.trim())) {
      setFormData(prev => ({
        ...prev,
        platforms_used: [...prev.platforms_used, newPlatform.trim()]
      }));
      setNewPlatform('');
    }
  };

  const removePlatform = (platform) => {
    setFormData(prev => ({
      ...prev,
      platforms_used: prev.platforms_used.filter(p => p !== platform)
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills_used.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills_used: [...prev.skills_used, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills_used: prev.skills_used.filter(s => s !== skill)
    }));
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={portfolioItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Project title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your project..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project Type</label>
            <Input
              value={formData.project_type}
              onChange={(e) => setFormData(prev => ({ ...prev, project_type: e.target.value }))}
              placeholder="e.g., Automation, Web App"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Completion Date</label>
            <Input
              type="date"
              value={formData.completion_date}
              onChange={(e) => setFormData(prev => ({ ...prev, completion_date: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Client Name</label>
          <Input
            value={formData.client_name}
            onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
            placeholder="Client or company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Project URL</label>
          <Input
            type="url"
            value={formData.project_url}
            onChange={(e) => setFormData(prev => ({ ...prev, project_url: e.target.value }))}
            placeholder="https://..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Demo URL</label>
            <Input
              type="url"
              value={formData.demo_url}
              onChange={(e) => setFormData(prev => ({ ...prev, demo_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">GitHub URL</label>
            <Input
              type="url"
              value={formData.github_url}
              onChange={(e) => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Platforms Used</label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPlatform())}
              placeholder="Add platform..."
              className="flex-1"
            />
            <Button type="button" onClick={addPlatform} size="sm" variant="outline" disabled={!newPlatform.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {formData.platforms_used.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.platforms_used.map((platform, idx) => (
                <Badge key={idx} variant="outline" className="flex items-center gap-1">
                  {platform}
                  <button
                    type="button"
                    onClick={() => removePlatform(platform)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Skills Used</label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="Add skill..."
              className="flex-1"
            />
            <Button type="button" onClick={addSkill} size="sm" variant="outline" disabled={!newSkill.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {formData.skills_used.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.skills_used.map((skill, idx) => (
                <Badge key={idx} variant="outline" className="flex items-center gap-1">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_featured"
            checked={formData.is_featured}
            onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
            className="w-4 h-4"
          />
          <label htmlFor="is_featured" className="text-sm font-medium flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            Mark as Featured
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !formData.title.trim()}>
            {loading ? 'Saving...' : portfolioItem ? 'Update' : 'Add'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
