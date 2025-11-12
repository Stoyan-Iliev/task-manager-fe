import { Box, Paper, Typography, Stack } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

interface LabelColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

// Predefined color palette inspired by Jira/Linear
export const LABEL_COLORS = [
  { name: 'Red', value: '#F44336' },
  { name: 'Pink', value: '#E91E63' },
  { name: 'Purple', value: '#9C27B0' },
  { name: 'Deep Purple', value: '#673AB7' },
  { name: 'Indigo', value: '#3F51B5' },
  { name: 'Blue', value: '#2196F3' },
  { name: 'Light Blue', value: '#03A9F4' },
  { name: 'Cyan', value: '#00BCD4' },
  { name: 'Teal', value: '#009688' },
  { name: 'Green', value: '#4CAF50' },
  { name: 'Light Green', value: '#8BC34A' },
  { name: 'Lime', value: '#CDDC39' },
  { name: 'Yellow', value: '#FFEB3B' },
  { name: 'Amber', value: '#FFC107' },
  { name: 'Orange', value: '#FF9800' },
  { name: 'Deep Orange', value: '#FF5722' },
  { name: 'Brown', value: '#795548' },
  { name: 'Grey', value: '#9E9E9E' },
  { name: 'Blue Grey', value: '#607D8B' },
  { name: 'Black', value: '#212121' },
];

export const LabelColorPicker = ({
  selectedColor,
  onColorSelect,
}: LabelColorPickerProps) => {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        Select a color
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap={1}>
        {LABEL_COLORS.map((color) => (
          <Paper
            key={color.value}
            onClick={() => onColorSelect(color.value)}
            sx={{
              width: 36,
              height: 36,
              bgcolor: color.value,
              cursor: 'pointer',
              border: '2px solid',
              borderColor: selectedColor === color.value ? 'primary.main' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: 2,
              },
            }}
            title={color.name}
          >
            {selectedColor === color.value && (
              <CheckIcon
                sx={{
                  color: getContrastColor(color.value),
                  fontSize: 20,
                }}
              />
            )}
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

// Helper function to determine if text should be white or black based on background
function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
