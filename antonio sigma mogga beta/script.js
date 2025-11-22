/* script.js — versão corrigida e organizada
   - Substitua o conteúdo do seu script.js por este arquivo
*/

/* -------------------- Dados (álbuns + faixas) -------------------- */
const upgradesData = [
  { album: "BASTARD", theme: { bg: "#ffb3b3" }, unlockAt: 0, tracks: [
      { id: 'b1', title: 'Yonkers', baseCost: 50, cps: 1 },
      { id: 'b2', title: 'French!', baseCost: 120, cps: 2 },
      { id: 'b3', title: 'Bastard', baseCost: 300, cps: 5 }
  ]},

  { album: "GOBLIN", theme: { bg: "#5cd65c" }, unlockAt: 500, tracks: [
      { id: 'g1', title: 'She', baseCost: 600, cps: 10 },
      { id: 'g2', title: 'Yonkers (deluxe)', baseCost: 1200, cps: 25 }
  ]},

  { album: "WOLF", theme: { bg: "#9ddaff" }, unlockAt: 5000, tracks: [
      { id: 'w1', title: 'IFHY', baseCost: 6000, cps: 60 },
      { id: 'w2', title: 'Answer', baseCost: 10000, cps: 100 }
  ]},

  { album: "CHERRY BOMB", theme: { bg: "#ff6699" }, unlockAt: 25000, tracks: [
      { id: 'c1', title: 'Smuckers', baseCost: 30000, cps: 200 },
      { id: 'c2', title: 'Blow My Load 💀', baseCost: 50000, cps: 300 }
  ]},

  { album: "FLOWER BOY", theme: { bg: "#ffdb70" }, unlockAt: 100000, tracks: [
      { id: 'f1', title: 'See You Again', baseCost: 120000, cps: 500 },
      { id: 'f2', title: '911/Mr. Lonely', baseCost: 180000, cps: 850 }
  ]},

  { album: "IGOR", theme: { bg: "#ffc8e6" }, unlockAt: 400000, tracks: [
      { id: 'i1', title: 'EARFQUAKE', baseCost: 450000, cps: 1200 },
      { id: 'i2', title: 'ARE WE STILL FRIENDS?', baseCost: 650000, cps: 2000 }
  ]},

  { album: "CALL ME IF YOU GET LOST", theme: { bg: "#6db6d9" }, unlockAt: 1500000, tracks: [
      { id: 'cm1', title: 'Wusyaname', baseCost: 1700000, cps: 3500 },
      { id: 'cm2', title: 'Massa', baseCost: 2100000, cps: 5000 }
  ]},

  { album: "CHROMAKOPIA", theme: { bg: "#c8a9ff" }, unlockAt: 3500000, tracks: [
      { id: 'ch1', title: 'St. Chroma', baseCost: 3900000, cps: 7500 },
      { id: 'ch2', title: 'Noid', baseCost: 4200000, cps: 9000 },
      { id: 'ch3', title: 'Like Him', baseCost: 4700000, cps: 12000 }
  ]},

  { album: "DON'T TAP THE GLASS", theme: { bg: "#e3fff0" }, unlockAt: 6000000, tracks: [
      { id: 'dt1', title: 'Ring Ring Ring', baseCost: 6200000, cps: 15000 },
      { id: 'dt2', title: "I'll Take Care Of You", baseCost: 6800000, cps: 20000 },
      { id: 'dt3', title: 'Tell Me What Is', baseCost: 7200000, cps: 30000 },
      { id: 'd_final', title: "Don't Tap The Glass — Final", baseCost: 50000000, cps: 120000, isFinal: true }
  ]}
];
/* -------------------- Estado do jogo -------------------- */
const state = {
  points: 0,
  perClick: 1,
  cps: 0,
  owned: {} // { trackId: quantidade }
};

/* -------------------- DOM Elements (com proteção) -------------------- */
const counterEl = document.getElementById('counter');
const perClickEl = document.getElementById('perClick');
const cpsEl = document.getElementById('cps');
const upgradeList = document.getElementById('upgradeList');
const clicker = document.getElementById('clicker');
const finalModal = document.getElementById('finalModal');
const closeModalBtn = document.getElementById('closeModal');

/* quick guards so missing DOM won't throw */
if (!counterEl || !perClickEl || !cpsEl || !upgradeList || !clicker) {
  console.error('Elementos principais não encontrados no DOM. Verifique ids: counter, perClick, cps, upgradeList, clicker.');
}

/* -------------------- Utilitários -------------------- */
function formatNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return String(Math.floor(n));
}
function calcCost(base, owned) {
  return Math.floor(base * Math.pow(1.15, owned || 0));
}

/* -------------------- Save / Load -------------------- */
function save() {
  try { localStorage.setItem('tyler_clicker', JSON.stringify(state)); }
  catch (e) { console.warn('save error', e); }
}
function load() {
  try {
    const raw = localStorage.getItem('tyler_clicker');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    // merge only known fields to avoid malformed saves wiping structure
    if (typeof parsed.points === 'number') state.points = parsed.points;
    if (typeof parsed.perClick === 'number') state.perClick = parsed.perClick;
    if (typeof parsed.cps === 'number') state.cps = parsed.cps;
    if (parsed.owned && typeof parsed.owned === 'object') state.owned = parsed.owned;
  } catch (e) { console.warn('load error', e); }
}

/* recalc cps from owned (useful after load) */
function recalcCpsFromOwned() {
  state.cps = 0;
  for (const section of upgradesData) {
    for (const t of section.tracks) {
      const n = state.owned[t.id] || 0;
      state.cps += (t.cps || 0) * n;
    }
  }
}

/* -------------------- Theme / Progression -------------------- */
function updateTheme() {
  const active = upgradesData.slice().reverse().find(a => state.points >= a.unlockAt);
  if (!active) return;
  document.body.style.background = active.theme.bg || '';
}

/* -------------------- Render / UI -------------------- */
function renderUpgrades() {
  if (!upgradeList) return;
  upgradeList.innerHTML = '';

  upgradesData
    .filter(a => state.points >= a.unlockAt)
    .forEach(section => {
      const label = document.createElement('div');
      label.className = 'album-label';
      label.textContent = section.album;
      upgradeList.appendChild(label);

      section.tracks.forEach(track => {
        const owned = state.owned[track.id] || 0;
        const cost = calcCost(track.baseCost, owned);

        const item = document.createElement('div');
        item.className = 'upgrade' + (state.points >= cost ? '' : ' locked');

        const meta = document.createElement('div');
        meta.className = 'meta';
        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = track.title;
        const small = document.createElement('div');
        small.className = 'cost';
        small.textContent = `Custa: ${formatNumber(cost)} · possui: ${owned}`;
        meta.appendChild(name);
        meta.appendChild(small);

        const btn = document.createElement('button');
        btn.className = 'buy-btn';
        btn.textContent = 'Comprar';
        btn.disabled = state.points < cost;
        btn.addEventListener('click', () => buyUpgrade(track));

        item.appendChild(meta);
        item.appendChild(btn);
        upgradeList.appendChild(item);
      });
    });
}

function updateUI() {
  if (counterEl) counterEl.textContent = formatNumber(state.points);
  if (perClickEl) perClickEl.textContent = state.perClick;
  if (cpsEl) cpsEl.textContent = Math.round(state.cps);
  renderUpgrades();
  updateTheme();
}

/* -------------------- Compra / lógica -------------------- */
function buyUpgrade(track) {
  const owned = state.owned[track.id] || 0;
  const cost = calcCost(track.baseCost, owned);
  if (state.points < cost) return;

  state.points -= cost;
  state.owned[track.id] = owned + 1;
  state.cps += track.cps || 0;

  if (track.isFinal && finalModal) {
    setTimeout(() => finalModal.classList.add('show'), 600);
  }

  updateUI();
  save();
}

/* -------------------- Click / CPS loop -------------------- */
if (clicker) {
  clicker.addEventListener('click', () => {
    state.points += state.perClick;
    updateUI();
    save();
  });
}

/* CPS ticking (10x per second smoothing) */
setInterval(() => {
  state.points += state.cps / 10;
  updateUI();
}, 100);

/* -------------------- Init -------------------- */
load();
recalcCpsFromOwned();
updateUI();

if (closeModalBtn && finalModal) {
  closeModalBtn.addEventListener('click', () => finalModal.classList.remove('show'));
}
