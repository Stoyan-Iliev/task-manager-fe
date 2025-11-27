import { useState } from 'react';
import { Box, Typography, Paper, useTheme, Chip, Stack, Button } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FilterListIcon from '@mui/icons-material/FilterList';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { SearchBar } from '../search/SearchBar';
import { SearchResults } from '../search/SearchResults';
import { AdvancedFilterDialog } from '../search/AdvancedFilterDialog';
import TaskDrawer from '../taskManagement/TaskDrawer';
import { useSearch, useSavedSearches } from '../../api/search';
import { selectCurrentOrganization } from '../../redux/organizationSlice';
import type { SearchRequest, SearchResultResponse } from '../../types/search.types';

const SearchView = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const currentOrganization = useSelector(selectCurrentOrganization);

  const [query, setQuery] = useState('');
  const [searchRequest, setSearchRequest] = useState<SearchRequest>({
    query: null,
    entityType: 'GLOBAL',
    sortBy: 'relevance',
    sortDirection: 'DESC',
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{
    taskId: number;
    projectId: number;
    organizationId: number;
  } | null>(null);

  const { data: searchResults, isLoading, error } = useSearch(
    currentOrganization?.id || null,
    searchRequest,
    currentPage,
    20,
    hasSearched
  );

  const { data: savedSearches } = useSavedSearches(currentOrganization?.id || null);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setSearchRequest({
      ...searchRequest,
      query: newQuery || null,
    });
    setCurrentPage(0);
    setHasSearched(true);
  };

  const handleApplyFilters = (filters: SearchRequest) => {
    setSearchRequest({
      ...filters,
      query: query || null,
    });
    setCurrentPage(0);
    setHasSearched(true);
  };

  const handleResultClick = (result: SearchResultResponse) => {
    // Handle different entity types
    switch (result.entityType) {
      case 'TASK':
        if (result.projectId && currentOrganization?.id) {
          // Open task drawer on the search page instead of navigating
          setSelectedTask({
            taskId: result.entityId,
            projectId: result.projectId,
            organizationId: currentOrganization.id,
          });
        }
        break;
      case 'PROJECT':
        navigate(`/projects/${result.entityId}`);
        break;
      case 'USER':
        // Navigate to user profile if implemented
        console.log('Navigate to user:', result.entityId);
        break;
      default:
        break;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResultSelect = (result: SearchResultResponse) => {
    handleResultClick(result);
  };

  const handleExecuteSavedSearch = (savedSearchId: number) => {
    const savedSearch = savedSearches?.find((s) => s.id === savedSearchId);
    if (savedSearch) {
      setSearchRequest(savedSearch.searchCriteria);
      setQuery(savedSearch.searchCriteria.query || '');
      setCurrentPage(0);
      setHasSearched(true);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchRequest.projectIds && searchRequest.projectIds.length > 0) count++;
    if (searchRequest.assigneeIds && searchRequest.assigneeIds.length > 0) count++;
    if (searchRequest.statusIds && searchRequest.statusIds.length > 0) count++;
    if (searchRequest.labelIds && searchRequest.labelIds.length > 0) count++;
    if (searchRequest.createdAfter || searchRequest.createdBefore) count++;
    if (searchRequest.dueAfter || searchRequest.dueBefore) count++;
    if (searchRequest.entityType && searchRequest.entityType !== 'GLOBAL') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: theme.palette.background.default,
        minHeight: {
          xs: 'calc(100vh - 56px)',
          sm: 'calc(100vh - 64px)',
        },
      }}
    >
      {/* Header */}
      <Typography
        variant="h4"
        sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
        color="text.primary"
      >
        <SearchRoundedIcon /> Global Search
      </Typography>

      {/* Search Bar */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          bgcolor: theme.palette.background.paper,
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        <SearchBar
          organizationId={currentOrganization?.id || null}
          onSearch={handleSearch}
          onResultSelect={handleResultSelect}
          onFilterClick={() => setFilterDialogOpen(true)}
          placeholder="Search tasks, projects"
          showSuggestions={true}
          autoFocus={true}
          value={query}
        />

        {/* Filter Button */}
        <Box display="flex" gap={1} mt={2} alignItems="center">
          <Button
            variant={activeFiltersCount > 0 ? 'contained' : 'outlined'}
            startIcon={<FilterListIcon />}
            onClick={() => setFilterDialogOpen(true)}
            size="small"
          >
            Filters
            {activeFiltersCount > 0 && (
              <Chip
                label={activeFiltersCount}
                size="small"
                sx={{
                  ml: 1,
                  height: 20,
                  bgcolor: 'background.paper',
                  color: 'primary.main',
                }}
              />
            )}
          </Button>

          {/* Saved Searches */}
          {savedSearches && savedSearches.length > 0 && (
            <Box display="flex" gap={1} flexWrap="wrap" ml={2}>
              <BookmarkIcon sx={{ fontSize: 20, color: 'text.secondary', alignSelf: 'center' }} />
              {savedSearches.slice(0, 5).map((saved) => (
                <Chip
                  key={saved.id}
                  label={saved.name}
                  size="small"
                  onClick={() => handleExecuteSavedSearch(saved.id)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && hasSearched && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: theme.palette.background.paper }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Active filters:
            </Typography>
            {searchRequest.entityType && searchRequest.entityType !== 'GLOBAL' && (
              <Chip
                label={`Type: ${searchRequest.entityType}`}
                size="small"
                onDelete={() =>
                  handleApplyFilters({ ...searchRequest, entityType: 'GLOBAL' })
                }
              />
            )}
            {searchRequest.projectIds && searchRequest.projectIds.length > 0 && (
              <Chip
                label={`${searchRequest.projectIds.length} project${searchRequest.projectIds.length > 1 ? 's' : ''}`}
                size="small"
                onDelete={() =>
                  handleApplyFilters({ ...searchRequest, projectIds: undefined })
                }
              />
            )}
            {searchRequest.assigneeIds && searchRequest.assigneeIds.length > 0 && (
              <Chip
                label={`${searchRequest.assigneeIds.length} assignee${searchRequest.assigneeIds.length > 1 ? 's' : ''}`}
                size="small"
                onDelete={() =>
                  handleApplyFilters({ ...searchRequest, assigneeIds: undefined })
                }
              />
            )}
            {searchRequest.statusIds && searchRequest.statusIds.length > 0 && (
              <Chip
                label={`${searchRequest.statusIds.length} status${searchRequest.statusIds.length > 1 ? 'es' : ''}`}
                size="small"
                onDelete={() =>
                  handleApplyFilters({ ...searchRequest, statusIds: undefined })
                }
              />
            )}
            {searchRequest.labelIds && searchRequest.labelIds.length > 0 && (
              <Chip
                label={`${searchRequest.labelIds.length} label${searchRequest.labelIds.length > 1 ? 's' : ''}`}
                size="small"
                onDelete={() =>
                  handleApplyFilters({ ...searchRequest, labelIds: undefined })
                }
              />
            )}
            {(searchRequest.createdAfter || searchRequest.createdBefore) && (
              <Chip
                label="Created date filter"
                size="small"
                onDelete={() =>
                  handleApplyFilters({
                    ...searchRequest,
                    createdAfter: undefined,
                    createdBefore: undefined,
                  })
                }
              />
            )}
            {(searchRequest.dueAfter || searchRequest.dueBefore) && (
              <Chip
                label="Due date filter"
                size="small"
                onDelete={() =>
                  handleApplyFilters({
                    ...searchRequest,
                    dueAfter: undefined,
                    dueBefore: undefined,
                  })
                }
              />
            )}
          </Stack>
        </Paper>
      )}

      {/* Search Results */}
      {hasSearched && (
        <SearchResults
          results={searchResults}
          isLoading={isLoading}
          error={error}
          onResultClick={handleResultClick}
          onPageChange={handlePageChange}
          currentPage={currentPage}
        />
      )}

      {/* Initial State */}
      {!hasSearched && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={12}
        >
          <SearchRoundedIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Start searching
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter a search query to find tasks, projects, and users
          </Typography>
        </Box>
      )}

      {/* Advanced Filter Dialog */}
      <AdvancedFilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={handleApplyFilters}
        organizationId={currentOrganization?.id || null}
        initialFilters={searchRequest}
      />

      {/* Task Drawer - opens when a task is clicked */}
      {selectedTask && (
        <TaskDrawer
          taskId={selectedTask.taskId}
          projectId={selectedTask.projectId}
          organizationId={selectedTask.organizationId}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </Box>
  );
};

export default SearchView;
