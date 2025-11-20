import {
  Box,
  Typography,
  List,
  ListItem,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import StarIcon from '@mui/icons-material/Star';
import LockIcon from '@mui/icons-material/Lock';
import CommitIcon from '@mui/icons-material/Commit';
import { useTaskBranches } from '../../api/git';
import type { BranchResponse } from '../../types/git.types';

interface BranchListProps {
  taskId: number;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return null;

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

export const BranchList = ({ taskId }: BranchListProps) => {
  const { data: branches, isLoading, error } = useTaskBranches(taskId);

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
        Failed to load branches. Please try again later.
      </Alert>
    );
  }

  if (!branches || branches.length === 0) {
    return (
      <Box p={2}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No branches linked to this task yet
        </Typography>
        <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={1}>
          Branches will automatically appear here when you reference this task in branch names
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <List dense>
        {branches.map((branch: BranchResponse) => (
          <ListItem
            key={branch.id}
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
            {/* Branch Header */}
            <Box display="flex" width="100%" alignItems="flex-start" gap={1} mb={1}>
              <AccountTreeIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.3 }} />
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
                  <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace' }}>
                    {branch.name}
                  </Typography>

                  {/* Branch Badges */}
                  {branch.isDefault && (
                    <Tooltip title="Default branch" arrow>
                      <Chip
                        icon={<StarIcon sx={{ fontSize: 14 }} />}
                        label="Default"
                        size="small"
                        color="primary"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Tooltip>
                  )}

                  {branch.isProtected && (
                    <Tooltip title="Protected branch" arrow>
                      <Chip
                        icon={<LockIcon sx={{ fontSize: 14 }} />}
                        label="Protected"
                        size="small"
                        color="warning"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Tooltip>
                  )}
                </Box>

                {/* Last Commit Info */}
                {branch.lastCommitSha && (
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <CommitIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Tooltip title={branch.lastCommitSha} arrow>
                      <Chip
                        label={branch.lastCommitSha.substring(0, 7)}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontFamily: 'monospace',
                          height: 20,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Tooltip>
                    {branch.lastCommitDate && (
                      <Typography variant="caption" color="text.secondary">
                        • {formatDate(branch.lastCommitDate)}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Last Commit Message */}
                {branch.lastCommitMessage && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                      fontStyle: 'italic',
                    }}
                  >
                    {branch.lastCommitMessage}
                  </Typography>
                )}

                {/* Other Linked Tasks */}
                {branch.linkedTaskKeys && branch.linkedTaskKeys.length > 1 && (
                  <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                    <Typography variant="caption" color="text.secondary">
                      Also linked to:
                    </Typography>
                    {branch.linkedTaskKeys
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

                {/* Created Date */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Created {formatDate(branch.createdAt)}
                </Typography>
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default BranchList;
