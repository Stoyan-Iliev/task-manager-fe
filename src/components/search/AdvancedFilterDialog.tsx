import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Checkbox,
  ListItemText,
  TextField,
  Typography,
  Divider,
  Stack,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import type { SearchRequest } from '../../types/search.types';
import { useProjects } from '../../api/projects';
import { useOrganizationMembers } from '../../api/organizationMembers';
import { useOrganizationLabels } from '../../api/labels';

interface AdvancedFilterDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: SearchRequest) => void;
  organizationId: number | null;
  initialFilters?: Partial<SearchRequest>;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export const AdvancedFilterDialog = ({
  open,
  onClose,
  onApply,
  organizationId,
  initialFilters = {},
}: AdvancedFilterDialogProps) => {
  const { data: projects } = useProjects(organizationId);
  const { data: members } = useOrganizationMembers(organizationId);
  const { data: labels } = useOrganizationLabels(organizationId);

  // Filter state
  const [selectedProjects, setSelectedProjects] = useState<number[]>(initialFilters.projectIds || []);
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>(initialFilters.assigneeIds || []);
  const [selectedStatuses, setSelectedStatuses] = useState<number[]>(initialFilters.statusIds || []);
  const [selectedLabels, setSelectedLabels] = useState<number[]>(initialFilters.labelIds || []);
  const [createdAfter, setCreatedAfter] = useState<Dayjs | null>(
    initialFilters.createdAfter ? dayjs(initialFilters.createdAfter) : null
  );
  const [createdBefore, setCreatedBefore] = useState<Dayjs | null>(
    initialFilters.createdBefore ? dayjs(initialFilters.createdBefore) : null
  );
  const [dueAfter, setDueAfter] = useState<Dayjs | null>(
    initialFilters.dueAfter ? dayjs(initialFilters.dueAfter) : null
  );
  const [dueBefore, setDueBefore] = useState<Dayjs | null>(
    initialFilters.dueBefore ? dayjs(initialFilters.dueBefore) : null
  );
  const [includeArchived, setIncludeArchived] = useState<boolean>(initialFilters.includeArchived || false);
  const [entityType, setEntityType] = useState<string>(initialFilters.entityType || 'TASK');

  // Reset filters when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedProjects(initialFilters.projectIds || []);
      setSelectedAssignees(initialFilters.assigneeIds || []);
      setSelectedStatuses(initialFilters.statusIds || []);
      setSelectedLabels(initialFilters.labelIds || []);
      setCreatedAfter(initialFilters.createdAfter ? dayjs(initialFilters.createdAfter) : null);
      setCreatedBefore(initialFilters.createdBefore ? dayjs(initialFilters.createdBefore) : null);
      setDueAfter(initialFilters.dueAfter ? dayjs(initialFilters.dueAfter) : null);
      setDueBefore(initialFilters.dueBefore ? dayjs(initialFilters.dueBefore) : null);
      setIncludeArchived(initialFilters.includeArchived || false);
      setEntityType(initialFilters.entityType || 'TASK');
    }
  }, [open, initialFilters]);

  const handleApply = () => {
    const filters: SearchRequest = {
      query: initialFilters.query || null,
      entityType,
      projectIds: selectedProjects.length > 0 ? selectedProjects : undefined,
      assigneeIds: selectedAssignees.length > 0 ? selectedAssignees : undefined,
      statusIds: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      labelIds: selectedLabels.length > 0 ? selectedLabels : undefined,
      createdAfter: createdAfter?.toISOString(),
      createdBefore: createdBefore?.toISOString(),
      dueAfter: dueAfter?.toISOString(),
      dueBefore: dueBefore?.toISOString(),
      includeArchived,
      sortBy: initialFilters.sortBy || 'relevance',
      sortDirection: initialFilters.sortDirection || 'DESC',
    };
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setSelectedProjects([]);
    setSelectedAssignees([]);
    setSelectedStatuses([]);
    setSelectedLabels([]);
    setCreatedAfter(null);
    setCreatedBefore(null);
    setDueAfter(null);
    setDueBefore(null);
    setIncludeArchived(false);
    setEntityType('TASK');
  };

  const hasActiveFilters =
    selectedProjects.length > 0 ||
    selectedAssignees.length > 0 ||
    selectedStatuses.length > 0 ||
    selectedLabels.length > 0 ||
    createdAfter !== null ||
    createdBefore !== null ||
    dueAfter !== null ||
    dueBefore !== null ||
    includeArchived ||
    entityType !== 'TASK';

  // Get all unique statuses from projects
  const allStatuses = projects?.flatMap((p) => p.statuses || []) || [];
  const uniqueStatuses = Array.from(
    new Map(allStatuses.map((s) => [s.id, s])).values()
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <FilterListIcon />
          <Typography variant="h6">Advanced Filters</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {/* Entity Type */}
          <FormControl fullWidth>
            <InputLabel>Search In</InputLabel>
            <Select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              label="Search In"
            >
              <MenuItem value="GLOBAL">Everything</MenuItem>
              <MenuItem value="TASK">Tasks</MenuItem>
              <MenuItem value="PROJECT">Projects</MenuItem>
              <MenuItem value="USER">Users</MenuItem>
            </Select>
          </FormControl>

          <Divider />

          {/* Task-specific filters */}
          {(entityType === 'TASK' || entityType === 'GLOBAL') && (
            <>
              {/* Projects */}
              <FormControl fullWidth>
                <InputLabel>Projects</InputLabel>
                <Select
                  multiple
                  value={selectedProjects}
                  onChange={(e) => setSelectedProjects(e.target.value as number[])}
                  input={<OutlinedInput label="Projects" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const project = projects?.find((p) => p.id === id);
                        return <Chip key={id} label={project?.name || id} size="small" />;
                      })}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                >
                  {projects?.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      <Checkbox checked={selectedProjects.indexOf(project.id) > -1} />
                      <ListItemText primary={project.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Assignees */}
              <FormControl fullWidth>
                <InputLabel>Assignees</InputLabel>
                <Select
                  multiple
                  value={selectedAssignees}
                  onChange={(e) => setSelectedAssignees(e.target.value as number[])}
                  input={<OutlinedInput label="Assignees" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const member = members?.find((m) => m.userId === id);
                        return (
                          <Chip
                            key={id}
                            label={member?.fullName || member?.username || id}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                >
                  {members?.map((member) => (
                    <MenuItem key={member.userId} value={member.userId}>
                      <Checkbox checked={selectedAssignees.indexOf(member.userId) > -1} />
                      <ListItemText primary={member.fullName || member.username} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Statuses */}
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  multiple
                  value={selectedStatuses}
                  onChange={(e) => setSelectedStatuses(e.target.value as number[])}
                  input={<OutlinedInput label="Status" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const status = uniqueStatuses.find((s) => s.id === id);
                        return <Chip key={id} label={status?.name || id} size="small" />;
                      })}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                >
                  {uniqueStatuses.map((status) => (
                    <MenuItem key={status.id} value={status.id}>
                      <Checkbox checked={selectedStatuses.indexOf(status.id) > -1} />
                      <Box display="flex" alignItems="center" gap={1}>
                        {status.color && (
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: status.color,
                            }}
                          />
                        )}
                        <ListItemText primary={status.name} />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Labels */}
              <FormControl fullWidth>
                <InputLabel>Labels</InputLabel>
                <Select
                  multiple
                  value={selectedLabels}
                  onChange={(e) => setSelectedLabels(e.target.value as number[])}
                  input={<OutlinedInput label="Labels" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const label = labels?.find((l) => l.id === id);
                        return (
                          <Chip
                            key={id}
                            label={label?.name || id}
                            size="small"
                            sx={{
                              bgcolor: label?.color,
                              color: label?.color ? 'white' : 'inherit',
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                >
                  {labels?.map((label) => (
                    <MenuItem key={label.id} value={label.id}>
                      <Checkbox checked={selectedLabels.indexOf(label.id) > -1} />
                      <Box display="flex" alignItems="center" gap={1}>
                        {label.color && (
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: label.color,
                            }}
                          />
                        )}
                        <ListItemText primary={label.name} />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider />

              {/* Date Filters */}
              <Typography variant="subtitle2" color="text.secondary">
                Created Date
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box display="flex" gap={2}>
                  <DatePicker
                    label="From"
                    value={createdAfter}
                    onChange={setCreatedAfter}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                  <DatePicker
                    label="To"
                    value={createdBefore}
                    onChange={setCreatedBefore}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Box>
              </LocalizationProvider>

              <Typography variant="subtitle2" color="text.secondary">
                Due Date
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box display="flex" gap={2}>
                  <DatePicker
                    label="From"
                    value={dueAfter}
                    onChange={setDueAfter}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                  <DatePicker
                    label="To"
                    value={dueBefore}
                    onChange={setDueBefore}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Box>
              </LocalizationProvider>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Box display="flex" justifyContent="space-between" width="100%">
          <Button
            onClick={handleClear}
            startIcon={<ClearIcon />}
            disabled={!hasActiveFilters}
          >
            Clear All
          </Button>
          <Box display="flex" gap={1}>
            <Button onClick={onClose}>Cancel</Button>
            <Button onClick={handleApply} variant="contained">
              Apply Filters
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedFilterDialog;
