(() => {
  const root = document.querySelector('#skill-space');
  if (!root) return;
  const NS = 'http://www.w3.org/2000/svg';
  const mesh = root.querySelector('#skill-space-mesh');
  const labels = root.querySelector('#skill-space-labels');
  const dots = root.querySelector('#skill-space-points');
  const steps = root.querySelector('#skill-space-step-labels');
  const route = root.querySelector('#skill-space-path');
  const select = root.querySelector('#skill-space-task');
  const sequence = root.querySelector('#skill-space-sequence');
  const video = root.querySelector('#skill-space-video');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let clips = [], groups = [], points = [], selected = -1, visible = false;
  let initialized = false;
  const svg = (tag, attrs, text) => {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    return node;
  };
  // Task lanes are a schematic of sequence order, not a model embedding.
  function project(u, v) {
    const z = .12 * u * u - .26 * v * v + .24 * Math.sin(u + v);
    return [440 + 110 * u + 63 * v, 232 + 57 * v - 64 * z];
  }
  const pointString = point => point.map(value => value.toFixed(2)).join(',');
  function line(values) { return values.map((point, index) => `${index ? 'L' : 'M'}${pointString(point)}`).join(' '); }
  function trajectory(taskIndex, phase) {
    const lane = -1.15 + 2.3 * taskIndex / Math.max(1, groups.length - 1);
    return project(-2.4 + 4.8 * phase, lane + .08 * Math.sin(Math.PI * phase));
  }
  function drawMesh() {
    for (let i = 0; i <= 12; i++) {
      const u = -2.8 + i * 5.6 / 12;
      mesh.append(svg('path', {d: line(Array.from({length: 61}, (_, j) => project(u, -1.5 + j / 20))), class: i % 12 === 0 ? 'mesh-edge' : ''}));
    }
    for (let i = 0; i <= 6; i++) {
      const v = -1.5 + i * 3 / 6;
      mesh.append(svg('path', {d: line(Array.from({length: 85}, (_, j) => project(-2.8 + j / 15, v))), class: i % 6 === 0 ? 'mesh-edge' : ''}));
    }
    labels.append(svg('text', {x: 67, y: 80, class: 'space-symbol'}, '𝒮'));
  }
  function loadVideo(play) {
    if (selected < 0) return;
    const clip = clips[selected];
    if (video.dataset.clip !== String(selected)) {
      video.pause();
      video.dataset.clip = String(selected);
      video.src = clip.video;
      video.load();
    }
    if (play) video.play().catch(() => {});
  }
  function choose(index, play = false) {
    if (!clips[index]) return;
    selected = index;
    const clip = clips[index];
    select.value = clip.task;
    const group = groups.find(item => item.task === clip.task);
    const groupIndexes = new Set(group.indexes);
    points.forEach((point, i) => {
      const current = i === index, inTask = groupIndexes.has(i);
      point.node.classList.toggle('is-task', inTask);
      point.node.classList.toggle('is-current', current);
      point.node.setAttribute('tabindex', inTask ? '0' : '-1');
      point.node.setAttribute('aria-pressed', String(current));
      point.node.querySelector('.point-dot').setAttribute('r', current ? '6.5' : inTask ? '4' : '1.6');
    });
    // Selected nodes are painted last so their hit targets and labels remain clear.
    group.indexes.forEach(i => dots.append(points[i].node));
    const taskIndex = groups.indexOf(group);
    route.setAttribute('d', line(Array.from({length: 97}, (_, i) => trajectory(taskIndex, i / 96))));
    steps.replaceChildren();
    sequence.replaceChildren();
    group.indexes.forEach((i, step) => {
      const [x, y] = points[i].position;
      steps.append(svg('text', {x, y: y - 17, class: i === index ? 'is-current' : ''}, String(step + 1).padStart(2, '0')));
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-pressed', String(i === index));
      const number = document.createElement('span');number.textContent = String(step + 1).padStart(2, '0');
      button.append(number, document.createTextNode(clips[i].skill.replaceAll('_', ' ')));
      button.addEventListener('click', () => choose(i, true));
      sequence.append(button);
    });
    root.querySelector('#skill-space-name').textContent = clip.skill.replaceAll('_', ' ');
    root.querySelector('#skill-space-time').textContent = `${clip.camera.replaceAll('_', ' ')} · ${clip.clip_duration_sec.toFixed(2)} s`;
    video.setAttribute('aria-label', `${clip.task.replaceAll('_', ' ')}: ${clip.skill.replaceAll('_', ' ')} recorded skill`);
    if (visible || play) loadVideo(play);
  }
  function initialize(data) {
    if (initialized || !Array.isArray(data) || !data.length) return;
    initialized = true; clips = data;
    const byTask = new Map();
    clips.forEach((clip, index) => {
      if (!byTask.has(clip.task)) byTask.set(clip.task, []);
      byTask.get(clip.task).push(index);
    });
    groups = [...byTask].map(([task, indexes]) => ({task, indexes}));
    groups.forEach(group => {
      const option = document.createElement('option');option.value = group.task;option.textContent = group.task.replaceAll('_', ' ');select.append(option);
    });
    drawMesh();
    const locations = new Map();
    groups.forEach((group, taskIndex) => group.indexes.forEach((index, step) => {
      locations.set(index, trajectory(taskIndex, step / Math.max(1, group.indexes.length - 1)));
    }));
    points = clips.map((clip, index) => {
      const position = locations.get(index);
      const node = svg('g', {class: 'space-point', transform: `translate(${pointString(position)})`, role: 'button', tabindex: '-1', 'aria-label': `${clip.task.replaceAll('_', ' ')}: ${clip.skill.replaceAll('_', ' ')}`});
      node.append(svg('title', {}, `${clip.task} · ${clip.skill}`), svg('circle', {r: 10, class: 'point-hit'}), svg('circle', {r: 2.4, class: 'point-dot'}), svg('circle', {r: 10, class: 'point-focus'}));
      node.addEventListener('click', () => choose(index, true));
      node.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();choose(index, true);}
        else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
          const g = groups.find(item => item.task === clip.task), offset = event.key === 'ArrowRight' ? 1 : -1;
          const next = g.indexes[(g.indexes.indexOf(index) + offset + g.indexes.length) % g.indexes.length];
          choose(next);points[next].node.focus();
        }
      });
      dots.append(node);
      return {node, position};
    });
    const opening = clips.findIndex(clip => clip.task === 'insert_key' && clip.skill === 'insert');
    choose(opening < 0 ? 0 : opening);
  }
  select.addEventListener('change', () => choose(groups.find(group => group.task === select.value).indexes[0], true));
  root.querySelector('#skill-space-open').addEventListener('click', () => {
    video.pause();
    document.querySelector(`.skill-tile[data-index="${selected}"]`)?.click();
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) loadVideo(false);
    else video.pause();
  }, {rootMargin: '200px 0px'}).observe(root);
  document.addEventListener('visibilitychange', () => {if (document.hidden) video.pause();});
  reduced.addEventListener('change', () => {if (reduced.matches) video.pause();});
  window.addEventListener('skill-library-ready', event => initialize(event.detail));
  if (window.physicalSkillClips) initialize(window.physicalSkillClips);
})();
