import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Autocomplete,
  TextField,
  Avatar,
  Chip,
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useAddProjectMember } from '../../api/projectMembers';
import { useProjectMembers } from '../../api/projectMembers';
import { useOrganizationMembers } from '../../api/organizationMembers';
import { getRoleDisplayName, getRoleDescription } from '../../types/project.types';
import { selectCurrentOrganizationId } from '../../redux/organizationSlice';
import type { ProjectRole } from '../../types/project.types';
import type { MemberResponse } from '../../types/organization.types';

interface AddProjectMemberDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
}

const AddProjectMemberDialog = ({ open, onClose, projectId }: AddProjectMemberDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const organizationId = useSelector(selectCurrentOrganizationId);

  const { data: projectMembers } = useProjectMembers(projectId);
  const { data: orgMembers, isLoading: isLoadingOrgMembers } = useOrganizationMembers(organizationId);
  const addMember = useAddProjectMember(projectId);

  const [selectedMember, setSelectedMember] = useState<MemberResponse | null>(null);
  const [role, setRole] = useState<ProjectRole>('PROJECT_MEMBER');

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedMember(null);
      setRole('PROJECT_MEMBER');
    }
  }, [open]);

  // Get available members (org members not in project)
  const availableMembers = useMemo(() => {
    if (!orgMembers || !projectMembers) return [];
    const projectMemberUserIds = new Set(projectMembers.map((m) => m.userId));
    return orgMembers.filter((m) => !projectMemberUserIds.has(m.userId));
  }, [orgMembers, projectMembers]);

  const handleSubmit = async () => {
    if (!selectedMember) return;

    addMember.mutate(
      {
        userId: selectedMember.userId,
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
    if (e.key === 'Enter' && !e.shiftKey && selectedMember) {
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
        <Typography variant="h6">Add Project Member</Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
            Add members from your organization to collaborate on this project.
          </Alert>

          {/* Member Selection */}
          <Autocomplete
            value={selectedMember}
            onChange={(_, newValue) => setSelectedMember(newValue)}
            options={availableMembers}
            getOptionLabel={(option) => option.username}
            loading={isLoadingOrgMembers}
            disabled={addMember.isPending}
            isOptionEqualToValue={(option, value) => option.userId === value.userId}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Member"
                placeholder="Search by name or email..."
                onKeyPress={handleKeyPress}
                required
                autoFocus
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isLoadingOrgMembers ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    bgcolor: 'background.default',
                  },
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.userId}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    mr: 2,
                    bgcolor: 'primary.main',
                    fontSize: '0.875rem',
                  }}
                >
                  {option.username.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {option.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email}
                  </Typography>
                </Box>
              </Box>
            )}
            noOptionsText={
              availableMembers.length === 0
                ? 'All organization members are already in this project'
                : 'No members found'
            }
          />

          {/* Role Selection */}
          <FormControl fullWidth>
            <InputLabel id="role-select-label">Project Role</InputLabel>
            <Select
              labelId="role-select-label"
              value={role}
              label="Project Role"
              onChange={(e) => setRole(e.target.value as ProjectRole)}
              disabled={addMember.isPending}
              sx={{
                bgcolor: 'background.default',
              }}
            >
              <MenuItem value="PROJECT_OWNER">
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {getRoleDisplayName('PROJECT_OWNER')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getRoleDescription('PROJECT_OWNER')}
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="PROJECT_ADMIN">
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {getRoleDisplayName('PROJECT_ADMIN')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getRoleDescription('PROJECT_ADMIN')}
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="PROJECT_MEMBER">
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {getRoleDisplayName('PROJECT_MEMBER')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getRoleDescription('PROJECT_MEMBER')}
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="PROJECT_VIEWER">
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {getRoleDisplayName('PROJECT_VIEWER')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getRoleDescription('PROJECT_VIEWER')}
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Role Description */}
          {selectedMember && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {selectedMember.username.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {selectedMember.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedMember.email}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={`Will be added as ${getRoleDisplayName(role)}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={addMember.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={addMember.isPending || !selectedMember}
          startIcon={
            addMember.isPending ? <CircularProgress size={16} /> : <PersonAddIcon />
          }
        >
          {addMember.isPending ? 'Adding...' : 'Add Member'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddProjectMemberDialog;
