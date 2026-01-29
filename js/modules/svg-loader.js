/**
 * SVG Loader Module
 * Dynamically loads SVG files into DOM elements
 */

export class SVGLoader {
  constructor() {
    this.loadedSVGs = new Map();
  }

  /**
   * Initialize SVG loader
   */
  async init() {
    const elements = document.querySelectorAll('[data-svg]');
    await this.loadAll(elements);
  }

  /**
   * Load all SVG elements
   * @param {NodeList} elements - Elements with data-svg attribute
   */
  async loadAll(elements) {
    const promises = Array.from(elements).map(el => this.loadSVG(el));
    await Promise.all(promises);
  }

  /**
   * Load single SVG file
   * @param {HTMLElement} element - Element to load SVG into
   */
  async loadSVG(element) {
    const src = element.getAttribute('data-svg');
    
    if (!src) {
      console.warn('SVG source not specified for element:', element);
      return;
    }

    try {
      // Check cache first
      let svgText = this.loadedSVGs.get(src);
      
      if (!svgText) {
        const response = await fetch(src);
        
        if (!response.ok) {
          throw new Error(`Failed to load SVG: ${response.statusText}`);
        }
        
        svgText = await response.text();
        this.loadedSVGs.set(src, svgText);
      }
      
      element.innerHTML = svgText;
    } catch (error) {
      console.error(`Error loading SVG from ${src}:`, error);
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.loadedSVGs.clear();
  }

  /**
   * Reload specific SVG
   * @param {string} selector - CSS selector for element
   */
  async reload(selector) {
    const element = document.querySelector(selector);
    if (element) {
      const src = element.getAttribute('data-svg');
      this.loadedSVGs.delete(src);
      await this.loadSVG(element);
    }
  }
}