(function () {
  const KEY = 'theme';
  const root = document.documentElement;

  function readStored() {
    try {
      const value = window.localStorage.getItem(KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      return null;
    }
  }

  function preferredTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function persist(theme) {
    try {
      window.localStorage.setItem(KEY, theme);
    } catch {
      // Storage can be blocked or full; the theme still applies for this page view.
    }
  }

  function wireToggle() {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    const isDark = () => root.getAttribute('data-theme') === 'dark';
    const sync = () => button.setAttribute('aria-pressed', String(isDark()));
    button.hidden = false;
    sync();
    button.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      sync();
      persist(next);
    });
  }

  // Runs in <head> without defer so the theme is set before first paint.
  root.setAttribute('data-theme', readStored() || preferredTheme());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireToggle);
  } else {
    wireToggle();
  }
})();
