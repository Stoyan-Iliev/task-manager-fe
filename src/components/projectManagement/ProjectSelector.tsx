import React from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  Box,
  Typography,
  Chip,
  Divider,
  Button,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentOrganizationId } from '../../redux/organizationSlice';
import {
  selectCurrentProjectId,
  selectProjectsByOrganization,
  setCurrentProject,
} from '../../redux/projectSlice';
import { useProjects } from '../../api/projects';
import type { ProjectType } from '../../types/project.types';

const ProjectSelector: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentOrgId = useSelector(selectCurrentOrganizationId);
  const currentProjectId = useSelector(selectCurrentProjectId);
  const cachedProjects = useSelector(selectProjectsByOrganization(currentOrgId));

  const { data: projects = cachedProjects, isLoading } = useProjects(currentOrgId);

  const handleProjectChange = (value: string) => {
    if (value === 'view-all') {
      navigate('/projects');
      return;
    }
    const projectId = parseInt(value, 10);
    dispatch(setCurrentProject(projectId));
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

  if (!currentOrgId) return null;

  return (
    <FormControl sx={{ minWidth: 220 }} size="small">
      <Select
        value={currentProjectId?.toString() || ''}
        onChange={(e) => handleProjectChange(e.target.value)}
        displayEmpty
        disabled={isLoading}
        sx={{ bgcolor: 'background.paper' }}
        renderValue={(selected) => {
          if (!selected) {
            return (
              <Typography variant="body2" color="text.secondary">
                Select Project
              </Typography>
            );
          }
          const selectedProject = projects.find((p) => p.id === Number(selected));
          if (!selectedProject) return 'Select Project';
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={selectedProject.key}
                size="small"
                color={getProjectTypeColor(selectedProject.type)}
                sx={{ minWidth: 45, fontSize: '0.7rem' }}
              />
              <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                {selectedProject.name}
              </Typography>
            </Box>
          );
        }}
      >
        {isLoading ? (
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Loading projects...
              </Typography>
            </Box>
          </MenuItem>
        ) : projects.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No projects yet
            </Typography>
          </MenuItem>
        ) : (
          <>
            <MenuItem value="" disabled>
              <Typography variant="body2" color="text.secondary">
                Select a project
              </Typography>
            </MenuItem>
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id.toString()}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Chip
                    label={project.key}
                    size="small"
                    color={getProjectTypeColor(project.type)}
                    sx={{ minWidth: 45, fontSize: '0.7rem' }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {project.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block' }}
                      noWrap
                    >
                      {project.type}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </>
        )}

        {projects.length > 0 && (
          <>
            <Divider />
            <MenuItem value="view-all">
              <Button size="small" fullWidth sx={{ justifyContent: 'flex-start' }}>
                View all projects →
              </Button>
            </MenuItem>
          </>
        )}
      </Select>
    </FormControl>
  );
};

export default ProjectSelector;
