const THEME_STORAGE_KEY = 'yanming-theme';
const root = document.documentElement;

function readTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === 'day' || savedTheme === 'night' ? savedTheme : 'day';
  } catch {
    return 'day';
  }
}

function renderThemeControl(control, theme) {
  const isNight = theme === 'night';
  control.textContent = isNight
    ? ['  _', ' / )', '(_/'].join('\n')
    : ['\\ | /', '- * -', '/ | \\'].join('\n');
  control.setAttribute('aria-label', isNight ? '当前为夜间配色，切换到日间' : '当前为日间配色，切换到夜间');
  control.setAttribute('aria-pressed', String(!isNight));
}

function setTheme(theme, save = false) {
  root.dataset.theme = theme;
  root.style.colorScheme = theme === 'night' ? 'dark' : 'light';
  document.querySelectorAll('.theme-toggle').forEach((control) => renderThemeControl(control, theme));

  if (save) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
  }
}

setTheme(readTheme());

window.addEventListener('DOMContentLoaded', () => {
  setTheme(root.dataset.theme);
  document.querySelectorAll('.theme-toggle').forEach((control) => {
    control.addEventListener('click', () => {
      setTheme(root.dataset.theme === 'night' ? 'day' : 'night', true);
    });
  });
});
