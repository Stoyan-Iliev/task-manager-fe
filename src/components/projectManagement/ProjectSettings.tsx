import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Skeleton,
  Chip,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Info as InfoIcon,
  Group as GroupIcon,
  ViewKanban as WorkflowIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  GitHub as GitIcon,
} from '@mui/icons-material';
import { useProject, useUpdateProject } from '../../api/projects';
import { useCanManageMembers } from '../../hooks/useProjectPermissions';
import ProjectMembers from './ProjectMembers';
import TaskStatusManagement from './TaskStatusManagement';
import { GitIntegrationSettings } from '../gitIntegration/GitIntegrationSettings';
import type { ProjectType, ProjectUpdateRequest } from '../../types/project.types';

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

const getProjectTypeLabel = (type: ProjectType): string => {
  switch (type) {
    case 'SOFTWARE':
      return 'Software Development';
    case 'MARKETING':
      return 'Marketing Campaign';
    case 'BUSINESS':
      return 'Business Project';
    case 'OPERATIONS':
      return 'Operations';
  }
};

const ProjectSettings = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const parsedProjectId = projectId ? parseInt(projectId, 10) : null;

  const { data: project, isLoading, isError } = useProject(parsedProjectId);
  const updateProject = useUpdateProject();
  const canManage = useCanManageMembers(parsedProjectId);

  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<ProjectUpdateRequest>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        type: project.type,
      });
    }
  }, [project]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) =>
    setActiveTab(newValue);

  const handleInputChange = (field: keyof ProjectUpdateRequest, value: string | ProjectType) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!parsedProjectId) return;

    const updates: ProjectUpdateRequest = {};
    if (formData.name !== project?.name) updates.name = formData.name;
    if (formData.description !== project?.description) updates.description = formData.description;
    if (formData.type !== project?.type) updates.type = formData.type;

    if (Object.keys(updates).length === 0) {
      setHasChanges(false);
      return;
    }

    updateProject.mutate(
      { id: parsedProjectId, data: formData },
      {
        onSuccess: () => setHasChanges(false),
      }
    );
  };

  const handleCancel = () => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        type: project.type,
      });
      setHasChanges(false);
    }
  };

  // Loading state
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

  // Error state
  if (isError || !project || !parsedProjectId) {
    return (
      <Box
        sx={{
          p: 3,
          bgcolor: theme.palette.background.default,
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        }}
      >
        <Alert severity="error">Failed to load project settings. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: theme.palette.background.default,
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
      }}
    >
      {/* Header */}
      <Typography variant="h4" sx={{ mb: 3 }} color="text.primary">
        <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Project Settings
      </Typography>

      {/* Tabs */}
      <Paper
        sx={{
          mb: 3,
          bgcolor: theme.palette.background.paper,
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<InfoIcon />} label="General" iconPosition="start" />
          <Tab icon={<GroupIcon />} label="Members" iconPosition="start" />
          <Tab icon={<WorkflowIcon />} label="Workflow" iconPosition="start" />
          <Tab icon={<GitIcon />} label="Git Integration" iconPosition="start" />
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
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Project Key */}
            <Box>
              <Typography variant="subtitle2" gutterBottom color="text.primary">
                Project Key
              </Typography>
              <Chip label={project.key} color="primary" />
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 0.5 }}
              >
                Unique identifier for this project (cannot be changed)
              </Typography>
            </Box>

            <Divider />

            {/* Project Name */}
            <TextField
              label="Project Name"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!canManage || updateProject.isPending}
              required
              fullWidth
              helperText="The display name of your project"
            />

            {/* Description */}
            <TextField
              label="Description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={!canManage || updateProject.isPending}
              multiline
              rows={4}
              fullWidth
              helperText="A brief description of what this project is about"
            />

            {/* Type */}
            <FormControl fullWidth disabled={!canManage || updateProject.isPending}>
              <InputLabel id="project-type-label">Project Type</InputLabel>
              <Select
                labelId="project-type-label"
                value={formData.type || project.type}
                label="Project Type"
                onChange={(e) => handleInputChange('type', e.target.value as ProjectType)}
              >
                <MenuItem value="SOFTWARE">{getProjectTypeLabel('SOFTWARE')}</MenuItem>
                <MenuItem value="MARKETING">{getProjectTypeLabel('MARKETING')}</MenuItem>
                <MenuItem value="BUSINESS">{getProjectTypeLabel('BUSINESS')}</MenuItem>
                <MenuItem value="OPERATIONS">{getProjectTypeLabel('OPERATIONS')}</MenuItem>
              </Select>
            </FormControl>

            <Divider />

            {/* Metadata */}
            <Box>
              <Typography variant="subtitle2" gutterBottom color="text.primary">
                Project Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created: {new Date(project.createdAt).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last updated: {new Date(project.updatedAt).toLocaleDateString()}
              </Typography>
              {project.lead && (
                <Typography variant="body2" color="text.secondary">
                  Lead: {project.lead.username}
                </Typography>
              )}
            </Box>

            {/* Actions */}
            {canManage && (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={!hasChanges || updateProject.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={!hasChanges || updateProject.isPending}
                >
                  {updateProject.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            )}

            {!canManage && (
              <Alert severity="info" sx={{ mt: 2 }}>
                You don’t have permission to edit project settings. Only project leads and admins can modify these settings.
              </Alert>
            )}
          </Box>
        </TabPanel>

        {/* Members Tab */}
        <TabPanel value={activeTab} index={1}>
          <ProjectMembers projectId={parsedProjectId} />
        </TabPanel>

        {/* Workflow Tab */}
        <TabPanel value={activeTab} index={2}>
          <TaskStatusManagement projectId={parsedProjectId!} />
        </TabPanel>

        {/* Git Integration Tab */}
        <TabPanel value={activeTab} index={3}>
          {project && (
            <GitIntegrationSettings
              projectId={parsedProjectId!}
              organizationId={project.organizationId}
            />
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ProjectSettings;
