import React, { useState } from "react";
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import { selectCurrentProjectId } from '../../redux/projectSlice';
import { useProjectMembers } from '../../api/projectMembers';
import { getRoleDisplayName } from '../../types/project.types';
import type { ProjectMemberResponse } from '../../types/project.types';
import { useCanManageMembers } from '../../hooks/useProjectPermissions';
import AddProjectMemberDialog from '../projectManagement/AddProjectMemberDialog';
import ChangeProjectMemberRoleDialog from '../projectManagement/ChangeProjectMemberRoleDialog';
import RemoveProjectMemberDialog from '../projectManagement/RemoveProjectMemberDialog';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  Grid,
  Button,
  useTheme,
  Skeleton,
  Alert,
  Chip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import EditIcon from "@mui/icons-material/Edit";

const TeamView: React.FC = () => {
  const theme = useTheme();
  const user = useSelector((state: RootState) => state.user.details);
  const currentProjectId = useSelector(selectCurrentProjectId);
  const { data: members, isLoading, isError } = useProjectMembers(currentProjectId);
  const canManage = useCanManageMembers(currentProjectId);

  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ProjectMemberResponse | null>(null);

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          {[...Array(3)].map((_, i) => (
            <Grid key={i} size={{ xs: 12, md: 4 }}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Error or no project state
  if (isError || !currentProjectId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {!currentProjectId
            ? 'No project selected. Please select a project to view team members.'
            : 'Failed to load team members. Please try again.'}
        </Alert>
      </Box>
    );
  }

  // Empty state
  if (!members || members.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          bgcolor: theme.palette.background.default,
          minHeight: {
            xs: 'calc(100vh - 56px)',
            sm: 'calc(100vh - 64px)',
          },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <GroupRoundedIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom color="text.primary">
          No Project Members Yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Add team members from your organization to collaborate on this project
        </Typography>
        {canManage && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddMemberDialogOpen(true)}
          >
            Add Member
          </Button>
        )}
        <AddProjectMemberDialog
          open={addMemberDialogOpen}
          onClose={() => setAddMemberDialogOpen(false)}
          projectId={currentProjectId}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: theme.palette.background.default,
        minHeight: {
          xs: 'calc(100vh - 56px)',
          sm: 'calc(100vh - 64px)',
        },
      }}
    >
      {/* Header with Add Member Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
          color="text.primary"
        >
          <GroupRoundedIcon />
          Project Team
        </Typography>
        {canManage ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddMemberDialogOpen(true)}
            fullWidth={false}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            Add Member
          </Button>
        ) : (
          <Chip
            label="Only leads/admins can add members"
            size="small"
            variant="outlined"
            color="default"
          />
        )}
      </Box>

      {/* Team Members Grid */}
      <Grid container spacing={2}>
        {members.map((member) => {
          const isCurrentUser = member.userId === user?.id;
          const canManageThisMember = canManage && !isCurrentUser;

          return (
            <Grid key={member.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card
                sx={{
                  bgcolor: theme.palette.background.paper,
                  boxShadow: 3,
                  borderRadius: 2,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                  height: '100%',
                }}
              >
                <CardContent>
                  {/* Member Info */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }}>
                      {(member.fullName || member.username).charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" fontWeight={500} color="text.primary" noWrap>
                          {member.fullName || member.username}
                        </Typography>
                        {isCurrentUser && (
                          <Chip label="You" size="small" color="primary" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {member.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Added: {new Date(member.addedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Role Badge */}
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={getRoleDisplayName(member.role)}
                      size="small"
                      color={
                        member.role === 'PROJECT_OWNER' ? 'primary' :
                        member.role === 'PROJECT_ADMIN' ? 'success' :
                        member.role === 'PROJECT_MEMBER' ? 'info' :
                        'default'
                      }
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>

                  {/* Actions - only if can manage this member */}
                  {canManageThisMember && (
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setSelectedMember(member);
                          setChangeRoleDialogOpen(true);
                        }}
                      >
                        Change Role
                      </Button>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => {
                          setSelectedMember(member);
                          setRemoveDialogOpen(true);
                        }}
                        sx={{ ml: 'auto' }}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Dialogs */}
      <AddProjectMemberDialog
        open={addMemberDialogOpen}
        onClose={() => setAddMemberDialogOpen(false)}
        projectId={currentProjectId}
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
            projectId={currentProjectId}
          />

          <RemoveProjectMemberDialog
            open={removeDialogOpen}
            onClose={() => {
              setRemoveDialogOpen(false);
              setSelectedMember(null);
            }}
            member={selectedMember}
            projectId={currentProjectId}
          />
        </>
      )}
    </Box>
  );
};

export default TeamView;
