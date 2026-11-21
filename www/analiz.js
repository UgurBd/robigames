// Robi Test Analizi + Reklam test alanı. Veriler SADECE bu cihazda kalır (localStorage), internete hiçbir şey gönderilmez.
// Play Store sürümünde: robi_cfg.an=false / ads=false ya da bu dosyayı sayfalardan çıkarmak yeterli.
(function () {
const KEY = 'robi_an', CFG = 'robi_cfg';
const DEF = { ads: true, an: true, refresh: 60, gap: 180, ecpm: 0.5, profile: 'Çocuk 1' };
const J = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || '') || d; } catch (e) { return d; } };
const cfg = () => Object.assign({}, DEF, J(CFG, {}));
const setCfg = o => { try { localStorage.setItem(CFG, JSON.stringify(Object.assign(cfg(), o))); } catch (e) {} };
const blank = () => ({ created: Date.now(), sessions: [], time: {}, ev: {}, btn: {}, quits: {}, heat: {}, ads: { bSec: 0, bImp: 0, bTap: 0, iShow: 0, iSec: 0, iTap: 0, iSkip: 0 } });
let DB = J(KEY, { profiles: {} }); DB.profiles = DB.profiles || {};
const P = () => { const c = cfg(); return DB.profiles[c.profile] || (DB.profiles[c.profile] = blank()); };
let dirty = false; const mark = () => dirty = true;
function flush() { if (!dirty) return; dirty = false; try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { for (const p of Object.values(DB.profiles)) p.heat = {}; try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e2) {} } }
// aynı anda iki sayfa (menü + iframe) yazmasın diye: okumadan önce tazele
function reload() { if (dirty) return; DB = J(KEY, { profiles: {} }); DB.profiles = DB.profiles || {}; }
const on = () => cfg().an;
// ---------- oturum ----------
let screen = null, scrDone = false, sess = null;
function session() {
  if (!on()) return null; reload(); const p = P(), now = Date.now(), last = p.sessions[p.sessions.length - 1];
  if (last && now - last.end < 5 * 60e3) { sess = last; } else { sess = { start: now, end: now, dur: 0, screens: [] }; p.sessions.push(sess); while (p.sessions.length > 60) p.sessions.shift(); }
  mark(); return sess;
}
function setScreen(name) {
  if (!on()) return; if (name === null) { screen = null; dirty = true; flush(); return; } if (!sess) session();
  if (screen && screen !== name && !scrDone) { const p = P(); p.quits[screen] = (p.quits[screen] || 0) + 1; }
  screen = name; scrDone = false; if (sess && sess.screens[sess.screens.length - 1] !== name) { sess.screens.push(name); if (sess.screens.length > 40) sess.screens.shift(); } mark();
}
let lastT = performance.now();
setInterval(() => {
  const now = performance.now(), dt = Math.min(5, (now - lastT) / 1000); lastT = now;
  if (document.hidden || !on() || !screen) { flush(); return; }
  const p = P(); p.time[screen] = (p.time[screen] || 0) + dt; if (sess) { sess.end = Date.now(); sess.dur += dt; }
  if (ban && ban.vis) { p.ads.bSec += dt; ban.t += dt; if (ban.t >= cfg().refresh) { ban.t = 0; nextCreative(); } }
  mark(); if (Math.random() < .25) flush();
}, 1000);
window.addEventListener('pagehide', flush); document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
// ---------- dokunma ısı haritası (16×9) ----------
document.addEventListener('pointerdown', e => {
  if (!on() || !screen) return; const p = P(), h = p.heat[screen] || (p.heat[screen] = Array(144).fill(0));
  const gx = Math.min(15, Math.floor(e.clientX / innerWidth * 16)), gy = Math.min(8, Math.floor(e.clientY / innerHeight * 9)); h[gy * 16 + gx]++; mark();
}, true);
// ---------- reklam test: üst şerit ----------
const CREAT = [['🧃', 'Meyve Suyu', '#ffd166'], ['🧸', 'Oyuncak Dükkanı', '#ff9ad5'], ['📚', 'Masal Kitapları', '#9ad7ff'], ['🚲', 'Bisiklet Kampanyası', '#a7f3c0'], ['🎨', 'Boya Seti', '#ffc49a'], ['🍪', 'Kurabiye', '#e8d0ff']];
let ban = null;
function banner() {
  if (ban) return ban; const el = document.createElement('div'); el.id = 'robiAd';
  el.style.cssText = 'position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:30;height:34px;width:min(460px,60vw);border:3px solid #2b2340;border-top:0;border-radius:0 0 14px 14px;display:none;align-items:center;gap:8px;padding:0 10px;font:800 13px system-ui,sans-serif;color:#2b2340;box-shadow:0 3px 0 #2b2340;overflow:hidden';
  document.body.appendChild(el); ban = { el, vis: false, t: 0, i: Math.floor(Math.random() * CREAT.length) };
  el.addEventListener('pointerdown', e => { e.stopPropagation(); if (on()) { P().ads.bTap++; P().ev['reklama_dokunma:' + (screen || '?')] = (P().ev['reklama_dokunma:' + (screen || '?')] || 0) + 1; mark(); } el.animate([{ filter: 'brightness(1.4)' }, { filter: 'none' }], { duration: 300 }); });
  paint(); return ban;
}
function paint() { const [e, t, c] = CREAT[ban.i]; ban.el.style.background = c; ban.el.innerHTML = `<span style="font-size:20px">${e}</span><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t}</span><small style="font-size:9px;opacity:.7;border:1.5px solid #2b2340;border-radius:5px;padding:0 4px">REKLAM · TEST</small>`; }
function nextCreative() { ban.i = (ban.i + 1) % CREAT.length; paint(); if (on()) { P().ads.bImp++; mark(); } }
function bannerShow(v) {
  v = !!v && cfg().ads; if (!ban && !v) return; banner(); if (ban.vis === v) return;
  ban.vis = v; ban.el.style.display = v ? 'flex' : 'none'; if (v && on()) { P().ads.bImp++; ban.t = 0; mark(); }
}
// ---------- reklam test: level arası tam ekran (en geç 5 sn'de kapatılabilir, 3 dk'da en fazla 1) ----------
let lastInter = +(sessionStorage.getItem('robi_li') || 0);
function interstitial(done, where) {
  const c = cfg(); done = done || (() => {});
  if (!c.ads || Date.now() - lastInter < c.gap * 1000 || (sess && sess.dur < 60)) { done(); return; }
  lastInter = Date.now(); try { sessionStorage.setItem('robi_li', lastInter); } catch (e) {}
  const [e, t, col] = CREAT[Math.floor(Math.random() * CREAT.length)], t0 = performance.now();
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:99;background:rgba(43,35,64,.92);display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif';
  ov.innerHTML = `<div style="position:relative;width:min(560px,86vw);height:min(330px,74vh);background:${col};border:4px solid #fff;border-radius:26px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#2b2340;font-weight:800"><div style="font-size:90px">${e}</div><div style="font-size:28px">${t}</div><small style="margin-top:8px;opacity:.7">REKLAM · TEST ÖRNEĞİ</small><button id="riX" style="position:absolute;top:10px;right:10px;width:58px;height:58px;border-radius:50%;border:3px solid #2b2340;background:#fff;font:800 20px system-ui;color:#2b2340">5</button></div>`;
  document.body.appendChild(ov);
  const x = ov.querySelector('#riX'); let left = 5;
  const iv = setInterval(() => { left--; x.textContent = left > 0 ? left : '✕'; if (left <= 0) clearInterval(iv); }, 1000);
  ov.addEventListener('pointerdown', ev => { if (ev.target !== x && on()) { P().ads.iTap++; mark(); } });
  x.onclick = () => { if (left > 0) { if (on()) { P().ads.iSkip++; mark(); } return; } ov.remove(); if (on()) { const a = P().ads; a.iShow++; a.iSec += (performance.now() - t0) / 1000; P().ev['ara_reklam:' + (where || '?')] = (P().ev['ara_reklam:' + (where || '?')] || 0) + 1; mark(); flush(); } done(); };
}
// ---------- rapor ----------
const fmt = s => s >= 3600 ? `${Math.floor(s / 3600)} sa ${Math.round(s % 3600 / 60)} dk` : s >= 60 ? `${Math.floor(s / 60)} dk ${Math.round(s % 60)} sn` : `${Math.round(s)} sn`;
function report(name) {
  reload(); const p = DB.profiles[name]; if (!p) return null; const a = p.ads;
  const tot = Object.values(p.time).reduce((x, y) => x + y, 0), ss = p.sessions;
  const top = (o, n = 8) => Object.entries(o).sort((x, y) => y[1] - x[1]).slice(0, n);
  return { name, tot, totS: fmt(tot), nSess: ss.length, avg: ss.length ? fmt(tot / ss.length) : '-', longest: ss.length ? fmt(Math.max(...ss.map(s => s.dur))) : '-',
    time: top(p.time, 20).map(([k, v]) => [k, fmt(v), v / Math.max(1, tot)]), quits: top(p.quits), ev: top(p.ev, 30), btn: top(p.btn, 15), heat: p.heat, ads: a,
    adPct: tot ? Math.round(a.bSec / tot * 100) : 0, tapRate: a.bImp ? (a.bTap / a.bImp * 100).toFixed(1) : '0', iAvg: a.iShow ? (a.iSec / a.iShow).toFixed(1) : '-',
    imps: a.bImp + a.iShow, rev: ((a.bImp * cfg().ecpm + a.iShow * cfg().ecpm * 4) / 1000).toFixed(3), last: ss.length ? ss[ss.length - 1].screens.slice(-1)[0] : '-' };
}
function text(name) {
  const r = report(name); if (!r) return ''; const a = r.ads;
  return [`ROBİ TEST RAPORU — ${r.name} (${new Date().toLocaleDateString('tr-TR')})`, `Toplam oyun: ${r.totS} · ${r.nSess} oturum · ortalama ${r.avg} · en uzun ${r.longest}`, '', 'NEREDE NE KADAR:', ...r.time.map(([k, v, f]) => `  ${k}: ${v} (%${Math.round(f * 100)})`), '', 'YARIDA BIRAKILAN:', ...r.quits.map(([k, v]) => `  ${k}: ${v} kez`),
    '', 'REKLAM (TEST):', `  Üst şerit ekranda: ${fmt(a.bSec)} (oyunun %${r.adPct}'i) · ${a.bImp} gösterim`, `  Şeride dokunma: ${a.bTap} (gösterim başına %${r.tapRate})`, `  Ara reklam: ${a.iShow} kez · ort. ${r.iAvg} sn'de kapatıldı · erken kapatma denemesi ${a.iSkip} · reklama dokunma ${a.iTap}`, `  Toplam gösterim ${r.imps} · varsayımsal gelir ≈ $${r.rev} (eCPM $${cfg().ecpm} varsayımı)`,
    '', 'OTURUMLAR (başlangıç · süre · gezdiği yerler):', ...(DB.profiles[name].sessions || []).slice(-15).map(x => `  ${new Date(x.start).toLocaleString('tr-TR')} · ${fmt(x.dur)} · ${x.screens.join(' → ')}`),
    '', 'DOKUNMA YOĞUNLUĞU (ekranın en çok basılan yerleri):', ...Object.entries(r.heat).map(([k, h]) => { const t = h.reduce((x, y) => x + y, 0), zones = { 'sol-alt': 0, 'sağ-alt': 0, 'orta': 0, 'üst': 0 }; h.forEach((v, i) => { const x = i % 16, y = Math.floor(i / 16); zones[y < 2 ? 'üst' : y >= 6 ? (x < 8 ? 'sol-alt' : 'sağ-alt') : 'orta'] += v; }); return `  ${k}: ${t} dokunma · ` + Object.entries(zones).map(([z, v]) => `${z} %${t ? Math.round(v / t * 100) : 0}`).join(', ') + ` · reklam şeridi bölgesi: ${h.slice(4, 12).reduce((x, y) => x + y, 0)}`; }),
    '', 'OLAYLAR:', ...r.ev.map(([k, v]) => `  ${k}: ${v}`), '', 'BUTONLAR:', ...r.btn.map(([k, v]) => `  ${k}: ${v}`)].join('\n');
}
window.RobiAnaliz = {
  cfg, setCfg, screen: setScreen, session,
  done() { scrDone = true; },
  resync() { dirty = false; DB = J(KEY, { profiles: {} }); DB.profiles = DB.profiles || {}; const l = P().sessions; sess = l[l.length - 1] || null; },
  ev(name, n = 1) { if (!on()) return; const p = P(); p.ev[name] = (p.ev[name] || 0) + n; mark(); },
  btn(id) { if (!on()) return; const p = P(); p.btn[id] = (p.btn[id] || 0) + 1; mark(); },
  bannerShow, interstitial, report, text, fmt, flush() { dirty = true; flush(); },
  profiles() { reload(); return Object.keys(DB.profiles); },
  exportJSON() { flush(); return JSON.stringify(DB, null, 1); },
  reset(name) { reload(); if (name) delete DB.profiles[name]; else DB.profiles = {}; dirty = true; flush(); },
};
})();
