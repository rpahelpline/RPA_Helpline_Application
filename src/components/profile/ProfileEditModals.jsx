import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { profileApi, freelancerApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useAuthStore } from '../../store/authStore';

// Edit Profile Name and Headline
export const ProfileNameEditModal = ({ isOpen, onClose, profile, onSave }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    headline: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        headline: profile.headline || ''
      });
    }
  }, [profile, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast.error('Name is required');
      return;
    }

    setLoading(true);
    try {
      await profileApi.updateProfile(formData);
      toast.success('Profile updated successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name *</label>
          <Input
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            placeholder="Your full name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Headline</label>
          <Input
            value={formData.headline}
            onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
            placeholder="e.g., Senior RPA Developer"
          />
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Edit Bio
export const BioEditModal = ({ isOpen, onClose, bio, onSave }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState('');

  useEffect(() => {
    setFormData(bio || '');
  }, [bio, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await profileApi.updateProfile({ bio: formData });
      toast.success('Bio updated successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to update bio:', error);
      toast.error(error.error || 'Failed to update bio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Bio" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">About</label>
          <Textarea
            value={formData}
            onChange={(e) => setFormData(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={6}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Edit Social Links
export const SocialLinksEditModal = ({ isOpen, onClose, profile, onSave }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    website_url: '',
    linkedin_url: '',
    public_email: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        website_url: profile.website_url || '',
        linkedin_url: profile.linkedin_url || '',
        public_email: profile.public_email || ''
      });
    }
  }, [profile, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await profileApi.updateProfile(formData);
      toast.success('Social links updated successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to update social links:', error);
      toast.error(error.error || 'Failed to update social links');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Social Links" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Website URL</label>
          <Input
            type="url"
            value={formData.website_url}
            onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
            placeholder="https://yourwebsite.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">LinkedIn URL</label>
          <Input
            type="url"
            value={formData.linkedin_url}
            onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Public Email</label>
          <Input
            type="email"
            value={formData.public_email}
            onChange={(e) => setFormData(prev => ({ ...prev, public_email: e.target.value }))}
            placeholder="your@email.com"
          />
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Edit Experience
export const ExperienceEditModal = ({ isOpen, onClose, profile, specializedProfile, onSave }) => {
  const toast = useToast();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    total_experience_years: '',
    rpa_experience_years: '',
    title: '',
    current_title: '',
    current_company: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        total_experience_years: profile.total_experience_years || '',
        rpa_experience_years: profile.rpa_experience_years || '',
        title: specializedProfile?.title || '',
        current_title: specializedProfile?.current_title || '',
        current_company: specializedProfile?.current_company || profile.current_company || ''
      });
    }
  }, [profile, specializedProfile, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Update main profile experience fields
      const profileUpdates = {
        total_experience_years: formData.total_experience_years ? parseInt(formData.total_experience_years) : null,
        rpa_experience_years: formData.rpa_experience_years ? parseInt(formData.rpa_experience_years) : null
      };
      
      if (formData.current_company) {
        profileUpdates.current_company = formData.current_company;
      }

      await profileApi.updateProfile(profileUpdates);

      // Update specialized profile fields based on role
      if (role === 'freelancer' && formData.title) {
        try {
          await freelancerApi.updateProfile({
            title: formData.title,
            experience_years: formData.total_experience_years ? parseInt(formData.total_experience_years) : 0
          });
        } catch (err) {
          console.error('Failed to update freelancer profile:', err);
          // Don't fail completely if specialized profile update fails
        }
      } else if (role === 'job_seeker') {
        // For job seekers, we need to update job_seeker_profiles
        // This would require a new API endpoint or we update via profile API
        // For now, we'll just update the main profile
        if (formData.current_title || formData.current_company) {
          // Note: This might need a separate endpoint for job_seeker_profiles
          // For now, we'll update what we can via the main profile
        }
      }

      toast.success('Experience updated successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to update experience:', error);
      toast.error(error.error || 'Failed to update experience');
    } finally {
      setLoading(false);
    }
  };

  const isFreelancer = role === 'freelancer';
  const isJobSeeker = role === 'job_seeker';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Experience" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Total Experience (Years) *</label>
            <Input
              type="number"
              value={formData.total_experience_years}
              onChange={(e) => setFormData(prev => ({ ...prev, total_experience_years: e.target.value }))}
              placeholder="5"
              min="0"
              max="50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">RPA Experience (Years)</label>
            <Input
              type="number"
              value={formData.rpa_experience_years}
              onChange={(e) => setFormData(prev => ({ ...prev, rpa_experience_years: e.target.value }))}
              placeholder="3"
              min="0"
              max="50"
            />
          </div>
        </div>

        {/* Role-specific fields - available for all roles but shown based on role */}
        {isFreelancer && (
          <div>
            <label className="block text-sm font-medium mb-1">Current Role / Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Senior UiPath Developer"
            />
          </div>
        )}

        {isJobSeeker && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Current Position</label>
              <Input
                value={formData.current_title}
                onChange={(e) => setFormData(prev => ({ ...prev, current_title: e.target.value }))}
                placeholder="e.g., Senior RPA Developer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Current Company</label>
              <Input
                value={formData.current_company}
                onChange={(e) => setFormData(prev => ({ ...prev, current_company: e.target.value }))}
                placeholder="e.g., ABC Corporation"
              />
            </div>
          </>
        )}

        {/* For other roles (trainer, ba_pm, client, employer), they can still edit experience years */}
        {!isFreelancer && !isJobSeeker && (
          <div className="text-sm text-muted-foreground">
            <p>Your professional title is shown in your headline. You can edit it in the profile header.</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
