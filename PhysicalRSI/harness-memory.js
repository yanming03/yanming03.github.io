(() => {
  const section = document.querySelector('.harness-memory-study');
  if (!section) return;
  const video = section.querySelector('video');
  const play = section.querySelector('#memory-mechanism-play');
  const tabs = [...section.querySelectorAll('[data-memory-example]')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const panel = section.querySelector('#memory-example-panel');
  const examples = {
    return: {
      name: 'Fold, release & return',
      code: "def fold_sleeve(arm, pick, place):\n    arm.move_above(pick)\n    home = arm.joints().copy()\n    arm.move_to(pick)\n    arm.close_gripper()\n    arm.move_above(place)\n    descent = [arm.joints().copy()]\n    for q in arm.lower_to(place):\n        descent.append(q.copy())\n    arm.open_gripper()\n    for q in reversed(descent):\n        arm.move_joints(q, step=0.12)\n    arm.move_joints(home, step=0.12)",
      observation: 'Current robot pose', variable: 'saved pose', use: 'Return after release',
      description: 'The code-policy skill saves an approach joint pose measured in the current rollout, then reads it after release and retreat. The stored pose is cleared for the next rollout.',
      poster: 'media/fold-clothes/skill-return.jpg', video: 'media/fold-clothes/skill-return.mp4'
    },
    tracking: {
      name: 'Keep the same garment',
      code: "def track_garment(frames, vision):\n    prev = next(frames)\n    mask = vision.shirt(prev)\n    yield mask\n    for rgb in frames:\n        prior = vision.flow(mask, prev, rgb)\n        parts = vision.segment(rgb)\n        match = vision.associate(parts, prior)\n        if match is None:\n            match = vision.shirt(rgb)\n        mask, prev = match, rgb\n        yield mask",
      observation: 'Current camera frame', variable: 'cloth identity', use: 'Match after folding',
      description: 'The code-policy skill initializes garment identity from the current rollout, propagates its mask with observed motion, and associates current segmentation with that history. The mask is cleared for the next rollout. Association checks motion, overlap and area; semantic selection is the fallback.',
      poster: 'media/fold-clothes/skill-tracking.jpg', video: 'media/fold-clothes/skill-tracking.mp4'
    }
  };
  let visible = false;
  let wantsPlay = !motion.matches;

  function renderCode(source) {
    const code = section.querySelector('#memory-routine-code');
    const fragments = source.split(/(\b(?:def|for|in|if|is|None|yield)\b|\b\d+\.\d+\b)/g);
    code.replaceChildren(...fragments.map((part, index) => {
      if (index % 2 === 0) return document.createTextNode(part);
      const token = document.createElement('span');
      token.className = /^\d/.test(part) ? 'code-number' : 'code-keyword';
      token.textContent = part;
      return token;
    }));
  }

  function sync() {
    const active = visible && wantsPlay && !document.hidden;
    section.classList.toggle('is-paused', !active);
    play.textContent = wantsPlay ? 'Ⅱ' : '▶';
    play.setAttribute('aria-pressed', String(!wantsPlay));
    play.setAttribute('aria-label', wantsPlay ? 'Pause memory example' : 'Play memory example');
    if (visible && video.getAttribute('src') !== video.dataset.memorySrc) {
      video.src = video.dataset.memorySrc;
      video.load();
    }
    if (active) video.play().catch(() => {});
    else video.pause();
  }

  function select(name) {
    const example = examples[name];
    section.dataset.example = name;
    tabs.forEach(tab => {
      const selected = tab.dataset.memoryExample === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `memory-example-${name}`);
    section.querySelector('#memory-routine-name').textContent = example.name;
    renderCode(example.code);
    section.querySelector('.state-observation').textContent = example.observation;
    section.querySelector('.state-variable').textContent = example.variable;
    section.querySelector('.state-use').textContent = example.use;
    section.querySelector('#memory-state-desc').textContent = example.description;
    section.querySelector('.pose-memory-glyph').toggleAttribute('hidden', name !== 'return');
    section.querySelector('.garment-memory-glyph').toggleAttribute('hidden', name !== 'tracking');
    video.pause();
    video.poster = example.poster;
    video.dataset.memorySrc = example.video;
    video.setAttribute('aria-label', `${example.name}: recorded cloth-folding action`);
    sync();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab.dataset.memoryExample));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') target = tabs[1 - index];
      else if (event.key === 'Home') target = tabs[0];
      else if (event.key === 'End') target = tabs[1];
      else return;
      event.preventDefault();
      target.click();
      target.focus();
    });
  });
  play.addEventListener('click', () => { wantsPlay = !wantsPlay; sync(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .15 }).observe(video);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', () => { wantsPlay = !motion.matches; sync(); });
  renderCode(examples.return.code);
  sync();
})();
