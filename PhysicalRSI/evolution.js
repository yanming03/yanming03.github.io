(() => {
  'use strict';
  const release = new URL(document.currentScript.src).searchParams.get('v');
  function assetURL(path, version = release) {
    const url = new URL(path, document.baseURI);
    if (version) url.searchParams.set('v', version);
    return url.href;
  }
  const figure = document.querySelector('.evolution-figure');
  if (!figure) return;
  const panel = figure.querySelector('#evolution-demo');
  const video = figure.querySelector('#evolution-ours-video');
  const playButton = figure.querySelector('#evolution-play');
  const restartButton = figure.querySelector('#evolution-replay');
  const soundButton = figure.querySelector('#evolution-sound');
  const bridgeNote = figure.querySelector('#evolution-bridge-note');
  const speed = figure.querySelector('#evolution-speed');
  const seek = figure.querySelector('#evolution-seek');
  const note = figure.querySelector('#evolution-playback-note');
  const error = figure.querySelector('#evolution-media-error');
  const cue = figure.querySelector('#evolution-action-cue');
  const focus = figure.querySelector('#evolution-focus');
  const outcome = figure.querySelector('#evolution-outcome');
  const transition = figure.querySelector('#evolution-transition');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const memoryCards = [...figure.querySelectorAll('[data-memory-index]')];
  const memoryPreview = figure.querySelector('#evolution-memory-preview');
  const memoryVideo = memoryPreview.querySelector('video');
  document.body.append(memoryPreview);
  const controls = [playButton, restartButton, soundButton, speed, seek];
  let data, selected = -1, displayedCue = '', displayedOutcome = null;
  let previewCard = null, previewPinned = false;
  let visible = false, wantsPlayback = true, internalPause = false;
  let playToken = 0;
  let chartNodes = [];
  controls.forEach(control => { control.disabled = true; });
  video.muted = true;
  video.loop = true;

  function renderChart() {
    const chart = figure.querySelector('.evolution-chart');
    const measured = data.presentation.chart.points.filter(p => p.version !== 'R12');
    const points = [{ version: 'initial', success_rate_percent: 0, mean_score: 0, reference: true }, ...measured];
    data.presentation.chart.points = points;
    const x = i => 48 + i * 432 / (points.length - 1);
    const y = value => 252 - value * 2.24;
    // Monotone Hermite segments pass through the recorded values without overshoot.
    function path(key, reference = false) {
      const values = points.map(point => y(point[key]));
      const step = 432 / (points.length - 1);
      const slopes = values.slice(1).map((value, i) => (value - values[i]) / step);
      const tangents = values.map((_, i) => {
        if (!i) return slopes[0];
        if (i === values.length - 1) return slopes.at(-1);
        return slopes[i - 1] * slopes[i] > 0 ? 2 * slopes[i - 1] * slopes[i] / (slopes[i - 1] + slopes[i]) : 0;
      });
      return `M${x(reference ? 0 : 1)} ${values[reference ? 0 : 1]}` + slopes.map((_, i) =>
        `C${x(i) + step / 3} ${values[i] + tangents[i] * step / 3} ` +
        `${x(i + 1) - step / 3} ${values[i + 1] - tangents[i + 1] * step / 3} ${x(i + 1)} ${values[i + 1]}`).filter((_, i) => reference ? i === 0 : i > 0).join('');
    }
    const sr = path('success_rate_percent');
    chart.innerHTML = `
      <title id="evolution-chart-title">Evolution trajectories across five selected iterations</title>
      <desc id="evolution-chart-desc">k=1 through k=5 denote five selected measured milestones on a common scene set. k=0 is a zero-valued initialization reference, not an evaluated policy. Focus a point for its source revision and metrics. The highlighted point matches the video.</desc>
      <defs><linearGradient id="evolution-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a64479" stop-opacity=".1"/><stop offset="1" stop-color="#a64479" stop-opacity="0"/></linearGradient><clipPath id="evolution-chart-reveal"><rect width="520" height="330"/></clipPath></defs>
      <g class="evolution-chart-grid">${[0, 25, 50, 75, 100].map(value => `<path d="M48 ${y(value)}H480"/><text x="32" y="${y(value) + 4}">${value}</text>`).join('')}</g>
      <g class="evolution-chart-drawing" clip-path="url(#evolution-chart-reveal)"><path class="evolution-chart-area" d="${sr}V252H${x(1)}Z"/><path class="evolution-chart-initial" d="${path('mean_score', true)}"/><path class="evolution-chart-initial" d="${path('success_rate_percent', true)}"/><path class="evolution-chart-score" d="${path('mean_score')}"/><path class="evolution-chart-sr" d="${sr}"/></g>
      <g class="evolution-chart-cursor"><path d="M0 25V270"/></g>
      ${points.map((point, i) => `<g class="evolution-chart-node ${point.reference ? 'initial-reference' : ''}" data-revision="${point.version}" tabindex="0" role="img" aria-label="k=${i}: ${point.reference ? 'initialization reference, not measured' : point.version + ', SR ' + point.success_rate_percent + '%, score ' + point.mean_score}"><rect class="evolution-chart-hit" x="${x(i) - 25}" y="${y(point.success_rate_percent) - 22}" width="50" height="75"/><circle class="evolution-chart-halo" cx="${x(i)}" cy="${y(point.success_rate_percent)}" r="9"/><circle class="evolution-chart-dot" cx="${x(i)}" cy="${y(point.success_rate_percent)}" r="4"/><text class="evolution-chart-value" x="${x(i) + (i === 0 ? 12 : 0)}" y="${y(point.success_rate_percent) + 25}">${point.success_rate_percent}%</text><rect class="evolution-chart-index-bg" x="${x(i)-17}" y="277" width="34" height="23" rx="6"/><text class="evolution-chart-index" x="${x(i)}" y="293">k=${i}</text></g>`).join('')}
      <text class="evolution-chart-axis-title" x="264" y="323">Iteration k</text>`;
    chartNodes = [...chart.querySelectorAll('.evolution-chart-node')];
    const tooltip = figure.querySelector('#evolution-chart-tooltip');
    function inspect(node, point) {
      tooltip.querySelector('strong').textContent = point.reference ? 'k=0 · initialization' : `k=${points.indexOf(point)} · ${point.version}`;
      tooltip.querySelector('[data-chart-sr]').textContent = `${point.success_rate_percent}%`;
      tooltip.querySelector('[data-chart-score]').textContent = point.mean_score.toFixed(1);
      tooltip.querySelector('small').textContent = point.reference ? 'Zero reference · not an evaluation' : 'Measured milestone';
      tooltip.hidden = false;
      const anchor = node.querySelector('circle').getBoundingClientRect();
      const parent = tooltip.offsetParent.getBoundingClientRect();
      tooltip.style.left = `${Math.max(0, Math.min(parent.width - tooltip.offsetWidth, anchor.x - parent.x - tooltip.offsetWidth / 2))}px`;
      tooltip.style.top = `${anchor.y - parent.y - tooltip.offsetHeight - 13}px`;
    }
    chartNodes.forEach((node, i) => {
      node.addEventListener('pointerenter', () => inspect(node, points[i]));
      node.addEventListener('focus', () => inspect(node, points[i]));
      node.addEventListener('pointerleave', () => { tooltip.hidden = true; });
      node.addEventListener('blur', () => { tooltip.hidden = true; });
      node.addEventListener('keydown', event => { if (event.key === 'Escape') tooltip.hidden = true; });
    });
  }

  function hideMemoryPreview() {
    memoryPreview.hidden = true;
    memoryVideo.pause();
    previewCard?.setAttribute('aria-expanded', 'false');
    previewCard = null;
    previewPinned = false;
  }

  function showMemoryPreview(card, pinned = false) {
    if (!data || card.disabled) return;
    const skill = data.presentation.memory_library[Number(card.dataset.memoryIndex)];
    if (previewCard !== card) {
      previewCard?.setAttribute('aria-expanded', 'false');
      memoryVideo.src = assetURL(skill.video);
      memoryVideo.poster = assetURL(skill.poster);
      memoryVideo.setAttribute('aria-label', `${skill.title}, recorded ${skill.camera.replace('_', ' ')} view`);
      memoryPreview.querySelector('#evolution-memory-preview-title').textContent = skill.title;
      memoryPreview.querySelector('#evolution-memory-preview-description').textContent = skill.description;
      memoryPreview.querySelector('#evolution-memory-preview-camera').textContent = skill.camera === 'head' ? 'Head view' : 'Wrist view';
    }
    previewCard = card;
    previewPinned = pinned;
    memoryPreview.hidden = false;
    card.setAttribute('aria-expanded', 'true');
    const anchor = card.getBoundingClientRect();
    const popup = memoryPreview.getBoundingClientRect();
    const left = Math.max(12, Math.min(innerWidth - popup.width - 12, anchor.right - popup.width));
    const top = anchor.top > popup.height + 24 ? anchor.top - popup.height - 12 : Math.min(innerHeight - popup.height - 12, anchor.bottom + 12);
    memoryPreview.style.left = `${left}px`;
    memoryPreview.style.top = `${Math.max(12, top)}px`;
    if (!reducedMotion.matches) memoryVideo.play().catch(() => {});
  }

  memoryCards.forEach(card => {
    card.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch' && !previewPinned) showMemoryPreview(card);
    });
    card.addEventListener('pointerleave', () => { if (!previewPinned) hideMemoryPreview(); });
    card.addEventListener('focus', () => { if (!previewPinned) showMemoryPreview(card); });
    card.addEventListener('blur', event => {
      if (!previewPinned && !memoryPreview.contains(event.relatedTarget)) hideMemoryPreview();
    });
    card.addEventListener('click', () => {
      if (previewCard === card && previewPinned) hideMemoryPreview();
      else {
        showMemoryPreview(card, true);
        memoryVideo.play().catch(() => {});
      }
    });
  });
  memoryPreview.querySelector('button').addEventListener('click', hideMemoryPreview);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hideMemoryPreview(); });
  document.addEventListener('pointerdown', event => {
    if (!memoryPreview.contains(event.target) && !event.target.closest('[data-memory-index]')) hideMemoryPreview();
  });
  window.addEventListener('scroll', hideMemoryPreview, { passive: true });
  window.addEventListener('resize', hideMemoryPreview);

  function updateButton() {
    playButton.textContent = video.paused ? '▶' : 'Ⅱ';
    playButton.setAttribute('aria-label', video.paused ? 'Play video' : 'Pause video');
  }

  function pauseInternally() {
    playToken += 1;
    if (!video.paused) {
      internalPause = true;
      video.pause();
    }
    updateButton();
  }

  async function play() {
    if (!data || !visible || document.hidden || !wantsPlayback) return;
    const token = ++playToken;
    try { await video.play(); }
    catch (cause) {
      if (token === playToken && cause.name !== 'AbortError') note.textContent = 'Press Play to start the video.';
    }
    updateButton();
  }

  function showStage(index) {
    const initial = selected < 0;
    selected = index;
    displayedCue = '';
    displayedOutcome = null;
    const revision = data.revisions[index];
    const clip = data.presentation.playlist[index];
    figure.dataset.revision = revision.version;
    chartNodes.forEach(point => {
      point.classList.toggle('selected', point.dataset.revision === revision.version);
    });
    const chartIndex = data.presentation.chart.points.findIndex(point => point.version === revision.version);
    figure.querySelector('.evolution-chart-cursor').style.transform = `translateX(${48 + chartIndex * 432 / (data.presentation.chart.points.length - 1)}px)`;
    transition.textContent = clip.story.transition;
  }

  function updateSeek() {
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const fraction = duration ? video.currentTime / duration : 0;
    const stamp = value => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
    seek.value = Math.round(fraction * 1000);
    seek.style.setProperty('--seek-progress', `${fraction * 100}%`);
    const time = `${stamp(video.currentTime)} / ${stamp(duration)}`;
    seek.setAttribute('aria-valuetext', time);
    figure.querySelector('#evolution-video-time').textContent = time;
  }

  function syncProgress() {
    if (!data) return;
    updateSeek();
    const chapters = data.presentation.sequence.chapters;
    let index = chapters.findLastIndex(chapter => video.currentTime >= chapter.start_seconds);
    if (index < 0) index = 0;
    if (index !== selected) showStage(index);
    const bridge = data.presentation.sequence.transitions.find(item =>
      video.currentTime >= item.start_seconds && video.currentTime < item.end_seconds);
    figure.classList.toggle('is-bridging', !!bridge);
    const bridgeDescription = bridge ? `${bridge.harness}: both recordings show the same ${bridge.action}, from the same ${bridge.camera.replaceAll('_', ' ')} camera. Without this feature on the left; with it on the right. ${bridge.narration}` : '';
    if (bridgeNote.textContent !== bridgeDescription) bridgeNote.textContent = bridgeDescription;
    if (bridge) {
      figure.dataset.outcome = 'transition';
      outcome.hidden = true;
      transition.classList.remove('is-visible');
      focus.classList.remove('is-visible');
      memoryCards.forEach(card => card.classList.remove('is-in-use'));
      displayedCue = '';
      displayedOutcome = null;
      return;
    }
    const chapter = chapters[index];
    const elapsed = video.currentTime - chapter.start_seconds;
    const edit = chapter.playback_edits?.find(item => elapsed < item.end_seconds);
    const localTime = edit ? Math.min(edit.source_end_seconds,
      edit.source_start_seconds + Math.max(0, elapsed - edit.start_seconds) * edit.playback_rate) :
      chapter.playback_edits ? chapter.source_end_seconds : Math.min(elapsed, chapter.source_end_seconds);
    const clip = data.presentation.playlist[index];
    const current = [...clip.cues].reverse().find(item => localTime >= item.at) || clip.cues[0];
    transition.classList.toggle('is-visible', !!clip.story.transition &&
      elapsed < Math.min(2.6, clip.outcome_at_seconds));
    if (current.text !== displayedCue) {
      cue.textContent = current.text;
      cue.dataset.tone = current.tone;
      cue.classList.remove('is-changing');
      void cue.offsetWidth;
      cue.classList.add('is-changing');
      memoryCards.forEach((card, i) => card.classList.toggle('is-in-use',
        data.presentation.memory_library[i].id === current.memory_id));
      focus.classList.toggle('is-visible', !!current.focus);
      focus.dataset.tone = current.tone;
      if (current.focus) {
        ['cx', 'cy', 'rx', 'ry'].forEach((key, i) => focus.firstElementChild.setAttribute(key, current.focus[i]));
      }
      displayedCue = current.text;
    }
    const reached = localTime >= clip.outcome_at_seconds;
    if (reached !== displayedOutcome) {
      displayedOutcome = reached;
      figure.dataset.outcome = reached ? (clip.selected_success ? 'success' : 'failure') : 'playing';
      outcome.hidden = !reached;
      outcome.textContent = clip.selected_success ? 'Success' : 'Failed';
    }
  }

  playButton.addEventListener('click', () => {
    wantsPlayback = video.paused;
    if (wantsPlayback) play();
    else pauseInternally();
  });
  restartButton.addEventListener('click', () => {
    video.currentTime = 0;
    wantsPlayback = true;
    syncProgress();
    play();
  });
  speed.addEventListener('change', () => { video.playbackRate = Number(speed.value); });
  soundButton.addEventListener('click', () => { video.muted = !video.muted; });
  video.addEventListener('volumechange', () => {
    const enabled = !video.muted;
    soundButton.setAttribute('aria-pressed', String(enabled));
    soundButton.setAttribute('aria-label', enabled ? 'Mute narration' : 'Turn narration on');
    soundButton.title = soundButton.getAttribute('aria-label');
  });
  seek.addEventListener('input', () => {
    if (Number.isFinite(video.duration)) video.currentTime = video.duration * Number(seek.value) / 1000;
  });
  video.addEventListener('play', () => { wantsPlayback = true; updateButton(); });
  video.addEventListener('pause', () => {
    if (!internalPause && !video.ended) wantsPlayback = false;
    internalPause = false;
    updateButton();
  });
  video.addEventListener('loadedmetadata', syncProgress);
  video.addEventListener('timeupdate', syncProgress);
  video.addEventListener('seeked', syncProgress);
  video.addEventListener('error', () => { error.hidden = false; wantsPlayback = false; pauseInternally(); });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) { figure.classList.add('is-chart-visible'); play(); }
    else pauseInternally();
  }).observe(panel);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pauseInternally(); hideMemoryPreview(); }
    else play();
  });

  fetch(assetURL('fold-clothes-evolution.json'), { cache: 'no-cache' }).then(response => {
    if (!response.ok) throw new Error('Could not load evolution data');
    return response.json();
  }).then(result => {
    data = result;
    const clips = data.presentation.playlist;
    const chapters = data.presentation.sequence.chapters;
    if (clips.length !== data.revisions.length || chapters.length !== clips.length ||
        clips.some((clip, i) => clip.revision !== data.revisions[i].version || chapters[i].revision !== clip.revision)) {
      throw new Error('Recorded attempts and chart policies must match');
    }
    if (clips.some(clip => !data.presentation.chart.points.some(point => point.version === clip.revision))) {
      throw new Error('Every recorded policy needs its own chart measurement');
    }
    renderChart();
    video.src = assetURL(data.presentation.sequence.video, data.presentation.sequence.asset_version);
    video.poster = data.presentation.sequence.poster;
    video.preload = 'auto';
    video.playbackRate = Number(speed.value);
    memoryCards.forEach((card, i) => {
      const skill = data.presentation.memory_library[i];
      card.querySelector('strong').textContent = skill.title;
      card.querySelector('small').textContent = skill.summary;
      card.querySelector('img').src = assetURL(skill.poster);
      card.setAttribute('aria-label', `${skill.title}: view its recorded action`);
      card.disabled = false;
    });
    controls.forEach(control => { control.disabled = false; });
    syncProgress();
    play();
  }).catch(() => {
    error.hidden = false;
    error.textContent = 'The evolution data could not load.';
  });
})();
