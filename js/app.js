/* ============================================
   APP.JS — Main application logic
   ZK Studios Portfolio
   ============================================ */

'use strict';

/**
 * DOM Utility: safely query elements
 */
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

/* ------------------------------------------
   LOADER
------------------------------------------ */
const Loader = {
  el: $('#loader'),

  hide() {
    if (!this.el) return;
    // Wait for the bar animation to finish, then hide
    setTimeout(() => {
      this.el.classList.add('is-hidden');
      // Remove from DOM after transition
      this.el.addEventListener('transitionend', () => {
        this.el.remove();
      }, { once: true });
    }, 1600);
  },

  init() {
    window.addEventListener('load', () => this.hide());
    // Fallback: hide after 3s no matter what
    setTimeout(() => this.hide(), 3000);
  }
};

/* ------------------------------------------
   NAVIGATION
------------------------------------------ */
const Navigation = {
  header: $('#header'),
  toggle: $('#navToggle'),
  menu: $('#navMenu'),
  links: $$('.nav__link'),
  lastScroll: 0,
  scrollThreshold: 80,

  init() {
    // Mobile toggle
    if (this.toggle) {
      this.toggle.addEventListener('click', () => this.toggleMenu());
    }

    // Close menu on link click
    this.links.forEach(link => {
      link.addEventListener('click', () => this.closeMenu());
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (this.menu?.classList.contains('is-open') &&
          !this.menu.contains(e.target) &&
          !this.toggle?.contains(e.target)) {
        this.closeMenu();
      }
    });

    // Hide/show header on scroll
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });

    // Active link tracking
    this.trackActiveSection();

    // Close menu on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeMenu();
    });
  },

  toggleMenu() {
    const isOpen = this.menu?.classList.toggle('is-open');
    this.toggle?.classList.toggle('is-active');
    this.toggle?.setAttribute('aria-expanded', isOpen);
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  },

  closeMenu() {
    this.menu?.classList.remove('is-open');
    this.toggle?.classList.remove('is-active');
    this.toggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  },

  handleScroll() {
    const currentScroll = window.scrollY;

    if (currentScroll > this.scrollThreshold) {
      if (currentScroll > this.lastScroll) {
        this.header?.classList.add('is-hidden');
      } else {
        this.header?.classList.remove('is-hidden');
      }
    } else {
      this.header?.classList.remove('is-hidden');
    }

    this.lastScroll = currentScroll;
  },

  trackActiveSection() {
    const sections = $$('section[id]');
    const observerOptions = {
      root: null,
      rootMargin: `-${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72}px 0px -50% 0px`,
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          this.links.forEach(link => {
            link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
  }
};

/* ------------------------------------------
   CONTACT FORM
------------------------------------------ */
const ContactForm = {
  form: $('#contactForm'),

  init() {
    if (!this.form) return;

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Real-time validation
    $$('.contact-form__input', this.form).forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => {
        input.classList.remove('is-error');
      });
    });
  },

  validateField(input) {
    const value = input.value.trim();
    let isValid = true;

    if (input.required && !value) {
      isValid = false;
    }

    if (input.type === 'email' && value) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      isValid = emailPattern.test(value);
    }

    input.classList.toggle('is-error', !isValid);
    return isValid;
  },

  handleSubmit(e) {
    e.preventDefault();

    const inputs = $$('.contact-form__input', this.form);
    let allValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        allValid = false;
      }
    });

    if (!allValid) return;

    // Collect form data (sanitized)
    const formData = {
      name: this.sanitize($('#name').value),
      email: this.sanitize($('#email').value),
      message: this.sanitize($('#message').value)
    };

    // TODO: Conectar con backend/API de envío de emails
    console.log('Form data:', formData);

    // Visual feedback
    const submitBtn = this.form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '¡Mensaje Enviado! ✓';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    setTimeout(() => {
      this.form.reset();
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
    }, 3000);
  },

  /**
   * Basic XSS sanitization for form inputs
   */
  sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

/* ------------------------------------------
   SKILL BAR ANIMATION
------------------------------------------ */
const SkillBars = {
  init() {
    const bars = $$('.tool-card__bar-fill[data-width]');
    if (!bars.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const width = entry.target.getAttribute('data-width');
          entry.target.style.width = `${width}%`;
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    bars.forEach(bar => observer.observe(bar));
  }
};

/* ------------------------------------------
   COUNTER ANIMATION
------------------------------------------ */
const Counters = {
  init() {
    const counters = $$('.stat__number[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
  },

  animate(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const duration = 1500;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    };

    requestAnimationFrame(step);
  }
};

/* ------------------------------------------
   INITIALIZATION
------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  Loader.init();
  Navigation.init();
  ContactForm.init();
  SkillBars.init();
  Counters.init();
});
