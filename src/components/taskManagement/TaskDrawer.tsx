import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Avatar,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  CircularProgress,
  Autocomplete,
  Stack,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BugReportIcon from '@mui/icons-material/BugReport';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BookIcon from '@mui/icons-material/Book';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
  useAssignTask,
  useTransitionTask,
  useSubtasks,
  useTaskLabels,
  useAddLabel,
  useRemoveLabel,
} from '../../api/tasks';
import { useProjectStatuses } from '../../api/taskStatuses';
import { useProjectMembers } from '../../api/projectMembers';
import { useOrganizationLabels } from '../../api/labels';
import type { TaskType, TaskPriority } from '../../types/task.types';
import { CommentList } from './comments/CommentList';
import { AttachmentList } from './attachments/AttachmentList';
import { LabelSelector } from './labels/LabelSelector';
import { WatcherList } from './watchers/WatcherList';
import SprintSelector from './SprintSelector';
import { useAssignTasksToSprint, useRemoveTasksFromSprint } from '../../api/sprints';
import { CommitHistory } from '../gitIntegration/CommitHistory';
import { PullRequestList } from '../gitIntegration/PullRequestList';
import UserAvatar from '../misc/UserAvatar';
import { RichTextEditor, type User } from '../misc/RichTextEditor';

interface TaskDrawerProps {
  taskId: number | null;
  projectId: number | null;
  organizationId: number | null;
  open: boolean;
  onClose: () => void;
}

const typeIcons: Record<TaskType, React.ReactNode> = {
  TASK: <AssignmentIcon sx={{ fontSize: 18 }} />,
  BUG: <BugReportIcon sx={{ fontSize: 18 }} />,
  STORY: <BookIcon sx={{ fontSize: 18 }} />,
  EPIC: <RocketLaunchIcon sx={{ fontSize: 18 }} />,
};

const priorityColors: Record<TaskPriority, string> = {
  LOW: '#4caf50',
  MEDIUM: '#ff9800',
  HIGH: '#f44336',
  CRITICAL: '#d32f2f',
};

const TaskDrawer = ({ taskId, projectId, organizationId, open, onClose }: TaskDrawerProps) => {
  const { data: task, isLoading } = useTask(taskId);
  const { data: statuses } = useProjectStatuses(projectId);
  const { data: members } = useProjectMembers(projectId);
  const { data: organizationLabels } = useOrganizationLabels(organizationId);
  const { data: taskLabels } = useTaskLabels(taskId);
  const { data: subtasks } = useSubtasks(taskId);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const assignTask = useAssignTask();
  const transitionTask = useTransitionTask();
  const addLabel = useAddLabel(taskId || 0);
  const removeLabel = useRemoveLabel(taskId || 0);
  const assignToSprint = useAssignTasksToSprint();
  const removeFromSprint = useRemoveTasksFromSprint();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subtasksExpanded, setSubtasksExpanded] = useState(true);
  const [gitExpanded, setGitExpanded] = useState(false);
  const [metadataExpanded, setMetadataExpanded] = useState(false);

  // Editable fields
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [editingEstimatedHours, setEditingEstimatedHours] = useState(false);
  const [estimatedHoursValue, setEstimatedHoursValue] = useState('');

  // Sync task data to local state
  useEffect(() => {
    if (task) {
      setTitleValue(task.title);
      setDescriptionValue(task.description || '');
      setEstimatedHoursValue(task.estimatedHours?.toString() || '');
    }
  }, [task]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setEditingTitle(false);
      setEditingDescription(false);
      setEditingEstimatedHours(false);
      setDeleteDialogOpen(false);
    }
  }, [open]);

  const handleUpdateTitle = async () => {
    if (!task || !titleValue.trim() || titleValue === task.title) {
      setEditingTitle(false);
      setTitleValue(task?.title || '');
      return;
    }

    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        data: { title: titleValue.trim() },
      });
      setEditingTitle(false);
    } catch (error) {
      setTitleValue(task.title);
      setEditingTitle(false);
    }
  };

  const handleUpdateDescription = async () => {
    if (!task || descriptionValue === (task.description || '')) {
      setEditingDescription(false);
      return;
    }

    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        data: { description: descriptionValue.trim() || undefined },
      });
      setEditingDescription(false);
    } catch (error) {
      setDescriptionValue(task.description || '');
      setEditingDescription(false);
    }
  };

  const handleUpdateEstimatedHours = async () => {
    if (!task) {
      setEditingEstimatedHours(false);
      return;
    }

    const newValue = estimatedHoursValue ? parseFloat(estimatedHoursValue) : undefined;
    if (newValue === task.estimatedHours) {
      setEditingEstimatedHours(false);
      return;
    }

    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        data: { estimatedHours: newValue },
      });
      setEditingEstimatedHours(false);
    } catch (error) {
      setEstimatedHoursValue(task.estimatedHours?.toString() || '');
      setEditingEstimatedHours(false);
    }
  };

  const handleStatusChange = async (newStatusId: number) => {
    if (!task || newStatusId === task.statusId) return;

    try {
      await transitionTask.mutateAsync({
        taskId: task.id,
        data: { newStatusId },
      });
    } catch (error) {
    }
  };

  const handleAssigneeChange = async (newAssigneeId: number | null) => {
    if (!task || newAssigneeId === task.assigneeId) return;

    try {
      await assignTask.mutateAsync({
        taskId: task.id,
        data: { assigneeId: newAssigneeId || undefined },
      });
    } catch (error) {
    }
  };

  const handleDueDateChange = async (newDate: Dayjs | null) => {
    if (!task) return;

    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        data: { dueDate: newDate?.toISOString() || undefined },
      });
    } catch (error) {
    }
  };

  const handleSprintChange = async (newSprintId: number | null) => {
    if (!task || newSprintId === task.sprintId) return;

    try {
      const oldSprintId = task.sprintId;

      // If moving from a sprint to backlog (null)
      if (oldSprintId && !newSprintId) {
        await removeFromSprint.mutateAsync([task.id]);
      }
      // If moving from backlog to a sprint
      else if (!oldSprintId && newSprintId) {
        await assignToSprint.mutateAsync({
          sprintId: newSprintId,
          taskIds: [task.id],
        });
      }
      // If moving from one sprint to another
      else if (oldSprintId && newSprintId && oldSprintId !== newSprintId) {
        await removeFromSprint.mutateAsync([task.id]);
        await assignToSprint.mutateAsync({
          sprintId: newSprintId,
          taskIds: [task.id],
        });
      }
    } catch (error) {
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;

    try {
      await deleteTask.mutateAsync(task.id);
      setDeleteDialogOpen(false);
      onClose();
    } catch (error) {
    }
  };

  const handleCopyKey = () => {
    if (task) {
      navigator.clipboard.writeText(task.key);
    }
  };

  const handleAddLabel = async (labelId: number) => {
    try {
      await addLabel.mutateAsync({ labelId });
    } catch (error) {
    }
  };

  const handleRemoveLabel = async (labelId: number) => {
    try {
      await removeLabel.mutateAsync(labelId);
    } catch (error) {
    }
  };

  const selectedMember = members?.find((m) => m.userId === task?.assigneeId);

  if (!open) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        slotProps={{
          paper: {
            sx: {
              mt: { xs: '64px', sm: '92px' }, // offset for your fixed AppBar
              maxHeight: { xs: 'calc(100vh - 120px)', sm: 'calc(100vh - 120px)' },
            },
          },
        }}
      >
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="400px">
            <CircularProgress />
          </Box>
        ) : task ? (
          <>
            {/* Header */}
            <DialogTitle sx={{ pb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box flex={1}>
                  {/* Task Key and Type */}
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Tooltip title={task.type} arrow>
                      <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                        {typeIcons[task.type]}
                      </Box>
                    </Tooltip>
                    <Chip
                      label={task.key}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                      }}
                    />
                    <Chip
                      label={task.priority}
                      size="small"
                      sx={{
                        bgcolor: priorityColors[task.priority],
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  {/* Title */}
                  {editingTitle ? (
                    <TextField
                      fullWidth
                      value={titleValue}
                      onChange={(e) => setTitleValue(e.target.value)}
                      onBlur={handleUpdateTitle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateTitle();
                        } else if (e.key === 'Escape') {
                          setTitleValue(task.title);
                          setEditingTitle(false);
                        }
                      }}
                      autoFocus
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  ) : (
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        p: 0.5,
                        borderRadius: 1,
                      }}
                      onClick={() => setEditingTitle(true)}
                    >
                      {task.title}
                    </Typography>
                  )}
                </Box>

                {/* Action Buttons */}
                <Box display="flex" gap={0.5}>
                  <Tooltip title="Copy task key" arrow>
                    <IconButton size="small" onClick={handleCopyKey}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete task" arrow>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <IconButton size="small" onClick={onClose}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
            </DialogTitle>

            {/* Content */}
            <DialogContent dividers sx={{ overflow: 'visible' }}>
              {/* Status */}
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Status
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={task.statusId}
                    onChange={(e) => handleStatusChange(e.target.value as number)}
                    disabled={!statuses || statuses.length === 0 || transitionTask.isPending}
                  >
                    {statuses?.map((status) => (
                      <MenuItem key={status.id} value={status.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {status.color && (
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: status.color,
                              }}
                            />
                          )}
                          <Typography>{status.name}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Description */}
              <Box mb={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  {!editingDescription && (
                    <Button
                      size="small"
                      onClick={() => setEditingDescription(true)}
                      sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                    >
                      Edit
                    </Button>
                  )}
                </Box>
                {editingDescription ? (
                  <Box sx={{ position: 'relative' }}>
                    <RichTextEditor
                      content={descriptionValue}
                      onChange={setDescriptionValue}
                      placeholder="Add a description..."
                      users={
                        members?.map((member): User => ({
                          id: member.userId,
                          username: member.username || '',
                          fullName: member.fullName || member.username || 'Unknown',
                        })) || []
                      }
                      autoFocus={true}
                      minHeight={150}
                      maxHeight={400}
                      showTaskList={true}
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleUpdateDescription}
                      >
                        Save
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setDescriptionValue(task?.description || '');
                          setEditingDescription(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      p: 1.5,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      minHeight: 80,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      '& p': { margin: '0.5em 0' },
                      '& p:first-of-type': { marginTop: 0 },
                      '& p:last-child': { marginBottom: 0 },
                    }}
                    onClick={() => setEditingDescription(true)}
                  >
                    {task.description ? (
                      <Box
                        dangerouslySetInnerHTML={{ __html: task.description }}
                        sx={{
                          '& .mention': {
                            color: 'primary.main',
                            backgroundColor: 'primary.light',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontWeight: 500,
                          },
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Add a description...
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Assignee */}
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Assignee
                </Typography>
                <Autocomplete
                  options={members || []}
                  getOptionLabel={(option) =>
                    option.firstName && option.lastName
                      ? `${option.firstName} ${option.lastName}`
                      : option.username || 'Unknown'
                  }
                  value={selectedMember || null}
                  onChange={(_, newValue) => {
                    handleAssigneeChange(newValue?.userId || null);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Unassigned" size="small" />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <UserAvatar
                          userId={option.userId}
                          username={option.username}
                          firstName={option.firstName}
                          lastName={option.lastName}
                          avatarUrl={option.avatarUrl}
                          size="small"
                          showTooltip={false}
                        />
                        <Typography variant="body2">
                          {option.firstName && option.lastName
                            ? `${option.firstName} ${option.lastName}`
                            : option.username}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  disabled={!members || members.length === 0 || assignTask.isPending}
                  size="small"
                />
              </Box>

              {/* Due Date */}
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Due Date
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={task.dueDate ? dayjs(task.dueDate) : null}
                    onChange={handleDueDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        placeholder: 'No due date',
                      },
                    }}
                  />
                </LocalizationProvider>
              </Box>

              {/* Estimated Hours */}
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Estimated Hours
                </Typography>
                {editingEstimatedHours ? (
                  <TextField
                    fullWidth
                    type="number"
                    value={estimatedHoursValue}
                    onChange={(e) => setEstimatedHoursValue(e.target.value)}
                    onBlur={handleUpdateEstimatedHours}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateEstimatedHours();
                      } else if (e.key === 'Escape') {
                        setEstimatedHoursValue(task.estimatedHours?.toString() || '');
                        setEditingEstimatedHours(false);
                      }
                    }}
                    inputProps={{ min: 0, step: 0.5 }}
                    size="small"
                    autoFocus
                  />
                ) : (
                  <Box
                    sx={{
                      p: 1,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => setEditingEstimatedHours(true)}
                  >
                    <Typography variant="body2" color={task.estimatedHours ? 'text.primary' : 'text.secondary'}>
                      {task.estimatedHours ? `${task.estimatedHours}h` : 'Not estimated'}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Sprint */}
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Sprint
                </Typography>
                <SprintSelector
                  projectId={projectId}
                  value={task.sprintId}
                  onChange={handleSprintChange}
                  label=""
                  size="small"
                  allowNone={true}
                  disabled={assignToSprint.isPending || removeFromSprint.isPending}
                />
              </Box>

              {/* Labels */}
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Labels
                </Typography>
                <LabelSelector
                  organizationId={organizationId || 0}
                  availableLabels={organizationLabels || []}
                  selectedLabels={taskLabels || []}
                  onAddLabel={handleAddLabel}
                  onRemoveLabel={handleRemoveLabel}
                  isLoading={addLabel.isPending || removeLabel.isPending}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Subtasks */}
              <Box mb={2}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setSubtasksExpanded(!subtasksExpanded)}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2">Subtasks</Typography>
                    {subtasks && subtasks.length > 0 && (
                      <Chip
                        label={`${subtasks.filter(st => st.status.category === 'DONE').length}/${subtasks.length}`}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                  <IconButton size="small">
                    {subtasksExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                <Collapse in={subtasksExpanded}>
                  <Box mt={1}>
                    {subtasks && subtasks.length > 0 ? (
                      <List dense>
                        {subtasks.map((subtask) => (
                          <ListItem
                            key={subtask.id}
                            disablePadding
                            sx={{
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 1,
                              mb: 0.5,
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              <Checkbox
                                edge="start"
                                checked={subtask.status.category === 'DONE'}
                                disabled
                                size="small"
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={subtask.title}
                              secondary={subtask.key}
                              primaryTypographyProps={{
                                variant: 'body2',
                                sx: {
                                  textDecoration: subtask.status.category === 'DONE' ? 'line-through' : 'none',
                                },
                              }}
                              secondaryTypographyProps={{
                                variant: 'caption',
                                sx: { fontFamily: 'monospace' },
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No subtasks
                      </Typography>
                    )}
                    <Button
                      startIcon={<AddIcon />}
                      size="small"
                      sx={{ mt: 1 }}
                      disabled
                    >
                      Add Subtask (Coming Soon)
                    </Button>
                  </Box>
                </Collapse>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Watchers Section */}
              <Box mb={2}>
                <WatcherList taskId={task.id} />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Comments Section */}
              <Box mb={2}>
                <CommentList taskId={task.id} projectId={task.projectId} />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box mb={2}>
                <AttachmentList taskId={task.id} />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Git Integration */}
              <Box mb={2}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setGitExpanded(!gitExpanded)}
                >
                  <Typography variant="subtitle2">Git Activity</Typography>
                  <IconButton size="small">
                    {gitExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                <Collapse in={gitExpanded}>
                  <Box mt={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Commits
                    </Typography>
                    <CommitHistory taskId={task.id} />

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Pull Requests
                    </Typography>
                    <PullRequestList taskId={task.id} />
                  </Box>
                </Collapse>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Metadata */}
              <Box mb={2}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setMetadataExpanded(!metadataExpanded)}
                >
                  <Typography variant="subtitle2">Details</Typography>
                  <IconButton size="small">
                    {metadataExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                <Collapse in={metadataExpanded}>
                  <Box mt={1} sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Created by:
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <UserAvatar
                            userId={task.reporter.id}
                            username={task.reporter.username}
                            firstName={task.reporter.firstName}
                            lastName={task.reporter.lastName}
                            avatarUrl={task.reporter.avatarUrl}
                            size="small"
                            showTooltip={true}
                          />
                        </Box>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                          Created at:
                        </Typography>
                        <Typography variant="caption">
                          {task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A'}
                        </Typography>
                      </Box>
                      {task.updatedAt && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">
                            Updated at:
                          </Typography>
                          <Typography variant="caption">
                            {new Date(task.updatedAt).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </Collapse>
              </Box>
            </DialogContent>
          </>
        ) : (
          <Box p={3}>
            <Typography color="text.secondary">Task not found</Typography>
          </Box>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Task?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{task?.key}</strong>? This action cannot be undone.
            {subtasks && subtasks.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This task has {subtasks.length} subtask(s) that will also be deleted.
              </Alert>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteTask} color="error" variant="contained" disabled={deleteTask.isPending}>
            {deleteTask.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TaskDrawer;
