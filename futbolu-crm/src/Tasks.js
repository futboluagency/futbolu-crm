import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const PRIORITIES = [
  { id:"urgent", label:"Urgente", color:"#ef4444" },
  { id:"high", label:"Alta", color:"#f59e0b" },
  { id:"normal", label:"Normal", color:"#6366f1" },
  { id:"low", label:"Baja", color:"#9ca3af" },
];

export const TasksPanel = ({ leadId, playerId, agentNames, currentUser }) => {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", due_date:"", assigned_to:"", priority:"normal", notes:"" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [leadId, playerId]);

  const load = async () => {
    let query = supabase.from("tasks").select("*").order("due_date", { ascending:true });
    if(leadId) query = query.eq("lead_id", leadId);
    if(playerId) query = query.eq("player_id", playerId);
    const { data } = await query;
    setTasks(data||[]);
  };

  const save = async () => {
    if(!form.title.trim()) return;
    setSaving(true);
    const payload = {
      title: form.title,
      due_date: form.due_date||null,
      assigned_to: form.assigned_to||currentUser||null,
      priority: form.priority,
      notes: form.notes||null,
      lead_id: leadId||null,
      player_id: playerId||null,
    };
    const {error} = await supabase.from("tasks").insert(payload);
    if(error) { alert(`Error al guardar tarea: ${error.message}`); setSaving(false); return; }

    // Send email to assigned person if different from current user
    if(form.assigned_to && form.assigned_to !== currentUser) {
      fetch("/api/send-email", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          type:"calendar_invite",
          to: "futboluagency@gmail.com", // CEO always gets notified
          eventTitle:`Nueva tarea asignada: ${form.title}`,
          eventDate: form.due_date||new Date().toISOString().split("T")[0],
          body:`Tarea: ${form.title}\nAsignada a: ${form.assigned_to}\nPrioridad: ${form.priority}\nNotas: ${form.notes||"—"}`,
          senderName: currentUser||"Sistema"
        })
      }).catch(()=>{});
    }
    setForm({ title:"", due_date:"", assigned_to:"", priority:"normal", notes:"" });
    setShowForm(false);
    await load();
    setSaving(false);
  };

  const toggle = async (task) => {
    await supabase.from("tasks").update({
      completed: !task.completed,
      completed_date: !task.completed ? new Date().toISOString().split("T")[0] : null
    }).eq("id", task.id);
    await load();
  };

  const del = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    await load();
  };

  const pending = tasks.filter(t=>!t.completed);
  const done = tasks.filter(t=>t.completed);
  const today = new Date().toISOString().split("T")[0];

  const inp = { background:"#f9f7f4", border:"1px solid #e5e0d8", borderRadius:8, padding:"8px 12px", color:"#1a1a2e", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", width:"100%" };
  const lbl = { fontSize:10, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:0.8, marginBottom:5, display:"block" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:600, color:"#1a1a2e" }}>
          Tareas {pending.length>0&&<span style={{ background:"#ef4444", color:"#fff", borderRadius:20, fontSize:10, padding:"1px 7px", marginLeft:6 }}>{pending.length}</span>}
        </div>
        <button onClick={()=>setShowForm(!showForm)} style={{ padding:"5px 12px", borderRadius:7, border:"1px solid #e8e3db", background:showForm?"#1a1a2e":"#fff", color:showForm?"#fff":"#374151", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"inherit" }}>
          {showForm?"Cancelar":"+ Nueva tarea"}
        </button>
      </div>

      {showForm&&(
        <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:12, padding:"16px", marginBottom:12, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div><label style={lbl}>Tarea *</label><input style={inp} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Ej: Escribirle el lunes para preguntar si consiguio el dinero..."/></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div><label style={lbl}>Fecha limite</label><input style={inp} type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))}/></div>
              <div><label style={lbl}>Prioridad</label>
                <select style={{ ...inp, cursor:"pointer" }} value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                  {PRIORITIES.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
            </div>
            {agentNames?.length>0&&<div><label style={lbl}>Asignar a</label>
              <select style={{ ...inp, cursor:"pointer" }} value={form.assigned_to} onChange={e=>setForm(f=>({...f,assigned_to:e.target.value}))}>
                <option value="">Sin asignar</option>
                {agentNames.map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>}
            <div><label style={lbl}>Notas</label><input style={inp} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Detalles adicionales..."/></div>
            <button onClick={save} disabled={saving||!form.title.trim()} style={{ padding:"9px", borderRadius:8, border:"none", background:saving||!form.title.trim()?"#e8e3db":"#1a1a2e", color:saving||!form.title.trim()?"#9ca3af":"#fff", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>
              {saving?"Guardando...":"Crear tarea"}
            </button>
          </div>
        </div>
      )}

      {/* Pending tasks */}
      {pending.length===0&&!showForm&&<div style={{ color:"#9ca3af", fontSize:13, textAlign:"center", padding:"16px 0" }}>Sin tareas pendientes</div>}
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {pending.map(task=>{
          const pri = PRIORITIES.find(p=>p.id===task.priority)||PRIORITIES[2];
          const overdue = task.due_date && task.due_date < today;
          const dueToday = task.due_date === today;
          return (
            <div key={task.id} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"12px 14px", background:"#fff", border:`1px solid ${overdue?"#fecaca":dueToday?"rgba(245,158,11,0.2)":"#f0ebe3"}`, borderRadius:10, borderLeft:`3px solid ${pri.color}` }}>
              <div onClick={()=>toggle(task)} style={{ width:20, height:20, borderRadius:6, border:`2px solid ${pri.color}`, background:"transparent", cursor:"pointer", flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center" }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#1a1a2e", marginBottom:3 }}>{task.title}</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", fontSize:11, color:"#9ca3af" }}>
                  {task.due_date&&<span style={{ color:overdue?"#ef4444":dueToday?"#f59e0b":"#9ca3af", fontWeight:overdue||dueToday?700:400 }}>
                    {overdue?"Vencida: ":dueToday?"Hoy: ":"Para: "}{task.due_date}
                  </span>}
                  {task.assigned_to&&<span>Para: {task.assigned_to}</span>}
                  <span style={{ color:pri.color, fontWeight:600 }}>{pri.label}</span>
                </div>
                {task.notes&&<div style={{ fontSize:11, color:"#6b7280", marginTop:3, fontStyle:"italic" }}>{task.notes}</div>}
              </div>
              <button onClick={()=>del(task.id)} style={{ background:"none", border:"none", color:"#d1cfc7", cursor:"pointer", fontSize:16, padding:0, flexShrink:0 }}>✕</button>
            </div>
          );
        })}
      </div>

      {/* Completed */}
      {done.length>0&&(
        <div style={{ marginTop:14 }}>
          <div style={{ fontSize:11, color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>Completadas ({done.length})</div>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {done.map(task=>(
              <div key={task.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px", background:"#f9f7f4", borderRadius:8, opacity:0.7 }}>
                <div onClick={()=>toggle(task)} style={{ width:20, height:20, borderRadius:6, background:"#10b981", border:"2px solid #10b981", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#fff" }}>✓</div>
                <div style={{ flex:1, fontSize:12, color:"#6b7280", textDecoration:"line-through" }}>{task.title}</div>
                <button onClick={()=>del(task.id)} style={{ background:"none", border:"none", color:"#d1cfc7", cursor:"pointer", fontSize:14, padding:0 }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Mini tasks widget for dashboard
export const TasksDashboard = ({ agentName, isAdmin, players, leads }) => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => { load(); }, [agentName]);

  const load = async () => {
    const { data } = await supabase.from("tasks").select("*")
      .eq("completed", false)
      .order("due_date", { ascending:true })
      .limit(20);
    const filtered = isAdmin ? (data||[]) : (data||[]).filter(t=>!t.assigned_to||t.assigned_to===agentName);
    setTasks(filtered);
  };

  const toggle = async (task) => {
    await supabase.from("tasks").update({ completed:true, completed_date:new Date().toISOString().split("T")[0] }).eq("id",task.id);
    await load();
  };

  const today = new Date().toISOString().split("T")[0];
  const overdue = tasks.filter(t=>t.due_date&&t.due_date<today);
  const todayTasks = tasks.filter(t=>t.due_date===today);
  const upcoming = tasks.filter(t=>!t.due_date||(t.due_date>today));

  if(tasks.length===0) return (
    <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:14, padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e", textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Tareas pendientes</div>
      <div style={{ color:"#9ca3af", fontSize:13, textAlign:"center", padding:"12px 0" }}>Sin tareas pendientes</div>
    </div>
  );

  return (
    <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:14, padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e", textTransform:"uppercase", letterSpacing:0.8, marginBottom:14 }}>
        Tareas pendientes {tasks.length>0&&<span style={{ background:"#ef4444", color:"#fff", borderRadius:20, fontSize:10, padding:"1px 6px", marginLeft:6 }}>{tasks.length}</span>}
      </div>
      {overdue.length>0&&<div style={{ marginBottom:10 }}>
        <div style={{ fontSize:10, color:"#ef4444", fontWeight:700, textTransform:"uppercase", marginBottom:6 }}>Vencidas ({overdue.length})</div>
        {overdue.slice(0,3).map(t=><TaskRow key={t.id} task={t} onToggle={toggle} color="#ef4444"/>)}
      </div>}
      {todayTasks.length>0&&<div style={{ marginBottom:10 }}>
        <div style={{ fontSize:10, color:"#f59e0b", fontWeight:700, textTransform:"uppercase", marginBottom:6 }}>Hoy ({todayTasks.length})</div>
        {todayTasks.map(t=><TaskRow key={t.id} task={t} onToggle={toggle} color="#f59e0b"/>)}
      </div>}
      {upcoming.slice(0,4).map(t=><TaskRow key={t.id} task={t} onToggle={toggle} color="#6366f1"/>)}
    </div>
  );
};

const TaskRow = ({ task, onToggle, color }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:8, background:"#f9f7f4", marginBottom:4, border:"1px solid #f0ebe3" }}>
    <div onClick={()=>onToggle(task)} style={{ width:18, height:18, borderRadius:5, border:`2px solid ${color}`, cursor:"pointer", flexShrink:0 }}/>
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontSize:12, fontWeight:500, color:"#1a1a2e", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{task.title}</div>
      {task.due_date&&<div style={{ fontSize:10, color:"#9ca3af" }}>{task.due_date}</div>}
    </div>
    {task.assigned_to&&<div style={{ fontSize:10, color:"#9ca3af", flexShrink:0 }}>{task.assigned_to.split(" ")[0]}</div>}
  </div>
);
