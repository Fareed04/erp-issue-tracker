export type IssueType = 'task' | 'bug' | 'issue';
export type IssueStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export type UserRole = 'Admin' | 'Manager' | 'Developer';

export type IssueLinkType = 'blocks' | 'is_blocked_by' | 'relates_to';

export interface IssueLink {
  id: string;
  type: IssueLinkType;
  targetIssueId: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeUid: string | null;
  assigneeName: string | null;
  assigneePhoto: string | null;
  reporterUid: string;
  reporterName: string;
  reporterPhoto: string | null;
  delay_cause: string | null;
  dueDate?: string | null;
  deadlineNotified?: boolean;
  links?: IssueLink[];
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  notifyOnAssign: boolean;
  notifyOnStatusChange: boolean;
  notifyOnComment: boolean;
  notifyOnDeadline: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role?: UserRole;
  preferences?: NotificationPreferences;
  tutorialCompleted?: boolean;
  tutorialStep?: number;
}

export interface ActivityLog {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  action: string;
  details: string;
  timestamp: string;
}

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  text: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  linkToIssueId?: string;
  timestamp: string;
}

export type CreateIssuePayload = Omit<Issue, 'id' | 'created_at' | 'updated_at' | 'deadlineNotified'>;

export interface BulkUpdatePayload {
  ids: string[];
  status?: IssueStatus;
  priority?: IssuePriority;
  assignee?: string;
}

export interface FilterOptions {
  search: string;
  assignee: string;
  reporter: string;
  status: string;
  priority: string;
  type: string;
  startDate: string;
  endDate: string;
}
