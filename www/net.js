// Robi çok oyunculu bağlantı ayarları (menü + oyun ortak)
window.ROBI_SERVER = window.ROBI_SERVER || 'https://robi-oda.robigames.workers.dev';
window.RobiNet = {
  ANIMALS: ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🐔'], // 0-9 rakamları için resim
  AV: ['🐶', '🐱', '🐰', '🦊', '🐼', '🐸'], COL: ['#ff5a5a', '#2e8bff', '#22b573', '#ffb020', '#a259ff', '#ff5ad8'],
  MODES: { orman: ['🌲', 'Beraber Orman', 'Ateşleri birlikte söndürün, hayvanları birlikte kurtarın'], arena: ['🎯', 'Atış Oyunu', 'Su, ateş, ağ at! İsabet = yıldız'], ebe: ['🏃', 'Ebelemece', 'Ebe ağ atarak ebeyi devreder'], parkur: ['🏁', 'Parkur Yarışı', 'Yıldıza ilk kim varacak?'], boya: ['🎨', 'Birlikte Boya', 'Aynı resmi birlikte çizin ve boyayın'], tahmin: ['🔮', 'Tahmin', 'Arkadaşın hangi kartı seçti?'], jeli: ['🍬', 'Jelibon Arenası', 'Jelibon ve dondurma tabancalarıyla kovalamaca!'], kopru: ['🌈', 'Renk Köprüsü', 'Sırayla renge basın, Pofuduk köprüden geçsin'] },
  PRESETS: ['Uçan Panda', 'Zıplayan Tilki', 'Süper Robot', 'Neşeli Kedi', 'Hızlı Tavşan', 'Cesur Ejder', 'Minik Ayı', 'Parlak Yıldız'],
  AVS: ['🦊', '🐼', '🐶', '🐱', '🐰', '🐻', '🐸', '🐵', '🦁', '🐯', '🦄', '🐲'],
  prof() { const p = window.RobiOrtak ? RobiOrtak.profile() : { pid: '', name: '', av: '🙂' }; return p; },
  q() { const p = this.prof(); return `name=${encodeURIComponent(p.name || '')}&av=${encodeURIComponent(p.av || '')}&pid=${p.pid}`; },
  async nearby() { try { const r = await fetch(`${ROBI_SERVER}/nearby`); return r.ok ? r.json() : []; } catch (e) { return []; } },
  async create(mode, size = 'S', bots = 0) { const r = await fetch(`${ROBI_SERVER}/create?mode=${mode}&size=${size}&bots=${bots}&${this.q()}`); if (!r.ok) throw new Error('create'); return r.json(); },
  async info(code) { const r = await fetch(`${ROBI_SERVER}/info?code=${code}`); if (r.status === 404) return null; if (!r.ok) throw new Error('info'); return r.json(); },
  codeEmoji(code) { return String(code).split('').map(d => this.ANIMALS[+d]).join(''); },
};
