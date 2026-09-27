const skillAtlasRoot = document.querySelector('#skill-atlas');
if (skillAtlasRoot) {
  const video = document.querySelector('#skill-reel-video');
  const atlasFilter = document.querySelector('#atlas-task-filter');
  const taskSelect = document.querySelector('#skill-task-select');
  const atlasSelection = document.querySelector('#atlas-selection');
  const atlasReplay = document.querySelector('#atlas-replay');
  const skillCinematic = document.querySelector('#skill-cinematic');
  const cinematicNodes = document.querySelector('#cinematic-task-nodes');
  const cinematicParticles = document.querySelector('#cinematic-particles');
  const cinematicProgress = document.querySelector('#cinematic-progress');
  const enterAtlas = document.querySelector('#enter-skill-atlas');
  const skillSection = document.querySelector('#skills');
  const hoverPreview = document.querySelector('#skill-hover-preview');
  const hoverVideo = document.querySelector('#skill-hover-video');
  const hoverSegmentation = document.querySelector('#skill-hover-segmentation');
  const hoverTask = document.querySelector('#skill-hover-task');
  const hoverSkill = document.querySelector('#skill-hover-skill');
  const hoverTime = document.querySelector('#skill-hover-time');
  const hoverDescription = document.querySelector('#skill-hover-description');
  const hoverFunction = document.querySelector('#skill-hover-function');
  if (hoverPreview && hoverPreview.parentElement !== document.body) document.body.append(hoverPreview);
  const list = document.querySelector('#skill-reel-list');
  const counter = document.querySelector('#skill-reel-counter');
  const kind = document.querySelector('#skill-reel-kind');
  const name = document.querySelector('#skill-reel-name');
  const copy = document.querySelector('#skill-reel-copy');
  const score = document.querySelector('#skill-reel-score');
  const episodes = document.querySelector('#skill-reel-episodes');
  const time = document.querySelector('#skill-reel-time');
  const taskCount = document.querySelector('#skill-task-count');
  const progress = document.querySelector('#skill-reel-progress-fill');
  const toggle = document.querySelector('#skill-reel-toggle');
  const totalCount = document.querySelector('#atlas-skill-count');
  const taskCountLabel = document.querySelector('#atlas-task-count');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let clips = [];
  let allClips = [];
  let tasks = [];
  let currentTask = 0;
  let currentClip = 0;
  let currentGlobal = 0;
  let playing = false;
  let sectionVisible = false;
  let timer = null;
  let stepTimer = null;

  fetch('skill-clips.json').then(response => {
    if (!response.ok) throw new Error(`Skill index returned ${response.status}`);
    return response.json();
  }).then(data => {
    allClips = data;
    clips = data; // Every tile links to its recorded video, including perception windows.
    const grouped = new Map();
    clips.forEach((clip, index) => {
      clip.globalIndex = index;
      if (!grouped.has(clip.task)) grouped.set(clip.task, []);
      grouped.get(clip.task).push(clip);
    });
    tasks = [...grouped.entries()].map(([task, items]) => ({ task, items }));
    totalCount.textContent = String(clips.length);
    taskCountLabel.textContent = String(tasks.length);
    renderCinematic();
    renderTaskOptions();
    renderAtlas();
    renderTaskSequence();
    showClip(0, 0, false);
    if (playing && sectionVisible) scheduleNext();
  }).catch(error => {
    skillAtlasRoot.innerHTML = `<p class="atlas-error">Could not load the skill index: ${error.message}</p>`;
  });

  // These are the tasks whose frozen code calls the SAM3/SAM3D segmentation path.
  const samTasks = new Set(['fill_egg_holder', 'fill_pen_holder', 'fold_clothes', 'hang_mugs', 'imitate_sorting_sequence', 'make_toast', 'pour_balls_into_vase', 'pour_by_language', 'pour_liquid_into_cup', 'solve_equation', 'sort_nesting_dolls_by_size', 'store_laptop_and_headphones', 'swap_blocks', 'sweep_blocks']);
  const perceptionPattern = /(^|[_/ -])(observe|reobserve|identify|perception|segment|mask|localize|detect|search|vision)([_/ -]|$)|active_perception/i;
  function isPerceptionSkill(clip) { return perceptionPattern.test(`${clip.skill} ${clip.task}`); }
  function isSamPerception(clip) { return samTasks.has(clip.task) && isPerceptionSkill(clip); }
  function simpleFunctionName(clip) { return `${clip.skill.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'skill'}()`; }
  function skillDescription(clip) {

    return `${clip.skill.replaceAll('_', ' ')} in the ${clip.task.replaceAll('_', ' ')} task. This clip is one recorded action window in the code-policy skill sequence.`;
  }

  function renderTaskOptions() {
    const options = tasks.map((group, index) => `<option value="${index}">${String(index + 1).padStart(2, '0')} · ${group.task} (${group.items.length})</option>`).join('');
    taskSelect.innerHTML = options;
    atlasFilter.innerHTML = '<option value="all">All tasks</option>' + options;
    taskSelect.value = '0';
  }

  function renderAtlas() {
    skillAtlasRoot.replaceChildren();
    const taskIndexes = new Map(tasks.map((group, index) => [group.task, index]));
    clips.forEach((clip, index) => {
      const taskIndex = taskIndexes.get(clip.task);
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'skill-tile';
      tile.dataset.task = clip.task;
      tile.dataset.index = String(index);
      tile.style.setProperty('--hue', '160');
      tile.style.setProperty('--tile-delay', `${Math.min(index * 7, 900)}ms`);
      tile.setAttribute('role', 'gridcell');
      tile.setAttribute('aria-label', `${clip.task}: ${clip.skill}, video ${index + 1} of ${clips.length}`);
      tile.title = `${clip.task} · ${clip.skill} · ${clip.start_sec.toFixed(2)}–${clip.end_sec.toFixed(2)}s`;
      tile.innerHTML = `<span class="skill-tile-number">${String(index + 1).padStart(3, '0')}</span><span class="skill-tile-name">${clip.skill}</span>`;
      tile.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') showHoverPreview(clip, event); });
      tile.addEventListener('pointermove', event => { if (event.pointerType !== 'touch') positionHoverPreview(event); });
      tile.addEventListener('pointerleave', hideHoverPreview);
      tile.addEventListener('mouseenter', event => showHoverPreview(clip, event));
      tile.addEventListener('mousemove', positionHoverPreview);
      tile.addEventListener('mouseleave', hideHoverPreview);
      tile.addEventListener('focus', event => showHoverPreview(clip, event));
      tile.addEventListener('blur', hideHoverPreview);
      tile.addEventListener('click', () => {
        const taskIndex = tasks.findIndex(group => group.task === clip.task);
        const clipIndex = tasks[taskIndex].items.indexOf(clip);
        atlasFilter.value = String(taskIndex);
        taskSelect.value = String(taskIndex);
        showClip(taskIndex, clipIndex, true);
        document.querySelector('#skill-detail')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
      });
      skillAtlasRoot.append(tile);
    });
    applyAtlasFilter();
  }

  function renderCinematic() {
    if (!cinematicNodes || !cinematicParticles) return;
    cinematicNodes.replaceChildren();
    cinematicParticles.replaceChildren();
    tasks.forEach((group, index) => {
      const node = document.createElement('span');
      node.className = 'cinematic-task-node';
      const angle = (index / tasks.length) * 360;
      node.style.setProperty('--angle', `${angle}deg`);
      node.style.setProperty('--counter-angle', `${-angle}deg`);
      node.style.setProperty('--node-delay', `${Math.min(index * 35, 1600)}ms`);
      node.textContent = group.task.replaceAll('_', ' ');
      cinematicNodes.append(node);
    });
    for (let index = 0; index < 90; index += 1) {
      const particle = document.createElement('i');
      particle.className = 'cinematic-particle';
      particle.style.setProperty('--particle-angle', `${(index * 137.5) % 360}deg`);
      particle.style.setProperty('--particle-radius', `${28 + (index % 7) * 5}%`);
      particle.style.setProperty('--particle-delay', `${(index % 19) * 90}ms`);
      cinematicParticles.append(particle);
    }
    cinematicProgress.textContent = `00 / ${String(tasks.length).padStart(2, '0')} TASKS`;
    if (reducedMotion) finishCinematic();

  }

  function finishCinematic() {
    skillCinematic?.classList.add('is-complete');
    if (cinematicProgress) cinematicProgress.textContent = `${String(tasks.length).padStart(2, '0')} / ${String(tasks.length).padStart(2, '0')} TASKS`;
  }

  function showHoverPreview(clip, event) {
    if (!hoverPreview) return;
    hoverTask.textContent = clip.task.replaceAll('_', ' ').toUpperCase();
    hoverSkill.textContent = clip.skill;
    hoverTime.textContent = `${clip.start_sec.toFixed(2)}–${clip.end_sec.toFixed(2)} s · ${clip.camera}`;
    hoverDescription.textContent = skillDescription(clip);
    hoverFunction.textContent = simpleFunctionName(clip);
    const sam = false;
    hoverSegmentation.hidden = !sam;
    hoverVideo.hidden = sam;
    hoverVideo.src = clip.video;
    hoverVideo.load();
    hoverPreview.hidden = false;
    positionHoverPreview(event);
    if (!sam) hoverVideo.play().catch(() => {});
  }

  function positionHoverPreview(event) {
    if (!hoverPreview || hoverPreview.hidden) return;
    const gap = 18;
    const width = hoverPreview.offsetWidth;
    const height = hoverPreview.offsetHeight;
    const rect = event.currentTarget?.getBoundingClientRect();
    const x = Number.isFinite(event.clientX) ? event.clientX : (rect?.right ?? 12);
    const y = Number.isFinite(event.clientY) ? event.clientY : (rect?.top ?? 12);
    let left = x + gap;
    let top = y + gap;
    if (left + width > window.innerWidth - 12) left = x - width - gap;
    if (top + height > window.innerHeight - 12) top = window.innerHeight - height - 12;
    hoverPreview.style.left = `${Math.max(12, left)}px`;
    hoverPreview.style.top = `${Math.max(12, top)}px`;
  }

  function hideHoverPreview() {
    if (!hoverPreview) return;
    hoverVideo.pause();
    hoverVideo.hidden = false;
    hoverSegmentation.hidden = true;
    hoverPreview.hidden = true;
  }

  function applyAtlasFilter() {
    const value = atlasFilter.value;
    skillAtlasRoot.querySelectorAll('.skill-tile').forEach(tile => {
      tile.hidden = value !== 'all' && tile.dataset.task !== tasks[Number(value)]?.task;
    });
  }

  function renderTaskSequence() {
    const group = tasks[currentTask];
    if (!group) return;
    taskCount.textContent = `${group.items.length} clips · task ${currentTask + 1} / ${tasks.length}`;
    list.replaceChildren();
    group.items.forEach((clip, index) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'skill-reel-item';
      item.dataset.index = String(index);
      item.innerHTML = `<span class="skill-reel-item-index">${String(index + 1).padStart(2, '0')}</span><span class="skill-reel-item-copy"><b>${clip.skill}</b><small>${clip.camera} · ${clip.start_sec.toFixed(2)}–${clip.end_sec.toFixed(2)}s</small></span><span class="skill-reel-item-arrow">↗</span>`;
      item.addEventListener('click', () => showClip(currentTask, index, true));
      list.append(item);
    });
    updateSequenceActive();
  }

  function updateSequenceActive() {
    list.querySelectorAll('.skill-reel-item').forEach((item, index) => {
      const active = index === currentClip;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-current', active ? 'true' : 'false');
    });
    skillAtlasRoot.querySelectorAll('.skill-tile').forEach(tile => tile.classList.toggle('is-selected', Number(tile.dataset.index) === currentGlobal));
  }

  function showClip(taskIndex, clipIndex, userSelected) {
    if (!tasks[taskIndex]) return;
    currentTask = taskIndex;
    currentClip = Math.max(0, Math.min(clipIndex, tasks[currentTask].items.length - 1));
    const clip = tasks[currentTask].items[currentClip];
    currentGlobal = clip.globalIndex;
    taskSelect.value = String(currentTask);
    if (userSelected) atlasFilter.value = String(currentTask);
    applyAtlasFilter();
    renderTaskSequence();
    video.pause();
    video.removeAttribute('poster');
    video.src = clip.video;
    video.load();
    counter.textContent = `${String(currentGlobal + 1).padStart(3, '0')} / ${String(clips.length).padStart(3, '0')}`;
    kind.textContent = `${clip.task.toUpperCase()} / SKILL CLIP`;
    name.textContent = clip.skill.replaceAll('_', ' ');
    copy.textContent = `${clip.camera.replaceAll('_', ' ')} camera · ${clip.start_sec.toFixed(2)}–${clip.end_sec.toFixed(2)} s in the original rollout`;
    score.textContent = `${clip.start_sec.toFixed(2)}–${clip.end_sec.toFixed(2)} s`;
    episodes.textContent = clip.video_group;
    time.textContent = `clip ${clip.clip_duration_sec.toFixed(2)} s`;
    taskCount.textContent = `${tasks[currentTask].items.length} clips · task ${currentTask + 1} / ${tasks.length}`;
    atlasSelection.textContent = `${clip.task} · ${clip.skill}`;
    progress.style.width = `${((currentClip + 1) / tasks[currentTask].items.length) * 100}%`;
    updateSequenceActive();
    clearInterval(stepTimer);
    const active = list.querySelector('.skill-reel-item.is-active');
    active?.animate([{ transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 360, easing: 'ease-out' });
    if (!reducedMotion && (userSelected || playing) && sectionVisible) {
      stepTimer = setInterval(() => active?.classList.toggle('step-beat'), 720);
      video.play().catch(() => {});
    }
    if (playing && sectionVisible) scheduleNext();
  }

  function nextClip() {
    if (!tasks.length) return;
    const nextTask = currentClip + 1 < tasks[currentTask].items.length ? currentTask : (currentTask + 1) % tasks.length;
    const nextClipIndex = nextTask === currentTask ? currentClip + 1 : 0;
    showClip(nextTask, nextClipIndex, false);
  }

  function scheduleNext() {
    clearTimeout(timer);
    if (!playing || !sectionVisible || document.hidden) return;
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration * 1000 + 900 : 5600;
    timer = setTimeout(nextClip, Math.max(3200, duration));
  }

  function setPlaying(value) {
    playing = value;
    toggle.setAttribute('aria-pressed', String(!playing));
    toggle.innerHTML = playing ? 'Ⅱ <span>Pause</span>' : '▶ <span>Play</span>';
    if (playing && sectionVisible) { video.play().catch(() => {}); scheduleNext(); }
    else { clearTimeout(timer); video.pause(); }
  }

  taskSelect.addEventListener('change', () => { currentTask = Number(taskSelect.value); currentClip = 0; showClip(currentTask, 0, true); });
  atlasFilter.addEventListener('change', () => { applyAtlasFilter(); if (atlasFilter.value !== 'all') { currentTask = Number(atlasFilter.value); currentClip = 0; showClip(currentTask, 0, true); } });
  atlasReplay.addEventListener('click', () => {
    skillAtlasRoot.querySelectorAll('.skill-tile').forEach(tile => { tile.style.animation = 'none'; tile.offsetHeight; tile.style.animation = ''; });
  });
  enterAtlas?.addEventListener('click', () => {
    finishCinematic();
    skillSection?.classList.add('is-browse-mode');
    skillCinematic?.classList.add('is-dismissed');
    document.querySelector('#skill-atlas')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
  });
  const cinematicObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      skillCinematic?.classList.add('is-playing');
      setTimeout(finishCinematic, 4300);
      cinematicObserver.disconnect();
    }
  }, { threshold: .3 });
  if (skillCinematic) cinematicObserver.observe(skillCinematic);
  setPlaying(false);
  new IntersectionObserver(entries => {
    sectionVisible = entries[0].isIntersecting;
    if (sectionVisible && playing && !document.hidden) { video.play().catch(() => {}); scheduleNext(); }
    else { clearTimeout(timer); clearInterval(stepTimer); video.pause(); hideHoverPreview(); }
  }, {threshold: 0}).observe(document.querySelector('#skill-detail'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearTimeout(timer); video.pause(); hideHoverPreview(); }
    else if (playing && sectionVisible) { video.play().catch(() => {}); scheduleNext(); }
  });
  toggle.addEventListener('click', () => setPlaying(!playing));
  video.addEventListener('loadedmetadata', () => { if (playing && sectionVisible) scheduleNext(); });
  video.addEventListener('ended', () => { if (playing) nextClip(); });
}
