// services/sanitize.ts
import DOMPurify from 'dompurify';

export function sanitize(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],  // Strip ALL HTML by default
    ALLOWED_ATTR: [],
  });
}

export function sanitizeRichText(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'li'],
    ALLOWED_ATTR: [],
  });
}
