import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { useUpdateStatus } from '../../api/taskStatuses';
import type { TaskStatusResponse, StatusCategory } from '../../types/project.types';

interface EditStatusDialogProps {
  open: boolean;
  onClose: () => void;
  status: TaskStatusResponse;
  projectId: number;
}

const EditStatusDialog = ({ open, onClose, status, projectId }: EditStatusDialogProps) => {
  const updateStatus = useUpdateStatus(projectId);

  const [formData, setFormData] = useState({
    name: status.name,
    category: status.category,
    color: status.color || '#2196f3',
    wipLimit: status.wipLimit?.toString() || '',
  });

  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Update form when status changes
  useEffect(() => {
    setFormData({
      name: status.name,
      category: status.category,
      color: status.color || '#2196f3',
      wipLimit: status.wipLimit?.toString() || '',
    });
    setHasChanges(false);
  }, [status]);

  // Check for changes
  useEffect(() => {
    const changed =
      formData.name !== status.name ||
      formData.category !== status.category ||
      formData.color !== (status.color || '#2196f3') ||
      formData.wipLimit !== (status.wipLimit?.toString() || '');
    setHasChanges(changed);
  }, [formData, status]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Status name is required');
      return;
    }

    setError(null);

    // Backend requires all fields, so send everything
    const updates = {
      name: formData.name.trim(),
      category: formData.category,
      color: formData.color,
      wipLimit: formData.wipLimit ? parseInt(formData.wipLimit, 10) : null,
    };

    updateStatus.mutate(
      {
        statusId: status.id,
        data: updates,
      },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: (err: Error) => {
          setError(err.message || 'Failed to update status');
        },
      }
    );
  };

  const handleClose = () => {
    setError(null);
    setHasChanges(false);
    onClose();
  };

  const colorOptions: { value: string; label: string }[] = [
    { value: '#9e9e9e', label: 'Gray' },
    { value: '#2196f3', label: 'Blue' },
    { value: '#4caf50', label: 'Green' },
    { value: '#ff9800', label: 'Yellow' },
    { value: '#f44336', label: 'Red' },
    { value: '#9c27b0', label: 'Purple' },
  ];

  const categoryOptions: { value: StatusCategory; label: string; description: string }[] = [
    { value: 'TODO', label: 'To Do', description: 'Tasks that are planned but not started' },
    { value: 'IN_PROGRESS', label: 'In Progress', description: 'Tasks currently being worked on' },
    { value: 'DONE', label: 'Done', description: 'Completed tasks' },
  ];

  const currentTaskCount = status.taskCount || 0;
  const newWipLimit = formData.wipLimit ? parseInt(formData.wipLimit, 10) : null;
  const wipWarning = newWipLimit && currentTaskCount > newWipLimit;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Status: {status.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {wipWarning && (
            <Alert severity="warning">
              The new WIP limit ({newWipLimit}) is lower than the current number of tasks in this
              status ({currentTaskCount}). Consider moving some tasks before applying this limit.
            </Alert>
          )}

          <TextField
            label="Status Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
            autoFocus
          />

          <FormControl fullWidth required>
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category}
              label="Category"
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as StatusCategory })
              }
            >
              {categoryOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box>
                    <Typography variant="body1">{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required>
            <InputLabel>Color</InputLabel>
            <Select
              value={formData.color}
              label="Color"
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value })
              }
            >
              {colorOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 1,
                        bgcolor: option.value,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                    {option.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="WIP Limit (optional)"
            type="number"
            value={formData.wipLimit}
            onChange={(e) => setFormData({ ...formData, wipLimit: e.target.value })}
            fullWidth
            inputProps={{ min: 0 }}
            helperText={`Current tasks in status: ${currentTaskCount}. Leave empty for no limit.`}
          />

          <Box sx={{ bgcolor: 'background.default', p: 1.5, borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Status ID: {status.id} • Position: {status.position}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={updateStatus.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={updateStatus.isPending || !hasChanges || !formData.name.trim()}
        >
          {updateStatus.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditStatusDialog;
