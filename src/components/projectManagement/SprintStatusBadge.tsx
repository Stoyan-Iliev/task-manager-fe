import React from "react";
import { Chip } from "@mui/material";
import type { SprintStatus } from "../../types/project.types";

interface SprintStatusBadgeProps {
  status: SprintStatus;
}

export const SprintStatusBadge: React.FC<SprintStatusBadgeProps> = ({ status }) => {
  const config: Record<
    SprintStatus,
    { color: "default" | "primary" | "success" | "error" | "warning" | "info"; label: string }
  > = {
    PLANNED: { color: "primary", label: "Planned" },
    ACTIVE: { color: "success", label: "Active" },
    COMPLETED: { color: "default", label: "Completed" },
    CANCELLED: { color: "error", label: "Cancelled" },
  };

  const { color, label } = config[status];

  return <Chip label={label} color={color} size="small" />;
};
