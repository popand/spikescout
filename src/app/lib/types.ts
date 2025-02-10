export type School = {
  id: string;
  name: string;
  location: string;
  division: string;
  programs: string[];
  athleticDetails: string;
  description: string;
  volleyballHistory: string;
  notes: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type AthleteProfile = {
  id: string;
  name: string;
  birthday: Date;
  description: string;
  interests: string[];
  avatarUrl?: string;
  stats: {
    position: string;
    height: string;
    verticalJump: string;
    approach: string;
    block: string;
    gpa: string;
    graduationYear: string;
    club: string;
  };
  mediaLinks: {
    type: 'youtube' | 'instagram' | 'hudl' | 'other';
    url: string;
    title: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

export type Coach = {
  id: string;
  name: string;
  title: string;
  schoolId: string;
  email: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Communication = {
  id: string;
  schoolId: string;
  coachId: string;
  content: string;
  direction: 'incoming' | 'outgoing';
  status: 'read' | 'unread';
  type: 'email' | 'phone' | 'visit' | 'other';
  timestamp: Date;
  parentId?: string;
};

export type CommunicationWithCoach = Communication & {
  coach: Coach;
};

export type CommunicationThread = CommunicationWithCoach & {
  school: School;
  replies: CommunicationWithCoach[];
}; 