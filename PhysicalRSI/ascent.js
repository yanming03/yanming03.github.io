const kaiMarker = document.querySelector('#kai-climber');
const route = document.querySelector('#kai-trail');
const halo = document.querySelector('.route-halo');
const pauseButton = document.querySelector('#pause-ascent');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const svg = document.querySelector('.ascent-route');
const continuation = document.createElementNS('http://www.w3.org/2000/svg', 'path');
continuation.classList.add('route-continuation');
svg.append(continuation);
const peers = document.createElementNS('http://www.w3.org/2000/svg', 'g');
peers.classList.add('peer-routes');
svg.prepend(peers);
let paused = motionPreference.matches, visible = false, elapsed = 0, lastTime = null, frameId = null;
let routeLength = 1;
function layoutAscent() {
  const points = window.mountainGeometry || [];
  if (!points.length) return;
  // Offset in screen pixels: a small visual lead, never a fabricated score.
  const height = summit.clientHeight;
  const top = Math.min(...points.map(p => p.y)) * 5.9;
  const endY = top - 30 / height * 590;
  const endX = 520;
  const d = `M480 537 C444 489 510 451 491 411 S463 ${endY+66} ${endX} ${endY}`;
  route.setAttribute('d', d);
  halo.setAttribute('d', d);
  document.querySelector('.route-guide').setAttribute('d', d);
  continuation.setAttribute('d', `M${endX} ${endY} Q534 ${endY-15} 537 ${endY-34}`);
  peers.replaceChildren();
  for (const side of [0, 1]) {
    const group = points.filter(p => (p.x < 50 ? 0 : 1) === side).sort((a,b) => b.y-a.y);
    if (!group.length) continue;
    const line = document.createElementNS(svg.namespaceURI, 'path');
    line.setAttribute('d', `M${side ? 775 : 265} 537 ` + group.map(p=>`L${p.x*10.24} ${p.y*5.9}`).join(' '));
    peers.append(line);
  }
  routeLength = route.getTotalLength();
  for (const line of [route, halo]) line.style.strokeDasharray = String(routeLength);
  paintAscent();
}
function paintAscent() {
  // Start close to the leader, rise gently, and hold; no return to the foothills.
  const progress = motionPreference.matches ? 1 : 0.94 + 0.06 * (1-Math.exp(-elapsed/6500));
  const point = route.getPointAtLength(routeLength*progress);
  kaiMarker.style.left = point.x/1024*100+'%';
  kaiMarker.style.top = point.y/590*100+'%';
  for (const line of [route,halo]) line.style.strokeDashoffset = String(routeLength*(1-progress));
}
function updatePause() {
  pauseButton.textContent = paused ? '▶' : 'Ⅱ';
  pauseButton.setAttribute('aria-label', paused ? 'Play ascent animation' : 'Pause ascent animation');
  pauseButton.setAttribute('aria-pressed', String(paused));
  summit.classList.toggle('is-paused', paused || !visible);
}
function tick(time) {
  frameId=null;
  if (paused || !visible || document.hidden) { lastTime=null; return; }
  if(lastTime!==null) elapsed+=Math.min(time-lastTime,80);
  lastTime=time; paintAscent(); frameId=requestAnimationFrame(tick);
}
function start() {
  if(frameId!==null) cancelAnimationFrame(frameId);
  frameId=null;lastTime=null;updatePause();
  if(!paused && visible && !document.hidden) frameId=requestAnimationFrame(tick);
}
pauseButton.addEventListener('click',()=>{paused=!paused;start();});
window.replayKai=()=>{elapsed=0;paintAscent();paused=motionPreference.matches;start();};
window.addEventListener('mountain-layout',layoutAscent);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;start();},{threshold:.12}).observe(summit);
document.addEventListener('visibilitychange',start);
motionPreference.addEventListener('change',()=>{paused=motionPreference.matches;paintAscent();start();});
layoutAscent();updatePause();
