const summit = document.querySelector('#summit');
const climberLayer = document.querySelector('#climbers');
const tooltip = document.querySelector('#tooltip');
const dimension = document.querySelector('#dimension');
let showAll = false;
let selected = null;

const labels = document.createElement('div');
labels.className = 'mountain-labels';
labels.innerHTML = ''; 
summit.append(labels);
const scale = document.createElement('div');
scale.className = 'mountain-scale';
scale.textContent = 'Score / 100';
summit.append(scale);

function showEntry(entry, button) {
  document.querySelectorAll('.climber.selected').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('.leaderboard .is-highlighted').forEach(el => el.classList.remove('is-highlighted'));
  button.classList.add('selected');
  document.querySelector(`[data-model-id="${entry.id}"]`)?.classList.add('is-highlighted');
  const metric = entry.dimensions[dimension.value];
  tooltip.replaceChildren();
  const title = document.createElement('strong');
  title.textContent = entry.model_name;
  const stats = document.createElement('div');
  stats.className = 'stats';
  for (const [value, label] of [[metric.score.toFixed(2), 'SCORE'], [metric.successRate.toFixed(2) + '%', 'SUCCESS RATE']]) {
    const stat = document.createElement('span');
    const number = document.createElement('b');
    number.textContent = value;
    stat.append(number, document.createTextNode(label));
    stats.append(stat);
  }
  tooltip.append(title, stats);
  tooltip.hidden = false;
}

function clearEntry() {
  if (selected !== null) return;
  tooltip.hidden = true;
  document.querySelectorAll('.climber.selected, .leaderboard .is-highlighted').forEach(el => {
    el.classList.remove('selected', 'is-highlighted');
  });
}

function renderMountain() {
  const entries = [...benchmarkEntries]
    .sort((a, b) => b.dimensions[dimension.value].score - a.dimensions[dimension.value].score || b.dimensions[dimension.value].successRate - a.dimensions[dimension.value].successRate)
    .map((entry, i) => ({ ...entry, displayRank: i + 1 }));
  const visible = showAll ? entries : entries.slice(0, 10);
  const box = summit.getBoundingClientRect();
  const geometry = Jt(visible, dimension.value, 'score', { width: box.width, height: box.height, markerPx: box.width < 520 ? 24 : 30 }, { variant: 'dual' });
  window.mountainGeometry = geometry.climbers;
  window.dispatchEvent(new Event('mountain-layout'));
  climberLayer.replaceChildren();
  selected = null;
  tooltip.hidden = true;
  for (const point of geometry.climbers) {
    const entry = point.entry;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'climber';
    button.style.left = point.x + '%';
    button.style.top = point.y + '%';
    button.style.setProperty('--i', Math.min(entry.displayRank - 1, 18));
    button.dataset.entry = entry.id;
    button.setAttribute('aria-label', `${entry.model_name}, rank ${entry.displayRank}, score ${point.score.toFixed(2)}, success rate ${point.successRate.toFixed(2)} percent`);
    const badge = document.createElement('span');
    badge.className = 'badge';
    // Use the benchmark's model/team icon; preserve a visible fallback on errors.
    const fallback = entry.model_name.replace(/[^a-zA-Z0-9π]/g, '').slice(0, 2).toUpperCase();
    badge.textContent = fallback;
    const iconPath = modelIcons[entry.model_name];
    if (iconPath) {
      const icon = document.createElement('img');
      icon.alt = '';
      icon.addEventListener('load', () => badge.classList.add('has-icon'));
      icon.addEventListener('error', () => { icon.remove(); badge.classList.remove('has-icon'); });
      icon.src = iconPath;
      badge.append(icon);
    }
    const rankMark = document.createElement('span');
    rankMark.className = 'climber-rank';
    rankMark.textContent = entry.displayRank;
    button.append(rankMark);
    button.append(badge);
    if (entry.displayRank === 1) {
      const label = document.createElement('span');
      label.className = 'leader-label';
      label.textContent = `${entry.model_name} · ${point.score.toFixed(2)}`;
      button.append(label);
    }
    button.addEventListener('mouseenter', () => { if (selected === null) showEntry(entry, button); });
    button.addEventListener('mouseleave', clearEntry);
    button.addEventListener('focus', () => showEntry(entry, button));
    button.addEventListener('blur', clearEntry);
    button.addEventListener('click', () => {
      if (selected === entry.id) { selected = null; clearEntry(); }
      else { selected = entry.id; showEntry(entry, button); }
    });
    climberLayer.append(button);
  }

}
dimension.addEventListener('change', renderMountain);
document.querySelector('#toggle-models').addEventListener('click', event => {
  showAll = !showAll;
  event.currentTarget.textContent = showAll ? 'Show top 10 −' : 'Show all models +';
  event.currentTarget.setAttribute('aria-expanded', String(showAll));
  renderMountain();
});
document.querySelector('#replay').addEventListener('click', () => { renderMountain(); window.replayKai?.(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { selected = null; clearEntry(); } });
summit.addEventListener('click', event => { if (!event.target.closest('.climber')) { selected = null; clearEntry(); } });
let resizeTimer;
new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderMountain, 100); }).observe(summit);
renderMountain();
