'use client';

import { useState } from 'react';
import { CommunicationThread, CommunicationWithCoach } from '../lib/types';
import { format } from 'date-fns';

interface ThreadProps {
  thread: CommunicationThread;
  onReply: (content: string, parentId: string, coachId: string) => Promise<void>;
}

interface MessageContentProps extends Partial<CommunicationWithCoach> {
  timestamp: Date;
}

export default function CommunicationThreadView({ thread, onReply }: ThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onReply(replyContent.trim(), thread.id, thread.coachId);
      setReplyContent('');
      setIsReplying(false);
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const MessageContent = ({ content, type, timestamp, direction, coach }: MessageContentProps) => (
    <div className="flex items-start space-x-2">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900">
            {direction === 'incoming' ? coach?.name : 'You'}
          </span>
          <span className="text-sm text-gray-500">
            via {type}
          </span>
          <span className="text-sm text-gray-500">
            {format(timestamp instanceof Date ? timestamp : new Date(timestamp), 'MMM d, yyyy h:mm a')}
          </span>
        </div>
        <div className="mt-1 text-gray-700 whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col space-y-4 p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      {/* Main message */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`w-2 h-2 rounded-full ${
              thread.status === 'unread' ? 'bg-blue-500' : 'bg-gray-300'
            }`} />
            <MessageContent {...thread} />
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1.5">
            <span className="font-medium text-gray-900">{thread.school.name}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{thread.school.division}</span>
          </div>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">{format(thread.timestamp, 'MMM d, yyyy')}</span>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-150 flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span>{isReplying ? 'Cancel Reply' : 'Reply'}</span>
          </button>
        </div>
      </div>

      {/* Reply form */}
      {isReplying && (
        <form onSubmit={handleSubmitReply} className="ml-8 space-y-3">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Type your reply..."
            className="w-full rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            rows={3}
          />
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsReplying(false);
                setReplyContent('');
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!replyContent.trim() || isSubmitting}
              className="px-4 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
            >
              {isSubmitting ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </form>
      )}

      {/* Replies */}
      {thread.replies && thread.replies.length > 0 && (
        <div className="ml-8 space-y-4">
          {thread.replies.map((reply) => (
            <div key={reply.id} className="flex flex-col space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <MessageContent {...reply} />
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="text-gray-600">{format(reply.timestamp, 'MMM d, yyyy')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 