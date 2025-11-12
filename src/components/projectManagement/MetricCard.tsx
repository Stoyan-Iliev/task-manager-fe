import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: "success" | "warning" | "error" | "info" | "primary";
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color = "primary" }) => {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          {icon && (
            <Box sx={{ color: `${color}.main`, display: "flex", alignItems: "center" }}>
              {icon}
            </Box>
          )}
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" color="text.primary">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};
