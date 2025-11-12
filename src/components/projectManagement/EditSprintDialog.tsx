import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { useUpdateSprint } from "../../api/sprints";
import type { SprintResponse, SprintRequest } from "../../types/project.types";

interface EditSprintDialogProps {
  open: boolean;
  sprint: SprintResponse | null;
  onClose: () => void;
}

export const EditSprintDialog: React.FC<EditSprintDialogProps> = ({ open, sprint, onClose }) => {
  const updateSprint = useUpdateSprint();

  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    startDate: dayjs() as Dayjs | null,
    endDate: dayjs().add(2, "week") as Dayjs | null,
  });

  // Populate form when sprint changes
  useEffect(() => {
    if (sprint) {
      setFormData({
        name: sprint.name,
        goal: sprint.goal || "",
        startDate: dayjs(sprint.startDate),
        endDate: dayjs(sprint.endDate),
      });
    }
  }, [sprint]);

  const handleSubmit = async () => {
    if (!sprint || !formData.startDate || !formData.endDate) return;

    const request: SprintRequest = {
      name: formData.name,
      goal: formData.goal || undefined,
      startDate: formData.startDate.format("YYYY-MM-DD"),
      endDate: formData.endDate.format("YYYY-MM-DD"),
    };

    try {
      await updateSprint.mutateAsync({
        id: sprint.id,
        data: request,
      });
      onClose();
    } catch (error) {
      console.error("Error updating sprint:", error);
    }
  };

  const isValid =
    formData.name.trim() &&
    formData.startDate &&
    formData.endDate &&
    formData.endDate.isAfter(formData.startDate);

  const isCompletedSprint = sprint?.status === "COMPLETED";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Sprint</DialogTitle>
      <DialogContent>
        {isCompletedSprint && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This sprint is completed. Some fields may have limited editability.
          </Alert>
        )}

        <TextField
          label="Sprint Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          fullWidth
          required
          sx={{ mt: 1, mb: 2 }}
        />

        <TextField
          label="Goal"
          value={formData.goal}
          onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
          fullWidth
          multiline
          rows={2}
          sx={{ mb: 2 }}
        />

        <DatePicker
          label="Start Date"
          value={formData.startDate}
          onChange={(date) => setFormData({ ...formData, startDate: date })}
          disabled={isCompletedSprint}
          sx={{ mb: 2, width: "100%" }}
        />

        <DatePicker
          label="End Date"
          value={formData.endDate}
          onChange={(date) => setFormData({ ...formData, endDate: date })}
          minDate={formData.startDate || undefined}
          disabled={isCompletedSprint}
          sx={{ width: "100%" }}
        />

        {sprint?.status === "ACTIVE" && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Note: Changing dates of an active sprint may affect team planning.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={updateSprint.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValid || updateSprint.isPending}
        >
          {updateSprint.isPending ? "Updating..." : "Update Sprint"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
