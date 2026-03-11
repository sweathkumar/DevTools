import { useState, useEffect, useRef, useCallback } from "react";

/*
  CODESTUDIO — ENTERPRISE EDITION
  ─────────────────────────────────────────────────────────────────
  EXTERNAL DEPS — add to index.html <head>:

  <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
  ─────────────────────────────────────────────────────────────────
*/

const DISPLAY = "'Barlow Condensed', sans-serif";
const BODY    = "'Barlow', system-ui, sans-serif";
const MONO    = "'JetBrains Mono', monospace";
const FONTS_URL = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";

// ── SHELL THEMES (UI chrome) ─────────────────────────────────────────
const UI_DARK = {
  bg:"#0A0A0A", bg2:"#111111", bg3:"#161616", bg4:"#1E1E1E",
  line:"#222222", line2:"#2A2A2A", line3:"#333333",
  muted:"#555555", soft:"#888888", body:"#B0B0B0", bright:"#F0F0F0",
  green:"#4ade80", amber:"#fbbf24", red:"#f87171",
  inv:"#F0F0F0", invBg:"#0A0A0A",
  isDark:true,
};
const UI_LIGHT = {
  bg:"#F5F5F5", bg2:"#FFFFFF", bg3:"#EBEBEB", bg4:"#E0E0E0",
  line:"#DCDCDC", line2:"#CECECE", line3:"#BEBEBE",
  muted:"#AAAAAA", soft:"#888888", body:"#555555", bright:"#0A0A0A",
  green:"#16a34a", amber:"#d97706", red:"#dc2626",
  inv:"#0A0A0A", invBg:"#F0F0F0",
  isDark:false,
};

// ── MONACO EDITOR THEMES ─────────────────────────────────────────────
const EDITOR_THEMES = [
  { id:"cs-mono-dark",   label:"MONO DARK",   base:"vs-dark", isDark:true  },
  { id:"cs-mono-light",  label:"MONO LIGHT",  base:"vs",      isDark:false },
  { id:"cs-ink",         label:"INK",         base:"vs-dark", isDark:true  },
  { id:"cs-slate",       label:"SLATE",       base:"vs-dark", isDark:true  },
  { id:"cs-parchment",   label:"PARCHMENT",   base:"vs",      isDark:false },
  { id:"cs-midnight",    label:"MIDNIGHT",    base:"vs-dark", isDark:true  },
  { id:"cs-terminal",    label:"TERMINAL",    base:"vs-dark", isDark:true  },
  { id:"cs-chalk",       label:"CHALK",       base:"vs-dark", isDark:true  },
  { id:"cs-warm",        label:"WARM",        base:"vs",      isDark:false },
  { id:"cs-blueprint",   label:"BLUEPRINT",   base:"vs-dark", isDark:true  },
  { id:"cs-sepia",       label:"SEPIA",       base:"vs",      isDark:false },
  { id:"cs-neon",        label:"NEON",        base:"vs-dark", isDark:true  },
];

function buildMonacoTheme(id) {
  const themes = {
    "cs-mono-dark": {
      base:"vs-dark", colors:{
        "editor.background":"#0A0A0A","editor.foreground":"#F0F0F0",
        "editorLineNumber.foreground":"#2A2A2A","editorLineNumber.activeForeground":"#888888",
        "editor.lineHighlightBackground":"#111111","editorCursor.foreground":"#F0F0F0",
        "editor.selectionBackground":"#2A2A2A","editorIndentGuide.background1":"#1E1E1E",
        "scrollbarSlider.background":"#1E1E1E88","scrollbarSlider.hoverBackground":"#2A2A2A88",
      },
      rules:[
        {token:"",foreground:"F0F0F0"},{token:"comment",foreground:"444444",fontStyle:"italic"},
        {token:"keyword",foreground:"EEEEEE",fontStyle:"bold"},{token:"string",foreground:"CCCCCC"},
        {token:"number",foreground:"AAAAAA"},{token:"tag",foreground:"FFFFFF"},
        {token:"attribute.name",foreground:"BBBBBB"},{token:"attribute.value",foreground:"999999"},
        {token:"type",foreground:"DDDDDD"},{token:"function",foreground:"FFFFFF"},
      ]},
    "cs-mono-light": {
      base:"vs", colors:{
        "editor.background":"#F5F5F5","editor.foreground":"#0A0A0A",
        "editorLineNumber.foreground":"#CCCCCC","editorLineNumber.activeForeground":"#888888",
        "editor.lineHighlightBackground":"#EBEBEB","editorCursor.foreground":"#0A0A0A",
        "editor.selectionBackground":"#DEDEDE",
        "scrollbarSlider.background":"#CCCCCC88",
      },
      rules:[
        {token:"",foreground:"0A0A0A"},{token:"comment",foreground:"AAAAAA",fontStyle:"italic"},
        {token:"keyword",foreground:"111111",fontStyle:"bold"},{token:"string",foreground:"444444"},
        {token:"number",foreground:"666666"},{token:"tag",foreground:"000000"},
        {token:"attribute.name",foreground:"333333"},{token:"attribute.value",foreground:"555555"},
      ]},
    "cs-ink": {
      base:"vs-dark", colors:{
        "editor.background":"#080808","editor.foreground":"#E8E8E8",
        "editorLineNumber.foreground":"#1E1E1E","editorLineNumber.activeForeground":"#666666",
        "editor.lineHighlightBackground":"#0D0D0D","editorCursor.foreground":"#E8E8E8",
        "editor.selectionBackground":"#1E1E1E",
      },
      rules:[
        {token:"",foreground:"E8E8E8"},{token:"comment",foreground:"333333",fontStyle:"italic"},
        {token:"keyword",foreground:"FFFFFF",fontStyle:"bold"},{token:"string",foreground:"B8B8B8"},
        {token:"number",foreground:"888888"},{token:"tag",foreground:"F8F8F8"},
        {token:"attribute.name",foreground:"C8C8C8"},{token:"attribute.value",foreground:"909090"},
        {token:"function",foreground:"FFFFFF",fontStyle:"bold"},
      ]},
    "cs-slate": {
      base:"vs-dark", colors:{
        "editor.background":"#1A1F2E","editor.foreground":"#CBD5E1",
        "editorLineNumber.foreground":"#2D3748","editorLineNumber.activeForeground":"#64748B",
        "editor.lineHighlightBackground":"#1E2433","editorCursor.foreground":"#CBD5E1",
        "editor.selectionBackground":"#2D3748",
      },
      rules:[
        {token:"",foreground:"CBD5E1"},{token:"comment",foreground:"334155",fontStyle:"italic"},
        {token:"keyword",foreground:"E2E8F0",fontStyle:"bold"},{token:"string",foreground:"94A3B8"},
        {token:"number",foreground:"64748B"},{token:"tag",foreground:"F1F5F9"},
        {token:"attribute.name",foreground:"CBD5E1"},{token:"attribute.value",foreground:"94A3B8"},
        {token:"function",foreground:"E2E8F0"},
      ]},
    "cs-parchment": {
      base:"vs", colors:{
        "editor.background":"#F8F4E8","editor.foreground":"#2C1A0E",
        "editorLineNumber.foreground":"#D4B896","editorLineNumber.activeForeground":"#8B6544",
        "editor.lineHighlightBackground":"#F0EAD6","editorCursor.foreground":"#2C1A0E",
        "editor.selectionBackground":"#DDD0B0",
      },
      rules:[
        {token:"",foreground:"2C1A0E"},{token:"comment",foreground:"BCA882",fontStyle:"italic"},
        {token:"keyword",foreground:"1A0A00",fontStyle:"bold"},{token:"string",foreground:"5C3A1E"},
        {token:"number",foreground:"7A5C3C"},{token:"tag",foreground:"0A0500"},
        {token:"attribute.name",foreground:"3C2010"},{token:"attribute.value",foreground:"6B4226"},
      ]},
    "cs-midnight": {
      base:"vs-dark", colors:{
        "editor.background":"#0D1117","editor.foreground":"#C9D1D9",
        "editorLineNumber.foreground":"#21262D","editorLineNumber.activeForeground":"#484F58",
        "editor.lineHighlightBackground":"#161B22","editorCursor.foreground":"#C9D1D9",
        "editor.selectionBackground":"#264F78",
      },
      rules:[
        {token:"",foreground:"C9D1D9"},{token:"comment",foreground:"484F58",fontStyle:"italic"},
        {token:"keyword",foreground:"F0F6FC",fontStyle:"bold"},{token:"string",foreground:"A5D6FF"},
        {token:"number",foreground:"79C0FF"},{token:"tag",foreground:"7EE787"},
        {token:"attribute.name",foreground:"FFA657"},{token:"attribute.value",foreground:"A5D6FF"},
        {token:"function",foreground:"D2A8FF"},
      ]},
    "cs-terminal": {
      base:"vs-dark", colors:{
        "editor.background":"#001100","editor.foreground":"#00FF41",
        "editorLineNumber.foreground":"#004400","editorLineNumber.activeForeground":"#00AA00",
        "editor.lineHighlightBackground":"#002200","editorCursor.foreground":"#00FF41",
        "editor.selectionBackground":"#003300",
      },
      rules:[
        {token:"",foreground:"00FF41"},{token:"comment",foreground:"005500",fontStyle:"italic"},
        {token:"keyword",foreground:"00FF41",fontStyle:"bold"},{token:"string",foreground:"00CC33"},
        {token:"number",foreground:"00AA22"},{token:"tag",foreground:"00FF41"},
        {token:"attribute.name",foreground:"00DD38"},{token:"attribute.value",foreground:"00BB2D"},
        {token:"function",foreground:"00FF41",fontStyle:"bold"},
      ]},
    "cs-chalk": {
      base:"vs-dark", colors:{
        "editor.background":"#2B2B2B","editor.foreground":"#EDEDED",
        "editorLineNumber.foreground":"#404040","editorLineNumber.activeForeground":"#7A7A7A",
        "editor.lineHighlightBackground":"#323232","editorCursor.foreground":"#EDEDED",
        "editor.selectionBackground":"#464646",
      },
      rules:[
        {token:"",foreground:"EDEDED"},{token:"comment",foreground:"5C5C5C",fontStyle:"italic"},
        {token:"keyword",foreground:"FFFFFF",fontStyle:"bold"},{token:"string",foreground:"C8C8C8"},
        {token:"number",foreground:"AAAAAA"},{token:"tag",foreground:"F5F5F5"},
        {token:"attribute.name",foreground:"D0D0D0"},{token:"attribute.value",foreground:"B0B0B0"},
      ]},
    "cs-warm": {
      base:"vs", colors:{
        "editor.background":"#FEFAF5","editor.foreground":"#2D2015",
        "editorLineNumber.foreground":"#E8D5BC","editorLineNumber.activeForeground":"#B8926A",
        "editor.lineHighlightBackground":"#FBF4EA","editorCursor.foreground":"#2D2015",
        "editor.selectionBackground":"#F0D9B5",
      },
      rules:[
        {token:"",foreground:"2D2015"},{token:"comment",foreground:"C8A87A",fontStyle:"italic"},
        {token:"keyword",foreground:"1A0D05",fontStyle:"bold"},{token:"string",foreground:"6B3C1A"},
        {token:"number",foreground:"8B5E2A"},{token:"tag",foreground:"0F0805"},
        {token:"attribute.name",foreground:"3D2010"},{token:"attribute.value",foreground:"7A4422"},
      ]},
    "cs-blueprint": {
      base:"vs-dark", colors:{
        "editor.background":"#0A1628","editor.foreground":"#A8C4E0",
        "editorLineNumber.foreground":"#1A2D4A","editorLineNumber.activeForeground":"#3A5A80",
        "editor.lineHighlightBackground":"#0E1E38","editorCursor.foreground":"#A8C4E0",
        "editor.selectionBackground":"#1A3050",
      },
      rules:[
        {token:"",foreground:"A8C4E0"},{token:"comment",foreground:"2A4A6A",fontStyle:"italic"},
        {token:"keyword",foreground:"D0E8FF",fontStyle:"bold"},{token:"string",foreground:"7AACCC"},
        {token:"number",foreground:"5A8CA8"},{token:"tag",foreground:"E0F0FF"},
        {token:"attribute.name",foreground:"B8D4EC"},{token:"attribute.value",foreground:"88B8D8"},
      ]},
    "cs-sepia": {
      base:"vs", colors:{
        "editor.background":"#F1E8D8","editor.foreground":"#3B2A1A",
        "editorLineNumber.foreground":"#D4C4A8","editorLineNumber.activeForeground":"#9A7A58",
        "editor.lineHighlightBackground":"#EBE0CA","editorCursor.foreground":"#3B2A1A",
        "editor.selectionBackground":"#D8C8A0",
      },
      rules:[
        {token:"",foreground:"3B2A1A"},{token:"comment",foreground:"B8A882",fontStyle:"italic"},
        {token:"keyword",foreground:"1A0A00",fontStyle:"bold"},{token:"string",foreground:"5A3A20"},
        {token:"number",foreground:"7A5A3A"},{token:"tag",foreground:"050200"},
        {token:"attribute.name",foreground:"3A2010"},{token:"attribute.value",foreground:"6A4430"},
      ]},
    "cs-neon": {
      base:"vs-dark", colors:{
        "editor.background":"#050510","editor.foreground":"#00FFFF",
        "editorLineNumber.foreground":"#0A0A30","editorLineNumber.activeForeground":"#0055AA",
        "editor.lineHighlightBackground":"#080818","editorCursor.foreground":"#FF00FF",
        "editor.selectionBackground":"#001A3A",
      },
      rules:[
        {token:"",foreground:"00FFFF"},{token:"comment",foreground:"003355",fontStyle:"italic"},
        {token:"keyword",foreground:"FF00FF",fontStyle:"bold"},{token:"string",foreground:"00FF88"},
        {token:"number",foreground:"FFFF00"},{token:"tag",foreground:"FF44AA"},
        {token:"attribute.name",foreground:"00CCFF"},{token:"attribute.value",foreground:"00FF88"},
        {token:"function",foreground:"FF00FF",fontStyle:"bold"},
      ]},
  };
  return themes[id];
}

// ── LANGUAGES ────────────────────────────────────────────────────────
const LANGS = [
  { v:"html",       l:"HTML",        e:"html" },
  { v:"css",        l:"CSS",         e:"css"  },
  { v:"javascript", l:"JavaScript",  e:"js"   },
  { v:"typescript", l:"TypeScript",  e:"ts"   },
  { v:"jsx",        l:"JSX",         e:"jsx"  },
  { v:"tsx",        l:"TSX",         e:"tsx"  },
  { v:"json",       l:"JSON",        e:"json" },
  { v:"markdown",   l:"Markdown",    e:"md"   },
  { v:"xml",        l:"XML",         e:"xml"  },
  { v:"yaml",       l:"YAML",        e:"yaml" },
  { v:"sql",        l:"SQL",         e:"sql"  },
  { v:"python",     l:"Python",      e:"py"   },
  { v:"java",       l:"Java",        e:"java" },
  { v:"csharp",     l:"C#",          e:"cs"   },
  { v:"cpp",        l:"C++",         e:"cpp"  },
  { v:"rust",       l:"Rust",        e:"rs"   },
  { v:"go",         l:"Go",          e:"go"   },
  { v:"swift",      l:"Swift",       e:"swift"},
  { v:"kotlin",     l:"Kotlin",      e:"kt"   },
  { v:"php",        l:"PHP",         e:"php"  },
  { v:"ruby",       l:"Ruby",        e:"rb"   },
  { v:"shell",      l:"Bash",        e:"sh"   },
  { v:"dockerfile", l:"Dockerfile",  e:"dockerfile"},
  { v:"graphql",    l:"GraphQL",     e:"gql"  },
  { v:"plaintext",  l:"Plain Text",  e:"txt"  },
];

const EXT_MAP = {
  html:"html",htm:"html",css:"css",js:"javascript",ts:"typescript",
  jsx:"javascript",tsx:"typescript",json:"json",xml:"xml",yaml:"yaml",
  yml:"yaml",md:"markdown",txt:"plaintext",py:"python",java:"java",
  cs:"csharp",cpp:"cpp",cc:"cpp",rs:"rust",go:"go",swift:"swift",
  kt:"kotlin",php:"php",rb:"ruby",sh:"shell",bash:"shell",
  dockerfile:"dockerfile",gql:"graphql",graphql:"graphql",sql:"sql",
};

// ── DEFAULTS ─────────────────────────────────────────────────────────
const DEFAULTS = {
  html:`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>CodeStudio</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, sans-serif;
      background: #0A0A0A; color: #F0F0F0;
      display: grid; place-items: center; min-height: 100vh;
    }
    .card {
      text-align: center; padding: 48px 64px;
      border: 1px solid #222; background: #111;
    }
    h1 { font-size: 2.4rem; font-weight: 900; letter-spacing: -.04em; }
    p  { color: #666; margin-top: 10px; font-size: .9rem; }
    button {
      margin-top: 24px; padding: 10px 32px;
      background: #F0F0F0; border: none; color: #0A0A0A;
      font-size: 1rem; font-weight: 700; cursor: pointer;
    }
    button:hover { background: #ccc; }
  </style>
</head>
<body>
  <div class="card">
    <h1>CODESTUDIO</h1>
    <p>Edit this code and see changes live.</p>
    <button onclick="this.textContent='Clicked!'">Run me</button>
  </div>
</body>
</html>`,
  json:`{
  "name": "CodeStudio",
  "version": "2.0.0",
  "description": "Enterprise live code editor",
  "author": "sweathkumar",
  "features": [
    "syntax highlighting",
    "live preview",
    "multi-theme editor",
    "file upload & download",
    "25+ languages"
  ],
  "config": {
    "theme": "cs-mono-dark",
    "autoRun": true,
    "wordWrap": false
  }
}`,
  markdown:`# CodeStudio

A **enterprise-grade** live code editor in your browser.

## Features

- Syntax highlighting for 25+ languages
- Live HTML/CSS/JS preview
- 12 editor themes
- Markdown rendering with live preview
- JSON tree viewer
- File upload & download

## Code Example

\`\`\`javascript
const greet = (name) => \`Hello, \${name}!\`;
console.log(greet("world"));
\`\`\`

> Edit this markdown and watch it render instantly.
`,
  sql:`-- CodeStudio SQL Editor
SELECT
  u.id,
  u.name,
  u.email,
  COUNT(o.id) AS order_count,
  SUM(o.total) AS total_spent
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.created_at > '2024-01-01'
  AND u.status = 'active'
GROUP BY u.id, u.name, u.email
ORDER BY total_spent DESC
LIMIT 50;`,
  python:`# CodeStudio Python
from dataclasses import dataclass
from typing import Optional


@dataclass
class User:
    id: int
    name: str
    email: str
    role: str = "viewer"

    def is_admin(self) -> bool:
        return self.role == "admin"

    def display(self) -> str:
        badge = "[ADMIN]" if self.is_admin() else ""
        return f"{self.name} <{self.email}> {badge}".strip()


def greet(user: User, message: Optional[str] = None) -> str:
    msg = message or "Welcome to CodeStudio"
    return f"Hello {user.name}! {msg}"


if __name__ == "__main__":
    alice = User(id=1, name="Alice", email="alice@dev.io", role="admin")
    print(greet(alice))
    print(alice.display())
`,
};

// ── HELPERS ──────────────────────────────────────────────────────────
function escapeHTML(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function jsonToHTML(val,depth=0){
  const pad="  ".repeat(depth),pad1="  ".repeat(depth+1);
  if(val===null)return`<span class="jn">null</span>`;
  if(typeof val==="boolean")return`<span class="jb">${val}</span>`;
  if(typeof val==="number")return`<span class="jnum">${val}</span>`;
  if(typeof val==="string")return`<span class="jstr">"${escapeHTML(val)}"</span>`;
  if(Array.isArray(val)){
    if(!val.length)return`<span class="jbr">[]</span>`;
    const items=val.map((v,i)=>`${pad1}${jsonToHTML(v,depth+1)}${i<val.length-1?",":""}`).join("\n");
    return`<span class="jbr">[</span>\n${items}\n${pad}<span class="jbr">]</span>`;
  }
  if(typeof val==="object"){
    const keys=Object.keys(val);
    if(!keys.length)return`<span class="jbr">{}</span>`;
    const items=keys.map((k,i)=>`${pad1}<span class="jk">"${escapeHTML(k)}"</span><span class="jpunc">: </span>${jsonToHTML(val[k],depth+1)}${i<keys.length-1?",":""}`).join("\n");
    return`<span class="jbr">{</span>\n${items}\n${pad}<span class="jbr">}</span>`;
  }
  return String(val);
}

// ── ICON SYSTEM ──────────────────────────────────────────────────────
const Ic=({ch,size=14,sw=1.6,fill="none",color="currentColor"})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{display:"block",flexShrink:0}}>{ch}</svg>
);
const CH={
  play:   null,
  open:   <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  save:   <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  format: <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></>,
  copy:   <><rect x="9" y="9" width="13" height="13" rx="0"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
  clear:  <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></>,
  wrap:   <><polyline points="17 10 21 10 21 3"/><path d="M21 3H3"/><polyline points="7 21 3 21 3 14"/><path d="M3 21h18"/></>,
  split:  <><rect x="3" y="3" width="7" height="18" rx="0"/><rect x="14" y="3" width="7" height="18" rx="0"/></>,
  editor: <><rect x="3" y="3" width="18" height="18" rx="0"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></>,
  eye:    <><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></>,
  moon:   <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>,
  sun:    <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
  refresh:<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>,
  menu:   <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
  close:  <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  palette:<><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 000 20c1.1 0 2-.9 2-2v-.5c0-.5.4-1 1-1h2.5c2.2 0 4-1.8 4-4 0-5.5-4.5-10-9.5-10"/></>,
  fold:   <><polyline points="6 9 12 15 18 9"/></>,
  unfold: <><polyline points="18 15 12 9 6 15"/></>,
  check:  <polyline points="20 6 9 17 4 12"/>,
};

// ── MAIN COMPONENT ───────────────────────────────────────────────────
export default function CodeStudio() {
  const [dark, setDark]             = useState(true);
  const [lang, setLang]             = useState("html");
  const [fileName, setFileName]     = useState("untitled.html");
  const [viewMode, setViewMode]     = useState("split");
  const [editorTheme, setEditorTheme] = useState("cs-mono-dark");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [autoRun, setAutoRun]       = useState(true);
  const [wordWrap, setWordWrap]     = useState(false);
  const [lineCol, setLineCol]       = useState("Ln 1, Col 1");
  const [status, setStatus]         = useState({ text:"READY", ok:true });
  const [toast, setToast]           = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [previewLabel, setPreviewLabel] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mobileView, setMobileView] = useState("editor");
  const [dropActive, setDropActive] = useState(false);
  const [previewMode, setPreviewMode] = useState("empty");
  const [jsonHTML, setJsonHTML]     = useState("");
  const [mdHTML, setMdHTML]         = useState("");
  const [textContent, setTextContent] = useState("");
  const [iframeSrc, setIframeSrc]   = useState("");
  const [iframeBlob, setIframeBlob] = useState(null);
  const [splitPct, setSplitPct]     = useState(50);

  const monacoRef    = useRef(null);
  const editorRef    = useRef(null);
  const containerRef = useRef(null);
  const autoRunTimer = useRef(null);
  const toastTimer   = useRef(null);
  const fileInputRef = useRef(null);
  const prevBlobRef  = useRef(null);
  const resizeRef    = useRef({ active:false });
  const splitRef     = useRef(null);
  const iframeRef    = useRef(null);
  const runPreviewRef = useRef(null);
  const copyCodeRef  = useRef(null);

  const T = dark ? UI_DARK : UI_LIGHT;
  const cBdr = `1px solid ${T.line}`;

  // ── TOAST ──
  const showToast = useCallback((msg) => {
    setToast(msg); setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2200);
  }, []);

  // ── MONACO INIT ──
  useEffect(() => {
    if (!containerRef.current || !window.require) return;
    window.require.config({ paths:{ vs:"https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs" } });
    window.require(["vs/editor/editor.main"], (monaco) => {
      monacoRef.current = monaco;

      EDITOR_THEMES.forEach(t => {
        const def = buildMonacoTheme(t.id);
        if (def) monaco.editor.defineTheme(t.id, { base:t.base, inherit:true, rules:def.rules, colors:def.colors });
      });

      const ed = monaco.editor.create(containerRef.current, {
        value: DEFAULTS.html,
        language: "html",
        theme: "cs-mono-dark",
        fontSize: 13,
        fontFamily: MONO,
        fontLigatures: false,
        lineHeight: 22,
        minimap: { enabled: true, scale: 1 },
        scrollBeyondLastLine: false,
        cursorBlinking: "solid",
        cursorSmoothCaretAnimation: "off",
        smoothScrolling: false,
        bracketPairColorization: { enabled: false },
        guides: { indentation: true },
        padding: { top: 12, bottom: 12 },
        renderWhitespace: "selection",
        wordWrap: "off",
        automaticLayout: true,
        scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
      });
      editorRef.current = ed;

      ed.onDidChangeCursorPosition(e => setLineCol(`Ln ${e.position.lineNumber}, Col ${e.position.column}`));
      ed.onDidChangeModelContent(() => {
        setStatus({ text:"EDITING…", ok:false });
        if (autoRun) {
          clearTimeout(autoRunTimer.current);
          autoRunTimer.current = setTimeout(() => runPreviewRef.current?.(), 700);
        }
      });
      ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runPreviewRef.current?.());
      ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC, () => copyCodeRef.current?.());

      setTimeout(() => runPreviewRef.current?.(), 500);
    });
    return () => editorRef.current?.dispose();
  }, []);

  // ── SYNC MONACO EDITOR THEME ──
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      monacoRef.current.editor.setTheme(editorTheme);
    }
  }, [editorTheme]);

  // ── WORD WRAP SYNC ──
  useEffect(() => {
    editorRef.current?.updateOptions({ wordWrap: wordWrap ? "on" : "off" });
  }, [wordWrap]);

  // ── IFRAME SRCDOC ──
  useEffect(() => {
    if (!iframeRef.current) return;
    if (iframeBlob && previewMode === "iframe" && !iframeSrc)
      iframeRef.current.srcdoc = iframeBlob;
  }, [iframeBlob, iframeSrc, previewMode]);

  // ── RUN PREVIEW ──
  const runPreview = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const code = ed.getValue();
    setStatus({ text:"RUNNING…", ok:false });

    if (["html","css","javascript","typescript","jsx","tsx"].includes(lang)) {
      let src = code;
      if (lang === "css") {
        src = `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;padding:24px;margin:0}*{box-sizing:border-box}</style>${code}</head><body><h1>Heading 1</h1><h2>Heading 2</h2><p>Paragraph with <a href="#">link</a>.</p><button>Button</button></body></html>`;
      } else if (["javascript","typescript","jsx","tsx"].includes(lang)) {
        const shim = `const _o=document.getElementById('out');const _l=(c,...a)=>{const d=document.createElement('div');d.className=c;d.textContent=a.map(x=>typeof x==='object'?JSON.stringify(x,null,2):String(x)).join(' ');_o.appendChild(d);};const console={log:(...a)=>_l('l',...a),error:(...a)=>_l('e',...a),warn:(...a)=>_l('w',...a),info:(...a)=>_l('l',...a)};try{(function(){\n${code}\n})();}catch(e){_l('e','Uncaught '+e.constructor.name+': '+e.message);}`;
        src = `<!DOCTYPE html><html><head><style>*{box-sizing:border-box}body{font-family:'JetBrains Mono',monospace;background:#0a0a0a;color:#f0f0f0;padding:16px;font-size:12.5px;line-height:1.8;margin:0}div{white-space:pre-wrap;word-break:break-all;padding:1px 0}.l{color:#aaa}.e{color:#f87171;background:#f8717110;padding:3px 6px;border-left:2px solid #f87171;margin:2px 0}.w{color:#fbbf24}</style></head><body><div id="out"></div><script>${shim}<\/script></body></html>`;
      }
      if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
      if (["javascript","typescript","jsx","tsx"].includes(lang)) {
        const blob = new Blob([src], { type:"text/html" });
        const url = URL.createObjectURL(blob);
        prevBlobRef.current = url;
        setIframeSrc(url);
        setIframeBlob(null);
      } else {
        prevBlobRef.current = null;
        setIframeSrc("");
        setIframeBlob(src);
      }
      setPreviewMode("iframe");
      setPreviewLabel(lang === "html" ? "HTML" : lang === "css" ? "CSS" : "JS CONSOLE");
      setTimeout(() => setStatus({ text:"READY", ok:true }), 300);

    } else if (lang === "json") {
      try {
        const parsed = JSON.parse(code);
        setJsonHTML(jsonToHTML(parsed));
        setPreviewMode("json");
        setPreviewLabel("JSON TREE");
        setStatus({ text:"VALID JSON", ok:true });
      } catch(e) {
        setJsonHTML(`<span class="je">JSON Error: ${escapeHTML(e.message)}</span>`);
        setPreviewMode("json");
        setStatus({ text:"JSON ERROR", ok:false });
      }
    } else if (lang === "markdown") {
      try {
        const html = window.marked ? window.marked.parse(code) : code;
        setMdHTML(html);
        setPreviewMode("markdown");
        setPreviewLabel("MARKDOWN");
        setStatus({ text:"RENDERED", ok:true });
      } catch {
        setMdHTML(code);
        setPreviewMode("markdown");
      }
    } else {
      setTextContent(code);
      setPreviewMode("text");
      setPreviewLabel(lang.toUpperCase());
      setStatus({ text:"READY", ok:true });
    }
  }, [lang]);

  useEffect(() => { runPreviewRef.current = runPreview; }, [runPreview]);

  // ── LANG CHANGE ──
  const changeLang = useCallback((newLang) => {
    setLang(newLang);
    const ed = editorRef.current;
    if (ed && monacoRef.current) {
      const monacoLang = ["jsx","tsx"].includes(newLang) ? "javascript" : newLang;
      monacoRef.current.editor.setModelLanguage(ed.getModel(), monacoLang);
    }
    const ext = LANGS.find(l => l.v === newLang)?.e || "txt";
    const base = fileName.replace(/\.[^.]+$/, "");
    setFileName(base + "." + ext);
    if (ed && ed.getValue().trim() === "" && DEFAULTS[newLang]) ed.setValue(DEFAULTS[newLang]);
    setTimeout(() => runPreviewRef.current?.(), 100);
  }, [fileName]);

  // ── FORMAT ──
  const formatCode = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;
    if (lang === "json") {
      try { ed.setValue(JSON.stringify(JSON.parse(ed.getValue()), null, 2)); showToast("JSON FORMATTED"); }
      catch { showToast("INVALID JSON"); }
      return;
    }
    ed.getAction("editor.action.formatDocument")?.run().then(() => showToast("FORMATTED"));
  }, [lang, showToast]);

  // ── COPY ──
  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(editorRef.current?.getValue() || "").then(() => showToast("COPIED"));
  }, [showToast]);
  useEffect(() => { copyCodeRef.current = copyCode; }, [copyCode]);

  // ── CLEAR ──
  const clearEditor = useCallback(() => {
    if (!editorRef.current) return;
    if (confirm("Clear editor?")) { editorRef.current.setValue(""); setPreviewMode("empty"); }
  }, []);

  // ── DOWNLOAD ──
  const downloadFile = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const blob = new Blob([ed.getValue()], { type:"text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
    showToast(`DOWNLOADED: ${fileName}`);
  }, [fileName, showToast]);

  // ── FILE LOAD ──
  const loadFile = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const ext = file.name.split(".").pop().toLowerCase();
      const nl = EXT_MAP[ext] || "plaintext";
      setFileName(file.name); setLang(nl);
      if (editorRef.current && monacoRef.current) {
        editorRef.current.setValue(e.target.result);
        const monacoLang = ["jsx","tsx"].includes(nl) ? "javascript" : nl;
        monacoRef.current.editor.setModelLanguage(editorRef.current.getModel(), monacoLang);
      }
      setTimeout(() => runPreviewRef.current?.(), 150);
      showToast(`OPENED: ${file.name}`);
    };
    reader.readAsText(file);
  }, [showToast]);

  // ── RESIZE HANDLE ──
  useEffect(() => {
    const onMove = (e) => {
      if (!resizeRef.current.active || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(80, Math.max(20, pct)));
      editorRef.current?.layout();
    };
    const onUp = () => { resizeRef.current.active = false; document.body.style.cursor = ""; document.body.style.userSelect = ""; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  // ── KEYBOARD ──
  useEffect(() => {
    const fn = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runPreviewRef.current?.(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "D") { e.preventDefault(); downloadFile(); }
      if (e.key === "Escape") setShowThemePicker(false);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [downloadFile]);

  const edPanelW = viewMode === "editor" ? "100%" : viewMode === "preview" ? "0%" : `${splitPct}%`;
  const pvPanelW = viewMode === "editor" ? "0%" : viewMode === "preview" ? "100%" : `${100 - splitPct}%`;

  // current editor theme meta
  const curThemeMeta = EDITOR_THEMES.find(t => t.id === editorTheme) || EDITOR_THEMES[0];

  const IcBtn=({ch,onClick,title,active,label,danger})=>(
    <button onClick={onClick} title={title}
      style={{display:"flex",alignItems:"center",gap:5,padding:"0 12px",height:"100%",background:active?T.bg4:"transparent",border:"none",borderRight:cBdr,color:active?T.bright:danger&&active?T.red:T.muted,cursor:"pointer",fontFamily:DISPLAY,fontSize:11,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",transition:"color .14s",whiteSpace:"nowrap",flexShrink:0}}
      onMouseEnter={e=>e.currentTarget.style.color=danger?T.red:T.bright}
      onMouseLeave={e=>e.currentTarget.style.color=active?T.bright:T.muted}>
      {ch&&<Ic ch={ch} size={12} color="currentColor" sw={1.8}/>}{label}
    </button>
  );

  return (
    <div style={{fontFamily:BODY,background:T.bg,color:T.body,height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <link href={FONTS_URL} rel="stylesheet"/>

      {/* grid bg */}
      <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0,opacity:dark?.035:.022}}>
        <defs><pattern id="csg" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0v48" fill="none" stroke={T.bright} strokeWidth=".6"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#csg)"/>
      </svg>

      {/* ── TOPBAR ──────────────────────────────────────────────── */}
      <div style={{position:"relative",zIndex:100,height:50,background:dark?"rgba(10,10,10,.96)":"rgba(245,245,245,.97)",borderBottom:cBdr,display:"flex",alignItems:"center",flexShrink:0,backdropFilter:"blur(20px)"}}>

        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 14px",borderRight:cBdr,height:"100%",flexShrink:0}}>
          <div style={{width:28,height:28,background:T.bright,display:"grid",placeItems:"center"}}>
            <span style={{fontFamily:MONO,fontSize:10,fontWeight:700,color:T.bg,letterSpacing:-1}}>&lt;/&gt;</span>
          </div>
          <span style={{fontFamily:DISPLAY,fontWeight:900,fontSize:15,letterSpacing:".1em",color:T.bright}}>CODESTUDIO</span>
          <span style={{fontFamily:MONO,fontSize:9,fontWeight:700,letterSpacing:".1em",color:T.muted,background:T.bg3,border:cBdr,padding:"2px 6px"}}>LIVE</span>
        </div>

        {/* File tab */}
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"0 14px",height:"100%",borderRight:cBdr,fontFamily:MONO,fontSize:11,color:T.muted,maxWidth:220,overflow:"hidden",flexShrink:0}}>
          <div style={{width:6,height:6,background:T.green,flexShrink:0}}/>
          <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fileName}</span>
        </div>

        <div style={{flex:1}}/>

        {/* Desktop actions */}
        <div className="cs-desk-act" style={{display:"flex",alignItems:"center",height:"100%",borderLeft:cBdr}}>
          <IcBtn ch={CH.open}    label="OPEN"    onClick={()=>fileInputRef.current?.click()} title="Open file"/>
          <IcBtn ch={CH.save}    label="SAVE"    onClick={downloadFile}                      title="Download (Ctrl+Shift+D)"/>
          <IcBtn ch={CH.format}  label="FORMAT"  onClick={formatCode}                        title="Format code"/>
          <IcBtn ch={CH.copy}    label="COPY"    onClick={copyCode}                          title="Copy (Ctrl+Shift+C)"/>
          <IcBtn ch={CH.clear}   label="CLEAR"   onClick={clearEditor}                       title="Clear editor" danger/>

          {/* Run — solid fill */}
          <button onClick={()=>runPreviewRef.current?.()}
            style={{display:"flex",alignItems:"center",gap:6,padding:"0 16px",height:"100%",background:T.bright,border:"none",borderLeft:cBdr,color:T.bg,cursor:"pointer",fontFamily:DISPLAY,fontSize:12,fontWeight:900,letterSpacing:".1em",flexShrink:0}}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill={T.bg}><polygon points="0,0 10,5 0,10"/></svg>
            RUN
          </button>

          {/* Theme toggle */}
          <button onClick={()=>setDark(d=>!d)}
            style={{width:48,height:"100%",background:"transparent",border:"none",borderLeft:cBdr,color:T.muted,cursor:"pointer",display:"grid",placeItems:"center",transition:"color .14s",flexShrink:0}}
            onMouseEnter={e=>e.currentTarget.style.color=T.bright}
            onMouseLeave={e=>e.currentTarget.style.color=T.muted}>
            <Ic ch={dark?CH.sun:CH.moon} size={14} color="currentColor" sw={1.8}/>
          </button>
        </div>

        {/* Mobile burger */}
        <button onClick={()=>setMobileMenu(v=>!v)} className="cs-burger"
          style={{display:"none",width:50,height:"100%",background:"transparent",border:"none",borderLeft:cBdr,color:T.muted,cursor:"pointer",placeItems:"center",flexShrink:0}}>
          <Ic ch={mobileMenu?CH.close:CH.menu} size={14} color="currentColor" sw={1.8}/>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileMenu && (
        <div style={{position:"relative",zIndex:99,background:T.bg2,borderBottom:cBdr,padding:12,display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {[["editor","EDITOR"],["preview","PREVIEW"]].map(([v,l])=>(
              <button key={v} onClick={()=>{setMobileView(v);setMobileMenu(false);}}
                style={{padding:"10px",background:mobileView===v?T.bright:"transparent",border:cBdr,color:mobileView===v?T.bg:T.body,cursor:"pointer",fontFamily:DISPLAY,fontSize:12,fontWeight:800,letterSpacing:".08em"}}>{l}</button>
            ))}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {[
              ["OPEN",    ()=>{fileInputRef.current?.click();setMobileMenu(false);}],
              ["SAVE",    ()=>{downloadFile();setMobileMenu(false);}],
              ["FORMAT",  ()=>{formatCode();setMobileMenu(false);}],
              ["COPY",    ()=>{copyCode();setMobileMenu(false);}],
              ["RUN",     ()=>{runPreviewRef.current?.();setMobileMenu(false);},true],
            ].map(([l,fn,primary])=>(
              <button key={l} onClick={fn}
                style={{flex:"1 1 70px",padding:"9px",background:primary?T.bright:"transparent",border:cBdr,color:primary?T.bg:T.body,cursor:"pointer",fontFamily:DISPLAY,fontSize:11,fontWeight:800,letterSpacing:".08em"}}>{l}</button>
            ))}
          </div>
          <button onClick={()=>{setDark(d=>!d);setMobileMenu(false);}}
            style={{padding:"9px",background:"transparent",border:cBdr,color:T.body,cursor:"pointer",fontFamily:DISPLAY,fontSize:11,fontWeight:800,letterSpacing:".08em",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <Ic ch={dark?CH.sun:CH.moon} size={12} color="currentColor" sw={1.8}/>{dark?"LIGHT MODE":"DARK MODE"}
          </button>
        </div>
      )}

      {/* ── TOOLBAR ─────────────────────────────────────────────── */}
      <div style={{position:"relative",zIndex:98,height:38,background:T.bg2,borderBottom:cBdr,display:"flex",alignItems:"center",flexShrink:0,overflowX:"auto"}}>

        {/* Lang selector */}
        <div style={{position:"relative",borderRight:cBdr,height:"100%",display:"flex",alignItems:"center",flexShrink:0}}>
          <select value={lang} onChange={e=>changeLang(e.target.value)}
            style={{height:"100%",padding:"0 28px 0 12px",background:T.bg2,border:"none",color:T.body,fontFamily:MONO,fontSize:11,cursor:"pointer",outline:"none",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23${dark?"888":"666"}'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center",flexShrink:0}}>
            {LANGS.map(l=><option key={l.v} value={l.v} style={{background:T.bg2}}>{l.l}</option>)}
          </select>
        </div>

        {/* Editor theme picker button */}
        <div style={{position:"relative",borderRight:cBdr,height:"100%",flexShrink:0}}>
          <button onClick={()=>setShowThemePicker(s=>!s)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"0 12px",height:"100%",background:showThemePicker?T.bg3:"transparent",border:"none",color:T.muted,cursor:"pointer",fontFamily:DISPLAY,fontSize:11,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",transition:"color .14s",whiteSpace:"nowrap"}}
            onMouseEnter={e=>e.currentTarget.style.color=T.bright}
            onMouseLeave={e=>e.currentTarget.style.color=showThemePicker?T.bright:T.muted}>
            <Ic ch={CH.palette} size={12} color="currentColor" sw={1.8}/>
            {curThemeMeta.label}
          </button>

          {/* Theme picker dropdown */}
          {showThemePicker && (
            <div style={{position:"absolute",top:"100%",left:0,zIndex:300,background:T.bg2,border:cBdr,borderTop:"none",width:200,maxHeight:320,overflowY:"auto"}}>
              {EDITOR_THEMES.map(t=>(
                <button key={t.id} onClick={()=>{setEditorTheme(t.id);setShowThemePicker(false);}}
                  style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"9px 12px",background:editorTheme===t.id?T.bg4:"transparent",border:"none",borderBottom:cBdr,color:editorTheme===t.id?T.bright:T.body,cursor:"pointer",fontFamily:DISPLAY,fontSize:11,fontWeight:800,letterSpacing:".07em",textTransform:"uppercase",textAlign:"left",transition:"background .1s"}}
                  onMouseEnter={e=>{if(editorTheme!==t.id)e.currentTarget.style.background=T.bg3;}}
                  onMouseLeave={e=>{if(editorTheme!==t.id)e.currentTarget.style.background="transparent";}}>
                  <span>{t.label}</span>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontFamily:MONO,fontSize:9,color:T.muted}}>{t.isDark?"●":"○"}</span>
                    {editorTheme===t.id&&<Ic ch={CH.check} size={11} color={T.green} sw={2.5}/>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View mode */}
        <div style={{display:"flex",height:"100%",borderRight:cBdr,flexShrink:0}} className="cs-view-btns">
          {[["split","SPLIT"],["editor","EDITOR"],["preview","PREVIEW"]].map(([v,l])=>(
            <button key={v} onClick={()=>{setViewMode(v);setTimeout(()=>editorRef.current?.layout(),50);}}
              style={{padding:"0 11px",height:"100%",border:"none",borderRight:cBdr,background:viewMode===v?T.bg4:"transparent",color:viewMode===v?T.bright:T.muted,cursor:"pointer",fontFamily:DISPLAY,fontSize:11,fontWeight:800,letterSpacing:".08em",transition:"all .14s",whiteSpace:"nowrap"}}
              onMouseEnter={e=>{if(viewMode!==v)e.currentTarget.style.color=T.body;}}
              onMouseLeave={e=>{if(viewMode!==v)e.currentTarget.style.color=T.muted;}}>
              {l}
            </button>
          ))}
        </div>

        {/* Word wrap toggle */}
        <button onClick={()=>setWordWrap(w=>!w)}
          style={{display:"flex",alignItems:"center",gap:6,padding:"0 12px",height:"100%",border:"none",borderRight:cBdr,background:wordWrap?T.bg4:"transparent",color:wordWrap?T.bright:T.muted,cursor:"pointer",fontFamily:DISPLAY,fontSize:11,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",transition:"all .14s",flexShrink:0}}>
          <Ic ch={CH.wrap} size={12} color="currentColor" sw={1.8}/>WRAP
        </button>

        {/* Spacer */}
        <div style={{flex:1}}/>

        {/* Auto-run + status */}
        <div style={{display:"flex",alignItems:"center",height:"100%",borderLeft:cBdr,flexShrink:0}}>
          <button onClick={()=>setAutoRun(a=>!a)}
            style={{display:"flex",alignItems:"center",gap:5,padding:"0 12px",height:"100%",border:"none",borderRight:cBdr,background:"transparent",color:autoRun?T.green:T.muted,cursor:"pointer",fontFamily:DISPLAY,fontSize:11,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",transition:"color .14s"}}>
            <div style={{width:6,height:6,background:autoRun?T.green:T.muted}}/>AUTO
          </button>
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"0 12px",height:"100%",fontFamily:MONO,fontSize:10,color:status.ok?T.green:T.amber}}>
            <div style={{width:5,height:5,background:status.ok?T.green:T.amber}}/>
            {status.text}
          </div>
        </div>
      </div>

      {/* ── WORKSPACE ───────────────────────────────────────────── */}
      <div ref={splitRef} style={{position:"relative",zIndex:1,flex:1,display:"flex",overflow:"hidden"}}>

        {/* Editor panel */}
        <div style={{width:edPanelW,display:"flex",flexDirection:"column",overflow:"hidden",borderRight:viewMode==="split"?cBdr:"none",transition:"width .15s",flexShrink:0}} className="cs-ed-panel">
          <div style={{height:34,background:T.bg2,borderBottom:cBdr,display:"flex",alignItems:"center",padding:"0 12px",gap:8,flexShrink:0}}>
            <span style={{fontFamily:DISPLAY,fontSize:10,fontWeight:800,letterSpacing:".12em",color:T.muted,textTransform:"uppercase"}}>EDITOR</span>
            <span style={{fontFamily:MONO,fontSize:10,color:T.muted}}>{lineCol}</span>
            <div style={{marginLeft:"auto",display:"flex",gap:0}}>
              {[
                [()=>editorRef.current?.trigger("","editor.foldAll",null),"FOLD ALL"],
                [()=>editorRef.current?.trigger("","editor.unfoldAll",null),"UNFOLD"],
              ].map(([fn,lbl])=>(
                <button key={lbl} onClick={fn}
                  style={{padding:"0 8px",height:34,background:"transparent",border:"none",borderLeft:cBdr,color:T.muted,cursor:"pointer",fontFamily:DISPLAY,fontSize:9,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",transition:"color .14s"}}
                  onMouseEnter={e=>e.currentTarget.style.color=T.bright}
                  onMouseLeave={e=>e.currentTarget.style.color=T.muted}>{lbl}</button>
              ))}
            </div>
          </div>
          <div
            ref={containerRef}
            style={{flex:1,minHeight:0,background:T.bg,position:"relative"}}
            onDragOver={e=>{e.preventDefault();setDropActive(true);}}
            onDragLeave={()=>setDropActive(false)}
            onDrop={e=>{e.preventDefault();setDropActive(false);const f=e.dataTransfer.files[0];if(f)loadFile(f);}}>
            {dropActive && (
              <div style={{position:"absolute",inset:0,background:T.bright+"1A",border:`2px dashed ${T.bright}`,display:"grid",placeItems:"center",fontSize:14,fontWeight:900,color:T.bright,zIndex:50,pointerEvents:"none",fontFamily:DISPLAY,letterSpacing:".1em"}}>
                DROP FILE TO OPEN
              </div>
            )}
          </div>
        </div>

        {/* Resize handle */}
        {viewMode==="split" && (
          <div
            onMouseDown={e=>{resizeRef.current.active=true;document.body.style.cursor="col-resize";document.body.style.userSelect="none";e.preventDefault();}}
            style={{width:4,background:T.line,cursor:"col-resize",flexShrink:0,zIndex:10,transition:"background .15s"}}
            onMouseEnter={e=>e.currentTarget.style.background=T.bright}
            onMouseLeave={e=>e.currentTarget.style.background=T.line}/>
        )}

        {/* Preview panel */}
        <div style={{width:pvPanelW,display:"flex",flexDirection:"column",overflow:"hidden",transition:"width .15s",flexShrink:0}} className="cs-pv-panel">
          <div style={{height:34,background:T.bg2,borderBottom:cBdr,display:"flex",alignItems:"center",padding:"0 12px",gap:8,flexShrink:0}}>
            <span style={{fontFamily:DISPLAY,fontSize:10,fontWeight:800,letterSpacing:".12em",color:T.muted,textTransform:"uppercase"}}>PREVIEW</span>
            {previewLabel && <span style={{fontFamily:MONO,fontSize:10,color:T.soft,background:T.bg3,border:cBdr,padding:"1px 6px"}}>{previewLabel}</span>}
            <div style={{marginLeft:"auto",display:"flex",gap:0}}>
              <button onClick={()=>runPreviewRef.current?.()}
                style={{padding:"0 8px",height:34,background:"transparent",border:"none",borderLeft:cBdr,color:T.muted,cursor:"pointer",fontFamily:DISPLAY,fontSize:9,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",transition:"color .14s"}}
                onMouseEnter={e=>e.currentTarget.style.color=T.bright}
                onMouseLeave={e=>e.currentTarget.style.color=T.muted}>REFRESH</button>
            </div>
          </div>

          <div style={{flex:1,minHeight:0,background:T.bg,position:"relative",overflow:"hidden"}}>
            {previewMode==="empty" && (
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,color:T.muted,fontFamily:DISPLAY}}>
                <div style={{width:44,height:44,border:cBdr,display:"grid",placeItems:"center"}}>
                  <Ic ch={CH.eye} size={18} color={T.muted} sw={1.4}/>
                </div>
                <div style={{fontSize:13,fontWeight:800,letterSpacing:".12em"}}>PREVIEW</div>
                <div style={{fontFamily:MONO,fontSize:10,color:T.muted}}>Press RUN or edit to refresh</div>
              </div>
            )}
            <iframe ref={iframeRef} src={iframeSrc||undefined} sandbox="allow-scripts allow-same-origin allow-forms"
              style={{width:"100%",height:"100%",border:"none",background:"#fff",display:previewMode==="iframe"?"block":"none"}}
              onLoad={()=>setStatus({text:"READY",ok:true})}/>
            {previewMode==="json" && (
              <div style={{width:"100%",height:"100%",overflow:"auto",padding:20,fontFamily:MONO,fontSize:12.5,lineHeight:1.8,color:T.bright}}>
                <div dangerouslySetInnerHTML={{__html:jsonHTML}}/>
                <style>{`.jk{color:${dark?"#AAAAAA":"#444444"}}.jstr{color:${dark?"#CCCCCC":"#555555"}}.jnum{color:${dark?"#888888":"#777777"}}.jb{color:${dark?"#BBBBBB":"#666666"}}.jn{color:${dark?"#666666":"#999999"}}.jbr{color:${dark?"#555555":"#AAAAAA"}}.jpunc{color:${dark?"#444444":"#BBBBBB"}}.je{color:${dark?"#F87171":"#DC2626"}}`}</style>
              </div>
            )}
            {previewMode==="markdown" && (
              <div style={{width:"100%",height:"100%",overflow:"auto",padding:"24px 28px",fontFamily:BODY,fontSize:14,lineHeight:1.8,color:T.bright,background:T.bg}}>
                <div className="cs-md" dangerouslySetInnerHTML={{__html:mdHTML}}/>
                <style>{`
                  .cs-md h1,.cs-md h2,.cs-md h3,.cs-md h4{font-family:${DISPLAY};font-weight:900;letter-spacing:.04em;color:${T.bright};margin:1.2em 0 .4em;text-transform:uppercase}
                  .cs-md h1{font-size:1.8em;border-bottom:1px solid ${T.line};padding-bottom:.3em}
                  .cs-md h2{font-size:1.4em}
                  .cs-md code{font-family:${MONO};background:${T.bg3};border:1px solid ${T.line};padding:1px 5px;font-size:.88em;color:${T.bright}}
                  .cs-md pre{background:${T.bg3};border:1px solid ${T.line};padding:16px;overflow:auto;margin:1em 0}
                  .cs-md pre code{background:none;border:none;padding:0}
                  .cs-md a{color:${T.bright};text-decoration:underline}
                  .cs-md blockquote{border-left:2px solid ${T.line2};padding-left:14px;color:${T.soft};margin:1em 0}
                  .cs-md table{border-collapse:collapse;width:100%;margin:1em 0}
                  .cs-md th,.cs-md td{border:1px solid ${T.line2};padding:7px 12px;font-size:13px}
                  .cs-md th{background:${T.bg3};font-family:${DISPLAY};font-weight:800;letter-spacing:.06em;font-size:12px;text-transform:uppercase}
                  .cs-md ul,.cs-md ol{padding-left:1.4em;margin:.5em 0}
                  .cs-md li{margin:.2em 0}
                  .cs-md hr{border:none;border-top:1px solid ${T.line};margin:1.5em 0}
                `}</style>
              </div>
            )}
            {previewMode==="text" && (
              <div style={{width:"100%",height:"100%",overflow:"auto",padding:20,fontFamily:MONO,fontSize:12,lineHeight:1.8,color:T.soft,whiteSpace:"pre-wrap",wordBreak:"break-all"}}>
                {textContent}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STATUS BAR ──────────────────────────────────────────── */}
      <div style={{position:"relative",zIndex:100,height:24,background:T.bg3,borderTop:cBdr,display:"flex",alignItems:"center",flexShrink:0}}>
        <span style={{padding:"0 12px",fontFamily:MONO,fontSize:9,color:T.muted,borderRight:cBdr}}>{lang.toUpperCase()}</span>
        <span style={{padding:"0 12px",fontFamily:MONO,fontSize:9,color:T.muted,borderRight:cBdr}}>{lineCol}</span>
        <span style={{padding:"0 12px",fontFamily:DISPLAY,fontSize:9,fontWeight:800,letterSpacing:".1em",color:T.muted,borderRight:cBdr,textTransform:"uppercase"}}>{curThemeMeta.label}</span>
        <div style={{flex:1}}/>
        <span style={{padding:"0 12px",fontFamily:MONO,fontSize:9,color:T.muted}}>Ctrl+Enter · Run &nbsp;|&nbsp; Ctrl+Shift+D · Save</span>
      </div>

      {/* ── TOAST ───────────────────────────────────────────────── */}
      <div style={{position:"fixed",bottom:36,left:"50%",transform:"translateX(-50%)",background:T.bright,color:T.bg,padding:"8px 18px",fontFamily:DISPLAY,fontSize:12,fontWeight:800,letterSpacing:".1em",opacity:toastVisible?1:0,pointerEvents:"none",transition:"opacity .2s",zIndex:9999,whiteSpace:"nowrap",border:cBdr}}>
        {toast}
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" style={{display:"none"}}
        accept=".html,.css,.js,.ts,.jsx,.tsx,.json,.xml,.yaml,.yml,.md,.txt,.py,.java,.cs,.cpp,.rs,.go,.swift,.kt,.php,.rb,.sh,.bash,.dockerfile,.gql,.graphql,.sql"
        onChange={e=>{const f=e.target.files[0];if(f)loadFile(f);e.target.value="";}}/>

      {/* ── GLOBAL CSS ─────────────────────────────────────────── */}
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.line3}}
        ::selection{background:${dark?"rgba(240,240,240,.18)":"rgba(10,10,10,.14)"}}
        select option{background:${T.bg2}}
        button,select,input{border-radius:0;outline:none}

        @media(max-width:700px){
          .cs-desk-act{display:none!important}
          .cs-burger{display:grid!important}
          .cs-view-btns{display:none!important}
          .cs-ed-panel,.cs-pv-panel{
            position:absolute!important;
            top:0;left:0;right:0;bottom:0;
            width:100%!important;
          }
          .cs-ed-panel{display:${mobileView==="editor"?"flex":"none"}!important}
          .cs-pv-panel{display:${mobileView==="preview"?"flex":"none"}!important}
        }
      `}</style>
    </div>
  );
}