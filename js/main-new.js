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

      // Initialize view mode (employer/person)
      this.initViewMode();
      
      // Initialize scene switcher
      this.initSceneSwitcher();

      // Initialize custom scrollbar (scene window)
      this.initCustomScrollbar();

      // Prevent scroll chaining between scene window and page
      this.initScrollGuard();

      // Section lock between main-header and scene-window
      this.initSectionLock();

      // Initialize scrollbar theme swap
      this.initScrollbarTheme();

      // Initialize page scrollbar (full page)
      this.initPageScrollbar();
      
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
   * View mode switcher (employer vs person)
   */
  initViewMode() {
    const body = document.body;
    const toggle = document.getElementById('view-toggle');
    const label = document.querySelector('[data-view-label]');
    const tabs = document.querySelectorAll('[data-view-mode]');
    const textTargets = document.querySelectorAll('[data-view-text-employer], [data-view-text-person]');
    const langToggle = document.getElementById('lang-toggle');

    if (!tabs.length && !toggle) return;

    const modes = ['employer', 'person'];
    const labels = {
      employer: 'HR',
      person: 'ME'
    };

    let currentMode = body.dataset.viewMode && modes.includes(body.dataset.viewMode)
      ? body.dataset.viewMode
      : 'employer';

    const applyMode = mode => {
      if (!modes.includes(mode)) return;
      currentMode = mode;
      body.dataset.viewMode = mode;

      tabs.forEach(tab => {
        const isActive = tab.getAttribute('data-view-mode') === mode;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      if (label) {
        label.textContent = labels[mode] || mode;
      }

      if (toggle) {
        toggle.setAttribute('aria-pressed', mode === 'person' ? 'true' : 'false');
      }

      textTargets.forEach(el => {
        const text = mode === 'employer'
          ? el.dataset.viewTextEmployer
          : el.dataset.viewTextPerson;
        if (text) {
          el.textContent = text;
        }
      });

      document.dispatchEvent(new CustomEvent('viewmodechange', { detail: { mode } }));
    };

    if (toggle) {
      toggle.addEventListener('click', () => {
        const nextMode = currentMode === 'employer' ? 'person' : 'employer';
        applyMode(nextMode);
      });
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.getAttribute('data-view-mode');
        if (mode) applyMode(mode);
      });
    });

    if (langToggle) {
      langToggle.addEventListener('click', () => {
        window.setTimeout(() => applyMode(currentMode), 0);
      });
    }

    window.setViewMode = applyMode;

    applyMode(currentMode);
  }

  /**
   * Scene window: show one section at a time with arrows
   */
  initSceneSwitcher() {
    const sceneWindow = document.getElementById('scene-window');
    if (!sceneWindow) return;

    const scenes = Array.from(document.querySelectorAll('section.scene'));
    if (!scenes.length) return;

    const controls = sceneWindow.querySelector('[data-scene-controls]');
    const tabsContainer = sceneWindow.querySelector('.scene-tabs');
    const prevBtn = sceneWindow.querySelector('[data-scene-prev]');
    const nextBtn = sceneWindow.querySelector('[data-scene-next]');

    const getVisibleScenes = () => {
      const mode = document.body.dataset.viewMode;
      return scenes.filter(scene => {
        const view = scene.getAttribute('data-view');
        if (!view || !mode) return true;
        return view.split(/\s+/).includes(mode);
      });
    };

    let currentIndex = 0;

    const getSceneLabel = scene => {
      const title = scene.querySelector('.section-title-text');
      return title ? title.textContent.trim() : scene.id;
    };

    const getSceneIcon = scene => {
      const icon = scene.querySelector('.section-title-icon');
      return icon ? icon.getAttribute('data-svg') : null;
    };

    const syncTabs = () => {
      if (!tabsContainer) return;
      const visible = getVisibleScenes();
      const visibleIds = new Set(visible.map(scene => scene.id));
      tabsContainer.querySelectorAll('.scene-tab').forEach(tab => {
        const id = tab.getAttribute('data-scene-target');
        tab.style.display = visibleIds.has(id) ? '' : 'none';
        const scene = scenes.find(scene => scene.id === id);
        const label = getSceneLabel(scene) || id;
        const textEl = tab.querySelector('.scene-tab-text');
        if (textEl) textEl.textContent = label;
      });
    };

    const setActive = scene => {
      const current = document.querySelector('section.scene.scene-active');

      if (current && current !== scene) {
        current.classList.remove('scene-active');
        current.classList.add('scene-exit');
        current.style.display = 'block';
        window.setTimeout(() => {
          current.classList.remove('scene-exit');
          current.style.display = 'none';
        }, 200);
      }

      scenes.forEach(item => {
        if (item !== scene) {
          item.classList.remove('scene-active');
          item.style.display = 'none';
        }
      });

      scene.classList.add('scene-active');
      scene.style.display = 'block';
      if (tabsContainer) {
        tabsContainer.querySelectorAll('.scene-tab').forEach(tab => {
          tab.classList.toggle('is-active', tab.getAttribute('data-scene-target') === scene.id);
        });
      }
      syncTabs();
      document.dispatchEvent(new CustomEvent('scenechange', { detail: { id: scene.id } }));
    };

    const showByIndex = index => {
      const visible = getVisibleScenes();
      if (!visible.length) return null;
      const nextIndex = ((index % visible.length) + visible.length) % visible.length;
      currentIndex = nextIndex;
      const scene = visible[nextIndex];
      setActive(scene);
      return scene;
    };

    const showById = id => {
      const visible = getVisibleScenes();
      const index = visible.findIndex(scene => scene.id === id);
      if (index === -1) return null;
      return showByIndex(index);
    };

    if (tabsContainer) {
      tabsContainer.innerHTML = '';
      scenes.forEach(scene => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'scene-tab';
        tab.setAttribute('role', 'tab');
        tab.setAttribute('data-scene-target', scene.id);

        const iconSrc = getSceneIcon(scene);
        const iconEl = document.createElement('span');
        iconEl.className = 'scene-tab-icon';
        if (iconSrc) iconEl.setAttribute('data-svg', iconSrc);

        const textEl = document.createElement('span');
        textEl.className = 'scene-tab-text';
        textEl.textContent = getSceneLabel(scene);

        tab.appendChild(iconEl);
        tab.appendChild(textEl);
        tab.addEventListener('click', () => showById(scene.id));
        tabsContainer.appendChild(tab);
      });

      if (this.svgLoader) {
        this.svgLoader.loadAll(tabsContainer.querySelectorAll('[data-svg]'));
      }
    }

    const hash = window.location.hash ? window.location.hash.slice(1) : '';
    if (!showById(hash)) {
      showByIndex(0);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => showByIndex(currentIndex - 1));
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => showByIndex(currentIndex + 1));
    }

    document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
      link.addEventListener('click', event => {
        const targetId = link.getAttribute('href')?.slice(1);
        if (!targetId) return;
        const targetScene = scenes.find(scene => scene.id === targetId);
        if (!targetScene) return;

        event.preventDefault();

        const viewAttr = targetScene.getAttribute('data-view');
        const currentMode = document.body.dataset.viewMode;
        if (viewAttr && currentMode && !viewAttr.split(/\s+/).includes(currentMode)) {
          const nextMode = viewAttr.split(/\s+/)[0];
          if (window.setViewMode) {
            window.setViewMode(nextMode);
          }
        }

        showById(targetId);
        sceneWindow.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    document.addEventListener('viewmodechange', () => {
      const active = document.querySelector('section.scene.scene-active');
      const activeId = active?.id;
      if (activeId && showById(activeId)) return;
      showByIndex(0);
    });
  }

  /**
   * Custom scrollbar for scene window (cross-browser)
   */
  initCustomScrollbar() {
    const sceneWindow = document.getElementById('scene-window');
    if (!sceneWindow) return;

    const content = sceneWindow.querySelector('.scene-window-content');
    const scrollbar = sceneWindow.querySelector('[data-scene-scrollbar]');
    const track = sceneWindow.querySelector('[data-scrollbar-track]');
    const thumb = sceneWindow.querySelector('[data-scrollbar-thumb]');
    const btnUp = sceneWindow.querySelector('[data-scrollbar-up]');
    const btnDown = sceneWindow.querySelector('[data-scrollbar-down]');

    if (!content || !scrollbar || !track || !thumb) return;

    sceneWindow.classList.add('custom-scrollbar-ready');

    let rafId = null;
    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;

    const update = () => {
      const scrollHeight = content.scrollHeight;
      const clientHeight = content.clientHeight;
      const maxScrollTop = Math.max(scrollHeight - clientHeight, 0);
      const trackHeight = track.clientHeight;

      const hasScroll = maxScrollTop > 1;
      scrollbar.classList.toggle('is-hidden', !hasScroll);
      if (!hasScroll) {
        thumb.style.transform = 'translateY(0)';
        return;
      }

      const minThumb = 32;
      const rawThumb = (clientHeight / scrollHeight) * trackHeight;
      const thumbHeight = Math.max(Math.min(rawThumb, trackHeight), minThumb);
      const maxThumbTop = Math.max(trackHeight - thumbHeight, 0);

      const ratio = maxScrollTop > 0 ? content.scrollTop / maxScrollTop : 0;
      const thumbTop = ratio * maxThumbTop;

      thumb.style.height = `${thumbHeight}px`;
      thumb.style.transform = `translateY(${thumbTop}px)`;
    };

    const requestUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        update();
      });
    };

    const scrollByStep = delta => {
      content.scrollBy({ top: delta, behavior: 'smooth' });
    };

    content.addEventListener('scroll', requestUpdate);
    window.addEventListener('resize', requestUpdate);
    document.addEventListener('scenechange', requestUpdate);
    document.addEventListener('viewmodechange', requestUpdate);

    if (btnUp) {
      btnUp.addEventListener('click', () => scrollByStep(-120));
    }
    if (btnDown) {
      btnDown.addEventListener('click', () => scrollByStep(120));
    }

    track.addEventListener('pointerdown', event => {
      if (event.target === thumb) return;
      const rect = track.getBoundingClientRect();
      const clickY = event.clientY - rect.top;
      const thumbHeight = thumb.offsetHeight;
      const maxThumbTop = Math.max(rect.height - thumbHeight, 0);
      const targetThumbTop = Math.min(Math.max(clickY - thumbHeight / 2, 0), maxThumbTop);
      const maxScrollTop = Math.max(content.scrollHeight - content.clientHeight, 0);
      if (maxThumbTop > 0) {
        content.scrollTop = (targetThumbTop / maxThumbTop) * maxScrollTop;
      }
    });

    thumb.addEventListener('pointerdown', event => {
      event.preventDefault();
      isDragging = true;
      startY = event.clientY;
      startScrollTop = content.scrollTop;
      thumb.classList.add('is-dragging');
      thumb.setPointerCapture(event.pointerId);
    });

    thumb.addEventListener('pointermove', event => {
      if (!isDragging) return;
      const trackHeight = track.clientHeight;
      const thumbHeight = thumb.offsetHeight;
      const maxThumbTop = Math.max(trackHeight - thumbHeight, 0);
      const maxScrollTop = Math.max(content.scrollHeight - content.clientHeight, 0);
      if (maxThumbTop <= 0) return;
      const delta = event.clientY - startY;
      const scrollDelta = (delta / maxThumbTop) * maxScrollTop;
      content.scrollTop = startScrollTop + scrollDelta;
    });

    const stopDrag = event => {
      if (!isDragging) return;
      isDragging = false;
      thumb.classList.remove('is-dragging');
      if (event?.pointerId) {
        thumb.releasePointerCapture(event.pointerId);
      }
    };

    thumb.addEventListener('pointerup', stopDrag);
    thumb.addEventListener('pointercancel', stopDrag);
    document.addEventListener('pointerup', stopDrag);

    requestUpdate();
  }

  /**
   * Prevent scroll chaining between scene window and page scroll
   */
  initScrollGuard() {
    const content = document.querySelector('.scene-window-content');
    if (!content) return;

    const onWheel = event => {
      if (event.deltaY === 0) return;
      const atTop = content.scrollTop <= 0;
      const atBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 1;
      const scrollingDown = event.deltaY > 0;
      const canScroll = (scrollingDown && !atBottom) || (!scrollingDown && !atTop);

      if (!canScroll) return;
      event.preventDefault();
      content.scrollTop += event.deltaY;
    };

    content.addEventListener('wheel', onWheel, { passive: false });
  }

  /**
   * Hard section lock between #main-header and #scene-window
   */
  initSectionLock() {
    const sections = [
      document.getElementById('main-header'),
      document.getElementById('scene-window')
    ].filter(Boolean);
    if (sections.length < 2) return;

    const getOffsets = () => {
      const header = document.querySelector('.header');
      const headerHeight = header ? header.getBoundingClientRect().height || 0 : 0;
      const paddingX = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--padding-x')) || 0;
      return { headerHeight, paddingX };
    };

    const getPositions = () => {
      const { headerHeight, paddingX } = getOffsets();
      const targetOffset = Math.max(headerHeight - (paddingX - paddingX * 2), 0);
      return sections.map(section => Math.max(section.offsetTop - targetOffset, 0));
    };

    const getClosestIndex = () => {
      const positions = getPositions();
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      let best = 0;
      let bestDist = Infinity;
      positions.forEach((pos, idx) => {
        const dist = Math.abs(scrollTop - pos);
        if (dist < bestDist) {
          bestDist = dist;
          best = idx;
        }
      });
      return best;
    };

    let isAnimating = false;
    let scrollTimer = null;

    const scrollToIndex = index => {
      const positions = getPositions();
      const nextIndex = Math.max(0, Math.min(index, positions.length - 1));
      const targetTop = positions[nextIndex];
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      if (Math.abs(scrollTop - targetTop) < 2) return;
      isAnimating = true;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
      window.setTimeout(() => {
        isAnimating = false;
      }, 500);
    };

    const shouldIgnore = (event, deltaY) => {
      if (event?.defaultPrevented) return true;
      const content = event?.target?.closest?.('.scene-window-content');
      if (!content) return false;
      const atTop = content.scrollTop <= 0;
      const atBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 1;
      const scrollingDown = deltaY > 0;
      if ((scrollingDown && !atBottom) || (!scrollingDown && !atTop)) {
        return true;
      }
      return false;
    };

    const onWheel = event => {
      if (isAnimating) {
        event.preventDefault();
        return;
      }
      const deltaY = event.deltaY || 0;
      if (deltaY === 0) return;
      if (shouldIgnore(event, deltaY)) return;
      event.preventDefault();
      const direction = deltaY > 0 ? 1 : -1;
      const index = getClosestIndex();
      scrollToIndex(index + direction);
    };

    const onScroll = () => {
      if (isAnimating) return;
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        if (isAnimating) return;
        const index = getClosestIndex();
        scrollToIndex(index);
      }, 120);
    };

    let touchStartY = 0;
    let touchTarget = null;

    const onTouchStart = event => {
      if (event.touches.length !== 1) return;
      touchStartY = event.touches[0].clientY;
      touchTarget = event.target;
    };

    const onTouchEnd = event => {
      if (!touchTarget) return;
      const endY = event.changedTouches[0].clientY;
      const deltaY = touchStartY - endY;
      if (Math.abs(deltaY) < 24) return;
      const fakeEvent = { target: touchTarget, defaultPrevented: false };
      if (shouldIgnore(fakeEvent, deltaY)) return;
      const direction = deltaY > 0 ? 1 : -1;
      const index = getClosestIndex();
      scrollToIndex(index + direction);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  /**
   * Swap colors inside thumb.svg based on theme (single file)
   */
  initScrollbarTheme() {
    const root = document.documentElement;
    const assets = [
      { key: 'thumb', path: 'assets/svg/scrollbar/thumb.svg', cssVar: '--scrollbar-thumb' },
      { key: 'track', path: 'assets/svg/scrollbar/track.svg', cssVar: '--scrollbar-track' },
      { key: 'arrowUp', path: 'assets/svg/scrollbar/arrow-up.svg', cssVar: '--scrollbar-arrow-up' },
      { key: 'arrowDown', path: 'assets/svg/scrollbar/arrow-down.svg', cssVar: '--scrollbar-arrow-down' }
    ];
    const cache = new Map();

    const encodeSvg = svg =>
      encodeURIComponent(svg)
        .replace(/'/g, '%27')
        .replace(/\"/g, '%22');

    const swapColors = svg => {
      const placeholderBlack = '__BLACK__';
      const placeholderWhite = '__WHITE__';
      return svg
        .replace(/#000000/gi, placeholderBlack)
        .replace(/#ffffff/gi, placeholderWhite)
        .replace(/\bblack\b/gi, placeholderBlack)
        .replace(/\bwhite\b/gi, placeholderWhite)
        .replace(new RegExp(placeholderBlack, 'g'), '#ffffff')
        .replace(new RegExp(placeholderWhite, 'g'), '#000000');
    };

    const applyThumb = async () => {
      try {
        const theme = root.getAttribute('data-theme') || 'light';
        for (const asset of assets) {
          let svgText = cache.get(asset.key);
          if (!svgText) {
            const res = await fetch(asset.path);
            if (!res.ok) continue;
            svgText = await res.text();
            cache.set(asset.key, svgText);
          }

          const svg = theme === 'dark' ? swapColors(svgText) : svgText;
          const dataUrl = `url(\"data:image/svg+xml;utf8,${encodeSvg(svg)}\")`;
          root.style.setProperty(asset.cssVar, dataUrl);
        }
      } catch (err) {
        console.warn('[ScrollbarTheme] Failed to apply scrollbar SVGs', err);
      }
    };

    applyThumb();

    const observer = new MutationObserver(() => {
      applyThumb();
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /**
   * Custom scrollbar for full page (cross-browser)
   */
  initPageScrollbar() {
    const root = document.documentElement;
    const body = document.body;
    const scrollbar = document.querySelector('[data-page-scrollbar]');
    const track = document.querySelector('[data-page-scrollbar-track]');
    const thumb = document.querySelector('[data-page-scrollbar-thumb]');
    const btnUp = document.querySelector('[data-page-scrollbar-up]');
    const btnDown = document.querySelector('[data-page-scrollbar-down]');
    const scrollEl = document.scrollingElement || root;

    if (!scrollbar || !track || !thumb || !scrollEl) return;

    root.classList.add('custom-page-scrollbar');
    body.classList.add('custom-page-scrollbar');

    let rafId = null;
    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;

    const update = () => {
      const scrollHeight = scrollEl.scrollHeight;
      const clientHeight = scrollEl.clientHeight;
      const maxScrollTop = Math.max(scrollHeight - clientHeight, 0);
      const trackHeight = track.clientHeight;
      const insetTop = btnUp ? btnUp.offsetHeight : 0;
      const insetBottom = btnDown ? btnDown.offsetHeight : 0;
      const usableHeight = Math.max(trackHeight - insetTop - insetBottom, 0);

      const hasScroll = maxScrollTop > 1;
      scrollbar.classList.toggle('is-hidden', !hasScroll);
      if (!hasScroll) {
        thumb.style.transform = 'translateY(0)';
        return;
      }

      const minThumb = 32;
      const rawThumb = (clientHeight / scrollHeight) * usableHeight;
      const thumbHeight = Math.max(Math.min(rawThumb, usableHeight || 0), minThumb);
      const maxThumbTop = Math.max(usableHeight - thumbHeight, 0);

      const ratio = maxScrollTop > 0 ? scrollEl.scrollTop / maxScrollTop : 0;
      const thumbTop = insetTop + ratio * maxThumbTop;

      thumb.style.height = `${thumbHeight}px`;
      thumb.style.transform = `translateY(${thumbTop}px)`;
    };

    const requestUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        update();
      });
    };

    const scrollByStep = delta => {
      scrollEl.scrollBy({ top: delta, behavior: 'smooth' });
    };

    window.addEventListener('scroll', requestUpdate);
    window.addEventListener('resize', requestUpdate);

    if (btnUp) {
      btnUp.addEventListener('click', () => scrollByStep(-120));
    }
    if (btnDown) {
      btnDown.addEventListener('click', () => scrollByStep(120));
    }

    track.addEventListener('pointerdown', event => {
      if (event.target === thumb) return;
      const rect = track.getBoundingClientRect();
      const clickY = event.clientY - rect.top;
      const insetTop = btnUp ? btnUp.offsetHeight : 0;
      const insetBottom = btnDown ? btnDown.offsetHeight : 0;
      const usableHeight = Math.max(rect.height - insetTop - insetBottom, 0);
      const thumbHeight = thumb.offsetHeight;
      const maxThumbTop = Math.max(usableHeight - thumbHeight, 0);
      const targetThumbTop = Math.min(Math.max(clickY - insetTop - thumbHeight / 2, 0), maxThumbTop);
      const maxScrollTop = Math.max(scrollEl.scrollHeight - scrollEl.clientHeight, 0);
      if (maxThumbTop > 0) {
        scrollEl.scrollTop = (targetThumbTop / maxThumbTop) * maxScrollTop;
      }
    });

    thumb.addEventListener('pointerdown', event => {
      event.preventDefault();
      isDragging = true;
      startY = event.clientY;
      startScrollTop = scrollEl.scrollTop;
      thumb.classList.add('is-dragging');
      thumb.setPointerCapture(event.pointerId);
    });

    thumb.addEventListener('pointermove', event => {
      if (!isDragging) return;
      const trackHeight = track.clientHeight;
      const insetTop = btnUp ? btnUp.offsetHeight : 0;
      const insetBottom = btnDown ? btnDown.offsetHeight : 0;
      const usableHeight = Math.max(trackHeight - insetTop - insetBottom, 0);
      const thumbHeight = thumb.offsetHeight;
      const maxThumbTop = Math.max(usableHeight - thumbHeight, 0);
      const maxScrollTop = Math.max(scrollEl.scrollHeight - scrollEl.clientHeight, 0);
      if (maxThumbTop <= 0) return;
      const delta = event.clientY - startY;
      const scrollDelta = (delta / maxThumbTop) * maxScrollTop;
      scrollEl.scrollTop = startScrollTop + scrollDelta;
    });

    const stopDrag = event => {
      if (!isDragging) return;
      isDragging = false;
      thumb.classList.remove('is-dragging');
      if (event?.pointerId) {
        thumb.releasePointerCapture(event.pointerId);
      }
    };

    thumb.addEventListener('pointerup', stopDrag);
    thumb.addEventListener('pointercancel', stopDrag);
    document.addEventListener('pointerup', stopDrag);

    requestUpdate();
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new PortfolioApp();
  app.init();
});
