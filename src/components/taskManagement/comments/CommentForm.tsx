import { useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { CommentEditor } from './CommentEditor';
import type { ProjectMemberResponse } from '../../../types/project.types';

interface CommentFormProps {
  parentCommentId?: number;
  projectMembers: ProjectMemberResponse[];
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  initialContent?: string;
  submitLabel?: string;
  autoFocus?: boolean;
}

export const CommentForm = ({
  parentCommentId,
  projectMembers,
  onSubmit,
  onCancel,
  initialContent = '',
  submitLabel = 'Comment',
  autoFocus = false,
}: CommentFormProps) => {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || content === '<p></p>') return;

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent('');
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isEmpty = !content.trim() || content === '<p></p>';

  return (
    <Box onKeyDown={handleKeyDown}>
      <CommentEditor
        content={content}
        onChange={setContent}
        placeholder={parentCommentId ? 'Write a reply...' : 'Write a comment...'}
        projectMembers={projectMembers.map(m => ({
          id: m.userId,
          username: m.username,
          fullName: m.fullName || m.username,
        }))}
        autoFocus={autoFocus}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 1 }} justifyContent="flex-end">
        {onCancel && (
          <Button size="small" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button
          size="small"
          variant="contained"
          onClick={handleSubmit}
          disabled={isEmpty || isSubmitting}
        >
          {isSubmitting ? 'Posting...' : submitLabel}
        </Button>
      </Stack>
    </Box>
  );
};
