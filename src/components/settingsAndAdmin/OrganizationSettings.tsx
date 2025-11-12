import { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Breadcrumbs,
  Link,
  TextField,
  Button,
  Divider,
  Chip,
  useTheme,
  CircularProgress,
  Alert,
  Skeleton,
  IconButton,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Save as SaveIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router';
import { useSelector } from 'react-redux';
import { selectCurrentOrganizationId } from '../../redux/organizationSlice';
import { useOrganization, useUpdateOrganization } from '../../api/organizations';
import { useOrganizationRole } from '../../hooks/useOrganizationRole';
import { getRoleDisplayName } from '../../types/organization.types';
import MemberManagement from '../organization/MemberManagement';
import DeleteOrganizationDialog from '../organization/DeleteOrganizationDialog';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index} role="tabpanel">
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const OrganizationSettings = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentOrgId = useSelector(selectCurrentOrganizationId);
  const organizationId = id ? parseInt(id, 10) : currentOrgId;

  const [tabValue, setTabValue] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: organization, isLoading, isError } = useOrganization(organizationId);
  const updateOrganization = useUpdateOrganization();
  const { role: currentUserRole, canManageSettings, canDeleteOrganization } =
    useOrganizationRole(organizationId);

  const canEdit = canManageSettings;
  const canDelete = canDeleteOrganization;

  // Initialize form values
  useState(() => {
    if (organization && !isEditing) {
      setName(organization.name);
      setDescription(organization.description || '');
    }
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) =>
    setTabValue(newValue);

  const handleEditToggle = () => {
    if (isEditing) {
      setName(organization?.name || '');
      setDescription(organization?.description || '');
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    if (!organizationId || !name.trim()) return;

    updateOrganization.mutate(
      {
        id: organizationId,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
        },
      },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const handleCopySlug = () => {
    if (organization?.slug) {
      navigator.clipboard.writeText(organization.slug);
      toast.success('Slug copied to clipboard!');
    }
  };

  // --- Loading ---
  if (isLoading) {
    return (
      <Box
        sx={{
          p: 3,
          bgcolor: theme.palette.background.default,
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        }}
      >
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  // --- Error ---
  if (isError || !organization) {
    return (
      <Box
        sx={{
          p: 3,
          bgcolor: theme.palette.background.default,
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        }}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load organization. Please try again or go back to the dashboard.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          Go to Dashboard
        </Button>
      </Box>
    );
  }

  // --- Main Layout ---
  return (
    <Box
      sx={{
        p: 3,
        bgcolor: theme.palette.background.default,
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
      }}
    >
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          Dashboard
        </Link>
        <Typography color="text.primary">Organization Settings</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <BusinessIcon color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4" color="text.primary">
            {organization.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your organization settings and members
          </Typography>
        </Box>
      </Box>

      {/* Tabs container */}
      <Paper
        sx={{
          mb: 3,
          bgcolor: theme.palette.background.paper,
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="General" />
          <Tab label="Members" />
          <Tab label="Danger Zone" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Paper
        sx={{
          p: 3,
          bgcolor: theme.palette.background.paper,
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        {/* General Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 3,
            }}
          >
            {/* Left column: Form */}
            <Box
              sx={{
                flex: { xs: 1, md: 2 },
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              <TextField
                label="Organization Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing || updateOrganization.isPending}
                fullWidth
                required
                helperText={`${name.length}/100 characters`}
                inputProps={{ maxLength: 100 }}
              />

              {/* Slug */}
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    URL Slug (read-only)
                  </Typography>
                  <IconButton size="small" onClick={handleCopySlug}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      color: 'primary.main',
                      wordBreak: 'break-all',
                    }}
                  >
                    {organization.slug}
                  </Typography>
                </Box>
              </Box>

              {/* Description */}
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isEditing || updateOrganization.isPending}
                fullWidth
                multiline
                rows={4}
                helperText={`${description.length}/500 characters (optional)`}
                inputProps={{ maxLength: 500 }}
              />

              <Divider />

              {/* Actions */}
              {canEdit && (
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleEditToggle}
                        disabled={updateOrganization.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={updateOrganization.isPending || !name.trim()}
                        startIcon={
                          updateOrganization.isPending ? (
                            <CircularProgress size={16} />
                          ) : (
                            <SaveIcon />
                          )
                        }
                      >
                        {updateOrganization.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </>
                  ) : (
                    <Button variant="contained" onClick={handleEditToggle}>
                      Edit Organization
                    </Button>
                  )}
                </Box>
              )}
            </Box>

            {/* Right column: Sidebar */}
            <Box sx={{ flex: { xs: 1, md: 1 } }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Organization Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Members
                    </Typography>
                    <Typography variant="body2">
                      {organization.memberCount}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2">
                      {new Date(organization.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Created By
                    </Typography>
                    <Typography variant="body2">
                      {organization.createdByUsername}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="caption" color="text.secondary">
                      Your Role
                    </Typography>
                    <Chip
                      label={currentUserRole ? getRoleDisplayName(currentUserRole) : 'Member'}
                      size="small"
                      color="primary"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </TabPanel>

        {/* Members Tab */}
        <TabPanel value={tabValue} index={1}>
          <MemberManagement organizationId={organizationId!} />
        </TabPanel>

        {/* Danger Zone */}
        <TabPanel value={tabValue} index={2}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Deleting an organization is permanent and cannot be undone. All projects, tasks,
            and data associated with this organization will be deleted.
          </Alert>

          <Box
            sx={{
              p: 3,
              border: 2,
              borderColor: 'error.main',
              borderRadius: 2,
              bgcolor: 'error.light',
              ...theme.applyStyles('dark', {
                bgcolor: 'error.dark',
              }),
            }}
          >
            <Typography variant="h6" gutterBottom>
              Delete Organization
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Once you delete this organization, there is no going back. Please be certain.
            </Typography>
            {canDelete ? (
              <Button
                variant="contained"
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Organization
              </Button>
            ) : (
              <Alert severity="info">
                Only the organization owner can delete the organization.
              </Alert>
            )}
          </Box>
        </TabPanel>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <DeleteOrganizationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        organization={organization}
      />
    </Box>
  );
};

export default OrganizationSettings;
