import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  Chip,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { useDeleteStatus } from '../../api/taskStatuses';
import type { TaskStatusResponse } from '../../types/project.types';

interface DeleteStatusDialogProps {
  open: boolean;
  onClose: () => void;
  status: TaskStatusResponse;
  projectId: number;
}

const DeleteStatusDialog = ({ open, onClose, status, projectId }: DeleteStatusDialogProps) => {
  const deleteStatus = useDeleteStatus(projectId);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);

    deleteStatus.mutate(
      status.id,
      {
        onSuccess: () => {
          onClose();
        },
        onError: (err: Error) => {
          setError(err.message || 'Failed to delete status');
        },
      }
    );
  };

  const hasActiveTasks = (status.taskCount || 0) > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Delete Status
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {hasActiveTasks ? (
            <Alert severity="error">
              <Typography variant="body2" gutterBottom>
                <strong>Cannot delete this status!</strong>
              </Typography>
              <Typography variant="body2">
                This status has <strong>{status.taskCount}</strong> active task
                {status.taskCount === 1 ? '' : 's'}. Please move or delete these tasks before
                removing the status.
              </Typography>
            </Alert>
          ) : (
            <Alert severity="warning">
              <Typography variant="body2">
                Are you sure you want to delete this status? This action cannot be undone.
              </Typography>
            </Alert>
          )}

          <Box
            sx={{
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Status Details:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Name:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {status.name}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Category:
                </Typography>
                <Chip label={status.category.replace('_', ' ')} size="small" />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Tasks:
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight="medium"
                  color={hasActiveTasks ? 'error' : 'text.primary'}
                >
                  {status.taskCount || 0}
                </Typography>
              </Box>
              {status.wipLimit && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    WIP Limit:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {status.wipLimit}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {!hasActiveTasks && (
            <Typography variant="body2" color="text.secondary">
              Once deleted, this status will be permanently removed from your project workflow.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deleteStatus.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={deleteStatus.isPending || hasActiveTasks}
          startIcon={deleteStatus.isPending ? undefined : <WarningIcon />}
        >
          {deleteStatus.isPending ? 'Deleting...' : 'Delete Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteStatusDialog;
