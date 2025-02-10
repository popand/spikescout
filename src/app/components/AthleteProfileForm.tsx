'use client';

import { useState } from 'react';
import { AthleteProfile } from '../lib/types';
import { format } from 'date-fns';
import AvatarUpload from './AvatarUpload';
import { uploadAvatar, deleteAvatar } from '../lib/firebase/firebaseUtils';

interface AthleteProfileFormProps {
  profile: AthleteProfile;
  onSubmit: (profileData: Omit<AthleteProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  userId: string;
}

interface ValidationErrors {
  name?: string;
  birthday?: string;
  gpa?: string;
  graduationYear?: string;
  height?: string;
  submit?: string;
  [key: string]: string | undefined;
}

export default function AthleteProfileForm({ profile, onSubmit, onCancel, userId }: AthleteProfileFormProps) {
  const [formData, setFormData] = useState({
    name: profile.name,
    birthday: format(profile.birthday, 'yyyy-MM-dd'),
    description: profile.description,
    interests: profile.interests,
    stats: { ...profile.stats },
    mediaLinks: [...profile.mediaLinks],
    avatarUrl: profile.avatarUrl || ''
  });
  const [newInterest, setNewInterest] = useState('');
  const [newMediaLink, setNewMediaLink] = useState({
    type: 'youtube' as const,
    url: '',
    title: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Birthday validation
    const birthdayDate = new Date(formData.birthday);
    if (isNaN(birthdayDate.getTime())) {
      newErrors.birthday = 'Invalid date';
    } else {
      const today = new Date();
      const age = today.getFullYear() - birthdayDate.getFullYear();
      if (age < 13 || age > 23) {
        newErrors.birthday = 'Age must be between 13 and 23';
      }
    }

    // GPA validation
    const gpa = parseFloat(formData.stats.gpa);
    if (formData.stats.gpa && (isNaN(gpa) || gpa < 0 || gpa > 4.0)) {
      newErrors.gpa = 'GPA must be between 0.0 and 4.0';
    }

    // Graduation year validation
    const gradYear = parseInt(formData.stats.graduationYear);
    const currentYear = new Date().getFullYear();
    if (formData.stats.graduationYear && (isNaN(gradYear) || gradYear < currentYear || gradYear > currentYear + 5)) {
      newErrors.graduationYear = `Graduation year must be between ${currentYear} and ${currentYear + 5}`;
    }

    // Height validation
    if (formData.stats.height && !formData.stats.height.match(/^\d{1,2}-\d{1,2}$/)) {
      newErrors.height = 'Height must be in format: 5-11';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        birthday: new Date(formData.birthday),
        description: formData.description.trim(),
        interests: formData.interests,
        stats: {
          ...formData.stats,
          position: formData.stats.position.trim(),
          height: formData.stats.height.trim(),
          verticalJump: formData.stats.verticalJump.trim(),
          approach: formData.stats.approach.trim(),
          block: formData.stats.block.trim(),
          gpa: formData.stats.gpa.trim(),
          graduationYear: formData.stats.graduationYear.trim(),
          club: formData.stats.club.trim()
        },
        mediaLinks: formData.mediaLinks.map(link => ({
          ...link,
          title: link.title.trim(),
          url: link.url.trim()
        })),
        avatarUrl: formData.avatarUrl
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to save profile. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const addMediaLink = () => {
    if (newMediaLink.url.trim() && newMediaLink.title.trim()) {
      setFormData(prev => ({
        ...prev,
        mediaLinks: [...prev.mediaLinks, { ...newMediaLink }]
      }));
      setNewMediaLink({
        type: 'youtube',
        url: '',
        title: ''
      });
    }
  };

  const removeMediaLink = (url: string) => {
    setFormData(prev => ({
      ...prev,
      mediaLinks: prev.mediaLinks.filter(link => link.url !== url)
    }));
  };

  const handleAvatarChange = async (file: File) => {
    try {
      // If there's an existing avatar, delete it first
      if (formData.avatarUrl) {
        await deleteAvatar(userId);
      }
      
      // Upload new avatar
      const avatarUrl = await uploadAvatar(userId, file);
      setFormData(prev => ({ ...prev, avatarUrl }));
      setShowAvatarUpload(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to upload avatar. Please try again.'
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Edit Athlete Profile</h2>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowAvatarUpload(true)}
                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow-lg hover:bg-blue-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {errors.submit && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{errors.submit}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Birthday <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.birthday}
                onChange={e => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.birthday ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.birthday && (
                <p className="mt-1 text-sm text-red-600">{errors.birthday}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Position</label>
                  <input
                    type="text"
                    value={formData.stats.position}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      stats: { ...prev.stats, position: e.target.value }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Height</label>
                  <input
                    type="text"
                    value={formData.stats.height}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      stats: { ...prev.stats, height: e.target.value }
                    }))}
                    placeholder="5-11"
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.height ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.height && (
                    <p className="mt-1 text-sm text-red-600">{errors.height}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vertical Jump</label>
                  <input
                    type="text"
                    value={formData.stats.verticalJump}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      stats: { ...prev.stats, verticalJump: e.target.value }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Approach</label>
                  <input
                    type="text"
                    value={formData.stats.approach}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      stats: { ...prev.stats, approach: e.target.value }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Block</label>
                  <input
                    type="text"
                    value={formData.stats.block}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      stats: { ...prev.stats, block: e.target.value }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">GPA</label>
                  <input
                    type="text"
                    value={formData.stats.gpa}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      stats: { ...prev.stats, gpa: e.target.value }
                    }))}
                    placeholder="0.0 - 4.0"
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.gpa ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.gpa && (
                    <p className="mt-1 text-sm text-red-600">{errors.gpa}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Graduation Year</label>
                  <input
                    type="text"
                    value={formData.stats.graduationYear}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      stats: { ...prev.stats, graduationYear: e.target.value }
                    }))}
                    placeholder={new Date().getFullYear().toString()}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.graduationYear ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.graduationYear && (
                    <p className="mt-1 text-sm text-red-600">{errors.graduationYear}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Club</label>
                  <input
                    type="text"
                    value={formData.stats.club}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      stats: { ...prev.stats, club: e.target.value }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.interests.map(interest => (
                  <span
                    key={interest}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInterest}
                  onChange={e => setNewInterest(e.target.value)}
                  placeholder="Add new interest"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addInterest();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addInterest}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Media Links</h3>
              <div className="space-y-2 mb-4">
                {formData.mediaLinks.map(link => (
                  <div key={link.url} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{link.type}:</span>
                      <span className="text-sm">{link.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMediaLink(link.url)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={newMediaLink.type}
                  onChange={e => setNewMediaLink(prev => ({ ...prev, type: e.target.value as any }))}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="youtube">YouTube</option>
                  <option value="instagram">Instagram</option>
                  <option value="hudl">Hudl</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="text"
                  value={newMediaLink.title}
                  onChange={e => setNewMediaLink(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Title"
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={newMediaLink.url}
                  onChange={e => setNewMediaLink(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="URL"
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={addMediaLink}
                className="mt-2 w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Add Media Link
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {showAvatarUpload && (
            <AvatarUpload
              currentAvatarUrl={formData.avatarUrl}
              onAvatarChange={handleAvatarChange}
              onCancel={() => setShowAvatarUpload(false)}
            />
          )}
        </form>
      </div>
    </div>
  );
} 