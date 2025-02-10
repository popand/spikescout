'use client';

import { useState } from 'react';
import { School, Coach, Communication } from '../lib/types';

interface MessageFormProps {
  school: School;
  coaches: Coach[];
  onSubmit: (messageData: Omit<Communication, 'id' | 'timestamp'>) => Promise<void>;
}

type MessageType = 'email' | 'phone' | 'visit' | 'other';

export default function MessageForm({ school, coaches, onSubmit }: MessageFormProps) {
  const [formData, setFormData] = useState({
    content: '',
    coachId: '',
    type: 'email' as MessageType,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim() || !formData.coachId) return;

    await onSubmit({
      schoolId: school.id,
      coachId: formData.coachId,
      content: formData.content.trim(),
      direction: 'outgoing',
      status: 'read',
      type: formData.type,
    });

    // Reset form
    setFormData(prev => ({ ...prev, content: '', coachId: '' }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            Coach <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.coachId}
            onChange={(e) => setFormData(prev => ({ ...prev, coachId: e.target.value }))}
            className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="">Select a coach</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.name} - {coach.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            Message Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as MessageType }))}
            className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="visit">Visit</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={4}
            className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            placeholder="Type your message here..."
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!formData.content.trim() || !formData.coachId}
            className="inline-flex justify-center rounded-full border border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 py-2 px-6 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          >
            Send Message
          </button>
        </div>
      </form>
    </div>
  );
} 