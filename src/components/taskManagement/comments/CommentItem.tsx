import { useState, memo } from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Stack,
  Button,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplyIcon from '@mui/icons-material/Reply';
import { CommentForm } from './CommentForm';
import { formatDistanceToNow } from 'date-fns';
import type { CommentResponse } from '../../../types/task.types';
import type { ProjectMemberResponse } from '../../../types/project.types';

interface CommentItemProps {
  comment: CommentResponse;
  taskId: number;
  currentUserId: number;
  projectMembers: ProjectMemberResponse[];
  onEdit: (commentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
  onReply: (parentCommentId: number, content: string) => Promise<void>;
  depth?: number;
}

const CommentItemComponent = ({
  comment,
  taskId,
  currentUserId,
  projectMembers,
  onEdit,
  onDelete,
  onReply,
  depth = 0,
}: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const isOwnComment = comment.author?.id === currentUserId;
  const canReply = depth === 0; // Only top-level comments can have replies

  const handleEdit = async (content: string) => {
    await onEdit(comment.id, content);
    setIsEditing(false);
  };

  const handleReply = async (content: string) => {
    await onReply(comment.id, content);
    setIsReplying(false);
  };

  const handleDelete = () => {
    if (confirm('Delete this comment? This action cannot be undone.')) {
      onDelete(comment.id);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        {/* Avatar */}
        <Avatar
          sx={{
            width: depth === 0 ? 32 : 28,
            height: depth === 0 ? 32 : 28,
            bgcolor: 'primary.main',
            fontSize: depth === 0 ? '0.875rem' : '0.75rem',
          }}
        >
          {comment.author
            ? (comment.author.fullName || comment.author.username).charAt(0).toUpperCase()
            : '?'}
        </Avatar>

        <Box flex={1}>
          {/* Header */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 0.5 }}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              {comment.author?.fullName || comment.author?.username || 'Unknown'}
            </Typography>
            {comment.createdAt && (
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </Typography>
            )}
            {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
              <Typography variant="caption" color="text.secondary" fontStyle="italic">
                (edited)
              </Typography>
            )}

            {/* Actions */}
            {isOwnComment && !isEditing && (
              <Stack direction="row" spacing={0.5} sx={{ ml: 'auto' }}>
                <IconButton size="small" onClick={() => setIsEditing(true)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={handleDelete}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            )}
          </Stack>

          {/* Content */}
          {isEditing ? (
            <CommentForm
              projectMembers={projectMembers}
              onSubmit={handleEdit}
              onCancel={() => setIsEditing(false)}
              initialContent={comment.content}
              submitLabel="Save"
              autoFocus
            />
          ) : (
            <>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  '& p': { margin: 0, marginBottom: '0.5em' },
                  '& p:last-child': { marginBottom: 0 },
                  '& ul, & ol': { marginTop: '0.5em', marginBottom: '0.5em', paddingLeft: '1.5em' },
                  '& code': {
                    bgcolor: 'action.selected',
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 0.5,
                    fontFamily: 'monospace',
                    fontSize: '0.875em',
                  },
                  '& .mention': {
                    color: 'primary.main',
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  },
                }}
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />

              {/* Reply Button */}
              {canReply && !isReplying && (
                <Button
                  size="small"
                  startIcon={<ReplyIcon />}
                  onClick={() => setIsReplying(true)}
                  sx={{ mt: 0.5 }}
                >
                  Reply
                </Button>
              )}
            </>
          )}

          {/* Reply Form */}
          {isReplying && (
            <Box sx={{ mt: 1 }}>
              <CommentForm
                parentCommentId={comment.id}
                projectMembers={projectMembers}
                onSubmit={handleReply}
                onCancel={() => setIsReplying(false)}
                submitLabel="Reply"
                autoFocus
              />
            </Box>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <Box sx={{ mt: 2, ml: 2, borderLeft: 2, borderColor: 'divider', pl: 2 }}>
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  taskId={taskId}
                  currentUserId={currentUserId}
                  projectMembers={projectMembers}
                  onEdit={onEdit}
                  onDelete={onDelete}
                    onReply={onReply}
                    depth={1}
                  />
                ))}
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

// Memoize to prevent unnecessary re-renders when parent re-renders
export const CommentItem = memo(CommentItemComponent);
