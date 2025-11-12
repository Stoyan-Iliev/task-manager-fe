import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';
import { useCreateOrganization } from '../../api/organizations';
import { useDispatch } from 'react-redux';
import { setCurrentOrganization } from '../../redux/organizationSlice';
import type { OrganizationRequest } from '../../types/organization.types';

interface CreateOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
}

// Generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 50); // Limit length
};

const CreateOrganizationDialog = ({ open, onClose }: CreateOrganizationDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const createOrganization = useCreateOrganization();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  // Generate slug preview
  const slugPreview = name ? generateSlug(name) : '';

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setName('');
      setDescription('');
      setErrors({});
    }
  }, [open]);

  const validate = (): boolean => {
    const newErrors: { name?: string; description?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Organization name is required';
    } else if (name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    } else if (name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    if (description && description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const organizationData: OrganizationRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
    };

    createOrganization.mutate(organizationData, {
      onSuccess: (data) => {
        // Auto-select the newly created organization
        dispatch(setCurrentOrganization(data.id));
        onClose();
      },
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
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
        <BusinessIcon color="primary" />
        <Typography variant="h6">Create New Organization</Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
            Organizations help you manage teams, projects, and tasks. You can invite members and
            collaborate together.
          </Alert>

          <TextField
            label="Organization Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            error={!!errors.name}
            helperText={
              errors.name || `${name.length}/100 characters`
            }
            required
            fullWidth
            autoFocus
            disabled={createOrganization.isPending}
            placeholder="e.g., Acme Corp, My Team"
            sx={{
              '& .MuiInputBase-root': {
                bgcolor: 'background.default',
              },
            }}
          />

          {slugPreview && (
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
                URL Slug (auto-generated)
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  color: 'primary.main',
                  wordBreak: 'break-all',
                }}
              >
                {slugPreview || 'organization-slug'}
              </Typography>
            </Box>
          )}

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={!!errors.description}
            helperText={
              errors.description || `${description.length}/500 characters (optional)`
            }
            fullWidth
            multiline
            rows={3}
            disabled={createOrganization.isPending}
            placeholder="What is this organization about?"
            sx={{
              '& .MuiInputBase-root': {
                bgcolor: 'background.default',
              },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={createOrganization.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={createOrganization.isPending || !name.trim()}
          startIcon={
            createOrganization.isPending ? <CircularProgress size={16} /> : <BusinessIcon />
          }
        >
          {createOrganization.isPending ? 'Creating...' : 'Create Organization'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateOrganizationDialog;
