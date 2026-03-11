import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════
//  TIMEKIT — ENTERPRISE EDITION  v3
//  · Live stopwatch + timer in fullscreen (lifted state)
//  · BG canvas effect inside fullscreen overlay
//  · Screen blink + alarm when timer hits zero
//  · Real OS fullscreen via requestFullscreen API
//  · Sharp corners · B&W · Refined fonts · Dark + Light
// ═══════════════════════════════════════════════════════════════════

const DARK={bg:"#0A0A0A",bg2:"#111111",bg3:"#161616",line:"#222222",line2:"#2a2a2a",dim:"#333333",muted:"#555555",soft:"#777777",body:"#A0A0A0",bright:"#F0F0F0",sub:"#888888",isDark:true};
const LIGHT={bg:"#F4F4F6",bg2:"#FFFFFF",bg3:"#EBEBED",line:"#DCDCDE",line2:"#CECECE",dim:"#BBBBBB",muted:"#999999",soft:"#777777",body:"#333333",bright:"#0A0A0A",sub:"#555555",isDark:false};

const FONTS_URL="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;800;900&family=Barlow:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Poiret+One&family=Cinzel:wght@400;700;900&family=Righteous&family=Space+Grotesk:wght@300;400;700&family=Bebas+Neue&family=Chakra+Petch:wght@300;400;600;700&family=Rajdhani:wght@300;400;600;700&family=Syncopate:wght@400;700&family=Share+Tech+Mono&family=Major+Mono+Display&family=Exo+2:wght@100;300;400;900&family=Cormorant+Garamond:wght@300;400;600;700&display=swap";
const DISPLAY="'Barlow Condensed','DIN Condensed',sans-serif";
const BODY="'Barlow','DM Sans',system-ui,sans-serif";
const MONO="'JetBrains Mono','Share Tech Mono',monospace";

const COL_MAP={white:["#C8C8C8","#ffffff"],blue:["#4F8EF7","#7aaeff"],amber:["#F59E0B","#fbbf24"],teal:["#06B6D4","#22d3ee"],rose:["#EF4444","#f87171"],violet:["#A78BFA","#c4b5fd"],green:["#22C55E","#4ade80"],orange:["#F97316","#fb923c"],pink:["#EC4899","#f472b6"],lime:["#84cc16","#a3e635"],cyan:["#00ddc8","#44eedf"]};
const COLOR_DOTS=Object.entries(COL_MAP);

const h2r=h=>({r:parseInt(h.slice(1,3),16),g:parseInt(h.slice(3,5),16),b:parseInt(h.slice(5,7),16)});
function hexToRgba(h,a){const {r,g,b}=h2r(h);return `rgba(${r},${g},${b},${a})`;}
function hexToRgb(h){const {r,g,b}=h2r(h);return [r,g,b];}
function lightenHex(h,amt){let {r,g,b}=h2r(h);r=Math.min(255,Math.round(r+(255-r)*amt));g=Math.min(255,Math.round(g+(255-g)*amt));b=Math.min(255,Math.round(b+(255-b)*amt));return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');}

const FONT_STYLES=[
  {id:"solid",    label:"CONDENSED",  css:{fontFamily:DISPLAY,        fontWeight:700,  letterSpacing:".06em"}},
  {id:"clean",    label:"GROTESK",    css:{fontFamily:"'Space Grotesk',sans-serif", fontWeight:300,  letterSpacing:"-.02em"}},
  {id:"bebas",    label:"BLOCK",      css:{fontFamily:"'Bebas Neue',cursive",       letterSpacing:".12em"}},
  {id:"rajdhani", label:"RAJDHANI",   css:{fontFamily:"'Rajdhani',sans-serif",      fontWeight:300,  letterSpacing:".15em"}},
  {id:"cinzel",   label:"CINZEL",     css:{fontFamily:"'Cinzel',serif",             fontWeight:300,  letterSpacing:".1em"}},
  {id:"minimal",  label:"MINIMAL",    css:{fontFamily:"'Poiret One',cursive",       letterSpacing:".18em"}},
  {id:"cormorant",label:"CORMORANT",  css:{fontFamily:"'Cormorant Garamond',serif", fontWeight:300,  letterSpacing:".08em"}},
  {id:"exo",      label:"EXO LIGHT",  css:{fontFamily:"'Exo 2',sans-serif",         fontWeight:100,  letterSpacing:".04em"}},
  {id:"synco",    label:"SYNCOPATE",  css:{fontFamily:"'Syncopate',sans-serif",     fontWeight:400,  letterSpacing:".18em"}},
  {id:"chakra",   label:"CHAKRA",     css:{fontFamily:"'Chakra Petch',sans-serif",  fontWeight:300,  letterSpacing:".1em"}},
  {id:"matrix",   label:"MONO",       css:{fontFamily:"'Major Mono Display',monospace", letterSpacing:".12em"}},
  {id:"righteous",label:"RIGHTEOUS",  css:{fontFamily:"'Righteous',cursive",        letterSpacing:".07em"}},
];
const ANIM_MAP={solid:"solidPulse 3s ease-in-out infinite",clean:"cleanFade 5s ease-in-out infinite",bebas:"blockShift 4s ease-in-out infinite",rajdhani:"rajPulse 3s ease-in-out infinite",cinzel:"shimmer 3s linear infinite",minimal:"breathe 4s ease-in-out infinite",cormorant:"breathe 5s ease-in-out infinite",exo:"breathe 4.5s ease-in-out infinite",synco:"rajPulse 3.5s ease-in-out infinite",chakra:"chakraScan 2s linear infinite",matrix:"matrixScan .07s steps(1) infinite",righteous:"liquidWave 3.5s ease-in-out infinite"};

const pad=(n,d=2)=>String(Math.floor(n)).padStart(d,"0");

// ── CANVAS BG ENGINE ─────────────────────────────────────────────────
// Takes a ref to an existing canvas element and drives its animation
function useBgCanvas(cvRef, bgMode, isDark, accentHex) {
  const rafRef=useRef(null);
  const ptsRef=useRef([]);
  const dropsRef=useRef([]);
  const animRef=useRef({waveT:0,gridOff:0,auroraT:0});

  useEffect(()=>{
    ptsRef.current=Array.from({length:55},()=>({x:Math.random()*2000,y:Math.random()*2000,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,r:Math.random()*1.4+.3,a:Math.random()*.26+.04}));
    dropsRef.current=Array.from({length:80},()=>({x:Math.random()*2000,y:Math.random()*2000,speed:Math.random()*2+.5,len:Math.random()*30+10,a:Math.random()*.2+.04}));
  },[]);

  useEffect(()=>{
    const cv=cvRef.current; if(!cv) return;
    const ctx=cv.getContext("2d"); let W=0,H=0;
    const resize=()=>{cv.width=W=window.innerWidth;cv.height=H=window.innerHeight;};
    resize(); window.addEventListener("resize",resize);
    const getRgb=()=>hexToRgb(accentHex||(isDark?"#F0F0F0":"#0A0A0A"));
    const pts=ptsRef.current,drops=dropsRef.current,an=animRef.current;

    const drawMesh=()=>{
      ctx.clearRect(0,0,W,H);const [r,g,b]=getRgb();
      pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;const px=p.x%W,py=p.y%H;ctx.beginPath();ctx.arc(px,py,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(${r},${g},${b},${p.a})`;ctx.fill();pts.forEach(q=>{const dx=px-(q.x%W),dy=py-(q.y%H),d=Math.sqrt(dx*dx+dy*dy);if(d<110&&d>0){ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(q.x%W,q.y%H);ctx.strokeStyle=`rgba(${r},${g},${b},${(.12*(1-d/110)).toFixed(3)})`;ctx.lineWidth=.5;ctx.stroke();}});});
    };
    const drawFloat=()=>{
      ctx.clearRect(0,0,W,H);const [r,g,b]=getRgb();
      pts.forEach(p=>{p.x+=p.vx*.6;p.y+=p.vy*.6;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;const px=p.x%W,py=p.y%H,sz=p.r*3;const grd=ctx.createRadialGradient(px,py,0,px,py,sz);grd.addColorStop(0,`rgba(${r},${g},${b},${p.a*2.4})`);grd.addColorStop(1,`rgba(${r},${g},${b},0)`);ctx.beginPath();ctx.arc(px,py,sz,0,Math.PI*2);ctx.fillStyle=grd;ctx.fill();});
    };
    const drawWaves=()=>{
      ctx.clearRect(0,0,W,H);const [r,g,b]=getRgb();an.waveT+=.008;
      for(let i=0;i<6;i++){const amp=28+i*11,freq=.004+i*.0012,phase=an.waveT+i*.55,yBase=H*.12+i*(H*.15);ctx.beginPath();ctx.moveTo(0,yBase);for(let x=0;x<=W;x+=6)ctx.lineTo(x,yBase+Math.sin(x*freq+phase)*amp+Math.sin(x*freq*.5+phase*.7)*amp*.4);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fillStyle=`rgba(${r},${g},${b},${.022+i*.005})`;ctx.fill();}
    };
    const drawGrid=()=>{
      ctx.clearRect(0,0,W,H);const [r,g,b]=getRgb();an.gridOff=(an.gridOff+.3)%60;const sz=60;ctx.strokeStyle=`rgba(${r},${g},${b},.07)`;ctx.lineWidth=.7;
      for(let x=-sz+an.gridOff%sz;x<W+sz;x+=sz){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for(let y=-sz+an.gridOff%sz;y<H+sz;y+=sz){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
      ctx.fillStyle=`rgba(${r},${g},${b},.2)`;for(let x=-sz+an.gridOff%sz;x<W+sz;x+=sz)for(let y=-sz+an.gridOff%sz;y<H+sz;y+=sz){ctx.beginPath();ctx.arc(x,y,1.4,0,Math.PI*2);ctx.fill();}
    };
    const drawAurora=()=>{
      ctx.clearRect(0,0,W,H);an.auroraT+=.0035;const [r,g,b]=getRgb();
      for(let i=0;i<5;i++){const t=an.auroraT+i*.9,yc=H*.18+i*(H*.16)+Math.sin(t*.6)*H*.06,ht=H*.14+Math.sin(t*.45)*H*.05;const grd=ctx.createLinearGradient(0,yc-ht,0,yc+ht);const a2=.06+.035*Math.sin(t);grd.addColorStop(0,`rgba(${r},${g},${b},0)`);grd.addColorStop(.4,`rgba(${r},${g},${b},${a2})`);grd.addColorStop(.6,`rgba(${r},${g},${b},${a2})`);grd.addColorStop(1,`rgba(${r},${g},${b},0)`);ctx.beginPath();for(let x=0;x<=W;x+=8){const w=yc+Math.sin(x*.005+t)*ht*.45+Math.sin(x*.012+t*1.3)*ht*.2;x===0?ctx.moveTo(x,w-ht):ctx.lineTo(x,w-ht);}for(let x=W;x>=0;x-=8){const w=yc+Math.sin(x*.005+t)*ht*.45+Math.sin(x*.012+t*1.3)*ht*.2;ctx.lineTo(x,w+ht);}ctx.closePath();ctx.fillStyle=grd;ctx.fill();}
    };
    const drawRain=()=>{
      ctx.fillStyle=isDark?'rgba(10,10,10,.12)':'rgba(244,244,246,.12)';ctx.fillRect(0,0,W,H);const [r,g,b]=getRgb();
      drops.forEach(d=>{d.y+=d.speed*3;if(d.y>H+50){d.y=-50;d.x=Math.random()*W;}ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x+d.len*.15,d.y+d.len);ctx.strokeStyle=`rgba(${r},${g},${b},${d.a})`;ctx.lineWidth=.8;ctx.stroke();});
    };

    const loop=()=>{
      if(bgMode==="none"){ctx.clearRect(0,0,W,H);rafRef.current=null;return;}
      if(bgMode==="mesh")        drawMesh();
      else if(bgMode==="float")  drawFloat();
      else if(bgMode==="waves")  drawWaves();
      else if(bgMode==="grid")   drawGrid();
      else if(bgMode==="aurora") drawAurora();
      else if(bgMode==="rain")   drawRain();
      rafRef.current=requestAnimationFrame(loop);
    };
    if(rafRef.current) cancelAnimationFrame(rafRef.current);
    if(bgMode==="none") ctx.clearRect(0,0,W,H); else loop();
    return ()=>{window.removeEventListener("resize",resize);if(rafRef.current)cancelAnimationFrame(rafRef.current);};
  },[cvRef,bgMode,isDark,accentHex]);
}

// ── ANALOG CLOCK ─────────────────────────────────────────────────────
function AnalogClock({T,accentHex}){
  const ref=useRef(null);
  useEffect(()=>{
    const draw=()=>{
      const cv=ref.current;if(!cv)return;const c=cv.getContext("2d"),cx=100,cy=100,r=88;
      c.clearRect(0,0,200,200);
      const grd=c.createRadialGradient(cx,cy,4,cx,cy,r);grd.addColorStop(0,T.isDark?"#1a1a1a":"#FFFFFF");grd.addColorStop(1,T.isDark?"#0A0A0A":"#F0F0F0");c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fillStyle=grd;c.fill();c.strokeStyle=T.isDark?"#2a2a2a":"#CCCCCC";c.lineWidth=1.2;c.stroke();
      for(let i=0;i<60;i++){const a=(i/60)*Math.PI*2-Math.PI/2,big=i%5===0;c.beginPath();c.moveTo(cx+Math.cos(a)*(r-3),cy+Math.sin(a)*(r-3));c.lineTo(cx+Math.cos(a)*(big?r-14:r-7),cy+Math.sin(a)*(big?r-14:r-7));c.strokeStyle=big?(T.isDark?"#555":"#666"):(T.isDark?"#2a2a2a":"#CCC");c.lineWidth=big?1.8:0.8;c.stroke();}
      c.font="bold 9px 'Barlow Condensed',sans-serif";c.textAlign="center";c.textBaseline="middle";c.fillStyle=T.isDark?"#555":"#888";
      [12,3,6,9].forEach((n,i)=>{const a=(i/4)*Math.PI*2-Math.PI/2;c.fillText(String(n),cx+Math.cos(a)*(r-24),cy+Math.sin(a)*(r-24));});
      const now=new Date(),s=now.getSeconds()+now.getMilliseconds()/1000,m=now.getMinutes()+s/60,h=(now.getHours()%12)+m/60;
      const ac=accentHex||(T.isDark?"#F0F0F0":"#0A0A0A"),hc=T.isDark?"#BBBBBB":"#444444";
      const hd=(a,l,w,col)=>{c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*l,cy+Math.sin(a)*l);c.strokeStyle=col;c.lineWidth=w;c.lineCap="round";c.stroke();};
      hd((h/12)*Math.PI*2-Math.PI/2,r*.5,3.5,hc);hd((m/60)*Math.PI*2-Math.PI/2,r*.7,2.5,hc);
      hd((s/60)*Math.PI*2-Math.PI/2,r*.78,1.5,ac);hd((s/60)*Math.PI*2-Math.PI/2+Math.PI,r*.18,2.5,ac);
      c.beginPath();c.arc(cx,cy,4.5,0,Math.PI*2);c.fillStyle=ac;c.fill();c.beginPath();c.arc(cx,cy,2,0,Math.PI*2);c.fillStyle=T.isDark?"#0A0A0A":"#F0F0F0";c.fill();
    };
    const iv=setInterval(draw,46);draw();return ()=>clearInterval(iv);
  },[T,accentHex]);
  return <canvas ref={ref} width="200" height="200" style={{display:"block"}}/>;
}

// ── DIGIT DISPLAY ────────────────────────────────────────────────────
function Digits({value,millis,label,styleId,accentHex,accent2Hex,isDone,T,large}){
  const sty=FONT_STYLES.find(f=>f.id===styleId)||FONT_STYLES[0];
  const anim=isDone?"doneFlash .45s infinite":(ANIM_MAP[styleId]||ANIM_MAP.solid);
  const effectiveAccent=(()=>{
    if(!T.isDark&&accentHex){const [r,g,b]=hexToRgb(accentHex);const lum=(0.299*r+0.587*g+0.114*b)/255;return lum>0.82?"#222222":accentHex;}
    return accentHex;
  })();
  const baseSize=large?"clamp(80px,16vw,200px)":"clamp(58px,12vw,150px)";
  let ds={fontSize:baseSize,lineHeight:1,userSelect:"none",letterSpacing:sty.css.letterSpacing||".04em",fontFamily:sty.css.fontFamily,fontWeight:sty.css.fontWeight||"normal",fontStyle:sty.css.fontStyle||"normal",animation:anim,transition:"font-family .3s",color:effectiveAccent,display:"inline-block"};
  if(styleId==="cinzel"||styleId==="righteous"){const grad=`linear-gradient(100deg,${effectiveAccent} 20%,${accent2Hex} 38%,${T.isDark?"#fff":"#333"} 50%,${accent2Hex} 62%,${effectiveAccent} 80%)`;ds={...ds,background:grad,backgroundSize:"200% 100%",WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",color:"transparent"};}
  if(styleId==="bebas")ds={...ds,fontSize:large?"clamp(96px,18vw,220px)":"clamp(72px,14vw,172px)",textShadow:`3px 3px 0 ${hexToRgba(effectiveAccent,.22)}`};
  if(styleId==="clean")ds={...ds,fontSize:large?"clamp(68px,13vw,170px)":"clamp(52px,10vw,128px)"};
  const ms={fontFamily:sty.css.fontFamily,fontSize:large?"clamp(18px,3vw,36px)":"clamp(13px,2.2vw,28px)",letterSpacing:".1em",marginTop:-2,color:effectiveAccent,opacity:.55,display:"block"};
  return (
    <div style={{textAlign:"center",position:"relative"}}>
      <span style={ds}>{value}</span>
      {millis!=null&&<span style={ms}>{millis}</span>}
      <div style={{fontFamily:DISPLAY,fontSize:large?12:10,fontWeight:800,letterSpacing:".22em",textTransform:"uppercase",color:T.dim,marginTop:10}}>{label}</div>
    </div>
  );
}

// ── SVG ICONS ────────────────────────────────────────────────────────
const Ic=({d,w=11,h=11,fill="none",stroke="currentColor",sw=1.8,children})=>(
  <svg width={w} height={h} viewBox="0 0 16 16" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}>
    {d?<path d={d}/>:children}
  </svg>
);
const IconSun=()=><Ic w={15} h={15}><circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="1" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/><line x1="3.05" y1="3.05" x2="4.46" y2="4.46"/><line x1="11.54" y1="11.54" x2="12.95" y2="12.95"/><line x1="3.05" y1="12.95" x2="4.46" y2="11.54"/><line x1="11.54" y1="4.46" x2="12.95" y2="3.05"/></Ic>;
const IconMoon=()=><Ic w={15} h={15} d="M13.5 9.5A6.5 6.5 0 016 2.5a6.5 6.5 0 100 11 6.5 6.5 0 007.5-4z"/>;
const IconFS=()=><Ic d="M1 6V1h5M10 1h5v5M15 10v5h-5M6 15H1v-5"/>;
const IconExitFS=()=><Ic d="M6 1v5H1M10 1v5h5M1 10h5v5M15 10h-5v5"/>;
const IconPlay=()=><Ic fill="currentColor" stroke="none"><path d="M4 3l9 5-9 5V3z"/></Ic>;
const IconPause=()=><Ic fill="currentColor" stroke="none"><rect x="3" y="2" width="4" height="12" rx="1"/><rect x="9" y="2" width="4" height="12" rx="1"/></Ic>;
const IconLap=()=><Ic><circle cx="8" cy="9" r="5.5"/><path d="M8 3.5V2M6 2h4"/><line x1="8" y1="6.5" x2="8" y2="9"/></Ic>;
const IconClk=({w=18,h=18})=><Ic w={w} h={h}><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5v4l2.5 1.5"/></Ic>;
const IconSW=()=><Ic><circle cx="8" cy="9" r="5.5"/><path d="M8 3.5V2M6 2h4"/><path d="M8 6.5v3"/></Ic>;
const IconTmr=()=><Ic><circle cx="8" cy="9" r="5.5"/><path d="M8 6v3"/><path d="M6 1h4M8 1v1.5"/></Ic>;

// ── SHARED UI ────────────────────────────────────────────────────────
function Btn({children,onClick,variant="go",disabled,style:sx}){
  const vars={go:{background:"var(--accent)",color:"#050505"},sec:{background:"var(--bg3)",color:"var(--body)",outline:"1px solid var(--line2)"},del:{background:"rgba(239,68,68,.1)",color:"#f87171",outline:"1px solid rgba(239,68,68,.22)"}};
  return(
    <button onClick={disabled?undefined:onClick} disabled={disabled}
      style={{minWidth:86,padding:"10px 20px",border:"none",fontFamily:DISPLAY,fontSize:11,fontWeight:800,letterSpacing:".1em",cursor:disabled?"not-allowed":"pointer",transition:"all .17s",display:"flex",alignItems:"center",justifyContent:"center",gap:6,userSelect:"none",opacity:disabled?.38:1,...vars[variant],...sx}}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity=".72"}}
      onMouseLeave={e=>{e.currentTarget.style.opacity="1"}}>
      {children}
    </button>
  );
}
function Chip({label,active,onClick,accent}){
  return(
    <button onClick={onClick}
      style={{padding:"5px 11px",border:`1px solid ${active?"var(--accentB)":"var(--line2)"}`,background:active?`${accent}22`:"transparent",color:active?"var(--accent)":"var(--muted)",cursor:"pointer",transition:"all .16s",fontSize:10,fontWeight:active?700:600,fontFamily:"'Share Tech Mono',monospace",whiteSpace:"nowrap",letterSpacing:".04em"}}
      onMouseEnter={e=>{if(!active){e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.color="var(--body)";}}}
      onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--muted)";}}}
    >{label}</button>
  );
}
function PickerBox({label,children}){
  return(
    <div style={{display:"flex",flexWrap:"wrap",gap:5,justifyContent:"center",alignItems:"center",background:"var(--bg2)",border:"1px solid var(--line2)",padding:"10px 14px",maxWidth:700,width:"100%"}}>
      <span style={{fontFamily:DISPLAY,fontSize:9,fontWeight:800,letterSpacing:1.4,color:"var(--dim)",textTransform:"uppercase",whiteSpace:"nowrap"}}>{label}</span>
      <div style={{width:1,background:"var(--line2)",alignSelf:"stretch",margin:"0 4px",flexShrink:0}}/>
      {children}
    </div>
  );
}
function ColorDots({activeKey,customHex,onSelect,onCustom}){
  return(
    <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",maxWidth:240,justifyContent:"center"}}>
      {COLOR_DOTS.map(([key,[c]])=>(
        <div key={key} onClick={()=>onSelect(key)}
          style={{width:14,height:14,borderRadius:"50%",background:c,flexShrink:0,border:activeKey===key?"2px solid var(--bright)":"2px solid transparent",cursor:"pointer",transition:"all .15s",transform:activeKey===key?"scale(1.35)":"scale(1)"}}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.3)"}
          onMouseLeave={e=>e.currentTarget.style.transform=activeKey===key?"scale(1.35)":"scale(1)"}
        />
      ))}
      <div style={{width:1,background:"var(--line2)",alignSelf:"stretch",margin:"0 2px"}}/>
      <input type="color" value={customHex} onChange={e=>onCustom(e.target.value)} style={{width:22,height:22,border:"2px solid var(--line2)",padding:0,cursor:"pointer",background:"none",overflow:"hidden"}}/>
    </div>
  );
}

// ── WORLD CLOCKS ─────────────────────────────────────────────────────
const WORLD_TZS=[{city:"New York",tz:"America/New_York"},{city:"London",tz:"Europe/London"},{city:"Paris",tz:"Europe/Paris"},{city:"Dubai",tz:"Asia/Dubai"},{city:"Tokyo",tz:"Asia/Tokyo"},{city:"Sydney",tz:"Australia/Sydney"}];
const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── CLOCK PANEL ──────────────────────────────────────────────────────
function ClockPanel({styleId,accent,accent2,T,onFullscreen}){
  const [opt24h,setOpt24h]=useState(true);
  const [optSec,setOptSec]=useState(false);
  const [optMs,setOptMs]=useState(false);
  const [optAnal,setOptAnal]=useState(false);
  const [optWorld,setOptWorld]=useState(false);
  const [time,setTime]=useState({str:"00:00",ms:".000"});
  const [dateStr,setDateStr]=useState(""),  [tzStr,setTzStr]=useState(""),  [world,setWorld]=useState([]);
  useEffect(()=>{
    const tick=()=>{
      const now=new Date(),h=opt24h?now.getHours():(now.getHours()%12||12),ap=opt24h?"":(now.getHours()<12?" AM":" PM");
      setTime({str:pad(h)+":"+pad(now.getMinutes())+(optSec?":"+pad(now.getSeconds()):"")+ap,ms:"."+pad(now.getMilliseconds(),3)});
      setDateStr(`${DAYS[now.getDay()]}  ·  ${MONTHS[now.getMonth()]} ${pad(now.getDate())}  ·  ${now.getFullYear()}`);
      setTzStr(Intl.DateTimeFormat().resolvedOptions().timeZone);
      if(optWorld)setWorld(WORLD_TZS.map(z=>({city:z.city,t:now.toLocaleTimeString("en-GB",{timeZone:z.tz,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}),d:now.toLocaleDateString("en-GB",{timeZone:z.tz,month:"short",day:"numeric"})})));
    };
    const iv=setInterval(tick,46);tick();return()=>clearInterval(iv);
  },[opt24h,optSec,optWorld]);
  return(
    <div className="panel-content">
      <button className="fsbtn" onClick={onFullscreen}><IconFS/> FULLSCREEN</button>
      {optAnal?<AnalogClock T={T} accentHex={accent}/>:<Digits value={time.str} millis={optMs?time.ms:null} label="LIVE" styleId={styleId} accentHex={accent} accent2Hex={accent2} T={T}/>}
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:DISPLAY,fontSize:11,fontWeight:700,letterSpacing:".14em",color:"var(--soft)",textTransform:"uppercase"}}>{dateStr}</div>
        <div style={{fontFamily:MONO,fontSize:10,color:"var(--dim)",letterSpacing:".1em",marginTop:4}}>{tzStr}</div>
      </div>
      {optWorld&&world.length>0&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:7,justifyContent:"center",maxWidth:720}}>
          {world.map(z=>(
            <div key={z.city} style={{background:"var(--bg2)",border:"1px solid var(--line2)",padding:"8px 14px",minWidth:120,textAlign:"center"}}>
              <div style={{fontFamily:DISPLAY,fontSize:9,fontWeight:800,letterSpacing:".1em",color:"var(--muted)",textTransform:"uppercase"}}>{z.city}</div>
              <div style={{fontFamily:MONO,fontSize:18,color:"var(--bright)",marginTop:2}}>{z.t}</div>
              <div style={{fontFamily:MONO,fontSize:10,color:"var(--dim)",marginTop:1}}>{z.d}</div>
            </div>
          ))}
        </div>
      )}
      <PickerBox label="OPTIONS">
        {[["24H",opt24h,()=>setOpt24h(v=>!v)],["SECONDS",optSec,()=>setOptSec(v=>!v)],["MS",optMs,()=>setOptMs(v=>!v)],["ANALOG",optAnal,()=>setOptAnal(v=>!v)],["WORLD",optWorld,()=>setOptWorld(v=>!v)]].map(([l,a,fn])=>(
          <Chip key={l} label={l} active={a} onClick={fn} accent={accent}/>
        ))}
      </PickerBox>
    </div>
  );
}

// ── ALARM ────────────────────────────────────────────────────────────
function playAlarm(){
  try{
    const ac=new(window.AudioContext||window.webkitAudioContext)();
    [0,.17,.34,.51,.95,1.12,1.29,1.46].forEach((t,i)=>{
      const f=[523.25,659.25,783.99,1046.5][i%4],o=ac.createOscillator(),g=ac.createGain();
      o.connect(g);g.connect(ac.destination);o.type="sine";o.frequency.value=f;
      const T2=ac.currentTime+t;g.gain.setValueAtTime(0,T2);g.gain.linearRampToValueAtTime(.22,T2+.04);g.gain.exponentialRampToValueAtTime(.001,T2+.29);o.start(T2);o.stop(T2+.3);
    });
  }catch(e){}
}

// ── STOPWATCH HOOK (lifted state) ─────────────────────────────────────
function useStopwatch(){
  const [running,setRunning]=useState(false);
  const [label,setLabel]=useState("READY");
  const [disp,setDisp]=useState({main:"00:00",ms:".000"});
  const [laps,setLaps]=useState([]);
  const startRef=useRef(0),elapRef=useRef(0),baseRef=useRef(0),ivRef=useRef(null);
  const tick=useCallback(()=>{
    const e=performance.now()-startRef.current;elapRef.current=e;
    const h=Math.floor(e/3600000),m=Math.floor(e/60000)%60,s=Math.floor(e/1000)%60,ms=Math.floor(e%1000);
    setDisp({main:h?`${pad(h)}:${pad(m)}:${pad(s)}`:`${pad(m)}:${pad(s)}`,ms:"."+pad(ms,3)});
  },[]);
  const toggle=()=>{
    if(!running){startRef.current=performance.now()-elapRef.current;ivRef.current=setInterval(tick,20);setRunning(true);setLabel("RUNNING");}
    else{clearInterval(ivRef.current);elapRef.current=performance.now()-startRef.current;setRunning(false);setLabel("PAUSED");}
  };
  const lap=()=>{const split=elapRef.current-baseRef.current;baseRef.current=elapRef.current;setLaps(p=>[...p,{total:elapRef.current,split}]);};
  const reset=()=>{clearInterval(ivRef.current);elapRef.current=0;baseRef.current=0;setRunning(false);setLaps([]);setLabel("READY");setDisp({main:"00:00",ms:".000"});};
  useEffect(()=>()=>clearInterval(ivRef.current),[]);
  return {running,label,disp,laps,toggle,lap,reset,elapRef};
}

// ── TIMER HOOK (lifted state) ─────────────────────────────────────────
function useTimer(onDone){
  const [hh,setHh]=useState(0),[mm,setMm]=useState(5),[ss,setSs]=useState(0);
  const [running,setRunning]=useState(false);
  const [done,setDone]=useState(false);
  const [label,setLabel]=useState("SET TIME");
  const [disp,setDisp]=useState({main:"05:00",ms:".0"});
  const totRef=useRef(300000),remRef=useRef(300000),startRef=useRef(0),ivRef=useRef(null);
  const dispUpd=ms=>{const s=Math.floor(ms/1000)%60,m=Math.floor(ms/60000)%60,h=Math.floor(ms/3600000);setDisp({main:h?`${pad(h)}:${pad(m)}:${pad(s)}`:`${pad(m)}:${pad(s)}`,ms:"."+Math.floor((ms%1000)/100)});};
  const timerTick=useCallback(()=>{
    const rem=Math.max(0,totRef.current-(performance.now()-startRef.current));
    remRef.current=rem;dispUpd(rem);
    if(rem<=0){clearInterval(ivRef.current);setRunning(false);setDone(true);setLabel("TIME'S UP!");playAlarm();onDone?.();}
  },[onDone]);
  const toggle=()=>{
    if(done){timerReset();return;}
    if(!running){if(remRef.current<=0)return;startRef.current=performance.now()-(totRef.current-remRef.current);ivRef.current=setInterval(timerTick,46);setRunning(true);setLabel("RUNNING");}
    else{clearInterval(ivRef.current);remRef.current=totRef.current-(performance.now()-startRef.current);setRunning(false);setLabel("PAUSED");}
  };
  const timerReset=()=>{clearInterval(ivRef.current);remRef.current=totRef.current;setRunning(false);setDone(false);setLabel("SET TIME");dispUpd(totRef.current);};
  const preset=(h,m,s)=>{const t=(h*3600+m*60+s)*1000;totRef.current=t;remRef.current=t;setHh(h);setMm(m);setSs(s);setDone(false);setLabel("SET TIME");dispUpd(t);clearInterval(ivRef.current);startRef.current=performance.now();ivRef.current=setInterval(timerTick,46);setRunning(true);setLabel("RUNNING");};
  const inputChange=(fh,fm,fs)=>{if(running)return;const t=(fh*3600+fm*60+fs)*1000;totRef.current=t;remRef.current=t;setDone(false);setLabel("SET TIME");dispUpd(t);};
  useEffect(()=>()=>clearInterval(ivRef.current),[]);
  return {hh,setHh,mm,setMm,ss,setSs,running,done,label,disp,toggle,timerReset,preset,inputChange};
}

// ── STOPWATCH PANEL ───────────────────────────────────────────────────
function StopwatchPanel({sw,styleId,accent,accent2,T,onFullscreen}){
  const {running,label,disp,laps,toggle,lap,reset,elapRef}=sw;
  const fmt=ms=>{const s=Math.floor(ms/1000)%60,m=Math.floor(ms/60000)%60,h=Math.floor(ms/3600000),ml=Math.floor(ms%1000);return(h?pad(h)+":":"")+pad(m)+":"+pad(s)+"."+pad(ml,3);};
  const splits=laps.map(l=>l.split),mn=Math.min(...splits),mx=Math.max(...splits);
  return(
    <div className="panel-content">
      <button className="fsbtn" onClick={onFullscreen}><IconFS/> FULLSCREEN</button>
      <Digits value={disp.main} millis={disp.ms} label={label} styleId={styleId} accentHex={accent} accent2Hex={accent2} T={T}/>
      <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
        <Btn onClick={toggle} variant="go">{running?<><IconPause/>PAUSE</>:<><IconPlay/>{elapRef.current>0?"RESUME":"START"}</>}</Btn>
        <Btn onClick={lap} variant="sec" disabled={!running}><IconLap/>LAP</Btn>
        <Btn onClick={reset} variant="del" disabled={laps.length===0&&!running&&elapRef.current===0}>RESET</Btn>
      </div>
      {laps.length>0&&(
        <div style={{width:"100%",maxWidth:460,maxHeight:185,overflowY:"auto",background:"var(--bg2)",border:"1px solid var(--line)"}}>
          {[...laps].reverse().map((l,ri)=>{
            const i=laps.length-ri,fast=laps.length>1&&l.split===mn,slow=laps.length>1&&l.split===mx;
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 13px",borderBottom:"1px solid var(--line)",fontFamily:MONO,fontSize:12,animation:"lapIn .2s ease"}}>
                <span style={{color:"var(--muted)",fontSize:10,width:22,textAlign:"right",flexShrink:0}}>{i}</span>
                <span style={{flex:1,color:"var(--bright)"}}>{fmt(l.split)}</span>
                <span style={{fontSize:10,padding:"2px 8px",background:fast?"rgba(34,197,94,.1)":slow?"rgba(239,68,68,.1)":"transparent",color:fast?"#4ade80":slow?"#f87171":"var(--muted)"}}>{fmt(l.total)}{fast?" ▲":slow?" ▼":""}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── TIMER PANEL ───────────────────────────────────────────────────────
function TimerPanel({timer,accent,accent2,styleId,T,onFullscreen}){
  const {hh,setHh,mm,setMm,ss,setSs,running,done,label,disp,toggle,timerReset,preset,inputChange}=timer;
  const PRESETS=[[1,0,0,"1 HR"],[0,45,0,"45 MIN"],[0,30,0,"30 MIN"],[0,25,0,"25 MIN"],[0,15,0,"15 MIN"],[0,10,0,"10 MIN"],[0,5,0,"5 MIN"],[0,1,0,"1 MIN"],[0,0,30,"30 SEC"],[0,0,10,"10 SEC"]];
  const numField=(val,setFn,max,key)=>(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
      <input type="number" value={val} min={0} max={max}
        onChange={e=>{const v=Math.min(max,Math.max(0,parseInt(e.target.value)||0));setFn(v);const nxt={h:hh,m:mm,s:ss,[key]:v};inputChange(nxt.h,nxt.m,nxt.s);}}
        disabled={running}
        style={{width:70,textAlign:"center",background:"var(--bg)",border:"1px solid var(--line2)",color:"var(--bright)",fontFamily:DISPLAY,fontSize:38,fontWeight:700,letterSpacing:".06em",padding:"6px 4px 3px",outline:"none",MozAppearance:"textfield",appearance:"textfield",opacity:running?.5:1,transition:"opacity .2s"}}
        onFocus={e=>{e.target.style.borderColor=accent;e.target.style.boxShadow=`0 0 0 3px ${hexToRgba(accent,.14)}`;}}
        onBlur={e=>{e.target.style.borderColor="var(--line2)";e.target.style.boxShadow="none";}}
      />
      <span style={{fontFamily:DISPLAY,fontSize:9,fontWeight:800,letterSpacing:".14em",color:"var(--muted)",textTransform:"uppercase"}}>{key.toUpperCase()}</span>
    </div>
  );
  return(
    <div className="panel-content">
      <button className="fsbtn" onClick={onFullscreen}><IconFS/> FULLSCREEN</button>
      <Digits value={disp.main} millis={disp.ms} label={label} styleId={styleId} accentHex={accent} accent2Hex={accent2} isDone={done} T={T}/>
      <div style={{display:"flex",alignItems:"center",gap:8,background:"var(--bg2)",border:"1px solid var(--line2)",padding:"12px 18px",opacity:running?.4:1,pointerEvents:running?"none":"auto",transition:"opacity .2s"}}>
        {numField(hh,setHh,99,"h")}<span style={{fontFamily:DISPLAY,fontSize:32,fontWeight:900,color:"var(--dim)",marginTop:-14,flexShrink:0}}>:</span>
        {numField(mm,setMm,59,"m")}<span style={{fontFamily:DISPLAY,fontSize:32,fontWeight:900,color:"var(--dim)",marginTop:-14,flexShrink:0}}>:</span>
        {numField(ss,setSs,59,"s")}
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center",maxWidth:540}}>
        {PRESETS.map(([h,m,s,l])=>(
          <button key={l} onClick={()=>preset(h,m,s)}
            style={{padding:"4px 11px",border:"1px solid var(--line2)",background:"transparent",color:"var(--muted)",fontFamily:MONO,fontSize:11,cursor:"pointer",transition:"all .15s"}}
            onMouseEnter={e=>{e.target.style.borderColor=accent;e.target.style.color=accent;e.target.style.background=hexToRgba(accent,.1);}}
            onMouseLeave={e=>{e.target.style.borderColor="var(--line2)";e.target.style.color="var(--muted)";e.target.style.background="transparent";}}
          >{l}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
        <Btn onClick={toggle} variant="go">{done?"↺ RESET":running?<><IconPause/>PAUSE</>:<><IconPlay/>START</>}</Btn>
        <Btn onClick={timerReset} variant="del">RESET</Btn>
      </div>
    </div>
  );
}

// ── BLINK OVERLAY — screen flash when timer done ──────────────────────
function BlinkOverlay({accent,onDone}){
  const [frame,setFrame]=useState(0);
  useEffect(()=>{
    if(frame>=12){onDone();return;}
    const t=setTimeout(()=>setFrame(f=>f+1),130);
    return()=>clearTimeout(t);
  },[frame,onDone]);
  const visible=frame%2===0;
  return(
    <div style={{position:"absolute",inset:0,zIndex:8,background:accent,opacity:visible?Math.max(0,.6-frame*0.045):0,pointerEvents:"none",transition:"opacity 0.11s"}}/>
  );
}

// ── FULLSCREEN CANVAS (own canvas element inside the FS overlay) ──────
function FSCanvas({bgMode,isDark,accentHex}){
  const cvRef=useRef(null);
  useBgCanvas(cvRef,bgMode,isDark,accentHex);
  return(
    <canvas ref={cvRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0,opacity:isDark?1:.28}}/>
  );
}

// ── FULLSCREEN LIVE CLOCK DISPLAY ─────────────────────────────────────
function FSClockDisplay({styleId,accent,accent2,T}){
  const [str,setStr]=useState("");
  useEffect(()=>{const iv=setInterval(()=>{const n=new Date();setStr(pad(n.getHours())+":"+pad(n.getMinutes())+":"+pad(n.getSeconds()));},200);return()=>clearInterval(iv);},[]);
  return <Digits value={str} label="LIVE" styleId={styleId} accentHex={accent} accent2Hex={accent2} T={T} large/>;
}

// ── MAIN APP ─────────────────────────────────────────────────────────
export default function TimeKitEnterprise(){
  const [dark,setDark]          = useState(true);
  const [tab,setTab]            = useState("clock");
  const [bgMode,setBgMode]      = useState("mesh");
  const [styleId,setStyleId]    = useState("solid");
  const [colKey,setColKey]      = useState("white");
  const [customHex,setCustomHex]= useState("#D0D0D0");
  const [isCustom,setIsCustom]  = useState(false);
  const [isFS,setIsFS]          = useState(false);
  const [toast,setToast]        = useState(null);
  const [hdrTime,setHdrTime]    = useState("");
  const [blinking,setBlinking]  = useState(false);

  const T=dark?DARK:LIGHT;
  const [accent,accent2]=isCustom?[customHex,lightenHex(customHex,.22)]:(COL_MAP[colKey]||COL_MAP.white);

  // ── Lifted stopwatch state ─────────────────────────────────────────
  const sw=useStopwatch();

  // ── Lifted timer state ─────────────────────────────────────────────
  const showToast=useCallback(msg=>{setToast(msg);setTimeout(()=>setToast(null),2500);},[]);
  const handleTimerDone=useCallback(()=>{showToast("Timer done!");setBlinking(true);},[showToast]);
  const timer=useTimer(handleTimerDone);

  // Main BG canvas
  const mainCvRef=useRef(null);
  useBgCanvas(mainCvRef,bgMode,dark,accent);

  // CSS vars
  useEffect(()=>{
    const r=document.documentElement.style;
    r.setProperty("--accent",accent);r.setProperty("--accent2",accent2);
    r.setProperty("--accentG",hexToRgba(accent,.14));r.setProperty("--accentB",hexToRgba(accent,.38));
    r.setProperty("--bg",T.bg);r.setProperty("--bg2",T.bg2);r.setProperty("--bg3",T.bg3);
    r.setProperty("--line",T.line);r.setProperty("--line2",T.line2);r.setProperty("--dim",T.dim);
    r.setProperty("--muted",T.muted);r.setProperty("--soft",T.soft);r.setProperty("--body",T.body);r.setProperty("--bright",T.bright);r.setProperty("--sub",T.sub);
  },[accent,accent2,T]);

  // Header clock
  useEffect(()=>{const iv=setInterval(()=>{const n=new Date();setHdrTime(pad(n.getHours())+":"+pad(n.getMinutes())+":"+pad(n.getSeconds()));},1000);return()=>clearInterval(iv);},[]);

  // Real OS fullscreen
  const enterFS=useCallback(async()=>{
    try{const el=document.documentElement;if(el.requestFullscreen)await el.requestFullscreen();else if(el.webkitRequestFullscreen)await el.webkitRequestFullscreen();else if(el.mozRequestFullScreen)await el.mozRequestFullScreen();}catch(e){}
    setIsFS(true);
  },[]);
  const exitFS=useCallback(async()=>{
    try{if(document.exitFullscreen)await document.exitFullscreen();else if(document.webkitExitFullscreen)await document.webkitExitFullscreen();else if(document.mozCancelFullScreen)await document.mozCancelFullScreen();}catch(e){}
    setIsFS(false);
  },[]);
  useEffect(()=>{
    const fn=()=>{if(!document.fullscreenElement&&!document.webkitFullscreenElement&&!document.mozFullScreenElement)setIsFS(false);};
    document.addEventListener("fullscreenchange",fn);document.addEventListener("webkitfullscreenchange",fn);document.addEventListener("mozfullscreenchange",fn);
    return()=>{document.removeEventListener("fullscreenchange",fn);document.removeEventListener("webkitfullscreenchange",fn);document.removeEventListener("mozfullscreenchange",fn);};
  },[]);
  const toggleFS=useCallback(()=>isFS?exitFS():enterFS(),[isFS,enterFS,exitFS]);

  // Keyboard shortcuts
  useEffect(()=>{
    const kd=e=>{
      if(["INPUT","TEXTAREA"].includes(e.target.tagName))return;
      if(e.key.toLowerCase()==="t")setDark(d=>!d);
      if(e.key.toLowerCase()==="f")toggleFS();
      if(e.key===" "){e.preventDefault();if(tab==="sw")sw.toggle();else if(tab==="timer")timer.toggle();}
    };
    window.addEventListener("keydown",kd);return()=>window.removeEventListener("keydown",kd);
  },[isFS,tab,sw,timer,toggleFS]);

  const TABS=[{id:"clock",label:"CLOCK",icon:<IconClk/>},{id:"sw",label:"STOPWATCH",icon:<IconSW/>},{id:"timer",label:"TIMER",icon:<IconTmr/>}];
  const BG_OPTS=[["mesh","MESH"],["float","FLOAT"],["waves","WAVES"],["grid","GRID"],["aurora","AURORA"],["rain","RAIN"],["none","NONE"]];
  const panelProps={styleId,accent,accent2,T,onFullscreen:toggleFS};

  return(
    <div style={{fontFamily:BODY,background:T.bg,color:T.body,display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden",position:"relative"}}>
      <link href={FONTS_URL} rel="stylesheet"/>

      {/* Main BG canvas (behind everything in normal view) */}
      <canvas ref={mainCvRef} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",width:"100%",height:"100%",opacity:dark?1:.28,transition:"opacity .3s"}}/>

      {/* ═══════════════════════════════════════════════════
          FULLSCREEN OVERLAY
          OS fullscreen is active; this overlay occupies the full screen.
          It has its OWN canvas bg + live time display + controls.
      ═══════════════════════════════════════════════════ */}
      {isFS&&(
        <div style={{position:"fixed",inset:0,zIndex:1000,background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:36,overflow:"hidden"}}>

          {/* BG canvas — rendered inside fullscreen overlay */}
          <FSCanvas bgMode={bgMode} isDark={dark} accentHex={accent}/>

          {/* Timer-done blink flash */}
          {blinking&&<BlinkOverlay accent={accent} onDone={()=>setBlinking(false)}/>}

          {/* Exit button — top right */}
          <button onClick={exitFS} title="Exit fullscreen (Esc)"
            style={{position:"absolute",top:18,right:18,zIndex:10,display:"flex",alignItems:"center",gap:7,padding:"8px 16px",border:`1px solid ${T.line2}`,background:dark?"rgba(10,10,10,.82)":"rgba(255,255,255,.88)",color:T.sub,fontFamily:MONO,fontSize:10,cursor:"pointer",letterSpacing:".08em",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=T.bg3;e.currentTarget.style.color=T.bright;}}
            onMouseLeave={e=>{e.currentTarget.style.background=dark?"rgba(10,10,10,.82)":"rgba(255,255,255,.88)";e.currentTarget.style.color=T.sub;}}>
            <IconExitFS/> EXIT FULLSCREEN
          </button>

          {/* Tab label — top left */}
          <div style={{position:"absolute",top:18,left:20,fontFamily:DISPLAY,fontSize:11,fontWeight:800,letterSpacing:".22em",color:T.muted,textTransform:"uppercase",zIndex:10}}>
            {TABS.find(t=>t.id===tab)?.label}
          </div>

          {/* Live time display */}
          <div style={{position:"relative",zIndex:2,textAlign:"center"}}>
            {tab==="clock" && <FSClockDisplay styleId={styleId} accent={accent} accent2={accent2} T={T}/>}
            {tab==="sw"    && <Digits value={sw.disp.main} millis={sw.disp.ms} label={sw.label} styleId={styleId} accentHex={accent} accent2Hex={accent2} T={T} large/>}
            {tab==="timer" && <Digits value={timer.disp.main} millis={timer.disp.ms} label={timer.label} styleId={styleId} accentHex={accent} accent2Hex={accent2} isDone={timer.done} T={T} large/>}
          </div>

          {/* Controls for SW and Timer in fullscreen */}
          {tab==="sw"&&(
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",position:"relative",zIndex:2}}>
              <Btn onClick={sw.toggle} variant="go">{sw.running?<><IconPause/>PAUSE</>:<><IconPlay/>{sw.elapRef.current>0?"RESUME":"START"}</>}</Btn>
              <Btn onClick={sw.lap} variant="sec" disabled={!sw.running}><IconLap/>LAP</Btn>
              <Btn onClick={sw.reset} variant="del">RESET</Btn>
            </div>
          )}
          {tab==="timer"&&(
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",position:"relative",zIndex:2}}>
              <Btn onClick={timer.toggle} variant="go">{timer.done?"↺ RESET":timer.running?<><IconPause/>PAUSE</>:<><IconPlay/>START</>}</Btn>
              <Btn onClick={timer.timerReset} variant="del">RESET</Btn>
            </div>
          )}

          {/* Lap list in fullscreen for SW */}
          {tab==="sw"&&sw.laps.length>0&&(()=>{
            const fmt=ms=>{const s=Math.floor(ms/1000)%60,m=Math.floor(ms/60000)%60,h=Math.floor(ms/3600000),ml=Math.floor(ms%1000);return(h?pad(h)+":":"")+pad(m)+":"+pad(s)+"."+pad(ml,3);};
            const splits=sw.laps.map(l=>l.split),mn=Math.min(...splits),mx=Math.max(...splits);
            return(
              <div style={{position:"relative",zIndex:2,width:"100%",maxWidth:400,maxHeight:160,overflowY:"auto",background:hexToRgba(T.bg2,.72),border:`1px solid ${T.line2}`,backdropFilter:"blur(12px)"}}>
                {[...sw.laps].reverse().map((l,ri)=>{
                  const i=sw.laps.length-ri,fast=sw.laps.length>1&&l.split===mn,slow=sw.laps.length>1&&l.split===mx;
                  return(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"7px 12px",borderBottom:`1px solid ${T.line}`,fontFamily:MONO,fontSize:11}}>
                      <span style={{color:T.muted,fontSize:10,width:22,textAlign:"right",flexShrink:0}}>{i}</span>
                      <span style={{flex:1,color:T.bright}}>{fmt(l.split)}</span>
                      <span style={{fontSize:10,padding:"2px 8px",background:fast?"rgba(34,197,94,.1)":slow?"rgba(239,68,68,.1)":"transparent",color:fast?"#4ade80":slow?"#f87171":T.muted}}>{fmt(l.total)}{fast?" ▲":slow?" ▼":""}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Bottom hint */}
          <div style={{position:"absolute",bottom:16,fontFamily:MONO,fontSize:10,color:T.muted,letterSpacing:".08em",zIndex:10,opacity:.45}}>
            {(tab==="sw"||tab==="timer")?"SPACE — start/pause  ·  ESC — exit":"ESC — exit fullscreen"}
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header style={{position:"relative",zIndex:30,height:50,display:"flex",alignItems:"center",gap:10,padding:"0 18px",background:dark?"rgba(10,10,10,.92)":"rgba(244,244,246,.93)",borderBottom:`1px solid ${T.line2}`,backdropFilter:"blur(24px)",flexShrink:0}}>
        <div style={{width:30,height:30,background:accent,display:"grid",placeItems:"center",flexShrink:0}}><IconClk w={16} h={16}/></div>
        <span style={{fontFamily:DISPLAY,fontSize:13,fontWeight:900,color:T.bright,letterSpacing:".12em"}}>TIMEKIT</span>
        <div style={{fontFamily:MONO,fontSize:11,color:T.muted,display:"flex",alignItems:"center",gap:4,marginLeft:8}}>
          <span>DevPocketHub</span><span style={{color:T.dim,margin:"0 2px"}}>/</span><span style={{color:accent}}>TimeKit</span>
        </div>
        <div style={{flex:1}}/>
        <span style={{fontFamily:MONO,fontSize:11,color:T.sub,letterSpacing:".1em"}}>{hdrTime}</span>
        <button onClick={()=>setDark(d=>!d)} title="Toggle theme (T)"
          style={{width:30,height:30,border:`1px solid ${T.line2}`,background:"transparent",color:T.muted,cursor:"pointer",display:"grid",placeItems:"center",transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background=T.bg3;e.currentTarget.style.color=T.bright;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.muted;}}>
          {dark?<IconSun/>:<IconMoon/>}
        </button>
      </header>

      {/* ── TABS ── */}
      <nav style={{position:"relative",zIndex:30,display:"flex",background:dark?"rgba(10,10,10,.92)":"rgba(244,244,246,.93)",borderBottom:`1px solid ${T.line}`,flexShrink:0,backdropFilter:"blur(20px)",overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:7,padding:"11px 22px",border:"none",background:"transparent",cursor:"pointer",transition:"all .2s",fontFamily:DISPLAY,fontSize:10,fontWeight:800,letterSpacing:".14em",color:tab===t.id?T.bright:T.muted,borderBottom:tab===t.id?`2px solid ${accent}`:"2px solid transparent",marginBottom:-1,whiteSpace:"nowrap"}}
            onMouseEnter={e=>{if(tab!==t.id)e.currentTarget.style.color=T.body;}}
            onMouseLeave={e=>{if(tab!==t.id)e.currentTarget.style.color=T.muted;}}>
            {t.icon}{t.label}
          </button>
        ))}
      </nav>

      {/* ── PANEL ── */}
      <main style={{flex:1,position:"relative",zIndex:1,overflow:"hidden",minHeight:0}}>
        <div style={{height:"100%",overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:"18px 16px"}}>
            {tab==="clock" && <ClockPanel {...panelProps}/>}
            {tab==="sw"    && <StopwatchPanel sw={sw} {...panelProps}/>}
            {tab==="timer" && <TimerPanel timer={timer} {...panelProps}/>}

            <PickerBox label="STYLE">
              {FONT_STYLES.map(fs=><Chip key={fs.id} label={fs.label} active={styleId===fs.id} onClick={()=>setStyleId(fs.id)} accent={accent}/>)}
              <div style={{width:1,background:"var(--line2)",alignSelf:"stretch",margin:"0 4px",flexShrink:0}}/>
              <ColorDots activeKey={isCustom?"__custom__":colKey} customHex={isCustom?customHex:(COL_MAP[colKey]?.[0]||"#D0D0D0")} onSelect={k=>{setColKey(k);setIsCustom(false);}} onCustom={h=>{setCustomHex(h);setIsCustom(true);}}/>
            </PickerBox>

            <PickerBox label="BG">
              {BG_OPTS.map(([id,lbl])=><Chip key={id} label={lbl} active={bgMode===id} onClick={()=>setBgMode(id)} accent={accent}/>)}
            </PickerBox>

            <div style={{fontFamily:MONO,fontSize:10,color:T.muted,letterSpacing:".06em",textAlign:"center",paddingBottom:8,opacity:.5}}>
              T — theme · F — fullscreen · SPACE — start/pause
            </div>
          </div>
        </div>
      </main>

      {/* ── TOAST ── */}
      {toast&&(
        <div style={{position:"fixed",bottom:18,left:"50%",transform:"translateX(-50%)",background:T.bg3,border:`1px solid ${T.line2}`,color:T.body,padding:"9px 20px",fontFamily:MONO,fontSize:12,boxShadow:"0 8px 32px rgba(0,0,0,.5)",zIndex:4000,whiteSpace:"nowrap",animation:"toastIn .18s ease"}}>
          {toast}
        </div>
      )}

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:var(--line2)}
        ::selection{background:${hexToRgba(accent,.22)}}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield;appearance:textfield}
        .panel-content{display:flex;flex-direction:column;align-items:center;gap:14px;width:100%;position:relative;padding-top:36px}
        .fsbtn{position:absolute;top:0;right:0;z-index:30;padding:5px 12px;border:1px solid var(--line2);background:transparent;color:var(--muted);font-family:${MONO};font-size:10px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;letter-spacing:.08em}
        .fsbtn:hover{background:var(--bg3);color:var(--bright)}
        @keyframes solidPulse{0%,100%{opacity:1}50%{opacity:.88}}
        @keyframes cleanFade{0%,100%{opacity:1}50%{opacity:.78}}
        @keyframes breathe{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.75;transform:scale(.997)}}
        @keyframes shimmer{0%{background-position:100% 50%}100%{background-position:-100% 50%}}
        @keyframes liquidWave{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        @keyframes matrixScan{0%{opacity:1}50%{opacity:.92}}
        @keyframes chakraScan{0%{filter:brightness(1)}49%{filter:brightness(1.1)}50%{filter:brightness(.92)}100%{filter:brightness(1)}}
        @keyframes rajPulse{0%,100%{letter-spacing:.15em;opacity:1}50%{letter-spacing:.2em;opacity:.82}}
        @keyframes blockShift{0%,100%{text-shadow:3px 3px 0 ${hexToRgba(accent2,.22)}}50%{text-shadow:5px 5px 0 ${hexToRgba(accent2,.22)}}}
        @keyframes doneFlash{0%,100%{opacity:1}50%{opacity:.07}}
        @keyframes lapIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @media(max-width:500px){nav button{padding:9px 12px!important;font-size:9px!important}header{padding:0 10px!important}}
      `}</style>
    </div>
  );
}