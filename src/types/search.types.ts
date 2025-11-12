// Search Types

export type EntityType = 'TASK' | 'PROJECT' | 'USER' | 'GLOBAL';

export interface SearchResultResponse {
  entityType: string;
  entityId: number;
  title: string;
  description: string | null;
  status: string | null;
  relevanceScore: number | null;
  highlightedFields: string[];
  projectName: string | null;
  projectId: number | null;
  assigneeName: string | null;
  assigneeId: number | null;
}

export interface SearchRequest {
  query: string | null;
  entityType?: string;

  // Filters
  projectIds?: number[];
  assigneeIds?: number[];
  statusIds?: number[];
  labelIds?: number[];

  // Date filters
  createdAfter?: string;
  createdBefore?: string;
  dueAfter?: string;
  dueBefore?: string;

  // Other
  includeArchived?: boolean;
  sortBy?: string; // 'relevance', 'created', 'updated', 'title'
  sortDirection?: string; // 'ASC', 'DESC'
}

export interface SavedSearchResponse {
  id: number;
  userId: number;
  organizationId: number;
  name: string;
  description: string | null;
  searchCriteria: SearchRequest;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedSearchRequest {
  name: string;
  description?: string;
  searchCriteria: SearchRequest;
  isShared?: boolean;
}
