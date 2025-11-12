import {
  Box,
  Typography,
  List,
  ListItem,
  Chip,
  Avatar,
  Tooltip,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Stack,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MergeIcon from '@mui/icons-material/MergeType';
import GitHubIcon from '@mui/icons-material/GitHub';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import DraftsIcon from '@mui/icons-material/Drafts';
import { useTaskPullRequests } from '../../api/git';
import type { PullRequestResponse } from '../../types/git.types';

interface PullRequestListProps {
  taskId: number;
}

const stateIcons = {
  OPEN: <PendingIcon fontSize="small" sx={{ color: 'success.main' }} />,
  MERGED: <CheckCircleIcon fontSize="small" sx={{ color: 'primary.main' }} />,
  CLOSED: <CancelIcon fontSize="small" sx={{ color: 'error.main' }} />,
};

const stateColors = {
  OPEN: 'success' as const,
  MERGED: 'primary' as const,
  CLOSED: 'error' as const,
};

export const PullRequestList = ({ taskId }: PullRequestListProps) => {
  const { data: pullRequests, isLoading, error } = useTaskPullRequests(taskId);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load pull requests. Please try again later.
      </Alert>
    );
  }

  if (!pullRequests || pullRequests.length === 0) {
    return (
      <Box p={2}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No pull requests linked to this task yet
        </Typography>
        <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={1}>
          Pull requests will automatically appear here when you reference this task in PR titles or descriptions
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <List dense>
        {pullRequests.map((pr: PullRequestResponse) => (
          <ListItem
            key={pr.id}
            sx={{
              flexDirection: 'column',
              alignItems: 'flex-start',
              py: 1.5,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              mb: 1,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {/* PR Header */}
            <Box display="flex" width="100%" alignItems="flex-start" gap={1} mb={1}>
              <Box sx={{ mt: 0.5 }}>{stateIcons[pr.state]}</Box>
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Typography variant="body2" fontWeight={500}>
                    {pr.title}
                  </Typography>
                  {pr.isDraft && (
                    <Chip
                      icon={<DraftsIcon sx={{ fontSize: 14 }} />}
                      label="Draft"
                      size="small"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>

                {/* PR Number and State */}
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Chip
                    label={`#${pr.prNumber}`}
                    size="small"
                    color={stateColors[pr.state]}
                    variant="outlined"
                    sx={{
                      fontFamily: 'monospace',
                      height: 20,
                      fontSize: '0.75rem',
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {pr.state.toLowerCase()}
                  </Typography>
                  {pr.state === 'MERGED' && pr.mergedAt && (
                    <Typography variant="caption" color="text.secondary">
                      • merged {formatDate(pr.mergedAt)}
                    </Typography>
                  )}
                  {pr.state === 'CLOSED' && pr.closedAt && (
                    <Typography variant="caption" color="text.secondary">
                      • closed {formatDate(pr.closedAt)}
                    </Typography>
                  )}
                  {pr.state === 'OPEN' && (
                    <Typography variant="caption" color="text.secondary">
                      • opened {formatDate(pr.createdAt)}
                    </Typography>
                  )}
                </Box>

                {/* Branch Information */}
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Chip
                    label={pr.sourceBranch}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem', fontFamily: 'monospace' }}
                  />
                  <MergeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Chip
                    label={pr.targetBranch}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem', fontFamily: 'monospace' }}
                  />
                </Box>

                {/* Description (if exists) */}
                {pr.description && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {pr.description}
                    </Typography>
                  </Paper>
                )}

                {/* Author and Stats */}
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Avatar
                      src={pr.authorAvatarUrl || undefined}
                      sx={{ width: 20, height: 20, fontSize: '0.7rem' }}
                    >
                      {pr.authorName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="caption" color="text.secondary">
                      {pr.authorName}
                    </Typography>
                  </Box>

                  {/* Stats */}
                  <Stack direction="row" spacing={1.5}>
                    {pr.commitsCount !== null && (
                      <Typography variant="caption" color="text.secondary">
                        {pr.commitsCount} {pr.commitsCount === 1 ? 'commit' : 'commits'}
                      </Typography>
                    )}
                    {pr.changedFilesCount !== null && (
                      <Typography variant="caption" color="text.secondary">
                        {pr.changedFilesCount} {pr.changedFilesCount === 1 ? 'file' : 'files'} changed
                      </Typography>
                    )}
                    {(pr.additionsCount !== null || pr.deletionsCount !== null) && (
                      <Box display="flex" gap={0.5}>
                        {pr.additionsCount !== null && (
                          <Typography variant="caption" sx={{ color: 'success.main' }}>
                            +{pr.additionsCount}
                          </Typography>
                        )}
                        {pr.deletionsCount !== null && (
                          <Typography variant="caption" sx={{ color: 'error.main' }}>
                            -{pr.deletionsCount}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Stack>
                </Box>

                {/* Other Linked Tasks */}
                {pr.linkedTaskKeys && pr.linkedTaskKeys.length > 1 && (
                  <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                    <Typography variant="caption" color="text.secondary">
                      Also linked to:
                    </Typography>
                    {pr.linkedTaskKeys
                      .filter((key) => key !== taskId.toString())
                      .map((taskKey) => (
                        <Chip
                          key={taskKey}
                          label={taskKey}
                          size="small"
                          sx={{ height: 18, fontSize: '0.65rem', fontFamily: 'monospace' }}
                        />
                      ))}
                  </Box>
                )}
              </Box>

              {/* External Link */}
              {pr.prUrl && (
                <Tooltip title="View pull request" arrow>
                  <IconButton
                    size="small"
                    component="a"
                    href={pr.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default PullRequestList;
