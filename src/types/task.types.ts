import type { BaseEntity, UserSummary } from './common.types';

// Task types
export type TaskType = 'TASK' | 'BUG' | 'STORY' | 'EPIC';

// Task priorities
export type TaskPriority = 'LOWEST' | 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST';

// Task
export interface Task extends BaseEntity {
  key: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  statusId: number;
  projectId: number;
  assigneeId?: number;
  reporterId: number;
  parentTaskId?: number;
  sprintId?: number;
  dueDate?: string;
  estimatedHours?: number;
  tenantId: number;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  statusId: number;
  assigneeId?: number;
  parentTaskId?: number;
  sprintId?: number;
  dueDate?: string;
  estimatedHours?: number;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  type?: TaskType;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedHours?: number;
  sprintId?: number;
}

export interface TaskResponse extends Task {
  assignee?: UserSummary;
  reporter: UserSummary;
  status: {
    id: number;
    name: string;
    category: string;
    color?: string;
  };
  labels?: LabelResponse[];
  subtaskCount?: number;
  commentCount?: number;
  attachmentCount?: number;
  watcherCount?: number;
  isWatching?: boolean;
}

export interface TaskSummary {
  id: number;
  key: string;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  statusId: number;
  statusName: string;
  assignee?: UserSummary;
  dueDate?: string;
  sprintId?: number;
  subtaskCount?: number;
  labels?: LabelResponse[];
}

export interface TaskAssignRequest {
  assigneeId?: number; // null to unassign
}

export interface TaskTransitionRequest {
  newStatusId: number;
  comment?: string;
}

// Comment
export interface Comment extends BaseEntity {
  content: string;
  taskId: number;
  authorId: number;
  parentCommentId?: number;
}

export interface CommentRequest {
  content: string;
  parentCommentId?: number;
}

export interface CommentResponse extends Comment {
  author?: UserSummary;
  replies?: CommentResponse[];
  canEdit: boolean;
  canDelete: boolean;
}

// Attachment
export interface Attachment extends BaseEntity {
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  taskId: number;
  uploaderId: number;
  storagePath: string;
}

export interface AttachmentResponse extends Attachment {
  uploadedBy?: UserSummary;
  uploadedAt?: string;
  downloadUrl?: string;
}

export interface AttachmentDownload {
  filename: string;
  mimeType: string;
  data: Blob;
}

// Label
export interface Label extends BaseEntity {
  name: string;
  color: string;
  description?: string;
  organizationId: number;
  tenantId: number;
}

export interface LabelRequest {
  name: string;
  color: string;
  description?: string;
}

export interface LabelResponse extends Label {}

export interface TaskLabelRequest {
  labelId: number;
}

// Task Watcher
export interface TaskWatcher {
  taskId: number;
  userId: number;
  addedAt: string;
}

export interface WatchersResponse {
  watchers: UserSummary[];
  totalCount: number;
  isCurrentUserWatching: boolean;
}
