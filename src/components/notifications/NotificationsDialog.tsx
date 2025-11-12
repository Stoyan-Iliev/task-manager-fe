import React, { useState } from "react";
import {
  List,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Badge,
  Paper,
  Popper,
  ClickAwayListener,
  Typography,
  useTheme,
  CircularProgress,
  Box,
  Button,
  Divider,
  ListItemButton,
} from "@mui/material";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CommentIcon from '@mui/icons-material/Comment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useNavigate } from "react-router";
import { formatDistanceToNow } from "date-fns";
import { useUnreadNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from "../../api/notifications";
import { NotificationType } from "../../types/notification.types";

const NotificationsDialog: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Fetch unread notifications (first 10)
  const { data: notificationsData, isLoading } = useUnreadNotifications(0, 10);
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = notificationsData?.content || [];

  const handleToggle = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpen(prev => !prev);
  };

  const handleClose = () => setOpen(false);

  const handleNotificationClick = (notificationId: number, taskId: number | null, projectId: number | null, read: boolean) => {
    // Mark as read if not already read
    if (!read) {
      markAsRead.mutate(notificationId);
    }

    // Navigate to the related entity
    if (taskId && projectId) {
      navigate(`/projects/${projectId}/tasks/${taskId}`);
      handleClose();
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleViewAll = () => {
    navigate('/notifications');
    handleClose();
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

  return (
    <>
      <IconButton color="inherit" onClick={handleToggle}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsRoundedIcon />
        </Badge>
      </IconButton>

      <Popper open={open} anchorEl={anchorEl} placement="bottom-end" sx={{ zIndex: 1300 }}>
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            sx={{
              mt: 1,
              width: 360,
              maxHeight: 500,
              display: "flex",
              flexDirection: "column",
              bgcolor: theme.palette.background.paper,
              boxShadow: 3,
              borderRadius: 2,
            }}
          >
            {/* Header */}
            <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary" }}>
                Notifications
              </Typography>
              {notifications.length > 0 && (
                <Button
                  size="small"
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsRead.isPending}
                >
                  Mark all read
                </Button>
              )}
            </Box>

            <Divider />

            {/* Notifications List */}
            <Box sx={{ overflowY: "auto", flexGrow: 1 }}>
              {isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : notifications.length === 0 ? (
                <Box sx={{ textAlign: "center", p: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No new notifications
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {notifications.map(notif => (
                    <ListItemButton
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id, notif.taskId, notif.projectId, notif.read)}
                      sx={{
                        bgcolor: notif.read ? "inherit" : theme.palette.action.hover,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        '&:hover': {
                          bgcolor: theme.palette.action.selected,
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: notif.read
                              ? theme.palette.grey[400]
                              : theme.palette.primary.main,
                            width: 40,
                            height: 40,
                          }}
                        >
                          {getNotificationIcon(notif.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: notif.read ? 400 : 600,
                                color: "text.primary",
                              }}
                            >
                              {notif.message}
                            </Typography>
                            {notif.taskKey && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: theme.palette.primary.main,
                                  fontWeight: 500,
                                }}
                              >
                                {notif.taskKey}
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Box>

            {/* Footer */}
            {notifications.length > 0 && (
              <>
                <Divider />
                <Box sx={{ p: 1 }}>
                  <Button
                    fullWidth
                    size="small"
                    onClick={handleViewAll}
                    sx={{ textTransform: "none" }}
                  >
                    View all notifications
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
};

export default NotificationsDialog;