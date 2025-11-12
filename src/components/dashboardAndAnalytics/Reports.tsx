import React from "react";
import { Box, Typography, Card, CardContent, useTheme } from "@mui/material";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";

// Sample data for charts
const burndownData = [
  { day: "Day 1", remainingTasks: 20 },
  { day: "Day 2", remainingTasks: 18 },
  { day: "Day 3", remainingTasks: 15 },
  { day: "Day 4", remainingTasks: 12 },
  { day: "Day 5", remainingTasks: 8 },
  { day: "Day 6", remainingTasks: 4 },
  { day: "Day 7", remainingTasks: 0 },
];

const velocityData = [
  { sprint: "Sprint 1", completedTasks: 12 },
  { sprint: "Sprint 2", completedTasks: 15 },
  { sprint: "Sprint 3", completedTasks: 10 },
  { sprint: "Sprint 4", completedTasks: 18 },
];

const ReportsView: React.FC = () => {
  const theme = useTheme();

  return (
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
      <Typography variant="h4" sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }} color="text.primary">
        <BarChartRoundedIcon /> Reports & Analytics
      </Typography>

      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        {/* Burndown Chart */}
        <Card sx={{ boxShadow: 3, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }} color="text.primary">Burndown Chart</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="day" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider }} />
                <Line type="monotone" dataKey="remainingTasks" stroke={theme.palette.primary.main} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Velocity Chart */}
        <Card sx={{ boxShadow: 3, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }} color="text.primary">Velocity</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="sprint" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider }} />
                <Bar dataKey="completedTasks" fill="#9c27b0" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Additional Metrics */}
        <Card sx={{ boxShadow: 3, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }} color="text.primary">Task Completion Trends</Typography>
            <Typography variant="body2" color="text.secondary">
              - Avg. tasks completed per sprint: 13.8
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - Highest velocity: 18 tasks (Sprint 4)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - Lowest velocity: 10 tasks (Sprint 3)
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ReportsView;