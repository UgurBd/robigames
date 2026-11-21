// Robi çok oyunculu bağlantı ayarları (menü + oyun ortak)
window.ROBI_SERVER = window.ROBI_SERVER || 'https://robi-oda.robigames.workers.dev';
window.RobiNet = {
  ANIMALS: ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🐔'], // 0-9 rakamları için resim
  AV: ['🐶', '🐱', '🐰', '🦊', '🐼', '🐸'], COL: ['#ff5a5a', '#2e8bff', '#22b573', '#ffb020', '#a259ff', '#ff5ad8'],
  MODES: { orman: ['🌲', 'Beraber Orman', 'Ateşleri birlikte söndürün, hayvanları birlikte kurtarın'], arena: ['🎯', 'Atış Oyunu', 'Su, ateş, ağ at! İsabet = yıldız'], ebe: ['🏃', 'Ebelemece', 'Ebe ağ atarak ebeyi devreder'], parkur: ['🏁', 'Parkur Yarışı', 'Yıldıza ilk kim varacak?'], boya: ['🎨', 'Birlikte Boya', 'Aynı resmi birlikte çizin ve boyayın'] },
  async create(mode) { const r = await fetch(`${ROBI_SERVER}/create?mode=${mode}`); if (!r.ok) throw new Error('create'); return r.json(); },
  async info(code) { const r = await fetch(`${ROBI_SERVER}/info?code=${code}`); if (r.status === 404) return null; if (!r.ok) throw new Error('info'); return r.json(); },
  codeEmoji(code) { return String(code).split('').map(d => this.ANIMALS[+d]).join(''); },
};
