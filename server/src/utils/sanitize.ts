export function sanitize(dirty: string): string {
  if (!dirty) return '';
  // Strip all HTML tags
  let clean = dirty.replace(/<[^>]*>/g, '');
  // Escape HTML entities to prevent XSS
  clean = clean
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  return clean;
}

export function sanitizeRichText(dirty: string): string {
  if (!dirty) return '';
  // Allow simple tags: b, i, em, strong, p, br, ul, li
  // We'll strip any tag that is not in the whitelist
  let clean = dirty.replace(/<(?!(\/?(b|i|em|strong|p|br|ul|li))\b)[^>]*>/gi, '');
  
  // Strip dangerous attributes (javascript:, onerror, onload, etc.)
  clean = clean.replace(/on\w+\s*=/gi, 'x-on=');
  clean = clean.replace(/javascript:/gi, 'x-javascript:');
  return clean;
}
