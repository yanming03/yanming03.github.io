const entries = document.querySelector('#entries');
const empty = document.querySelector('#empty');
const filterButtons = [...document.querySelectorAll('[data-filter]')];

const CATGIRL_STATES = {
  idle: { eyes: ['⌐', '¬'], mouth: '─' },
  curious: { eyes: ['◔', '◔'], mouth: '·' },
  happy: { eyes: ['⌒', '⌒'], mouth: 'ᴗ' },
  annoyed: { eyes: ['>', '<'], mouth: '︿' },
  surprised: { eyes: ['○', '○'], mouth: 'o' },
  thinking: { eyes: ['◔', '─'], mouth: '…' },
  sleeping: { eyes: ['─', '─'], mouth: '﹏' },
  talking: { eyes: ['⌐', '¬'], mouth: 'ᵕ' }
};

const catgirl = document.querySelector('#catgirl');
let catgirlResetTimer;

function renderCatgirl(stateName = 'idle') {
  const state = CATGIRL_STATES[stateName] ?? CATGIRL_STATES.idle;
  const [leftEye, rightEye] = state.eyes;

  return String.raw`
       /\   /\
      /  \_/  \
     /  /   \  \
    |  ${leftEye}     ${rightEye}  |
    |     ${state.mouth}     |
     \   ___   /
      \_______/
        /| |\
       / | | \
    `.trim();
}

function setCatgirlState(stateName, resetAfter = 0) {
  window.clearTimeout(catgirlResetTimer);
  catgirl.textContent = renderCatgirl(stateName);
  catgirl.dataset.state = stateName;
  catgirl.setAttribute('aria-label', `pixel catgirl, ${stateName}; press to interact`);

  if (resetAfter) {
    catgirlResetTimer = window.setTimeout(() => setCatgirlState('idle'), resetAfter);
  }
}

function interactWithCatgirl() {
  setCatgirlState('annoyed', 900);
}

setCatgirlState('idle');
catgirl.addEventListener('mouseenter', () => setCatgirlState('curious'));
catgirl.addEventListener('mouseleave', () => setCatgirlState('idle'));
catgirl.addEventListener('focus', () => setCatgirlState('curious'));
catgirl.addEventListener('blur', () => setCatgirlState('idle'));
catgirl.addEventListener('click', interactWithCatgirl);
catgirl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    interactWithCatgirl();
  }
});

function render(filter = 'all') {
  const visible = window.CONTENT.filter((item) => filter === 'all' || item.type === filter);
  entries.replaceChildren(...visible.map(createEntry));
  empty.hidden = visible.length > 0;
}

function createEntry(item) {
  const row = document.createElement('li');
  row.className = 'entry';
  row.id = `entry-${item.id}`;
  row.dataset.type = item.type;

  const link = document.createElement('a');
  link.href = item.href;
  link.innerHTML = `
    <span class="number">${item.id}</span>
    <span class="type">${item.type}</span>
    <span class="title">${item.title}</span>
    <time datetime="${item.year}">${item.year}</time>
    <span class="link" aria-hidden="true">-&gt;</span>
  `;
  link.setAttribute('aria-label', `${item.type}: ${item.title}, ${item.year}`);
  row.append(link);
  return row;
}

function setFilter(filter) {
  filterButtons.forEach((button) => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  render(filter);
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => setFilter(button.dataset.filter));
});

document.querySelectorAll('[data-filter-link]').forEach((link) => {
  link.addEventListener('click', () => setFilter(link.dataset.filterLink));
});

window.addEventListener('DOMContentLoaded', () => {
  render();
});
