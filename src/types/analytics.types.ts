// Analytics Types

export interface OrganizationMetricsResponse {
  organizationId: number;
  organizationName: string;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalMembers: number;
  activeProjects: number;
  overallCompletionRate: number;
}

export interface ProjectMetricsResponse {
  projectId: number;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  completionRate: number;
  averageCycleTime: number | null;
  activeSprintCount: number;
  totalMembers: number;
}

export interface UserActivityResponse {
  userId: number;
  username: string;
  fullName: string | null;
  tasksAssigned: number;
  tasksCompleted: number;
  tasksInProgress: number;
  commentsCount: number;
  lastActiveAt: string | null;
}

export interface TaskStatusDistributionResponse {
  statusId: number;
  statusName: string;
  statusColor: string | null;
  taskCount: number;
  percentage: number;
}

export interface TimeRangeMetricsResponse {
  startDate: string;
  endDate: string;
  tasksCreated: number;
  tasksCompleted: number;
  averageCompletionTime: number | null;
}

export interface SprintMetrics {
  sprintId: number;
  sprintName: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  velocity: number | null;
}
