import { Box, Typography, Divider, CircularProgress } from '@mui/material';
import {
  useTaskComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '../../../api/tasks';
import { useProjectMembers } from '../../../api/projectMembers';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';

interface CommentListProps {
  taskId: number;
  projectId: number;
}

export const CommentList = ({ taskId, projectId }: CommentListProps) => {
  const currentUser = useSelector((state: RootState) => state.user.details);
  const { data: comments, isLoading } = useTaskComments(taskId);
  const { data: members } = useProjectMembers(projectId);
  const createComment = useCreateComment(taskId);
  const updateComment = useUpdateComment(taskId);
  const deleteComment = useDeleteComment(taskId);

  const handleCreate = async (content: string) => {
    await createComment.mutateAsync({ content });
  };

  const handleReply = async (parentCommentId: number, content: string) => {
    await createComment.mutateAsync({ content, parentCommentId });
  };

  const handleEdit = async (commentId: number, content: string) => {
    await updateComment.mutateAsync({ commentId, data: { content } });
  };

  const handleDelete = async (commentId: number) => {
    await deleteComment.mutateAsync(commentId);
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
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Comments ({comments?.length || 0})
      </Typography>

      {/* Comment Form */}
      {currentUser && members && (
        <>
          <CommentForm
            projectMembers={members}
            onSubmit={handleCreate}
          />
          <Divider sx={{ my: 2 }} />
        </>
      )}

      {/* Comments List */}
      {comments && comments.length > 0 ? (
        <Box>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              taskId={taskId}
              currentUserId={currentUser?.id || 0}
              projectMembers={members || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReply={handleReply}
            />
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
          No comments yet. Be the first to comment!
        </Typography>
      )}
    </Box>
  );
};
