(() => {
 const figure=document.querySelector('.concept-figure'), play=document.querySelector('#concept-play');
 const buttons=[...figure.querySelectorAll('[data-concept]')], motion=matchMedia('(prefers-reduced-motion: reduce)');
 let step=0,paused=motion.matches,visible=false,timer;
 function render(){figure.dataset.step=step;buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===step)));figure.querySelectorAll('[data-active]').forEach(n=>n.classList.toggle('is-active',Number(n.dataset.active)===step));}
 function sync(){clearInterval(timer);const active=visible&&!paused&&!document.hidden;figure.classList.toggle('is-paused',!active);play.textContent=paused?'▶ Play':'Ⅱ Pause';play.setAttribute('aria-pressed',String(paused));play.setAttribute('aria-label',paused?'Play system comparison':'Pause system comparison');if(active)timer=setInterval(()=>{step=(step+1)%buttons.length;render()},3000);}
 buttons.forEach((b,i)=>b.addEventListener('click',()=>{step=i;paused=true;render();sync()}));play.addEventListener('click',()=>{paused=!paused;sync()});
 new IntersectionObserver(e=>{visible=e[0].isIntersecting;sync()},{threshold:.15}).observe(figure);
 document.addEventListener('visibilitychange',sync);motion.addEventListener('change',()=>{paused=motion.matches;sync()});render();sync();
})();
