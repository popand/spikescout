'use client';

import { useState } from 'react';
import { CommunicationThread, CommunicationWithCoach } from '../lib/types';
import { format } from 'date-fns';
import { updateCommunication, deleteCommunication } from '../lib/firebase/firebaseUtils';

interface ThreadProps {
  thread: CommunicationThread;
  onReply: (content: string, parentId: string, coachId: string) => Promise<void>;
  userId: string;
  onDelete?: () => void;
}

interface MessageContentProps extends Partial<CommunicationWithCoach> {
  timestamp: Date;
  onEdit?: (content: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  isEditing?: boolean;
  setIsEditing?: (isEditing: boolean) => void;
}

export default function CommunicationThreadView({ thread, onReply, userId, onDelete }: ThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(thread.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleEdit = async () => {
    try {
      await updateCommunication(thread.id, { content: editContent }, userId);
      setIsEditing(false);
      // Optionally refresh the thread data here
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCommunication(thread.id, userId);
      onDelete?.();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const MessageContent = ({ content, type, timestamp, direction, coach, isEditing, setIsEditing, onEdit, onDelete }: MessageContentProps) => (
    <div className="flex items-start space-x-2">
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {direction === 'outgoing' && (
              <>
                <span className="font-medium text-gray-900">To: {coach?.name}</span>
                <span className="text-gray-400">•</span>
              </>
            )}
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
          {direction === 'outgoing' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditing && setIsEditing(!isEditing)}
                className="p-1 text-gray-500 hover:text-blue-600 transition-colors duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                  className="p-1 text-gray-500 hover:text-red-600 transition-colors duration-150"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                {showDeleteConfirm && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 p-4 z-50">
                    <p className="text-sm text-gray-600 mb-3">
                      Are you sure you want to delete this message?
                    </p>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-150"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowDeleteConfirm(false);
                        }}
                        className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-150"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="mt-1">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                rows={3}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  className="px-4 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all duration-150 shadow-sm"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="text-gray-700 whitespace-pre-wrap">
              {content}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col space-y-4 p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      {/* Main message */}
      <div className="flex flex-col space-y-3">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-3 ${
              thread.status === 'unread' ? 'bg-blue-500' : 'bg-gray-300'
            }`} />
            <div className="flex-1">
              <MessageContent 
                {...thread} 
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              <div className="mt-3 flex items-center space-x-1.5 text-sm text-gray-500">
                <span className="font-medium text-gray-900">{thread.school.name}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{thread.school.division}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-150 flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span>{isReplying ? 'Cancel Comment' : 'Comment'}</span>
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
              {isSubmitting ? 'Sending...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* Replies */}
      {thread.replies && thread.replies.length > 0 && (
        <div className="ml-8 space-y-4 mt-4 border-l-2 border-gray-200 pl-6">
          {/* Sort replies by timestamp in descending order */}
          {thread.replies
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .map((reply) => (
              <div key={reply.id} className="flex flex-col space-y-2">
                <MessageContent 
                  {...reply}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
} 