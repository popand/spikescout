export interface BaseModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface School extends BaseModel {
  name: string;
  location: string;
  division: string;
  description: string;
  athleticDetails: string;
  volleyballHistory: string;
  programs: string[];
  notes?: string;
  tags?: string[];
}

export interface Coach extends BaseModel {
  name: string;
  title: string;
  email: string;
  phone?: string;
  schoolId: string;
}

export type MessageType = 'email' | 'phone' | 'visit' | 'other';
export type MessageDirection = 'incoming' | 'outgoing';
export type MessageStatus = 'read' | 'unread';

export interface Communication extends BaseModel {
  content: string;
  type: MessageType;
  direction: MessageDirection;
  status: MessageStatus;
  schoolId: string;
  coachId: string;
  parentId?: string;
  timestamp: Date;
}

export interface CommunicationWithCoach extends Communication {
  coach: Coach;
  school: School;
}

export interface CommunicationThread extends CommunicationWithCoach {
  replies: CommunicationWithCoach[];
}

export interface AthleteProfile extends BaseModel {
  name: string;
  birthday: Date;
  description: string;
  interests: string[];
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
    type: string;
    url: string;
    title: string;
  }[];
  avatarUrl?: string;
} 