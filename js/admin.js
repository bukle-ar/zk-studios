/* ============================================
   ADMIN.JS — Admin panel logic
   Authentication + CRUD for site content
   ============================================ */

'use strict';

const Admin = (() => {

  /* ==========================================
     AUTHENTICATION
  ========================================== */

  /**
   * Default password hash (SHA-256 of 'zkadmin2026')
   * To change the password, generate a new SHA-256 hash and replace this value.
   * You can generate one at: https://emn178.github.io/online-tools/sha256.html
   */
  const PASSWORD_HASH = 'dfa7a602fed288cbef72e3db0661971ab5776370b43537f5387dde32bc4e51d3';
  const SESSION_KEY = 'zkstudios_admin_session';
  const SESSION_DURATION = 3600000; // 1 hour in ms
  const STORAGE_KEY = 'zkstudios_config';
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB per image
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

  /**
   * SHA-256 hash function (Web Crypto API)
   */
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check if user has a valid session
   */
  function isAuthenticated() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (session && session.token && session.expires > Date.now()) {
        return true;
      }
      localStorage.removeItem(SESSION_KEY);
    } catch (e) { /* invalid session */ }
    return false;
  }

  /**
   * Login with password
   */
  async function login(password) {
    const hash = await sha256(password);
    if (hash === PASSWORD_HASH) {
      const session = {
        token: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
        expires: Date.now() + SESSION_DURATION
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return true;
    }
    return false;
  }

  /**
   * Logout
   */
  function logout() {
    localStorage.removeItem(SESSION_KEY);
    showLogin();
  }

  /* ==========================================
     DATA MANAGEMENT
  ========================================== */

  function getConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  function saveConfig(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    showNotification('Cambios guardados correctamente');
  }

  /**
   * Sanitize input to prevent XSS
   */
  function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>"'&]/g, (char) => {
      const map = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
      return map[char];
    });
  }

  /**
   * Validate URL format
   */
  function isValidUrl(str) {
    if (!str) return true; // empty is ok
    try {
      // Allow mailto:, https://, http://, tel:, #
      if (str.startsWith('#') || str.startsWith('mailto:') || str.startsWith('tel:')) return true;
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Handle image file → base64 with validation
   */
  function handleImageUpload(file) {
    return new Promise((resolve, reject) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        reject(new Error('Formato no permitido. Usá JPG, PNG, WebP o SVG.'));
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        reject(new Error('La imagen supera los 2MB. Reducí su tamaño.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Error al leer el archivo.'));
      reader.readAsDataURL(file);
    });
  }

  /* ==========================================
     UI RENDERING
  ========================================== */

  const root = document.getElementById('adminApp');

  function showLogin() {
    root.innerHTML = `
      <div class="admin-login">
        <div class="admin-login__card">
          <div class="admin-login__logo">ZK</div>
          <h1 class="admin-login__title">Panel de Administración</h1>
          <p class="admin-login__subtitle">Ingresá tu contraseña para acceder</p>
          <form id="loginForm" class="admin-login__form">
            <div class="admin-field">
              <label class="admin-field__label" for="loginPass">Contraseña</label>
              <input type="password" id="loginPass" class="admin-field__input" placeholder="••••••••" required autocomplete="current-password">
            </div>
            <button type="submit" class="admin-btn admin-btn--primary admin-btn--full">
              Ingresar
            </button>
            <p id="loginError" class="admin-login__error" hidden>Contraseña incorrecta</p>
          </form>
        </div>
      </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pass = document.getElementById('loginPass').value;
      const errorEl = document.getElementById('loginError');

      if (await login(pass)) {
        showDashboard();
      } else {
        errorEl.hidden = false;
        document.getElementById('loginPass').value = '';
        setTimeout(() => { errorEl.hidden = true; }, 3000);
      }
    });
  }

  function showDashboard() {
    const config = getConfig();

    root.innerHTML = `
      <div class="admin-layout">
        <aside class="admin-sidebar">
          <div class="admin-sidebar__logo">
            <span class="admin-sidebar__logo-text">ZK<span style="color:var(--admin-primary)">.</span> Admin</span>
          </div>
          <nav class="admin-sidebar__nav">
            <button class="admin-nav-btn is-active" data-section="general">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              General
            </button>
            <button class="admin-nav-btn" data-section="stats">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Estadísticas
            </button>
            <button class="admin-nav-btn" data-section="portfolio">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              Portfolio
            </button>
            <button class="admin-nav-btn" data-section="contact">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
              Contacto
            </button>
          </nav>
          <button class="admin-nav-btn admin-nav-btn--logout" id="logoutBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Cerrar Sesión
          </button>
        </aside>

        <main class="admin-main">
          <div class="admin-main__header">
            <h1 class="admin-main__title" id="sectionTitle">General</h1>
            <a href="index.html" target="_blank" class="admin-btn admin-btn--outline admin-btn--sm">
              Ver Sitio →
            </a>
          </div>
          <div class="admin-main__content" id="sectionContent">
          </div>
        </main>
      </div>
    `;

    // Nav events
    document.querySelectorAll('.admin-nav-btn[data-section]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const section = btn.getAttribute('data-section');
        document.getElementById('sectionTitle').textContent = btn.textContent.trim();
        renderSection(section);
      });
    });

    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Load first section
    renderSection('general');
  }

  /* ==========================================
     SECTION RENDERERS
  ========================================== */

  function renderSection(section) {
    const content = document.getElementById('sectionContent');
    const config = getConfig();

    switch (section) {
      case 'general':   renderGeneral(content, config); break;
      case 'stats':     renderStats(content, config); break;
      case 'portfolio': renderPortfolio(content, config); break;
      case 'contact':   renderContact(content, config); break;
    }
  }

  // --- GENERAL ---
  function renderGeneral(el, config) {
    el.innerHTML = `
      <div class="admin-card">
        <h2 class="admin-card__title">Enlaces Principales</h2>
        <p class="admin-card__desc">Configurá los links principales del sitio.</p>
        <form id="generalForm" class="admin-form">
          <div class="admin-field">
            <label class="admin-field__label">Botón "Contacto" del header (destino)</label>
            <input type="text" class="admin-field__input" id="genContactBtn" value="${sanitize(config.contactButton || '#contact')}" placeholder="#contact o https://...">
            <span class="admin-field__hint">Puede ser un ancla (#contact) o una URL externa</span>
          </div>
          <div class="admin-field">
            <label class="admin-field__label">Link de "Mi Trayecto" (CV)</label>
            <input type="url" class="admin-field__input" id="genTrajectory" value="${sanitize(config.trajectoryLink || '')}" placeholder="https://link-a-tu-cv.com">
            <span class="admin-field__hint">URL al CV o página de trayectoria</span>
          </div>
          <button type="submit" class="admin-btn admin-btn--primary">Guardar Cambios</button>
        </form>
      </div>

      <div class="admin-card">
        <h2 class="admin-card__title">Seguridad</h2>
        <p class="admin-card__desc">Cambiá la contraseña del panel de administración.</p>
        <form id="passwordForm" class="admin-form">
          <div class="admin-field">
            <label class="admin-field__label">Nueva contraseña</label>
            <input type="password" class="admin-field__input" id="newPassword" placeholder="Mínimo 8 caracteres" minlength="8" required>
          </div>
          <div class="admin-field">
            <label class="admin-field__label">Confirmar contraseña</label>
            <input type="password" class="admin-field__input" id="confirmPassword" placeholder="Repetí la contraseña" required>
          </div>
          <button type="submit" class="admin-btn admin-btn--outline">Cambiar Contraseña</button>
          <p id="passMsg" class="admin-field__hint" hidden></p>
        </form>
      </div>
    `;

    document.getElementById('generalForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const contactBtn = document.getElementById('genContactBtn').value.trim();
      const trajectory = document.getElementById('genTrajectory').value.trim();

      if (trajectory && !isValidUrl(trajectory)) {
        showNotification('URL de trayecto inválida', 'error');
        return;
      }

      const c = getConfig();
      c.contactButton = contactBtn;
      c.trajectoryLink = trajectory;
      saveConfig(c);
    });

    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPass = document.getElementById('newPassword').value;
      const confirm = document.getElementById('confirmPassword').value;
      const msg = document.getElementById('passMsg');

      if (newPass !== confirm) {
        msg.textContent = 'Las contraseñas no coinciden';
        msg.style.color = '#E31E24';
        msg.hidden = false;
        return;
      }

      if (newPass.length < 8) {
        msg.textContent = 'Mínimo 8 caracteres';
        msg.style.color = '#E31E24';
        msg.hidden = false;
        return;
      }

      const hash = await sha256(newPass);
      msg.textContent = 'Contraseña actualizada. Nuevo hash (anotalo): ' + hash;
      msg.style.color = '#4CAF50';
      msg.hidden = false;

      showNotification('Para aplicar el cambio, reemplazá PASSWORD_HASH en admin.js con: ' + hash, 'info');
    });
  }

  // --- STATS ---
  function renderStats(el, config) {
    const stats = config.stats || {};
    const p = stats.projects || { value: 50, label: 'Proyectos' };
    const c = stats.clients  || { value: 30, label: 'Clientes' };
    const y = stats.years    || { value: 9,  label: 'Años Exp.' };

    el.innerHTML = `
      <div class="admin-card">
        <h2 class="admin-card__title">Estadísticas del sitio</h2>
        <p class="admin-card__desc">Editá los números que aparecen en la sección "Sobre Mí".</p>
        <form id="statsForm" class="admin-form">
          <div class="admin-grid admin-grid--3">
            <div class="admin-field">
              <label class="admin-field__label">Número</label>
              <input type="number" class="admin-field__input" id="statProjectsVal" value="${p.value}" min="0">
            </div>
            <div class="admin-field">
              <label class="admin-field__label">Etiqueta</label>
              <input type="text" class="admin-field__input" id="statProjectsLabel" value="${sanitize(p.label)}">
            </div>
            <div class="admin-field admin-field--preview">
              <span class="admin-stat-preview">${p.value}+ ${sanitize(p.label)}</span>
            </div>
          </div>
          <div class="admin-grid admin-grid--3">
            <div class="admin-field">
              <label class="admin-field__label">Número</label>
              <input type="number" class="admin-field__input" id="statClientsVal" value="${c.value}" min="0">
            </div>
            <div class="admin-field">
              <label class="admin-field__label">Etiqueta</label>
              <input type="text" class="admin-field__input" id="statClientsLabel" value="${sanitize(c.label)}">
            </div>
            <div class="admin-field admin-field--preview">
              <span class="admin-stat-preview">${c.value}+ ${sanitize(c.label)}</span>
            </div>
          </div>
          <div class="admin-grid admin-grid--3">
            <div class="admin-field">
              <label class="admin-field__label">Número</label>
              <input type="number" class="admin-field__input" id="statYearsVal" value="${y.value}" min="0">
            </div>
            <div class="admin-field">
              <label class="admin-field__label">Etiqueta</label>
              <input type="text" class="admin-field__input" id="statYearsLabel" value="${sanitize(y.label)}">
            </div>
            <div class="admin-field admin-field--preview">
              <span class="admin-stat-preview">${y.value}+ ${sanitize(y.label)}</span>
            </div>
          </div>
          <button type="submit" class="admin-btn admin-btn--primary">Guardar Cambios</button>
        </form>
      </div>
    `;

    document.getElementById('statsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const cfg = getConfig();
      cfg.stats = {
        projects: { value: parseInt(document.getElementById('statProjectsVal').value) || 0, label: document.getElementById('statProjectsLabel').value.trim() },
        clients:  { value: parseInt(document.getElementById('statClientsVal').value)  || 0, label: document.getElementById('statClientsLabel').value.trim() },
        years:    { value: parseInt(document.getElementById('statYearsVal').value)    || 0, label: document.getElementById('statYearsLabel').value.trim() }
      };
      saveConfig(cfg);
    });
  }

  // --- PORTFOLIO ---
  function renderPortfolio(el, config) {
    const portfolio = config.portfolio || {};
    const categories = [
      { key: 'logos',       label: 'Logos' },
      { key: 'branding',    label: 'Branding' },
      { key: 'uiux',        label: 'UI / UX Design' },
      { key: 'socialmedia', label: 'Social Media' }
    ];

    let html = '';
    categories.forEach(cat => {
      const data = portfolio[cat.key] || { title: cat.label, tag: '', cover: '', items: [] };
      const items = data.items || [];

      html += `
        <div class="admin-card">
          <h2 class="admin-card__title">${cat.label}</h2>
          <div class="admin-form">
            <div class="admin-grid admin-grid--2">
              <div class="admin-field">
                <label class="admin-field__label">Título</label>
                <input type="text" class="admin-field__input portfolio-title" data-cat="${cat.key}" value="${sanitize(data.title)}">
              </div>
              <div class="admin-field">
                <label class="admin-field__label">Etiqueta</label>
                <input type="text" class="admin-field__input portfolio-tag" data-cat="${cat.key}" value="${sanitize(data.tag)}">
              </div>
            </div>
            <div class="admin-field">
              <label class="admin-field__label">Portada (ruta del archivo)</label>
              <input type="text" class="admin-field__input portfolio-cover" data-cat="${cat.key}" value="${sanitize(data.cover)}" placeholder="assets/portfolio/archivo.png">
              <span class="admin-field__hint">Subí la imagen a assets/portfolio/ y escribí el nombre acá</span>
            </div>

            <div class="admin-field">
              <label class="admin-field__label">Trabajos (${items.length} cargados)</label>
              <div class="admin-items-list" id="items-${cat.key}">
                ${items.map((item, idx) => renderPortfolioItem(cat.key, item, idx)).join('')}
              </div>
              <button type="button" class="admin-btn admin-btn--outline admin-btn--sm add-item-btn" data-cat="${cat.key}">
                + Agregar trabajo
              </button>
            </div>
          </div>
        </div>
      `;
    });

    html += `<button type="button" class="admin-btn admin-btn--primary" id="savePortfolio">Guardar Todo el Portfolio</button>`;

    el.innerHTML = html;

    // Add item buttons
    document.querySelectorAll('.add-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-cat');
        const list = document.getElementById(`items-${cat}`);
        const idx = list.children.length;
        const div = document.createElement('div');
        div.innerHTML = renderPortfolioItem(cat, { name: '', description: '', image: '' }, idx);
        list.appendChild(div.firstElementChild);
        bindItemRemove();
      });
    });

    bindItemRemove();

    // Save
    document.getElementById('savePortfolio').addEventListener('click', () => {
      const cfg = getConfig();
      if (!cfg.portfolio) cfg.portfolio = {};

      categories.forEach(cat => {
        const title = document.querySelector(`.portfolio-title[data-cat="${cat.key}"]`).value.trim();
        const tag = document.querySelector(`.portfolio-tag[data-cat="${cat.key}"]`).value.trim();
        const cover = document.querySelector(`.portfolio-cover[data-cat="${cat.key}"]`).value.trim();

        const itemEls = document.querySelectorAll(`#items-${cat.key} .admin-item`);
        const items = [];
        itemEls.forEach(itemEl => {
          const name = itemEl.querySelector('.item-name').value.trim();
          const desc = itemEl.querySelector('.item-desc').value.trim();
          const img = itemEl.querySelector('.item-img').value.trim();
          if (name) items.push({ name, description: desc, image: img });
        });

        cfg.portfolio[cat.key] = { title, tag, cover, items };
      });

      saveConfig(cfg);
    });
  }

  function renderPortfolioItem(cat, item, idx) {
    return `
      <div class="admin-item">
        <div class="admin-grid admin-grid--3">
          <div class="admin-field">
            <input type="text" class="admin-field__input item-name" value="${sanitize(item.name)}" placeholder="Nombre del trabajo">
          </div>
          <div class="admin-field">
            <input type="text" class="admin-field__input item-desc" value="${sanitize(item.description || '')}" placeholder="Descripción breve">
          </div>
          <div class="admin-field" style="display:flex;gap:8px;align-items:end;">
            <input type="text" class="admin-field__input item-img" value="${sanitize(item.image || '')}" placeholder="assets/portfolio/img.png" style="flex:1">
            <button type="button" class="admin-btn admin-btn--danger admin-btn--sm remove-item-btn">✕</button>
          </div>
        </div>
      </div>
    `;
  }

  function bindItemRemove() {
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
      btn.onclick = () => {
        btn.closest('.admin-item').remove();
      };
    });
  }

  // --- CONTACT ---
  function renderContact(el, config) {
    const contact = config.contact || {};
    const wa = contact.whatsapp  || { url: '', display: '' };
    const ig = contact.instagram || { url: '', display: '' };
    const em = contact.email     || { url: '', display: '' };

    el.innerHTML = `
      <div class="admin-card">
        <h2 class="admin-card__title">Canales de Contacto</h2>
        <p class="admin-card__desc">Modificá los links y textos de la sección de contacto.</p>
        <form id="contactForm" class="admin-form">
          <div class="admin-grid admin-grid--2">
            <div class="admin-field">
              <label class="admin-field__label">WhatsApp — URL</label>
              <input type="text" class="admin-field__input" id="ctWhatsappUrl" value="${sanitize(wa.url)}" placeholder="https://wa.link/...">
            </div>
            <div class="admin-field">
              <label class="admin-field__label">WhatsApp — Texto visible</label>
              <input type="text" class="admin-field__input" id="ctWhatsappDisplay" value="${sanitize(wa.display)}" placeholder="+54...">
            </div>
          </div>
          <div class="admin-grid admin-grid--2">
            <div class="admin-field">
              <label class="admin-field__label">Instagram — URL</label>
              <input type="text" class="admin-field__input" id="ctInstagramUrl" value="${sanitize(ig.url)}" placeholder="https://instagram.com/...">
            </div>
            <div class="admin-field">
              <label class="admin-field__label">Instagram — Texto visible</label>
              <input type="text" class="admin-field__input" id="ctInstagramDisplay" value="${sanitize(ig.display)}" placeholder="@usuario">
            </div>
          </div>
          <div class="admin-grid admin-grid--2">
            <div class="admin-field">
              <label class="admin-field__label">Email — Dirección</label>
              <input type="email" class="admin-field__input" id="ctEmailUrl" value="${sanitize(em.url.replace('mailto:', ''))}" placeholder="tu@email.com">
            </div>
            <div class="admin-field">
              <label class="admin-field__label">Email — Texto visible</label>
              <input type="text" class="admin-field__input" id="ctEmailDisplay" value="${sanitize(em.display)}" placeholder="tu@email.com">
            </div>
          </div>
          <button type="submit" class="admin-btn admin-btn--primary">Guardar Cambios</button>
        </form>
      </div>
    `;

    document.getElementById('contactForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const cfg = getConfig();
      cfg.contact = {
        whatsapp: {
          url: document.getElementById('ctWhatsappUrl').value.trim(),
          display: document.getElementById('ctWhatsappDisplay').value.trim()
        },
        instagram: {
          url: document.getElementById('ctInstagramUrl').value.trim(),
          display: document.getElementById('ctInstagramDisplay').value.trim()
        },
        email: {
          url: 'mailto:' + document.getElementById('ctEmailUrl').value.trim(),
          display: document.getElementById('ctEmailDisplay').value.trim()
        }
      };
      saveConfig(cfg);
    });
  }

  /* ==========================================
     NOTIFICATIONS
  ========================================== */

  function showNotification(message, type = 'success') {
    const existing = document.querySelector('.admin-notification');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.className = `admin-notification admin-notification--${type}`;
    el.textContent = message;
    document.body.appendChild(el);

    requestAnimationFrame(() => el.classList.add('is-visible'));

    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }

  /* ==========================================
     INIT
  ========================================== */

  function init() {
    if (isAuthenticated()) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  Admin.init();
});
