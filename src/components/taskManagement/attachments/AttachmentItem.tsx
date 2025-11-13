import { useState, memo, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { FileIcon } from './FileIcon';
import { formatDistanceToNow } from 'date-fns';
import type { AttachmentResponse } from '../../../types/task.types';
import apiClient from '../../../api/client';

interface AttachmentItemProps {
  attachment: AttachmentResponse;
  onDelete: (attachmentId: number) => Promise<void>;
  canDelete: boolean;
}

const AttachmentItemComponent = ({
  attachment,
  onDelete,
  canDelete,
}: AttachmentItemProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const isImage = attachment.mimeType.startsWith('image/');

  // Load image blob URL for authenticated image display
  useEffect(() => {
    if (!isImage) return;

    let isActive = true;

    const loadImage = async () => {
      try {
        const response = await apiClient.get(
          `/api/secure/attachments/${attachment.id}/download`,
          {
            responseType: 'blob',
          }
        );

        if (isActive) {
          const blob = new Blob([response.data], { type: attachment.mimeType });
          const url = window.URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch (error) {
      }
    };

    loadImage();

    return () => {
      isActive = false;
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
      }
    };
  }, [attachment.id, attachment.mimeType, isImage]);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  const handleOpenInNewTab = useCallback(async () => {
    setIsDownloading(true);
    try {
      // Fetch the file with authentication
      const response = await apiClient.get(
        `/api/secure/attachments/${attachment.id}/download`,
        {
          responseType: 'blob',
        }
      );

      // Create blob URL
      const blob = new Blob([response.data], { type: attachment.mimeType });
      const url = window.URL.createObjectURL(blob);

      // Open in new tab
      window.open(url, '_blank');

      // Clean up blob URL after a delay (allowing time for tab to open)
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      alert('Failed to open file. Please try again.');
    } finally {
      setIsDownloading(false);
      handleMenuClose();
    }
  }, [attachment.id, attachment.mimeType]);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      // Fetch the file with authentication
      const response = await apiClient.get(
        `/api/secure/attachments/${attachment.id}/download`,
        {
          responseType: 'blob',
        }
      );

      // Create blob URL
      const blob = new Blob([response.data], { type: attachment.mimeType });
      const url = window.URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download file. Please try again.');
    } finally {
      setIsDownloading(false);
      handleMenuClose();
    }
  }, [attachment.id, attachment.filename, attachment.mimeType]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Delete this attachment? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(attachment.id);
    } catch (error) {
    } finally {
      setIsDeleting(false);
      handleMenuClose();
    }
  }, [attachment.id, onDelete]);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handlePreviewClick = useCallback(() => {
    if (isImage) {
      setImagePreviewOpen(true);
    } else {
      handleDownload();
    }
  }, [isImage, handleDownload]);

  const handleClosePreview = useCallback(() => {
    setImagePreviewOpen(false);
  }, []);

  return (
    <>
      <Paper
        sx={{
          p: 1.5,
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* File Icon */}
          <Box
            onClick={handlePreviewClick}
            sx={{
              cursor: isImage ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isImage && blobUrl ? (
              <Box
                component="img"
                src={blobUrl}
                alt={attachment.filename}
                sx={{
                  width: 48,
                  height: 48,
                  objectFit: 'cover',
                  borderRadius: 1,
                }}
              />
            ) : (
              <FileIcon
                fileName={attachment.filename}
                mimeType={attachment.mimeType}
                size="large"
                color="action"
              />
            )}
          </Box>

          {/* File Info */}
          <Box flex={1} minWidth={0}>
            <Tooltip title={attachment.filename}>
              <Typography
                variant="body2"
                fontWeight={500}
                noWrap
                sx={{
                  cursor: isImage ? 'pointer' : 'default',
                  '&:hover': isImage ? { textDecoration: 'underline' } : {},
                }}
                onClick={handlePreviewClick}
              >
                {attachment.filename}
              </Typography>
            </Tooltip>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(attachment.fileSizeBytes)}
              </Typography>
              {attachment.uploadedBy && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    •
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {attachment.uploadedBy.firstName && attachment.uploadedBy.lastName
                      ? `${attachment.uploadedBy.firstName} ${attachment.uploadedBy.lastName}`
                      : attachment.uploadedBy.username}
                  </Typography>
                </>
              )}
              {attachment.uploadedAt && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    •
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(attachment.uploadedAt), { addSuffix: true })}
                  </Typography>
                </>
              )}
            </Stack>
          </Box>

          {/* Actions */}
          <IconButton size="small" onClick={handleMenuOpen} disabled={isDeleting}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleOpenInNewTab} disabled={isDownloading}>
          <ListItemIcon>
            <OpenInNewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{isDownloading ? 'Opening...' : 'Open in new tab'}</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleDownload} disabled={isDownloading}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{isDownloading ? 'Downloading...' : 'Download'}</ListItemText>
        </MenuItem>

        {canDelete && (
          <MenuItem onClick={handleDelete} disabled={isDeleting}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Image Preview Dialog */}
      {isImage && blobUrl && (
        <Dialog
          open={imagePreviewOpen}
          onClose={handleClosePreview}
          maxWidth="lg"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            <Box
              component="img"
              src={blobUrl}
              alt={attachment.filename}
              sx={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleDownload}
              startIcon={<DownloadIcon />}
              disabled={isDownloading}
            >
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
            <Button onClick={handleClosePreview}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

// Memoize to prevent unnecessary re-renders
export const AttachmentItem = memo(AttachmentItemComponent);
