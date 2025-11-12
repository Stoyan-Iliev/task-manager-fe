import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Stack,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublishIcon from '@mui/icons-material/Publish';
import ArchiveIcon from '@mui/icons-material/Archive';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import NotesIcon from '@mui/icons-material/Notes';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  useRelease,
  useReleaseTasks,
  useDeleteRelease,
  usePublishRelease,
  useArchiveRelease,
  useRemoveTaskFromRelease,
  useGenerateReleaseNotes,
} from '../../api/releases';
import type { ReleaseStatus } from '../../types/release.types';

interface ReleaseDetailsProps {
  releaseId: number;
  onEdit: () => void;
  onClose: () => void;
}

const statusColors: Record<ReleaseStatus, 'default' | 'info' | 'success' | 'warning'> = {
  PLANNED: 'default',
  IN_PROGRESS: 'info',
  RELEASED: 'success',
  ARCHIVED: 'warning',
};

export const ReleaseDetails = ({ releaseId, onEdit, onClose }: ReleaseDetailsProps) => {
  const { data: release, isLoading } = useRelease(releaseId);
  const { data: tasks } = useReleaseTasks(releaseId);
  const deleteRelease = useDeleteRelease();
  const publishRelease = usePublishRelease();
  const archiveRelease = useArchiveRelease();
  const removeTask = useRemoveTaskFromRelease();
  const generateNotes = useGenerateReleaseNotes();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [taskMenuAnchor, setTaskMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const handleDelete = async () => {
    try {
      await deleteRelease.mutateAsync(releaseId);
      setDeleteDialogOpen(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete release:', error);
    }
  };

  const handlePublish = async () => {
    try {
      await publishRelease.mutateAsync(releaseId);
    } catch (error) {
      console.error('Failed to publish release:', error);
    }
  };

  const handleArchive = async () => {
    try {
      await archiveRelease.mutateAsync(releaseId);
    } catch (error) {
      console.error('Failed to archive release:', error);
    }
  };

  const handleGenerateNotes = async () => {
    try {
      const notes = await generateNotes.mutateAsync(releaseId);
      setReleaseNotes(notes);
      setNotesDialogOpen(true);
    } catch (error) {
      console.error('Failed to generate release notes:', error);
    }
  };

  const handleRemoveTask = async (taskId: number) => {
    try {
      await removeTask.mutateAsync({ releaseId, taskId });
      setTaskMenuAnchor(null);
      setSelectedTaskId(null);
    } catch (error) {
      console.error('Failed to remove task:', error);
    }
  };

  const handleTaskMenuOpen = (event: React.MouseEvent<HTMLElement>, taskId: number) => {
    setTaskMenuAnchor(event.currentTarget);
    setSelectedTaskId(taskId);
  };

  const handleTaskMenuClose = () => {
    setTaskMenuAnchor(null);
    setSelectedTaskId(null);
  };

  if (isLoading || !release) {
    return (
      <Box p={3}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const completionPercentage =
    release.taskCount > 0 ? (release.completedTaskCount / release.taskCount) * 100 : 0;

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="h5">{release.name}</Typography>
                <Chip
                  label={release.status.replace('_', ' ')}
                  color={statusColors[release.status]}
                  size="small"
                />
              </Box>
              {release.version && (
                <Typography variant="body2" color="text.secondary">
                  Version: {release.version}
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Edit release" arrow>
                <IconButton onClick={onEdit} size="small">
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete release" arrow>
                <IconButton
                  onClick={() => setDeleteDialogOpen(true)}
                  size="small"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Description */}
          {release.description && (
            <Typography variant="body2" color="text.secondary" paragraph>
              {release.description}
            </Typography>
          )}

          {/* Metadata */}
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {release.releaseDate && (
              <Chip
                label={`Target: ${new Date(release.releaseDate).toLocaleDateString()}`}
                size="small"
                variant="outlined"
              />
            )}
            {release.releasedAt && (
              <Chip
                icon={<CheckCircleIcon />}
                label={`Released: ${new Date(release.releasedAt).toLocaleDateString()}`}
                size="small"
                color="success"
              />
            )}
            <Chip
              label={`Created by ${release.createdByUsername}`}
              size="small"
              variant="outlined"
            />
          </Stack>

          {/* Actions */}
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={1}>
            {release.status === 'IN_PROGRESS' && (
              <Button
                startIcon={<PublishIcon />}
                onClick={handlePublish}
                variant="contained"
                color="success"
                disabled={publishRelease.isPending}
              >
                Publish Release
              </Button>
            )}
            {release.status === 'RELEASED' && (
              <Button
                startIcon={<ArchiveIcon />}
                onClick={handleArchive}
                variant="outlined"
                disabled={archiveRelease.isPending}
              >
                Archive
              </Button>
            )}
            <Button
              startIcon={<NotesIcon />}
              onClick={handleGenerateNotes}
              variant="outlined"
              disabled={generateNotes.isPending}
            >
              {generateNotes.isPending ? 'Generating...' : 'Generate Release Notes'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1">Progress</Typography>
            <Typography variant="body2" color="text.secondary">
              {release.completedTaskCount} / {release.taskCount} tasks completed
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completionPercentage}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                bgcolor: completionPercentage === 100 ? 'success.main' : 'primary.main',
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {Math.round(completionPercentage)}% complete
          </Typography>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1">Tasks ({release.taskCount})</Typography>
            <Button startIcon={<AddIcon />} size="small" variant="outlined">
              Add Tasks
            </Button>
          </Box>

          {!tasks || tasks.length === 0 ? (
            <Alert severity="info">
              No tasks assigned to this release yet. Add tasks from the project board or task
              details.
            </Alert>
          ) : (
            <List dense>
              {tasks.map((task) => (
                <ListItem
                  key={task.id}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 0.5,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">{task.title}</Typography>
                        <Chip
                          label={task.key}
                          size="small"
                          sx={{
                            fontFamily: 'monospace',
                            height: 18,
                            fontSize: '0.65rem',
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Stack direction="row" spacing={1} mt={0.5}>
                        {task.status && (
                          <Chip
                            label={task.status.name}
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '0.6rem',
                              bgcolor: task.status.color,
                              color: 'white',
                            }}
                          />
                        )}
                        {task.assignee && (
                          <Typography variant="caption" color="text.secondary">
                            {task.assignee.fullName || task.assignee.username}
                          </Typography>
                        )}
                      </Stack>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => handleTaskMenuOpen(e, task.id)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Release?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{release.name}</strong>? This action cannot
            be undone.
          </Typography>
          {release.taskCount > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This release has {release.taskCount} task(s) assigned. The tasks will not be
              deleted, only unlinked from this release.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteRelease.isPending}
          >
            {deleteRelease.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Release Notes Dialog */}
      <Dialog
        open={notesDialogOpen}
        onClose={() => setNotesDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Release Notes - {release.name}</DialogTitle>
        <DialogContent>
          <Box
            component="pre"
            sx={{
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 1,
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
            }}
          >
            {releaseNotes || 'No release notes generated.'}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialogOpen(false)}>Close</Button>
          <Button
            onClick={() => navigator.clipboard.writeText(releaseNotes)}
            variant="contained"
          >
            Copy to Clipboard
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task Context Menu */}
      <Menu anchorEl={taskMenuAnchor} open={Boolean(taskMenuAnchor)} onClose={handleTaskMenuClose}>
        <MenuItem
          onClick={() => {
            if (selectedTaskId) handleRemoveTask(selectedTaskId);
          }}
        >
          <RemoveIcon fontSize="small" sx={{ mr: 1 }} />
          Remove from Release
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ReleaseDetails;
