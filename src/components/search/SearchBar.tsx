import { useState, useCallback, useRef, useEffect } from 'react';
import {
  TextField,
  Autocomplete,
  Box,
  Typography,
  CircularProgress,
  Chip,
  Paper,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import { useSearchSuggestions } from '../../api/search';
import type { SearchResultResponse } from '../../types/search.types';
import { debounce } from '@mui/material/utils';

interface SearchBarProps {
  organizationId: number | null;
  onSearch: (query: string) => void;
  onResultSelect?: (result: SearchResultResponse) => void;
  onFilterClick?: () => void;
  placeholder?: string;
  showSuggestions?: boolean;
  autoFocus?: boolean;
  value?: string;
}

export const SearchBar = ({
  organizationId,
  onSearch,
  onResultSelect,
  onFilterClick,
  placeholder = 'Search tasks, projects, and users...',
  showSuggestions = true,
  autoFocus = false,
  value: controlledValue,
}: SearchBarProps) => {
  const [inputValue, setInputValue] = useState(controlledValue || '');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);

  const { data: suggestionsData, isLoading } = useSearchSuggestions(
    organizationId,
    debouncedQuery
  );

  const suggestions = suggestionsData?.content || [];

  // Debounce the search query
  const debouncedSetQuery = useRef(
    debounce((query: string) => {
      setDebouncedQuery(query);
    }, 300)
  ).current;

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInputValue(controlledValue);
    }
  }, [controlledValue]);

  const handleInputChange = (_: unknown, newValue: string) => {
    setInputValue(newValue);
    if (showSuggestions && newValue.length >= 2) {
      debouncedSetQuery(newValue);
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleSearch = () => {
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
      setOpen(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleResultClick = (result: SearchResultResponse) => {
    if (onResultSelect) {
      onResultSelect(result);
    }
    setOpen(false);
  };

  const handleClear = () => {
    setInputValue('');
    setDebouncedQuery('');
    setOpen(false);
    onSearch('');
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'TASK':
        return 'primary';
      case 'PROJECT':
        return 'secondary';
      case 'USER':
        return 'success';
      default:
        return 'default';
    }
  };

  const getEntityTypeLabel = (entityType: string) => {
    return entityType.charAt(0) + entityType.slice(1).toLowerCase();
  };

  return (
    <Autocomplete
      freeSolo
      open={open && showSuggestions}
      onOpen={() => {
        if (inputValue.length >= 2 && showSuggestions) {
          setOpen(true);
        }
      }}
      onClose={() => setOpen(false)}
      options={suggestions}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return option.title || '';
      }}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      loading={isLoading}
      filterOptions={(x) => x} // Disable built-in filtering since we're using server-side search
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onKeyDown={handleKeyDown}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <Box display="flex" alignItems="center" gap={0.5}>
                {isLoading && <CircularProgress color="inherit" size={20} />}
                {inputValue && (
                  <IconButton size="small" onClick={handleClear}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
                {onFilterClick && (
                  <IconButton size="small" onClick={onFilterClick}>
                    <FilterListIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        if (typeof option === 'string') return null;

        return (
          <li {...props} onClick={() => handleResultClick(option)}>
            <Box sx={{ width: '100%' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" fontWeight={500}>
                  {option.title}
                </Typography>
                <Chip
                  label={getEntityTypeLabel(option.entityType)}
                  size="small"
                  color={getEntityTypeColor(option.entityType)}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>
              {option.description && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {option.description}
                </Typography>
              )}
              <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                {option.projectName && (
                  <Chip
                    label={option.projectName}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                )}
                {option.status && (
                  <Chip
                    label={option.status}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                )}
                {option.assigneeName && (
                  <Chip
                    label={option.assigneeName}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                )}
              </Box>
            </Box>
          </li>
        );
      }}
      PaperComponent={(props) => (
        <Paper {...props} elevation={8} sx={{ mt: 1 }} />
      )}
    />
  );
};

export default SearchBar;
