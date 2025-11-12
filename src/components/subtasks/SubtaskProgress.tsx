import { Box, Typography, LinearProgress, Chip, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import type { TaskResponse } from '../../types/task.types';

interface SubtaskProgressProps {
  subtasks: TaskResponse[];
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const SubtaskProgress = ({
  subtasks,
  showDetails = true,
  size = 'medium',
}: SubtaskProgressProps) => {
  const completedCount = subtasks.filter((st) => st.status.category === 'DONE').length;
  const totalCount = subtasks.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const progressHeight = {
    small: 4,
    medium: 6,
    large: 8,
  }[size];

  const chipHeight = {
    small: 16,
    medium: 20,
    large: 24,
  }[size];

  const textVariant = {
    small: 'caption' as const,
    medium: 'body2' as const,
    large: 'body1' as const,
  }[size];

  if (totalCount === 0) {
    return null;
  }

  return (
    <Box>
      {/* Progress Bar */}
      <Tooltip
        title={`${completedCount} of ${totalCount} subtasks completed (${Math.round(completionPercentage)}%)`}
        arrow
      >
        <Box>
          <LinearProgress
            variant="determinate"
            value={completionPercentage}
            sx={{
              height: progressHeight,
              borderRadius: progressHeight / 2,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: progressHeight / 2,
                bgcolor: completionPercentage === 100 ? 'success.main' : 'primary.main',
              },
            }}
          />
        </Box>
      </Tooltip>

      {/* Details */}
      {showDetails && (
        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
          <Chip
            icon={
              completionPercentage === 100 ? (
                <CheckCircleIcon sx={{ fontSize: 14 }} />
              ) : (
                <PendingIcon sx={{ fontSize: 14 }} />
              )
            }
            label={`${completedCount}/${totalCount}`}
            size="small"
            color={completionPercentage === 100 ? 'success' : 'default'}
            sx={{
              height: chipHeight,
              fontSize: size === 'small' ? '0.65rem' : size === 'medium' ? '0.75rem' : '0.85rem',
            }}
          />
          <Typography variant={textVariant} color="text.secondary">
            {Math.round(completionPercentage)}% complete
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SubtaskProgress;
