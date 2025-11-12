import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Button,
  Grid,
  IconButton,
  TextField,
  useTheme,
  CircularProgress,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import {
  useSprints,
  useCreateSprint,
  useStartSprint,
  useDeleteSprint,
} from "../../api/sprints";
import type { SprintStatus } from "../../types/project.types";
import { CompleteSprintDialog } from "./CompleteSprintDialog";

const SprintsView: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const projectIdNum = useSelector((state: RootState) => state.project.currentProjectId);

  // Fetch sprints
  const { data: sprints, isLoading } = useSprints(projectIdNum);

  // Mutations - only initialize if projectId is available
  const createSprintMutation = useCreateSprint(projectIdNum || 0);
  const startSprintMutation = useStartSprint();
  const deleteSprintMutation = useDeleteSprint();

  // Form state
  const [newSprint, setNewSprint] = useState<{
    name: string;
    startDate: Dayjs | null;
    endDate: Dayjs | null;
    goal: string;
  }>({
    name: "",
    startDate: dayjs(),
    endDate: dayjs().add(2, "week"),
    goal: "",
  });

  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sprintToDelete, setSprintToDelete] = useState<number | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [sprintToComplete, setSprintToComplete] = useState<number | null>(null);

  const handleCreateSprint = () => {
    if (!newSprint.name || !newSprint.startDate || !newSprint.endDate) return;
    if (!projectIdNum) {
      console.error("Project ID is required to create a sprint");
      return;
    }

    createSprintMutation.mutate(
      {
        name: newSprint.name,
        goal: newSprint.goal || undefined,
        startDate: newSprint.startDate.format("YYYY-MM-DD"),
        endDate: newSprint.endDate.format("YYYY-MM-DD"),
      },
      {
        onSuccess: () => {
          setNewSprint({
            name: "",
            startDate: dayjs(),
            endDate: dayjs().add(2, "week"),
            goal: "",
          });
        },
      }
    );
  };

  const handleStartSprint = (sprintId: number) => {
    startSprintMutation.mutate(sprintId);
  };

  const handleDeleteSprint = () => {
    if (sprintToDelete) {
      deleteSprintMutation.mutate(sprintToDelete, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSprintToDelete(null);
        },
      });
    }
  };

  const getStatusColor = (status: SprintStatus) => {
    switch (status) {
      case "ACTIVE":
        return "#4caf50";
      case "COMPLETED":
        return "#9e9e9e";
      case "PLANNED":
        return "#2196f3";
      case "CANCELLED":
        return "#f44336";
      default:
        return "#9e9e9e";
    }
  };

  const getStatusLabel = (status: SprintStatus) => {
    switch (status) {
      case "ACTIVE":
        return "Active";
      case "COMPLETED":
        return "Completed";
      case "PLANNED":
        return "Planned";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  if (!projectIdNum) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Typography color="error">Project ID is required</Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: theme.palette.background.default,
        minHeight: {
          xs: "calc(100vh - 56px)",
          sm: "calc(100vh - 64px)",
        },
      }}
    >
      {/* Header */}
      <Typography variant="h4" sx={{ mb: 3 }} color="text.primary">
        <TimelineRoundedIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        Sprints
      </Typography>

      {/* Create New Sprint */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          bgcolor: theme.palette.background.paper,
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }} color="text.primary">
          Create New Sprint
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Sprint Name"
              value={newSprint.name}
              onChange={(e) =>
                setNewSprint({ ...newSprint, name: e.target.value })
              }
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <DatePicker
              label="Start Date"
              value={newSprint.startDate}
              onChange={(date) =>
                setNewSprint({ ...newSprint, startDate: date })
              }
              slotProps={{ textField: { fullWidth: true, size: "small" } }}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <DatePicker
              label="End Date"
              value={newSprint.endDate}
              onChange={(date) =>
                setNewSprint({ ...newSprint, endDate: date })
              }
              slotProps={{ textField: { fullWidth: true, size: "small" } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={handleCreateSprint}
              disabled={createSprintMutation.isPending}
              fullWidth
            >
              {createSprintMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Sprint Goal (optional)"
            value={newSprint.goal}
            onChange={(e) =>
              setNewSprint({ ...newSprint, goal: e.target.value })
            }
            size="small"
            multiline
            rows={2}
          />
        </Box>
      </Paper>

      {/* Sprints List */}
      <Typography variant="h5" sx={{ mb: 2 }} color="text.primary">
        All Sprints
      </Typography>

      {!sprints || sprints.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            No sprints yet. Create your first sprint above!
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {sprints.map((sprint) => (
            <Grid size={{ xs: 12, md: 6 }} key={sprint.id}>
              <Card
                onClick={() => navigate(`/sprints/${sprint.id}`)}
                sx={{
                  borderLeft: `4px solid ${getStatusColor(sprint.status)}`,
                  boxShadow: 3,
                  bgcolor: theme.palette.background.paper,
                  borderRadius: 2,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    boxShadow: 6,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box flex={1}>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        mb={1}
                      >
                        <Typography variant="h6" color="text.primary">
                          {sprint.name}
                        </Typography>
                        <Chip
                          label={getStatusLabel(sprint.status)}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(sprint.status),
                            color: "white",
                          }}
                        />
                      </Box>
                      {sprint.goal && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {sprint.goal}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {dayjs(sprint.startDate).format("MMM DD, YYYY")} -{" "}
                        {dayjs(sprint.endDate).format("MMM DD, YYYY")}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        Created by {sprint.createdByUsername}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      {sprint.status === "PLANNED" && (
                        <IconButton
                          color="success"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartSprint(sprint.id);
                          }}
                          disabled={startSprintMutation.isPending}
                          title="Start Sprint"
                        >
                          <PlayArrowRoundedIcon />
                        </IconButton>
                      )}
                      {sprint.status === "ACTIVE" && (
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSprintToComplete(sprint.id);
                            setCompleteDialogOpen(true);
                          }}
                          title="Complete Sprint"
                        >
                          <CheckCircleRoundedIcon />
                        </IconButton>
                      )}
                      <IconButton
                        color="error"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSprintToDelete(sprint.id);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={deleteSprintMutation.isPending}
                        title="Delete Sprint"
                      >
                        <DeleteRoundedIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Sprint Metrics */}
                  {sprint.metrics && (
                    <Box sx={{ mt: 2 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        mb={0.5}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Progress: {sprint.metrics.completedTasks} /{" "}
                          {sprint.metrics.totalTasks} tasks
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sprint.metrics.progressPercentage.toFixed(0)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={sprint.metrics.progressPercentage}
                        sx={{
                          height: 8,
                          borderRadius: 1,
                          bgcolor:
                            theme.palette.mode === "light"
                              ? "#e0e0e0"
                              : "#424242",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: getStatusColor(sprint.status),
                          },
                        }}
                      />
                      {sprint.metrics.totalPoints > 0 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 0.5 }}
                        >
                          Points: {sprint.metrics.completedPoints} /{" "}
                          {sprint.metrics.totalPoints}
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Sprint</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this sprint? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteSprint}
            color="error"
            variant="contained"
            disabled={deleteSprintMutation.isPending}
          >
            {deleteSprintMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Sprint Dialog */}
      <CompleteSprintDialog
        open={completeDialogOpen}
        sprintId={sprintToComplete}
        sprintName={sprints?.find(s => s.id === sprintToComplete)?.name}
        projectId={projectIdNum}
        onClose={() => {
          setCompleteDialogOpen(false);
          setSprintToComplete(null);
        }}
      />
    </Box>
  );
};

export default SprintsView;