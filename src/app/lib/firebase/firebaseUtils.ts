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
  console.log('Fetching schools for userId:', userId);
  const schoolsRef = collection(db, 'schools');
  // Temporarily get all schools without userId filter
  const snapshot = await getDocs(schoolsRef);
  const schools = snapshot.docs.map(doc => {
    const data = doc.data();
    console.log('School data:', data); // Log each school's data
    return {
      id: doc.id,
      ...data,
      userId, // Add the current user's ID to each school
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as School;
  });
  console.log('Fetched schools:', schools);

  // Update each school to include the userId
  schools.forEach(async (school) => {
    const schoolRef = doc(db, 'schools', school.id);
    await updateDoc(schoolRef, {
      userId,
      updatedAt: serverTimestamp()
    });
    console.log('Updated school with userId:', school.id);
  });

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
  // Temporarily get all coaches without userId filter
  const snapshot = await getDocs(coachesRef);
  const coaches = snapshot.docs.map(doc => {
    const data = doc.data();
    console.log('Coach data:', data); // Log each coach's data
    return {
      id: doc.id,
      ...data,
      userId, // Add the current user's ID to each coach
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Coach;
  });
  console.log('Fetched coaches:', coaches);

  // Update each coach to include the userId
  coaches.forEach(async (coach) => {
    const coachRef = doc(db, 'coaches', coach.id);
    await updateDoc(coachRef, {
      userId,
      updatedAt: serverTimestamp()
    });
    console.log('Updated coach with userId:', coach.id);
  });

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
  console.log('Fetching communications for schoolId:', schoolId, 'userId:', userId);
  const commsRef = collection(db, 'communications');
  
  // Temporarily get all communications for the school without userId filter
  let q = query(commsRef, where('schoolId', '==', schoolId));
  if (coachId) {
    q = query(q, where('coachId', '==', coachId));
  }
  
  const snapshot = await getDocs(q);
  const communications = snapshot.docs.map(doc => {
    const data = doc.data();
    console.log('Communication data:', data); // Log each communication's data
    return {
      id: doc.id,
      ...data,
      userId: userId, // Add the current user's ID to each communication
      timestamp: data.timestamp?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Communication;
  });
  console.log('Fetched communications:', communications);

  // Update each communication to include the userId
  communications.forEach(async (comm) => {
    const commRef = doc(db, 'communications', comm.id);
    await updateDoc(commRef, {
      userId,
      updatedAt: serverTimestamp()
    });
    console.log('Updated communication with userId:', comm.id);
  });

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