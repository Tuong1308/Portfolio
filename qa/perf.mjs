import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root=new URL('../dist/', import.meta.url).pathname;
const t={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const srv=http.createServer((q,r)=>{let p=path.join(root,q.url.split('?')[0]);if(!fs.existsSync(p)||fs.statSync(p).isDirectory())p=path.join(root,'index.html');r.writeHead(200,{'Content-Type':t[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(r);});
await new Promise(r=>srv.listen(4178,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const out=[];
const pg=await b.newPage({viewport:{width:1440,height:900}});
await pg.goto('http://localhost:4178',{waitUntil:'domcontentloaded'});
await pg.waitForTimeout(1200);
// clicking a nav anchor jumps thousands of px — the strip must not lurch
await pg.evaluate(()=>document.getElementById('skills').scrollIntoView());
await pg.waitForTimeout(2500);
const jump=await pg.evaluate(async ()=>{
  const tr=document.querySelector('.mq-track');
  const read=()=>new DOMMatrix(getComputedStyle(tr).transform).m41;
  const w=tr.scrollWidth/2;
  let worst=0, prev=read();
  const stop=performance.now()+1500;
  document.querySelector('a[href="#education"]').click();
  while(performance.now()<stop){
    await new Promise(r=>requestAnimationFrame(r));
    const v=read(); let d=v-prev; if(d>w/2)d-=w; if(d<-w/2)d+=w;
    worst=Math.max(worst,Math.abs(d)); prev=v;
  }
  return worst;
});
if(jump>26) out.push(`JANK: tool strip moved ${jump.toFixed(0)}px in one frame after a nav-anchor jump`);
// layout stability: the strip must not change document height once running
const h0=await pg.evaluate(()=>document.body.scrollHeight);
await pg.waitForTimeout(1500);
const h1=await pg.evaluate(()=>document.body.scrollHeight);
if(h0!==h1) out.push(`CLS: document height changed while the strip runs (${h0}→${h1})`);
await pg.close(); await b.close(); srv.close();
console.log(out.length?out.join('\n'):`STRIP STABLE (worst frame step ${'<=26px'}, no layout shift)`);
