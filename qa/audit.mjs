import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root=new URL('../dist/', import.meta.url).pathname;
const t={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const srv=http.createServer((q,r)=>{let p=path.join(root,q.url.split('?')[0]);if(!fs.existsSync(p)||fs.statSync(p).isDirectory())p=path.join(root,'index.html');r.writeHead(200,{'Content-Type':t[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(r);});
await new Promise(r=>srv.listen(4174,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const out=[];

const pg=await b.newPage({viewport:{width:1440,height:900}});
await pg.goto('http://localhost:4174',{waitUntil:'domcontentloaded'});
await pg.waitForTimeout(1500);
await pg.evaluate(()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')));
await pg.waitForTimeout(400);

const res=await pg.evaluate(()=>{
  const bad=[];
  const lum=c=>{const[r,g,bl]=c.match(/[\d.]+/g).map(Number).slice(0,3).map(v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4});return 0.2126*r+0.7152*g+0.0722*bl};
  const ratio=(a,b)=>{const l1=lum(a),l2=lum(b);return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)};
  // resolve effective background by walking up
  // composite the real background: walk up blending every semi-transparent layer
  const parse=c=>{const n=(c.match(/[\d.]+/g)||[0,0,0,1]).map(Number);return{r:n[0],g:n[1],b:n[2],a:n.length>3?n[3]:1}};
  const bg=el=>{
    const stack=[]; let n=el;
    while(n){const c=parse(getComputedStyle(n).backgroundColor); if(c.a>0)stack.push(c); n=n.parentElement;}
    stack.push({r:5,g:6,b:7,a:1});
    let out=stack[stack.length-1];
    for(let i=stack.length-2;i>=0;i--){const t=stack[i];
      out={r:t.r*t.a+out.r*(1-t.a),g:t.g*t.a+out.g*(1-t.a),b:t.b*t.a+out.b*(1-t.a),a:1};}
    return `rgb(${out.r}, ${out.g}, ${out.b})`;
  };
  // 1. contrast on every text node holder
  document.querySelectorAll('p,span,a,li,dt,dd,h1,h2,h3,h4,b,em,button').forEach(el=>{
    if(!el.textContent.trim()||el.children.length)return;
    const cs=getComputedStyle(el);
    if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity<0.5)return;
    const r=el.getBoundingClientRect(); if(!r.width||!r.height)return;
    const size=parseFloat(cs.fontSize), bold=+cs.fontWeight>=700;
    const need=(size>=24||(size>=18.66&&bold))?3:4.5;
    const c=ratio(cs.color,bg(el));
    if(c<need)bad.push(`CONTRAST ${c.toFixed(2)}:1 (need ${need}) — "${el.textContent.trim().slice(0,34)}" ${cs.fontSize} ${cs.color}`);
  });
  // 2. touch targets
  document.querySelectorAll('a,button').forEach(el=>{
    const cs=getComputedStyle(el); if(cs.display==='none'||cs.visibility==='hidden')return;
    const r=el.getBoundingClientRect(); if(!r.width)return;
    // an ::after overlay can legitimately enlarge the hit area past the box
    const pa=getComputedStyle(el,'::after');
    const grow=pa.content!=='none'&&pa.position==='absolute'
      ? Math.abs(parseFloat(pa.top)||0)+Math.abs(parseFloat(pa.bottom)||0) : 0;
    const hitH=r.height+grow, hitW=r.width+grow;
    const label=(el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,32)||'(unnamed)';
    if((hitH<44||hitW<44)&&!el.closest('.footer,.skip'))bad.push(`TOUCH ${Math.round(hitW)}x${Math.round(hitH)} — "${label}"`);
  });
  // 3. heading order
  const hs=[...document.querySelectorAll('h1,h2,h3,h4')].map(h=>+h.tagName[1]);
  for(let i=1;i<hs.length;i++)if(hs[i]-hs[i-1]>1)bad.push(`HEADING jump h${hs[i-1]}→h${hs[i]} at index ${i}`);
  if(document.querySelectorAll('h1').length!==1)bad.push('HEADING: not exactly one h1');
  // 4. links without accessible name / new-tab without rel
  document.querySelectorAll('a').forEach(a=>{
    const name=(a.getAttribute('aria-label')||a.textContent||'').trim();
    if(!name)bad.push(`LINK no accessible name: ${a.getAttribute('href')}`);
    if(a.target==='_blank'&&!/noreferrer|noopener/.test(a.rel||''))bad.push(`LINK target=_blank without rel: ${a.href}`);
  });
  // 5. images/svg without alt or aria-hidden
  document.querySelectorAll('svg').forEach(s=>{ if(!s.closest('[aria-hidden="true"]')&&!s.parentElement.closest('a,button'))bad.push('SVG not hidden and not in a labelled control'); });
  return bad;
});
out.push(...res);

// 6. keyboard tab order reaches every nav item and CTA, in document order
const tabs=await pg.evaluate(()=>[...document.querySelectorAll('a[href],button:not([disabled])')].filter(e=>{const cs=getComputedStyle(e);return cs.display!=='none'&&cs.visibility!=='hidden'&&!e.closest('[inert]')}).length);
let reached=0, seen=new Set();
for(let i=0;i<tabs+6;i++){await pg.keyboard.press('Tab');const id=await pg.evaluate(()=>{const a=document.activeElement;return a?a.tagName+':'+(a.getAttribute('aria-label')||a.textContent||'').trim().slice(0,20):''});if(id&&!seen.has(id)){seen.add(id);reached++}}
if(reached<tabs*0.85)out.push(`TAB: only ${reached}/${tabs} focusables reachable`);
await pg.close();

// 7. touch gesture on the skills orb — must rotate and must not swallow page scroll
const m=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
await m.goto('http://localhost:4174',{waitUntil:'domcontentloaded'});
await m.waitForTimeout(1200);
await m.evaluate(()=>document.getElementById('skills').scrollIntoView());
await m.waitForTimeout(1500);
const box=await m.locator('.skills-canvas canvas').boundingBox();
const before=await m.evaluate(()=>window.scrollY);
await m.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
// horizontal drag = rotate
await m.evaluate(async ([x,y])=>{
  const c=document.querySelector('.skills-canvas canvas');
  const ev=(t,cx)=>c.dispatchEvent(new PointerEvent(t,{pointerId:1,pointerType:'touch',clientX:cx,clientY:y,bubbles:true,isPrimary:true}));
  ev('pointerdown',x); for(let i=1;i<=10;i++){ev('pointermove',x+i*8);await new Promise(r=>setTimeout(r,16));} ev('pointerup',x+80);
},[box.x+box.width/2,box.y+box.height/2]);
await m.waitForTimeout(300);
const after=await m.evaluate(()=>window.scrollY);
if(Math.abs(after-before)>4)out.push(`TOUCH: orb drag moved the page (${before}→${after})`);
const stuck=await m.evaluate(()=>getComputedStyle(document.querySelector('.skills-canvas canvas')).cursor);
if(stuck==='grabbing')out.push('TOUCH: orb stuck in dragging state after pointerup');
// vertical swipe over the orb must still scroll the page
await m.evaluate(()=>window.scrollTo(0,document.getElementById('skills').offsetTop));
await m.waitForTimeout(400);
const y0=await m.evaluate(()=>window.scrollY);
const room=await m.evaluate(()=>document.body.scrollHeight-window.innerHeight-window.scrollY);
if(room>300){
  const bx=await m.locator('.skills-canvas canvas').boundingBox();
  await m.touchscreen.tap(bx.x+bx.width/2,bx.y+bx.height/2);
  await m.mouse.wheel(0,250);
  await m.waitForTimeout(400);
  if(await m.evaluate(()=>window.scrollY)<=y0+10)out.push('TOUCH: page cannot scroll over the orb');
}
await m.close();


// 8. staggered children must all finish visible, and the strip must stop offscreen
{
  const pg2=await b.newPage({viewport:{width:1440,height:900}});
  await pg2.goto('http://localhost:4174',{waitUntil:'domcontentloaded'});
  await pg2.waitForTimeout(800);
  await pg2.evaluate(()=>document.getElementById('skills').scrollIntoView());
  await pg2.waitForTimeout(2200);
  const hidden=await pg2.evaluate(()=>[...document.querySelectorAll('.stagger > *')].filter(e=>+getComputedStyle(e).opacity<0.99).map(e=>e.textContent));
  if(hidden.length)out.push(`STAGGER: children never reached full opacity — ${hidden.join(', ')}`);
  // strip must idle when scrolled away
  await pg2.evaluate(()=>window.scrollTo(0,0));
  await pg2.waitForTimeout(900);
  const a=await pg2.evaluate(()=>[...document.querySelectorAll('.mq-track')].map(t=>new DOMMatrix(getComputedStyle(t).transform).m41));
  await pg2.waitForTimeout(900);
  const c=await pg2.evaluate(()=>[...document.querySelectorAll('.mq-track')].map(t=>new DOMMatrix(getComputedStyle(t).transform).m41));
  if(a.some((v,i)=>Math.abs(v-c[i])>1))out.push('PERF: tool strip keeps animating while scrolled out of view');
  await pg2.close();
}

// 9. reduced motion: strip must still be readable, not blank or mid-gap
{
  const pg3=await b.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await pg3.goto('http://localhost:4174',{waitUntil:'domcontentloaded'});
  await pg3.waitForTimeout(700);
  await pg3.evaluate(()=>document.getElementById('skills').scrollIntoView());
  await pg3.waitForTimeout(900);
  const r=await pg3.evaluate(()=>{
    const chips=[...document.querySelectorAll('.mq-chip')];
    const vis=chips.filter(c=>{const b=c.getBoundingClientRect();return b.right>0&&b.left<innerWidth&&b.width>0}).length;
    const staggerHidden=[...document.querySelectorAll('.stagger > *')].filter(e=>+getComputedStyle(e).opacity<0.99).length;
    return {vis,staggerHidden};
  });
  if(r.vis<6)out.push(`REDUCED-MOTION: only ${r.vis} chips visible in the strip`);
  if(r.staggerHidden)out.push(`REDUCED-MOTION: ${r.staggerHidden} staggered items stayed hidden`);
  await pg3.close();
}

await b.close(); srv.close();
console.log(out.length?out.join('\n'):'AUDIT CLEAN');
