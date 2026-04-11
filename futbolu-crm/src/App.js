import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

const AGENTS = ["Moha", "Ignacio de Béjar"];
const SPORTS = ["Todos", "Fútbol", "Tenis", "Natación", "Béisbol", "Baloncesto", "Atletismo", "Golf", "Voleibol"];
const STATUSES = ["Todos", "Becado", "En proceso", "Prospecto", "Inactivo"];
const POSITIONS = ["Portero","Defensa Central","Lateral Derecho","Lateral Izquierdo","Pivote","Centrocampista","Mediapunta","Extremo Derecho","Extremo Izquierdo","Delantero Centro","N/A"];
const FEET = ["Derecho","Zurdo","Ambidiestro"];
const OFFER_STATUSES = ["Interesada","Oferta formal","Pre-aceptada","Rechazada","Elegida ✓"];
const STATUS_COLORS = { "Becado":"#22c55e","En proceso":"#f59e0b","Prospecto":"#3b82f6","Inactivo":"#6b7280" };
const OFFER_COLORS = { "Interesada":"#6366f1","Oferta formal":"#f59e0b","Pre-aceptada":"#22c55e","Rechazada":"#ef4444","Elegida ✓":"#10b981" };

// ── helpers ──────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 40 }) => {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("");
  const pal = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6","#f97316"];
  const c = pal[name.charCodeAt(0) % pal.length];
  return <div style={{ width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${c}99,${c})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.34,fontWeight:800,color:"#fff",flexShrink:0,border:"2px solid rgba(255,255,255,0.08)" }}>{initials}</div>;
};
const Badge = ({ status }) => <span style={{ padding:"3px 11px",borderRadius:20,fontSize:11,fontWeight:700,background:`${STATUS_COLORS[status]}18`,color:STATUS_COLORS[status],border:`1px solid ${STATUS_COLORS[status]}33`,whiteSpace:"nowrap" }}>{status}</span>;
const OfferBadge = ({ status }) => <span style={{ padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:`${OFFER_COLORS[status]||"#6b7280"}18`,color:OFFER_COLORS[status]||"#6b7280",border:`1px solid ${OFFER_COLORS[status]||"#6b7280"}33` }}>{status}</span>;
const Pill = ({ label, color="#6b7280" }) => <span style={{ padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:`${color}15`,color,border:`1px solid ${color}28` }}>{label}</span>;
const Bar = ({ value, max, color="#6366f1", h=5 }) => <div style={{ width:"100%",background:"rgba(255,255,255,0.06)",borderRadius:99,height:h }}><div style={{ width:`${Math.min(100,max>0?(value/max)*100:0)}%`,background:`linear-gradient(90deg,${color}66,${color})`,height:"100%",borderRadius:99,transition:"width .5s" }} /></div>;
const Card = ({ children, style={} }) => <div style={{ background:"linear-gradient(145deg,#181b2a,#111420)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"20px 22px",...style }}>{children}</div>;
const StatCard = ({ label, value, sub, color="#6366f1", icon }) => (
  <div style={{ background:"linear-gradient(145deg,#181b2a,#111420)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"18px 22px",position:"relative",overflow:"hidden" }}>
    <div style={{ position:"absolute",top:-20,right:-20,width:70,height:70,borderRadius:"50%",background:`radial-gradient(circle,${color}20,transparent)` }} />
    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}><span style={{ color }}>{icon}</span><span style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:"#6b7280" }}>{label}</span></div>
    <div style={{ fontSize:28,fontWeight:900,color:"#f9fafb",lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:12,color:"#6b7280",marginTop:6 }}>{sub}</div>}
  </div>
);
const Svg = ({ d, size=16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
const Ic = {
  dash: <Svg d="M3 3h7v7H3zm11 0h7v7h-7zm0 11h7v7h-7zM3 14h7v7H3z" />,
  players: <Svg d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm14 18v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
  fin: <Svg d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  uni: <Svg d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10" />,
  search: <Svg d="M21 21l-4.35-4.35M11 19A8 8 0 1 0 11 3a8 8 0 0 0 0 16z" />,
  plus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  back: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>,
  edit: <Svg d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />,
  video: <Svg d="M22.54 6.42A2.78 2.78 0 0 0 20.7 4.56C19.08 4 12 4 12 4s-7.08 0-8.7.56A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.3 19.44C4.92 20 12 20 12 20s7.08 0 8.7-.56a2.78 2.78 0 0 0 1.84-1.86A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02l5.5-3.02-5.5-3.02z" />,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  trophy: <Svg d="M8 21h8M12 17v4M7 4v6a5 5 0 0 0 10 0V4M17 4h2a2 2 0 0 1 2 2v1a3 3 0 0 1-3 3h-1M7 4H5a2 2 0 0 0-2 2v1a3 3 0 0 0 3 3h1" />,
  alert: <Svg d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />,
  ball: <Svg d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2zM2 12h20" />,
  star: <Svg d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />,
  refresh: <Svg d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />,
};

// ── DB helpers ────────────────────────────────────────────────────────────────
const dbToPlayer = (row, offers = [], timeline = []) => ({
  id: row.id, name: row.name, sport: row.sport, nationality: row.nationality, age: row.age,
  position: row.position, foot: row.foot, height: row.height, weight: row.weight,
  status: row.status, agent: row.agent, phone: row.phone, email: row.email,
  instagram: row.instagram, videoUrl: row.video_url,
  gpa: row.gpa, satScore: row.sat_score, englishLevel: row.english_level,
  highSchool: row.high_school, graduationYear: row.graduation_year, major: row.major,
  toeflScore: row.toefl_score, university: row.university, state: row.state,
  scholarshipPct: row.scholarship_pct, startDate: row.start_date, contractEnd: row.contract_end,
  notes: row.notes,
  payment1: { paid: row.payment1_paid, paidBy: row.payment1_paid_by, date: row.payment1_date },
  payment2: { paid: row.payment2_paid, paidBy: row.payment2_paid_by, date: row.payment2_date },
  offers: offers.map(o => ({ id: o.id, university: o.university, state: o.state, division: o.division, scholarshipPct: o.scholarship_pct, status: o.status, notes: o.notes })),
  timeline: timeline.map(t => ({ id: t.id, date: t.date, event: t.event, type: t.type })),
});

const playerToDb = (p) => ({
  name: p.name, sport: p.sport, nationality: p.nationality, age: p.age || null,
  position: p.position, foot: p.foot, height: p.height || null, weight: p.weight || null,
  status: p.status, agent: p.agent, phone: p.phone, email: p.email,
  instagram: p.instagram, video_url: p.videoUrl,
  gpa: p.gpa || null, sat_score: p.satScore || null, english_level: p.englishLevel,
  high_school: p.highSchool, graduation_year: p.graduationYear || null, major: p.major,
  toefl_score: p.toeflScore || null, university: p.university, state: p.state,
  scholarship_pct: p.scholarshipPct || 0,
  start_date: p.startDate || null, contract_end: p.contractEnd || null, notes: p.notes,
  payment1_paid: p.payment1?.paid || false, payment1_paid_by: p.payment1?.paidBy || null, payment1_date: p.payment1?.date || null,
  payment2_paid: p.payment2?.paid || false, payment2_paid_by: p.payment2?.paidBy || null, payment2_date: p.payment2?.date || null,
});

// ── Payment Row ───────────────────────────────────────────────────────────────
const PaymentRow = ({ label, amount, payment, onToggle }) => (
  <div style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 16px",background:payment.paid?"rgba(34,197,94,0.06)":"rgba(245,158,11,0.05)",borderRadius:12,border:`1px solid ${payment.paid?"rgba(34,197,94,0.18)":"rgba(245,158,11,0.18)"}` }}>
    <div style={{ width:30,height:30,borderRadius:"50%",background:payment.paid?"rgba(34,197,94,0.2)":"rgba(245,158,11,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
      {payment.paid?<span style={{ color:"#22c55e" }}>{Ic.check}</span>:<span style={{ color:"#f59e0b" }}>{Ic.alert}</span>}
    </div>
    <div style={{ flex:1 }}>
      <div style={{ fontSize:13,fontWeight:700,color:"#e5e7eb" }}>{label} — <span style={{ color:"#f9fafb" }}>{amount}€</span></div>
      {payment.paid
        ?<div style={{ fontSize:11,color:"#6b7280",marginTop:2 }}>Cobrado por <span style={{ color:payment.paidBy==="Moha"?"#818cf8":"#fbbf24",fontWeight:700 }}>{payment.paidBy}</span> · {payment.date}</div>
        :<div style={{ fontSize:11,color:"#f59e0b",marginTop:2 }}>Pendiente de cobro</div>}
    </div>
    <div style={{ display:"flex",gap:6 }}>
      {!payment.paid&&AGENTS.map(agent=>(
        <button key={agent} onClick={()=>onToggle(agent)} style={{ padding:"5px 10px",borderRadius:8,border:"none",background:agent==="Moha"?"rgba(99,102,241,0.25)":"rgba(245,158,11,0.2)",color:agent==="Moha"?"#818cf8":"#fbbf24",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit" }}>
          ✓ {agent==="Moha"?"Moha":"Ignacio"}
        </button>
      ))}
      {payment.paid&&<button onClick={()=>onToggle(null)} style={{ padding:"5px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"none",color:"#6b7280",cursor:"pointer",fontSize:11,fontFamily:"inherit" }}>Deshacer</button>}
    </div>
  </div>
);

// ── Player Modal ──────────────────────────────────────────────────────────────
const PlayerModal = ({ initial, onClose, onSave }) => {
  const blank = { name:"",sport:"Fútbol",nationality:"",age:"",position:"Delantero Centro",foot:"Derecho",height:"",weight:"",status:"Prospecto",agent:"Moha",phone:"",email:"",instagram:"",videoUrl:"",gpa:"",satScore:"",englishLevel:"B2",highSchool:"",graduationYear:"",major:"",toeflScore:"",university:"",state:"",scholarshipPct:0,startDate:"",contractEnd:"",notes:"" };
  const [form, setForm] = useState(initial?{...initial,videoUrl:initial.videoUrl||"",satScore:initial.satScore||"",toeflScore:initial.toeflScore||""}:blank);
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const inp = { background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,padding:"9px 13px",color:"#f9fafb",fontSize:13,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"inherit" };
  const lbl = { fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:5,display:"block" };
  const F = ({ l,k,type="text",opts }) => (
    <div><label style={lbl}>{l}</label>
      {opts?<select style={{ ...inp,cursor:"pointer" }} value={form[k]||""} onChange={e=>set(k,e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select>
           :<input style={inp} type={type} value={form[k]||""} onChange={e=>set(k,e.target.value)} placeholder={l}/>}
    </div>
  );
  const save = async () => {
    if(!form.name.trim()) return;
    setSaving(true);
    await onSave({...form,age:parseInt(form.age)||0,height:parseInt(form.height)||0,weight:parseInt(form.weight)||0,gpa:parseFloat(form.gpa)||0,satScore:parseInt(form.satScore)||null,toeflScore:parseInt(form.toeflScore)||null,scholarshipPct:parseInt(form.scholarshipPct)||0});
    setSaving(false);
    onClose();
  };
  const sec = (label,color) => <div style={{ fontSize:10,fontWeight:800,color,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${color}22` }}>{label}</div>;
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }}>
      <div style={{ background:"#12141f",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,width:"100%",maxWidth:680,maxHeight:"92vh",overflowY:"auto" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"24px 28px 0" }}>
          <h2 style={{ margin:0,fontSize:19,fontWeight:800,color:"#f9fafb" }}>{initial?"Editar atleta":"Nuevo atleta"}</h2>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#6b7280",cursor:"pointer" }}>{Ic.x}</button>
        </div>
        <div style={{ padding:"20px 28px 28px",display:"flex",flexDirection:"column",gap:22 }}>
          <div>{sec("Datos personales","#6366f1")}<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}><F l="Nombre completo" k="name"/><F l="Nacionalidad" k="nationality"/><F l="Edad" k="age" type="number"/><F l="Email" k="email" type="email"/><F l="Teléfono" k="phone"/><F l="Instagram" k="instagram"/></div></div>
          <div>{sec("Información deportiva","#22c55e")}<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}><F l="Deporte" k="sport" opts={SPORTS.slice(1)}/><F l="Posición" k="position" opts={POSITIONS}/><F l="Pie dominante" k="foot" opts={FEET}/><F l="Agente asignado" k="agent" opts={AGENTS}/><F l="Altura (cm)" k="height" type="number"/><F l="Peso (kg)" k="weight" type="number"/><F l="Estado" k="status" opts={STATUSES.slice(1)}/><div><label style={lbl}>Enlace vídeo</label><input style={inp} type="url" value={form.videoUrl||""} onChange={e=>set("videoUrl",e.target.value)} placeholder="https://youtube.com/..."/></div></div></div>
          <div>{sec("Información académica","#f59e0b")}<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}><F l="Colegio / High School" k="highSchool"/><F l="Año graduación" k="graduationYear" type="number"/><F l="GPA (sobre 4.0)" k="gpa" type="number"/><F l="SAT Score" k="satScore" type="number"/><F l="TOEFL Score" k="toeflScore" type="number"/><F l="Nivel de inglés" k="englishLevel" opts={["A1","A2","B1","B2","C1","C2","Nativo"]}/><div style={{ gridColumn:"1/-1" }}><F l="Carrera de interés (Major)" k="major"/></div></div></div>
          <div>{sec("Beca / Universidad","#8b5cf6")}<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}><F l="Universidad destino" k="university"/><F l="Estado USA" k="state"/><div><label style={lbl}>% Beca</label><input style={inp} type="number" min="0" max="100" value={form.scholarshipPct||0} onChange={e=>set("scholarshipPct",e.target.value)}/></div><F l="Inicio temporada" k="startDate" type="date"/></div></div>
          <div><label style={lbl}>Notas internas</label><textarea style={{ ...inp,minHeight:70,resize:"vertical" }} value={form.notes||""} onChange={e=>set("notes",e.target.value)} placeholder="Observaciones..."/></div>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"none",color:"#9ca3af",cursor:"pointer",fontSize:14,fontWeight:600,fontFamily:"inherit" }}>Cancelar</button>
            <button onClick={save} disabled={saving} style={{ flex:2,padding:12,borderRadius:10,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:800,fontFamily:"inherit",opacity:saving?0.7:1 }}>{saving?"Guardando...":initial?"Guardar cambios":"Crear perfil"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Offer Modal ───────────────────────────────────────────────────────────────
const OfferModal = ({ onClose, onAdd }) => {
  const [f,setF] = useState({ university:"",state:"",division:"D1",scholarshipPct:"",status:"Interesada",notes:"" });
  const [saving,setSaving] = useState(false);
  const inp = { background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,padding:"9px 13px",color:"#f9fafb",fontSize:13,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"inherit" };
  const lbl = { fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:5,display:"block" };
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:20 }}>
      <div style={{ background:"#12141f",border:"1px solid rgba(255,255,255,0.1)",borderRadius:18,padding:28,width:"100%",maxWidth:420 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <h3 style={{ margin:0,fontSize:17,fontWeight:800,color:"#f9fafb" }}>Nueva oferta universitaria</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#6b7280",cursor:"pointer" }}>{Ic.x}</button>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <div style={{ gridColumn:"1/-1" }}><label style={lbl}>Universidad</label><input style={inp} value={f.university} onChange={e=>setF(p=>({...p,university:e.target.value}))} placeholder="Nombre de la universidad"/></div>
          <div><label style={lbl}>Estado USA</label><input style={inp} value={f.state} onChange={e=>setF(p=>({...p,state:e.target.value}))} placeholder="California..."/></div>
          <div><label style={lbl}>División</label><select style={{ ...inp,cursor:"pointer" }} value={f.division} onChange={e=>setF(p=>({...p,division:e.target.value}))}><option>D1</option><option>D2</option><option>D3</option><option>NAIA</option></select></div>
          <div><label style={lbl}>% Beca ofrecida</label><input style={inp} type="number" min="0" max="100" value={f.scholarshipPct} onChange={e=>setF(p=>({...p,scholarshipPct:e.target.value}))}/></div>
          <div><label style={lbl}>Estado oferta</label><select style={{ ...inp,cursor:"pointer" }} value={f.status} onChange={e=>setF(p=>({...p,status:e.target.value}))}>{OFFER_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div style={{ gridColumn:"1/-1" }}><label style={lbl}>Notas</label><input style={inp} value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Detalles..."/></div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:20 }}>
          <button onClick={onClose} style={{ flex:1,padding:"10px",borderRadius:9,border:"1px solid rgba(255,255,255,0.1)",background:"none",color:"#9ca3af",cursor:"pointer",fontWeight:600,fontFamily:"inherit" }}>Cancelar</button>
          <button onClick={async()=>{ if(f.university&&!saving){ setSaving(true); await onAdd({...f,scholarshipPct:parseInt(f.scholarshipPct)||0}); setSaving(false); onClose(); }}} style={{ flex:2,padding:"10px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:13,fontFamily:"inherit",opacity:saving?0.7:1 }}>{saving?"Guardando...":"Añadir oferta"}</button>
        </div>
      </div>
    </div>
  );
};

// ── Player Detail ─────────────────────────────────────────────────────────────
const PlayerDetail = ({ player, onBack, onUpdate, onRefresh }) => {
  const [tab,setTab] = useState("profile");
  const [editModal,setEditModal] = useState(false);
  const [offerModal,setOfferModal] = useState(false);
  const [saving,setSaving] = useState(false);

  const paid = (player.payment1.paid?900:0)+(player.payment2.paid?1800:0);
  const pending = 2700-paid;

  const handlePayment = async (num, agent) => {
    setSaving(true);
    const date = agent ? new Date().toISOString().split("T")[0] : null;
    const dbUpdate = num===1
      ? { payment1_paid: !!agent, payment1_paid_by: agent, payment1_date: date }
      : { payment2_paid: !!agent, payment2_paid_by: agent, payment2_date: date };
    await supabase.from("players").update(dbUpdate).eq("id", player.id);
    if (agent) {
      await supabase.from("timeline").insert({ player_id: player.id, date, event: `${num===1?"Pago inicial (900€)":"Segundo pago (1.800€)"} cobrado por ${agent}`, type: "payment" });
    }
    await onRefresh();
    setSaving(false);
  };

  const addOffer = async (offer) => {
    await supabase.from("offers").insert({ player_id: player.id, university: offer.university, state: offer.state, division: offer.division, scholarship_pct: offer.scholarshipPct, status: offer.status, notes: offer.notes });
    await onRefresh();
  };

  const updateOfferStatus = async (offerId, status) => {
    await supabase.from("offers").update({ status }).eq("id", offerId);
    await onRefresh();
  };

  const removeOffer = async (offerId) => {
    await supabase.from("offers").delete().eq("id", offerId);
    await onRefresh();
  };

  const tabs = [
    { id:"profile",label:"Perfil" },{ id:"sports",label:"Deportivo" },{ id:"academic",label:"Académico" },
    { id:"offers",label:`Ofertas (${player.offers?.length||0})` },{ id:"payments",label:"Pagos" },{ id:"timeline",label:"Historial" },
  ];
  const tlColor = { contact:"#6366f1",contract:"#8b5cf6",milestone:"#22c55e",achievement:"#f59e0b",payment:"#10b981" };
  const tlEmoji = { contact:"👋",contract:"✍️",milestone:"🎯",achievement:"🏆",payment:"💰" };

  return (
    <div>
      <button onClick={onBack} style={{ display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:13,marginBottom:20,padding:0,fontFamily:"inherit" }}>
        {Ic.back} Volver a jugadores
      </button>
      <Card style={{ marginBottom:20 }}>
        <div style={{ display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap" }}>
          <Avatar name={player.name} size={76}/>
          <div style={{ flex:1,minWidth:200 }}>
            <div style={{ display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:7 }}>
              <h1 style={{ margin:0,fontSize:24,fontWeight:900,color:"#f9fafb" }}>{player.name}</h1>
              <Badge status={player.status}/>
              <Pill label={player.sport} color="#6366f1"/>
              {player.position!=="N/A"&&<Pill label={player.position} color="#8b5cf6"/>}
            </div>
            <div style={{ display:"flex",gap:16,flexWrap:"wrap",marginBottom:12 }}>
              {[[player.nationality,"#9ca3af"],[player.age+" años","#9ca3af"],[player.university,player.university==="Por definir"?"#4b5563":"#22c55e"],[player.agent,player.agent==="Moha"?"#818cf8":"#fbbf24"]].map(([v,c])=>v&&<span key={v} style={{ fontSize:13,color:c,fontWeight:600 }}>{v}</span>)}
            </div>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
              <div style={{ background:paid>=2700?"rgba(34,197,94,0.12)":paid>0?"rgba(245,158,11,0.1)":"rgba(239,68,68,0.1)",borderRadius:10,padding:"6px 14px",border:`1px solid ${paid>=2700?"rgba(34,197,94,0.25)":paid>0?"rgba(245,158,11,0.25)":"rgba(239,68,68,0.25)"}` }}>
                <span style={{ fontSize:13,fontWeight:800,color:paid>=2700?"#22c55e":paid>0?"#f59e0b":"#ef4444" }}>{paid>=2700?"✓ 2.700€ cobrados":`${paid}€ / 2.700€`}</span>
              </div>
              {player.videoUrl&&<a href={player.videoUrl} target="_blank" rel="noreferrer" style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"6px 14px",textDecoration:"none",color:"#f87171",fontSize:13,fontWeight:700 }}>{Ic.video} Ver vídeo</a>}
            </div>
          </div>
          <button onClick={()=>setEditModal(true)} style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"#9ca3af",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit" }}>{Ic.edit} Editar</button>
        </div>
      </Card>

      <div style={{ display:"flex",gap:2,marginBottom:20,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:4,overflowX:"auto",flexWrap:"wrap" }}>
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"8px 15px",borderRadius:9,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap",background:tab===t.id?"rgba(99,102,241,0.25)":"none",color:tab===t.id?"#818cf8":"#6b7280",transition:"all .15s",fontFamily:"inherit" }}>{t.label}</button>)}
      </div>

      {tab==="profile"&&(
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          {[["Email",player.email],["Teléfono",player.phone],["Instagram",player.instagram||"—"],["Nacionalidad",player.nationality],["Edad",player.age+" años"],["Agente",player.agent]].map(([l,v])=>(
            <div key={l} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 16px" }}>
              <div style={{ fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontWeight:700 }}>{l}</div>
              <div style={{ fontSize:14,color:"#e5e7eb",fontWeight:600 }}>{v}</div>
            </div>
          ))}
          {player.videoUrl&&<div style={{ gridColumn:"1/-1",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:12,padding:"12px 16px" }}>
            <div style={{ fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:700 }}>Vídeo deportivo</div>
            <a href={player.videoUrl} target="_blank" rel="noreferrer" style={{ display:"flex",alignItems:"center",gap:8,color:"#f87171",textDecoration:"none",fontSize:13,fontWeight:700 }}>{Ic.video} {player.videoUrl}</a>
          </div>}
          {player.notes&&<div style={{ gridColumn:"1/-1",background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:12,padding:"14px 18px" }}>
            <div style={{ fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:700 }}>Notas internas</div>
            <div style={{ fontSize:14,color:"#d1d5db",lineHeight:1.7 }}>{player.notes}</div>
          </div>}
        </div>
      )}

      {tab==="sports"&&(
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          {[["Deporte",player.sport],["Posición",player.position],["Pie dominante",player.foot],["Altura",player.height?player.height+" cm":"—"],["Peso",player.weight?player.weight+" kg":"—"],["Universidad",player.university],["Estado USA",player.state||"—"],["División","D1"],["% Beca",player.scholarshipPct+"%"],["Inicio",player.startDate||"—"],["Fin contrato",player.contractEnd||"—"]].map(([l,v])=>(
            <div key={l} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 16px" }}>
              <div style={{ fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontWeight:700 }}>{l}</div>
              <div style={{ fontSize:14,color:l==="% Beca"?"#6366f1":"#e5e7eb",fontWeight:700 }}>{v}</div>
            </div>
          ))}
          <div style={{ gridColumn:"1/-1" }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}><span style={{ fontSize:13,color:"#9ca3af",fontWeight:600 }}>Beca universitaria</span><span style={{ fontSize:14,fontWeight:900,color:"#6366f1" }}>{player.scholarshipPct}%</span></div>
            <Bar value={player.scholarshipPct} max={100} color="#6366f1" h={8}/>
          </div>
        </div>
      )}

      {tab==="academic"&&(
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <div style={{ gridColumn:"1/-1",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12 }}>
            {[["GPA",player.gpa||"—",player.gpa>=3.5?"#22c55e":player.gpa>=3?"#f59e0b":"#ef4444"],["SAT",player.satScore||"—","#6366f1"],["TOEFL",player.toeflScore||"—","#8b5cf6"],["Inglés",player.englishLevel||"—","#3b82f6"]].map(([l,v,c])=>(
              <div key={l} style={{ background:"rgba(255,255,255,0.03)",border:`1px solid ${c}22`,borderRadius:12,padding:"16px",textAlign:"center" }}>
                <div style={{ fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:8,fontWeight:700 }}>{l}</div>
                <div style={{ fontSize:26,fontWeight:900,color:c }}>{v}</div>
              </div>
            ))}
          </div>
          {[["High School",player.highSchool||"—"],["Graduación",player.graduationYear||"—"],["Carrera (Major)",player.major||"—"],["Nivel inglés",player.englishLevel||"—"]].map(([l,v])=>(
            <div key={l} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 16px" }}>
              <div style={{ fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontWeight:700 }}>{l}</div>
              <div style={{ fontSize:14,color:"#e5e7eb",fontWeight:600 }}>{v}</div>
            </div>
          ))}
          <div style={{ gridColumn:"1/-1",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"16px 18px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}><span style={{ fontSize:13,color:"#9ca3af",fontWeight:600 }}>GPA</span><span style={{ fontSize:14,fontWeight:900,color:player.gpa>=3.5?"#22c55e":player.gpa>=3?"#f59e0b":"#ef4444" }}>{player.gpa||0} / 4.0</span></div>
            <Bar value={player.gpa||0} max={4} color={player.gpa>=3.5?"#22c55e":player.gpa>=3?"#f59e0b":"#ef4444"} h={8}/>
          </div>
        </div>
      )}

      {tab==="offers"&&(
        <div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
            <span style={{ fontSize:13,color:"#6b7280" }}>{player.offers?.length||0} universidades</span>
            <button onClick={()=>setOfferModal(true)} style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit" }}>{Ic.plus} Nueva oferta</button>
          </div>
          {(!player.offers||player.offers.length===0)&&<div style={{ textAlign:"center",padding:"50px 20px",color:"#4b5563" }}><div style={{ fontSize:36,marginBottom:10 }}>🏫</div><div style={{ fontSize:15,fontWeight:600,color:"#6b7280" }}>Sin ofertas registradas</div></div>}
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {(player.offers||[]).sort((a,b)=>b.scholarshipPct-a.scholarshipPct).map(offer=>(
              <div key={offer.id} style={{ background:offer.status==="Elegida ✓"?"rgba(16,185,129,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${offer.status==="Elegida ✓"?"rgba(16,185,129,0.25)":"rgba(255,255,255,0.07)"}`,borderRadius:14,padding:"16px 18px" }}>
                <div style={{ display:"flex",alignItems:"flex-start",gap:14 }}>
                  <div style={{ width:44,height:44,background:"rgba(255,255,255,0.06)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>🏛️</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:6 }}>
                      <span style={{ fontSize:16,fontWeight:800,color:"#f9fafb" }}>{offer.university}</span>
                      <OfferBadge status={offer.status}/>
                      <Pill label={offer.division} color="#6b7280"/>
                    </div>
                    <div style={{ fontSize:13,color:"#9ca3af",marginBottom:8 }}>{offer.state} · Beca: <span style={{ color:"#6366f1",fontWeight:800 }}>{offer.scholarshipPct}%</span></div>
                    {offer.notes&&<div style={{ fontSize:12,color:"#6b7280",fontStyle:"italic" }}>{offer.notes}</div>}
                    <div style={{ marginTop:10 }}><Bar value={offer.scholarshipPct} max={100} color={OFFER_COLORS[offer.status]||"#6366f1"} h={4}/></div>
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                    <select value={offer.status} onChange={e=>updateOfferStatus(offer.id,e.target.value)} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"5px 8px",color:"#f9fafb",fontSize:11,fontWeight:700,cursor:"pointer",outline:"none",fontFamily:"inherit" }}>
                      {OFFER_STATUSES.map(s=><option key={s}>{s}</option>)}
                    </select>
                    <button onClick={()=>removeOffer(offer.id)} style={{ background:"none",border:"1px solid rgba(239,68,68,0.2)",color:"#ef4444",cursor:"pointer",borderRadius:7,padding:"4px 8px",fontSize:11,fontFamily:"inherit" }}>Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="payments"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
            <StatCard label="Total agencia" value="2.700€" color="#6366f1" icon={Ic.fin}/>
            <StatCard label="Cobrado" value={`${paid}€`} color="#22c55e" icon={Ic.check} sub={`${Math.round((paid/2700)*100)}%`}/>
            <StatCard label="Pendiente" value={`${pending}€`} color={pending>0?"#f59e0b":"#22c55e"} icon={Ic.alert}/>
          </div>
          <Card>
            <div style={{ fontSize:10,fontWeight:800,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:14 }}>Estructura de pagos FutbolU Agency</div>
            {saving&&<div style={{ fontSize:12,color:"#6366f1",marginBottom:10 }}>Guardando...</div>}
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              <PaymentRow label="Pago inicial" amount="900" payment={player.payment1} onToggle={a=>handlePayment(1,a)}/>
              <PaymentRow label="Segundo pago" amount="1.800" payment={player.payment2} onToggle={a=>handlePayment(2,a)}/>
            </div>
          </Card>
          <Card>
            <div style={{ fontSize:10,fontWeight:800,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:14 }}>Cobros por socio (este cliente)</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
              {AGENTS.map(agent=>{
                const p1=player.payment1.paid&&player.payment1.paidBy===agent?900:0;
                const p2=player.payment2.paid&&player.payment2.paidBy===agent?1800:0;
                return (
                  <div key={agent} style={{ background:"rgba(255,255,255,0.03)",border:`1px solid ${agent==="Moha"?"rgba(99,102,241,0.2)":"rgba(245,158,11,0.2)"}`,borderRadius:12,padding:"14px 16px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
                      <div style={{ width:32,height:32,borderRadius:"50%",background:agent==="Moha"?"linear-gradient(135deg,#6366f1,#8b5cf6)":"linear-gradient(135deg,#f59e0b,#f97316)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff" }}>{agent==="Moha"?"M":"I"}</div>
                      <span style={{ fontSize:14,fontWeight:800,color:"#f9fafb" }}>{agent}</span>
                    </div>
                    <div style={{ fontSize:22,fontWeight:900,color:agent==="Moha"?"#818cf8":"#fbbf24" }}>{p1+p2}€</div>
                    <div style={{ fontSize:11,color:"#6b7280",marginTop:4 }}>{[p1&&"Inicial (900€)",p2&&"Segundo (1.800€)"].filter(Boolean).join(" + ")||"Sin cobros"}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab==="timeline"&&(
        <div style={{ position:"relative",paddingLeft:28 }}>
          <div style={{ position:"absolute",left:10,top:8,bottom:0,width:2,background:"rgba(255,255,255,0.06)",borderRadius:2 }}/>
          {(player.timeline||[]).map((evt,i)=>{
            const c=tlColor[evt.type]||"#6b7280";
            return (
              <div key={i} style={{ position:"relative",marginBottom:18 }}>
                <div style={{ position:"absolute",left:-22,top:11,width:14,height:14,borderRadius:"50%",background:c,border:"3px solid #0d0f1a",boxShadow:`0 0 10px ${c}55` }}/>
                <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 16px" }}>
                  <div style={{ fontSize:11,color:"#6b7280",marginBottom:4 }}>{evt.date}</div>
                  <div style={{ fontSize:14,color:"#e5e7eb",fontWeight:600 }}>{tlEmoji[evt.type]} {evt.event}</div>
                </div>
              </div>
            );
          })}
          {(!player.timeline||player.timeline.length===0)&&<div style={{ textAlign:"center",padding:40,color:"#6b7280" }}>Sin eventos registrados</div>}
        </div>
      )}

      {editModal&&<PlayerModal initial={player} onClose={()=>setEditModal(false)} onSave={async(p)=>{ await supabase.from("players").update(playerToDb(p)).eq("id",p.id); await onRefresh(); }}/>}
      {offerModal&&<OfferModal onClose={()=>setOfferModal(false)} onAdd={addOffer}/>}
    </div>
  );
};

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nav, setNav] = useState("dashboard");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [fSport, setFSport] = useState("Todos");
  const [fStatus, setFStatus] = useState("Todos");
  const [fAgent, setFAgent] = useState("Todos");
  const [addModal, setAddModal] = useState(false);

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("players").select("*").order("created_at", { ascending: false });
    if (!rows) { setLoading(false); return; }
    const { data: allOffers } = await supabase.from("offers").select("*");
    const { data: allTimeline } = await supabase.from("timeline").select("*").order("date", { ascending: true });
    const mapped = rows.map(r => dbToPlayer(
      r,
      (allOffers||[]).filter(o=>o.player_id===r.id),
      (allTimeline||[]).filter(t=>t.player_id===r.id)
    ));
    setPlayers(mapped);
    if (selected) {
      const updated = mapped.find(p => p.id === selected.id);
      if (updated) setSelected(updated);
    }
    setLoading(false);
  }); // eslint-disable-line

  useEffect(() => { loadPlayers(); }, []); // eslint-disable-line

  const addPlayer = async (p) => {
    const { data } = await supabase.from("players").insert(playerToDb(p)).select().single();
    if (data) {
      await supabase.from("timeline").insert({ player_id: data.id, date: new Date().toISOString().split("T")[0], event: "Perfil creado", type: "contact" });
    }
    await loadPlayers();
  };

  const filtered = useMemo(()=>players.filter(p=>{
    const s=search.toLowerCase();
    return (p.name.toLowerCase().includes(s)||p.university?.toLowerCase().includes(s)||p.nationality?.toLowerCase().includes(s))&&(fSport==="Todos"||p.sport===fSport)&&(fStatus==="Todos"||p.status===fStatus)&&(fAgent==="Todos"||p.agent===fAgent);
  }),[players,search,fSport,fStatus,fAgent]);

  const totalFees = players.length*2700;
  const totalColl = players.reduce((s,p)=>s+(p.payment1.paid?900:0)+(p.payment2.paid?1800:0),0);
  const totalPend = totalFees-totalColl;
  const agentStats = AGENTS.map(agent=>({
    agent,
    total:players.reduce((s,p)=>s+(p.payment1.paid&&p.payment1.paidBy===agent?900:0)+(p.payment2.paid&&p.payment2.paidBy===agent?1800:0),0),
    p1:players.filter(p=>p.payment1.paid&&p.payment1.paidBy===agent).length,
    p2:players.filter(p=>p.payment2.paid&&p.payment2.paidBy===agent).length,
  }));
  const allOffers = players.flatMap(p=>(p.offers||[]).map(o=>({...o,playerName:p.name,playerId:p.id})));

  const navItems = [
    { id:"dashboard",label:"Dashboard",icon:Ic.dash },
    { id:"players",label:"Jugadores",icon:Ic.players },
    { id:"offers",label:"Universidades",icon:Ic.uni },
    { id:"payments",label:"Pagos",icon:Ic.fin },
  ];
  const go = (n) => { setNav(n); setSelected(null); };

  if (loading) return (
    <div style={{ fontFamily:"'Syne','DM Sans',sans-serif",background:"#0d0f1a",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap')`}</style>
      <div style={{ width:44,height:44,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center" }}>{Ic.ball}</div>
      <div style={{ fontSize:16,fontWeight:700,color:"#6b7280" }}>Cargando FutbolU CRM...</div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Syne','DM Sans',sans-serif",background:"#0d0f1a",color:"#f9fafb",minHeight:"100vh",display:"flex" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:4px}select option{background:#181b2a;color:#f9fafb}.prow:hover{border-color:rgba(99,102,241,.3)!important;background:linear-gradient(145deg,#1e2135,#151726)!important}`}</style>

      {/* Sidebar */}
      <div style={{ width:228,background:"#0a0c16",borderRight:"1px solid rgba(255,255,255,0.05)",padding:"24px 14px",display:"flex",flexDirection:"column",gap:3,flexShrink:0 }}>
        <div style={{ padding:"0 8px 24px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:38,height:38,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px rgba(99,102,241,0.4)" }}>{Ic.ball}</div>
            <div>
              <div style={{ fontSize:15,fontWeight:800,color:"#f9fafb",letterSpacing:-0.5 }}>FutbolU</div>
              <div style={{ fontSize:9,color:"#6b7280",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase" }}>Agency CRM</div>
            </div>
          </div>
        </div>
        {navItems.map(item=>(
          <button key={item.id} onClick={()=>go(item.id)} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 13px",borderRadius:11,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,background:nav===item.id?"rgba(99,102,241,0.18)":"none",color:nav===item.id?"#818cf8":"#5b6280",transition:"all .15s",textAlign:"left",fontFamily:"inherit" }}>
            <span style={{ opacity:nav===item.id?1:0.6 }}>{item.icon}</span>{item.label}
          </button>
        ))}
        <button onClick={loadPlayers} style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 13px",borderRadius:11,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:"none",color:"#4b5563",fontFamily:"inherit",marginTop:4 }}>
          {Ic.refresh} Actualizar
        </button>
        <div style={{ marginTop:"auto",padding:"14px 8px 0",borderTop:"1px solid rgba(255,255,255,0.05)" }}>
          {agentStats.map((s)=>(
            <div key={s.agent} style={{ display:"flex",gap:9,alignItems:"center",padding:"7px 4px" }}>
              <div style={{ width:30,height:30,borderRadius:"50%",background:s.agent==="Moha"?"linear-gradient(135deg,#6366f1,#8b5cf6)":"linear-gradient(135deg,#f59e0b,#f97316)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#fff" }}>{s.agent==="Moha"?"M":"I"}</div>
              <div>
                <div style={{ fontSize:12,fontWeight:700,color:"#e5e7eb" }}>{s.agent}</div>
                <div style={{ fontSize:10,color:"#6b7280" }}>{s.total}€ cobrados</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1,overflowY:"auto",padding:"30px 32px" }}>

        {nav==="dashboard"&&(
          <div>
            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontSize:27,fontWeight:800,color:"#f9fafb",letterSpacing:-0.5 }}>Dashboard</h1>
              <p style={{ color:"#6b7280",fontSize:14,marginTop:4 }}>Resumen general · FutbolU Agency</p>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22 }}>
              <StatCard label="Atletas" value={players.length} sub={`${players.filter(p=>p.status==="Becado").length} becados`} color="#6366f1" icon={Ic.players}/>
              <StatCard label="Revenue total" value={totalFees>0?`${(totalFees/1000).toFixed(1)}k€`:"0€"} sub="a 2.700€/atleta" color="#8b5cf6" icon={Ic.fin}/>
              <StatCard label="Cobrado" value={`${totalColl.toLocaleString()}€`} color="#22c55e" sub={totalFees>0?`${Math.round((totalColl/totalFees)*100)}% efectividad`:"—"} icon={Ic.check}/>
              <StatCard label="Pendiente" value={`${totalPend.toLocaleString()}€`} color="#f59e0b" sub={`${players.filter(p=>!p.payment2.paid).length} pagos finales abiertos`} icon={Ic.alert}/>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18 }}>
              <Card>
                <div style={{ fontSize:11,fontWeight:800,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:16 }}>Cobros por socio</div>
                {players.length===0?<div style={{ color:"#4b5563",fontSize:13 }}>Sin atletas todavía</div>:
                <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                  {agentStats.map(s=>(
                    <div key={s.agent}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <div style={{ width:26,height:26,borderRadius:"50%",background:s.agent==="Moha"?"linear-gradient(135deg,#6366f1,#8b5cf6)":"linear-gradient(135deg,#f59e0b,#f97316)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#fff" }}>{s.agent==="Moha"?"M":"I"}</div>
                          <span style={{ fontSize:14,fontWeight:700,color:"#e5e7eb" }}>{s.agent}</span>
                        </div>
                        <span style={{ fontSize:18,fontWeight:900,color:s.agent==="Moha"?"#818cf8":"#fbbf24" }}>{s.total}€</span>
                      </div>
                      <Bar value={s.total} max={totalColl||1} color={s.agent==="Moha"?"#6366f1":"#f59e0b"}/>
                      <div style={{ fontSize:11,color:"#6b7280",marginTop:5 }}>{s.p1} pagos iniciales · {s.p2} segundos pagos</div>
                    </div>
                  ))}
                </div>}
              </Card>
              <Card>
                <div style={{ fontSize:11,fontWeight:800,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:16 }}>Estado atletas</div>
                {players.length===0?<div style={{ color:"#4b5563",fontSize:13 }}>Sin atletas todavía</div>:
                <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                  {Object.entries(STATUS_COLORS).map(([status,color])=>{
                    const count=players.filter(p=>p.status===status).length;
                    return <div key={status}><div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}><span style={{ fontSize:13,color:"#9ca3af" }}>{status}</span><span style={{ fontSize:13,fontWeight:800,color }}>{count}</span></div><Bar value={count} max={players.length} color={color}/></div>;
                  })}
                </div>}
              </Card>
              <Card style={{ gridColumn:"1/-1" }}>
                <div style={{ fontSize:11,fontWeight:800,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:14 }}>Pagos pendientes</div>
                {players.filter(p=>!p.payment1.paid||!p.payment2.paid).length===0
                  ?<div style={{ textAlign:"center",padding:20,color:"#22c55e",fontWeight:700 }}>✓ Todos los pagos al día</div>
                  :<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10 }}>
                    {players.filter(p=>!p.payment1.paid||!p.payment2.paid).map(p=>(
                      <div key={p.id} onClick={()=>{ setNav("players"); setSelected(p); }} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(245,158,11,0.15)",borderRadius:12,cursor:"pointer" }}>
                        <Avatar name={p.name} size={36}/>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13,fontWeight:700,color:"#e5e7eb" }}>{p.name}</div>
                          <div style={{ fontSize:11,color:"#f59e0b" }}>{!p.payment1.paid?"Pago inicial (900€)":"Segundo pago (1.800€)"}</div>
                        </div>
                        <span style={{ fontSize:14,fontWeight:900,color:"#f59e0b" }}>{!p.payment1.paid?"900€":"1.800€"}</span>
                      </div>
                    ))}
                  </div>}
              </Card>
            </div>
          </div>
        )}

        {nav==="players"&&!selected&&(
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22 }}>
              <div><h1 style={{ fontSize:27,fontWeight:800,color:"#f9fafb",letterSpacing:-0.5 }}>Jugadores & Atletas</h1><p style={{ color:"#6b7280",fontSize:14,marginTop:4 }}>{players.length} atletas registrados</p></div>
              <button onClick={()=>setAddModal(true)} style={{ display:"flex",alignItems:"center",gap:8,padding:"11px 20px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:800,fontFamily:"inherit",boxShadow:"0 4px 20px rgba(99,102,241,0.35)" }}>{Ic.plus} Nuevo atleta</button>
            </div>
            <div style={{ display:"flex",gap:10,marginBottom:18,flexWrap:"wrap" }}>
              <div style={{ position:"relative",flex:"1 1 200px" }}>
                <div style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#6b7280" }}>{Ic.search}</div>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar atleta..." style={{ paddingLeft:34,padding:"9px 13px 9px 34px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#f9fafb",fontSize:13,outline:"none",width:"100%",fontFamily:"inherit" }}/>
              </div>
              {[[SPORTS,fSport,setFSport],[STATUSES,fStatus,setFStatus],[["Todos",...AGENTS],fAgent,setFAgent]].map(([opts,val,setter],i)=>(
                <select key={i} value={val} onChange={e=>setter(e.target.value)} style={{ padding:"9px 13px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:val==="Todos"?"#6b7280":"#f9fafb",fontSize:13,outline:"none",cursor:"pointer",fontFamily:"inherit" }}>
                  {opts.map(o=><option key={o}>{o}</option>)}
                </select>
              ))}
            </div>
            {players.length===0&&<div style={{ textAlign:"center",padding:60,color:"#6b7280" }}><div style={{ fontSize:40,marginBottom:12 }}>👥</div><div style={{ fontSize:16,fontWeight:700,marginBottom:6 }}>Sin atletas todavía</div><div style={{ fontSize:13 }}>Crea el primer perfil con el botón "Nuevo atleta"</div></div>}
            <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
              {filtered.map(p=>{
                const paid=(p.payment1.paid?900:0)+(p.payment2.paid?1800:0);
                const pct=(paid/2700)*100;
                return (
                  <div key={p.id} className="prow" onClick={()=>setSelected(p)} style={{ display:"flex",alignItems:"center",gap:14,background:"linear-gradient(145deg,#181b2a,#111420)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"14px 18px",cursor:"pointer",transition:"all .15s" }}>
                    <Avatar name={p.name} size={44}/>
                    <div style={{ flex:2 }}>
                      <div style={{ fontSize:15,fontWeight:800,color:"#f9fafb" }}>{p.name}</div>
                      <div style={{ fontSize:12,color:"#6b7280",marginTop:2 }}>{p.sport} · {p.nationality} · {p.position}</div>
                    </div>
                    <Badge status={p.status}/>
                    <div style={{ textAlign:"center",minWidth:64 }}><div style={{ fontSize:10,color:"#6b7280",marginBottom:2 }}>Beca</div><div style={{ fontSize:15,fontWeight:900,color:"#6366f1" }}>{p.scholarshipPct}%</div></div>
                    <div style={{ textAlign:"center",minWidth:56 }}><div style={{ fontSize:10,color:"#6b7280",marginBottom:2 }}>GPA</div><div style={{ fontSize:15,fontWeight:900,color:p.gpa>=3.5?"#22c55e":p.gpa>=3?"#f59e0b":"#ef4444" }}>{p.gpa||"—"}</div></div>
                    <div style={{ flex:1,minWidth:110 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,color:"#6b7280",marginBottom:4 }}><span>Cobros</span><span style={{ color:pct>=100?"#22c55e":pct>0?"#f59e0b":"#ef4444",fontWeight:700 }}>{paid}€</span></div>
                      <Bar value={paid} max={2700} color={pct>=100?"#22c55e":pct>0?"#f59e0b":"#6366f1"}/>
                    </div>
                    <div style={{ fontSize:11,color:p.agent==="Moha"?"#818cf8":"#fbbf24",fontWeight:700,minWidth:60,textAlign:"right" }}>{p.agent}</div>
                    <div style={{ color:"#4b5563" }}>{Ic.back}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {nav==="players"&&selected&&<PlayerDetail player={selected} onBack={()=>setSelected(null)} onUpdate={async(p)=>{ await supabase.from("players").update(playerToDb(p)).eq("id",p.id); await loadPlayers(); }} onRefresh={loadPlayers}/>}

        {nav==="offers"&&(
          <div>
            <div style={{ marginBottom:24 }}><h1 style={{ fontSize:27,fontWeight:800,color:"#f9fafb",letterSpacing:-0.5 }}>Ofertas universitarias</h1><p style={{ color:"#6b7280",fontSize:14,marginTop:4 }}>{allOffers.length} ofertas · {allOffers.filter(o=>o.status==="Elegida ✓").length} confirmadas</p></div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:22 }}>
              <StatCard label="Total ofertas" value={allOffers.length} color="#6366f1" icon={Ic.uni}/>
              <StatCard label="Confirmadas" value={allOffers.filter(o=>o.status==="Elegida ✓").length} color="#22c55e" icon={Ic.check}/>
              <StatCard label="En negociación" value={allOffers.filter(o=>["Oferta formal","Pre-aceptada","Interesada"].includes(o.status)).length} color="#f59e0b" icon={Ic.star}/>
            </div>
            {players.filter(p=>p.offers?.length>0).length===0&&<div style={{ textAlign:"center",padding:60,color:"#6b7280" }}><div style={{ fontSize:40,marginBottom:12 }}>🏛️</div><div style={{ fontSize:16,fontWeight:700 }}>Sin ofertas todavía</div></div>}
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              {players.filter(p=>p.offers?.length>0).map(p=>(
                <Card key={p.id}>
                  <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}>
                    <Avatar name={p.name} size={42}/>
                    <div><div style={{ fontSize:15,fontWeight:800,color:"#f9fafb" }}>{p.name}</div><div style={{ fontSize:12,color:"#6b7280" }}>{p.sport} · {p.offers.length} {p.offers.length===1?"oferta":"ofertas"}</div></div>
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:10 }}>
                    {p.offers.sort((a,b)=>b.scholarshipPct-a.scholarshipPct).map(o=>(
                      <div key={o.id} onClick={()=>{ setNav("players"); setSelected(p); }} style={{ background:o.status==="Elegida ✓"?"rgba(16,185,129,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${OFFER_COLORS[o.status]||"#374151"}33`,borderRadius:12,padding:"14px",cursor:"pointer" }}>
                        <div style={{ fontSize:14,fontWeight:800,color:"#f9fafb",marginBottom:5 }}>{o.university}</div>
                        <div style={{ fontSize:12,color:"#9ca3af",marginBottom:8 }}>{o.state} · {o.division}</div>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}><span style={{ fontSize:20,fontWeight:900,color:"#6366f1" }}>{o.scholarshipPct}%</span><OfferBadge status={o.status}/></div>
                        <Bar value={o.scholarshipPct} max={100} color={OFFER_COLORS[o.status]||"#6366f1"} h={4}/>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {nav==="payments"&&(
          <div>
            <div style={{ marginBottom:24 }}><h1 style={{ fontSize:27,fontWeight:800,color:"#f9fafb",letterSpacing:-0.5 }}>Pagos & Cobros</h1><p style={{ color:"#6b7280",fontSize:14,marginTop:4 }}>2.700€ por atleta · 900€ + 1.800€</p></div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22 }}>
              <StatCard label="Revenue total" value={`${totalFees.toLocaleString()}€`} color="#6366f1" icon={Ic.fin}/>
              <StatCard label="Cobrado" value={`${totalColl.toLocaleString()}€`} color="#22c55e" icon={Ic.check} sub={totalFees>0?`${Math.round((totalColl/totalFees)*100)}%`:"—"}/>
              <StatCard label="Pendiente" value={`${totalPend.toLocaleString()}€`} color="#f59e0b" icon={Ic.alert}/>
              <StatCard label="Completos" value={players.filter(p=>p.payment1.paid&&p.payment2.paid).length} color="#10b981" icon={Ic.trophy} sub={`de ${players.length} total`}/>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18 }}>
              {agentStats.map(s=>(
                <Card key={s.agent} style={{ border:`1px solid ${s.agent==="Moha"?"rgba(99,102,241,0.2)":"rgba(245,158,11,0.2)"}` }}>
                  <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}>
                    <div style={{ width:44,height:44,borderRadius:"50%",background:s.agent==="Moha"?"linear-gradient(135deg,#6366f1,#8b5cf6)":"linear-gradient(135deg,#f59e0b,#f97316)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#fff" }}>{s.agent==="Moha"?"M":"I"}</div>
                    <div style={{ flex:1 }}><div style={{ fontSize:16,fontWeight:800,color:"#f9fafb" }}>{s.agent}</div><div style={{ fontSize:11,color:"#6b7280" }}>Socio FutbolU Agency</div></div>
                    <div style={{ fontSize:26,fontWeight:900,color:s.agent==="Moha"?"#818cf8":"#fbbf24" }}>{s.total}€</div>
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                    {[["Pagos iniciales (900€)",s.p1,s.p1*900],["Segundos pagos (1.800€)",s.p2,s.p2*1800]].map(([l,count,amt])=>(
                      <div key={l} style={{ background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 14px" }}>
                        <div style={{ fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4 }}>{l}</div>
                        <div style={{ fontSize:20,fontWeight:900,color:s.agent==="Moha"?"#818cf8":"#fbbf24" }}>{count}</div>
                        <div style={{ fontSize:12,color:"#6b7280" }}>{amt}€</div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
            <Card>
              <div style={{ fontSize:11,fontWeight:800,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:14 }}>Estado por atleta</div>
              {players.length===0&&<div style={{ color:"#4b5563",fontSize:13,textAlign:"center",padding:20 }}>Sin atletas todavía</div>}
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {players.map(p=>{
                  const paid=(p.payment1.paid?900:0)+(p.payment2.paid?1800:0);
                  return (
                    <div key={p.id} onClick={()=>{ setNav("players"); setSelected(p); }} style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 16px",background:"rgba(255,255,255,0.03)",borderRadius:12,border:"1px solid rgba(255,255,255,0.05)",cursor:"pointer" }}>
                      <Avatar name={p.name} size={36}/>
                      <div style={{ flex:2 }}>
                        <div style={{ fontSize:14,fontWeight:700,color:"#f9fafb" }}>{p.name}</div>
                        <div style={{ display:"flex",gap:7,marginTop:4 }}>
                          <span style={{ fontSize:10,padding:"2px 8px",borderRadius:6,background:p.payment1.paid?"rgba(34,197,94,0.15)":"rgba(245,158,11,0.12)",color:p.payment1.paid?"#22c55e":"#f59e0b",fontWeight:700 }}>P1: {p.payment1.paid?`✓ ${p.payment1.paidBy}`:"Pendiente"}</span>
                          <span style={{ fontSize:10,padding:"2px 8px",borderRadius:6,background:p.payment2.paid?"rgba(34,197,94,0.15)":"rgba(245,158,11,0.12)",color:p.payment2.paid?"#22c55e":"#f59e0b",fontWeight:700 }}>P2: {p.payment2.paid?`✓ ${p.payment2.paidBy}`:"Pendiente"}</span>
                        </div>
                      </div>
                      <div style={{ flex:1.5,minWidth:120 }}><Bar value={paid} max={2700} color={paid>=2700?"#22c55e":paid>0?"#f59e0b":"#374151"}/></div>
                      <div style={{ fontWeight:900,fontSize:14,color:paid>=2700?"#22c55e":"#f9fafb",minWidth:80,textAlign:"right" }}>{paid}€ / 2.700€</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
      {addModal&&<PlayerModal onClose={()=>setAddModal(false)} onSave={async(p)=>{ await addPlayer(p); setAddModal(false); }}/>}
    </div>
  );
}
