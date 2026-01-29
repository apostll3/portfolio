/**
 * Internationalization Manager Module
 * Handles language switching and translation
 */

import { translations } from '../config/translations.js';

export class I18nManager {
  constructor() {
    this.html = document.documentElement;
    this.langToggle = null;
    this.currentLang = this.getStoredLanguage();
    this.translations = translations;
  }

  /**
   * Initialize i18n manager
   */
  init() {
    this.langToggle = document.getElementById('lang-toggle');

    if (!this.langToggle) {
      console.warn('[I18nManager] Language toggle button not found');
      return;
    }

    this.applyLanguage(this.currentLang);
    this.updateToggleButton(this.currentLang);
    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    this.langToggle.addEventListener('click', () => {
      this.toggle();
    });
  }

  /**
   * Get stored language or default to Ukrainian
   */
  getStoredLanguage() {
    return localStorage.getItem('lang') || 'ua';
  }

  /**
   * Apply language to document
   */
  applyLanguage(lang) {
    this.html.setAttribute('lang', lang);
    this.currentLang = lang;
    this.translatePage(lang);
  }

  /**
   * Toggle between Ukrainian and English
   */
  toggle() {
    const newLang = this.currentLang === 'ua' ? 'en' : 'ua';
    this.applyLanguage(newLang);
    this.updateToggleButton(newLang);
    localStorage.setItem('lang', newLang);
  }

  /**
   * Translate all elements with data-i18n attribute
   */
  translatePage(lang) {
    const t = this.translations[lang];
    if (!t) return;

    // Загальний переклад по data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (t[key]) {
        el.textContent = t[key];
      }
    });

    this.translateSectionTitles(t);
    this.translateBrandName(t);
  }

  /**
   * Translate section titles (h2, h3 etc.)
   * optional, якщо використовуєш data-i18n — можна залишити пустим
   */
  translateSectionTitles(t) {
    // Якщо всі заголовки мають data-i18n — тут нічого не потрібно
    // Метод залишений для архітектури / майбутнього
  }

  /**
   * Translate brand name
   */
  translateBrandName(t) {
    const brand = document.querySelector('[data-brand-name]');
    if (brand && t.brandName) {
      brand.textContent = t.brandName;
    }
  }

  /**
   * Update language toggle button
   */
  updateToggleButton(lang) {
    this.langToggle.innerHTML = `
      ${this.getLanguageIcon()}
      <span class="lang-text">${lang.toUpperCase()}</span>
    `;
  }

  /**
   * Language icon SVG
   */
  getLanguageIcon() {
    return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path d="M4 5h16M4 12h16M4 19h16"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round"/>
      </svg>
    `;
  }
}
