'use client';

import { useState } from 'react';
import { School, Coach, Communication, AthleteProfile } from '../lib/types';

interface MessageFormProps {
  school: School;
  coaches: Coach[];
  athleteProfile: AthleteProfile;
  onSubmit: (messageData: Omit<Communication, 'id' | 'timestamp'>) => Promise<void>;
}

type MessageType = 'email' | 'phone' | 'visit' | 'other';

export default function MessageForm({ school, coaches, athleteProfile, onSubmit }: MessageFormProps) {
  const [formData, setFormData] = useState({
    content: '',
    coachId: '',
    type: 'email' as MessageType,
  });
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
      userId: athleteProfile.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Reset form
    setFormData(prev => ({ ...prev, content: '', coachId: '' }));
  };

  const generateMessage = async (prompt?: string) => {
    setIsGenerating(true);
    try {
      const selectedCoach = coaches.find(c => c.id === formData.coachId);
      const response = await fetch('/api/replicate/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          athleteProfile,
          school,
          coach: selectedCoach,
        }),
      });

      const data = await response.json();
      if (data.response) {
        setFormData(prev => ({ ...prev, content: data.response }));
      }
    } catch (error) {
      console.error('Error generating message:', error);
    } finally {
      setIsGenerating(false);
      setShowAIOptions(false);
      setShowPromptInput(false);
      setCustomPrompt('');
    }
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-900">
              Message <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAIOptions(!showAIOptions)}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-150 flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generate AI Message</span>
              </button>
              
              {showAIOptions && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 p-4 z-50">
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => generateMessage()}
                      disabled={!formData.coachId || isGenerating}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 rounded-md transition-colors duration-150"
                    >
                      🤖 Auto-generate message
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPromptInput(true);
                        setShowAIOptions(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 rounded-md transition-colors duration-150"
                    >
                      ✍️ Custom prompt
                    </button>
                  </div>
                </div>
              )}

              {showPromptInput && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 p-4 z-50">
                  <div className="space-y-3">
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Enter your prompt for message generation..."
                      className="w-full rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      rows={3}
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPromptInput(false);
                          setCustomPrompt('');
                        }}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-150"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => generateMessage(customPrompt)}
                        disabled={!customPrompt.trim() || !formData.coachId || isGenerating}
                        className="px-4 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <textarea
            required
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={4}
            className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            placeholder={isGenerating ? "Generating message..." : "Type your message here..."}
            disabled={isGenerating}
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!formData.content.trim() || !formData.coachId || isGenerating}
            className="inline-flex justify-center rounded-full border border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 py-2 px-6 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          >
            Send Message
          </button>
        </div>
      </form>
    </div>
  );
} 