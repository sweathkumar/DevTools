import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════
//  TIMEKIT — ENTERPRISE EDITION
//  Sharp corners · Black & White · Barlow Condensed default
//  Dark + Light mode · Mobile-first responsive
//  Full feature parity: Clock · Stopwatch · Timer
//  15 font styles · 11 accent colors + custom · 6 bg animations
//  Analog clock · World clocks · Fullscreen · Keyboard shortcuts
// ═══════════════════════════════════════════════════════════════════

// ── THEMES ──────────────────────────────────────────────────────────
const DARK = {
  bg:"#0A0A0A", bg2:"#111111", bg3:"#161616", bg4:"#1a1a1a",
  line:"#222222", line2:"#2a2a2a", dim:"#333333", muted:"#555555",
  soft:"#777777", body:"#A0A0A0", bright:"#F0F0F0", sub:"#888888",
  isDark: true,
};
const LIGHT = {
  bg:"#F4F4F6", bg2:"#FFFFFF", bg3:"#EBEBED", bg4:"#E2E2E4",
  line:"#DCDCDE", line2:"#CECECE", dim:"#BBBBBB", muted:"#999999",
  soft:"#777777", body:"#333333", bright:"#0A0A0A", sub:"#555555",
  isDark: false,
};

// ── FONTS ────────────────────────────────────────────────────────────
// Enterprise default: Barlow Condensed (solid, sharp, industrial)
// All 15 display-style fonts still available via the style picker
const FONTS_URL = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;800;900&family=Barlow:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=VT323&family=Cinzel:wght@400;700;900&family=Righteous&family=Poiret+One&family=Exo+2:ital,wght@0,100;0,900;1,900&family=Black+Ops+One&family=Syncopate:wght@400;700&family=Major+Mono+Display&family=Space+Grotesk:wght@300;400;700&family=Bebas+Neue&family=Chakra+Petch:wght@300;400;600;700&family=Audiowide&family=Rajdhani:wght@300;400;600;700&display=swap";

const DISPLAY = "'Barlow Condensed','DIN Condensed',sans-serif";
const BODY    = "'Barlow','DM Sans',system-ui,sans-serif";
const MONO    = "'JetBrains Mono','Share Tech Mono',monospace";

// ── ACCENT COLOR MAP ─────────────────────────────────────────────────
const COL_MAP = {
  white:  ["#D0D0D0","#ffffff"],
  blue:   ["#4F8EF7","#7aaeff"],
  amber:  ["#F59E0B","#fbbf24"],
  teal:   ["#06B6D4","#22d3ee"],
  rose:   ["#EF4444","#f87171"],
  violet: ["#A78BFA","#c4b5fd"],
  green:  ["#22C55E","#4ade80"],
  orange: ["#F97316","#fb923c"],
  pink:   ["#EC4899","#f472b6"],
  lime:   ["#84cc16","#a3e635"],
  cyan:   ["#00ddc8","#44eedf"],
};
const COLOR_DOTS = Object.entries(COL_MAP);

function hexToRgba(h, a) {
  const r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function lightenHex(h, amt) {
  let r=parseInt(h.slice(1,3),16), g=parseInt(h.slice(3,5),16), b=parseInt(h.slice(5,7),16);
  r=Math.min(255,Math.round(r+(255-r)*amt)); g=Math.min(255,Math.round(g+(255-g)*amt)); b=Math.min(255,Math.round(b+(255-b)*amt));
  return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function hexToRgb(h) {
  return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
}

// ── 15 FONT STYLES ──────────────────────────────────────────────────
const FONT_STYLES = [
  { id:"solid",    label:"◼ SOLID",    css: { fontFamily: DISPLAY, fontWeight:900, letterSpacing:".06em" } },
  { id:"neon",     label:"⚡ NEON",    css: { fontFamily:"'Orbitron',monospace", fontWeight:900, letterSpacing:".06em" } },
  { id:"retro",    label:"📺 CRT",     css: { fontFamily:"'VT323',monospace", letterSpacing:".1em" } },
  { id:"minimal",  label:"◌ MINIMAL", css: { fontFamily:"'Poiret One',cursive", letterSpacing:".18em" } },
  { id:"glitch",   label:"⚠ GLITCH",  css: { fontFamily:"'Exo 2',sans-serif", fontWeight:900 } },
  { id:"liquid",   label:"✦ LIQUID",  css: { fontFamily:"'Righteous',cursive", letterSpacing:".07em" } },
  { id:"matrix",   label:"▓ MATRIX",  css: { fontFamily:"'Major Mono Display',monospace", letterSpacing:".12em" } },
  { id:"cinzel",   label:"👑 CINZEL", css: { fontFamily:"'Cinzel',serif", fontWeight:900, letterSpacing:".1em" } },
  { id:"outline",  label:"□ OUTLINE", css: { fontFamily:"'Black Ops One',cursive", letterSpacing:".08em" } },
  { id:"type",     label:"| TYPE",    css: { fontFamily:"'Syncopate',sans-serif", fontWeight:700, letterSpacing:".18em" } },
  { id:"fire",     label:"🔥 FIRE",   css: { fontFamily:"'Exo 2',sans-serif", fontWeight:900, fontStyle:"italic", letterSpacing:".04em" } },
  { id:"bebas",    label:"■ BLOCK",   css: { fontFamily:"'Bebas Neue',cursive", letterSpacing:".12em" } },
  { id:"chakra",   label:"◈ CHAKRA", css: { fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, letterSpacing:".1em" } },
  { id:"audio",    label:"◉ WAVE",   css: { fontFamily:"'Audiowide',cursive", letterSpacing:".06em" } },
  { id:"rajdhani", label:"◆ SHARP",  css: { fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:".15em" } },
  { id:"clean",    label:"○ CLEAN",  css: { fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:"-.02em" } },
];

// per-style digit animation names (injected via global <style>)
const ANIM_MAP = {
  solid:    "solidPulse 3s ease-in-out infinite",
  neon:     "neonPulse 2.2s ease-in-out infinite",
  retro:    "crtFlicker 6s linear infinite",
  minimal:  "breathe 4s ease-in-out infinite",
  glitch:   "glitch 3.2s infinite",
  liquid:   "liquidWave 3.5s ease-in-out infinite",
  matrix:   "matrixScan .07s steps(1) infinite",
  cinzel:   "shimmer 3s linear infinite",
  outline:  "outlinePulse 2.2s ease-in-out infinite",
  type:     "typeCursor .9s step-start infinite",
  fire:     "fireDance 1.8s ease-in-out infinite alternate",
  bebas:    "blockShift 4s ease-in-out infinite",
  chakra:   "chakraScan 2s linear infinite",
  audio:    "audioWave 1.6s ease-in-out infinite alternate",
  rajdhani: "rajPulse 3s ease-in-out infinite",
  clean:    "cleanFade 5s ease-in-out infinite",
};

// ── BG CANVAS HOOK ───────────────────────────────────────────────────
function useBgCanvas(bgMode, isDark, accentHex) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const ptsRef    = useRef([]);
  const dropsRef  = useRef([]);
  const animRef   = useRef({ waveT:0, gridOff:0, auroraT:0 });

  // init particles once
  useEffect(() => {
    ptsRef.current = Array.from({length:55}, () => ({
      x:Math.random()*2000, y:Math.random()*2000,
      vx:(Math.random()-.5)*.35, vy:(Math.random()-.5)*.35,
      r:Math.random()*1.4+.3, a:Math.random()*.26+.04,
    }));
    dropsRef.current = Array.from({length:80}, () => ({
      x:Math.random()*2000, y:Math.random()*2000,
      speed:Math.random()*2+.5, len:Math.random()*30+10, a:Math.random()*.2+.04,
    }));
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    let W = 0, H = 0;
    const resize = () => { cv.width = W = window.innerWidth; cv.height = H = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const getRgb = () => hexToRgb(accentHex || (isDark ? "#F0F0F0" : "#0A0A0A"));
    const pts = ptsRef.current;
    const drops = dropsRef.current;
    const an = animRef.current;

    const drawMesh = () => {
      ctx.clearRect(0,0,W,H);
      const [r,g,b] = getRgb();
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        const px=p.x%W, py=p.y%H;
        ctx.beginPath(); ctx.arc(px,py,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${r},${g},${b},${p.a})`; ctx.fill();
        pts.forEach(q => {
          const dx=px-(q.x%W), dy=py-(q.y%H), d=Math.sqrt(dx*dx+dy*dy);
          if(d<110&&d>0){
            ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(q.x%W,q.y%H);
            ctx.strokeStyle=`rgba(${r},${g},${b},${(.12*(1-d/110)).toFixed(3)})`;
            ctx.lineWidth=.5; ctx.stroke();
          }
        });
      });
    };
    const drawFloat = () => {
      ctx.clearRect(0,0,W,H); const [r,g,b]=getRgb();
      pts.forEach(p => {
        p.x+=p.vx*.6; p.y+=p.vy*.6;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        const px=p.x%W,py=p.y%H,sz=p.r*3;
        const grd=ctx.createRadialGradient(px,py,0,px,py,sz);
        grd.addColorStop(0,`rgba(${r},${g},${b},${p.a*2.4})`);
        grd.addColorStop(1,`rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(px,py,sz,0,Math.PI*2); ctx.fillStyle=grd; ctx.fill();
      });
    };
    const drawWaves = () => {
      ctx.clearRect(0,0,W,H); const [r,g,b]=getRgb(); an.waveT+=.008;
      for(let i=0;i<6;i++){
        const amp=28+i*11,freq=.004+i*.0012,phase=an.waveT+i*.55,yBase=H*.12+i*(H*.15);
        ctx.beginPath(); ctx.moveTo(0,yBase);
        for(let x=0;x<=W;x+=6) ctx.lineTo(x,yBase+Math.sin(x*freq+phase)*amp+Math.sin(x*freq*.5+phase*.7)*amp*.4);
        ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath();
        ctx.fillStyle=`rgba(${r},${g},${b},${.022+i*.005})`; ctx.fill();
      }
    };
    const drawGrid = () => {
      ctx.clearRect(0,0,W,H); const [r,g,b]=getRgb();
      an.gridOff=(an.gridOff+.3)%60; const sz=60;
      ctx.strokeStyle=`rgba(${r},${g},${b},.07)`; ctx.lineWidth=.7;
      for(let x=-sz+an.gridOff%sz;x<W+sz;x+=sz){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for(let y=-sz+an.gridOff%sz;y<H+sz;y+=sz){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
      ctx.fillStyle=`rgba(${r},${g},${b},.2)`;
      for(let x=-sz+an.gridOff%sz;x<W+sz;x+=sz)
        for(let y=-sz+an.gridOff%sz;y<H+sz;y+=sz){ctx.beginPath();ctx.arc(x,y,1.4,0,Math.PI*2);ctx.fill();}
    };
    const drawAurora = () => {
      ctx.clearRect(0,0,W,H); an.auroraT+=.0035; const [r,g,b]=getRgb();
      for(let i=0;i<5;i++){
        const t=an.auroraT+i*.9,yc=H*.18+i*(H*.16)+Math.sin(t*.6)*H*.06,ht=H*.14+Math.sin(t*.45)*H*.05;
        const grd=ctx.createLinearGradient(0,yc-ht,0,yc+ht);
        const a2=.06+.035*Math.sin(t);
        grd.addColorStop(0,`rgba(${r},${g},${b},0)`);
        grd.addColorStop(.4,`rgba(${r},${g},${b},${a2})`);
        grd.addColorStop(.6,`rgba(${r},${g},${b},${a2})`);
        grd.addColorStop(1,`rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        for(let x=0;x<=W;x+=8){const w=yc+Math.sin(x*.005+t)*ht*.45+Math.sin(x*.012+t*1.3)*ht*.2; x===0?ctx.moveTo(x,w-ht):ctx.lineTo(x,w-ht);}
        for(let x=W;x>=0;x-=8){const w=yc+Math.sin(x*.005+t)*ht*.45+Math.sin(x*.012+t*1.3)*ht*.2; ctx.lineTo(x,w+ht);}
        ctx.closePath(); ctx.fillStyle=grd; ctx.fill();
      }
    };
    const drawRain = () => {
      ctx.fillStyle=isDark?'rgba(10,10,10,.12)':'rgba(244,244,246,.12)'; ctx.fillRect(0,0,W,H);
      const [r,g,b]=getRgb();
      drops.forEach(d=>{
        d.y+=d.speed*3; if(d.y>H+50){d.y=-50;d.x=Math.random()*W;}
        ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(d.x+d.len*.15,d.y+d.len);
        ctx.strokeStyle=`rgba(${r},${g},${b},${d.a})`; ctx.lineWidth=.8; ctx.stroke();
      });
    };

    const loop = () => {
      if(bgMode==="none"){ ctx.clearRect(0,0,W,H); rafRef.current=null; return; }
      if(bgMode==="mesh")         drawMesh();
      else if(bgMode==="float")   drawFloat();
      else if(bgMode==="waves")   drawWaves();
      else if(bgMode==="grid")    drawGrid();
      else if(bgMode==="aurora")  drawAurora();
      else if(bgMode==="rain")    drawRain();
      rafRef.current = requestAnimationFrame(loop);
    };

    if(rafRef.current) cancelAnimationFrame(rafRef.current);
    if(bgMode==="none") ctx.clearRect(0,0,W,H);
    else loop();

    return () => {
      window.removeEventListener("resize", resize);
      if(rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [bgMode, isDark, accentHex]);

  return canvasRef;
}

// ── ANALOG CLOCK ─────────────────────────────────────────────────────
function AnalogClock({ T, accentHex }) {
  const ref = useRef(null);
  useEffect(() => {
    const draw = () => {
      const cv = ref.current; if(!cv) return;
      const c = cv.getContext("2d"), cx=100, cy=100, r=88;
      c.clearRect(0,0,200,200);
      const grd = c.createRadialGradient(cx,cy,4,cx,cy,r);
      grd.addColorStop(0, T.isDark?"#161616":"#EBEBEB");
      grd.addColorStop(1, T.isDark?"#0A0A0A":"#F4F4F6");
      c.beginPath(); c.arc(cx,cy,r,0,Math.PI*2); c.fillStyle=grd; c.fill();
      c.strokeStyle=T.isDark?"#2a2a2a":"#D0D0D0"; c.lineWidth=1.5; c.stroke();
      for(let i=0;i<60;i++){
        const a=(i/60)*Math.PI*2-Math.PI/2, big=i%5===0;
        c.beginPath();
        c.moveTo(cx+Math.cos(a)*(r-3), cy+Math.sin(a)*(r-3));
        c.lineTo(cx+Math.cos(a)*(big?r-14:r-7), cy+Math.sin(a)*(big?r-14:r-7));
        c.strokeStyle=big?(T.isDark?"#444":"#888"):(T.isDark?"#2a2a2a":"#CCC");
        c.lineWidth=big?1.8:1; c.stroke();
      }
      const now=new Date();
      const s=now.getSeconds()+now.getMilliseconds()/1000, m=now.getMinutes()+s/60, h=(now.getHours()%12)+m/60;
      const ac = accentHex || (T.isDark?"#F0F0F0":"#0A0A0A");
      const hc = T.isDark?"#C0C0C0":"#333333";
      const hd=(a,l,w,col)=>{c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*l,cy+Math.sin(a)*l);c.strokeStyle=col;c.lineWidth=w;c.lineCap="round";c.stroke();};
      hd((h/12)*Math.PI*2-Math.PI/2, r*.5, 3.5, hc);
      hd((m/60)*Math.PI*2-Math.PI/2, r*.7, 2.5, hc);
      hd((s/60)*Math.PI*2-Math.PI/2, r*.78, 1.5, ac);
      hd((s/60)*Math.PI*2-Math.PI/2+Math.PI, r*.2, 2.5, ac);
      c.beginPath(); c.arc(cx,cy,4,0,Math.PI*2); c.fillStyle=ac; c.fill();
    };
    const iv = setInterval(draw, 46); draw();
    return () => clearInterval(iv);
  }, [T, accentHex]);
  return <canvas ref={ref} width="200" height="200" style={{display:"block"}}/>;
}

// ── DIGIT DISPLAY ────────────────────────────────────────────────────
function Digits({ value, millis, label, styleId, accentHex, accent2Hex, isDone, T }) {
  const sty = FONT_STYLES.find(f=>f.id===styleId) || FONT_STYLES[0];
  const anim = ANIM_MAP[styleId] || ANIM_MAP.solid;

  // Build digit style
  let digitStyle = {
    fontSize:"clamp(58px,12vw,150px)", lineHeight:1, userSelect:"none",
    letterSpacing:sty.css.letterSpacing||".04em",
    fontFamily:sty.css.fontFamily,
    fontWeight:sty.css.fontWeight||"normal",
    fontStyle:sty.css.fontStyle||"normal",
    animation: isDone ? "doneFlash .5s infinite" : anim,
    transition:"font-family .3s",
    color: accentHex,
    display:"inline-block",
  };

  // Gradient styles
  if(styleId==="liquid"||styleId==="cinzel"||styleId==="fire") {
    let grad;
    if(styleId==="liquid")  grad=`linear-gradient(135deg,${accentHex} 0%,${accent2Hex} 40%,#fff 55%,${accentHex} 80%)`;
    if(styleId==="cinzel")  grad=`linear-gradient(100deg,${accentHex} 20%,${accent2Hex} 38%,#fff 50%,${accent2Hex} 62%,${accentHex} 80%)`;
    if(styleId==="fire")    grad=`linear-gradient(0deg,#ff2200 0%,${accentHex} 40%,${accent2Hex} 75%,#fff 100%)`;
    digitStyle = { ...digitStyle, background:grad, backgroundSize:"200% 100%",
      WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent",
      color:"transparent", filter:styleId==="fire"?`drop-shadow(0 0 10px ${accentHex})`:`drop-shadow(0 0 14px ${hexToRgba(accentHex,.14)})` };
  }
  if(styleId==="outline") {
    digitStyle = { ...digitStyle, WebkitTextStroke:`2px ${accentHex}`, color:"transparent",
      textShadow:`0 0 18px ${accentHex},0 0 45px ${hexToRgba(accentHex,.14)}` };
  }
  if(styleId==="neon" || styleId==="retro" || styleId==="audio") {
    digitStyle = { ...digitStyle, textShadow:`0 0 7px ${accentHex},0 0 22px ${accentHex},0 0 65px ${accent2Hex}` };
  }
  if(styleId==="bebas") {
    digitStyle = { ...digitStyle, fontSize:"clamp(72px,14vw,172px)",
      textShadow:`4px 4px 0 ${accent2Hex},8px 8px 0 ${hexToRgba(accentHex,.14)}` };
  }
  if(styleId==="clean") {
    digitStyle = { ...digitStyle, fontSize:"clamp(52px,10vw,128px)" };
  }
  if(styleId==="retro") {
    digitStyle = { ...digitStyle, textShadow:`0 0 6px ${accentHex},0 0 14px ${accent2Hex}` };
  }

  const millisStyle = {
    fontFamily: sty.css.fontFamily,
    fontSize:"clamp(13px,2.2vw,28px)", letterSpacing:".1em",
    marginTop:-2, color:accentHex, opacity:.65,
    display:"block",
    ...(styleId==="outline" ? {WebkitTextStroke:`1px ${accentHex}`, color:"transparent"} : {}),
  };

  return (
    <div style={{textAlign:"center", position:"relative", perspective:900}}>
      {styleId==="retro" && (
        <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:1,
          background:"repeating-linear-gradient(0deg,rgba(0,0,0,.16) 0,rgba(0,0,0,.16) 1px,transparent 1px,transparent 3px)"}}/>
      )}
      <span style={digitStyle}>{value}</span>
      {millis != null && <span style={millisStyle}>{millis}</span>}
      <div style={{fontFamily:DISPLAY, fontSize:10, fontWeight:800, letterSpacing:".22em",
        textTransform:"uppercase", color:T.dim, marginTop:8}}>{label}</div>
    </div>
  );
}

// ── SHARED ATOMS ─────────────────────────────────────────────────────
const pad = (n, d=2) => String(Math.floor(n)).padStart(d, "0");

function Btn({ children, onClick, variant="go", disabled, style: sx }) {
  const base = {
    minWidth:86, padding:"10px 20px", borderRadius:0, border:"none",
    fontFamily:DISPLAY, fontSize:11, fontWeight:800, letterSpacing:".1em",
    cursor: disabled?"not-allowed":"pointer", transition:"all .17s",
    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
    userSelect:"none", opacity: disabled?.38:1, ...sx,
  };
  const vars = {
    go:  { background:"var(--accent)", color:"#050505" },
    sec: { background:"var(--bg3)", color:"var(--body)", outline:"1px solid var(--line2)" },
    del: { background:"rgba(239,68,68,.1)", color:"#f87171", outline:"1px solid rgba(239,68,68,.22)" },
  };
  return (
    <button onClick={disabled?undefined:onClick} disabled={disabled}
      style={{...base,...vars[variant]}}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity=".7"}}
      onMouseLeave={e=>{e.currentTarget.style.opacity="1"}}>
      {children}
    </button>
  );
}

function Chip({ label, active, onClick, accent }) {
  return (
    <button onClick={onClick}
      style={{
        padding:"5px 11px", borderRadius:0, border:`1px solid ${active?"var(--accentB)":"var(--line2)"}`,
        background: active?`${accent}22`:"transparent",
        color: active?"var(--accent)":"var(--muted)",
        cursor:"pointer", transition:"all .16s", fontSize:10, fontWeight: active?700:600,
        fontFamily:"'Share Tech Mono',monospace", whiteSpace:"nowrap", letterSpacing:".04em",
      }}
      onMouseEnter={e=>{if(!active){e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.color="var(--body)";}}}
      onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--muted)";}}}
    >{label}</button>
  );
}

function PickerBox({ label, children }) {
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:5,justifyContent:"center",alignItems:"center",
      background:"var(--bg2)",border:"1px solid var(--line2)",borderRadius:0,
      padding:"10px 14px",maxWidth:700,width:"100%"}}>
      <span style={{fontFamily:DISPLAY,fontSize:9,fontWeight:800,letterSpacing:1.4,
        color:"var(--dim)",textTransform:"uppercase",whiteSpace:"nowrap",alignSelf:"center"}}>{label}</span>
      <div style={{width:1,background:"var(--line2)",alignSelf:"stretch",margin:"0 4px",flexShrink:0}}/>
      {children}
    </div>
  );
}

function ColorDots({ activeKey, customHex, onSelect, onCustom, panelId }) {
  return (
    <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",maxWidth:220,justifyContent:"center"}}>
      {COLOR_DOTS.map(([key,[c]]) => (
        <div key={key} onClick={()=>onSelect(key)}
          style={{
            width:14,height:14,borderRadius:"50%",background:c,flexShrink:0,
            border: activeKey===key?"2px solid var(--bright)":"2px solid transparent",
            cursor:"pointer",transition:"all .15s",
            transform: activeKey===key?"scale(1.35)":"scale(1)",
          }}
          title={key}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.3)"}
          onMouseLeave={e=>e.currentTarget.style.transform=activeKey===key?"scale(1.35)":"scale(1)"}
        />
      ))}
      <div style={{width:1,background:"var(--line2)",alignSelf:"stretch",margin:"0 2px"}}/>
      <input type="color" value={customHex} onChange={e=>onCustom(e.target.value)}
        style={{width:22,height:22,borderRadius:0,border:"2px solid var(--line2)",padding:0,cursor:"pointer",background:"none",overflow:"hidden"}}/>
    </div>
  );
}

// ── WORLD CLOCKS ─────────────────────────────────────────────────────
const WORLD_TZS = [
  {city:"New York",tz:"America/New_York"},{city:"London",tz:"Europe/London"},
  {city:"Paris",tz:"Europe/Paris"},{city:"Dubai",tz:"Asia/Dubai"},
  {city:"Tokyo",tz:"Asia/Tokyo"},{city:"Sydney",tz:"Australia/Sydney"},
];
const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── CLOCK PANEL ──────────────────────────────────────────────────────
function ClockPanel({ styleId, accent, accent2, T, onFullscreen }) {
  const [opt24h,   setOpt24h]   = useState(true);
  const [optSec,   setOptSec]   = useState(false);
  const [optMs,    setOptMs]    = useState(false);
  const [optAnal,  setOptAnal]  = useState(false);
  const [optWorld, setOptWorld] = useState(false);
  const [time,     setTime]     = useState({str:"00:00",ms:".000"});
  const [dateStr,  setDateStr]  = useState("");
  const [tzStr,    setTzStr]    = useState("");
  const [world,    setWorld]    = useState([]);
  const [hdr,      setHdr]      = useState("");

  useEffect(()=>{
    const tick=()=>{
      const now=new Date();
      const h=opt24h?now.getHours():(now.getHours()%12||12);
      const ap=opt24h?"":(now.getHours()<12?" AM":" PM");
      const str=pad(h)+":"+pad(now.getMinutes())+(optSec?":"+pad(now.getSeconds()):"")+ap;
      setTime({str,ms:"."+pad(now.getMilliseconds(),3)});
      setDateStr(`${DAYS[now.getDay()]}  ·  ${MONTHS[now.getMonth()]} ${pad(now.getDate())}  ·  ${now.getFullYear()}`);
      setTzStr(Intl.DateTimeFormat().resolvedOptions().timeZone);
      setHdr(pad(now.getHours())+":"+pad(now.getMinutes())+":"+pad(now.getSeconds()));
      if(optWorld) setWorld(WORLD_TZS.map(z=>({
        city:z.city,
        t:now.toLocaleTimeString("en-GB",{timeZone:z.tz,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}),
        d:now.toLocaleDateString("en-GB",{timeZone:z.tz,month:"short",day:"numeric"}),
      })));
    };
    const iv=setInterval(tick,46); tick();
    return ()=>clearInterval(iv);
  },[opt24h,optSec,optWorld]);

  const opts=[
    ["24H",opt24h,()=>setOpt24h(v=>!v)],
    ["SECONDS",optSec,()=>setOptSec(v=>!v)],
    ["MS",optMs,()=>setOptMs(v=>!v)],
    ["ANALOG",optAnal,()=>setOptAnal(v=>!v)],
    ["WORLD",optWorld,()=>setOptWorld(v=>!v)],
  ];

  return (
    <div className="panel-content">
      <button className="fsbtn" onClick={onFullscreen}>
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 6V1h5M10 1h5v5M15 10v5h-5M6 15H1v-5"/></svg>
        FULLSCREEN
      </button>

      {optAnal
        ? <AnalogClock T={T} accentHex={accent}/>
        : <Digits value={time.str} millis={optMs?time.ms:null} label="LIVE"
            styleId={styleId} accentHex={accent} accent2Hex={accent2} T={T}/>
      }

      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:DISPLAY,fontSize:11,fontWeight:700,letterSpacing:".14em",color:"var(--soft)",textTransform:"uppercase"}}>{dateStr}</div>
        <div style={{fontFamily:MONO,fontSize:10,color:"var(--dim)",letterSpacing:".1em",marginTop:4}}>{tzStr}</div>
      </div>

      {optWorld && world.length>0 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:7,justifyContent:"center",maxWidth:720}}>
          {world.map(z=>(
            <div key={z.city} style={{background:"var(--bg2)",border:"1px solid var(--line2)",borderRadius:0,padding:"8px 14px",minWidth:120,textAlign:"center"}}>
              <div style={{fontFamily:DISPLAY,fontSize:9,fontWeight:800,letterSpacing:".1em",color:"var(--muted)",textTransform:"uppercase"}}>{z.city}</div>
              <div style={{fontFamily:MONO,fontSize:18,color:"var(--bright)",marginTop:2}}>{z.t}</div>
              <div style={{fontFamily:MONO,fontSize:10,color:"var(--dim)",marginTop:1}}>{z.d}</div>
            </div>
          ))}
        </div>
      )}

      <PickerBox label="OPTIONS">
        {opts.map(([l,a,fn])=>(
          <Chip key={l} label={l} active={a} onClick={fn} accent={accent}/>
        ))}
      </PickerBox>
    </div>
  );
}

// ── STOPWATCH PANEL ───────────────────────────────────────────────────
function StopwatchPanel({ styleId, accent, accent2, T, onFullscreen }) {
  const [running, setRunning]   = useState(false);
  const [label,   setLabel]     = useState("READY");
  const [disp,    setDisp]      = useState({main:"00:00",ms:".000"});
  const [laps,    setLaps]      = useState([]);
  const startRef=useRef(0), elapRef=useRef(0), baseRef=useRef(0), ivRef=useRef(null);

  const tick=useCallback(()=>{
    const e=performance.now()-startRef.current; elapRef.current=e;
    const h=Math.floor(e/3600000),m=Math.floor(e/60000)%60,s=Math.floor(e/1000)%60,ms=Math.floor(e%1000);
    setDisp({main:h?`${pad(h)}:${pad(m)}:${pad(s)}`:`${pad(m)}:${pad(s)}`,ms:"."+pad(ms,3)});
  },[]);

  const toggle=()=>{
    if(!running){
      startRef.current=performance.now()-elapRef.current;
      ivRef.current=setInterval(tick,20); setRunning(true); setLabel("RUNNING");
    } else {
      clearInterval(ivRef.current); elapRef.current=performance.now()-startRef.current;
      setRunning(false); setLabel("PAUSED");
    }
  };

  const lap=()=>{
    const split=elapRef.current-baseRef.current; baseRef.current=elapRef.current;
    setLaps(p=>[...p,{total:elapRef.current,split}]);
  };

  const reset=()=>{
    clearInterval(ivRef.current); elapRef.current=0; baseRef.current=0;
    setRunning(false); setLaps([]); setLabel("READY");
    setDisp({main:"00:00",ms:".000"});
  };

  useEffect(()=>()=>clearInterval(ivRef.current),[]);

  const fmt=ms=>{const s=Math.floor(ms/1000)%60,m=Math.floor(ms/60000)%60,h=Math.floor(ms/3600000),ml=Math.floor(ms%1000);return(h?pad(h)+":":"")+pad(m)+":"+pad(s)+"."+pad(ml,3);};
  const splits=laps.map(l=>l.split), mn=Math.min(...splits), mx=Math.max(...splits);

  return (
    <div className="panel-content">
      <button className="fsbtn" onClick={onFullscreen}>
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 6V1h5M10 1h5v5M15 10v5h-5M6 15H1v-5"/></svg>
        FULLSCREEN
      </button>

      <Digits value={disp.main} millis={disp.ms} label={label}
        styleId={styleId} accentHex={accent} accent2Hex={accent2} T={T}/>

      <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
        <Btn onClick={toggle} variant="go">
          {running
            ? <><svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="4" height="12" rx="1"/><rect x="9" y="2" width="4" height="12" rx="1"/></svg>PAUSE</>
            : <><svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M4 3l9 5-9 5V3z"/></svg>{elapRef.current>0?"RESUME":"START"}</>
          }
        </Btn>
        <Btn onClick={lap} variant="sec" disabled={!running}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="8" cy="9" r="5.5"/><path d="M8 3.5V2M6 2h4"/><line x1="8" y1="6.5" x2="8" y2="9"/><line x1="4" y1="13.5" x2="12" y2="13.5"/></svg>
          LAP
        </Btn>
        <Btn onClick={reset} variant="del" disabled={laps.length===0&&!running&&elapRef.current===0}>
          RESET
        </Btn>
      </div>

      {laps.length>0&&(
        <div style={{width:"100%",maxWidth:460,maxHeight:185,overflowY:"auto",background:"var(--bg2)",border:"1px solid var(--line)",borderRadius:0}}>
          {[...laps].reverse().map((l,ri)=>{
            const i=laps.length-ri;
            const fast=laps.length>1&&l.split===mn, slow=laps.length>1&&l.split===mx;
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 13px",borderBottom:"1px solid var(--line)",fontFamily:MONO,fontSize:12,animation:"lapIn .2s ease"}}>
                <span style={{color:"var(--muted)",fontSize:10,width:22,textAlign:"right",flexShrink:0}}>{i}</span>
                <span style={{flex:1,color:"var(--bright)"}}>{fmt(l.split)}</span>
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:0,
                  background:fast?"rgba(34,197,94,.1)":slow?"rgba(239,68,68,.1)":"transparent",
                  color:fast?"#4ade80":slow?"#f87171":"var(--muted)"}}>
                  {fmt(l.total)}{fast?" ▲":slow?" ▼":""}
                </span>
              </div>
            );
          })}
        </div>
      )}
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
      const T2=ac.currentTime+t;
      g.gain.setValueAtTime(0,T2);g.gain.linearRampToValueAtTime(.18,T2+.04);g.gain.exponentialRampToValueAtTime(.001,T2+.29);
      o.start(T2);o.stop(T2+.3);
    });
  }catch(e){}
}

// ── TIMER PANEL ───────────────────────────────────────────────────────
function TimerPanel({ styleId, accent, accent2, T, onFullscreen, onToast }) {
  const [hh,setHh]=useState(0), [mm,setMm]=useState(5), [ss,setSs]=useState(0);
  const [running,setRunning]=useState(false);
  const [done,setDone]=useState(false);
  const [label,setLabel]=useState("SET TIME");
  const [disp,setDisp]=useState({main:"05:00",ms:".0"});
  const totRef=useRef(300000), remRef=useRef(300000), startRef=useRef(0), ivRef=useRef(null);

  const dispUpd=ms=>{
    const s=Math.floor(ms/1000)%60,m=Math.floor(ms/60000)%60,h=Math.floor(ms/3600000);
    setDisp({main:h?`${pad(h)}:${pad(m)}:${pad(s)}`:`${pad(m)}:${pad(s)}`,ms:"."+Math.floor((ms%1000)/100)});
  };

  const timerTick=useCallback(()=>{
    const rem=Math.max(0,totRef.current-(performance.now()-startRef.current));
    remRef.current=rem; dispUpd(rem);
    if(rem<=0){
      clearInterval(ivRef.current); setRunning(false); setDone(true); setLabel("TIME'S UP!");
      playAlarm(); onToast("⏲ Timer done!");
    }
  },[]);

  const toggle=()=>{
    if(done){timerReset();return;}
    if(!running){
      if(remRef.current<=0)return;
      startRef.current=performance.now()-(totRef.current-remRef.current);
      ivRef.current=setInterval(timerTick,46); setRunning(true); setLabel("RUNNING");
    } else {
      clearInterval(ivRef.current); remRef.current=totRef.current-(performance.now()-startRef.current);
      setRunning(false); setLabel("PAUSED");
    }
  };

  const timerReset=()=>{
    clearInterval(ivRef.current); remRef.current=totRef.current;
    setRunning(false); setDone(false); setLabel("SET TIME"); dispUpd(totRef.current);
  };

  const preset=(h,m,s)=>{
    const t=(h*3600+m*60+s)*1000; totRef.current=t; remRef.current=t;
    setHh(h);setMm(m);setSs(s); setDone(false); setLabel("SET TIME"); dispUpd(t);
    clearInterval(ivRef.current);
    startRef.current=performance.now();
    ivRef.current=setInterval(timerTick,46); setRunning(true); setLabel("RUNNING");
  };

  const inputChange=(fh,fm,fs)=>{
    if(running)return;
    const t=(fh*3600+fm*60+fs)*1000; totRef.current=t; remRef.current=t;
    setDone(false); setLabel("SET TIME"); dispUpd(t);
  };

  useEffect(()=>()=>clearInterval(ivRef.current),[]);

  const PRESETS=[[1,0,0,"1 HR"],[0,45,0,"45 MIN"],[0,30,0,"30 MIN"],[0,25,0,"🍅 25"],[0,15,0,"15 MIN"],[0,10,0,"10 MIN"],[0,5,0,"5 MIN"],[0,1,0,"1 MIN"],[0,0,30,"30 SEC"],[0,0,10,"10 SEC"]];

  const numField=(val,setFn,max,key)=>(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
      <input type="number" value={val} min={0} max={max}
        onChange={e=>{const v=Math.min(max,Math.max(0,parseInt(e.target.value)||0));setFn(v);
          const nxt={h:hh,m:mm,s:ss,[key]:v};inputChange(nxt.h,nxt.m,nxt.s);}}
        disabled={running}
        style={{width:70,textAlign:"center",background:"var(--bg)",border:"1px solid var(--line2)",borderRadius:0,
          color:"var(--bright)",fontFamily:"'Orbitron',monospace",fontSize:38,fontWeight:700,
          letterSpacing:".06em",padding:"6px 4px 3px",outline:"none",
          MozAppearance:"textfield",appearance:"textfield",opacity:running?.5:1,transition:"opacity .2s"}}
        onFocus={e=>{e.target.style.borderColor=accent;e.target.style.boxShadow=`0 0 0 3px ${hexToRgba(accent,.14)}`;}}
        onBlur={e=>{e.target.style.borderColor="var(--line2)";e.target.style.boxShadow="none";}}
      />
      <span style={{fontFamily:DISPLAY,fontSize:9,fontWeight:800,letterSpacing:".14em",color:"var(--muted)",textTransform:"uppercase"}}>{key.toUpperCase()}H</span>
    </div>
  );

  return (
    <div className="panel-content">
      <button className="fsbtn" onClick={onFullscreen}>
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 6V1h5M10 1h5v5M15 10v5h-5M6 15H1v-5"/></svg>
        FULLSCREEN
      </button>

      <Digits value={disp.main} millis={disp.ms} label={label}
        styleId={styleId} accentHex={accent} accent2Hex={accent2} isDone={done} T={T}/>

      <div style={{display:"flex",alignItems:"center",gap:8,background:"var(--bg2)",border:"1px solid var(--line2)",borderRadius:0,padding:"12px 18px",opacity:running?.4:1,pointerEvents:running?"none":"auto",transition:"opacity .2s"}}>
        {numField(hh,setHh,99,"h")}
        <span style={{fontFamily:"'Orbitron',monospace",fontSize:32,fontWeight:900,color:"var(--dim)",marginTop:-14,flexShrink:0}}>:</span>
        {numField(mm,setMm,59,"m")}
        <span style={{fontFamily:"'Orbitron',monospace",fontSize:32,fontWeight:900,color:"var(--dim)",marginTop:-14,flexShrink:0}}>:</span>
        {numField(ss,setSs,59,"s")}
      </div>

      <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center",maxWidth:540}}>
        {PRESETS.map(([h,m,s,l])=>(
          <button key={l} onClick={()=>preset(h,m,s)}
            style={{padding:"4px 11px",borderRadius:0,border:"1px solid var(--line2)",background:"transparent",color:"var(--muted)",fontFamily:MONO,fontSize:11,cursor:"pointer",transition:"all .15s"}}
            onMouseEnter={e=>{e.target.style.borderColor=accent;e.target.style.color=accent;e.target.style.background=hexToRgba(accent,.1);}}
            onMouseLeave={e=>{e.target.style.borderColor="var(--line2)";e.target.style.color="var(--muted)";e.target.style.background="transparent";}}
          >{l}</button>
        ))}
      </div>

      <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
        <Btn onClick={toggle} variant="go">
          {done
            ? "↺ RESET"
            : running
              ? <><svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="4" height="12" rx="1"/><rect x="9" y="2" width="4" height="12" rx="1"/></svg>PAUSE</>
              : <><svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M4 3l9 5-9 5V3z"/></svg>START</>
          }
        </Btn>
        <Btn onClick={timerReset} variant="del" disabled={!running&&!done&&remRef.current===totRef.current}>
          RESET
        </Btn>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────
export default function TimeKitEnterprise() {
  const [dark,    setDark]    = useState(true);
  const [tab,     setTab]     = useState("clock");
  const [bgMode,  setBgMode]  = useState("mesh");
  const [styleId, setStyleId] = useState("solid");         // default: Barlow Condensed SOLID
  const [colKey,  setColKey]  = useState("white");         // B&W default
  const [customHex, setCustomHex] = useState("#D0D0D0");
  const [isCustom, setIsCustom]   = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [hdrTime, setHdrTime] = useState("");

  const T = dark ? DARK : LIGHT;

  // Resolve accent colors
  const [accent, accent2] = isCustom
    ? [customHex, lightenHex(customHex,.22)]
    : (COL_MAP[colKey] || COL_MAP.white);

  // BG canvas (only in non-fullscreen; canvas is still fixed)
  const canvasRef = useBgCanvas(bgMode, dark, accent);

  // CSS vars pushed to :root for components that use var()
  useEffect(()=>{
    const r=document.documentElement.style;
    r.setProperty("--accent",accent);
    r.setProperty("--accent2",accent2);
    r.setProperty("--accentG",hexToRgba(accent,.14));
    r.setProperty("--accentB",hexToRgba(accent,.38));
    r.setProperty("--bg",T.bg); r.setProperty("--bg2",T.bg2);
    r.setProperty("--bg3",T.bg3); r.setProperty("--bg4",T.bg4);
    r.setProperty("--line",T.line); r.setProperty("--line2",T.line2);
    r.setProperty("--dim",T.dim); r.setProperty("--muted",T.muted);
    r.setProperty("--soft",T.soft); r.setProperty("--body",T.body);
    r.setProperty("--bright",T.bright); r.setProperty("--sub",T.sub);
  },[accent,accent2,T]);

  // Header clock
  useEffect(()=>{
    const iv=setInterval(()=>{
      const n=new Date();
      setHdrTime(pad(n.getHours())+":"+pad(n.getMinutes())+":"+pad(n.getSeconds()));
    },1000);
    return ()=>clearInterval(iv);
  },[]);

  // Keyboard shortcuts
  useEffect(()=>{
    const kd=e=>{
      if(["INPUT","TEXTAREA"].includes(e.target.tagName)) return;
      if(e.key.toLowerCase()==="t") setDark(d=>!d);
      if(e.key.toLowerCase()==="f") setFullscreen(v=>!v);
    };
    window.addEventListener("keydown",kd);
    return ()=>window.removeEventListener("keydown",kd);
  },[]);

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),2500);};

  const handleColor=(key)=>{ setColKey(key); setIsCustom(false); };
  const handleCustom=(hex)=>{ setCustomHex(hex); setIsCustom(true); };
  const handleFullscreen=()=>{ setFullscreen(v=>!v); };

  const TABS=[
    {id:"clock",label:"CLOCK",icon:<svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5v4l2.5 1.5"/></svg>},
    {id:"sw",   label:"STOPWATCH",icon:<svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="8" cy="9" r="5.5"/><path d="M8 3.5V2M6 2h4"/><path d="M8 6.5v3"/></svg>},
    {id:"timer",label:"TIMER",icon:<svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="8" cy="9" r="5.5"/><path d="M8 6v3"/><path d="M6 1h4M8 1v1.5"/></svg>},
  ];

  const BG_OPTS=[["mesh","◉ MESH"],["float","✦ FLOAT"],["waves","∿ WAVES"],["grid","⊞ GRID"],["aurora","⬡ AURORA"],["rain","│ RAIN"],["none","✕ NONE"]];

  const panelProps={ styleId, accent, accent2, T, onFullscreen:handleFullscreen };

  return (
    <div style={{fontFamily:BODY,background:T.bg,color:T.body,display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden",position:"relative"}}>
      <link href={FONTS_URL} rel="stylesheet"/>

      {/* BG CANVAS */}
      <canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",opacity:dark?1:.28,transition:"opacity .3s"}}/>

      {/* ── HEADER ── */}
      <header style={{position:"relative",zIndex:30,height:50,display:"flex",alignItems:"center",gap:10,padding:"0 18px",
        background:dark?"rgba(10,10,10,.92)":"rgba(244,244,246,.93)",
        borderBottom:`1px solid ${T.line2}`,backdropFilter:"blur(24px)",flexShrink:0,transition:"background .3s"}}>
        {/* Logo — square, no radius */}
        <div style={{width:30,height:30,borderRadius:0,background:accent,display:"grid",placeItems:"center",flexShrink:0}}>
          <span style={{fontFamily:DISPLAY,fontSize:10,fontWeight:900,color:dark?"#050505":"#fff",letterSpacing:".05em"}}>TK</span>
        </div>
        <span style={{fontFamily:DISPLAY,fontSize:13,fontWeight:900,color:T.bright,letterSpacing:".12em"}}>TIMEKIT</span>
        <div style={{fontFamily:MONO,fontSize:11,color:T.muted,display:"flex",alignItems:"center",gap:4,marginLeft:8}}>
          <span>DevPocketHub</span>
          <span style={{color:T.dim,margin:"0 2px"}}>/</span>
          <span style={{color:accent}}>TimeKit</span>
        </div>
        <div style={{flex:1}}/>
        <span style={{fontFamily:MONO,fontSize:11,color:T.sub,letterSpacing:".1em"}}>{hdrTime}</span>
        <button onClick={()=>setDark(d=>!d)} title="Toggle theme (T)"
          style={{width:30,height:30,borderRadius:0,border:`1px solid ${T.line2}`,background:"transparent",
            color:T.muted,cursor:"pointer",display:"grid",placeItems:"center",fontSize:14,transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background=T.bg3;e.currentTarget.style.color=T.bright;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.muted;}}>
          {dark?"☀":"🌙"}
        </button>
      </header>

      {/* ── TABS ── */}
      <nav style={{position:"relative",zIndex:30,display:"flex",
        background:dark?"rgba(10,10,10,.92)":"rgba(244,244,246,.93)",
        borderBottom:`1px solid ${T.line}`,flexShrink:0,backdropFilter:"blur(20px)",overflowX:"auto",transition:"background .3s"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:7,padding:"11px 22px",border:"none",background:"transparent",
              cursor:"pointer",transition:"all .2s",fontFamily:DISPLAY,fontSize:10,fontWeight:800,letterSpacing:".14em",
              color:tab===t.id?T.bright:T.muted,
              borderBottom:tab===t.id?`2px solid ${accent}`:"2px solid transparent",
              marginBottom:-1,whiteSpace:"nowrap"}}
            onMouseEnter={e=>{if(tab!==t.id)e.currentTarget.style.color=T.body;}}
            onMouseLeave={e=>{if(tab!==t.id)e.currentTarget.style.color=T.muted;}}>
            {t.icon}{t.label}
          </button>
        ))}
      </nav>

      {/* ── PANEL ── */}
      <main style={{flex:1,position:"relative",zIndex:1,overflow:"hidden",minHeight:0}}>
        {/* Fullscreen overlay */}
        {fullscreen && (
          <div style={{position:"fixed",inset:0,zIndex:1000,background:T.bg,display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",gap:14}}>
            <button onClick={()=>setFullscreen(false)}
              style={{position:"absolute",top:16,right:16,padding:"5px 14px",border:`1px solid ${T.line2}`,
                borderRadius:0,background:dark?"rgba(10,10,10,.72)":"rgba(244,244,246,.72)",
                color:T.muted,fontFamily:MONO,fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",gap:6,letterSpacing:".08em"}}>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 1H1v5M10 1h5v5M15 10v5h-5M1 10v5h5"/></svg>
              EXIT
            </button>
            <div style={{fontSize:"clamp(92px,17vw,220px)",lineHeight:1}}>
              {tab==="clock" && <ClockPanelFS styleId={styleId} accent={accent} accent2={accent2} T={T}/>}
              {tab==="sw"    && <SWDispFS styleId={styleId} accent={accent} accent2={accent2} T={T}/>}
              {tab==="timer" && <TimerDispFS styleId={styleId} accent={accent} accent2={accent2} T={T}/>}
            </div>
          </div>
        )}

        <div style={{height:"100%",overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center"}}>
          {/* Active panel */}
          <div style={{width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:"18px 16px"}}>
            {tab==="clock" && <ClockPanel {...panelProps}/>}
            {tab==="sw"    && <StopwatchPanel {...panelProps}/>}
            {tab==="timer" && <TimerPanel {...panelProps} onToast={showToast}/>}

            {/* STYLE PICKER */}
            <PickerBox label="STYLE">
              {FONT_STYLES.map(fs=>(
                <Chip key={fs.id} label={fs.label} active={styleId===fs.id} onClick={()=>setStyleId(fs.id)} accent={accent}/>
              ))}
              <div style={{width:1,background:"var(--line2)",alignSelf:"stretch",margin:"0 4px",flexShrink:0}}/>
              <ColorDots activeKey={isCustom?"__custom__":colKey} customHex={isCustom?customHex:(COL_MAP[colKey]?.[0]||"#D0D0D0")}
                onSelect={handleColor} onCustom={handleCustom}/>
            </PickerBox>

            {/* BG PICKER */}
            <PickerBox label="BG">
              {BG_OPTS.map(([id,lbl])=>(
                <Chip key={id} label={lbl} active={bgMode===id} onClick={()=>setBgMode(id)} accent={accent}/>
              ))}
            </PickerBox>
          </div>
        </div>
      </main>

      {/* TOAST */}
      {toast && (
        <div style={{position:"fixed",bottom:18,left:"50%",transform:"translateX(-50%)",
          background:T.bg3,border:`1px solid ${T.line2}`,color:T.body,
          padding:"9px 20px",borderRadius:0,fontFamily:MONO,fontSize:12,
          boxShadow:"0 8px 32px rgba(0,0,0,.6)",zIndex:4000,whiteSpace:"nowrap",
          animation:"toastIn .18s ease"}}>
          {toast}
        </div>
      )}

      {/* GLOBAL STYLES */}
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:var(--line2)}
        ::selection{background:${hexToRgba(accent,.22)}}
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield;appearance:textfield}

        .panel-content{display:flex;flex-direction:column;align-items:center;gap:14px;width:100%;position:relative}
        .fsbtn{position:absolute;top:0;right:0;z-index:30;padding:5px 12px;border:1px solid var(--line2);border-radius:0;
          background:rgba(10,10,10,.72);color:var(--muted);font-family:${MONO};font-size:10px;cursor:pointer;
          transition:all .15s;display:flex;align-items:center;gap:6px;letter-spacing:.08em}
        .fsbtn:hover{background:var(--bg3);color:var(--bright)}

        @keyframes solidPulse{0%,100%{opacity:1}50%{opacity:.85}}
        @keyframes neonPulse{0%,100%{opacity:1}50%{opacity:.72}}
        @keyframes crtFlicker{0%,97%,100%{opacity:1}97.5%{opacity:.88}98%{opacity:1}99%{opacity:.93}}
        @keyframes breathe{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.75;transform:scale(.997)}}
        @keyframes glitch{0%,87%,100%{transform:none;clip-path:none}88%{transform:translate(-4px,1px) skewX(-3deg);clip-path:polygon(0 20%,100% 20%,100% 45%,0 45%)}89%{transform:translate(4px,-2px) skewX(2deg);clip-path:polygon(0 58%,100% 58%,100% 75%,0 75%)}90%{transform:translate(-2px,3px);clip-path:polygon(0 5%,100% 5%,100% 18%,0 18%)}91%{transform:none;clip-path:none}94%{transform:translate(5px,0) skewX(1deg);clip-path:polygon(0 40%,100% 40%,100% 55%,0 55%)}95%{transform:none}}
        @keyframes liquidWave{0%,100%{background-position:0% 50%;transform:skewX(0)}25%{background-position:50% 50%;transform:skewX(-.8deg)}75%{background-position:100% 50%;transform:skewX(.8deg)}}
        @keyframes matrixScan{0%{opacity:1}50%{opacity:.92}}
        @keyframes shimmer{0%{background-position:100% 50%}100%{background-position:-100% 50%}}
        @keyframes outlinePulse{0%,100%{opacity:1;letter-spacing:.08em}50%{opacity:.72;letter-spacing:.12em}}
        @keyframes typeCursor{0%,49%{border-right:3px solid var(--accent)}50%,100%{border-right:3px solid transparent}}
        @keyframes fireDance{0%{transform:skewX(-1deg) scale(1)}33%{transform:skewX(1.5deg) scale(1.003)}66%{transform:skewX(-.7deg) scale(.998)}100%{transform:skewX(1.2deg) scale(1.002)}}
        @keyframes blockShift{0%,100%{text-shadow:4px 4px 0 ${accent2},8px 8px 0 ${hexToRgba(accent,.14)}}50%{text-shadow:6px 6px 0 ${accent2},12px 12px 0 ${hexToRgba(accent,.14)}}}
        @keyframes chakraScan{0%{filter:brightness(1)}49%{filter:brightness(1.15)}50%{filter:brightness(.85)}100%{filter:brightness(1)}}
        @keyframes audioWave{from{text-shadow:0 0 4px ${accent},0 0 12px ${hexToRgba(accent,.14)}}to{text-shadow:0 0 12px ${accent},0 0 32px ${accent}}}
        @keyframes rajPulse{0%,100%{letter-spacing:.15em;opacity:1}50%{letter-spacing:.2em;opacity:.82}}
        @keyframes cleanFade{0%,100%{opacity:1}50%{opacity:.78}}
        @keyframes doneFlash{0%,100%{opacity:1}50%{opacity:.15}}
        @keyframes lapIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes flipIn{0%{transform:rotateX(90deg) scale(.88);opacity:0}60%{transform:rotateX(-8deg) scale(1.01)}100%{transform:rotateX(0) scale(1);opacity:1}}

        @media(max-width:500px){
          nav button{padding:9px 12px!important;font-size:9px!important}
          header{padding:0 10px!important}
        }
      `}</style>
    </div>
  );
}

// ── FULLSCREEN DISPLAY HELPERS ────────────────────────────────────────
function ClockPanelFS({styleId,accent,accent2,T}){
  const [str,setStr]=useState("");
  useEffect(()=>{const iv=setInterval(()=>{const n=new Date();setStr(pad(n.getHours())+":"+pad(n.getMinutes())+":"+pad(n.getSeconds()));},200);return ()=>clearInterval(iv);},[]);
  return <Digits value={str} label="LIVE" styleId={styleId} accentHex={accent} accent2Hex={accent2} T={T}/>;
}
function SWDispFS({styleId,accent,accent2,T}){
  return <Digits value="00:00" millis=".000" label="STOPWATCH" styleId={styleId} accentHex={accent} accent2Hex={accent2} T={T}/>;
}
function TimerDispFS({styleId,accent,accent2,T}){
  return <Digits value="00:00" millis=".0" label="TIMER" styleId={styleId} accentHex={accent} accent2Hex={accent2} T={T}/>;
}
