import { useState } from 'react'
import { Link } from 'react-router-dom';
import './App.css'
import { useEffect, useRef, useMemo } from "react";
import { Routes, Route } from 'react-router-dom';
import TimeKitEnterprise from './../Pages/TimeKitEnterprise.jsx'

const TOOLS = [
  {
    id: "diffsnap",
    name: "DiffSnap",
    category: "Code",
    tagline: "Compare & merge text with precision",
    desc: "Line-by-line diff with character-level highlights, split, unified and merge editor views.",
    tags: ["diff", "merge", "compare"],
  },
  {
    id: "csvstudio",
    name: "CSVStudio",
    category: "Data",
    tagline: "View, edit and export any CSV file",
    desc: "Sort, filter, edit cells, reorder columns, column statistics, find & replace, export to JSON.",
    tags: ["csv", "table", "editor"],
  },
  {
    id: "tokenlens",
    name: "TokenLens",
    category: "AI",
    tagline: "Token counts and API costs across 31 models",
    desc: "BPE tokenizer, real-time pricing for OpenAI, Anthropic, Google and more. Context window usage.",
    tags: ["tokens", "ai", "cost"],
  },
  {
    id: "devpocket",
    name: "DevPocket",
    category: "Utils",
    tagline: "20 developer utilities in one place",
    desc: "JSON, JWT, Base64, URL encoder, UUID, password generator, color converter, markdown, cron.",
    tags: ["tools", "jwt", "uuid"],
  },
  {
    id: "timekitenterprise",
    name: "TimeKitEnterprise",
    category: "Utils",              // or whatever fits
    tagline: "Enterprise time tracking & scheduling",
    desc: "Advanced time management, team scheduling, clock interfaces, timers ,reporting.",
    route: "timekit",              // ← this is what you use
    tags: ["time", "schedule", "enterprise"]
  }
];

const CATS = ["All", "Code", "Data", "AI", "Utils"];

const Icon = ({ id, size = 18, color = "currentColor" }) => {
  const s = { display: "block", flexShrink: 0 };
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", style: s };
  switch (id) {
    case "menu": return <svg {...p}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
    case "close": return <svg {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
    case "sun": return <svg {...p}><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>;
    case "moon": return <svg {...p}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>;
    case "search": return <svg {...p}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
    case "arrow": return <svg {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
    case "diff": return <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="12" y2="17" /></svg>;
    case "csv": return <svg {...p}><rect x="3" y="3" width="18" height="18" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /></svg>;
    case "token": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /><polyline points="14 9 17 12 14 15" /></svg>;
    case "pocket": return <svg {...p}><path d="M4 3h16a2 2 0 012 2v6a10 10 0 01-20 0V5a2 2 0 012-2z" /><polyline points="8 10 12 14 16 10" /></svg>;
    case "check": return <svg {...p}><polyline points="20 6 9 17 4 12" /></svg>;
    case "github": return <svg {...p}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" /></svg>;
    case "grid": return <svg {...p}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
    case "list": return <svg {...p}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>;
    case "dot": return <svg {...p}><circle cx="12" cy="12" r="3" fill={color} stroke="none" /></svg>;
    default: return <svg {...p}><circle cx="12" cy="12" r="9" /></svg>;
  }
};

const TOOL_ICON = { diffsnap: "diff", csvstudio: "csv", tokenlens: "token", devpocket: "pocket" };

function Card({ tool, view, hovered, setHovered, D, mono }) {
  const isHov = hovered === tool.id;

  if (view === "list") return (

    <Link to={`/${tool.route}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(tool.id)}
        onMouseLeave={() => setHovered(null)}
        style={{
          display: "flex", alignItems: "center", gap: 20,
          padding: "20px 24px",
          borderBottom: `1px solid ${D.line}`,
          background: isHov ? D.surface : "transparent",
          transition: "background .15s",
          cursor: "pointer",
        }}
      >
        <div style={{ width: 36, height: 36, border: `1px solid ${D.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon id={TOOL_ICON[tool.id]} size={16} color={D.sub} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: D.text, letterSpacing: "-.2px" }}>{tool.name}</span>
            <span style={{ fontSize: 10, color: D.muted, fontFamily: mono, textTransform: "uppercase", letterSpacing: 1 }}>{tool.category}</span>
          </div>
          <div style={{ fontSize: 12, color: D.sub, lineHeight: 1.5 }}>{tool.tagline}</div>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: isHov ? D.text : "transparent", border: `1px solid ${D.line}`, color: isHov ? D.invText : D.sub, fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", transition: "all .15s", flexShrink: 0 }}>
          Launch <Icon id="arrow" size={12} color={isHov ? D.invText : D.sub} />
        </button>
      </div>
    </Link>
  );

  return (
    <Link to={`/${tool.route}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(tool.id)}
        onMouseLeave={() => setHovered(null)}
        style={{
          border: `1px solid ${isHov ? D.text : D.line}`,
          padding: "28px 24px",
          position: "relative",
          background: D.bg,
          transition: "border-color .2s",
          cursor: "pointer",
        }}
      >
        <div style={{ position: "absolute", top: 20, right: 20, fontSize: 9, fontWeight: 700, color: D.muted, fontFamily: mono, textTransform: "uppercase", letterSpacing: 1.2 }}>{tool.category}</div>
        <div style={{ width: 40, height: 40, border: `1px solid ${D.line}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Icon id={TOOL_ICON[tool.id]} size={18} color={D.sub} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: D.text, letterSpacing: "-.4px", marginBottom: 8 }}>{tool.name}</div>
        <div style={{ fontSize: 12, color: D.sub, lineHeight: 1.65, marginBottom: 20 }}>{tool.desc}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
          {tool.tags.map(tag => (
            <span key={tag} style={{ fontSize: 9, fontFamily: mono, color: D.muted, border: `1px solid ${D.line}`, padding: "3px 7px", letterSpacing: .5 }}>{tag}</span>
          ))}
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: isHov ? D.text : "transparent", border: `1px solid ${D.line}`, color: isHov ? D.invText : D.text, fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", transition: "all .18s", width: "100%", justifyContent: "space-between" }}>
          <span>Launch tool</span>
          <Icon id="arrow" size={13} color={isHov ? D.invBg : D.text} />
        </button>
      </div>
    </Link>
  );
}

function App() {
  const [dark, setDark] = useState(true);
  const [cat, setCat] = useState("All");
  const [view, setView] = useState("grid");
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [lineIdx, setLineIdx] = useState(0);

  // Ticker lines for hero
  const LINES = ["No login.", "No uploads.", "No tracking.", "100% in your browser."];
  useEffect(() => {
    const t = setInterval(() => setLineIdx(i => (i + 1) % LINES.length), 2200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close mobile nav on resize
  useEffect(() => {
    const fn = () => { if (window.innerWidth > 768) setMobileNav(false); };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const D = dark ? {
    bg: "#0A0A0A", surface: "#111111", line: "#222222",
    text: "#F0F0F0", sub: "#888888", muted: "#444444",
    inv: "#F0F0F0", invBg: "#0A0A0A", invText: "#0A0A0A",
  } : {
    bg: "#FAFAFA", surface: "#FFFFFF", line: "#E0E0E0",
    text: "#0A0A0A", sub: "#666666", muted: "#BBBBBB",
    inv: "#FFFFFF", invBg: "#0A0A0A", invText: "#F0F0F0",
  };

  const mono = "'JetBrains Mono','Cascadia Code',monospace";

  const filtered = useMemo(() =>
    TOOLS.filter(t => cat === "All" || t.category === cat),
    [cat]
  );



  return (
    <div style={{ fontFamily: "'DM Sans','Plus Jakarta Sans',system-ui,sans-serif", background: D.bg, minHeight: "100vh", color: D.text, position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: dark ? .04 : .06 }}>
          <defs>
            <pattern id="g1" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M60 0H0V60" fill="none" stroke={D.text} strokeWidth=".6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g1)" />
        </svg>

      </div>

      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        background: D.bg + (scrolled ? "F8" : "CC"),
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${scrolled ? D.line : "transparent"}`,
        height: 52,
        display: "flex", alignItems: "center",
        padding: "0 10rem",
        transition: "border-color .2s, background .2s",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 24, height: 24, background: D.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.bg} strokeWidth="2.5" strokeLinecap="round">
              <polyline points="4 17 10 11 4 5" /><line x1="13" y1="19" x2="21" y2="19" />
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-.3px", color: D.text }}>DevPocket</span>
        </div>

        {/* Desktop nav */}
        <nav style={{ display: "flex", gap: 0, marginLeft: 32, alignItems: "center" }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ padding: "4px 12px", background: "none", border: "none", color: cat === c ? D.text : D.sub, cursor: "pointer", fontSize: 13, fontWeight: cat === c ? 700 : 400, fontFamily: "inherit", borderBottom: `2px solid ${cat === c ? D.text : "transparent"}`, transition: "all .15s", height: 52 }}>
              {c}
            </button>
          ))}
        </nav>

        {/* Right controls */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {/* View toggle */}
          <div style={{ display: "flex", border: `1px solid ${D.line}` }}>
            {[["grid", "grid"], ["list", "list"]].map(([v, ic]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "5px 8px", background: view === v ? D.text : "none", border: "none", cursor: "pointer", display: "flex", borderLeft: v === "list" ? `1px solid ${D.line}` : "none" }}>
                <Icon id={ic} size={14} color={view === v ? D.bg : D.sub} />
              </button>
            ))}
          </div>

          {/* Theme */}
          <button onClick={() => setDark(d => !d)} style={{ width: 32, height: 32, border: `1px solid ${D.line}`, background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon id={dark ? "sun" : "moon"} size={15} color={D.sub} />
          </button>

          {/* Mobile menu */}
          <button onClick={() => setMobileNav(v => !v)} style={{ width: 32, height: 32, border: `1px solid ${D.line}`, background: "none", cursor: "pointer", display: "none", alignItems: "center", justifyContent: "center", className: "mob-btn" }}>
            <Icon id={mobileNav ? "close" : "menu"} size={15} color={D.text} />
          </button>
        </div>
      </header>

      {mobileNav && (
        <div style={{ position: "fixed", top: 52, left: 0, right: 0, zIndex: 190, background: D.bg, borderBottom: `1px solid ${D.line}`, animation: "slideDown .2s both" }}>
          {CATS.map(c => (
            <button key={c} onClick={() => { setCat(c); setMobileNav(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "14px 24px", background: "none", border: "none", borderBottom: `1px solid ${D.line}`, color: cat === c ? D.text : D.sub, fontSize: 15, fontWeight: cat === c ? 700 : 400, fontFamily: "inherit", cursor: "pointer" }}>
              {c}
              {cat === c && <span style={{ marginLeft: 8, fontSize: 10, color: D.muted, fontFamily: mono }}>●</span>}
            </button>
          ))}
          <div style={{ padding: "12px 24px", display: "flex", gap: 10 }}>
            <button onClick={() => setDark(d => !d)} style={{ flex: 1, padding: "10px", border: `1px solid ${D.line}`, background: "none", color: D.sub, fontSize: 13, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <Icon id={dark ? "sun" : "moon"} size={14} color={D.sub} />
              {dark ? "Light" : "Dark"} mode
            </button>
          </div>
        </div>
      )}

      <section style={{ position: "relative", zIndex: 1, paddingTop: 120, paddingBottom: 64, paddingLeft: 24, paddingRight: 24, maxWidth: 960, margin: "0 auto" }}>

        {/* Ticker pill */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28, height: 28, overflow: "hidden" }}>
          <div style={{ width: 6, height: 6, background: D.text, flexShrink: 0 }} />
          <div style={{ fontSize: 11, fontFamily: mono, color: D.sub, letterSpacing: .5, animation: "tickUp .3s both", key: lineIdx }}>
            {LINES[lineIdx]}
          </div>
        </div>

        {/* Big headline */}
        <h1 style={{ margin: "0 0 24px", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-3px", color: D.text, animation: "up .5s .05s both" }}>
          <span style={{ display: "block", fontSize: "clamp(44px, 9vw, 96px)" }}>Developer</span>
          <span style={{ display: "block", fontSize: "clamp(44px, 9vw, 96px)" }}>tools that</span>
          <span style={{ display: "block", fontSize: "clamp(44px, 9vw, 96px)", color: D.sub }}>just work.</span>
        </h1>

        <p style={{ margin: "0 0 40px", fontSize: 15, color: D.sub, lineHeight: 1.8, fontWeight: 400, animation: "up .5s .12s both", textAlign: "center" }}>
          Four focused utilities — DiffSnap, CSVStudio, TokenLens, DevPocket — each one sharp, client-side, and free.
        </p>

        {/* CTA row */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 64, animation: "up .5s .18s both", alignItems: "center", justifyContent: "center" }}>
          <button onClick={() => document.getElementById("tools").scrollIntoView({ behavior: "smooth" })}
            style={{ display: "flex", alignItems: "center", gap: 9, color: D.invText, padding: "12px 22px", background: D.text, border: "none", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", transition: "opacity .15s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            Browse tools <Icon id="arrow" size={14} color={D.invText} />
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 22px", background: "none", border: `1px solid ${D.line}`, color: D.sub, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", transition: "border-color .15s, color .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = D.text; e.currentTarget.style.color = D.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = D.line; e.currentTarget.style.color = D.sub; }}>
            <Icon id="github" size={14} color="currentColor" /> GitHub
          </button>
        </div>

        {/* Stat bar */}
        <div style={{ display: "flex", gap: 0, borderTop: `1px solid ${D.line}`, animation: "up .5s .24s both" }}>
          {[["4", "Live tools"], ["31", "AI models"], ["0", "Sign-ins"], ["100%", "Private"]].map(([v, l], i) => (
            <div key={l} style={{ flex: 1, padding: "20px 0", borderRight: i < 3 ? `1px solid ${D.line}` : "none", paddingLeft: i === 0 ? 0 : 20 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: D.text, fontFamily: mono, letterSpacing: "-1px", lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 10, color: D.muted, marginTop: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="tools" style={{ position: "relative", zIndex: 1, padding: "0 24px 80px", maxWidth: 960, margin: "0 auto" }}>

        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${D.line}` }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: D.text, textTransform: "uppercase", letterSpacing: 1.5 }}>Tools</span>
            <span style={{ fontSize: 11, color: D.muted, fontFamily: mono }}>{filtered.length}</span>
          </div>
          {/* Desktop category pills */}
          <div style={{ display: "flex", gap: 2 }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                style={{ padding: "4px 10px", background: cat === c ? D.text : "none", border: `1px solid ${cat === c ? D.text : D.line}`, color: cat === c ? D.invText : D.sub, cursor: "pointer", fontSize: 11, fontWeight: cat === c ? 700 : 400, fontFamily: "inherit", transition: "all .14s" }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {view === "grid"
          ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 1, border: `1px solid ${D.line}` }}>
            {filtered.map((t, i) => <Card key={t.id} tool={t} view={view} hovered={hovered} setHovered={setHovered} D={D} mono={mono} />)}
          </div>
          : <div style={{ border: `1px solid ${D.line}` }}>
            {filtered.map((t, i) => <Card key={t.id} tool={t} view={view} hovered={hovered} setHovered={setHovered} D={D} mono={mono} />)}
          </div>
        }
      </section>

      <section style={{ position: "relative", zIndex: 1, padding: "48px 24px", borderTop: `1px solid ${D.line}`, maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>About</div>
            <p style={{ fontSize: 14, color: D.sub, lineHeight: 1.85, margin: 0 }}>
              DevPocket Hub is a collection of focused developer utilities built for speed and privacy. Every tool runs entirely in your browser — no data is ever sent to a server.
            </p>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Principles</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Client-side only — nothing leaves your machine", "No accounts, no sessions, no tracking", "Fast, focused, single-purpose tools", "Works offline after first load"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: D.sub }}>
                  <Icon id="check" size={14} color={D.muted} />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer style={{ position: "relative", zIndex: 1, borderTop: `1px solid ${D.line}` }}>

        {/* Main footer */}
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "36px 24px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40 }}>

          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 22, height: 22, background: D.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={D.bg} strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="4 17 10 11 4 5" /><line x1="13" y1="19" x2="21" y2="19" />
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: D.text, letterSpacing: "-.2px" }}>DevPocket Hub</span>
            </div>
            <p style={{ fontSize: 12, color: D.sub, lineHeight: 1.75, margin: "0 0 16px" }}>
              Developer tools that respect your privacy. Free, fast, and open.
            </p>
            <a href="https://sweathkumar.com" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: D.sub, textDecoration: "none", borderBottom: `1px solid ${D.line}`, paddingBottom: 1, transition: "color .15s, border-color .15s" }}
              onMouseEnter={e => { e.currentTarget.style.color = D.text; e.currentTarget.style.borderColor = D.text; }}
              onMouseLeave={e => { e.currentTarget.style.color = D.sub; e.currentTarget.style.borderColor = D.line; }}>
              sweathkumar.com →
            </a>
          </div>

          {/* Tools */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Tools</div>
            {TOOLS.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.querySelector("span").style.color = D.text}
                onMouseLeave={e => e.currentTarget.querySelector("span").style.color = D.sub}>
                <div style={{ width: 4, height: 4, background: D.muted, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: D.sub, transition: "color .13s" }}>{t.name}</span>
              </div>
            ))}
          </div>

          {/* Links */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Links</div>
            {[["GitHub", "#"], ["Changelog", "#"], ["Suggest a tool", "#"], ["Report a bug", "#"]].map(([l, h]) => (
              <div key={l} style={{ padding: "5px 0" }}>
                <a href={h} style={{ fontSize: 12, color: D.sub, textDecoration: "none", transition: "color .13s" }}
                  onMouseEnter={e => e.currentTarget.style.color = D.text}
                  onMouseLeave={e => e.currentTarget.style.color = D.sub}>
                  {l}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: `1px solid ${D.line}`, padding: "14px 24px", maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 11, color: D.muted, fontFamily: mono }}>© 2025 sweathkumar.com</span>
          <div style={{ display: "flex", gap: 16 }}>
            {["No login", "No data", "No tracking"].map(t => (
              <span key={t} style={{ fontSize: 11, color: D.muted, display: "flex", alignItems: "center", gap: 5 }}>
                <Icon id="check" size={11} color={D.muted} /> {t}
              </span>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes up { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
        @keyframes tickUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:none } }
        * { box-sizing:border-box }
        ::-webkit-scrollbar { width:4px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:${D.line} }
        ::selection { background:${D.text}28 }
        input::placeholder { color:${D.muted} }

        @media (max-width: 768px) {
          header nav { display:none !important }
          .mob-btn { display:flex !important }
          #tools > div:last-child { grid-template-columns:1fr !important }
          footer > div:first-child { grid-template-columns:1fr !important; gap:28px !important }
          section:first-of-type { padding-top:80px !important }
        }
        @media (max-width: 540px) {
          h1 span { letter-spacing:-1.5px !important }
          section > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns:1fr !important }
        }
      `}</style>
    </div>
  );
}

export default App
