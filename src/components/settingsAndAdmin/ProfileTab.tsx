import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useUserProfile, useUpdateProfile } from '../../api/user';
import type { UpdateUserProfileRequest } from '../../types/user.types';
import AvatarUpload from './AvatarUpload';

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const timeFormats = [
  { value: '12h', label: '12-hour' },
  { value: '24h', label: '24-hour' },
];

export default function ProfileTab() {
  const { data: profile, isLoading } = useUserProfile();
  const updateMutation = useUpdateProfile();

  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<UpdateUserProfileRequest>({
    defaultValues: {
      firstName: '',
      lastName: '',
      jobTitle: '',
      department: '',
      phone: '',
      timezone: 'UTC',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      bio: '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        jobTitle: profile.jobTitle || '',
        department: profile.department || '',
        phone: profile.phone || '',
        timezone: profile.timezone || 'UTC',
        language: profile.language || 'en',
        dateFormat: profile.dateFormat || 'MM/DD/YYYY',
        timeFormat: profile.timeFormat || '12h',
        bio: profile.bio || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: UpdateUserProfileRequest) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <AvatarUpload
        userId={profile?.id}
        currentAvatarUrl={profile?.avatarUrl}
        firstName={profile?.firstName}
        lastName={profile?.lastName}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Basic Information
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="First Name"
                variant="outlined"
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="lastName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Last Name"
                variant="outlined"
              />
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Username"
            value={profile?.username || ''}
            disabled
            helperText="Username cannot be changed"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Email"
            value={profile?.email || ''}
            disabled
            helperText="Email cannot be changed"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Work Information
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="jobTitle"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Job Title"
                variant="outlined"
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="department"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Department"
                variant="outlined"
              />
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Phone"
                variant="outlined"
                placeholder="+1234567890"
              />
            )}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Preferences
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="timezone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                select
                label="Timezone"
                variant="outlined"
              >
                {timezones.map((tz) => (
                  <MenuItem key={tz} value={tz}>
                    {tz}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="language"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                select
                label="Language"
                variant="outlined"
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="dateFormat"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                select
                label="Date Format"
                variant="outlined"
              >
                {dateFormats.map((format) => (
                  <MenuItem key={format.value} value={format.value}>
                    {format.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="timeFormat"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                select
                label="Time Format"
                variant="outlined"
              >
                {timeFormats.map((format) => (
                  <MenuItem key={format.value} value={format.value}>
                    {format.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <Controller
            name="bio"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Bio"
                variant="outlined"
                multiline
                rows={4}
                placeholder="Tell us about yourself..."
              />
            )}
          />
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button
          variant="outlined"
          onClick={() => reset()}
          disabled={!isDirty || updateMutation.isPending}
        >
          Reset
        </Button>
        <Button
          type="submit"
          variant="contained"
          startIcon={updateMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={!isDirty || updateMutation.isPending}
        >
          Save Changes
        </Button>
      </Box>
    </Box>
  );
}
