import { Issue } from '../types';

export type NormalizedRelation = 'blocks' | 'blocked_by' | 'relates_to';

export interface ResolvedDependency {
  id: string;
  relation: NormalizedRelation;
  targetIssue: Issue;
  isBlockerActive: boolean; // For 'blocked_by': true if targetIssue.status !== 'done'
  direction: 'outgoing' | 'incoming';
}

export interface IssueDependencies {
  all: ResolvedDependency[];
  blocks: ResolvedDependency[];
  blockedBy: ResolvedDependency[];
  relatesTo: ResolvedDependency[];
  activeBlockersCount: number;
  isBlocked: boolean;
  hasBlockersResolved: boolean;
}

/**
 * Resolves all direct (outgoing) and inferred (incoming) dependencies for an issue.
 * E.g., if Issue A blocks Issue B:
 *   - On Issue A, Issue B appears in `blocks`
 *   - On Issue B, Issue A appears in `blockedBy`
 */
export function resolveDependencies(issue: Issue, allIssues: Issue[] = []): IssueDependencies {
  if (!issue) {
    return {
      all: [],
      blocks: [],
      blockedBy: [],
      relatesTo: [],
      activeBlockersCount: 0,
      isBlocked: false,
      hasBlockersResolved: false,
    };
  }

  const issuesMap = new Map<string, Issue>();
  allIssues.forEach((i) => issuesMap.set(i.id, i));

  const resolvedList: ResolvedDependency[] = [];
  const seenKeys = new Set<string>();

  // 1. Direct links on this issue (outgoing)
  if (issue.links && Array.isArray(issue.links)) {
    for (const link of issue.links) {
      if (!link.targetIssueId || link.targetIssueId === issue.id) continue;
      const target = issuesMap.get(link.targetIssueId);
      if (!target) continue;

      let normalized: NormalizedRelation = 'relates_to';
      if (link.type === 'blocks') {
        normalized = 'blocks';
      } else if (link.type === 'blocked_by' || link.type === 'is_blocked_by') {
        normalized = 'blocked_by';
      }

      const key = `${normalized}:${target.id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        resolvedList.push({
          id: link.id || `dir-${target.id}`,
          relation: normalized,
          targetIssue: target,
          isBlockerActive: normalized === 'blocked_by' && target.status !== 'done',
          direction: 'outgoing',
        });
      }
    }
  }

  // 2. Inverse links defined on other issues pointing to this issue (incoming)
  for (const other of allIssues) {
    if (other.id === issue.id || !other.links || !Array.isArray(other.links)) continue;

    for (const link of other.links) {
      if (link.targetIssueId === issue.id) {
        let inverse: NormalizedRelation = 'relates_to';
        if (link.type === 'blocks') {
          // Other blocks this => this is blocked_by other
          inverse = 'blocked_by';
        } else if (link.type === 'blocked_by' || link.type === 'is_blocked_by') {
          // Other is blocked by this => this blocks other
          inverse = 'blocks';
        }

        const key = `${inverse}:${other.id}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          resolvedList.push({
            id: `inv-${other.id}-${link.id}`,
            relation: inverse,
            targetIssue: other,
            isBlockerActive: inverse === 'blocked_by' && other.status !== 'done',
            direction: 'incoming',
          });
        }
      }
    }
  }

  const blocks = resolvedList.filter((d) => d.relation === 'blocks');
  const blockedBy = resolvedList.filter((d) => d.relation === 'blocked_by');
  const relatesTo = resolvedList.filter((d) => d.relation === 'relates_to');
  const activeBlockers = blockedBy.filter((d) => d.isBlockerActive);

  return {
    all: resolvedList,
    blocks,
    blockedBy,
    relatesTo,
    activeBlockersCount: activeBlockers.length,
    isBlocked: activeBlockers.length > 0,
    hasBlockersResolved: blockedBy.length > 0 && activeBlockers.length === 0,
  };
}

export function formatDependencyLabel(relation: NormalizedRelation): string {
  switch (relation) {
    case 'blocks':
      return 'Blocks';
    case 'blocked_by':
      return 'Blocked By';
    case 'relates_to':
      return 'Relates To';
    default:
      return 'Related';
  }
}
