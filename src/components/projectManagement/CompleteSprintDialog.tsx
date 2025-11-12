import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Box,
  Typography,
  Alert,
} from "@mui/material";
import { useSprint, useCompleteSprint, useSprints } from "../../api/sprints";
import SprintSelector from "../taskManagement/SprintSelector";
import type { CompleteSprintRequest } from "../../types/project.types";

interface CompleteSprintDialogProps {
  open: boolean;
  sprintId: number | null;
  sprintName?: string;
  projectId: number | null;
  onClose: () => void;
  onComplete?: () => void;
}

export const CompleteSprintDialog: React.FC<CompleteSprintDialogProps> = ({
  open,
  sprintId,
  sprintName,
  projectId,
  onClose,
  onComplete,
}) => {
  const [rolloverOption, setRolloverOption] = useState<"backlog" | "sprint" | "keep">("backlog");
  const [targetSprintId, setTargetSprintId] = useState<number | null>(null);

  // Fetch sprint details and available sprints
  const { data: sprintDetails } = useSprint(sprintId);
  const { data: sprints = [] } = useSprints(projectId);
  const completeSprint = useCompleteSprint();

  // Filter sprints - exclude current sprint and completed sprints
  const availableSprints = sprints.filter(
    (s) => s.id !== sprintId && (s.status === "PLANNED" || s.status === "ACTIVE")
  );

  const handleComplete = async () => {
    if (!sprintId) return;

    const request: CompleteSprintRequest = {
      rolloverIncompleteTasks: rolloverOption !== "keep",
      targetSprintId: rolloverOption === "sprint" ? targetSprintId ?? undefined : undefined,
    };

    try {
      await completeSprint.mutateAsync({ id: sprintId, data: request });
      onComplete?.();
      onClose();
      // Reset state
      setRolloverOption("backlog");
      setTargetSprintId(null);
    } catch (error) {
      console.error("Error completing sprint:", error);
    }
  };

  const isValid = rolloverOption !== "sprint" || targetSprintId !== null;
  const hasIncompleteTasks = (sprintDetails?.metrics?.remainingTasks || 0) > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Complete Sprint: {sprintName}</DialogTitle>
      <DialogContent>
        {/* Sprint Summary */}
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: "background.default",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Sprint Summary
          </Typography>
          <Typography variant="body2">
            <strong>Completed:</strong> {sprintDetails?.metrics?.completedTasks || 0} tasks
          </Typography>
          <Typography variant="body2">
            <strong>Remaining:</strong> {sprintDetails?.metrics?.remainingTasks || 0} tasks
          </Typography>
          <Typography variant="body2">
            <strong>Progress:</strong> {Math.round(sprintDetails?.metrics?.progressPercentage || 0)}%
          </Typography>
        </Box>

        {/* Rollover Options */}
        {hasIncompleteTasks ? (
          <>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              What should we do with incomplete tasks?
            </Typography>

            <RadioGroup
              value={rolloverOption}
              onChange={(e) => setRolloverOption(e.target.value as "backlog" | "sprint" | "keep")}
            >
              <FormControlLabel
                value="backlog"
                control={<Radio />}
                label="Move to backlog (recommended)"
              />

              <FormControlLabel
                value="sprint"
                control={<Radio />}
                label="Move to another sprint"
                disabled={availableSprints.length === 0}
              />

              {rolloverOption === "sprint" && availableSprints.length > 0 && (
                <Box sx={{ ml: 4, mt: 1, mb: 2 }}>
                  <SprintSelector
                    projectId={projectId}
                    value={targetSprintId}
                    onChange={setTargetSprintId}
                    excludeSprintIds={[sprintId!]}
                    label="Select target sprint"
                    allowNone={false}
                  />
                </Box>
              )}

              {availableSprints.length === 0 && rolloverOption === "sprint" && (
                <Alert severity="info" sx={{ ml: 4, mt: 1 }}>
                  No other sprints available. Please select another option.
                </Alert>
              )}

              <FormControlLabel
                value="keep"
                control={<Radio />}
                label="Keep tasks in this sprint (not recommended)"
              />
            </RadioGroup>

            {rolloverOption === "keep" && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Warning: Keeping tasks in a completed sprint makes them harder to track. Consider
                moving them to backlog or another sprint.
              </Alert>
            )}
          </>
        ) : (
          <Alert severity="success" sx={{ mb: 2 }}>
            All tasks completed! Ready to close this sprint.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={completeSprint.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleComplete}
          variant="contained"
          color="success"
          disabled={!isValid || completeSprint.isPending}
        >
          {completeSprint.isPending ? "Completing..." : "Complete Sprint"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
