export type IssueType = 'task' | 'bug' | 'issue';
export type IssueStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

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
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
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

export type CreateIssuePayload = Omit<Issue, 'id' | 'created_at' | 'updated_at'>;

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
