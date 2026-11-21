// ===================== Robi — çizim kütüphanesi: nesneler, rakamlar, harfler, sesli okuma =====================
(function () {
'use strict';
const R = (tag, a) => `<${tag} class="r" fill="#fff" ${a}/>`;
const K = a => `<path class="ink" d="${a}"/>`;
const D = (x, y, rr = 5) => `<circle class="dot" cx="${x}" cy="${y}" r="${rr}"/>`;
const E = (cx, cy, rx, ry, extra = '') => R('ellipse', `cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${extra}`);
const C = (cx, cy, rr) => R('circle', `cx="${cx}" cy="${cy}" r="${rr}"`);
const P = d => R('path', `d="${d}"`);
const RC = (x, y, w, h, rx = 0) => R('rect', `x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"`);

// Yeni nesneler (400x300 alanında, ortada)
const NEW = [
  { id: 'bisiklet', tr: 'Bisiklet', en: 'Bicycle', cat: 'arac', e: '🚲', body: () => [C(110, 200, 50), C(290, 200, 50), C(110, 200, 18), C(290, 200, 18), P('M110 200L170 120H260L290 200L230 205Z M170 120L230 205'), P('M160 105H195L190 120H165Z'), P('M255 95L285 90L288 100L262 108Z'), C(200, 205, 14)].join('') },
  { id: 'kamyon', tr: 'Kamyon', en: 'Truck', cat: 'arac', e: '🚚', body: () => [RC(60, 100, 190, 110, 8), P('M250 130H310L345 170V210H250Z'), P('M262 142H302L328 172H262Z'), C(115, 215, 26), C(205, 215, 26), C(300, 215, 26), C(115, 215, 10), C(205, 215, 10), C(300, 215, 10), RC(332, 182, 14, 12, 3), RC(85, 125, 140, 50, 6)].join('') },
  { id: 'motor', tr: 'Motosiklet', en: 'Motorcycle', cat: 'arac', e: '🏍️', body: () => [C(105, 210, 45), C(295, 210, 45), C(105, 210, 16), C(295, 210, 16), P('M105 210L160 150H250L295 210H210L180 185Z'), P('M165 135Q205 115 245 135L240 152H170Z'), P('M250 150L275 110H300L292 122H282Z'), E(205, 170, 28, 14)].join('') },
  { id: 'otobus', tr: 'Otobüs', en: 'Bus', cat: 'arac', e: '🚌', body: () => [RC(50, 80, 300, 135, 18), RC(70, 100, 52, 45, 6), RC(135, 100, 52, 45, 6), RC(200, 100, 52, 45, 6), RC(268, 100, 62, 100, 6), C(120, 218, 28), C(285, 218, 28), C(120, 218, 11), C(285, 218, 11), RC(50, 165, 210, 14), RC(330, 180, 16, 14, 4)].join('') },
  { id: 'ucak', tr: 'Uçak', en: 'Airplane', cat: 'arac', e: '✈️', body: () => [P('M60 150Q60 125 100 125H320Q350 125 350 150Q350 175 320 175H100Q60 175 60 150Z'), P('M170 125L230 50H260L235 125Z'), P('M170 175L230 250H260L235 175Z'), P('M80 125L60 85H85L110 125Z'), C(300, 148, 12), C(265, 148, 12), C(230, 148, 12), P('M330 140Q345 142 345 150H325Z')].join('') },
  { id: 'gemi', tr: 'Gemi', en: 'Ship', cat: 'arac', e: '🚢', body: () => [P('M50 180H350L310 240H90Z'), RC(110, 130, 180, 50, 6), RC(150, 90, 100, 40, 6), RC(220, 50, 26, 40, 4), C(140, 155, 10), C(180, 155, 10), C(220, 155, 10), C(260, 155, 10), P('M50 180H350L345 192H55Z')].join('') },
  { id: 'kopek', tr: 'Köpek', en: 'Dog', cat: 'hayvan', e: '🐶', body: () => [E(200, 195, 85, 50), C(285, 135, 48), P('M255 100Q235 105 238 150Q255 140 262 110Z'), P('M315 100Q335 105 332 150Q315 140 308 110Z'), E(300, 155, 20, 14), RC(130, 225, 26, 45, 10), RC(225, 225, 26, 45, 10), P('M118 180Q85 150 90 120Q102 160 125 165Z'), C(262, 172, 9)].join('') + D(272, 128, 6) + D(304, 128, 6) + D(312, 152, 7) },
  { id: 'tavsan', tr: 'Tavşan', en: 'Rabbit', cat: 'hayvan', e: '🐰', body: () => [E(200, 200, 70, 62), C(200, 115, 48), E(178, 45, 14, 45), E(222, 45, 14, 45), E(178, 50, 6, 30), E(222, 50, 6, 30), C(128, 215, 18), E(170, 258, 24, 12), E(230, 258, 24, 12), E(200, 205, 35, 40)].join('') + D(183, 108, 6) + D(217, 108, 6) + K('M200 125l-6 6M200 125l6 6M200 125v8') },
  { id: 'kus', tr: 'Kuş', en: 'Bird', cat: 'hayvan', e: '🐦', body: () => [E(190, 165, 80, 58), C(265, 115, 38), P('M298 112L335 122L298 132Z'), P('M140 150Q190 110 220 165Q170 190 140 150Z'), P('M112 160L60 130L70 185Z'), P('M175 220L170 255M205 220L210 255'), E(205, 190, 40, 22)].join('') + D(272, 108, 6) },
  { id: 'kelebek', tr: 'Kelebek', en: 'Butterfly', cat: 'hayvan', e: '🦋', body: () => [P('M195 140Q110 30 70 90Q50 150 190 155Z'), P('M205 140Q290 30 330 90Q350 150 210 155Z'), P('M195 165Q100 170 95 225Q130 265 192 180Z'), P('M205 165Q300 170 305 225Q270 265 208 180Z'), E(200, 165, 12, 60), C(130, 110, 16), C(270, 110, 16), C(140, 215, 12), C(260, 215, 12)].join('') + K('M196 108Q185 80 170 70M204 108Q215 80 230 70') },
  { id: 'fil', tr: 'Fil', en: 'Elephant', cat: 'hayvan', e: '🐘', body: () => [E(200, 170, 100, 65), C(300, 140, 52), P('M330 160Q350 210 330 260L310 255Q325 210 305 175Z'), E(272, 140, 34, 45), RC(130, 210, 32, 55, 10), RC(190, 215, 32, 52, 10), RC(240, 210, 32, 55, 10), P('M100 160Q80 170 85 195')].join('') + D(312, 128, 6) },
  { id: 'kaplumbaga', tr: 'Kaplumbağa', en: 'Turtle', cat: 'hayvan', e: '🐢', body: () => [P('M90 190Q100 90 200 85Q300 90 310 190Z'), P('M150 110L200 100L250 110L265 150L200 165L135 150Z'), C(345, 170, 28), E(120, 205, 24, 15), E(280, 205, 24, 15), RC(80, 185, 240, 18, 8), P('M90 190L60 185L85 175Z')].join('') + D(352, 162, 5) },
  { id: 'pasta', tr: 'Pasta', en: 'Cake', cat: 'pasta', e: '🎂', body: () => [RC(90, 170, 220, 85, 12), RC(120, 110, 160, 60, 12), P('M90 175Q115 195 140 175Q165 195 190 175Q215 195 240 175Q265 195 290 175Q300 185 310 175V170H90Z'), P('M120 115Q140 130 160 115Q180 130 200 115Q220 130 240 115Q260 130 280 115V110H120Z'), RC(150, 70, 12, 40, 4), RC(194, 70, 12, 40, 4), RC(238, 70, 12, 40, 4), P('M156 70Q148 58 156 46Q164 58 156 70Z'), P('M200 70Q192 58 200 46Q208 58 200 70Z'), P('M244 70Q236 58 244 46Q252 58 244 70Z'), RC(70, 255, 260, 14, 7)].join('') },
  { id: 'kek', tr: 'Kek', en: 'Cupcake', cat: 'pasta', e: '🧁', body: () => [P('M130 170H270L250 270H150Z'), P('M120 170Q115 120 160 115Q170 70 200 75Q235 70 242 115Q288 120 280 170Z'), C(200, 62, 16), K('M165 175L172 268M200 175V268M235 175L228 268'), C(165, 140, 6), C(232, 132, 6), C(205, 105, 6)].join('') },
  { id: 'dondurma', tr: 'Dondurma', en: 'Ice cream', cat: 'pasta', e: '🍦', body: () => [P('M150 160L200 285L250 160Z'), C(200, 140, 52), C(170, 95, 38), C(232, 95, 38), C(200, 55, 22), K('M165 175L222 230M235 175L180 228'), P('M150 160Q175 180 200 160Q225 180 250 160V150H150Z')].join('') },
  { id: 'mantar', tr: 'Mantar', en: 'Mushroom', cat: 'bitki', e: '🍄', body: () => [P('M60 160Q70 50 200 45Q330 50 340 160Z'), P('M160 160H240L250 265H150Z'), C(130, 120, 18), C(200, 90, 22), C(270, 120, 18), C(170, 140, 10), C(240, 145, 12), RC(130, 262, 140, 14, 7)].join('') },
  { id: 'kaktus', tr: 'Kaktüs', en: 'Cactus', cat: 'bitki', e: '🌵', body: () => [RC(170, 60, 60, 190, 30), P('M170 160H130Q110 160 110 140V100Q110 85 125 85Q140 85 140 100V130H170Z'), P('M230 140H270Q290 140 290 120V90Q290 75 275 75Q260 75 260 90V110H230Z'), P('M140 250H260L245 290H155Z'), C(200, 50, 14)].join('') + K('M190 90v10M210 120v10M190 170v10M210 210v10') },
  { id: 'elma', tr: 'Elma', en: 'Apple', cat: 'bitki', e: '🍎', body: () => [P('M200 95Q260 60 300 110Q330 170 290 230Q260 275 220 260Q200 252 180 260Q140 275 110 230Q70 170 100 110Q140 60 200 95Z'), P('M200 95Q205 70 212 50L222 54Q213 75 206 98Z'), P('M215 70Q250 40 285 55Q260 90 215 70Z'), E(150, 140, 18, 28)].join('') },
  { id: 'lale', tr: 'Lale', en: 'Tulip', cat: 'bitki', e: '🌷', body: () => [P('M150 90Q150 160 200 165Q250 160 250 90L225 115L200 80L175 115Z'), RC(195, 165, 10, 100, 4), P('M200 240Q150 225 135 180Q175 185 200 220Z'), P('M200 230Q250 210 268 170Q225 178 200 212Z'), P('M140 260H260L250 290H150Z')].join('') },
  { id: 'kale', tr: 'Kale', en: 'Castle', cat: 'ev', e: '🏰', body: () => [RC(90, 130, 220, 140), RC(60, 90, 60, 180), RC(280, 90, 60, 180), P('M50 90L90 40L130 90Z'), P('M270 90L310 40L350 90Z'), P('M170 270V210Q200 180 230 210V270Z'), RC(140, 150, 30, 30, 4), RC(230, 150, 30, 30, 4), P('M90 130V112H110V130M130 130V112H150V130M170 130V112H190V130M210 130V112H230V130M250 130V112H270V130M290 130V112H310V130'), P('M88 40V15L110 22L88 30')].join('') },
];
// Var olan boyama resimleri de kütüphanede (boyama.html PICS'ten v0 ile gelir)
const OLD_META = [['ev', 'Ev', 'House', 'ev', '🏠'], ['balik', 'Balık', 'Fish', 'hayvan', '🐟'], ['agac', 'Ağaç', 'Tree', 'bitki', '🌳'], ['robi', 'Robot', 'Robot', 'arac', '🤖'], ['araba', 'Araba', 'Car', 'arac', '🚗'], ['cicek', 'Çiçek', 'Flower', 'bitki', '🌸'], ['roket', 'Roket', 'Rocket', 'arac', '🚀'], ['kedi', 'Kedi', 'Cat', 'hayvan', '🐱'], ['balon', 'Balonlar', 'Balloons', 'ev', '🎈'], ['dinozor', 'Dinozor', 'Dinosaur', 'hayvan', '🦕']];

// Tek çizgilik rakam ve harf yolları (100x150 kutu, harf boyu y=20..140)
const DIGITS = [
  ['0', 'Sıfır', 'Zero', 'M50 20Q82 20 82 80Q82 140 50 140Q18 140 18 80Q18 20 50 20'],
  ['1', 'Bir', 'One', 'M30 45L55 20V140M30 140H80'],
  ['2', 'İki', 'Two', 'M20 50Q22 20 50 20Q80 20 80 50Q80 75 20 140H82'],
  ['3', 'Üç', 'Three', 'M20 35Q35 20 52 20Q80 20 80 47Q80 78 48 78Q84 78 84 110Q84 140 50 140Q30 140 18 125'],
  ['4', 'Dört', 'Four', 'M65 140V20L15 100H88'],
  ['5', 'Beş', 'Five', 'M80 20H28L22 75Q35 66 52 66Q84 66 84 103Q84 140 50 140Q30 140 18 125'],
  ['6', 'Altı', 'Six', 'M75 30Q62 20 50 20Q18 20 18 85Q18 140 50 140Q82 140 82 105Q82 72 50 72Q26 72 18 95'],
  ['7', 'Yedi', 'Seven', 'M15 20H85L42 140'],
  ['8', 'Sekiz', 'Eight', 'M50 80Q20 76 20 50Q20 20 50 20Q80 20 80 50Q80 76 50 80Q16 84 16 112Q16 140 50 140Q84 140 84 112Q84 84 50 80'],
  ['9', 'Dokuz', 'Nine', 'M80 60Q80 88 50 88Q20 88 20 55Q20 20 50 20Q80 20 80 60V100Q80 140 48 140Q30 140 22 128'],
  ['10', 'On', 'Ten', 'M10 45L30 20V140M70 20Q95 20 95 80Q95 140 70 140Q45 140 45 80Q45 20 70 20'],
];
const Cc = 'M85 40Q72 20 50 20Q12 20 12 80Q12 140 50 140Q72 140 85 120', Gg = 'M85 40Q72 20 50 20Q12 20 12 80Q12 140 50 140Q88 140 88 88H55',
  Oo = 'M50 20Q90 20 90 80Q90 140 50 140Q10 140 10 80Q10 20 50 20', Ss = 'M82 35Q70 20 50 20Q18 20 18 48Q18 74 50 80Q84 86 84 112Q84 140 50 140Q24 140 14 120',
  Uu = 'M18 20V105Q18 140 50 140Q82 140 82 105V20', Pp = 'M20 140V20H55Q88 20 88 52Q88 84 55 84H20', CED = 'M50 140V148Q62 150 52 160', DOTS = 'M35 4V8M65 4V8';
const LETTERS = [
  ['A', 'M10 140L50 20L90 140M25 95H75', 'Arı', 'Bee', '🐝'], ['B', 'M20 140V20H55Q85 20 85 50Q85 78 55 78H20M55 78Q90 78 90 109Q90 140 55 140H20', 'Balık', 'Fish', '🐟'],
  ['C', Cc, 'Ceviz', 'Walnut', '🌰'], ['Ç', Cc + CED, 'Çiçek', 'Flower', '🌸'], ['D', 'M20 140V20H45Q90 20 90 80Q90 140 45 140H20', 'Dinozor', 'Dinosaur', '🦕'],
  ['E', 'M85 20H20V140H85M20 80H70', 'Elma', 'Apple', '🍎'], ['F', 'M85 20H20V140M20 80H70', 'Fil', 'Elephant', '🐘'], ['G', Gg, 'Gemi', 'Ship', '🚢'],
  ['Ğ', Gg + 'M35 4Q50 16 65 4', 'Dağ', 'Mountain', '⛰️'], ['H', 'M20 20V140M80 20V140M20 80H80', 'Havuç', 'Carrot', '🥕'], ['I', 'M50 20V140', 'Irmak', 'River', '🏞️'],
  ['İ', 'M50 40V140M50 14V20', 'İnek', 'Cow', '🐄'], ['J', 'M70 20V110Q70 140 45 140Q22 140 20 115', 'Jöle', 'Jelly', '🍮'], ['K', 'M20 20V140M80 20L20 90M40 70L82 140', 'Kedi', 'Cat', '🐱'],
  ['L', 'M20 20V140H80', 'Limon', 'Lemon', '🍋'], ['M', 'M12 140V20L50 90L88 20V140', 'Muz', 'Banana', '🍌'], ['N', 'M20 140V20L80 140V20', 'Nane', 'Mint', '🌿'],
  ['O', Oo, 'Otobüs', 'Bus', '🚌'], ['Ö', Oo + DOTS, 'Ördek', 'Duck', '🦆'], ['P', Pp, 'Pasta', 'Cake', '🎂'], ['R', Pp + 'M52 84L85 140', 'Robot', 'Robot', '🤖'],
  ['S', Ss, 'Saat', 'Clock', '⏰'], ['Ş', Ss + CED, 'Şemsiye', 'Umbrella', '☂️'], ['T', 'M10 20H90M50 20V140', 'Tavşan', 'Rabbit', '🐰'], ['U', Uu, 'Uçak', 'Airplane', '✈️'],
  ['Ü', Uu + DOTS, 'Üzüm', 'Grapes', '🍇'], ['V', 'M10 20L50 140L90 20', 'Vapur', 'Ferry', '⛴️'], ['Y', 'M10 20L50 80L90 20M50 80V140', 'Yıldız', 'Star', '⭐'], ['Z', 'M15 20H85L15 140H85', 'Zürafa', 'Giraffe', '🦒'],
];

// Sesli okuma: uygulamada yerel ses motoru, tarayıcıda Web Speech
async function speak(text, lang) {
  try {
    const cap = window.Capacitor || (window.parent && window.parent.Capacitor);
    const tts = cap && cap.Plugins && cap.Plugins.TextToSpeech;
    if (tts) { await tts.speak({ text, lang, rate: .9, pitch: 1.1, volume: 1, category: 'ambient' }); return; }
  } catch (e) {}
  try {
    if (!window.speechSynthesis) return;
    await new Promise(res => { const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = .9; u.pitch = 1.1; const vs = speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith(lang.slice(0, 2))); if (vs[0]) u.voice = vs[0]; u.onend = res; u.onerror = res; speechSynthesis.speak(u); setTimeout(res, 4000); });
  } catch (e) {}
}
async function sayBoth(tr, en) { await speak(en, 'en-US'); await new Promise(r => setTimeout(r, 250)); await speak(tr, 'tr-TR'); }
window.RobiKutuphane = { NEW, OLD_META, DIGITS, LETTERS, R, K, D, speak, sayBoth };
})();
