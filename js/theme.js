// Licht/donker-schakelaar. De keuze wordt bewaard in localStorage en
// vóór de CSS geladen wordt al op <html> gezet (inline script in <head>),
// zodat er geen flits van het verkeerde thema is.

const KEY = 'pb-theme';

export function initTheme(onChange) {
  const root = document.documentElement;

  // ?theme=light of ?theme=dark wint van de bewaarde keuze. Nodig omdat de
  // site in een iframe getoond wordt (Pixelshift-portfolio): dat is een ander
  // origin, dus daar valt van buitenaf geen localStorage te zetten.
  const read = () => {
    try {
      const q = new URLSearchParams(location.search).get('theme');
      if (q === 'light' || q === 'dark') return q;
      return localStorage.getItem(KEY) || 'light';
    } catch { return 'light'; }
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
