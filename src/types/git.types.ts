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
  prNumber: number;
  title: string;
  description: string | null;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  isDraft: boolean;

  // Author info
  authorName: string;
  authorAvatarUrl: string | null;

  // Branch info
  sourceBranch: string;
  targetBranch: string;

  // Dates
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;

  // External link
  prUrl: string;

  // Linked tasks
  linkedTaskKeys: string[];

  // Stats
  commitsCount: number | null;
  changedFilesCount: number | null;
  additionsCount: number | null;
  deletionsCount: number | null;
}

export interface BranchResponse {
  id: number;
  gitIntegrationId: number;
  name: string;
  isDefault: boolean;
  isProtected: boolean;
  lastCommitSha: string | null;
  lastCommitMessage: string | null;
  lastCommitDate: string | null;
  createdAt: string;
  linkedTaskKeys: string[];
}
