// Notification types matching backend NotificationType enum
export const NotificationType = {
  TASK_CREATED: 'TASK_CREATED',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_UNASSIGNED: 'TASK_UNASSIGNED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  PRIORITY_CHANGED: 'PRIORITY_CHANGED',
  DUE_DATE_CHANGED: 'DUE_DATE_CHANGED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  COMMENT_REPLY: 'COMMENT_REPLY',
  MENTIONED: 'MENTIONED',
  ATTACHMENT_ADDED: 'ATTACHMENT_ADDED',
  WATCHER_ADDED: 'WATCHER_ADDED',
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

// Actor information in notifications
export interface NotificationActor {
  id: number;
  name: string;
  email: string;
}

// Notification response matching backend NotificationResponse DTO
export interface NotificationResponse {
  id: number;
  userId: number;
  type: NotificationType;
  message: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  actor: NotificationActor | null;
  organizationId: number | null;
  organizationName: string | null;
  projectId: number | null;
  projectKey: string | null;
  taskId: number | null;
  taskKey: string | null;
  relatedEntityId: number | null;
  title: string | null;
  metadata: Record<string, any> | null;
}

// WebSocket real-time notification message
export interface NotificationMessage {
  taskId: number;
  taskKey: string;
  message: string;
  type: NotificationType;
  timestamp: string;
}

// Activity log entry matching backend ActivityLogResponse
export interface ActivityLogEntry {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  user: {
    id: number;
    username: string;
    email: string;
    fullName?: string | null;
  };
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  metadata: string | null;
  timestamp: string;
  versionNumber: number;
  description?: string; // Generated description from backend
}
