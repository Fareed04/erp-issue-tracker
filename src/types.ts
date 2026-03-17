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
  assignee: string | null;
  delay_cause: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateIssuePayload = Omit<Issue, 'id' | 'created_at' | 'updated_at'>;
