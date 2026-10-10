/**
 * URL validation and sanitization utility for external scheme links.
 * Prevents javascript:, data:, vbscript: and other dangerous pseudo-protocols from execution.
 */

/**
 * Validates whether a given URL string has a valid http: or https: scheme.
 */
export function isValidHttpUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Sanitizes a URL for use in href attributes.
 * Returns the validated URL string if safe (http/https).
 * If invalid or using dangerous protocols, returns fallback ('#' or provided fallback).
 */
export function sanitizeSafeUrl(
  url: string | undefined | null,
  fallback = '#'
): string {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // Block javascript:, data:, and vbscript: case-insensitively
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
    return fallback;
  } catch {
    return fallback;
  }
}
