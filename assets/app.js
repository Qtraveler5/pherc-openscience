/* ─────────────────────────────────────────────
   Themen-Metadaten (nur Namen, keine Icons)
   ───────────────────────────────────────────── */
const THEME_META = {
  ethik:    { name: 'Ethik & Tugend' },
  natur:    { name: 'Natur & Physik' },
  musik:    { name: 'Musik & Ästhetik' },
  rhetorik: { name: 'Rhetorik & Sprache' },
  wissen:   { name: 'Wissen & Erkenntnis' },
  liebe:    { name: 'Liebe & Begehren' },
  tod:      { name: 'Tod & Vergänglichkeit' },
  goetter:  { name: 'Götter & Religion' },
  politik:  { name: 'Politik & Gemeinwesen' },
  alltag:   { name: 'Alltag & Haushalt' }
};

const THEME_ORDER = ['ethik', 'natur', 'musik', 'rhetorik', 'wissen', 'liebe', 'tod', 'goetter', 'politik', 'alltag'];

/* ─────────────────────────────────────────────
   Zustand
   ───────────────────────────────────────────── */
let DATA = {};
let currentTheme = null;
let currentTextIndex = 0;
let currentLang = 'de';

/* Erkennt kleine Bildschirme für Performance */
const IS_MOBILE = window.matchMedia('(max-width: 600px)').matches;
const PREFERS_REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─────────────────────────────────────────────
   Daten laden
   ───────────────────────────────────────────── */
async function loadAllData() {
  const promises = THEME_ORDER.map(async (themeId) => {
    try {
      const res = await fetch(`data/${themeId}.json?v=2`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return [themeId, json.texte || []];
    } catch (err) {
      console.warn(`Konnte ${themeId}.json nicht laden:`, err);
      return [themeId, []];
    }
  });
  const results = await Promise.all(promises);
  DATA = Object.fromEntries(results);
}

/* ─────────────────────────────────────────────
   Themen-Grid
   ───────────────────────────────────────────── */
function renderThemesGrid() {
  const grid = document.getElementById('themesGrid');
  grid.innerHTML = '';

  const totalTexts = Object.values(DATA).reduce((sum, arr) => sum + arr.length, 0);

  THEME_ORDER.forEach((themeId) => {
    const meta = THEME_META[themeId];
    const texts = DATA[themeId] || [];
    if (texts.length === 0) return;

    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'theme';
    el.dataset.theme = themeId;
    el.setAttribute('aria-label', `${meta.name}, ${texts.length} Texte`);
    el.innerHTML = `
      <div class="theme-name serif">${meta.name}</div>
      <div class="theme-count">${texts.length} Texte</div>
    `;

    /* Hover-Effekt nur auf Geräten mit Zeiger */
    if (!IS_MOBILE) {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        el.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      });
    }

    el.addEventListener('click', () => selectTheme(themeId));
    grid.appendChild(el);
  });

  document.getElementById('counter-trans').textContent = totalTexts;
  document.getElementById('counter-themes').textContent =
    Object.keys(DATA).filter(k => (DATA[k] || []).length > 0).length;
}

/* ─────────────────────────────────────────────
   Thema auswählen
   ───────────────────────────────────────────── */
function selectTheme(themeId) {
  currentTheme = themeId;
  currentTextIndex = 0;
  currentLang = 'de';

  document.querySelectorAll('.theme').forEach(el => {
    el.classList.toggle('active', el.dataset.theme === themeId);
  });

  const reader = document.getElementById('reader');
  reader.classList.add('visible');

  renderText();

  /* Sanft zum Leser scrollen, mit Abstand zum oberen Rand */
  setTimeout(() => {
    const top = reader.getBoundingClientRect().top + window.scrollY - 20;
    window.scrollTo({ top, behavior: PREFERS_REDUCED_MOTION ? 'auto' : 'smooth' });
  }, 150);
}

/* ─────────────────────────────────────────────
   Text rendern
   ───────────────────────────────────────────── */
function renderText() {
  if (!currentTheme) return;
  const texts = DATA[currentTheme] || [];
  if (texts.length === 0) return;

  const text = texts[currentTextIndex];
  const readerText = document.getElementById('rText');
  const readerAuthor = document.getElementById('rAuthor');
  const readerWork = document.getElementById('rWork');
  const readerSource = document.getElementById('rSourceLink');
  const readerPosition = document.getElementById('rPosition');
  const readerCount = document.getElementById('rCount');

  readerText.classList.add('switching');

  setTimeout(() => {
    if (currentLang === 'de') {
      readerText.textContent = text.deutsch;
      readerText.className = 'reader-text german-text switching';
    } else {
      readerText.textContent = text.griechisch;
      readerText.className = 'reader-text greek-text switching';
    }

    readerAuthor.textContent = text.autor;
    readerWork.textContent = `${text.werk} — ${text.kolumne || ''}, ${text.zeilen || ''}`;

    const sourceLabel = text.quelle
      ? `${text.quelle.primaer} · ${text.quelle.edition}`
      : '—';
    readerSource.textContent = sourceLabel;
    readerSource.href = text.quelle ? text.quelle.url : '#';

    readerPosition.textContent = text.quelle?.primaer || '—';
    readerCount.textContent = `${currentTextIndex + 1} / ${texts.length}`;

    document.querySelectorAll('.reader-tab').forEach(tab => {
      const isActive = tab.dataset.lang === currentLang;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    document.getElementById('rPrev').disabled = currentTextIndex === 0;
    document.getElementById('rNext').disabled = currentTextIndex === texts.length - 1;

    setTimeout(() => readerText.classList.remove('switching'), 50);
  }, 350);
}

/* ─────────────────────────────────────────────
   Sprachwechsel
   ───────────────────────────────────────────── */
document.querySelectorAll('.reader-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const lang = tab.dataset.lang;
    if (lang === currentLang) return;
    currentLang = lang;
    renderText();
  });
});

/* ─────────────────────────────────────────────
   Navigation
   ───────────────────────────────────────────── */
document.getElementById('rPrev').addEventListener('click', () => {
  if (currentTextIndex > 0) {
    currentTextIndex--;
    renderText();
  }
});

document.getElementById('rNext').addEventListener('click', () => {
  const texts = DATA[currentTheme] || [];
  if (currentTextIndex < texts.length - 1) {
    currentTextIndex++;
    renderText();
  }
});

/* ─────────────────────────────────────────────
   Wischen im Leser: links/rechts wechselt Text
   ───────────────────────────────────────────── */
(function initReaderSwipe() {
  const reader = document.getElementById('reader');
  if (!reader) return;

  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoved = false;

  reader.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchMoved = false;
  }, { passive: true });

  reader.addEventListener('touchmove', () => {
    touchMoved = true;
  }, { passive: true });

  reader.addEventListener('touchend', (e) => {
    if (!touchMoved) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    /* Nur horizontale Wische, mindestens 60px, und nicht zu schräg */
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

    const texts = DATA[currentTheme] || [];

    if (dx < 0 && currentTextIndex < texts.length - 1) {
      /* Wisch nach links: nächster Text */
      currentTextIndex++;
      renderText();
    } else if (dx > 0 && currentTextIndex > 0) {
      /* Wisch nach rechts: vorheriger Text */
      currentTextIndex--;
      renderText();
    }
  }, { passive: true });
})();

/* ─────────────────────────────────────────────
   Beweglicher Sternenhimmel mit Neigung
   ───────────────────────────────────────────── */
(function initSky() {
  const field = document.getElementById('skyField');
  if (!field) return;

  /* Auf Mobil weniger Sterne für Performance */
  const STAR_COUNT = IS_MOBILE ? 100 : 180;
  /* Auf Mobil reduzierte Bewegung */
  const MOVE_AMPLITUDE = IS_MOBILE ? 0.5 : 0.8;

  const FIELD_SIZE = 300;

  for (let i = 0; i < STAR_COUNT; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 1.8 + 0.4;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDelay = Math.random() * 8 + 's';
    star.style.animationDuration = (5 + Math.random() * 5) + 's';
    field.appendChild(star);
  }

  const laniakea = field.querySelector('.laniakea');
  if (laniakea) {
    laniakea.style.left = '55%';
    laniakea.style.top = '35%';
  }

  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;

  function applyTransform() {
    const maxShift = (FIELD_SIZE - 100) / 2;
    const x = currentX * maxShift;
    const y = currentY * maxShift;
    field.style.transform = `translate(${x}%, ${y}%)`;
  }

  function loop() {
    currentX += (targetX - currentX) * 0.05;
    currentY += (targetY - currentY) * 0.05;
    applyTransform();
    requestAnimationFrame(loop);
  }

  /* Bei reduzierter Bewegung keine Animation starten */
  if (!PREFERS_REDUCED_MOTION) {
    loop();
  }

  /* Desktop: Mausbewegung */
  if (!IS_MOBILE) {
    window.addEventListener('mousemove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetX = -nx * MOVE_AMPLITUDE;
      targetY = -ny * MOVE_AMPLITUDE;
    });
  }

  /* Mobil: Geräteneigung */
  function handleOrientation(e) {
    const gamma = e.gamma || 0;
    const beta = e.beta || 0;
    const nx = Math.max(-1, Math.min(1, gamma / 45));
    const ny = Math.max(-1, Math.min(1, (beta - 45) / 45));
    targetX = -nx * MOVE_AMPLITUDE;
    targetY = -ny * MOVE_AMPLITUDE;
  }

  function requestOrientationPermission() {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      DeviceOrientationEvent.requestPermission()
        .then((response) => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(() => {});
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
      window.addEventListener('deviceorientation', handleOrientation);
    }
  }

  window.addEventListener(
    'touchstart',
    function once() {
      requestOrientationPermission();
      window.removeEventListener('touchstart', once);
    },
    { once: true, passive: true }
  );

  setTimeout(requestOrientationPermission, 1000);
})();

/* ─────────────────────────────────────────────
   Intro-Animation mit Video (4,5 Sekunden)
   Ton wird versucht, bei Blockade stumm gestartet
   ───────────────────────────────────────────── */
function runIntro() {
  const intro = document.getElementById('intro');
  const video = intro ? intro.querySelector('.intro-video') : null;
  const body = document.body;

  body.style.opacity = '0';
  body.style.transition = 'opacity 1s ease';

  let videoEnded = false;

  function endIntro() {
    if (videoEnded) return;
    videoEnded = true;

    if (video) {
      video.style.transition = 'opacity 0.5s ease';
      video.style.opacity = '0';
    }

    setTimeout(() => {
      body.style.opacity = '1';
      const hero = document.querySelector('.hero');
      const header = document.querySelector('header');
      if (header) header.classList.add('reveal');
      if (hero) hero.classList.add('reveal');
    }, 150);

    setTimeout(() => {
      if (video) {
        try { video.pause(); } catch (e) {}
      }
      if (intro) intro.classList.add('done');
      body.style.opacity = '';
      body.style.transition = '';
    }, 1200);
  }

  if (video) {
    try {
      video.currentTime = 0;
      video.muted = false;

      const playPromise = video.play();

      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          video.muted = true;
          video.play().catch(() => {
            setTimeout(endIntro, 3000);
          });
        });
      }

      video.addEventListener('ended', endIntro);

      setTimeout(() => {
        if (!videoEnded) endIntro();
      }, 3200);
    } catch (e) {
      setTimeout(endIntro, 3000);
    }
  } else {
    setTimeout(endIntro, 3000);
  }
}

/* ─────────────────────────────────────────────
   Sternschnuppen: Winkel zufällig variieren
   ───────────────────────────────────────────── */
(function initShootingStars() {
  if (PREFERS_REDUCED_MOTION) return;

  const wrappers = document.querySelectorAll('.shooting-star-wrapper');

  wrappers.forEach((wrapper) => {
    const setRandomAngle = () => {
      const angle = 15 + Math.random() * 40;
      wrapper.style.setProperty('--angle', angle + 'deg');
    };

    setRandomAngle();

    wrapper.addEventListener('animationiteration', () => {
      setRandomAngle();
      const top = Math.random() * 60 + 5;
      wrapper.style.top = top + '%';
    });
  });
})();

/* ─────────────────────────────────────────────
   Verhindern, dass Safari beim schnellen Scrollen
   den Doppel-Tap-Zoom auslöst
   ───────────────────────────────────────────── */
(function preventDoubleTapZoom() {
  let lastTouch = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouch <= 300) {
      e.preventDefault();
    }
    lastTouch = now;
  }, { passive: false });
})();

/* ─────────────────────────────────────────────
   Start
   ───────────────────────────────────────────── */
(async function init() {
  await loadAllData();
  renderThemesGrid();
})();

window.addEventListener('DOMContentLoaded', () => {
  runIntro();
});
