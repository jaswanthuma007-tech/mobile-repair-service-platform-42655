/**
 * Ocean Professional theme tokens (JS-side).
 * CSS is the main source of truth; this file is useful for inline styles and future theming needs.
 */
export const theme = {
  colors: {
    primary: '#2563EB',
    accent: '#F59E0B',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    error: '#EF4444'
  }
};

/**
 * PUBLIC_INTERFACE
 * Returns inline transition styles for subtle, consistent motion.
 */
export function motion(durationMs = 180) {
  return {
    transition: `transform ${durationMs}ms ease, box-shadow ${durationMs}ms ease, opacity ${durationMs}ms ease`
  };
}
