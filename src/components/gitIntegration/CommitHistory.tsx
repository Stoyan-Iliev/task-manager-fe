import { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Link,
  Divider,
  Paper,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CodeIcon from '@mui/icons-material/Code';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddLinkIcon from '@mui/icons-material/AddLink';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { useTaskCommits, useLinkCommitToTask, useUnlinkCommitFromTask } from '../../api/git';
import type { CommitResponse } from '../../types/git.types';

interface CommitHistoryProps {
  taskId: number;
}

export const CommitHistory = ({ taskId }: CommitHistoryProps) => {
  const { data: commits, isLoading, error } = useTaskCommits(taskId);
  const linkCommit = useLinkCommitToTask();
  const unlinkCommit = useUnlinkCommitFromTask();

  const [expandedCommit, setExpandedCommit] = useState<number | null>(null);

  const handleToggleExpand = (commitId: number) => {
    setExpandedCommit(expandedCommit === commitId ? null : commitId);
  };

  const handleUnlink = async (commitId: number) => {
    try {
      await unlinkCommit.mutateAsync({ commitId, taskId });
    } catch (error) {
      console.error('Failed to unlink commit:', error);
    }
  };

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
        Failed to load commits. Please try again later.
      </Alert>
    );
  }

  if (!commits || commits.length === 0) {
    return (
      <Box p={2}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No commits linked to this task yet
        </Typography>
        <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={1}>
          Commits will automatically appear here when you reference this task in commit messages
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <List dense>
        {commits.map((commit: CommitResponse, index: number) => (
          <Box key={commit.id}>
            {index > 0 && <Divider />}
            <ListItem
              sx={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                py: 1.5,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {/* Commit Header */}
              <Box display="flex" width="100%" alignItems="center" gap={1} mb={0.5}>
                <CodeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Tooltip title={commit.commitSha} arrow>
                  <Chip
                    label={commit.shortSha}
                    size="small"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      height: 20,
                    }}
                  />
                </Tooltip>
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{
                    flex: 1,
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                  onClick={() => handleToggleExpand(commit.id)}
                >
                  {commit.message}
                </Typography>
                <Box display="flex" gap={0.5}>
                  {commit.commitUrl && (
                    <Tooltip title="View on Git provider" arrow>
                      <IconButton
                        size="small"
                        component="a"
                        href={commit.commitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Unlink from task" arrow>
                    <IconButton
                      size="small"
                      onClick={() => handleUnlink(commit.id)}
                      disabled={unlinkCommit.isPending}
                    >
                      <LinkOffIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Commit Metadata */}
              <Box display="flex" flexWrap="wrap" gap={1.5} width="100%" ml={3}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {commit.authorName}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(commit.authorDate)}
                  </Typography>
                </Box>
                {commit.branchName && (
                  <Chip
                    label={commit.branchName}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>

              {/* Commit Stats */}
              {(commit.linesAdded !== null || commit.linesDeleted !== null || commit.filesChanged !== null) && (
                <Box display="flex" gap={1} width="100%" ml={3} mt={0.5}>
                  {commit.filesChanged !== null && (
                    <Typography variant="caption" color="text.secondary">
                      {commit.filesChanged} {commit.filesChanged === 1 ? 'file' : 'files'} changed
                    </Typography>
                  )}
                  {commit.linesAdded !== null && (
                    <Typography variant="caption" sx={{ color: 'success.main' }}>
                      +{commit.linesAdded}
                    </Typography>
                  )}
                  {commit.linesDeleted !== null && (
                    <Typography variant="caption" sx={{ color: 'error.main' }}>
                      -{commit.linesDeleted}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Expanded Details */}
              {expandedCommit === commit.id && commit.messageBody && (
                <Paper
                  elevation={0}
                  sx={{
                    mt: 1,
                    p: 1.5,
                    width: '100%',
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                    }}
                  >
                    {commit.messageBody}
                  </Typography>
                </Paper>
              )}

              {/* Smart Commands */}
              {commit.smartCommands && commit.smartCommands.length > 0 && (
                <Box display="flex" flexWrap="wrap" gap={0.5} width="100%" ml={3} mt={0.5}>
                  {commit.smartCommands.map((command, idx) => (
                    <Chip
                      key={idx}
                      label={command}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 18, fontSize: '0.65rem' }}
                    />
                  ))}
                </Box>
              )}

              {/* Other Linked Tasks */}
              {commit.linkedTaskKeys && commit.linkedTaskKeys.length > 1 && (
                <Box display="flex" flexWrap="wrap" gap={0.5} width="100%" ml={3} mt={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Also linked to:
                  </Typography>
                  {commit.linkedTaskKeys
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
            </ListItem>
          </Box>
        ))}
      </List>
    </Box>
  );
};

export default CommitHistory;
