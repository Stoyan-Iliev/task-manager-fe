import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useUpdateMemberRole } from '../../api/organizationMembers';
import { getRoleDisplayName, getRoleDescription } from '../../types/organization.types';
import type { MemberResponse, OrganizationRole } from '../../types/organization.types';

interface ChangeMemberRoleDialogProps {
  open: boolean;
  onClose: () => void;
  member: MemberResponse;
  organizationId: number;
  currentUserRole: OrganizationRole;
}

const ChangeMemberRoleDialog = ({
  open,
  onClose,
  member,
  organizationId,
  currentUserRole,
}: ChangeMemberRoleDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const updateMemberRole = useUpdateMemberRole(organizationId);

  const [newRole, setNewRole] = useState<OrganizationRole>(member.role);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setNewRole(member.role);
    }
  }, [open, member.role]);

  const handleSubmit = async () => {
    if (newRole === member.role) {
      onClose();
      return;
    }

    updateMemberRole.mutate(
      {
        userId: member.userId,
        data: { role: newRole },
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  // Get available roles based on current user's role
  const getAvailableRoles = (): OrganizationRole[] => {
    if (currentUserRole === 'ORG_OWNER') {
      return ['ORG_OWNER', 'ORG_ADMIN', 'ORG_MEMBER'];
    }
    if (currentUserRole === 'ORG_ADMIN') {
      return ['ORG_ADMIN', 'ORG_MEMBER'];
    }
    return ['ORG_MEMBER'];
  };

  const availableRoles = getAvailableRoles();
  const canChangeToRole = (role: OrganizationRole) => availableRoles.includes(role);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          ...theme.applyStyles('dark', {
            boxShadow: theme.shadows[24],
          }),
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EditIcon color="primary" />
        <Typography variant="h6">Change Member Role</Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* Member Info */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Member:
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {member.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {member.email}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                label={`Current: ${getRoleDisplayName(member.role)}`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>

          {/* Role Selection */}
          <FormControl fullWidth>
            <InputLabel id="new-role-select-label">New Role</InputLabel>
            <Select
              labelId="new-role-select-label"
              value={newRole}
              label="New Role"
              onChange={(e) => setNewRole(e.target.value as OrganizationRole)}
              disabled={updateMemberRole.isPending}
              sx={{
                bgcolor: 'background.default',
              }}
            >
              {(['ORG_OWNER', 'ORG_ADMIN', 'ORG_MEMBER'] as OrganizationRole[]).map((role) => (
                <MenuItem key={role} value={role} disabled={!canChangeToRole(role)}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {getRoleDisplayName(role)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getRoleDescription(role)}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Role Description */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Selected Role: {getRoleDisplayName(newRole)}
            </Typography>
            <Typography variant="body2">{getRoleDescription(newRole)}</Typography>
          </Box>

          {/* Warning for role changes */}
          {newRole !== member.role && (
            <Alert severity={newRole === 'ORG_OWNER' ? 'warning' : 'info'}>
              {newRole === 'ORG_OWNER' && (
                <>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Promoting to Owner
                  </Typography>
                  <Typography variant="body2">
                    This user will have full control over the organization, including the ability
                    to delete it.
                  </Typography>
                </>
              )}
              {newRole === 'ORG_MEMBER' && member.role !== 'ORG_MEMBER' && (
                <>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Demoting to Member
                  </Typography>
                  <Typography variant="body2">
                    This user will lose admin privileges and only have access to assigned projects.
                  </Typography>
                </>
              )}
              {newRole === 'ORG_ADMIN' && (
                <Typography variant="body2">
                  This user will be able to manage organization settings and members.
                </Typography>
              )}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={updateMemberRole.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={updateMemberRole.isPending || newRole === member.role}
          startIcon={
            updateMemberRole.isPending ? <CircularProgress size={16} /> : <EditIcon />
          }
        >
          {updateMemberRole.isPending ? 'Updating...' : 'Update Role'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeMemberRoleDialog;
