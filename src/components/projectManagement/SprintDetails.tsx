import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import {
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  useTheme,
  Card,
  CardContent,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import dayjs from "dayjs";
import { useSprint, useStartSprint, useDeleteSprint, useSprintTasks } from "../../api/sprints";
import { SprintStatusBadge } from "./SprintStatusBadge";
import { MetricCard } from "./MetricCard";
import { CompleteSprintDialog } from "./CompleteSprintDialog";
import { EditSprintDialog } from "./EditSprintDialog";

export const SprintDetails: React.FC = () => {
  const { sprintId } = useParams<{ sprintId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const projectId = useSelector((state: RootState) => state.project.currentProjectId);

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch data
  const { data: sprint, isLoading, error } = useSprint(Number(sprintId));
  const { data: sprintTasks = [], isLoading: isLoadingTasks } = useSprintTasks(Number(sprintId));

  // Mutations
  const startSprint = useStartSprint();
  const deleteSprint = useDeleteSprint();

  const handleStartSprint = async () => {
    if (!sprintId) return;
    await startSprint.mutateAsync(Number(sprintId));
  };

  const handleDelete = async () => {
    if (!confirm("Delete this sprint? Tasks will be moved to backlog.")) return;
    await deleteSprint.mutateAsync(Number(sprintId));
    navigate("/sprints");
  };

  if (isLoading || isLoadingTasks) {
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

  if (error || !sprint) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Sprint not found or error loading sprint details.</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/sprints")}
          sx={{ mt: 2 }}
        >
          Back to Sprints
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: theme.palette.background.default,
        minHeight: "calc(100vh - 64px)",
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/sprints")}
          sx={{ mb: 2 }}
        >
          Back to Sprints
        </Button>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
              <Typography variant="h4" color="text.primary">
                {sprint.name}
              </Typography>
              <SprintStatusBadge status={sprint.status} />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {dayjs(sprint.startDate).format("MMMM D, YYYY")} -{" "}
              {dayjs(sprint.endDate).format("MMMM D, YYYY")}
            </Typography>

            {sprint.goal && (
              <Typography variant="body1" color="text.primary" sx={{ mt: 1 }}>
                <strong>Goal:</strong> {sprint.goal}
              </Typography>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              Created by {sprint.createdByUsername}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {sprint.status === "PLANNED" && (
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrowIcon />}
                onClick={handleStartSprint}
                disabled={startSprint.isPending}
              >
                {startSprint.isPending ? "Starting..." : "Start Sprint"}
              </Button>
            )}
            {sprint.status === "ACTIVE" && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleRoundedIcon />}
                onClick={() => setCompleteDialogOpen(true)}
              >
                Complete Sprint
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditDialogOpen(true)}
              disabled={sprint.status === "COMPLETED"}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              disabled={deleteSprint.isPending}
            >
              {deleteSprint.isPending ? "Deleting..." : "Delete"}
            </Button>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Metrics Grid */}
      {sprint.metrics && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard
              title="Total Tasks"
              value={sprint.metrics.totalTasks || 0}
              icon={<AssignmentIcon />}
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard
              title="Completed"
              value={sprint.metrics.completedTasks || 0}
              icon={<CheckCircleIcon />}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard
              title="Remaining"
              value={sprint.metrics.remainingTasks || 0}
              icon={<PendingIcon />}
              color="warning"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard
              title="Progress"
              value={`${Math.round(sprint.metrics.progressPercentage || 0)}%`}
              icon={<TrendingUpIcon />}
              color="info"
            />
          </Grid>
        </Grid>
      )}

      {/* Sprint Tasks Section */}
      <Paper sx={{ p: 3, bgcolor: theme.palette.background.paper }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Tasks in Sprint
        </Typography>

        {sprintTasks.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: "center",
              bgcolor: theme.palette.background.default,
              borderRadius: 2,
              border: `1px dashed ${theme.palette.divider}`,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No tasks in this sprint yet. Add tasks from the backlog!
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/backlog")}
              sx={{ mt: 2 }}
            >
              Go to Backlog
            </Button>
          </Box>
        ) : (
          <Box>
            {sprintTasks.map((task) => (
              <Card key={task.id} sx={{ mb: 1 }}>
                <CardContent>
                  <Typography variant="subtitle1">{task.key}</Typography>
                  <Typography>{task.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {task.status.name} • {task.priority}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>

      {/* Complete Sprint Dialog */}
      <CompleteSprintDialog
        open={completeDialogOpen}
        sprintId={Number(sprintId)}
        sprintName={sprint.name}
        projectId={projectId}
        onClose={() => setCompleteDialogOpen(false)}
      />

      {/* Edit Sprint Dialog */}
      <EditSprintDialog
        open={editDialogOpen}
        sprint={sprint}
        onClose={() => setEditDialogOpen(false)}
      />
    </Box>
  );
};

export default SprintDetails;
