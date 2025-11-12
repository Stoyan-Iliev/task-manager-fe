// Release Types

export type ReleaseStatus = 'PLANNED' | 'IN_PROGRESS' | 'RELEASED' | 'ARCHIVED';

export interface ReleaseResponse {
  id: number;
  projectId: number;
  projectName: string;
  name: string;
  description: string | null;
  version: string | null;
  releaseDate: string | null;
  status: ReleaseStatus;
  createdById: number;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string;
  releasedAt: string | null;
  archivedAt: string | null;
  taskCount: number;
  completedTaskCount: number;
}

export interface CreateReleaseRequest {
  name: string;
  description?: string;
  version?: string;
  releaseDate?: string;
}

export interface UpdateReleaseRequest {
  name?: string;
  description?: string;
  version?: string;
  releaseDate?: string;
  status?: ReleaseStatus;
}

export interface AddTaskToReleaseRequest {
  taskIds: number[];
}
