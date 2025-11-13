import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Box, IconButton, Tooltip, Stack, Divider } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import CodeIcon from '@mui/icons-material/Code';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import LinkIcon from '@mui/icons-material/Link';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import { useEffect, useCallback } from 'react';
import { mentionSuggestion } from './mentionSuggestion';

export interface User {
  id: number;
  username: string;
  fullName: string;
}

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  users?: User[];
  autoFocus?: boolean;
  minHeight?: number;
  maxHeight?: number;
  disabled?: boolean;
  showTaskList?: boolean;
  label?: string;
}

export const RichTextEditor = ({
  content,
  onChange,
  placeholder = 'Start typing...',
  users = [],
  autoFocus = false,
  minHeight = 100,
  maxHeight = 300,
  disabled = false,
  showTaskList = true,
  label,
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Strike,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        renderLabel({ options, node }) {
          return `@${node.attrs.label ?? node.attrs.id}`;
        },
        suggestion: mentionSuggestion(users),
      }),
      ...(showTaskList
        ? [
            TaskList,
            TaskItem.configure({
              nested: true,
            }),
          ]
        : []),
    ],
    content,
    autofocus: autoFocus,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'rich-text-editor',
        'aria-label': label || 'Rich text editor',
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <Box
      sx={{
        border: 1,
        borderColor: disabled ? 'action.disabled' : 'divider',
        borderRadius: 1,
        bgcolor: disabled ? 'action.disabledBackground' : 'background.paper',
        '&:focus-within': {
          borderColor: disabled ? 'action.disabled' : 'primary.main',
          boxShadow: (theme) =>
            disabled ? 'none' : `0 0 0 1px ${theme.palette.primary.main}`,
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
          flexWrap: 'wrap',
        }}
      >
        {/* Basic formatting */}
        <Tooltip title="Bold (Ctrl+B)">
          <span>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={disabled}
              aria-label="Bold"
              aria-pressed={editor.isActive('bold')}
              sx={{
                bgcolor: editor.isActive('bold') ? 'action.selected' : 'transparent',
              }}
            >
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Italic (Ctrl+I)">
          <span>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={disabled}
              aria-label="Italic"
              aria-pressed={editor.isActive('italic')}
              sx={{
                bgcolor: editor.isActive('italic') ? 'action.selected' : 'transparent',
              }}
            >
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Underline (Ctrl+U)">
          <span>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              disabled={disabled}
              aria-label="Underline"
              aria-pressed={editor.isActive('underline')}
              sx={{
                bgcolor: editor.isActive('underline') ? 'action.selected' : 'transparent',
              }}
            >
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Strikethrough">
          <span>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={disabled}
              aria-label="Strikethrough"
              aria-pressed={editor.isActive('strike')}
              sx={{
                bgcolor: editor.isActive('strike') ? 'action.selected' : 'transparent',
              }}
            >
              <StrikethroughSIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Code (Ctrl+E)">
          <span>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={disabled}
              aria-label="Code"
              aria-pressed={editor.isActive('code')}
              sx={{
                bgcolor: editor.isActive('code') ? 'action.selected' : 'transparent',
              }}
            >
              <CodeIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Lists */}
        <Tooltip title="Bullet List">
          <span>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              disabled={disabled}
              aria-label="Bullet list"
              aria-pressed={editor.isActive('bulletList')}
              sx={{
                bgcolor: editor.isActive('bulletList') ? 'action.selected' : 'transparent',
              }}
            >
              <FormatListBulletedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Numbered List">
          <span>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              disabled={disabled}
              aria-label="Numbered list"
              aria-pressed={editor.isActive('orderedList')}
              sx={{
                bgcolor: editor.isActive('orderedList') ? 'action.selected' : 'transparent',
              }}
            >
              <FormatListNumberedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        {showTaskList && (
          <Tooltip title="Task List">
            <span>
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                disabled={disabled}
                aria-label="Task list"
                aria-pressed={editor.isActive('taskList')}
                sx={{
                  bgcolor: editor.isActive('taskList') ? 'action.selected' : 'transparent',
                }}
              >
                <CheckBoxIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Block elements */}
        <Tooltip title="Blockquote">
          <span>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              disabled={disabled}
              aria-label="Blockquote"
              aria-pressed={editor.isActive('blockquote')}
              sx={{
                bgcolor: editor.isActive('blockquote') ? 'action.selected' : 'transparent',
              }}
            >
              <FormatQuoteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Horizontal Rule">
          <span>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              disabled={disabled}
              aria-label="Horizontal rule"
            >
              <HorizontalRuleIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Link */}
        <Tooltip title="Add Link (Ctrl+K)">
          <span>
            <IconButton
              size="small"
              onClick={setLink}
              disabled={disabled}
              aria-label="Add link"
              aria-pressed={editor.isActive('link')}
              sx={{
                bgcolor: editor.isActive('link') ? 'action.selected' : 'transparent',
              }}
            >
              <LinkIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {/* Editor Content */}
      <Box
        role="textbox"
        aria-label={label || 'Editor content'}
        aria-multiline="true"
        sx={{
          '& .ProseMirror': {
            padding: '12px',
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
            overflow: 'auto',
            outline: 'none',
            '&:focus': {
              outline: 'none',
            },
            '& p.is-editor-empty:first-of-type::before': {
              color: 'text.disabled',
              content: 'attr(data-placeholder)',
              float: 'left',
              height: 0,
              pointerEvents: 'none',
            },
            '& .mention': {
              color: 'primary.main',
              backgroundColor: 'primary.light',
              borderRadius: '4px',
              padding: '2px 6px',
              fontWeight: 500,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'primary.dark',
                color: 'primary.contrastText',
              },
            },
            '& .editor-link': {
              color: 'primary.main',
              textDecoration: 'underline',
              cursor: 'pointer',
              '&:hover': {
                color: 'primary.dark',
              },
            },
            '& blockquote': {
              borderLeft: '3px solid',
              borderColor: 'divider',
              paddingLeft: '12px',
              marginLeft: 0,
              color: 'text.secondary',
            },
            '& code': {
              backgroundColor: 'action.hover',
              borderRadius: '4px',
              padding: '2px 6px',
              fontFamily: 'monospace',
              fontSize: '0.9em',
            },
            '& pre': {
              backgroundColor: 'action.hover',
              borderRadius: '4px',
              padding: '12px',
              overflow: 'auto',
              '& code': {
                backgroundColor: 'transparent',
                padding: 0,
              },
            },
            '& ul[data-type="taskList"]': {
              listStyle: 'none',
              padding: 0,
              '& li': {
                display: 'flex',
                alignItems: 'flex-start',
                '& > label': {
                  marginRight: '8px',
                  marginTop: '2px',
                  userSelect: 'none',
                },
                '& > div': {
                  flex: 1,
                },
              },
            },
            '& hr': {
              border: 'none',
              borderTop: '2px solid',
              borderColor: 'divider',
              margin: '16px 0',
            },
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
};
