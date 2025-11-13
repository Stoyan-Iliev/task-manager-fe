import { RichTextEditor, type User } from '../../misc/RichTextEditor';

interface CommentEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  projectMembers?: Array<{ id: number; username: string; fullName: string }>;
  autoFocus?: boolean;
}

export const CommentEditor = ({
  content,
  onChange,
  placeholder = 'Write a comment...',
  projectMembers = [],
  autoFocus = false
}: CommentEditorProps) => {
  // Map project members to User type
  const users: User[] = projectMembers.map(member => ({
    id: member.id,
    username: member.username,
    fullName: member.fullName
  }));

  return (
    <RichTextEditor
      content={content}
      onChange={onChange}
      placeholder={placeholder}
      users={users}
      autoFocus={autoFocus}
      minHeight={100}
      maxHeight={300}
      showTaskList={false}
      label="Comment content"
    />
  );
};
