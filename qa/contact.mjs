import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root=new URL('../dist/', import.meta.url).pathname;
const mt={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const srv=http.createServer((q,r)=>{let p=path.join(root,q.url.split('?')[0]);if(!fs.existsSync(p)||fs.statSync(p).isDirectory())p=path.join(root,'index.html');r.writeHead(200,{'Content-Type':mt[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(r);});
await new Promise(r=>srv.listen(4193,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const out=[];

const open = async (w,h) => {
  const ctx=await b.newContext({viewport:{width:w,height:h},permissions:['clipboard-read','clipboard-write']});
  const pg=await ctx.newPage();
  pg.on('pageerror',e=>out.push(`[${w}] ${e.message}`));
  await pg.goto('http://localhost:4193',{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(900);
  await pg.evaluate(()=>document.getElementById('contact').scrollIntoView({behavior:'instant'}));
  await pg.waitForTimeout(600);
  return {ctx,pg};
};

// ── 1. every field is properly labelled ────────────────────────────────────
{
  const {ctx,pg}=await open(1280,900);
  const bad=await pg.evaluate(()=>{
    const probs=[];
    document.querySelectorAll('.contact-form input, .contact-form textarea').forEach(el=>{
      const lab=el.id && document.querySelector(`label[for="${el.id}"]`);
      if(!lab && !el.getAttribute('aria-label')) probs.push(`${el.name}: no label`);
      if(!el.name) probs.push('a field has no name attribute');
    });
    return probs;
  });
  out.push(...bad.map(p=>`FORM ${p}`));
  await ctx.close();
}

// ── 2. empty submit reports every problem and moves focus to the first ─────
{
  const {ctx,pg}=await open(1280,900);
  await pg.click('.cf-send');
  await pg.waitForTimeout(350);
  const r=await pg.evaluate(()=>({
    errs:[...document.querySelectorAll('.cf-field em')].map(e=>e.textContent),
    focused:document.activeElement?.getAttribute('name'),
    invalid:[...document.querySelectorAll('[aria-invalid="true"]')].map(e=>e.getAttribute('name')),
    described:[...document.querySelectorAll('[aria-describedby]')].every(e=>document.getElementById(e.getAttribute('aria-describedby'))),
  }));
  if(r.errs.length!==3) out.push(`FORM empty submit produced ${r.errs.length} messages, expected 3`);
  if(r.focused!=='name') out.push(`FORM focus went to "${r.focused}" instead of the first invalid field`);
  if(!r.described) out.push('FORM aria-describedby points at an element that does not exist');
  if(r.invalid.length!==3) out.push(`FORM only ${r.invalid.length} fields marked aria-invalid`);
  await ctx.close();
}

// ── 3. a malformed address is caught ───────────────────────────────────────
{
  const {ctx,pg}=await open(1280,900);
  await pg.fill('#cf-name','Tuong'); await pg.fill('#cf-email','nope@'); await pg.fill('#cf-message','hi');
  await pg.click('.cf-send');
  await pg.waitForTimeout(300);
  const e=await pg.textContent('#email-err').catch(()=>null);
  if(!e) out.push('FORM accepted a malformed email address');
  await ctx.close();
}

// ── 4. a valid submit hands a correctly built message to the mail client ───
{
  const {ctx,pg}=await open(1280,900);
  let nav=null;
  await pg.route('**/*',r=>r.continue());
  pg.on('request',r=>{ if(r.url().startsWith('mailto:')) nav=r.url(); });
  await pg.evaluate(()=>{ // capture the assignment without leaving the page
    const d=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window.location),'href');
    window.__mailto=null;
    Object.defineProperty(window.location,'href',{set(v){window.__mailto=v;},get(){return d.get.call(window.location);},configurable:true});
  }).catch(()=>{});
  await pg.fill('#cf-name','Tuong Do');
  await pg.fill('#cf-email','hr@company.com');
  await pg.fill('#cf-subject','Fullstack role');
  await pg.fill('#cf-message','Are you available in October?');
  await pg.click('.cf-send');
  await pg.waitForTimeout(500);
  const href=await pg.evaluate(()=>window.__mailto).catch(()=>null);
  const link=href||nav;
  if(!link) out.push('FORM a valid submit did not open the mail client');
  else {
    if(!link.startsWith('mailto:tantuongdo0206@gmail.com')) out.push(`FORM mailto went to the wrong address: ${link.slice(0,60)}`);
    const u=new URL(link);
    if(u.searchParams.get('subject')!=='Fullstack role') out.push(`FORM subject not carried: "${u.searchParams.get('subject')}"`);
    const body=u.searchParams.get('body')||'';
    for(const part of ['Are you available in October?','Tuong Do','hr@company.com'])
      if(!body.includes(part)) out.push(`FORM body is missing "${part}"`);
  }
  const msg=await pg.textContent('.cf-status');
  if(/sent/i.test(msg||'')) out.push('HONESTY status claims the message was sent when it only opened a mail client');
  if(!/mail app/i.test(msg||'')) out.push(`FORM no explanation after submit (got "${(msg||'').slice(0,50)}")`);
  await ctx.close();
}

// ── 5. copy buttons actually copy ──────────────────────────────────────────
{
  const {ctx,pg}=await open(1280,900);
  await pg.locator('.copy-btn').first().click();
  await pg.waitForTimeout(300);
  const clip=await pg.evaluate(()=>navigator.clipboard.readText());
  if(clip!=='tantuongdo0206@gmail.com') out.push(`COPY button put "${clip}" on the clipboard`);
  const live=await pg.evaluate(()=>[...document.querySelectorAll('[role="status"]')].map(e=>e.textContent).join('|'));
  if(!/copied/i.test(live)) out.push('COPY gives no feedback that anything happened');
  await ctx.close();
}

// ── 6. keyboard can reach every control in order ───────────────────────────
{
  const {ctx,pg}=await open(1280,900);
  await pg.focus('#cf-name');
  const order=[];
  for(let i=0;i<5;i++){ order.push(await pg.evaluate(()=>document.activeElement?.id||document.activeElement?.className||'')); await pg.keyboard.press('Tab'); }
  const want=['cf-name','cf-email','cf-subject','cf-message'];
  if(!want.every((w,i)=>order[i]===w)) out.push(`KEYBOARD tab order is ${JSON.stringify(order)}`);
  if(!/cf-send/.test(order[4])) out.push(`KEYBOARD submit not reachable after the fields (got "${order[4]}")`);
  await ctx.close();
}

// ── 7. layout holds at every width ─────────────────────────────────────────
for(const w of [1440,1180,980,820,600,390,340]){
  const {ctx,pg}=await open(w,900);
  const r=await pg.evaluate(()=>{
    const f=document.querySelector('.contact-form').getBoundingClientRect();
    const row=getComputedStyle(document.querySelector('.cf-row')).gridTemplateColumns.split(' ').length;
    const over=[...document.querySelectorAll('#contact *')].filter(e=>{
      const b=e.getBoundingClientRect(); return b.width>0 && (b.right>innerWidth+1||b.left<-1);
    }).length;
    return {formW:Math.round(f.width), cols:row, over,
            doc:document.documentElement.scrollWidth>innerWidth+1};
  });
  if(r.doc) out.push(`[${w}] horizontal overflow on the page`);
  if(r.over) out.push(`[${w}] ${r.over} elements in #contact stick outside the viewport`);
  if(w<=600 && r.cols!==1) out.push(`[${w}] name/email still side by side (${r.cols} columns)`);
  if(w>=980 && r.cols!==2) out.push(`[${w}] name/email not side by side (${r.cols} columns)`);
  if(w===390) await pg.screenshot({path:'/tmp/contact-390.png'});
  await ctx.close();
}

await b.close(); srv.close();
console.log(out.length?out.join('\n'):'CONTACT OK — labelled, validates, builds an honest mailto, copies, keyboard-reachable, holds 340→1440px');
