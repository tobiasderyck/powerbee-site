import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import Lenis from 'lenis';
import { createSwarm } from './swarm.js';
import { initTheme } from './theme.js';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

/* ============================================================
   text splitting
   ============================================================ */

function splitChars(el) {
  const chars = [];
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...child.textContent].forEach((ch) => {
          const s = document.createElement('span');
          s.className = 'char';
          s.textContent = ch === ' ' ? ' ' : ch;
          frag.appendChild(s);
          chars.push(s);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) walk(child);
    });
  };
  walk(el);
  return chars;
}

function splitWords(el) {
  const words = [];
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((piece) => {
          if (!piece) return;
          if (/^\s+$/.test(piece)) frag.appendChild(document.createTextNode(' '));
          else {
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = piece;
            frag.appendChild(s);
            words.push(s);
          }
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) { walk(child); }
    });
  };
  walk(el);
  return words;
}

/* ============================================================
   smooth scroll
   ============================================================ */

let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1.0 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

document.querySelectorAll('[data-scrollto]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.dataset.scrollto);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
    else target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ============================================================
   swarm
   ============================================================ */

let swarm = null;
if (!reduced) {
  try {
    swarm = createSwarm(document.getElementById('swarm'));
  } catch (err) {
    console.warn('WebGL unavailable, continuing without swarm', err);
    document.getElementById('swarm').style.display = 'none';
  }
}

initTheme((t) => { if (swarm) swarm.setInk(t === 'light'); });

/* ============================================================
   cursor + magnetic
   ============================================================ */

if (finePointer && !reduced) {
  const dot = document.getElementById('cursor');
  const ring = document.getElementById('cursorRing');
  const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => {
    dotX(e.clientX); dotY(e.clientY);
    ringX(e.clientX); ringY(e.clientY);
  }, { passive: true });
  document.querySelectorAll('a, button, .cell, .eco-node').forEach((el) => {
    el.addEventListener('pointerenter', () => ring.classList.add('is-hover'));
    el.addEventListener('pointerleave', () => ring.classList.remove('is-hover'));
  });
}

if (finePointer && !reduced) {
  document.querySelectorAll('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

/* ============================================================
   marquees
   ============================================================ */

function marquee(trackId, secondsPerLoop) {
  const track = document.getElementById(trackId);
  if (!track) return;
  const src = track.innerHTML;
  track.innerHTML = src + src + src + src;
  if (!reduced) {
    gsap.to(track, { xPercent: -50, duration: secondsPerLoop, ease: 'none', repeat: -1 });
  }
}
marquee('tickerTrack', 28);
marquee('footTrack', 20);

/* ============================================================
   preloader → hero intro
   ============================================================ */

const heroChars = [...document.querySelectorAll('.hero-title [data-split]')].map(splitChars);
const preloader = document.getElementById('preloader');
const preCount = document.getElementById('preCount');
const preWord = document.getElementById('preWord');
const words = ['ZON OPVANGEN', 'CELLEN VULLEN', 'METERS KOPPELEN', 'ZWERM ACTIVEREN'];

function heroIntro() {
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.to('.nav', { opacity: 1, y: 0, duration: 1 }, 0.1)
    .fromTo('#heroBee',
      { opacity: 0, scale: 0.86, xPercent: 8 },
      { opacity: 1, scale: 1, xPercent: 0, duration: 1.8, ease: 'power3.out' }, 0.15);
  heroChars.forEach((chars, i) => {
    tl.fromTo(chars,
      { yPercent: 118 },
      { yPercent: 0, duration: 1.1, stagger: 0.028, ease: 'power4.out' }, 0.25 + i * 0.13);
  });
  tl.fromTo('.hero-eyebrow', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8 }, 0.55)
    .fromTo('.hero-sub', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.9 }, 0.85)
    .fromTo('.hero-ctas .btn', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, 0.95)
    .fromTo('.hero-meta, .scroll-hint', { opacity: 0 }, { opacity: 1, duration: 1 }, 1.2);
  if (swarm) tl.to(swarm.uniforms.uOpacity, { value: 0.5, duration: 2.4, ease: 'power2.inOut' }, 0.3);
  return tl;
}

if (reduced) {
  preloader.remove();
  gsap.set('.nav', { opacity: 1, y: 0 });
} else {
  if (lenis) lenis.stop();
  const state = { p: 0 };
  const boot = gsap.timeline({
    onComplete: () => {
      gsap.to(preloader, {
        clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%)',
        duration: 1.05,
        ease: 'power4.inOut',
        onStart: () => heroIntro(),
        onComplete: () => { preloader.remove(); if (lenis) lenis.start(); },
      });
    },
  });
  gsap.set(preloader, { clipPath: 'polygon(-40% -40%, 140% -40%, 240% 50%, 140% 140%, -40% 140%, -140% 50%)' });
  boot
    .to('.pre-outline', { strokeDashoffset: 0, duration: 1.0, ease: 'power2.inOut' }, 0)
    .to('.pre-fill', { attr: { y: 0 }, duration: 2.1, ease: 'power2.inOut' }, 0.15)
    .to(state, {
      p: 100, duration: 2.2, ease: 'power2.inOut',
      onUpdate: () => {
        const v = Math.round(state.p);
        preCount.textContent = String(v).padStart(3, '0');
        preWord.textContent = words[Math.min(words.length - 1, Math.floor(v / (100 / words.length)))];
      },
    }, 0.1)
    .to('.pre-hex', { scale: 1.12, transformOrigin: '50% 50%', duration: 0.3, yoyo: true, repeat: 1, ease: 'power2.inOut' }, '+=0.1');
}

/* ============================================================
   global scroll effects
   ============================================================ */

ScrollTrigger.create({
  start: 0,
  end: () => document.documentElement.scrollHeight - window.innerHeight,
  scrub: 0.4,
  onUpdate: (self) => {
    gsap.set('#progressFill', { scaleY: self.progress });
    if (swarm) swarm.setDrift(self.progress * 2.4);
  },
});

ScrollTrigger.create({
  start: 60,
  onToggle: (self) => document.getElementById('nav').classList.toggle('is-scrolled', self.isActive),
});

/* hero parallax + exit */
if (!reduced) {
  gsap.to('#heroBee', {
    yPercent: 26, rotate: 6, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 },
  });
  gsap.to('.hero-inner', {
    yPercent: -12, opacity: 0.15, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: 0.6 },
  });
  if (finePointer) {
    const bee = document.getElementById('heroBee');
    const bx = gsap.quickTo(bee, 'rotationZ', { duration: 1.2, ease: 'power2.out' });
    const bob = gsap.to(bee, {
      y: '+=18', duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut',
    });
    window.addEventListener('pointermove', (e) => {
      bx(((e.clientX / window.innerWidth) - 0.5) * 6);
    }, { passive: true });
  }
}

/* section heads: rule draws in */
document.querySelectorAll('.sec-rule').forEach((el) => {
  gsap.fromTo(el, { scaleX: 0 }, {
    scaleX: 1, duration: 1.2, ease: 'power3.inOut',
    scrollTrigger: { trigger: el, start: 'top 85%' },
  });
});

/* section titles: lines rise */
document.querySelectorAll('.sec-title').forEach((title) => {
  const lines = title.querySelectorAll('.st-line');
  lines.forEach((l) => {
    const inner = document.createElement('span');
    inner.style.display = 'inline-block';
    inner.innerHTML = l.innerHTML;
    l.innerHTML = '';
    l.appendChild(inner);
  });
  gsap.fromTo(title.querySelectorAll('.st-line > span'),
    { yPercent: 115 },
    {
      yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out',
      scrollTrigger: { trigger: title, start: 'top 82%' },
    });
});

document.querySelectorAll('.sec-lede').forEach((el) => {
  gsap.fromTo(el, { opacity: 0, y: 26 }, {
    opacity: 1, y: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%' },
  });
});

/* ============================================================
   01 — het lek: word-by-word scrub
   ============================================================ */

document.querySelectorAll('[data-words]').forEach((line) => {
  const ws = splitWords(line);
  gsap.fromTo(ws, { opacity: 0.08 }, {
    opacity: 1, stagger: 0.06, ease: 'none',
    scrollTrigger: { trigger: line, start: 'top 78%', end: 'bottom 42%', scrub: true },
  });
});

const punchChars = splitChars(document.getElementById('lekPunch'));
gsap.fromTo(punchChars,
  { yPercent: 120, opacity: 0 },
  {
    yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.05, ease: 'back.out(1.6)',
    scrollTrigger: { trigger: '#lekPunch', start: 'top 80%' },
  });

/* ============================================================
   02 — de hive: cells + swarm morphs into honeycomb
   ============================================================ */

gsap.fromTo('.cell',
  { opacity: 0, y: 90, scale: 0.82, rotate: () => gsap.utils.random(-7, 7) },
  {
    opacity: 1, y: 0, scale: 1, rotate: 0,
    duration: 1.1, stagger: 0.09, ease: 'power4.out',
    scrollTrigger: { trigger: '.comb', start: 'top 78%' },
    // release inline transforms so the CSS :hover lift can take over
    onComplete: () => gsap.set('.cell', { clearProps: 'transform,opacity' }),
  });

// As you leave the hero, the swarm calms right down (so text sections aren't
// busy) and starts gliding sideways — bees "flying past" rather than clustering.
if (swarm) {
  const sw = { op: 0.5, stream: 0.14 };
  const apply = () => { swarm.setOpacity(sw.op); swarm.setStream(sw.stream); };
  gsap.to(sw, {
    op: 0.16, stream: 0.7, ease: 'none', onUpdate: apply,
    scrollTrigger: { trigger: '.hero', start: 'bottom 92%', end: 'bottom top', scrub: 0.6 },
  });
}

/* ============================================================
   03 — ecosysteem: draw diagram, run pulses, live dashboard
   ============================================================ */

const ecoPaths = ['pZonPv', 'pPvBat', 'pPvBed', 'pBatBed', 'pBedLaad', 'pBedNet'];

gsap.fromTo('.eco-node',
  { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' },
  {
    opacity: 1, scale: 1, duration: 0.9, stagger: 0.1, ease: 'back.out(1.7)',
    scrollTrigger: { trigger: '#ecoDiagram', start: 'top 75%' },
  });
gsap.fromTo('.eco-path', { opacity: 0 }, {
  opacity: 1, duration: 0.8, stagger: 0.12,
  scrollTrigger: { trigger: '#ecoDiagram', start: 'top 70%' },
});
if (!reduced) {
  gsap.to('.eco-path', { strokeDashoffset: -52, duration: 4, ease: 'none', repeat: -1 });
  const svg = document.getElementById('ecoSvg');
  ecoPaths.forEach((id, i) => {
    for (let k = 0; k < 2; k++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', '3.4');
      c.setAttribute('class', 'eco-pulse' + ((i + k) % 5 === 0 ? ' blue' : ''));
      svg.appendChild(c);
      gsap.fromTo(c, { opacity: 0 }, {
        motionPath: { path: '#' + id, align: '#' + id, alignOrigin: [0.5, 0.5] },
        opacity: 1,
        duration: gsap.utils.random(1.8, 3.2),
        repeat: -1,
        delay: i * 0.45 + k * 1.2,
        ease: 'power1.inOut',
      });
    }
  });
}

gsap.fromTo('#hiveos', { opacity: 0, x: 60 }, {
  opacity: 1, x: 0, duration: 1.1, ease: 'power3.out',
  scrollTrigger: { trigger: '#hiveos', start: 'top 80%' },
});

/* Hive OS live data */
(() => {
  const spark = [];
  for (let i = 0; i < 42; i++) spark.push(30 + Math.sin(i * 0.4) * 16 + Math.random() * 8);
  const line = document.getElementById('sparkLine');
  const fill = document.getElementById('sparkFill');
  let pv = 142.7, net = 23.1, bat = 86, piek = 312;

  function drawSpark() {
    const pts = spark.map((v, i) => `${(i / (spark.length - 1)) * 300},${78 - v}`).join(' ');
    line.setAttribute('points', pts);
    fill.setAttribute('points', pts + ' 300,80 0,80');
  }
  drawSpark();

  const timeEl = document.getElementById('hosTime');
  setInterval(() => {
    timeEl.textContent = new Date().toLocaleTimeString('nl-BE', { hour12: false });
  }, 1000);

  setInterval(() => {
    spark.shift();
    spark.push(Math.max(6, Math.min(66, spark[spark.length - 1] + (Math.random() - 0.48) * 9)));
    drawSpark();
    pv += Math.random() * 0.22;
    net = Math.max(4, net + (Math.random() - 0.52) * 0.9);
    bat = Math.max(58, Math.min(99, bat + (Math.random() - 0.45) * 1.4));
    if (Math.random() < 0.3) piek += 1;
    document.getElementById('hosPv').textContent = pv.toFixed(1) + ' kWh';
    document.getElementById('hosNet').textContent = net.toFixed(1) + ' kWh';
    document.getElementById('hosBat').textContent = Math.round(bat);
    document.getElementById('hosBatBar').style.width = Math.round(bat) + '%';
    document.getElementById('hosPiek').textContent = '€ ' + piek;
    document.getElementById('ecoBatPct').textContent = Math.round(bat) + '%';
  }, 1400);
})();

/* ============================================================
   04 — traject: pinned horizontal scroll
   ============================================================ */

// Horizontal pinned journey on desktop; on mobile it stacks vertically
// (pinning + sideways scroll hijacks the small screen for too long).
const trajectMobile = window.matchMedia('(max-width: 860px)').matches;
if (!reduced && !trajectMobile) {
  const track = document.getElementById('trajectTrack');
  const getDistance = () => track.scrollWidth - window.innerWidth + 88;
  gsap.to(track, {
    x: () => -getDistance(),
    ease: 'none',
    scrollTrigger: {
      trigger: '#traject',
      pin: '#trajectPin',
      scrub: 0.7,
      start: 'top top',
      end: () => '+=' + getDistance(),
      invalidateOnRefresh: true,
      onUpdate: (self) => gsap.set('#trajectBar', { width: (self.progress * 100) + '%' }),
    },
  });
} else {
  const track = document.getElementById('trajectTrack');
  track.style.flexWrap = 'wrap';
  track.style.width = 'auto';
  if (!reduced && trajectMobile) {
    gsap.utils.toArray('.tstep').forEach((step) => {
      gsap.fromTo(step, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: step, start: 'top 88%' },
      });
    });
  }
}

/* ============================================================
   05 — cijfers: odometer counters
   ============================================================ */

document.querySelectorAll('.count').forEach((el) => {
  const target = parseFloat(el.dataset.count);
  const state = { v: 0 };
  gsap.to(state, {
    v: target, duration: 1.8, ease: 'power3.out',
    snap: { v: 1 },
    onUpdate: () => { el.textContent = state.v; },
    scrollTrigger: { trigger: el, start: 'top 85%' },
  });
});

gsap.fromTo('.cijfer', { opacity: 0, y: 50 }, {
  opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out',
  scrollTrigger: { trigger: '.cijfers-grid', start: 'top 82%' },
});

/* ============================================================
   06 — de angel: finale
   ============================================================ */

const angelChars = [...document.querySelectorAll('.angel-title [data-split]')].map(splitChars);
angelChars.forEach((chars, i) => {
  gsap.fromTo(chars,
    { yPercent: 118 },
    {
      yPercent: 0, duration: 1.1, stagger: 0.03, ease: 'power4.out', delay: i * 0.12,
      scrollTrigger: { trigger: '.angel-title', start: 'top 78%' },
    });
});

gsap.fromTo('.angel-copy, .angel-more', { opacity: 0, y: 30 }, {
  opacity: 1, y: 0, duration: 1, stagger: 0.14, ease: 'power3.out',
  scrollTrigger: { trigger: '.angel-copy', start: 'top 85%' },
});

/* ============================================================
   07 — het voorstel: generic reveals
   ============================================================ */

document.querySelectorAll('[data-reveal]').forEach((el) => {
  gsap.fromTo(el, { opacity: 0, y: 44 }, {
    opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 86%' },
  });
});

document.querySelectorAll('[data-stagger]').forEach((wrap) => {
  gsap.fromTo(wrap.children, { opacity: 0, y: 54 }, {
    opacity: 1, y: 0, duration: 1, stagger: 0.11, ease: 'power3.out',
    scrollTrigger: { trigger: wrap, start: 'top 84%' },
    onComplete: () => gsap.set(wrap.children, { clearProps: 'transform,opacity' }),
  });
});
gsap.fromTo('.angel-chips li', { opacity: 0, y: 20, scale: 0.92 }, {
  opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.08, ease: 'back.out(1.8)',
  scrollTrigger: { trigger: '.angel-chips', start: 'top 88%' },
});

if (!reduced) {
  gsap.fromTo('#angelBee',
    { yPercent: -30, rotate: -16 },
    {
      yPercent: 10, rotate: 2, ease: 'none',
      scrollTrigger: { trigger: '.angel', start: 'top bottom', end: 'bottom top', scrub: 0.8 },
    });
}

/* video accordions */
document.querySelectorAll('.vid-head').forEach((btn) => {
  btn.addEventListener('click', () => {
    const vid = btn.closest('.vid');
    const open = vid.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    // heights change → pinned/triggered positions shift
    setTimeout(() => ScrollTrigger.refresh(), 650);
  });
});

/* ============================================================
   housekeeping
   ============================================================ */

window.addEventListener('load', () => ScrollTrigger.refresh());
