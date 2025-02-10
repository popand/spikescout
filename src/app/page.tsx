'use client';

import { useState, useEffect } from 'react';
import { School, Coach, Communication, CommunicationThread, AthleteProfile } from './lib/types';
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

  const loadSchools = async () => {
    if (user) {
      const schoolsData = await getSchools();
      setSchools(schoolsData);
    }
  };

  const loadCoaches = async () => {
    if (user) {
      const coachesData = await getCoaches();
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
    if (selectedSchool) {
      try {
        console.log('Loading communications for school:', selectedSchool.name);
        const commsData = await getCommunications(selectedSchool.id, selectedCoach?.id);
        console.log('Loaded communications:', commsData.length);
        
        // Sort communications by timestamp in descending order (newest first)
        const sortedComms = commsData.filter(comm => comm.schoolId === selectedSchool.id)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        console.log('Filtered and sorted communications:', sortedComms.length);
        
        const threadsWithDetails: CommunicationThread[] = sortedComms.map(comm => ({
          ...comm,
          school: selectedSchool,
          coach: coaches.find(c => c.id === comm.coachId)!,
          replies: comm.replies?.filter(reply => reply.schoolId === selectedSchool.id)
            .map(reply => ({
              ...reply,
              school: selectedSchool,
              coach: coaches.find(c => c.id === reply.coachId)!
            }))
        }));
        console.log('Final threads with details:', threadsWithDetails.length);
        setCommunications(threadsWithDetails);
      } catch (error) {
        console.error('Error loading communications:', error);
      }
    } else {
      console.log('No school selected, clearing communications');
      setCommunications([]);
    }
  };

  // Load initial data
  useEffect(() => {
    if (user) {
      loadSchools();
      loadCoaches();
      loadAthleteProfile();
    }
  }, [user]);

  // Load communications when school/coach is selected
  useEffect(() => {
    loadCommunications();
  }, [selectedSchool, selectedCoach, coaches]);

  const handleSendMessage = async (messageData: Omit<Communication, 'id' | 'timestamp'>) => {
    if (!selectedSchool) return;

    try {
      // Add the communication
      const messageId = await addCommunication(messageData);
      
      // Find the coach for this message
      const coach = coaches.find(c => c.id === messageData.coachId);
      if (!coach) {
        throw new Error('Coach not found');
      }

      // Create the new thread with the current timestamp
      const newThread: CommunicationThread = {
        id: messageId,
        ...messageData,
        timestamp: new Date(),
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
      // You might want to show an error message to the user here
    }
  };

  const handleReply = async (content: string, parentId: string, coachId: string) => {
    if (!selectedSchool) return;

    try {
      // Find the original message to get the coach ID
      const originalMessage = communications.find(comm => comm.id === parentId);
      if (!originalMessage) return;

      // Add the reply to the database
      const replyId = await addCommunication({
        schoolId: selectedSchool.id,
        coachId: originalMessage.coachId,
        content,
        direction: 'outgoing',
        status: 'read',
        type: 'other',
        parentId
      });

      // Find the coach for this reply
      const coach = coaches.find(c => c.id === originalMessage.coachId);
      if (!coach) {
        throw new Error('Coach not found');
      }

      // Create the new reply object
      const newReply = {
        id: replyId,
        schoolId: selectedSchool.id,
        coachId: originalMessage.coachId,
        content,
        direction: 'outgoing' as const,
        status: 'read' as const,
        type: 'other' as const,
        timestamp: new Date(),
        parentId,
        coach,
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
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">SpikeScout</h1>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={() => auth.signOut()}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors duration-150"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[28rem] bg-white shadow-lg overflow-y-auto border-r border-gray-100">
          {/* Athlete Profile */}
          <div className="p-6 border-b border-gray-100">
            {athleteProfile ? (
              <AthleteProfileView
                profile={athleteProfile}
                onEdit={() => setIsEditingProfile(true)}
              />
            ) : (
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold text-gray-900">Welcome to SpikeScout</h3>
                <p className="mt-3 text-sm text-gray-600">
                  Start by creating your athlete profile
                </p>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="mt-6 px-6 py-2.5 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150"
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
                      <MessageForm
                        school={selectedSchool}
                        coaches={coaches.filter(coach => coach.schoolId === selectedSchool.id)}
                        onSubmit={handleSendMessage}
                      />
                    </div>
                  )}
                  {communications.map((thread) => (
                    <CommunicationThreadView 
                      key={thread.id} 
                      thread={thread}
                      onReply={handleReply}
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
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg className="h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <p className="text-lg">Select a school to view communications</p>
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
