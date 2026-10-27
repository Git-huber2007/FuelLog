/* global document, localStorage */
// Applies the saved theme before first paint so the page never flashes the other one. A file, not inline: the CSP is script-src 'self'.
try {
  var theme = localStorage.getItem('theme');
  if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme);
} catch {
  // Storage blocked: follow the system theme.
}
