import {
  collection,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  where,
  serverTimestamp,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { School, Coach, Communication, AthleteProfile, CommunicationThread } from '../types';

// Schools
export const addSchool = async (schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => {
  const docRef = await addDoc(collection(db, 'schools'), {
    ...schoolData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateSchool = async (
  schoolId: string,
  schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const docRef = doc(db, 'schools', schoolId);
  await updateDoc(docRef, {
    ...schoolData,
    updatedAt: serverTimestamp(),
  });
};

export const getSchools = async () => {
  const schoolsRef = collection(db, 'schools');
  const q = query(schoolsRef, orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as School[];
};

// Coaches
export const addCoach = async (coachData: Omit<Coach, 'id' | 'createdAt' | 'updatedAt'>) => {
  const docRef = await addDoc(collection(db, 'coaches'), {
    ...coachData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateCoach = async (
  coachId: string,
  coachData: Omit<Coach, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const docRef = doc(db, 'coaches', coachId);
  await updateDoc(docRef, {
    ...coachData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCoach = async (coachId: string) => {
  const docRef = doc(db, 'coaches', coachId);
  await deleteDoc(docRef);
};

export const getCoaches = async (schoolId?: string) => {
  const coachesRef = collection(db, 'coaches');
  const q = schoolId
    ? query(coachesRef, where('schoolId', '==', schoolId), orderBy('name'))
    : query(coachesRef, orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Coach[];
};

// Communications
export const addCommunication = async (
  communicationData: Omit<Communication, 'id' | 'timestamp'>
) => {
  const docRef = await addDoc(collection(db, 'communications'), {
    ...communicationData,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
};

export const getCommunications = async (schoolId: string, coachId?: string): Promise<CommunicationThread[]> => {
  console.log('Fetching communications for school:', schoolId);
  const commsRef = collection(db, 'communications');
  
  try {
    // Get the school data first
    const schoolDoc = await getDoc(doc(db, 'schools', schoolId));
    if (!schoolDoc.exists()) {
      console.error('School not found:', schoolId);
      return [];
    }
    const schoolData = schoolDoc.data();
    console.log('Found school data:', schoolData);

    const school = {
      id: schoolDoc.id,
      ...schoolData,
      createdAt: schoolData.createdAt?.toDate() || new Date(),
      updatedAt: schoolData.updatedAt?.toDate() || new Date()
    } as School;

    // Get all coaches for this school
    const schoolCoaches = await getCoaches(schoolId);
    console.log('Found coaches:', schoolCoaches.length);

    // Query for all messages for this school
    const messagesQuery = query(
      commsRef,
      where('schoolId', '==', schoolId)
    );

    const messagesSnapshot = await getDocs(messagesQuery);
    console.log('Total messages found:', messagesSnapshot.docs.length);

    // Separate main messages and replies
    const mainMessages: any[] = [];
    const repliesMap = new Map<string, any[]>();

    messagesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
      const messageData = {
        id: doc.id,
        ...data,
        timestamp
      };

      if (!data.parentId) {
        mainMessages.push(messageData);
      } else {
        if (!repliesMap.has(data.parentId)) {
          repliesMap.set(data.parentId, []);
        }
        repliesMap.get(data.parentId)?.push(messageData);
      }
    });

    console.log('Main messages count:', mainMessages.length);
    console.log('Replies map size:', repliesMap.size);

    // Build the threads
    const threads: CommunicationThread[] = mainMessages.map(message => {
      const coach = schoolCoaches.find(c => c.id === message.coachId);
      if (!coach) {
        console.log('Coach not found for message:', message.id);
        return null;
      }

      const replies = (repliesMap.get(message.id) || [])
        .map(reply => {
          const replyCoach = schoolCoaches.find(c => c.id === reply.coachId);
          if (!replyCoach) return null;
          return {
            ...reply,
            coach: replyCoach,
            school
          };
        })
        .filter(reply => reply !== null)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return {
        ...message,
        coach,
        school,
        replies
      };
    })
    .filter(thread => thread !== null)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    console.log('Final threads count:', threads.length);
    return threads;
  } catch (error) {
    console.error('Error fetching communications:', error);
    return [];
  }
};

export const markAsRead = async (communicationId: string) => {
  const docRef = doc(db, 'communications', communicationId);
  await updateDoc(docRef, {
    status: 'read'
  });
};

// Athlete Profile
export const getAthleteProfile = async (userId: string) => {
  try {
    const docRef = doc(db, 'athletes', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Convert Firestore Timestamp to Date
      return {
        id: docSnap.id,
        ...data,
        birthday: data.birthday?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as AthleteProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting athlete profile:', error);
    throw error;
  }
};

export const updateAthleteProfile = async (
  userId: string,
  profileData: Omit<AthleteProfile, 'id' | 'createdAt' | 'updatedAt'>
) => {
  try {
    const docRef = doc(db, 'athletes', userId);
    await updateDoc(docRef, {
      ...profileData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating athlete profile:', error);
    throw error;
  }
};

export const createAthleteProfile = async (
  userId: string,
  profileData: Omit<AthleteProfile, 'id' | 'createdAt' | 'updatedAt'>
) => {
  try {
    // Use setDoc instead of updateDoc for new profiles
    const docRef = doc(db, 'athletes', userId);
    await setDoc(docRef, {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return userId;
  } catch (error) {
    console.error('Error creating athlete profile:', error);
    throw error;
  }
};

// Avatar Upload
export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  try {
    const storageRef = ref(storage, `avatars/${userId}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

export const deleteAvatar = async (userId: string) => {
  try {
    const storageRef = ref(storage, `avatars/${userId}`);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting avatar:', error);
    // Don't throw error if file doesn't exist
    if ((error as any).code !== 'storage/object-not-found') {
      throw error;
    }
  }
}; 