/**
 * Theme Manager Module
 * Handles light/dark theme switching with localStorage persistence
 */

export class ThemeManager {
  constructor() {
    this.html = document.documentElement;
    this.themeToggle = null;
    this.currentTheme = this.getStoredTheme();
  }

  /**
   * Initialize theme manager
   */
  init() {
    this.themeToggle = document.getElementById('theme-toggle');

    if (!this.themeToggle) {
      console.warn('[ThemeManager] Theme toggle button not found');
      return;
    }

    this.applyTheme(this.currentTheme);
    this.updateToggleIcon(this.currentTheme);
    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    this.themeToggle.addEventListener('click', () => {
      this.toggle();
    });
  }

  /**
   * Get theme from localStorage or system preference
   * @returns {'light' | 'dark'}
   */
  getStoredTheme() {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    // Fallback to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  /**
   * Apply theme to document
   * @param {'light' | 'dark'} theme
   */
  applyTheme(theme) {
    this.html.setAttribute('data-theme', theme);
    this.currentTheme = theme;
  }

  /**
   * Toggle between light and dark theme
   */
  toggle() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';

    this.applyTheme(newTheme);
    this.updateToggleIcon(newTheme);
    localStorage.setItem('theme', newTheme);
  }

  /**
   * Update toggle button icon
   * @param {'light' | 'dark'} theme
   */
  updateToggleIcon(theme) {
    if (!this.themeToggle) return;

    this.themeToggle.innerHTML =
      theme === 'dark' ? this.getMoonIcon() : this.getSunIcon();
  }

  /**
   * Sun icon SVG
   */
  getSunIcon() {
    return `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
        <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12
                 M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"
              stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
  }

  /**
   * Moon icon SVG
   */
  getMoonIcon() {
    return `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path d="M21 12.79A9 9 0 1111.21 3
                 7 7 0 0021 12.79z"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
}
