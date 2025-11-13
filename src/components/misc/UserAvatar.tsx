import { Avatar, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';
import { getAvatarUrl, getUserInitials } from '../../util/avatarUtils';

interface UserAvatarProps {
  userId?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

const sizeMap = {
  small: { width: 24, height: 24, fontSize: '0.75rem' },
  medium: { width: 40, height: 40, fontSize: '1rem' },
  large: { width: 56, height: 56, fontSize: '1.5rem' },
};

export default function UserAvatar({
  userId,
  username,
  firstName,
  lastName,
  avatarUrl: avatarUrlProp,
  size = 'medium',
  showTooltip = true,
}: UserAvatarProps) {
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(undefined);
  const initials = getUserInitials(firstName, lastName, username);
  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : username || 'Unknown User';

  useEffect(() => {
    let mounted = true;

    const loadAvatar = async () => {
      const url = await getAvatarUrl(userId, avatarUrlProp);
      if (mounted) {
        setAvatarSrc(url);
      }
    };

    if (userId && avatarUrlProp) {
      loadAvatar();
    }

    return () => {
      mounted = false;
    };
  }, [userId, avatarUrlProp]);

  const avatar = (
    <Avatar
      src={avatarSrc}
      sx={{
        ...sizeMap[size],
        bgcolor: 'primary.main',
        cursor: showTooltip ? 'default' : 'inherit',
      }}
    >
      {initials}
    </Avatar>
  );

  if (showTooltip) {
    return <Tooltip title={displayName}>{avatar}</Tooltip>;
  }

  return avatar;
}
