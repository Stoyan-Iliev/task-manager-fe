import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Configured to allow only safe HTML tags used by the TipTap rich text editor.
 */
export const sanitizeHtml = (html: string | null | undefined): string => {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      // Text formatting
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      // Headings
      'h1', 'h2', 'h3',
      // Lists
      'ul', 'ol', 'li',
      // Other block elements
      'blockquote', 'pre', 'code', 'hr',
      // Links
      'a',
      // TipTap specific (mentions, task lists)
      'span', 'label', 'input', 'div',
    ],
    ALLOWED_ATTR: [
      // Link attributes
      'href', 'target', 'rel',
      // Styling
      'class',
      // TipTap mention attributes
      'data-type', 'data-id', 'data-label',
      // Task list attributes
      'data-checked', 'type', 'checked',
    ],
    // Force links to open in new tab safely
    ADD_ATTR: ['target', 'rel'],
    // Prevent javascript: URLs
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
};

/**
 * Strict sanitization that removes all HTML tags.
 * Use for plain text contexts where no HTML is expected.
 */
export const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return '';

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};
