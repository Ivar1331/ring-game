/* =====================================================================
   Magic Rings with Tolo — game engine (KiddyMaitri)
   Rings are drawn on a <canvas>. Each ring turns on its own; the inside ring is the guide.
   A ring locks when every slice matches the guide ring. Lock them all to win.
   Puzzle content lives in js/levels/*.js and words in js/i18n.js.
   ===================================================================== */
"use strict";
(() => {
const LANGS = ["en", "hi", "or"];
const LANG_GLYPH = { en: "A", hi: "अ", or: "ଅ" };
const STORE_KEY = "magic-rings-tolo-v1";
const ENTITY_COLOURS = ["#FFD45C", "#FF9EBF", "#A9A2FF", "#7FDCC0", "#FFB27F", "#8EC8FF", "#C8E36E", "#F7A3F0", "#FFE38A", "#9FE7F5"];
const RING_COLOURS = ["#FFF1C2", "#FFD9E6", "#E3DEFF", "#D2F2E7", "#FFE2CF"];
const RING_SHADES = ["#FFE48A", "#FFB9D0", "#C9C1FF", "#AEE6D3", "#FFC9A6"];
const BOARD_INK = "#1F5A40";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const TAU = Math.PI * 2;
// ------------------------------------------------------------ helpers
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const mix = (a, b, t) => toHex(a.map((v, i) => v + (b[i] - v) * t));
const darker = (h, f = .72) => toHex(hex(h).map((v) => v * f));
const SVGNS = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};
const icon = (id, color) => `<svg viewBox="0 0 24 24" aria-hidden="true"${color ? ` style="color:${color};fill:${color}"` : ""}><use href="#${id}"/></svg>`;
const segmenter = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
const graphemes = (s) => (segmenter ? [...segmenter.segment(s)].map((x) => x.segment) : Array.from(s));

// ------------------------------------------------------------ storage
const store = {
  load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; } },
  save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ best: S.best, lang: S.lang, sound: audio.on, diff: S.diff })); } catch { /* private mode */ }
  },
};

// ------------------------------------------------------------ game state
const saved = store.load();
const browserLang = (navigator.language || "en").slice(0, 2);
const S = {
  lang: LANGS.includes(saved.lang) ? saved.lang : (browserLang === "hi" || browserLang === "or" ? browserLang : "en"),
  best: saved.best && typeof saved.best === "object" ? saved.best : {},
  diff: DIFFICULTIES.some((d) => d.key === saved.diff) ? saved.diff : "easy",
  // Teacher mode: press U on the home screen, or open the page with ?unlock at the end of the address
  unlockAll: /[?&]unlock\b/.test(location.search),
  mode: "home", level: 0, seenRules: false,
  g: null,                      // the puzzle being played
};
const t = (key, vars) => {
  let s = UI[S.lang][key] ?? UI.en[key] ?? key;
  if (typeof s === "string" && vars) s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  return s;
};
const tl = (o) => (o && typeof o === "object" ? (o[S.lang] ?? o.en) : o);
const DIFF = (k = S.diff) => DIFFICULTIES.find((d) => d.key === k);
const bestOf = (lv) => S.best[lv.key] || {};
const anyStars = (lv) => Object.values(bestOf(lv)).some((n) => n > 0);
const unlocked = (i) => S.unlockAll || i === 0 || anyStars(LEVELS[i - 1]);
const totalStars = () => LEVELS.reduce((s, lv) => s + Object.values(bestOf(lv)).reduce((a, b) => a + b, 0), 0);
const buzz = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch { /* not supported */ } };
const mod = (a, n) => ((a % n) + n) % n;
const ease = { out: (x) => 1 - Math.pow(1 - x, 3), inOut: (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2), back: (x) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2) };
// ================================================================ SOUND (all synthesised, no audio files)
const audio = {
  ctx: null, out: null, noiseBuf: null, on: saved.sound !== false, lastTick: 0,
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor();
      this.out = this.ctx.createGain(); this.out.gain.value = .9;
      this.out.connect(comp).connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, len);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  },
  // one note: optional pitch slide and vibrato
  tone(f, at, dur, o = {}) {
    const c = this.ctx, osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(f, at);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, at + dur);
    if (o.vib) {
      const l = c.createOscillator(), lg = c.createGain();
      l.frequency.value = o.vib; lg.gain.value = f * .04; l.connect(lg).connect(osc.frequency); l.start(at); l.stop(at + dur + .05);
    }
    const v = o.vol ?? .18;
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(v, at + (o.atk ?? .01));
    g.gain.exponentialRampToValueAtTime(.0008, at + dur);
    osc.connect(g).connect(this.out); osc.start(at); osc.stop(at + dur + .05);
  },
  // filtered noise: whooshes, splashes, swishes
  noise(at, dur, o = {}) {
    const c = this.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noiseBuf;
    f.type = o.type || "bandpass"; f.Q.value = o.q ?? 1;
    f.frequency.setValueAtTime(o.f || 1200, at);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, at + dur);
    const v = o.vol ?? .15;
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(v, at + (o.atk ?? .02));
    g.gain.exponentialRampToValueAtTime(.0008, at + dur);
    src.connect(f).connect(g).connect(this.out); src.start(at, Math.random() * .5); src.stop(at + dur + .05);
  },
  seq(notes, step, o = {}) {
    const t0 = this.ctx.currentTime + .01;
    notes.forEach((f, i) => f && this.tone(f, t0 + i * step, o.len || step * 1.7, o));
  },
  play(name, arg = 0) {
    if (!this.on) return;
    this.ensure(); if (!this.ctx) return;
    const now = this.ctx.currentTime + .01;
    const up = (f, k) => f * Math.pow(2, k / 12);
    switch (name) {
      case "pick": this.tone(480, now, .12, { to: 900, vol: .14 }); this.noise(now, .08, { f: 3000, vol: .05 }); break;
      case "select": this.seq([700, 1050], .06, { vol: .12 }); break;
      case "click": this.tone(620, now, .05, { vol: .09 }); this.noise(now, .03, { f: 4000, vol: .04 }); break;
      case "hover": this.tone(260 + arg * 22, now, .07, { type: "triangle", vol: .035 }); break;
      case "tick": this.tone(arg, now, .045, { type: "triangle", vol: .05 }); break;
      case "correct": { // arpeggio climbs higher with every answer in a row
        const k = Math.min(arg, 9);
        this.seq([523, 659, 784, 1047].map((f) => up(f, k)), .07, { type: "triangle", vol: .2 });
        this.seq([0, 0, 0, 0, up(1568, k), up(2093, k)], .06, { vol: .06 });
        this.noise(now, .35, { f: 600, to: 5000, vol: .07, q: .7 });
        break;
      }
      case "streak": {
        const k = Math.min(arg, 9);
        this.tone(160, now, .4, { to: 45, vol: .32 });                         // soft boom
        this.seq([659, 784, 988, 1319, 1568].map((f) => up(f, k)), .065, { type: "triangle", vol: .2 });
        this.seq([0, 0, 0, 0, 0, up(2093, k), up(2637, k), up(3136, k)], .055, { vol: .07 });
        this.noise(now, .6, { f: 800, to: 7000, vol: .08, q: .6 });
        break;
      }
      case "wrong": this.tone(420, now, .3, { to: 150, type: "triangle", vol: .17, vib: 18 }); this.tone(210, now + .05, .25, { to: 90, vol: .08 }); break;
      case "sea": // splash + bubbles
        this.noise(now, .5, { f: 2200, to: 300, vol: .22, q: .6 });
        [0, .09, .2].forEach((d, i) => this.tone(500 + i * 160, now + .12 + d, .08, { to: 900 + i * 200, vol: .06 }));
        break;
      case "soft": this.seq([440, 392], .1, { vol: .1 }); break;
      case "zoomIn": this.tone(500, now, .09, { to: 820, vol: .07 }); break;
      case "zoomOut": this.tone(820, now, .09, { to: 500, vol: .07 }); break;
      case "page": this.noise(now, .16, { f: 1800, to: 5000, vol: .08, type: "highpass" }); break;
      case "lang": this.seq([784, 988, 1175, 1568], .06, { vol: .09 }); break;
      case "photo": this.noise(now, .05, { f: 5000, vol: .06, type: "highpass" }); this.tone(1320, now + .03, .12, { vol: .05 }); break;
      case "star": { const f = [784, 988, 1175][arg] || 1175; this.seq([f, f * 1.5], .08, { type: "triangle", vol: .2 }); break; }
      case "ratchet": this.tone(1100 + arg * 140, now, .035, { type: "square", vol: .025 }); this.noise(now, .03, { f: 5200, vol: .05, type: "highpass" }); break;
      case "lock": // heavy clunk, then a bright chime
        this.tone(190, now, .16, { to: 70, vol: .32 }); this.noise(now, .09, { f: 900, vol: .2, q: 1.4 });
        this.seq([0, 1047, 1319, 1568, 2093], .07, { type: "triangle", vol: .16 });
        break;
      case "whirr": this.noise(now, 1.7, { f: 260, to: 3200, vol: .08, q: 2.2, atk: .2 }); this.tone(170, now, 1.6, { to: 760, vol: .045, type: "sawtooth", atk: .25 }); break;
      case "swap": this.noise(now, .26, { f: 700, to: 3400, vol: .1, q: .9 }); this.tone(520, now, .18, { to: 880, vol: .07 }); break;
      case "spin": this.seq([523, 659, 784, 1047, 1319, 1568, 2093], .06, { type: "triangle", vol: .12 }); this.noise(now, 1.2, { f: 400, to: 6000, vol: .06, q: .7 }); break;
      case "ready": this.seq([784, 0, 784, 0, 1175], .09, { type: "triangle", vol: .14 }); break;
      case "slide": this.tone(380 + arg * 60, now, .06, { type: "triangle", vol: .05 }); break;
      case "win":
        this.tone(140, now, .6, { to: 40, vol: .35 });
        this.seq([523, 659, 784, 1047, 784, 1047, 1319], .13, { type: "triangle", vol: .2, len: .3 });
        this.seq([0, 0, 0, 0, 0, 0, 0, 523, 659, 784, 1047], .13, { vol: .1, len: 1 });
        break;
    }
  },
  // gentle Geiger-style ticks while dragging: faster and higher as you get closer
  proximity(key) {
    const gap = { fire: 110, hot: 210, warm: 380 }[key];
    if (!gap || !this.on) return;
    const now = performance.now();
    if (now - this.lastTick < gap) return;
    this.lastTick = now;
    this.play("tick", { fire: 1480, hot: 1100, warm: 760 }[key]);
  },
};

// ================================================================ TOLO THE SUNFLOWER
let toloUid = 0;
function toloSVG() {
  const u = "t" + (++toloUid);
  const petals = (n, r, rx, ry, fill, off) => Array.from({ length: n }, (_, i) =>
    `<ellipse cx="0" cy="${-r}" rx="${rx}" ry="${ry}" fill="${fill}" transform="rotate(${(i * 360) / n + off})"/>`).join("");
  const eye = (sx) => `
    <g transform="translate(${sx * 10.5},-5)">
      <g class="eye-open">
        <ellipse class="eye-white" rx="7.2" ry="8.4" fill="#fff"/>
        <g class="pupil"><circle r="4.4" fill="#22130A"/><circle cx="-1.5" cy="-1.9" r="1.6" fill="#fff"/></g>
        <ellipse class="lid" rx="7.8" ry="9" fill="#8B5631" style="transform-origin:0px -9px"/>
        <path d="M${sx * 4.6} -7.4 l${sx * 3.4} -3 M${sx * 6.6} -4.6 l${sx * 3.6} -1.6" stroke="#22130A" stroke-width="1.8" stroke-linecap="round"/>
      </g>
      <path class="eye-happy" d="M-6.5 1.5 Q0 -7 6.5 1.5" stroke="#22130A" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path class="brow" d="${sx < 0 ? "M-6 -13 L5 -16.5" : "M-5 -16.5 L6 -13"}" stroke="#22130A" stroke-width="2.4" stroke-linecap="round"/>
    </g>`;
  const spark = (x, y, s) => `<path class="spark" transform="translate(${x},${y}) scale(${s})" d="M0 -10 L2.6 -2.6 L10 0 L2.6 2.6 L0 10 L-2.6 2.6 L-10 0 L-2.6 -2.6Z" fill="#FFC23A" stroke="#E69A0E" stroke-width="1.2"/>`;
  return `<svg class="tolo" viewBox="-66 -72 132 196" aria-hidden="true">
  <defs>
    <radialGradient id="pg${u}" cx="50%" cy="90%" r="85%"><stop offset="0" stop-color="#FFE68A"/><stop offset="1" stop-color="#FFB524"/></radialGradient>
    <radialGradient id="fg${u}" cx="42%" cy="34%" r="72%"><stop offset="0" stop-color="#B07240"/><stop offset="1" stop-color="#6C3D1D"/></radialGradient>
    <pattern id="sd${u}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="1.5" cy="1.5" r="1" fill="#4E2A12" opacity=".45"/><circle cx="4.5" cy="4.5" r=".9" fill="#D69A5E" opacity=".35"/></pattern>
  </defs>
  <ellipse cx="0" cy="116" rx="30" ry="5.5" fill="rgba(28,51,38,.16)"/>
  <g transform="translate(0,114)"><g class="t-body"><g transform="translate(0,-114)">
    <path d="M0 26 C 3 58, -4 86, 0 114" stroke="#3E8A4F" stroke-width="7" fill="none" stroke-linecap="round"/>
    <g transform="translate(-1,76)"><g class="leaf-l"><path d="M0 0 C -9 -15, -32 -14, -40 -3 C -29 7, -10 8, 0 0Z" fill="#4FA35F"/><path d="M-2 -1 C -14 -5, -26 -5, -36 -3" stroke="#3A7E48" stroke-width="1.6" fill="none" stroke-linecap="round"/></g></g>
    <g transform="translate(1,94)"><g class="leaf-r"><path d="M0 0 C 9 -15, 32 -14, 40 -3 C 29 7, 10 8, 0 0Z" fill="#5DB36B"/><path d="M2 -1 C 14 -5, 26 -5, 36 -3" stroke="#3A7E48" stroke-width="1.6" fill="none" stroke-linecap="round"/></g></g>
    <g class="t-head">
      <g class="t-petals">
        ${petals(14, 41, 10.5, 21, "#EE9A10", 360 / 28)}
        ${petals(14, 39, 9.5, 20, `url(#pg${u})`, 0)}
      </g>
      <circle r="30.5" fill="url(#fg${u})"/>
      <circle r="30.5" fill="url(#sd${u})"/>
      <circle r="30.5" fill="none" stroke="#4E2A12" stroke-width="1.4" opacity=".55"/>
      <ellipse cx="-18.5" cy="8.5" rx="6" ry="3.8" fill="#FF8FA3" opacity=".85"/>
      <ellipse cx="18.5" cy="8.5" rx="6" ry="3.8" fill="#FF8FA3" opacity=".85"/>
      ${eye(-1)}${eye(1)}
      <path class="m-smile" d="M-8.5 11 Q0 20 8.5 11" stroke="#22130A" stroke-width="3" fill="none" stroke-linecap="round"/>
      <g class="m-open"><path d="M-9.5 9.5 Q0 25 9.5 9.5Z" fill="#3A170A"/><path d="M-5 16 Q0 21.5 5 16 Q0 13.5 -5 16Z" fill="#FF7E8E"/></g>
      <ellipse class="m-o" cx="0" cy="14.5" rx="3.8" ry="4.6" fill="#3A170A"/>
      <g transform="translate(25,-31) rotate(24)"><path d="M0 0 L-12 -7.5 Q-14 0 -12 7.5Z" fill="#FF7FA6"/><path d="M0 0 L12 -7.5 Q14 0 12 7.5Z" fill="#FF7FA6"/><circle r="3.6" fill="#F2537F"/></g>
      ${spark(-50, -44, .9)}${spark(52, -18, .7)}${spark(42, -60, .6)}
    </g>
  </g></g></g>
</svg>`;
}

class Tolo {
  constructor(host) {
    host.innerHTML = toloSVG();
    this.svg = host.firstElementChild;
    this.eyes = $$(".eye-white", this.svg);
    this.pupils = $$(".pupil", this.svg);
    this.mood = "idle"; this.until = 0; this.cls = "";
  }
  react(mood, ms = 1600) { this.mood = mood; this.until = ms === Infinity ? Infinity : performance.now() + ms; }
  update(now, look, talking) {
    if (this.mood !== "idle" && now > this.until) this.mood = "idle";
    const cls = `tolo ${this.mood}${talking && this.mood !== "cheer" ? " talk" : ""}`;
    if (cls !== this.cls) { this.svg.setAttribute("class", cls); this.cls = cls; }
    if (!this.svg.isConnected || !this.svg.getClientRects().length) return;
    this.eyes.forEach((e, i) => {
      let px = 0, py = 0;
      if (this.mood === "think") { px = 1.8; py = -2.4; }
      else if (look) {
        const r = e.getBoundingClientRect();
        const dx = look[0] - (r.left + r.width / 2), dy = look[1] - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 160) * 2.6;
        px = (dx / d) * k; py = (dy / d) * k;
      }
      this.pupils[i].setAttribute("transform", `translate(${px.toFixed(2)},${py.toFixed(2)})`);
    });
  }
}

class Speech {
  constructor(el) { this.el = el; this.full = ""; this.g = []; this.n = 0; }
  say(s, force) {
    if (s === this.full && !force) return;
    this.full = s; this.g = graphemes(s); this.n = 0; this.el.textContent = "";
    live.textContent = s;
  }
  tick(dt) {
    if (this.n >= this.g.length) return;
    const before = Math.floor(this.n);
    this.n = Math.min(this.g.length, this.n + dt * .07);
    if (Math.floor(this.n) !== before) this.el.textContent = this.g.slice(0, Math.floor(this.n)).join("");
  }
  get talking() { return this.n < this.g.length; }
  finish() { this.n = this.g.length; this.el.textContent = this.full; }
}

// ================================================================ ICONS: flags, emoji, numbers
function starPts(cx, cy, r, rot = -90) {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const a = (rot + i * 36) * Math.PI / 180, rr = i % 2 ? r * .42 : r;
    p.push(`${(cx + Math.cos(a) * rr).toFixed(2)},${(cy + Math.sin(a) * rr).toFixed(2)}`);
  }
  return p.join(" ");
}
// Simple, recognisable flags drawn as SVG (emoji flags show as letters on Windows)
const FLAGS = {
  in: `<rect width="30" height="20" fill="#fff"/><rect width="30" height="6.67" fill="#FF9933"/><rect y="13.33" width="30" height="6.67" fill="#138808"/><circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" stroke-width=".6"/><circle cx="15" cy="10" r=".6" fill="#000080"/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<line x1="15" y1="10" x2="${(15 + Math.cos(a) * 2.5).toFixed(2)}" y2="${(10 + Math.sin(a) * 2.5).toFixed(2)}" stroke="#000080" stroke-width=".25"/>`; }).join("")}`,
  jp: `<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#BC002D"/>`,
  fr: `<rect width="10" height="20" fill="#0055A4"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#EF4135"/>`,
  ru: `<rect width="30" height="20" fill="#fff"/><rect y="6.67" width="30" height="6.67" fill="#0039A6"/><rect y="13.33" width="30" height="6.67" fill="#D52B1E"/>`,
  cn: `<rect width="30" height="20" fill="#DE2910"/><polygon points="${starPts(5.5, 5.5, 3.2)}" fill="#FFDE00"/>${[[10.5, 2.2], [12.5, 4.3], [12.5, 7.2], [10.5, 9.2]].map(([x, y]) => `<polygon points="${starPts(x, y, 1.05, -60)}" fill="#FFDE00"/>`).join("")}`,
  br: `<rect width="30" height="20" fill="#009C3B"/><polygon points="3,10 15,2.2 27,10 15,17.8" fill="#FFDF00"/><circle cx="15" cy="10" r="4.8" fill="#002776"/><path d="M10.4 9.2 Q15 7.6 19.6 10.6" stroke="#fff" stroke-width=".7" fill="none"/>`,
  us: `<rect width="30" height="20" fill="#fff"/>${Array.from({ length: 7 }, (_, i) => `<rect y="${(i * 2 * 20 / 13).toFixed(3)}" width="30" height="${(20 / 13).toFixed(3)}" fill="#B22234"/>`).join("")}<rect width="12" height="10.77" fill="#3C3B6E"/>${Array.from({ length: 20 }, (_, i) => `<circle cx="${1.4 + (i % 5) * 2.3 + (Math.floor(i / 5) % 2) * 1.1}" cy="${1.4 + Math.floor(i / 5) * 2.6}" r=".55" fill="#fff"/>`).join("")}`,
  gb: `<rect width="30" height="20" fill="#012169"/><path d="M0 0L30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0L30 20M30 0L0 20" stroke="#C8102E" stroke-width="1.4"/><path d="M15 0V20M0 10H30" stroke="#fff" stroke-width="6"/><path d="M15 0V20M0 10H30" stroke="#C8102E" stroke-width="3.4"/>`,
  th: `<rect width="30" height="20" fill="#A51931"/><rect y="3.33" width="30" height="13.33" fill="#F4F5F8"/><rect y="6.67" width="30" height="6.67" fill="#2D2A4A"/>`,
  mx: `<rect width="10" height="20" fill="#006847"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#CE1126"/><circle cx="15" cy="10" r="2.4" fill="#8C5A2B"/><circle cx="15" cy="10" r="1.2" fill="#5E8A3A"/>`,
};
const flagSVG = (code) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="30" height="20">${FLAGS[code] || '<rect width="30" height="20" fill="#ccc"/>'}</svg>`;
const flagImgs = {};
function flagImg(code) {
  if (!flagImgs[code]) {
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(flagSVG(code));
    flagImgs[code] = img;
  }
  return flagImgs[code];
}
// HTML version of an icon value, for lists and captions
function iconHTML(v) {
  if (typeof v !== "string") return "";
  if (v.startsWith("flag:")) return flagSVG(v.slice(5));
  if (v.startsWith("num:")) return `<b class="num">${esc(v.slice(4))}</b>`;
  return esc(v);
}
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Segoe UI Symbol",sans-serif';
const textFont = () => (S.lang === "or" ? '"Baloo Bhaina 2","Baloo 2",sans-serif' : '"Baloo 2","Baloo Bhaina 2",sans-serif');
// ================================================================ FX (confetti, petals, fireworks)
const FX = {
  cv: $("#fx"), parts: [], running: false, last: 0,
  resize() {
    const d = Math.min(2, devicePixelRatio || 1);
    this.dpr = d; this.cv.width = innerWidth * d; this.cv.height = innerHeight * d;
    this.ctx = this.cv.getContext("2d");
  },
  add(p) { if (this.parts.length < 900) this.parts.push(p); if (!this.running) { this.running = true; this.last = performance.now(); requestAnimationFrame((t) => this.loop(t)); } },
  loop(now) {
    const dt = Math.min(3, (now - this.last) / 16.67); this.last = now;
    const c = this.ctx, d = this.dpr;
    c.setTransform(d, 0, 0, d, 0, 0);
    c.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of this.parts) {
      p.vy += p.g * dt; p.vx *= Math.pow(p.drag, dt); p.vy *= Math.pow(p.drag, dt);
      if (p.sway) p.vx += Math.sin((p.age + p.seed) * .06) * p.sway * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.age += dt;
      const a = p.age > p.life - 20 ? Math.max(0, (p.life - p.age) / 20) : 1;
      c.save(); c.globalAlpha = a; c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.color;
      const s = p.size;
      if (p.shape === "rect") { c.scale(Math.cos(p.age * .2 + p.seed), 1); c.fillRect(-s / 2, -s * .3, s, s * .6); }
      else if (p.shape === "circle") { c.beginPath(); c.arc(0, 0, s * .4, 0, 7); c.fill(); }
      else if (p.shape === "star") { starPath(c, s * .7); c.fill(); }
      else if (p.shape === "petal") {
        c.scale(1, Math.abs(Math.cos(p.age * .12 + p.seed)) * .6 + .4);
        c.beginPath(); c.ellipse(0, 0, s * .45, s * 1.05, 0, 0, 7); c.fill();
        c.fillStyle = "rgba(230,140,10,.55)"; c.fillRect(-.8, -s * .8, 1.6, s * 1.6);
      } else if (p.shape === "spark") { c.beginPath(); c.arc(0, 0, s * .35 * a + .5, 0, 7); c.fill(); }
      c.restore();
    }
    this.parts = this.parts.filter((p) => p.age < p.life && p.y < innerHeight + 60);
    if (this.parts.length) requestAnimationFrame((t) => this.loop(t));
    else { this.running = false; c.clearRect(0, 0, innerWidth, innerHeight); }
  },
};
function starPath(c, r) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * .46 : r, a = -Math.PI / 2 + i * Math.PI / 5;
    c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
}
const CONFETTI = ["#FFC23A", "#FF8DB2", "#A796FF", "#3CC3A3", "#5FAEFF", "#FF7A59", "#1F5A40"];
const PETALS = ["#FFC23A", "#FFD45C", "#FFB524", "#FFE07A"];
const scaleN = (n) => Math.round(n * (reduceMotion ? .25 : 1));
function particle(x, y, vx, vy, o = {}) {
  return { x, y, vx, vy, g: o.g ?? .3, drag: o.drag ?? .985, rot: rand(0, 6), vr: rand(-.25, .25), size: o.size ?? rand(7, 13),
    color: o.color ?? pick(CONFETTI), shape: o.shape ?? pick(["rect", "rect", "circle", "star", "petal"]),
    life: o.life ?? rand(70, 120), age: 0, seed: rand(0, 100), sway: o.sway || 0 };
}
function burst(x, y, n = 70, power = 11) {
  for (let i = 0; i < scaleN(n); i++) {
    const a = rand(0, Math.PI * 2), sp = rand(power * .35, power);
    FX.add(particle(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 4));
  }
  for (let i = 0; i < scaleN(14); i++) {
    const a = rand(0, Math.PI * 2), sp = rand(2, 6);
    FX.add(particle(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 3, { shape: "petal", color: pick(PETALS), size: rand(9, 14), g: .14, sway: .08 }));
  }
}
function cannons() {
  for (const side of [0, 1]) {
    const x = side ? innerWidth + 10 : -10, y = innerHeight * .9;
    for (let i = 0; i < scaleN(60); i++) {
      const a = (side ? -1 : 1) * rand(.35, .95), sp = rand(16, 27);
      FX.add(particle(x, y, Math.sin(a) * sp, -Math.cos(a) * sp, { g: .38, life: rand(90, 150) }));
    }
  }
}
function petalShower(n = 90) {
  for (let i = 0; i < scaleN(n); i++) {
    FX.add(particle(rand(0, innerWidth), rand(-200, -10), rand(-1, 1), rand(1.5, 3.5),
      { shape: pick(["petal", "petal", "petal", "star"]), color: pick(PETALS), size: rand(10, 18), g: .03, drag: .995, sway: .05, life: rand(260, 380) }));
  }
}
function rain(n) {
  for (let i = 0; i < scaleN(n); i++) {
    FX.add(particle(rand(0, innerWidth), rand(-300, -10), rand(-1.5, 1.5), rand(1, 4),
      { g: .045, drag: .995, life: 420, sway: .04, shape: pick(["rect", "rect", "petal", "star", "circle"]) }));
  }
}
function firework(x, y) {
  const col = pick(CONFETTI), n = scaleN(46);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, sp = rand(5.5, 7.5);
    FX.add(particle(x, y, Math.cos(a) * sp, Math.sin(a) * sp, { shape: "spark", color: col, g: .07, drag: .965, size: rand(6, 9), life: rand(55, 75) }));
  }
}
function popup(text, x, y, color) {
  const e = document.createElement("div");
  e.className = "popup"; e.style.left = x + "px"; e.style.top = y + "px"; if (color) e.style.color = color;
  e.textContent = text;
  document.body.appendChild(e);
  setTimeout(() => e.remove(), 1250);
}
function praise(word, sub, isStreak) {
  $$(".praise").forEach((e) => e.remove());
  const e = document.createElement("div");
  e.className = "praise";
  const r = stage.getBoundingClientRect();
  e.style.left = r.left + r.width / 2 + "px"; e.style.top = r.top + r.height * .42 + "px";
  e.innerHTML = `<span class="word${isStreak ? " streak" : ""}">${esc(word)}</span>${sub ? `<span class="sub">${esc(sub)}</span>` : ""}`;
  document.body.appendChild(e);
  setTimeout(() => e.remove(), 1600);
}
function flash(x, y) {
  const e = document.createElement("div");
  e.className = "flash"; e.style.setProperty("--x", x + "px"); e.style.setProperty("--y", y + "px");
  document.body.appendChild(e);
  setTimeout(() => e.remove(), 750);
}

// ================================================================ DOM refs
const app = $("#app");
const live = document.createElement("div");
live.className = "sr"; live.setAttribute("aria-live", "polite"); document.body.appendChild(live);
const toloHome = new Tolo($('[data-tolo="home"]'));
const toloPlay = new Tolo($('[data-tolo="play"]'));
const toloIntro = new Tolo($('[data-tolo="intro"]'));
const toloDone = new Tolo($('[data-tolo="done"]'));
const homeSpeech = new Speech($("#home-say"));
const playSpeech = new Speech($("#play-say"));
const introSpeech = new Speech($("#intro-say"));
const stage = $("#board");
const cv = $("#rings");
const ctx = cv.getContext("2d");
const fl = $("#float");                 // full-screen layer for cards that are picked up or flying
const fctx = fl.getContext("2d");
const caption = $("#caption");
let pointer = [innerWidth / 2, innerHeight / 2];

// ================================================================ PUZZLE SETUP
// The board is rings × slices. The inside (guide) ring never moves. Every other card can be picked up
// on its own, dragged anywhere and dropped on any slice of its own ring: the two cards swap places.
// A card is right when it sits in the same slice as its partner on the guide ring.
function newGame(levelIdx, diffKey) {
  const lv = LEVELS[levelIdx], D = DIFF(diffKey);
  const K = Math.min(D.rings, lv.rings.length);
  const N = Math.min(D.slices, lv.items.length);
  const ringIdx = lv.priority.slice(0, K).sort((a, b) => a - b);
  const ents = shuffle([...lv.items]).slice(0, N);
  const rings = ringIdx.map((ri, j) => ({
    j, ri, def: lv.rings[ri],
    order: ents.map((_, e) => e),          // order[p] = which item's card sits in slice p
    fixed: new Array(N).fill(j === 0),     // fixed = right and locked in place
    hidden: new Array(N).fill(0),          // >0 while a card is flying into this slice
    pop: new Array(N).fill(0),
    angle: 0, tween: null, done: j === 0, flash: 0, hintFlash: 0,
    colour: RING_COLOURS[j % RING_COLOURS.length], shade: RING_SHADES[j % RING_SHADES.length],
  }));
  return {
    levelIdx, lv, D, K, N, step: TAU / N, ents, rings,
    phase: "preview", previewT0: performance.now(), previewDur: Math.min(8000, Math.max(4200, N * 1000)),
    moves: 0, hintsLeft: D.hints, hintsUsed: 0, par: 0, streak: 0,
    start: 0, pausedAt: null, end: null,
    flights: [], picked: null, drag: null, cursor: { j: 1, p: 0 }, showCursor: false,
    hoverWedge: -1, readWedge: 0, winT0: 0,
  };
}
const G = () => S.g;
const guide = () => G().rings[0];
const isRight = (r, p) => r.order[p] === guide().order[p];
const movable = () => (G().K - 1) * G().N;
const placed = () => G().rings.slice(1).reduce((a, r) => a + r.order.filter((_, p) => isRight(r, p)).length, 0);
// cards turn gold the moment they are right (Easy, Medium); on Hard only when the whole ring is right
const lockEach = () => !G().D.ringOnly;

// ================================================================ BOARD GEOMETRY
const B = { size: 0, dpr: 1, cx: 0, cy: 0, R: 0, outer: 0, hub: 0, t: 0, gap: 3 };
function layoutBoard() {
  const w = stage.clientWidth, h = stage.clientHeight;
  const size = Math.max(160, Math.floor(Math.min(w, h)));
  const dpr = Math.min(3, devicePixelRatio || 1);
  if (size === B.size && dpr === B.dpr) return;
  B.size = size; B.dpr = dpr;
  cv.width = size * dpr; cv.height = size * dpr;
  cv.style.width = size + "px"; cv.style.height = size + "px";
  textCache.clear();
  geometry();
}
function sizeFloat() {
  const d = Math.min(2, devicePixelRatio || 1);
  fl.width = innerWidth * d; fl.height = innerHeight * d; fl._d = d;
}
function geometry() {
  const g = G();
  const K = g ? g.K : 3;
  B.cx = B.cy = B.size / 2;
  B.R = B.size / 2 - 3;
  const small = B.size < 460;
  const bezel = Math.max(small ? 7 : 9, B.size * (small ? .025 : .035));
  B.outer = B.R - bezel;
  B.hub = B.outer * (K >= 5 ? (small ? .13 : .15) : K === 4 ? .17 : .21);
  B.t = (B.outer - B.hub) / K;
  B.gap = Math.max(2.5, B.size * .006);
}
const slotAngle = (r, p) => -Math.PI / 2 + p * G().step + r.angle;
function slotScreen(j, p) {
  const rect = cv.getBoundingClientRect(), r = G().rings[j];
  const a = slotAngle(r, p), rad = B.hub + (j + .5) * B.t;
  return [rect.left + B.cx + Math.cos(a) * rad, rect.top + B.cy + Math.sin(a) * rad];
}

// ================================================================ TEXT: best fit
// A card can show its words upright, along the ring, or along the slice. We try all three
// and use whichever lets the words be biggest (upright wins a tie because it is easiest to read).
const textCache = new Map();
function wrapLines(c2, words, maxW) {
  const lines = []; let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (c2.measureText(test).width <= maxW || !line) line = test; else { lines.push(line); line = w; }
  }
  lines.push(line);
  return lines;
}
function fitBlock(text, fits, maxS, minS = 7, c2 = ctx) {
  const words = String(text).split(/\s+/);
  for (let size = maxS; size >= minS; size -= .5) {
    c2.font = `800 ${size}px ${textFont()}`;
    const full = c2.measureText(words.join(" ")).width;
    for (const f of [1, .72, .55, .4, 0]) {
      const lines = wrapLines(c2, words, Math.max(1, full * f));
      const bw = Math.max(...lines.map((l) => c2.measureText(l).width)), bh = lines.length * size * 1.06;
      if (fits(bw, bh)) return { size, lines, lh: size * 1.06 };
    }
  }
  return null;
}
const readable = (a) => { a = mod(a + Math.PI, TAU) - Math.PI; return Math.abs(a) > Math.PI / 2 + 1e-6 ? a - Math.sign(a) * Math.PI : a; };
function fitCard(text, ac, rIn, rOut, half) {
  const T = (rOut - rIn) * .86, rMid = (rIn + rOut) / 2;
  const c = Math.abs(Math.cos(ac)), sn = Math.abs(Math.sin(ac));
  const key = `${S.lang}|${text}|${rIn | 0}|${rOut | 0}|${half.toFixed(3)}|${Math.round(c * 20)}|${Math.round(sn * 20)}|${Math.round(mod(ac, TAU) * 10)}`;
  let r = textCache.get(key);
  if (r) return r;
  const chord = (rad) => 2 * Math.max(1, rad) * Math.sin(Math.max(.02, half - B.gap / Math.max(1, rad))) * .9;
  const maxS = Math.min(30, Math.max(T, chord(rMid)) * .5);
  const options = [];
  // 1. upright: a level box inside the turned card
  const Bt = chord(rIn + (rOut - rIn) * .25);
  const up = fitBlock(text, (bw, bh) => bw * c + bh * sn <= T && bw * sn + bh * c <= Bt, maxS);
  if (up) options.push({ ...up, rot: 0, score: up.size + 1.5 });
  // 2. along the ring: lines follow the curve, the block's height goes across the ring
  const al = fitBlock(text, (bw, bh) => bh <= T && bw <= chord(rMid - bh / 2), maxS);
  if (al) options.push({ ...al, rot: readable(ac + Math.PI / 2), score: al.size + .5 });
  // 3. along the slice: lines point out from the middle
  const ra = fitBlock(text, (bw, bh) => bw <= T && bh <= chord(rMid - bw / 2), maxS);
  if (ra) options.push({ ...ra, rot: readable(ac), score: ra.size });
  r = options.sort((a, b) => b.score - a.score)[0];
  if (!r) { ctx.font = `800 7px ${textFont()}`; r = { size: 6.5, lines: wrapLines(ctx, String(text).split(/\s+/), 1), lh: 7, rot: readable(ac + Math.PI / 2) }; }
  textCache.set(key, r);
  return r;
}

// ================================================================ DRAWING
function tilePath(c2, cx, cy, rIn, rOut, a0, a1) {
  const gI = B.gap / (2 * rIn), gO = B.gap / (2 * rOut);
  c2.beginPath();
  c2.arc(cx, cy, rOut, a0 + gO, a1 - gO);
  c2.arc(cx, cy, rIn, a1 - gI, a0 + gI, true);
  c2.closePath();
}
function cardColour(r, e, p) { return G().D.colourClues ? ENTITY_COLOURS[e % ENTITY_COLOURS.length] : (p % 2 ? r.colour : r.shade); }

// a picture value (flag, number, emoji) drawn upright and centred in a box of size sq
function drawIcon(c2, v, x, y, sq) {
  if (v.startsWith("flag:")) {
    const img = flagImg(v.slice(5));
    const fw = sq * .95, fh = fw / 1.5;
    if (img.complete && img.naturalWidth) {
      c2.save(); c2.shadowColor = "rgba(0,0,0,.25)"; c2.shadowBlur = 3; c2.shadowOffsetY = 1;
      c2.drawImage(img, x - fw / 2, y - fh / 2, fw, fh); c2.restore();
      c2.strokeStyle = "rgba(0,0,0,.18)"; c2.lineWidth = 1; c2.strokeRect(x - fw / 2, y - fh / 2, fw, fh);
    }
    return;
  }
  if (v.startsWith("num:")) {
    const rr = sq * .46;
    c2.fillStyle = "#1C3326"; c2.beginPath(); c2.arc(x, y, rr, 0, TAU); c2.fill();
    c2.fillStyle = "#fff"; c2.font = `800 ${rr * 1.25}px ${textFont()}`; c2.textAlign = "center"; c2.textBaseline = "middle";
    c2.fillText(v.slice(4), x, y + rr * .08);
    return;
  }
  const fs = sq * .86;
  c2.font = `${fs}px ${EMOJI_FONT}`; c2.textAlign = "center"; c2.textBaseline = "middle";
  c2.fillText(v, x, y + fs * .04);
}

function drawCardContent(r, e, ac, rIn, rOut, half) {
  const v = G().ents[e].values[r.ri];
  const rMid = (rIn + rOut) / 2, x = B.cx + Math.cos(ac) * rMid, y = B.cy + Math.sin(ac) * rMid;
  if (r.def.icon) {
    const c = Math.abs(Math.cos(ac)), sn = Math.abs(Math.sin(ac));
    const A = (rOut - rIn) * .8, Bt = 2 * rIn * Math.sin(Math.max(.05, half - B.gap / rIn)) * .9;
    drawIcon(ctx, v, x, y, Math.min(A / (c + sn) * 1.15, Bt / (c + sn) * 1.15, A, Bt));
    return;
  }
  const f = fitCard(tl(v), ac, rIn, rOut, half);
  ctx.save();
  ctx.translate(x, y); ctx.rotate(f.rot);
  ctx.font = `800 ${f.size}px ${textFont()}`;
  ctx.fillStyle = "#1C3326"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const y0 = -((f.lines.length - 1) * f.lh) / 2;
  f.lines.forEach((l, i) => ctx.fillText(l, 0, y0 + i * f.lh));
  ctx.restore();
}

function drawBoard(now) {
  const g = G();
  if (!g || !B.size) return;
  const { cx, cy, R, outer, hub, t: T } = B;
  ctx.setTransform(B.dpr, 0, 0, B.dpr, 0, 0);
  ctx.clearRect(0, 0, B.size, B.size);
  ctx.save();
  ctx.shadowColor = "rgba(28,51,38,.35)"; ctx.shadowBlur = B.size * .04; ctx.shadowOffsetY = B.size * .015;
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.fillStyle = BOARD_INK; ctx.beginPath(); ctx.arc(cx, cy, outer + B.gap * .6, 0, TAU); ctx.fill();
  for (let s = 0; s < g.N; s++) {
    const a = -Math.PI / 2 + (s + .5) * g.step + guide().angle;
    ctx.strokeStyle = "#1C3326"; ctx.lineWidth = 2.4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (outer + 2), cy + Math.sin(a) * (outer + 2)); ctx.lineTo(cx + Math.cos(a) * (R - 3), cy + Math.sin(a) * (R - 3)); ctx.stroke();
    const ac = -Math.PI / 2 + s * g.step + guide().angle;
    ctx.fillStyle = s === g.hoverWedge ? "#E69A0E" : "#C9D3C3";
    ctx.beginPath(); ctx.arc(cx + Math.cos(ac) * (outer + (R - outer) / 2), cy + Math.sin(ac) * (outer + (R - outer) / 2), Math.max(2, (R - outer) * .22), 0, TAU); ctx.fill();
  }
  const drag = g.drag && g.drag.on ? g.drag : null;
  const target = drag && drag.target;
  for (const r of g.rings) {
    const rIn = hub + r.j * T + B.gap / 2, rOut = hub + (r.j + 1) * T - B.gap / 2;
    for (let p = 0; p < g.N; p++) {
      const e = r.order[p];
      const ac = slotAngle(r, p), half = g.step / 2;
      const empty = r.hidden[p] > 0 || (drag && drag.j === r.j && drag.p === p);
      tilePath(ctx, cx, cy, rIn, rOut, ac - half, ac + half);
      if (empty) {
        ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.fill();
        ctx.setLineDash([6, 5]); ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
        continue;
      }
      ctx.fillStyle = cardColour(r, e, p);
      ctx.fill();
      if (r.j === 0) { ctx.fillStyle = "rgba(28,51,38,.07)"; ctx.fill(); }
      if (r.fixed[p] && r.j > 0) { ctx.strokeStyle = "#E69A0E"; ctx.lineWidth = 3; ctx.stroke(); }
      const pk = g.picked && g.picked.j === r.j && g.picked.p === p;
      if (pk) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = BOARD_INK; ctx.lineWidth = 1.6; ctx.stroke(); }
      drawCardContent(r, e, ac, rIn, rOut, half);
      if (r.fixed[p] && r.j > 0) {              // small gold tick on cards that are right and locked
        const ta = ac + half * .62, tr = rOut - (rOut - rIn) * .2;
        const tx = cx + Math.cos(ta) * tr, ty = cy + Math.sin(ta) * tr, s = Math.max(5, T * .12);
        ctx.fillStyle = "#E69A0E"; ctx.beginPath(); ctx.arc(tx, ty, s, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(1.5, s * .32); ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath(); ctx.moveTo(tx - s * .45, ty); ctx.lineTo(tx - s * .1, ty + s * .38); ctx.lineTo(tx + s * .5, ty - s * .38); ctx.stroke();
      }
      const pa = Math.max(0, 1 - (now - r.pop[p]) / 380);   // white flash when a card lands
      if (pa > 0) { tilePath(ctx, cx, cy, rIn, rOut, ac - half, ac + half); ctx.fillStyle = `rgba(255,255,255,${(pa * .7).toFixed(3)})`; ctx.fill(); }
    }
    const fla = Math.max(0, 1 - (now - r.flash) / 900), hf = Math.max(0, 1 - (now - r.hintFlash) / 1100);
    if (fla > 0 || hf > 0) {
      ctx.save(); ctx.globalAlpha = Math.max(fla, hf);
      ctx.strokeStyle = fla > 0 ? "#FFC23A" : "#7FB8FF"; ctx.lineWidth = (rOut - rIn) * (fla > 0 ? .9 : .5) * (1 - Math.max(fla, hf) * .4);
      ctx.beginPath(); ctx.arc(cx, cy, (rIn + rOut) / 2, 0, TAU); ctx.stroke(); ctx.restore();
    }
  }
  if (target) {                                  // where the picked-up card will land
    const r = g.rings[target.j];
    const rIn = hub + r.j * T + B.gap / 2, rOut = hub + (r.j + 1) * T - B.gap / 2, ac = slotAngle(r, target.p);
    tilePath(ctx, cx, cy, rIn - 1, rOut + 1, ac - g.step / 2, ac + g.step / 2);
    ctx.lineWidth = 5; ctx.strokeStyle = target.blocked ? "#E2574A" : "#fff"; ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = target.blocked ? "#fff" : "#E69A0E"; ctx.stroke();
  }
  if (g.showCursor && g.phase === "play") {
    const r = g.rings[g.cursor.j];
    const rIn = hub + r.j * T + B.gap / 2, rOut = hub + (r.j + 1) * T - B.gap / 2, ac = slotAngle(r, g.cursor.p);
    tilePath(ctx, cx, cy, rIn, rOut, ac - g.step / 2, ac + g.step / 2);
    ctx.setLineDash([7, 5]); ctx.lineWidth = 3; ctx.strokeStyle = "#E69A0E"; ctx.stroke(); ctx.setLineDash([]);
  }
  if (g.phase === "preview") {
    const k = mod(Math.floor((now - g.previewT0) / (g.previewDur / g.N)), g.N);
    if (g.readWedge !== k) { g.readWedge = k; showSlice(k); }
    wedgeOverlay(k, "rgba(255,226,120,.35)", "#FFC23A");
  } else if (g.phase === "won") {
    const k = Math.floor((now - g.winT0) / 140);
    if (k < g.N * 2) wedgeOverlay(mod(k, g.N), "rgba(255,226,120,.45)", "#FFC23A");
  } else if (g.hoverWedge >= 0 && g.phase === "play" && !drag) {
    wedgeOverlay(g.hoverWedge, "rgba(255,255,255,.16)", "rgba(255,255,255,.85)");
  }
  drawHub(now);
}
function wedgeOverlay(s, fill, stroke) {
  const g = G(), a = -Math.PI / 2 + s * g.step + guide().angle;
  ctx.beginPath();
  ctx.arc(B.cx, B.cy, B.outer + 1, a - g.step / 2, a + g.step / 2);
  ctx.arc(B.cx, B.cy, B.hub, a + g.step / 2, a - g.step / 2, true);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = stroke; ctx.stroke();
}
function drawHub(now) {
  const g = G(), { cx, cy, hub } = B;
  const spin = g.phase === "won" ? (now - g.winT0) / 300 : Math.sin(now / 1400) * .08;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(spin);
  ctx.fillStyle = "#FFC23A";
  for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.ellipse(0, -hub * .62, hub * .2, hub * .34, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = "#8A5631"; ctx.beginPath(); ctx.arc(cx, cy, hub * .52, 0, TAU); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if (g.phase === "preview") {
    const left = Math.max(0, Math.ceil((g.previewDur - (now - g.previewT0)) / 1000));
    ctx.font = `800 ${hub * .62}px ${textFont()}`; ctx.fillText(String(left), cx, cy + hub * .04);
  } else {
    const label = g.phase === "won" ? "★" : `${placed()}/${movable()}`;
    ctx.font = `800 ${hub * (label.length > 4 ? .3 : .38)}px ${textFont()}`; ctx.fillText(label, cx, cy + hub * .04);
  }
}

// ---- cards that are picked up or flying: drawn as upright chips on the full-screen layer
function chipSize() { const w = Math.max(96, Math.min(190, B.size * .3)); return [w, w * .46]; }
function roundRect(c2, x, y, w, h, r) { c2.beginPath(); c2.moveTo(x + r, y); c2.arcTo(x + w, y, x + w, y + h, r); c2.arcTo(x + w, y + h, x, y + h, r); c2.arcTo(x, y + h, x, y, r); c2.arcTo(x, y, x + w, y, r); c2.closePath(); }
function drawChip(c2, r, e, x, y, scale, rot, colour) {
  const [w0, h0] = chipSize(), w = w0 * scale, h = h0 * scale;
  const v = G().ents[e].values[r.ri];
  c2.save(); c2.translate(x, y); c2.rotate(rot);
  c2.shadowColor = "rgba(28,51,38,.4)"; c2.shadowBlur = 18 * scale; c2.shadowOffsetY = 8 * scale;
  roundRect(c2, -w / 2, -h / 2, w, h, h * .32); c2.fillStyle = colour; c2.fill();
  c2.shadowColor = "transparent";
  c2.lineWidth = 3; c2.strokeStyle = "#fff"; c2.stroke();
  if (r.def.icon) drawIcon(c2, v, 0, 0, h * .78);
  else {
    const txt = tl(v);
    const f = fitBlock(txt, (bw, bh) => bw <= w * .86 && bh <= h * .8, Math.min(26, h * .5), 7, c2) || { size: 8, lines: [txt], lh: 9 };
    c2.font = `800 ${f.size}px ${textFont()}`; c2.fillStyle = "#1C3326"; c2.textAlign = "center"; c2.textBaseline = "middle";
    const y0 = -((f.lines.length - 1) * f.lh) / 2;
    f.lines.forEach((l, i) => c2.fillText(l, 0, y0 + i * f.lh));
  }
  c2.restore();
}
function drawFloat(now) {
  const d = fl._d || 1;
  fctx.setTransform(d, 0, 0, d, 0, 0);
  fctx.clearRect(0, 0, innerWidth, innerHeight);
  const g = G();
  if (!g || S.mode === "home") return;
  for (const f of g.flights) {
    if (now < f.t0) continue;
    const k = Math.min(1, (now - f.t0) / f.dur), e = ease.inOut(k);
    const [tx, ty] = slotScreen(f.j, f.p);
    const mx = f.cx ?? (f.x + tx) / 2, my = f.cy ?? (f.y + ty) / 2;
    const x = (1 - e) * (1 - e) * f.x + 2 * (1 - e) * e * mx + e * e * tx;
    const y = (1 - e) * (1 - e) * f.y + 2 * (1 - e) * e * my + e * e * ty;
    drawChip(fctx, g.rings[f.j], f.e, x, y, f.s0 + (.62 - f.s0) * e + Math.sin(Math.PI * e) * .12, (1 - e) * f.rot, cardColour(g.rings[f.j], f.e, f.p));
  }
  if (g.drag && g.drag.on) {
    const dr = g.drag, r = g.rings[dr.j];
    drawChip(fctx, r, dr.e, dr.cx, dr.cy, 1.08, Math.max(-.25, Math.min(.25, dr.vx * .01)), cardColour(r, dr.e, dr.p));
  }
}

// ================================================================ MOVES
function fly(j, p, e, from, opts = {}) {
  const g = G();
  g.rings[j].hidden[p]++;
  g.flights.push({ j, p, e, x: from[0], y: from[1], t0: performance.now() + (opts.delay || 0), dur: opts.dur || 380, s0: opts.s0 ?? .7, rot: opts.rot || 0, cx: opts.cx, cy: opts.cy, done: opts.done });
}
function updateFlights(now) {
  const g = G();
  if (!g.flights.length) return;
  const landed = g.flights.filter((f) => now >= f.t0 + f.dur);
  if (!landed.length) return;
  g.flights = g.flights.filter((f) => now < f.t0 + f.dur);
  for (const f of landed) {
    const r = g.rings[f.j];
    r.hidden[f.p] = Math.max(0, r.hidden[f.p] - 1);
    r.pop[f.p] = now;
    if (f.done) f.done();
  }
}
// swap the cards in slices a and b of ring j; both fly to their new places
function swapCards(j, a, b, opts = {}) {
  const g = G(), r = g.rings[j];
  [r.order[a], r.order[b]] = [r.order[b], r.order[a]];
  let left = 2;
  const done = () => { if (--left === 0) settle(j, [a, b], opts); };
  fly(j, a, r.order[a], opts.fromA || slotScreen(j, b), { done, s0: opts.fromA ? 1.05 : .7, dur: opts.fromA ? 260 : 440, rot: opts.rotA });
  fly(j, b, r.order[b], slotScreen(j, a), { done, dur: 460, delay: 40 });
  audio.play("swap");
}
function settle(j, slots, opts) {
  const g = G(), r = g.rings[j];
  if (g.phase !== "play") return;
  let good = 0;
  for (const p of slots) {
    if (!isRight(r, p) || r.fixed[p]) continue;
    good++;
    if (lockEach()) {
      r.fixed[p] = true;
      const [x, y] = slotScreen(j, p);
      burst(x, y, 26, 7);
      popup("✓", x, y - 10);
    }
  }
  if (good && lockEach()) {
    g.streak++;
    audio.play("correct", Math.min(9, g.streak - 1));
    buzz([15, 30, 15]);
    toloPlay.react(g.streak >= 3 ? "cheer" : "happy", 1200);
    if (!opts.hint) playSpeech.say(g.streak >= 3 ? `${pick(t("praise"))} ${t("inRow", { n: g.streak })}` : pick(t("praise")));
  } else if (!opts.hint && opts.mover !== undefined && lockEach()) {
    g.streak = 0; audio.play("soft"); toloPlay.react("think", 1000); playSpeech.say(t("notYet"));
  }                                         // Hard: no telling which single card is right
  checkRing(r);
  renderPlayChrome();
}
function checkRing(r) {
  const g = G();
  if (r.done || !r.order.every((_, p) => isRight(r, p))) return;
  r.done = true;
  r.fixed.fill(true);
  r.flash = performance.now();
  const left = g.rings.filter((x) => !x.done).length;
  const [x, y] = slotScreen(r.j, 0);
  burst(x, y, 60, 10); flash(x, y);
  praise(pick(t("praise")), t("ringDone", { ring: tl(r.def.name) }), left === 0);
  audio.play("lock"); buzz([20, 40, 30]);
  const li = $(`#legend li[data-j="${r.j}"]`);
  if (li) { li.classList.remove("just"); void li.offsetWidth; li.classList.add("just"); }
  if (left === 0) { win(); return; }
  playSpeech.say(`${t("ringDone", { ring: tl(r.def.name) })} ${left === 1 ? t("lastOne") : t("moreToGo", { n: left })}`);
  toloPlay.react("cheer", 1800);
}

// fewest swaps needed to sort every ring
function parOf() {
  const g = G();
  let n = 0;
  for (const r of g.rings.slice(1)) {
    const seen = new Array(g.N).fill(false);
    for (let p = 0; p < g.N; p++) {
      if (seen[p]) continue;
      let q = p, len = 0;
      while (!seen[q]) { seen[q] = true; q = guide().order.indexOf(r.order[q]); len++; }
      n += len - 1;
    }
  }
  return n;
}

// mix: every card of every outer ring flies out to a new slice on its own curved path
function startMix() {
  const g = G();
  if (g.phase !== "preview") return;
  g.phase = "mix";
  $("#ready-btn").classList.remove("show");
  playSpeech.say(t("mixing"));
  toloPlay.react("think", 2400);
  audio.play("whirr");
  const rect = cv.getBoundingClientRect(), ccx = rect.left + B.cx, ccy = rect.top + B.cy;
  let longest = 0;
  for (const r of g.rings.slice(1)) {
    const from = r.order.map((_, p) => slotScreen(r.j, p));
    let perm;
    do perm = shuffle(r.order.map((_, p) => p)); while (perm.some((q, p) => q === p));   // every card moves
    const old = [...r.order];
    r.order = perm.map((q) => old[q]);
    r.fixed.fill(false);
    r.order.forEach((e, p) => {
      const a = rnd(0, TAU), far = B.R * rnd(1.05, 1.5);
      const delay = reduceMotion ? 0 : r.j * 120 + p * 45 + rnd(0, 160), dur = reduceMotion ? 10 : rnd(900, 1400);
      longest = Math.max(longest, delay + dur);
      fly(r.j, p, e, from[perm[p]], { delay, dur, s0: .62, rot: rnd(-1.2, 1.2), cx: ccx + Math.cos(a) * far, cy: ccy + Math.sin(a) * far });
    });
  }
  g.par = parOf();
  setTimeout(() => {
    if (S.g !== g) return;
    g.phase = "play";
    g.start = performance.now();
    playSpeech.say(t("go"));
    toloPlay.react("happy", 1500);
    audio.play("ready");
    renderPlayChrome();
  }, longest + 150);
}

function useHint() {
  const g = G();
  if (!g || g.phase !== "play") return;
  if (g.hintsLeft <= 0) { playSpeech.say(t("noHints")); toloPlay.react("oops", 1200); audio.play("soft"); return; }
  const r = g.rings.find((x) => !x.done);
  if (!r || g.flights.length) return;
  const p = r.order.findIndex((_, q) => !isRight(r, q));
  const q = r.order.indexOf(guide().order[p]);
  g.hintsLeft--; g.hintsUsed++; g.moves += 2; bumpStat("#st-moves", g.moves);
  r.hintFlash = performance.now();
  g.picked = null;
  swapCards(r.j, p, q, { hint: true });
  playSpeech.say(t("hintUsed"));
  toloPlay.react("happy", 1200);
  renderPlayChrome();
}

function win() {
  const g = G();
  g.phase = "won";
  g.end = performance.now();
  g.winT0 = performance.now();
  for (const r of g.rings) r.tween = { from: 0, to: TAU, t0: g.winT0 + 350, dur: reduceMotion ? 10 : 1700, ease: ease.inOut };
  setTimeout(() => audio.play("spin"), 350);
  playSpeech.say(pick(t("praise")));
  toloPlay.react("cheer", 3000);
  cannons();
  const rr = stage.getBoundingClientRect();
  for (let i = 0; i < 4; i++) setTimeout(() => firework(rr.left + rr.width * (.2 + Math.random() * .6), rr.top + rr.height * (.15 + Math.random() * .5)), 300 + i * 320);
  renderPlayChrome();
  setTimeout(finish, 2300);
}
function stars() {
  const g = G();
  const extra = g.moves - g.par;
  return extra <= Math.max(1, Math.round(g.par * .2)) ? 3 : extra <= Math.max(4, Math.round(g.par * .7)) ? 2 : 1;
}
function finish() {
  const g = G();
  if (!g || S.g !== g) return;
  S.mode = "done";
  const n = stars();
  const rec = S.best[g.lv.key] || (S.best[g.lv.key] = {});
  rec[g.D.key] = Math.max(rec[g.D.key] || 0, n);
  store.save();
  audio.play("win");
  buzz([60, 60, 60, 60, 200]);
  toloDone.react("cheer", Infinity);
  rain(160); petalShower(60);
  renderDone(n);
  $("#done-ov").classList.add("show");
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const s = $$("#done-stars svg")[i];
      if (!s || S.mode !== "done") return;
      s.classList.add("in");
      if (i < n) { audio.play("star", i); const b = s.getBoundingClientRect(); burst(b.left + b.width / 2, b.top + b.height / 2, 26, 7); }
    }, 700 + i * 380);
  }
}

// ================================================================ BOARD INPUT: pick up, drag, drop, tap
function hitBoard(clientX, clientY) {
  const rect = cv.getBoundingClientRect();
  const x = clientX - rect.left - B.cx, y = clientY - rect.top - B.cy;
  const r = Math.hypot(x, y), ang = Math.atan2(y, x), g = G();
  const wedge = mod(Math.round((ang + Math.PI / 2) / g.step), g.N);
  let j = Math.floor((r - B.hub) / B.t);
  if (r > B.outer + 4 || r < B.hub * .7) j = -1;
  j = Math.min(j, g.K - 1);
  if (r >= B.hub * .7 && r < B.hub) j = 0;
  return { j, wedge, r, inside: r < B.R * 1.15 };
}
function valueHTML(r, e) { const v = G().ents[e].values[r.ri]; return r.def.icon ? iconHTML(v) : esc(tl(v)); }
function showSlice(s) {
  const g = G();
  if (!g) return;
  caption.classList.remove("swap");
  caption.innerHTML = g.rings.map((r) => {
    const e = r.order[s];
    const tick = r.j > 0 && r.fixed[s] && g.phase !== "preview";
    return `<span class="pill" style="--c:${cardColour(r, e, s)}">${valueHTML(r, e)}${tick ? " ✓" : ""}</span>`;
  }).join('<span class="dot">·</span>');
}
function showDragCaption(dr) {
  const g = G(), r = g.rings[dr.j], gd = guide();
  const card = `<span class="pill" style="--c:${cardColour(r, dr.e, dr.p)}">${valueHTML(r, dr.e)}</span>`;
  if (!dr.target) { caption.innerHTML = card; return; }
  const ge = gd.order[dr.target.p];
  caption.innerHTML = `${card}<span class="dot">→</span><span class="pill" style="--c:${cardColour(gd, ge, dr.target.p)}">${valueHTML(gd, ge)}</span>${dr.target.blocked ? '<span class="dot">🔒</span>' : ""}`;
}

const TOUCH_LIFT = 58;                      // on touch screens the card floats above the finger so it stays visible
cv.addEventListener("pointerdown", (e) => {
  const g = G();
  if (!g || S.mode !== "play" || g.phase !== "play" || g.drag) return;
  audio.ensure();
  const h = hitBoard(e.clientX, e.clientY);
  if (h.j < 0) return;
  cv.setPointerCapture?.(e.pointerId);
  g.drag = { on: false, id: e.pointerId, j: h.j, p: h.wedge, e: g.rings[h.j].order[h.wedge], x0: e.clientX, y0: e.clientY, cx: e.clientX, cy: e.clientY, vx: 0, lx: e.clientX, touch: e.pointerType !== "mouse", target: null };
  g.hoverWedge = h.wedge;
});
cv.addEventListener("pointermove", (e) => {
  const g = G();
  if (!g || S.mode !== "play") return;
  const dr = g.drag;
  if (!dr) {
    if (e.pointerType === "mouse" && g.phase === "play") {
      const h = hitBoard(e.clientX, e.clientY);
      const w = h.j >= 0 ? h.wedge : -1;
      if (w !== g.hoverWedge) { g.hoverWedge = w; if (w >= 0) showSlice(w); }
      cv.style.cursor = h.j > 0 && !g.rings[h.j].fixed[h.wedge] && !g.rings[h.j].hidden[h.wedge] ? "grab" : "default";
    }
    return;
  }
  if (e.pointerId !== dr.id) return;
  if (!dr.on) {
    if (Math.hypot(e.clientX - dr.x0, e.clientY - dr.y0) < 7) return;
    const r = g.rings[dr.j];
    if (dr.j === 0 || r.fixed[dr.p] || r.hidden[dr.p]) { g.drag = null; tapSlot(dr.j, dr.p); return; }   // guide, locked or moving cards stay put
    dr.on = true;
    g.picked = null;
    audio.play("pick"); buzz(10);
    toloPlay.react("think", Infinity);
    cv.classList.add("dragging");
  }
  dr.vx = dr.vx * .6 + (e.clientX - dr.lx) * .4; dr.lx = e.clientX;
  dr.cx = e.clientX; dr.cy = e.clientY - (dr.touch ? TOUCH_LIFT : 0);
  // the finger (or mouse) chooses the slice; the card always goes into that slice of its own ring
  const h = hitBoard(e.clientX, e.clientY);
  const tgt = h.inside ? { j: dr.j, p: h.wedge, blocked: g.rings[dr.j].fixed[h.wedge] || g.rings[dr.j].hidden[h.wedge] > 0 } : null;
  const key = tgt ? `${tgt.p}${tgt.blocked}` : "";
  if (key !== dr.tkey) { dr.tkey = key; if (tgt && tgt.p !== dr.p) { audio.play("hover", tgt.p); buzz(4); } }
  dr.target = tgt && tgt.p !== dr.p ? tgt : null;
  g.hoverWedge = tgt ? tgt.p : -1;
  showDragCaption(dr);
});
function dropCard(e) {
  const g = G();
  if (!g || !g.drag || (e && e.pointerId !== g.drag.id)) return;
  const dr = g.drag;
  g.drag = null;
  cv.classList.remove("dragging");
  toloPlay.react("idle", 1);
  if (!dr.on) { tapSlot(dr.j, dr.p); return; }
  const tg = dr.target, from = [dr.cx, dr.cy];
  if (!tg || tg.blocked) {
    if (tg && tg.blocked) { playSpeech.say(t("alreadyRight")); audio.play("wrong"); buzz(40); }
    fly(dr.j, dr.p, dr.e, from, { dur: 300, s0: 1.05 });
    return;
  }
  g.moves++; bumpStat("#st-moves", g.moves);
  swapCards(dr.j, tg.p, dr.p, { fromA: from, rotA: dr.vx * .01, mover: tg.p });
}
cv.addEventListener("pointerup", dropCard);
cv.addEventListener("pointercancel", () => {
  const g = G();
  if (!g || !g.drag) return;
  const dr = g.drag; g.drag = null; cv.classList.remove("dragging");
  if (dr.on) fly(dr.j, dr.p, dr.e, [dr.cx, dr.cy], { dur: 300, s0: 1.05 });
});
cv.addEventListener("pointerleave", (e) => { const g = G(); if (e.pointerType === "mouse" && g && !g.drag) g.hoverWedge = -1; });
cv.addEventListener("touchstart", (e) => { if (S.mode === "play") e.preventDefault(); }, { passive: false });
cv.addEventListener("touchmove", (e) => { if (S.mode === "play") e.preventDefault(); }, { passive: false });

// tap a card, then tap the slice where it should go
function tapSlot(j, p) {
  const g = G();
  if (g.phase !== "play") return;
  g.hoverWedge = p; showSlice(p);
  if (j === 0) { playSpeech.say(t("guideRing")); audio.play("click"); g.picked = null; return; }
  const r = g.rings[j];
  if (r.hidden[p]) return;
  const pk = g.picked;
  if (pk && pk.j === j && pk.p !== p) {
    g.picked = null;
    if (r.fixed[p]) { playSpeech.say(t("alreadyRight")); audio.play("wrong"); return; }
    g.moves++; bumpStat("#st-moves", g.moves);
    swapCards(j, p, pk.p, { mover: p });
    return;
  }
  if (r.fixed[p]) { playSpeech.say(t("alreadyRight")); audio.play("soft"); g.picked = null; return; }
  if (pk && pk.j === j && pk.p === p) { g.picked = null; audio.play("click"); return; }
  g.picked = { j, p };
  audio.play("select"); buzz(8);
  playSpeech.say(t("tapPlace"));
  caption.classList.add("swap");
  caption.textContent = t("tapPlace");
}

// ================================================================ BACKGROUND: floating pieces you can grab and throw
// Every piece drifts on its own path (own speed, direction, wobble and spin), bounces off the edges
// and off other pieces, moves aside when the pointer comes close, and can be dragged, thrown,
// or dropped on Tolo, who reads it out loud.
const toyLayer = $("#toys"), toyLift = $("#toy-lift");
const toys = [];
let toyPool = [];
const rnd = (a, b) => a + Math.random() * (b - a);
function toyPoolBuild() {
  const pool = [];
  for (const lv of LEVELS) for (const it of lv.items) {
    const iconRing = lv.rings.findIndex((r) => r.icon);
    const firstText = lv.rings.findIndex((r) => !r.icon);
    const ic = iconRing >= 0 ? it.values[iconRing] : lv.emoji;
    const word = it.values[firstText];
    if (String(ic).startsWith("flag:")) pool.push({ kind: "flag", ic, word });
    else if (String(ic).startsWith("num:")) pool.push({ kind: "word", ic: lv.emoji, word });
    else { pool.push({ kind: "word", ic, word }); pool.push({ kind: "pic", ic, word }); }
  }
  return pool;
}
function toyHTML(d) {
  if (d.kind === "pic") return `<span class="toy-pic">${esc(d.ic)}</span>`;
  if (d.kind === "flag") return `<span class="toy-flag">${flagSVG(d.ic.slice(5))}</span><b>${esc(tl(d.word))}</b>`;
  return `<i>${esc(d.ic)}</i><b>${esc(tl(d.word))}</b>`;
}
function toyCount() {
  const a = innerWidth * innerHeight;
  return Math.round(Math.max(9, Math.min(26, a / 52000)));
}
function makeToy(d, fromEdge) {
  const el = document.createElement("div");
  el.className = "toy toy-" + d.kind;
  el.innerHTML = toyHTML(d);
  toyLayer.appendChild(el);
  const w = el.offsetWidth, h = el.offsetHeight;
  const speed = rnd(14, 34), dir = rnd(0, TAU);
  const t = {
    el, d, w, h, r: Math.max(w, h) * .42 + Math.min(w, h) * .2,
    x: rnd(w / 2, innerWidth - w / 2), y: rnd(h / 2, innerHeight - h / 2),
    vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed,
    dir, speed, turn: rnd(-.25, .25), seed: rnd(0, 100),
    rot: rnd(-12, 12), spin: 0, wob: rnd(4, 11), scale: 1, grab: null, alpha: fromEdge ? 0 : 1, bornT: performance.now(),
  };
  if (fromEdge) {                                   // new pieces float in from a screen edge
    const side = Math.floor(rnd(0, 4));
    t.x = side === 0 ? -w : side === 1 ? innerWidth + w : rnd(0, innerWidth);
    t.y = side === 2 ? -h : side === 3 ? innerHeight + h : rnd(0, innerHeight);
    const a = Math.atan2(innerHeight / 2 - t.y, innerWidth / 2 - t.x) + rnd(-.5, .5);
    t.dir = a; t.vx = Math.cos(a) * 90; t.vy = Math.sin(a) * 90;
  }
  return t;
}
function buildToys() {
  if (!toyLayer) return;
  toyPool = toyPoolBuild();
  if (toys.length) {                                // language changed: keep positions, update the words
    for (const t of toys) { t.el.innerHTML = toyHTML(t.d); t.w = t.el.offsetWidth; t.h = t.el.offsetHeight; t.r = Math.max(t.w, t.h) * .42 + Math.min(t.w, t.h) * .2; }
    return;
  }
  const picks = shuffle([...toyPool]).slice(0, toyCount());
  for (const d of picks) toys.push(makeToy(d, false));
}
function respawnToy(t) {
  t.el.remove();
  const i = toys.indexOf(t);
  const d = pick(toyPool.filter((p) => !toys.some((x) => x.d === p))) || pick(toyPool);
  toys[i] = makeToy(d, true);
}
function stepToys(now, dtMs) {
  if (!toys.length) return;
  const dt = Math.min(.05, dtMs / 1000), W = innerWidth, H = innerHeight;
  const tsec = now / 1000;
  for (const t of toys) {
    if (t.grab) continue;
    // each piece slowly changes its own direction
    t.dir += Math.sin(tsec * .23 + t.seed) * t.turn * dt;
    const cx = Math.cos(t.dir) * t.speed, cy = Math.sin(t.dir) * t.speed;
    const relax = Math.min(1, dt * .9);
    t.vx += (cx - t.vx) * relax; t.vy += (cy - t.vy) * relax;
    // move aside when the pointer comes near (not while dragging something)
    if (!toyDrag.t) {
      const dx = t.x - pointer[0], dy = t.y - pointer[1], dd = Math.hypot(dx, dy), R = t.r + 70;
      if (dd < R && dd > 1) { const f = (1 - dd / R) * 260 * dt; t.vx += dx / dd * f; t.vy += dy / dd * f; }
    }
    if (!reduceMotion) { t.x += t.vx * dt; t.y += t.vy * dt; }
    // bounce off the screen edges
    const sp = Math.hypot(t.vx, t.vy);
    if (t.x < t.w / 2 && t.vx < 0 && t.alpha >= 1) { t.vx = Math.abs(t.vx) * .8; t.dir = Math.PI - t.dir; t.spin += t.vy * .02; if (sp > 500) audio.play("tick", 520); }
    if (t.x > W - t.w / 2 && t.vx > 0 && t.alpha >= 1) { t.vx = -Math.abs(t.vx) * .8; t.dir = Math.PI - t.dir; t.spin -= t.vy * .02; if (sp > 500) audio.play("tick", 520); }
    if (t.y < t.h / 2 && t.vy < 0 && t.alpha >= 1) { t.vy = Math.abs(t.vy) * .8; t.dir = -t.dir; t.spin -= t.vx * .02; if (sp > 500) audio.play("tick", 620); }
    if (t.y > H - t.h / 2 && t.vy > 0 && t.alpha >= 1) { t.vy = -Math.abs(t.vy) * .8; t.dir = -t.dir; t.spin += t.vx * .02; if (sp > 500) audio.play("tick", 620); }
    t.spin *= Math.pow(.2, dt);
    t.rot += t.spin * dt * 60;
    t.alpha = Math.min(1, t.alpha + dt * 1.5);
    t.scale += (1 - t.scale) * Math.min(1, dt * 8);
  }
  // pieces bump into each other instead of overlapping
  for (let i = 0; i < toys.length; i++) for (let j = i + 1; j < toys.length; j++) {
    const a = toys[i], b = toys[j];
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .01, min = a.r + b.r;
    if (d >= min) continue;
    const nx = dx / d, ny = dy / d, push = (min - d) / 2;
    if (!a.grab) { a.x -= nx * push; a.y -= ny * push; }
    if (!b.grab) { b.x += nx * push; b.y += ny * push; }
    const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (rel < 0) {
      const k = -rel * .9;
      if (!a.grab) { a.vx -= nx * k; a.vy -= ny * k; a.spin -= k * .01; }
      if (!b.grab) { b.vx += nx * k; b.vy += ny * k; b.spin += k * .01; }
      if (k > 260) { audio.play("tick", 900 + Math.min(600, k)); buzz(4); }
    }
  }
  for (const t of toys) {
    const wob = reduceMotion ? 0 : Math.sin(tsec * .8 + t.seed) * t.wob * .35;
    const bob = reduceMotion ? 0 : Math.sin(tsec * 1.1 + t.seed * 2) * 3;
    t.el.style.transform = `translate3d(${(t.x - t.w / 2).toFixed(1)}px, ${(t.y - t.h / 2 + bob).toFixed(1)}px, 0) rotate(${(t.rot + wob).toFixed(1)}deg) scale(${t.scale.toFixed(3)})`;
    t.el.style.opacity = t.grab ? "1" : (t.alpha * (document.body.classList.contains("playing") ? .4 : .78)).toFixed(3);
  }
  if (toyDrag.t) updateDropTarget();
}

// ---- grab, throw and drop
const toyDrag = { t: null };
const TOY_BLOCK = "button,a,input,select,textarea,.carousel,.board,#rings,.panel,.stat,.dock,.overlay,.lang-switch,.diff,.legend,.caption,.bubble,.tolo-card,.home-tolo";
function toyAt(x, y) {
  let best = null, bd = Infinity;
  for (const t of toys) {
    if (t.alpha < .5) continue;
    const d = Math.hypot(t.x - x, t.y - y);
    if (d < Math.max(t.w, t.h) * .55 && d < bd) { best = t; bd = d; }
  }
  return best;
}
function canGrab(e) { return S.mode === "home" || S.mode === "play" ? !e.target.closest(TOY_BLOCK) : false; }
document.addEventListener("touchstart", (e) => {
  const tt = e.touches[0];
  if (e.touches.length === 1 && canGrab(e) && toyAt(tt.clientX, tt.clientY)) e.preventDefault();   // stop the page scrolling under a grabbed piece
}, { passive: false });
document.addEventListener("touchmove", (e) => { if (toyDrag.t) e.preventDefault(); }, { passive: false });
document.addEventListener("pointerdown", (e) => {
  if (toyDrag.t || e.button > 0 || !canGrab(e)) return;
  const t = toyAt(e.clientX, e.clientY);
  if (!t) return;
  audio.ensure();
  e.preventDefault();
  toyDrag.t = t;
  t.grab = { id: e.pointerId, ox: e.clientX - t.x, oy: e.clientY - t.y, samples: [[performance.now(), e.clientX, e.clientY]] };
  t.vx = t.vy = 0; t.scale = 1.25; t.spin = 0;
  toyLift.appendChild(t.el);
  t.el.classList.add("held");
  audio.play("pick"); buzz(8);
  document.body.classList.add("toy-dragging");
});
addEventListener("pointermove", (e) => {
  const t = toyDrag.t;
  if (!t || e.pointerId !== t.grab.id) return;
  const nx = e.clientX - t.grab.ox, ny = e.clientY - t.grab.oy;
  t.rot += (nx - t.x) * .15;
  t.rot *= .92;
  t.x = nx; t.y = ny;
  t.grab.samples.push([performance.now(), e.clientX, e.clientY]);
  if (t.grab.samples.length > 8) t.grab.samples.shift();
});
function dropZone() {
  const el = S.mode === "home" ? $(".home-tolo .tolo") : $(".tolo-card");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width ? r : null;
}
let dropHot = false;
function updateDropTarget() {
  const t = toyDrag.t, r = dropZone();
  const hot = !!(r && t.x > r.left - 20 && t.x < r.right + 20 && t.y > r.top - 20 && t.y < r.bottom + 20);
  if (hot !== dropHot) {
    dropHot = hot;
    (S.mode === "home" ? toloHome : toloPlay).react(hot ? "happy" : "idle", hot ? 600 : 1);
    if (hot) { audio.play("hover", 8); buzz(6); }
  }
  if (hot) (S.mode === "home" ? toloHome : toloPlay).react("happy", 400);
}
function endToyDrag(e) {
  const t = toyDrag.t;
  if (!t || (e && e.pointerId !== t.grab.id)) return;
  toyDrag.t = null;
  document.body.classList.remove("toy-dragging");
  t.el.classList.remove("held");
  const now = performance.now(), recent = t.grab.samples.filter(([ts]) => now - ts < 100);
  t.grab = null;
  if (dropHot) {                                  // fed to Tolo: Tolo reads it and the piece pops
    dropHot = false;
    const word = tl(t.d.word);
    say(`${t.d.kind === "flag" ? "" : t.d.ic + " "}${word}!`);
    (S.mode === "home" ? toloHome : toloPlay).react("cheer", 1600);
    burst(t.x, t.y, 34, 8);
    audio.play("correct", Math.floor(rnd(0, 5)));
    buzz([15, 30, 15]);
    respawnToy(t);
    return;
  }
  toyLayer.appendChild(t.el);
  if (recent.length >= 2) {
    const [ta, xa, ya] = recent[0], [tb, xb, yb] = recent[recent.length - 1], dtt = Math.max(16, tb - ta);
    t.vx = Math.max(-1600, Math.min(1600, (xb - xa) / dtt * 1000));
    t.vy = Math.max(-1600, Math.min(1600, (yb - ya) / dtt * 1000));
    t.spin = t.vx * .015;
    if (Math.hypot(t.vx, t.vy) > 300) audio.play("swap");
  }
}
addEventListener("pointerup", endToyDrag);
addEventListener("pointercancel", endToyDrag);
addEventListener("resize", () => { for (const t of toys) { t.x = Math.min(Math.max(t.x, t.w / 2), innerWidth - t.w / 2); t.y = Math.min(Math.max(t.y, t.h / 2), innerHeight - t.h / 2); } });

// show a grab hand when the pointer is over a piece you can pick up
addEventListener("pointermove", (e) => {
  if (toyDrag.t || e.pointerType !== "mouse") return;
  document.body.classList.toggle("over-toy", canGrab(e) && !!toyAt(e.clientX, e.clientY));
}, { passive: true });

// ================================================================ FLOW
function say(s) { (S.mode === "home" ? homeSpeech : playSpeech).say(s); }

function startGame(levelIdx, diffKey = S.diff) {
  if (!unlocked(levelIdx)) {
    homeSpeech.say(t("unlockFirst", { name: tl(LEVELS[levelIdx - 1].name) }));
    toloHome.react("oops", 1500); audio.play("wrong");
    return;
  }
  audio.play("click");
  closeDone();
  S.level = levelIdx; S.diff = diffKey; store.save();
  S.g = newGame(levelIdx, diffKey);
  setScreen("play");
  geometry(); B.size = 0; requestAnimationFrame(() => { layoutBoard(); });
  renderPlayChrome(); renderLegend();
  caption.textContent = "";
  openRules();
}
function newMix() {
  if (!S.g) return;
  audio.play("click");
  closeDone();
  S.g = newGame(S.g.levelIdx, S.g.D.key);
  geometry();
  S.mode = "play";
  renderPlayChrome(); renderLegend();
  beginPreview();
}
function beginPreview() {
  const g = G();
  g.phase = "preview";
  g.previewT0 = performance.now();
  g.readWedge = -1;
  $("#ready-btn").classList.add("show");
  playSpeech.say(t("memorise"));
  toloPlay.react("happy", 1600);
}

function rulePages() {
  const g = G();
  const list = g.rings.map((r) => tl(r.def.name)).join(" · ");
  const pages = S.seenRules ? [] : [...t("rules")];
  pages.push(t("ringsAre", { list }));
  if (g.D.ringOnly) pages.push(t("rulesHard"));
  return pages;
}
function openRules() {
  const g = G();
  S.mode = "intro";
  if (g.phase === "play" && g.pausedAt === null) g.pausedAt = performance.now();
  S.pages = rulePages(); S.page = 0;
  $("#intro-art").style.setProperty("--c", g.lv.color);
  renderIntro();
  $("#intro-ov").classList.add("show");
}
function renderIntro() {
  const g = G(), last = S.page + 1 >= S.pages.length;
  $("#intro-count").textContent = t("rulesHead", { a: S.page + 1, b: S.pages.length });
  $("#intro-title").textContent = `${g.lv.emoji} ${tl(g.lv.name)} · ${t(g.D.key)}`;
  introSpeech.say(S.pages[S.page], true);
  $("#intro-dots").innerHTML = S.pages.map((_, i) => `<i class="${i === S.page ? "on" : ""}"></i>`).join("");
  $("#intro-btns").innerHTML = (last ? "" : `<button class="btn btn-ghost" data-act="skip">${esc(t("skip"))}</button>`) +
    `<button class="btn btn-dark" data-act="next">${esc(last ? t("letsGo") : t("next"))} ${icon("i-arrow")}</button>`;
}
function nextPage() {
  if (introSpeech.talking) { introSpeech.finish(); return; }
  audio.play("page");
  if (S.page + 1 < S.pages.length) { S.page++; renderIntro(); } else closeRules();
}
function closeRules() {
  const g = G();
  S.seenRules = true;
  $("#intro-ov").classList.remove("show");
  S.mode = "play";
  if (g.pausedAt !== null) { g.start += performance.now() - g.pausedAt; g.pausedAt = null; }
  if (g.phase === "preview") beginPreview();
}
function goHome() {
  audio.play("click");
  closeDone();
  $("#intro-ov").classList.remove("show");
  S.mode = "home";
  setScreen("home");
  homeSpeech.say(t("pickLevel"));
}
function closeDone() { $("#done-ov").classList.remove("show"); }
function toggleSound() { audio.on = !audio.on; store.save(); audio.play("click"); renderDock(); renderHomeSound(); }
function setLang(l, announce = true) {
  S.lang = l;
  document.documentElement.lang = l;
  store.save();
  textCache.clear();
  applyTexts();
  if (announce) {
    audio.play("lang");
    say(S.mode === "home" ? t("homeHello") : t("go"));
    (S.mode === "home" ? toloHome : toloPlay).react("happy", 1200);
  }
  if (S.mode === "intro") { S.pages = rulePages(); S.page = Math.min(S.page, S.pages.length - 1); renderIntro(); }
}
const cycleLang = () => setLang(LANGS[(LANGS.indexOf(S.lang) + 1) % LANGS.length]);

function elapsed() {
  const g = G();
  if (!g || !g.start) return 0;
  const end = g.end ?? g.pausedAt ?? performance.now();
  return Math.max(0, Math.floor((end - g.start) / 1000));
}
const timeText = () => { const s = elapsed(); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

// ================================================================ RENDERING (HTML parts)
function setScreen(name) {
  app.dataset.screen = name;
  document.body.classList.toggle("playing", name === "play");
  if (name === "home") { renderHome(); requestAnimationFrame(renderCarousel); }
}
function applyTexts() {
  $$("[data-t]").forEach((e) => { e.textContent = t(e.dataset.t); });
  document.title = `${t("title")} · Tolo | KiddyMaitri`;
  $$("#lang-switch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === S.lang)));
  $("#lang-switch").setAttribute("aria-label", t("language"));
  $(".car-arrow.left").setAttribute("aria-label", t("prev"));
  $(".car-arrow.right").setAttribute("aria-label", t("nextPuzzle"));
  $("#more-games").innerHTML = OTHER_GAMES.map((o) => `<a href="${esc(o.url)}" target="_blank" rel="noopener">${esc(o.emoji)} ${esc(t("moreGames"))}: ${esc(tl(o.name))}</a>`).join(" ");
  buildToys();
  renderHome();
  if (S.g) { renderPlayChrome(); renderLegend(); }
  if (S.mode === "done" && S.g) renderDone(stars());
}
function renderHomeSound() {
  const b = $("#home-sound");
  b.innerHTML = icon(audio.on ? "i-sound" : "i-mute", "#1C3326");
  b.setAttribute("aria-label", t("tipSound", { s: audio.on ? t("on") : t("off") }));
}
function renderHome() {
  $("#stars-total").textContent = t("starsOf", { a: totalStars(), b: LEVELS.length * 9 });
  renderHomeSound();
  buildCarousel();
  renderDiff();
}
function renderDiff() {
  const i = carIndex(), lv = LEVELS[i];
  $("#diff").innerHTML = DIFFICULTIES.map((d) => {
    const got = bestOf(lv)[d.key] || 0;
    const info = t("diffInfo", { r: Math.min(d.rings, lv.rings.length), s: Math.min(d.slices, lv.items.length) });
    return `<button role="radio" aria-checked="${d.key === S.diff}" data-diff="${d.key}" style="--c:${d.color}">
      <b>${d.emoji} ${esc(t(d.key))}${got ? ` <span aria-label="${got}">${"★".repeat(got)}</span>` : ""}</b><small>${esc(info)}</small></button>`;
  }).join("");
  const open = unlocked(i);
  const pb = $("#play-btn");
  pb.disabled = !open;
  pb.innerHTML = open ? `${esc(t("play"))} ${icon("i-arrow")}` : `${icon("i-lock")} ${esc(t("locked"))}`;
}

function bumpStat(sel, v) {
  const e = $(sel), b = $("b", e);
  b.textContent = v;
  e.classList.remove("bump"); void e.offsetWidth; e.classList.add("bump");
}
function renderPlayChrome() {
  const g = G();
  if (!g) return;
  $("#play-title").textContent = `${g.lv.emoji} ${tl(g.lv.name)}`;
  $("#play-sub").innerHTML = `<b>${esc(t(g.D.key))}</b>&nbsp;&nbsp;${esc(t("diffInfo", { r: g.K, s: g.N }))}`;
  $("#st-moves b").textContent = g.moves;
  $("#st-locks b").textContent = `${placed()}/${movable()}`;
  $("#ready-btn").innerHTML = `<i></i>${esc(t("ready"))}`;
  renderDock();
  renderLegend();
}
function renderLegend() {
  const g = G();
  if (!g) return;
  $("#legend").innerHTML = g.rings.map((r) => {
    const right = r.order.filter((_, p) => isRight(r, p)).length;
    const shown = lockEach() || r.done ? right : "?";
    return `<li data-j="${r.j}" class="${r.done && r.j > 0 ? "lock" : ""}${g.showCursor && g.cursor.j === r.j ? " sel" : ""}">
    <i style="--c:${r.shade}"></i><span>${esc(tl(r.def.name))}</span>
    ${r.j === 0 ? `<small>${esc(t("guide"))}</small>` : r.done ? icon("i-lock") : `<small>${shown}/${g.N}</small>`}</li>`;
  }).join("");
}
function renderDock() {
  const g = G();
  if (!g) return;
  const btn = (act, ic, tip, off, extra = "", inner = "") =>
    `<button class="dock-btn${off ? " off" : ""}${extra}" data-act="${act}" data-tip="${esc(tip)}" aria-label="${esc(tip)}">${ic}${inner}</button>`;
  $("#dock").innerHTML =
    btn("home", icon("i-home"), t("tipHome")) +
    `<button class="lvl-pill" data-act="home" style="--c:${g.D.color}" aria-label="${esc(t("chooseLevel"))}"><em>${g.lv.emoji}</em><span>${esc(tl(g.lv.name))}</span><b>${esc(t(g.D.key))}</b></button>` +
    `<span class="sep"></span>` +
    btn("hint", icon("i-bulb", g.hintsLeft ? "#FFC23A" : null), `${t("tipHint")} · ${g.hintsLeft}`, !g.hintsLeft, "", `<span class="badge">${g.hintsLeft}</span>`) +
    btn("sound", icon(audio.on ? "i-sound" : "i-mute"), t("tipSound", { s: audio.on ? t("on") : t("off") }), !audio.on) +
    btn("restart", icon("i-restart"), t("tipRestart")) +
    btn("help", icon("i-help"), t("tipHelp")) +
    btn("lang", LANG_GLYPH[S.lang], t("tipLang"), false, " lang");
}
function renderDone(n) {
  const g = G();
  $("#done-band").style.setProperty("--c", g.lv.color);
  $("#done-msg").textContent = t("doneMsg")[n];
  $("#done-stars").innerHTML = [0, 1, 2].map((i) => icon("i-star", i < n ? "#FFC23A" : "#E6EADF")).join("");
  $$("#done-stars svg").forEach((s, i) => { if (i < n) s.style.filter = "drop-shadow(0 4px 0 #E69A0E)"; });
  const statsList = [["moves", g.moves, "#FFE08A"], ["time", timeText(), "#D4CEFA"], ["hints", g.hintsUsed, "#C2EBDD"]];
  $("#done-grid").innerHTML = statsList.map(([k, v, c]) => `<div class="stat" style="--c:${c}"><span>${esc(t(k))}</span><b>${esc(v)}</b></div>`).join("");
  $("#match-list").innerHTML = Array.from({ length: g.N }, (_, s) => {
    const e = guide().order[s];
    const vals = g.rings.map((r) => {
      const v = g.ents[e].values[r.ri];
      return r.def.icon ? `<span class="ico">${iconHTML(v)}</span>` : `<span class="v">${esc(tl(v))}</span>`;
    }).join("");
    return `<div class="match-row" style="--i:${s}">${vals}</div>`;
  }).join("");
  const di = DIFFICULTIES.findIndex((d) => d.key === g.D.key);
  const harder = DIFFICULTIES[di + 1];
  const nextOk = g.levelIdx + 1 < LEVELS.length;
  $("#done-btns").innerHTML =
    `<button class="btn btn-ghost" data-act="restart">${esc(t("replay"))}</button>` +
    `<button class="btn btn-ghost" data-act="home">${esc(t("home"))}</button>` +
    (harder ? `<button class="btn btn-ghost" data-act="harder">${esc(t("tryHarder", { d: t(harder.key) }))}</button>` : "") +
    `<button class="btn btn-dark" data-act="${nextOk ? "nextlevel" : "home"}">${esc(nextOk ? t("nextLevel") : t("allDone"))} ${icon("i-arrow")}</button>`;
}
function buildRays() {
  $("#rays").innerHTML = Array.from({ length: 18 }, (_, i) => {
    const a = (i * 20) * Math.PI / 180, b = ((i * 20) + 10) * Math.PI / 180;
    return `<path d="M0 0 L${Math.cos(a) * 60} ${Math.sin(a) * 60} L${Math.cos(b) * 60} ${Math.sin(b) * 60}Z" fill="#fff"/>`;
  }).join("");
}

// ================================================================ HOME: endless carousel
const car = { pos: 0, target: 0, drag: null, last: 0 };
const L_ = () => LEVELS.length;
const carIndex = () => mod(Math.round(car.target), L_());
function buildCarousel() {
  const track = $("#car-track");
  track.innerHTML = LEVELS.map((lv, i) => {
    const b = bestOf(lv);
    const open = unlocked(i);
    return `<div class="pcard${open ? "" : " locked"}" data-i="${i}" style="--c:${lv.color};--c2:${lv.color}">
      <span class="lv">${esc(t("level", { n: i + 1 }))}</span>
      <span class="nm">${esc(tl(lv.name))}</span>
      <span class="tg">${esc(tl(lv.tagline))}</span>
      <span class="mini" aria-hidden="true"><i></i><i></i><i></i><b>${lv.emoji}</b></span>
      <span class="best">${DIFFICULTIES.map((d) => `<span title="${esc(t(d.key))}">${d.emoji}${icon("i-star", (b[d.key] || 0) > 0 ? "#E69A0E" : "#C9D3C3")}${b[d.key] || 0}</span>`).join("")}</span>
      <span class="lockbadge">${icon("i-lock")}</span>
    </div>`;
  }).join("");
  renderCarousel();
}
function renderCarousel() {
  const cards = $$("#car-track .pcard");
  if (!cards.length) return;
  const wide = $("#carousel").clientWidth;
  const cw = cards[0].offsetWidth || 260;
  const spacing = Math.min(cw * .78, wide / 4.2);
  const n = L_();
  cards.forEach((c, i) => {
    let rel = i - car.pos;
    rel = mod(rel + n / 2, n) - n / 2;               // wrap around: the strip never ends
    const a = Math.abs(rel);
    const sc = 1 - Math.min(a, 2.6) * .14;
    const op = a > 2.4 ? 0 : 1 - Math.max(0, a - 1.3) * .8;
    c.style.transform = `translate3d(${rel * spacing}px, ${a * a * 6}px, 0) scale(${sc}) rotate(${rel * 4}deg)`;
    c.style.opacity = op.toFixed(3);
    c.style.zIndex = String(100 - Math.round(a * 10));
    c.style.pointerEvents = op < .2 ? "none" : "";
    c.classList.toggle("center", a < .5);
  });
}
function carGo(delta) {
  car.target = Math.round(car.target) + delta;
  audio.play("slide", mod(Math.round(car.target), L_()));
  onCarChange();
}
let lastCarIdx = -1;
function onCarChange() {
  const i = carIndex();
  if (i === lastCarIdx) return;
  lastCarIdx = i;
  renderDiff();
  buzz(5);
  const lv = LEVELS[i];
  if (S.mode === "home") homeSpeech.say(unlocked(i) ? `${lv.emoji} ${tl(lv.name)}: ${tl(lv.tagline)}` : t("unlockFirst", { name: tl(LEVELS[i - 1].name) }));
}
const carEl = $("#carousel");
carEl.addEventListener("pointerdown", (e) => {
  if (e.target.closest(".car-arrow") || e.button > 0) return;
  audio.ensure();
  car.drag = { x0: e.clientX, last: e.clientX, p0: car.target, moved: false, id: e.pointerId, samples: [[performance.now(), e.clientX]] };
  carEl.setPointerCapture?.(e.pointerId);
});
carEl.addEventListener("pointermove", (e) => {
  const d = car.drag;
  if (!d || e.pointerId !== d.id) return;
  if (Math.abs(e.clientX - d.x0) > 6) { d.moved = true; carEl.classList.add("dragging"); }
  if (!d.moved) return;
  const cw = ($(".pcard")?.offsetWidth || 260) * .78;
  car.target = d.p0 - (e.clientX - d.x0) / cw;
  car.pos = car.target;
  d.samples.push([performance.now(), e.clientX]); if (d.samples.length > 10) d.samples.shift();
  const i = carIndex(); if (i !== lastCarIdx) { audio.play("slide", i); onCarChange(); }
});
function carUp(e) {
  const d = car.drag;
  if (!d || e.pointerId !== d.id) return;
  car.drag = null;
  carEl.classList.remove("dragging");
  if (!d.moved) {
    const card = document.elementFromPoint(e.clientX, e.clientY)?.closest(".pcard");
    if (!card) return;
    const i = +card.dataset.i;
    if (i === carIndex()) { startGame(i); return; }
    let rel = mod(i - Math.round(car.target) + L_() / 2, L_()) - L_() / 2;
    carGo(Math.round(rel));
    return;
  }
  const nowT = performance.now(), recent = d.samples.filter(([ts]) => nowT - ts < 100);
  let v = 0;                                                  // px per ms, only if the finger was still moving
  if (recent.length >= 2) { const [ta, xa] = recent[0], [tb, xb] = recent[recent.length - 1]; v = tb > ta ? (xb - xa) / (tb - ta) : 0; }
  const cw = ($(".pcard")?.offsetWidth || 260) * .78;
  car.target = Math.round(car.target - (v * 220) / cw);
  onCarChange();
}
carEl.addEventListener("pointerup", carUp);
carEl.addEventListener("pointercancel", carUp);
carEl.addEventListener("wheel", (e) => {
  const dv = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  if (Math.abs(dv) < 4) return;
  e.preventDefault();
  const now = performance.now();
  if (now - car.last < 220) return;
  car.last = now;
  carGo(dv > 0 ? 1 : -1);
}, { passive: false });

// ================================================================ INPUT: buttons & keys
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act],[data-lang],[data-diff]");
  if (!b) return;
  audio.ensure();
  if (b.dataset.lang) { setLang(b.dataset.lang); return; }
  if (b.dataset.diff) { S.diff = b.dataset.diff; store.save(); audio.play("select"); renderDiff(); homeSpeech.say(`${t(S.diff)}: ${t("diff" + S.diff[0].toUpperCase() + S.diff.slice(1))}`); return; }
  const g = G();
  ({
    play: () => startGame(carIndex(), S.diff),
    prev: () => carGo(-1), nextcard: () => carGo(1),
    home: goHome, sound: toggleSound, lang: cycleLang, help: () => { audio.play("click"); openRules(); },
    restart: newMix, hint: useHint,
    ready: () => { if (g && g.phase === "preview") startMix(); },
    next: nextPage, skip: () => { audio.play("page"); closeRules(); },
    nextlevel: () => { if (g) startGame(Math.min(g.levelIdx + 1, LEVELS.length - 1), g.D.key); },
    harder: () => { if (!g) return; const di = DIFFICULTIES.findIndex((d) => d.key === g.D.key); startGame(g.levelIdx, DIFFICULTIES[Math.min(di + 1, 2)].key); },
  })[b.dataset.act]?.();
});
$("#home-sound").addEventListener("click", toggleSound);
$("#intro").addEventListener("click", (e) => { if (!e.target.closest("button")) nextPage(); });
$("#legend").addEventListener("click", (e) => {
  const li = e.target.closest("li"); const g = G();
  if (!li || !g) return;
  g.cursor.j = Math.max(1, +li.dataset.j); g.showCursor = true; renderLegend(); audio.play("click");
});

document.addEventListener("keydown", (e) => {
  if (e.repeat && !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  audio.ensure();
  const k = e.key.toLowerCase(), g = G();
  if (k === "escape") { if (S.mode !== "home") goHome(); return; }
  if (k === "l") { cycleLang(); return; }
  if (S.mode === "home") {
    if (k === "arrowleft") carGo(-1);
    else if (k === "arrowright") carGo(1);
    else if (k === "enter" && !e.target.closest("button")) startGame(carIndex(), S.diff);
    else if (k === "u") { S.unlockAll = true; homeSpeech.say(t("teacher")); toloHome.react("cheer", 1800); renderHome(); petalShower(60); audio.play("lang"); }
    else if (/^[1-9]$/.test(k) && +k <= LEVELS.length) { car.target = +k - 1; onCarChange(); }
    return;
  }
  if (S.mode === "intro") { if (["enter", " ", "arrowright"].includes(k)) { e.preventDefault(); nextPage(); } return; }
  if (S.mode !== "play" || !g) return;
  if (g.phase === "preview" && (k === "enter" || k === " ")) { e.preventDefault(); startMix(); return; }
  if (k === "r") newMix();
  else if (k === "m") toggleSound();
  else if (k === "?" || k === "/") openRules();
  else if (g.phase !== "play") return;
  else if (k === "h") useHint();
  else if (k === "arrowup" || k === "arrowdown") {
    e.preventDefault(); g.showCursor = true;
    const nj = g.cursor.j + (k === "arrowup" ? 1 : -1);
    if (nj >= 1 && nj < g.K && (!g.picked || g.picked.j === nj)) { g.cursor.j = nj; audio.play("click"); }
    renderLegend();
  }
  else if (k === "arrowleft" || k === "arrowright") { e.preventDefault(); g.showCursor = true; g.cursor.p = mod(g.cursor.p + (k === "arrowright" ? 1 : -1), g.N); showSlice(g.cursor.p); audio.play("hover", g.cursor.p); }
  else if (k === "enter" || k === " ") { e.preventDefault(); g.showCursor = true; tapSlot(g.cursor.j, g.cursor.p); }
});

document.addEventListener("visibilitychange", () => {
  const g = G();
  if (!g || g.phase !== "play") return;
  if (document.hidden) { if (g.pausedAt === null) g.pausedAt = performance.now(); }
  else if (g.pausedAt !== null && S.mode === "play") { g.start += performance.now() - g.pausedAt; g.pausedAt = null; }
});
function setVH() { document.documentElement.style.setProperty("--app-h", ((window.visualViewport && visualViewport.height) || innerHeight) + "px"); }
setVH();
addEventListener("resize", () => { setVH(); FX.resize(); sizeFloat(); B.size = 0; layoutBoard(); renderCarousel(); });
window.visualViewport?.addEventListener("resize", () => { setVH(); B.size = 0; layoutBoard(); });
if (window.ResizeObserver) new ResizeObserver(() => { if (S.g) { B.size = 0; layoutBoard(); } }).observe(stage);

// ================================================================ MAIN LOOP
let lastFrame = performance.now();
function updateRings(now, dt) {
  const g = G();
  updateFlights(now);
  for (const r of g.rings) {            // the victory spin
    if (!r.tween) continue;
    const k = Math.min(1, (now - r.tween.t0) / r.tween.dur);
    if (k < 0) continue;
    r.angle = r.tween.from + (r.tween.to - r.tween.from) * r.tween.ease(k);
    if (k >= 1) { r.tween = null; r.angle = 0; }
  }
}
function frame(now) {
  const dt = Math.min(64, now - lastFrame); lastFrame = now;
  for (const s of [homeSpeech, playSpeech, introSpeech]) s.tick(dt);
  const look = pointer;
  stepToys(now, dt);
  if (S.mode === "home") {
    toloHome.update(now, toyDrag.t ? [toyDrag.t.x, toyDrag.t.y] : look, homeSpeech.talking);
    if (!car.drag) { const d = car.target - car.pos; if (Math.abs(d) > .0005) { car.pos += d * (1 - Math.exp(-dt / 90)); renderCarousel(); } }
  } else if (S.g) {
    toloPlay.update(now, toyDrag.t ? [toyDrag.t.x, toyDrag.t.y] : look, playSpeech.talking);
    if (S.mode === "intro") toloIntro.update(now, look, introSpeech.talking);
    if (S.mode === "done") toloDone.update(now, null, false);
    if (!B.size) layoutBoard();
    updateRings(now, dt);
    drawBoard(now);
    drawFloat(now);
    const g = G();
    if (g.phase === "preview" && S.mode === "play") {
      const p = Math.min(1, (now - g.previewT0) / g.previewDur);
      const ri = $("#ready-btn i"); if (ri) ri.style.setProperty("--p", (p * 100).toFixed(1) + "%");
      if (p >= 1) startMix();
    }
    const tt = timeText(); const tb = $("#st-time b"); if (tb.textContent !== tt) tb.textContent = tt;
  }
  else drawFloat(now);
  requestAnimationFrame(frame);
}
addEventListener("pointermove", (e) => { pointer = [e.clientX, e.clientY]; }, { passive: true });

// ================================================================ BOOT
buildRays();
FX.resize();
sizeFloat();
document.documentElement.lang = S.lang;
applyTexts();
setScreen("home");
homeSpeech.say(S.unlockAll ? t("teacher") : t("homeHello"));
requestAnimationFrame(frame);
if (document.fonts) {
  Promise.all(['800 20px "Baloo 2"', '800 20px "Baloo Bhaina 2"'].map((f) => document.fonts.load(f, "Aaअଅ").catch(() => null)))
    .then(() => { textCache.clear(); renderCarousel(); });
}
if (/[?&]debug\b/.test(location.search)) window.__rings = { S, G, startGame, startMix, swapCards, isRight, placed, parOf, useHint, slotScreen, car, carGo, B, hitBoard, LEVELS };
})();
