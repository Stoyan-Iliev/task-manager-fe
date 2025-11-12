// Organization roles (matching backend enum exactly)
export type OrganizationRole = 'ORG_OWNER' | 'ORG_ADMIN' | 'ORG_MEMBER';

// Organization types
export interface Organization {
  id: number;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrganizationRequest {
  name: string;
  description?: string;
}

export interface OrganizationResponse {
  id: number;
  name: string;
  slug: string;
  description: string;
  memberCount: number;
  createdAt: string;
  createdByUsername: string;
}

// Organization members
export interface MemberInviteRequest {
  email: string;
  role: OrganizationRole;
}

export interface UpdateMemberRoleRequest {
  role: OrganizationRole;
}

export interface MemberResponse {
  id: number;
  userId: number;
  username: string;
  email: string;
  role: OrganizationRole;
  joinedAt: string;
  invitedByUsername: string;
}

// Helper functions for UI rendering
export const getRoleDisplayName = (role: OrganizationRole): string => {
  const displayNames: Record<OrganizationRole, string> = {
    ORG_OWNER: 'Owner',
    ORG_ADMIN: 'Admin',
    ORG_MEMBER: 'Member',
  };
  return displayNames[role];
};

export const getRoleColor = (role: OrganizationRole): 'error' | 'warning' | 'default' => {
  const colors: Record<OrganizationRole, 'error' | 'warning' | 'default'> = {
    ORG_OWNER: 'error',
    ORG_ADMIN: 'warning',
    ORG_MEMBER: 'default',
  };
  return colors[role];
};

export const getRoleDescription = (role: OrganizationRole): string => {
  const descriptions: Record<OrganizationRole, string> = {
    ORG_OWNER: 'Full control over organization including deletion and billing',
    ORG_ADMIN: 'Can manage organization settings, members, and all projects',
    ORG_MEMBER: 'Standard member with access to assigned projects',
  };
  return descriptions[role];
};

// Check if a role can perform actions on another role
export const canManageRole = (userRole: OrganizationRole, targetRole: OrganizationRole): boolean => {
  // Only ORG_OWNER can manage all roles
  if (userRole === 'ORG_OWNER') return true;
  // ORG_ADMIN can only manage ORG_MEMBER
  if (userRole === 'ORG_ADMIN' && targetRole === 'ORG_MEMBER') return true;
  return false;
};

// Check if user has permission level
export const hasMinimumRole = (userRole: OrganizationRole, requiredRole: OrganizationRole): boolean => {
  const roleHierarchy: Record<OrganizationRole, number> = {
    ORG_OWNER: 3,
    ORG_ADMIN: 2,
    ORG_MEMBER: 1,
  };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};
