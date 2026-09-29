/**
 * Constructs the full URL for uploaded files.
 * Images are stored as relative paths like "/uploads/venues/abc.jpg" in the DB,
 * but they're served by the backend (not the frontend dev server).
 */
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/api\/v\d+$/, '');

export function getUploadUrl(path: string | undefined | null): string {
  if (!path) return '';
  // Already a full URL (e.g. unsplash fallback)
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Relative upload path — prepend backend origin
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}
