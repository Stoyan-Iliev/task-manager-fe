import { useParams, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import { Container, Box, Breadcrumbs, Link, Typography } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useTaskByKey } from '../../api/tasks';
import { selectCurrentOrganizationId } from '../../redux/organizationSlice';
import TaskDrawer from '../taskManagement/TaskDrawer';

const TaskDetailPage = () => {
  const { taskKey } = useParams<{ taskKey: string }>();
  const navigate = useNavigate();
  const organizationId = useSelector(selectCurrentOrganizationId);

  // Fetch task to get project info for breadcrumbs
  const { data: task } = useTaskByKey(
    organizationId,
    taskKey || null
  );

  const handleClose = () => {
    // Navigate back or to tasks view
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/tasks');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      {task && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 3 }}
        >
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/tasks')}
            sx={{ color: 'text.primary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Tasks
          </Link>
          {task.project && (
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate(`/projects/${task.projectId}`)}
              sx={{ color: 'text.primary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              {task.project.name}
            </Link>
          )}
          <Typography color="text.primary" variant="body2">
            {task.key}
          </Typography>
        </Breadcrumbs>
      )}

      {/* Task Detail View - Pass taskKey instead of taskId */}
      <TaskDrawer
        taskKey={taskKey || null}
        projectId={null} // Will be extracted from task
        organizationId={organizationId}
        open={true}
        onClose={handleClose}
        asPage={true}
      />
    </Container>
  );
};

export default TaskDetailPage;
