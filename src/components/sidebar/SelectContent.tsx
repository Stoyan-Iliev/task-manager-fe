import { useEffect } from 'react';
import MuiAvatar from '@mui/material/Avatar';
import MuiListItemAvatar from '@mui/material/ListItemAvatar';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Select, { type SelectChangeEvent, selectClasses } from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
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
import { CircularProgress, Typography } from '@mui/material';

const Avatar = styled(MuiAvatar)(({ theme }) => ({
  width: 28,
  height: 28,
  backgroundColor: (theme.vars || theme).palette.background.paper,
  color: (theme.vars || theme).palette.text.secondary,
  border: `1px solid ${(theme.vars || theme).palette.divider}`,
}));

const ListItemAvatar = styled(MuiListItemAvatar)({
  minWidth: 0,
  marginRight: 12,
});

const getProjectTypeIcon = (_type: ProjectType) => {
  // You can customize icons based on project type
  return <FolderRoundedIcon sx={{ fontSize: '1rem' }} />;
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

export default function SelectContent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentOrgId = useSelector(selectCurrentOrganizationId);
  const currentProjectId = useSelector(selectCurrentProjectId);
  const cachedProjects = useSelector(selectProjectsByOrganization(currentOrgId));

  const { data: projects = cachedProjects, isLoading } = useProjects(currentOrgId);

  // Auto-select first project if none is selected
  useEffect(() => {
    if (!currentProjectId && projects && projects.length > 0) {
      dispatch(setCurrentProject(projects[0].id));
    }
  }, [currentProjectId, projects, dispatch]);

  const handleChange = (event: SelectChangeEvent) => {
    const value = event.target.value;

    if (value === 'add-project') {
      navigate('/projects');
      return;
    }

    const projectId = parseInt(value, 10);
    dispatch(setCurrentProject(projectId));
  };

  // If no organization selected, show placeholder
  if (!currentOrgId) {
    return (
      <Select
        displayEmpty
        fullWidth
        disabled
        value=""
        sx={{
          maxHeight: 56,
          width: 215,
          [`& .${selectClasses.select}`]: {
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            pl: 1,
          },
        }}
      >
        <MenuItem value="">
          <ListItemText
            primary="Select organization first"
            secondary="No projects available"
          />
        </MenuItem>
      </Select>
    );
  }

  return (
    <Select
      labelId="project-select"
      id="project-simple-select"
      value={currentProjectId?.toString() || ''}
      onChange={handleChange}
      displayEmpty
      inputProps={{ 'aria-label': 'Select project' }}
      fullWidth
      sx={{
        maxHeight: 56,
        width: 215,
        '&.MuiList-root': {
          p: '8px',
        },
        [`& .${selectClasses.select}`]: {
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          pl: 1,
        },
      }}
    >
      {isLoading ? (
        <MenuItem disabled>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <ListItemText primary="Loading projects..." />
        </MenuItem>
      ) : projects.length === 0 ? [
          <MenuItem key="no-projects" value="" disabled>
            <ListItemText
              primary="No projects yet"
              secondary="Create your first project"
            />
          </MenuItem>,
          <Divider key="divider" sx={{ mx: -1 }} />,
          <MenuItem key="add-project" value="add-project">
            <ListItemIcon>
              <AddRoundedIcon />
            </ListItemIcon>
            <ListItemText primary="Create project" />
          </MenuItem>
        ] : [
          !currentProjectId && (
            <MenuItem key="placeholder" value="" disabled>
              <Typography variant="body2" color="text.secondary">
                Select a project
              </Typography>
            </MenuItem>
          ),
          ...projects.map((project) => (
            <MenuItem key={project.id} value={project.id.toString()}>
              <ListItemAvatar>
                <Avatar alt={project.name}>
                  {getProjectTypeIcon(project.type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={`${project.key} - ${project.name}`}
                secondary={getProjectTypeLabel(project.type)}
              />
            </MenuItem>
          )),
          <Divider key="divider" sx={{ mx: -1 }} />,
          <MenuItem key="add-project" value="add-project">
            <ListItemIcon>
              <AddRoundedIcon />
            </ListItemIcon>
            <ListItemText primary="View all projects" />
          </MenuItem>
        ].filter(Boolean)}
    </Select>
  );
}
