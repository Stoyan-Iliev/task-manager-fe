import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  type SelectChangeEvent,
} from '@mui/material';
import { useSprints } from '../../api/sprints';

interface SprintSelectorProps {
  projectId: number | null;
  value: number | null | undefined;
  onChange: (sprintId: number | null) => void;
  label?: string;
  size?: 'small' | 'medium';
  disabled?: boolean;
  allowNone?: boolean;
  excludeSprintIds?: number[];
}

const SprintSelector: React.FC<SprintSelectorProps> = ({
  projectId,
  value,
  onChange,
  label = 'Sprint',
  size = 'medium',
  disabled = false,
  allowNone = true,
  excludeSprintIds = [],
}) => {
  const { data: sprints, isLoading } = useSprints(projectId);

  // Only show PLANNED and ACTIVE sprints for assignment, excluding specified IDs
  const assignableSprints = sprints?.filter(
    (sprint) =>
      (sprint.status === 'PLANNED' || sprint.status === 'ACTIVE') &&
      !excludeSprintIds.includes(sprint.id)
  );

  const handleChange = (event: SelectChangeEvent<number | string>) => {
    const newValue = event.target.value;
    onChange(newValue === '' ? null : Number(newValue));
  };

  if (isLoading) {
    return (
      <FormControl fullWidth size={size} disabled>
        <InputLabel>{label}</InputLabel>
        <Select value="" label={label}>
          <MenuItem value="">
            <CircularProgress size={20} />
          </MenuItem>
        </Select>
      </FormControl>
    );
  }

  return (
    <FormControl fullWidth size={size} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value ?? ''}
        onChange={handleChange}
        label={label}
      >
        {allowNone && (
          <MenuItem value="">
            <em>None (Backlog)</em>
          </MenuItem>
        )}
        {assignableSprints?.map((sprint) => (
          <MenuItem key={sprint.id} value={sprint.id}>
            {sprint.name} ({sprint.status === 'ACTIVE' ? 'Active' : 'Planned'})
          </MenuItem>
        ))}
        {(!assignableSprints || assignableSprints.length === 0) && !allowNone && (
          <MenuItem value="" disabled>
            <em>No assignable sprints available</em>
          </MenuItem>
        )}
      </Select>
    </FormControl>
  );
};

export default SprintSelector;
