/* =========================================================
   ANDREJ CREATIVES — site scripts
   No dependencies, no build step. Everything below is plain
   JS so this can be dropped straight onto Vercel as a static
   site.
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

  /* ---------- Video lightbox ----------
     Each .work-card carries a data-video attribute. Point it at
     an exported MP4 (e.g. data-video="videos/visa-borderless.mp4")
     and clicking the card will play it here.

     Using a YouTube / Vimeo link instead? Swap the <video> element
     in index.html for an <iframe>, and update openLightbox() below
     to set iframe.src instead of video.src.
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

  /* ---------- Cursor spotlight ----------
     Service cards and work thumbnails each carry an --accent color
     (set in CSS). On mousemove we just record the pointer position
     as --mx / --my so the CSS radial-gradient can follow it. Skips
     entirely on touch (no mousemove) and under reduced-motion.
  ---------------------------------------------------------- */
  if (!prefersReducedMotion) {
    document.querySelectorAll('.service-card, .work-thumb').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
        el.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`);
      });
    });
  }

  /* ---------- Contact form ----------
     Zero-config default: builds a mailto: link from the form
     fields so messages land directly in your inbox with no
     backend required.

     Submissions post quietly to Formspree (the endpoint already set
     in the form's action= attribute in index.html) via fetch, so the
     visitor never leaves the page. Falls back to a clear message
     pointing at the direct email address if the request fails.
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
