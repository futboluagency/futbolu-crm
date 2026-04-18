import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const DAYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const EVENT_TYPES = [
  { id:"call", label:"Llamada", color:"#3b82f6" },
  { id:"meeting", label:"Reunión", color:"#8b5cf6" },
  { id:"task", label:"Tarea", color:"#f59e0b" },
  { id:"deadline", label:"Deadline", color:"#ef4444" },
  { id:"followup", label:"Follow-up", color:"#10b981" },
  { id:"other", label:"Otro", color:"#6b7280" },
];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
};

export const CalendarView = ({ profile, isAdmin }) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [modal, setModal] = useState(null);
  const [view, setView] = useState("month"); // month | week | list
  const [form, setForm] = useState({ title:"", description:"", date:"", start_time:"09:00", end_time:"10:00", type:"call", color:"#3b82f6", attendees:"" });

  useEffect(() => { loadEvents(); }, [currentYear, currentMonth]);

  const loadEvents = async () => {
    const startDate = `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-01`;
    const endDate = `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${getDaysInMonth(currentYear,currentMonth)}`;
    const { data } = await supabase.from("calendar_events").select("*")
      .gte("date", startDate).lte("date", endDate)
      .order("date").order("start_time");
    setEvents(data||[]);
  };

  const saveEvent = async () => {
    if(!form.title||!form.date) return;
    const typeColor = EVENT_TYPES.find(t=>t.id===form.type)?.color || "#6366f1";
    const payload = { ...form, color: typeColor, user_id: profile?.user_id };
    if(form.id) await supabase.from("calendar_events").update(payload).eq("id",form.id);
    else await supabase.from("calendar_events").insert(payload);
    await loadEvents();
    setModal(null);
    resetForm();
  };

  const deleteEvent = async (id) => {
    if(!window.confirm("Eliminar evento?")) return;
    await supabase.from("calendar_events").delete().eq("id",id);
    await loadEvents();
    setSelectedDay(null);
  };

  const resetForm = () => setForm({ title:"", description:"", date:"", start_time:"09:00", end_time:"10:00", type:"call", color:"#3b82f6", attendees:"" });

  const openNew = (dateStr) => {
    resetForm();
    setForm(f=>({...f, date: dateStr||""}));
    setModal("new");
  };

  const openEdit = (evt) => {
    setForm(evt);
    setModal("edit");
  };

  const prevMonth = () => {
    if(currentMonth===0){ setCurrentMonth(11); setCurrentYear(y=>y-1); }
    else setCurrentMonth(m=>m-1);
  };

  const nextMonth = () => {
    if(currentMonth===11){ setCurrentMonth(0); setCurrentYear(y=>y+1); }
    else setCurrentMonth(m=>m+1);
  };

  const getEventsForDay = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return events.filter(e=>e.date===dateStr);
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const selectedDateStr = selectedDay ? `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}` : null;
  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const inp = { background:"#f9f7f4", border:"1px solid #e5e0d8", borderRadius:8, padding:"9px 12px", color:"#1a1a2e", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", width:"100%" };
  const lbl = { fontSize:11, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:0.8, marginBottom:5, display:"block" };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#1a1a2e", letterSpacing:-0.3 }}>Calendario</h1>
          <p style={{ color:"#6b7280", fontSize:13, marginTop:3 }}>Llamadas, reuniones y tareas</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>openNew(todayStr)} style={{ padding:"9px 16px", borderRadius:9, border:"none", background:"#1a1a2e", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>
            + Nuevo evento
          </button>
        </div>
      </div>

      {/* Month navigation */}
      <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:16, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", borderBottom:"1px solid #f0ebe3" }}>
          <button onClick={prevMonth} style={{ background:"none", border:"1px solid #e8e3db", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, color:"#374151", display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
          <div style={{ fontSize:18, fontWeight:700, color:"#1a1a2e" }}>{MONTHS[currentMonth]} {currentYear}</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{ setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); }} style={{ padding:"5px 12px", borderRadius:7, border:"1px solid #e8e3db", background:"none", color:"#6b7280", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>Hoy</button>
            <button onClick={nextMonth} style={{ background:"none", border:"1px solid #e8e3db", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, color:"#374151", display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
          </div>
        </div>

        {/* Day headers */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"#faf8f5" }}>
          {DAYS.map(d=><div key={d} style={{ padding:"10px 0", textAlign:"center", fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:0.8 }}>{d}</div>)}
        </div>

        {/* Calendar grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
          {Array.from({length: firstDay}).map((_,i)=>(
            <div key={`empty-${i}`} style={{ minHeight:90, padding:8, borderRight:"1px solid #f0ebe3", borderBottom:"1px solid #f0ebe3", background:"#fdfcfa" }}/>
          ))}
          {Array.from({length: daysInMonth}).map((_,i)=>{
            const day = i+1;
            const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const dayEvents = getEventsForDay(day);
            const isToday = dateStr === todayStr;
            const isSelected = day === selectedDay;
            const isWeekend = (firstDay + i) % 7 >= 5;
            return (
              <div key={day} onClick={()=>setSelectedDay(isSelected?null:day)} style={{ minHeight:90, padding:8, borderRight:"1px solid #f0ebe3", borderBottom:"1px solid #f0ebe3", background:isSelected?"#f5f0e8":isToday?"#fef9f0":isWeekend?"#fdfcfa":"#fff", cursor:"pointer", position:"relative" }}>
                <div style={{ width:26, height:26, borderRadius:"50%", background:isToday?"#1a1a2e":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:isToday?700:400, color:isToday?"#fff":"#374151", marginBottom:4 }}>{day}</div>
                {dayEvents.slice(0,3).map(evt=>(
                  <div key={evt.id} style={{ fontSize:10, fontWeight:600, color:"#fff", background:evt.color||"#6366f1", borderRadius:4, padding:"2px 6px", marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{evt.start_time&&`${evt.start_time} `}{evt.title}</div>
                ))}
                {dayEvents.length>3&&<div style={{ fontSize:10, color:"#9ca3af" }}>+{dayEvents.length-3} más</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day panel */}
      {selectedDay&&(
        <div style={{ marginTop:16, background:"#fff", border:"1px solid #e8e3db", borderRadius:16, padding:"20px 24px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#1a1a2e" }}>
              {selectedDay} de {MONTHS[currentMonth]}
            </div>
            <button onClick={()=>openNew(selectedDateStr)} style={{ padding:"7px 14px", borderRadius:8, border:"none", background:"#1a1a2e", color:"#fff", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"inherit" }}>+ Añadir</button>
          </div>
          {selectedEvents.length===0&&<div style={{ color:"#9ca3af", fontSize:13, textAlign:"center", padding:"20px 0" }}>Sin eventos este día</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {selectedEvents.map(evt=>(
              <div key={evt.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:"#faf8f5", borderRadius:12, border:"1px solid #f0ebe3", borderLeft:`4px solid ${evt.color||"#6366f1"}` }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#1a1a2e", marginBottom:3 }}>{evt.title}</div>
                  {evt.description&&<div style={{ fontSize:12, color:"#6b7280", marginBottom:3 }}>{evt.description}</div>}
                  <div style={{ display:"flex", gap:10, fontSize:11, color:"#9ca3af" }}>
                    {evt.start_time&&<span>{evt.start_time}{evt.end_time?` - ${evt.end_time}`:""}</span>}
                    {evt.attendees&&<span>Con: {evt.attendees}</span>}
                    <span style={{ color:evt.color, fontWeight:600 }}>{EVENT_TYPES.find(t=>t.id===evt.type)?.label||evt.type}</span>
                  </div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={()=>openEdit(evt)} style={{ padding:"5px 10px", borderRadius:7, border:"1px solid #e8e3db", background:"none", color:"#6b7280", cursor:"pointer", fontSize:11 }}>Editar</button>
                  <button onClick={()=>deleteEvent(evt.id)} style={{ padding:"5px 10px", borderRadius:7, border:"1px solid #fecaca", background:"none", color:"#ef4444", cursor:"pointer", fontSize:11 }}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming events sidebar */}
      <div style={{ marginTop:16, background:"#fff", border:"1px solid #e8e3db", borderRadius:16, padding:"20px 24px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#1a1a2e", marginBottom:14 }}>Próximos eventos este mes</div>
        {events.filter(e=>e.date>=todayStr).slice(0,8).length===0&&<div style={{ color:"#9ca3af", fontSize:13 }}>Sin eventos próximos</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {events.filter(e=>e.date>=todayStr).slice(0,8).map(evt=>(
            <div key={evt.id} onClick={()=>openEdit(evt)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, border:"1px solid #f0ebe3", background:"#faf8f5", cursor:"pointer" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:evt.color||"#6366f1", flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#1a1a2e" }}>{evt.title}</div>
                <div style={{ fontSize:11, color:"#9ca3af" }}>{evt.date} {evt.start_time&&`· ${evt.start_time}`}</div>
              </div>
              <div style={{ fontSize:11, color:evt.color, fontWeight:600 }}>{EVENT_TYPES.find(t=>t.id===evt.type)?.label||evt.type}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Event Modal */}
      {modal&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, padding:16 }}>
          <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:480, padding:24, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#1a1a2e" }}>{modal==="edit"?"Editar evento":"Nuevo evento"}</h3>
              <button onClick={()=>{ setModal(null); resetForm(); }} style={{ background:"#f5f0e8", border:"none", color:"#6b7280", cursor:"pointer", width:28, height:28, borderRadius:7 }}>✕</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div><label style={lbl}>Título</label><input style={inp} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Llamada con familia García..."/></div>
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
              <div><label style={lbl}>Asistentes / Con quién</label><input style={inp} value={form.attendees||""} onChange={e=>setForm(f=>({...f,attendees:e.target.value}))} placeholder="Ignacio, Familia García, Coach Smith..."/></div>
              <div><label style={lbl}>Descripción / Notas</label><textarea style={{ ...inp, minHeight:80, resize:"vertical" }} value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Detalles del evento..."/></div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button onClick={()=>{ setModal(null); resetForm(); }} style={{ flex:1, padding:"10px", borderRadius:9, border:"1px solid #e8e3db", background:"none", color:"#6b7280", cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
              {modal==="edit"&&<button onClick={()=>deleteEvent(form.id)} style={{ flex:1, padding:"10px", borderRadius:9, border:"1px solid #fecaca", background:"none", color:"#ef4444", cursor:"pointer", fontFamily:"inherit" }}>Eliminar</button>}
              <button onClick={saveEvent} disabled={!form.title||!form.date} style={{ flex:2, padding:"10px", borderRadius:9, border:"none", background:(!form.title||!form.date)?"#e8e3db":"#1a1a2e", color:(!form.title||!form.date)?"#9ca3af":"#fff", cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>
                {modal==="edit"?"Guardar cambios":"Crear evento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
