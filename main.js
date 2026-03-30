/**
 * NEXUS — JavaScript global partagé
 * main.js — Fonctionnalités communes à toutes les pages
 */

/* ============================================================
   THÈME — appliqué immédiatement via script inline dans <head>
   (pas de FOUC). Ici on gère juste l'icône et le toggle.
   ============================================================ */
(function applyThemeImmediately() {
  const saved = localStorage.getItem('nexus-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     1. TOGGLE THÈME
  ---------------------------------------------------------- */
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon   = document.getElementById('theme-icon');

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function setThemeIcon(theme) {
    if (themeIcon) themeIcon.textContent = theme === 'dark' ? '🌞' : '🌙';
  }

  // Initialiser l'icône selon le thème courant
  setThemeIcon(getTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = getTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('nexus-theme', next);
      setThemeIcon(next);
    });
  }

  /* ----------------------------------------------------------
     2. NAVIGATION ACTIVE (détection par pathname)
  ---------------------------------------------------------- */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  function markActive(linkSelector) {
    document.querySelectorAll(linkSelector).forEach(link => {
      const href = (link.getAttribute('href') || '').split('/').pop();
      if (href === currentPath || (currentPath === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  }

  markActive('.nav-link');
  markActive('.mobile-nav-link');

  /* ----------------------------------------------------------
     3. HEADER SCROLL (ombre) + BARRE DE LECTURE + RETOUR HAUT
  ---------------------------------------------------------- */
  const header      = document.querySelector('.site-header');
  const progressBar = document.getElementById('reading-progress');
  const backToTop   = document.getElementById('back-to-top');

  function onScroll() {
    const scrollY    = window.scrollY;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;

    // Ombre header
    if (header) header.classList.toggle('scrolled', scrollY > 8);

    // Barre de progression lecture
    if (progressBar && docHeight > 0) {
      progressBar.style.width = ((scrollY / docHeight) * 100).toFixed(2) + '%';
    }

    // Bouton retour en haut
    if (backToTop) backToTop.classList.toggle('visible', scrollY > 300);
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ----------------------------------------------------------
     4. MENU HAMBURGER MOBILE
  ---------------------------------------------------------- */
  const hamburger      = document.getElementById('hamburger');
  const mobileNav      = document.getElementById('mobile-nav');
  const mobileBackdrop = document.getElementById('mobile-nav-backdrop');
  const mobileClose    = document.getElementById('mobile-nav-close');

  function openMobileNav() {
    mobileNav?.classList.add('open');
    hamburger?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    mobileNav?.classList.remove('open');
    hamburger?.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', openMobileNav);
  mobileBackdrop?.addEventListener('click', closeMobileNav);
  mobileClose?.addEventListener('click', closeMobileNav);

  // Fermer sur touche Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileNav();
  });

  /* ----------------------------------------------------------
     5. RECHERCHE EN TEMPS RÉEL
     Collecte tous les .article-title visibles sur la page
  ---------------------------------------------------------- */
  const searchInput   = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  if (searchInput && searchResults) {

    // Récupère les articles indexables sur la page courante
    function collectArticles() {
      return Array.from(document.querySelectorAll('.article-title')).map(el => {
        const card     = el.closest('.article-card');
        const link     = el.closest('a') || card?.querySelector('a[href]');
        const badgeEl  = card?.querySelector('.badge') || el.closest('[class*="badge"]');
        const category = badgeEl ? badgeEl.textContent.trim() : '';
        const href     = link?.getAttribute('href') || 'article.html';
        return { title: el.textContent.trim(), category, href };
      });
    }

    // Met en surbrillance les occurrences de la requête
    function highlight(text, q) {
      if (!q) return text;
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return text.replace(new RegExp(`(${safe})`, 'gi'), '<mark>$1</mark>');
    }

    function renderResults(matches, q) {
      if (matches.length === 0) {
        searchResults.innerHTML = `
          <div class="search-result-item">
            <span class="result-title">Aucun résultat pour « ${q} »</span>
          </div>`;
      } else {
        searchResults.innerHTML = matches.map(m => `
          <a href="${m.href}" class="search-result-item">
            <div class="result-title">${highlight(m.title, q)}</div>
            ${m.category ? `<div class="result-category">${m.category}</div>` : ''}
          </a>`).join('');
      }
      searchResults.classList.add('active');
    }

    let debounceTimer;
    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const q = this.value.trim();
        if (!q || q.length < 2) {
          searchResults.innerHTML = '';
          searchResults.classList.remove('active');
          return;
        }
        const articles = collectArticles();
        const matches  = articles
          .filter(a => a.title.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 7);
        renderResults(matches, q);
      }, 120);
    });

    // Fermer en cliquant hors
    document.addEventListener('click', (e) => {
      if (!searchInput.closest('.header-search').contains(e.target)) {
        searchResults.classList.remove('active');
      }
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchResults.classList.remove('active');
        searchInput.blur();
      }
    });
  }

  /* ----------------------------------------------------------
     6. ANIMATIONS REVEAL (IntersectionObserver)
  ---------------------------------------------------------- */
  const reveals = document.querySelectorAll('.reveal');

  if (reveals.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold:  0.08,
      rootMargin: '0px 0px -32px 0px'
    });

    reveals.forEach(el => observer.observe(el));
  } else {
    // Fallback : rendre tout visible immédiatement
    reveals.forEach(el => el.classList.add('visible'));
  }

  /* ----------------------------------------------------------
     7. FORMULAIRES NEWSLETTER (inline banners)
  ---------------------------------------------------------- */
  document.querySelectorAll('.newsletter-form-inline').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailEl = form.querySelector('input[type="email"]');
      if (!emailEl || !emailEl.value.trim()) return;

      const emailVal = emailEl.value.trim();
      // Validation simple format email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        emailEl.style.borderColor = '#C8392B';
        emailEl.focus();
        setTimeout(() => { emailEl.style.borderColor = ''; }, 2000);
        return;
      }

      localStorage.setItem('nexus-newsletter-email', emailVal);
      emailEl.value = '';

      const btn = form.querySelector('.btn');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✓ Inscrit !';
        btn.style.background = '#1A6B4A';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
        }, 3500);
      }
    });
  });

  /* ----------------------------------------------------------
     8. PARTAGE D'ARTICLE (copier le lien)
  ---------------------------------------------------------- */
  const copyLinkBtns = document.querySelectorAll('[data-action="copy-link"]');
  copyLinkBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        const orig = btn.title;
        btn.title = 'Lien copié !';
        btn.style.color = '#1A6B4A';
        setTimeout(() => { btn.title = orig; btn.style.color = ''; }, 2000);
      } catch {
        // Fallback silencieux
      }
    });
  });

  /* ----------------------------------------------------------
     9. TAGS CLIQUABLES (filtre visuel simple)
  ---------------------------------------------------------- */
  document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', function () {
      const query = this.textContent.replace('#', '').trim();
      // Si la recherche est disponible, l'alimenter avec le tag
      if (searchInput) {
        searchInput.value = query;
        searchInput.dispatchEvent(new Event('input'));
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        searchInput.focus();
      }
    });
  });

});
