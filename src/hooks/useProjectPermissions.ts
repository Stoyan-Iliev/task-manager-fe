import { useMemo } from 'react';
import { useProjectMembers } from '../api/projectMembers';
import { useSelector } from 'react-redux';
import { useOrganizationRole } from './useOrganizationRole';
import type { RootState } from '../redux/store';

/**
 * Check if the current user is a project OWNER or ADMIN
 */
export const useIsProjectLead = (projectId: number | null) => {
  const { data: members } = useProjectMembers(projectId);
  const currentUser = useSelector((state: RootState) => state.user.details);

  return useMemo(() => {
    if (!members || !currentUser) return false;
    const member = members.find((m) => m.userId === currentUser.id);
    return member?.role === 'PROJECT_OWNER' || member?.role === 'PROJECT_ADMIN';
  }, [members, currentUser]);
};

/**
 * Check if the current user can manage project members
 * Project LEADs, organization OWNERs, and organization ADMINs can manage members
 */
export const useCanManageMembers = (projectId: number | null) => {
  const isProjectLead = useIsProjectLead(projectId);
  const { role: orgRole } = useOrganizationRole();

  return isProjectLead || orgRole === 'ORG_OWNER' || orgRole === 'ORG_ADMIN';
};

/**
 * Check if the current user can manage project statuses
 * Project LEADs, organization OWNERs, and organization ADMINs can manage statuses
 */
export const useCanManageStatuses = (projectId: number | null) => {
  const isProjectLead = useIsProjectLead(projectId);
  const { role: orgRole } = useOrganizationRole();

  return isProjectLead || orgRole === 'ORG_OWNER' || orgRole === 'ORG_ADMIN';
};

/**
 * Get the current user's role in the project
 */
export const useProjectRole = (projectId: number | null) => {
  const { data: members } = useProjectMembers(projectId);
  const currentUser = useSelector((state: RootState) => state.user.details);

  return useMemo(() => {
    if (!members || !currentUser) return null;
    const member = members.find((m) => m.userId === currentUser.id);
    return member?.role || null;
  }, [members, currentUser]);
};
