'use client';

import { useState, useEffect } from 'react';
import { School } from '../lib/types';

interface SchoolFormProps {
  school?: School;
  onSubmit: (schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

const PREDEFINED_TAGS = [
  'high interest',
  'needs follow-up',
  'visited campus',
  'emailed',
  'called',
  'scholarship offered',
  'application submitted',
  'accepted',
  'waitlisted',
  'rejected'
];

export default function SchoolForm({ school, onSubmit, onCancel }: SchoolFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    division: '',
    programs: [] as string[],
    athleticDetails: '',
    description: '',
    volleyballHistory: '',
    notes: '',
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name,
        location: school.location,
        division: school.division,
        programs: school.programs,
        athleticDetails: school.athleticDetails,
        description: school.description || '',
        volleyballHistory: school.volleyballHistory || '',
        notes: school.notes || '',
        tags: school.tags || []
      });
    }
  }, [school]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate school name
    if (!formData.name.trim()) {
      setNameError('School Name is required');
      return;
    }
    
    if (formData.name.trim().length < 2) {
      setNameError('School Name must be at least 2 characters long');
      return;
    }

    setNameError('');
    await onSubmit(formData);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({ ...prev, name }));
    
    // Clear error when user starts typing
    if (name.trim()) {
      setNameError('');
    }
  };

  const handleProgramsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const programs = e.target.value.split(',').map(p => p.trim()).filter(p => p);
    setFormData(prev => ({ ...prev, programs }));
  };

  const handleTagSelect = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const handleAddCustomTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {school ? 'Edit School' : 'Add New School'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                School Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  nameError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter school name"
              />
              {nameError && (
                <p className="mt-1 text-sm text-red-500">{nameError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Division</label>
              <select
                required
                value={formData.division}
                onChange={e => setFormData(prev => ({ ...prev, division: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Division</option>
                <option value="NCAA D1">NCAA Division I</option>
                <option value="NCAA D2">NCAA Division II</option>
                <option value="NCAA D3">NCAA Division III</option>
                <option value="NAIA">NAIA</option>
                <option value="NJCAA">NJCAA</option>
                <option value="OUA">OUA</option>
                <option value="AUS">AUS</option>
                <option value="Canada West">Canada West</option>
                <option value="RSEQ">RSEQ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Programs/Majors</label>
              <input
                type="text"
                value={formData.programs.join(', ')}
                onChange={handleProgramsChange}
                placeholder="Enter programs separated by commas"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
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
              <label className="block text-sm font-medium text-gray-700">Athletic Program Details</label>
              <textarea
                value={formData.athleticDetails}
                onChange={e => setFormData(prev => ({ ...prev, athleticDetails: e.target.value }))}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Volleyball Program History</label>
              <textarea
                value={formData.volleyballHistory}
                onChange={e => setFormData(prev => ({ ...prev, volleyballHistory: e.target.value }))}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Add your personal notes about this school..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tags</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="mt-2">
                <label className="block text-xs text-gray-500 mb-1">Common Tags</label>
                <div className="flex flex-wrap gap-1">
                  {PREDEFINED_TAGS.filter(tag => !formData.tags.includes(tag)).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagSelect(tag)}
                      className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder="Add custom tag"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {school ? 'Save Changes' : 'Add School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 