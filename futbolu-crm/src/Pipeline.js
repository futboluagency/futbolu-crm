import { useState } from "react";
import { supabase } from "./supabase";

const STAGES = [
  { id:"new", label:"Nuevo", color:"#9ca3af", bg:"#f9f7f4" },
  { id:"contacted", label:"Contactado", color:"#6366f1", bg:"#f0f0ff" },
  { id:"eligible", label:"Elegible", color:"#10b981", bg:"#f0fdf4" },
  { id:"next_year", label:"Proximo año", color:"#f59e0b", bg:"#fffbeb" },
  { id:"in_progress", label:"En proceso", color:"#3b82f6", bg:"#eff6ff" },
  { id:"signed", label:"Firmado", color:"#22c55e", bg:"#f0fdf4" },
];

export const Pipeline = ({ leads, players, onLeadClick, onPlayerClick, onRefresh, isAdmin, myAgentName }) => {
  const [view, setView] = useState("leads"); // leads | players
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  // Map leads to pipeline stages using follow_up_status
  const getLeadStage = (lead) => lead.follow_up_status || "new";

  // Map players to pipeline stages using status
  const getPlayerStage = (player) => {
    const map = {
      "Prospect": "new",
      "In Process": "in_progress",
      "Scholarship": "signed",
      "Inactive": "new",
    };
    return map[player.status] || "new";
  };

  const items = view === "leads" ? leads : players;
  const getStage = view === "leads" ? getLeadStage : getPlayerStage;

  const handleDrop = async (stageId, e) => {
    e.preventDefault();
    if(!dragging) return;
    setDragOver(null);

    if(view === "leads") {
      await supabase.from("leads").update({ follow_up_status: stageId }).eq("id", dragging.id);
    } else {
      const statusMap = { new:"Prospect", contacted:"Prospect", eligible:"Prospect", in_progress:"In Process", signed:"Scholarship", next_year:"Prospect" };
      await supabase.from("players").update({ status: statusMap[stageId]||"Prospect" }).eq("id", dragging.id);
    }
    await onRefresh();
    setDragging(null);
  };

  const SPORTS_ICON = { Soccer:"⚽", Tennis:"🎾", Golf:"⛳", Volleyball:"🏐", "Track & Field":"🏃", Baseball:"⚾", Basketball:"🏀", Swimming:"🏊" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#1a1a2e", letterSpacing:-0.3 }}>Pipeline</h1>
          <p style={{ color:"#6b7280", fontSize:13, marginTop:3 }}>Vista Kanban — arrastra para cambiar estado</p>
        </div>
        <div style={{ display:"flex", gap:6, background:"#f5f0e8", borderRadius:10, padding:3 }}>
          {[{id:"leads",l:"Leads"},{id:"players",l:"Atletas"}].map(v=>(
            <button key={v.id} onClick={()=>setView(v.id)} style={{ padding:"7px 18px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:view===v.id?700:500, background:view===v.id?"#fff":"transparent", color:view===v.id?"#1a1a2e":"#9ca3af", fontFamily:"inherit", boxShadow:view===v.id?"0 1px 4px rgba(0,0,0,0.08)":"none" }}>{v.l} ({(view===v.id?items:view==="leads"?players:leads).length})</button>
          ))}
        </div>
      </div>

      {/* Kanban board */}
      <div style={{ display:"grid", gridTemplateColumns:`repeat(${STAGES.length},1fr)`, gap:10, overflowX:"auto", paddingBottom:8 }}>
        {STAGES.map(stage => {
          const stageItems = items.filter(i => getStage(i) === stage.id);
          const isDragTarget = dragOver === stage.id;
          return (
            <div key={stage.id}
              onDragOver={e=>{ e.preventDefault(); setDragOver(stage.id); }}
              onDragLeave={()=>setDragOver(null)}
              onDrop={e=>handleDrop(stage.id, e)}
              style={{ minWidth:160, background:isDragTarget?"#f0ebe3":"#f9f7f4", borderRadius:12, border:`2px solid ${isDragTarget?stage.color:"#e8e3db"}`, padding:"12px 10px", minHeight:400, transition:"all .15s" }}>

              {/* Column header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:stage.color, textTransform:"uppercase", letterSpacing:0.8 }}>{stage.label}</div>
                <div style={{ width:22, height:22, borderRadius:"50%", background:stage.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>{stageItems.length}</div>
              </div>

              {/* Cards */}
              {stageItems.map(item => (
                <div key={item.id}
                  draggable
                  onDragStart={()=>setDragging(item)}
                  onDragEnd={()=>setDragging(null)}
                  onClick={()=>view==="leads"?onLeadClick(item):onPlayerClick(item)}
                  style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:10, padding:"12px", marginBottom:8, cursor:"grab", boxShadow:"0 1px 3px rgba(0,0,0,0.05)", opacity:dragging?.id===item.id?0.5:1, transition:"all .1s" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:stage.bg, border:`1px solid ${stage.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                      {SPORTS_ICON[item.sport]||"🏅"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</div>
                      <div style={{ fontSize:10, color:"#9ca3af" }}>{item.nationality||"—"}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {item.sport&&<span style={{ padding:"2px 7px", borderRadius:20, background:stage.bg, color:stage.color, fontSize:10, fontWeight:600 }}>{item.sport}</span>}
                    {(item.budget||item.totalFee)&&<span style={{ padding:"2px 7px", borderRadius:20, background:"rgba(16,185,129,0.08)", color:"#10b981", fontSize:10, fontWeight:600 }}>{item.budget?`$${Number(item.budget).toLocaleString()}`:item.totalFee?`${item.totalFee}€`:""}</span>}
                  </div>
                  {view==="leads"&&item.referred_by&&<div style={{ fontSize:10, color:"#9ca3af", marginTop:6 }}>Ref: {item.referred_by}</div>}
                  {view==="players"&&item.agent&&<div style={{ fontSize:10, color:"#9ca3af", marginTop:6 }}>{item.agent}</div>}
                </div>
              ))}

              {stageItems.length===0&&<div style={{ textAlign:"center", padding:"20px 8px", color:"#d1cfc7", fontSize:12 }}>Sin {view==="leads"?"leads":"atletas"}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
