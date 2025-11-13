import type { BaseEntity, UserSummary } from './common.types';

// Project types
export type ProjectType = 'SOFTWARE' | 'MARKETING' | 'BUSINESS' | 'OPERATIONS';

// Project roles (must match backend enum)
export type ProjectRole = 'PROJECT_OWNER' | 'PROJECT_ADMIN' | 'PROJECT_MEMBER' | 'PROJECT_VIEWER';

// Status categories
export type StatusCategory = 'TODO' | 'IN_PROGRESS' | 'DONE';

// Sprint status (must match backend enum)
export type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

// Project
export interface Project extends BaseEntity {
  name: string;
  key: string;
  type: ProjectType;
  description?: string;
  organizationId: number;
  tenantId: number;
}

export interface ProjectCreateRequest {
  name: string;
  key: string;
  type: ProjectType;
  description?: string;
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  type?: ProjectType;
}

export interface ProjectResponse extends Project {
  taskCount?: number;
  memberCount?: number;
  lead?: UserSummary;
}

// Project members
export interface ProjectMember {
  user: UserSummary;
  role: ProjectRole;
  addedAt: string;
}

export interface AddProjectMemberRequest {
  userId: number;
  role: ProjectRole;
}

export interface UpdateProjectMemberRoleRequest {
  role: ProjectRole;
}

export interface ProjectMemberResponse {
  id: number;
  userId: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: ProjectRole;
  addedAt: string;
}

// Task Status
export interface TaskStatus extends BaseEntity {
  name: string;
  category: StatusCategory;
  color?: string;
  position: number;
  projectId: number;
  wipLimit?: number;
}

export interface TaskStatusRequest {
  name: string;
  category: StatusCategory;
  color?: string;
  wipLimit?: number;
}

export interface UpdateTaskStatusRequest {
  name?: string;
  category?: StatusCategory;
  color?: string;
  wipLimit?: number | null;
}

export interface TaskStatusResponse extends TaskStatus {
  taskCount?: number;
}

export interface ReorderStatusesRequest {
  statusIds: number[];
}

export interface StatusTemplateResponse {
  id: string;
  name: string;
  description: string;
  statuses: Array<{
    name: string;
    category: StatusCategory;
    color?: string;
  }>;
}

// Sprint
export interface Sprint extends BaseEntity {
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  projectId: number;
}

export interface SprintRequest {
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
}

// Sprint metrics
export interface SprintMetrics {
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  totalPoints: number;
  completedPoints: number;
  progressPercentage: number;
}

export interface SprintResponse {
  id: number;
  projectId: number;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  createdAt: string;
  createdByUsername: string;
  completedAt?: string;
  completedByUsername?: string;
  capacityHours?: number;
  metrics?: SprintMetrics;
}

export interface CompleteSprintRequest {
  rolloverIncompleteTasks?: boolean;
  targetSprintId?: number;
}

export interface AssignTasksToSprintRequest {
  taskIds: number[];
}

export interface RemoveTasksFromSprintRequest {
  taskIds: number[];
}

// Role helper functions
export const getRoleDisplayName = (role: ProjectRole): string => {
  switch (role) {
    case 'PROJECT_OWNER':
      return 'Owner';
    case 'PROJECT_ADMIN':
      return 'Admin';
    case 'PROJECT_MEMBER':
      return 'Member';
    case 'PROJECT_VIEWER':
      return 'Viewer';
  }
};

export const getRoleDescription = (role: ProjectRole): string => {
  switch (role) {
    case 'PROJECT_OWNER':
      return 'Full ownership: manage everything including deleting the project';
    case 'PROJECT_ADMIN':
      return 'Administrative access: manage members, settings, and all tasks';
    case 'PROJECT_MEMBER':
      return 'Can create and edit tasks, participate in project activities';
    case 'PROJECT_VIEWER':
      return 'Read-only access to view tasks and project information';
  }
};
