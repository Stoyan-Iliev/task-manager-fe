import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Divider,
  Alert,
  Stack,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CategoryIcon from '@mui/icons-material/Category';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useProjectStatuses, useReorderStatuses } from '../../api/taskStatuses';
import { useCanManageMembers } from '../../hooks/useProjectPermissions';
import AddStatusDialog from './AddStatusDialog';
import EditStatusDialog from './EditStatusDialog';
import DeleteStatusDialog from './DeleteStatusDialog';
import ApplyTemplateDialog from './ApplyTemplateDialog';
import type { TaskStatusResponse } from '../../types/project.types';

interface TaskStatusManagementProps {
  projectId: number;
}

const TaskStatusManagement = ({ projectId }: TaskStatusManagementProps) => {
  const { data: statuses, isLoading } = useProjectStatuses(projectId);
  const reorderStatuses = useReorderStatuses(projectId);
  const canManage = useCanManageMembers(projectId);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatusResponse | null>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !statuses) return;

    const { source, destination } = result;

    // No movement
    if (source.index === destination.index) return;

    // Reorder the array
    const reordered = Array.from(statuses);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    // Extract IDs in new order
    const statusIds = reordered.map((status) => status.id);

    // Send to backend
    reorderStatuses.mutate({ statusIds });
  };

  const handleEditStatus = (status: TaskStatusResponse) => {
    setSelectedStatus(status);
    setEditDialogOpen(true);
  };

  const handleDeleteStatus = (status: TaskStatusResponse) => {
    setSelectedStatus(status);
    setDeleteDialogOpen(true);
  };

  const getStatusColor = (color: string) => {
    const colorMap: Record<string, string> = {
      GRAY: '#9e9e9e',
      BLUE: '#2196f3',
      GREEN: '#4caf50',
      YELLOW: '#ff9800',
      RED: '#f44336',
      PURPLE: '#9c27b0',
    };
    return colorMap[color] || '#9e9e9e';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'TODO':
        return '📋';
      case 'IN_PROGRESS':
        return '⚙️';
      case 'DONE':
        return '✅';
      default:
        return '📁';
    }
  };

  const getWipUtilization = (status: TaskStatusResponse) => {
    if (!status.wipLimit || status.wipLimit <= 0) return null;
    const currentTasks = status.taskCount || 0;
    const utilization = (currentTasks / status.wipLimit) * 100;
    return {
      percentage: utilization,
      isOverLimit: currentTasks > status.wipLimit,
      currentTasks,
      wipLimit: status.wipLimit,
    };
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Workflow & Statuses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage task statuses and configure Work In Progress (WIP) limits for your project
          </Typography>
        </Box>
        {canManage && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<CategoryIcon />}
              onClick={() => setTemplateDialogOpen(true)}
            >
              Apply Template
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              Add Status
            </Button>
          </Stack>
        )}
      </Box>

      {/* Info Alert */}
      {canManage && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>WIP Limits:</strong> Set limits on how many tasks can be in a status at once. This helps
          prevent bottlenecks and encourages finishing work before starting new tasks.
        </Alert>
      )}

      {/* Status List */}
      {!statuses || statuses.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No statuses configured
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add statuses to track your tasks through your workflow
          </Typography>
          {canManage && (
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddDialogOpen(true)}
              >
                Add First Status
              </Button>
              <Button
                variant="outlined"
                startIcon={<CategoryIcon />}
                onClick={() => setTemplateDialogOpen(true)}
              >
                Use Template
              </Button>
            </Stack>
          )}
        </Paper>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="statuses-list" isDropDisabled={!canManage}>
            {(provided, snapshot) => (
              <List
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  ...(snapshot.isDraggingOver && {
                    bgcolor: 'action.hover',
                  }),
                }}
              >
                {statuses.map((status, index) => {
                  const wipInfo = getWipUtilization(status);
                  return (
                    <Draggable
                      key={status.id}
                      draggableId={status.id.toString()}
                      index={index}
                      isDragDisabled={!canManage}
                    >
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <ListItem
                            sx={{
                              py: 2,
                              bgcolor: snapshot.isDragging ? 'action.selected' : 'inherit',
                              boxShadow: snapshot.isDragging ? 4 : 0,
                              '&:hover': {
                                bgcolor: snapshot.isDragging ? 'action.selected' : 'action.hover',
                              },
                            }}
                          >
                            {canManage && (
                              <Box {...provided.dragHandleProps}>
                                <IconButton size="small" sx={{ mr: 1, cursor: 'grab' }}>
                                  <DragIndicatorIcon />
                                </IconButton>
                              </Box>
                            )}

                  <Box
                    sx={{
                      width: 4,
                      height: 40,
                      borderRadius: 1,
                      bgcolor: getStatusColor(status.color || '#2196f3'),
                      mr: 2,
                    }}
                  />

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {getCategoryIcon(status.category)} {status.name}
                        </Typography>
                        <Chip
                          label={status.category.replace('_', ' ')}
                          size="small"
                          variant="outlined"
                        />
                        {wipInfo && wipInfo.isOverLimit && (
                          <Tooltip title="WIP limit exceeded!">
                            <WarningIcon color="error" fontSize="small" />
                          </Tooltip>
                        )}
                        {status.taskCount === 0 && status.category === 'DONE' && (
                          <Tooltip title="No tasks completed yet">
                            <CheckCircleIcon color="success" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Position: {status.position}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tasks: {status.taskCount || 0}
                          </Typography>
                          {wipInfo ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                variant="body2"
                                color={wipInfo.isOverLimit ? 'error' : 'text.secondary'}
                                fontWeight={wipInfo.isOverLimit ? 'bold' : 'normal'}
                              >
                                WIP: {wipInfo.currentTasks} / {wipInfo.wipLimit}
                              </Typography>
                              <Box sx={{ width: 100 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(wipInfo.percentage, 100)}
                                  color={wipInfo.isOverLimit ? 'error' : 'primary'}
                                  sx={{ height: 6, borderRadius: 1 }}
                                />
                              </Box>
                              {wipInfo.isOverLimit && (
                                <Typography variant="caption" color="error">
                                  ({Math.round(wipInfo.percentage)}%)
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No WIP limit
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    }
                  />

                  {canManage && (
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleEditStatus(status)}
                        sx={{ mr: 0.5 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteStatus(status)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                          </ListItem>
                          {index < statuses.length - 1 && <Divider />}
                        </Box>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {!canManage && statuses && statuses.length > 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          You don't have permission to modify workflow settings. Only project leads and
          organization admins/owners can manage statuses.
        </Alert>
      )}

      {/* Dialogs */}
      <AddStatusDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        projectId={projectId}
      />

      {selectedStatus && (
        <>
          <EditStatusDialog
            open={editDialogOpen}
            onClose={() => {
              setEditDialogOpen(false);
              setSelectedStatus(null);
            }}
            status={selectedStatus}
            projectId={projectId}
          />
          <DeleteStatusDialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setSelectedStatus(null);
            }}
            status={selectedStatus}
            projectId={projectId}
          />
        </>
      )}

      <ApplyTemplateDialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        projectId={projectId}
      />
    </Box>
  );
};

export default TaskStatusManagement;
