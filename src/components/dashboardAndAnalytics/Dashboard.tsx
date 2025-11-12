import { useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  CardActionArea,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import { useOrganizationMetrics, useOrganizationProjectsMetrics } from '../../api/analytics';
import { useRecentActivity } from '../../api/activity';
import { selectCurrentOrganization } from '../../redux/organizationSlice';

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const currentOrganization = useSelector(selectCurrentOrganization);

  const { data: orgMetrics, isLoading: metricsLoading } = useOrganizationMetrics(
    currentOrganization?.id || null
  );
  const { data: projectsMetrics, isLoading: projectsLoading } = useOrganizationProjectsMetrics(
    currentOrganization?.id || null
  );
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(
    currentOrganization?.id || null,
    10
  );

  const isLoading = metricsLoading || projectsLoading || activityLoading;

  // Calculate KPI data from real metrics
  const kpiData = useMemo(() => {
    if (!orgMetrics) return [];

    return [
      {
        title: 'Projects',
        value: orgMetrics.totalProjects,
        icon: <FolderRoundedIcon />,
        description: `${orgMetrics.activeProjects} active projects`,
        trend: `${orgMetrics.activeProjects} active`,
        path: '/projects',
        color: theme.palette.primary.main,
      },
      {
        title: 'Total Tasks',
        value: orgMetrics.totalTasks,
        icon: <AssignmentRoundedIcon />,
        description: 'Tasks across all projects',
        trend: `${orgMetrics.completedTasks} completed`,
        path: '/tasks',
        color: theme.palette.info.main,
      },
      {
        title: 'Completion Rate',
        value: `${Math.round(orgMetrics.overallCompletionRate)}%`,
        icon: <CheckCircleIcon />,
        description: 'Overall task completion',
        trend: orgMetrics.overallCompletionRate >= 70 ? 'Good progress' : 'Needs attention',
        path: '/analytics',
        color: theme.palette.success.main,
      },
      {
        title: 'Team Members',
        value: orgMetrics.totalMembers,
        icon: <GroupRoundedIcon />,
        description: 'Active organization members',
        trend: 'Stable',
        path: '/organization/members',
        color: theme.palette.secondary.main,
      },
    ];
  }, [orgMetrics, theme]);

  // Prepare task distribution chart data
  const taskDistributionData = useMemo(() => {
    if (!orgMetrics) return [];

    const completed = orgMetrics.completedTasks;
    const inProgress = orgMetrics.totalTasks - orgMetrics.completedTasks;

    return [
      { name: 'Completed', value: completed, color: theme.palette.success.main },
      { name: 'In Progress', value: inProgress, color: theme.palette.info.main },
    ];
  }, [orgMetrics, theme]);

  // Prepare project metrics chart data
  const projectMetricsData = useMemo(() => {
    if (!projectsMetrics) return [];

    return projectsMetrics
      .slice(0, 5) // Top 5 projects
      .map((project) => ({
        name: project.projectName,
        tasks: project.totalTasks,
        completed: project.completedTasks,
        completionRate: Math.round(project.completionRate),
      }));
  }, [projectsMetrics]);

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="calc(100vh - 64px)"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!currentOrganization) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Please select an organization to view the dashboard.
        </Alert>
      </Box>
    );
  }

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
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }} color="text.primary">
        <HomeRoundedIcon sx={{ mr: 1 }} />
        Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {kpiData.map((kpi) => (
          <Grid key={kpi.title} item xs={12} sm={6} md={3}>
            <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
              <CardActionArea onClick={() => handleCardClick(kpi.path)}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Avatar sx={{ bgcolor: kpi.color }}>{kpi.icon}</Avatar>
                    <Box>
                      <Typography variant="subtitle1" color="text.primary">
                        {kpi.title}
                      </Typography>
                      <Typography variant="h6" color="text.primary">
                        {kpi.value}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {kpi.description}
                  </Typography>
                  <Chip label={kpi.trend} size="small" color="info" />
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts and Activity */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, boxShadow: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }} color="text.primary">
              Recent Activity
            </Typography>
            {activityLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={24} />
              </Box>
            ) : !recentActivity || recentActivity.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No recent activity
              </Typography>
            ) : (
              recentActivity.slice(0, 5).map((activity) => {
                // Format activity description
                const getActivityDescription = () => {
                  if (activity.description) return activity.description;

                  const userName = activity.user.fullName || activity.user.username;
                  const action = activity.action.toLowerCase().replace(/_/g, ' ');

                  return `${userName} ${action}`;
                };

                return (
                  <Card
                    key={activity.id}
                    sx={{
                      mb: 1,
                      p: 1.5,
                      borderRadius: 1.5,
                      boxShadow: 1,
                      bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.action.hover,
                      border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.divider : 'transparent'}`,
                    }}
                  >
                    <Typography variant="body2" color="text.primary">
                      {getActivityDescription()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(activity.timestamp).toLocaleString()}
                    </Typography>
                  </Card>
                );
              })
            )}
          </Card>
        </Grid>

        {/* Task Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, boxShadow: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 1 }} color="text.primary">
              Task Distribution
            </Typography>
            {taskDistributionData.length > 0 ? (
              <Box>
                <Box sx={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {taskDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: number) => [`${value} tasks`]}
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 4,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 3 }}>
                  {taskDistributionData.map((entry, index) => (
                    <Box key={index} display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: entry.color,
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {entry.name}: <strong>{entry.value}</strong>
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No task data available
              </Typography>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Project Metrics */}
      {projectMetricsData.length > 0 && (
        <Card sx={{ p: 2, boxShadow: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }} color="text.primary">
            Top Projects by Activity
          </Typography>
          <Grid container spacing={2}>
            {projectMetricsData.map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project.name}>
                <Card sx={{ p: 2, bgcolor: theme.palette.action.hover }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {project.name}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Tasks: {project.tasks}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed: {project.completed}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${project.completionRate}% Complete`}
                    size="small"
                    color={project.completionRate >= 70 ? 'success' : 'default'}
                  />
                </Card>
              </Grid>
            ))}
          </Grid>
        </Card>
      )}
    </Box>
  );
};

export default Dashboard;
