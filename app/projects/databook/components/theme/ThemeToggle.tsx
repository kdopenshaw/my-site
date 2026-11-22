import { useEffect, useState } from 'react';

export const THEME_STORAGE_KEY = 'databook-theme';

function readIsDark(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light') return false;
    if (stored === 'dark') return true;
  } catch {
    // ignore
  }
  // Dark is the product default when nothing is stored yet.
  return true;
}

function applyDark(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
  } catch {
    // Storage can be unavailable; class toggle still works for the session.
  }
}

/** Sets/removes class `dark` on <html>; no ThemeProvider library. */
export function ThemeToggle() {
  const [dark, setDark] = useState(readIsDark);

  useEffect(() => {
    applyDark(dark);
  }, [dark]);

  const next = dark ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="dbk-theme-toggle"
      onClick={() => setDark((d) => !d)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.25" />
          <path
            d="M8 1.75v1.5M8 12.75v1.5M1.75 8h1.5M12.75 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M3.4 12.6l1.06-1.06M11.54 4.46l1.06-1.06"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M13.5 8.7A5.75 5.75 0 1 1 7.3 2.5 4.5 4.5 0 0 0 13.5 8.7z"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
