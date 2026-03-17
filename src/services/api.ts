import { Issue, CreateIssuePayload, BulkUpdatePayload } from '../types';

export const fetchIssues = async (): Promise<Issue[]> => {
  const response = await fetch('/api/issues');
  if (!response.ok) throw new Error('Failed to fetch issues');
  return response.json();
};

export const createIssue = async (payload: CreateIssuePayload): Promise<Issue> => {
  const response = await fetch('/api/issues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create issue');
  return response.json();
};

export const updateIssue = async (id: string, payload: Partial<CreateIssuePayload>): Promise<Issue> => {
  const response = await fetch(`/api/issues/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to update issue');
  return response.json();
};

export const deleteIssue = async (id: string): Promise<void> => {
  const response = await fetch(`/api/issues/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete issue');
};

export const bulkUpdateIssues = async (payload: BulkUpdatePayload): Promise<void> => {
  const response = await fetch('/api/issues/bulk', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to perform bulk update');
};
