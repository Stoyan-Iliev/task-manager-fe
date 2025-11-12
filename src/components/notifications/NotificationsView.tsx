import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  useTheme,
  CircularProgress,
  Tabs,
  Tab,
  Pagination,
  Button,
  Chip,
  Stack,
} from "@mui/material";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CommentIcon from '@mui/icons-material/Comment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useNavigate } from "react-router";
import { formatDistanceToNow } from "date-fns";
import { useNotifications, useUnreadNotifications, useMarkAsRead, useMarkAllAsRead } from "../../api/notifications";
import { NotificationType } from "../../types/notification.types";

const NotificationsView: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Fetch notifications based on active tab
  const { data: allNotificationsData, isLoading: isLoadingAll } = useNotifications(page, pageSize);
  const { data: unreadNotificationsData, isLoading: isLoadingUnread } = useUnreadNotifications(page, pageSize);

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const isLoading = activeTab === 'all' ? isLoadingAll : isLoadingUnread;
  const notificationsData = activeTab === 'all' ? allNotificationsData : unreadNotificationsData;
  const notifications = notificationsData?.content || [];
  const totalPages = notificationsData ? Math.ceil(notificationsData.totalElements / pageSize) : 0;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'all' | 'unread') => {
    setActiveTab(newValue);
    setPage(0); // Reset to first page when changing tabs
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value - 1); // MUI Pagination is 1-indexed, API is 0-indexed
  };

  const handleNotificationClick = (notificationId: number, taskId: number | null, projectId: number | null, read: boolean) => {
    // Mark as read if not already read
    if (!read) {
      markAsRead.mutate(notificationId);
    }

    // Navigate to the related entity
    if (taskId && projectId) {
      navigate(`/projects/${projectId}/tasks/${taskId}`);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TASK_CREATED:
      case NotificationType.TASK_ASSIGNED:
      case NotificationType.TASK_UNASSIGNED:
      case NotificationType.STATUS_CHANGED:
      case NotificationType.PRIORITY_CHANGED:
      case NotificationType.DUE_DATE_CHANGED:
        return <TaskAltIcon />;
      case NotificationType.COMMENT_ADDED:
      case NotificationType.COMMENT_REPLY:
      case NotificationType.MENTIONED:
        return <CommentIcon />;
      case NotificationType.ATTACHMENT_ADDED:
        return <AttachFileIcon />;
      case NotificationType.WATCHER_ADDED:
        return <PersonAddIcon />;
      default:
        return <NotificationsRoundedIcon />;
    }
  };

  const getTypeLabel = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.TASK_ASSIGNED:
        return 'Assigned';
      case NotificationType.TASK_CREATED:
        return 'Created';
      case NotificationType.STATUS_CHANGED:
        return 'Status';
      case NotificationType.COMMENT_ADDED:
        return 'Comment';
      case NotificationType.MENTIONED:
        return 'Mention';
      default:
        return type.replace(/_/g, ' ');
    }
  };

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
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4" sx={{ display: "flex", alignItems: "center", gap: 1 }} color="text.primary">
          <NotificationsRoundedIcon fontSize="large" /> Notifications
        </Typography>
        {notifications.length > 0 && activeTab === 'unread' && (
          <Button
            variant="outlined"
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            Mark all as read
          </Button>
        )}
      </Box>

      <Paper sx={{ bgcolor: theme.palette.background.paper, boxShadow: 3, borderRadius: 2 }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Unread" value="unread" />
            <Tab label="All" value="all" />
          </Tabs>
        </Box>

        {/* Notifications List */}
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: "center", p: 5 }}>
            <NotificationsRoundedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You're all caught up!
            </Typography>
          </Box>
        ) : (
          <>
            <List sx={{ p: 0 }}>
              {notifications.map((notif) => (
                <React.Fragment key={notif.id}>
                  <ListItemButton
                    onClick={() => handleNotificationClick(notif.id, notif.taskId, notif.projectId, notif.read)}
                    sx={{
                      bgcolor: notif.read ? "inherit" : theme.palette.action.hover,
                      '&:hover': {
                        bgcolor: theme.palette.action.selected,
                      },
                      py: 2,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: notif.read
                            ? theme.palette.grey[400]
                            : theme.palette.primary.main,
                          width: 48,
                          height: 48,
                        }}
                      >
                        {getNotificationIcon(notif.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack spacing={0.5}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: notif.read ? 400 : 600,
                              color: "text.primary",
                            }}
                          >
                            {notif.message}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {notif.taskKey && (
                              <Chip
                                label={notif.taskKey}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                            <Chip
                              label={getTypeLabel(notif.type)}
                              size="small"
                              variant="outlined"
                            />
                            {notif.actor && (
                              <Typography variant="caption" color="text.secondary">
                                by {notif.actor.name}
                              </Typography>
                            )}
                          </Stack>
                        </Stack>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page + 1}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default NotificationsView;