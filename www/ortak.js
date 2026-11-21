// ===================== Robi — ortak kayıt, çıkartmalar, günlük görevler, ebeveyn süresi =====================
(function () {
'use strict';
const KEY = 'robi_orman_v1';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
const store = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dayDiff = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);

const STICKERS = [
  { id: 'rabbit', e: '🐰', name: 'Tavşan', hint: 'Bir tavşan yakala' },
  { id: 'fox', e: '🦊', name: 'Tilki', hint: 'Bir tilki yakala' },
  { id: 'deer', e: '🦌', name: 'Geyik', hint: 'Bir geyik yakala' },
  { id: 'giant', e: '🐘', name: 'Dev Av', hint: 'Bir hayvanı 5 kat büyütüp yakala' },
  { id: 'suit_red', e: '🔥', name: 'Ateş Kostümü', hint: 'Ateş kostümünü kazan' },
  { id: 'suit_blue', e: '💧', name: 'Su Kostümü', hint: 'Su kostümünü kazan' },
  { id: 'suit_orange', e: '🪽', name: 'Uçuş Kostümü', hint: 'Uçuş kostümünü kazan' },
  { id: 'suit_green', e: '🕸️', name: 'Avcı Kostümü', hint: 'Avcı kostümünü kazan' },
  { id: 'firstflight', e: '☁️', name: 'İlk Uçuş', hint: '15 metre yükseğe uç' },
  { id: 'firefighter', e: '🚒', name: 'İtfaiyeci', hint: 'Ormandaki bütün yangınları söndür' },
  { id: 'combo3', e: '⚡', name: 'Süper Avcı', hint: 'Art arda 3 av yap' },
  { id: 'combo5', e: '🌟', name: 'Efsane Avcı', hint: 'Art arda 5 av yap' },
  { id: 'trained', e: '🎓', name: 'Mezun', hint: 'Eğitim Bahçesini bitir' },
  { id: 'forest', e: '🌲', name: 'Orman Kahramanı', hint: 'Büyülü Ormanı kurtar' },
  { id: 'room', e: '🧸', name: 'Oda Kahramanı', hint: 'Dev Odadaki arkadaşları kurtar' },
  { id: 'level5', e: '⭐', name: 'Seviye 5', hint: '5. seviyeye ulaş' },
  { id: 'gears500', e: '⚙️', name: 'Dişli Kralı', hint: 'Toplam 500 dişliye ulaş' },
  { id: 'photo', e: '📸', name: 'Fotoğrafçı', hint: 'Fotoğraf modunda bir fotoğraf çek' },
  { id: 'daily7', e: '🎁', name: '7 Gün Seri', hint: '7 gün üst üste sandık aç' },
  { id: 'petter', e: '💗', name: 'Hayvan Dostu', hint: 'Koruma bahçesinde 10 hayvan sev' },
];
const QUEST_POOL = [
  { type: 'fire', n: [2, 3], text: n => `${n} yangın söndür`, e: '🔥' },
  { type: 'catch', n: [2, 3], text: n => `${n} hayvan yakala`, e: '🕸️' },
  { type: 'gear', n: [30, 50], text: n => `${n} dişli topla`, e: '⚙️' },
  { type: 'monster', n: [3, 5], text: n => `${n} canavar yen`, e: '👾' },
  { type: 'joy', n: [3, 5], text: n => `${n} neşe topu isabet ettir`, e: '🎈' },
  { type: 'fly', n: [1, 1], text: () => '15 metre yükseğe uç', e: '🪽' },
  { type: 'suit', n: [3, 4], text: n => `${n} kez kostüm değiştir`, e: '👕' },
  { type: 'pet', n: [3, 5], text: n => `Bahçede ${n} hayvan sev`, e: '💗' },
];
function ensureDaily(s) {
  const t = today();
  s.daily = s.daily || { date: '', quests: [], streak: 0, lastChest: '' };
  if (s.daily.date !== t) {
    const pool = QUEST_POOL.slice().sort(() => Math.random() - .5).slice(0, 3);
    s.daily.date = t;
    s.daily.quests = pool.map(q => { const n = q.n[0] + Math.floor(Math.random() * (q.n[1] - q.n[0] + 1)); return { type: q.type, e: q.e, text: q.text(n), target: n, prog: 0, done: false }; });
  }
  return s;
}
const Robi = window.RobiOrtak = {
  STICKERS, today, load, store,
  // çıkartma: yeni ise true döner
  award(id) { const s = load(); s.stickers = s.stickers || {}; if (s.stickers[id]) return null; s.stickers[id] = today(); store(s); return STICKERS.find(x => x.id === id) || null; },
  // günlük görev ilerlemesi: tamamlanan görevler listesi döner
  quest(type, n = 1) {
    const s = ensureDaily(load()); const done = [];
    for (const q of s.daily.quests) if (q.type === type && !q.done) { q.prog = Math.min(q.target, q.prog + n); if (q.prog >= q.target) { q.done = true; s.gears = (s.gears || 0) + 30; done.push(q); } }
    store(s); return done;
  },
  daily() { const s = ensureDaily(load()); store(s); return s.daily; },
  chestStatus() { const s = ensureDaily(load()); const d = s.daily; const can = d.lastChest !== today(); let streak = d.streak || 0; if (can && d.lastChest && dayDiff(d.lastChest, today()) > 1) streak = 0; return { can, streak, nextDay: can ? (streak % 7) + 1 : (streak % 7) || 7 }; },
  openChest() {
    const s = ensureDaily(load()); const d = s.daily;
    if (d.lastChest === today()) return null;
    if (d.lastChest && dayDiff(d.lastChest, today()) > 1) d.streak = 0;
    d.streak = (d.streak || 0) + 1; d.lastChest = today();
    const day = ((d.streak - 1) % 7) + 1;
    const gears = day === 7 ? 150 : 15 + day * 10;
    s.gears = (s.gears || 0) + gears;
    let extra = null;
    if (day === 7) { s.capes = s.capes || {}; if (!s.capes.rainbow) { s.capes.rainbow = true; extra = '🌈 Gökkuşağı pelerin'; } }
    store(s);
    if (d.streak >= 7) Robi.award('daily7');
    return { day, gears, extra, streak: d.streak };
  },
  // ebeveyn süresi
  parent() { const s = load(); s.parent = s.parent || { limit: 0, used: 0, date: today(), bonus: 0 }; if (s.parent.date !== today()) { s.parent.date = today(); s.parent.used = 0; s.parent.bonus = 0; store(s); } return s.parent; },
  setParent(p) { const s = load(); s.parent = Object.assign(Robi.parent(), p); store(s); },
  tick(sec) { const s = load(); const p = Robi.parent(); p.used += sec; s.parent = p; store(s); return Robi.timeLeft(); },
  timeLeft() { const p = Robi.parent(); if (!p.limit) return Infinity; return (p.limit + (p.bonus || 0)) * 60 - p.used; },
  // fotoğraflar
  photos() { try { return JSON.parse(localStorage.getItem('robi_photos') || '[]'); } catch (e) { return []; } },
  addPhoto(url) { const a = Robi.photos(); a.unshift({ url, date: today() }); while (a.length > 12) a.pop(); try { localStorage.setItem('robi_photos', JSON.stringify(a)); return true; } catch (e) { a.pop(); try { localStorage.setItem('robi_photos', JSON.stringify(a)); } catch (e2) {} return false; } },
  delPhoto(i) { const a = Robi.photos(); a.splice(i, 1); try { localStorage.setItem('robi_photos', JSON.stringify(a)); } catch (e) {} },
};
})();
