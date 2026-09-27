(() => {
  const section = document.querySelector('.experiments-section');
  if (!section) return;
  function metric(scope, key) {
    scope.querySelectorAll('[data-exp-value]').forEach(el => { el.textContent = Number(el.dataset[key]).toFixed(1); });
    scope.querySelectorAll('[data-exp-bar]').forEach(el => { el.style.setProperty('--bar', `${el.dataset[key]}%`); });
    const caption = scope.querySelector('table caption');
    if (caption) caption.textContent = `${key === 'sr' ? 'Success rate (%)' : 'Score out of 100'}. Local evaluation and historical reference models.`;
  }
  const main = section.querySelector('#main-result');
  main.querySelectorAll('[data-exp-metric]').forEach(button => button.addEventListener('click', () => {
    main.querySelectorAll('[data-exp-metric]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    metric(main, button.dataset.expMetric);
  }));
  const caseTabs = [...section.querySelectorAll('[data-case-tab]')];
  const panels = [...section.querySelectorAll('.comparison-case')];
  function selectCase(index) {
    caseTabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
  }
  caseTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectCase(index));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = (index + 1) % caseTabs.length;
      else if (event.key === 'ArrowLeft') target = (index + caseTabs.length - 1) % caseTabs.length;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = caseTabs.length - 1;
      else return;
      event.preventDefault(); selectCase(target); caseTabs[target].focus();
    });
  });
})();
