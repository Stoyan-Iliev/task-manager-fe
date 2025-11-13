import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Autocomplete,
  Alert,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { type Dayjs } from 'dayjs';
import AddTaskIcon from '@mui/icons-material/AddTask';
import { useCreateTask } from '../../api/tasks';
import { useProjectStatuses } from '../../api/taskStatuses';
import { useProjectMembers } from '../../api/projectMembers';
import type { TaskType, TaskPriority } from '../../types/task.types';
import SprintSelector from './SprintSelector';
import { useAssignTasksToSprint } from '../../api/sprints';
import { RichTextEditor, type User } from '../misc/RichTextEditor';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: number | null;
  defaultStatusId?: number;
  parentTaskId?: number;
}

interface FormData {
  title: string;
  type: TaskType;
  description: string;
  statusId: number | null;
  priority: TaskPriority;
  assigneeId: number | null;
  dueDate: Dayjs | null;
  estimatedHours: string;
  parentTaskId: number | null;
  sprintId: number | null;
}

interface FormErrors {
  title?: string;
  statusId?: string;
}

const taskTypes: { value: TaskType; label: string }[] = [
  { value: 'TASK', label: 'Task' },
  { value: 'BUG', label: 'Bug' },
  { value: 'STORY', label: 'Story' },
  { value: 'EPIC', label: 'Epic' },
];

const priorities: { value: TaskPriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const CreateTaskDialog = ({
  open,
  onClose,
  projectId,
  defaultStatusId,
  parentTaskId,
}: CreateTaskDialogProps) => {
  const createTask = useCreateTask(projectId || 0);
  const assignToSprint = useAssignTasksToSprint();
  const { data: statuses } = useProjectStatuses(projectId);
  const { data: members } = useProjectMembers(projectId);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    type: 'TASK',
    description: '',
    statusId: null,
    priority: 'MEDIUM',
    assigneeId: null,
    dueDate: null,
    estimatedHours: '',
    parentTaskId: parentTaskId || null,
    sprintId: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [createAnother, setCreateAnother] = useState(false);

  // Set default status when statuses load or defaultStatusId changes
  useEffect(() => {
    if (statuses && statuses.length > 0 && !formData.statusId) {
      const defaultStatus =
        defaultStatusId || statuses.find((s) => s.category === 'TODO')?.id || statuses[0].id;
      setFormData((prev) => ({ ...prev, statusId: defaultStatus }));
    }
  }, [statuses, defaultStatusId, formData.statusId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        title: '',
        type: 'TASK',
        description: '',
        statusId: null,
        priority: 'MEDIUM',
        assigneeId: null,
        dueDate: null,
        estimatedHours: '',
        parentTaskId: parentTaskId || null,
        sprintId: null,
      });
      setErrors({});
      setCreateAnother(false);
    }
  }, [open, parentTaskId]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.statusId) {
      newErrors.statusId = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !projectId) return;

    try {
      const newTask = await createTask.mutateAsync({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        priority: formData.priority,
        statusId: formData.statusId!,
        assigneeId: formData.assigneeId || undefined,
        dueDate: formData.dueDate?.toISOString() || undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        parentTaskId: formData.parentTaskId || undefined,
      });

      // If sprint is selected, assign task to sprint using the sprint endpoint
      if (formData.sprintId && newTask.id) {
        await assignToSprint.mutateAsync({
          sprintId: formData.sprintId,
          taskIds: [newTask.id],
        });
      }

      if (createAnother) {
        // Reset form but keep dialog open
        setFormData({
          title: '',
          type: formData.type, // Keep same type
          description: '',
          statusId: formData.statusId, // Keep same status
          priority: formData.priority, // Keep same priority
          assigneeId: null,
          dueDate: null,
          estimatedHours: '',
          parentTaskId: parentTaskId || null,
          sprintId: formData.sprintId, // Keep same sprint
        });
        setErrors({});
      } else {
        // Small delay to ensure refetch completes before closing
        await new Promise(resolve => setTimeout(resolve, 300));
        onClose();
      }
    } catch (error) {
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  };

  const selectedMember = members?.find((m) => m.userId === formData.assigneeId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      onKeyDown={handleKeyDown}
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <AddTaskIcon color="primary" />
        <Typography variant="h6">Create New Task</Typography>
      </DialogTitle>

      <DialogContent dividers>
        {parentTaskId && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Creating a subtask
          </Alert>
        )}

        {/* Title */}
        <TextField
          autoFocus
          label="Title"
          fullWidth
          required
          value={formData.title}
          onChange={(e) => {
            setFormData({ ...formData, title: e.target.value });
            if (errors.title) {
              setErrors({ ...errors, title: undefined });
            }
          }}
          error={!!errors.title}
          helperText={errors.title}
          sx={{ mb: 2 }}
          placeholder="Enter task title..."
        />

        {/* Type and Priority Row */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              label="Type"
              onChange={(e) => setFormData({ ...formData, type: e.target.value as TaskType })}
            >
              {taskTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={formData.priority}
              label="Priority"
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value as TaskPriority })
              }
            >
              {priorities.map((priority) => (
                <MenuItem key={priority.value} value={priority.value}>
                  {priority.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Description */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Description
          </Typography>
          <RichTextEditor
            content={formData.description}
            onChange={(content) => setFormData({ ...formData, description: content })}
            placeholder="Enter task description..."
            users={
              members?.map((member): User => ({
                id: member.userId,
                username: member.username || '',
                fullName: member.fullName || member.username || 'Unknown',
              })) || []
            }
            minHeight={120}
            maxHeight={250}
            showTaskList={true}
          />
        </Box>

        {/* Status */}
        <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.statusId} required>
          <InputLabel>Status</InputLabel>
          <Select
            value={formData.statusId || ''}
            label="Status"
            onChange={(e) => {
              setFormData({ ...formData, statusId: e.target.value as number });
              if (errors.statusId) {
                setErrors({ ...errors, statusId: undefined });
              }
            }}
            disabled={!statuses || statuses.length === 0}
          >
            {statuses?.map((status) => (
              <MenuItem key={status.id} value={status.id}>
                {status.name}
              </MenuItem>
            ))}
          </Select>
          {errors.statusId && <FormHelperText>{errors.statusId}</FormHelperText>}
        </FormControl>

        {/* Assignee */}
        <Autocomplete
          options={members || []}
          getOptionLabel={(option) => option.fullName || option.username || 'Unknown'}
          value={selectedMember || null}
          onChange={(_, newValue) => {
            setFormData({ ...formData, assigneeId: newValue?.userId || null });
          }}
          renderInput={(params) => <TextField {...params} label="Assignee" placeholder="Search members..." />}
          sx={{ mb: 2 }}
          disabled={!members || members.length === 0}
        />

        {/* Due Date and Estimated Hours Row */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Due Date"
              value={formData.dueDate}
              onChange={(newValue) => setFormData({ ...formData, dueDate: newValue })}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          </LocalizationProvider>

          <TextField
            label="Estimated Hours"
            type="number"
            fullWidth
            value={formData.estimatedHours}
            onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
            inputProps={{ min: 0, step: 0.5 }}
            placeholder="0"
          />
        </Box>

        {/* Sprint */}
        <SprintSelector
          projectId={projectId}
          value={formData.sprintId}
          onChange={(sprintId) => setFormData({ ...formData, sprintId })}
          label="Sprint"
          size="medium"
          allowNone={true}
        />

        {/* Create Another Checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={createAnother}
              onChange={(e) => setCreateAnother(e.target.checked)}
            />
          }
          label="Create another task"
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={createTask.isPending || assignToSprint.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={createTask.isPending || assignToSprint.isPending || !projectId}
          startIcon={createTask.isPending || assignToSprint.isPending ? <CircularProgress size={16} /> : <AddTaskIcon />}
        >
          {createTask.isPending || assignToSprint.isPending ? 'Creating...' : 'Create Task'}
        </Button>
      </DialogActions>

      {/* Keyboard Hint */}
      <Box
        sx={{
          px: 3,
          py: 1,
          bgcolor: 'action.hover',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Press Ctrl+Enter to create task
        </Typography>
      </Box>
    </Dialog>
  );
};

export default CreateTaskDialog;
