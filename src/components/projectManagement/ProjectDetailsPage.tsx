import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  Skeleton,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SettingsIcon from '@mui/icons-material/Settings';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { useProject } from '../../api/projects';
import type { ProjectType } from '../../types/project.types';
import TaskDrawer from '../taskManagement/TaskDrawer';

const ProjectDetailsPage: React.FC = () => {
  const theme = useTheme();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: project, isLoading, error } = useProject(projectId ? parseInt(projectId, 10) : null);

  // Handle task query parameter for opening TaskDrawer
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  useEffect(() => {
    const taskIdParam = searchParams.get('task');
    if (taskIdParam) {
      setSelectedTaskId(parseInt(taskIdParam, 10));
    }
  }, [searchParams]);

  const handleCloseTaskDrawer = () => {
    setSelectedTaskId(null);
    // Remove task query parameter from URL
    searchParams.delete('task');
    setSearchParams(searchParams);
  };

  const getProjectTypeColor = (type: ProjectType) => {
    switch (type) {
      case 'SOFTWARE':
        return 'primary';
      case 'MARKETING':
        return 'secondary';
      case 'BUSINESS':
        return 'success';
      case 'OPERATIONS':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <Container
        maxWidth="lg"
        sx={{
          mt: 4,
          mb: 4,
          bgcolor: theme.palette.background.default,
          minHeight: {
            xs: 'calc(100vh - 56px)',
            sm: 'calc(100vh - 64px)',
          },
        }}
      >
        <Skeleton width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  // Error state or project not found
  if (error || !project) {
    return (
      <Container
        maxWidth="lg"
        sx={{
          mt: 4,
          bgcolor: theme.palette.background.default,
          minHeight: {
            xs: 'calc(100vh - 56px)',
            sm: 'calc(100vh - 64px)',
          },
        }}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          Project not found or failed to load.
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
        >
          Back to Projects
        </Button>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: 4,
        mb: 4,
        bgcolor: theme.palette.background.default,
        minHeight: {
          xs: 'calc(100vh - 56px)',
          sm: 'calc(100vh - 64px)',
        },
      }}
    >
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/projects')}
        sx={{ mb: 2 }}
      >
        Back to Projects
      </Button>

            <Paper sx={{ p: 3, borderRadius: 2 }}>
        {/* Project Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FolderIcon color="primary" sx={{ fontSize: 48 }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  label={project.key}
                  color={getProjectTypeColor(project.type)}
                  sx={{ fontWeight: 'bold' }}
                />
                <Typography variant="h4" component="h1">
                  {project.name}
                </Typography>
              </Box>
              <Chip label={project.type} size="small" variant="outlined" />
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => navigate(`/projects/${project.id}/settings`)}
          >
            Settings
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Project Description */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Description
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {project.description || 'No description provided'}
          </Typography>
        </Box>

        {/* Project Details Grid */}
       <Grid container spacing={3}>
          {/* Project Lead */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                p: 2,
                boxShadow: 3,
                borderRadius: 2,
                height: '100%',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? theme.palette.background.paper
                    : theme.palette.action.hover,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PersonIcon color="primary" />
                  <Typography variant="h6">Project Lead</Typography>
                </Box>
                {project.lead ? (
                  <Box>
                    <Typography variant="body1">
                      {project.lead.fullName || project.lead.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {project.lead.email}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No lead assigned
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Project Timeline */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                p: 2,
                boxShadow: 3,
                borderRadius: 2,
                height: '100%',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? theme.palette.background.paper
                    : theme.palette.action.hover,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CalendarTodayIcon color="primary" />
                  <Typography variant="h6">Timeline</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created: {formatDate(project.createdAt)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated: {formatDate(project.updatedAt)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Project Statistics */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                p: 2,
                boxShadow: 3,
                borderRadius: 2,
                height: '100%',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? theme.palette.background.paper
                    : theme.palette.action.hover,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Statistics
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tasks: {project.taskCount || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Members: {project.memberCount || 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Project Info */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                p: 2,
                boxShadow: 3,
                borderRadius: 2,
                height: '100%',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? theme.palette.background.paper
                    : theme.palette.action.hover,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Project Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    ID: {project.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Organization ID: {project.organizationId}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Task Drawer - opens when task query parameter is present */}
      {selectedTaskId && project && (
        <TaskDrawer
          taskId={selectedTaskId}
          projectId={project.id}
          organizationId={project.organizationId}
          open={!!selectedTaskId}
          onClose={handleCloseTaskDrawer}
        />
      )}
    </Container>
  );
};

export default ProjectDetailsPage;
