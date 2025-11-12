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
  Shield as ShieldIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useOrganizationMembers } from '../../api/organizationMembers';
import { useOrganizationRole } from '../../hooks/useOrganizationRole';
import InviteMemberDialog from './InviteMemberDialog';
import ChangeMemberRoleDialog from './ChangeMemberRoleDialog';
import RemoveMemberDialog from './RemoveMemberDialog';
import { getRoleDisplayName, getRoleColor } from '../../types/organization.types';
import type { MemberResponse, OrganizationRole } from '../../types/organization.types';

interface MemberManagementProps {
  organizationId: number;
}

const MemberManagement = ({ organizationId }: MemberManagementProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const user = useSelector((state: RootState) => state.user.details);

  const { data: members, isLoading, isError } = useOrganizationMembers(organizationId);
  const { role: currentUserRole, canInviteMembers, canManageMember } = useOrganizationRole(organizationId);

  const [searchQuery, setSearchQuery] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberResponse | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const currentUserId = user?.id;

  // Filter members based on search query
  const filteredMembers = members?.filter(
    (member) =>
      member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: MemberResponse) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleChangeRole = () => {
    setChangeRoleDialogOpen(true);
    handleMenuClose();
  };

  const handleRemove = () => {
    setRemoveDialogOpen(true);
    handleMenuClose();
  };

  const getRoleIcon = (role: OrganizationRole) => {
    switch (role) {
      case 'ORG_OWNER':
        return <StarIcon fontSize="small" />;
      case 'ORG_ADMIN':
        return <ShieldIcon fontSize="small" />;
      case 'ORG_MEMBER':
        return <PersonIcon fontSize="small" />;
    }
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
        Failed to load organization members. Please try again.
      </Alert>
    );
  }

  // Empty state
  if (members.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No Members Yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Invite team members to collaborate on projects
        </Typography>
        {canInviteMembers && (
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setInviteDialogOpen(true)}
          >
            Invite Member
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
        {canInviteMembers && (
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setInviteDialogOpen(true)}
            fullWidth={isMobile}
          >
            Invite Member
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
                <TableCell>Joined</TableCell>
                <TableCell>Invited By</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMembers?.map((member) => {
                const canManage = canManageMember(member.role) && member.userId !== currentUserId;

                return (
                  <TableRow key={member.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {member.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {member.username}
                            {member.userId === currentUserId && (
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
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{member.invitedByUsername}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      {canManage && (
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
            const canManage = canManageMember(member.role) && member.userId !== currentUserId;

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
                        {member.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {member.username}
                          {member.userId === currentUserId && (
                            <Chip label="You" size="small" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.email}
                        </Typography>
                      </Box>
                    </Box>
                    {canManage && (
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
                      label={`Joined ${new Date(member.joinedAt).toLocaleDateString()}`}
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
        <MenuItem onClick={handleChangeRole}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Change Role</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleRemove} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Remove Member</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <InviteMemberDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        organizationId={organizationId}
      />

      {selectedMember && (
        <>
          <ChangeMemberRoleDialog
            open={changeRoleDialogOpen}
            onClose={() => {
              setChangeRoleDialogOpen(false);
              setSelectedMember(null);
            }}
            member={selectedMember}
            organizationId={organizationId}
            currentUserRole={currentUserRole!}
          />

          <RemoveMemberDialog
            open={removeDialogOpen}
            onClose={() => {
              setRemoveDialogOpen(false);
              setSelectedMember(null);
            }}
            member={selectedMember}
            organizationId={organizationId}
          />
        </>
      )}
    </Box>
  );
};

export default MemberManagement;
