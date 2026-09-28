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
  // A semantic schematic, deliberately not an embedding of model activations.
  function project(u, v) {
    const z = .12 * u * u - .26 * v * v + .24 * Math.sin(u + v);
    return [440 + 110 * u + 63 * v, 232 + 57 * v - 64 * z];
  }
  const pointString = point => point.map(value => value.toFixed(2)).join(',');
  function line(values) { return values.map((point, index) => `${index ? 'L' : 'M'}${pointString(point)}`).join(' '); }
  function drawMesh() {
    for (let i = 0; i <= 24; i++) {
      const u = -2.8 + i * 5.6 / 24;
      mesh.append(svg('path', {d: line(Array.from({length: 61}, (_, j) => project(u, -1.5 + j / 20))), class: i % 24 === 0 ? 'mesh-edge' : ''}));
    }
    for (let i = 0; i <= 14; i++) {
      const v = -1.5 + i * 3 / 14;
      mesh.append(svg('path', {d: line(Array.from({length: 85}, (_, j) => project(-2.8 + j / 15, v))), class: i % 14 === 0 ? 'mesh-edge' : ''}));
    }
    ['Observe', 'Plan', 'Grasp', 'Move', 'Contact', 'Verify'].forEach((name, index) => {
      const u = -2.2 + index * .86;
      const p = project(u, -1.5), y = 54 + (index % 2) * 22;
      labels.append(svg('path', {d: `M${pointString(p)} L${p[0]},${y + 8}`}));
      labels.append(svg('text', {x: p[0], y}, name));
    });
  }
  function family(name) {
    const s = name.toLowerCase();
    if (/verify|confirm|recover|return|done|hold|retract|reobserve|interlock|witness/.test(s)) return 5;
    if (/plan|order|solve|select|sequence|cache|context|relation|memory|bind|landing_index/.test(s)) return 1;
    if (/grasp|pickup/.test(s)) return 2;
    if (/transport|move|lift|approach|handoff|relay|clearance|path/.test(s)) return 3;
    if (/observe|read|identif|detect|percept|track|measure/.test(s)) return 0;
    return 4;
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
      point.node.querySelector('.point-dot').setAttribute('r', current ? '6' : inTask ? '4.8' : '2.4');
    });
    // Selected nodes are painted last so their hit targets and labels remain clear.
    group.indexes.forEach(i => dots.append(points[i].node));
    route.setAttribute('d', line(group.indexes.map(i => points[i].position)));
    steps.replaceChildren();
    sequence.replaceChildren();
    group.indexes.forEach((i, step) => {
      const [x, y] = points[i].position;
      steps.append(svg('text', {x: x + 8, y: y - 9}, String(step + 1)));
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
    points = clips.map((clip, index) => {
      const f = family(clip.skill);
      const u = -2.2 + f * .86 + (((index * 61) % 101) / 100 - .5) * .48;
      const v = (((index * 37) % 103) / 102 - .5) * 2.5;
      const position = project(u, v);
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
    choose(clips.findIndex(clip => clip.task === 'insert_key'));
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
