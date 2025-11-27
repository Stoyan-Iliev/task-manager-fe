import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
  InputAdornment,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { formatShortcut } from '../../hooks/useKeyboardShortcut';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  keywords?: string[];
  shortcut?: { key: string; metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean };
  action: () => void;
  category: 'navigation' | 'actions' | 'help';
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenShortcuts?: () => void;
}

const CommandPalette = ({ open, onClose, onOpenShortcuts }: CommandPaletteProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const currentProject = useSelector((state: RootState) => state.project.currentProjectId);

  // Define commands
  const commands: Command[] = useMemo(
    () => [
      // Navigation
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        description: 'View project overview and analytics',
        icon: <DashboardIcon />,
        keywords: ['home', 'overview', 'analytics'],
        action: () => {
          navigate('/');
          onClose();
        },
        category: 'navigation',
      },
      {
        id: 'nav-projects',
        label: 'Go to Projects',
        description: 'View all projects',
        icon: <FolderIcon />,
        keywords: ['projects', 'list'],
        action: () => {
          navigate('/projects');
          onClose();
        },
        category: 'navigation',
      },
      {
        id: 'nav-tasks',
        label: 'Go to Tasks',
        description: 'View all tasks',
        icon: <AssignmentIcon />,
        keywords: ['tasks', 'issues', 'tickets'],
        action: () => {
          navigate('/tasks');
          onClose();
        },
        category: 'navigation',
      },
      {
        id: 'nav-backlog',
        label: 'Go to Backlog',
        description: 'Manage project backlog',
        icon: <ViewKanbanIcon />,
        keywords: ['backlog', 'sprint', 'planning'],
        action: () => {
          navigate('/backlog');
          onClose();
        },
        category: 'navigation',
      },
      {
        id: 'nav-team',
        label: 'Go to Team',
        description: 'View team members',
        icon: <GroupIcon />,
        keywords: ['team', 'members', 'people'],
        action: () => {
          navigate('/team');
          onClose();
        },
        category: 'navigation',
      },
      {
        id: 'nav-sprints',
        label: 'Go to Sprints',
        description: 'Manage sprints',
        icon: <CalendarTodayIcon />,
        keywords: ['sprints', 'iterations'],
        action: () => {
          navigate('/sprints');
          onClose();
        },
        category: 'navigation',
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        description: 'User settings and preferences',
        icon: <SettingsIcon />,
        keywords: ['settings', 'preferences', 'config'],
        action: () => {
          navigate('/settings');
          onClose();
        },
        category: 'navigation',
      },
      {
        id: 'nav-notifications',
        label: 'Go to Notifications',
        description: 'View notifications',
        icon: <NotificationsIcon />,
        keywords: ['notifications', 'alerts'],
        action: () => {
          navigate('/notifications');
          onClose();
        },
        category: 'navigation',
      },
      // Actions
      {
        id: 'action-new-project',
        label: 'Create New Project',
        description: 'Start a new project',
        icon: <AddIcon />,
        keywords: ['create', 'new', 'project'],
        action: () => {
          navigate('/projects');
          onClose();
          // TODO: Trigger project creation dialog
        },
        category: 'actions',
      },
      ...(currentProject
        ? [
            {
              id: 'action-project-settings',
              label: 'Open Project Settings',
              description: 'Configure current project',
              icon: <SettingsIcon />,
              keywords: ['settings', 'project', 'configure'],
              action: () => {
                navigate(`/projects/${currentProject}/settings`);
                onClose();
              },
              category: 'actions' as const,
            },
          ]
        : []),
      // Help
      {
        id: 'help-shortcuts',
        label: 'Keyboard Shortcuts',
        description: 'View all keyboard shortcuts',
        icon: <KeyboardIcon />,
        keywords: ['shortcuts', 'hotkeys', 'keyboard'],
        action: () => {
          onClose();
          if (onOpenShortcuts) {
            onOpenShortcuts();
          }
        },
        category: 'help',
      },
    ],
    [navigate, onClose, onOpenShortcuts, currentProject]
  );

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;

    const query = search.toLowerCase();
    return commands.filter((cmd) => {
      const labelMatch = cmd.label.toLowerCase().includes(query);
      const descMatch = cmd.description?.toLowerCase().includes(query);
      const keywordMatch = cmd.keywords?.some((kw) => kw.toLowerCase().includes(query));

      return labelMatch || descMatch || keywordMatch;
    });
  }, [commands, search]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {
      navigation: [],
      actions: [],
      help: [],
    };

    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Handle keyboard navigation directly (not through global hook to work in input field)
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;

    const selectedElement = listRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement;

    if (selectedElement) {
      selectedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'navigation':
        return 'Navigation';
      case 'actions':
        return 'Actions';
      case 'help':
        return 'Help';
      default:
        return category;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      onKeyDown={handleKeyDown}
      PaperProps={{
        sx: {
          position: 'fixed',
          top: '15%',
          m: 0,
          maxHeight: '70vh',
        },
      }}
    >
      <Box sx={{ p: 2, pb: 0 }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder="Type a command or search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          autoComplete="off"
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                border: 'none',
              },
            },
          }}
        />
      </Box>

      <DialogContent sx={{ p: 0, maxHeight: '50vh', overflowY: 'auto' }} ref={listRef}>
        {filteredCommands.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No commands found for &quot;{search}&quot;
            </Typography>
          </Box>
        ) : (
          <>
            {Object.entries(groupedCommands).map(
              ([category, cmds]) =>
                cmds.length > 0 && (
                  <Box key={category}>
                    <Typography
                      variant="caption"
                      sx={{
                        px: 2,
                        py: 1,
                        display: 'block',
                        fontWeight: 600,
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                      }}
                    >
                      {getCategoryLabel(category)}
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                      {cmds.map((cmd) => {
                        const globalIndex = filteredCommands.indexOf(cmd);
                        return (
                          <ListItem key={cmd.id} disablePadding data-index={globalIndex}>
                            <ListItemButton
                              selected={globalIndex === selectedIndex}
                              onClick={() => cmd.action()}
                              sx={{
                                py: 1.5,
                                px: 2,
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>{cmd.icon}</ListItemIcon>
                              <ListItemText
                                primary={cmd.label}
                                secondary={cmd.description}
                                primaryTypographyProps={{
                                  fontWeight: globalIndex === selectedIndex ? 600 : 400,
                                }}
                              />
                              {cmd.shortcut && (
                                <Chip
                                  label={formatShortcut(cmd.shortcut)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                    <Divider />
                  </Box>
                )
            )}
          </>
        )}
      </DialogContent>

      <Box
        sx={{
          px: 2,
          py: 1,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 2,
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Navigate with ↑↓ · Select with ↵ · Close with ESC
        </Typography>
      </Box>
    </Dialog>
  );
};

export default CommandPalette;
