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

  /* ---------- Contact form ----------
     Zero-config default: builds a mailto: link from the form
     fields so messages land directly in your inbox with no
     backend required.

     Want submissions to land quietly without opening the visitor's
     mail app? Sign up at https://formspree.io, grab your endpoint,
     and replace the body of this handler with a fetch() POST to
     that endpoint instead.
  ---------------------------------------------------------- */
  const form = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const project = form.project.value;
    const message = form.message.value.trim();

    if (!name || !message) {
      formStatus.textContent = 'Please fill in your name and message.';
      return;
    }

    const subject = encodeURIComponent(`${project} inquiry — ${name}`);
    const body = encodeURIComponent(
      `${message}\n\n—\n${name}\nProject type: ${project}`
    );

    formStatus.textContent = 'Opening your email app…';
    window.location.href = `mailto:creativesbyandrej@gmail.com?subject=${subject}&body=${body}`;

    setTimeout(() => {
      formStatus.textContent = "If nothing opened, email creativesbyandrej@gmail.com directly.";
    }, 1200);
  });
});
