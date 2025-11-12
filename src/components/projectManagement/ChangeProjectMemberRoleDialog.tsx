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
  Avatar,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useUpdateProjectMemberRole } from '../../api/projectMembers';
import { getRoleDisplayName, getRoleDescription } from '../../types/project.types';
import type { ProjectMemberResponse, ProjectRole } from '../../types/project.types';

interface ChangeProjectMemberRoleDialogProps {
  open: boolean;
  onClose: () => void;
  member: ProjectMemberResponse;
  projectId: number;
}

const ChangeProjectMemberRoleDialog = ({
  open,
  onClose,
  member,
  projectId,
}: ChangeProjectMemberRoleDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const updateMemberRole = useUpdateProjectMemberRole(projectId);

  const [newRole, setNewRole] = useState<ProjectRole>(member.role);

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
        role: { role: newRole },
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {(member.fullName || member.username).charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {member.fullName || member.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {member.email}
                </Typography>
              </Box>
            </Box>
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
              onChange={(e) => setNewRole(e.target.value as ProjectRole)}
              disabled={updateMemberRole.isPending}
              sx={{
                bgcolor: 'background.default',
              }}
            >
              {(['PROJECT_OWNER', 'PROJECT_ADMIN', 'PROJECT_MEMBER', 'PROJECT_VIEWER'] as ProjectRole[]).map((role) => (
                <MenuItem key={role} value={role}>
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
            <Alert severity={newRole === 'PROJECT_OWNER' ? 'warning' : 'info'}>
              {newRole === 'PROJECT_OWNER' && (
                <>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Promoting to Owner
                  </Typography>
                  <Typography variant="body2">
                    This user will have full ownership of the project, including the ability to
                    delete it and manage all settings.
                  </Typography>
                </>
              )}
              {newRole === 'PROJECT_ADMIN' && (
                <>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Promoting to Admin
                  </Typography>
                  <Typography variant="body2">
                    This user will have administrative access to manage members, settings, and tasks.
                  </Typography>
                </>
              )}
              {newRole === 'PROJECT_VIEWER' && member.role !== 'PROJECT_VIEWER' && (
                <>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Restricting to Viewer
                  </Typography>
                  <Typography variant="body2">
                    This user will only have read-only access and won't be able to edit tasks.
                  </Typography>
                </>
              )}
              {newRole === 'PROJECT_MEMBER' && (
                <Typography variant="body2">
                  This user will be able to create and edit tasks in this project.
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

export default ChangeProjectMemberRoleDialog;
