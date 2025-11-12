import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import { Box, IconButton, Tooltip, Stack } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import CodeIcon from '@mui/icons-material/Code';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { useEffect } from 'react';

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
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings in comments
      }),
      Placeholder.configure({
        placeholder,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: {
          items: ({ query }) => {
            return projectMembers
              .filter(member =>
                member.username.toLowerCase().includes(query.toLowerCase()) ||
                member.fullName.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, 5);
          },
        },
      }),
    ],
    content,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'comment-editor',
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        '&:focus-within': {
          borderColor: 'primary.main',
          boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
        },
      }}
    >
      {/* Toolbar */}
      <Stack
        direction="row"
        spacing={0.5}
        role="toolbar"
        aria-label="Text formatting options"
        sx={{
          p: 0.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Tooltip title="Bold (Ctrl+B)">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
            aria-pressed={editor.isActive('bold')}
            sx={{
              bgcolor: editor.isActive('bold') ? 'action.selected' : 'transparent',
            }}
          >
            <FormatBoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic (Ctrl+I)">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
            aria-pressed={editor.isActive('italic')}
            sx={{
              bgcolor: editor.isActive('italic') ? 'action.selected' : 'transparent',
            }}
          >
            <FormatItalicIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Code (Ctrl+E)">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleCode().run()}
            aria-label="Code"
            aria-pressed={editor.isActive('code')}
            sx={{
              bgcolor: editor.isActive('code') ? 'action.selected' : 'transparent',
            }}
          >
            <CodeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Bullet List">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Bullet list"
            aria-pressed={editor.isActive('bulletList')}
            sx={{
              bgcolor: editor.isActive('bulletList') ? 'action.selected' : 'transparent',
            }}
          >
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Editor Content */}
      <Box
        role="textbox"
        aria-label="Comment content"
        aria-multiline="true"
        sx={{
          '& .ProseMirror': {
            padding: '12px',
            minHeight: '100px',
            maxHeight: '300px',
            overflow: 'auto',
            outline: 'none',
            '&:focus': {
              outline: 'none',
            },
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
};
