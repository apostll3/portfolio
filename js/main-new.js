/**
 * Portfolio Application Entry Point
 * Initializes all modules and manages app lifecycle
 */

import { ThemeManager } from './modules/theme.js';
import { I18nManager } from './modules/i18n.js';
import { SVGLoader } from './modules/svg-loader.js';

class PortfolioApp {
  constructor() {
    this.theme = new ThemeManager();
    this.i18n = new I18nManager();
    this.svgLoader = new SVGLoader();
    this.menuToggle = null;
  }

  /**
   * Initialize application
   */
  async init() {
    try {
      // Initialize theme first (for visual consistency)
      this.theme.init();

      // Initialize i18n
      this.i18n.init();

      // Load SVGs (after dynamic controls are rendered)
      await this.svgLoader.init();

      // Initialize mobile menu
      this.initMenu();
      
      console.log('Portfolio app initialized successfully');
    } catch (error) {
      console.error('Error initializing portfolio app:', error);
    }
  }

  /**
   * Initialize mobile menu toggle
   */
  initMenu() {
    this.menuToggle = document.getElementById('menu-toggle');
    if (!this.menuToggle) return;

    const body = document.body;
    const nav = document.querySelector('.nav');
    const navLinks = document.querySelectorAll('.nav-link');

    const closeMenu = () => {
      body.classList.remove('menu-open');
      this.menuToggle.setAttribute('aria-expanded', 'false');
    };

    const toggleMenu = () => {
      const isOpen = body.classList.toggle('menu-open');
      this.menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    };

    this.menuToggle.addEventListener('click', toggleMenu);
    navLinks.forEach(link => link.addEventListener('click', closeMenu));
    if (nav) {
      nav.addEventListener('click', event => {
        if (event.target.closest('.nav-panel')) return;
        closeMenu();
      });
    }
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu();
    });
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new PortfolioApp();
  app.init();
});
