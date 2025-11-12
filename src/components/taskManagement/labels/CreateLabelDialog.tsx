import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Chip,
  Typography,
} from '@mui/material';
import { LabelColorPicker, LABEL_COLORS } from './LabelColorPicker';
import { useCreateLabel } from '../../../api/labels';

interface CreateLabelDialogProps {
  open: boolean;
  onClose: () => void;
  organizationId: number;
  onLabelCreated?: (labelId: number) => void;
}

export const CreateLabelDialog = ({
  open,
  onClose,
  organizationId,
  onLabelCreated,
}: CreateLabelDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(LABEL_COLORS[0].value);

  const createLabel = useCreateLabel(organizationId);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    try {
      const newLabel = await createLabel.mutateAsync({
        name: name.trim(),
        color,
        description: description.trim() || undefined,
      });

      // Notify parent if callback provided
      if (onLabelCreated) {
        onLabelCreated(newLabel.id);
      }

      // Reset form and close
      handleClose();
    } catch (error) {
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setColor(LABEL_COLORS[0].value);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Label</DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Label Name */}
          <TextField
            label="Label Name"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Bug, Feature, Documentation"
            sx={{ mb: 2 }}
            autoFocus
          />

          {/* Label Description */}
          <TextField
            label="Description (Optional)"
            fullWidth
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe when to use this label..."
            sx={{ mb: 2 }}
          />

          {/* Color Picker */}
          <Box sx={{ mb: 2 }}>
            <LabelColorPicker selectedColor={color} onColorSelect={setColor} />
          </Box>

          {/* Preview */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Preview
            </Typography>
            <Chip
              label={name || 'Label Name'}
              sx={{
                bgcolor: color,
                color: getContrastColor(color),
                fontWeight: 500,
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={createLabel.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!name.trim() || createLabel.isPending}
        >
          {createLabel.isPending ? 'Creating...' : 'Create Label'}
        </Button>
      </DialogActions>
    </Dialog>
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
