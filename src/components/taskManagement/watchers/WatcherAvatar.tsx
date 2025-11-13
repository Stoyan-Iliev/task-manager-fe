import type { UserSummary } from '../../../types/common.types';
import UserAvatar from '../../misc/UserAvatar';

interface WatcherAvatarProps {
  user: UserSummary;
  size?: 'small' | 'medium' | 'large';
}

export const WatcherAvatar = ({ user, size = 'medium' }: WatcherAvatarProps) => {
  return (
    <UserAvatar
      userId={user.id}
      username={user.username}
      firstName={user.firstName}
      lastName={user.lastName}
      avatarUrl={user.avatarUrl}
      size={size}
      showTooltip={true}
    />
  );
};
