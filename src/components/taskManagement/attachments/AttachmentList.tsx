import { useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
  Stack,
  Collapse,
  Button,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import {
  useTaskAttachments,
  useDeleteAttachment,
} from '../../../api/tasks';
import { AttachmentUpload } from './AttachmentUpload';
import { AttachmentItem } from './AttachmentItem';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';

interface AttachmentListProps {
  taskId: number;
}

export const AttachmentList = ({ taskId }: AttachmentListProps) => {
  const currentUser = useSelector((state: RootState) => state.user.details);
  const { data: attachments, isLoading } = useTaskAttachments(taskId);
  const deleteAttachment = useDeleteAttachment(taskId);
  const [showUpload, setShowUpload] = useState(false);


  const handleDelete = async (attachmentId: number) => {
    await deleteAttachment.mutateAsync(attachmentId);
  };

  const handleUploadComplete = () => {
    // Upload complete - attachments will refresh via React Query
    setShowUpload(false);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="subtitle2">
          Attachments ({attachments?.length || 0})
        </Typography>

        <Button
          size="small"
          startIcon={<AttachFileIcon />}
          onClick={() => setShowUpload(!showUpload)}
        >
          {showUpload ? 'Hide Upload' : 'Add Attachment'}
        </Button>
      </Stack>

      {/* Upload Section */}
      <Collapse in={showUpload}>
        <Box sx={{ mb: 2 }}>
          <AttachmentUpload
            taskId={taskId}
            onUploadComplete={handleUploadComplete}
          />
        </Box>
      </Collapse>

      {showUpload && <Divider sx={{ my: 2 }} />}

      {/* Attachments List */}
      {attachments && attachments.length > 0 ? (
        <Stack spacing={1}>
          {attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              onDelete={handleDelete}
              canDelete={attachment.uploadedBy?.id === currentUser?.id}
            />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
          No attachments yet. Add files to get started.
        </Typography>
      )}
    </Box>
  );
};
