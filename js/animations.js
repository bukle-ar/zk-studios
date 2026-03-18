/* ============================================
   ANIMATIONS.JS — Scroll-triggered animations
   ZK Studios Portfolio
   ============================================ */

'use strict';

const ScrollAnimations = (() => {
  const ANIMATED_SELECTOR = '[data-animate]';
  const VISIBLE_CLASS = 'is-visible';

  function init() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Show everything immediately
      document.querySelectorAll(ANIMATED_SELECTOR).forEach(el => {
        el.classList.add(VISIBLE_CLASS);
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(VISIBLE_CLASS);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.1
      }
    );

    document.querySelectorAll(ANIMATED_SELECTOR).forEach(el => {
      observer.observe(el);
    });
  }

  return { init };
})();

/* ------------------------------------------
   Smooth parallax for hero decoration
------------------------------------------ */
const ParallaxEffect = (() => {
  function init() {
    const decoration = document.querySelector('.hero__image-decoration');
    if (!decoration) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          if (scrollY < window.innerHeight) {
            decoration.style.transform = `translateY(${scrollY * 0.08}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  return { init };
})();

/* ------------------------------------------
   Init
------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  ScrollAnimations.init();
  ParallaxEffect.init();
});
