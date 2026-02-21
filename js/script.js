

'use strict';

/* ── State ── */
let rawData      = [];
let filteredData = [];
let visibleCols  = [];
let charts       = {};
let currentPage  = 1;
const PAGE_SIZE  = 25;
let searchQuery  = '';
let sortCol      = null;
let sortDir      = 1;

/* ════════════════════════
   SIDEBAR
════════════════════════ */
function toggleSidebar() {
  const sb  = document.getElementById('sidebar');
  const ov  = document.getElementById('overlay');
  const hbg = document.getElementById('hamburger');
  const open = sb.classList.toggle('open');
  ov.classList.toggle('open', open);
  hbg.setAttribute('aria-expanded', String(open));
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('hamburger').setAttribute('aria-expanded', 'false');
}

/* ════════════════════════
   NAVIGATION
════════════════════════ */
function showSection(name) {
  document.getElementById('section-upload').style.display    = (name === 'upload')    ? 'block' : 'none';
  document.getElementById('section-dashboard').style.display = (name === 'dashboard') ? 'block' : 'none';
  document.getElementById('topbar-title').textContent = name === 'upload' ? 'Import Data' : 'Dashboard';
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const items = document.querySelectorAll('.nav-item');
  if (name === 'upload')    items[0].classList.add('active');
  if (name === 'dashboard') items[1].classList.add('active');
  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function goToTable() {
  if (!rawData.length) return;
  showSection('dashboard');
  setTimeout(() => document.getElementById('data-table-section').scrollIntoView({ behavior: 'smooth' }), 120);
}

/* ════════════════════════
   FILE UPLOAD
════════════════════════ */
function triggerUpload() { document.getElementById('file-input').click(); }

function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.add('drag-over');
}
function handleDragLeave() {
  document.getElementById('drop-zone').classList.remove('drag-over');
}
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
}
function handleFileInput(e) {
  const file = e.target.files[0];
  if (file) processFile(file);
  e.target.value = '';
}

function processFile(file) {
  const ext     = file.name.split('.').pop().toLowerCase();
  const allowed = ['csv','json','tsv','txt'];
  if (!allowed.includes(ext)) {
    return toast(`Unsupported type ".${ext}". Use CSV, JSON, or TSV.`, 'error');
  }
  showProgress(true);
  setProgress(10, 'Reading file…');

  const reader = new FileReader();
  reader.onload = (ev) => {
    setProgress(50, 'Parsing data…');
    try {
      let data;
      if (ext === 'json') {
        const parsed = JSON.parse(ev.target.result);
        data = Array.isArray(parsed) ? parsed : (parsed.data || Object.values(parsed)[0]);
        if (!Array.isArray(data)) throw new Error('JSON must be a top-level array of objects.');
      } else {
        const delim  = ext === 'tsv' ? '\t' : ',';
        const result = Papa.parse(ev.target.result.trim(), {
          header: true, delimiter: delim,
          skipEmptyLines: true, dynamicTyping: true,
        });
        if (result.errors.length && !result.data.length) throw new Error(result.errors[0].message);
        data = result.data;
      }
      if (!data || data.length === 0) throw new Error('No rows found. Check your file format.');
      setProgress(80, 'Building visualizations…');
      setTimeout(() => {
        loadData(data, file.name);
        setProgress(100, 'Done!');
        setTimeout(() => showProgress(false), 700);
        document.getElementById('file-info').textContent = `${file.name} · ${data.length.toLocaleString()} rows`;
      }, 250);
    } catch (err) {
      showProgress(false);
      toast(`Parse error: ${err.message}`, 'error');
    }
  };
  reader.onerror = () => { showProgress(false); toast('Failed to read file.', 'error'); };
  reader.readAsText(file);
}

function showProgress(show) {
  document.getElementById('upload-progress').style.display = show ? 'block' : 'none';
}
function setProgress(pct, text) {
  document.getElementById('progress-bar').style.width  = pct + '%';
  document.getElementById('progress-text').textContent = text;
  document.getElementById('progress-pct').textContent  = pct + '%';
}

/* ════════════════════════
   SAMPLE DATA
════════════════════════ */
function loadSample(type) {
  const months   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const regions  = ['North','South','East','West','Central'];
  const products = ['Widget A','Widget B','Widget C','Gadget X','Gadget Y'];
  const depts    = ['Engineering','Marketing','Sales','HR','Finance','Design'];
  const statuses = ['Delivered','Pending','Shipped','Cancelled'];
  let data;

  if (type === 'sales') {
    data = months.flatMap(m =>
      products.slice(0,3).map(p => ({
        Month:   m,
        Product: p,
        Revenue: Math.round(Math.random() * 50000 + 5000),
        Units:   Math.round(Math.random() * 200 + 20),
        Region:  regions[Math.floor(Math.random() * regions.length)],
        Margin:  +(Math.random() * 0.4 + 0.1).toFixed(2),
      }))
    );
  } else if (type === 'employees') {
    data = Array.from({ length: 80 }, (_, i) => ({
      EmployeeID: `E${1000 + i}`,
      Name:       `Employee ${i + 1}`,
      Department: depts[Math.floor(Math.random() * depts.length)],
      Salary:     Math.round(Math.random() * 100000 + 40000),
      YearsExp:   Math.round(Math.random() * 20 + 1),
      Rating:     +(Math.random() * 2 + 3).toFixed(1),
      Remote:     Math.random() > .5 ? 'Yes' : 'No',
    }));
  } else {
    data = Array.from({ length: 120 }, (_, i) => ({
      OrderID:  `ORD-${10000 + i}`,
      Product:  products[Math.floor(Math.random() * products.length)],
      Category: ['Electronics','Apparel','Books','Food'][Math.floor(Math.random() * 4)],
      Amount:   Math.round(Math.random() * 500 + 10),
      Quantity: Math.round(Math.random() * 10 + 1),
      Status:   statuses[Math.floor(Math.random() * statuses.length)],
      Region:   regions[Math.floor(Math.random() * regions.length)],
    }));
  }
  loadData(data, `${type}_sample.csv`);
  document.getElementById('file-info').textContent = `${type}_sample · ${data.length} rows`;
  toast(`Loaded "${type}" sample dataset`, 'success');
}

/* ════════════════════════
   LOAD DATA
════════════════════════ */
function loadData(data) {
  rawData      = data;
  filteredData = [...rawData];
  visibleCols  = Object.keys(rawData[0]);
  buildKPIs();
  buildCharts();
  buildTable();
  document.getElementById('nav-dashboard').disabled = false;
  document.getElementById('btn-reset').style.display = 'inline-flex';
  showSection('dashboard');
}

function resetDashboard() {
  rawData = []; filteredData = []; visibleCols = [];
  Object.values(charts).forEach(c => { try { c.destroy(); } catch (e) {} });
  charts = {};
  ['kpi-row','table-head','table-body','col-selector','page-btns'].forEach(id => {
    document.getElementById(id).innerHTML = '';
  });
  document.getElementById('nav-dashboard').disabled  = true;
  document.getElementById('btn-reset').style.display = 'none';
  document.getElementById('pagination-info').textContent = 'No data loaded';
  document.getElementById('file-info').textContent = '';
  showSection('upload');
  toast('Dashboard reset', 'info');
}

/* ════════════════════════
   KPIs
════════════════════════ */
function buildKPIs() {
  const cols    = Object.keys(rawData[0]);
  const numCols = cols.filter(c => rawData.some(r => typeof r[c] === 'number'));
  const catCols = cols.filter(c => rawData.some(r => typeof r[c] === 'string'));
  const row     = document.getElementById('kpi-row');
  row.innerHTML = '';

  const kpis = [
    { label: 'Total Rows', value: rawData.length.toLocaleString(), sub: 'records loaded' },
    { label: 'Columns',    value: cols.length,                     sub: 'fields detected' },
  ];

  numCols.slice(0, 2).forEach(col => {
    const vals = rawData.map(r => r[col]).filter(v => typeof v === 'number');
    const sum  = vals.reduce((a, b) => a + b, 0);
    const avg  = sum / vals.length;
    kpis.push({ label: `Total ${col}`, value: fmtNum(sum), sub: `avg ${fmtNum(avg)}` });
  });

  if (catCols.length) {
    const uniq = new Set(rawData.map(r => r[catCols[0]]));
    kpis.push({ label: `Unique ${catCols[0]}`, value: uniq.size, sub: 'distinct values' });
  }

  kpis.slice(0, 5).forEach(k => {
    const card = document.createElement('div');
    card.className = 'kpi-card';
    card.innerHTML = `<div class="kpi-label">${k.label}</div><div class="kpi-value">${k.value}</div><div class="kpi-sub">${k.sub}</div>`;
    row.appendChild(card);
  });
}

function fmtNum(n) {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n % 1 === 0 ? n.toLocaleString() : n.toFixed(2);
}

/* ════════════════════════
   CHARTS
════════════════════════ */
const COLORS = [
  'rgba(0,229,255,.85)', 'rgba(255,79,216,.85)', 'rgba(163,255,112,.85)',
  'rgba(255,201,77,.85)','rgba(100,130,255,.85)', 'rgba(255,120,80,.85)',
  'rgba(0,200,150,.85)', 'rgba(220,80,180,.85)',
];

function getNumCols() { return Object.keys(rawData[0]).filter(c => rawData.some(r => typeof r[c] === 'number')); }
function getCatCols() { return Object.keys(rawData[0]).filter(c => rawData.some(r => typeof r[c] === 'string')); }

function buildCharts() {
  Object.values(charts).forEach(c => { try { c.destroy(); } catch (e) {} });
  charts = {};

  const numCols   = getNumCols();
  const catCols   = getCatCols();
  const sampleRows = rawData.slice(0, 50);
  const labels    = sampleRows.map((row, i) =>
    catCols.length ? String(row[catCols[0]] ?? `Row ${i + 1}`) : `Row ${i + 1}`
  );

  /* Trend */
  if (numCols.length) {
    const col = numCols[0];
    document.getElementById('trend-subtitle').textContent = `${col} over rows`;
    charts.trend = new Chart(document.getElementById('chart-trend'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: col,
          data: sampleRows.map(r => r[col]),
          borderColor: COLORS[0], backgroundColor: 'rgba(0,229,255,.07)',
          fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 6,
        }],
      },
      options: baseOpts(),
    });
  }

  /* Distribution */
  if (catCols.length) {
    const col    = catCols[0];
    const counts = {};
    rawData.forEach(r => { const v = r[col]; counts[v] = (counts[v] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    document.getElementById('dist-subtitle').textContent = `${col} breakdown`;
    charts.dist = new Chart(document.getElementById('chart-dist'), {
      type: 'doughnut',
      data: {
        labels: top.map(e => e[0]),
        datasets: [{ data: top.map(e => e[1]), backgroundColor: COLORS, borderColor: '#161b24', borderWidth: 2 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#6b7a99', font: { family: 'DM Mono', size: 11 }, boxWidth: 12 } },
          tooltip: tooltipOpts(),
        },
      },
    });
  }

  /* Comparison */
  if (catCols.length && numCols.length) {
    const catCol = catCols[0], numCol = numCols[0];
    const agg = {};
    rawData.forEach(r => { const k = r[catCol]; agg[k] = (agg[k] || 0) + (r[numCol] || 0); });
    const top = Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 10);
    charts.comp = new Chart(document.getElementById('chart-comp'), {
      type: 'bar',
      data: {
        labels: top.map(e => e[0]),
        datasets: [{ label: numCol, data: top.map(e => e[1]), backgroundColor: COLORS[0], borderRadius: 5 }],
      },
      options: baseOpts(),
    });
  }

  /* Scatter / fallback */
  if (numCols.length >= 2) {
    const xCol = numCols[0], yCol = numCols[1];
    document.getElementById('scatter-subtitle').textContent = `${xCol} vs ${yCol}`;
    charts.scatter = new Chart(document.getElementById('chart-scatter'), {
      type: 'scatter',
      data: {
        datasets: [{
          label: `${xCol} vs ${yCol}`,
          data: rawData.slice(0, 300).map(r => ({ x: r[xCol], y: r[yCol] })),
          backgroundColor: COLORS[1], pointRadius: 4,
        }],
      },
      options: baseOpts(),
    });
  } else if (catCols.length >= 2) {
    const col    = catCols[1];
    const counts = {};
    rawData.forEach(r => { const v = r[col]; counts[v] = (counts[v] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    charts.scatter = new Chart(document.getElementById('chart-scatter'), {
      type: 'bar',
      data: {
        labels: top.map(e => e[0]),
        datasets: [{ label: col, data: top.map(e => e[1]), backgroundColor: COLORS[4], borderRadius: 5 }],
      },
      options: baseOpts(),
    });
  }
}

function tooltipOpts() {
  return {
    backgroundColor: '#161b24', titleColor: '#e8edf5',
    bodyColor: '#6b7a99', borderColor: '#1f2535', borderWidth: 1, padding: 10,
  };
}

function baseOpts() {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#6b7a99', font: { family: 'DM Mono', size: 11 } } },
      tooltip: tooltipOpts(),
    },
    scales: {
      x: { grid: { color: '#1f253540' }, ticks: { color: '#6b7a99', font: { family: 'DM Mono', size: 10 }, maxRotation: 45 } },
      y: { grid: { color: '#1f253540' }, ticks: { color: '#6b7a99', font: { family: 'DM Mono', size: 10 } } },
    },
  };
}

function setChartType(key, type, btn) {
  btn.closest('.chart-actions').querySelectorAll('.btn-chart').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const chart = charts[key];
  if (!chart) return;
  if (type === 'area') {
    chart.config.type = 'line';
    if (chart.data.datasets[0]) chart.data.datasets[0].fill = true;
  } else if (type === 'hbar') {
    chart.config.type = 'bar';
    chart.options.indexAxis = 'y';
  } else {
    chart.config.type = type;
    delete chart.options.indexAxis;
    if (chart.data.datasets[0] && type === 'line') chart.data.datasets[0].fill = false;
  }
  chart.update();
}

/* ════════════════════════
   TABLE
════════════════════════ */
function buildTable() {
  if (!rawData.length) return;
  visibleCols = Object.keys(rawData[0]);
  renderColSelector();
  renderTable();
}

function renderColSelector() {
  const sel = document.getElementById('col-selector');
  sel.innerHTML = '<span style="font-family:var(--fm);font-size:.7rem;color:var(--muted);flex-shrink:0">Columns:</span>';
  Object.keys(rawData[0]).forEach(col => {
    const badge = document.createElement('div');
    badge.className = 'col-badge active';
    badge.setAttribute('role', 'checkbox');
    badge.setAttribute('aria-checked', 'true');
    badge.setAttribute('tabindex', '0');
    badge.innerHTML = `<span>✓</span>${col}`;
    badge.dataset.col = col;
    const toggle = () => {
      if (visibleCols.includes(col)) {
        if (visibleCols.length === 1) return;
        visibleCols = visibleCols.filter(c => c !== col);
        badge.classList.remove('active');
        badge.querySelector('span').textContent = '+';
        badge.setAttribute('aria-checked', 'false');
      } else {
        visibleCols.push(col);
        badge.classList.add('active');
        badge.querySelector('span').textContent = '✓';
        badge.setAttribute('aria-checked', 'true');
      }
      renderTable();
    };
    badge.onclick   = toggle;
    badge.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } };
    sel.appendChild(badge);
  });
}

function filterTable(q) {
  searchQuery  = q.toLowerCase();
  currentPage  = 1;
  filteredData = rawData.filter(row =>
    Object.values(row).some(v => String(v ?? '').toLowerCase().includes(searchQuery))
  );
  renderTable();
}

function sortTable(col) {
  sortDir = (sortCol === col) ? sortDir * -1 : 1;
  sortCol = col;
  filteredData.sort((a, b) => {
    const av = a[col], bv = b[col];
    if (av == null) return 1; if (bv == null) return -1;
    return av < bv ? -sortDir : av > bv ? sortDir : 0;
  });
  renderTable();
}

function renderTable() {
  const head  = document.getElementById('table-head');
  const tbody = document.getElementById('table-body');

  head.innerHTML = '<tr>' + visibleCols.map(c => {
    const arrow  = sortCol === c ? (sortDir === 1 ? ' ↑' : ' ↓') : '';
    const safeC  = c.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return `<th onclick="sortTable('${safeC}')">${c}${arrow}</th>`;
  }).join('') + '</tr>';

  const start = (currentPage - 1) * PAGE_SIZE;
  const page  = filteredData.slice(start, start + PAGE_SIZE);
  tbody.innerHTML = page.map(row =>
    '<tr>' + visibleCols.map(c => {
      const v = row[c] ?? '';
      return `<td>${String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>`;
    }).join('') + '</tr>'
  ).join('');

  const total = filteredData.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  document.getElementById('pagination-info').textContent =
    `Showing ${total ? start + 1 : 0}–${Math.min(start + PAGE_SIZE, total)} of ${total.toLocaleString()} rows`;

  const btnsEl = document.getElementById('page-btns');
  btnsEl.innerHTML = '';
  const mkBtn = (label, pg, active) => {
    const b = document.createElement('button');
    b.className  = 'page-btn' + (active ? ' active' : '');
    b.textContent = label;
    b.onclick     = () => { currentPage = pg; renderTable(); };
    return b;
  };
  if (currentPage > 1)    btnsEl.appendChild(mkBtn('‹', currentPage - 1, false));
  const s = Math.max(1, currentPage - 2);
  const e = Math.min(pages, currentPage + 2);
  for (let p = s; p <= e; p++) btnsEl.appendChild(mkBtn(p, p, p === currentPage));
  if (currentPage < pages) btnsEl.appendChild(mkBtn('›', currentPage + 1, false));
}

/* ════════════════════════
   EXPORT
════════════════════════ */
function exportCSV() {
  if (!rawData.length) return toast('No data to export.', 'error');
  const cols = visibleCols;
  const csv  = [
    cols.join(','),
    ...filteredData.map(row =>
      cols.map(c => {
        const v = row[c] ?? '';
        return (typeof v === 'string' && /[,"\n]/.test(v)) ? `"${v.replace(/"/g,'""')}"` : v;
      }).join(',')
    ),
  ].join('\n');
  download('datapulse_export.csv', csv, 'text/csv');
  toast('CSV exported!', 'success');
}

function exportJSON() {
  if (!rawData.length) return toast('No data to export.', 'error');
  const out = filteredData.map(row => {
    const obj = {};
    visibleCols.forEach(c => { obj[c] = row[c]; });
    return obj;
  });
  download('datapulse_export.json', JSON.stringify(out, null, 2), 'application/json');
  toast('JSON exported!', 'success');
}

function exportChartPNG() {
  const canvas = document.getElementById('chart-trend');
  if (!canvas) return toast('No chart available.', 'error');
  const a = document.createElement('a');
  a.download = 'datapulse_chart.png';
  a.href     = canvas.toDataURL('image/png');
  a.click();
  toast('Chart PNG exported!', 'success');
}

function exportAll() {
  if (!rawData.length) { showSection('upload'); return; }
  exportCSV();
}

function printDashboard() { window.print(); }

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ════════════════════════
   TOAST
════════════════════════ */
let toastTimer = null;
function toast(msg, type = 'info') {
  const el   = document.getElementById('toast');
  const icon = { success: '✅', error: '❌', info: 'ℹ️' }[type] || '';
  el.textContent = '';
  el.appendChild(document.createTextNode(`${icon} ${msg}`));
  el.className   = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ════════════════════════
   RESIZE — redraw charts
════════════════════════ */
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    Object.values(charts).forEach(c => { try { c.resize(); } catch (e) {} });
  }, 200);
});

/* ════════════════════════
   THEME SWITCHER
════════════════════════ */
const THEMES = {
  dark:   { icon: '🌙', label: 'Midnight' },
  light:  { icon: '☀️', label: 'Arctic Light' },
  forest: { icon: '🌿', label: 'Forest' },
  ember:  { icon: '🔥', label: 'Ember' },
  violet: { icon: '🔮', label: 'Violet Dusk' },
};
let currentTheme = 'dark';

function toggleThemePanel() {
  const panel = document.getElementById('theme-panel');
  const btn   = document.getElementById('btn-theme');
  const open  = panel.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(open));
}

function applyTheme(theme, optEl) {
  currentTheme = theme;
  /* Remove all theme data attrs */
  const html = document.documentElement;
  html.removeAttribute('data-theme');
  if (theme !== 'dark') html.setAttribute('data-theme', theme);

  /* Update meta theme-color for mobile */
  const metaColor = { dark:'#0a0c10', light:'#f0f4fa', forest:'#080e0a', ember:'#0e0905', violet:'#09080f' };
  document.querySelector('meta[name="theme-color"]').content = metaColor[theme] || '#0a0c10';

  /* Update topbar icon */
  document.getElementById('theme-icon').textContent = THEMES[theme]?.icon || '🎨';

  /* Update active state */
  document.querySelectorAll('.theme-option').forEach(el => el.classList.remove('active'));
  if (optEl) optEl.classList.add('active');

  /* Close panel */
  document.getElementById('theme-panel').classList.remove('open');
  document.getElementById('btn-theme').setAttribute('aria-expanded', 'false');

  /* Persist */
  try { localStorage.setItem('dp-theme', theme); } catch (e) {}

  /* Redraw chart colors for new theme */
  const isDark = theme !== 'light';
  const tickColor  = isDark ? '#6b7a99' : '#556080';
  const gridColor  = isDark ? '#1f253540' : '#dde3ef80';
  const legendColor = tickColor;
  Object.values(charts).forEach(c => {
    try {
      if (c.options.scales) {
        ['x','y'].forEach(ax => {
          if (c.options.scales[ax]) {
            c.options.scales[ax].grid.color  = gridColor;
            c.options.scales[ax].ticks.color = tickColor;
          }
        });
      }
      if (c.options.plugins?.legend?.labels) {
        c.options.plugins.legend.labels.color = legendColor;
      }
      c.update('none');
    } catch (e) {}
  });

  toast(`Theme: ${THEMES[theme]?.label}`, 'info');
}

/* Restore saved theme on load */
(function () {
  try {
    const saved = localStorage.getItem('dp-theme');
    if (saved && THEMES[saved]) {
      const opt = document.querySelector(`.theme-option[data-theme="${saved}"]`);
      applyTheme(saved, opt);
    }
  } catch (e) {}
})();

/* Close theme panel when clicking outside */
document.addEventListener('click', function (e) {
  const panel = document.getElementById('theme-panel');
  const btn   = document.getElementById('btn-theme');
  if (panel.classList.contains('open') && !panel.contains(e.target) && !btn.contains(e.target)) {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
});

/* ════════════════════════════════════════
   DEVTOOLS / INSPECT PROTECTION
   Blocks F12, Ctrl+Shift+I/J/U/C,
   right-click context menu, text selection,
   and detects open devtools via timing.
════════════════════════════════════════ */
(function _protect() {

  /* 1. Block right-click */
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  /* 2. Block keyboard shortcuts */
  document.addEventListener('keydown', function (e) {
    const k = e.key;
    /* F12 */
    if (k === 'F12') { e.preventDefault(); return false; }
    /* Ctrl/Cmd + Shift + I / J / C */
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'I' || k === 'i' || k === 'J' || k === 'j' || k === 'C' || k === 'c')) {
      e.preventDefault(); return false;
    }
    /* Ctrl/Cmd + U (view source) */
    if ((e.ctrlKey || e.metaKey) && (k === 'U' || k === 'u')) {
      e.preventDefault(); return false;
    }
    /* Ctrl/Cmd + S (save page) */
    if ((e.ctrlKey || e.metaKey) && (k === 'S' || k === 's')) {
      e.preventDefault(); return false;
    }
    /* Ctrl/Cmd + A (select all) */
    if ((e.ctrlKey || e.metaKey) && (k === 'A' || k === 'a')) {
      e.preventDefault(); return false;
    }
  });

  /* 3. Disable text selection */
  document.addEventListener('selectstart', function (e) { e.preventDefault(); });

  /* 4. Disable drag */
  document.addEventListener('dragstart', function (e) { e.preventDefault(); });

  /* 5. DevTools size-detection — redirects if panel is open */
  const _threshold = 160;
  function _checkDevTools() {
    const widthGap  = window.outerWidth  - window.innerWidth;
    const heightGap = window.outerHeight - window.innerHeight;
    if (widthGap > _threshold || heightGap > _threshold) {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100dvh;background:#0a0c10;font-family:monospace;color:#ff5c5c;font-size:1.1rem;text-align:center;padding:24px;">🚫 Developer tools detected.<br>Please close DevTools to use this application.</div>';
    }
  }
  setInterval(_checkDevTools, 1000);
  window.addEventListener('resize', _checkDevTools);

  /* 6. Console warning */
  const _w = '%cSTOP!';
  const _s = 'color:red;font-size:2rem;font-weight:bold;';
  const _m = '%cThis application is protected. Do not paste or run code here.';
  const _s2 = 'color:#ff5c5c;font-size:1rem;';
  console.log(_w, _s); console.log(_m, _s2);

  
})();
