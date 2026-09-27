const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const systemFigure = document.querySelector('.system-figure');
const canvas = document.querySelector('.system-canvas');
const stageTabs = [...document.querySelectorAll('[data-stage][role="tab"]')];
const systemPlay = document.querySelector('#system-play');
let stage = 0;
let pausedSystem = reduceMotion.matches;
let systemVisible = false;
let stageClock;

function setStage(next, followView = false) {
  stage = next;
  canvas.dataset.stage = String(next);
  stageTabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === next));
    tab.tabIndex = i === next ? 0 : -1;
  });
  document.querySelector('#stage-detail').setAttribute('aria-labelledby', `stage-tab-${next}`);
  if (followView) {
    const viewport = document.querySelector('.system-scroll');
    const target = canvas.querySelector(['.reasoner-node', '.router-node', '.skills-node', '.editable-node'][next]);
    if (viewport.scrollWidth > viewport.clientWidth) {
      viewport.scrollTo({ left: target.offsetLeft + target.offsetWidth / 2 - viewport.clientWidth / 2, behavior: reduceMotion.matches ? 'instant' : 'smooth' });
    }
  }
}

function syncSystemPlayback() {
  clearInterval(stageClock);
  const active = !pausedSystem && systemVisible && !document.hidden;
  systemFigure.classList.toggle('is-paused', !active);
  systemPlay.setAttribute('aria-pressed', String(pausedSystem));
  systemPlay.setAttribute('aria-label', pausedSystem ? 'Play system animation' : 'Pause system animation');
  systemPlay.innerHTML = pausedSystem ? '▶ <span>Play</span>' : 'Ⅱ <span>Pause</span>';
  const video = systemFigure.querySelector('video');
  if (active && video.src) video.play().catch(() => {});
  else video.pause();
  if (active) stageClock = setInterval(() => setStage((stage + 1) % 4), 5200);
}

stageTabs.forEach((tab, i) => {
  tab.addEventListener('click', () => { setStage(i, true); pausedSystem = true; syncSystemPlayback(); });
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (i + 1) % 4;
    else if (event.key === 'ArrowLeft') next = (i + 3) % 4;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = 3;
    else return;
    event.preventDefault();
    stageTabs[next].click();
    stageTabs[next].focus();
  });
});
systemPlay.addEventListener('click', () => { pausedSystem = !pausedSystem; syncSystemPlayback(); });
document.querySelectorAll('[data-policy]').forEach(button => {
  button.addEventListener('click', () => {
    canvas.dataset.route = button.dataset.policy;
    document.querySelectorAll('[data-policy]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    setStage(1);
    pausedSystem = true;
    syncSystemPlayback();
  });
});
new IntersectionObserver(entries => {
  systemVisible = entries[0].isIntersecting;
  syncSystemPlayback();
}, { threshold: .15 }).observe(systemFigure);

// Load video data near the viewport; play only while its figure is visible.
const videos = [...document.querySelectorAll('video[data-src]')];
const videoVisible = new WeakMap();
const userPaused = new WeakSet();
const programmaticPause = new WeakSet();
const mediaLoader = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const video = entry.target;
    video.src = video.dataset.src;
    video.load();
    mediaLoader.unobserve(video);
  }
}, { rootMargin: '300px' });
function syncVideo(video) {
  const isSystem = systemFigure.contains(video);
  const allowed = videoVisible.get(video) && !document.hidden && !reduceMotion.matches && !userPaused.has(video) && (!isSystem || !pausedSystem);
  if (allowed && video.getAttribute('src')) video.play().catch(() => {});
  else if (!video.paused) { programmaticPause.add(video); video.pause(); }
}
const mediaPlayer = new IntersectionObserver(entries => {
  for (const entry of entries) { videoVisible.set(entry.target, entry.isIntersecting); syncVideo(entry.target); }
}, { threshold: .25 });
for (const video of videos) {
  video.addEventListener('loadeddata', () => syncVideo(video));
  video.addEventListener('pause', () => {
    if (programmaticPause.has(video)) programmaticPause.delete(video);
    else if (videoVisible.get(video) && !systemFigure.contains(video)) userPaused.add(video);
  });
  video.addEventListener('play', () => userPaused.delete(video));
  mediaLoader.observe(video);
  mediaPlayer.observe(video);
}
document.addEventListener('visibilitychange', () => { syncSystemPlayback(); videos.forEach(syncVideo); });
reduceMotion.addEventListener('change', () => { pausedSystem = reduceMotion.matches; syncSystemPlayback(); videos.forEach(syncVideo); });
syncSystemPlayback();
const rolloutDialog = document.querySelector('#rollout-dialog');
const rolloutVideo = document.querySelector('#rollout-video');
const rolloutNames = { cover_blocks: 'Cover blocks', press_by_number: 'Press by number', insert_tubes: 'Insert tubes', insert_key: 'Insert key', solve_equation: 'Solve equation', build_tower: 'Build tower' };
const rolloutSpeeds = { cover_blocks: '1×', press_by_number: '1×', insert_tubes: '1.15×', insert_key: '1×', solve_equation: '1×', build_tower: '1.79×' };
document.querySelectorAll('[data-watch]').forEach(button => button.addEventListener('click', () => {
  const task = button.dataset.watch;
  document.querySelector('#rollout-title').textContent = rolloutNames[task];
  document.querySelector('#rollout-caption').textContent = `${rolloutSpeeds[task]} playback · Successful evaluation episode · Head camera`;
  rolloutVideo.poster = `media/${task}-0.jpg`;
  rolloutVideo.src = `media/${task}.mp4`;
  rolloutDialog.showModal();
  rolloutVideo.play().catch(() => {});
}));
document.querySelector('#close-rollout').addEventListener('click', () => rolloutDialog.close());
rolloutDialog.addEventListener('close', () => { rolloutVideo.pause(); rolloutVideo.removeAttribute('src'); rolloutVideo.load(); });
rolloutDialog.addEventListener('click', event => {
  const box = rolloutDialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) rolloutDialog.close();
});
