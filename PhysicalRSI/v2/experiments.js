(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function tabs(buttons, select) {
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => select(index));
      button.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
        else if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = buttons.length - 1;
        else return;
        event.preventDefault(); select(next); buttons[next].focus();
      });
    });
  }
  const patternTabs = [...document.querySelectorAll('[data-pattern-tab]')];
  const patterns = [...document.querySelectorAll('.pattern-panel')];
  tabs(patternTabs, index => {
    patternTabs.forEach((button, i) => {button.setAttribute('aria-selected', String(i === index));button.tabIndex = i === index ? 0 : -1;patterns[i].hidden = i !== index;});
    patterns.forEach((p,i) => { if(i !== index) p.querySelectorAll('video').forEach(v => v.pause()); });
  });
  const galleryCards = [...document.querySelectorAll('[data-setting]')];
  const categoryFilter = document.querySelector('#settings-category');
  const outcomeFilter = document.querySelector('#settings-outcome');
  function filterGallery() {
    let count = 0;
    galleryCards.forEach(card => {
      const visible = (categoryFilter.value === 'all' || card.dataset.category === categoryFilter.value) && (outcomeFilter.value === 'all' || card.dataset.outcome === outcomeFilter.value);
      card.hidden = !visible;
      if (visible) count++;
      else card.querySelector('video').pause();
    });
    document.querySelector('.settings-count').textContent = count === galleryCards.length ? `${count} settings` : `${count} / ${galleryCards.length} settings`;
    document.querySelector('#settings-empty').hidden = count !== 0;
  }
  categoryFilter.addEventListener('change', filterGallery);
  outcomeFilter.addEventListener('change', filterGallery);
  const number = value => Number(value).toLocaleString('en-US',{maximumFractionDigits:2});
  const brand = '<span class="physicalrsi">Physical<span class="brand-rsi">RSI</span></span>';
  const modelLabel = row => row.key === 'PhysicalRSI' ? brand : row.name;
  let categoryIndex = 0, taskIndex = 0, metric = 'score', categories = [], gallery = [];
  let categoryButtons = [];
  const focusVideo = document.querySelector('#category-video');
  let videoVisible = false, videoSource = '', userPaused = false, internalPause = false;
  const pauseVideo = () => { if (!focusVideo.paused) {internalPause = true; focusVideo.pause();} };
  function syncVideo() {
    if (videoVisible && videoSource && !focusVideo.getAttribute('src')) {focusVideo.src = videoSource;focusVideo.load();}
    if (videoVisible && !document.hidden && !reduceMotion.matches && !userPaused && focusVideo.getAttribute('src')) focusVideo.play().catch(()=>{});
    else pauseVideo();
  }
  focusVideo.addEventListener('pause', () => { if (internalPause) internalPause = false; else if(videoVisible) userPaused = true; });
  focusVideo.addEventListener('play', () => {userPaused = false;});
  focusVideo.addEventListener('loadeddata',syncVideo);
  new IntersectionObserver(entries=>{videoVisible=entries[0].isIntersecting;syncVideo();},{threshold:.2}).observe(focusVideo);
  document.addEventListener('visibilitychange',syncVideo);
  function renderBars() {
    const cat=categories[categoryIndex], container=document.querySelector('#category-bars');
    container.replaceChildren();
    cat.rows.forEach(row=>{
      const el=document.createElement('div');el.className='category-bar-row'+(row.key==='PhysicalRSI'?' is-ours':'');
      const label=document.createElement('span');label.className='category-model';label.innerHTML=modelLabel(row);
      const track=document.createElement('span');track.className='category-bar-track';
      const fill=document.createElement('i');fill.style.width=`${row[metric]}%`;track.append(fill);
      const value=document.createElement('b');value.textContent=`${row.estimated?'≈ ':''}${number(row[metric])}${metric==='sr'?'%':''}`;
      if(row.estimated)value.title='Estimated from the available official task sheets; independent of the official overall 36 / 31% result.';
      el.append(label,track,value);el.setAttribute('aria-label',`${row.name}: ${row.estimated?'estimated ':''}${metric} ${number(row[metric])}`);container.append(el);
    });
  }
  function renderTask() {
    const task=categories[categoryIndex].tasks[taskIndex];
    document.querySelector('#task-relation').textContent=task.formula;
    document.querySelector('#task-comparison').textContent=task.comparison;
    document.querySelector('#task-mechanism').textContent=task.mechanism;
    const ours=task.rows[0];
    document.querySelector('#task-official-metrics').innerHTML=`${brand}<span>${ours.estimated?'≈ ':''}SR ${number(ours.sr)}%</span><span>${ours.estimated?'≈ ':''}Score ${number(ours.score)}</span>`;
    const body=document.querySelector('#task-score-body');body.replaceChildren();
    task.rows.forEach(row=>{const tr=document.createElement('tr');if(row.key==='PhysicalRSI')tr.className='ours-row';tr.innerHTML=`<th scope="row">${modelLabel(row)}</th><td>${row.estimated?'≈ ':''}${number(row.sr)}%</td><td>${row.estimated?'≈ ':''}${number(row.score)}</td>`;body.append(tr);});
    document.querySelector('#task-table-caption').textContent=`${task.name} · task-level results`;
    const clip=gallery.find(x=>x.task===task.id);
    if(clip){pauseVideo();focusVideo.removeAttribute('src');videoSource=clip.video;focusVideo.poster=clip.poster;focusVideo.load();userPaused=false;focusVideo.setAttribute('aria-label',`${task.name}: PhysicalRSI recorded rollout`);document.querySelector('#category-video-caption').textContent=task.name;syncVideo();}
  }
  function selectCategory(index) {
    categoryIndex=index;taskIndex=0;
    categoryButtons.forEach((button,i)=>{button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1;});
    document.querySelector('#category-panel').setAttribute('aria-labelledby',`category-tab-${index}`);
    const select=document.querySelector('#category-task');select.replaceChildren();
    categories[index].tasks.forEach((task,i)=>{const opt=document.createElement('option');opt.value=i;opt.textContent=task.name;select.append(opt);});
    renderBars();renderTask();
  }
  document.querySelector('#category-task').addEventListener('change',event=>{taskIndex=Number(event.target.value);renderTask();});
  document.querySelectorAll('[data-category-metric]').forEach(button=>button.addEventListener('click',()=>{metric=button.dataset.categoryMetric;document.querySelectorAll('[data-category-metric]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));if(categories.length)renderBars();}));
  Promise.all([fetch('category-analysis.json').then(r=>r.json()),fetch('settings-gallery.json').then(r=>r.json())]).then(([data,clips])=>{
    categories=data;gallery=clips;
    const group=document.querySelector('.category-tabs');
    categories.forEach((cat,i)=>{const button=document.createElement('button');button.type='button';button.id=`category-tab-${i}`;button.setAttribute('role','tab');button.setAttribute('aria-controls','category-panel');button.textContent=cat.name;group.append(button);});
    categoryButtons=[...group.children];tabs(categoryButtons,selectCategory);selectCategory(0);
  }).catch(error=>{document.querySelector('#category-bars').textContent='Comparison data could not load. Refresh to try again.';console.error(error);});
})();
