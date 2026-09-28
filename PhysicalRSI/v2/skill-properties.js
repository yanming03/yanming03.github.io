(() => {
  const root = document.querySelector('#skill-properties');
  if (!root) return;
  const load = video => {
    if (!video.getAttribute('src')) {
      video.src = video.dataset.src;
      video.load();
    }
  };
  const video = root.querySelector('#composition-video');
  const buttons = [...root.querySelectorAll('[data-property-seek]')];
  const lines = [...root.querySelectorAll('[data-code-stage]')];
  function sync() {
    let current = 0;
    buttons.forEach((button, i) => {
      if (video.currentTime >= Number(button.dataset.propertySeek)) current = i;
    });
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === current)));
    lines.forEach(line => line.classList.toggle('is-active', Number(line.dataset.codeStage) === current));
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    load(video);
    const seek = () => {
      video.currentTime = Number(button.dataset.propertySeek);
      video.play().catch(() => {});
      sync();
    };
    if (video.readyState >= 1) seek();
    else video.addEventListener('loadedmetadata', seek, {once: true});
  }));
  video.addEventListener('timeupdate', sync);
  video.addEventListener('seeked', sync);
  sync();
})();
