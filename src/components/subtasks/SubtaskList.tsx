import { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Checkbox,
  IconButton,
  Typography,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import type { TaskResponse } from '../../types/task.types';

interface SubtaskListProps {
  parentTaskId: number;
  subtasks: TaskResponse[];
  onAdd?: () => void;
  onEdit?: (subtask: TaskResponse) => void;
  onDelete?: (subtaskId: number) => void;
  onToggleComplete?: (subtaskId: number, currentStatusId: number) => void;
  onReorder?: (subtasks: TaskResponse[]) => void;
  editable?: boolean;
}

export const SubtaskList = ({
  parentTaskId,
  subtasks,
  onAdd,
  onEdit,
  onDelete,
  onToggleComplete,
  onReorder,
  editable = true,
}: SubtaskListProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSubtask, setSelectedSubtask] = useState<TaskResponse | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, subtask: TaskResponse) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedSubtask(subtask);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSubtask(null);
  };

  const handleEdit = () => {
    if (selectedSubtask && onEdit) {
      onEdit(selectedSubtask);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedSubtask && onDelete) {
      onDelete(selectedSubtask.id);
    }
    handleMenuClose();
  };

  const handleToggle = (subtask: TaskResponse) => {
    if (onToggleComplete) {
      onToggleComplete(subtask.id, subtask.statusId);
    }
  };

  const completedCount = subtasks.filter((st) => st.status.category === 'DONE').length;
  const totalCount = subtasks.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (subtasks.length === 0) {
    return (
      <Box textAlign="center" py={2}>
        <Typography variant="body2" color="text.secondary">
          No subtasks yet
        </Typography>
        {editable && onAdd && (
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            Click "Add Subtask" to create one
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {/* Progress Summary */}
      <Box mb={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Typography variant="caption" color="text.secondary">
            Progress
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {completedCount} of {totalCount} completed
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={completionPercentage}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              bgcolor: completionPercentage === 100 ? 'success.main' : 'primary.main',
            },
          }}
        />
      </Box>

      {/* Subtasks List */}
      <List dense disablePadding>
        {subtasks.map((subtask, index) => {
          const isCompleted = subtask.status.category === 'DONE';

          return (
            <ListItem
              key={subtask.id}
              disablePadding
              secondaryAction={
                editable && (
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => handleMenuOpen(e, subtask)}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )
              }
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 0.5,
                bgcolor: isCompleted ? 'action.hover' : 'background.paper',
              }}
            >
              <ListItemButton
                dense
                onClick={() => handleToggle(subtask)}
                disabled={!editable || !onToggleComplete}
              >
                {editable && onReorder && (
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </ListItemIcon>
                )}
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Checkbox
                    edge="start"
                    checked={isCompleted}
                    tabIndex={-1}
                    disableRipple
                    size="small"
                    disabled={!editable || !onToggleComplete}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        variant="body2"
                        sx={{
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          color: isCompleted ? 'text.disabled' : 'text.primary',
                        }}
                      >
                        {subtask.title}
                      </Typography>
                      <Chip
                        label={subtask.key}
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
                    <Box display="flex" gap={0.5} mt={0.5} alignItems="center">
                      {subtask.status && (
                        <Chip
                          label={subtask.status.name}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.6rem',
                            bgcolor: subtask.status.color || 'default',
                            color: subtask.status.color ? 'white' : 'inherit',
                          }}
                        />
                      )}
                      {subtask.assignee && (
                        <Typography variant="caption" color="text.secondary">
                          {subtask.assignee.fullName || subtask.assignee.username}
                        </Typography>
                      )}
                      {subtask.estimatedHours && (
                        <Typography variant="caption" color="text.secondary">
                          • {subtask.estimatedHours}h
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default SubtaskList;
