import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Content Security Policy for the built site (GitHub Pages cannot send headers, so it is a meta
 * tag). Everything must come from the site itself: no inline scripts, no inline styles, no other
 * websites. There are no exceptions:
 * - the app has no inline scripts or style attributes (a lint rule and tests check for raw HTML)
 * - Chart.js sizes its canvas through the CSS object model, which style-src does not block
 * - downloads are made with blob: links, which are navigations, not fetches, so they are allowed
 * frame-ancestors (clickjacking protection) cannot be set in a meta tag; GitHub Pages would need
 * to send it as a header.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

/**
 * Adds the policy to the built index.html only. The development server injects an inline script
 * for hot reloading, which this policy would (correctly) block.
 */
function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`,
      );
    },
  };
}

export default defineConfig({
  // The app is served from https://<user>.github.io/eight-to-essentials/,
  // so every asset URL needs this prefix.
  base: '/eight-to-essentials/',
  plugins: [react(), contentSecurityPolicy()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.tsx'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
});
