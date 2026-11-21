// Robi'nin Macerası — çok oyunculu oda sunucusu (Cloudflare Workers + Durable Objects)
// Her oda kodu ayrı bir Durable Object. En fazla 6 oyuncu. Herkes çıkınca 2 dk sonra oda silinir.
// Sunucu sadece mesajları odadakilere iletir; isim, ses, kişisel veri taşımaz/saklamaz.
const MAX = 6, EMPTY_TTL = 120000, MODES = ['orman', 'arena', 'ebe', 'parkur'];
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

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (url.pathname === '/ping') return json({ ok: true, v: 2 });
    if (url.pathname === '/.well-known/assetlinks.json') return json([{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: 'com.robigames.robi', sha256_cert_fingerprints: [FP] } }]);
    const om = url.pathname.match(/^\/oda\/(\d{5})$/);
    if (om) return new Response(invitePage(om[1]), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    if (url.pathname === '/create') {
      const mode = MODES.includes(url.searchParams.get('mode')) ? url.searchParams.get('mode') : 'orman';
      for (let i = 0; i < 10; i++) {
        const code = String(10000 + Math.floor(Math.random() * 90000));
        const r = await env.ROOM.get(env.ROOM.idFromName(code)).fetch(`https://room/init?mode=${mode}`);
        if (r.ok) return json({ code, mode });
      }
      return json({ error: 'busy' }, 503);
    }
    if (url.pathname === '/info') {
      const code = (url.searchParams.get('code') || '').replace(/\D/g, '');
      if (code.length !== 5) return json({ error: 'code' }, 400);
      const r = await env.ROOM.get(env.ROOM.idFromName(code)).fetch('https://room/info');
      return json(await r.json(), r.status);
    }
    if (url.pathname === '/ws') {
      const code = (url.searchParams.get('code') || '').replace(/\D/g, '');
      if (code.length !== 5) return json({ error: 'code' }, 400);
      return env.ROOM.get(env.ROOM.idFromName(code)).fetch(req);
    }
    return json({ error: 'not found' }, 404);
  },
};

export class Room {
  constructor(ctx) { this.ctx = ctx; }
  peers(except) { return this.ctx.getWebSockets().filter(w => w !== except).map(w => w.deserializeAttachment()).filter(Boolean); }
  bc(obj, except) { const s = JSON.stringify(obj); for (const w of this.ctx.getWebSockets()) if (w !== except) try { w.send(s); } catch (e) {} }
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/init') {
      if ((await this.ctx.storage.get('created')) && this.ctx.getWebSockets().length) return new Response('busy', { status: 409 });
      await this.ctx.storage.put({ created: Date.now(), mode: url.searchParams.get('mode') || 'orman', seed: Math.floor(Math.random() * 1e9) });
      await this.ctx.storage.setAlarm(Date.now() + EMPTY_TTL);
      return new Response('ok');
    }
    if (url.pathname === '/info') {
      if (!(await this.ctx.storage.get('created'))) return new Response('{"error":"none"}', { status: 404 });
      return new Response(JSON.stringify({ mode: await this.ctx.storage.get('mode'), n: this.ctx.getWebSockets().length, max: MAX }));
    }
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('websocket only', { status: 426 });
    if (!(await this.ctx.storage.get('created'))) return new Response('no room', { status: 404 });
    const socks = this.ctx.getWebSockets();
    if (socks.length >= MAX) return new Response('full', { status: 403 });
    const used = new Set(socks.map(w => (w.deserializeAttachment() || {}).slot));
    let slot = 0; while (used.has(slot)) slot++;
    const clip = (v, d) => (v || d).slice(0, 16);
    const me = { slot, ch: clip(url.searchParams.get('ch'), 'robi'), av: clip(url.searchParams.get('av'), '🐶'), suit: clip(url.searchParams.get('suit'), 'white') };
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server); server.serializeAttachment(me);
    const st = await this.ctx.storage.get(['mode', 'seed', 'layout']);
    server.send(JSON.stringify({ t: 'welcome', me, mode: st.get('mode'), seed: st.get('seed'), layout: st.get('layout') || null, peers: this.peers(server) }));
    this.bc({ t: 'join', p: me }, server);
    await this.ctx.storage.deleteAlarm();
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, msg) {
    if (typeof msg !== 'string' || msg.length > 60000) return;
    let m; try { m = JSON.parse(msg); } catch (e) { return; }
    const a = ws.deserializeAttachment(); if (!a) return;
    if (m.t === 'layout') await this.ctx.storage.put('layout', m.layout); // parkur paylaşımı
    if (m.t === 'look') { a.suit = String(m.suit || 'white').slice(0, 16); a.ch = String(m.ch || a.ch).slice(0, 16); ws.serializeAttachment(a); }
    const out = `{"s":${a.slot},"m":${msg}}`;
    for (const w of this.ctx.getWebSockets()) if (w !== ws) try { w.send(out); } catch (e) {}
  }
  async webSocketClose(ws) {
    const a = ws.deserializeAttachment(); try { ws.close(1000, 'bye'); } catch (e) {}
    if (a) this.bc({ t: 'leave', slot: a.slot }, ws);
    if (!this.ctx.getWebSockets().filter(w => w !== ws).length) await this.ctx.storage.setAlarm(Date.now() + EMPTY_TTL);
  }
  async webSocketError(ws) { return this.webSocketClose(ws); }
  async alarm() { if (!this.ctx.getWebSockets().length) await this.ctx.storage.deleteAll(); }
}
