import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const CHANNELS = [
  { id:"general", label:"General", desc:"Todo el equipo" },
  { id:"latam", label:"LATAM", desc:"Equipo LATAM" },
  { id:"fua", label:"FUA Sports", desc:"Departamentos FUA" },
  { id:"closers", label:"Closers", desc:"CEOs y closers" },
];

export const TeamChat = ({ profile, isAdmin }) => {
  const [channel, setChannel] = useState("general");
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [annForm, setAnnForm] = useState({ title:"", body:"", pinned:false });
  const [showAnnForm, setShowAnnForm] = useState(false);
  const msgEndRef = useRef(null);

  useEffect(() => { loadMessages(); loadAnnouncements(); }, [channel]);
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  // Poll every 10 seconds for new messages
  useEffect(() => {
    const interval = setInterval(() => { loadMessages(); }, 10000);
    return () => clearInterval(interval);
  }, [channel]);

  const loadMessages = async () => {
    const { data } = await supabase.from("team_messages").select("*")
      .eq("channel", channel).order("created_at").limit(100);
    setMessages(data||[]);
  };

  const loadAnnouncements = async () => {
    const { data } = await supabase.from("announcements").select("*").order("pinned", { ascending:false }).order("created_at", { ascending:false }).limit(10);
    setAnnouncements(data||[]);
  };

  const sendMessage = async () => {
    if(!newMsg.trim()) return;
    setSending(true);
    const { error } = await supabase.from("team_messages").insert({
      message: newMsg.trim(),
      sender_name: profile?.name||"Usuario",
      sender_role: isAdmin?"CEO":profile?.role==="latam_director"?"Director LATAM":"Reclutador",
      sender_email: profile?.email||"",
      channel,
    });
    if(error) { alert(`Error: ${error.message}`); setSending(false); return; }
    setNewMsg("");
    await loadMessages();
    setSending(false);
  };

  const createAnnouncement = async () => {
    if(!annForm.title.trim()) return;
    await supabase.from("announcements").insert({ ...annForm, created_by: profile?.name||"CEO" });
    setAnnForm({ title:"", body:"", pinned:false });
    setShowAnnForm(false);
    await loadAnnouncements();
  };

  const deleteAnn = async (id) => {
    await supabase.from("announcements").delete().eq("id", id);
    await loadAnnouncements();
  };

  const timeStr = (d) => {
    const dt = new Date(d);
    const now = new Date();
    const diff = now - dt;
    if(diff < 60000) return "Ahora";
    if(diff < 3600000) return `${Math.floor(diff/60000)}m`;
    if(diff < 86400000) return `${Math.floor(diff/3600000)}h`;
    return dt.toLocaleDateString("es-ES", { day:"numeric", month:"short" });
  };

  const ROLE_COLORS = { CEO:"#6366f1", "Director LATAM":"#10b981", Reclutador:"#f59e0b" };
  const inp = { background:"#f9f7f4", border:"1px solid #e5e0d8", borderRadius:8, padding:"9px 12px", color:"#1a1a2e", fontSize:13, outline:"none", fontFamily:"inherit" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#1a1a2e" }}>Chat del equipo</h1>
          <p style={{ color:"#6b7280", fontSize:13, marginTop:3 }}>Comunicacion interna entre CEOs y reclutadores</p>
        </div>
        {isAdmin&&<button onClick={()=>setShowAnnForm(!showAnnForm)} style={{ padding:"9px 16px", borderRadius:9, border:"none", background:"#1a1a2e", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>+ Anuncio</button>}
      </div>

      {/* Announcements */}
      {announcements.length>0&&(
        <div style={{ marginBottom:16 }}>
          {announcements.map(ann=>(
            <div key={ann.id} style={{ background:ann.pinned?"rgba(99,102,241,0.06)":"#fff", border:`1px solid ${ann.pinned?"rgba(99,102,241,0.2)":"#e8e3db"}`, borderRadius:12, padding:"14px 18px", marginBottom:8, display:"flex", gap:12 }}>
              {ann.pinned&&<div style={{ fontSize:16, flexShrink:0 }}>📌</div>}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#1a1a2e", marginBottom:4 }}>{ann.title}</div>
                {ann.body&&<div style={{ fontSize:13, color:"#374151", lineHeight:1.5 }}>{ann.body}</div>}
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:6 }}>{ann.created_by} · {timeStr(ann.created_at)}</div>
              </div>
              {isAdmin&&<button onClick={()=>deleteAnn(ann.id)} style={{ background:"none", border:"none", color:"#d1cfc7", cursor:"pointer", fontSize:16, flexShrink:0 }}>✕</button>}
            </div>
          ))}
        </div>
      )}

      {/* New announcement form */}
      {showAnnForm&&isAdmin&&(
        <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:14, padding:"18px 20px", marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e", textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Nuevo anuncio</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <input style={{ ...inp, width:"100%", boxSizing:"border-box" }} value={annForm.title} onChange={e=>setAnnForm(f=>({...f,title:e.target.value}))} placeholder="Titulo del anuncio — ej: Hoy hay que reclutar 20 chicos"/>
            <textarea style={{ ...inp, width:"100%", minHeight:70, resize:"vertical", boxSizing:"border-box" }} value={annForm.body} onChange={e=>setAnnForm(f=>({...f,body:e.target.value}))} placeholder="Detalles del anuncio..."/>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div onClick={()=>setAnnForm(f=>({...f,pinned:!f.pinned}))} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                <div style={{ width:20, height:20, borderRadius:5, background:annForm.pinned?"#6366f1":"transparent", border:`2px solid ${annForm.pinned?"#6366f1":"#d1d5db"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#fff" }}>{annForm.pinned?"✓":""}</div>
                <span style={{ fontSize:13, color:"#374151" }}>Fijar arriba</span>
              </div>
              <div style={{ flex:1 }}/>
              <button onClick={()=>setShowAnnForm(false)} style={{ padding:"8px 14px", borderRadius:8, border:"1px solid #e8e3db", background:"none", color:"#6b7280", cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
              <button onClick={createAnnouncement} disabled={!annForm.title.trim()} style={{ padding:"8px 16px", borderRadius:8, border:"none", background:"#1a1a2e", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>Publicar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:14, height:"calc(100vh - 340px)", minHeight:400 }}>
        {/* Channel sidebar */}
        <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:14, padding:"14px 12px", overflowY:"auto" }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1, marginBottom:10, padding:"0 4px" }}>Canales</div>
          {CHANNELS.map(ch=>(
            <div key={ch.id} onClick={()=>setChannel(ch.id)} style={{ padding:"10px 12px", borderRadius:9, cursor:"pointer", marginBottom:4, background:channel===ch.id?"rgba(99,102,241,0.08)":"transparent", border:channel===ch.id?"1px solid rgba(99,102,241,0.15)":"1px solid transparent" }}>
              <div style={{ fontSize:13, fontWeight:channel===ch.id?700:500, color:channel===ch.id?"#6366f1":"#374151" }}># {ch.label}</div>
              <div style={{ fontSize:11, color:"#9ca3af" }}>{ch.desc}</div>
            </div>
          ))}
        </div>

        {/* Chat area */}
        <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:14, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Header */}
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #f0ebe3" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#1a1a2e" }}># {CHANNELS.find(c=>c.id===channel)?.label}</div>
            <div style={{ fontSize:12, color:"#9ca3af" }}>{CHANNELS.find(c=>c.id===channel)?.desc}</div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"14px 18px" }}>
            {messages.length===0&&<div style={{ textAlign:"center", color:"#9ca3af", fontSize:13, padding:"30px 0" }}>Sin mensajes. Empieza la conversacion.</div>}
            {messages.map((m,i)=>{
              const isMe = m.sender_email===profile?.email;
              const showHeader = i===0||messages[i-1].sender_email!==m.sender_email;
              return (
                <div key={m.id} style={{ marginBottom:showHeader?12:4 }}>
                  {showHeader&&<div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:`${ROLE_COLORS[m.sender_role]||"#6366f1"}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:ROLE_COLORS[m.sender_role]||"#6366f1" }}>{(m.sender_name||"?")[0].toUpperCase()}</div>
                    <span style={{ fontSize:13, fontWeight:600, color:"#1a1a2e" }}>{m.sender_name}</span>
                    <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:`${ROLE_COLORS[m.sender_role]||"#6366f1"}15`, color:ROLE_COLORS[m.sender_role]||"#6366f1", fontWeight:600 }}>{m.sender_role}</span>
                    <span style={{ fontSize:11, color:"#9ca3af", marginLeft:"auto" }}>{timeStr(m.created_at)}</span>
                  </div>}
                  <div style={{ marginLeft:showHeader?0:36, padding:"8px 12px", background:isMe?"rgba(99,102,241,0.06)":"#f9f7f4", borderRadius:10, fontSize:13, color:"#1a1a2e", lineHeight:1.5, border:`1px solid ${isMe?"rgba(99,102,241,0.15)":"#f0ebe3"}`, display:"inline-block", maxWidth:"80%" }}>
                    {m.message}
                  </div>
                </div>
              );
            })}
            <div ref={msgEndRef}/>
          </div>

          {/* Input */}
          <div style={{ padding:"12px 16px", borderTop:"1px solid #f0ebe3", display:"flex", gap:8 }}>
            <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()}
              placeholder={`Mensaje en #${CHANNELS.find(c=>c.id===channel)?.label}...`}
              style={{ ...inp, flex:1 }}/>
            <button onClick={sendMessage} disabled={sending||!newMsg.trim()} style={{ padding:"9px 18px", borderRadius:8, border:"none", background:newMsg.trim()?"#1a1a2e":"#e8e3db", color:newMsg.trim()?"#fff":"#9ca3af", cursor:newMsg.trim()?"pointer":"default", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>
              {sending?"...":"Enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
