import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  writeBatch,
  getDoc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { Issue, CreateIssuePayload, BulkUpdatePayload, UserProfile } from '../types';

const ISSUES_COLLECTION = 'issues';
const USERS_COLLECTION = 'users';

export const fetchIssues = async (): Promise<Issue[]> => {
  const q = query(collection(db, ISSUES_COLLECTION), orderBy('created_at', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Issue));
};

export const subscribeToIssues = (callback: (issues: Issue[]) => void) => {
  const q = query(collection(db, ISSUES_COLLECTION), orderBy('created_at', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const issues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Issue));
    callback(issues);
  });
};

export const createIssue = async (payload: CreateIssuePayload): Promise<Issue> => {
  const now = new Date().toISOString();
  const data = {
    ...payload,
    created_at: now,
    updated_at: now,
  };
  const docRef = await addDoc(collection(db, ISSUES_COLLECTION), data);
  return { id: docRef.id, ...data } as Issue;
};

export const updateIssue = async (id: string, payload: Partial<CreateIssuePayload>): Promise<Issue> => {
  const now = new Date().toISOString();
  const docRef = doc(db, ISSUES_COLLECTION, id);
  const data = {
    ...payload,
    updated_at: now,
  };
  await updateDoc(docRef, data);
  const updatedDoc = await getDoc(docRef);
  return { id: updatedDoc.id, ...updatedDoc.data() } as Issue;
};

export const deleteIssue = async (id: string): Promise<void> => {
  const docRef = doc(db, ISSUES_COLLECTION, id);
  await deleteDoc(docRef);
};

export const bulkUpdateIssues = async (payload: BulkUpdatePayload): Promise<void> => {
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  
  payload.ids.forEach(id => {
    const docRef = doc(db, ISSUES_COLLECTION, id);
    const updateData: any = { updated_at: now };
    if (payload.status) updateData.status = payload.status;
    if (payload.priority) updateData.priority = payload.priority;
    if (payload.assignee) {
      // Note: In a real app, you'd pass assigneeUid and possibly name/photo
      updateData.assigneeName = payload.assignee;
    }
    batch.update(docRef, updateData);
  });
  
  await batch.commit();
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { uid: snapshot.id, ...snapshot.data() } as UserProfile;
  }
  return null;
};

export const updateUserProfile = async (profile: UserProfile): Promise<void> => {
  const docRef = doc(db, USERS_COLLECTION, profile.uid);
  await setDoc(docRef, profile, { merge: true });
};

export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
};
