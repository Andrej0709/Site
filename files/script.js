/* =========================================================
   ANDREJ CREATIVES — site scripts
   No dependencies, no build step. Plain JS so this can be
   dropped straight onto Vercel as a static site.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky / frosted header ---------- */
  const header = document.getElementById('siteHeader');
  const setHeaderState = () => {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  /* ---------- Mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');

  const closeMobileNav = () => {
    navToggle.classList.remove('open');
    mobileNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  navToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  }

  /* ---------- Toast helper ---------- */
  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  /* ---------- Work tabs (Motion Graphics / Short-Form) ---------- */
  const workTabs = document.querySelectorAll('.work-tab');
  workTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      workTabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const targetId = tab.getAttribute('data-target');
      document.querySelectorAll('.work-panel').forEach((panel) => {
        panel.classList.toggle('active', panel.id === targetId);
      });
    });
  });

  /* ---------- Drag-to-scroll work carousels ----------
     Lets people drag the horizontal work strips with a mouse,
     same as scrolling on trackpad/touch. Click vs. drag is
     disambiguated by distance moved, so cards still open on a
     genuine click/tap.
  ---------------------------------------------------------- */
  document.querySelectorAll('.work-scroller').forEach((scroller) => {
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
    let moved = 0;

    scroller.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return; // native touch scroll is fine as-is
      isDown = true;
      moved = 0;
      startX = e.clientX;
      scrollStart = scroller.scrollLeft;
      scroller.classList.add('dragging');
    });

    scroller.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      moved = Math.abs(dx);
      scroller.scrollLeft = scrollStart - dx;
    });

    const endDrag = () => {
      isDown = false;
      scroller.classList.remove('dragging');
    };
    scroller.addEventListener('pointerup', endDrag);
    scroller.addEventListener('pointerleave', endDrag);

    // Suppress the click that follows a real drag so cards don't
    // accidentally open the lightbox while someone is scrolling.
    scroller.addEventListener(
      'click',
      (e) => {
        if (moved > 6) {
          e.stopPropagation();
          e.preventDefault();
        }
      },
      true
    );
  });

  /* ---------- Video lightbox ----------
     Each .work-card carries a data-video attribute. Point it at
     an exported MP4 (e.g. data-video="videos/spotify-ad.mp4") and
     clicking the card will play it here.
  ---------------------------------------------------------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxVideo = document.getElementById('lightboxVideo');
  const lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(src) {
    lightboxVideo.src = src;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lightboxVideo.play().catch(() => {});
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxVideo.pause();
    lightboxVideo.src = '';
    document.body.style.overflow = '';
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });

  document.querySelectorAll('.work-card').forEach((card) => {
    const src = card.getAttribute('data-video');

    const trigger = () => {
      if (src) {
        openLightbox(src);
      } else {
        showToast('Add a video file to this card — see the comment in index.html');
      }
    };

    card.addEventListener('click', trigger);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger();
      }
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');

    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // close any other open item for a single-open accordion
      document.querySelectorAll('.faq-item.open').forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove('open');
          openItem.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
          openItem.querySelector('.faq-a').style.maxHeight = null;
        }
      });

      item.classList.toggle('open', !isOpen);
      q.setAttribute('aria-expanded', String(!isOpen));
      a.style.maxHeight = !isOpen ? `${a.scrollHeight}px` : null;
    });
  });

  /* ---------- Contact form ----------
     Submits quietly to Formspree (endpoint set in the form's
     action= attribute) via fetch, so the visitor never leaves
     the page. Falls back to a clear message pointing at the
     direct email address if the request fails.
  ---------------------------------------------------------- */
  const form = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!email || !message) {
      formStatus.textContent = 'Please fill in your email and message.';
      return;
    }

    const submitBtn = form.querySelector('.form-submit');
    submitBtn.disabled = true;
    formStatus.textContent = 'Sending…';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });

      if (!res.ok) throw new Error('Request failed');

      formStatus.textContent = "Thanks — I'll get back to you within a day.";
      form.reset();
    } catch (err) {
      formStatus.textContent = 'Something went wrong — email me directly at creativesbyandrej@gmail.com.';
    } finally {
      submitBtn.disabled = false;
    }
  });
});
