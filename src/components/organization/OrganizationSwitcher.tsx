import { useState, useEffect } from 'react';
import {
  Select,
  MenuItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  ListItemIcon,
  Box,
  Skeleton,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentOrganizationId } from '../../redux/organizationSlice';
import { setCurrentOrganization } from '../../redux/organizationSlice';
import { useOrganizations } from '../../api/organizations';
import CreateOrganizationDialog from './CreateOrganizationDialog';

const OrganizationSwitcher = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const currentOrgId = useSelector(selectCurrentOrganizationId);
  const { data: organizations, isLoading, isError } = useOrganizations();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Auto-select first organization if none is selected
  useEffect(() => {
    if (!currentOrgId && organizations && organizations.length > 0) {
      dispatch(setCurrentOrganization(organizations[0].id));
    }
  }, [currentOrgId, organizations, dispatch]);

  const handleOrgChange = (orgId: number | string) => {
    if (orgId === 'create') {
      setCreateDialogOpen(true);
    } else if (typeof orgId === 'number') {
      dispatch(setCurrentOrganization(orgId));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Skeleton
        variant="rectangular"
        width={isMobile ? '100%' : 200}
        height={40}
        sx={{ borderRadius: 1 }}
      />
    );
  }

  // Error state
  if (isError || !organizations) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          bgcolor: 'error.light',
          color: 'error.contrastText',
          borderRadius: 1,
        }}
      >
        <BusinessIcon fontSize="small" />
        <Typography variant="body2">Failed to load organizations</Typography>
      </Box>
    );
  }

  // Empty state - no organizations yet
  if (organizations.length === 0) {
    return (
      <>
        <Box
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 1,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          <AddIcon fontSize="small" />
          <Typography variant="body2">Create Organization</Typography>
        </Box>
        <CreateOrganizationDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
        />
      </>
    );
  }

  // Get current organization or first one if not set
  const selectedOrgId = currentOrgId || organizations[0]?.id;

  return (
    <>
      <Select
        value={selectedOrgId || ''}
        onChange={(e) => handleOrgChange(e.target.value as number | string)}
        displayEmpty
        size="small"
        sx={{
          minWidth: { xs: 150, sm: 200 },
          maxWidth: { xs: 200, sm: 250 },
          bgcolor: 'background.paper',
          color: 'text.primary',
          border: 1,
          borderColor: 'divider',
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
          '&:hover': {
            borderColor: 'primary.main',
          },
          '&.Mui-focused': {
            borderColor: 'primary.main',
          },
        }}
        renderValue={(value) => {
          if (!value) return <Typography variant="body2">Select Organization</Typography>;

          const org = organizations.find((o) => o.id === value);
          if (!org) return null;

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  bgcolor: 'primary.main',
                  fontSize: '0.75rem',
                }}
              >
                {org.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2" noWrap>
                {org.name}
              </Typography>
            </Box>
          );
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              bgcolor: 'background.paper',
              backgroundImage: 'none',
              mt: 1,
              maxHeight: 400,
              ...theme.applyStyles('dark', {
                boxShadow: theme.shadows[8],
              }),
            },
          },
        }}
      >
        {organizations.map((org) => (
          <MenuItem key={org.id} value={org.id}>
            <ListItemAvatar>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 32,
                  height: 32,
                }}
              >
                {org.name.charAt(0).toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={org.name}
              secondary={`${org.memberCount} ${org.memberCount === 1 ? 'member' : 'members'}`}
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: org.id === selectedOrgId ? 600 : 400,
              }}
              secondaryTypographyProps={{
                variant: 'caption',
              }}
            />
          </MenuItem>
        ))}

        <Divider sx={{ my: 1 }} />

        <MenuItem
          value="create"
          sx={{
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.light',
            },
          }}
        >
          <ListItemIcon>
            <AddIcon sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText
            primary="Create Organization"
            primaryTypographyProps={{
              variant: 'body2',
              fontWeight: 500,
            }}
          />
        </MenuItem>
      </Select>

      <CreateOrganizationDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </>
  );
};

export default OrganizationSwitcher;
