// Git Integration Types

export type GitProvider = 'GITHUB' | 'GITLAB' | 'BITBUCKET';

export interface GitIntegrationResponse {
  id: number;
  organizationId: number;
  projectId: number | null;
  provider: GitProvider;
  repositoryUrl: string;
  repositoryOwner: string;
  repositoryName: string;
  repositoryFullName: string;

  // Webhook status
  webhookId: string | null;
  webhookUrl: string | null;
  webhookActive: boolean | null;

  // Settings
  autoLinkEnabled: boolean;
  smartCommitsEnabled: boolean;
  autoCloseOnMerge: boolean;
  branchPrefix: string | null;

  // Status
  isActive: boolean;
  lastSyncAt: string | null;

  // Timestamps
  createdAt: string;
  createdByUsername: string;

  // Statistics
  branchCount: number | null;
  commitCount: number | null;
  pullRequestCount: number | null;
}

export interface CreateGitIntegrationRequest {
  projectId: number | null;
  provider: GitProvider;
  repositoryUrl: string;
  accessToken: string;
  autoLinkEnabled?: boolean;
  smartCommitsEnabled?: boolean;
  autoCloseOnMerge?: boolean;
  branchPrefix?: string;
}

export interface UpdateGitIntegrationRequest {
  accessToken?: string;
  autoLinkEnabled?: boolean;
  smartCommitsEnabled?: boolean;
  autoCloseOnMerge?: boolean;
  branchPrefix?: string;
  isActive?: boolean;
}

export interface CommitResponse {
  id: number;
  gitIntegrationId: number;
  commitSha: string;
  shortSha: string;
  parentSha: string | null;
  branchName: string;

  // Author info
  authorName: string;
  authorEmail: string;
  authorDate: string;
  committerName: string;
  committerEmail: string;
  committerDate: string;

  // Commit details
  message: string;
  messageBody: string | null;

  // Stats
  linesAdded: number | null;
  linesDeleted: number | null;
  filesChanged: number | null;

  // External link
  commitUrl: string;

  // Linked tasks
  linkedTaskKeys: string[];

  // Smart commands
  smartCommands: string[];

  createdAt: string;
}

export interface PullRequestResponse {
  id: number;
  gitIntegrationId: number;
  gitBranchId: number | null;
  prNumber: number;
  prTitle: string;
  prDescription: string | null;
  prUrl: string;
  status: 'OPEN' | 'CLOSED' | 'MERGED';
  sourceBranch: string;
  targetBranch: string;
  headCommitSha: string;

  // Author info
  authorUsername: string;
  authorName: string | null;
  authorEmail: string | null;

  // Review info
  reviewers: string[];
  approvalsCount: number;
  requiredApprovals: number | null;
  approved: boolean | null;

  // Checks
  checksStatus: string | null;
  checksCount: number;
  checksPassed: number;
  checks: any[];
  allChecksPassed: boolean;

  // Merge info
  mergeable: boolean | null;
  merged: boolean;
  mergedAt: string | null;
  mergedBy: string | null;
  mergeCommitSha: string | null;

  // Linked tasks
  linkedTaskKeys: string[];
  closesTask: boolean;

  // Dates
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;

  // Legacy fields for backward compatibility (can be removed later)
  title?: string;
  description?: string | null;
  state?: 'OPEN' | 'CLOSED' | 'MERGED';
  isDraft?: boolean;
  authorAvatarUrl?: string | null;
  commitsCount?: number | null;
  changedFilesCount?: number | null;
  additionsCount?: number | null;
  deletionsCount?: number | null;
}

export type BranchStatus = 'ACTIVE' | 'MERGED' | 'DELETED';

export interface BranchResponse {
  id: number;
  gitIntegrationId: number;
  taskId: number;
  taskKey: string;
  branchName: string;
  branchUrl: string | null;
  status: BranchStatus;
  baseBranch: string | null;
  headCommitSha: string | null;
  createdAt: string;
  createdByUsername: string | null;
  mergedAt: string | null;
  deletedAt: string | null;
}
