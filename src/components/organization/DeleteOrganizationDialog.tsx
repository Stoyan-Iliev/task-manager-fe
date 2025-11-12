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
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useDeleteOrganization } from '../../api/organizations';
import { useNavigate } from 'react-router';
import type { OrganizationResponse } from '../../types/organization.types';

interface DeleteOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
  organization: OrganizationResponse;
}

const DeleteOrganizationDialog = ({
  open,
  onClose,
  organization,
}: DeleteOrganizationDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const deleteOrganization = useDeleteOrganization();

  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');

  const isConfirmationValid = confirmationText === organization.name;

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setConfirmationText('');
      setError('');
    }
  }, [open]);

  const handleDelete = async () => {
    if (!isConfirmationValid) {
      setError('Please type the organization name exactly to confirm deletion.');
      return;
    }

    deleteOrganization.mutate(organization.id, {
      onSuccess: () => {
        onClose();
        // Navigate back to dashboard after deletion
        navigate('/');
      },
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isConfirmationValid) {
      handleDelete();
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
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'error.main',
        }}
      >
        <WarningIcon />
        <Typography variant="h6">Delete Organization</Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Alert severity="error">
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              This action cannot be undone!
            </Typography>
            <Typography variant="body2">
              Deleting this organization will permanently remove:
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              <li>All organization data and settings</li>
              <li>All projects and tasks</li>
              <li>All member associations</li>
              <li>All files and attachments</li>
            </Box>
          </Alert>

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
              Organization to delete:
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {organization.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {organization.memberCount} member{organization.memberCount !== 1 ? 's' : ''}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" gutterBottom>
              Please type{' '}
              <Typography
                component="span"
                variant="body2"
                fontWeight="bold"
                sx={{ fontFamily: 'monospace' }}
              >
                {organization.name}
              </Typography>{' '}
              to confirm deletion:
            </Typography>
            <TextField
              value={confirmationText}
              onChange={(e) => {
                setConfirmationText(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              fullWidth
              placeholder={organization.name}
              disabled={deleteOrganization.isPending}
              error={!!error}
              helperText={error}
              sx={{
                mt: 1,
                '& .MuiInputBase-root': {
                  bgcolor: 'background.default',
                  fontFamily: 'monospace',
                },
              }}
            />
          </Box>

          {!isConfirmationValid && confirmationText.length > 0 && (
            <Typography variant="caption" color="error">
              Name doesn't match. Please type it exactly.
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={deleteOrganization.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={deleteOrganization.isPending || !isConfirmationValid}
          startIcon={
            deleteOrganization.isPending ? (
              <CircularProgress size={16} />
            ) : (
              <WarningIcon />
            )
          }
        >
          {deleteOrganization.isPending ? 'Deleting...' : 'Delete Organization'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteOrganizationDialog;
