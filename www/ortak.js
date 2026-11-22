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
  { id: 'dragon', e: '🐉', name: 'Ejder Dostu', hint: 'Ateş Ejderini yen' },
  { id: 'deniz', e: '🏖️', name: 'Sahil Kahramanı', hint: 'Deniz Kenarını bitir' },
  { id: 'okul', e: '🏰', name: 'Büyücü Çırağı', hint: 'Sihirli Okulu bitir' },
  { id: 'ucurum', e: '⛰️', name: 'Dağcı', hint: 'Uçurumun zirvesine çık' },
  { id: 'uzay', e: '🚀', name: 'Astronot', hint: 'Uzay görevini bitir' },
  { id: 'turtle', e: '🐢', name: 'Kaplumbağa', hint: 'Bir kaplumbağa kurtar' },
  { id: 'jelly', e: '🍬', name: 'Tertemiz Oda', hint: 'Jelibon Odasını topla' },
  { id: 'painter', e: '🎨', name: 'Ressam', hint: 'Boyama Atölyesinde 10 bölüm bitir' },
  { id: 'builder', e: '🧱', name: 'Mimar', hint: 'Kendi parkurunu bitir' },
  { id: 'voice', e: '🎤', name: 'Seslendirmen', hint: 'Robi için sesini kaydet' },
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
  parent() { const s = load(); s.parent = s.parent || { limit: 0, used: 0, date: today(), bonus: 0 }; if (s.parent.date !== today()) { s.parent.date = today(); s.parent.used = 0; s.parent.bonus = 0; s.parent.jellyToday = 0; store(s); } return s.parent; },
  setParent(p) { const s = load(); s.parent = Object.assign(Robi.parent(), p); store(s); },
  tick(sec) { const s = load(); const p = Robi.parent(); p.used += sec; s.parent = p; store(s); return Robi.timeLeft(); },
  timeLeft() { const p = Robi.parent(); if (!p.limit) return Infinity; return (p.limit + (p.bonus || 0)) * 60 - p.used; },
  // Robi'nin sesi (çocuğun kaydı)
  VOICE_SLOTS: [{ id: 'jump', name: 'Zıplarken', ex: '“Hop!”' }, { id: 'catch', name: 'Yakalayınca', ex: '“Yakaladım!”' }, { id: 'power', name: 'Süper güç anında', ex: '“Süper Robi!”' }],
  voices() { try { return JSON.parse(localStorage.getItem('robi_voice') || '{}'); } catch (e) { return {}; } },
  setVoice(slot, url) { const v = Robi.voices(); if (url) v[slot] = url; else delete v[slot]; try { localStorage.setItem('robi_voice', JSON.stringify(v)); return true; } catch (e) { return false; } },
  _buf: {},
  async playVoice(ctx, slot, dest, opts = {}) {
    const v = Robi.voices(); const url = opts.url || v[slot]; if (!url || !ctx) return false;
    try {
      let buf = Robi._buf[url];
      if (!buf) { const ab = await (await fetch(url)).arrayBuffer(); buf = await ctx.decodeAudioData(ab); Robi._buf[url] = buf; }
      const robot = v.robot !== false && opts.robot !== false;
      const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = robot ? 1.18 : 1;
      const out = ctx.createGain(); out.gain.value = 1.4; out.connect(dest || ctx.destination);
      if (robot) {
        const ring = ctx.createGain(); ring.gain.value = 0;
        const mod = ctx.createOscillator(); mod.frequency.value = 55; mod.connect(ring.gain); mod.start(); mod.stop(ctx.currentTime + buf.duration + .3);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = .6;
        const dry = ctx.createGain(); dry.gain.value = .45;
        const delay = ctx.createDelay(); delay.delayTime.value = .06; const fb = ctx.createGain(); fb.gain.value = .3;
        src.connect(ring); ring.connect(bp); src.connect(dry); dry.connect(bp); bp.connect(out); bp.connect(delay); delay.connect(fb); fb.connect(out);
      } else src.connect(out);
      src.start(); return true;
    } catch (e) { return false; }
  },
  // jelibon hakkı: sayaç
  // Oyuncu kimliği (arkadaşlık için) — ad ebeveyn tarafından yazılır ya da hazırlardan seçilir
  profile() { const s = load(); if (!s.profile || !s.profile.pid) { s.profile = Object.assign({ name: '', av: '🦊' }, s.profile || {}, { pid: String(10000000 + Math.floor(Math.random() * 89999999)) }); store(s); } return s.profile; },
  setProfile(p) { const s = load(); s.profile = Object.assign(Robi.profile(), p); store(s); return s.profile; },
  friends() { return load().friends || []; },
  addFriend(f) { const s = load(); s.friends = (s.friends || []).filter(x => x.pid !== f.pid); s.friends.push({ pid: f.pid, name: String(f.name || '').slice(0, 16), av: f.av || '🙂' }); store(s); },
  delFriend(pid) { const s = load(); s.friends = (s.friends || []).filter(x => x.pid !== pid); store(s); },
  jelly() { const s = load(); const p = Robi.parent(); p.jellyToday = (p.jellyToday || 0) + 1; p.jellyTotal = (p.jellyTotal || 0) + 1; s.parent = p; store(s); return `Bugün ${p.jellyToday}. jelibon hakkın 🍬 · Toplam ${p.jellyTotal}`; },
  // fotoğraflar
  photos() { try { return JSON.parse(localStorage.getItem('robi_photos') || '[]'); } catch (e) { return []; } },
  addPhoto(url) { const a = Robi.photos(); a.unshift({ url, date: today() }); while (a.length > 12) a.pop(); try { localStorage.setItem('robi_photos', JSON.stringify(a)); return true; } catch (e) { a.pop(); try { localStorage.setItem('robi_photos', JSON.stringify(a)); } catch (e2) {} return false; } },
  // Türkçe sesli rehber (Capacitor TTS, yoksa tarayıcı sesi)
  // Rehber sesi: 'kiz' (ince, neşeli) | 'erkek' (daha kalın, hızlı) — TTS perde/hız ayarı ile çocuk sesine yaklaştırılır
  guideVoice() { return load().guideVoice || 'kiz'; },
  setGuideVoice(v) { const s = load(); s.guideVoice = v; store(s); },
  async say(text, lang = 'tr-TR', o) {
    if (Robi.load().voiceGuide === false) return;
    const t = String(text).replace(/[\p{Extended_Pictographic}️‍⤒⬆️⬇️✕]/gu, '').replace(/\s+/g, ' ').trim(); if (!t) return;
    const gv = (o && o.voice) || Robi.guideVoice(), boy = gv === 'erkek';
    const pitch = (o && o.pitch) || (boy ? 1.0 : 1.5), rate = (o && o.rate) || (boy ? 1.05 : 1.0);
    try { const cap = window.Capacitor || (window.parent && window.parent.Capacitor); const tts = cap && cap.Plugins && cap.Plugins.TextToSpeech; if (tts) {
      try { await tts.stop(); } catch (e) {}
      const opt = { text: t, lang, rate, pitch, volume: 1, category: 'ambient' };
      try { if (Robi._vi === undefined) { Robi._vi = -1; const r = await tts.getSupportedVoices(); const vs = (r && r.voices) || []; const tr = vs.map((v, i) => ({ v, i })).filter(x => (x.v.lang || '').toLowerCase().startsWith('tr')); const m = tr.find(x => /male|erkek|-tmf-|-mfm-|#male/i.test((x.v.name || '') + (x.v.voiceURI || '')) && !/female/i.test((x.v.name || '') + (x.v.voiceURI || ''))); Robi._vi = m ? m.i : -1; } if (boy && Robi._vi >= 0) opt.voice = Robi._vi; } catch (e) {}
      await tts.speak(opt); return; } } catch (e) {}
    try { const ss = window.speechSynthesis; if (!ss) return; ss.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = lang; u.rate = rate; u.pitch = pitch; const vs = ss.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith(lang.slice(0, 2))); const v = (boy && vs.find(v => /male|erkek|tolga|cem|ahmet/i.test(v.name) && !/female/i.test(v.name))) || vs.find(v => !/male/i.test(v.name) || /female/i.test(v.name)) || vs[0]; if (v) u.voice = v; ss.speak(u); } catch (e) {}
  },
  delPhoto(i) { const a = Robi.photos(); a.splice(i, 1); try { localStorage.setItem('robi_photos', JSON.stringify(a)); } catch (e) {} },
};
})();
// ===== Anne-Baba sesi: kayıtlı sesler varsa oyun cümlelerini ebeveyn sesiyle söyler =====
(function () {
  const R = window.RobiOrtak; if (!R || !window.indexedDB) return;
  const DBN = 'robi_ses', ST = 'clips';
  let dbp = null;
  const db = () => dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open(DBN, 1); r.onupgradeneeded = () => r.result.createObjectStore(ST); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const tx = (mode, fn) => db().then(d => new Promise((res, rej) => { const t = d.transaction(ST, mode), q = fn(t.objectStore(ST)); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }));
  const norm = t => String(t).toLocaleLowerCase('tr').replace(/[^a-zçğıöşüâîû ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const PV = { raw: {}, bufs: {}, keys: new Set(), ctx: null, cur: [], ready: false, norm };
  PV.ac = () => PV.ctx || (PV.ctx = new (window.AudioContext || window.webkitAudioContext)());
  PV.load = async () => { try { const ks = await tx('readonly', s => s.getAllKeys()), all = await tx('readonly', s => s.getAll()); PV.raw = {}; ks.forEach((k, i) => PV.raw[k] = all[i]); PV.keys = new Set(ks); PV.bufs = {}; } catch (e) {} PV.ready = true; return PV.keys.size; };
  PV.buf = async k => { if (PV.bufs[k]) return PV.bufs[k]; const b = PV.raw[k]; if (!b) return null; PV.bufs[k] = await PV.ac().decodeAudioData(await b.arrayBuffer()); return PV.bufs[k]; };
  // cümleyi kayıtlı parçalarla kapla (en az parçayla); kapanmıyorsa null → telefon sesi
  PV.segment = t => { const w = norm(t).split(' ').filter(Boolean), n = w.length; if (!n) return null; const best = new Array(n + 1).fill(null); best[0] = []; for (let i = 0; i < n; i++) { if (!best[i]) continue; for (let j = n; j > i; j--) { const k = w.slice(i, j).join(' '); if (PV.keys.has(k) && (!best[j] || best[j].length > best[i].length + 1)) best[j] = best[i].concat([k]); } } return best[n]; };
  PV.stop = () => { PV.cur.forEach(s => { try { s.stop(); } catch (e) {} }); PV.cur = []; };
  PV.play = async keys => {
    const ac = PV.ac(); if (ac.state === 'suspended') { try { await ac.resume(); } catch (e) {} }
    const bufs = []; for (const k of keys) { const b = await PV.buf(k); if (!b) return false; bufs.push(b); }
    PV.stop();
    try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {}
    try { const cap = window.Capacitor || (window.parent && window.parent.Capacitor); cap && cap.Plugins && cap.Plugins.TextToSpeech && cap.Plugins.TextToSpeech.stop(); } catch (e) {}
    let t = ac.currentTime + 0.03;
    bufs.forEach(b => { const s = ac.createBufferSource(); s.buffer = b; const g = ac.createGain(); g.gain.value = 1.3; s.connect(g); g.connect(ac.destination); s.start(t); t += b.duration + 0.06; PV.cur.push(s); });
    return true;
  };
  PV.on = () => R.load().parentVoice !== false;
  PV.tryPlay = async text => { if (!PV.on()) return false; if (!PV.ready) await PV.load(); if (!PV.keys.size) return false; const seq = PV.segment(text); return seq ? PV.play(seq) : false; };
  PV.save = async (key, blob) => { await tx('readwrite', s => s.put(blob, key)); PV.raw[key] = blob; PV.keys.add(key); delete PV.bufs[key]; };
  PV.del = async key => { await tx('readwrite', s => s.delete(key)); delete PV.raw[key]; PV.keys.delete(key); delete PV.bufs[key]; };
  PV.LOVE = ['seni çok seviyorum', 'seninle gurur duyuyorum', 'aferin benim akıllı çocuğum', 'sen harika bir bakıcısın', 'seni çok özledim'];
  R.pv = PV;
  const tts = R.say;
  R.say = async function (text, lang = 'tr-TR', o) { if (R.load().voiceGuide === false) return; try { if (await PV.tryPlay(text)) return; } catch (e) {} return tts.call(R, text, lang, o); };
  // ara sıra sevgi sözü (yalnızca kaydedildiyse)
  R.sayLove = async () => { if (!PV.ready) await PV.load(); if (!PV.on()) return false; const has = PV.LOVE.filter(k => PV.keys.has(k)); return has.length ? PV.play([has[Math.floor(Math.random() * has.length)]]) : false; };
  PV.load();
})();
