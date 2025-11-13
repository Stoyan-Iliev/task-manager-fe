import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { MentionList, type MentionListRef } from './MentionList';
import type { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import type { User } from './RichTextEditor';

export const mentionSuggestion = (users: User[]): Omit<SuggestionOptions, 'editor'> => ({
  items: ({ query }): User[] => {
    return users
      .filter(
        (user) =>
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.fullName.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);
  },

  command: ({ editor, range, props }) => {
    // Insert mention with both id and label (username)
    editor
      .chain()
      .focus()
      .insertContentAt(range, [
        {
          type: 'mention',
          attrs: {
            id: props.id,
            label: props.username,
          },
        },
        {
          type: 'text',
          text: ' ',
        },
      ])
      .run();
  },

  render: () => {
    let component: ReactRenderer<MentionListRef> | undefined;
    let popup: TippyInstance[] | undefined;

    return {
      onStart: (props: SuggestionProps) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          theme: 'mention-dropdown',
          maxWidth: 'none',
          animation: 'shift-away',
          duration: [200, 150],
        });
      },

      onUpdate(props: SuggestionProps) {
        component?.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect as () => DOMRect,
        });
      },

      onKeyDown(props: { event: KeyboardEvent }) {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide();
          return true;
        }

        return component?.ref?.onKeyDown(props) ?? false;
      },

      onExit() {
        popup?.[0]?.destroy();
        component?.destroy();
      },
    };
  },
});
