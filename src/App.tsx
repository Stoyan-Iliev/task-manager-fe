import { Route, Routes, Navigate } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import { useState, lazy, Suspense } from 'react';
import { useAuth } from './hooks/useAuth';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';

// Critical components - loaded immediately
import Header from './components/misc/Header';
import SideMenu from './components/sidebar/SideMenu';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth components - loaded immediately (small, needed for initial load)
import SignIn from './components/userManagement/SignIn';
import SignUp from './components/userManagement/SignUp';

// Lazy-loaded route components
const Dashboard = lazy(() => import('./components/dashboardAndAnalytics/Dashboard'));
const TasksView = lazy(() => import('./components/taskManagement/TasksView'));
const TaskDetailPage = lazy(() => import('./components/tasks/TaskDetailPage'));
const BacklogView = lazy(() => import('./components/taskManagement/BacklogView'));
const ProjectsView = lazy(() => import('./components/projectManagement/ProjectsView'));
const ProjectDetailsPage = lazy(() => import('./components/projectManagement/ProjectDetailsPage'));
const ProjectSettings = lazy(() => import('./components/projectManagement/ProjectSettings'));
const SprintsView = lazy(() => import('./components/projectManagement/SprintsView'));
const SprintDetails = lazy(() => import('./components/projectManagement/SprintDetails'));
const TeamView = lazy(() => import('./components/teamCoordination/TeamView'));
const ReleasesView = lazy(() => import('./components/projectManagement/ReleasesView'));
const SettingsView = lazy(() => import('./components/settingsAndAdmin/SettingsView'));
const UserSettingsPage = lazy(() => import('./components/settingsAndAdmin/UserSettingsPage'));
const OrganizationSettings = lazy(() => import('./components/settingsAndAdmin/OrganizationSettings'));
const SearchView = lazy(() => import('./components/misc/SearchView'));
const NotificationsView = lazy(() => import('./components/notifications/NotificationsView'));
const Reports = lazy(() => import('./components/dashboardAndAnalytics/Reports'));
const CommandPalette = lazy(() => import('./components/misc/CommandPalette'));
const KeyboardShortcutsDialog = lazy(() => import('./components/misc/KeyboardShortcutsDialog'));

// Loading fallback component
const PageLoader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
    }}
  >
    <CircularProgress />
  </Box>
);

function App() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  // Keyboard shortcuts - only when authenticated
  useKeyboardShortcut(
    { key: 'k', metaKey: true },
    () => setCommandPaletteOpen(true),
    isAuthenticated
  );

  useKeyboardShortcut(
    { key: '/', metaKey: true },
    () => setShortcutsDialogOpen(true),
    isAuthenticated
  );

  return (
    <Box sx={{ bgcolor: 'background.default', transition: 'margin-left 0.3s' }}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <SignIn />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <SignUp />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <>
                <Header onToggleSidebar={handleToggleSidebar} />
                <SideMenu open={sidebarOpen} onClose={handleCloseSidebar} />
                <Box
                  component="main"
                  sx={{
                    flexGrow: 1,
                    overflow: 'auto',
                    marginTop: { xs: 7, sm: 8 },
                    ml: { sm: sidebarOpen ? '240px' : 0 },
                    transition: 'margin-left 0.3s ease',
                  }}
                >
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/tasks" element={<TasksView />} />
                      <Route path="/tasks/:taskKey" element={<TaskDetailPage />} />
                      <Route path="/backlog" element={<BacklogView />} />
                      <Route path="/projects" element={<ProjectsView />} />
                      <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
                      <Route path="/projects/:projectId/settings" element={<ProjectSettings />} />
                      <Route path="/sprints/:sprintId" element={<SprintDetails />} />
                      <Route path="/sprints" element={<SprintsView />} />
                      <Route path="/team" element={<TeamView />} />
                      <Route path="/releases" element={<ReleasesView />} />
                      <Route path="/settings" element={<SettingsView />} />
                      <Route path="/profile" element={<UserSettingsPage />} />
                      <Route path="/organizations/:id/settings" element={<OrganizationSettings />} />
                      <Route path="/search" element={<SearchView />} />
                      <Route path="/notifications" element={<NotificationsView />} />
                      <Route path="/reports" element={<Reports />} />
                    </Routes>
                  </Suspense>
                </Box>
              </>
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* Global Components */}
      {isAuthenticated && (
        <Suspense fallback={null}>
          <CommandPalette
            open={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
            onOpenShortcuts={() => setShortcutsDialogOpen(true)}
          />
          <KeyboardShortcutsDialog
            open={shortcutsDialogOpen}
            onClose={() => setShortcutsDialogOpen(false)}
          />
        </Suspense>
      )}
    </Box>
  );
}

export default App;