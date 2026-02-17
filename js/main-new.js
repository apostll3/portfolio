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

      // Collapse header controls to one trigger on small screens
      this.initControlsDropdown();

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

      // Stable anchor scroll for header navigation
      this.initSectionAnchors();

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
    const navLinks = document.querySelectorAll('.nav-link, .nav-brand');
    const media = window.matchMedia('(min-width: 981px)');

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
   * Small screens: one controls trigger + dropdown panel
   */
  initControlsDropdown() {
    const controls = document.querySelector('.controls');
    const toggle = document.getElementById('controls-toggle');
    const panel = document.getElementById('controls-panel');
    const menuToggle = document.getElementById('menu-toggle');
    if (!controls || !toggle || !panel) return;

    const body = document.body;
    const media = window.matchMedia('(max-width: 600px)');

    const setOpen = isOpen => {
      body.classList.toggle('controls-open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    };

    const close = () => setOpen(false);

    toggle.addEventListener('click', event => {
      if (!media.matches) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(!body.classList.contains('controls-open'));
    });

    panel.addEventListener('click', event => {
      if (!media.matches) return;
      const button = event.target.closest('button');
      if (!button) return;
      close();
    });

    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        if (!media.matches) return;
        close();
      });
    }

    document.addEventListener('click', event => {
      if (!media.matches || !body.classList.contains('controls-open')) return;
      if (event.target.closest('.controls')) return;
      close();
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      close();
    });

    window.addEventListener('scroll', () => {
      if (!media.matches) return;
      close();
    }, { passive: true });

    media.addEventListener('change', event => {
      if (!event.matches) close();
    });

    close();
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
   * Main page sections used for lock/quick navigation
   */
  getMainSections() {
    return [
      document.getElementById('main-header'),
      document.getElementById('scene-window')
    ].filter(Boolean);
  }

  /**
   * Scroll offset to keep section below fixed header
   */
  getSectionScrollOffset() {
    const header = document.querySelector('.header');
    const headerHeight = header ? header.getBoundingClientRect().height || 0 : 0;
    const paddingX = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--padding-x')) || 0;
    return Math.max(headerHeight + paddingX, 0);
  }

  /**
   * Absolute target top for section scroll
   */
  getSectionTop(section) {
    if (!section) return 0;
    return Math.max(section.offsetTop - this.getSectionScrollOffset(), 0);
  }

  /**
   * Programmatic scroll to known section id
   */
  scrollToSectionById(sectionId, behavior = 'smooth') {
    const section = document.getElementById(sectionId);
    if (!section) return false;
    window.scrollTo({ top: this.getSectionTop(section), behavior });
    return true;
  }

  /**
   * Move to previous/next main section
   */
  scrollMainSectionByDirection(direction, behavior = 'smooth') {
    const sections = this.getMainSections();
    if (!sections.length) return false;

    const positions = sections.map(section => this.getSectionTop(section));
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    let currentIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    positions.forEach((position, index) => {
      const distance = Math.abs(scrollTop - position);
      if (distance < bestDistance) {
        bestDistance = distance;
        currentIndex = index;
      }
    });

    const delta = direction > 0 ? 1 : -1;
    const nextIndex = Math.max(0, Math.min(currentIndex + delta, positions.length - 1));
    window.scrollTo({ top: positions[nextIndex], behavior });
    return true;
  }

  /**
   * Keep header overlays closed before scroll navigation
   */
  closeHeaderOverlays() {
    const body = document.body;
    const menuToggle = document.getElementById('menu-toggle');
    const controlsToggle = document.getElementById('controls-toggle');
    const controlsPanel = document.getElementById('controls-panel');

    body.classList.remove('controls-open');
    if (controlsToggle) controlsToggle.setAttribute('aria-expanded', 'false');
    if (controlsPanel) controlsPanel.setAttribute('aria-hidden', 'true');

    if (!body.classList.contains('menu-open')) return;

    body.classList.remove('menu-open');
    body.classList.add('menu-closing');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    window.setTimeout(() => {
      body.classList.remove('menu-closing');
    }, 200);
  }

  /**
   * Stable anchor scrolling for #main-header and #scene-window
   */
  initSectionAnchors() {
    const links = document.querySelectorAll('a[href="#main-header"], a[href="#scene-window"]');
    if (!links.length) return;

    links.forEach(link => {
      link.addEventListener('click', event => {
        const href = link.getAttribute('href');
        if (!href || !href.startsWith('#')) return;
        const targetId = href.slice(1);
        if (!targetId) return;

        event.preventDefault();
        this.closeHeaderOverlays();
        this.scrollToSectionById(targetId, 'smooth');
      });
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

    const content = sceneWindow.querySelector('.scene-window-content');
    const scenes = Array.from(document.querySelectorAll('section.scene'));
    if (!scenes.length) return;

    const controls = sceneWindow.querySelector('[data-scene-controls]');
    const tabsContainer = sceneWindow.querySelector('.scene-tabs');
    const tabsWrap = sceneWindow.querySelector('[data-scene-tabs-wrap]');
    const tabsToggle = sceneWindow.querySelector('[data-scene-tabs-toggle]');
    const currentIcon = sceneWindow.querySelector('[data-scene-current-icon]');
    const currentTitle = sceneWindow.querySelector('[data-scene-current-title]');
    const currentIndexEl = sceneWindow.querySelector('[data-scene-current-index]');
    const totalEl = sceneWindow.querySelector('[data-scene-total]');
    const prevBtn = sceneWindow.querySelector('[data-scene-prev]');
    const nextBtn = sceneWindow.querySelector('[data-scene-next]');
    const compactMedia = window.matchMedia('(max-width: 760px)');
    const sceneData = scenes
      .filter(scene => scene.id)
      .map(scene => ({ id: scene.id, element: scene }));

    const getVisibleScenes = () => {
      const mode = document.body.dataset.viewMode;
      return sceneData.filter(item => {
        const view = item.element.getAttribute('data-view');
        if (!view || !mode) return true;
        return view.split(/\s+/).includes(mode);
      });
    };

    let currentIndex = 0;
    let currentSceneId = '';

    const getSceneLabel = scene => {
      if (!scene) return '';
      const title = scene.querySelector('.section-title-text');
      return title ? title.textContent.trim() : scene.id;
    };

    const getSceneIcon = scene => {
      if (!scene) return '';
      const icon = scene.querySelector('.section-title-icon');
      return icon ? icon.getAttribute('data-svg') : null;
    };

    const setTabsMenuOpen = isOpen => {
      if (!controls || !tabsToggle) return;
      if (!compactMedia.matches) {
        controls.classList.remove('is-tabs-open');
        tabsToggle.setAttribute('aria-expanded', 'false');
        if (tabsWrap) tabsWrap.setAttribute('aria-hidden', 'false');
        return;
      }
      controls.classList.toggle('is-tabs-open', isOpen);
      tabsToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (tabsWrap) {
        tabsWrap.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      }
    };

    const syncTabs = visible => {
      if (!tabsContainer) return;
      const visibleIds = new Set(visible.map(item => item.id));
      tabsContainer.querySelectorAll('.scene-tab').forEach(tab => {
        const id = tab.getAttribute('data-scene-target');
        const scene = sceneData.find(item => item.id === id)?.element;
        const label = getSceneLabel(scene) || id;
        const textEl = tab.querySelector('.scene-tab-text');
        if (textEl) textEl.textContent = label;
        const isVisible = visibleIds.has(id);
        const isActive = id === currentSceneId;
        tab.hidden = !isVisible;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    };

    const scrollActiveTabIntoView = (behavior = 'smooth') => {
      if (!tabsContainer || compactMedia.matches) return;
      if (tabsContainer.scrollWidth <= tabsContainer.clientWidth + 1) return;

      const activeTab = tabsContainer.querySelector('.scene-tab.is-active:not([hidden])');
      if (!activeTab) return;

      const containerRect = tabsContainer.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      const padding = 10;
      const outLeft = tabRect.left < containerRect.left + padding;
      const outRight = tabRect.right > containerRect.right - padding;
      if (!outLeft && !outRight) return;

      const targetLeft = tabsContainer.scrollLeft
        + (tabRect.left - containerRect.left)
        - (containerRect.width - tabRect.width) / 2;

      tabsContainer.scrollTo({
        left: Math.max(0, targetLeft),
        behavior
      });
    };

    const syncCurrent = scene => {
      if (!scene) return;
      const label = getSceneLabel(scene);
      if (currentTitle) {
        currentTitle.textContent = label || scene.id;
      }
      if (!currentIcon) return;
      const iconSrc = getSceneIcon(scene);
      if (!iconSrc) {
        currentIcon.removeAttribute('data-svg');
        currentIcon.innerHTML = '';
        return;
      }
      currentIcon.setAttribute('data-svg', iconSrc);
      if (this.svgLoader) {
        this.svgLoader.loadAll([currentIcon]);
      }
    };

    const syncProgress = visible => {
      if (totalEl) totalEl.textContent = String(visible.length);
      if (currentIndexEl) currentIndexEl.textContent = String(visible.length ? currentIndex + 1 : 0);
    };

    const syncNavButtons = visible => {
      const atStart = currentIndex <= 0;
      const atEnd = currentIndex >= visible.length - 1;
      if (prevBtn) {
        prevBtn.disabled = atStart;
        prevBtn.setAttribute('aria-disabled', atStart ? 'true' : 'false');
      }
      if (nextBtn) {
        nextBtn.disabled = atEnd;
        nextBtn.setAttribute('aria-disabled', atEnd ? 'true' : 'false');
      }
    };

    const setActive = (scene, behavior = 'smooth') => {
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
      currentSceneId = scene.id;

      if (content) {
        content.scrollTo({ top: 0, behavior });
      }
    };

    const updateUI = (visible, activeScene, options = {}) => {
      if (!visible.length || !activeScene) return;
      currentSceneId = activeScene.id;
      currentIndex = visible.findIndex(item => item.id === activeScene.id);
      syncTabs(visible);
      scrollActiveTabIntoView(options.tabBehavior || (options.behavior === 'smooth' ? 'smooth' : 'auto'));
      syncCurrent(activeScene);
      syncProgress(visible);
      syncNavButtons(visible);
    };

    const showByIndex = (index, options = {}) => {
      const visible = getVisibleScenes();
      if (!visible.length) return null;
      const nextIndex = Math.max(0, Math.min(index, visible.length - 1));
      currentIndex = nextIndex;
      const target = visible[nextIndex].element;
      const behavior = options.behavior || 'smooth';

      setActive(target, behavior);
      updateUI(visible, target, { behavior });
      document.dispatchEvent(new CustomEvent('scenechange', { detail: { id: target.id } }));
      return target;
    };

    const showById = (id, options = {}) => {
      const visible = getVisibleScenes();
      const index = visible.findIndex(item => item.id === id);
      if (index === -1) return null;
      return showByIndex(index, options);
    };

    if (tabsContainer) {
      tabsContainer.innerHTML = '';
      sceneData.forEach(item => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'scene-tab';
        tab.setAttribute('role', 'tab');
        tab.setAttribute('data-scene-target', item.id);
        tab.setAttribute('aria-selected', 'false');

        const iconSrc = getSceneIcon(item.element);
        const iconEl = document.createElement('span');
        iconEl.className = 'scene-tab-icon';
        if (iconSrc) iconEl.setAttribute('data-svg', iconSrc);

        const textEl = document.createElement('span');
        textEl.className = 'scene-tab-text';
        textEl.textContent = getSceneLabel(item.element);

        tab.appendChild(iconEl);
        tab.appendChild(textEl);
        tab.addEventListener('click', () => {
          showById(item.id);
          setTabsMenuOpen(false);
        });
        tabsContainer.appendChild(tab);
      });

      if (this.svgLoader) {
        this.svgLoader.loadAll(tabsContainer.querySelectorAll('[data-svg]'));
      }
    }

    const hash = window.location.hash ? window.location.hash.slice(1) : '';
    if (!showById(hash, { behavior: 'auto' })) {
      showByIndex(0, { behavior: 'auto' });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => showByIndex(currentIndex - 1));
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => showByIndex(currentIndex + 1));
    }

    if (tabsToggle) {
      tabsToggle.addEventListener('click', event => {
        if (!compactMedia.matches) return;
        event.preventDefault();
        const next = !controls?.classList.contains('is-tabs-open');
        setTabsMenuOpen(next);
      });
    }

    document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
      link.addEventListener('click', event => {
        const targetId = link.getAttribute('href')?.slice(1);
        if (!targetId) return;
        const targetScene = sceneData.find(item => item.id === targetId)?.element;
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

        showById(targetId, { behavior: 'smooth' });
        setTabsMenuOpen(false);
        this.closeHeaderOverlays();
        this.scrollToSectionById('scene-window', 'smooth');
      });
    });

    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
      langToggle.addEventListener('click', () => {
        window.setTimeout(() => {
          const visible = getVisibleScenes();
          if (!visible.length) return;
          const fallback = visible[Math.min(currentIndex, visible.length - 1)];
          const active = sceneData.find(item => item.id === currentSceneId) || fallback;
          updateUI(visible, active.element || active, { behavior: 'auto' });
        }, 0);
      });
    }

    document.addEventListener('click', event => {
      if (!compactMedia.matches) return;
      if (!controls || controls.contains(event.target)) return;
      setTabsMenuOpen(false);
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      setTabsMenuOpen(false);
    });

    compactMedia.addEventListener('change', () => {
      setTabsMenuOpen(false);
      if (!compactMedia.matches) {
        window.requestAnimationFrame(() => scrollActiveTabIntoView('auto'));
      }
    });

    document.addEventListener('viewmodechange', () => {
      const activeId = currentSceneId || document.querySelector('section.scene.scene-active')?.id;
      if (activeId && showById(activeId, { behavior: 'auto' })) return;
      showByIndex(0, { behavior: 'auto' });
    });

    setTabsMenuOpen(false);
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

    const getPositions = () => {
      return sections.map(section => this.getSectionTop(section));
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
      const usableHeight = Math.max(trackHeight, 0);

      const hasScroll = maxScrollTop > 1;
      scrollbar.classList.toggle('is-hidden', !hasScroll);
      if (!hasScroll) {
        thumb.style.transform = 'translateY(0)';
        return;
      }

      if (usableHeight <= 0) {
        thumb.style.height = '0px';
        thumb.style.transform = 'translateY(0)';
        return;
      }

      const minThumb = Math.min(32, usableHeight);
      const rawThumb = (clientHeight / scrollHeight) * usableHeight;
      const thumbHeight = Math.max(Math.min(rawThumb, usableHeight), minThumb);
      const maxThumbTop = Math.max(usableHeight - thumbHeight, 0);

      const ratio = maxScrollTop > 0 ? scrollEl.scrollTop / maxScrollTop : 0;
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

    const scrollPageByDirection = direction => {
      if (this.scrollMainSectionByDirection(direction, 'smooth')) return;
      const targetTop = direction < 0 ? 0 : Math.max(scrollEl.scrollHeight - scrollEl.clientHeight, 0);
      scrollEl.scrollTo({ top: targetTop, behavior: 'smooth' });
    };

    window.addEventListener('scroll', requestUpdate);
    window.addEventListener('resize', requestUpdate);

    if (btnUp) {
      btnUp.addEventListener('click', () => scrollPageByDirection(-1));
    }
    if (btnDown) {
      btnDown.addEventListener('click', () => scrollPageByDirection(1));
    }

    track.addEventListener('pointerdown', event => {
      if (event.target === thumb) return;
      const rect = track.getBoundingClientRect();
      const clickY = event.clientY - rect.top;
      const usableHeight = Math.max(rect.height, 0);
      const thumbHeight = thumb.offsetHeight;
      const maxThumbTop = Math.max(usableHeight - thumbHeight, 0);
      const targetThumbTop = Math.min(Math.max(clickY - thumbHeight / 2, 0), maxThumbTop);
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
      const usableHeight = Math.max(trackHeight, 0);
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
