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

      // Prevent flicker on responsive resize
      this.initResizeGuard();

      // Initialize section collapses
      this.initSectionToggles();
      
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
    const media = window.matchMedia('(min-width: 769px)');

    const closeMenu = () => {
      if (!body.classList.contains('menu-open')) return;
      body.classList.remove('menu-open');
      body.classList.add('menu-closing');
      this.menuToggle.setAttribute('aria-expanded', 'false');
      window.setTimeout(() => {
        body.classList.remove('menu-closing');
      }, 200);
    };

    const toggleMenu = () => {
      if (body.classList.contains('menu-open')) {
        closeMenu();
        return;
      }
      body.classList.remove('menu-closing');
      body.classList.add('menu-open');
      this.menuToggle.setAttribute('aria-expanded', 'true');
    };

    this.menuToggle.addEventListener('click', toggleMenu);
    navLinks.forEach(link => link.addEventListener('click', closeMenu));
    if (nav) {
      nav.addEventListener('click', event => {
        if (event.target.closest('.nav-panel')) return;
        closeMenu();
      });
    }
    media.addEventListener('change', event => {
      if (event.matches) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  /**
   * Disable transitions during resize to prevent flicker
   */
  initResizeGuard() {
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      document.body.classList.add('no-transition');
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        document.body.classList.remove('no-transition');
      }, 120);
    });
  }

  /**
   * Collapsible sections (keep title, toggle content)
   */
  initSectionToggles() {
    document.querySelectorAll('section .section-title .section-toggle').forEach(button => {
      const section = button.closest('section');
      const title = button.closest('.section-title');
      const contentId = button.getAttribute('aria-controls');
      const content = contentId ? document.getElementById(contentId) : null;
      if (!section || !content) return;

      const setState = collapsed => {
        section.classList.toggle('section-collapsed', collapsed);
        button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        if (!collapsed) {
          content.style.maxHeight = content.scrollHeight + 'px';
        } else {
          content.style.maxHeight = '0px';
        }
      };

      setState(false);

      button.addEventListener('click', () => {
        const isCollapsed = section.classList.contains('section-collapsed');
        setState(!isCollapsed);
      });

      if (title) {
        title.addEventListener('click', event => {
          if (event.target.closest('.section-toggle')) return;
          const isCollapsed = section.classList.contains('section-collapsed');
          setState(!isCollapsed);
        });
      }

      window.addEventListener('resize', () => {
        if (!section.classList.contains('section-collapsed')) {
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    });
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new PortfolioApp();
  app.init();
});
