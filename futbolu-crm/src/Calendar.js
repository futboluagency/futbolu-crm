import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const DAYS = ["Lun","Mar","Mie","Jue","Vie","Sab","Dom"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const EVENT_TYPES = [
  { id:"call", label:"Llamada", color:"#3b82f6" },
  { id:"meeting", label:"Reunion", color:"#8b5cf6" },
  { id:"task", label:"Tarea", color:"#f59e0b" },
  { id:"deadline", label:"Deadline", color:"#ef4444" },
  { id:"followup", label:"Follow-up lead", color:"#10b981" },
  { id:"other", label:"Otro", color:"#6b7280" },
];

const getDaysInMonth = (y, m) => new Date(y, m+1, 0).getDate();
const getFirstDay = (y, m) => { const d = new Date(y, m, 1).getDay(); return d===0?6:d-1; };

const sendEmailNotification = async (type, to, data) => {
  if(!to) return;
  try {
    await fetch("/api/send-email", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ type, to, ...data })
    });
  } catch(e) { console.error("Email error:", e); }
};

export const CalendarView = ({ profile, isAdmin, agentProfiles, players, leads }) => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [modal, setModal] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    title:"", description:"", date:"", start_time:"09:00", end_time:"10:00",
    type:"call", attendees:"",
    assigned_to:"", assigned_name:"", notify_email:false,
    lead_id:"", player_id:""
  });

  useEffect(() => { loadEvents(); }, [year, month]);

  const loadEvents = async () => {
    const start = `${year}-${String(month+1).padStart(2,"0")}-01`;
    const end = `${year}-${String(month+1).padStart(2,"0")}-${getDaysInMonth(year,month)}`;
    const { data } = await supabase.from("calendar_events").select("*")
      .gte("date", start).lte("date", end)
      .order("date").order("start_time");
    setEvents(data||[]);
  };

  const saveEvent = async () => {
    if(!form.title||!form.date) return;
    setSending(true);

    try {
      const color = EVENT_TYPES.find(t=>t.id===form.type)?.color||"#6366f1";
      const { id, notify_email, ...rest } = form;

      // Extract just the name from "Name (email)" format
      const cleanName = (rest.assigned_name||"").split("(")[0].trim()||null;

      // Only keep valid UUID fields — null if empty string
      const payload = {
        title: rest.title,
        description: rest.description||null,
        date: rest.date,
        start_time: rest.start_time||null,
        end_time: rest.end_time||null,
        type: rest.type||"call",
        color,
        attendees: rest.attendees||null,
        assigned_name: cleanName,
        assigned_to: rest.assigned_to||null,
        lead_id: rest.lead_id||null,
        player_id: rest.player_id||null,
      };

      let dbError;
      if(form.id){
        const res = await supabase.from("calendar_events").update(payload).eq("id",form.id);
        dbError = res.error;
      } else {
        const res = await supabase.from("calendar_events").insert(payload);
        dbError = res.error;
      }

      if(dbError) {
        alert(`Error Supabase: ${dbError.message}`);
        setSending(false);
        return;
      }

      // Reload calendar immediately
      await loadEvents();
      setSent(true);
      setModal(null);
      resetForm();
      setTimeout(()=>setSent(false), 2000);

      // Send emails in background — never block the save
      const CEO_EMAIL = "futboluagency@gmail.com";
      const emailData = {
        eventTitle: form.title,
        eventDate: form.date,
        eventTime: form.start_time,
        body: form.description||"",
        senderName: profile?.name||"CEO",
      };

      // Find recruiter email from agentProfiles
      const assignedProfile = cleanName
        ? (agentProfiles||[]).find(p=>p.name===cleanName||p.email===cleanName)
        : null;

      const emailTargets = new Set([CEO_EMAIL]);
      if(assignedProfile?.email) emailTargets.add(assignedProfile.email);
      if(form.assigned_name==="all") {
        (agentProfiles||[]).filter(p=>p.role==="recruiter"&&p.email).forEach(r=>emailTargets.add(r.email));
      }

      emailTargets.forEach(email => {
        fetch("/api/send-email", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ type:"calendar_invite", to:email, ...emailData })
        }).catch(e=>console.log("Email failed (non-blocking):", e));
      });

      // Email to lead if linked
      if(form.lead_id) {
        const lead = (leads||[]).find(l=>l.id===form.lead_id);
        if(lead?.email) {
          fetch("/api/send-email", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ type:"lead_meeting", to:lead.email, ...emailData, eventTitle:`Reunion: ${form.title}` })
          }).catch(()=>{});
        }
      }

    } catch(e) {
      console.error("Unexpected error:", e);
      alert(`Error inesperado: ${e.message}`);
    }
    setSending(false);
  };

  const deleteEvent = async (id) => {
    if(!window.confirm("Eliminar evento?")) return;
    await supabase.from("calendar_events").delete().eq("id",id);
    await loadEvents();
    setSelectedDay(null);
  };

  const resetForm = () => setForm({ title:"", description:"", date:"", start_time:"09:00", end_time:"10:00", type:"call", attendees:"", assigned_to:"", assigned_name:"", notify_email:false, lead_id:"", player_id:"" });

  const openNew = (dateStr) => { resetForm(); setForm(f=>({...f,date:dateStr||""})); setModal("new"); };
  const openEdit = (evt) => { setForm(evt); setModal("edit"); };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const selectedDateStr = selectedDay ? `${year}-${String(month+1).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}` : null;

  const getDayEvents = (d) => {
    const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return events.filter(e=>e.date===ds);
  };

  const inp = { background:"#f9f7f4", border:"1px solid #e5e0d8", borderRadius:8, padding:"9px 12px", color:"#1a1a2e", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", width:"100%" };
  const lbl = { fontSize:11, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:0.8, marginBottom:5, display:"block" };

  const recruiters = (agentProfiles||[]).filter(p=>p.role!=="admin"&&p.role!=="ceo");
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#1a1a2e", letterSpacing:-0.3 }}>Calendario</h1>
          <p style={{ color:"#6b7280", fontSize:13, marginTop:3 }}>Llamadas, reuniones y tareas. Notificaciones automaticas por email.</p>
        </div>
        <button onClick={()=>openNew(todayStr)} style={{ padding:"9px 18px", borderRadius:9, border:"none", background:"#1a1a2e", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>+ Nuevo evento</button>
      </div>

      {/* Calendar */}
      <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:16, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", borderBottom:"1px solid #f0ebe3" }}>
          <button onClick={()=>{ if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }} style={{ background:"none", border:"1px solid #e8e3db", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, color:"#374151" }}>‹</button>
          <div style={{ fontSize:18, fontWeight:700, color:"#1a1a2e" }}>{MONTHS[month]} {year}</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{ setMonth(today.getMonth()); setYear(today.getFullYear()); }} style={{ padding:"5px 12px", borderRadius:7, border:"1px solid #e8e3db", background:"none", color:"#6b7280", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>Hoy</button>
            <button onClick={()=>{ if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }} style={{ background:"none", border:"1px solid #e8e3db", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, color:"#374151" }}>›</button>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"#faf8f5" }}>
          {DAYS.map(d=><div key={d} style={{ padding:"10px 0", textAlign:"center", fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:0.8 }}>{d}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
          {Array.from({length:firstDay}).map((_,i)=>(
            <div key={`e${i}`} style={{ minHeight:88, borderRight:"1px solid #f5f0e8", borderBottom:"1px solid #f5f0e8", background:"#fdfcfa" }}/>
          ))}
          {Array.from({length:daysInMonth}).map((_,i)=>{
            const d = i+1;
            const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const dayEvents = getDayEvents(d);
            const isToday = ds===todayStr;
            const isSel = d===selectedDay;
            const isWeekend = (firstDay+i)%7>=5;
            return (
              <div key={d} onClick={()=>setSelectedDay(isSel?null:d)} style={{ minHeight:88, padding:"6px 8px", borderRight:"1px solid #f5f0e8", borderBottom:"1px solid #f5f0e8", background:isSel?"#f0ebe3":isToday?"#fef9f0":isWeekend?"#fdfcfa":"#fff", cursor:"pointer" }}>
                <div style={{ width:26, height:26, borderRadius:"50%", background:isToday?"#1a1a2e":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:isToday?700:400, color:isToday?"#fff":"#374151", marginBottom:4 }}>{d}</div>
                {dayEvents.slice(0,3).map(evt=>(
                  <div key={evt.id} style={{ fontSize:10, fontWeight:600, color:"#fff", background:evt.color||"#6366f1", borderRadius:4, padding:"2px 6px", marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {evt.start_time&&`${evt.start_time} `}{evt.title}
                  </div>
                ))}
                {dayEvents.length>3&&<div style={{ fontSize:10, color:"#9ca3af" }}>+{dayEvents.length-3} mas</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day */}
      {selectedDay&&(
        <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:16, padding:"20px 24px", marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:15, fontWeight:700, color:"#1a1a2e" }}>{selectedDay} de {MONTHS[month]}</div>
            <button onClick={()=>openNew(selectedDateStr)} style={{ padding:"7px 14px", borderRadius:8, border:"none", background:"#1a1a2e", color:"#fff", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"inherit" }}>+ Evento</button>
          </div>
          {getDayEvents(selectedDay).length===0&&<div style={{ color:"#9ca3af", fontSize:13, textAlign:"center", padding:"16px 0" }}>Sin eventos este dia</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {getDayEvents(selectedDay).map(evt=>(
              <div key={evt.id} onClick={()=>openEdit(evt)} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:"#faf8f5", borderRadius:12, border:"1px solid #f0ebe3", borderLeft:`4px solid ${evt.color||"#6366f1"}`, cursor:"pointer" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#1a1a2e", marginBottom:3 }}>{evt.title}</div>
                  <div style={{ display:"flex", gap:10, fontSize:11, color:"#9ca3af", flexWrap:"wrap" }}>
                    {evt.start_time&&<span>{evt.start_time}{evt.end_time?` - ${evt.end_time}`:""}</span>}
                    {evt.assigned_name&&<span>Para: {evt.assigned_name}</span>}
                    {evt.attendees&&<span>Con: {evt.attendees}</span>}
                    <span style={{ color:evt.color, fontWeight:600 }}>{EVENT_TYPES.find(t=>t.id===evt.type)?.label}</span>
                  </div>
                  {evt.description&&<div style={{ fontSize:12, color:"#6b7280", marginTop:4 }}>{evt.description}</div>}
                </div>
                <button onClick={e=>{e.stopPropagation();deleteEvent(evt.id);}} style={{ padding:"5px 10px", borderRadius:7, border:"1px solid #fecaca", background:"none", color:"#ef4444", cursor:"pointer", fontSize:11 }}>Eliminar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:16, padding:"20px 24px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#1a1a2e", marginBottom:14 }}>Proximos eventos</div>
        {events.filter(e=>e.date>=todayStr).slice(0,8).length===0&&<div style={{ color:"#9ca3af", fontSize:13 }}>Sin eventos proximos</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {events.filter(e=>e.date>=todayStr).slice(0,8).map(evt=>(
            <div key={evt.id} onClick={()=>openEdit(evt)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, border:"1px solid #f0ebe3", background:"#faf8f5", cursor:"pointer" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:evt.color||"#6366f1", flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#1a1a2e" }}>{evt.title}</div>
                <div style={{ fontSize:11, color:"#9ca3af" }}>{evt.date}{evt.start_time?` · ${evt.start_time}`:""}{evt.assigned_name?` · Para: ${evt.assigned_name}`:""}</div>
              </div>
              <div style={{ fontSize:11, color:evt.color, fontWeight:600 }}>{EVENT_TYPES.find(t=>t.id===evt.type)?.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Event Modal */}
      {modal&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, padding:16, overflowY:"auto" }}>
          <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:520, padding:24, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)", margin:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#1a1a2e" }}>{modal==="edit"?"Editar evento":"Nuevo evento"}</h3>
              <button onClick={()=>{ setModal(null); resetForm(); }} style={{ background:"#f5f0e8", border:"none", color:"#6b7280", cursor:"pointer", width:28, height:28, borderRadius:7 }}>✕</button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div><label style={lbl}>Titulo del evento</label><input style={inp} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Llamada con familia Garcia..."/></div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><label style={lbl}>Tipo</label>
                  <select style={inp} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                    {EVENT_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Fecha</label><input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
                <div><label style={lbl}>Hora inicio</label><input style={inp} type="time" value={form.start_time} onChange={e=>setForm(f=>({...f,start_time:e.target.value}))}/></div>
                <div><label style={lbl}>Hora fin</label><input style={inp} type="time" value={form.end_time} onChange={e=>setForm(f=>({...f,end_time:e.target.value}))}/></div>
              </div>

              {/* Assign to recruiter */}
              {isAdmin&&recruiters.length>0&&<div>
                <label style={lbl}>Asignar a reclutador (opcional)</label>
                <select style={inp} value={form.assigned_name||""} onChange={e=>{ const ap=recruiters.find(r=>r.name===e.target.value); setForm(f=>({...f,assigned_name:e.target.value,assigned_to:ap?.user_id||""})); }}>
                  <option value="">Sin asignar (solo yo)</option>
                  {recruiters.map(r=><option key={r.id} value={r.name}>{r.name} ({r.email})</option>)}
                  <option value="all">Todos los reclutadores</option>
                </select>
              </div>}

              {/* Link to lead */}
              {(leads||[]).length>0&&<div>
                <label style={lbl}>Vinculado a lead (opcional)</label>
                <select style={inp} value={form.lead_id||""} onChange={e=>setForm(f=>({...f,lead_id:e.target.value}))}>
                  <option value="">Sin lead vinculado</option>
                  {(leads||[]).map(l=><option key={l.id} value={l.id}>{l.name} ({l.sport||"—"})</option>)}
                </select>
              </div>}

              <div><label style={lbl}>Descripcion / Notas</label><textarea style={{ ...inp, minHeight:80, resize:"vertical" }} value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Detalles del evento..."/></div>

              <div><label style={lbl}>Asistentes externos</label><input style={inp} value={form.attendees||""} onChange={e=>setForm(f=>({...f,attendees:e.target.value}))} placeholder="Familia Garcia, Coach Smith..."/></div>

              {/* Email notification */}
              <div style={{ padding:"10px 14px", background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.15)", borderRadius:9, fontSize:12, color:"#10b981", fontWeight:500 }}>
                Se enviara email automaticamente al CEO, al reclutador asignado{form.lead_id?" y al lead":""}
              </div>
            </div>

            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button onClick={()=>{ setModal(null); resetForm(); }} style={{ flex:1, padding:"10px", borderRadius:9, border:"1px solid #e8e3db", background:"none", color:"#6b7280", cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
              {modal==="edit"&&<button onClick={()=>deleteEvent(form.id)} style={{ flex:1, padding:"10px", borderRadius:9, border:"1px solid #fecaca", background:"none", color:"#ef4444", cursor:"pointer", fontFamily:"inherit" }}>Eliminar</button>}
              <button onClick={saveEvent} disabled={!form.title||!form.date||sending} style={{ flex:2, padding:"10px", borderRadius:9, border:"none", background:sent?"#10b981":(!form.title||!form.date)?"#e8e3db":"#1a1a2e", color:(!form.title||!form.date)?"#9ca3af":"#fff", cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>
                {sent?"Guardado y enviado":sending?"Guardando...":modal==="edit"?"Guardar cambios":"Crear evento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
