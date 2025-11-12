import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  Stack,
  Avatar,
  Divider,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import type { SearchResultResponse, PageResponse } from '../../types/search.types';

interface SearchResultsProps {
  results: PageResponse<SearchResultResponse> | undefined;
  isLoading: boolean;
  error: Error | null;
  onResultClick: (result: SearchResultResponse) => void;
  onPageChange: (page: number) => void;
  currentPage: number;
}

const entityIcons = {
  TASK: <AssignmentIcon sx={{ fontSize: 20 }} />,
  PROJECT: <FolderIcon sx={{ fontSize: 20 }} />,
  USER: <PersonIcon sx={{ fontSize: 20 }} />,
};

const entityColors = {
  TASK: 'primary' as const,
  PROJECT: 'secondary' as const,
  USER: 'success' as const,
};

export const SearchResults = ({
  results,
  isLoading,
  error,
  onResultClick,
  onPageChange,
  currentPage,
}: SearchResultsProps) => {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load search results. Please try again.
      </Alert>
    );
  }

  if (!results || results.empty) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={8}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No results found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your search query or filters
        </Typography>
      </Box>
    );
  }

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    onPageChange(page - 1); // MUI Pagination is 1-indexed, backend is 0-indexed
  };

  return (
    <Box>
      {/* Results Summary */}
      <Box mb={2} px={1}>
        <Typography variant="body2" color="text.secondary">
          Found {results.totalElements} {results.totalElements === 1 ? 'result' : 'results'}
        </Typography>
      </Box>

      {/* Results List */}
      <Stack spacing={2}>
        {results.content.map((result) => (
          <Card
            key={`${result.entityType}-${result.entityId}`}
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
              },
            }}
            onClick={() => onResultClick(result)}
          >
            <CardContent>
              {/* Header */}
              <Box display="flex" alignItems="flex-start" gap={1.5} mb={1}>
                <Box sx={{ color: 'text.secondary', mt: 0.5 }}>
                  {entityIcons[result.entityType as keyof typeof entityIcons] || entityIcons.TASK}
                </Box>
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="h6" component="h3">
                      {result.title}
                    </Typography>
                    <Chip
                      label={result.entityType.charAt(0) + result.entityType.slice(1).toLowerCase()}
                      size="small"
                      color={entityColors[result.entityType as keyof typeof entityColors] || 'default'}
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                    {result.relevanceScore !== null && result.relevanceScore !== undefined && (
                      <Chip
                        label={`${Math.round(result.relevanceScore * 100)}% match`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>

                  {/* Description */}
                  {result.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {result.description}
                    </Typography>
                  )}

                  {/* Metadata */}
                  <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
                    {result.projectName && (
                      <>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <FolderIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {result.projectName}
                          </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem />
                      </>
                    )}

                    {result.status && (
                      <>
                        <Chip
                          label={result.status}
                          size="small"
                          variant="outlined"
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      </>
                    )}

                    {result.assigneeName && (
                      <>
                        <Divider orientation="vertical" flexItem />
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Avatar
                            sx={{
                              width: 16,
                              height: 16,
                              fontSize: '0.65rem',
                              bgcolor: 'primary.main',
                            }}
                          >
                            {result.assigneeName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            {result.assigneeName}
                          </Typography>
                        </Box>
                      </>
                    )}

                    {/* Highlighted Fields */}
                    {result.highlightedFields && result.highlightedFields.length > 0 && (
                      <>
                        <Divider orientation="vertical" flexItem />
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {result.highlightedFields.map((field, idx) => (
                            <Chip
                              key={idx}
                              label={field}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          ))}
                        </Box>
                      </>
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Pagination */}
      {results.totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={results.totalPages}
            page={currentPage + 1} // MUI Pagination is 1-indexed
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default SearchResults;
