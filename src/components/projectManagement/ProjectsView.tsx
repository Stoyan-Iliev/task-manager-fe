import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Skeleton,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FolderIcon from '@mui/icons-material/Folder';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentOrganizationId } from '../../redux/organizationSlice';
import { setCurrentProject } from '../../redux/projectSlice';
import { useProjects, useCreateProject, useDeleteProject } from '../../api/projects';
import type { ProjectType, ProjectCreateRequest } from '../../types/project.types';

const ProjectsView: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentOrgId = useSelector(selectCurrentOrganizationId);

  const { data: projects = [], isLoading, error } = useProjects(currentOrgId);
  const createProjectMutation = useCreateProject(currentOrgId || 0);
  const deleteProjectMutation = useDeleteProject();

  const [openDialog, setOpenDialog] = useState(false);
  const [newProject, setNewProject] = useState<ProjectCreateRequest>({
    name: '',
    key: '',
    type: 'SOFTWARE',
    description: '',
  });

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    // Reset form when closing
    setNewProject({
      name: '',
      key: '',
      type: 'SOFTWARE',
      description: '',
    });
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      alert('Please enter a project name');
      return;
    }

    if (!newProject.key.trim()) {
      alert('Please enter a project key');
      return;
    }

    if (!currentOrgId) {
      alert('Please select an organization first');
      return;
    }

    try {
      await createProjectMutation.mutateAsync(newProject);

      // Close dialog and reset form
      handleCloseDialog();
    } catch (error) {
      // Error handled by mutation's onError
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProjectMutation.mutateAsync(projectId);
      } catch (error) {
        // Error is handled by mutation's onError
      }
    }
  };

  const generateKey = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 5);
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

  const getProjectTypeLabel = (type: ProjectType) => {
    switch (type) {
      case 'SOFTWARE':
        return 'Software';
      case 'MARKETING':
        return 'Marketing';
      case 'BUSINESS':
        return 'Business';
      case 'OPERATIONS':
        return 'Operations';
      default:
        return type;
    }
  };

  const handleOpenProject = (projectId: number) => {
    dispatch(setCurrentProject(projectId));
    navigate(`/projects/${projectId}`);
  };

  const handleOpenSettings = (projectId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/projects/${projectId}/settings`);
  };

  // Render Dialog (shared across all states)
  const renderDialog = () => (
    openDialog && (
      <Dialog
        open={true}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        sx={{
          zIndex: 10000,
          '& .MuiDialog-paper': {
            zIndex: 10001,
          }
        }}
      >
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            required
            value={newProject.name}
            onChange={(e) => {
              const name = e.target.value;
              setNewProject({
                ...newProject,
                name,
                key: newProject.key || generateKey(name),
              });
            }}
            helperText="Enter a descriptive name for your project"
          />
          <TextField
            margin="dense"
            label="Project Key"
            fullWidth
            required
            value={newProject.key}
            onChange={(e) =>
              setNewProject({
                ...newProject,
                key: e.target.value.toUpperCase(),
              })
            }
            helperText="Short identifier (e.g., WRD, APP) - max 5 characters"
            inputProps={{ maxLength: 5 }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Project Type</InputLabel>
            <Select
              value={newProject.type}
              label="Project Type"
              onChange={(e) =>
                setNewProject({
                  ...newProject,
                  type: e.target.value as ProjectType,
                })
              }
            >
              <MenuItem value="SOFTWARE">Software</MenuItem>
              <MenuItem value="MARKETING">Marketing</MenuItem>
              <MenuItem value="BUSINESS">Business</MenuItem>
              <MenuItem value="OPERATIONS">Operations</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={newProject.description}
            onChange={(e) =>
              setNewProject({ ...newProject, description: e.target.value })
            }
            helperText="Provide a brief description of the project"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            color="primary"
            disabled={
              !newProject.name.trim() ||
              !newProject.key.trim() ||
              createProjectMutation.isPending
            }
          >
            {createProjectMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    )
  );

  // Loading state
  if (isLoading) {
    return (
      <>
        <Box
          sx={{
            p: 3,
            bgcolor: theme.palette.background.default,
            minHeight: {
              xs: 'calc(100vh - 56px)',
              sm: 'calc(100vh - 64px)',
            },
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Skeleton width={200} height={40} />
            <Skeleton width={150} height={40} />
          </Box>
          <Grid container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        </Box>
        {renderDialog()}
      </>
    );
  }

  // Error state 1
  if (error) {
    return (
      <>
        <Box
          sx={{
            p: 3,
            bgcolor: theme.palette.background.default,
            minHeight: {
              xs: 'calc(100vh - 56px)',
              sm: 'calc(100vh - 64px)',
            },
          }}
        >
          <Alert severity="error">
            Failed to load projects. Please try again later.
          </Alert>
        </Box>
        {renderDialog()}
      </>
    );
  }

  // No organization selected
  if (!currentOrgId) {
    return (
      <>
        <Box
          sx={{
            p: 3,
            bgcolor: theme.palette.background.default,
            minHeight: {
              xs: 'calc(100vh - 56px)',
              sm: 'calc(100vh - 64px)',
            },
          }}
        >
          <Alert severity="info">
            Please select an organization to view projects.
          </Alert>
        </Box>
        {renderDialog()}
      </>
    );
  }

  // Empty state
  if (projects.length === 0) {
    return (
      <>
        <Box
          sx={{
            p: 3,
            bgcolor: theme.palette.background.default,
            minHeight: {
              xs: 'calc(100vh - 56px)',
              sm: 'calc(100vh - 64px)',
            },
          }}
        >
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}
          >
            <FolderRoundedIcon
              sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h5" gutterBottom color="text.primary">
              No projects yet
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Create your first project to get started with task management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
            >
              Create Project
            </Button>
          </Box>
        </Box>
        {renderDialog()}
      </>
    );
  }

  // Main content
  return (
    <Box
      sx={{
        p: 3,
        bgcolor: theme.palette.background.default,
        minHeight: {
          xs: 'calc(100vh - 56px)',
          sm: 'calc(100vh - 64px)',
        },
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }} color="text.primary">
          <FolderRoundedIcon sx={{ mr: 1 }} />
          Projects
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Create Project
        </Button>
      </Box>

      {/* Project Cards */}
      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                boxShadow: 3,
                bgcolor: theme.palette.background.paper,
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              onClick={() => handleOpenProject(project.id)}
            >
              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                {/* Header */}
                <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center" sx={{ flexGrow: 1, minWidth: 0 }}>
                    <FolderIcon color="primary" sx={{ mr: 1, flexShrink: 0 }} />
                    <Typography
                      variant="h6"
                      color="text.primary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {project.name}
                    </Typography>
                  </Box>
                  <Chip
                    label={project.key}
                    size="small"
                    color={getProjectTypeColor(project.type)}
                    sx={{ fontWeight: 'bold', ml: 1, flexShrink: 0 }}
                  />
                </Box>

                {/* Type Badge */}
                <Box mb={2}>
                  <Chip
                    label={getProjectTypeLabel(project.type)}
                    size="small"
                    variant="outlined"
                    color={getProjectTypeColor(project.type)}
                  />
                </Box>

                {/* Lead Info */}
                {project.lead && (
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.875rem', bgcolor: 'primary.main' }}>
                      {(project.lead.fullName || project.lead.username || 'U').charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      Lead: {project.lead.fullName || project.lead.username}
                    </Typography>
                  </Box>
                )}

                {/* Description */}
                {project.description ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '2.5em',
                    }}
                  >
                    {project.description}
                  </Typography>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.disabled"
                    fontStyle="italic"
                    sx={{ mb: 2, minHeight: '2.5em' }}
                  >
                    No description
                  </Typography>
                )}

                <Divider sx={{ my: 1.5 }} />

                {/* Stats */}
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <AssignmentIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {project.taskCount || 0} tasks
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <GroupIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {project.memberCount || 0} members
                    </Typography>
                  </Box>
                </Box>

                {/* Date */}
                <Typography variant="caption" color="text.disabled" display="block" mt={1}>
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>

              {/* Actions */}
              <CardActions sx={{ pt: 0, px: 2, pb: 2, gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ArrowForwardIcon />}
                  onClick={() => handleOpenProject(project.id)}
                  fullWidth
                >
                  Open
                </Button>
                <IconButton
                  size="small"
                  onClick={(e) => handleOpenSettings(project.id, e)}
                  title="Project settings"
                  sx={{ ml: 'auto' }}
                >
                  <SettingsIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}
                  title="Delete project"
                  disabled={deleteProjectMutation.isPending}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Project Dialog */}
      {renderDialog()}
    </Box>
  );
};

export default ProjectsView;
