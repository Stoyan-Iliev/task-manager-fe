import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useChangePassword } from '../../api/user';
import type { ChangePasswordRequest } from '../../types/user.types';

interface PasswordFormData extends ChangePasswordRequest {}

export default function SecurityTab() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const changePasswordMutation = useChangePassword();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<PasswordFormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  const validatePassword = (value: string) => {
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/(?=.*[a-z])/.test(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(value)) {
      return 'Password must contain at least one digit';
    }
    return true;
  };

  const validateConfirmPassword = (value: string) => {
    if (value !== newPassword) {
      return 'Passwords do not match';
    }
    return true;
  };

  const onSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        reset();
      },
    });
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Change Password
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Ensure your account is using a strong password to stay secure.
        </Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
          <Controller
            name="currentPassword"
            control={control}
            rules={{
              required: 'Current password is required',
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                error={!!errors.currentPassword}
                helperText={errors.currentPassword?.message}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        edge="end"
                      >
                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Controller
            name="newPassword"
            control={control}
            rules={{
              required: 'New password is required',
              validate: validatePassword,
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                error={!!errors.newPassword}
                helperText={errors.newPassword?.message}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Controller
            name="confirmPassword"
            control={control}
            rules={{
              required: 'Please confirm your new password',
              validate: validateConfirmPassword,
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                sx={{ mb: 3 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              onClick={() => reset()}
              disabled={changePasswordMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={
                changePasswordMutation.isPending ? (
                  <CircularProgress size={20} />
                ) : (
                  <LockResetIcon />
                )
              }
              disabled={changePasswordMutation.isPending}
            >
              Change Password
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
