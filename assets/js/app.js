// assets/js/app.js
// Consolidated, corrected and professionalized UI + animations + form logic
// - Regroupe et dé-duplicate les blocs fournis
// - Respecte prefers-reduced-motion
// - Robustes guards (éléments manquants), timeout fetch, accessibilité
// - Utilise GSAP/AOS/Swiper si présents
// Auteur: Copilot Space adapté pour Berzahka

(function () {
  'use strict';

  /* -------------------- Utilities -------------------- */

  const supports = {
    gsap: typeof window.gsap !== 'undefined',
    AOS: typeof window.AOS !== 'undefined',
    Swiper: typeof window.Swiper !== 'undefined',
  };

  function safeQuery(sel, root = document) {
    try { return root.querySelector(sel); } catch { return null; }
  }
  function safeQueryAll(sel, root = document) {
    try { return Array.from(root.querySelectorAll(sel)); } catch { return []; }
  }

  // Lightweight setAlert helper for form feedback
  function setAlert(el, type, message) {
    if (!el) return;
    el.className = '';
    el.classList.add('mt-4');
    el.classList.add('form-feedback'); // keep a marker class
    // Toggle classes for styling (you can style .form-feedback.success/.error)
    if (type === 'success') {
      el.classList.add('success');
      el.classList.remove('error');
      el.innerHTML = `<div class="rounded-xl border p-3 border-emerald-500/20 bg-emerald-500/8">${message}</div>`;
    } else {
      el.classList.add('error');
      el.classList.remove('success');
      el.innerHTML = `<div class="rounded-xl border p-3 border-rose-500/20 bg-rose-500/8">${message}</div>`;
    }
    // Auto-hide after a while
    clearTimeout(el._hideTimeout);
    el._hideTimeout = setTimeout(() => {
      el.classList.remove('success', 'error');
      // don't remove innerHTML immediately so user can still read; hide visually if needed via CSS
    }, 7000);
  }

  // Split letters into spans for headline reveal
  function splitLetters(el) {
    if (!el) return [];
    const text = el.textContent.trim();
    // Avoid re-splitting
    if (el.dataset.split === 'true') return Array.from(el.querySelectorAll('.reveal-letter'));
    el.dataset.split = 'true';
    el.textContent = '';
    const frag = document.createDocumentFragment();
    for (const ch of text.split('')) {
      const span = document.createElement('span');
      span.className = 'reveal-letter';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      frag.appendChild(span);
    }
    el.appendChild(frag);
    return Array.from(el.querySelectorAll('.reveal-letter'));
  }

  // Request timeout helper for fetch
  async function fetchWithTimeout(url, opts = {}, ms = 9000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, { signal: controller.signal, ...opts });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  /* -------------------- Animations & UI init -------------------- */

  function initAOS() {
    if (!supports.AOS) return;
    try {
      AOS.init({ duration: 700, once: true, offset: 80 });
    } catch (err) {
      console.warn('AOS init failed', err);
    }
  }

  function initGSAPHero() {
    const h1 = safeQuery('h1');
    if (!h1) return;
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // split and animate
    const letters = splitLetters(h1);

    if (supports.gsap && !prefersReduced && letters.length) {
      try {
        gsap.fromTo(letters,
          { opacity: 0, y: 18, rotateX: 14 },
          { opacity: 1, y: 0, rotateX: 0, ease: 'expo.out', duration: 0.9, stagger: 0.03, delay: 0.12 }
        );
      } catch (err) {
        // fallback simple fade
        letters.forEach(l => l.style.opacity = 1);
      }
    } else {
      letters.forEach(l => l.style.opacity = 1);
    }

    // hero art float
    const art = safeQuery('.aspect-video');
    if (art && supports.gsap && !prefersReduced) {
      try {
        gsap.to(art, { y: -8, repeat: -1, yoyo: true, ease: 'sine.inOut', duration: 6 });
      } catch (_) { /* noop */ }
    }
  }

  function initSwiper() {
    if (!supports.Swiper) return;
    try {
      new Swiper('.mySwiper', {
        slidesPerView: 1.1,
        spaceBetween: 16,
        breakpoints: { 768: { slidesPerView: 2.1 }, 1024: { slidesPerView: 3 } },
        pagination: { el: '.swiper-pagination', clickable: true },
      });
    } catch (err) {
      console.warn('Swiper init failed', err);
    }
  }

  function updateYear() {
    const el = safeQuery('#year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* -------------------- Micro interactions -------------------- */

  function attachCardTilt() {
    const cards = safeQueryAll('.project-card, .skill-card');
    if (!cards.length) return;
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (isTouch) return; // skip tilt on touch devices

    cards.forEach(card => {
      card.style.transformStyle = 'preserve-3d';
      let raf = null;
      const onMove = (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          const dx = (clientX - cx) / (rect.width / 2);
          const dy = (clientY - cy) / (rect.height / 2);
          const tiltX = (dy * 6).toFixed(2);
          const tiltY = (dx * -8).toFixed(2);
          card.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(6px)`;
          raf = null;
        });
      };
      const onLeave = () => { card.style.transform = ''; };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });
  }

  function attachButtonRipple() {
    const buttons = safeQueryAll('button, a.btn-primary, a.btn-ghost');
    if (!buttons.length) return;
    buttons.forEach(btn => {
      if (!btn.classList.contains('ripple')) btn.classList.add('ripple');
      btn.addEventListener('click', () => {
        btn.classList.remove('ripple--active');
        // force reflow to restart animation
        // eslint-disable-next-line no-unused-expressions
        void btn.offsetWidth;
        btn.classList.add('ripple--active');
        setTimeout(() => btn.classList.remove('ripple--active'), 650);
      });
    });
  }

  function enhanceAOSVisuals() {
    const nodes = safeQueryAll('[data-aos]');
    if (!nodes.length) return;
    nodes.forEach(n => {
      n.classList.add('aos-enhanced');
      const obs = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      obs.observe(n);
    });
  }

  function enhanceSocialIcons() {
    const icons = safeQueryAll('.fa-brands, .fa-solid.fa-envelope');
    if (!icons.length) return;
    icons.forEach(i => {
      const parent = i.parentElement;
      if (!parent) return;
      parent.style.transition = 'transform 220ms cubic-bezier(.2,.9,.2,1)';
      parent.addEventListener('mouseenter', () => parent.style.transform = 'translateY(-4px)');
      parent.addEventListener('mouseleave', () => parent.style.transform = '');
      // keyboard support
      parent.addEventListener('focus', () => parent.style.transform = 'translateY(-4px)');
      parent.addEventListener('blur', () => parent.style.transform = '');
    });
  }

  /* -------------------- Contact form handling -------------------- */

  function initContactForm() {
    // Prefer explicit id contactForm, fallback to first form[action]
    const form = safeQuery('#contactForm') || safeQuery('form[action]') || safeQuery('form');
    if (!form) return;

    const alertBox = safeQuery('#formAlert') || document.createElement('div');
    if (!document.body.contains(alertBox)) {
      // try to append after form if not present in DOM
      form.parentElement && form.parentElement.appendChild(alertBox);
      alertBox.id = 'formAlert';
    }

    const sendBtn = safeQuery('#sendBtn', form) || form.querySelector('button[type="submit"]') || form.querySelector('button');
    const honeypot = safeQuery('#website', form) || form.querySelector('input[name="website"]'); // common honeypot names

    // Helper to toggle button state and spinner
    function setSending(sending) {
      if (!sendBtn) return;
      sendBtn.disabled = sending;
      if (sending) {
        sendBtn.dataset.orig = sendBtn.innerHTML;
        sendBtn.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span> Envoi...`;
        sendBtn.classList.add('opacity-60');
      } else {
        if (sendBtn.dataset.orig) sendBtn.innerHTML = sendBtn.dataset.orig;
        sendBtn.classList.remove('opacity-60');
      }
    }

    // Basic validation helper (more checks could be added)
    function validate(values) {
      if (!values.name || values.name.trim().length < 2) return 'Votre nom doit contenir au moins 2 caractères.';
      if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return 'Veuillez fournir un email valide.';
      if (!values.subject || values.subject.trim().length < 3) return 'Sujet trop court.';
      if (!values.message || values.message.trim().length < 10) return 'Message trop court.';
      return null;
    }

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();

      // Honeypot anti-spam
      if (honeypot && honeypot.value && honeypot.value.trim() !== '') {
        // silently exit (bot)
        return;
      }

      // Gather data
      const data = Object.fromEntries(new FormData(form).entries());

      // Validate
      const error = validate(data);
      if (error) {
        setAlert(alertBox, 'error', error);
        return;
      }

      // Prepare send
      setSending(true);

      // Determine endpoint: prefer form.action or fallback to api/contact.php
      let action = form.getAttribute('action') || 'api/contact.php';
      const method = (form.getAttribute('method') || 'POST').toUpperCase();

      try {
        const res = await fetchWithTimeout(action, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }, 9000);

        // Attempt JSON parsing but be defensive
        let json = null;
        try { json = await res.json(); } catch (_) { json = null; }

        if (!res.ok) {
          const message = (json && json.error) ? json.error : `Erreur serveur (${res.status})`;
          throw new Error(message);
        }

        // If API returns { success: true } we respect it; otherwise treat as success if 2xx
        if (json && json.success === false) {
          throw new Error(json.error || 'Envoi impossible');
        }

        // Success
        form.reset();
        setAlert(alertBox, 'success', 'Merci ! Votre message a bien été envoyé. Je vous répondrai bientôt.');
      } catch (err) {
        // Network/CORS/fetch error -> fallback message + option to submit natively
        console.warn('Contact send failed:', err);
        setAlert(alertBox, 'error', err.message || "Impossible d'envoyer le message. Réessayez plus tard.");
        // As a fallback, after a short delay, submit the form natively if action appears to be a server endpoint on same site
        // but do not auto-submit when CORS or external endpoint likely.
        const sameOrigin = (() => {
          try {
            const a = document.createElement('a');
            a.href = form.getAttribute('action') || '';
            return a.hostname === window.location.hostname || !a.hostname;
          } catch { return false; }
        })();
        if (sameOrigin) {
          // allow user to click again; we won't auto-submit automatically to avoid surprise navigation
          // If you prefer automatic fallback, uncomment the next line:
          // form.submit();
        }
      } finally {
        setSending(false);
      }
    });
  }

  /* -------------------- Hero bio continuous highlight -------------------- */

  function initHeroBio() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    // Prefer explicit class, otherwise search for a paragraph that starts with "je m'appelle" or "je m’appelle"
    let bio = safeQuery('p.hero-bio') || safeQueryAll('p').find(p => /je m'?appelle/i.test(p.textContent.trim()));
    if (!bio) return;

    // Ensure CSS class present
    bio.classList.add('hero-bio');

    const bolds = safeQueryAll('b', bio);
    if (!bolds.length) return;

    // Live region for screen readers
    let live = bio.querySelector('.hero-bio-live');
    if (!live) {
      live = document.createElement('span');
      live.className = 'hero-bio-live';
      live.setAttribute('aria-live', 'polite');
      live.style.position = 'absolute';
      live.style.width = '1px';
      live.style.height = '1px';
      live.style.overflow = 'hidden';
      live.style.left = '-9999px';
      bio.appendChild(live);
    }

    // Cycle using requestAnimationFrame (smooth & pause-capable)
    let idx = 0;
    const DURATION = 2200;
    let rafId = null;
    let start = null;
    let paused = false;

    function highlight(i) {
      bolds.forEach((b, j) => {
        if (j === i) {
          b.classList.add('bio-active');
          b.setAttribute('aria-hidden', 'false');
          live.textContent = b.textContent;
        } else {
          b.classList.remove('bio-active');
          b.setAttribute('aria-hidden', 'true');
        }
      });
    }

    function step(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      if (elapsed >= DURATION) {
        idx = (idx + 1) % bolds.length;
        highlight(idx);
        start = ts;
      }
      rafId = window.requestAnimationFrame(step);
    }

    highlight(idx);
    rafId = window.requestAnimationFrame(step);

    function pause() {
      if (paused) return;
      paused = true;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }
    function resume() {
      if (!paused) return;
      paused = false;
      start = null;
      rafId = requestAnimationFrame(step);
    }

    bio.addEventListener('mouseenter', pause);
    bio.addEventListener('mouseleave', resume);
    bio.addEventListener('focusin', pause);
    bio.addEventListener('focusout', resume);

    // If GSAP is present, add a subtle float
    if (supports.gsap) {
      try {
        gsap.to(bio, { y: -6, repeat: -1, yoyo: true, ease: 'sine.inOut', duration: 5 });
      } catch (_) { /* silent */ }
    }
  }

  /* -------------------- Init all on DOM ready -------------------- */

  function initAll() {
    initAOS();
    initGSAPHero();
    initSwiper();
    updateYear();
    attachCardTilt();
    attachButtonRipple();
    enhanceAOSVisuals();
    enhanceSocialIcons();
    initContactForm();
    initHeroBio();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  /* Export functions for debugging (optional) */
  window.__berzahka = {
    initAll,
    splitLetters,
    fetchWithTimeout
  };
})();
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("projectModal");
  const modalImage = document.getElementById("modalImage");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");
  const closeModal = document.getElementById("closeModal");

  document.querySelectorAll(".project-card").forEach(card => {
    card.addEventListener("click", () => {
      modalImage.src = card.dataset.img;
      modalTitle.innerText = card.dataset.title;
      modalDesc.innerText = card.dataset.desc;
      modal.classList.remove("hidden");
    });
  });

  closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Fermer le modal en cliquant à l'extérieur
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });
});
var swiper = new Swiper(".mySwiper", {
  loop: true, // pour que le slide recommence en boucle
  autoplay: {
    delay: 3000, // délai en ms (ici 3 secondes)
    disableOnInteraction: false, // continue même si l’utilisateur interagit
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  slidesPerView: 1,
  spaceBetween: 20,
  breakpoints: {
    768: {
      slidesPerView: 2, // 2 slides sur tablettes
    },
    1024: {
      slidesPerView: 3, // 3 slides sur écrans larges
    },
  },
});
document.addEventListener("DOMContentLoaded", function () {
  // Initialise le slider Swiper sur la classe .mySwiper
  var swiper = new Swiper(".mySwiper", {
    slidesPerView: 1,
    spaceBetween: 30,
    loop: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    breakpoints: {
      640: { slidesPerView: 1 },
      768: { slidesPerView: 2 },
      1024: { slidesPerView: 3 },
    },
  });
});
// Fonction pour afficher une image en grand lors d'un clic sur .project-cover
document.addEventListener("DOMContentLoaded", function () {
  // On crée le modal une seule fois
  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.top = 0;
  modal.style.left = 0;
  modal.style.width = "100vw";
  modal.style.height = "100vh";
  modal.style.background = "rgba(0,0,0,0.7)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = 10000;
  modal.style.cursor = "pointer";
  modal.style.visibility = "hidden"; // caché par défaut

  // Image à afficher
  const modalImg = document.createElement("img");
  modalImg.style.maxWidth = "80vw";
  modalImg.style.maxHeight = "80vh";
  modalImg.style.borderRadius = "10px";
  modal.appendChild(modalImg);

  // Ajoute le modal dans le body
  document.body.appendChild(modal);

  // Ferme le modal quand on clique dessus
  modal.addEventListener("click", function () {
    modal.style.visibility = "hidden";
  });

  // Ajoute le listener à toutes les images de projet
  document.querySelectorAll(".project-cover").forEach(function (img) {
    img.addEventListener("click", function () {
      modalImg.src = img.src;
      modal.style.visibility = "visible";
    });
  });
});
