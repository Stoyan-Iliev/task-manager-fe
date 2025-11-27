import {
  Box,
  Typography,
  List,
  ListItem,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTaskBranches } from '../../api/git';
import type { BranchResponse, BranchStatus } from '../../types/git.types';

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

const getStatusColor = (status: BranchStatus): 'success' | 'secondary' | 'default' => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'MERGED':
      return 'secondary';
    case 'DELETED':
    default:
      return 'default';
  }
};

const getStatusLabel = (status: BranchStatus): string => {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'MERGED':
      return 'Merged';
    case 'DELETED':
      return 'Deleted';
    default:
      return status;
  }
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
              py: 1.5,
              px: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              mb: 1,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {/* Branch Icon */}
            <AccountTreeIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1.5 }} />

            {/* Branch Info */}
            <Box flex={1} minWidth={0}>
              {/* Branch Name and Status */}
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                  }}
                >
                  {branch.branchName}
                </Typography>
                <Chip
                  label={getStatusLabel(branch.status)}
                  size="small"
                  color={getStatusColor(branch.status)}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>

              {/* Created By and Date */}
              <Typography variant="caption" color="text.secondary">
                {branch.createdByUsername
                  ? `Created by ${branch.createdByUsername} ${formatDate(branch.createdAt)}`
                  : `Created ${formatDate(branch.createdAt)}`}
              </Typography>
            </Box>

            {/* External Link Button */}
            {branch.branchUrl && (
              <Tooltip title="View branch on Git provider" arrow>
                <IconButton
                  size="small"
                  component="a"
                  href={branch.branchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ ml: 1 }}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default BranchList;
