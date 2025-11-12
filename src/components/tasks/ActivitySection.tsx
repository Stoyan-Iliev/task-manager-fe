import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  CircularProgress,
  Paper,
  Chip,
  useTheme,
} from '@mui/material';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { useTaskActivity } from '../../api/activity';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';

interface ActivitySectionProps {
  taskId: number;
}

const ActivitySection: React.FC<ActivitySectionProps> = ({ taskId }) => {
  const theme = useTheme();
  const { data: activities = [], isLoading, isError } = useTaskActivity(taskId);

  const getActionDescription = (action: string): { text: string; color: string } => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create')) return { text: 'Created', color: theme.palette.success.main };
    if (actionLower.includes('update')) return { text: 'Updated', color: theme.palette.info.main };
    if (actionLower.includes('delete')) return { text: 'Deleted', color: theme.palette.error.main };
    if (actionLower.includes('status')) return { text: 'Changed Status', color: theme.palette.warning.main };
    if (actionLower.includes('assign')) return { text: 'Assigned', color: theme.palette.primary.main };
    if (actionLower.includes('comment')) return { text: 'Commented', color: theme.palette.secondary.main };
    return { text: action, color: theme.palette.grey[600] };
  };

  const formatChanges = (changes: Record<string, any> | null) => {
    if (!changes) return null;

    return Object.entries(changes).map(([key, value]) => {
      // Handle different types of change values
      let before = value.before;
      let after = value.after;

      // Convert null/undefined to readable strings
      if (before === null || before === undefined) before = 'None';
      if (after === null || after === undefined) after = 'None';

      // Truncate long values
      const truncate = (str: string, len: number = 50) => {
        const strVal = String(str);
        return strVal.length > len ? strVal.substring(0, len) + '...' : strVal;
      };

      return (
        <Box key={key} sx={{ mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>{key}</strong>:{' '}
            <span style={{ textDecoration: 'line-through', color: theme.palette.error.main }}>
              {truncate(String(before))}
            </span>
            {' → '}
            <span style={{ color: theme.palette.success.main }}>
              {truncate(String(after))}
            </span>
          </Typography>
        </Box>
      );
    });
  };

  const formatActivityDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const groupActivitiesByDate = () => {
    const grouped: Record<string, typeof activities> = {};

    activities.forEach(activity => {
      const dateKey = formatActivityDate(activity.timestamp);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });

    return grouped;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography variant="body2" color="error">
          Failed to load activity log
        </Typography>
      </Box>
    );
  }

  if (activities.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          No activity yet
        </Typography>
      </Box>
    );
  }

  const groupedActivities = groupActivitiesByDate();

  return (
    <Box>
      {Object.entries(groupedActivities).map(([date, dateActivities]) => (
        <Box key={date} sx={{ mb: 2 }}>
          {/* Date Header */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              fontWeight: 600,
              color: 'text.secondary',
              textTransform: 'uppercase',
              mb: 1,
              px: 2,
            }}
          >
            {date}
          </Typography>

          {/* Activities for this date */}
          <List sx={{ py: 0 }}>
            {dateActivities.map((activity, index) => {
              const actionInfo = getActionDescription(activity.action);

              return (
                <React.Fragment key={activity.id}>
                  <ListItem alignItems="flex-start" sx={{ px: 2, py: 1.5 }}>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: theme.palette.grey[300],
                          width: 32,
                          height: 32,
                        }}
                      >
                        <PersonIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {activity.actorName}
                            </Typography>
                            <Chip
                              label={actionInfo.text}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                bgcolor: actionInfo.color,
                                color: 'white',
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </Typography>
                          </Box>

                          {/* Display changes if available */}
                          {activity.changes && (
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 1,
                                mt: 1,
                                bgcolor: theme.palette.grey[50],
                              }}
                            >
                              {formatChanges(activity.changes)}
                            </Paper>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < dateActivities.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              );
            })}
          </List>
        </Box>
      ))}
    </Box>
  );
};

export default ActivitySection;
