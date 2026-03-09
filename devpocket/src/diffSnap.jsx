import { useState, useRef, useCallback, useEffect } from "react";
import file from '/file.svg'

/* ─────────────────────────────────────────────
   DIFF ENGINE
───────────────────────────────────────────── */
function computeDiff(a, b) {
  const la = a.split("\n");
  const lb = b.split("\n");
  const m = la.length, n = lb.length;
  // LCS-based diff
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = la[i] === lb[j] ? dp[i+1][j+1] + 1 : Math.max(dp[i+1][j], dp[i][j+1]);

  const result = [];
  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && la[i] === lb[j]) {
      result.push({ type: "same", left: la[i], right: lb[j], lineL: i+1, lineR: j+1 });
      i++; j++;
    } else if (j < n && (i >= m || dp[i][j+1] >= dp[i+1][j])) {
      result.push({ type: "add", left: null, right: lb[j], lineL: null, lineR: j+1 });
      j++;
    } else {
      result.push({ type: "del", left: la[i], right: null, lineL: i+1, lineR: null });
      i++;
    }
  }

  // Pair del+add into mod
  const paired = [];
  let k = 0;
  while (k < result.length) {
    if (k + 1 < result.length && result[k].type === "del" && result[k+1].type === "add") {
      paired.push({ type: "mod", left: result[k].left, right: result[k+1].right, lineL: result[k].lineL, lineR: result[k+1].lineR });
      k += 2;
    } else {
      paired.push(result[k]);
      k++;
    }
  }
  return paired;
}

function charDiff(a, b) {
  if (!a || !b) return { left: a || "", right: b || "" };
  const la = a.split(""), lb = b.split("");
  const m = la.length, n = lb.length;
  const dp = Array.from({ length: m+1 }, () => new Array(n+1).fill(0));
  for (let i = m-1; i >= 0; i--)
    for (let j = n-1; j >= 0; j--)
      dp[i][j] = la[i]===lb[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);
  let i=0,j=0;
  const lParts=[], rParts=[];
  while(i<m||j<n){
    if(i<m&&j<n&&la[i]===lb[j]){ lParts.push({t:"s",v:la[i]}); rParts.push({t:"s",v:lb[j]}); i++;j++; }
    else if(j<n&&(i>=m||dp[i][j+1]>=dp[i+1][j])){ rParts.push({t:"a",v:lb[j]}); j++; }
    else{ lParts.push({t:"d",v:la[i]}); i++; }
  }
  const render=(parts,color)=>parts.map((p,i)=>p.t==="s"?<span key={i}>{p.v}</span>:<mark key={i} style={{background:color,borderRadius:2,padding:"0 1px"}}>{p.v}</mark>);
  return {
    leftJsx: render(lParts,"rgba(239,68,68,.35)"),
    rightJsx: render(rParts,"rgba(34,197,94,.35)")
  };
}

function computeStats(diffs) {
  const added = diffs.filter(d=>d.type==="add").length;
  const deleted = diffs.filter(d=>d.type==="del").length;
  const modified = diffs.filter(d=>d.type==="mod").length;
  const same = diffs.filter(d=>d.type==="same").length;
  const total = diffs.length;
  return { added, deleted, modified, same, total, changed: added+deleted+modified };
}

/* ─────────────────────────────────────────────
   MERGE ENGINE
───────────────────────────────────────────── */
function buildMerge(diffs, resolutions) {
  return diffs.map((d, i) => {
    if (d.type === "same") return d.left;
    if (d.type === "add") return d.right;
    if (d.type === "del") return resolutions[i] === "keep" ? d.left : null;
    if (d.type === "mod") return resolutions[i] === "left" ? d.left : d.right;
    return null;
  }).filter(l => l !== null).join("\n");
}

/* ─────────────────────────────────────────────
   SAMPLE TEXTS
───────────────────────────────────────────── */
const SAMPLES = {
  code: [
`function fetchUser(id) {
  const url = "/api/users/" + id;
  return fetch(url)
    .then(res => res.json())
    .then(data => {
      console.log("User loaded");
      return data;
    })
    .catch(err => {
      console.error(err);
      return null;
    });
}

const MAX_RETRIES = 3;
const TIMEOUT = 5000;`,
`async function fetchUser(id, options = {}) {
  const url = \`/api/v2/users/\${id}\`;
  const { retries = 3, timeout = 5000 } = options;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("fetchUser failed:", err);
    throw err;
  }
}

const MAX_RETRIES = 5;
const TIMEOUT = 8000;
const BASE_URL = "/api/v2";`
  ],
  text: [
`The quick brown fox jumps over the lazy dog.
This is the second line of the document.
It contains some important information.
The weather today is sunny and warm.
We are meeting at 3pm tomorrow.
Please bring your laptop and notebook.
The project deadline is next Friday.`,
`The quick brown fox leaps over the sleeping dog.
This is the second line of the document.
It contains critical and updated information.
The weather today is cloudy with light rain.
We are meeting at 2pm tomorrow.
Please bring your laptop, notebook, and charger.
The project deadline has been moved to next Monday.
Remember to review the pull requests before then.`
  ],
  json: [
`{
  "name": "devpocket",
  "version": "1.0.0",
  "author": "sweathkumar",
  "private": false,
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}`,
`{
  "name": "devpocket",
  "version": "2.1.0",
  "author": "sweathkumar",
  "license": "MIT",
  "private": true,
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "vite": "^6.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}`
  ]
};

/* ─────────────────────────────────────────────
   ICONS (inline SVG)
───────────────────────────────────────────── */
const IC = ({ d, size=16, stroke=1.6, color="currentColor", fill="none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}>
    {typeof d === "string" ? <path d={d}/> : d}
  </svg>
);

const Icons = {
  diff:   <><path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h4"/><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><line x1="12" y1="3" x2="12" y2="21" strokeDasharray="3 2"/></>,
  merge:  <><path d="M18 18l-6-6-6 6"/><path d="M12 12V3"/><path d="M6 6l6 6 6-6"/></>,
  copy:   <><rect x="9" y="9" width="13" height="13" rx="1"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
  check:  <polyline points="20 6 9 17 4 12"/>,
  upload: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  swap:   <><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></>,
  clear:  <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  down:   <polyline points="6 9 12 15 18 9"/>,
  github: <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>,
  spark:  <><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></>,
  eye:    <><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></>,
  info:   <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  stats:  <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  wrap:   <><polyline points="17 10 21 10 21 3"/><path d="M21 3H3"/><polyline points="7 21 3 21 3 14"/><path d="M3 21h18"/></>,
  file:   <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  moon:   <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>,
  sun:    <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
};

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function DiffSnap() {
  const [dark, setDark] = useState(true);
  const [left, setLeft] = useState(SAMPLES.code[0]);
  const [right, setRight] = useState(SAMPLES.code[1]);
  const [activeTab, setActiveTab] = useState("split"); // split | unified | merge
  const [showInline, setShowInline] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [ignoreWS, setIgnoreWS] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [resolutions, setResolutions] = useState({});
  const [copied, setCopied] = useState(false);
  const [sample, setSample] = useState("code");
  const [leftLabel, setLeftLabel] = useState("Original");
  const [rightLabel, setRightLabel] = useState("Modified");
  const leftRef = useRef(); const rightRef = useRef();
  const [hasCompared, setHasCompared] = useState(true);

  const processText = (t) => {
    let r = t;
    if (ignoreWS) r = r.replace(/[ \t]+/g, " ");
    if (ignoreCase) r = r.toLowerCase();
    return r;
  };

  const diffs = hasCompared ? computeDiff(processText(left), processText(right)) : [];
  const stats = computeStats(diffs);
  const mergeOutput = buildMerge(diffs, resolutions);

  const copyResult = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSample = (type) => {
    setSample(type);
    setLeft(SAMPLES[type][0]);
    setRight(SAMPLES[type][1]);
    setResolutions({});
    setHasCompared(true);
  };

  const swapPanels = () => {
    setLeft(right); setRight(left);
    setLeftLabel(rightLabel); setRightLabel(leftLabel);
  };

  const onFileLeft  = (text, name) => { setLeft(text);  if (name) setLeftLabel(name);  setHasCompared(true); setResolutions({}); };
  const onFileRight = (text, name) => { setRight(text); if (name) setRightLabel(name); setHasCompared(true); setResolutions({}); };

  // colors
  const C = dark ? {
    bg: "#090C12", bgDeep: "#060810",
    surface: "#0F1420", surfaceHigh: "#141928",
    border: "#1C2640", borderBright: "#253050",
    text: "#E8EDF8", textSub: "#7B8BA8", textMuted: "#3D4D6A",
    accent: "#4F8EF7", accentGlow: "rgba(79,142,247,.18)",
    add: "#0D2E1A", addBorder: "#166534", addText: "#4ADE80",
    del: "#2D1010", delBorder: "#7F1D1D", delText: "#F87171",
    mod: "#1E1A08", modBorder: "#713F12", modText: "#FACC15",
    same: "transparent",
    hdr: "#090C12",
    glow1: "rgba(79,142,247,.12)", glow2: "rgba(99,102,241,.08)", glow3: "rgba(6,182,212,.06)",
    mergeLeft: "#0D1E35", mergeRight: "#0D2818",
  } : {
    bg: "#F4F6FB", bgDeep: "#EEF1F8",
    surface: "#FFFFFF", surfaceHigh: "#F9FAFB",
    border: "#DDE3EF", borderBright: "#C8D2E8",
    text: "#0D1421", textSub: "#5A6680", textMuted: "#9BA8BF",
    accent: "#2563EB", accentGlow: "rgba(37,99,235,.12)",
    add: "#F0FDF4", addBorder: "#86EFAC", addText: "#166534",
    del: "#FFF1F1", delBorder: "#FCA5A5", delText: "#991B1B",
    mod: "#FFFBEB", modBorder: "#FDE68A", modText: "#92400E",
    same: "transparent",
    hdr: "#FFFFFF",
    glow1: "rgba(37,99,235,.07)", glow2: "rgba(99,102,241,.05)", glow3: "rgba(6,182,212,.04)",
    mergeLeft: "#EFF6FF", mergeRight: "#F0FDF4",
  };

  const monoFont = "'JetBrains Mono','Cascadia Code','Fira Code',monospace";

  // line renderer for split view
  const renderLine = (d, side) => {
    if (side === "left" && d.type === "add") {
      return <div style={{...lineBase(C), background:"transparent", borderLeft:"3px solid transparent"}}><span style={{color:C.textMuted,minWidth:36,display:"inline-block",textAlign:"right",paddingRight:12,userSelect:"none",fontSize:10}}></span><span style={{color:C.textMuted}}>·</span></div>;
    }
    if (side === "right" && d.type === "del") {
      return <div style={{...lineBase(C), background:"transparent", borderLeft:"3px solid transparent"}}><span style={{color:C.textMuted,minWidth:36,display:"inline-block",textAlign:"right",paddingRight:12,userSelect:"none",fontSize:10}}></span><span style={{color:C.textMuted}}>·</span></div>;
    }
    const text = side === "left" ? d.left : d.right;
    const lineNum = side === "left" ? d.lineL : d.lineR;
    const bg = d.type === "add" ? C.add : d.type === "del" ? C.del : d.type === "mod" ? C.mod : C.same;
    const borderColor = d.type === "add" ? C.addBorder : d.type === "del" ? C.delBorder : d.type === "mod" ? C.modBorder : "transparent";
    const textColor = d.type === "add" ? C.addText : d.type === "del" ? C.delText : d.type === "mod" ? C.modText : C.text;
    const symbol = d.type === "add" ? "+" : d.type === "del" ? "−" : d.type === "mod" ? "~" : " ";

    let content;
    if (showInline && d.type === "mod") {
      const cd = charDiff(d.left, d.right);
      content = side === "left" ? cd.leftJsx : cd.rightJsx;
    } else {
      content = text;
    }

    return (
      <div style={{...lineBase(C), background: bg, borderLeft:`3px solid ${borderColor}`}}>
        <span style={{color:C.textMuted, minWidth:36, display:"inline-block", textAlign:"right", paddingRight:12, userSelect:"none", fontSize:10, fontFamily:monoFont}}>{lineNum}</span>
        <span style={{color:textColor, fontFamily:monoFont, fontSize:12.5, whiteSpace: wordWrap?"pre-wrap":"pre", flex:1, lineHeight:1.65}}>{content}</span>
      </div>
    );
  };

  const lineBase = (C) => ({ display:"flex", alignItems:"flex-start", padding:"1px 8px 1px 0", minHeight:24, transition:"background .1s" });

  // Unresolved merge conflicts count
  const unresolvedCount = diffs.filter((d,i) => (d.type==="mod"||d.type==="del") && !resolutions[i]).length;

  return (
    <div style={{fontFamily:"'DM Sans','Plus Jakarta Sans',system-ui,sans-serif", background:C.bg, minHeight:"100vh", color:C.text, position:"relative", overflowX:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>

      {/* ── BACKGROUND ── */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-15%",left:"5%",width:"55vw",height:"55vw",borderRadius:"50%",background:C.glow1,filter:"blur(100px)",animation:"g1 20s ease-in-out infinite alternate"}}/>
        <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"45vw",height:"45vw",borderRadius:"50%",background:C.glow2,filter:"blur(80px)",animation:"g2 26s ease-in-out infinite alternate"}}/>
        <div style={{position:"absolute",top:"50%",right:"25%",width:"25vw",height:"25vw",borderRadius:"50%",background:C.glow3,filter:"blur(60px)",animation:"g3 32s ease-in-out infinite alternate"}}/>
        {/* Grid */}
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity: dark?.028:.018}}>
          <defs><pattern id="g" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0v44" fill="none" stroke={C.text} strokeWidth=".6"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>
        {/* Diagonal accent line */}
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.06}} preserveAspectRatio="none">
          <line x1="0" y1="0" x2="100%" y2="100%" stroke={C.accent} strokeWidth="1"/>
          <line x1="100%" y1="0" x2="0" y2="100%" stroke={C.accent} strokeWidth=".5"/>
        </svg>
      </div>

      {/* ── HEADER ── */}
      <header style={{position:"fixed",width:'100%',top:0,zIndex:100,background:C.hdr+(dark?"E8":"F2"),backdropFilter:"blur(20px)",borderBottom:`1px solid ${C.border}`,padding:"0 32px",height:58,display:"flex",alignItems:"center",gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <img src={file}></img>
          </div>
          <div>
            <span style={{fontWeight:900,fontSize:17,letterSpacing:"-.5px",color:C.text}}>DiffSnap</span>
            <span style={{fontSize:10,color:C.textMuted,marginLeft:6,fontWeight:500}}>v2</span>
          </div>
        </div>

        <nav style={{display:"flex",gap:2,marginLeft:16}}>
          {[["split","Split View"],["unified","Unified"],["merge","Merge"]].map(([v,l])=>(
            <button key={v} onClick={()=>setActiveTab(v)} style={{padding:"5px 14px",border:"none",background:activeTab===v?C.accentGlow:"none",color:activeTab===v?C.accent:C.textSub,borderRadius:6,fontSize:12,fontWeight:activeTab===v?700:500,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
              {l}
              {v==="merge" && unresolvedCount>0 && <span style={{marginLeft:6,background:"#EF4444",color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:700}}>{unresolvedCount}</span>}
            </button>
          ))}
        </nav>

        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
          {/* Sample loader */}
          <div style={{display:"flex",gap:2,padding:"3px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:7}}>
            {[["code","JS"],["json","JSON"],["text","Text"]].map(([s,l])=>(
              <button key={s} onClick={()=>loadSample(s)} style={{padding:"4px 10px",border:"none",borderRadius:5,background:sample===s?C.accent:"none",color:sample===s?"#fff":C.textSub,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{l}</button>
            ))}
          </div>
          <button onClick={()=>setDark(d=>!d)} style={{padding:"6px 10px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.textSub,cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:11,fontFamily:"inherit"}}>
            <IC d={dark?Icons.sun:Icons.moon} size={13} color={C.textSub} stroke={1.8}/>
            {dark?"Light":"Dark"}
          </button>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section style={{position:"relative",zIndex:1,padding:"104px 32px 32px",textAlign:"center",maxWidth:780,margin:"0 auto"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"5px 14px",background:C.accentGlow,border:`1px solid ${C.accent}44`,borderRadius:20,marginBottom:20,fontSize:12,color:C.accent,fontWeight:600}}>
          <IC d={Icons.spark} size={12} color={C.accent} stroke={2} fill={C.accent}/>
          Advanced Diff · Inline Highlighting · Smart Merge
        </div>
        <h1 style={{margin:"0 0 16px",fontSize:"clamp(32px,5vw,54px)",fontWeight:900,letterSpacing:"-1.5px",lineHeight:1.08,color:C.text}}>
          Compare & Merge<br/>
          <span style={{background:`linear-gradient(135deg, ${C.accent}, #6366F1, #06B6D4)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text", color: "transparent"}}>with Precision</span>
        </h1>
        <p style={{margin:"0 auto 24px",fontSize:15,color:C.textSub,maxWidth:520,lineHeight:1.7,fontWeight:400}}>
          Paste text, upload files, or load a sample. Get instant line-by-line diffs with character-level highlighting and a powerful merge editor.
        </p>
        {/* Stats bar */}
        {stats.total > 0 && (
          <div style={{display:"inline-flex",gap:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",boxShadow:`0 4px 24px rgba(0,0,0,.${dark?12:6})`}}>
            {[
              [stats.added, "+", C.addText, C.add, C.addBorder, "Added"],
              [stats.deleted, "−", C.delText, C.del, C.delBorder, "Deleted"],
              [stats.modified, "~", C.modText, C.mod, C.modBorder, "Modified"],
              [stats.same, "=", C.textMuted, C.same, C.border, "Unchanged"],
            ].map(([n,sym,tc,bg,bc,label])=>(
              <div key={label} style={{padding:"10px 20px",background:bg,borderRight:`1px solid ${C.border}`,textAlign:"center",minWidth:80}}>
                <div style={{fontSize:22,fontWeight:900,color:tc,lineHeight:1}}>{sym}{n}</div>
                <div style={{fontSize:10,color:C.textMuted,marginTop:3,fontWeight:500,textTransform:"uppercase",letterSpacing:.6}}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── TOOLBAR ── */}
      <div style={{position:"relative",zIndex:1,padding:"0 32px 16px",maxWidth:1600,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,overflow:"hidden"}}>
            {[
              [showInline, ()=>setShowInline(s=>!s), Icons.eye, "Inline Diff"],
              [wordWrap, ()=>setWordWrap(s=>!s), Icons.wrap, "Word Wrap"],
            ].map(([on,tog,ic,label],i)=>(
              <button key={label} onClick={tog} style={{padding:"6px 12px",border:"none",borderLeft:i>0?`1px solid ${C.border}`:"none",background:on?C.accentGlow:"none",color:on?C.accent:C.textSub,cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:600,fontFamily:"inherit"}}>
                <IC d={ic} size={13} color={on?C.accent:C.textSub} stroke={1.8}/>
                {label}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,overflow:"hidden"}}>
            {[
              [ignoreWS, ()=>setIgnoreWS(s=>!s), "Ignore Whitespace"],
              [ignoreCase, ()=>setIgnoreCase(s=>!s), "Ignore Case"],
            ].map(([on,tog,label],i)=>(
              <button key={label} onClick={tog} style={{padding:"6px 12px",border:"none",borderLeft:i>0?`1px solid ${C.border}`:"none",background:on?C.accentGlow:"none",color:on?C.accent:C.textSub,cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit"}}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={swapPanels} style={{padding:"6px 12px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,color:C.textSub,cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:600,fontFamily:"inherit"}}>
            <IC d={Icons.swap} size={13} color={C.textSub} stroke={1.8}/>
            Swap
          </button>
          <button onClick={()=>{setLeft("");setRight("");setResolutions({});}} style={{padding:"6px 12px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,color:C.textSub,cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:600,fontFamily:"inherit"}}>
            <IC d={Icons.clear} size={13} color={C.textSub} stroke={1.8}/>
            Clear
          </button>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,color:C.textMuted}}>{stats.total} lines · {stats.changed} changed ({Math.round(stats.changed/Math.max(stats.total,1)*100)}%)</span>
          </div>
        </div>
      </div>

      {/* ── MAIN EDITOR AREA ── */}
      <main style={{position:"relative",zIndex:1,padding:"0 32px",maxWidth:1600,margin:"0 auto",paddingBottom:60}}>

        {/* SPLIT VIEW */}
        {activeTab === "split" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {/* Left Panel */}
            <EditorPanel
              label={leftLabel} onLabelChange={setLeftLabel}
              value={left} onChange={v=>{setLeft(v);setHasCompared(true);}}
              onFileLoad={onFileLeft} side="left" C={C} monoFont={monoFont}
              placeholder="Paste original text here…"
              diffs={diffs} showDiff={false} wordWrap={wordWrap}
            />
            {/* Right Panel */}
            <EditorPanel
              label={rightLabel} onLabelChange={setRightLabel}
              value={right} onChange={v=>{setRight(v);setHasCompared(true);}}
              onFileLoad={onFileRight} side="right" C={C} monoFont={monoFont}
              placeholder="Paste modified text here…"
              diffs={diffs} showDiff={false} wordWrap={wordWrap}
            />
            {/* Split diff view */}
            {diffs.length > 0 && (
              <>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",boxShadow:`0 2px 16px rgba(0,0,0,.${dark?12:5})`}}>
                  <PanelHeader label={leftLabel} side="left" C={C} count={stats.deleted+stats.modified} countColor={C.delText} icon={Icons.diff}/>
                  <div style={{overflow:"auto",maxHeight:520}}>
                    {diffs.map((d, i) => <div key={i}>{renderLine(d, "left")}</div>)}
                  </div>
                </div>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",boxShadow:`0 2px 16px rgba(0,0,0,.${dark?12:5})`}}>
                  <PanelHeader label={rightLabel} side="right" C={C} count={stats.added+stats.modified} countColor={C.addText} icon={Icons.diff}/>
                  <div style={{overflow:"auto",maxHeight:520}}>
                    {diffs.map((d, i) => <div key={i}>{renderLine(d, "right")}</div>)}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* UNIFIED VIEW */}
        {activeTab === "unified" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
            <EditorPanel label={leftLabel} onLabelChange={setLeftLabel} value={left} onChange={v=>{setLeft(v);setHasCompared(true);}} onFileLoad={onFileLeft} side="left" C={C} monoFont={monoFont} placeholder="Paste original text here…" wordWrap={wordWrap}/>
            <EditorPanel label={rightLabel} onLabelChange={setRightLabel} value={right} onChange={v=>{setRight(v);setHasCompared(true);}} onFileLoad={onFileRight} side="right" C={C} monoFont={monoFont} placeholder="Paste modified text here…" wordWrap={wordWrap}/>
          </div>
        )}
        {activeTab === "unified" && diffs.length > 0 && (
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",boxShadow:`0 2px 16px rgba(0,0,0,.${dark?12:5})`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:`1px solid ${C.border}`,background:C.surfaceHigh}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <IC d={Icons.diff} size={14} color={C.accent} stroke={1.8}/>
                <span style={{fontSize:12,fontWeight:700,color:C.text}}>Unified Diff</span>
                <span style={{fontSize:11,color:C.textMuted}}>{leftLabel} → {rightLabel}</span>
              </div>
              <button onClick={()=>copyResult(diffs.map(d=>{ const sym=d.type==="add"?"+":d.type==="del"?"−":d.type==="mod"?"~":" "; return `${sym} ${d.type==="add"?d.right:d.left}`; }).join("\n"))} style={{padding:"4px 10px",background:C.accentGlow,border:`1px solid ${C.accent}44`,borderRadius:6,color:C.accent,cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
                <IC d={copied?Icons.check:Icons.copy} size={12} color={C.accent} stroke={2}/>
                {copied?"Copied":"Copy"}
              </button>
            </div>
            <div style={{overflow:"auto",maxHeight:600}}>
              {diffs.map((d, i) => {
                const sym = d.type==="add"?"+":d.type==="del"?"−":d.type==="mod"?"~":" ";
                const bg = d.type==="add"?C.add:d.type==="del"?C.del:d.type==="mod"?C.mod:C.same;
                const bc = d.type==="add"?C.addBorder:d.type==="del"?C.delBorder:d.type==="mod"?C.modBorder:"transparent";
                const tc = d.type==="add"?C.addText:d.type==="del"?C.delText:d.type==="mod"?C.modText:C.text;
                const text = d.type==="add"?d.right:d.left;
                let content = text;
                let content2 = null;
                if (showInline && d.type==="mod") {
                  const cd = charDiff(d.left, d.right);
                  content = <><span style={{color:C.delText,textDecoration:"line-through",marginRight:8}}>−</span>{cd.leftJsx}</>;
                  content2 = <><span style={{color:C.addText,marginRight:8}}>+</span>{cd.rightJsx}</>;
                }
                return (
                  <div key={i}>
                    <div style={{display:"flex",alignItems:"flex-start",padding:"1px 10px 1px 0",background:bg,borderLeft:`3px solid ${bc}`,minHeight:24}}>
                      <span style={{color:C.textMuted,minWidth:32,display:"inline-block",textAlign:"right",paddingRight:8,userSelect:"none",fontSize:10,fontFamily:monoFont,paddingTop:3}}>{d.lineL||""}</span>
                      <span style={{color:C.textMuted,minWidth:20,paddingRight:8,userSelect:"none",fontSize:10,fontFamily:monoFont,paddingTop:3}}>{d.lineR||""}</span>
                      <span style={{color:tc,fontWeight:700,width:14,flexShrink:0,fontFamily:monoFont,fontSize:12,paddingTop:2}}>{sym}</span>
                      <span style={{fontFamily:monoFont,fontSize:12.5,color:tc,whiteSpace:wordWrap?"pre-wrap":"pre",flex:1,lineHeight:1.65,paddingTop:2}}>{d.type==="mod"&&showInline?content:text}</span>
                    </div>
                    {d.type==="mod"&&showInline&&<div style={{display:"flex",alignItems:"flex-start",padding:"1px 10px 1px 0",background:C.add,borderLeft:`3px solid ${C.addBorder}`,minHeight:24}}>
                      <span style={{minWidth:32+20+14,display:"inline-block"}}/>
                      <span style={{fontFamily:monoFont,fontSize:12.5,color:C.addText,whiteSpace:wordWrap?"pre-wrap":"pre",flex:1,lineHeight:1.65,paddingTop:2}}>{content2}</span>
                    </div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MERGE VIEW */}
        {activeTab === "merge" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              <EditorPanel label={leftLabel} onLabelChange={setLeftLabel} value={left} onChange={v=>{setLeft(v);setHasCompared(true);setResolutions({});}} onFileLoad={onFileLeft} side="left" C={C} monoFont={monoFont} placeholder="Paste original…" wordWrap={wordWrap}/>
              <EditorPanel label={rightLabel} onLabelChange={setRightLabel} value={right} onChange={v=>{setRight(v);setHasCompared(true);setResolutions({});}} onFileLoad={onFileRight} side="right" C={C} monoFont={monoFont} placeholder="Paste modified…" wordWrap={wordWrap}/>
            </div>
            {/* Conflict resolver */}
            {diffs.length > 0 && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1.2fr",gap:16}}>
                {/* Conflict list */}
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",boxShadow:`0 2px 16px rgba(0,0,0,.${dark?12:5})`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:`1px solid ${C.border}`,background:C.surfaceHigh}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <IC d={Icons.merge} size={14} color={C.accent} stroke={1.8}/>
                      <span style={{fontSize:12,fontWeight:700,color:C.text}}>Conflict Resolution</span>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>{const r={};diffs.forEach((_,i)=>{if(diffs[i].type==="mod"||diffs[i].type==="del")r[i]="left";});setResolutions(r);}} style={{padding:"3px 9px",background:"transparent",border:`1px solid ${C.delBorder}`,borderRadius:5,color:C.delText,cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"inherit"}}>All Left</button>
                      <button onClick={()=>{const r={};diffs.forEach((_,i)=>{if(diffs[i].type==="mod"||diffs[i].type==="del")r[i]="right";});setResolutions(r);}} style={{padding:"3px 9px",background:"transparent",border:`1px solid ${C.addBorder}`,borderRadius:5,color:C.addText,cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"inherit"}}>All Right</button>
                    </div>
                  </div>
                  <div style={{overflow:"auto",maxHeight:460}}>
                    {diffs.map((d, i) => {
                      if (d.type === "same" || d.type === "add") return null;
                      const resolved = resolutions[i];
                      return (
                        <div key={i} style={{borderBottom:`1px solid ${C.border}`,padding:"10px 14px"}}>
                          <div style={{fontSize:10,color:C.textMuted,marginBottom:6,fontWeight:600,textTransform:"uppercase",letterSpacing:.6}}>{d.type==="mod"?"Modified line":"Deleted line"} #{d.lineL}</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                            <button onClick={()=>setResolutions(r=>({...r,[i]:"left"}))} style={{padding:"6px 10px",background:resolved==="left"?C.del:"transparent",border:`1px solid ${resolved==="left"?C.delBorder:C.border}`,borderRadius:6,color:resolved==="left"?C.delText:C.textSub,cursor:"pointer",textAlign:"left",fontFamily:monoFont,fontSize:11,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",transition:"all .15s"}}>
                              <span style={{fontWeight:700,marginRight:6,color:C.delText}}>←</span>{d.left}
                            </button>
                            {d.type==="mod"?<button onClick={()=>setResolutions(r=>({...r,[i]:"right"}))} style={{padding:"6px 10px",background:resolved==="right"?C.add:"transparent",border:`1px solid ${resolved==="right"?C.addBorder:C.border}`,borderRadius:6,color:resolved==="right"?C.addText:C.textSub,cursor:"pointer",textAlign:"left",fontFamily:monoFont,fontSize:11,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",transition:"all .15s"}}>
                              <span style={{fontWeight:700,marginRight:6,color:C.addText}}>→</span>{d.right}
                            </button>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${C.border}`,borderRadius:6,fontSize:11,color:C.textMuted}}>skip line</div>}
                          </div>
                        </div>
                      );
                    }).filter(Boolean)}
                    {diffs.filter(d=>d.type==="mod"||d.type==="del").length === 0 && (
                      <div style={{padding:32,textAlign:"center",color:C.textMuted,fontSize:13}}>No conflicts — files are identical or only have additions.</div>
                    )}
                  </div>
                  {unresolvedCount > 0 && (
                    <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,background:C.mod,fontSize:11,color:C.modText,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                      <IC d={Icons.info} size={12} color={C.modText} stroke={2}/>
                      {unresolvedCount} unresolved conflict{unresolvedCount>1?"s":""}
                    </div>
                  )}
                </div>
                {/* Merge output */}
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",boxShadow:`0 2px 16px rgba(0,0,0,.${dark?12:5})`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:`1px solid ${C.border}`,background:C.surfaceHigh}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <IC d={Icons.merge} size={14} color={C.accent} stroke={1.8}/>
                      <span style={{fontSize:12,fontWeight:700,color:C.text}}>Merge Result</span>
                      {unresolvedCount===0&&<span style={{fontSize:10,background:C.add,color:C.addText,border:`1px solid ${C.addBorder}`,padding:"2px 7px",borderRadius:10,fontWeight:700}}>Ready</span>}
                    </div>
                    <button onClick={()=>copyResult(mergeOutput)} style={{padding:"5px 12px",background:`linear-gradient(135deg,${C.accent},#6366F1)`,border:"none",borderRadius:6,color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit",display:"flex",alignItems:"center",gap:5,boxShadow:`0 2px 8px ${C.accentGlow}`}}>
                      <IC d={copied?Icons.check:Icons.copy} size={12} color="#fff" stroke={2}/>
                      {copied?"Copied!":"Copy Result"}
                    </button>
                  </div>
                  <textarea
                    value={mergeOutput}
                    readOnly
                    style={{width:"100%",height:460,padding:14,background:C.bgDeep,border:"none",color:C.text,fontFamily:monoFont,fontSize:12.5,lineHeight:1.7,resize:"none",outline:"none",boxSizing:"border-box",whiteSpace:wordWrap?"pre-wrap":"pre"}}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── FEATURES STRIP ── */}
      <section style={{position:"relative",zIndex:1,padding:"48px 32px",borderTop:`1px solid ${C.border}`,background:C.surface+(dark?"80":"60"),backdropFilter:"blur(8px)"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:36}}>
            <h2 style={{margin:"0 0 8px",fontSize:28,fontWeight:900,letterSpacing:"-.6px",color:C.text}}>Everything you need</h2>
            <p style={{margin:0,fontSize:14,color:C.textSub}}>Built for developers, writers, and teams who care about precision.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
            {[
              [Icons.diff,"LCS Diff Engine","Longest Common Subsequence algorithm for accurate line-level diffs"],
              [Icons.spark,"Char-level Highlights","Pinpoint exactly which characters changed within modified lines"],
              [Icons.merge,"Smart Merge Editor","Resolve conflicts visually with one-click accept/reject per line"],
              [Icons.file,"File Upload","Drag and drop or upload any text file directly into either panel"],
              [Icons.stats,"Change Statistics","Live counts of added, deleted, modified and unchanged lines"],
              [Icons.eye,"Unified View","Classic git-style unified diff with inline character comparison"],
            ].map(([ic, title, desc])=>(
              <div key={title} style={{padding:20,background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,transition:"transform .15s,box-shadow .15s",cursor:"default"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 8px 32px ${C.accentGlow}`;}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                <div style={{width:36,height:36,background:C.accentGlow,border:`1px solid ${C.accent}33`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}>
                  <IC d={ic} size={17} color={C.accent} stroke={1.8}/>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:6}}>{title}</div>
                <div style={{fontSize:12,color:C.textSub,lineHeight:1.6}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{position:"relative",zIndex:1,padding:"20px 32px",borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,background:C.hdr+(dark?"80":"A0"),backdropFilter:"blur(12px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:24,height:24,background:`linear-gradient(135deg,${C.accent},#6366F1)`,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <IC d={Icons.diff} size={12} color="#fff" stroke={2}/>
          </div>
          <span style={{fontWeight:800,fontSize:14,color:C.text}}>DiffSnap</span>
          <span style={{fontSize:11,color:C.textMuted}}>— 100% client-side, no data sent to servers</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <span style={{fontSize:12,color:C.textMuted}}>
            Made with <span style={{color:"#F43F5E"}}>♥</span> by{" "}
            <a href="https://sweathkumar.com" target="_blank" rel="noopener noreferrer" style={{color:C.accent,textDecoration:"none",fontWeight:700}}>sweathkumar.com</a>
          </span>
        </div>
      </footer>

      <style>{`
        @keyframes g1{from{transform:translate(0,0)scale(1)}to{transform:translate(4vw,6vh)scale(1.1)}}
        @keyframes g2{from{transform:translate(0,0)scale(1)}to{transform:translate(-5vw,-4vh)scale(1.15)}}
        @keyframes g3{from{transform:translate(0,0)scale(1)}to{transform:translate(3vw,5vh)scale(.95)}}
        @keyframes ring{from{opacity:.4;transform:scale(.97)}to{opacity:.9;transform:scale(1.01)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${C.borderBright};border-radius:3px}
        ::selection{background:${C.accent}33}
        textarea::placeholder{color:${C.textMuted}}
        @media(max-width:768px){
          .diff-grid{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
function PanelHeader({ label, side, C, count, countColor, icon }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderBottom:`1px solid ${C.border}`,background:C.surfaceHigh}}>
      <IC d={icon} size={13} color={C.textMuted} stroke={1.8}/>
      <span style={{fontSize:12,fontWeight:700,color:C.text}}>{label}</span>
      {count > 0 && <span style={{fontSize:10,fontWeight:700,color:countColor,marginLeft:4}}>({count} changes)</span>}
    </div>
  );
}

/* ── FILE DROP ZONE ── */
function FileDropZone({ side, C, onLoad, accent, accentBg, accentBorder }) {
  const [drag, setDrag] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef();

  const ACCEPTED = [".txt",".js",".jsx",".ts",".tsx",".json",".md",".html",".css",".py",".java",".c",".cpp",".go",".rs",".sql",".xml",".yaml",".yml",".sh",".env",".csv",".log",".diff",".patch"];
  const MAX_MB = 2;

  const processFile = (file) => {
    setError("");
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) { setError(`File too large (max ${MAX_MB}MB)`); return; }
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ACCEPTED.includes(ext) && !file.type.startsWith("text/")) {
      setError("Unsupported file type. Use any text-based file."); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileInfo({ name: file.name, size: (file.size / 1024).toFixed(1) + " KB", lines: e.target.result.split("\n").length, type: file.type || ext });
      onLoad(e.target.result, file.name);
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsText(file);
  };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    processFile(e.dataTransfer.files[0]);
  };

  const onPaste = (e) => {
    const text = e.clipboardData.getData("text/plain");
    if (text) { onLoad(text, side === "left" ? "Original" : "Modified"); setFileInfo(null); }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {/* Drop Zone */}
      <div
        onDragOver={e=>{e.preventDefault();setDrag(true);}}
        onDragEnter={e=>{e.preventDefault();setDrag(true);}}
        onDragLeave={e=>{e.preventDefault();setDrag(false);}}
        onDrop={onDrop}
        onClick={()=>inputRef.current.click()}
        style={{
          border: `2px dashed ${drag ? accent : accentBorder}`,
          borderRadius: "10px 10px 0 0",
          padding: "28px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: drag ? accentBg : C.bgDeep,
          transition: "all .2s",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* animated ring when dragging */}
        {drag && <div style={{position:"absolute",inset:0,borderRadius:10,border:`2px solid ${accent}`,animation:"ring .6s ease-in-out infinite alternate",pointerEvents:"none"}}/>}

        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <div style={{width:48,height:48,borderRadius:12,background:accentBg,border:`1.5px solid ${accentBorder}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"transform .2s",transform:drag?"scale(1.15)":"scale(1)"}}>
            <IC d={Icons.upload} size={22} color={accent} stroke={1.8}/>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:drag ? accent : C.text,transition:"color .2s"}}>
              {drag ? "Drop to load file" : "Drop file here"}
            </div>
            <div style={{fontSize:11,color:C.textMuted,marginTop:3}}>or <span style={{color:accent,fontWeight:600}}>click to browse</span> · paste with Ctrl+V</div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:4,maxWidth:320}}>
            {[".txt",".js",".ts",".json",".py",".md",".sql",".yaml","…"].map(ext=>(
              <span key={ext} style={{fontSize:9,fontWeight:600,color:C.textMuted,background:C.surface,border:`1px solid ${C.border}`,padding:"2px 6px",borderRadius:3}}>{ext}</span>
            ))}
          </div>
        </div>
        <input ref={inputRef} type="file" accept={ACCEPTED.join(",")} style={{display:"none"}} onChange={e=>processFile(e.target.files[0])}/>
      </div>

      {/* File info bar */}
      {fileInfo && (
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"7px 14px",background:accentBg,border:`1px solid ${accentBorder}`,borderTop:"none",fontSize:11}}>
          <IC d={Icons.file} size={13} color={accent} stroke={1.8}/>
          <span style={{fontWeight:700,color:accent,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fileInfo.name}</span>
          <span style={{color:C.textMuted}}>{fileInfo.size}</span>
          <span style={{color:C.textMuted}}>·</span>
          <span style={{color:C.textMuted}}>{fileInfo.lines} lines</span>
          <button onClick={e=>{e.stopPropagation();setFileInfo(null);onLoad("", side==="left"?"Original":"Modified");}}
            style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",padding:"2px",display:"flex",borderRadius:4,lineHeight:1}}>
            <IC d={Icons.clear} size={13} color={C.textMuted} stroke={2}/>
          </button>
        </div>
      )}
      {error && (
        <div style={{padding:"7px 14px",background:"rgba(239,68,68,.1)",border:`1px solid rgba(239,68,68,.3)`,borderTop:"none",fontSize:11,color:"#F87171",display:"flex",alignItems:"center",gap:6}}>
          <IC d={Icons.info} size={12} color="#F87171" stroke={2}/>
          {error}
        </div>
      )}
    </div>
  );
}

/* ── EDITOR PANEL (textarea + drop zone stacked) ── */
function EditorPanel({ label, onLabelChange, value, onChange, onFileLoad, side, C, monoFont, placeholder, wordWrap }) {
  const accent      = side === "left" ? C.delText    : C.addText;
  const accentBg    = side === "left" ? C.del        : C.add;
  const accentBorder= side === "left" ? C.delBorder  : C.addBorder;

  return (
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",boxShadow:`0 2px 12px rgba(0,0,0,.07)`}}>
      {/* Panel header */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderBottom:`1px solid ${C.border}`,background:C.surfaceHigh}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:accent,flexShrink:0}}/>
        <input
          value={label} onChange={e=>onLabelChange(e.target.value)}
          style={{flex:1,background:"none",border:"none",outline:"none",fontSize:12,fontWeight:700,color:C.text,fontFamily:"inherit",cursor:"text"}}
        />
        <span style={{fontSize:10,color:C.textMuted}}>{value ? value.split("\n").length + " lines" : "empty"}</span>
        {value && (
          <button onClick={()=>onChange("")} style={{padding:"2px 7px",background:"none",border:`1px solid ${C.border}`,borderRadius:4,color:C.textMuted,cursor:"pointer",fontSize:10,fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}>
            <IC d={Icons.clear} size={10} color={C.textMuted} stroke={2}/> Clear
          </button>
        )}
      </div>

      {/* Drop zone — only show when empty */}
      {!value && (
        <FileDropZone
          side={side} C={C}
          accent={accent} accentBg={accentBg} accentBorder={accentBorder}
          onLoad={(text, name) => { onChange(text); if (name) onLabelChange(name); }}
        />
      )}

      {/* Textarea — always shown when there's content, or alongside drop zone hint */}
      <textarea
        value={value}
        onChange={e=>onChange(e.target.value)}
        placeholder={value ? "" : "Or type / paste text directly here…"}
        spellCheck={false}
        style={{
          width:"100%",
          height: value ? 220 : 80,
          padding:"12px 14px",
          background: value ? C.bgDeep : C.surface,
          border:"none",
          borderTop: !value ? `1px solid ${C.border}` : "none",
          color:C.text,
          fontFamily:monoFont,
          fontSize:12.5,
          lineHeight:1.7,
          resize:"vertical",
          outline:"none",
          boxSizing:"border-box",
          whiteSpace:wordWrap?"pre-wrap":"pre",
          transition:"height .2s",
        }}
      />
    </div>
  );
}