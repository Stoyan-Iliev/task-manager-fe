import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Paper,
  Avatar,
  Button,
  Menu,
  MenuItem,
  Snackbar,
  Alert as MuiAlert,
  FormControl,
  Select,
  Checkbox,
  ListItemText,
  Alert,
  Skeleton,
  Divider,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Badge,
  Tooltip,
  TextField,
  InputAdornment,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import AddIcon from '@mui/icons-material/Add';
import FlagIcon from '@mui/icons-material/Flag';
import PersonIcon from '@mui/icons-material/Person';
import BugReportIcon from '@mui/icons-material/BugReport';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CommentIcon from '@mui/icons-material/Comment';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LabelIcon from '@mui/icons-material/Label';
import EventIcon from '@mui/icons-material/Event';
import TaskDrawer from './TaskDrawer';
import CreateTaskDialog from './CreateTaskDialog';
import { useProjectTasks, useTransitionTask } from '../../api/tasks';
import { useProjectStatuses } from '../../api/taskStatuses';
import { useProjectMembers } from '../../api/projectMembers';
import { useOrganizationLabels } from '../../api/labels';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import { selectCurrentProject } from '../../redux/projectSlice';
import type { TaskResponse, TaskPriority, TaskType } from '../../types/task.types';

type SwimlaneGrouping = 'none' | 'assignee' | 'priority';

type DateFilter = 'all' | 'overdue' | 'today' | 'this_week' | 'this_month' | 'no_due_date' | 'custom';

interface QuickFilters {
  searchText: string;
  assigneeIds: number[];
  priorities: TaskPriority[];
  types: TaskType[];
  labelIds: number[];
  dateFilter: DateFilter;
  customDateStart?: string;
  customDateEnd?: string;
  onlyMyTasks: boolean;
  showUnassigned: boolean;
}

const priorityColors: Record<TaskPriority, string> = {
  LOW: '#4caf50',
  MEDIUM: '#ff9800',
  HIGH: '#f44336',
  CRITICAL: '#9c27b0',
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const typeIcons: Record<TaskType, React.ReactNode> = {
  TASK: <CheckCircleIcon fontSize="small" />,
  BUG: <BugReportIcon fontSize="small" />,
  STORY: <RadioButtonUncheckedIcon fontSize="small" />,
  EPIC: <FlagIcon fontSize="small" />,
};

// Helper function to get due date status
const getDueDateStatus = (dueDate: string | null | undefined): { label: string; color: string; bgColor: string } => {
  if (!dueDate) return { label: '', color: '', bgColor: '' };

  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: 'Overdue', color: '#d32f2f', bgColor: 'rgba(211, 47, 47, 0.1)' };
  } else if (diffDays === 0) {
    return { label: 'Today', color: '#f57c00', bgColor: 'rgba(245, 124, 0, 0.1)' };
  } else if (diffDays === 1) {
    return { label: 'Tomorrow', color: '#f57c00', bgColor: 'rgba(245, 124, 0, 0.1)' };
  } else if (diffDays <= 7) {
    return { label: `${diffDays}d`, color: '#ffa726', bgColor: 'rgba(255, 167, 38, 0.1)' };
  }
  return { label: `${diffDays}d`, color: '#9e9e9e', bgColor: 'rgba(158, 158, 158, 0.1)' };
};

const TasksView = () => {
  const theme = useTheme();
  const currentUserId = useSelector((state: RootState) => state.user.details?.id);
  const currentProjectId = useSelector((state: RootState) => state.project.currentProjectId);
  const currentProject = useSelector(selectCurrentProject);

  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(currentProjectId);
  const { data: statuses, isLoading: statusesLoading } = useProjectStatuses(currentProjectId);
  const { data: members } = useProjectMembers(currentProjectId);
  const { data: labels } = useOrganizationLabels(currentProject?.organizationId || null);
  const transitionTask = useTransitionTask();


  // Local optimistic updates for instant drag-and-drop feedback
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<number, { statusId: number; status: any }>>(new Map());

  // Use optimistic tasks for display (apply local updates over server data)
  const displayTasks = useMemo(() => {
    const result = (tasks || []).map(task => {
      const optimisticUpdate = optimisticUpdates.get(task.id);
      if (optimisticUpdate) {
        return {
          ...task,
          statusId: optimisticUpdate.statusId,
          status: optimisticUpdate.status,
        };
      }
      return task;
    });
    return result;
  }, [tasks, optimisticUpdates]);

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [swimlaneGrouping, setSwimlaneGrouping] = useState<SwimlaneGrouping>('none');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<QuickFilters>({
    searchText: '',
    assigneeIds: [],
    priorities: [],
    types: [],
    labelIds: [],
    dateFilter: 'all',
    onlyMyTasks: false,
    showUnassigned: false,
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Debounced search: Update filters.searchText after 300ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, searchText: searchInput }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Get all unique priorities, types, and labels from tasks
  const availablePriorities = useMemo(
    () => Array.from(new Set(displayTasks.map((t) => t.priority))),
    [displayTasks]
  );

  const availableTypes = useMemo(
    () => Array.from(new Set(displayTasks.map((t) => t.type))),
    [displayTasks]
  );

  // Filter tasks based on quick filters
  const filteredTasks = useMemo(() => {
    const result = displayTasks.filter((task) => {
      // Search text filter
      if (filters.searchText.trim()) {
        const searchLower = filters.searchText.toLowerCase();
        const matchesSearch =
          task.key.toLowerCase().includes(searchLower) ||
          task.title.toLowerCase().includes(searchLower) ||
          (task.description && task.description.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Only My Tasks filter
      if (filters.onlyMyTasks && currentUserId) {
        if (task.assigneeId !== currentUserId) return false;
      }

      // Show Unassigned filter
      if (filters.showUnassigned) {
        if (task.assigneeId !== null && task.assigneeId !== undefined) return false;
      }

      // Assignee filter (overrides onlyMyTasks and showUnassigned if set)
      if (filters.assigneeIds.length > 0) {
        if (!task.assigneeId || !filters.assigneeIds.includes(task.assigneeId)) {
          return false;
        }
      }

      // Priority filter
      if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
        return false;
      }

      // Type filter
      if (filters.types.length > 0 && !filters.types.includes(task.type)) {
        return false;
      }

      // Labels filter
      if (filters.labelIds.length > 0) {
        const taskLabelIds = task.labels?.map((l) => l.id) || [];
        if (!filters.labelIds.some((id) => taskLabelIds.includes(id))) {
          return false;
        }
      }

      // Date filter
      if (filters.dateFilter !== 'all') {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const taskDue = task.dueDate ? new Date(task.dueDate) : null;

        switch (filters.dateFilter) {
          case 'overdue':
            if (!taskDue || taskDue >= now) return false;
            break;
          case 'today': {
            if (!taskDue) return false;
            const todayEnd = new Date(now);
            todayEnd.setHours(23, 59, 59, 999);
            if (taskDue < now || taskDue > todayEnd) return false;
            break;
          }
          case 'this_week': {
            if (!taskDue) return false;
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() + 7);
            if (taskDue < now || taskDue > weekEnd) return false;
            break;
          }
          case 'this_month': {
            if (!taskDue) return false;
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            if (taskDue < now || taskDue > monthEnd) return false;
            break;
          }
          case 'no_due_date':
            if (taskDue !== null) return false;
            break;
          case 'custom':
            if (filters.customDateStart && taskDue) {
              const startDate = new Date(filters.customDateStart);
              if (taskDue < startDate) return false;
            }
            if (filters.customDateEnd && taskDue) {
              const endDate = new Date(filters.customDateEnd);
              endDate.setHours(23, 59, 59, 999);
              if (taskDue > endDate) return false;
            }
            break;
        }
      }

      return true;
    });
    return result;
  }, [displayTasks, filters, currentUserId]);

  // Group tasks by swimlane
  const swimlanes = useMemo(() => {
    switch (swimlaneGrouping) {
      case 'assignee': {
        const grouped = new Map<string, TaskResponse[]>();
        const unassigned: TaskResponse[] = [];

        filteredTasks.forEach((task) => {
          if (!task.assigneeId) {
            unassigned.push(task);
          } else {
            const key = task.assignee?.fullName || task.assignee?.username || `User ${task.assigneeId}`;
            if (!grouped.has(key)) {
              grouped.set(key, []);
            }
            grouped.get(key)!.push(task);
          }
        });

        const result = Array.from(grouped.entries()).map(([name, tasks]) => ({
          id: name,
          title: name,
          tasks,
        }));

        if (unassigned.length > 0) {
          result.push({ id: 'unassigned', title: 'Unassigned', tasks: unassigned });
        }

        return result;
      }

      case 'priority': {
        const grouped = new Map<TaskPriority, TaskResponse[]>();

        filteredTasks.forEach((task) => {
          if (!grouped.has(task.priority)) {
            grouped.set(task.priority, []);
          }
          grouped.get(task.priority)!.push(task);
        });

        return Array.from(grouped.entries())
          .sort((a, b) => {
            const order: TaskPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
            return order.indexOf(a[0]) - order.indexOf(b[0]);
          })
          .map(([priority, tasks]) => ({
            id: priority,
            title: priorityLabels[priority],
            tasks,
          }));
      }

      case 'none':
      default:
        return [{ id: 'all', title: '', tasks: filteredTasks }];
    }
  }, [filteredTasks, swimlaneGrouping]);

  // Group tasks by status within each swimlane
  const getTasksByStatus = (swimlaneTasks: TaskResponse[], statusId: number) => {
    return swimlaneTasks.filter((task) => task.statusId === statusId);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !displayTasks) return;

    const { source, destination, draggableId } = result;

    // Extract swimlane ID and status ID from droppableId
    // Format: "swimlane-{swimlaneId}-status-{statusId}"
    const sourceMatch = source.droppableId.match(/swimlane-(.+)-status-(\d+)/);
    const destMatch = destination.droppableId.match(/swimlane-(.+)-status-(\d+)/);

    if (!sourceMatch || !destMatch) return;

    const sourceStatusId = parseInt(sourceMatch[2], 10);
    const destStatusId = parseInt(destMatch[2], 10);
    const taskId = parseInt(draggableId.replace('task-', ''), 10);

    // Only transition if status changed
    if (sourceStatusId !== destStatusId) {
      const destStatus = statuses?.find((s) => s.id === destStatusId);

      // INSTANT local optimistic update - happens immediately on drop
      if (destStatus) {
        setOptimisticUpdates(prev => {
          const next = new Map(prev);
          next.set(taskId, {
            statusId: destStatusId,
            status: {
              id: destStatus.id,
              name: destStatus.name,
              category: destStatus.category,
              color: destStatus.color,
            },
          });
          return next;
        });
      }

      // Make API call to transition task
      transitionTask.mutate(
        {
          taskId,
          data: { newStatusId: destStatusId },
        },
        {
          onSuccess: () => {
            // Clear optimistic update - React Query cache now has the real data
            setOptimisticUpdates(prev => {
              const next = new Map(prev);
              next.delete(taskId);
              return next;
            });

            setSnackbar({
              open: true,
              message: `Task moved to ${destStatus?.name || 'new status'}`,
              severity: 'success',
            });
          },
          onError: () => {
            // Revert optimistic update on error
            setOptimisticUpdates(prev => {
              const next = new Map(prev);
              next.delete(taskId);
              return next;
            });

            setSnackbar({
              open: true,
              message: 'Failed to move task. Please try again.',
              severity: 'error',
            });
          },
        }
      );
    }
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setFilters({
      searchText: '',
      assigneeIds: [],
      priorities: [],
      types: [],
      labelIds: [],
      dateFilter: 'all',
      customDateStart: undefined,
      customDateEnd: undefined,
      onlyMyTasks: false,
      showUnassigned: false,
    });
  }, []);

  const activeFilterCount = useMemo(() => {
    return (
      (filters.searchText.trim() ? 1 : 0) +
      filters.assigneeIds.length +
      filters.priorities.length +
      filters.types.length +
      filters.labelIds.length +
      (filters.dateFilter !== 'all' ? 1 : 0) +
      (filters.onlyMyTasks ? 1 : 0) +
      (filters.showUnassigned ? 1 : 0)
    );
  }, [filters]);

  const renderTaskCard = (
    task: TaskResponse,
    provided: { innerRef: (element: HTMLElement | null) => void; draggableProps: any; dragHandleProps: any },
    snapshot: { isDragging: boolean }
  ) => {
    const dueDateStatus = getDueDateStatus(task.dueDate);

    return (
      <Card
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        role="button"
        tabIndex={0}
        aria-label={`Task ${task.key}: ${task.title}. Priority: ${priorityLabels[task.priority]}. Status: ${task.status.name}`}
        onClick={() => {
          // Only open dialog if not currently dragging
          if (!snapshot.isDragging) {
            setSelectedTaskId(task.id);
          }
        }}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedTaskId(task.id);
          }
        }}
        sx={{
          mb: 1.5,
          borderRadius: 1.5,
          boxShadow: snapshot.isDragging ? 6 : 1,
          cursor: snapshot.isDragging ? 'grabbing' : 'pointer',
          overflow: 'hidden',
          transition: snapshot.isDragging ? 'none' : 'box-shadow 0.2s, border-color 0.2s',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: snapshot.isDragging ? 'primary.main' : 'divider',
          borderLeft: `4px solid ${priorityColors[task.priority]}`,
          opacity: snapshot.isDragging ? 0.9 : 1,
          ...(!snapshot.isDragging && {
            '&:hover': {
              boxShadow: 3,
              borderColor: 'primary.light',
            },
          }),
          '&:focus': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }}
      >
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          {/* Header: Task Key + Type Icon + Priority Badge */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Tooltip title={task.type} arrow>
                <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                  {typeIcons[task.type]}
                </Box>
              </Tooltip>
              <Chip
                label={task.key}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  bgcolor: 'action.hover',
                  color: 'text.primary',
                  fontFamily: 'monospace',
                }}
              />
            </Box>
            <Chip
              label={priorityLabels[task.priority]}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: alpha(priorityColors[task.priority], 0.1),
                color: priorityColors[task.priority],
                borderColor: priorityColors[task.priority],
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="body2"
            fontWeight={600}
            color="text.primary"
            sx={{
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {task.title}
          </Typography>

          {/* Labels Row */}
          {task.labels && task.labels.length > 0 && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} mb={1}>
              {task.labels.slice(0, 3).map((label) => (
                <Chip
                  key={label.id}
                  label={label.name}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    bgcolor: alpha(label.color, 0.1),
                    color: label.color,
                    borderColor: label.color,
                  }}
                />
              ))}
              {(task.labels?.length || 0) > 3 && (
                <Chip
                  label={`+${(task.labels?.length || 0) - 3}`}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    bgcolor: 'action.hover',
                  }}
                />
              )}
            </Stack>
          )}

          {/* Due Date Badge */}
          {task.dueDate && dueDateStatus.label && (
            <Box mb={1}>
              <Chip
                icon={<CalendarTodayIcon sx={{ fontSize: 12 }} />}
                label={dueDateStatus.label}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  bgcolor: dueDateStatus.bgColor,
                  color: dueDateStatus.color,
                  borderColor: dueDateStatus.color,
                }}
              />
            </Box>
          )}

          {/* Footer: Assignee + Counts */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            {task.assignee ? (
              <Tooltip title={task.assignee.fullName || task.assignee.username} arrow>
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: '0.75rem',
                    bgcolor: 'primary.main',
                    cursor: 'pointer',
                  }}
                >
                  {(task.assignee.fullName || task.assignee.username).charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
            ) : (
              <Tooltip title="Unassigned" arrow>
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: '0.75rem',
                    bgcolor: 'action.disabledBackground',
                    color: 'text.disabled',
                    cursor: 'pointer',
                  }}
                >
                  <PersonIcon sx={{ fontSize: 16 }} />
                </Avatar>
              </Tooltip>
            )}

            <Box display="flex" gap={1} alignItems="center">
              {(task.commentCount || 0) > 0 && (
                <Tooltip title={`${task.commentCount} comments`} arrow>
                  <Box display="flex" alignItems="center" gap={0.3} sx={{ color: 'text.secondary' }}>
                    <CommentIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption" fontSize="0.7rem">
                      {task.commentCount}
                    </Typography>
                  </Box>
                </Tooltip>
              )}

              {(task.attachmentCount || 0) > 0 && (
                <Tooltip title={`${task.attachmentCount} attachments`} arrow>
                  <Box display="flex" alignItems="center" gap={0.3} sx={{ color: 'text.secondary' }}>
                    <AttachFileIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption" fontSize="0.7rem">
                      {task.attachmentCount}
                    </Typography>
                  </Box>
                </Tooltip>
              )}

              {(task.subtaskCount || 0) > 0 && (
                <Tooltip title={`${task.subtaskCount} subtasks`} arrow>
                  <Box display="flex" alignItems="center" gap={0.3} sx={{ color: 'text.secondary' }}>
                    <CheckBoxIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption" fontSize="0.7rem">
                      {task.subtaskCount}
                    </Typography>
                  </Box>
                </Tooltip>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderColumn = (
    status: { id: number; name: string; color?: string; wipLimit?: number | null },
    swimlaneTasks: TaskResponse[],
    swimlaneId: string
  ) => {
    const tasksInColumn = getTasksByStatus(swimlaneTasks, status.id);
    const droppableId = `swimlane-${swimlaneId}-status-${status.id}`;
    const isOverLimit = status.wipLimit && tasksInColumn.length > status.wipLimit;

    return (
      <Droppable droppableId={droppableId} key={status.id}>
        {(provided, snapshot) => (
          <Paper
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              flex: 1,
              minWidth: 280,
              p: 2,
              mx: 1,
              minHeight: 200,
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark'
                ? alpha(theme.palette.grey[900], 0.5)
                : alpha(theme.palette.grey[100], 0.8),
              ...(snapshot.isDraggingOver && {
                bgcolor: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary.main, 0.15)
                  : alpha(theme.palette.primary.main, 0.1),
              }),
              boxShadow: snapshot.isDraggingOver ? 3 : 2,
              transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: status.color || theme.palette.primary.main,
                  }}
                />
                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                  {status.name}
                </Typography>
                <Chip
                  label={tasksInColumn.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: isOverLimit ? 'error.light' : 'action.hover',
                    color: isOverLimit ? 'error.dark' : 'text.secondary',
                  }}
                />
              </Box>
              {status.wipLimit && (
                <Typography variant="caption" color={isOverLimit ? 'error.main' : 'text.secondary'}>
                  Limit: {status.wipLimit}
                </Typography>
              )}
            </Box>

            {isOverLimit && (
              <Alert severity="warning" sx={{ mb: 2, py: 0 }}>
                <Typography variant="caption">
                  WIP limit exceeded ({tasksInColumn.length}/{status.wipLimit})
                </Typography>
              </Alert>
            )}

            {tasksInColumn.map((task, index) => (
              <Draggable
                key={task.id}
                draggableId={`task-${task.id}`}
                index={index}
              >
                {(provided, snapshot) => renderTaskCard(task, provided, snapshot)}
              </Draggable>
            ))}
            {provided.placeholder}
          </Paper>
        )}
      </Droppable>
    );
  };

  if (!currentProjectId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Please select a project to view tasks.</Alert>
      </Box>
    );
  }

  if (tasksLoading || statusesLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ flex: '1 1 30%', minWidth: 300 }}>
              <Skeleton variant="rectangular" height={400} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  if (!statuses || statuses.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          No statuses configured for this project. Please configure statuses in Project Settings.
        </Alert>
      </Box>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: theme.palette.background.default,
          minHeight: {
            xs: 'calc(100vh - 56px)',
            sm: 'calc(100vh - 64px)',
          },
        }}
      >
        {/* Screen reader announcements */}
        <Box
          role="status"
          aria-live="polite"
          aria-atomic="true"
          sx={{
            position: 'absolute',
            left: '-10000px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          {snackbar.open && snackbar.message}
        </Box>

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <AssignmentRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight={700} color="text.primary">
              Tasks
            </Typography>
            <Chip label={`${filteredTasks?.length || 0} tasks`} />
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Task
          </Button>
        </Box>

        {/* Search and Quick Filters Bar */}
        <Box mb={2}>
          <Box display="flex" gap={2} mb={2} flexWrap="wrap">
            {/* Search Bar */}
            <TextField
              size="small"
              placeholder="Search tasks by key, title, or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchInput && (
                  <InputAdornment position="end">
                    <Tooltip title="Clear search">
                      <IconButton
                        size="small"
                        onClick={() => setSearchInput('')}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: 300 }}
            />

            {/* Quick Filter Buttons */}
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                size="small"
                variant={filters.onlyMyTasks ? 'contained' : 'outlined'}
                startIcon={<PersonIcon />}
                onClick={() => setFilters({ ...filters, onlyMyTasks: !filters.onlyMyTasks, showUnassigned: false })}
              >
                My Tasks
              </Button>
              <Button
                size="small"
                variant={filters.showUnassigned ? 'contained' : 'outlined'}
                startIcon={<PersonIcon />}
                onClick={() => setFilters({ ...filters, showUnassigned: !filters.showUnassigned, onlyMyTasks: false })}
              >
                Unassigned
              </Button>
              <Button
                size="small"
                variant={filters.dateFilter === 'overdue' ? 'contained' : 'outlined'}
                color={filters.dateFilter === 'overdue' ? 'error' : 'primary'}
                startIcon={<CalendarTodayIcon />}
                onClick={() => setFilters({ ...filters, dateFilter: filters.dateFilter === 'overdue' ? 'all' : 'overdue' })}
              >
                Overdue
              </Button>
              <Button
                size="small"
                variant={filters.dateFilter === 'today' ? 'contained' : 'outlined'}
                startIcon={<CalendarTodayIcon />}
                onClick={() => setFilters({ ...filters, dateFilter: filters.dateFilter === 'today' ? 'all' : 'today' })}
              >
                Due Today
              </Button>
            </Box>
          </Box>

          {/* Secondary Controls Row */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" gap={1}>
              <Tooltip title="Swimlane Grouping">
                <ToggleButtonGroup
                  value={swimlaneGrouping}
                  exclusive
                  onChange={(_, value) => value && setSwimlaneGrouping(value)}
                  size="small"
                  aria-label="Swimlane grouping mode"
                >
                  <ToggleButton value="none" aria-label="No grouping">
                    <ViewColumnIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="assignee" aria-label="Group by assignee">
                    <PersonIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="priority" aria-label="Group by priority">
                    <FlagIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Tooltip>
            </Box>

            <Badge badgeContent={activeFilterCount} color="primary">
              <Button
                variant={activeFilterCount > 0 ? 'contained' : 'outlined'}
                startIcon={<FilterListIcon />}
                onClick={handleFilterClick}
                size="small"
                aria-label={`Filters${activeFilterCount > 0 ? `. ${activeFilterCount} active` : ''}`}
              >
                Advanced Filters
              </Button>
            </Badge>
          </Box>
        </Box>

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <Box mb={2} display="flex" gap={1} flexWrap="wrap" alignItems="center">
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              ACTIVE FILTERS:
            </Typography>
            {filters.searchText.trim() && (
              <Chip
                icon={<SearchIcon />}
                label={`Search: "${filters.searchText.trim()}"`}
                size="small"
                onDelete={() => setSearchInput('')}
              />
            )}
            {filters.onlyMyTasks && (
              <Chip
                icon={<PersonIcon />}
                label="My Tasks"
                size="small"
                onDelete={() => setFilters({ ...filters, onlyMyTasks: false })}
              />
            )}
            {filters.showUnassigned && (
              <Chip
                icon={<PersonIcon />}
                label="Unassigned"
                size="small"
                onDelete={() => setFilters({ ...filters, showUnassigned: false })}
              />
            )}
            {filters.assigneeIds.map((id) => {
              const member = members?.find((m) => m.userId === id);
              return (
                <Chip
                  key={`assignee-${id}`}
                  label={`Assignee: ${member?.fullName || member?.username || `User ${id}`}`}
                  size="small"
                  onDelete={() =>
                    setFilters((f) => ({
                      ...f,
                      assigneeIds: f.assigneeIds.filter((aid) => aid !== id),
                    }))
                  }
                />
              );
            })}
            {filters.priorities.map((p) => (
              <Chip
                key={`priority-${p}`}
                label={`Priority: ${priorityLabels[p]}`}
                size="small"
                onDelete={() =>
                  setFilters((f) => ({
                    ...f,
                    priorities: f.priorities.filter((pr) => pr !== p),
                  }))
                }
              />
            ))}
            {filters.types.map((t) => (
              <Chip
                key={`type-${t}`}
                label={`Type: ${t}`}
                size="small"
                onDelete={() =>
                  setFilters((f) => ({
                    ...f,
                    types: f.types.filter((ty) => ty !== t),
                  }))
                }
              />
            ))}
            {filters.labelIds.map((id) => {
              const label = labels?.find((l) => l.id === id);
              return (
                <Chip
                  key={`label-${id}`}
                  label={label?.name || `Label ${id}`}
                  size="small"
                  sx={{
                    backgroundColor: label?.color || '#ccc',
                    color: '#fff',
                  }}
                  onDelete={() =>
                    setFilters((f) => ({
                      ...f,
                      labelIds: f.labelIds.filter((lid) => lid !== id),
                    }))
                  }
                />
              );
            })}
            {filters.dateFilter !== 'all' && (
              <Chip
                icon={<EventIcon />}
                label={`Date: ${filters.dateFilter === 'overdue' ? 'Overdue' :
                  filters.dateFilter === 'today' ? 'Today' :
                  filters.dateFilter === 'this_week' ? 'This Week' :
                  filters.dateFilter === 'this_month' ? 'This Month' :
                  filters.dateFilter === 'no_due_date' ? 'No Due Date' :
                  'Custom Range'}`}
                size="small"
                onDelete={() => setFilters({ ...filters, dateFilter: 'all', customDateStart: undefined, customDateEnd: undefined })}
              />
            )}
            <Button size="small" onClick={clearFilters}>
              Clear All
            </Button>
          </Box>
        )}

        {/* Swimlanes */}
        {swimlanes.map((swimlane) => (
          <Box key={swimlane.id} mb={swimlaneGrouping !== 'none' ? 4 : 0}>
            {swimlaneGrouping !== 'none' && (
              <>
                <Typography variant="h6" fontWeight={600} color="text.primary" mb={2}>
                  {swimlane.title}
                  <Chip label={swimlane.tasks.length} size="small" sx={{ ml: 1 }} />
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </>
            )}

            <Box sx={{ display: 'flex', gap: 0 }}>
              {statuses.map((status) => renderColumn(status, swimlane.tasks, swimlane.id))}
            </Box>
          </Box>
        ))}

        {/* Advanced Filter Menu */}
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleFilterClose}
          PaperProps={{ sx: { width: 400, maxHeight: '80vh' } }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Advanced Filters
            </Typography>

            {/* Assignees Filter */}
            <Accordion defaultExpanded elevation={0} sx={{ mb: 1, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    Assignees
                  </Typography>
                  {filters.assigneeIds.length > 0 && (
                    <Chip label={filters.assigneeIds.length} size="small" sx={{ ml: 0.5 }} />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth size="small">
                  <Select
                    multiple
                    value={filters.assigneeIds}
                    onChange={(e) =>
                      setFilters({ ...filters, assigneeIds: e.target.value as number[] })
                    }
                    renderValue={(selected) => `${selected.length} selected`}
                    displayEmpty
                    disabled={!members || members.length === 0}
                  >
                    {(members || [])
                      .filter((member) => member?.userId)
                      .map((member) => (
                        <MenuItem key={member.id} value={member.userId}>
                          <Checkbox checked={filters.assigneeIds.includes(member.userId)} />
                          <ListItemText primary={member.fullName || member.username} />
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </AccordionDetails>
            </Accordion>

            {/* Priority Filter */}
            <Accordion elevation={0} sx={{ mb: 1, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <FlagIcon fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    Priority
                  </Typography>
                  {filters.priorities.length > 0 && (
                    <Chip label={filters.priorities.length} size="small" sx={{ ml: 0.5 }} />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth size="small">
                  <Select
                    multiple
                    value={filters.priorities}
                    onChange={(e) =>
                      setFilters({ ...filters, priorities: e.target.value as TaskPriority[] })
                    }
                    renderValue={(selected) => `${selected.length} selected`}
                    displayEmpty
                    disabled={availablePriorities.length === 0}
                  >
                    {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => (
                      <MenuItem key={priority} value={priority}>
                        <Checkbox checked={filters.priorities.includes(priority as TaskPriority)} />
                        <ListItemText primary={priorityLabels[priority as TaskPriority]} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </AccordionDetails>
            </Accordion>

            {/* Type Filter */}
            <Accordion elevation={0} sx={{ mb: 1, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircleIcon fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    Type
                  </Typography>
                  {filters.types.length > 0 && (
                    <Chip label={filters.types.length} size="small" sx={{ ml: 0.5 }} />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth size="small">
                  <Select
                    multiple
                    value={filters.types}
                    onChange={(e) =>
                      setFilters({ ...filters, types: e.target.value as TaskType[] })
                    }
                    renderValue={(selected) => `${selected.length} selected`}
                    displayEmpty
                    disabled={availableTypes.length === 0}
                  >
                    {['TASK', 'BUG', 'STORY', 'EPIC'].map((type) => (
                      <MenuItem key={type} value={type}>
                        <Checkbox checked={filters.types.includes(type as TaskType)} />
                        <ListItemText primary={type} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </AccordionDetails>
            </Accordion>

            {/* Labels Filter */}
            <Accordion elevation={0} sx={{ mb: 1, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <LabelIcon fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    Labels
                  </Typography>
                  {filters.labelIds.length > 0 && (
                    <Chip label={filters.labelIds.length} size="small" sx={{ ml: 0.5 }} />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth size="small">
                  <Select
                    multiple
                    value={filters.labelIds}
                    onChange={(e) =>
                      setFilters({ ...filters, labelIds: e.target.value as number[] })
                    }
                    renderValue={(selected) => `${selected.length} selected`}
                    displayEmpty
                    disabled={!labels || labels.length === 0}
                  >
                    {(labels || []).map((label) => (
                      <MenuItem key={label.id} value={label.id}>
                        <Checkbox checked={filters.labelIds.includes(label.id)} />
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: label.color,
                            }}
                          />
                          <ListItemText primary={label.name} />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </AccordionDetails>
            </Accordion>

            {/* Date Range Filter */}
            <Accordion elevation={0} sx={{ mb: 1, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <EventIcon fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    Due Date
                  </Typography>
                  {filters.dateFilter !== 'all' && (
                    <Chip label="Active" size="small" color="primary" sx={{ ml: 0.5 }} />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <Select
                    value={filters.dateFilter}
                    onChange={(e) =>
                      setFilters({ ...filters, dateFilter: e.target.value as DateFilter })
                    }
                  >
                    <MenuItem value="all">All Tasks</MenuItem>
                    <MenuItem value="overdue">Overdue</MenuItem>
                    <MenuItem value="today">Due Today</MenuItem>
                    <MenuItem value="this_week">Due This Week</MenuItem>
                    <MenuItem value="this_month">Due This Month</MenuItem>
                    <MenuItem value="no_due_date">No Due Date</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                  </Select>
                </FormControl>

                {filters.dateFilter === 'custom' && (
                  <Box display="flex" flexDirection="column" gap={2}>
                    <TextField
                      label="Start Date"
                      type="date"
                      size="small"
                      fullWidth
                      value={filters.customDateStart || ''}
                      onChange={(e) =>
                        setFilters({ ...filters, customDateStart: e.target.value })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      size="small"
                      fullWidth
                      value={filters.customDateEnd || ''}
                      onChange={(e) =>
                        setFilters({ ...filters, customDateEnd: e.target.value })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between">
              <Button size="small" onClick={clearFilters}>
                Clear All
              </Button>
              <Button size="small" variant="contained" onClick={handleFilterClose}>
                Apply
              </Button>
            </Box>
          </Box>
        </Menu>

        {/* Task Details Drawer */}
        <TaskDrawer
          taskId={selectedTaskId}
          projectId={currentProjectId}
          organizationId={currentProject?.organizationId || null}
          open={Boolean(selectedTaskId)}
          onClose={() => setSelectedTaskId(null)}
        />

        {/* Create Task Dialog */}
        <CreateTaskDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          projectId={currentProjectId}
        />

        {/* Feedback Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <MuiAlert
            elevation={6}
            variant="filled"
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </MuiAlert>
        </Snackbar>
      </Box>
    </DragDropContext>
  );
};

export default TasksView;
