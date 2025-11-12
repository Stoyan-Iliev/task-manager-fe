import {
  Box,
  Typography,
  Stack,
  AvatarGroup,
  CircularProgress,
  Popover,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
import { useState } from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTaskWatchers } from '../../../api/tasks';
import { WatcherAvatar } from './WatcherAvatar';
import { WatchButton } from './WatchButton';

interface WatcherListProps {
  taskId: number;
}

export const WatcherList = ({ taskId }: WatcherListProps) => {
  const { data: watchersData, isLoading } = useTaskWatchers(taskId);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);


  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="caption" color="text.secondary">
          Watchers
        </Typography>
        <CircularProgress size={16} />
      </Box>
    );
  }

  const watchers = watchersData?.watchers || [];
  const totalCount = watchersData?.totalCount || 0;
  const isCurrentUserWatching = watchersData?.isCurrentUserWatching || false;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="caption" color="text.secondary">
          Watchers ({totalCount})
        </Typography>

        {watchers.length > 0 && (
          <>
            <AvatarGroup
              max={4}
              onClick={handleOpenPopover}
              sx={{
                cursor: 'pointer',
                '& .MuiAvatar-root': {
                  width: 28,
                  height: 28,
                  fontSize: '0.75rem',
                  border: '2px solid',
                  borderColor: 'background.paper',
                },
              }}
            >
              {watchers.map((watcher) => (
                <WatcherAvatar key={watcher.id} user={watcher} size="small" />
              ))}
            </AvatarGroup>

            <IconButton size="small" onClick={handleOpenPopover}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </>
        )}

        <Box sx={{ ml: 'auto' }}>
          <WatchButton taskId={taskId} isWatching={isCurrentUserWatching} />
        </Box>
      </Stack>

      {/* Watchers Detail Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: { width: 320, maxHeight: 400 },
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Watchers ({totalCount})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            People watching this task will be notified of updates
          </Typography>
        </Box>

        <Divider />

        {watchers.length > 0 ? (
          <List sx={{ py: 0, maxHeight: 280, overflow: 'auto' }}>
            {watchers.map((watcher) => (
              <ListItem key={watcher.id}>
                <ListItemAvatar>
                  <WatcherAvatar user={watcher} size="medium" />
                </ListItemAvatar>
                <ListItemText
                  primary={watcher.fullName || watcher.username}
                  secondary={watcher.email}
                  primaryTypographyProps={{ fontWeight: 500 }}
                  secondaryTypographyProps={{ noWrap: true }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No watchers yet
            </Typography>
          </Box>
        )}
      </Popover>
    </Box>
  );
};
