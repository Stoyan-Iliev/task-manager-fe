import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { selectCurrentOrganizationId } from '../redux/organizationSlice';
import { useOrganizationMembers } from '../api/organizationMembers';
import { hasMinimumRole, canManageRole } from '../types/organization.types';
import type { OrganizationRole } from '../types/organization.types';

/**
 * Custom hook for organization role-based permissions
 *
 * Returns the current user's role in the specified organization
 * and helper methods for permission checks
 *
 * @param organizationId - Optional organization ID. If not provided, uses current organization from Redux
 *
 * @example
 * // Use current organization from Redux
 * const { role, canInviteMembers, canManageMember } = useOrganizationRole();
 *
 * // Use specific organization
 * const { role, canDeleteOrganization } = useOrganizationRole(5);
 *
 * if (canInviteMembers) {
 *   // Show invite button
 * }
 *
 * if (canManageMember('ORG_MEMBER')) {
 *   // Show manage options
 * }
 */
export const useOrganizationRole = (organizationId?: number | null) => {
  const user = useSelector((state: RootState) => state.user.details);
  const currentOrgId = useSelector(selectCurrentOrganizationId);
  const orgId = organizationId !== undefined ? organizationId : currentOrgId;
  const { data: members } = useOrganizationMembers(orgId);

  const currentUserRole = members?.find((m) => m.userId === user?.id)?.role as OrganizationRole | undefined;

  return {
    /** Current user's role in the organization (ORG_OWNER, ORG_ADMIN, ORG_MEMBER, or undefined) */
    role: currentUserRole,

    /** Can invite new members (ORG_ADMIN or higher) */
    canInviteMembers: currentUserRole ? hasMinimumRole(currentUserRole, 'ORG_ADMIN') : false,

    /** Can manage organization settings (ORG_ADMIN or higher) */
    canManageSettings: currentUserRole ? hasMinimumRole(currentUserRole, 'ORG_ADMIN') : false,

    /** Can delete the organization (ORG_OWNER only) */
    canDeleteOrganization: currentUserRole === 'ORG_OWNER',

    /**
     * Check if current user can manage a specific member role
     * @param targetRole - The role of the member to manage
     * @returns true if current user can manage the target role
     */
    canManageMember: (targetRole: OrganizationRole) =>
      currentUserRole ? canManageRole(currentUserRole, targetRole) : false,
  };
};
