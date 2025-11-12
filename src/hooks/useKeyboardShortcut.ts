import { useEffect, useCallback } from 'react';

interface KeyboardShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

/**
 * Hook to register keyboard shortcuts
 * @param config Keyboard shortcut configuration
 * @param callback Function to call when shortcut is triggered
 * @param enabled Whether the shortcut is enabled (default: true)
 */
export const useKeyboardShortcut = (
  config: KeyboardShortcutConfig,
  callback: (e: KeyboardEvent) => void,
  enabled = true
) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if we're in an input field (don't trigger shortcuts while typing)
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Exception: Allow Cmd+K/Ctrl+K even in input fields
      const isCommandPalette =
        (config.metaKey || config.ctrlKey) && config.key.toLowerCase() === 'k';

      if (isInputField && !isCommandPalette) {
        return;
      }

      // Check if the key matches
      const keyMatches = event.key.toLowerCase() === config.key.toLowerCase();

      // Handle Cmd/Ctrl platform difference
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

      // If metaKey or ctrlKey is specified in config, handle cross-platform
      const hasCommandKey = config.metaKey || config.ctrlKey;
      let commandKeyMatches = true;

      if (hasCommandKey) {
        // Match Cmd on Mac or Ctrl on Windows/Linux
        commandKeyMatches = isMac ? event.metaKey : event.ctrlKey;

        // Also ensure the other modifier is NOT pressed
        if (isMac && event.ctrlKey) commandKeyMatches = false;
        if (!isMac && event.metaKey) commandKeyMatches = false;
      } else {
        // If no command key specified, ensure neither is pressed
        commandKeyMatches = !event.metaKey && !event.ctrlKey;
      }

      // Check other modifiers
      const shiftMatches = config.shiftKey === undefined
        ? !event.shiftKey
        : event.shiftKey === config.shiftKey;
      const altMatches = config.altKey === undefined
        ? !event.altKey
        : event.altKey === config.altKey;

      if (
        keyMatches &&
        commandKeyMatches &&
        shiftMatches &&
        altMatches
      ) {
        event.preventDefault();
        callback(event);
      }
    },
    [config, callback]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
};

/**
 * Format keyboard shortcut for display
 * @param config Keyboard shortcut configuration
 * @returns Formatted string (e.g., "⌘K" or "Ctrl+K")
 */
export const formatShortcut = (config: KeyboardShortcutConfig): string => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const parts: string[] = [];

  if (config.ctrlKey || config.metaKey) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (config.shiftKey) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (config.altKey) {
    parts.push(isMac ? '⌥' : 'Alt');
  }

  parts.push(config.key.toUpperCase());

  return isMac ? parts.join('') : parts.join('+');
};
