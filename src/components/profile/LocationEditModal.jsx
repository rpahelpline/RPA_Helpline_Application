import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { profileApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { INDIAN_STATES, INDIAN_CITIES, validateIndianPhone } from '../../utils/indianLocalization';
import { MapPin, Phone } from 'lucide-react';

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Singapore', 'United Arab Emirates', 'Netherlands',
  'Sweden', 'Switzerland', 'Japan', 'South Korea', 'Brazil', 'Mexico',
  'South Africa', 'New Zealand', 'Ireland', 'Poland', 'Other'
];

export const LocationEditModal = ({ isOpen, onClose, profile, onSave }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    country: '',
    state: '',
    city: '',
    phone: '',
    alternate_phone: ''
  });
  const [availableCities, setAvailableCities] = useState([]);

  useEffect(() => {
    if (profile && isOpen) {
      setFormData({
        country: profile.country || 'India',
        state: profile.state || '',
        city: profile.city || '',
        phone: profile.phone || '',
        alternate_phone: profile.alternate_phone || ''
      });
    }
  }, [profile, isOpen]);

  useEffect(() => {
    if (formData.country === 'India' && formData.state) {
      const cities = INDIAN_CITIES[formData.state] || [];
      setAvailableCities(cities);
    } else {
      setAvailableCities([]);
    }
  }, [formData.country, formData.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone if provided
    if (formData.phone && formData.country === 'India') {
      if (!validateIndianPhone(formData.phone)) {
        toast.error('Please enter a valid Indian phone number');
        return;
      }
    }

    setLoading(true);
    try {
      await profileApi.updateProfile(formData);
      toast.success('Location updated successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to update location:', error);
      toast.error(error.error || 'Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Location & Contact" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Country *</label>
          <select
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value, state: '', city: '' }))}
            className="w-full px-3 py-2 border rounded-lg bg-background"
            required
          >
            {COUNTRIES.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        {formData.country === 'India' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <select
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value, city: '' }))}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            {formData.state && (
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="">Select City</option>
                  {availableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {formData.country !== 'India' && (
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Enter city"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Phone Number</label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder={formData.country === 'India' ? '+91-9876543210' : '+1-2345678900'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Alternate Phone</label>
          <Input
            type="tel"
            value={formData.alternate_phone}
            onChange={(e) => setFormData(prev => ({ ...prev, alternate_phone: e.target.value }))}
            placeholder="Optional"
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

