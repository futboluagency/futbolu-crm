import { useState } from "react";
import { supabase } from "./supabase";

const LEAD_STAGES = [
  { id:"new", label:"Nuevo lead", color:"#9ca3af", desc:"Recien llegado" },
  { id:"contacted", label:"Contactado", color:"#6366f1", desc:"Primera toma de contacto" },
  { id:"eligible", label:"Elegible", color:"#10b981", desc:"Perfil valido" },
  { id:"not_eligible", label:"No elegible", color:"#ef4444", desc:"No cumple requisitos" },
  { id:"next_year", label:"Proximo año", color:"#f59e0b", desc:"Seguimiento futuro" },
  { id:"in_progress", label:"En proceso", color:"#3b82f6", desc:"Tramites en curso" },
  { id:"signed", label:"Firmado", color:"#22c55e", desc:"Contrato firmado" },
];

const PLAYER_STAGES = [
  { id:"search", label:"Buscando ofertas", color:"#6366f1", desc:"Enviando perfiles" },
  { id:"offers", label:"Ofertas recibidas", color:"#f59e0b", desc:"Universidades interesadas" },
  { id:"admission", label:"Proceso admision", color:"#3b82f6", desc:"Tramites admision" },
  { id:"visa", label:"Visado", color:"#8b5cf6", desc:"Tramites de visado" },
  { id:"scholarship", label:"Becado", color:"#22c55e", desc:"Beca confirmada" },
];

const SPORTS_ICON = { Soccer:"⚽", Tennis:"🎾", Golf:"⛳", Volleyball:"🏐", "Track & Field":"🏃", Baseball:"⚾", Basketball:"🏀", Swimming:"🏊" };

export const Pipeline = ({ leads, players, onLeadClick, onPlayerClick, onRefresh, isAdmin, myAgentName }) => {
  const [view, setView] = useState("leads");
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const stages = view==="leads" ? LEAD_STAGES : PLAYER_STAGES;

  const getLeadStage = (lead) => lead.follow_up_status||"new";
  const getPlayerStage = (player) => {
    if(player.status==="Scholarship") return "scholarship";
    if(player.status==="In Process") return "admission";
    return "search";
  };
  const getStage = view==="leads" ? getLeadStage : getPlayerStage;
  const items = view==="leads" ? leads : players;

  const handleDrop = async (stageId, e) => {
    e.preventDefault();
    if(!dragging||dragOver===null) return;
    setDragOver(null);
    if(view==="leads") {
      const { error } = await supabase.from("leads").update({ follow_up_status:stageId }).eq("id",dragging.id);
      if(error) { alert(error.message); return; }
    } else {
      const statusMap = { search:"Prospect", offers:"Prospect", admission:"In Process", visa:"In Process", scholarship:"Scholarship" };
      const { error } = await supabase.from("players").update({ status:statusMap[stageId]||"Prospect" }).eq("id",dragging.id);
      if(error) { alert(error.message); return; }
    }
    await onRefresh();
    setDragging(null);
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#1a1a2e" }}>Pipeline</h1>
          <p style={{ color:"#6b7280", fontSize:13, marginTop:3 }}>Arrastra las tarjetas para cambiar el estado</p>
        </div>
        <div style={{ display:"flex", gap:6, background:"#f5f0e8", borderRadius:10, padding:3 }}>
          {[{id:"leads",l:`Leads (${leads.length})`},{id:"players",l:`Atletas (${players.length})`}].map(v=>(
            <button key={v.id} onClick={()=>setView(v.id)} style={{ padding:"7px 18px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:view===v.id?700:500, background:view===v.id?"#fff":"transparent", color:view===v.id?"#1a1a2e":"#9ca3af", fontFamily:"inherit", boxShadow:view===v.id?"0 1px 4px rgba(0,0,0,0.08)":"none" }}>{v.l}</button>
          ))}
        </div>
      </div>

      {/* Stage description bar */}
      <div style={{ display:"grid", gridTemplateColumns:`repeat(${stages.length},1fr)`, gap:8, marginBottom:12 }}>
        {stages.map(s=>(
          <div key={s.id} style={{ textAlign:"center", padding:"6px 4px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:s.color, marginBottom:2 }}>{s.label}</div>
            <div style={{ fontSize:10, color:"#9ca3af" }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Kanban columns */}
      <div style={{ display:"grid", gridTemplateColumns:`repeat(${stages.length},1fr)`, gap:10, overflowX:"auto", paddingBottom:8 }}>
        {stages.map(stage => {
          const stageItems = items.filter(i=>getStage(i)===stage.id);
          const isDragTarget = dragOver===stage.id;
          return (
            <div key={stage.id}
              onDragOver={e=>{ e.preventDefault(); setDragOver(stage.id); }}
              onDragLeave={e=>{ if(!e.currentTarget.contains(e.relatedTarget)) setDragOver(null); }}
              onDrop={e=>handleDrop(stage.id,e)}
              style={{ minWidth:150, background:isDragTarget?"#f0ebe3":"#f9f7f4", borderRadius:12, border:`2px solid ${isDragTarget?stage.color:"#e8e3db"}`, padding:"10px 8px", minHeight:350, transition:"all .15s" }}>

              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, padding:"0 4px" }}>
                <div style={{ fontSize:11, fontWeight:700, color:stage.color, textTransform:"uppercase", letterSpacing:0.6 }}>{stage.label}</div>
                <div style={{ width:20, height:20, borderRadius:"50%", background:stage.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#fff" }}>{stageItems.length}</div>
              </div>

              {/* Cards */}
              {stageItems.map(item=>(
                <div key={item.id}
                  draggable
                  onDragStart={()=>setDragging(item)}
                  onDragEnd={()=>{ setDragging(null); setDragOver(null); }}
                  onClick={()=>view==="leads"?onLeadClick(item):onPlayerClick(item)}
                  style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:10, padding:"10px", marginBottom:8, cursor:"grab", boxShadow:"0 1px 3px rgba(0,0,0,0.05)", opacity:dragging?.id===item.id?0.4:1, borderLeft:`3px solid ${stage.color}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                    <span style={{ fontSize:16 }}>{SPORTS_ICON[item.sport]||"🏅"}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</div>
                      <div style={{ fontSize:10, color:"#9ca3af" }}>{item.nationality||"—"}</div>
                    </div>
                  </div>
                  {item.sport&&<span style={{ fontSize:10, fontWeight:600, color:stage.color, background:`${stage.color}12`, padding:"2px 7px", borderRadius:20 }}>{item.sport}</span>}
                  {view==="leads"&&item.budget&&<div style={{ fontSize:11, color:"#10b981", fontWeight:700, marginTop:5 }}>${Number(item.budget).toLocaleString()}</div>}
                  {view==="leads"&&item.referred_by&&<div style={{ fontSize:10, color:"#9ca3af", marginTop:4 }}>Ref: {item.referred_by}</div>}
                  {view==="players"&&item.agent&&<div style={{ fontSize:10, color:"#9ca3af", marginTop:4 }}>{item.agent}</div>}
                  {view==="players"&&item.university&&<div style={{ fontSize:10, color:"#6366f1", fontWeight:600, marginTop:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.university}</div>}
                </div>
              ))}
              {stageItems.length===0&&<div style={{ textAlign:"center", padding:"20px 8px", color:"#d1cfc7", fontSize:11, border:"2px dashed #e8e3db", borderRadius:8, marginTop:8 }}>Arrastra aqui</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
