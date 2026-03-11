import { useState, useRef, useCallback, useMemo, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════
//  CSVSTUDIO — ENTERPRISE EDITION
//  Sharp corners · Black & White · Barlow Condensed
//  Dark + Light mode · Mobile-first responsive
// ═══════════════════════════════════════════════════════════════════

const FONTS_URL = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;800;900&family=Barlow:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
const DISPLAY = "'Barlow Condensed', sans-serif";
const BODY    = "'Barlow', system-ui, sans-serif";
const MONO    = "'JetBrains Mono', monospace";

const DARK = {
  bg:"#0A0A0A", bg2:"#111111", bg3:"#161616", bg4:"#1E1E1E",
  line:"#222222", line2:"#2A2A2A", line3:"#333333",
  muted:"#555555", soft:"#777777", body:"#A0A0A0",
  bright:"#F0F0F0", sub:"#888888",
  green:"#4ade80", greenBg:"rgba(74,222,128,.08)", greenLine:"rgba(74,222,128,.22)",
  red:"#f87171",   redBg:"rgba(248,113,113,.08)",  redLine:"rgba(248,113,113,.22)",
  amber:"#fbbf24", amberBg:"rgba(251,191,36,.08)", amberLine:"rgba(251,191,36,.22)",
  blue:"#93c5fd",  isDark:true,
};
const LIGHT = {
  bg:"#F5F5F5", bg2:"#FFFFFF", bg3:"#EBEBEB", bg4:"#E0E0E0",
  line:"#DCDCDC", line2:"#CECECE", line3:"#BEBEBE",
  muted:"#AAAAAA", soft:"#888888", body:"#444444",
  bright:"#0A0A0A", sub:"#666666",
  green:"#16a34a", greenBg:"rgba(22,163,74,.07)",  greenLine:"rgba(22,163,74,.25)",
  red:"#dc2626",   redBg:"rgba(220,38,38,.06)",    redLine:"rgba(220,38,38,.22)",
  amber:"#d97706", amberBg:"rgba(217,119,6,.07)",  amberLine:"rgba(217,119,6,.22)",
  blue:"#2563eb",  isDark:false,
};

// ── CSV PARSER ───────────────────────────────────────────────────────
function parseCSV(raw, dlm = ",") {
  if (!raw.trim()) return { headers:[], rows:[] };
  const lines = raw.replace(/\r\n/g,"\n").replace(/\r/g,"\n").split("\n");
  const parseRow = (line) => {
    const cells=[]; let cur="", inQ=false;
    for (let i=0; i<line.length; i++) {
      const ch=line[i];
      if (ch==='"') { if(inQ&&line[i+1]==='"'){cur+='"';i++;}else inQ=!inQ; }
      else if (ch===dlm&&!inQ) { cells.push(cur.trim()); cur=""; }
      else cur+=ch;
    }
    cells.push(cur.trim()); return cells;
  };
  const ne = lines.filter(l=>l.trim());
  if (!ne.length) return { headers:[], rows:[] };
  const headers = parseRow(ne[0]).map((h,i)=>h||`col_${i+1}`);
  const rows = ne.slice(1).map(l => {
    const cells=parseRow(l); const obj={};
    headers.forEach((h,i)=>{obj[h]=cells[i]??"";}); return obj;
  });
  return { headers, rows };
}
function serializeCSV(headers, rows, dlm=",") {
  const esc=v=>{const s=String(v??"");return s.includes(dlm)||s.includes('"')||s.includes("\n")?`"${s.replace(/"/g,'""')}"`:`${s}`;};
  return [headers.map(esc).join(dlm),...rows.map(r=>headers.map(h=>esc(r[h]??"")).join(dlm))].join("\n");
}
function serializeJSON(headers, rows) {
  return JSON.stringify(rows.map(r=>{const o={};headers.forEach(h=>{o[h]=r[h]??""});return o;}),null,2);
}

// ── COLUMN STATS ─────────────────────────────────────────────────────
function calcStats(rows, col) {
  const vals=rows.map(r=>r[col]??"");
  const nulls=vals.filter(v=>v===""||v==null).length;
  const nonNull=vals.filter(v=>v!==""&&v!=null);
  const nums=nonNull.map(v=>parseFloat(v)).filter(v=>!isNaN(v));
  const isNumeric=nums.length>nonNull.length*0.7;
  const unique=new Set(vals).size;
  const freq=vals.reduce((a,v)=>{a[v]=(a[v]||0)+1;return a;},{});
  const topVals=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const base={col,total:vals.length,nulls,unique,topVals,isNumeric};
  if (isNumeric&&nums.length>0) {
    const sorted=[...nums].sort((a,b)=>a-b),sum=nums.reduce((a,v)=>a+v,0),mean=sum/nums.length;
    const median=sorted.length%2===0?(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2:sorted[Math.floor(sorted.length/2)];
    const variance=nums.reduce((a,v)=>a+(v-mean)**2,0)/nums.length;
    return{...base,min:sorted[0],max:sorted[sorted.length-1],mean,median,sum,std:Math.sqrt(variance),numCount:nums.length};
  }
  const avgLen=nonNull.length?nonNull.reduce((a,v)=>a+String(v).length,0)/nonNull.length:0;
  return{...base,avgLen};
}

const fmtN=(n,dec=2)=>{
  if(n===undefined||n===null||isNaN(n))return"—";
  if(Math.abs(n)>=1e6)return(n/1e6).toFixed(dec)+"M";
  if(Math.abs(n)>=1e3)return(n/1e3).toFixed(dec)+"K";
  return Number(n).toFixed(dec).replace(/\.?0+$/,"");
};

const SAMPLE_CSV=`id,name,email,department,salary,start_date,status,score
1,Alice Johnson,alice@devpocket.io,Engineering,95000,2021-03-15,active,92
2,Bob Smith,bob@example.com,Marketing,72000,2020-07-01,active,78
3,Carol White,carol@test.com,Engineering,105000,2019-11-20,active,96
4,David Brown,david@devpocket.io,Sales,68000,2022-01-10,inactive,65
5,Eve Davis,eve@example.com,HR,61000,2021-09-05,active,81
6,Frank Miller,frank@test.com,Engineering,112000,2018-04-22,active,98
7,Grace Lee,grace@devpocket.io,Marketing,75000,2023-02-14,active,84
8,Henry Wilson,henry@example.com,Sales,70000,2020-12-01,inactive,72
9,Iris Moore,iris@test.com,HR,63000,2022-06-18,active,79
10,Jack Taylor,jack@devpocket.io,Engineering,98000,2021-08-30,active,91
11,Karen Anderson,karen@example.com,Marketing,78000,2019-05-11,active,87
12,Liam Thomas,liam@test.com,Sales,65000,2023-09-03,active,69
13,Mia Jackson,mia@devpocket.io,Engineering,101000,2020-02-28,active,94
14,Noah White,noah@example.com,HR,59000,2022-11-15,inactive,61
15,Olivia Harris,olivia@test.com,Marketing,82000,2018-08-07,active,90`;

// ── SVG ICON SYSTEM ──────────────────────────────────────────────────
const Ic=({ch,size=14,sw=1.7,fill="none",color="currentColor"})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{display:"block",flexShrink:0}}>{ch}</svg>
);
const CH={
  upload:   <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  search:   <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  sort_a:   <><line x1="12" y1="20" x2="12" y2="4"/><polyline points="6 10 12 4 18 10"/></>,
  sort_d:   <><line x1="12" y1="4" x2="12" y2="20"/><polyline points="18 14 12 20 6 14"/></>,
  sort_n:   <><line x1="12" y1="4" x2="12" y2="20"/><polyline points="6 10 12 4 18 10" opacity=".28"/><polyline points="18 14 12 20 6 14" opacity=".28"/></>,
  stats:    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  replace:  <><path d="M14 3v4a1 1 0 001 1h4"/><path d="M5 12V5a2 2 0 012-2h7l5 5v4"/><path d="M5 20h14M5 16h14"/></>,
  clear:    <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  copy:     <><rect x="9" y="9" width="13" height="13" rx="0"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
  check:    <polyline points="20 6 9 17 4 12"/>,
  info:     <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  moon:     <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>,
  sun:      <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
  table:    <><rect x="3" y="3" width="18" height="18" rx="0"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></>,
  grip:     <><circle cx="9" cy="7" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="17" r="1" fill="currentColor"/><circle cx="15" cy="7" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="17" r="1" fill="currentColor"/></>,
  edit:     <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  add_row:  <><rect x="3" y="3" width="18" height="18" rx="0"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></>,
  del_row:  <><rect x="3" y="3" width="18" height="18" rx="0"/><line x1="8" y1="12" x2="16" y2="12"/></>,
  file:     <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  type:     <><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></>,
  menu:     <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
};

// ── MAIN APP ─────────────────────────────────────────────────────────
export default function CSVStudio() {
  const [dark,setDark]             = useState(true);
  const [raw,setRaw]               = useState(SAMPLE_CSV);
  const [dlm,setDlm]               = useState(",");
  const [headers,setHeaders]       = useState([]);
  const [rows,setRows]             = useState([]);
  const [colOrder,setColOrder]     = useState([]);
  const [sortCol,setSortCol]       = useState(null);
  const [sortDir,setSortDir]       = useState("asc");
  const [filterText,setFilterText] = useState("");
  const [filterCol,setFilterCol]   = useState("__all__");
  const [findVal,setFindVal]       = useState("");
  const [replaceVal,setReplaceVal] = useState("");
  const [replaceCol,setReplaceCol] = useState("__all__");
  const [caseSens,setCaseSens]     = useState(false);
  const [statsCol,setStatsCol]     = useState(null);
  const [panel,setPanel]           = useState("table");
  const [dragging,setDragging]     = useState(false);
  const [fileInfo,setFileInfo]     = useState({name:"sample_employees.csv",size:"0.8 KB"});
  const [fileError,setFileError]   = useState("");
  const [editCell,setEditCell]     = useState(null);
  const [editVal,setEditVal]       = useState("");
  const [copied,setCopied]         = useState(false);
  const [selectedRows,setSelectedRows] = useState(new Set());
  const [page,setPage]             = useState(0);
  const [pageSize,setPageSize]     = useState(50);
  const [dragColIdx,setDragColIdx] = useState(null);
  const [dragOverIdx,setDragOverIdx] = useState(null);
  const [replaceCount,setReplaceCount] = useState(null);
  const [mobileOpen,setMobileOpen] = useState(false);
  const fileRef = useRef();
  const T = dark ? DARK : LIGHT;

  useEffect(()=>{
    const p=parseCSV(raw,dlm);
    setHeaders(p.headers); setRows(p.rows); setColOrder(p.headers);
    setSortCol(null); setFilterText(""); setSelectedRows(new Set()); setPage(0);
  },[raw,dlm]);

  const orderedHeaders=useMemo(()=>
    colOrder.filter(h=>headers.includes(h)).concat(headers.filter(h=>!colOrder.includes(h))),
    [colOrder,headers]);

  const filteredRows=useMemo(()=>{
    let r=[...rows];
    if(filterText){
      const q=caseSens?filterText:filterText.toLowerCase();
      r=r.filter(row=>{
        if(filterCol==="__all__")return Object.values(row).some(v=>(caseSens?String(v):String(v).toLowerCase()).includes(q));
        return(caseSens?String(row[filterCol]??""):String(row[filterCol]??"").toLowerCase()).includes(q);
      });
    }
    if(sortCol){
      r.sort((a,b)=>{
        const av=a[sortCol]??"",bv=b[sortCol]??"";
        const an=parseFloat(av),bn=parseFloat(bv);
        const cmp=!isNaN(an)&&!isNaN(bn)?an-bn:String(av).localeCompare(String(bv));
        return sortDir==="asc"?cmp:-cmp;
      });
    }
    return r;
  },[rows,filterText,filterCol,sortCol,sortDir,caseSens]);

  const pageRows=useMemo(()=>filteredRows.slice(page*pageSize,(page+1)*pageSize),[filteredRows,page,pageSize]);
  const totalPages=Math.ceil(filteredRows.length/pageSize);

  const doSort=col=>{if(sortCol===col)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortCol(col);setSortDir("asc");}};

  const doReplace=()=>{
    if(!findVal)return; let count=0;
    const q=caseSens?findVal:findVal.toLowerCase();
    const newRows=rows.map(row=>{
      const nr={...row},cols=replaceCol==="__all__"?headers:[replaceCol];
      cols.forEach(col=>{
        const v=String(nr[col]??"");
        if(caseSens?v.includes(findVal):v.toLowerCase().includes(q)){
          nr[col]=v.replace(new RegExp(findVal.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),caseSens?"g":"gi"),replaceVal); count++;
        }
      }); return nr;
    });
    setRows(newRows); setReplaceCount(count); setTimeout(()=>setReplaceCount(null),3000);
  };

  const commitEdit=()=>{
    if(!editCell)return;
    setRows(rs=>rs.map((r,i)=>i===editCell.row?{...r,[editCell.col]:editVal}:r));
    setEditCell(null);
  };

  const deleteSelectedRows=()=>{setRows(rs=>rs.filter((_,i)=>!selectedRows.has(i)));setSelectedRows(new Set());};
  const addRow=()=>{const e={};headers.forEach(h=>{e[h]=""});setRows(rs=>[...rs,e]);};
  const toggleSelectRow=i=>setSelectedRows(s=>{const ns=new Set(s);ns.has(i)?ns.delete(i):ns.add(i);return ns;});
  const toggleSelectAll=()=>{
    if(selectedRows.size===pageRows.length)setSelectedRows(new Set());
    else setSelectedRows(new Set(pageRows.map((_,i)=>page*pageSize+i)));
  };

  const exportCSV=()=>{
    const b=new Blob([serializeCSV(orderedHeaders,rows,dlm)],{type:"text/csv"});
    const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=fileInfo?.name||"export.csv";a.click();URL.revokeObjectURL(u);
  };
  const exportJSON=()=>{
    const b=new Blob([serializeJSON(orderedHeaders,rows)],{type:"application/json"});
    const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=(fileInfo?.name||"export").replace(/\.csv$/,"")+".json";a.click();URL.revokeObjectURL(u);
  };
  const copyCSV=()=>{navigator.clipboard.writeText(serializeCSV(orderedHeaders,rows,dlm));setCopied(true);setTimeout(()=>setCopied(false),2000);};

  const processFile=file=>{
    setFileError(""); if(!file)return;
    if(file.size>10*1024*1024){setFileError("File too large (max 10MB)");return;}
    const ext=file.name.split(".").pop().toLowerCase();
    if(!["csv","tsv","txt"].includes(ext)){setFileError("Upload a .csv, .tsv or .txt file");return;}
    const reader=new FileReader();
    reader.onload=e=>{if(ext==="tsv")setDlm("\t");setRaw(e.target.result);setFileInfo({name:file.name,size:(file.size/1024).toFixed(1)+" KB"});};
    reader.readAsText(file);
  };

  const onColDragStart=i=>setDragColIdx(i);
  const onColDragOver=(e,i)=>{e.preventDefault();setDragOverIdx(i);};
  const onColDrop=i=>{
    if(dragColIdx===null||dragColIdx===i){setDragColIdx(null);setDragOverIdx(null);return;}
    const o=[...orderedHeaders];const[m]=o.splice(dragColIdx,1);o.splice(i,0,m);
    setColOrder(o);setDragColIdx(null);setDragOverIdx(null);
  };

  const inferType=col=>{
    const vals=rows.map(r=>r[col]).filter(v=>v!=="");
    if(!vals.length)return"empty";
    const nums=vals.filter(v=>!isNaN(parseFloat(v)));
    if(nums.length>vals.length*0.8)return"number";
    if(vals.every(v=>/^\d{4}-\d{2}-\d{2}/.test(v)))return"date";
    if(vals.every(v=>/^(true|false|yes|no|0|1)$/i.test(v)))return"boolean";
    if(vals.some(v=>v.includes("@")&&v.includes(".")))return"email";
    return"text";
  };

  const currentStats=statsCol?calcStats(rows,statsCol):null;
  const typeCol={number:T.blue,date:T.green,boolean:T.amber,email:T.soft,text:T.muted,empty:T.muted};
  const typeLbl={number:"#",date:"D",boolean:"B",email:"@",text:"T",empty:"—"};

  // ── header button style helper ────────────────────────────────────
  const hdrBtn=(active=false)=>({
    padding:"6px 12px", background:active?T.bright:"transparent",
    border:`1px solid ${active?T.bright:T.line2}`, color:active?T.bg:T.body,
    cursor:"pointer", fontFamily:DISPLAY, fontSize:11, fontWeight:800,
    letterSpacing:".08em", textTransform:"uppercase",
    display:"flex", alignItems:"center", gap:5, transition:"all .14s", flexShrink:0,
  });

  const panelTabs=[
    {id:"table",   label:"TABLE",       icon:CH.table},
    {id:"stats",   label:"STATS",       icon:CH.stats},
    {id:"replace", label:"FIND & REPLACE", icon:CH.replace},
  ];

  // ── cell style ────────────────────────────────────────────────────
  const cellBdr=`1px solid ${T.line}`;

  return (
    <div style={{fontFamily:BODY,background:T.bg,color:T.body,minHeight:"100vh",display:"flex",flexDirection:"column",position:"relative"}}>
      <link href={FONTS_URL} rel="stylesheet"/>

      {/* grid bg */}
      <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0,opacity:dark?.04:.028}}>
        <defs><pattern id="csg" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0v48" fill="none" stroke={T.bright} strokeWidth=".6"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#csg)"/>
      </svg>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header style={{
        position:"sticky",top:0,zIndex:200,height:50,
        display:"flex",alignItems:"center",gap:10,padding:"0 14px",
        background:dark?"rgba(10,10,10,.94)":"rgba(245,245,245,.95)",
        borderBottom:cellBdr,backdropFilter:"blur(20px)",flexShrink:0,
      }}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div style={{width:28,height:28,background:T.bright,display:"grid",placeItems:"center"}}>
            <Ic ch={CH.table} size={14} color={T.bg} sw={2}/>
          </div>
          <span style={{fontFamily:DISPLAY,fontWeight:900,fontSize:16,letterSpacing:".08em",color:T.bright}}>CSVSTUDIO</span>
        </div>

        {/* File pill */}
        {fileInfo&&(
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"3px 9px",background:T.bg3,border:`1px solid ${T.line2}`,fontSize:11,fontFamily:MONO,overflow:"hidden",minWidth:0,flexShrink:1}}>
            <Ic ch={CH.file} size={11} color={T.muted} sw={1.8}/>
            <span style={{color:T.body,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:130}}>{fileInfo.name}</span>
            <span style={{color:T.muted,flexShrink:0}}>{fileInfo.size}</span>
          </div>
        )}

        {/* Row/col pills */}
        <div style={{display:"flex",gap:4,flexShrink:0}}>
          {[[rows.length,"ROWS"],[headers.length,"COLS"]].map(([v,l])=>(
            <div key={l} style={{display:"flex",alignItems:"baseline",gap:3,padding:"2px 7px",background:T.bg3,border:`1px solid ${T.line2}`}}>
              <span style={{fontFamily:MONO,fontWeight:700,fontSize:12,color:T.bright}}>{v}</span>
              <span style={{fontFamily:DISPLAY,fontSize:9,fontWeight:800,letterSpacing:".1em",color:T.muted,textTransform:"uppercase"}}>{l}</span>
            </div>
          ))}
        </div>

        <div style={{flex:1}}/>

        {/* Desktop actions */}
        <div className="csv-hdr-act" style={{display:"flex",alignItems:"center",gap:5}}>
          {[["CSV",exportCSV,CH.download],["JSON",exportJSON,CH.download]].map(([l,fn,ic])=>(
            <button key={l} onClick={fn} style={hdrBtn()}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.bright;e.currentTarget.style.color=T.bright;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.line2;e.currentTarget.style.color=T.body;}}>
              <Ic ch={ic} size={11} color="currentColor" sw={2}/>{l}
            </button>
          ))}
          <button onClick={copyCSV} style={hdrBtn(copied)}
            onMouseEnter={e=>{if(!copied){e.currentTarget.style.borderColor=T.bright;e.currentTarget.style.color=T.bright;}}}
            onMouseLeave={e=>{if(!copied){e.currentTarget.style.borderColor=T.line2;e.currentTarget.style.color=T.body;}}}>
            <Ic ch={copied?CH.check:CH.copy} size={11} color="currentColor" sw={2}/>{copied?"COPIED":"COPY"}
          </button>
          <button onClick={()=>setDark(d=>!d)}
            style={{width:32,height:32,background:"transparent",border:`1px solid ${T.line2}`,color:T.muted,cursor:"pointer",display:"grid",placeItems:"center",transition:"all .14s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.bright;e.currentTarget.style.color=T.bright;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.line2;e.currentTarget.style.color=T.muted;}}>
            <Ic ch={dark?CH.sun:CH.moon} size={14} color="currentColor" sw={1.8}/>
          </button>
        </div>

        {/* Mobile burger */}
        <button onClick={()=>setMobileOpen(m=>!m)} className="csv-burger"
          style={{display:"none",width:32,height:32,background:"transparent",border:`1px solid ${T.line2}`,color:T.muted,cursor:"pointer",placeItems:"center"}}>
          <Ic ch={CH.menu} size={14} color="currentColor" sw={1.8}/>
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen&&(
        <div style={{position:"fixed",top:50,left:0,right:0,zIndex:199,background:T.bg2,borderBottom:cellBdr,padding:12,display:"flex",flexDirection:"column",gap:6}}>
          {[["Export CSV",exportCSV,CH.download],["Export JSON",exportJSON,CH.download],["Copy CSV",copyCSV,CH.copy],[dark?"Light Mode":"Dark Mode",()=>setDark(d=>!d),dark?CH.sun:CH.moon]].map(([l,fn,ic])=>(
            <button key={l} onClick={()=>{fn();setMobileOpen(false);}}
              style={{padding:"10px 14px",background:"transparent",border:`1px solid ${T.line2}`,color:T.body,cursor:"pointer",fontFamily:DISPLAY,fontSize:12,fontWeight:800,letterSpacing:".08em",display:"flex",alignItems:"center",gap:8,textTransform:"uppercase"}}>
              <Ic ch={ic} size={13} color="currentColor" sw={2}/>{l}
            </button>
          ))}
        </div>
      )}

      {/* ── UPLOAD ZONE ────────────────────────────────────────── */}
      <section style={{position:"relative",zIndex:1,padding:"12px 14px 0"}}>
        <div
          onDragOver={e=>{e.preventDefault();setDragging(true);}}
          onDragEnter={e=>{e.preventDefault();setDragging(true);}}
          onDragLeave={()=>setDragging(false)}
          onDrop={e=>{e.preventDefault();setDragging(false);processFile(e.dataTransfer.files[0]);}}
          onClick={()=>fileRef.current.click()}
          style={{border:`1px solid ${dragging?T.bright:T.line2}`,background:dragging?T.bg3:T.bg2,padding:"13px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",transition:"all .15s",flexWrap:"wrap"}}>
          <div style={{width:34,height:34,background:T.bg3,border:`1px solid ${T.line2}`,display:"grid",placeItems:"center",flexShrink:0}}>
            <Ic ch={CH.upload} size={15} color={dragging?T.bright:T.soft} sw={1.8}/>
          </div>
          <div style={{flex:1,minWidth:140}}>
            <div style={{fontFamily:DISPLAY,fontSize:13,fontWeight:800,letterSpacing:".07em",color:dragging?T.bright:T.body}}>{dragging?"DROP FILE HERE":"UPLOAD CSV / TSV FILE"}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>Drag & drop or click to browse · .csv .tsv .txt · max 10MB</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
            <span style={{fontFamily:DISPLAY,fontSize:9,fontWeight:800,letterSpacing:".12em",color:T.muted}}>DELIM</span>
            {[[",","COMMA"],[";","SEMI"],["\t","TAB"],["|","PIPE"]].map(([v,l])=>(
              <button key={l} onClick={e=>{e.stopPropagation();setDlm(v);}}
                style={{padding:"3px 8px",border:`1px solid ${dlm===v?T.bright:T.line2}`,background:dlm===v?T.bright:"transparent",color:dlm===v?T.bg:T.muted,cursor:"pointer",fontFamily:DISPLAY,fontSize:10,fontWeight:800,letterSpacing:".05em",transition:"all .12s"}}>{l}</button>
            ))}
          </div>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" style={{display:"none"}} onChange={e=>processFile(e.target.files[0])}/>
        </div>
        {fileError&&(
          <div style={{marginTop:5,padding:"6px 12px",background:T.redBg,border:`1px solid ${T.redLine}`,fontSize:11,color:T.red,display:"flex",alignItems:"center",gap:6}}>
            <Ic ch={CH.info} size={11} color={T.red} sw={2}/>{fileError}
          </div>
        )}
      </section>

      {/* ── PANEL TABS ─────────────────────────────────────────── */}
      <section style={{position:"relative",zIndex:1,padding:"10px 14px 0"}}>
        <div style={{display:"flex",borderBottom:cellBdr,overflowX:"auto"}}>
          {panelTabs.map(pt=>(
            <button key={pt.id} onClick={()=>setPanel(pt.id)}
              style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",border:"none",background:"transparent",fontFamily:DISPLAY,fontSize:11,fontWeight:800,letterSpacing:".1em",cursor:"pointer",transition:"color .15s",whiteSpace:"nowrap",color:panel===pt.id?T.bright:T.muted,borderBottom:panel===pt.id?`2px solid ${T.bright}`:"2px solid transparent",marginBottom:-1,textTransform:"uppercase"}}
              onMouseEnter={e=>{if(panel!==pt.id)e.currentTarget.style.color=T.body;}}
              onMouseLeave={e=>{if(panel!==pt.id)e.currentTarget.style.color=T.muted;}}>
              <Ic ch={pt.icon} size={12} color="currentColor" sw={1.8}/>{pt.label}
            </button>
          ))}
        </div>

        {/* Table toolbar */}
        {panel==="table"&&(
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",paddingTop:10,paddingBottom:4}}>
            {/* Filter input */}
            <div style={{display:"flex",border:`1px solid ${T.line2}`,background:T.bg2,overflow:"hidden",flex:"1 1 200px",minWidth:170,maxWidth:360}}>
              <div style={{position:"relative",display:"flex",alignItems:"center",flex:1}}>
                <div style={{position:"absolute",left:9,pointerEvents:"none"}}><Ic ch={CH.search} size={12} color={T.muted} sw={1.8}/></div>
                <input value={filterText} onChange={e=>{setFilterText(e.target.value);setPage(0);}} placeholder="Filter rows…"
                  style={{padding:"7px 10px 7px 28px",background:"none",border:"none",color:T.bright,fontSize:12,fontFamily:BODY,outline:"none",width:"100%"}}/>
              </div>
              {filterText&&<button onClick={()=>{setFilterText("");setPage(0);}} style={{padding:"0 9px",background:"none",border:"none",borderLeft:`1px solid ${T.line2}`,color:T.muted,cursor:"pointer"}}><Ic ch={CH.clear} size={12} color="currentColor" sw={2}/></button>}
              <select value={filterCol} onChange={e=>setFilterCol(e.target.value)}
                style={{padding:"7px 8px",background:"none",border:"none",borderLeft:`1px solid ${T.line2}`,color:T.sub,fontSize:11,fontFamily:BODY,outline:"none",cursor:"pointer",maxWidth:100}}>
                <option value="__all__">All cols</option>
                {headers.map(h=><option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <select value={pageSize} onChange={e=>{setPageSize(+e.target.value);setPage(0);}}
              style={{padding:"7px 10px",background:T.bg2,border:`1px solid ${T.line2}`,color:T.sub,fontSize:11,fontFamily:BODY,outline:"none",cursor:"pointer"}}>
              {[25,50,100,250].map(n=><option key={n} value={n}>{n}/page</option>)}
            </select>

            {selectedRows.size>0&&(
              <button onClick={deleteSelectedRows}
                style={{padding:"7px 12px",background:T.redBg,border:`1px solid ${T.redLine}`,color:T.red,cursor:"pointer",fontFamily:DISPLAY,fontSize:11,fontWeight:800,letterSpacing:".06em",display:"flex",alignItems:"center",gap:5,textTransform:"uppercase"}}>
                <Ic ch={CH.del_row} size={12} color="currentColor" sw={2}/>DEL {selectedRows.size}
              </button>
            )}

            <button onClick={addRow}
              style={{padding:"7px 12px",background:"transparent",border:`1px solid ${T.line2}`,color:T.body,cursor:"pointer",fontFamily:DISPLAY,fontSize:11,fontWeight:800,letterSpacing:".06em",display:"flex",alignItems:"center",gap:5,transition:"all .14s",textTransform:"uppercase"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.bright;e.currentTarget.style.color=T.bright;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.line2;e.currentTarget.style.color=T.body;}}>
              <Ic ch={CH.add_row} size={12} color="currentColor" sw={2}/>ADD ROW
            </button>

            <div style={{marginLeft:"auto",fontFamily:MONO,fontSize:11,color:T.muted}}>
              {filteredRows.length!==rows.length
                ?<><span style={{color:T.bright,fontWeight:700}}>{filteredRows.length}</span> of {rows.length} rows</>
                :<>{rows.length} rows · {headers.length} cols</>}
            </div>
          </div>
        )}
      </section>

      {/* ── MAIN ───────────────────────────────────────────────── */}
      <main style={{position:"relative",zIndex:1,padding:"8px 14px 24px",flex:1}}>

        {/* ═══ TABLE VIEW ═══ */}
        {panel==="table"&&(
          <div style={{background:T.bg2,border:cellBdr,overflow:"hidden"}}>
            <div style={{overflowX:"auto",overflowY:"auto",maxHeight:"58vh"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,tableLayout:"auto"}}>
                <thead>
                  <tr style={{background:T.bg3,position:"sticky",top:0,zIndex:10}}>
                    <th style={{width:36,padding:"8px 10px",borderBottom:cellBdr,borderRight:cellBdr,textAlign:"center"}}>
                      <input type="checkbox" checked={selectedRows.size===pageRows.length&&pageRows.length>0} onChange={toggleSelectAll} style={{accentColor:T.bright,cursor:"pointer"}}/>
                    </th>
                    <th style={{width:44,padding:"8px",borderBottom:cellBdr,borderRight:cellBdr,fontFamily:DISPLAY,fontWeight:800,letterSpacing:".1em",fontSize:9,color:T.muted,textAlign:"center",textTransform:"uppercase"}}>#</th>
                    {orderedHeaders.map((col,ci)=>{
                      const type=inferType(col);
                      return(
                        <th key={col}
                          draggable onDragStart={()=>onColDragStart(ci)} onDragOver={e=>onColDragOver(e,ci)} onDrop={()=>onColDrop(ci)} onDragEnd={()=>{setDragColIdx(null);setDragOverIdx(null);}}
                          style={{padding:0,borderBottom:cellBdr,borderRight:ci<orderedHeaders.length-1?cellBdr:"none",minWidth:100,background:dragOverIdx===ci?T.bg4:"transparent",transition:"background .1s",cursor:"grab",whiteSpace:"nowrap"}}>
                          <div style={{display:"flex",alignItems:"center"}}>
                            <button onClick={()=>doSort(col)}
                              style={{flex:1,display:"flex",alignItems:"center",gap:5,padding:"8px 10px",background:"none",border:"none",color:T.bright,cursor:"pointer",fontFamily:DISPLAY,fontSize:11,fontWeight:800,letterSpacing:".07em",textAlign:"left",textTransform:"uppercase"}}>
                              <span style={{fontSize:9,color:typeCol[type],fontFamily:MONO,fontWeight:700,minWidth:10}}>{typeLbl[type]}</span>
                              <span style={{overflow:"hidden",textOverflow:"ellipsis",maxWidth:110}}>{col}</span>
                              <Ic ch={sortCol===col?(sortDir==="asc"?CH.sort_a:CH.sort_d):CH.sort_n} size={10} color={sortCol===col?T.bright:T.muted} sw={2}/>
                            </button>
                            <button onClick={()=>{setStatsCol(col);setPanel("stats");}}
                              style={{padding:"6px 8px",background:"none",border:"none",borderLeft:cellBdr,color:T.muted,cursor:"pointer",display:"flex",transition:"color .12s"}} title="Column stats"
                              onMouseEnter={e=>e.currentTarget.style.color=T.bright}
                              onMouseLeave={e=>e.currentTarget.style.color=T.muted}>
                              <Ic ch={CH.stats} size={11} color="currentColor" sw={1.8}/>
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length===0&&(
                    <tr><td colSpan={orderedHeaders.length+2} style={{padding:40,textAlign:"center",color:T.muted,fontSize:13}}>No rows match your filter.</td></tr>
                  )}
                  {pageRows.map((row,ri)=>{
                    const gi=page*pageSize+ri,isSel=selectedRows.has(gi);
                    return(
                      <tr key={gi} style={{background:isSel?T.bg4:"transparent",transition:"background .08s"}}
                        onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background=T.bg3;}}
                        onMouseLeave={e=>{e.currentTarget.style.background=isSel?T.bg4:"transparent";}}>
                        <td style={{padding:"5px 10px",borderBottom:cellBdr,borderRight:cellBdr,textAlign:"center"}}>
                          <input type="checkbox" checked={isSel} onChange={()=>toggleSelectRow(gi)} style={{accentColor:T.bright,cursor:"pointer"}}/>
                        </td>
                        <td style={{padding:"5px 8px",borderBottom:cellBdr,borderRight:cellBdr,color:T.muted,fontSize:10,textAlign:"center",fontFamily:MONO}}>{gi+1}</td>
                        {orderedHeaders.map((col,ci)=>{
                          const isEditing=editCell?.row===gi&&editCell?.col===col;
                          const val=row[col]??"",type=inferType(col);
                          const isHL=filterText&&filterCol==="__all__"&&String(val).toLowerCase().includes(filterText.toLowerCase());
                          return(
                            <td key={col} onDoubleClick={()=>{setEditCell({row:gi,col});setEditVal(val);}}
                              style={{padding:0,borderBottom:cellBdr,borderRight:ci<orderedHeaders.length-1?cellBdr:"none",maxWidth:200,position:"relative"}}>
                              {isEditing?(
                                <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                                  onBlur={commitEdit} onKeyDown={e=>{if(e.key==="Enter")commitEdit();if(e.key==="Escape")setEditCell(null);}}
                                  style={{width:"100%",padding:"5px 8px",background:T.bg4,border:`2px solid ${T.bright}`,color:T.bright,fontFamily:MONO,fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                              ):(
                                <div style={{padding:"5px 8px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:type==="number"?MONO:BODY,color:isHL?T.bright:T.body,background:isHL?T.bg4:"transparent"}}>
                                  {val===""?<span style={{color:T.muted,fontSize:10}}>null</span>:String(val)}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages>1&&(
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,padding:"8px 14px",borderTop:cellBdr,background:T.bg3}}>
                <span style={{fontFamily:MONO,fontSize:11,color:T.muted}}>{page*pageSize+1}–{Math.min((page+1)*pageSize,filteredRows.length)} of {filteredRows.length}</span>
                <div style={{display:"flex",gap:3}}>
                  {[["«",()=>setPage(0),page===0],["‹",()=>setPage(p=>Math.max(0,p-1)),page===0]].map(([l,fn,dis])=>(
                    <button key={l} onClick={fn} disabled={dis} style={{padding:"3px 8px",background:"none",border:`1px solid ${dis?T.line:T.line2}`,color:dis?T.muted:T.body,cursor:dis?"default":"pointer",fontFamily:MONO,fontSize:11}}>{l}</button>
                  ))}
                  {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
                    const p=totalPages<=5?i:Math.max(0,Math.min(totalPages-5,page-2))+i;
                    return<button key={p} onClick={()=>setPage(p)} style={{padding:"3px 9px",background:page===p?T.bright:"none",border:`1px solid ${page===p?T.bright:T.line2}`,color:page===p?T.bg:T.body,cursor:"pointer",fontFamily:MONO,fontSize:11,fontWeight:page===p?700:400}}>{p+1}</button>;
                  })}
                  {[["›",()=>setPage(p=>Math.min(totalPages-1,p+1)),page===totalPages-1],["»",()=>setPage(totalPages-1),page===totalPages-1]].map(([l,fn,dis])=>(
                    <button key={l} onClick={fn} disabled={dis} style={{padding:"3px 8px",background:"none",border:`1px solid ${dis?T.line:T.line2}`,color:dis?T.muted:T.body,cursor:dis?"default":"pointer",fontFamily:MONO,fontSize:11}}>{l}</button>
                  ))}
                </div>
                <span style={{fontFamily:MONO,fontSize:11,color:T.muted}}>Page {page+1}/{totalPages}</span>
              </div>
            )}

            {/* Hint bar */}
            <div style={{padding:"6px 14px",borderTop:cellBdr,background:T.bg3,fontSize:10,color:T.muted,fontFamily:MONO,display:"flex",alignItems:"center",gap:6}}>
              <Ic ch={CH.edit} size={10} color="currentColor" sw={1.8}/>
              Double-click to edit · Drag header to reorder · Click name to sort · ▦ for stats
            </div>
          </div>
        )}

        {/* ═══ STATS VIEW ═══ */}
        {panel==="stats"&&(
          <div className="csv-stats-grid" style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:10}}>
            {/* Column list */}
            <div style={{background:T.bg2,border:cellBdr,overflow:"hidden"}}>
              <div style={{padding:"9px 12px",borderBottom:cellBdr,background:T.bg3,fontFamily:DISPLAY,fontSize:10,fontWeight:800,letterSpacing:".14em",color:T.muted,textTransform:"uppercase"}}>COLUMNS</div>
              <div style={{overflowY:"auto",maxHeight:500}}>
                {orderedHeaders.map(col=>{
                  const type=inferType(col);
                  return(
                    <button key={col} onClick={()=>setStatsCol(col)}
                      style={{width:"100%",textAlign:"left",padding:"9px 12px",background:statsCol===col?T.bg4:"none",border:"none",borderBottom:cellBdr,borderLeft:`3px solid ${statsCol===col?T.bright:"transparent"}`,color:T.body,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:BODY,transition:"background .1s"}}
                      onMouseEnter={e=>{if(statsCol!==col)e.currentTarget.style.background=T.bg3;}}
                      onMouseLeave={e=>{if(statsCol!==col)e.currentTarget.style.background="none";}}>
                      <span style={{fontSize:9,fontWeight:800,color:typeCol[type],fontFamily:MONO,minWidth:12}}>{typeLbl[type]}</span>
                      <span style={{fontSize:12,fontWeight:statsCol===col?700:400,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{col}</span>
                      <span style={{fontFamily:DISPLAY,fontSize:9,fontWeight:700,letterSpacing:".04em",color:typeCol[type],textTransform:"uppercase"}}>{type}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats detail */}
            {currentStats?(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{background:T.bg2,border:cellBdr,padding:"14px 18px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                  <div style={{width:40,height:40,background:T.bg3,border:`1px solid ${T.line2}`,display:"grid",placeItems:"center",flexShrink:0}}>
                    <Ic ch={CH.stats} size={20} color={T.bright} sw={1.8}/>
                  </div>
                  <div>
                    <div style={{fontFamily:DISPLAY,fontSize:20,fontWeight:900,letterSpacing:".06em",color:T.bright}}>{currentStats.col}</div>
                    <div style={{fontFamily:MONO,fontSize:11,color:T.muted,marginTop:2}}>{inferType(currentStats.col)} · {currentStats.total} values</div>
                  </div>
                  <div style={{marginLeft:"auto",display:"flex",gap:8,flexWrap:"wrap"}}>
                    {[
                      [currentStats.nulls,"NULLS",T.red,T.redBg,T.redLine],
                      [currentStats.unique,"UNIQUE",T.bright,T.bg3,T.line2],
                      [Math.round((1-currentStats.nulls/currentStats.total)*100)+"%","FILL",T.green,T.greenBg,T.greenLine],
                    ].map(([v,l,col,bg,ln])=>(
                      <div key={l} style={{padding:"7px 14px",background:bg,border:`1px solid ${ln}`,textAlign:"center"}}>
                        <div style={{fontFamily:MONO,fontSize:18,fontWeight:700,color:col}}>{v}</div>
                        <div style={{fontFamily:DISPLAY,fontSize:9,fontWeight:800,letterSpacing:".12em",color:T.muted,marginTop:2,textTransform:"uppercase"}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="csv-stats-inner" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {currentStats.isNumeric&&(
                    <div style={{background:T.bg2,border:cellBdr,padding:"14px 18px"}}>
                      <div style={{fontFamily:DISPLAY,fontSize:10,fontWeight:800,letterSpacing:".14em",color:T.muted,textTransform:"uppercase",marginBottom:12}}>NUMERIC STATS</div>
                      {[["Min",fmtN(currentStats.min)],["Max",fmtN(currentStats.max)],["Mean",fmtN(currentStats.mean)],["Median",fmtN(currentStats.median)],["Std Dev",fmtN(currentStats.std)],["Sum",fmtN(currentStats.sum)],["Count",currentStats.numCount?.toLocaleString()]].map(([l,v])=>(
                        <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${T.line}`,fontSize:12}}>
                          <span style={{color:T.body}}>{l}</span>
                          <span style={{fontFamily:MONO,fontWeight:700,color:T.bright}}>{v}</span>
                        </div>
                      ))}
                      {currentStats.min!==undefined&&(
                        <div style={{marginTop:14}}>
                          <div style={{fontFamily:DISPLAY,fontSize:9,fontWeight:800,letterSpacing:".12em",color:T.muted,textTransform:"uppercase",marginBottom:6}}>DISTRIBUTION</div>
                          <div style={{display:"flex",gap:2,height:40,alignItems:"flex-end"}}>
                            {(()=>{
                              const vals=rows.map(r=>parseFloat(r[currentStats.col])).filter(v=>!isNaN(v));
                              const mn=Math.min(...vals),mx=Math.max(...vals),bins=12,bs=(mx-mn)/bins||1;
                              const counts=new Array(bins).fill(0);
                              vals.forEach(v=>{const b=Math.min(bins-1,Math.floor((v-mn)/bs));counts[b]++;});
                              const mc=Math.max(...counts);
                              return counts.map((c,i)=>(
                                <div key={i} style={{flex:1,background:T.bright,opacity:.2+(c/mc)*.75,height:`${Math.max(6,(c/mc)*100)}%`,transition:"height .3s"}} title={`${fmtN(mn+i*bs)}–${fmtN(mn+(i+1)*bs)}: ${c}`}/>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {!currentStats.isNumeric&&(
                    <div style={{background:T.bg2,border:cellBdr,padding:"14px 18px"}}>
                      <div style={{fontFamily:DISPLAY,fontSize:10,fontWeight:800,letterSpacing:".14em",color:T.muted,textTransform:"uppercase",marginBottom:12}}>TEXT STATS</div>
                      {[["Avg Length",fmtN(currentStats.avgLen,1)+" chars"],["Non-empty",(currentStats.total-currentStats.nulls).toLocaleString()],["Unique ratio",Math.round(currentStats.unique/currentStats.total*100)+"%"]].map(([l,v])=>(
                        <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.line}`,fontSize:12}}>
                          <span style={{color:T.body}}>{l}</span>
                          <span style={{fontFamily:MONO,fontWeight:700,color:T.bright}}>{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{background:T.bg2,border:cellBdr,padding:"14px 18px"}}>
                    <div style={{fontFamily:DISPLAY,fontSize:10,fontWeight:800,letterSpacing:".14em",color:T.muted,textTransform:"uppercase",marginBottom:12}}>TOP VALUES</div>
                    {currentStats.topVals.map(([val,count],i)=>{
                      const pct=Math.round(count/currentStats.total*100);
                      return(
                        <div key={i} style={{marginBottom:10}}>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
                            <span style={{color:T.bright,fontFamily:MONO,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:150}}>
                              {val===""?<span style={{color:T.muted}}>(empty)</span>:val}
                            </span>
                            <span style={{color:T.muted,marginLeft:8,flexShrink:0,fontFamily:MONO}}>{count} ({pct}%)</span>
                          </div>
                          <div style={{height:3,background:T.line2}}>
                            <div style={{width:`${pct}%`,height:"100%",background:T.bright,opacity:.35+i*0.13}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ):(
              <div style={{background:T.bg2,border:cellBdr,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,minHeight:240,color:T.muted}}>
                <Ic ch={CH.stats} size={32} color={T.line3} sw={1.2}/>
                <span style={{fontFamily:DISPLAY,fontSize:13,fontWeight:800,letterSpacing:".12em",textTransform:"uppercase"}}>SELECT A COLUMN</span>
              </div>
            )}
          </div>
        )}

        {/* ═══ FIND & REPLACE ═══ */}
        {panel==="replace"&&(
          <div className="csv-replace-grid" style={{display:"grid",gridTemplateColumns:"min(100%,360px) 1fr",gap:10}}>
            {/* Controls */}
            <div style={{background:T.bg2,border:cellBdr,padding:18,display:"flex",flexDirection:"column",gap:14}}>
              <div style={{fontFamily:DISPLAY,fontSize:10,fontWeight:800,letterSpacing:".14em",color:T.muted,textTransform:"uppercase",display:"flex",alignItems:"center",gap:6}}>
                <Ic ch={CH.replace} size={12} color="currentColor" sw={2}/>FIND & REPLACE
              </div>
              {[["FIND",findVal,setFindVal,"Text to find…"],["REPLACE WITH",replaceVal,setReplaceVal,"Replacement…"]].map(([l,v,fn,ph])=>(
                <div key={l}>
                  <div style={{fontFamily:DISPLAY,fontSize:10,fontWeight:800,letterSpacing:".1em",color:T.muted,textTransform:"uppercase",marginBottom:6}}>{l}</div>
                  <input value={v} onChange={e=>fn(e.target.value)} placeholder={ph}
                    style={{width:"100%",padding:"8px 10px",background:T.bg,border:`1px solid ${T.line2}`,color:T.bright,fontSize:12,fontFamily:MONO,outline:"none",boxSizing:"border-box",transition:"border-color .14s"}}
                    onFocus={e=>e.target.style.borderColor=T.bright} onBlur={e=>e.target.style.borderColor=T.line2}/>
                </div>
              ))}
              <div>
                <div style={{fontFamily:DISPLAY,fontSize:10,fontWeight:800,letterSpacing:".1em",color:T.muted,textTransform:"uppercase",marginBottom:6}}>IN COLUMN</div>
                <select value={replaceCol} onChange={e=>setReplaceCol(e.target.value)}
                  style={{width:"100%",padding:"8px 10px",background:T.bg,border:`1px solid ${T.line2}`,color:T.bright,fontSize:12,fontFamily:BODY,outline:"none",cursor:"pointer"}}>
                  <option value="__all__">All columns</option>
                  {headers.map(h=><option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:T.body}}>
                <input type="checkbox" checked={caseSens} onChange={e=>setCaseSens(e.target.checked)} style={{accentColor:T.bright,width:14,height:14}}/>
                Case sensitive
              </label>
              {findVal&&(()=>{
                const q=caseSens?findVal:findVal.toLowerCase();
                const cols=replaceCol==="__all__"?headers:[replaceCol];
                const count=rows.reduce((a,row)=>a+cols.filter(col=>(caseSens?String(row[col]??""):String(row[col]??"").toLowerCase()).includes(q)).length,0);
                return<div style={{padding:"8px 12px",background:count>0?T.amberBg:T.redBg,border:`1px solid ${count>0?T.amberLine:T.redLine}`,fontSize:11,color:count>0?T.amber:T.red,fontWeight:600,fontFamily:MONO}}>
                  {count>0?`${count} cell${count>1?"s":""} will be affected`:"No matches found"}
                </div>;
              })()}
              <button onClick={doReplace} disabled={!findVal}
                style={{padding:"10px 16px",background:findVal?T.bright:T.bg3,border:"none",color:findVal?T.bg:T.muted,cursor:findVal?"pointer":"default",fontFamily:DISPLAY,fontSize:12,fontWeight:900,letterSpacing:".12em",textTransform:"uppercase",transition:"all .14s"}}>
                REPLACE ALL
              </button>
              {replaceCount!==null&&(
                <div style={{padding:"8px 12px",background:T.greenBg,border:`1px solid ${T.greenLine}`,fontSize:11,color:T.green,fontWeight:700,fontFamily:MONO,display:"flex",alignItems:"center",gap:6}}>
                  <Ic ch={CH.check} size={12} color="currentColor" sw={2.5}/>
                  Replaced {replaceCount} cell{replaceCount!==1?"s":""}
                </div>
              )}
            </div>

            {/* Preview */}
            <div style={{background:T.bg2,border:cellBdr,overflow:"hidden"}}>
              <div style={{padding:"9px 14px",borderBottom:cellBdr,background:T.bg3,fontFamily:DISPLAY,fontSize:10,fontWeight:800,letterSpacing:".14em",color:T.muted,textTransform:"uppercase"}}>PREVIEW — MATCHING ROWS</div>
              <div style={{overflow:"auto",maxHeight:420}}>
                {findVal?(()=>{
                  const q=caseSens?findVal:findVal.toLowerCase();
                  const cols=replaceCol==="__all__"?headers:[replaceCol];
                  const matches=rows.filter(row=>cols.some(col=>(caseSens?String(row[col]??""):String(row[col]??"").toLowerCase()).includes(q)));
                  return matches.length===0
                    ?<div style={{padding:40,textAlign:"center",color:T.muted,fontSize:13}}>No matches for "{findVal}"</div>
                    :<table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                      <thead><tr style={{background:T.bg3}}>
                        {orderedHeaders.slice(0,6).map((h,i)=><th key={h} style={{padding:"7px 10px",borderBottom:cellBdr,borderRight:i<5?cellBdr:"none",textAlign:"left",fontFamily:DISPLAY,fontWeight:800,letterSpacing:".08em",color:T.muted,fontSize:10,textTransform:"uppercase"}}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {matches.slice(0,30).map((row,i)=>(
                          <tr key={i}>
                            {orderedHeaders.slice(0,6).map((col,ci)=>{
                              const val=String(row[col]??"");
                              const isMatch=cols.includes(col)&&(caseSens?val:val.toLowerCase()).includes(q);
                              return<td key={col} style={{padding:"5px 10px",borderBottom:cellBdr,borderRight:ci<5?cellBdr:"none",fontFamily:isMatch?MONO:BODY,background:isMatch?T.amberBg:"transparent",color:isMatch?T.amber:T.body,fontSize:11}}>{val}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>;
                })():<div style={{padding:40,textAlign:"center",color:T.muted,fontSize:13}}>Enter a search term to preview matches</div>}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── FEATURES STRIP ─────────────────────────────────────── */}
      <section style={{position:"relative",zIndex:1,padding:"28px 14px",borderTop:cellBdr,background:T.bg2}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:22}}>
            <div style={{fontFamily:DISPLAY,fontSize:"clamp(20px,3vw,28px)",fontWeight:900,letterSpacing:".06em",color:T.bright}}>EVERYTHING YOU NEED FOR CSV WORK</div>
            <div style={{fontFamily:MONO,fontSize:11,color:T.muted,marginTop:6}}>No uploads. No sign-in. Just your data, right here.</div>
          </div>
          <div className="csv-feat-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",border:`1px solid ${T.line}`}}>
            {[
              [CH.table,   "SMART TABLE",    "Sortable columns, row checkboxes, pagination, cell editing"],
              [CH.grip,    "COL REORDER",    "Drag & drop column headers to reorder instantly"],
              [CH.stats,   "COLUMN STATS",   "Min, max, mean, median, std dev, null count, top values"],
              [CH.replace, "FIND & REPLACE", "Search across all or specific columns with preview"],
              [CH.type,    "TYPE INFERENCE", "Auto-detects number, date, boolean, email, text columns"],
              [CH.download,"EXPORT",         "Export edited data back to .csv or .json with one click"],
            ].map(([ic,t,d],i,arr)=>(
              <div key={t} style={{padding:16,borderRight:i<arr.length-1?`1px solid ${T.line}`:"none",transition:"background .14s"}}
                onMouseEnter={e=>e.currentTarget.style.background=T.bg3}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{width:30,height:30,border:`1px solid ${T.line2}`,display:"grid",placeItems:"center",marginBottom:10}}>
                  <Ic ch={ic} size={14} color={T.bright} sw={1.8}/>
                </div>
                <div style={{fontFamily:DISPLAY,fontSize:12,fontWeight:800,letterSpacing:".08em",color:T.bright,marginBottom:5,textTransform:"uppercase"}}>{t}</div>
                <div style={{fontSize:11,color:T.muted,lineHeight:1.6}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{position:"relative",zIndex:1,padding:"12px 14px",borderTop:cellBdr,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,background:T.bg}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:22,height:22,background:T.bright,display:"grid",placeItems:"center"}}>
            <Ic ch={CH.table} size={11} color={T.bg} sw={2}/>
          </div>
          <span style={{fontFamily:DISPLAY,fontWeight:900,fontSize:13,letterSpacing:".1em",color:T.bright}}>CSVSTUDIO</span>
          <span style={{fontFamily:MONO,fontSize:11,color:T.muted}}>— 100% client-side</span>
        </div>
        <span style={{fontSize:11,color:T.muted,fontFamily:MONO}}>
          Made with <span style={{color:T.red}}>♥</span> by{" "}
          <a href="https://sweathkumar.com" target="_blank" rel="noopener noreferrer"
            style={{color:T.bright,textDecoration:"none",fontWeight:700}}>sweathkumar.com</a>
        </span>
      </footer>

      {/* ── GLOBAL CSS ─────────────────────────────────────────── */}
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.line3}}
        ::selection{background:${dark?"rgba(240,240,240,.18)":"rgba(10,10,10,.14)"}}
        input::placeholder,textarea::placeholder{color:${T.muted}}
        select{appearance:none;-webkit-appearance:none}
        button{border-radius:0;outline:none}
        input,select,textarea{border-radius:0}
        th{position:sticky;top:0}

        /* Mobile: hide desktop actions, show burger */
        @media(max-width:680px){
          .csv-hdr-act{display:none!important}
          .csv-burger{display:grid!important}
        }

        /* Tablet/mobile: stack stats grid */
        @media(max-width:640px){
          .csv-stats-grid{grid-template-columns:1fr!important}
          .csv-stats-inner{grid-template-columns:1fr!important}
          .csv-replace-grid{grid-template-columns:1fr!important}
        }

        /* Mobile: 2-col features */
        @media(max-width:480px){
          .csv-feat-grid{grid-template-columns:repeat(2,1fr)!important}
          .csv-feat-grid>div{border-right:none!important;border-bottom:1px solid ${T.line}}
        }
      `}</style>
    </div>
  );
}
