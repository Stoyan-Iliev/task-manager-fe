import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  TextField,
  InputAdornment,
  Skeleton,
  Alert,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Stack,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Star as StarIcon,
  Create as CreateIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useProjectMembers } from '../../api/projectMembers';
import { useCanManageMembers } from '../../hooks/useProjectPermissions';
import AddProjectMemberDialog from './AddProjectMemberDialog';
import ChangeProjectMemberRoleDialog from './ChangeProjectMemberRoleDialog';
import RemoveProjectMemberDialog from './RemoveProjectMemberDialog';
import { getRoleDisplayName } from '../../types/project.types';
import type { ProjectMemberResponse, ProjectRole } from '../../types/project.types';

interface ProjectMembersProps {
  projectId: number;
}

const getRoleIcon = (role: ProjectRole) => {
  switch (role) {
    case 'PROJECT_OWNER':
      return <StarIcon fontSize="small" />;
    case 'PROJECT_ADMIN':
      return <CreateIcon fontSize="small" />;
    case 'PROJECT_MEMBER':
      return <CreateIcon fontSize="small" />;
    case 'PROJECT_VIEWER':
      return <VisibilityIcon fontSize="small" />;
  }
};

const getRoleColor = (role: ProjectRole): 'primary' | 'success' | 'info' | 'default' => {
  switch (role) {
    case 'PROJECT_OWNER':
      return 'primary';
    case 'PROJECT_ADMIN':
      return 'success';
    case 'PROJECT_MEMBER':
      return 'info';
    case 'PROJECT_VIEWER':
      return 'default';
  }
};

const ProjectMembers = ({ projectId }: ProjectMembersProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const user = useSelector((state: RootState) => state.user.details);

  const { data: members, isLoading, isError } = useProjectMembers(projectId);
  const canManage = useCanManageMembers(projectId);

  const [searchQuery, setSearchQuery] = useState('');
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ProjectMemberResponse | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const currentUserId = user?.id;

  // Filter members based on search query
  const filteredMembers = members?.filter(
    (member) =>
      member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.fullName && member.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: ProjectMemberResponse) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2 }} />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={72} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  // Error state
  if (isError || !members) {
    return (
      <Alert severity="error">
        Failed to load project members. Please try again.
      </Alert>
    );
  }

  // Empty state
  if (members.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <PersonAddIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No Project Members Yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Add team members from your organization to collaborate on this project
        </Typography>
        {canManage && (
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setAddMemberDialogOpen(true)}
          >
            Add Member
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Actions */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <TextField
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ flexGrow: { xs: 1, sm: 0 }, minWidth: { sm: 300 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        {canManage && (
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setAddMemberDialogOpen(true)}
            fullWidth={isMobile}
          >
            Add Member
          </Button>
        )}
      </Box>

      {/* Desktop Table View */}
      {!isMobile ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Added</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMembers?.map((member) => {
                const isCurrentUser = member.userId === currentUserId;
                const canManageMember = canManage && !isCurrentUser;

                return (
                  <TableRow key={member.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {(member.fullName || member.username).charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {member.fullName || member.username}
                            {isCurrentUser && (
                              <Chip label="You" size="small" sx={{ ml: 1 }} />
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(member.role)}
                        label={getRoleDisplayName(member.role)}
                        size="small"
                        color={getRoleColor(member.role)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(member.addedAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {canManageMember && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, member)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* Mobile Card View */
        <Stack spacing={2}>
          {filteredMembers?.map((member) => {
            const isCurrentUser = member.userId === currentUserId;
            const canManageMember = canManage && !isCurrentUser;

            return (
              <Card
                key={member.id}
                sx={{
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {(member.fullName || member.username).charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {member.fullName || member.username}
                          {isCurrentUser && (
                            <Chip label="You" size="small" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.email}
                        </Typography>
                      </Box>
                    </Box>
                    {canManageMember && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, member)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={getRoleIcon(member.role)}
                      label={getRoleDisplayName(member.role)}
                      size="small"
                      color={getRoleColor(member.role)}
                    />
                    <Chip
                      label={`Added ${new Date(member.addedAt).toLocaleDateString()}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Empty search results */}
      {filteredMembers?.length === 0 && searchQuery && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No members found matching "{searchQuery}"
          </Typography>
        </Box>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            setChangeRoleDialogOpen(true);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Change Role</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setRemoveMemberDialogOpen(true);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Remove Member</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <AddProjectMemberDialog
        open={addMemberDialogOpen}
        onClose={() => setAddMemberDialogOpen(false)}
        projectId={projectId}
      />

      {selectedMember && (
        <>
          <ChangeProjectMemberRoleDialog
            open={changeRoleDialogOpen}
            onClose={() => {
              setChangeRoleDialogOpen(false);
              setSelectedMember(null);
            }}
            member={selectedMember}
            projectId={projectId}
          />

          <RemoveProjectMemberDialog
            open={removeMemberDialogOpen}
            onClose={() => {
              setRemoveMemberDialogOpen(false);
              setSelectedMember(null);
            }}
            member={selectedMember}
            projectId={projectId}
          />
        </>
      )}
    </Box>
  );
};

export default ProjectMembers;
