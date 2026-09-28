const entries = document.querySelector('#entries');
const empty = document.querySelector('#empty');
const filterButtons = [...document.querySelectorAll('[data-filter]')];

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
  const typeLabel = {blogs: 'Writing', projects: 'Project', misc: 'Note', papers: 'Paper', agenda: 'Agenda'}[item.type] || item.type;
  link.innerHTML = `
    <span class="number">${item.id}</span>
    <span class="type">${typeLabel}</span>
    <span class="title">${item.title}</span>
    <time datetime="${item.year}">${item.year}</time>
    <span class="link" aria-hidden="true">↗</span>
  `;
  link.setAttribute('aria-label', `${typeLabel}: ${item.title}, ${item.year}`);
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
