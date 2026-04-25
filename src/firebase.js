import { initializeApp } from 'firebase/app'
import {
  getFirestore, collection, addDoc, updateDoc, doc,
  onSnapshot, getDocs, query, orderBy, where,
  serverTimestamp
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// ─── REPORTS ────────────────────────────────────────────────

export const addReport = async (data) => {
  const ref = await addDoc(collection(db, 'reports'), {
    ...data,
    createdAt: serverTimestamp(),
    aiStatus: 'pending',
    urgencyScore: null,
    urgencyLevel: null,
    aiSummary: null,
    aiActionCategory: null,
    aiReason: null,
    status: 'open',
    assignedTaskId: null,
  })
  return ref.id
}

export const updateReport = async (id, fields) => {
  await updateDoc(doc(db, 'reports', id), fields)
}

export const subscribeToReports = (callback) => {
  const q = query(collection(db, 'reports'), orderBy('urgencyScore', 'desc'))
  return onSnapshot(q, 
    (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    },
    (err) => {
      console.error('Firestore Error:', err)
      if (err.message.includes('index')) {
        alert('⚠️ Firestore index required! Please click the link in your browser console to create it.')
      }
    }
  )
}

export const getReports = async () => {
  const snap = await getDocs(collection(db, 'reports'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── VOLUNTEERS ─────────────────────────────────────────────

export const addVolunteer = async (data) => {
  const ref = await addDoc(collection(db, 'volunteers'), {
    ...data,
    registeredAt: serverTimestamp(),
    tasksCompleted: 0,
    reliabilityScore: 50,
  })
  return ref.id
}

export const getVolunteers = async () => {
  const snap = await getDocs(collection(db, 'volunteers'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── TASKS ──────────────────────────────────────────────────

export const addTask = async (data) => {
  const ref = await addDoc(collection(db, 'tasks'), {
    ...data,
    createdAt: serverTimestamp(),
    statusHistory: [{ status: 'assigned', at: new Date().toISOString() }],
    completionNote: null,
    completionPhotoUrl: null,
  })
  return ref.id
}

export const updateTask = async (id, fields) => {
  await updateDoc(doc(db, 'tasks', id), fields)
}

export const getTasksForVolunteer = (volunteerId, callback) => {
  const q = query(collection(db, 'tasks'), where('volunteerId', '==', volunteerId))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}
