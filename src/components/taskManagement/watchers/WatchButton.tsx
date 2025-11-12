import { Button, CircularProgress } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useWatchTask, useUnwatchTask } from '../../../api/tasks';

interface WatchButtonProps {
  taskId: number;
  isWatching: boolean;
}

export const WatchButton = ({ taskId, isWatching }: WatchButtonProps) => {
  const watchTask = useWatchTask(taskId);
  const unwatchTask = useUnwatchTask(taskId);

  const handleToggleWatch = async () => {
    try {
      if (isWatching) {
        await unwatchTask.mutateAsync();
      } else {
        await watchTask.mutateAsync();
      }
    } catch (error) {
    }
  };

  const isLoading = watchTask.isPending || unwatchTask.isPending;

  return (
    <Button
      size="small"
      startIcon={
        isLoading ? (
          <CircularProgress size={16} />
        ) : isWatching ? (
          <VisibilityOffIcon />
        ) : (
          <VisibilityIcon />
        )
      }
      onClick={handleToggleWatch}
      disabled={isLoading}
      variant={isWatching ? 'outlined' : 'text'}
      aria-label={isWatching ? 'Stop watching this task' : 'Watch this task for updates'}
      sx={{
        minWidth: 'auto',
        px: 1.5,
      }}
    >
      {isWatching ? 'Unwatch' : 'Watch'}
    </Button>
  );
};
