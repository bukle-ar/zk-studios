/* ============================================
   MODAL.JS — Portfolio category modals
   ZK Studios Portfolio
   ============================================ */

'use strict';

const Modal = (() => {
  /* ---------- DOM refs ---------- */
  const overlay   = document.getElementById('modalOverlay');
  const modal     = document.getElementById('modal');
  const titleEl   = document.getElementById('modalTitle');
  const bodyEl    = document.getElementById('modalBody');
  const closeBtn  = document.getElementById('modalClose');
  const catBtns   = document.querySelectorAll('.category-btn[data-category]');

  let previousFocus = null;

  /* ---------- Portfolio data ----------
     Estructura de datos para cada categoría.
     Reemplazar placeholders con los proyectos reales del cliente.
  ---------------------------------------- */
  const portfolioData = {
    logos: {
      title: 'Logofolio',
      projects: [
        {
          name: 'Logo ZK Studios',
          description: 'Identidad principal del estudio',
          image: 'assets/img/LOGO PNG ZKSTUDIOS.png' // ruta: assets/portfolio/logo-zk.png
        },
        {
          name: 'Logo Proyecto 2',
          description: 'Logo para marca comercial',
          image: ''
        },
        {
          name: 'Logo Proyecto 3',
          description: 'Diseño de logo minimalista',
          image: ''
        },
        {
          name: 'Logo Proyecto 4',
          description: 'Rediseño de marca',
          image: ''
        }
      ]
    },
    'identidad-visual': {
      title: 'Identidad Visual',
      projects: [
        {
          name: 'Branding Completo',
          description: 'Sistema de identidad visual integral',
          image: ''
        },
        {
          name: 'Manual de Marca',
          description: 'Guidelines y aplicaciones',
          image: ''
        }
      ]
    },
    'ui-ux': {
      title: 'UI / UX Design',
      projects: [
        {
          name: 'App Design',
          description: 'Diseño de interfaz para aplicación móvil',
          image: ''
        },
        {
          name: 'Dashboard',
          description: 'Panel de administración web',
          image: ''
        }
      ]
    },
    'social-media': {
      title: 'Social Media',
      projects: [
        {
          name: 'Campaña Redes',
          description: 'Contenido para redes sociales',
          image: ''
        },
        {
          name: 'Feed Instagram',
          description: 'Diseño de feed y stories',
          image: ''
        }
      ]
    },
    branding: {
      title: 'Branding',
      projects: [
        {
          name: 'Branding Corporativo',
          description: 'Sistema completo de marca',
          image: ''
        },
        {
          name: 'Packaging Design',
          description: 'Diseño de empaque de producto',
          image: ''
        }
      ]
    }
  };

  /* ---------- Render functions ---------- */

  function renderProjects(projects) {
    if (!projects || projects.length === 0) {
      return `
        <div class="modal__empty">
          <div class="modal__empty-icon">📂</div>
          <p class="modal__empty-text">Próximamente se agregarán proyectos a esta categoría.</p>
        </div>
      `;
    }

    const cards = projects.map(project => {
      const thumbContent = project.image
        ? `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.name)}" loading="lazy">`
        : `<span class="modal__project-thumb-placeholder">${escapeHtml(project.name.substring(0, 2).toUpperCase())}</span>`;

      return `
        <div class="modal__project">
          <div class="modal__project-thumb">
            ${thumbContent}
          </div>
          <div class="modal__project-info">
            <h3 class="modal__project-name">${escapeHtml(project.name)}</h3>
            <p class="modal__project-desc">${escapeHtml(project.description)}</p>
          </div>
        </div>
      `;
    }).join('');

    return `<div class="modal__grid">${cards}</div>`;
  }

  /* ---------- Open / Close ---------- */

  function open(category) {
    const data = portfolioData[category];
    if (!data) return;

    // Store focus for later restoration
    previousFocus = document.activeElement;

    // Populate modal
    titleEl.textContent = data.title;
    bodyEl.innerHTML = renderProjects(data.projects);

    // Show modal
    overlay.classList.add('is-active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    // Focus trap: focus close button
    requestAnimationFrame(() => {
      closeBtn.focus();
    });
  }

  function close() {
    overlay.classList.remove('is-active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    // Restore previous focus
    if (previousFocus) {
      previousFocus.focus();
      previousFocus = null;
    }
  }

  /* ---------- Focus trap ---------- */

  function trapFocus(e) {
    if (!overlay.classList.contains('is-active')) return;

    const focusable = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  /* ---------- Security: escape HTML ---------- */

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------- Event binding ---------- */

  function init() {
    if (!overlay) return;

    // Category button clicks
    catBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-category');
        open(category);
      });
    });

    // Close button
    closeBtn?.addEventListener('click', close);

    // Click on backdrop (outside modal)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-active')) {
        close();
      }
      trapFocus(e);
    });
  }

  /* ---------- Public API ---------- */
  return { init, open, close };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Modal.init();
});
