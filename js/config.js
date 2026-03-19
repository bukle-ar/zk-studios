/* ============================================
   CONFIG.JS — Dynamic content loader
   Reads admin-configured data from localStorage
   and updates the main site accordingly.
   ============================================ */

'use strict';

const SiteConfig = (() => {
  const STORAGE_KEY = 'zkstudios_config';

  /**
   * Default configuration — used when no admin data exists
   */
  const defaults = {
    contactButton: '#contact',
    trajectoryLink: '#',
    stats: {
      projects: { value: 50, label: 'Proyectos' },
      clients:  { value: 30, label: 'Clientes' },
      years:    { value: 9,  label: 'Años Exp.' }
    },
    contact: {
      whatsapp:  { url: 'https://wa.link/ggh8cn', display: '+5492964533279' },
      instagram: { url: 'https://www.instagram.com/zkstudios.rg', display: '@zkstudios.rg' },
      email:     { url: 'mailto:ezequielg04@icloud.com', display: 'ezequielg04@icloud.com' }
    },
    portfolio: {
      logos:        { title: 'Logos',          tag: 'Logofolio',        cover: 'assets/portfolio/logos-cover.png',     items: [] },
      branding:     { title: 'Branding',       tag: 'Identidad Visual', cover: 'assets/portfolio/branding-cover.png',  items: [] },
      uiux:         { title: 'UI / UX Design', tag: 'UI/UX',           cover: 'assets/portfolio/uiux-cover.png',      items: [] },
      socialmedia:  { title: 'Social Media',   tag: 'Redes Sociales',  cover: 'assets/portfolio/social-cover.png',    items: [] }
    }
  };

  /**
   * Get saved config or defaults
   */
  function get() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return mergeDeep(structuredClone(defaults), parsed);
      }
    } catch (e) {
      console.warn('Config: failed to read localStorage', e);
    }
    return structuredClone(defaults);
  }

  /**
   * Deep merge two objects (target is mutated)
   */
  function mergeDeep(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        mergeDeep(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  /**
   * Sanitize string to prevent XSS
   */
  function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Apply config to the main site DOM
   */
  function apply() {
    const config = get();

    // --- Contact button in hero ---
    const contactBtn = document.querySelector('.hero__cta .btn--outline');
    if (contactBtn && config.contactButton) {
      contactBtn.setAttribute('href', sanitize(config.contactButton));
    }

    // --- Trajectory link ---
    const trajBtn = document.querySelector('a[href*="TU-LINK-AL-CV"]') ||
                    document.querySelector('.about__text .btn--primary');
    if (trajBtn && config.trajectoryLink) {
      trajBtn.setAttribute('href', sanitize(config.trajectoryLink));
    }

    // --- Stats ---
    if (config.stats) {
      const statEls = document.querySelectorAll('.stat');
      const statKeys = ['projects', 'clients', 'years'];

      statKeys.forEach((key, i) => {
        if (statEls[i] && config.stats[key]) {
          const numEl = statEls[i].querySelector('.stat__number');
          const labelEl = statEls[i].querySelector('.stat__label');
          if (numEl) numEl.setAttribute('data-count', config.stats[key].value);
          if (labelEl) labelEl.textContent = config.stats[key].label;
        }
      });
    }

    // --- Contact links ---
    if (config.contact) {
      // WhatsApp
      const waLink = document.querySelector('a[aria-label="Enviar WhatsApp"]');
      if (waLink && config.contact.whatsapp) {
        waLink.setAttribute('href', sanitize(config.contact.whatsapp.url));
        const valEl = waLink.querySelector('.contact-link__value');
        if (valEl) valEl.textContent = config.contact.whatsapp.display;
      }

      // Instagram
      const igLink = document.querySelector('a[aria-label="Ver Instagram"]');
      if (igLink && config.contact.instagram) {
        igLink.setAttribute('href', sanitize(config.contact.instagram.url));
        const valEl = igLink.querySelector('.contact-link__value');
        if (valEl) valEl.textContent = config.contact.instagram.display;
      }

      // Email
      const emLink = document.querySelector('a[aria-label="Enviar email"]');
      if (emLink && config.contact.email) {
        emLink.setAttribute('href', sanitize(config.contact.email.url));
        const valEl = emLink.querySelector('.contact-link__value');
        if (valEl) valEl.textContent = config.contact.email.display;
      }
    }

    // --- Portfolio covers ---
    if (config.portfolio) {
      const cards = document.querySelectorAll('.project-card');
      const catMap = ['logos', 'branding', 'uiux', 'socialmedia'];

      catMap.forEach((cat, i) => {
        if (cards[i] && config.portfolio[cat]) {
          const img = cards[i].querySelector('.project-card__thumbnail img');
          const title = cards[i].querySelector('.project-card__title');
          const tag = cards[i].querySelector('.project-card__tag');

          if (img && config.portfolio[cat].cover) {
            img.setAttribute('src', sanitize(config.portfolio[cat].cover));
          }
          if (title) title.textContent = config.portfolio[cat].title;
          if (tag) tag.textContent = config.portfolio[cat].tag;
        }
      });
    }

    // --- Portfolio card click → open modal with items ---
    const cards = document.querySelectorAll('.project-card');
    const catMap = ['logos', 'branding', 'uiux', 'socialmedia'];

    cards.forEach((card, i) => {
      card.addEventListener('click', () => {
        const cat = catMap[i];
        if (config.portfolio[cat] && config.portfolio[cat].items.length > 0) {
          openPortfolioModal(config.portfolio[cat]);
        }
      });
    });
  }

  /**
   * Open modal with portfolio items
   */
  function openPortfolioModal(categoryData) {
    const overlay = document.getElementById('modalOverlay');
    const titleEl = document.getElementById('modalTitle');
    const bodyEl = document.getElementById('modalBody');
    const closeBtn = document.getElementById('modalClose');

    if (!overlay || !titleEl || !bodyEl) return;

    titleEl.textContent = categoryData.title;

    const itemsHtml = categoryData.items.map(item => `
      <div class="modal__project">
        <div class="modal__project-thumb">
          ${item.image
            ? `<img src="${sanitize(item.image)}" alt="${sanitize(item.name)}" loading="lazy">`
            : `<span class="modal__project-thumb-placeholder">${sanitize(item.name.substring(0, 2).toUpperCase())}</span>`
          }
        </div>
        <div class="modal__project-info">
          <h3 class="modal__project-name">${sanitize(item.name)}</h3>
          <p class="modal__project-desc">${sanitize(item.description || '')}</p>
        </div>
      </div>
    `).join('');

    bodyEl.innerHTML = `<div class="modal__grid">${itemsHtml}</div>`;

    overlay.classList.add('is-active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  return { get, apply, defaults, STORAGE_KEY };
})();

// Apply config when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  SiteConfig.apply();
});
