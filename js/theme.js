// Licht/donker-schakelaar. De keuze wordt bewaard in localStorage en
// vóór de CSS geladen wordt al op <html> gezet (inline script in <head>),
// zodat er geen flits van het verkeerde thema is.

const KEY = 'pb-theme';

export function initTheme(onChange) {
  const root = document.documentElement;

  const read = () => {
    try { return localStorage.getItem(KEY) || 'dark'; } catch { return 'dark'; }
  };
  const store = (t) => { try { localStorage.setItem(KEY, t); } catch { /* private mode */ } };

  const apply = (t) => {
    root.dataset.theme = t;
    document.querySelectorAll('.tt-label').forEach((l) => {
      l.textContent = t === 'dark' ? 'LICHT' : 'DONKER';
    });
    if (onChange) onChange(t);
  };

  let theme = read();
  apply(theme);

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      store(theme);
      apply(theme);
    });
  });

  return () => theme;
}
