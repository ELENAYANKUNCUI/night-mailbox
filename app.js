
(()=>{
'use strict';
const $=s=>document.querySelector(s);
const W=320,H=180;
const cv=$('#cv'),ctx=cv.getContext('2d');
cv.width=W;cv.height=H;ctx.imageSmoothingEnabled=false;
let G=ctx;

/* ================= 基础工具 ================= */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const R=(x,y,w,h,c)=>{G.fillStyle=c;G.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
const P=(x,y,c)=>{G.fillStyle=c;G.fillRect(Math.round(x),Math.round(y),1,1);};
const A=(a,fn)=>{const p=G.globalAlpha;G.globalAlpha=a;fn();G.globalAlpha=p;};
function hs(x,y,s){let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul((s|0)+7,1442695041);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967296;}
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const B4=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const bay=(x,y)=>(B4[((y&3)<<2)|(x&3)]+.5)/16;
function mk(w,h){const c=document.createElement('canvas');c.width=w||W;c.height=h||H;const g=c.getContext('2d');g.imageSmoothingEnabled=false;return{c,g};}
function on(layer,fn){const p=G;G=layer.g;fn();G=p;}
function disc(cx,cy,r,c){for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r+r*.5)P(cx+x,cy+y,c);}
function line(x0,y0,x1,y1,c){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
  let dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy,n=0;
  for(;;){P(x0,y0,c);if((x0===x1&&y0===y1)||n++>600)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx;}if(e2<=dx){err+=dx;y0+=sy;}}}
function grad(x0,y0,w,h,stops){
  for(let y=0;y<h;y++){const t=y/(h-1||1);let i=0;while(i<stops.length-2&&t>stops[i+1][0])i++;
    const a=stops[i],b=stops[i+1];const u=clamp((t-a[0])/(b[0]-a[0]),0,1);
    for(let x=0;x<w;x++)P(x0+x,y0+y,bay(x0+x,y0+y)<u?b[1]:a[1]);}}
function radFill(x0,y0,w,h,cx,cy,Rd,stops){
  for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){
    const t=clamp(Math.hypot((x-cx)*.8,y-cy)/Rd,0,1);let i=0;while(i<stops.length-2&&t>stops[i+1][0])i++;
    const a=stops[i],b=stops[i+1];const u=clamp((t-a[0])/(b[0]-a[0]),0,1);
    P(x,y,bay(x,y)<u?b[1]:a[1]);}}
function halo(cx,cy,r0,r1,col,k){for(let y=-r1;y<=r1;y++)for(let x=-r1;x<=r1;x++){const d=Math.hypot(x,y);
  if(d>r0&&d<r1){const u=1-(d-r0)/(r1-r0);if(bay(cx+x,cy+y)<u*u*k)P(cx+x,cy+y,col);}}}
function poly(pts,colFn){let a=1e9,b=-1e9;for(const p of pts){a=Math.min(a,p[1]);b=Math.max(b,p[1]);}
  for(let y=Math.floor(a);y<=Math.ceil(b);y++){const yy=y+.5,xs=[];
    for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length];
      if((p[1]<=yy&&q[1]>yy)||(q[1]<=yy&&p[1]>yy))xs.push(p[0]+(yy-p[1])/(q[1]-p[1])*(q[0]-p[0]));}
    xs.sort((m,n)=>m-n);
    for(let k=0;k+1<xs.length;k+=2)for(let x=Math.round(xs[k]);x<Math.round(xs[k+1]);x++)P(x,y,colFn(x,y));}}
function sprite(rows,pal,x,y){for(let j=0;j<rows.length;j++)for(let i=0;i<rows[j].length;i++){const ch=rows[j][i];if(ch!=='.'&&pal[ch])P(x+i,y+j,pal[ch]);}}
function bakeSprite(rows,pal){const {c,g}=mk(rows[0].length,rows.length);const p=G;G=g;sprite(rows,pal,0,0);G=p;return c;}
function bakeGlow(r,cr,cg,cb){const c=document.createElement('canvas');c.width=c.height=r*2;const g=c.getContext('2d');
  const gr=g.createRadialGradient(r,r,0,r,r,r);
  gr.addColorStop(0,`rgba(${cr},${cg},${cb},.5)`);gr.addColorStop(.5,`rgba(${cr},${cg},${cb},.18)`);gr.addColorStop(1,`rgba(${cr},${cg},${cb},0)`);
  g.fillStyle=gr;g.fillRect(0,0,r*2,r*2);return c;}
function makeStars(n,seed,ymax,avoid){const r=rng(seed),out=[];
  while(out.length<n){const x=Math.floor(r()*W),y=Math.floor(r()*ymax);
    if(avoid&&Math.hypot(x-avoid[0],y-avoid[1])<avoid[2])continue;
    out.push({x,y,f:.8+r()*2.4,p:r()*6.28,big:r()>.9});}
  return out;}
function drawStars(stars,t){G.fillStyle='#6f80b0';G.globalAlpha=.4;G.beginPath();
  let any=false;
  for(const s of stars){if(!s.big)continue;const tw=Math.sin(t*s.f+s.p);
    if(tw>.2){G.rect(s.x-1,s.y,1,1);G.rect(s.x+1,s.y,1,1);G.rect(s.x,s.y-1,1,1);G.rect(s.x,s.y+1,1,1);any=true;}}
  if(any)G.fill();G.globalAlpha=1;
  const cols=['#ffffff','#aab8dc','#5a6a96'];
  for(let b=0;b<3;b++){G.beginPath();any=false;
    for(const s of stars){const tw=Math.sin(t*s.f+s.p);const idx=tw>.55?0:tw>-.4?1:2;if(idx!==b)continue;G.rect(s.x,s.y,1,1);any=true;}
    if(any){G.fillStyle=cols[b];G.fill();}}}
function pine(cx,base,h,w,c,c2){
  for(let i=0;i<h;i++){const t=i/h,tier=Math.min(3,Math.floor(t*4)),tt=t*4-tier;
    const hw=Math.max(0,Math.round(w/2*Math.min(1,.15+.2*tier+.3*tt)));
    R(cx-hw,base-h+i,hw*2+1,1,c);if(c2&&hw>1)P(cx+hw,base-h+i,c2);}
  R(cx-1,base,3,3,c);}
function ridge(base,amp,seed,col,hi){for(let x=0;x<W;x++){
  const n=Math.sin(x*.021+seed)*.5+Math.sin(x*.047+seed*2.1)*.3+Math.sin(x*.11+seed*3.3)*.2,u=n*.5+.5,y=Math.round(base-amp*u);
  R(x,y,1,H-y,col);if(hi&&u>.62){P(x,y,hi);P(x,y+1,hi);}}}
function mushroom(x,y){R(x,y-3,1,3,'#e8ddc4');R(x-2,y-5,5,2,'#c0452a');P(x-2,y-4,'#f0875c');P(x+2,y-4,'#f0875c');
  P(x-1,y-5,'#d98a6a');R(x-1,y-2,1,1,'#cfc4ab');}

/* ================= 纸鹤 ================= */
const CRANE_PAL={w:'#f6efdc',g:'#cfc4ab',b:'#e0a35a',e:'#3a2a1e'};
const CRANE_STAND=[
".........ww...",
"..e.....www...",
".bww...wwwww..",
"..ww..wwwwwww.",
"...wwwwwwwwww.",
"...wwwwwwwwww.",
"....wwwwwwww..",
".....wwwww....",
"....g...g....."];
const CRANE_UP=[
".........ww...",
"..e.....www...",
".bww...wwwww..",
"..ww..wwwwwww.",
"...wwwwwwwwww.",
"...wwwwwwwwww.",
"....wwwwwwww..",
".....wwwww....",
".............."];
const CRANE_MID=[
"..............",
"..e...........",
".bwwwwwwwwwww.",
"..wwwwwwwwww..",
"...wwwwwwww...",
"....wwwwww....",
".....wwww.....",
"..............",
".............."];
const CRANE_DOWN=[
"..............",
"..e...........",
".bwwwwwwwwww..",
"..wwwwwwwwww..",
"...wwwwwwww...",
"....wwwwww....",
"..www....www..",
"...ww.....ww..",
".............."];
const CRANE_FLY=[CRANE_UP,CRANE_MID,CRANE_DOWN,CRANE_MID].map(function(r){return bakeSprite(r,CRANE_PAL);});
const CRANE_STAND_IMG=bakeSprite(CRANE_STAND,CRANE_PAL);
function craneScale(s1){return clamp(.62+(s1==null ? .55 : s1)*.5,.6,1.15);}
function drawCrane(x,y,stand,ph,sc,alpha,dir){
  sc=clamp(sc==null ? 1 : sc,.5,1.4);
  const img=stand ? CRANE_STAND_IMG : CRANE_FLY[((Math.floor((ph||0)*4)%4)+4)%4];
  const w=Math.round(img.width*sc),h=Math.round(img.height*sc);
  const X=Math.round(x)-Math.round(w/2),Y=Math.round(y)-h;
  A(alpha==null ? 1 : clamp(alpha,0,1),function(){
    if(dir>0){G.save();G.translate(X+w,Y);G.scale(-1,1);G.drawImage(img,0,0,w,h);G.restore();}
    else G.drawImage(img,X,Y,w,h);});}

/* ================= 粒子 ================= */
const parts=[];
function spawn(x,y,col,o){o=o||{};
  parts.push({x:x,y:y,vx:o.vx!=null ? o.vx : (Math.random()-.5)*10,
    vy:o.vy!=null ? o.vy : -6-Math.random()*10,g:o.g!=null ? o.g : 6,
    life:o.life!=null ? o.life : .6+Math.random()*.8,t:0,col:col,col2:o.col2||col,sz:o.sz||1,tw:o.tw?1:0});}
function updParts(dt){for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.t+=dt;
  if(p.t>=p.life){parts.splice(i,1);continue;}
  p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}}
function drawParts(){for(const p of parts){const u=p.t/p.life;let a=(1-u)*(1-u);
  if(p.tw)a*=.55+.45*Math.sin(p.t*24+p.x*.7);
  A(clamp(a,0,1),function(){R(p.x,p.y,p.sz,p.sz,u>.65 ? p.col2 : p.col);});}}
function sparkleBurst(x,y,cols,n,spd,life){
  for(let i=0;i<n;i++){const a=Math.random()*6.283,s=(spd||18)*(.35+Math.random());
    spawn(x,y,cols[i%cols.length],{vx:Math.cos(a)*s,vy:Math.sin(a)*s*.6-4,g:7,life:(life||.6)+Math.random()*.6,tw:1});}}
function dust(x,y){spawn(x,y,'#c9b98a',{vx:0,vy:-3,g:5,life:.5});
  spawn(x-4,y,'#c9b98a',{vx:-7,vy:-2,g:7,life:.4});
  spawn(x+4,y,'#c9b98a',{vx:7,vy:-2,g:7,life:.4});}

/* ================= 纸鹤飞行 ================= */
function pointAt(f){f.dir=(f.tx>=f.sx) ? 1 : -1;return Math.atan2(f.ty-f.y,f.tx-f.x);}
function sideAim(sx,sy,tx,ty,s1){
  const s=clamp(s1==null ? .55 : s1,.05,1);
  return {x:sx,y:sy,px:sx,py:sy,sx:sx,sy:sy,tx:tx,ty:ty,t:0,s1:s,
    dur:.85+(1-s)*1.4+Math.abs(tx-sx)/300,arc:8+s*18,
    ph:Math.random()*4,sw:Math.random()*6.28,dir:1,done:false};}
function sideFlight(f,dt){
  f.px=f.x;f.py=f.y;f.t+=dt;
  const u=clamp(f.t/f.dur,0,1);
  const e=u<.5 ? 2*u*u : 1-Math.pow(-2*u+2,2)/2;
  f.x=lerp(f.sx,f.tx,e)+Math.sin(u*9+f.sw)*3*(1-Math.abs(u*2-1));
  f.y=lerp(f.sy,f.ty,e)-Math.sin(e*Math.PI)*f.arc;
  f.ph+=dt*(7+(1-f.s1)*6);
  if(u>=1)f.done=true;
  return u;}

/* ================= 共享状态 ================= */
let scene=null,crane=null,flying=null,after=null,state='idle';

/* ================= 小动物 ================= */
function drawBunny(x,y,t){
  const cyc=(t*.42)%1,hd=(cyc>.5&&cyc<.92) ? 3 : 0,tw=((t*2.2)%5)<.3 ? 1 : 0;
  R(x-2,y-3,9,3,'#ece7da');
  P(x+7,y-2,'#d8d2c4');
  R(x-1,y,1,1,'#d8d2c4');R(x+3,y,1,1,'#d8d2c4');
  R(x-5,y-6+hd,4,4,'#ece7da');
  R(x-5,y-8+hd,1,2,'#e2c9d0');
  R(x-3,y-8+hd-tw,1,2,'#e2c9d0');
  P(x-5,y-5+hd,'#3a2a1e');
  P(x-6,y-4+hd,'#caa0a8');
  P(x-8,y,'#2f5233');P(x-8,y-1,'#2f5233');P(x-7,y-1,'#26482c');}
function drawDeer(x,y,dir,t,ph,sc){
  sc=sc||1;
  G.save();
  G.translate(Math.round(x),Math.round(y));
  G.scale(dir<0 ? -1 : 1,1);
  if(sc!==1)G.scale(sc,sc);
  const st=(((t*1.1+ph)%2)+2)%2<1 ? 0 : 1;
  R(-2,-6,2,7,'#6f4a2e');R(3,-6,2,7,'#6f4a2e');
  R(st ? -4 : -5,-6,2,7,'#8a5f3c');
  R(st ? 0 : 1,-6,2,7,'#a87850');
  R(-7,-9,11,4,'#a87850');
  P(3,-7,'#d8b48c');
  R(-8,-9,1,2,'#e8ddc4');
  R(3,-12,2,4,'#a87850');
  R(3,-13,5,3,'#a87850');
  P(7,-11,'#3a2a1e');
  P(4,-12,'#3a2a1e');
  R(4,-14,1,2,'#8a5f3c');
  P(5,-15,'#d8b48c');P(5,-16,'#d8b48c');P(6,-16,'#d8b48c');
  P(7,-15,'#d8b48c');P(8,-16,'#d8b48c');
  G.restore();}
function drawRower(bx,by,t){
  const ph=Math.sin(t*2.1),lx=(ph<0 ? 0 : 1);
  R(bx-1+lx,by-4,3,4,'#4a4a5e');
  P(bx+lx,by-5,'#e8c9a0');
  R(bx-2+lx,by-6,4,1,'#c9a05a');
  const ox=Math.round(bx+4+ph*2),oy=Math.round(by+2+ph);
  line(bx+lx,by-3,ox,oy,'#8a7a62');
  R(ox+1,oy,2,1,'#b89a6a');}

/* ================= 地图 ================= */
const mapScene=(function(){
  const bg=mk(),sc={id:'map',name:'地图',t:0,hover:null,
    intro:'想去哪里？把光标移到想去的地方，选一个吧。'};
  const r=rng(20240301);
  const SEA=['#2c5a8c','#1b3d68','#0c2144'];
  on(bg,function(){
    grad(0,0,W,150,[[0,'#060915'],[.45,'#0c1128'],[.72,'#1a2048'],[1,'#2b2c58']]);
    const stars=makeStars(110,771,90,[252,30,30]);
    drawStars(stars,0);
    A(.45,function(){halo(252,30,9,26,'#b9b6e0',.5);});
    disc(252,30,9,'#f2e9cd');
    disc(254,27,8,'#151a38');
    ridge(120,20,2.7,'#232f58','#5f739f');
    ridge(132,14,5.9,'#10193a');
    grad(0,132,W,48,[[0,'#16301f'],[1,'#0a1811']]);
    for(let x=116;x<=204;x++){
      const u=(x-116)/88*Math.PI,top=124+22*(1-Math.sin(u));
      for(let y=Math.round(top);y<H;y++)
        P(x,y,(y-top)<1.2 ? '#2f5233' : (bay(x,y)<.4 ? '#1d3b26' : '#16301e'));}
    for(let x=202;x<W;x++){
      const e=208+Math.sin(x*.42)*3+Math.sin(x*.13)*2.5;
      for(let y=136;y<H;y++){
        if(x<e)continue;
        const u=(y-136)/44*3,i=Math.min(2,Math.floor(u)),f=u-Math.floor(u);
        P(x,y,bay(x,y)<f ? SEA[Math.min(2,i+1)] : SEA[i]);}}
    poly([[160,110],[140,134],[180,134]],function(x){return x<158 ? (bay(x,160)<.5 ? '#e8c47e' : '#ddb66e') : (bay(x,160)<.5 ? '#c99a56' : '#bb8e4c');});
    line(160,110,140,134,'#8a6a3a');line(160,110,180,134,'#8a6a3a');
    R(157,122,6,12,'#2a1b10');R(158,128,4,6,'#3a2714');
    const PX=[12,26,42,58,74,92,106];
    for(const px of PX){const h=22+r()*16,b=158+r()*14;pine(px,b,h,10+r()*4,'#16351f','#24492c');}
    mushroom(86,152);mushroom(30,170);
    for(let i=0;i<8;i++){const yy=176-i*6,xx=Math.round(160+Math.sin(i*1.9)*10);
      R(xx-2,yy,4,1,'#3f4752');P(xx-1,yy-1,'#565f6c');}
    R(185,133,1,12,'#43352a');R(183,128,5,5,'#2e2118');R(184,129,3,3,'#ffca7a');
    A(.5,function(){halo(185,130,1,7,'#ffca7a',.6);});});
  const fg=mk();
  on(fg,function(){
    const r2=rng(606);
    const PX2=[6,36,66,100];
    for(const px of PX2){const h=30+r2()*18,b=176+r2()*6;pine(px,b,h,14+r2()*6,'#0e2415','#1d3d24');}
    for(const gx of [16,52,88,120])for(let i=0;i<6;i++)P(gx+i,178-((i*5)%3),'#1c3a26');});
  const glowDoor=bakeGlow(15,255,202,120);
  const glowLan=bakeGlow(10,255,190,110);
  const flies=[];
  (function(){const fr=rng(913);
    for(let i=0;i<11;i++){const fx=i<7 ? (14+fr()*130) : (130+fr()*80);
      flies.push({x:fx,y:100+fr()*62,ph:fr()*6.28,sp:.25+fr()*.5,amp:5+fr()*9});}})();
  function ditherOv(x0,y0,w,h){
    const L=mk(w,h);
    on(L,function(){for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(bay(x0+i,y0+j)<.5)P(i,j,'#ffe9b8');});
    return L.c;}
  const ovF=ditherOv(0,88,112,92);
  const ovT=ditherOv(112,104,94,76);
  const ovS=ditherOv(206,136,114,44);
  sc.enter=function(){sc.hover=null;};
  sc.draw=function(t){
    sc.t=t;
    G.drawImage(bg.c,0,0);
    const du=(t/22)%2,dph=du<1 ? du : 2-du,ddir=du<1 ? 1 : -1,dxv=28+dph*76;
    drawDeer(dxv,166,ddir,t,0,1);
    drawDeer(dxv-ddir*13,168,ddir,t,.55,.72);
    drawBunny(50,172,t);
    G.drawImage(fg.c,0,0);
    for(const f of flies){
      const fx=Math.round(f.x+Math.sin(t*f.sp+f.ph)*f.amp);
      const fy=Math.round(f.y+Math.sin(t*f.sp*.7+f.ph*2)*f.amp*.5);
      const tw=.35+.65*Math.sin(t*2.2+f.ph);
      A(clamp(tw,.12,1),function(){P(fx,fy,'#e9f27a');});
      if(tw>.86)A(.3,function(){halo(fx,fy,1,5,'#e9f27a',.7);});}
    A(.6,function(){
      G.fillStyle='#7fa7cf';
      for(let i=0;i<10;i++){const y=140+i*3.6,off=(t*7+i*29)%118;
        G.fillRect(Math.round(206+off),Math.round(y),3,1);}
      G.fillStyle='#5d87b4';
      for(let i=0;i<8;i++){const y=142+i*3.8,off=(t*5+i*41)%112;
        G.fillRect(Math.round(210+off),Math.round(y),2,1);}});
    const bx=Math.round(268+Math.sin(t*.16)*8),by=Math.round(156+Math.sin(t*1.1)*1.3);
    R(bx-5,by,10,2,'#5a3b2e');P(bx-6,by,'#5a3b2e');P(bx+5,by,'#5a3b2e');
    R(bx-4,by+2,8,1,'#3a251c');
    drawRower(bx,by,t);
    R(bx+4,by-8,2,3,'#2e2118');P(bx+5,by-7,'#ffca7a');
    A(.5,function(){R(bx-8,by+3,4,1,'#7fa7cf');R(bx+4,by+3,4,1,'#7fa7cf');});
    A(.4+.15*Math.sin(t*2.2),function(){G.drawImage(glowDoor,145,117);});
    A(.3+.12*Math.sin(t*1.7+2),function(){G.drawImage(glowLan,175,120);});
    if(sc.hover==='forest')A(.26+.14*Math.sin(t*5),function(){G.drawImage(ovF,0,88);});
    else if(sc.hover==='tent')A(.26+.14*Math.sin(t*5),function(){G.drawImage(ovT,112,104);});
    else if(sc.hover==='sea')A(.26+.14*Math.sin(t*5),function(){G.drawImage(ovS,206,136);});};
  return sc;
})();

/* ================= 三个场景 ================= */
const forest=(function(){
  const bg=mk(),sc={id:'forest',name:'森林',paper:{x:150,y:150},t:0,
    intro:'森林里很安静。写点什么都不用怕，萤火虫不打听。'};
  const r=rng(517);
  on(bg,function(){
    grad(0,0,W,150,[[0,'#050812'],[.5,'#0b1226'],[.8,'#17203f'],[1,'#232b4e']]);
    const stars=makeStars(120,231,92,[262,40,26]);
    drawStars(stars,0);
    A(.4,function(){halo(262,40,8,24,'#aab8dc',.5);});
    disc(262,40,8,'#f2e9cd');disc(264,37,7,'#141a36');
    ridge(118,18,4.1,'#1b2748','#4d5f8c');
    ridge(130,12,7.7,'#0e1730');
    grad(0,132,W,48,[[0,'#132a1c'],[1,'#081209']]);
    for(let x=118;x<=182;x++){const u=(x-118)/64*Math.PI;
      for(let y=Math.round(148-6*Math.sin(u));y<H;y++)if(bay(x,y)<.5)P(x,y,'#1b3520');}
    const PX=[16,34,52,72,90,108,126,146,166,186,208,232,258,286,308];
    for(const px of PX){const h=20+r()*20,b=152+r()*16;pine(px,b,h,9+r()*5,'#14301c','#22462a');}
    const PX2=[8,44,84,204,250,300];
    for(const px of PX2){const h=30+r()*20,b=176+r()*6;pine(px,b,h,13+r()*7,'#0c2013','#1a3a20');}
    mushroom(100,168);mushroom(210,164);
    for(let i=0;i<8;i++){const yy=174-i*5,xx=Math.round(150+Math.sin(i*2.1)*6);
      R(xx-2,yy,4,1,'#3a4250');}});
  const flies=[];
  (function(){const fr=rng(88);
    for(let i=0;i<9;i++)flies.push({x:30+fr()*250,y:104+fr()*56,ph:fr()*6.28,sp:.3+fr()*.5,amp:5+fr()*10});})();
  const hz=[];
  (function(){const fr=rng(312);
    for(let i=0;i<6;i++)hz.push({y:112+fr()*54,sp:8+fr()*10,ph:fr()*300});})();
  sc.enter=function(){after=null;crane=null;flying=null;parts.length=0;};
  sc.spot=function(s1){
    const s=(s1==null ? .55 : s1);
    if(s>.7)return{x:126,y:146};
    if(s>.35)return{x:152,y:116};
    return{x:226,y:88};};
  sc.update=function(dt,t){
    if(!(after&&!after.done))return;
    after.t+=dt;
    if(after.phase==='land'&&after.t>.5){after.phase='rise';after.t=0;sfx('poof');
      for(let i=0;i<7;i++)spawn(after.x+(Math.random()-.5)*6,after.y-2,'#e9f27a',{vx:(Math.random()-.5)*8,vy:-6-Math.random()*8,g:-1.2,life:1.2+Math.random()*.8,tw:1});
      for(let i=0;i<4;i++)spawn(after.x+(Math.random()-.5)*8,after.y,'#f6efdc',{vx:(Math.random()-.5)*10,vy:-4-Math.random()*6,g:6,life:.6,tw:1});}
    else if(after.phase==='rise'&&after.t>1.5)after.done=true;
    else if(after.phase==='glide'){
      after.x+=dt*22;after.y-=dt*7;
      if(Math.random()<.3)spawn(after.x,after.y,'#ffe9b8',{vx:-6,vy:-2,g:0,life:.7,tw:1});
      if(after.x>300){after.phase='star';after.t=0;}}
    else if(after.phase==='star'&&after.t>1.2)after.done=true;};
  sc.makeAfter=function(f,far){
    if(far){after={t:0,phase:'glide',x:f.tx,y:f.ty,far:true,done:false};
      say('它没有停，往山脊外飞去了……',3600);}
    else{after={t:0,phase:'land',x:f.tx,y:f.ty,far:false,done:false};
      sfx('land');dust(f.tx,f.ty);}};
  sc.end=function(a,far){return far ?
    '纸鹤掠过山脊，亮了一小下，像一颗很远的星。晚安。' :
    '它落在松针旁边，散成了几只萤火虫。今晚那些话，有人听见了。';};
  sc.draw=function(t){
    sc.t=t;
    G.drawImage(bg.c,0,0);
    A(.5,function(){G.fillStyle='#25365c';
      for(const h of hz){const x=Math.round((h.ph+t*h.sp)%330-5);
        G.fillRect(x,Math.round(h.y),5,1);G.fillRect(x+8,Math.round(h.y)+7,4,1);}});
    for(const f of flies){
      const fx=Math.round(f.x+Math.sin(t*f.sp+f.ph)*f.amp);
      const fy=Math.round(f.y+Math.sin(t*f.sp*.7+f.ph*2)*f.amp*.5);
      const tw=.35+.65*Math.sin(t*2+f.ph);
      A(clamp(tw,.12,1),function(){P(fx,fy,'#e9f27a');});
      if(tw>.86)A(.3,function(){halo(fx,fy,1,5,'#e9f27a',.7);});}
    if(after&&!after.said){
      if(after.phase==='land')drawCrane(after.x,after.y,true,t*2,.95,1,1);
      else if(after.phase==='rise'){const u=clamp(after.t/1.5,0,1);
        drawCrane(after.x,after.y-u*10,false,t*3.2,1,1-u,1);}
      else if(after.phase==='glide')drawCrane(after.x,after.y,false,t*3.4,.8,clamp(1-(after.x-226)/90,0,1),1);
      else if(after.phase==='star'){const tw=.5+.5*Math.sin(t*6);
        A(clamp(tw,.2,1),function(){P(after.x,after.y,'#ffe9b8');
          P(after.x-1,after.y,'#fff8e0');P(after.x+1,after.y,'#fff8e0');
          P(after.x,after.y-1,'#fff8e0');P(after.x,after.y+1,'#fff8e0');});}}};
  return sc;
})();

const sea=(function(){
  const bg=mk(),sc={id:'sea',name:'海边',paper:{x:30,y:139},t:0,
    intro:'海边只剩浪声。写吧，浪会替你把它捎远。'};
  on(bg,function(){
    grad(0,0,W,110,[[0,'#04060f'],[.5,'#0a1024'],[.85,'#182445'],[1,'#243052']]);
    const stars=makeStars(110,455,86,[236,62,30]);
    drawStars(stars,0);
    A(.5,function(){halo(236,62,10,30,'#d8d2ea',.6);});
    disc(236,62,11,'#f4ecd4');
    disc(238,59,10,'#141a36');
    ridge(104,10,3.3,'#101b38');
    grad(0,108,W,72,[[0,'#20486e'],[.35,'#16375a'],[1,'#081830']]);
    for(let x=0;x<W;x++){const uj=Math.round(112+Math.sin(x*.5)*1.6);
      for(let y=uj;y<uj+2;y++)P(x,y,'#2c5a8c');}
    for(let y=112;y<H;y++){
      const u=(y-112)/68*3,i=Math.min(2,Math.floor(u)),f=u-Math.floor(u);
      if(i<2)for(let x=0;x<W;x++)if(bay(x,y)<f)P(x,y,['#20486e','#16375a','#081830'][i+1]);}
    for(let y=112;y<H;y++){const w2=8+(y-112)*.5;
      for(let x=Math.round(236-w2/2+Math.sin(y*.6)*2);x<236+w2/2;x++)
        if(bay(x,y)<.5&&((x+y)%3))P(x,y,y>140 ? '#6fa0c8' : '#8fb8d8');}
    for(let x=0;x<52;x++){
      const c=138+Math.sin(x*.3)*3+Math.sin(x*.11)*4;
      for(let y=Math.round(c);y<H;y++)P(x,y,(y-c)<1.4 ? '#3f4456' : (bay(x,y)<.45 ? '#2a2f42' : '#1d2230'));}
    mushroom(22,144);});
  const hz=[];
  (function(){const fr=rng(51);
    for(let i=0;i<7;i++)hz.push({y:116+fr()*56,sp:9+fr()*12,ph:fr()*300});})();
  sc.spot=function(s1){
    const s=(s1==null ? .55 : s1);
    if(s>.7)return{x:96,y:116};
    if(s>.35)return{x:150,y:108};
    return{x:280,y:40};};
  sc.update=function(dt,t){
    if(!(after&&!after.done))return;
    after.t+=dt;
    if(after.phase==='touch'&&after.t>.4){after.phase='skip';after.t=0;sfx('drip');}
    else if(after.phase==='skip'&&after.t>.5){after.phase='skip2';after.t=0;sfx('drip');
      for(let i=0;i<8;i++)spawn(after.x,after.y,'#9fc4e0',{vx:(Math.random()-.5)*14,vy:-6-Math.random()*6,g:5,life:.6});}
    else if(after.phase==='skip2'&&after.t>.5){after.phase='moon';after.t=0;sfx('woosh');}
    else if(after.phase==='moon'&&after.t>1.3){after.phase='gone';after.t=0;}
    else if(after.phase==='gone'&&after.t>.6)after.done=true;
    else if(after.phase==='glide'){
      after.x+=dt*16;after.y-=dt*6;after.vy2=(after.vy2||0)+dt*4;after.y+=after.vy2*dt;
      if(Math.random()<.4)spawn(after.x,after.y,'#cfe0f4',{vx:2,vy:2,g:0,life:.6,tw:1});
      if(after.t>1.8)after.done=true;}};
  sc.makeAfter=function(f,far){
    if(far){after={t:0,phase:'glide',x:f.tx,y:f.ty,far:true,done:false};
      say('它没落在水上，追着月光去了。',3400);}
    else{after={t:0,phase:'touch',x:f.tx,y:f.ty,far:false,done:false};sfx('drip');
      for(let i=0;i<10;i++){const ag=i/10*6.283;
        spawn(f.tx+Math.cos(ag)*2,f.ty+Math.sin(ag)*.6,'#9fc4e0',{vx:Math.cos(ag)*12,vy:-3,g:4,life:.8,tw:1});}}};
  sc.end=function(a,far){return far ?
    '它贴着浪尖滑了很远，最后变成一道亮线，融进月光里。' :
    '它在浪上跳了两下，就跟着月光走了。浪替你把它捎远了。';};
  sc.draw=function(t){
    sc.t=t;
    G.drawImage(bg.c,0,0);
    A(.5,function(){G.fillStyle='#25365c';
      for(const h of hz){const x=Math.round((h.ph+t*h.sp)%330-5);
        G.fillRect(x,Math.round(h.y),5,1);}});
    A(.5,function(){G.fillStyle='#7fa7cf';
      for(let i=0;i<14;i++){const y=114+i*4.4,off=(t*6+i*31)%140;
        G.fillRect(Math.round(off),Math.round(y),3,1);}
      G.fillStyle='#5d87b4';
      for(let i=0;i<10;i++){const y=116+i*4.6,off=(t*4+i*47)%150;
        G.fillRect(Math.round(20+off),Math.round(y),2,1);}});
    const by=Math.round(126+Math.sin(t*1.05)*1.5);
    const bxi=Math.round(150+Math.sin(t*.14)*10);
    for(let r2=0;r2<5;r2++)R(bxi-12+r2*2,by+r2,24-4*r2,1,r2<2 ? '#6b4a38' : (r2<4 ? '#5a3b2e' : '#3a251c'));
    P(bxi-13,by,'#6b4a38');P(bxi+12,by,'#6b4a38');
    R(bxi-11,by-1,22,1,'#8a6248');
    drawRower(bxi,by,t);
    R(bxi-11,by-6,2,4,'#2e2118');P(bxi-10,by-5,'#ffca7a');
    A(.45,function(){halo(bxi-10,by-5,1,6,'#ffca7a',.6);});
    A(.5,function(){R(bxi-16,by+4,5,1,'#7fa7cf');R(bxi+9,by+4,6,1,'#7fa7cf');R(bxi+14,by+5,3,1,'#6b96c0');});
    if(after&&!after.said){
      if(after.phase==='touch'){drawCrane(after.x,after.y,true,t*2,.95,1,1);
        A(.5,function(){halo(after.x,after.y+1,1,7,'#9fc4e0',.5);});}
      else if(after.phase==='skip'||after.phase==='skip2'){
        const u=clamp(after.t/.5,0,1),ho=Math.sin(u*Math.PI)*9;
        drawCrane(after.x,after.y-ho,false,t*3.6,1,1,1);
        if(u>.9)A(.4,function(){halo(after.x,after.y+1,1,6,'#9fc4e0',.5);});}
      else if(after.phase==='moon'){const u=clamp(after.t/1.3,0,1);
        const ex=after.x+(258-after.x)*u,ey=after.y-(after.y-46)*u;
        drawCrane(ex,ey,false,t*4,lerp(1,.7,u),1-u*.85,1);
        if(Math.random()<.5)spawn(ex,ey,'#ffe9b8',{vx:-4,vy:6,g:0,life:.7,tw:1});}
      else if(after.phase==='glide')drawCrane(after.x,after.y,false,t*4,.8,clamp(1-after.t/1.8,0,1),1);}};
  return sc;
})();

const tent=(function(){
  const bg=mk(),fab=mk(),door=mk(),sc={id:'tent',name:'营地',paper:{x:160,y:138},t:0,
    intro:'帐篷里很静。写给谁都可以，纸鹤认得路。'},
    TS={c:0,zipping:false,unzipping:false,closed:false,zt:0,zs:0};
  sc.tstate=TS;
  /* 布面 */
  on(fab,function(){
    grad(0,0,W,H,[[0,'#463a26'],[.3,'#3b2f1e'],[.65,'#312718'],[1,'#271f11']]);
    const r=rng(313);
    for(let i=0;i<300;i++)P(Math.floor(r()*W),Math.floor(r()*H),'#332818');
    for(let i=0;i<190;i++)P(Math.floor(r()*W),Math.floor(r()*H),'#645234');
    for(let i=0;i<22;i++){const sy=Math.floor(r()*H);line(0,sy,W,sy+Math.round((r()-.5)*4),'#463823');}
    A(.3,function(){line(160,24,38,156,'#6a5838');line(160,24,282,156,'#6a5838');});});
  /* 门帘 */
  on(door,function(){
    G.save();G.beginPath();G.moveTo(160,24);G.lineTo(36,156);G.lineTo(284,156);G.closePath();G.clip();
    G.drawImage(fab.c,0,0);G.restore();
    A(.5,function(){line(160,24,36,156,'#241b0e');line(160,24,284,156,'#241b0e');});});
  /* 内景 */
  on(bg,function(){
    G.drawImage(fab.c,0,0);
    G.save();G.beginPath();G.moveTo(160,24);G.lineTo(36,156);G.lineTo(284,156);G.closePath();G.clip();
    grad(0,0,W,H,[[0,'#070b1c'],[1,'#101632']]);
    const r=rng(97);
    for(let i=0;i<46;i++)P(Math.floor(r()*W),Math.floor(r()*84),'#cfd6ee');
    A(.5,function(){halo(148,62,10,26,'#d8d2ea',.55);});
    disc(148,62,7,'#f2e9cd');disc(150,60,6,'#101632');
    ridge(76,26,4.2,'#1c2748');
    ridge(92,20,7.7,'#101a38');
    grad(0,104,W,52,[[0,'#101820'],[1,'#070c10']]);
    A(.35,function(){for(let x=0;x<W;x++){const h2=4+Math.sin(x*1.7)*2+Math.sin(x*.31)*3;
      P(x,112-Math.round(h2),'#0c1420');}});
    G.restore();
    line(160,24,36,156,'#241b0e');line(160,24,284,156,'#241b0e');
    radFill(0,152,W,28,160,150,120,[[0,'#3a2c1a'],[.55,'#261c10'],[1,'#130d07']]);
    for(let x=2;x<W;x+=7)P(x,158+(x%5),'#1c140c');
    R(0,152,W,1,'#120c06');
    R(8,155,90,15,'#7a5644');R(8,155,90,4,'#8f6a52');
    R(8,155,14,15,'#9a7860');R(10,157,10,11,'#8a6a52');
    A(.5,function(){line(24,164,96,164,'#4e3428');});
    R(8,168,90,2,'#513728');
    R(196,158,20,15,'#4a4a5e');R(198,154,16,5,'#3a3a4c');R(203,151,6,4,'#2e2e3e');
    R(120,166,6,9,'#2e2118');R(128,166,6,9,'#2e2118');
    R(120,175,7,2,'#1c140e');R(128,175,7,2,'#1c140e');
    R(240,158,18,15,'#5a4430');R(240,164,18,1,'#3e2e20');R(248,158,1,15,'#3e2e20');
    line(160,2,160,9,'#43352a');
    R(153,9,14,5,'#2e2118');
    P(154,14,'#ffca7a');P(160,14,'#ffca7a');P(166,14,'#ffca7a');
    A(.18,function(){halo(158,152,6,20,'#ffca7a',.4);});});
  const glowLamp=bakeGlow(9,255,190,110);
  sc.enter=function(){sc.hover=null;parts.length=0;};
  sc.spot=function(s1){
    const s=(s1==null ? .55 : s1);
    if(s>.7)return{x:224,y:168};
    if(s>.35)return{x:118,y:170};
    return{x:160,y:9};};
  sc.update=function(dt,t){
    if(TS.zipping){
      TS.zt+=dt;
      const u=clamp(TS.zt/2.6,0,1);
      TS.c=u<.32 ? u/.32*.54 : (u<.55 ? .54 : .54+(u-.55)/.45*.46);
      TS.zs+=dt;
      if(TS.zs>.2&&TS.c<.985){TS.zs=0;sfx('zip');}
      if(TS.c>=.985){TS.c=1;TS.zipping=false;TS.closed=true;sfx('clack');syncUI();
        for(let i=0;i<6;i++)spawn(160+(Math.random()-.5)*10,26+Math.random()*6,'#ffca7a',{vx:(Math.random()-.5)*12,vy:-3-Math.random()*5,g:7,life:.5,tw:1});}}
    if(TS.unzipping){
      TS.c=Math.max(0,TS.c-dt/1.3);
      TS.zs+=dt;if(TS.zs>.25){TS.zs=0;sfx('zip');}
      if(TS.c<=0){TS.c=0;TS.unzipping=false;TS.closed=false;sfx('clack');say('拉开了。夜风吹进来。',3200);syncUI();}}
    if(!(after&&!after.done))return;
    after.t+=dt;
    if(after.phase==='land'&&after.t>.5){after.t=0;
      if(after.way.length>1){after.phase='hop';after.hi=0;sfx('land');dust(after.way[0][0],after.way[0][1]);}
      else after.phase='settle';}
    else if(after.phase==='hop'&&after.t>.42){
      after.t=0;after.hi++;
      sfx('land');dust(after.way[after.hi][0],after.way[after.hi][1]);
      if(after.hi>=after.way.length-1)after.phase='settle';}
    else if(after.phase==='settle'&&after.t>1.2){after.phase='zip';after.t=0;
      if(!TS.closed){TS.zipping=true;TS.zt=0;sfx('zip');}}
    else if(after.phase==='zip'&&TS.closed)after.done=true;
    else if(after.phase==='glide'){
      after.x+=dt*20;after.y-=dt*5;
      if(Math.random()<.3)spawn(after.x,after.y,'#f6efdc',{vx:6,vy:-2,g:0,life:.8,tw:1});
      if(after.t>1.6){after.phase='star';after.t=0;}}
    else if(after.phase==='star'&&after.t>1.1)after.done=true;};
  sc.makeAfter=function(f,far){
    if(far){after={t:0,phase:'land',x:f.tx,y:f.ty,far:true,done:false,way:[[f.tx,f.ty]],rest:{x:160,y:9,dir:1}};
      sfx('land');}
    else{after={t:0,phase:'land',x:f.tx,y:f.ty,far:false,done:false,
      way:[[f.tx,f.ty],[(f.tx+56)/2,(f.ty+155)/2+2],[56,155]],rest:{x:52,y:155,dir:1}};
      sfx('land');dust(f.tx,f.ty);}};
  sc.end=function(a,far){return far ?
    '它落在吊灯上，安安静静。拉链拉上了，今晚只属于你。' :
    '它跳上睡袋，蜷成一团。拉链拉上了，今晚只属于你。';};
  sc.draw=function(t){
    sc.t=t;
    G.drawImage(bg.c,0,0);
    const fl=.88+.12*Math.sin(t*7.3)+.05*Math.sin(t*23);
    A(.8*fl,function(){G.drawImage(glowLamp,160-9,14-9);});
    A(.7*fl,function(){P(160,14,'#ffca7a');P(159,14,'#ffd9a0');P(161,14,'#ffd9a0');});
    const cq=Math.round(TS.c*22)/22;
    if(cq>0){
      const closeY=Math.round(lerp(156,24,cq));
      G.save();G.beginPath();G.rect(0,closeY,W,H-closeY);G.clip();
      G.drawImage(door.c,0,0);G.restore();
      for(let y=closeY+1;y<156;y+=3){
        const hw=(y-24)/132*124+2;
        P(Math.round(160-hw),y,'#d8c9a4');P(Math.round(160+hw),y,'#d8c9a4');
        if((y-closeY)%6<3){P(Math.round(160-hw)+1,y,'#8a795c');P(Math.round(160+hw)-1,y,'#8a795c');}}
      R(157,closeY-3,6,4,'#c9a05a');P(159,closeY-1,'#e8d9b0');P(160,closeY+1,'#8a6a3a');
      if(TS.zipping)A(.5+.4*Math.sin(t*30),function(){P(155,closeY-4,'#ffe9b8');P(165,closeY-4,'#ffe9b8');});
    }
    if(after){
      const rp=after.rest||{x:52,y:156,dir:1};
      if(after.done){if(!crane)drawCrane(rp.x,rp.y,true,t*1.5,.9,1,rp.dir||1);}
      else if(after.phase==='land')drawCrane(after.x,after.y,true,t*2,.95,1,after.x<160?-1:1);
      else if(after.phase==='hop'){
        const a=after.way[after.hi],b=after.way[after.hi+1];
        const u=clamp(after.t/.42,0,1);
        const x=lerp(a[0],b[0],u),y=lerp(a[1],b[1],u)-Math.sin(u*Math.PI)*6;
        drawCrane(x,y,false,t*3.4,1,1,b[0]>=a[0] ? 1 : -1);}
      else if(after.phase==='settle'||after.phase==='zip')drawCrane(rp.x,rp.y,true,t*1.7,.92,1,rp.dir||1);
      else if(after.phase==='glide')drawCrane(after.x,after.y,false,t*4,.8,clamp(1-after.t/1.6,0,1),1);
      else if(after.phase==='star'){const tw=.5+.5*Math.sin(t*6);
        A(clamp(tw,.2,1),function(){P(after.x,after.y,'#ffe9b8');
          P(after.x-1,after.y,'#fff8e0');P(after.x+1,after.y,'#fff8e0');
          P(after.x,after.y-1,'#fff8e0');P(after.x,after.y+1,'#fff8e0');});}}
  };
  return sc;
})();

/* ================= 本地存储与声音 ================= */
/* 优先小工具 Storage JS API（客户端 9.46+），未满足版本条件时回退浏览器存储 */
const XHS_STORAGE_MIN_CLIENT_VERSION=9460;
function readBuildVersion(lo){const e=lo&&lo.miniToolEnv;return Number(e&&e.buildVersion)||0;}
function getClientVersion(bv){return Math.floor((Number(bv)||0)/1000);}
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true;}catch(e){return false;}}
function load(k,d){const v=lsGet(k);return v==null ? d : v;}
let nativeStore=null;
function save(k,v){
  lsSet(k,v);
  if(nativeStore)try{nativeStore.setStorage({key:k,data:String(v),fail:function(){}});}catch(e){}}
function detectNativeStore(){
  const x=window.xhs,mt=x&&x.miniTool;
  if(!mt)return;
  const use=function(bv){
    if(getClientVersion(bv)<XHS_STORAGE_MIN_CLIENT_VERSION)return;
    if(typeof mt.setStorage!=='function'||typeof mt.getStorage!=='function')return;
    nativeStore=mt;pullNativeStore();};
  const sync=readBuildVersion(x.launchOptions);
  if(sync){use(sync);return;}
  if(typeof mt.getLaunchOptions==='function'){
    try{mt.getLaunchOptions({success:function(o){use(readBuildVersion(o));},fail:function(){}});}catch(e){}}
}
function pullNativeStore(){
  if(!nativeStore||typeof nativeStore.getStorage!=='function')return;
  ['night-count','night-sound','night-papers'].forEach(function(k){
    try{nativeStore.getStorage({key:k,
      success:function(res){
        if(!res||res.data==null)return;
        if(lsGet(k)==null)lsSet(k,res.data);
        applyStored(k,res.data);},
      fail:function(){}});}catch(e){}
  });}
function applyStored(k,v){
  if(k==='night-count'){const n=parseInt(v,10);if(isFinite(n)&&n!==count){count=n;syncUI();}}
  else if(k==='night-sound'){if((v==='1')!==soundOn)setSound(v==='1');}
  else if(k==='night-papers'){try{const arr=JSON.parse(v);
    if(Array.isArray(arr)){papers=arr;if($('#bw').classList.contains('show'))renderBook();syncUI();}}catch(e){}}}
function setSound(s){
  soundOn=s;save('night-sound',s ? '1' : '0');
  if(master&&AC)master.gain.setTargetAtTime(s ? .5 : 0,AC.currentTime,.05);
  if(s){if(AC&&AC.state==='suspended')AC.resume();
    if(scene&&scene!==mapScene)startAmb(scene.id);}
  else stopAmb();
  syncSnd();}
let AC=null,master=null,NB=null,amb=null;
let soundOn=load('night-sound','1')==='1';
function ensureAudio(){
  if(AC)return;
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  AC=new C();
  master=AC.createGain();master.gain.value=soundOn ? .5 : 0;master.connect(AC.destination);
  const n=Math.floor(AC.sampleRate*.9);
  NB=AC.createBuffer(1,n,AC.sampleRate);
  const d=NB.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;}
function tone(f,dur,type,vol,slide){if(!AC)return;
  const t0=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f,t0);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,slide),t0+dur);
  g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol||.14,t0+.01);
  g.gain.exponentialRampToValueAtTime(.0008,t0+dur);
  o.connect(g);g.connect(master);o.start(t0);o.stop(t0+dur+.03);}
function nz(dur,vol,f0,f1,q,type){if(!AC)return;
  const t0=AC.currentTime,s=AC.createBufferSource();s.buffer=NB;
  const f=AC.createBiquadFilter();f.type=type||'bandpass';f.Q.value=q||1;
  f.frequency.setValueAtTime(f0,t0);
  if(f1)f.frequency.exponentialRampToValueAtTime(f1,t0+dur);
  const g=AC.createGain();g.gain.setValueAtTime(vol||.2,t0);
  g.gain.exponentialRampToValueAtTime(.0008,t0+dur);
  s.connect(f);f.connect(g);g.connect(master);s.start(t0);s.stop(t0+dur+.03);}
function sfx(k){if(!AC||!soundOn)return;
  if(k==='clack'){nz(.025,.22,1700,2600,.9,'highpass');tone(200,.03,'square',.05,150);}
  else if(k==='bell'){tone(1568,.5,'sine',.1);tone(3136,.18,'sine',.03);}
  else if(k==='fold'){for(let i=0;i<3;i++)(function(j){setTimeout(function(){nz(.06,.3,800+j*500,1400+j*500,1.1);},j*75);})(i);}
  else if(k==='poof'){nz(.22,.3,700,180,.8,'lowpass');}
  else if(k==='woosh'){nz(.5,.26,320,1000,.7);}
  else if(k==='land'){tone(130,.09,'sine',.24,88);nz(.05,.14,600,300,.9,'lowpass');}
  else if(k==='drip'){tone(920,.12,'sine',.2,320);}
  else if(k==='zip'){for(let i=0;i<6;i++)(function(j){setTimeout(function(){tone(1250-j*115,.04,'square',.06);},j*45);})(i);}
  else if(k==='chime'){tone(880,.5,'sine',.09);setTimeout(function(){tone(1318,.6,'sine',.07);},130);}}
function startAmb(id){if(!AC||!soundOn)return;if(amb&&amb.id===id)return;stopAmb();
  if(id==='forest'){
    amb={id:id,timer:setInterval(function(){
      if(!soundOn||!AC)return;const n=2+Math.floor(Math.random()*3);
      for(let i=0;i<n;i++)(function(j){setTimeout(function(){tone(4100+Math.random()*900,.05,'sine',.03);},j*75);})(i);
    },1100)};}
  else{
    const s=AC.createBufferSource();s.buffer=NB;s.loop=true;
    const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=id==='sea' ? 650 : 360;
    const g=AC.createGain();g.gain.value=id==='sea' ? .045 : .035;
    const lfo=AC.createOscillator(),lg=AC.createGain();
    lfo.frequency.value=id==='sea' ? .16 : .07;lg.gain.value=id==='sea' ? .035 : .015;
    lfo.connect(lg);lg.connect(g.gain);
    s.connect(f);f.connect(g);g.connect(master);s.start();lfo.start();
    amb={id:id,s:s,lfo:lfo};}}
function stopAmb(){if(!amb)return;
  if(amb.timer)clearInterval(amb.timer);
  try{if(amb.s){amb.s.stop();amb.lfo.stop();}}catch(e){}
  amb=null;}

/* ================= 界面与状态 ================= */
const scenes={forest:forest,sea:sea,tent:tent};
const REGION_INFO={forest:{t:'森林',d:'萤火虫、松树和很静的夜'},sea:{t:'海边',d:'有浪，有小船，还有月光'},tent:{t:'营地',d:'一盏小灯，纸鹤的家'}};
const REGION_ANCHOR={forest:{x:62,y:120},tent:{x:160,y:112},sea:{x:264,y:142}};
let count=parseInt(load('night-count','0'),10)||0;
let papers=[];try{papers=JSON.parse(load('night-papers','[]'));if(!Array.isArray(papers))papers=[];}catch(e){papers=[];}
let pendingPaper=null;
let lastR=null,tapT=0,lastClackT=0,sayTimer=null,unlocked=false;

function fit(){
  const vw=document.documentElement.clientWidth||window.innerWidth;
  const vh=(window.visualViewport&&window.visualViewport.height)||window.innerHeight;
  const wrap=document.querySelector('.wrap'),head=document.querySelector('header'),hud=$('#hud'),stage=$('#stage');
  const cs=getComputedStyle(wrap),bs=getComputedStyle(document.body);
  const padX=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0);
  const padY=(parseFloat(bs.paddingTop)||0)+(parseFloat(bs.paddingBottom)||0);
  const gap=(parseFloat(cs.rowGap)||12)*2;
  const availW=Math.min(wrap.clientWidth-padX,vw<560 ? Infinity : 900);
  const availH=vh-padY-head.offsetHeight-hud.offsetHeight-gap-8;
  const k=Math.max(1,Math.min(availW/W,availH/H));
  stage.style.width=Math.round(W*k)+'px';
  $('#cap').style.fontSize=Math.round(12*Math.min(2,Math.max(1,k)))+'px';}
window.addEventListener('resize',fit);
window.addEventListener('orientationchange',function(){setTimeout(fit,120);});
if(window.visualViewport)window.visualViewport.addEventListener('resize',fit);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);

function say(msg,ms){const el=$('#cap');el.textContent=msg;el.classList.add('show');
  clearTimeout(sayTimer);sayTimer=setTimeout(function(){el.classList.remove('show');},ms||4800);}

function hintText(){
  if(!scene||scene===mapScene)return '把光标移到想去的地方，点一下。';
  if(state==='aim')return '纸鹤在等你。选一个距离，或者再改改。';
  if(state==='fly')return '看着它飞。';
  if(state==='after')return '……';
  if(scene===tent&&tent.tstate.closed)return '拉链拉着。想再写的话，把它拉开。';
  return '在信纸上写点什么都行，然后把它折成纸鹤。';}

function syncUI(){
  const inScene=!!scene&&scene!==mapScene;
  $('#bMap').style.display=inScene ? '' : 'none';
  $('#bWrite').style.display=inScene ? '' : 'none';
  $('#bWrite').disabled=state!=='idle';
  $('#bWrite').textContent=(scene===tent&&tent.tstate.closed) ? '拉开帐篷' : '写一张小纸条';
  $('#bBook').textContent=papers.length>0 ? ('纸鹤簿 · '+papers.length) : '纸鹤簿';
  $('#row2').style.display=(inScene&&state==='aim') ? '' : 'none';
  $('#hint').textContent=hintText();
  $('#cnt').textContent=count>0 ? ('已放飞 '+count+' 只纸鹤') : '';
  fit();}

function escHTML(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function renderBook(){
  const L=$('#bkList');
  if(!papers.length){L.innerHTML='<div class="bkempty">还空着。放飞第一只纸鹤，它会回到这里。</div>';return;}
  L.innerHTML=papers.map(function(p){
    const meta=[p.d,(p.f ? ('《'+escHTML(p.f)+'》') : ''),p.s,p.p].filter(Boolean).join(' · ');
    return '<div class="bk"><div class="bm">'+meta+'</div><div class="bt">'+escHTML(p.t)+'</div></div>';}).join('');}
function openBook(){renderBook();$('#bw').classList.add('show');sfx('bell');}
function closeBook(){$('#bw').classList.remove('show');}

function regionAt(x,y){
  if(y<88)return null;
  if(x<112)return 'forest';
  if(x>206)return 'sea';
  return 'tent';}
function toScene(e){const r=cv.getBoundingClientRect();
  return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
function showLbl(r){const el=$('#lbl'),info=REGION_INFO[r],a=REGION_ANCHOR[r];
  const rect=cv.getBoundingClientRect(),k=rect.width/W;
  el.innerHTML='<b>'+info.t+'</b>'+info.d;
  el.style.left=(a.x*k)+'px';el.style.top=(a.y*k)+'px';el.classList.add('show');}
function hideLbl(){$('#lbl').classList.remove('show');}
function hoverRegion(r){
  if(mapScene.hover===r)return;
  if(r&&!mapScene.hover){const a=REGION_ANCHOR[r];
    sparkleBurst(a.x,a.y,['#ffe9b8','#fff8e0'],6,16,.5);}
  mapScene.hover=r;
  if(r)showLbl(r);else hideLbl();}

function enterScene(key){
  const sc=(key==='map') ? mapScene : scenes[key];if(!sc)return;
  scene=sc;crane=null;flying=null;after=null;state='idle';parts.length=0;
  mapScene.hover=null;hideLbl();
  cv.style.cursor='';cv.classList.toggle('aim',sc!==mapScene);
  if(sc.enter)sc.enter();
  if(sc===mapScene){stopAmb();say(sc.intro,4400);}
  else{startAmb(sc.id);say(sc.intro,5200);}
  syncUI();}

function openPaper(){const d=new Date();
  $('#pDate').textContent=(d.getMonth()+1)+'月'+d.getDate()+'日 · 夜';
  $('#pw').classList.add('show');pLenUp();
  setTimeout(function(){$('#pText').focus();},80);}
function closePaper(){$('#pw').classList.remove('show');}
function pLenUp(){$('#pLen').textContent=$('#pText').value.length+' / 600';}
const typey=function(el){el.addEventListener('input',function(){
  const now=performance.now();
  if(now-lastClackT>45){lastClackT=now;sfx('clack');}});};
typey($('#pText'));typey($('#pFilm'));
$('#pText').addEventListener('keydown',function(e){if(e.key==='Enter')sfx('bell');});
$('#pText').addEventListener('input',pLenUp);

function launch(key){
  if(state!=='aim'||!crane)return;
  const s1={near:.85,mid:.55,far:.2}[key];if(s1==null)return;
  const sp=scene.spot(s1);
  const c=crane;crane=null;
  if(pendingPaper){
    papers.unshift({d:pendingPaper.d,f:pendingPaper.f,t:pendingPaper.t,s:scene.name,
      p:{near:'近处',mid:'中距离',far:'远方'}[key],ts:Date.now()});
    if(papers.length>300)papers.length=300;
    save('night-papers',JSON.stringify(papers));pendingPaper=null;}
  flying=sideAim(c.x,c.y-3,sp.x,sp.y,s1);pointAt(flying);
  state='fly';syncUI();sfx('woosh');
  spawn(c.x,c.y-6,'#f6efdc',{vx:0,vy:-16,g:5,life:.5,tw:1});
  spawn(c.x-3,c.y-8,'#f6efdc',{vx:-9,vy:-8,g:6,life:.45,tw:1});
  spawn(c.x+3,c.y-8,'#f6efdc',{vx:9,vy:-8,g:6,life:.45,tw:1});}

function syncSnd(){$('#bSnd').textContent='声音：'+(soundOn ? '开' : '关');}
function unlock(){if(unlocked)return;unlocked=true;ensureAudio();
  if(AC&&AC.state==='suspended')AC.resume();
  if(soundOn&&scene&&scene!==mapScene)startAmb(scene.id);}
window.addEventListener('pointerdown',unlock);
window.addEventListener('keydown',unlock);

$('#bWrite').onclick=function(){
  if(state!=='idle'||!scene||scene===mapScene)return;
  if(scene===tent&&tent.tstate.closed){
    if(!tent.tstate.unzipping){tent.tstate.unzipping=true;tent.tstate.zs=0;sfx('zip');
      say('拉着呢……别急。',1800);}
    return;}
  openPaper();};
$('#pCancel').onclick=function(){pendingPaper=null;closePaper();};
$('#pGo').onclick=function(){
  const txt=$('#pText').value.trim();
  if(!txt){const w=document.querySelector('.frwrap');
    w.classList.remove('shake');void w.offsetWidth;w.classList.add('shake');sfx('clack');return;}
  pendingPaper={d:$('#pDate').textContent,f:$('#pFilm').value.trim(),t:txt};
  sfx('fold');
  setTimeout(function(){
    closePaper();
    const p=scene.paper;
    crane={x:p.x,y:p.y,stand:true,ph:0,sc:1,a:0,dir:1};
    state='aim';syncUI();
    sparkleBurst(p.x,p.y-7,['#f6efdc','#ffe9b8'],7,14,.6);
    say('纸鹤折好了。选一个距离，让它替你飞过去。',4200);
  },380);};
$('#bBack').onclick=function(){if(state!=='aim')return;
  crane=null;state='idle';syncUI();openPaper();};
$('#bMap').onclick=function(){enterScene('map');};
document.querySelectorAll('[data-p]').forEach(function(b){
  b.onclick=function(){launch(b.dataset.p);};});
$('#bSnd').onclick=function(){
  ensureAudio();
  setSound(!soundOn);};

$('#bBook').onclick=function(){
  if(!papers.length){say('纸鹤簿还空着。写完第一只，它会回到这里。',3600);return;}
  openBook();};
$('#bkClose').onclick=function(){closeBook();};
$('#bkClear').onclick=function(){
  if(!papers.length)return;
  if(window.confirm('把纸鹤簿里面的都清掉？清掉就找不回来了。')){
    papers=[];save('night-papers','[]');renderBook();syncUI();}};
$('#bkList').onclick=function(e){
  const c=(e.target&&e.target.closest) ? e.target.closest('.bk') : null;
  if(c)c.classList.toggle('open');};

cv.addEventListener('pointerdown',function(e){
  unlock();
  if(scene!==mapScene)return;
  const p=toScene(e),r=regionAt(p.x,p.y);
  if(e.pointerType==='touch'){
    e.preventDefault();
    const now=performance.now();
    if(r&&r===lastR&&now-tapT<750){enterScene(r);return;}
    lastR=r;tapT=now;
    if(r)hoverRegion(r);else hideLbl();
  }else if(r){lastR=r;tapT=performance.now();}});
cv.addEventListener('pointerup',function(e){
  if(scene!==mapScene||e.pointerType==='touch')return;
  const p=toScene(e),r=regionAt(p.x,p.y);
  if(r&&r===lastR)enterScene(r);});
cv.addEventListener('pointermove',function(e){
  if(scene!==mapScene)return;
  const p=toScene(e),r=regionAt(p.x,p.y);
  cv.style.cursor=r ? 'pointer' : '';
  hoverRegion(r);});
cv.addEventListener('pointerleave',function(){
  if(scene===mapScene){hoverRegion(null);cv.style.cursor='';}});

document.addEventListener('keydown',function(e){
  if($('#bw').classList.contains('show')){if(e.key==='Escape')closeBook();return;}
  if($('#pw').classList.contains('show'))return;
  if(state==='aim'){if(e.key==='1')launch('near');
    else if(e.key==='2')launch('mid');
    else if(e.key==='3')launch('far');}
  else if(state==='idle'&&scene&&scene!==mapScene&&(e.key==='w'||e.key==='W'))openPaper();});

/* ================= 主循环 ================= */
let tGlobal=0,lastTs=0;
function update(dt,t){
  if(scene&&scene.update)scene.update(dt,t);
  if(crane&&state==='aim'){crane.a=Math.min(1,crane.a+dt*3);
    crane.x=scene.paper.x;crane.y=scene.paper.y+Math.sin(t*2.1)*.7;}
  if(flying){sideFlight(flying,dt);
    if(flying.done&&!flying.handled){flying.handled=true;
      const f=flying;flying=null;state='after';syncUI();
      scene.makeAfter(f,f.s1<.25);}}
  if(after&&after.done&&!after.said){after.said=true;
    state='idle';count++;save('night-count',String(count));
    sfx('chime');say(scene.end(after,after.far),6400);syncUI();}
  updParts(dt);}
function render(t){
  G=ctx;
  if(scene&&scene.draw)scene.draw(t);
  if(crane)drawCrane(crane.x,crane.y,crane.stand,crane.ph,crane.sc,crane.a,crane.dir);
  if(flying)drawCrane(flying.x,flying.y,false,flying.ph,craneScale(flying.s1),1,flying.dir);
  drawParts();}
function frame(ts){
  if(document.hidden){lastTs=0;requestAnimationFrame(frame);return;}
  const dt=Math.min(.05,lastTs ? (ts-lastTs)/1000 : .016);lastTs=ts;tGlobal+=dt;
  update(dt,tGlobal);render(tGlobal);
  requestAnimationFrame(frame);}

scene=mapScene;if(scene.enter)scene.enter();
syncSnd();syncUI();fit();detectNativeStore();
const qs=new URLSearchParams(location.search).get('scene');
if(qs&&scenes[qs])enterScene(qs);else say(scene.intro,5200);
requestAnimationFrame(frame);
})();
