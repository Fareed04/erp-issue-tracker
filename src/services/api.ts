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
  onSnapshot,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { Issue, CreateIssuePayload, BulkUpdatePayload, UserProfile, ActivityLog, Comment, AppNotification } from '../types';

const ISSUES_COLLECTION = 'issues';
const USERS_COLLECTION = 'users';

export const checkPermission = async (userId: string | undefined, action: 'create' | 'update' | 'delete', issue?: Issue) => {
  if (!userId) throw new Error('Unauthorized');
  const profile = await getUserProfile(userId);
  const role = profile?.role || 'Developer';
  
  if (role === 'Admin') return true;
  
  if (action === 'delete') throw new Error('Only Admins can delete issues.');
  if (action === 'update' && issue) {
    if (role === 'Manager') return true;
    if (issue.assigneeUid !== userId && issue.reporterUid !== userId) {
      throw new Error('Developers can only update issues assigned to them or reported by them.');
    }
  }
  return true;
};

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

export const addComment = async (issueId: string, user: any, text: string) => {
  const now = new Date().toISOString();
  const commentData = {
    issueId,
    userId: user.uid,
    userName: user.displayName || 'Anonymous',
    userPhoto: user.photoURL || null,
    text,
    timestamp: now,
  };
  await addDoc(collection(db, ISSUES_COLLECTION, issueId, 'comments'), commentData);
  await logActivity(issueId, user, 'commented', 'Added a comment');
  
  // Notify assignee and reporter
  const issueDoc = await getDoc(doc(db, ISSUES_COLLECTION, issueId));
  if (issueDoc.exists()) {
    const issue = issueDoc.data() as Issue;
    const usersToNotify = new Set<string>();
    if (issue.assigneeUid && issue.assigneeUid !== user.uid) usersToNotify.add(issue.assigneeUid);
    if (issue.reporterUid && issue.reporterUid !== user.uid) usersToNotify.add(issue.reporterUid);
    
    for (const uid of usersToNotify) {
      const profile = await getUserProfile(uid);
      if (profile?.preferences?.notifyOnComment !== false) {
        await createNotification(uid, {
          title: 'New Comment',
          message: `${user.displayName || 'Someone'} commented on "${issue.title}"`,
          type: 'info',
          linkToIssueId: issueId,
        });
      }
    }
  }
};

export const subscribeToComments = (issueId: string, callback: (comments: Comment[]) => void) => {
  const q = query(collection(db, ISSUES_COLLECTION, issueId, 'comments'), orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
    callback(comments);
  });
};

export const createNotification = async (userId: string, data: Omit<AppNotification, 'id' | 'userId' | 'read' | 'timestamp'>) => {
  const now = new Date().toISOString();
  const notificationData = {
    ...data,
    userId,
    read: false,
    timestamp: now,
  };
  await addDoc(collection(db, USERS_COLLECTION, userId, 'notifications'), notificationData);
};

export const subscribeToNotifications = (userId: string, callback: (notifications: AppNotification[]) => void) => {
  const q = query(collection(db, USERS_COLLECTION, userId, 'notifications'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
    callback(notifications);
  });
};

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
  await updateDoc(doc(db, USERS_COLLECTION, userId, 'notifications', notificationId), { read: true });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const q = query(collection(db, USERS_COLLECTION, userId, 'notifications'), where('read', '==', false));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { read: true });
  });
  await batch.commit();
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
  if (user) {
    await checkPermission(user.uid, 'create');
  }

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
  
  if (payload.assigneeUid && payload.assigneeUid !== user?.uid) {
    const profile = await getUserProfile(payload.assigneeUid);
    if (profile?.preferences?.notifyOnAssign !== false) {
      await createNotification(payload.assigneeUid, {
        title: 'New Assignment',
        message: `You were assigned to "${payload.title}"`,
        type: 'info',
        linkToIssueId: docRef.id,
      });
    }
  }
  
  return { id: docRef.id, ...data } as Issue;
};

export const updateIssue = async (id: string, payload: Partial<Issue>, user: any): Promise<Issue> => {
  const docRef = doc(db, ISSUES_COLLECTION, id);
  const existingDoc = await getDoc(docRef);
  const existingData = existingDoc.data() as Issue;

  if (user) {
    await checkPermission(user.uid, 'update', existingData);
  }

  const now = new Date().toISOString();

  const data = {
    ...payload,
    updated_at: now,
  };
  await updateDoc(docRef, data);
  
  if (user && existingData) {
    const changes: string[] = [];
    let statusChanged = false;
    let assigneeChanged = false;
    
    if (payload.status && payload.status !== existingData.status) {
      changes.push(`status to '${payload.status.replace('_', ' ')}'`);
      statusChanged = true;
    }
    if (payload.priority && payload.priority !== existingData.priority) changes.push(`priority to '${payload.priority}'`);
    if (payload.assigneeUid !== undefined && payload.assigneeUid !== existingData.assigneeUid) {
      changes.push(`assignee to '${payload.assigneeName || 'Unassigned'}'`);
      assigneeChanged = true;
    }
    if (payload.title && payload.title !== existingData.title) changes.push(`title`);
    if (payload.description !== undefined && payload.description !== existingData.description) changes.push(`description`);
    if (payload.type && payload.type !== existingData.type) changes.push(`type to '${payload.type}'`);
    if (payload.dueDate !== undefined && payload.dueDate !== existingData.dueDate) changes.push(`due date`);
    
    if (changes.length > 0) {
      await logActivity(id, user, 'updated', `Updated ${changes.join(', ')}`);
    }
    
    // Notifications
    const title = payload.title || existingData.title;
    
    if (assigneeChanged && payload.assigneeUid && payload.assigneeUid !== user.uid) {
      const profile = await getUserProfile(payload.assigneeUid);
      if (profile?.preferences?.notifyOnAssign !== false) {
        await createNotification(payload.assigneeUid, {
          title: 'New Assignment',
          message: `You were assigned to "${title}"`,
          type: 'info',
          linkToIssueId: id,
        });
      }
    }
    
    if (statusChanged) {
      const usersToNotify = new Set<string>();
      const currentAssignee = payload.assigneeUid !== undefined ? payload.assigneeUid : existingData.assigneeUid;
      if (currentAssignee && currentAssignee !== user.uid) usersToNotify.add(currentAssignee);
      if (existingData.reporterUid && existingData.reporterUid !== user.uid) usersToNotify.add(existingData.reporterUid);
      
      for (const uid of usersToNotify) {
        const profile = await getUserProfile(uid);
        if (profile?.preferences?.notifyOnStatusChange !== false) {
          await createNotification(uid, {
            title: 'Status Changed',
            message: `"${title}" status changed to ${payload.status?.replace('_', ' ')}`,
            type: 'info',
            linkToIssueId: id,
          });
        }
      }
    }
  }

  const updatedDoc = await getDoc(docRef);
  return { id: updatedDoc.id, ...updatedDoc.data() } as Issue;
};

export const deleteIssue = async (id: string, user?: any): Promise<void> => {
  if (user) {
    await checkPermission(user.uid, 'delete');
  }
  const docRef = doc(db, ISSUES_COLLECTION, id);
  await deleteDoc(docRef);
};

export const bulkUpdateIssues = async (payload: BulkUpdatePayload, user: any): Promise<void> => {
  if (user) {
    const profile = await getUserProfile(user.uid);
    const role = profile?.role || 'Developer';
    if (role === 'Developer') {
      throw new Error('Developers cannot perform bulk updates.');
    }
  }

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
