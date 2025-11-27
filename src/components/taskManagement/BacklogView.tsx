import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Avatar,
  Paper,
  Divider,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
} from "@mui/material";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { useQueries } from "@tanstack/react-query";
import { useBacklogTasks, useSprints, useAssignTasksToSprint, useRemoveTasksFromSprint } from "../../api/sprints";
import apiClient from "../../api/client";
import type { TaskPriority, TaskResponse, TaskSummary } from "../../types/task.types";

const priorityColors: Record<TaskPriority, string> = {
  LOWEST: "#8bc34a",
  LOW: "#4caf50",
  MEDIUM: "#ff9800",
  HIGH: "#f44336",
  HIGHEST: "#d32f2f",
};

const BacklogView: React.FC = () => {
  const theme = useTheme();
  const projectId = useSelector((state: RootState) => state.project.currentProjectId);

  // Fetch data using API hooks
  const { data: backlogTasks = [], isLoading: loadingBacklog, error: backlogError } = useBacklogTasks(projectId);
  const { data: sprints = [], isLoading: loadingSprints, error: sprintsError } = useSprints(projectId);

  // Fetch tasks for each sprint using useQueries
  const sprintTasksQueries = useQueries({
    queries: sprints.map((sprint) => ({
      queryKey: ['sprint-tasks', sprint.id],
      queryFn: async (): Promise<TaskResponse[]> => {
        const response = await apiClient.get<TaskResponse[]>(
          `/api/secure/sprints/${sprint.id}/tasks`
        );

        // Normalize the response data
        let tasks = Array.isArray(response.data) ? response.data : [];
        tasks = tasks.map(task => ({
          ...task,
          statusId: task.statusId ?? task.status?.id,
          assigneeId: task.assigneeId ?? task.assignee?.id,
        }));

        return tasks;
      },
      staleTime: 1 * 60 * 1000,
    })),
  });

  // Mutation hooks for drag-and-drop
  const assignTasks = useAssignTasksToSprint();
  const removeTasks = useRemoveTasksFromSprint();

  // Get tasks for a specific sprint from the queries results
  const getSprintTasks = (sprintId: number): TaskResponse[] => {
    const queryIndex = sprints.findIndex((s) => s.id === sprintId);
    if (queryIndex === -1) return [];
    const query = sprintTasksQueries[queryIndex];
    return query.data || [];
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const taskId = Number(draggableId);

    // Same column - reordering (we don't persist order yet, so just ignore)
    if (source.droppableId === destination.droppableId) {
      return;
    }

    try {
      // Backlog → Sprint
      if (source.droppableId === "backlog" && destination.droppableId !== "backlog") {
        await assignTasks.mutateAsync({
          sprintId: Number(destination.droppableId),
          taskIds: [taskId],
        });
      }
      // Sprint → Backlog
      else if (source.droppableId !== "backlog" && destination.droppableId === "backlog") {
        await removeTasks.mutateAsync([taskId]);
      }
      // Sprint → Sprint (different sprint)
      else if (source.droppableId !== destination.droppableId) {
        await assignTasks.mutateAsync({
          sprintId: Number(destination.droppableId),
          taskIds: [taskId],
        });
      }
    } catch (error) {
      console.error("Error updating task sprint:", error);
    }
  };

  // Loading and error states
  const isLoadingSprintTasks = sprintTasksQueries.some((query) => query.isLoading);

  if (loadingBacklog || loadingSprints || isLoadingSprintTasks) {
    return (
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (backlogError || sprintsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading backlog data. Please try again later.
        </Alert>
      </Box>
    );
  }

  const renderTaskCard = (task: TaskSummary | TaskResponse, provided: any, snapshot: any) => (
    <Card
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: snapshot.isDragging ? 6 : 2,
        cursor: "grab",
        overflow: "hidden",
        bgcolor: theme.palette.background.paper,
      }}
    >
      <Box sx={{ height: 6, backgroundColor: priorityColors[task.priority] }} />
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {task.key}
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="text.primary"
              sx={{ cursor: "pointer", "&:hover": { color: "primary.main", textDecoration: "underline" } }}
            >
              {task.title}
            </Typography>
          </Box>
          <IconButton size="small">
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ mt: 1, display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Chip size="small" label={task.type} variant="outlined" />
          <Chip size="small" label={task.priority} sx={{ backgroundColor: alpha(priorityColors[task.priority], 0.1) }} />
          {task.assignee && (
            <Chip
              size="small"
              label={task.assignee.fullName || task.assignee.username}
              avatar={
                <Avatar sx={{ width: 20, height: 20 }}>
                  {(task.assignee.fullName || task.assignee.username).charAt(0).toUpperCase()}
                </Avatar>
              }
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const renderColumn = (title: string, tasks: (TaskSummary | TaskResponse)[], droppableId: string) => (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.droppableProps}
          sx={{
            p: 2,
            mb: 4,
            minHeight: 150,
            borderRadius: 2,
            bgcolor: theme.palette.mode === "dark"
              ? alpha(theme.palette.grey[900], 0.5)
              : alpha(theme.palette.grey[100], 0.8),
            ...(snapshot.isDraggingOver && {
              bgcolor: theme.palette.mode === "dark"
                ? alpha(theme.palette.primary.main, 0.15)
                : alpha(theme.palette.primary.main, 0.1),
            }),
            boxShadow: snapshot.isDraggingOver ? 3 : 2,
            transition: "background-color 0.15s ease",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle1" color="text.primary" fontWeight="600">
              {title}
            </Typography>
            <Chip size="small" label={tasks.length} />
          </Box>
          {tasks.length === 0 ? (
            <Box
              sx={{
                p: 3,
                textAlign: "center",
                color: "text.secondary",
                fontStyle: "italic",
              }}
            >
              <Typography variant="body2">No tasks</Typography>
            </Box>
          ) : (
            tasks.map((task, index) => (
              <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                {(provided, snapshot) => renderTaskCard(task, provided, snapshot)}
              </Draggable>
            ))
          )}
          {provided.placeholder}
        </Paper>
      )}
    </Droppable>
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
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
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <FolderRoundedIcon sx={{ mr: 1, fontSize: 32 }} color="primary" />
          <Typography variant="h4" color="text.primary">
            Backlog & Sprint Planning
          </Typography>
        </Box>

        {/* Backlog Column */}
        {renderColumn("Backlog Items", backlogTasks, "backlog")}

        <Divider sx={{ my: 3 }}>
          <Chip label="Sprints" />
        </Divider>

        {/* Sprint Columns */}
        {sprints.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: "center",
              bgcolor: theme.palette.background.paper,
              borderRadius: 2,
              border: `1px dashed ${theme.palette.divider}`,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No sprints created yet. Create a sprint from the Sprints page to start planning.
            </Typography>
          </Box>
        ) : (
          sprints.map((sprint) => (
            <Box key={sprint.id}>
              {renderColumn(sprint.name, getSprintTasks(sprint.id), sprint.id.toString())}
            </Box>
          ))
        )}
      </Box>
    </DragDropContext>
  );
};

export default BacklogView;