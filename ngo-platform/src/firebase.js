import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  doc, 
  onSnapshot, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Reports
export const addReport = async (reportData) => {
  const docRef = await addDoc(collection(db, 'reports'), {
    ...reportData,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateReport = async (docId, fields) => {
  const docRef = doc(db, 'reports', docId);
  await updateDoc(docRef, fields);
};

export const getReports = async () => {
  const querySnapshot = await getDocs(collection(db, 'reports'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getReport = async (docId) => {
  const docRef = doc(db, 'reports', docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const subscribeToReports = (callback) => {
  return onSnapshot(collection(db, 'reports'), (snapshot) => {
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(reports);
  });
};

// Volunteers
export const addVolunteer = async (volunteerData) => {
  const docRef = await addDoc(collection(db, 'volunteers'), {
    ...volunteerData,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const getVolunteers = async () => {
  const querySnapshot = await getDocs(collection(db, 'volunteers'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Tasks
export const addTask = async (taskData) => {
  const docRef = await addDoc(collection(db, 'tasks'), {
    ...taskData,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateTask = async (docId, fields) => {
  const docRef = doc(db, 'tasks', docId);
  await updateDoc(docRef, fields);
};

export const getTasksForVolunteer = async (volunteerId) => {
  const q = query(collection(db, 'tasks'), where('volunteerId', '==', volunteerId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
