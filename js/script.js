
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const header = $('header');
  const video = $('.bg-video');
  const story = $('main');
  const cue = $('header > div:nth-of-type(6)');

  /* ---------------------------------------------------------
     1. Feature cards
     The HTML only has the icon images, so the white card and
     its label are created here (label comes from the alt text).
     --------------------------------------------------------- */

  const LABELS = {
    fruits: 'Healthy',
    vegmode: 'Veg Mode',
    order: 'Schedule\nyour order',
    gourmet: 'Gourmet',
    offers: 'Offers',
    plan: 'Plan\na Party',
    giftcard: 'Gift Cards',
    train: 'Food on\nTrain',
    collections: 'Collections',
  };

  function buildFeatureCards() {
    const icons = $$(
      'footer > div:nth-child(5) > img, footer > div:nth-child(6) > img:nth-child(-n + 4)'
    );

    icons.forEach((img, i) => {
      const key = (img.getAttribute('alt') || '').trim().toLowerCase();
      if (!LABELS[key]) return; // the phone and coins stay as plain images

      const card = document.createElement('div');
      card.className = 'feature-card' + (key === 'order' ? ' feature-card--order' : '');
      card.style.setProperty('--i', i);

      const label = document.createElement('span');
      label.className = 'feature-label';
      label.textContent = LABELS[key];

      img.replaceWith(card);
      card.append(img, label);
    });
  }

  buildFeatureCards();

  $$('main img, footer img').forEach((img) => {
    img.loading = 'lazy';
    img.decoding = 'async';
  });

  /* ---------------------------------------------------------
     2. Reveal on scroll
     --------------------------------------------------------- */

  let observer = null;

  function mark(elements, type, step = 0.08, base = 0) {
    if (!observer) return;
    elements.forEach((el, i) => {
      el.classList.add(type);
      el.style.setProperty('--delay', (base + i * step).toFixed(2) + 's');
      observer.observe(el);
    });
  }

  if (animate && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js');

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );

    // hero text, one after another
    mark($$('header > div:nth-of-type(-n + 5)'), 'reveal', 0.1, 0.05);

    // story: headline fades (no transform, its photos are positioned inside it)
    mark($$('main > div:nth-child(2), main > div:nth-child(3)'), 'fade', 0.15);
    mark($$('main > div:nth-child(3) > div'), 'reveal', 0.12, 0.25);
    mark(
      $$('main > div:nth-child(1) img, main > div:nth-child(2) img, main > div:nth-child(3) > img'),
      'pop',
      0.1,
      0.2
    );

    // footer headings + paragraph
    mark($$('footer > div:nth-child(-n + 4)'), 'reveal', 0.1);

    // phone + cards
    mark($$('footer > div:nth-child(5) > img'), 'rise-out');
    mark($$('footer > div:nth-child(5) .feature-card'), 'pop', 0.07, 0.55);
    mark($$('footer > div:nth-child(6) > .feature-card'), 'pop', 0.07, 0.55);

    // gold
    mark($$('footer > div:nth-child(6) > img:nth-child(n + 5)'), 'pop', 0.12);
    mark($$('footer > div:nth-child(6) > div:nth-child(n + 7):nth-child(-n + 13)'), 'reveal', 0.09);
  }

  /* ---------------------------------------------------------
     3. Count-up stats
     --------------------------------------------------------- */

  function setupCounters() {
    const box = $('main > div:nth-child(4)');
    if (!box) return;

    const counters = [];
    const items = [];

    Array.from(box.childNodes).forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE) return;

      const text = node.textContent.replace(/\s+/g, ' ').trim();
      if (!text) return;

      // "3,00,000+ restaurants" -> big "3,00,000+" and small "restaurants"
      const parts = text.match(/^(.*?\+)\s*(.*)$/) || text.match(/^(\S+)\s*(.*)$/);
      if (!parts) return;
      const big = parts[1];
      const rest = parts[2];

      const item = document.createElement('div');
      item.className = 'stat-item';

      const stat = document.createElement('span');
      stat.className = 'stat';

      const num = document.createElement('span');
      num.className = 'stat-num';

      const digits = big.match(/\d[\d,]*/);
      if (digits) {
        const count = document.createElement('span');
        count.className = 'count';
        count.textContent = digits[0];
        num.append(big.slice(0, digits.index), count, big.slice(digits.index + digits[0].length));
        counters.push({ num: count, target: parseInt(digits[0].replace(/,/g, ''), 10) });
      } else {
        num.textContent = big;
      }

      const label = document.createElement('span');
      label.className = 'stat-label';
      label.textContent = rest;

      stat.append(num, label);
      item.append(stat);

      // the icon that follows this statement joins the same cell
      let next = node.nextSibling;
      while (next && next.nodeType === Node.TEXT_NODE && !next.textContent.trim()) {
        next = next.nextSibling;
      }
      if (next && next.nodeName === 'IMG') item.append(next);

      node.replaceWith(item);
      items.push(item);
    });

    if (!animate || !('IntersectionObserver' in window)) return;

    // lock each number's width so the row doesn't jiggle while counting
    counters.forEach((c) => {
      c.num.style.minWidth = c.num.getBoundingClientRect().width + 'px';
      c.num.textContent = '0';
    });

    mark(items, 'reveal', 0.15);

    const run = (c, delay) => {
      const duration = 1600;
      setTimeout(() => {
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          c.num.textContent = Math.round(c.target * eased).toLocaleString('en-IN');
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, delay);
    };

    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          counters.forEach((c, i) => run(c, i * 150));
          countObserver.disconnect();
        });
      },
      { threshold: 0.5 }
    );
    countObserver.observe(box);
  }

  setupCounters();

  /* ---------------------------------------------------------
     4. Scroll-driven motion
     --------------------------------------------------------- */

  const photos = [
    // [selector, speed]  (negative = drifts the other way)
    ['main > div:nth-child(1) img', -0.05],
    ['main > div:nth-child(2) img', 0.07],
    ['main > div:nth-child(3) > img:nth-of-type(1)', -0.04],
    ['main > div:nth-child(3) > img:nth-of-type(2)', 0.1],
    ['main > div:nth-child(3) > img:nth-of-type(3)', -0.06],
    ['main > div:nth-child(3) > img:nth-of-type(4)', 0.12],
  ]
    .map(([sel, speed]) => ({ el: $(sel), speed }))
    .filter((p) => p.el);

  const coins = [
    ['footer > div:nth-child(6) > img:nth-child(5)', 1],
    ['footer > div:nth-child(6) > img:nth-child(6)', -1],
    ['footer > div:nth-child(6) > div:nth-child(14) img', 1],
  ]
    .map(([sel, dir]) => ({ el: $(sel), dir }))
    .filter((c) => c.el);

  if (animate) {
    photos.forEach((p) => p.el.classList.add('parallax'));
  }

  let ticking = false;

  function update() {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    // hero: slow zoom + hide the "Scroll down" cue
    if (cue) cue.classList.toggle('is-hidden', y > 40);
    if (animate && video && y < vh * 1.2) {
      video.style.setProperty('--zoom', (1 + Math.min(y / vh, 1) * 0.12).toFixed(3));
    }

    if (!animate) return;

    // food photos drift at different speeds
    if (story) {
      const rect = story.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < vh) {
        const offset = rect.top + vw * 0.225 - vh / 2; // 0 when the headline is centred
        photos.forEach((p) => p.el.style.setProperty('--p', (offset * p.speed).toFixed(1)));
      }
    }

    // coins turn as you scroll
    coins.forEach((c) => {
      c.el.style.rotate = ((y * 0.08 * c.dir) % 360).toFixed(1) + 'deg';
    });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  // "Scroll down" jumps to the story section
  if (cue && story) {
    cue.addEventListener('click', () => {
      story.scrollIntoView({ behavior: animate ? 'smooth' : 'auto' });
    });
  }

  /* ---------------------------------------------------------
     5. Hero video: play only while visible
     --------------------------------------------------------- */

  if (video && header && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const playing = video.play();
        if (playing && playing.catch) playing.catch(() => {});
      } else {
        video.pause();
      }
    }).observe(header);
  }
})();