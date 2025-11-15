// Tiny utility for DOM
const $ = (sel, el = document) => el.querySelector(sel);

// --- QR helpers ---
// --- QR helpers ---
const PUBLIC_URL = 'https://antonistheo07.github.io/qr-menu/';

function currentMenuURL() {
  return PUBLIC_URL;
}


let qrInstance = null;
function renderQR(urlString) {
  const box = document.getElementById('qrcode');
  box.innerHTML = ''; // clear previous
  qrInstance = new QRCode(box, {
    text: urlString,
    width: 180,
    height: 180,
    correctLevel: QRCode.CorrectLevel.M // L, M, Q, H
  });
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function downloadQR(filename = 'qr-menu.png') {
  // qrcode.js draws a canvas; turn it into a PNG download
  const canvas = document.querySelector('#qrcode canvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}


// Config
const CURRENCY = { symbol: '€', position: 'prefix' }; // change to '$' etc.
const MENU_JSON_URL = 'data/menu.json';

// State
let MENU = [];
let activeCategory = 'All';
let debounceTimer = null;

function formatPrice(value) {
  // Supports numbers, numeric strings, "MP", and empty
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string' && value.trim().toUpperCase() === 'MP') return 'MP';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  const formatted = num.toFixed(num % 1 === 0 ? 0 : 2);
  return CURRENCY.position === 'prefix'
    ? `${CURRENCY.symbol}${formatted}`
    : `${formatted}${CURRENCY.symbol}`;
}

function setStatus(msg) {
  const el = $('#menu-status');
  if (!el) return;
  el.textContent = msg || '';
}

function showSkeletons(count = 6) {
  const grid = $('#menu');
  grid.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const sk = document.createElement('div');
    sk.className = 'skeleton';
    grid.appendChild(sk);
  }
}

function renderCategories(items) {
  const cats = Array.from(new Set(items.map(i => i.category))).sort();
  const container = $('#categories');
  container.innerHTML = '';

  const all = document.createElement('button');
  all.className = 'chip' + (activeCategory === 'All' ? ' active' : '');
  all.textContent = 'All';
  all.onclick = () => { activeCategory = 'All'; renderMenu(); highlightActive(); };
  container.appendChild(all);

  cats.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'chip' + (activeCategory === c ? ' active' : '');
    btn.textContent = c;
    btn.onclick = () => { activeCategory = c; renderMenu(); highlightActive(); };
    container.appendChild(btn);
  });

  function highlightActive() {
    [...container.children].forEach(chip => {
      chip.classList.toggle('active', chip.textContent === activeCategory);
      if (activeCategory === 'All') container.firstChild.classList.add('active');
    });
  }
}

function badgeText(item) {
  const bits = [];
  if (item.veg) bits.push('🌱');
  if (item.spicy >= 1) bits.push('🌶'.repeat(Math.min(3, item.spicy)));
  return bits.join(' ');
}

function renderMenu() {
  const grid = $('#menu');
  const q = ($('#search').value || '').toLowerCase().trim();

  const filtered = MENU.filter(item => {
    if (item.available === false) return false; // hide unavailable; or show and label—your call
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q) ||
      (item.tags || []).some(t => String(t).toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `<p style="color: var(--muted)">No items found.</p>`;
    return;
  }

  for (const item of filtered) {
    const card = document.createElement('article');
    card.className = 'card';

    // Image (optional)
    const img = document.createElement('img');
    img.className = 'item-img';
    if (item.image) {
      img.src = item.image;
      img.alt = item.name;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.onerror = () => { img.style.display = 'none'; };
      img.style.display = 'block';
    }

    // Title + Price row
    const titleRow = document.createElement('div');
    titleRow.className = 'title-row';

    const title = document.createElement('h3');
    const badges = badgeText(item);
    title.textContent = badges ? `${item.name} ${badges}` : item.name;

    const price = document.createElement('p');
    price.className = 'price';
    price.textContent = formatPrice(item.price);

    // Description
    const desc = document.createElement('p');
    desc.textContent = item.description || '';

    titleRow.appendChild(title);
    titleRow.appendChild(price);

    if (img.style.display === 'block') card.appendChild(img);
    card.appendChild(titleRow);
    card.appendChild(desc);

    grid.appendChild(card);
  }
}

async function loadMenu() {
  setStatus('Loading menu…');
  showSkeletons(6);
  try {
    const res = await fetch(MENU_JSON_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    MENU = Array.isArray(data) ? data : data.items || [];
    setStatus('');
    renderCategories(MENU);
    renderMenu();
  } catch (err) {
    console.error(err);
    setStatus('Could not load menu. If you opened index.html directly, run with Live Server.');
    $('#menu').innerHTML = `
      <p style="color: var(--muted)">
        Error loading <code>${MENU_JSON_URL}</code>. Check file path and try again.
      </p>`;
  }
}



// Small debounce so typing in search feels smoother
function debounce(fn, ms = 200) {
  return (...args) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fn(...args), ms);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  $('#year').textContent = new Date().getFullYear();
  $('#search').addEventListener('input', debounce(renderMenu, 180));
  loadMenu();

    const url = currentMenuURL();
  renderQR(url);

  document.getElementById('copy-link').addEventListener('click', async () => {
    const ok = await copyText(url);
    document.getElementById('copy-link').textContent = ok ? 'Copied!' : 'Copy failed';
    setTimeout(() => (document.getElementById('copy-link').textContent = 'Copy link'), 1200);
  });

  document.getElementById('download-qr').addEventListener('click', () => downloadQR());

});
