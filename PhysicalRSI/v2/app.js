(() => {
  const summit = document.querySelector('#summit');
  const layer = document.querySelector('#climbers');
  const tooltip = document.querySelector('#tooltip');
  const dimension = document.querySelector('#dimension');
  const toggle = document.querySelector('#toggle-models');
  const status = document.querySelector('#mountain-selection');
  const chart = document.querySelector('.mountain-figure');
  const legend = document.createElement('div');
  legend.className = 'mountain-model-list';
  legend.setAttribute('aria-label', 'All benchmark models');
  chart.append(legend);
  // Keep the relief large enough for all icons; the model list also works on touch screens.
  const scroller = document.createElement('div');
  scroller.className = 'mountain-scroll';
  summit.before(scroller); scroller.append(summit);
  scroller.append(document.querySelector('.official-summit-score'), tooltip);
  let scale = 1;
  let showAll = true;
  let selected = null;
  let hovered = null;
  let points = [];
  const buttons = new Map();
  const listButtons = new Map();
  const title = document.createElement('strong');
  const stats = document.createElement('div');
  stats.className = 'stats';
  tooltip.replaceChildren(title, stats);
  function icon(entry) {
    const img = document.createElement('img');
    img.src = modelIcons[entry.model_name] || 'brand/physicalrsi-v2.svg';
    img.alt = ''; img.draggable = false;
    img.addEventListener('error', () => {
      const fallback = document.createElement('span');
      fallback.className = 'model-fallback';
      fallback.textContent = entry.model_name.replace(/[^a-z0-9]/gi, '').slice(0, 2);
      img.replaceWith(fallback);
    }, { once: true });
    return img;
  }
  function dismiss() { selected = hovered = null; paintSelection(); }
  function paintSelection() {
    const id = selected ?? hovered;
    const point = points.find(p => p.entry.id === id);
    for (const [key, button] of buttons) {
      button.classList.toggle('selected', key === id);
      button.setAttribute('aria-pressed', String(key === selected));
    }
    for (const [key, button] of listButtons) {
      button.classList.toggle('selected', key === id);
      button.setAttribute('aria-pressed', String(key === selected));
    }
    tooltip.hidden = !point;
    if (!point) { status.textContent = `${points.length} models · Select a model to inspect its results.`; return; }
    const {entry, score, successRate} = point;
    const scope = dimension.selectedOptions[0].textContent;
    title.textContent = `${entry.model_name} · ${scope}`;
    stats.replaceChildren(...[[score.toFixed(2), 'Score'], [successRate.toFixed(2) + '%', 'SR']].map(([value, label]) => {
      const s = document.createElement('span'); const b = document.createElement('b');
      b.textContent = value; s.append(b, label); return s;
    }));
    status.textContent = `${entry.model_name} · Score ${score.toFixed(2)} · SR ${successRate.toFixed(2)}%`;
    const w = scroller.clientWidth, h = summit.clientHeight * scale;
    const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
    const x = point.x / 100 * w, y = point.y / 100 * h;
    tooltip.style.left = `${Math.max(8, Math.min(w - tw - 8, x + 22))}px`;
    tooltip.style.top = `${Math.max(100, Math.min(h - th - 8, y - th - 18))}px`;
    // A selected result stays visible when the map is horizontally scrolled on mobile.
    if (selected !== null && scroller.clientWidth < w) {
      scroller.scrollLeft = Math.max(0, Math.min(w - scroller.clientWidth, x - scroller.clientWidth / 2));
    }
  }
  function bind(button, entry) {
    button.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch' && selected === null) { hovered = entry.id; paintSelection(); } });
    button.addEventListener('pointerleave', () => { hovered = null; paintSelection(); });
    button.addEventListener('focus', () => { if (selected === null) { hovered = entry.id; paintSelection(); } });
    button.addEventListener('blur', () => { hovered = null; paintSelection(); });
    button.addEventListener('click', () => { selected = selected === entry.id ? null : entry.id; hovered = null; paintSelection(); });
  }
  function drawRoute() {
    const ours = points.find(p => p.entry.model_name === 'PhysicalRSI');
    const svg = summit.querySelector('.ascent-route');
    svg.hidden = !ours;
    svg.style.display = ours ? '' : 'none';
    if (!ours) return;
    const x = ours.x * 10.24, y = ours.y * 5.9;
    const d = `M480 537 C460 475 560 460 510 390 S${x - 45} ${y + 50} ${x} ${y}`;
    svg.querySelectorAll('path').forEach(p => p.setAttribute('d', d));
    const path = document.querySelector('#kai-trail');
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const length = path.getTotalLength();
      path.animate([{strokeDasharray: `${length}`, strokeDashoffset: length}, {strokeDasharray: `${length}`, strokeDashoffset: 0}], {duration: 1100, easing: 'ease-out'});
    }
  }
  function render() {
    const availableWidth = scroller.clientWidth;
    const mapWidth = Math.max(720, availableWidth);
    scale = availableWidth / mapWidth;
    summit.style.width = `${mapWidth}px`;
    summit.style.transform = `scale(${scale})`;
    scroller.style.height = `${mapWidth * 590 / 1024 * scale}px`;
    const focused = document.activeElement?.dataset?.modelId;
    const wasLegend = legend.contains(document.activeElement);
    const entries = benchmarkEntries.filter(e => e.dimensions[dimension.value]).slice().sort((a,b) => b.dimensions[dimension.value].score - a.dimensions[dimension.value].score || b.dimensions[dimension.value].successRate - a.dimensions[dimension.value].successRate).map((e,i) => ({...e, displayRank:i+1}));
    const visible = showAll ? entries : entries.slice(0, 10);
    const rect = {width:summit.clientWidth, height:summit.clientHeight};
    points = Jt(visible, dimension.value, 'score', {width:rect.width, height:rect.height, markerPx:24}, {variant:'scatter'}).climbers;
    if (!points.some(p => p.entry.id === selected)) selected = null;
    hovered = null;
    layer.replaceChildren(); legend.replaceChildren(); buttons.clear(); listButtons.clear();
    for (const point of points) {
      const {entry,score,successRate} = point;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'climber' + (entry.model_name === 'PhysicalRSI' ? ' ours' : '');
      button.dataset.modelId = entry.id;
      button.style.left = `${point.x}%`; button.style.top = `${point.y}%`;
      button.setAttribute('aria-label', `${entry.model_name}, rank ${entry.displayRank}, score ${score.toFixed(2)}, SR ${successRate.toFixed(2)}%`);
      const badge = document.createElement('span'); badge.className = 'badge'; badge.append(icon(entry));
      button.append(badge); bind(button, entry); layer.append(button); buttons.set(entry.id,button);
      if (entry.model_name === 'PhysicalRSI') {
        const label = document.createElement('span'); label.className = 'leader-label'; label.innerHTML = '<span class="physicalrsi">Physical<span class="brand-rsi">RSI</span></span>'; button.append(label);
      }
      const item = document.createElement('button'); item.type = 'button'; item.dataset.modelId = entry.id;
      item.className = 'model-list-item'; item.setAttribute('aria-label', button.getAttribute('aria-label'));
      const name = document.createElement('span'); name.textContent = entry.model_name;
      const scoreLabel = document.createElement('b'); scoreLabel.textContent = score.toFixed(2);
      item.append(icon(entry), name, scoreLabel); bind(item,entry); legend.append(item); listButtons.set(entry.id,item);
    }
    toggle.setAttribute('aria-expanded',String(showAll)); toggle.textContent = showAll ? 'Show top 10 −' : `Show all ${entries.length} models +`;
    drawRoute(); paintSelection();
    if (focused) (wasLegend ? listButtons : buttons).get(Number(focused))?.focus({preventScroll:true});
  }
  dimension.addEventListener('change', () => { selected = null; render(); });
  toggle.addEventListener('click', () => { showAll = !showAll; render(); });
  document.querySelector('#replay').addEventListener('click', drawRoute);
  summit.addEventListener('click', event => { if (!event.target.closest('.climber')) dismiss(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') dismiss(); });
  let width = 0; let timer;
  new ResizeObserver(() => { const next = scroller.clientWidth; if (next === width) return; width = next; clearTimeout(timer); timer = setTimeout(render, 100); }).observe(scroller);
  render();
})();
