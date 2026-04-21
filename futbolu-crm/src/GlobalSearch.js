import { useState, useEffect, useRef } from "react";

export const GlobalSearch = ({ players, leads, agents, onSelectPlayer, onSelectLead, onNavigate }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if((e.metaKey||e.ctrlKey) && e.key==="k") { e.preventDefault(); setOpen(true); ref.current?.querySelector("input")?.focus(); }
      if(e.key==="Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if(!query.trim()) {
    return (
      <div ref={ref} style={{ position:"relative" }}>
        <div onClick={()=>setOpen(true)} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:"#f5f0e8", border:"1px solid #e8e3db", borderRadius:10, cursor:"pointer", minWidth:200 }}>
          <span style={{ fontSize:14, color:"#9ca3af" }}>🔍</span>
          <span style={{ fontSize:13, color:"#9ca3af" }}>Buscar... (⌘K)</span>
        </div>
        {open&&<SearchDropdown query={query} setQuery={setQuery} players={players} leads={leads} agents={agents} onSelectPlayer={onSelectPlayer} onSelectLead={onSelectLead} onNavigate={onNavigate} onClose={()=>setOpen(false)}/>}
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} onFocus={()=>setOpen(true)}
        placeholder="Buscar atletas, leads, universidades..."
        style={{ padding:"8px 14px", background:"#f5f0e8", border:"1px solid #6366f1", borderRadius:10, fontSize:13, outline:"none", minWidth:260, fontFamily:"inherit", color:"#1a1a2e" }}/>
      {open&&<SearchDropdown query={query} setQuery={setQuery} players={players} leads={leads} agents={agents} onSelectPlayer={onSelectPlayer} onSelectLead={onSelectLead} onNavigate={onNavigate} onClose={()=>{ setOpen(false); setQuery(""); }}/>}
    </div>
  );
};

const SearchDropdown = ({ query, setQuery, players, leads, agents, onSelectPlayer, onSelectLead, onNavigate, onClose }) => {
  const q = query.toLowerCase().trim();

  const matchedPlayers = q.length>1 ? players.filter(p=>p.name?.toLowerCase().includes(q)||p.nationality?.toLowerCase().includes(q)||p.sport?.toLowerCase().includes(q)||p.university?.toLowerCase().includes(q)).slice(0,5) : [];
  const matchedLeads = q.length>1 ? leads.filter(l=>l.name?.toLowerCase().includes(q)||l.nationality?.toLowerCase().includes(q)||l.sport?.toLowerCase().includes(q)||l.email?.toLowerCase().includes(q)).slice(0,5) : [];

  const hasResults = matchedPlayers.length>0||matchedLeads.length>0;

  return (
    <div style={{ position:"absolute", top:"calc(100% + 8px)", left:0, right:0, background:"#fff", border:"1px solid #e8e3db", borderRadius:14, boxShadow:"0 8px 32px rgba(0,0,0,0.12)", zIndex:1000, minWidth:320, maxHeight:400, overflowY:"auto" }}>
      {q.length<=1&&<div style={{ padding:"20px 16px", textAlign:"center", color:"#9ca3af", fontSize:13 }}>Escribe para buscar...</div>}
      {q.length>1&&!hasResults&&<div style={{ padding:"20px 16px", textAlign:"center", color:"#9ca3af", fontSize:13 }}>Sin resultados para "{query}"</div>}

      {matchedPlayers.length>0&&<>
        <div style={{ padding:"10px 16px 6px", fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1 }}>Atletas</div>
        {matchedPlayers.map(p=>(
          <div key={p.id} onClick={()=>{ onSelectPlayer(p); onClose(); setQuery(""); }} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", cursor:"pointer", borderBottom:"1px solid #f9f7f4" }}
            onMouseEnter={e=>e.currentTarget.style.background="#f9f7f4"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{ width:32, height:32, borderRadius:8, background:"rgba(99,102,241,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
              {{"Soccer":"⚽","Tennis":"🎾","Golf":"⛳","Volleyball":"🏐","Track & Field":"🏃","Baseball":"⚾","Basketball":"🏀","Swimming":"🏊"}[p.sport]||"🏅"}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#1a1a2e" }}>{p.name}</div>
              <div style={{ fontSize:11, color:"#9ca3af" }}>{p.sport} · {p.nationality} · {p.status}</div>
            </div>
            <span style={{ fontSize:11, color:"#6366f1", fontWeight:600 }}>Atleta</span>
          </div>
        ))}
      </>}

      {matchedLeads.length>0&&<>
        <div style={{ padding:"10px 16px 6px", fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1 }}>Leads</div>
        {matchedLeads.map(l=>(
          <div key={l.id} onClick={()=>{ onSelectLead(l); onClose(); setQuery(""); }} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", cursor:"pointer", borderBottom:"1px solid #f9f7f4" }}
            onMouseEnter={e=>e.currentTarget.style.background="#f9f7f4"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{ width:32, height:32, borderRadius:8, background:"rgba(16,185,129,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
              {{"Soccer":"⚽","Tennis":"🎾","Golf":"⛳","Volleyball":"🏐","Track & Field":"🏃"}[l.sport]||"🎯"}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#1a1a2e" }}>{l.name}</div>
              <div style={{ fontSize:11, color:"#9ca3af" }}>{l.sport} · {l.nationality}{l.budget?` · $${Number(l.budget).toLocaleString()}`:""}</div>
            </div>
            <span style={{ fontSize:11, color:"#10b981", fontWeight:600 }}>Lead</span>
          </div>
        ))}
      </>}

      {/* Quick nav */}
      {q.length<=1&&<div style={{ padding:"10px 16px" }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Acceso rapido</div>
        {[["Jugadores","players"],["Leads","leads"],["Calendario","calendar"],["Reuniones","reuniones"],["Entrenadores","coaches"]].map(([l,id])=>(
          <div key={id} onClick={()=>{ onNavigate(id); onClose(); }} style={{ padding:"8px 10px", borderRadius:8, cursor:"pointer", fontSize:13, color:"#374151", marginBottom:2 }}
            onMouseEnter={e=>e.currentTarget.style.background="#f9f7f4"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            {l}
          </div>
        ))}
      </div>}
    </div>
  );
};
