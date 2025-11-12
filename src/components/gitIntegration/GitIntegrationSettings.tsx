import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  GitHub as GitHubIcon,
  Code as GitLabIcon,
} from '@mui/icons-material';
import { useOrganizationIntegrations, useCreateIntegration, useDeleteIntegration } from '../../api/git';
import toast from 'react-hot-toast';

interface GitIntegrationSettingsProps {
  projectId: number;
  organizationId: number;
}

type GitProvider = 'GITHUB' | 'GITLAB';

export const GitIntegrationSettings = ({ projectId, organizationId }: GitIntegrationSettingsProps) => {
  const { data: integrations, isLoading } = useOrganizationIntegrations(organizationId);
  const createIntegration = useCreateIntegration();
  const deleteIntegration = useDeleteIntegration();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [formData, setFormData] = useState({
    provider: 'GITHUB' as GitProvider,
    repositoryUrl: '',
    accessToken: '',
    branch: 'main',
  });

  const projectIntegrations = integrations?.filter((integration) => integration.projectId === projectId) || [];

  const handleOpenDialog = () => {
    setFormData({
      provider: 'GITHUB',
      repositoryUrl: '',
      accessToken: '',
      branch: 'main',
    });
    setShowToken(false);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSubmit = async () => {
    if (!formData.repositoryUrl || !formData.accessToken) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createIntegration.mutateAsync({
        orgId: organizationId,
        data: {
          projectId: projectId,
          provider: formData.provider,
          repositoryUrl: formData.repositoryUrl,
          accessToken: formData.accessToken,
          branch: formData.branch || 'main',
        },
      });
      toast.success('Git integration added successfully');
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to create git integration:', error);
    }
  };

  const handleDelete = async (integrationId: number) => {
    if (!confirm('Are you sure you want to remove this Git integration?')) {
      return;
    }

    try {
      await deleteIntegration.mutateAsync(integrationId);
      toast.success('Git integration removed');
    } catch (error) {
      console.error('Failed to delete git integration:', error);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'GITHUB':
        return <GitHubIcon />;
      case 'GITLAB':
        return <GitLabIcon />;
      default:
        return <GitHubIcon />;
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Git Integrations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Connect your Git repositories to link commits and pull requests to tasks
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
          Add Integration
        </Button>
      </Box>

      {projectIntegrations.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No Git integrations configured. Add one to start linking commits and PRs to tasks.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {projectIntegrations.map((integration) => (
            <Card key={integration.id} sx={{ mb: 2 }}>
              <ListItem>
                <Box display="flex" alignItems="center" gap={2} flex={1}>
                  {getProviderIcon(integration.provider)}
                  <Box flex={1}>
                    <ListItemText
                      primary={integration.repositoryUrl}
                      secondary={
                        <Box display="flex" gap={1} mt={0.5}>
                          <Chip label={integration.provider} size="small" />
                          <Chip label={`Branch: ${integration.branch}`} size="small" variant="outlined" />
                        </Box>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </Box>
                </Box>
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleDelete(integration.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </Card>
          ))}
        </List>
      )}

      {/* Add Integration Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Git Integration</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="info" sx={{ mb: 1 }}>
              Connect your Git repository to automatically link commits and pull requests to tasks. You'll need a
              personal access token with read permissions.
            </Alert>

            <FormControl fullWidth>
              <InputLabel>Git Provider</InputLabel>
              <Select
                value={formData.provider}
                label="Git Provider"
                onChange={(e) => setFormData({ ...formData, provider: e.target.value as GitProvider })}
              >
                <MenuItem value="GITHUB">
                  <Box display="flex" alignItems="center" gap={1}>
                    <GitHubIcon fontSize="small" />
                    GitHub
                  </Box>
                </MenuItem>
                <MenuItem value="GITLAB">
                  <Box display="flex" alignItems="center" gap={1}>
                    <GitLabIcon fontSize="small" />
                    GitLab
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Repository URL"
              placeholder="https://github.com/username/repository"
              value={formData.repositoryUrl}
              onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
              fullWidth
              required
              helperText="The full URL to your Git repository"
            />

            <TextField
              label="Access Token"
              type={showToken ? 'text' : 'password'}
              value={formData.accessToken}
              onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
              fullWidth
              required
              helperText="Personal access token with repository read permissions"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowToken(!showToken)} edge="end">
                      {showToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Default Branch"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              fullWidth
              placeholder="main"
              helperText="The default branch to track (e.g., main, master, develop)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={createIntegration.isPending}>
            {createIntegration.isPending ? 'Adding...' : 'Add Integration'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
