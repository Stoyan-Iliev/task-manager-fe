import { Avatar, Tooltip } from '@mui/material';
import type { UserSummary } from '../../../types/common.types';

interface WatcherAvatarProps {
  user: UserSummary;
  size?: 'small' | 'medium' | 'large';
}

const sizeMap = {
  small: { width: 24, height: 24, fontSize: '0.75rem' },
  medium: { width: 32, height: 32, fontSize: '0.875rem' },
  large: { width: 40, height: 40, fontSize: '1rem' },
};

export const WatcherAvatar = ({ user, size = 'medium' }: WatcherAvatarProps) => {
  const displayName = user.fullName || user.username;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Tooltip title={displayName} arrow>
      <Avatar
        sx={{
          ...sizeMap[size],
          bgcolor: 'primary.main',
          cursor: 'pointer',
          '&:hover': {
            transform: 'scale(1.1)',
            transition: 'transform 0.2s',
          },
        }}
      >
        {initial}
      </Avatar>
    </Tooltip>
  );
};
