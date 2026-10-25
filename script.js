const c=document.getElementById('c'),x=c.getContext('2d');
const S=2,W=800,H=360,G=300,GRAV=.8,JUMP=-14.5;
let st='start',p,obs,coins,pows,parts,trail,score,coinN,speed,lvl,t,shake,nextObs,lvlT,paused=false,muted=false,best=0;
try{best=+localStorage.getItem('sn_best')||0}catch(e){}
/* ---------- sound ---------- */
let ac,mg;
function initAudio(){if(ac)return;try{ac=new(window.AudioContext||window.webkitAudioContext)();mg=ac.createGain();mg.gain.value=.5;mg.connect(ac.destination)}catch(e){}}
function tone(f,d,type='square',slide=0,vol=.12,delay=0){
  if(!ac||muted)return;const o=ac.createOscillator(),g=ac.createGain(),s=ac.currentTime+delay;
  o.type=type;o.frequency.setValueAtTime(f,s);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),s+d);
  g.gain.setValueAtTime(vol,s);g.gain.exponentialRampToValueAtTime(.001,s+d);o.connect(g);g.connect(mg);o.start(s);o.stop(s+d);
}
const sfx={
 jump:()=>tone(300,.15,'square',500),jump2:()=>tone(480,.15,'square',650),
 slide:()=>tone(200,.2,'sawtooth',-120,.08),
 coin:()=>{tone(880,.07,'square');tone(1320,.14,'square',0,.12,.06)},
 pow:()=>[392,523,659,784].forEach((f,i)=>tone(f,.1,'triangle',0,.15,i*.06)),
 shield:()=>{tone(760,.35,'sine',-500,.16);tone(190,.25,'triangle',-90,.18);tone(1200,.2,'sine',-700,.06,.03)},
 hit:()=>{tone(200,.3,'sine',-140,.3);tone(65,.8,'sine',-25,.28,.05);[659,587,494,392,330].forEach((f,i)=>tone(f,.5,'triangle',0,.13,.15+i*.15))},
 level:()=>[523,659,784,1046,1318].forEach((f,i)=>tone(f,.12,'triangle',0,.14,i*.07)),
 start:()=>[523,659,784].forEach((f,i)=>tone(f,.12,'triangle',0,.15,i*.08))};
const sc=[0,3,7,10,12,10,7,3];let step=0;
setInterval(()=>{if(st!=='play'||paused)return;
  const b=55*Math.pow(2,[0,0,-4,-2][Math.floor(step/8)%4]/12);
  if(step%4===0)tone(120,.18,'sine',-90,.2);
  if(step%2===0)tone(b,.2,'sawtooth',0,.05);
  tone(b*4*Math.pow(2,sc[step%8]/12),.12,'triangle',0,.045);step++},190-0);
/* ---------- palettes ---------- */
const PAL=[
 {a:'#1b0a3c',b:'#8a1f72',d:'#ff7a3d',s1:'#ffe66d',s2:'#ff4f7b',m1:'#2a0f4d',m2:'#40196b',gr:'#1a0b2e',ln:'#00e5ff'},
 {a:'#06142e',b:'#0f5a86',d:'#3fd0b6',s1:'#e0fbfc',s2:'#7bdff2',m1:'#06283d',m2:'#0b3d5c',gr:'#04121f',ln:'#ff2e88'},
 {a:'#2a0b2a',b:'#c2456b',d:'#ffc371',s1:'#fff3b0',s2:'#ff9a76',m1:'#3a1236',m2:'#58204a',gr:'#220a22',ln:'#7cffcb'}];
/* ---------- game ---------- */
function reset(){p={x:80,y:G-44,w:34,h:44,vy:0,jumps:0,sl:0,sliding:false,shield:false,mag:0,inv:0};
  obs=[];coins=[];pows=[];parts=[];trail=[];score=0;coinN=0;speed=5;lvl=1;t=0;shake=0;nextObs=300;lvlT=0}
function puff(px,py,n,col,sp){for(let i=0;i<n;i++)parts.push({x:px,y:py,vx:(Math.random()-.5)*sp-1,vy:-Math.random()*sp,l:25+Math.random()*15,col})}
const onGround=()=>p.y>=G-p.h;
function jump(){
  initAudio();
  if(st!=='play'){reset();st='play';sfx.start();return}
  if(paused)return;
  if(onGround()){p.vy=JUMP;p.jumps=1;p.sl=0;sfx.jump();puff(p.x+14,G,6,'#d8b4ff',3)}
  else if(p.jumps<2){p.vy=JUMP*.9;p.jumps=2;sfx.jump2();puff(p.x+14,p.y+p.h,10,'#fff',3)}
}
function slide(n){if(st!=='play'||paused)return;if(onGround()){if(p.sl<=0)sfx.slide();p.sl=n}else p.vy=Math.max(p.vy,13)}
function score_(){return Math.floor(score/6)+coinN*10}
let newBest=false,ov=0;
function die(){st='over';ov=0;shake=16;sfx.hit();puff(p.x+17,p.y+22,30,'#ff7043',9);
  const s=score_();newBest=s>best;if(s>best){best=s;try{localStorage.setItem('sn_best',best)}catch(e){}}}
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function update(){
  t++;p.vy+=GRAV;p.y=Math.min(G-p.h,p.y+p.vy);
  if(onGround()){if(p.vy>3)puff(p.x+14,G,4,'#d8b4ff',2);p.vy=0;p.jumps=0}
  p.sliding=onGround()&&p.sl>0;if(p.sl>0)p.sl--;
  if(p.mag>0)p.mag--;if(p.inv>0)p.inv--;
  if(t%6===0&&onGround())puff(p.x+4,G,1,'#d8b4ff',1.5);
  trail.forEach(q=>q.x-=speed*.9);trail.push({x:p.x+14,y:p.y+(p.sliding?G-p.y-14:16)});if(trail.length>16)trail.shift();
  nextObs-=speed;
  if(nextObs<=0){
    const r=Math.random(),bat=lvl>1&&r<.28,big=!bat&&r<.5;
    const w=bat?34:big?54:28,h=bat?20:big?44:34+Math.random()*14;
    obs.push({x:W+40,w,h,bat,big});
    if(bat)for(let i=0;i<3;i++)coins.push({x:W+40-10+i*38,y:G-12,r:9});
    else for(let i=0;i<3;i++)coins.push({x:W+40-50+i*(w+40)/2,y:G-72-(i===1?38:0),r:9});
    if(Math.random()<.14)pows.push({x:W+40+(w+150),y:G-90,type:Math.random()<.5?'shield':'mag'});
    nextObs=320+Math.random()*220+speed*14;
  }
  obs.forEach(o=>o.x-=speed);coins.forEach(k=>{k.x-=speed;
    if(p.mag>0){const dx=p.x+17-k.x,dy=p.y+22-k.y,d=Math.hypot(dx,dy);if(d<190){k.x+=dx/d*9;k.y+=dy/d*9}}});
  pows.forEach(o=>o.x-=speed);
  obs=obs.filter(o=>o.x>-80);coins=coins.filter(k=>k.x>-30&&!k.got);pows=pows.filter(o=>o.x>-40&&!o.got);
  const pb=p.sliding?{x:p.x+2,y:G-20,w:p.w+6,h:18}:{x:p.x+8,y:p.y+6,w:p.w-16,h:p.h-8};
  for(const o of obs){
    const hb=o.bat?{x:o.x+4,y:G-48,w:o.w-8,h:18}:{x:o.x+5,y:G-o.h+8,w:o.w-10,h:o.h-8};
    if(!o.dead&&hit(pb,hb)){
      if(p.inv>0)continue;
      if(p.shield){p.shield=false;p.inv=60;o.dead=true;shake=10;sfx.shield();puff(o.x+o.w/2,G-20,26,'#4fc3f7',8)}
      else{die();return}}}
  obs=obs.filter(o=>!o.dead);
  for(const k of coins)if(hit(pb,{x:k.x-k.r,y:k.y-k.r,w:k.r*2,h:k.r*2})){k.got=true;coinN++;sfx.coin();puff(k.x,k.y,6,'#ffd54f',4)}
  for(const o of pows)if(hit(pb,{x:o.x-14,y:o.y-14,w:28,h:28})){o.got=true;sfx.pow();puff(o.x,o.y,16,o.type==='shield'?'#4fc3f7':'#ff5ca8',6);
    if(o.type==='shield')p.shield=true;else p.mag=360}
  score++;const nl=1+Math.floor(score_()/250);
  if(nl>lvl){lvl=nl;lvlT=100;sfx.level()}
  speed=5+Math.min(6,(lvl-1)*.6+score/1500);
}
/* ---------- drawing ---------- */
function mtn(f,col,base,amp,k){x.fillStyle=col;x.beginPath();x.moveTo(0,G);
  for(let i=0;i<=W;i+=16){const X=i+t*speed*f;x.lineTo(i,G-base-Math.abs(Math.sin(X/k))*amp-Math.sin(X/(k*.37))*amp*.2)}x.lineTo(W,G);x.fill()}
function bg(){
  const P=PAL[(lvl-1)%3],g=x.createLinearGradient(0,0,0,G);
  g.addColorStop(0,P.a);g.addColorStop(.55,P.b);g.addColorStop(1,P.d);x.fillStyle=g;x.fillRect(0,0,W,H);
  x.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<35;i++)x.fillRect((i*131)%W,(i*47)%120,i%3?1:2,i%3?1:2);
  const sg=x.createLinearGradient(0,120,0,260);sg.addColorStop(0,P.s1);sg.addColorStop(1,P.s2);
  x.save();x.beginPath();x.arc(560,200,80,0,7);x.clip();x.fillStyle=sg;x.fillRect(470,110,200,180);
  x.fillStyle=P.b;for(let i=0;i<6;i++)x.fillRect(470,205+i*14,200,2+i*1.6);x.restore();
  x.fillStyle='rgba(255,255,255,.18)';
  [[100,60,1],[420,95,.7],[720,50,.9]].forEach(([cx,cy,s])=>{const X=((cx-t*.25*s)%(W+240)+W+240)%(W+240)-120;
    x.beginPath();x.ellipse(X,cy,60*s,14*s,0,0,7);x.ellipse(X+30*s,cy-9*s,36*s,13*s,0,0,7);x.fill()});
  mtn(.18,P.m1,60,100,110);mtn(.45,P.m2,20,80,70);
  x.fillStyle=P.gr;for(let i=0;i<9;i++){const X=((i*120-t*speed*.8)%1080+1080)%1080-70;
    x.beginPath();x.moveTo(X,G);x.lineTo(X+8,G-70-(i%3)*18);x.lineTo(X+16,G);x.fill();
    x.beginPath();x.ellipse(X+8,G-60-(i%3)*18,22,32,0,0,7);x.fill()}
  x.fillStyle=P.gr;x.fillRect(0,G,W,H-G);
  x.strokeStyle=P.ln;x.lineWidth=2;x.shadowColor=P.ln;x.shadowBlur=12;x.beginPath();x.moveTo(0,G);x.lineTo(W,G);x.stroke();x.shadowBlur=0;
  x.globalAlpha=.35;x.beginPath();for(let i=-1;i<22;i++){const X=((i*60-t*speed)%1260+1260)%1260-60;x.moveTo(X,G);x.lineTo(X-(X-W/2)*.5,H)}
  for(let j=1;j<4;j++){x.moveTo(0,G+j*j*4.2);x.lineTo(W,G+j*j*4.2)}x.stroke();x.globalAlpha=1;
}
function ninja(){
  const air=!onGround(),ph=t*.5,l=air?.8:Math.sin(ph)*9,l2=-l;
  x.save();x.translate(p.x+p.w/2,p.y);
  x.fillStyle='rgba(0,0,0,.3)';x.beginPath();x.ellipse(0,G-p.y,p.sliding?24:16,4,0,0,7);x.fill();
  if(trail.length>1){x.save();x.setTransform(S,0,0,S,0,0);x.lineCap='round';
    for(let i=1;i<trail.length;i++){x.strokeStyle='rgba(255,59,92,'+(i/trail.length)+')';x.lineWidth=2+i*.5;
      x.beginPath();x.moveTo(trail[i-1].x+Math.sin(t*.3+i)*2,trail[i-1].y+i*.3);x.lineTo(trail[i].x+Math.sin(t*.3+i+1)*2,trail[i].y+i*.3);x.stroke()}x.restore()}
  if(p.sliding){
    x.translate(0,G-p.y-16);x.fillStyle='#1c1c2e';x.beginPath();x.roundRect(-22,-8,40,18,8);x.fill();
    x.fillStyle='#1c1c2e';x.beginPath();x.arc(20,0,10,0,7);x.fill();x.fillStyle='#f2c9a0';x.fillRect(18,-4,8,5);x.fillStyle='#ff3b5c';x.fillRect(8,-10,14,3);
  }else{
    x.fillStyle='#14142a';x.fillRect(-11+l,p.h-16,10,16);x.fillRect(1+l2,p.h-16,10,16);
    x.fillStyle='#ff3b5c';x.fillRect(-12+l,p.h-4,11,4);x.fillRect(1+l2,p.h-4,11,4);
    x.fillStyle='#1c1c2e';x.fillRect(-13,18,26,p.h-32);x.fillStyle='#ff3b5c';x.fillRect(-13,p.h-20,26,4);
    x.fillStyle='#1c1c2e';x.beginPath();x.arc(0,10,13,0,7);x.fill();
    x.fillStyle='#f2c9a0';x.fillRect(-1,6,13,7);x.fillStyle='#fff';x.fillRect(6,8,3,3);x.fillStyle='#ff3b5c';x.fillRect(-13,3,26,4);
    x.fillStyle='#1c1c2e';x.fillRect(12,24+(air?-8:Math.sin(ph)*4),7,6);
  }
  x.restore();
  if(p.shield){x.strokeStyle='rgba(79,195,247,'+(.6+Math.sin(t*.2)*.3)+')';x.lineWidth=3;x.shadowColor='#4fc3f7';x.shadowBlur=14;
    x.beginPath();x.arc(p.x+17,p.y+(p.sliding?G-p.y-16:22),32,0,7);x.stroke();x.shadowBlur=0}
}
function fire(o){
  if(o.bat){const by=G-38+Math.sin(t*.15+o.x*.02)*4,f=Math.sin(t*.45)*12;
    x.fillStyle='#1a1030';x.beginPath();x.ellipse(o.x+17,by,10,8,0,0,7);x.fill();
    x.beginPath();x.moveTo(o.x+10,by);x.lineTo(o.x-8,by-12+f);x.lineTo(o.x,by+4);x.lineTo(o.x+8,by+8);
    x.moveTo(o.x+24,by);x.lineTo(o.x+42,by-12+f);x.lineTo(o.x+34,by+4);x.lineTo(o.x+26,by+8);x.fill();
    x.fillStyle='#ff1744';x.fillRect(o.x+12,by-3,3,3);x.fillRect(o.x+19,by-3,3,3);return}
  const n=o.big?2:1,fw=o.w/n;
  x.shadowColor='#ff6d00';x.shadowBlur=18;
  for(let i=0;i<n;i++){const X=o.x+i*fw,fl=Math.sin(t*.4+i*2+o.x*.05)*4,h=o.h+fl;
    const g=x.createLinearGradient(0,G-h,0,G);g.addColorStop(0,'#ff3d00');g.addColorStop(.6,'#ff9800');g.addColorStop(1,'#ffeb3b');
    x.fillStyle=g;x.beginPath();x.moveTo(X,G);x.quadraticCurveTo(X-5,G-h*.5,X+fw/2+fl*.4,G-h);x.quadraticCurveTo(X+fw+5,G-h*.5,X+fw,G);x.fill();
    x.fillStyle='#fff3b0';x.beginPath();x.moveTo(X+fw*.25,G);x.quadraticCurveTo(X+fw*.25,G-h*.4,X+fw/2,G-h*.55);x.quadraticCurveTo(X+fw*.75,G-h*.4,X+fw*.75,G);x.fill()}
  x.shadowBlur=0;
  if(t%5===0)parts.push({x:o.x+o.w/2,y:G-o.h,vx:(Math.random()-.5),vy:-1-Math.random()*1.5,l:20,col:'#ffab40'});
}
function txt(s,px,py,size,col,al){x.font='bold '+size+'px "Trebuchet MS",sans-serif';x.textAlign=al||'left';x.fillStyle='rgba(0,0,0,.45)';x.fillText(s,px+2,py+2);x.fillStyle=col;x.fillText(s,px,py)}
function hud(){
  const s=score_();txt('SCORE '+s,14,28,20,'#fff');txt('BEST '+Math.max(best,s),14,52,16,'#ffd9ec');
  x.fillStyle='#ffd54f';x.beginPath();x.arc(W-70,22,9,0,7);x.fill();txt('x'+coinN,W-54,29,20,'#fff');
  txt('LV '+lvl,W-14,54,16,'#ffd9ec','right');
  if(p.shield){x.strokeStyle='#4fc3f7';x.lineWidth=3;x.beginPath();x.arc(W-190,22,9,0,7);x.stroke()}
  if(p.mag>0){x.fillStyle='#ff5ca8';x.fillRect(W-170,16,p.mag/360*60,10)}
  if(lvlT>0){lvlT--;x.globalAlpha=Math.min(1,lvlT/40);txt('LEVEL '+lvl,W/2,110,44,'#fff','center');x.globalAlpha=1}
}
function overlay(a,b){x.fillStyle='rgba(10,0,30,.6)';x.fillRect(0,0,W,H);txt(a,W/2,150,44,'#fff','center');txt(b,W/2,192,18,'#ffd9ec','center');x.textAlign='left'}
function start_(){
  ov++;x.fillStyle='rgba(10,0,30,.62)';x.fillRect(0,0,W,H);
  txt('SUNSET NINJA RUN',W/2,80,40,'#ff6fa3','center');
  const rows=[['SPACE / ↑ / TAP','Jump (twice = double jump)'],['S / ↓ / TAP LOW','Slide under bats'],['P  ·  M  ·  F','Pause · Mute · Fullscreen']];
  rows.forEach((r,i)=>{const y=112+i*42;
    x.fillStyle='rgba(255,255,255,.12)';x.beginPath();x.roundRect(165,y,205,32,10);x.fill();
    x.strokeStyle='#ff3b7f';x.lineWidth=1.5;x.stroke();
    txt(r[0],267,y+22,15,'#fff','center');txt(r[1],388,y+22,16,'#ffd9ec','left')});
  txt('Collect coins, shields and magnets',W/2,262,15,'#ffd9ec','center');
  x.globalAlpha=.6+Math.sin(ov*.1)*.4;txt('Tap or press Space to start',W/2,292,20,'#fff','center');x.globalAlpha=1;x.textAlign='left'
}
function over_(){
  ov++;const e=Math.min(1,ov/22),ease=1-Math.pow(1-e,3),oy=(1-ease)*-120;
  x.fillStyle='rgba(10,0,30,'+.6*ease+')';x.fillRect(0,0,W,H);
  x.save();x.translate(0,oy);x.globalAlpha=ease;
  const g=x.createLinearGradient(0,70,0,290);g.addColorStop(0,'rgba(60,15,90,.95)');g.addColorStop(1,'rgba(20,6,40,.95)');
  x.shadowColor='#ff3b7f';x.shadowBlur=28;x.fillStyle=g;x.beginPath();x.roundRect(210,62,380,236,22);x.fill();x.shadowBlur=0;
  x.strokeStyle='#ff3b7f';x.lineWidth=2;x.stroke();
  txt('GAME OVER',W/2,112,38,'#ff6fa3','center');
  txt(''+score_(),W/2,175,64,'#fff','center');
  txt('SCORE',W/2,196,14,'#ffd9ec','center');
  x.fillStyle='#ffd54f';x.beginPath();x.arc(W/2-70,222,8,0,7);x.fill();txt('x'+coinN,W/2-56,228,18,'#fff');
  txt('LEVEL '+lvl,W/2+30,228,18,'#fff');
  if(newBest){const s=1+Math.sin(ov*.15)*.06;x.save();x.translate(W/2,254);x.scale(s,s);txt('NEW BEST!',0,0,22,'#ffd54f','center');x.restore()}
  else txt('Best '+best,W/2,254,18,'#ffd9ec','center');
  x.globalAlpha=ease*(.6+Math.sin(ov*.1)*.4);txt('Tap or press Space to retry',W/2,284,15,'#fff','center');
  x.restore();x.textAlign='left'
}
function draw(){
  x.save();x.setTransform(S,0,0,S,0,0);if(shake>.5){x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.9}
  bg();
  coins.forEach(k=>{const w=Math.abs(Math.cos(t*.08+k.x*.02));x.shadowColor='#ffd54f';x.shadowBlur=10;x.fillStyle='#ffd54f';
    x.beginPath();x.ellipse(k.x,k.y,k.r*Math.max(.25,w),k.r,0,0,7);x.fill();x.shadowBlur=0});
  pows.forEach(o=>{const col=o.type==='shield'?'#4fc3f7':'#ff5ca8',yy=o.y+Math.sin(t*.1)*5;
    x.shadowColor=col;x.shadowBlur=16;x.strokeStyle=col;x.lineWidth=4;x.beginPath();x.arc(o.x,yy,13,0,7);x.stroke();
    x.fillStyle=col;x.font='bold 14px sans-serif';x.textAlign='center';x.fillText(o.type==='shield'?'S':'M',o.x,yy+5);x.textAlign='left';x.shadowBlur=0});
  obs.forEach(fire);
  if(st!=='over')ninja();
  x.globalCompositeOperation='lighter';
  parts.forEach(q=>{q.x+=q.vx;q.y+=q.vy;q.vy+=.12;q.l--;x.globalAlpha=Math.max(0,q.l/30);x.fillStyle=q.col;x.fillRect(q.x,q.y,3,3)});
  x.globalCompositeOperation='source-over';x.globalAlpha=1;parts=parts.filter(q=>q.l>0);
  hud();
  if(st==='start')start_();
  if(st==='over')over_();
  if(paused&&st==='play')overlay('Paused','Press P to resume');
  x.restore();
}
function loop(){if(st==='play'&&!paused)update();draw();requestAnimationFrame(loop)}
/* ---------- input ---------- */
addEventListener('keydown',e=>{
  if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();if(!e.repeat)jump()}
  if(['ArrowDown','KeyS'].includes(e.code)){e.preventDefault();slide(8)}
  if(e.code==='KeyF')fs();if(e.code==='KeyP')tp();if(e.code==='KeyM')tm()});
c.addEventListener('pointerdown',e=>{const r=c.getBoundingClientRect();
  if(st==='play'&&(e.clientY-r.top)/r.height>.68)slide(32);else jump()});
function tp(){if(st==='play'){paused=!paused;document.getElementById('pb').textContent=paused?'▶':'⏸'}}
function tm(){muted=!muted;document.getElementById('mb').textContent=muted?'🔇':'🔊'}
function fs(){const w=document.getElementById('wrap');if(document.fullscreenElement)document.exitFullscreen();else if(w.requestFullscreen)w.requestFullscreen()}
document.getElementById('fb').onclick=fs;document.getElementById('pb').onclick=tp;document.getElementById('mb').onclick=tm;
reset();loop();
