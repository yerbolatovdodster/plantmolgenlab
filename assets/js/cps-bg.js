// Фоновая анимация страницы CropPopStructure: blackhole → логотип из A/G/T/C → рекомбинация кусков и бесконечная рекомбинация нуклеотидов (errorcorrect).
(function(){
const MASK=["...######.......................................########...............................#####...................................................................................", "..########......................................#########............................########.....###.....................................###..................................", ".##########.....................................#########............................#########....###.....................................###..................................", ".###....###....######....######.....#######.....###...####....######.....#######.....###...###...######...######...###..###.....#####....######...###..###....######....#####..", ".###...........######...########....########....###...####...########....########....######......######...######...###..###....#######...######...###..###....######...#######.", "####...........#####....########....####.###....#########....########....####.###.....#######.....####....#####....###..###....###.####...####....###..###....#####....###..##.", "####...........###.....####..####...###...###...#########...####..####...###...###.....#######....###.....###......###..###...###.........###.....###..###....###.....#########", ".###....####...###.....###...####...###...###...########....###...####...###...###...##....###....###.....###......###..###...###.........###.....###..###....###.....#########", ".#####.####....###......###..###....###..###....###..........###..###....###..###....####..###....####....###......###..###....###.####...####....###..###....###......###..##.", "..#########....###......########....########....###..........########....########....#########....#####...###......########....#######....#####...########....###......#######.", "...#######.....###.......######.....#######.....###...........######.....#######......#######......####...###.......######......#####......####....######.....###.......#####..", "....................................###..................................###...................................................................................................", "....................................###..................................###...................................................................................................", "....................................###..................................###..................................................................................................."];
const NUC={A:'#7BC25A',G:'#2E9A5C',T:'#E2B13A',C:'#6A93D0'};
const DARK=matchMedia('(prefers-color-scheme: dark)').matches;
const ERR='#E81416', MOVE=DARK?'#FFE066':'#E0A800', OK=DARK?'#45BF55':'#2E9A5C', STAR=DARK?'#55665B':'#A8B4AC', WHITE=DARK?'#F1F5F2':'#1F5A3A';
const cv=document.querySelector('[data-cps-bg]'); if(!cv) return; const ctx=cv.getContext('2d');
const R=MASK.length, C=MASK[0].length;
let cw,ch,W,H,cx,cy;
function layout(){const d=Math.min(2,devicePixelRatio||1); W=cv.clientWidth; H=cv.clientHeight;
  cw=Math.max(W*0.94/C, 3.4); ch=cw*1.62; cv.width=W*d; cv.height=H*d; ctx.setTransform(d,0,0,d,0,0);
  const ox=(W-C*cw)/2, oy=H*0.5-R*ch/2;
  ctx.font=`bold ${cw*1.62}px ui-monospace,"DejaVu Sans Mono",Menlo,Consolas,monospace`; ctx.textAlign='center'; ctx.textBaseline='middle';
  cx=W/2; cy=H*0.5; P.forEach(p=>{p.fx=ox+(p.c+.5)*cw; p.fy=oy+(p.r+.5)*ch;}); }
const rnd=Math.random, pick=s=>s[Math.floor(rnd()*s.length)];
const ease=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2, eo=u=>1-Math.pow(1-u,3), cl=u=>Math.max(0,Math.min(1,u));
function hex(h){const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255]}
function mix(a,b,t){a=hex(a);b=hex(b);t=cl(t);return'#'+a.map((v,i)=>Math.round(v+(b[i]-v)*t).toString(16).padStart(2,'0')).join('')}
let P=[], T0=0, pairs=[], tl={};
const B={form:900, consume0:600, consume1:2700, collapse:2700, collapseD:450, burst:3150, burstD:1300};
function setup(){
  P=[]; for(let r=0;r<R;r++)for(let c=0;c<C;c++) if(MASK[r][c]==='#') P.push({r,c,s:pick('AGTC')});
  layout();
  const ringN=Math.min(90,Math.floor(P.length*.12));
  const ids=P.map((_,i)=>i).sort(()=>rnd()-.5);
  P.forEach((p,i)=>{ p.ring=false; p.sx=rnd()*W; p.sy=rnd()*H; p.tw=rnd()*6.28; p.cd=B.consume0+rnd()*(B.consume1-B.consume0-700); p.spin=(rnd()<.5?-1:1)*(2+rnd()*2);
    const a=rnd()*6.28; p.bx=Math.cos(a); p.by=Math.sin(a); p.bd=(0.25+rnd()*0.6); p.bdelay=rnd()*250; });
  ids.slice(0,ringN).forEach((id,k)=>{const p=P[id]; p.ring=true; p.ra=k/ringN*6.283;});
  // ── recombination plan: chunks = blocks of a few columns spanning part of the height, swapped pairwise ──
  pairs=[]; const used=new Set();
  const byCell=new Map(P.map(p=>[p.r+','+p.c,p]));
  function chunk(c0,w,r0,h){const out=[]; for(let r=r0;r<r0+h;r++)for(let c=c0;c<c0+w;c++){const p=byCell.get(r+','+c); if(p) out.push(p);} return out;}
  let tries=0, nChunk=0;
  while(nChunk<9 && tries<3000){ tries++;
    const w=4+Math.floor(rnd()*9), h=3+Math.floor(rnd()*(R-4)), r1=Math.floor(rnd()*(R-h+1)), r2=Math.floor(rnd()*(R-h+1));
    const c1=Math.floor(rnd()*(C-w)), c2=Math.floor(rnd()*(C-w));
    if(Math.abs(c1-c2)<w+4) continue;
    const A=chunk(c1,w,r1,h), Bc=chunk(c2,w,r2,h);
    if(A.length<8||Bc.length<8||[...A,...Bc].some(p=>used.has(p))) continue;
    [...A,...Bc].forEach(p=>used.add(p));
    // whole chunk moves as a piece: every char goes to the same offset inside the other chunk's box
    A.forEach(p=>{p.dx=(c2-c1); p.dy=(r2-r1); p.grp=nChunk; p.kind='chunk';}); Bc.forEach(p=>{p.dx=(c1-c2); p.dy=(r1-r2); p.grp=nChunk; p.kind='chunk';});
    pairs.push({kind:'chunk',items:[...A,...Bc]}); nChunk++;
  }
  // single-nucleotide swaps
  const free=P.filter(p=>!used.has(p)).sort(()=>rnd()-.5); const n=Math.floor(free.length*.16/2)*2;
  for(let i=0;i<n;i+=2){const a=free[i],b=free[i+1]; a.dx=b.c-a.c; a.dy=b.r-a.r; b.dx=-a.dx; b.dy=-a.dy; a.kind=b.kind='snp'; pairs.push({kind:'snp',items:[a,b]});}
  const t1=B.burst+B.burstD+260;               // the moment the logo has formed
  const NC=pairs.filter(q=>q.kind==='chunk').length; tl={settle:t1, rec0:t1, recD:750, snpRecD:700, snpWin:1200, recStag:70, NC, err0:t1+1200+700, errD:700, chunkStag:200, snpStag:20, moveD:520, snpMoveD:500, okD:240};
  tl.fix0=tl.err0+tl.errD; tl.fixEnd=tl.fix0+NC*tl.chunkStag+(pairs.length-NC)*tl.snpStag+tl.snpMoveD+tl.okD+500;
  pairs.forEach((pr,k)=>{const st=tl.rec0+(pr.kind==='chunk'?k*tl.recStag:200+rnd()*tl.snpWin); pr.items.forEach(q=>{q.rs=st; q.rd=pr.kind==='chunk'?tl.recD:tl.snpRecD; q.md=pr.kind==='chunk'?tl.moveD:tl.snpMoveD;});});
  EV=[]; P.forEach(q=>q.ev=null);
  T0=performance.now();
}

// ── endless nucleotide recombination: pairs of nucleotides keep swapping and being corrected ──
let EV=[];
function busy(p,t){ return p.ev || (p.kind && t < (p.fs||0)+(p.md||0)+tl.okD+400); }
function engine(t){
  if(t < tl.err0) return;
  EV=EV.filter(e=>{ if(t>e.t0+e.d1+e.hold+e.d2+500){ e.a.ev=e.b.ev=null; return false;} return true; });
  const target=Math.floor(P.length*0.09*Math.min(1,(t-tl.err0)/800));   // ~15% of nucleotides in play
  let spawn=0;
  while(EV.length<target && spawn<6){ spawn++;
    const a=P[Math.floor(rnd()*P.length)]; if(busy(a,t)) continue;
    let b=null; for(let k=0;k<12;k++){ const q=P[Math.floor(rnd()*P.length)]; if(q!==a && !busy(q,t) && Math.abs(q.c-a.c)<45){ b=q; break; } }
    if(!b) continue;
    const e={a,b,t0:t,d1:450+rnd()*250,hold:250+rnd()*400,d2:380+rnd()*180}; a.ev=b.ev=e; EV.push(e);
  }
}
function stageName(t){return t<B.burst?'blackhole':t<tl.rec0?'formation':t<tl.err0?'recombination':t<tl.fix0?'errors':t<tl.fixEnd?'errorcorrect':'recombination · errorcorrect ∞';}
function fixStart(pair,k){ return pair.kind==='chunk'? tl.fix0+k*tl.chunkStag : tl.fix0+tl.NC*tl.chunkStag+(k-tl.NC)*tl.snpStag; }
function frame(now){
  const t=now-T0; ctx.clearRect(0,0,W,H);
  // black hole glow
  if(t<B.burst+300){const a=t<B.form?t/B.form:t>B.collapse?cl(1-(t-B.collapse)/(B.collapseD+300)):1;
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,ch*7); g.addColorStop(0,`rgba(0,0,0,${.95*a})`); g.addColorStop(.55,`rgba(30,60,40,${.25*a})`); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,ch*7,0,6.283); ctx.fill();}
  const ringR=ch*6.2;
  pairs.forEach((pr,k)=>pr.items.forEach(p=>p.fs=fixStart(pr,k)));
  engine(t);
  for(const p of P){
    let x,y,col,s=p.s,alpha=1;
    if(t<B.burst){
      if(p.ring){ // stars fly to the ring, ring spins, then collapses
        const u=eo(cl(t/B.form)); const rot=p.ra+t/900; let rr=ringR*(t>B.collapse?1-ease(cl((t-B.collapse)/B.collapseD)):1);
        const tx=cx+Math.cos(rot)*rr*1.9, ty=cy+Math.sin(rot)*rr*0.9; x=p.sx+(tx-p.sx)*u; y=p.sy+(ty-p.sy)*u;
        col=mix(STAR,WHITE,u); if(t>B.collapse) alpha=1-cl((t-B.collapse)/B.collapseD)*0.6;
      } else {
        if(t<p.cd){ x=p.sx; y=p.sy; col=STAR; alpha=.35+.35*Math.sin(t/300+p.tw); s=t%900<450?p.s:'·'; }
        else { const u=cl((t-p.cd)/700), e=u*u; const dx=p.sx-cx, dy=p.sy-cy; const r0=Math.hypot(dx,dy), a0=Math.atan2(dy,dx);
          const rr=r0*(1-e), a=a0+p.spin*e; x=cx+Math.cos(a)*rr; y=cy+Math.sin(a)*rr*0.8; col=mix(STAR,WHITE,u); alpha=u<1?1-e*.5:0; }
      }
    } else {
      // explosion: from centre out along a random direction, then home to final position
      const u=cl((t-B.burst-p.bdelay)/B.burstD); const far=Math.max(W,H)*p.bd;
      const ox=cx+p.bx*far, oy=cy+p.by*far*0.6;
      const a1=eo(cl(u/0.4)), a2=ease(cl((u-0.3)/0.7));
      const mx=cx+(ox-cx)*a1, my=cy+(oy-cy)*a1; x=mx+(p.fx-mx)*a2; y=my+(p.fy-my)*a2;
      col= u<1? mix(WHITE,NUC[p.s],a2) : NUC[p.s];
      if(u<=0){x=cx;y=cy;alpha=0;}
      // recombination: displaced pieces
      if(p.kind && t>=p.rs){
        const wx=p.fx+p.dx*cw, wy=p.fy+p.dy*ch;
        if(t<p.rs+p.rd){ const v=ease((t-p.rs)/p.rd); const lift=Math.sin(Math.PI*v)*ch*(p.kind==='chunk'?3.5:2.2)*(p.dx>0?-1:1);
          x=p.fx+(wx-p.fx)*v; y=p.fy+(wy-p.fy)*v+lift; col=mix(NUC[p.s],MOVE,v); }
        else if(t<p.fs){ x=wx; y=wy; col=ERR; if(p.kind==='snp' && Math.floor(t/140)%3===0) s='▓'; if(p.kind==='chunk' && Math.floor(t/260)%4===0) col='#7A1010'; }
        else if(t<p.fs+p.md){ const v=ease((t-p.fs)/p.md); const lift=Math.sin(Math.PI*v)*ch*(p.kind==='chunk'?3.5:2.2)*(p.dx>0?1:-1);
          x=wx+(p.fx-wx)*v; y=wy+(p.fy-wy)*v+lift; col=MOVE; }
        else if(t<p.fs+p.md+tl.okD){ x=p.fx; y=p.fy; col=OK; }
        else { x=p.fx; y=p.fy; col=mix(OK,NUC[p.s],cl((t-p.fs-p.md-tl.okD)/400)); }
      }
    }
    if(p.ev){ const e=p.ev, o=p.ev.a===p?e.b:e.a, dir=e.a===p?1:-1, wx=o.fx, wy=o.fy, k=t-e.t0;
      if(k<e.d1){ const v=ease(k/e.d1); x=p.fx+(wx-p.fx)*v; y=p.fy+(wy-p.fy)*v-Math.sin(Math.PI*v)*ch*2.2*dir; col=mix(NUC[p.s],MOVE,v); }
      else if(k<e.d1+e.hold){ x=wx; y=wy; col=ERR; if(Math.floor(t/140)%3===0) s='▓'; }
      else if(k<e.d1+e.hold+e.d2){ const v=ease((k-e.d1-e.hold)/e.d2); x=wx+(p.fx-wx)*v; y=wy+(p.fy-wy)*v+Math.sin(Math.PI*v)*ch*2.2*dir; col=MOVE; }
      else if(k<e.d1+e.hold+e.d2+240){ x=p.fx; y=p.fy; col=OK; }
      else { x=p.fx; y=p.fy; col=mix(OK,NUC[p.s],cl((k-e.d1-e.hold-e.d2-240)/260)); }
    }
    if(alpha<=0.02) continue;
    ctx.globalAlpha=alpha; ctx.fillStyle=col; ctx.fillText(s,x,y);
  }
  ctx.globalAlpha=1;
  if(running) raf=requestAnimationFrame(frame);
}
let raf=0, running=false, visible=true;
function start(){ if(running||!visible||document.hidden) return; running=true; const pause=performance.now()-(stopAt||performance.now()); T0+=pause; stopAt=0; raf=requestAnimationFrame(frame); }
let stopAt=0;
function stop(){ if(!running) return; running=false; stopAt=performance.now(); cancelAnimationFrame(raf); }
setup();
if(matchMedia('(prefers-reduced-motion: reduce)').matches){ T0=-1e9; tl.err0=Infinity; frame(performance.now()); return; }
if('IntersectionObserver' in window) new IntersectionObserver(es=>{visible=es[0].isIntersecting; visible?start():stop();}).observe(cv);
document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
addEventListener('resize',()=>{layout(); if(!running) frame(performance.now());});
start();
})();
