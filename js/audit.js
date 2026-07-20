// DE SCAN — Powerbee audit intake.
// One question at a time, honeycomb progress, and a finale
// that turns the answer into a small spectacle. Demo only: nothing is sent.

import { gsap } from 'gsap';
import { createSwarm } from './swarm.js';
import { initTheme } from './theme.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

/* ============================================================
   questions
   ============================================================ */

const QUESTIONS = [
  {
    idx: '01', type: 'text', key: 'bedrijf',
    title: 'Hoe heet je <em>bedrijf?</em>',
    placeholder: 'bv. Furnibo BV',
  },
  {
    idx: '02', type: 'chips', key: 'verbruik',
    title: 'Waar zit je grootste <em>verbruik?</em>',
    options: ['Productie & machines', 'Koeling & verwarming', 'Logistiek & transport', 'Kantoor & IT', 'Horeca', 'Iets anders'],
  },
  {
    idx: '03', type: 'chips', key: 'kost',
    title: 'Wat betaal je jaarlijks aan <em>energie?</em>',
    options: ['Minder dan € 10.000', '€ 10.000 — € 25.000', '€ 25.000 — € 75.000', 'Meer dan € 75.000', 'Geen idee — daarom zit ik hier'],
  },
  {
    idx: '04', type: 'multi', key: 'installatie',
    title: 'Wat ligt er vandaag <em>al?</em>',
    options: ['Zonnepanelen', 'Batterij', 'Laadpalen', 'Monitoring', 'Nog niets'],
  },
  {
    idx: '05', type: 'chips', key: 'frustratie',
    title: 'Wat frustreert je het <em>meest?</em>',
    options: ['De factuur zelf', 'Piektarieven', 'Geen inzicht', 'Mijn contract', 'Alles, eerlijk gezegd'],
  },
  {
    idx: '06', type: 'chips', key: 'start',
    title: 'Wanneer wil je <em>starten?</em>',
    options: ['Deze maand', 'Dit kwartaal', 'Dit jaar', 'Ik verken nog'],
  },
  {
    idx: '07', type: 'text', key: 'email', inputType: 'email',
    title: 'Waar mogen we het <em>rapport</em> naartoe?',
    placeholder: 'naam@bedrijf.be', submit: true,
  },
];

const answers = {};
let current = 0;

/* ============================================================
   background & cursor (shared look with the main site)
   ============================================================ */

let swarm = null;
if (!reduced) {
  try {
    swarm = createSwarm(document.getElementById('swarm'));
    swarm.setOpacity(0.55);
  } catch { document.getElementById('swarm').style.display = 'none'; }
}

let isLight = false;
initTheme((t) => {
  isLight = t === 'light';
  if (swarm) swarm.setInk(isLight);
});

if (finePointer && !reduced) {
  const dot = document.getElementById('cursor');
  const ring = document.getElementById('cursorRing');
  const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => {
    dotX(e.clientX); dotY(e.clientY); ringX(e.clientX); ringY(e.clientY);
  }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    if (e.target.closest('a, button, .chip, input')) ring.classList.add('is-hover');
    else ring.classList.remove('is-hover');
  });
}

/* ============================================================
   progress rail
   ============================================================ */

const railCells = document.getElementById('railCells');
QUESTIONS.forEach(() => {
  railCells.insertAdjacentHTML('beforeend',
    `<svg class="rail-cell" viewBox="0 0 120 104"><polygon class="rail-hex-outline" points="30,2 90,2 118,52 90,102 30,102 2,52"/></svg>`);
});
const railStep = document.getElementById('railStep');

function updateRail() {
  [...railCells.children].forEach((c, i) => {
    c.classList.toggle('done', i < current);
    c.classList.toggle('active', i === current);
  });
  railStep.textContent = String(Math.min(current + 1, QUESTIONS.length)).padStart(2, '0');
}

/* ============================================================
   question rendering
   ============================================================ */

const stage = document.getElementById('stage');

function renderQuestion(q) {
  const el = document.createElement('div');
  el.className = 'q';
  let inner = `<span class="q-idx">VRAAG ${q.idx} — 07</span><h1 class="q-title">${q.title}</h1>`;

  if (q.type === 'text') {
    inner += `
      <div class="q-input-wrap">
        <input class="q-input" type="${q.inputType || 'text'}" placeholder="${q.placeholder}" autocomplete="off" spellcheck="false">
      </div>
      <div class="q-actions">
        <button class="btn btn-honey q-next" type="button" disabled>${q.submit ? 'Start de scan' : 'Volgende'}<span class="btn-arrow">${q.submit ? '⬡' : '→'}</span></button>
      </div>`;
  } else {
    inner += `<div class="q-chips">${q.options.map((o, i) =>
      `<button class="chip" type="button" data-val="${o}"><span class="chip-idx">${String.fromCharCode(65 + i)}</span>${o}</button>`).join('')}</div>`;
    if (q.type === 'multi') {
      inner += `<div class="q-actions">
        <button class="btn btn-honey q-next" type="button" disabled>Volgende<span class="btn-arrow">→</span></button>
        <span class="q-skip">MEERDERE ANTWOORDEN MOGELIJK</span>
      </div>`;
    }
  }
  el.innerHTML = inner;
  return el;
}

function mountQuestion(index, dir = 1) {
  const q = QUESTIONS[index];
  const el = renderQuestion(q);
  stage.innerHTML = '';
  stage.appendChild(el);
  updateRail();

  // entrance
  if (!reduced) {
    gsap.fromTo(el.querySelectorAll('.q-idx, .q-title, .q-chips, .q-input-wrap, .q-actions'),
      { opacity: 0, y: 44 * dir, rotateX: -20 },
      { opacity: 1, y: 0, rotateX: 0, duration: 0.85, stagger: 0.09, ease: 'power4.out' });
  }

  const next = el.querySelector('.q-next');
  const advance = () => leaveQuestion(el, index);

  if (q.type === 'text') {
    const input = el.querySelector('.q-input');
    const wrap = el.querySelector('.q-input-wrap');
    setTimeout(() => input.focus(), 500);
    const valid = () => {
      const v = input.value.trim();
      return q.inputType === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) : v.length > 1;
    };
    input.addEventListener('input', () => {
      wrap.classList.toggle('has-value', input.value.trim().length > 0);
      next.disabled = !valid();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && valid()) { answers[q.key] = input.value.trim(); advance(); }
    });
    next.addEventListener('click', () => { answers[q.key] = input.value.trim(); advance(); });
  }

  if (q.type === 'chips') {
    el.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        el.querySelectorAll('.chip').forEach((c) => c.classList.remove('picked'));
        chip.classList.add('picked');
        answers[q.key] = chip.dataset.val;
        if (!reduced) gsap.fromTo(chip, { scale: 0.94 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1.2, 0.5)' });
        setTimeout(advance, 420); // auto-advance: picking is the answer
      });
    });
  }

  if (q.type === 'multi') {
    const picked = new Set();
    el.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const v = chip.dataset.val;
        if (picked.has(v)) { picked.delete(v); chip.classList.remove('picked'); }
        else { picked.add(v); chip.classList.add('picked'); }
        next.disabled = picked.size === 0;
      });
    });
    next.addEventListener('click', () => { answers[q.key] = [...picked]; advance(); });
  }
}

function leaveQuestion(el, index) {
  current = index + 1;
  const isLast = current >= QUESTIONS.length;
  const go = () => (isLast ? finale() : mountQuestion(current));
  if (reduced) { go(); return; }
  gsap.to(el.querySelectorAll('.q-idx, .q-title, .q-chips, .q-input-wrap, .q-actions'), {
    opacity: 0, y: -44, rotateX: 16, duration: 0.5, stagger: 0.05, ease: 'power3.in',
    onComplete: go,
  });
}

/* keyboard: Enter advances chip questions too (first picked or first option) */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const q = QUESTIONS[current];
  if (!q || q.type === 'text') return;
  const next = stage.querySelector('.q-next');
  if (next && !next.disabled) next.click();
});

/* ============================================================
   finale — the wonder moment
   ============================================================ */

function hexConfetti(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = isLight
    ? ['#e79c22', '#c97b1e', '#0b7ea8', '#0b8d80', '#a86610']
    : ['#ffbd5b', '#ffd98f', '#45cfff', '#17b3a6', '#c97b1e'];
  const parts = [];
  const cx = innerWidth / 2, cy = innerHeight * 0.45;
  for (let i = 0; i < 150; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = 4 + Math.random() * 13;
    parts.push({
      x: cx, y: cy,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4,
      r: 3 + Math.random() * 9,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.25,
      c: colors[(Math.random() * colors.length) | 0],
      life: 1, lag: 0.008 + Math.random() * 0.012,
    });
  }

  function hex(x, y, r, rot) {
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = rot + (Math.PI / 3) * k;
      ctx[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
  }

  // two acts: the burst (chaos), then the harvest — every hex gets
  // drawn into the savings counter, like the swarm bringing it home.
  const t0 = performance.now();
  let frame;
  (function tick() {
    const t = (performance.now() - t0) / 1000;
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    // harvest target: the stat card (centre-low), fallback to page centre
    const stat = document.querySelector('.done-stat');
    const box = stat ? stat.getBoundingClientRect() : null;
    const tx = box ? box.left + box.width / 2 : innerWidth / 2;
    const ty = box ? box.top + box.height / 2 : innerHeight * 0.6;

    let alive = 0;
    parts.forEach((p) => {
      if (t < 1.5) {
        p.vy += 0.16; p.vx *= 0.992;
        p.life -= 0.003;
      } else {
        const dx = tx - p.x, dy = ty - p.y;
        p.vx = p.vx * 0.86 + dx * p.lag;
        p.vy = p.vy * 0.86 + dy * p.lag;
        p.r *= 0.985;
        p.life -= 0.005;
        if (dx * dx + dy * dy < 4200) p.life -= 0.14; // absorbed
      }
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      if (p.life <= 0 || p.r < 0.6 || p.y > innerHeight + 40) return;
      alive++;
      ctx.globalAlpha = Math.min(1, p.life * 1.6);
      ctx.fillStyle = p.c;
      hex(p.x, p.y, p.r, p.rot);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (alive) frame = requestAnimationFrame(tick);
  })();
  return () => cancelAnimationFrame(frame);
}

function finale() {
  updateRail();
  const done = document.getElementById('done');
  done.classList.add('on');
  done.setAttribute('aria-hidden', 'false');

  const bedrijf = (answers.bedrijf || 'jouw bedrijf').replace(/[<>&]/g, '');
  const email = (answers.email || '').replace(/[<>&]/g, '');
  document.getElementById('doneTitle').textContent = `${bedrijf}, de zwerm is onderweg.`;
  document.getElementById('doneNote').innerHTML =
    `We bevestigen binnen 24 uur op <b>${email}</b> — en dan komt de scan die alles zwart op wit zet.`;

  // thermal flash layer
  const flash = document.createElement('div');
  flash.className = 'thermal-flash';
  document.body.appendChild(flash);

  if (reduced) {
    document.getElementById('doneCard').style.opacity = 1;
    document.getElementById('doneCount').textContent = '10';
    return;
  }

  hexConfetti(document.getElementById('burst'));
  if (swarm) {
    // flare up for the blast, then settle into a calm, faint honeycomb
    // so the result card gets all the attention
    gsap.to(swarm.uniforms.uOpacity, { value: 0.85, duration: 0.8 });
    gsap.fromTo(swarm.uniforms.uMorph, { value: 0 }, { value: 1, duration: 2.6, ease: 'power2.inOut', delay: 0.5 });
    gsap.to(swarm.uniforms.uOpacity, { value: 0.18, duration: 1.6, ease: 'power2.inOut', delay: 1.6 });
  }

  const count = { v: 0 };
  const tl = gsap.timeline();
  tl
    // bee-vision flash
    .to(flash, { opacity: 1, duration: 0.12, ease: 'power1.in' })
    .to(flash, { opacity: 0, duration: 1.4, ease: 'power2.out' }, 0.25)
    // shockwave (width/height, not scale — keeps the ring thin)
    .fromTo('#shockwave',
      { width: 40, height: 36, opacity: 1 },
      { width: 2400, height: 2160, opacity: 0, duration: 1.6, ease: 'power3.out' }, 0.05)
    // bee flies across
    .fromTo('#doneBee',
      { x: 0, y: 0, rotate: -14 },
      {
        x: () => innerWidth + 800, y: -140, rotate: 10,
        duration: 2.1, ease: 'power1.inOut',
        onUpdate() {
          const t = this.progress();
          gsap.set('#doneBee', { yPercent: Math.sin(t * Math.PI * 3) * 9 });
        },
      }, 0.15)
    // card lands
    .fromTo('#doneCard',
      { opacity: 0, y: 60, scale: 0.94 },
      { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'power4.out' }, 0.85)
    // potential counts up
    .to(count, {
      v: 10, duration: 1.6, ease: 'power3.out', snap: { v: 1 },
      onUpdate: () => { document.getElementById('doneCount').textContent = count.v; },
    }, 1.2)
    .fromTo('.done-stat', { boxShadow: '0 0 0px #ffbd5b00' },
      { boxShadow: '0 0 60px #ffbd5b33', duration: 0.8 }, 2.4);
}

/* ============================================================
   boot
   ============================================================ */

if (!reduced) {
  gsap.fromTo('.audit-top, .rail, .audit-foot', { opacity: 0, y: -16 },
    { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out' });
}

// demo shortcut: audit.html?finale jumps straight to the submit moment
if (new URLSearchParams(location.search).has('finale')) {
  Object.assign(answers, { bedrijf: 'Furnibo BV', email: 'demo@bedrijf.be' });
  current = QUESTIONS.length;
  finale();
} else {
  mountQuestion(0);
}
