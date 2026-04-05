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
import { Issue, CreateIssuePayload, BulkUpdatePayload, UserProfile, ActivityLog } from '../types';

const ISSUES_COLLECTION = 'issues';
const USERS_COLLECTION = 'users';

export const logActivity = async (
  issueId: string,
  user: { uid: string; displayName: string | null; photoURL: string | null },
  action: string,
  details: string
) => {
  const now = new Date().toISOString();
  const activityData = {
    issueId,
    userId: user.uid,
    userName: user.displayName || 'Anonymous',
    userPhoto: user.photoURL || null,
    action,
    details,
    timestamp: now,
  };
  await addDoc(collection(db, ISSUES_COLLECTION, issueId, 'activities'), activityData);
};

export const subscribeToIssueActivities = (issueId: string, callback: (activities: ActivityLog[]) => void) => {
  const q = query(collection(db, ISSUES_COLLECTION, issueId, 'activities'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
    callback(activities);
  });
};

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

export const createIssue = async (payload: CreateIssuePayload, user: any): Promise<Issue> => {
  const now = new Date().toISOString();
  const data = {
    ...payload,
    created_at: now,
    updated_at: now,
  };
  const docRef = await addDoc(collection(db, ISSUES_COLLECTION), data);
  if (user) {
    await logActivity(docRef.id, user, 'created', 'Created the issue');
  }
  return { id: docRef.id, ...data } as Issue;
};

export const updateIssue = async (id: string, payload: Partial<CreateIssuePayload>, user: any): Promise<Issue> => {
  const now = new Date().toISOString();
  const docRef = doc(db, ISSUES_COLLECTION, id);
  
  const existingDoc = await getDoc(docRef);
  const existingData = existingDoc.data() as Issue;

  const data = {
    ...payload,
    updated_at: now,
  };
  await updateDoc(docRef, data);
  
  if (user && existingData) {
    const changes: string[] = [];
    if (payload.status && payload.status !== existingData.status) changes.push(`status to '${payload.status.replace('_', ' ')}'`);
    if (payload.priority && payload.priority !== existingData.priority) changes.push(`priority to '${payload.priority}'`);
    if (payload.assigneeName !== undefined && payload.assigneeName !== existingData.assigneeName) changes.push(`assignee to '${payload.assigneeName || 'Unassigned'}'`);
    if (payload.title && payload.title !== existingData.title) changes.push(`title`);
    if (payload.description !== undefined && payload.description !== existingData.description) changes.push(`description`);
    if (payload.type && payload.type !== existingData.type) changes.push(`type to '${payload.type}'`);
    
    if (changes.length > 0) {
      await logActivity(id, user, 'updated', `Updated ${changes.join(', ')}`);
    }
  }

  const updatedDoc = await getDoc(docRef);
  return { id: updatedDoc.id, ...updatedDoc.data() } as Issue;
};

export const deleteIssue = async (id: string): Promise<void> => {
  const docRef = doc(db, ISSUES_COLLECTION, id);
  await deleteDoc(docRef);
};

export const bulkUpdateIssues = async (payload: BulkUpdatePayload, user: any): Promise<void> => {
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  
  const changes: string[] = [];
  if (payload.status) changes.push(`status to '${payload.status.replace('_', ' ')}'`);
  if (payload.priority) changes.push(`priority to '${payload.priority}'`);
  if (payload.assignee) changes.push(`assignee to '${payload.assignee}'`);
  
  const details = `Bulk updated ${changes.join(', ')}`;

  payload.ids.forEach(id => {
    const docRef = doc(db, ISSUES_COLLECTION, id);
    const updateData: any = { updated_at: now };
    if (payload.status) updateData.status = payload.status;
    if (payload.priority) updateData.priority = payload.priority;
    if (payload.assignee) {
      updateData.assigneeName = payload.assignee;
    }
    batch.update(docRef, updateData);
    
    if (user && changes.length > 0) {
      const activityRef = doc(collection(db, ISSUES_COLLECTION, id, 'activities'));
      batch.set(activityRef, {
        issueId: id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhoto: user.photoURL || null,
        action: 'bulk_updated',
        details,
        timestamp: now,
      });
    }
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
