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
export const addSchool = async (schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>, userId: string) => {
  const schoolsRef = collection(db, 'schools');
  const docRef = await addDoc(schoolsRef, {
    ...schoolData,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateSchool = async (
  schoolId: string, 
  schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
) => {
  const schoolRef = doc(db, 'schools', schoolId);
  const schoolDoc = await getDoc(schoolRef);
  
  if (!schoolDoc.exists() || schoolDoc.data()?.userId !== userId) {
    throw new Error('Unauthorized or school not found');
  }
  
  await updateDoc(schoolRef, {
    ...schoolData,
    updatedAt: serverTimestamp(),
  });
};

export const getSchools = async (userId: string) => {
  if (!userId) {
    console.error('No userId provided for getSchools');
    return [];
  }

  console.log('Fetching schools for userId:', userId);
  const schoolsRef = collection(db, 'schools');
  
  // Create query with userId filter
  const q = query(schoolsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  
  console.log('Found', snapshot.docs.length, 'schools for user');
  
  const schools = snapshot.docs.map(doc => {
    const data = doc.data();
    console.log('School data:', { id: doc.id, ...data });
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as School;
  });
  
  console.log('Processed schools:', schools);
  return schools;
};

// Coaches
export const addCoach = async (coachData: Omit<Coach, 'id' | 'createdAt' | 'updatedAt'>, userId: string) => {
  const coachesRef = collection(db, 'coaches');
  const docRef = await addDoc(coachesRef, {
    ...coachData,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateCoach = async (
  coachId: string, 
  coachData: Omit<Coach, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
) => {
  const coachRef = doc(db, 'coaches', coachId);
  const coachDoc = await getDoc(coachRef);
  
  if (!coachDoc.exists() || coachDoc.data()?.userId !== userId) {
    throw new Error('Unauthorized or coach not found');
  }
  
  await updateDoc(coachRef, {
    ...coachData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCoach = async (coachId: string, userId: string) => {
  const coachRef = doc(db, 'coaches', coachId);
  const coachDoc = await getDoc(coachRef);
  
  if (!coachDoc.exists() || coachDoc.data()?.userId !== userId) {
    throw new Error('Unauthorized or coach not found');
  }
  
  await deleteDoc(coachRef);
};

export const getCoaches = async (userId: string) => {
  console.log('Fetching coaches for userId:', userId);
  const coachesRef = collection(db, 'coaches');
  const q = query(coachesRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  
  const coaches = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Coach;
  });
  
  console.log('Fetched coaches:', coaches);
  return coaches;
};

// Communications
export const addCommunication = async (
  messageData: Omit<Communication, 'id' | 'timestamp'>,
  userId: string
) => {
  const commsRef = collection(db, 'communications');
  const docRef = await addDoc(commsRef, {
    ...messageData,
    userId,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
};

export const getCommunications = async (schoolId: string, coachId?: string, userId?: string) => {
  if (!userId) {
    console.error('No userId provided for getCommunications');
    return [];
  }

  console.log('Fetching communications for schoolId:', schoolId, 'userId:', userId);
  const commsRef = collection(db, 'communications');
  
  // Create query with userId and schoolId filters
  let q = query(
    commsRef, 
    where('userId', '==', userId),
    where('schoolId', '==', schoolId)
  );
  
  if (coachId) {
    q = query(q, where('coachId', '==', coachId));
  }
  
  const snapshot = await getDocs(q);
  const communications = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Communication;
  });
  
  console.log('Fetched communications:', communications);
  return communications;
};

export const markAsRead = async (communicationId: string) => {
  const docRef = doc(db, 'communications', communicationId);
  await updateDoc(docRef, {
    status: 'read'
  });
};

export const updateCommunication = async (
  communicationId: string,
  messageData: Partial<Communication>,
  userId: string
) => {
  const commRef = doc(db, 'communications', communicationId);
  const commDoc = await getDoc(commRef);
  
  if (!commDoc.exists() || commDoc.data()?.userId !== userId) {
    throw new Error('Unauthorized or communication not found');
  }
  
  await updateDoc(commRef, {
    ...messageData,
    updatedAt: serverTimestamp()
  });
};

export const deleteCommunication = async (communicationId: string, userId: string) => {
  const commRef = doc(db, 'communications', communicationId);
  const commDoc = await getDoc(commRef);
  
  if (!commDoc.exists() || commDoc.data()?.userId !== userId) {
    throw new Error('Unauthorized or communication not found');
  }
  
  await deleteDoc(commRef);
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