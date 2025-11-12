import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';

interface Shortcut {
  keys: string;
  description: string;
}

interface ShortcutCategory {
  category: string;
  shortcuts: Shortcut[];
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

const KeyboardShortcutsDialog = ({ open, onClose }: KeyboardShortcutsDialogProps) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcutCategories: ShortcutCategory[] = [
    {
      category: 'General',
      shortcuts: [
        { keys: `${modKey}+K`, description: 'Open command palette' },
        { keys: `${modKey}+/`, description: 'Show keyboard shortcuts' },
        { keys: 'ESC', description: 'Close dialog / Cancel' },
        { keys: `${modKey}+S`, description: 'Save (when editing)' },
      ],
    },
    {
      category: 'Command Palette',
      shortcuts: [
        { keys: '↑ ↓', description: 'Navigate commands' },
        { keys: '↵ Enter', description: 'Execute selected command' },
        { keys: 'ESC', description: 'Close palette' },
        { keys: 'Type', description: 'Search/filter commands' },
      ],
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <KeyboardIcon />
          <Typography variant="h6">Keyboard Shortcuts</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Use these keyboard shortcuts to navigate and perform actions quickly throughout the
          application.
        </Typography>

        {shortcutCategories.map((category, idx) => (
          <Box key={category.category} sx={{ mb: idx < shortcutCategories.length - 1 ? 3 : 0 }}>
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              color="primary"
              sx={{ mb: 2 }}
            >
              {category.category}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {category.shortcuts.map((shortcut) => (
                <Grid container key={shortcut.keys} spacing={2} alignItems="center">
                  <Grid size={{ xs: 4, md: 3 }}>
                    <Chip
                      label={shortcut.keys}
                      size="small"
                      sx={{
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        minWidth: 80,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 8, md: 9 }}>
                    <Typography variant="body2">{shortcut.description}</Typography>
                  </Grid>
                </Grid>
              ))}
            </Box>

            {idx < shortcutCategories.length - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}

        <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Note:</strong> Some shortcuts may not work while editing text fields. Press ESC
            to exit the field first.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default KeyboardShortcutsDialog;
