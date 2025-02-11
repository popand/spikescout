'use client';

import { useState, useEffect, useRef } from 'react';
import { School, Coach, Communication, CommunicationThread, CommunicationWithCoach, AthleteProfile } from './lib/types';
import {
  getSchools,
  getCoaches,
  getCommunications,
  addCommunication,
  getAthleteProfile,
  updateAthleteProfile,
  createAthleteProfile
} from './lib/firebase/firebaseUtils';
import SchoolsList from './components/SchoolsList';
import CommunicationThreadView from './components/CommunicationThread';
import MessageForm from './components/MessageForm';
import AthleteProfileView from './components/AthleteProfile';
import AthleteProfileForm from './components/AthleteProfileForm';
import LoginScreen from './components/LoginScreen';
import { useAuth } from './lib/hooks/useAuth';
import { auth } from './lib/firebase/firebase';

// Sample athlete profile data - used as default when no profile exists
const defaultAthleteProfile: Omit<AthleteProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  birthday: new Date(),
  description: '',
  interests: [],
  userId: '', // Will be set when creating profile
  stats: {
    position: '',
    height: '',
    verticalJump: '',
    approach: '',
    block: '',
    gpa: '',
    graduationYear: '',
    club: ''
  },
  mediaLinks: []
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [communications, setCommunications] = useState<CommunicationThread[]>([]);
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Add logging for current user
  useEffect(() => {
    if (user) {
      console.log('Current logged in user:', {
        uid: user.uid,
        email: user.email
      });
    }
  }, [user]);

  // Add click outside handler for user menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadSchools = async () => {
    if (user) {
      console.log('Loading schools for user:', user.uid);
      try {
        const schoolsData = await getSchools(user.uid);
        console.log('Schools data received:', schoolsData);
        setSchools(schoolsData);
      } catch (error) {
        console.error('Error loading schools:', error);
      }
    } else {
      console.log('No user available to load schools');
    }
  };

  const loadCoaches = async () => {
    if (user) {
      const coachesData = await getCoaches(user.uid);
      setCoaches(coachesData);
    }
  };

  const loadAthleteProfile = async () => {
    if (user) {
      const profile = await getAthleteProfile(user.uid);
      if (profile) {
        setAthleteProfile(profile);
      }
    }
  };

  const loadCommunications = async () => {
    if (selectedSchool && user) {
      try {
        console.log('Loading communications for school:', selectedSchool.name);
        const commsData = await getCommunications(selectedSchool.id, selectedCoach?.id, user.uid);
        console.log('Loaded communications:', commsData.length);
        
        // Sort communications by timestamp in descending order (newest first)
        const sortedComms = commsData
          .filter(comm => comm.schoolId === selectedSchool.id && comm.userId === user.uid)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        console.log('Filtered and sorted communications:', sortedComms.length);
        
        // Convert to threads with details
        const threadsWithDetails = sortedComms
          .filter(comm => !comm.parentId) // Get only parent messages
          .map(comm => {
            const coach = coaches.find(c => c.id === comm.coachId);
            if (!coach) {
              console.error('Coach not found for communication:', comm.id);
              return null;
            }

            // Find all replies for this thread
            const replies = sortedComms
              .filter(reply => reply.parentId === comm.id)
              .map(reply => ({
                ...reply,
                coach,
                school: selectedSchool
              }));

            const thread: CommunicationThread = {
              ...comm,
              school: selectedSchool,
              coach,
              replies: replies
            };
            
            return thread;
          }).filter((thread): thread is CommunicationThread => thread !== null);
        
        console.log('Final threads with details:', threadsWithDetails.length);
        setCommunications(threadsWithDetails);
      } catch (error) {
        console.error('Error loading communications:', error);
      }
    } else {
      console.log('No school selected or no user, clearing communications');
      setCommunications([]);
    }
  };

  // Clear state when user changes
  useEffect(() => {
    if (user) {
      loadSchools();
      loadCoaches();
      loadAthleteProfile();
    } else {
      // Clear all state when user logs out
      setSchools([]);
      setCoaches([]);
      setSelectedSchool(null);
      setSelectedCoach(null);
      setCommunications([]);
      setAthleteProfile(null);
      setIsEditingProfile(false);
      setShowMessageForm(false);
    }
  }, [user]);

  // Load communications when school/coach is selected
  useEffect(() => {
    loadCommunications();
  }, [selectedSchool, selectedCoach, coaches]);

  // Reload data periodically
  useEffect(() => {
    if (user) {
      // Initial load
      loadSchools();
      loadCoaches();
      
      // Set up periodic refresh
      const refreshInterval = setInterval(() => {
        loadSchools();
        loadCoaches();
        if (selectedSchool) {
          loadCommunications();
        }
      }, 30000); // Refresh every 30 seconds

      // Cleanup
      return () => clearInterval(refreshInterval);
    }
  }, [user, selectedSchool]);

  // Add logging to track schools state changes
  useEffect(() => {
    console.log('Schools state updated:', schools);
  }, [schools]);

  const handleSendMessage = async (messageData: Omit<Communication, 'id' | 'timestamp'>) => {
    if (!selectedSchool || !user) return;

    try {
      // Add the communication with required fields
      const messageId = await addCommunication({
        ...messageData,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      }, user.uid);
      
      // Find the coach for this message
      const coach = coaches.find(c => c.id === messageData.coachId);
      if (!coach) {
        throw new Error('Coach not found');
      }

      // Create the new thread
      const newThread: CommunicationThread = {
        id: messageId,
        ...messageData,
        userId: user.uid,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        coach,
        school: selectedSchool,
        replies: []
      };

      // Update the communications state with the new message at the beginning
      setCommunications(prev => [newThread, ...prev]);
      
      // Hide the message form
      setShowMessageForm(false);
      
      // Reload communications in the background to ensure everything is in sync
      loadCommunications();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleReply = async (content: string, parentId: string, coachId: string) => {
    if (!selectedSchool || !user) return;

    try {
      // Find the original message to get the coach ID
      const originalMessage = communications.find(comm => comm.id === parentId);
      if (!originalMessage) return;

      const replyData: Omit<Communication, 'id' | 'timestamp'> = {
        schoolId: selectedSchool.id,
        coachId: originalMessage.coachId,
        content,
        direction: 'outgoing',
        status: 'read',
        type: 'other',
        parentId,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add the reply to the database
      const replyId = await addCommunication(replyData, user.uid);

      // Create the new reply object
      const newReply: CommunicationWithCoach = {
        id: replyId,
        ...replyData,
        timestamp: new Date(),
        coach: originalMessage.coach,
        school: selectedSchool
      };

      // Update the communications state by adding the reply to the correct thread
      setCommunications(prev => prev.map(thread => {
        if (thread.id === parentId) {
          return {
            ...thread,
            replies: [newReply, ...thread.replies]
          };
        }
        return thread;
      }));

      // Reload communications in the background to ensure everything is in sync
      loadCommunications();
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const handleUpdateProfile = async (profileData: Omit<AthleteProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      if (athleteProfile) {
        await updateAthleteProfile(user.uid, profileData);
      } else {
        await createAthleteProfile(user.uid, profileData);
      }
      
      // Refresh profile
      const updatedProfile = await getAthleteProfile(user.uid);
      if (updatedProfile) {
        setAthleteProfile(updatedProfile);
      }
      
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      // Here you might want to show an error message to the user
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Banner */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="flex h-16">
          {/* Left side - Logo aligned with sidebar */}
          <div className="w-96 px-6 flex items-center space-x-2 border-r border-gray-100">
            <img 
              src="/images/vball.webp" 
              alt="SpikeScout Logo" 
              className="h-12 w-auto"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
              SpikeScout
            </h1>
          </div>
          {/* Right side - User avatar with dropdown */}
          <div className="flex-1 px-8 flex justify-end items-center">
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="text-sm font-medium text-blue-800">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      auth.signOut();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-96 bg-white shadow-lg overflow-y-auto border-r border-gray-100">
          {/* Athlete Profile */}
          <div className="p-6 border-b border-gray-100">
            {athleteProfile ? (
              <AthleteProfileView
                profile={athleteProfile}
                onEdit={() => setIsEditingProfile(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Your Profile</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Set up your athlete profile to start your recruitment journey
                </p>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Profile
                </button>
              </div>
            )}
          </div>
          
          {/* Schools List */}
          <div className="p-6">
            <SchoolsList
              schools={schools}
              coaches={coaches}
              selectedSchool={selectedSchool}
              selectedCoach={selectedCoach}
              onSelectSchool={setSelectedSchool}
              onSelectCoach={setSelectedCoach}
              onSchoolAdded={loadSchools}
              onSchoolUpdated={loadSchools}
              onCoachesUpdated={loadCoaches}
              userId={user.uid}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* School Header */}
          <div className="h-16 bg-white shadow-sm flex items-center justify-between px-8 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedSchool ? selectedSchool.name : 'Select a School'}
            </h2>
            {selectedSchool && (
              <button
                onClick={() => setShowMessageForm(true)}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 shadow-sm"
              >
                New Message/Note
              </button>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-auto p-8 bg-gray-50">
            {selectedSchool ? (
              <>
                <div className="space-y-6">
                  {showMessageForm && (
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">New Message</h3>
                        <button
                          onClick={() => setShowMessageForm(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <MessageForm
                        school={selectedSchool}
                        coaches={coaches.filter(coach => coach.schoolId === selectedSchool.id)}
                        athleteProfile={athleteProfile!}
                        onSubmit={handleSendMessage}
                      />
                    </div>
                  )}
                  {communications.map((thread) => (
                    <CommunicationThreadView 
                      key={thread.id} 
                      thread={thread}
                      onReply={handleReply}
                      userId={user.uid}
                      onDelete={() => {
                        // Remove the deleted thread from the state
                        setCommunications(prev => prev.filter(t => t.id !== thread.id));
                      }}
                    />
                  ))}
                  {communications.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-lg">No messages yet</p>
                      <p className="text-gray-400 text-sm mt-1">Click "New Message/Note" to start a conversation</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto text-center px-4 relative">
                {/* Decorative background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-1/4 -right-24 w-96 h-96 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full opacity-50 blur-3xl"></div>
                  <div className="absolute bottom-1/4 -left-24 w-96 h-96 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-full opacity-50 blur-3xl"></div>
                </div>

                {/* Main content */}
                <div className="relative bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100">
                  {/* Icon */}
                  <div className="mb-8">
                    <div className="relative mx-auto w-24">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full blur-lg opacity-20"></div>
                      <div className="relative bg-white p-4 rounded-full shadow-lg">
                        <svg className="h-16 w-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                    Your Volleyball Journey Starts Here
                  </h2>

                  {/* Description */}
                  <p className="text-gray-600 mb-8 text-lg">
                    Select a school from the sidebar to start managing your communications with coaches and tracking your recruitment progress.
                  </p>

                  {/* Features grid */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Organize Communications</h3>
                      <p className="text-sm text-gray-600">Keep track of all your conversations with coaches in one place</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">AI-Powered Messages</h3>
                      <p className="text-sm text-gray-600">Generate professional recruitment messages instantly</p>
                    </div>
                  </div>

                  {/* Call to action */}
                  <div className="inline-flex items-center space-x-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
                    <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="font-medium">Select a School to Begin</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <AthleteProfileForm
          profile={athleteProfile || { ...defaultAthleteProfile, id: '', createdAt: new Date(), updatedAt: new Date() }}
          onSubmit={handleUpdateProfile}
          onCancel={() => setIsEditingProfile(false)}
          userId={user.uid}
        />
      )}
    </div>
  );
}
