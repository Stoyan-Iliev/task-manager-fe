import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  LinearProgress,
  Grid,
  Tabs,
  Tab,
  Stack,
  Alert,
  CircularProgress,
  Drawer,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useProjectReleases, useProjectReleasesByStatus } from '../../api/releases';
import { ReleaseDialog } from './ReleaseDialog';
import { ReleaseDetails } from './ReleaseDetails';
import type { ReleaseResponse, ReleaseStatus } from '../../types/release.types';

interface ReleasesViewProps {
  projectId: number;
}

const statusColors: Record<ReleaseStatus, 'default' | 'info' | 'success' | 'warning'> = {
  PLANNED: 'default',
  IN_PROGRESS: 'info',
  RELEASED: 'success',
  ARCHIVED: 'warning',
};

export const ReleasesView = ({ projectId }: ReleasesViewProps) => {
  const [selectedTab, setSelectedTab] = useState<'all' | ReleaseStatus>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<ReleaseResponse | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

  const { data: allReleases, isLoading: allLoading } = useProjectReleases(projectId);
  const { data: plannedReleases, isLoading: plannedLoading } = useProjectReleasesByStatus(
    projectId,
    'PLANNED'
  );
  const { data: inProgressReleases, isLoading: inProgressLoading } = useProjectReleasesByStatus(
    projectId,
    'IN_PROGRESS'
  );
  const { data: releasedReleases, isLoading: releasedLoading } = useProjectReleasesByStatus(
    projectId,
    'RELEASED'
  );

  const isLoading = allLoading || plannedLoading || inProgressLoading || releasedLoading;

  const getDisplayedReleases = (): ReleaseResponse[] => {
    switch (selectedTab) {
      case 'PLANNED':
        return plannedReleases || [];
      case 'IN_PROGRESS':
        return inProgressReleases || [];
      case 'RELEASED':
        return releasedReleases || [];
      case 'ARCHIVED':
        return allReleases?.filter((r) => r.status === 'ARCHIVED') || [];
      default:
        return allReleases || [];
    }
  };

  const displayedReleases = getDisplayedReleases();

  const handleCreateRelease = () => {
    setDialogMode('create');
    setSelectedRelease(null);
    setDialogOpen(true);
  };

  const handleEditRelease = () => {
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleViewRelease = (release: ReleaseResponse) => {
    setSelectedRelease(release);
    setDetailsDrawerOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDrawerOpen(false);
    setSelectedRelease(null);
  };

  const getCompletionPercentage = (release: ReleaseResponse): number => {
    return release.taskCount > 0 ? (release.completedTaskCount / release.taskCount) * 100 : 0;
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Releases</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={handleCreateRelease}>
          New Release
        </Button>
      </Box>

      {/* Status Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)}>
          <Tab label="All" value="all" />
          <Tab
            label={`Planned (${plannedReleases?.length || 0})`}
            value="PLANNED"
          />
          <Tab
            label={`In Progress (${inProgressReleases?.length || 0})`}
            value="IN_PROGRESS"
          />
          <Tab
            label={`Released (${releasedReleases?.length || 0})`}
            value="RELEASED"
          />
          <Tab
            label="Archived"
            value="ARCHIVED"
          />
        </Tabs>
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Box display="flex" justifyContent="center" p={8}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!isLoading && displayedReleases.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {selectedTab === 'all'
            ? 'No releases created yet. Create your first release to start planning.'
            : `No ${selectedTab.toLowerCase().replace('_', ' ')} releases.`}
        </Alert>
      )}

      {/* Releases Grid */}
      {!isLoading && displayedReleases.length > 0 && (
        <Grid container spacing={3}>
          {displayedReleases.map((release) => {
            const completionPercentage = getCompletionPercentage(release);
            const isOverdue =
              release.releaseDate &&
              new Date(release.releaseDate) < new Date() &&
              release.status !== 'RELEASED' &&
              release.status !== 'ARCHIVED';

            return (
              <Grid item xs={12} sm={6} md={4} key={release.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: isOverdue ? 2 : 1,
                    borderColor: isOverdue ? 'error.main' : 'divider',
                  }}
                >
                  <CardActionArea onClick={() => handleViewRelease(release)} sx={{ flexGrow: 1 }}>
                    <CardContent>
                      {/* Header */}
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="h6" component="h3" sx={{ flex: 1, pr: 1 }}>
                          {release.name}
                        </Typography>
                        <Chip
                          label={release.status.replace('_', ' ')}
                          size="small"
                          color={statusColors[release.status]}
                        />
                      </Box>

                      {/* Version */}
                      {release.version && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Version: {release.version}
                        </Typography>
                      )}

                      {/* Description */}
                      {release.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {release.description}
                        </Typography>
                      )}

                      {/* Dates */}
                      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
                        {release.releaseDate && (
                          <Chip
                            icon={<CalendarTodayIcon sx={{ fontSize: 14 }} />}
                            label={new Date(release.releaseDate).toLocaleDateString()}
                            size="small"
                            variant="outlined"
                            color={isOverdue ? 'error' : 'default'}
                          />
                        )}
                        {release.releasedAt && (
                          <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                            label={`Released ${new Date(release.releasedAt).toLocaleDateString()}`}
                            size="small"
                            color="success"
                          />
                        )}
                      </Stack>

                      {/* Progress */}
                      <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            Progress
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {release.completedTaskCount} / {release.taskCount} tasks
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={completionPercentage}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              bgcolor: completionPercentage === 100 ? 'success.main' : 'primary.main',
                            },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {Math.round(completionPercentage)}% complete
                        </Typography>
                      </Box>

                      {/* Created By */}
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        Created by {release.createdByUsername}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Release Dialog */}
      <ReleaseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        projectId={projectId}
        release={selectedRelease}
        mode={dialogMode}
      />

      {/* Release Details Drawer */}
      <Drawer
        anchor="right"
        open={detailsDrawerOpen}
        onClose={handleCloseDetails}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 600 }, p: 3 },
        }}
      >
        {selectedRelease && (
          <ReleaseDetails
            releaseId={selectedRelease.id}
            onEdit={handleEditRelease}
            onClose={handleCloseDetails}
          />
        )}
      </Drawer>
    </Box>
  );
};

export default ReleasesView;
