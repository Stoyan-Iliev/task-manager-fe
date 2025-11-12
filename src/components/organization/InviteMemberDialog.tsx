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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useAddMember } from '../../api/organizationMembers';
import { getRoleDisplayName, getRoleDescription } from '../../types/organization.types';
import type { OrganizationRole } from '../../types/organization.types';

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  organizationId: number;
}

const InviteMemberDialog = ({ open, onClose, organizationId }: InviteMemberDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const addMember = useAddMember(organizationId);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrganizationRole>('ORG_MEMBER');
  const [errors, setErrors] = useState<{ email?: string }>({});

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setEmail('');
      setRole('ORG_MEMBER');
      setErrors({});
    }
  }, [open]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validate = (): boolean => {
    const newErrors: { email?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    addMember.mutate(
      {
        email: email.trim(),
        role,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
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
        <PersonAddIcon color="primary" />
        <Typography variant="h6">Invite Member</Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
            The user must already have an account to be added to the organization.
          </Alert>

          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors({});
            }}
            onKeyPress={handleKeyPress}
            error={!!errors.email}
            helperText={errors.email || 'Enter the email address of the user you want to invite'}
            required
            fullWidth
            autoFocus
            disabled={addMember.isPending}
            placeholder="user@example.com"
            sx={{
              '& .MuiInputBase-root': {
                bgcolor: 'background.default',
              },
            }}
          />

          <FormControl fullWidth>
            <InputLabel id="role-select-label">Role</InputLabel>
            <Select
              labelId="role-select-label"
              value={role}
              label="Role"
              onChange={(e) => setRole(e.target.value as OrganizationRole)}
              disabled={addMember.isPending}
              sx={{
                bgcolor: 'background.default',
              }}
            >
              <MenuItem value="ORG_ADMIN">
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {getRoleDisplayName('ORG_ADMIN')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getRoleDescription('ORG_ADMIN')}
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="ORG_MEMBER">
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {getRoleDisplayName('ORG_MEMBER')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getRoleDescription('ORG_MEMBER')}
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

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
              Selected Role: {getRoleDisplayName(role)}
            </Typography>
            <Typography variant="body2">{getRoleDescription(role)}</Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={addMember.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={addMember.isPending || !email.trim()}
          startIcon={
            addMember.isPending ? <CircularProgress size={16} /> : <PersonAddIcon />
          }
        >
          {addMember.isPending ? 'Inviting...' : 'Invite Member'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteMemberDialog;
