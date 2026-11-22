// Robi'nin Macerası — çok oyunculu oda sunucusu (Cloudflare Workers + Durable Objects)
// Her oda kodu ayrı bir Durable Object. En fazla 6 oyuncu. Herkes çıkınca 2 dk sonra oda silinir.
// Sunucu mesajları odadakilere iletir. Oyuncu adı (ebeveynin seçtiği takma ad) sadece oyun sırasında gösterilir, kaydedilmez.
// Arkadaşlık: listeler cihazda durur; sunucu sadece çevrimiçi durumunu ve davetleri anlık iletir.
const MAX = 6, EMPTY_TTL = 120000, MODES = ['orman', 'arena', 'ebe', 'parkur', 'boya', 'tahmin', 'jeli', 'kopru'];
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const FP = '2D:73:5F:25:2B:09:B1:50:BE:3E:24:5B:45:C0:16:AA:9A:C3:99:3C:A2:0E:96:23:BB:B6:37:98:D8:08:47:53';
const APK = 'https://github.com/UgurBd/robigames/releases/latest/download/RobininMacerasi.apk';
const ANI = ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🐔'];
function invitePage(code) {
  const pretty = code.slice(0, 2) + '-' + code.slice(2), emo = code.split('').map(d => ANI[+d]).join('');
  const intent = `intent://oda/${code}#Intent;scheme=robigames;package=com.robigames.robi;S.browser_fallback_url=${encodeURIComponent(APK)};end`;
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Robi'nin Macerası · Oda ${pretty}</title>
<meta property="og:title" content="Robi'nin Macerası: oyun odasına davet! ${emo}"><meta property="og:description" content="Oda kodu ${pretty}. Dokun, birlikte oynayalım!">
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#fff7e0;color:#2b2340}.b{background:#fff;border:4px solid #2b2340;box-shadow:0 8px 0 #2b2340;border-radius:26px;padding:22px;text-align:center;max-width:420px;margin:16px}.c{font-size:54px;font-weight:800;letter-spacing:6px}.e{font-size:40px}a{display:block;margin:12px 0;padding:14px;border:3px solid #2b2340;border-radius:16px;box-shadow:0 4px 0 #2b2340;font-weight:800;font-size:20px;text-decoration:none;color:#2b2340}.go{background:#22b573;color:#fff}small{color:#5a4f70}</style></head>
<body><div class="b"><div style="font-size:60px">🤖👫</div><h2>Robi'nin Macerası<br>oyun odasına davetlisin!</h2><div class="c">${pretty}</div><div class="e">${emo}</div>
<a class="go" href="${intent}">▶ Oyunu aç ve odaya gir</a><a href="${APK}">📥 Oyun yüklü değilse: indir</a>
<small>Oyun açılmazsa: oyunu aç → 👫 Birlikte Oyna → Katıl → kodu gir.</small></div></body></html>`;
}
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });

const clip = (v, d, n = 16) => String(v || d).slice(0, n);
async function ipKey(req) { const ip = req.headers.get('CF-Connecting-IP') || '0'; const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('robi:' + ip)); return [...new Uint8Array(h)].slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join(''); }

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (url.pathname === '/ping') return json({ ok: true, v: 3 });
    if (url.pathname === '/.well-known/assetlinks.json') return json([{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: 'com.robigames.robi', sha256_cert_fingerprints: [FP] } }]);
    const om = url.pathname.match(/^\/oda\/(\d{5})$/);
    if (om) return new Response(invitePage(om[1]), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    if (url.pathname === '/create') {
      const mode = MODES.includes(url.searchParams.get('mode')) ? url.searchParams.get('mode') : 'orman';
      const host = { name: clip(url.searchParams.get('name'), ''), av: clip(url.searchParams.get('av'), '🐶', 8) };
      for (let i = 0; i < 10; i++) {
        const code = String(10000 + Math.floor(Math.random() * 90000));
        const size = ['S', 'M', 'L'].includes(url.searchParams.get('size')) ? url.searchParams.get('size') : 'S', bots = Math.max(0, Math.min(6, +url.searchParams.get('bots') || 0));
        const r = await env.ROOM.get(env.ROOM.idFromName(code)).fetch(`https://room/init?mode=${mode}&size=${size}&bots=${bots}`);
        if (r.ok) {
          // aynı internet bağlantısındaki (aynı ev Wi-Fi) tabletler odayı listede görsün
          const lk = await ipKey(req); await env.LOBBY.get(env.LOBBY.idFromName(lk)).fetch('https://lobby/add', { method: 'POST', body: JSON.stringify({ code, mode, ...host }) });
          return json({ code, mode, size, bots });
        }
      }
      return json({ error: 'busy' }, 503);
    }
    if (url.pathname === '/nearby') {
      const lk = await ipKey(req); const list = await (await env.LOBBY.get(env.LOBBY.idFromName(lk)).fetch('https://lobby/list')).json();
      const out = [];
      for (const r of list) { const i = await env.ROOM.get(env.ROOM.idFromName(r.code)).fetch('https://room/info'); if (i.ok) { const d = await i.json(); if (d.n < d.max) out.push({ ...r, n: d.n, size: d.size, bots: d.bots }); } }
      return json(out);
    }
    if (url.pathname === '/info' || url.pathname === '/ws') {
      const code = (url.searchParams.get('code') || '').replace(/\D/g, '');
      if (code.length !== 5) return json({ error: 'code' }, 400);
      const stub = env.ROOM.get(env.ROOM.idFromName(code));
      if (url.pathname === '/ws') return stub.fetch(req);
      const r = await stub.fetch('https://room/info'); return json(await r.json(), r.status);
    }
    if (url.pathname === '/me') return env.PRESENCE.get(env.PRESENCE.idFromName('all')).fetch(req);
    return json({ error: 'not found' }, 404);
  },
};

// Aynı ağdaki odalar (10 dk tutulur)
export class Lobby {
  constructor(ctx) { this.ctx = ctx; }
  async fetch(req) {
    const url = new URL(req.url), now = Date.now();
    let list = ((await this.ctx.storage.get('l')) || []).filter(r => now - r.t < 600000);
    if (url.pathname === '/add') { const r = await req.json(); list = [{ ...r, t: now }, ...list.filter(x => x.code !== r.code)].slice(0, 8); await this.ctx.storage.put('l', list); return new Response('ok'); }
    return new Response(JSON.stringify(list.map(({ code, mode, name, av }) => ({ code, mode, name, av }))));
  }
}

// Çevrimiçi durumu + arkadaş davetleri (oyun açıkken anlık)
export class Presence {
  constructor(ctx) { this.ctx = ctx; }
  async fetch(req) {
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('websocket only', { status: 426 });
    const url = new URL(req.url), pid = clip(url.searchParams.get('pid'), '', 12).replace(/\D/g, '');
    if (pid.length < 8) return new Response('pid', { status: 400 });
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server, [pid]); server.serializeAttachment({ pid, name: clip(url.searchParams.get('name'), 'Robi'), av: clip(url.searchParams.get('av'), '🤖', 8) });
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, msg) {
    let m; try { m = JSON.parse(msg); } catch (e) { return; } const me = ws.deserializeAttachment(); if (!me) return;
    if (m.t === 'look') { me.name = clip(m.name, me.name); me.av = clip(m.av, me.av, 8); ws.serializeAttachment(me); return; }
    if (m.t === 'st') { const on = {}; for (const id of (m.ids || []).slice(0, 50)) on[id] = this.ctx.getWebSockets(String(id)).length > 0; ws.send(JSON.stringify({ t: 'st', on })); return; }
    if (['invite', 'addreq', 'addok', 'nope'].includes(m.t) && m.to) {
      const out = JSON.stringify({ ...m, from: { pid: me.pid, name: me.name, av: me.av } }); let sent = 0;
      for (const w of this.ctx.getWebSockets(String(m.to))) { try { w.send(out); sent++; } catch (e) {} }
      ws.send(JSON.stringify({ t: 'sent', k: m.t, to: m.to, ok: sent > 0 }));
    }
  }
  async webSocketClose(ws) { try { ws.close(1000, 'bye'); } catch (e) {} }
}

export class Room {
  constructor(ctx) { this.ctx = ctx; }
  live(except) { return this.ctx.getWebSockets().filter(w => { if (w === except) return false; const a = w.deserializeAttachment(); return a && !a.pending; }); }
  peers(except) { return this.live(except).map(w => w.deserializeAttachment()).filter(Boolean); }
  bc(obj, except) { const s = JSON.stringify(obj); for (const w of this.live(except)) try { w.send(s); } catch (e) {} }
  hostWs() { let h = null, hs = 99; for (const w of this.live()) { const a = w.deserializeAttachment(); if (a.slot < hs) { hs = a.slot; h = w; } } return h; }
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/init') {
      if ((await this.ctx.storage.get('created')) && this.ctx.getWebSockets().length) return new Response('busy', { status: 409 });
      await this.ctx.storage.put({ created: Date.now(), mode: url.searchParams.get('mode') || 'orman', size: url.searchParams.get('size') || 'S', bots: +url.searchParams.get('bots') || 0, seed: Math.floor(Math.random() * 1e9) });
      await this.ctx.storage.setAlarm(Date.now() + EMPTY_TTL);
      return new Response('ok');
    }
    if (url.pathname === '/info') {
      if (!(await this.ctx.storage.get('created'))) return new Response('{"error":"none"}', { status: 404 });
      const st = await this.ctx.storage.get(['mode', 'size', 'bots']);
      return new Response(JSON.stringify({ mode: st.get('mode'), size: st.get('size') || 'S', bots: st.get('bots') || 0, n: this.live().length, max: MAX }));
    }
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('websocket only', { status: 426 });
    if (!(await this.ctx.storage.get('created'))) return new Response('no room', { status: 404 });
    const socks = this.ctx.getWebSockets();
    if (socks.length >= MAX) return new Response('full', { status: 403 });
    const used = new Set(socks.map(w => (w.deserializeAttachment() || {}).slot));
    let slot = 0; while (used.has(slot)) slot++;
    const me = { slot, ch: clip(url.searchParams.get('ch'), 'robi'), av: clip(url.searchParams.get('av'), '', 8), suit: clip(url.searchParams.get('suit'), 'white'), name: clip(url.searchParams.get('name'), ''), pid: clip(url.searchParams.get('pid'), '', 12) };
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    // "yakındaki odalar"dan gelen: oda sahibi onaylamalı (kodla/linkle gelen doğrudan girer)
    const host = this.hostWs();
    if (url.searchParams.get('ask') === '1' && host) {
      me.pending = true; server.serializeAttachment(me);
      server.send(JSON.stringify({ t: 'wait' }));
      host.send(JSON.stringify({ t: 'ask', p: me }));
      return new Response(null, { status: 101, webSocket: client });
    }
    server.serializeAttachment(me); await this.admit(server, me);
    return new Response(null, { status: 101, webSocket: client });
  }
  async admit(ws, me) {
    const st = await this.ctx.storage.get(['mode', 'seed', 'layout']);
    ws.send(JSON.stringify({ t: 'welcome', me, mode: st.get('mode'), seed: st.get('seed'), layout: st.get('layout') || null, peers: this.peers(ws) }));
    this.bc({ t: 'join', p: me }, ws);
    await this.ctx.storage.deleteAlarm();
  }
  async webSocketMessage(ws, msg) {
    if (typeof msg !== 'string' || msg.length > 250000) return;
    let m; try { m = JSON.parse(msg); } catch (e) { return; }
    const a = ws.deserializeAttachment(); if (!a || a.pending) return;
    if (m.t === 'allow' && ws === this.hostWs()) {
      const w = this.ctx.getWebSockets().find(x => { const b = x.deserializeAttachment(); return b && b.pending && b.slot === m.slot; });
      if (w) { const b = w.deserializeAttachment(); if (m.ok) { delete b.pending; w.serializeAttachment(b); await this.admit(w, b); } else { try { w.send(JSON.stringify({ t: 'denied' })); w.close(4003, 'denied'); } catch (e) {} } }
      return;
    }
    if (m.t === 'layout') await this.ctx.storage.put('layout', m.layout);
    if (m.t === 'look') { a.suit = clip(m.suit, 'white'); a.ch = clip(m.ch, a.ch); ws.serializeAttachment(a); }
    const out = `{"s":${a.slot},"m":${msg}}`;
    for (const w of this.live(ws)) try { w.send(out); } catch (e) {}
  }
  async webSocketClose(ws) {
    const a = ws.deserializeAttachment(); try { ws.close(1000, 'bye'); } catch (e) {}
    if (a && !a.pending) this.bc({ t: 'leave', slot: a.slot }, ws);
    if (!this.ctx.getWebSockets().filter(w => w !== ws).length) await this.ctx.storage.setAlarm(Date.now() + EMPTY_TTL);
  }
  async webSocketError(ws) { return this.webSocketClose(ws); }
  async alarm() { if (!this.ctx.getWebSockets().length) await this.ctx.storage.deleteAll(); }
}
