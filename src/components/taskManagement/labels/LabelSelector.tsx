import { useState } from 'react';
import {
  Box,
  Chip,
  Stack,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  TextField,
  InputAdornment,
  Divider,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import { CreateLabelDialog } from './CreateLabelDialog';
import type { LabelResponse } from '../../../types/task.types';

interface LabelSelectorProps {
  organizationId: number;
  availableLabels: LabelResponse[];
  selectedLabels: LabelResponse[];
  onAddLabel: (labelId: number) => void;
  onRemoveLabel: (labelId: number) => void;
  isLoading?: boolean;
}

export const LabelSelector = ({
  organizationId,
  availableLabels,
  selectedLabels,
  onAddLabel,
  onRemoveLabel,
  isLoading = false,
}: LabelSelectorProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const isLabelSelected = (labelId: number) =>
    selectedLabels.some((label) => label.id === labelId);

  const handleToggleLabel = (labelId: number) => {
    if (isLabelSelected(labelId)) {
      onRemoveLabel(labelId);
    } else {
      onAddLabel(labelId);
    }
  };

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setSearchQuery('');
  };

  const handleLabelCreated = (labelId: number) => {
    // Automatically add the newly created label
    onAddLabel(labelId);
    handleClosePopover();
  };

  const filteredLabels = availableLabels.filter((label) =>
    label.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const open = Boolean(anchorEl);

  return (
    <Box>
      {/* Selected Labels Display */}
      <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
        {selectedLabels.map((label) => (
          <Chip
            key={label.id}
            label={label.name}
            size="small"
            onDelete={() => onRemoveLabel(label.id)}
            sx={{
              bgcolor: label.color,
              color: getContrastColor(label.color),
              fontWeight: 500,
              '& .MuiChip-deleteIcon': {
                color: getContrastColor(label.color),
                opacity: 0.7,
                '&:hover': {
                  opacity: 1,
                },
              },
            }}
          />
        ))}

        <Chip
          label="+ Add Label"
          size="small"
          variant="outlined"
          onClick={handleOpenPopover}
          sx={{ cursor: 'pointer' }}
        />
      </Stack>

      {/* Label Selection Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: { width: 320, maxHeight: 480 },
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search labels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            <List sx={{ py: 0, maxHeight: 300, overflow: 'auto' }}>
              {filteredLabels.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No labels found"
                    secondary={searchQuery ? 'Try a different search' : 'Create your first label'}
                    primaryTypographyProps={{ align: 'center', color: 'text.secondary' }}
                    secondaryTypographyProps={{ align: 'center' }}
                  />
                </ListItem>
              ) : (
                filteredLabels.map((label) => {
                  const selected = isLabelSelected(label.id);
                  return (
                    <ListItemButton
                      key={label.id}
                      onClick={() => handleToggleLabel(label.id)}
                      selected={selected}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          bgcolor: label.color,
                          borderRadius: '50%',
                          mr: 1.5,
                          flexShrink: 0,
                        }}
                      />
                      <ListItemText
                        primary={label.name}
                        secondary={label.description}
                        primaryTypographyProps={{ fontWeight: 500 }}
                        secondaryTypographyProps={{
                          noWrap: true,
                          sx: { maxWidth: 220 },
                        }}
                      />
                      {selected && (
                        <CheckIcon fontSize="small" color="primary" sx={{ ml: 1 }} />
                      )}
                    </ListItemButton>
                  );
                })
              )}
            </List>

            <Divider />

            <Box sx={{ p: 1 }}>
              <Button
                fullWidth
                startIcon={<AddIcon />}
                onClick={() => {
                  setCreateDialogOpen(true);
                  handleClosePopover();
                }}
                sx={{ justifyContent: 'flex-start' }}
              >
                Create New Label
              </Button>
            </Box>
          </>
        )}
      </Popover>

      {/* Create Label Dialog */}
      <CreateLabelDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        organizationId={organizationId}
        onLabelCreated={handleLabelCreated}
      />
    </Box>
  );
};

// Helper function to determine if text should be white or black based on background
function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
