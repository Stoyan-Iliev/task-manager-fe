import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Chip,
  Avatar,
} from '@mui/material';
import { Delete as DeleteIcon, Warning as WarningIcon } from '@mui/icons-material';
import { useRemoveProjectMember } from '../../api/projectMembers';
import { getRoleDisplayName } from '../../types/project.types';
import type { ProjectMemberResponse } from '../../types/project.types';

interface RemoveProjectMemberDialogProps {
  open: boolean;
  onClose: () => void;
  member: ProjectMemberResponse;
  projectId: number;
}

const RemoveProjectMemberDialog = ({
  open,
  onClose,
  member,
  projectId,
}: RemoveProjectMemberDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const removeMember = useRemoveProjectMember(projectId);

  const handleRemove = async () => {
    removeMember.mutate(member.userId, {
      onSuccess: () => {
        onClose();
      },
    });
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
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'error.main',
        }}
      >
        <WarningIcon />
        <Typography variant="h6">Remove Member from Project</Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Alert severity="warning">
            <Typography variant="body2">
              This action will remove the member from the project and revoke their access to all
              project tasks and data.
            </Typography>
          </Alert>

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
              Member to remove:
            </Typography>
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
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <Chip
                label={getRoleDisplayName(member.role)}
                size="small"
                color="primary"
              />
              <Chip
                label={`Added ${new Date(member.addedAt).toLocaleDateString()}`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary">
            Are you sure you want to remove{' '}
            <strong>{member.fullName || member.username}</strong> from this project? They will
            lose access immediately.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={removeMember.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleRemove}
          variant="contained"
          color="error"
          disabled={removeMember.isPending}
          startIcon={
            removeMember.isPending ? <CircularProgress size={16} /> : <DeleteIcon />
          }
        >
          {removeMember.isPending ? 'Removing...' : 'Remove Member'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RemoveProjectMemberDialog;
