import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import { useCreateRelease, useUpdateRelease } from '../../api/releases';
import type { ReleaseResponse, ReleaseStatus } from '../../types/release.types';

interface ReleaseDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
  release?: ReleaseResponse | null;
  mode: 'create' | 'edit';
}

export const ReleaseDialog = ({
  open,
  onClose,
  projectId,
  release,
  mode,
}: ReleaseDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('');
  const [releaseDate, setReleaseDate] = useState<Dayjs | null>(null);
  const [status, setStatus] = useState<ReleaseStatus>('PLANNED');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createRelease = useCreateRelease();
  const updateRelease = useUpdateRelease();

  // Initialize form with release data when editing
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && release) {
        setName(release.name);
        setDescription(release.description || '');
        setVersion(release.version || '');
        setReleaseDate(release.releaseDate ? dayjs(release.releaseDate) : null);
        setStatus(release.status);
      } else {
        // Reset form for create mode
        setName('');
        setDescription('');
        setVersion('');
        setReleaseDate(null);
        setStatus('PLANNED');
      }
      setErrors({});
    }
  }, [open, mode, release]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Release name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    try {
      if (mode === 'create') {
        await createRelease.mutateAsync({
          projectId,
          data: {
            name: name.trim(),
            description: description.trim() || undefined,
            version: version.trim() || undefined,
            releaseDate: releaseDate?.toISOString(),
          },
        });
      } else if (mode === 'edit' && release) {
        await updateRelease.mutateAsync({
          releaseId: release.id,
          data: {
            name: name.trim(),
            description: description.trim() || undefined,
            version: version.trim() || undefined,
            releaseDate: releaseDate?.toISOString(),
            status,
          },
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save release:', error);
    }
  };

  const isPending = createRelease.isPending || updateRelease.isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'create' ? 'Create New Release' : 'Edit Release'}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          {/* Name */}
          <TextField
            label="Release Name"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            placeholder="e.g., Sprint 1 Release"
            autoFocus
          />

          {/* Version */}
          <TextField
            label="Version"
            fullWidth
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g., 1.0.0"
            helperText="Semantic versioning format (optional)"
          />

          {/* Release Date */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Release Date"
              value={releaseDate}
              onChange={setReleaseDate}
              slotProps={{
                textField: {
                  fullWidth: true,
                  helperText: 'Target date for this release',
                },
              }}
            />
          </LocalizationProvider>

          {/* Status (only in edit mode) */}
          {mode === 'edit' && (
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReleaseStatus)}
                label="Status"
              >
                <MenuItem value="PLANNED">Planned</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="RELEASED">Released</MenuItem>
                <MenuItem value="ARCHIVED">Archived</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Description */}
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what's included in this release..."
          />

          {/* Info for create mode */}
          {mode === 'create' && (
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="caption">
                After creating the release, you can add tasks to it from the project board
                or task details.
              </Typography>
            </Alert>
          )}

          {/* Task count for edit mode */}
          {mode === 'edit' && release && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                Tasks in this release
              </Typography>
              <Typography variant="h6">
                {release.completedTaskCount} / {release.taskCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {release.taskCount > 0
                  ? `${Math.round((release.completedTaskCount / release.taskCount) * 100)}% complete`
                  : 'No tasks assigned yet'}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isPending}>
          {isPending ? 'Saving...' : mode === 'create' ? 'Create Release' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReleaseDialog;
