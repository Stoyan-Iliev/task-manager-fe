import { useState } from 'react';
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
import { useCreateStatus } from '../../api/taskStatuses';
import type { StatusCategory } from '../../types/project.types';

interface AddStatusDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
}

const AddStatusDialog = ({ open, onClose, projectId }: AddStatusDialogProps) => {
  const createStatus = useCreateStatus(projectId);

  const [formData, setFormData] = useState({
    name: '',
    category: 'IN_PROGRESS' as StatusCategory,
    color: '#2196f3',
    wipLimit: '',
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Status name is required');
      return;
    }

    setError(null);

    createStatus.mutate(
      {
        name: formData.name.trim(),
        category: formData.category,
        color: formData.color,
        wipLimit: formData.wipLimit ? parseInt(formData.wipLimit, 10) : undefined,
      },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: (err: Error) => {
          setError(err.message || 'Failed to create status');
        },
      }
    );
  };

  const handleClose = () => {
    setFormData({
      name: '',
      category: 'IN_PROGRESS',
      color: '#2196f3',
      wipLimit: '',
    });
    setError(null);
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Status</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Status Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
            autoFocus
            helperText="e.g., In Review, Testing, Ready for Deploy"
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
            helperText="Maximum number of tasks allowed in this status (leave empty for no limit)"
          />

          <Alert severity="info">
            <Typography variant="body2">
              <strong>WIP Limit:</strong> Setting a limit helps prevent too many tasks from being
              in progress at once, encouraging team members to finish work before starting new
              tasks.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={createStatus.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={createStatus.isPending || !formData.name.trim()}
        >
          {createStatus.isPending ? 'Adding...' : 'Add Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStatusDialog;
