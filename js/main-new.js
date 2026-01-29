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
  }

  /**
   * Initialize application
   */
  async init() {
    try {
      // Initialize theme first (for visual consistency)
      this.theme.init();
      
      // Load SVGs
      await this.svgLoader.init();
      
      // Initialize i18n
      this.i18n.init();
      
      console.log('Portfolio app initialized successfully');
    } catch (error) {
      console.error('Error initializing portfolio app:', error);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new PortfolioApp();
  app.init();
});
