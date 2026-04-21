import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const DAYS = ["Lun","Mar","Mie","Jue","Vie","Sab","Dom"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const EVENT_TYPES = [
  { id:"call", label:"Llamada", color:"#3b82f6" },
  { id:"meeting", label:"Reunion", color:"#8b5cf6" },
  { id:"task", label:"Tarea", color:"#f59e0b" },
  { id:"deadline", label:"Deadline", color:"#ef4444" },
  { id:"followup", label:"Follow-up", color:"#10b981" },
  { id:"other", label:"Otro", color:"#6b7280" },
];

const getDaysInMonth = (y, m) => new Date(y, m+1, 0).getDate();
const getFirstDay = (y, m) => { const d = new Date(y, m, 1).getDay(); return d===0?6:d-1; };

export const CalendarView = ({ profile, isAdmin, agentProfiles, leads }) => {
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
    type:"call", attendees:"", assigned_name:"", lead_id:""
  });

  useEffect(() => { loadEvents(); }, [year, month]);

  const loadEvents = async () => {
    const start = `${year}-${String(month+1).padStart(2,"0")}-01`;
    const end = `${year}-${String(month+1).padStart(2,"0")}-${getDaysInMonth(year,month)}`;
    const { data, error } = await supabase.from("calendar_events").select("*")
      .gte("date", start).lte("date", end)
      .order("date").order("start_time");
    if(!error) setEvents(data||[]);
  };

  const saveEvent = async () => {
    if(!form.title||!form.date) return;
    setSending(true);
    const color = EVENT_TYPES.find(t=>t.id===form.type)?.color||"#6366f1";

    // Only send fields that exist in the table
    const payload = {
      title: form.title,
      description: form.description||null,
      date: form.date,
      start_time: form.start_time||null,
      end_time: form.end_time||null,
      type: form.type||"call",
      color,
      attendees: form.attendees||null,
      assigned_name: form.assigned_name||null,
      lead_id: form.lead_id||null,
    };

    let dbError;
    if(form.id){
      const r = await supabase.from("calendar_events").update(payload).eq("id",form.id);
      dbError = r.error;
    } else {
      const r = await supabase.from("calendar_events").insert(payload);
      dbError = r.error;
    }

    if(dbError) {
      alert(`Error: ${dbError.message}`);
      setSending(false);
      return;
    }

    await loadEvents();
    setSent(true);
    setModal(null);
    resetForm();
    setTimeout(()=>setSent(false), 2000);

    // Send emails in background
    const CEO_EMAIL = "futboluagency@gmail.com";
    const emailData = {
      eventTitle: form.title,
      eventDate: form.date,
      eventTime: form.start_time,
      body: form.description||"",
      senderName: profile?.name||"CEO",
    };

    const targets = new Set([CEO_EMAIL]);
    if(form.assigned_name) {
      const ap = (agentProfiles||[]).find(p=>p.name===form.assigned_name);
      if(ap?.email) targets.add(ap.email);
    }
    if(form.assigned_name==="all") {
      (agentProfiles||[]).filter(p=>p.role==="recruiter"&&p.email).forEach(r=>targets.add(r.email));
    }
    targets.forEach(email => {
      fetch("/api/send-email", { method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({type:"calendar_invite",to:email,...emailData})
      }).catch(()=>{});
    });
    if(form.lead_id) {
      const lead = (leads||[]).find(l=>l.id===form.lead_id);
      if(lead?.email) {
        fetch("/api/send-email", { method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({type:"lead_meeting",to:lead.email,...emailData,eventTitle:`Reunion: ${form.title}`})
        }).catch(()=>{});
      }
    }
    setSending(false);
  };

  const deleteEvent = async (id) => {
    if(!window.confirm("Eliminar evento?")) return;
    await supabase.from("calendar_events").delete().eq("id",id);
    await loadEvents();
    setSelectedDay(null);
    if(modal) { setModal(null); resetForm(); }
  };

  const resetForm = () => setForm({ title:"", description:"", date:"", start_time:"09:00", end_time:"10:00", type:"call", attendees:"", assigned_name:"", lead_id:"" });
  const openNew = (dateStr) => { resetForm(); setForm(f=>({...f,date:dateStr||""})); setModal("new"); };
  const openEdit = (evt) => { setForm({...evt, lead_id:evt.lead_id||"", assigned_name:evt.assigned_name||""}); setModal("edit"); };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const selectedDateStr = selectedDay ? `${year}-${String(month+1).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}` : null;
  const getDayEvents = (d) => { const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; return events.filter(e=>e.date===ds); };

  const inp = { background:"#f9f7f4", border:"1px solid #e5e0d8", borderRadius:8, padding:"9px 12px", color:"#1a1a2e", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", width:"100%" };
  const lbl = { fontSize:11, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:0.8, marginBottom:5, display:"block" };
  const recruiters = (agentProfiles||[]).filter(p=>p.role==="recruiter"||p.role==="latam_director");
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#1a1a2e", letterSpacing:-0.3 }}>Calendario</h1>
          <p style={{ color:"#6b7280", fontSize:13, marginTop:3 }}>Llamadas, reuniones y tareas</p>
        </div>
        <button onClick={()=>openNew(todayStr)} style={{ padding:"9px 18px", borderRadius:9, border:"none", background:"#1a1a2e", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>+ Nuevo evento</button>
      </div>

      {/* Calendar grid */}
      <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:16, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", borderBottom:"1px solid #f0ebe3" }}>
          <button onClick={()=>{ if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }} style={{ background:"none", border:"1px solid #e8e3db", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:18, color:"#374151", display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
          <div style={{ fontSize:18, fontWeight:700, color:"#1a1a2e" }}>{MONTHS[month]} {year}</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{ setMonth(today.getMonth()); setYear(today.getFullYear()); }} style={{ padding:"5px 12px", borderRadius:7, border:"1px solid #e8e3db", background:"none", color:"#6b7280", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>Hoy</button>
            <button onClick={()=>{ if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }} style={{ background:"none", border:"1px solid #e8e3db", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:18, color:"#374151", display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"#faf8f5" }}>
          {DAYS.map(d=><div key={d} style={{ padding:"10px 0", textAlign:"center", fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:0.8 }}>{d}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
          {Array.from({length:firstDay}).map((_,i)=>(
            <div key={`e${i}`} style={{ minHeight:80, borderRight:"1px solid #f5f0e8", borderBottom:"1px solid #f5f0e8", background:"#fdfcfa" }}/>
          ))}
          {Array.from({length:daysInMonth}).map((_,i)=>{
            const d = i+1;
            const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const dayEvts = getDayEvents(d);
            const isToday = ds===todayStr;
            const isSel = d===selectedDay;
            const isWeekend = (firstDay+i)%7>=5;
            return (
              <div key={d} onClick={()=>setSelectedDay(isSel?null:d)} style={{ minHeight:80, padding:"6px 8px", borderRight:"1px solid #f5f0e8", borderBottom:"1px solid #f5f0e8", background:isSel?"#f0ebe3":isToday?"#fef9f0":isWeekend?"#fdfcfa":"#fff", cursor:"pointer" }}>
                <div style={{ width:26, height:26, borderRadius:"50%", background:isToday?"#1a1a2e":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:isToday?700:400, color:isToday?"#fff":"#374151", marginBottom:3 }}>{d}</div>
                {dayEvts.slice(0,3).map(evt=>(
                  <div key={evt.id} onClick={e=>{e.stopPropagation();openEdit(evt);}} style={{ fontSize:10, fontWeight:600, color:"#fff", background:evt.color||"#6366f1", borderRadius:4, padding:"2px 6px", marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {evt.start_time&&`${evt.start_time} `}{evt.title}
                  </div>
                ))}
                {dayEvts.length>3&&<div style={{ fontSize:10, color:"#9ca3af" }}>+{dayEvts.length-3}</div>}
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
          {getDayEvents(selectedDay).length===0&&<div style={{ color:"#9ca3af", fontSize:13, textAlign:"center", padding:"12px 0" }}>Sin eventos</div>}
          {getDayEvents(selectedDay).map(evt=>(
            <div key={evt.id} onClick={()=>openEdit(evt)} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"#faf8f5", borderRadius:10, border:"1px solid #f0ebe3", borderLeft:`4px solid ${evt.color||"#6366f1"}`, cursor:"pointer", marginBottom:8 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#1a1a2e" }}>{evt.title}</div>
                <div style={{ fontSize:11, color:"#9ca3af" }}>{evt.start_time}{evt.end_time?` - ${evt.end_time}`:""}{evt.assigned_name?` · Para: ${evt.assigned_name}`:""}</div>
                {evt.description&&<div style={{ fontSize:12, color:"#6b7280", marginTop:3 }}>{evt.description}</div>}
              </div>
              <button onClick={e=>{e.stopPropagation();deleteEvent(evt.id);}} style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #fecaca", background:"none", color:"#ef4444", cursor:"pointer", fontSize:11 }}>Eliminar</button>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming */}
      <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:16, padding:"20px 24px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e", textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Proximos eventos</div>
        {events.filter(e=>e.date>=todayStr).slice(0,6).length===0&&<div style={{ color:"#9ca3af", fontSize:13 }}>Sin eventos proximos</div>}
        {events.filter(e=>e.date>=todayStr).slice(0,6).map(evt=>(
          <div key={evt.id} onClick={()=>openEdit(evt)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:9, border:"1px solid #f0ebe3", background:"#faf8f5", cursor:"pointer", marginBottom:6 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:evt.color||"#6366f1", flexShrink:0 }}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#1a1a2e" }}>{evt.title}</div>
              <div style={{ fontSize:11, color:"#9ca3af" }}>{evt.date}{evt.start_time?` · ${evt.start_time}`:""}{evt.assigned_name?` · ${evt.assigned_name}`:""}</div>
            </div>
            <div style={{ fontSize:11, color:evt.color, fontWeight:600 }}>{EVENT_TYPES.find(t=>t.id===evt.type)?.label}</div>
          </div>
        ))}
      </div>

      {/* Event Modal */}
      {modal&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, padding:16, overflowY:"auto" }}>
          <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:500, padding:24, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)", margin:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#1a1a2e" }}>{modal==="edit"?"Editar evento":"Nuevo evento"}</h3>
              <button onClick={()=>{ setModal(null); resetForm(); }} style={{ background:"#f5f0e8", border:"none", color:"#6b7280", cursor:"pointer", width:28, height:28, borderRadius:7 }}>✕</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div><label style={lbl}>Titulo *</label><input style={inp} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Llamada con familia Garcia..."/></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><label style={lbl}>Tipo</label>
                  <select style={inp} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                    {EVENT_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Fecha *</label><input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
                <div><label style={lbl}>Hora inicio</label><input style={inp} type="time" value={form.start_time} onChange={e=>setForm(f=>({...f,start_time:e.target.value}))}/></div>
                <div><label style={lbl}>Hora fin</label><input style={inp} type="time" value={form.end_time} onChange={e=>setForm(f=>({...f,end_time:e.target.value}))}/></div>
              </div>
              {isAdmin&&recruiters.length>0&&<div><label style={lbl}>Asignar a reclutador</label>
                <select style={inp} value={form.assigned_name||""} onChange={e=>setForm(f=>({...f,assigned_name:e.target.value}))}>
                  <option value="">Sin asignar</option>
                  {recruiters.map(r=><option key={r.id} value={r.name}>{r.name}</option>)}
                  <option value="all">Todos los reclutadores</option>
                </select>
              </div>}
              {(leads||[]).length>0&&<div><label style={lbl}>Vincular a lead</label>
                <select style={inp} value={form.lead_id||""} onChange={e=>setForm(f=>({...f,lead_id:e.target.value}))}>
                  <option value="">Sin lead</option>
                  {(leads||[]).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>}
              <div><label style={lbl}>Notas</label><textarea style={{ ...inp, minHeight:70, resize:"vertical" }} value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Detalles..."/></div>
              <div><label style={lbl}>Asistentes externos</label><input style={inp} value={form.attendees||""} onChange={e=>setForm(f=>({...f,attendees:e.target.value}))} placeholder="Familia Garcia, Coach Smith..."/></div>
              <div style={{ padding:"10px 14px", background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.15)", borderRadius:9, fontSize:12, color:"#10b981" }}>
                Email automatico al CEO{form.assigned_name?` y a ${form.assigned_name}`:""}
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button onClick={()=>{ setModal(null); resetForm(); }} style={{ flex:1, padding:"10px", borderRadius:9, border:"1px solid #e8e3db", background:"none", color:"#6b7280", cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
              {modal==="edit"&&<button onClick={()=>deleteEvent(form.id)} style={{ flex:1, padding:"10px", borderRadius:9, border:"1px solid #fecaca", background:"none", color:"#ef4444", cursor:"pointer", fontFamily:"inherit" }}>Eliminar</button>}
              <button onClick={saveEvent} disabled={!form.title||!form.date||sending} style={{ flex:2, padding:"10px", borderRadius:9, border:"none", background:sent?"#10b981":(!form.title||!form.date||sending)?"#e8e3db":"#1a1a2e", color:(!form.title||!form.date||sending)&&!sent?"#9ca3af":"#fff", cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>
                {sent?"Guardado":sending?"Guardando...":modal==="edit"?"Guardar":"Crear evento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
