import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Paper, List, ListItem, ListItemButton, ListItemText, Avatar, Box } from '@mui/material';

interface User {
  id: number;
  username: string;
  fullName: string;
}

interface MentionListProps {
  items: User[];
  command: (item: User) => void;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = props.items[index];

      if (item) {
        props.command(item);
      }
    };

    const upHandler = () => {
      setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          upHandler();
          return true;
        }

        if (event.key === 'ArrowDown') {
          downHandler();
          return true;
        }

        if (event.key === 'Enter') {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    if (props.items.length === 0) {
      return null;
    }

    return (
      <Paper
        elevation={3}
        sx={{
          maxHeight: '300px',
          overflow: 'auto',
          minWidth: '200px',
        }}
      >
        <List dense>
          {props.items.map((item, index) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={index === selectedIndex}
                onClick={() => selectItem(index)}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    '&:hover': {
                      bgcolor: 'primary.light',
                    },
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      fontSize: '0.75rem',
                      bgcolor: 'primary.main',
                    }}
                  >
                    {item.fullName?.charAt(0) || item.username?.charAt(0) || '?'}
                  </Avatar>
                  <ListItemText
                    primary={item.fullName || item.username}
                    secondary={item.username !== item.fullName ? `@${item.username}` : undefined}
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  }
);

MentionList.displayName = 'MentionList';
