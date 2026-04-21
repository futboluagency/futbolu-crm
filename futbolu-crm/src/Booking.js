import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const SUPA_URL = "https://jjgtgkqmxnlxkshykdxv.supabase.co";
const CEO_EMAIL = "futboluagency@gmail.com";

// ─── PUBLIC BOOKING PAGE ──────────────────────────────────────────────────────
export const BookingPage = ({ token }) => {
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name:"", email:"", phone:"", notes:"" });
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("availability_slots")
      .select("*").eq("booked", false).gte("date", today)
      .order("date").order("start_time");
    setSlots(data||[]);
    setLoading(false);
  };

  const confirm = async () => {
    if(!selected||!form.name||!form.email) return;
    setSubmitting(true);
    await supabase.from("availability_slots").update({
      booked: true,
      booked_by_name: form.name,
      booked_by_email: form.email,
      booked_by_phone: form.phone,
      notes: form.notes,
    }).eq("id", selected.id);

    // Send email to CEO
    await fetch("/api/send-email", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        type:"calendar_invite", to:CEO_EMAIL,
        eventTitle:`Nueva reunion: ${form.name}`,
        eventDate:selected.date, eventTime:selected.start_time,
        body:`Nombre: ${form.name}\nEmail: ${form.email}\nTelefono: ${form.phone||"—"}\nNotas: ${form.notes||"—"}`,
        senderName:form.name,
      })
    }).catch(()=>{});

    // Send confirmation to user
    await fetch("/api/send-email", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        type:"lead_meeting", to:form.email,
        eventTitle:`Tu reunion con FUTBOLUAGENCY esta confirmada`,
        eventDate:selected.date, eventTime:selected.start_time,
        body:`Hola ${form.name},\n\nTu reunion con FUTBOLUAGENCY ha sido confirmada.\n\nSi necesitas cancelar o cambiar la hora, contactanos en futboluagency@gmail.com o WhatsApp +34 603 331 990.`,
      })
    }).catch(()=>{});

    setConfirmed(true);
    setSubmitting(false);
  };

  // Group slots by date
  const grouped = slots.reduce((acc, s) => {
    if(!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const formatDate = (d) => {
    const dt = new Date(d+"T12:00:00");
    const days = ["Dom","Lun","Mar","Mie","Jue","Vie","Sab"];
    return `${days[dt.getDay()]} ${dt.getDate()} ${MONTHS[dt.getMonth()]}`;
  };

  if(loading) return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:"#f5f0e8", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:"#6b7280" }}>Cargando...</div>
    </div>
  );

  if(confirmed) return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:"#f5f0e8", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ textAlign:"center", maxWidth:400 }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:"#10b981", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, color:"#fff", margin:"0 auto 20px" }}>✓</div>
        <h2 style={{ fontSize:22, fontWeight:800, color:"#1a1a2e", marginBottom:10 }}>Reunion confirmada</h2>
        <p style={{ fontSize:14, color:"#6b7280", lineHeight:1.6, marginBottom:16 }}>
          Tu reunion el <strong>{formatDate(selected.date)}</strong> a las <strong>{selected.start_time}</strong> esta confirmada.<br/>Te hemos enviado un email de confirmacion.
        </p>
        <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:12, padding:"16px 20px" }}>
          <div style={{ fontSize:13, color:"#374151" }}>Cualquier pregunta:<br/>
            <strong>futboluagency@gmail.com</strong><br/>
            <strong>WhatsApp: +34 603 331 990</strong>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:"#f5f0e8", minHeight:"100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{ background:"#fff", borderBottom:"1px solid #e8e3db", padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <img src="/logo.png" alt="FUTBOLUAGENCY" onError={e=>e.target.style.display="none"} style={{ height:30, objectFit:"contain" }}/>
      </div>
      <div style={{ maxWidth:640, margin:"0 auto", padding:"32px 20px 60px" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#1a1a2e", marginBottom:8 }}>Agenda una reunion</h1>
          <p style={{ fontSize:14, color:"#6b7280" }}>Elige el dia y hora que mejor te venga para hablar con nosotros sobre tu beca deportiva.</p>
        </div>

        {slots.length===0&&<div style={{ textAlign:"center", padding:40, background:"#fff", borderRadius:14, border:"1px solid #e8e3db" }}>
          <div style={{ fontSize:14, color:"#6b7280" }}>No hay huecos disponibles en este momento. Contactanos directamente:<br/><strong>futboluagency@gmail.com</strong></div>
        </div>}

        {/* Date slots */}
        {!selected&&Object.entries(grouped).map(([date, dateSlots])=>(
          <div key={date} style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:8, padding:"0 4px" }}>{formatDate(date)}</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))", gap:8 }}>
              {dateSlots.map(slot=>(
                <button key={slot.id} onClick={()=>setSelected(slot)} style={{ padding:"12px 8px", borderRadius:10, border:"1px solid #e8e3db", background:"#fff", cursor:"pointer", textAlign:"center", fontFamily:"inherit", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"#1a1a2e" }}>{slot.start_time}</div>
                  <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{slot.end_time}</div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Booking form */}
        {selected&&(
          <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:16, padding:"24px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:"#1a1a2e" }}>{formatDate(selected.date)} — {selected.start_time}</div>
                <div style={{ fontSize:13, color:"#10b981", marginTop:3, fontWeight:600 }}>Hueco seleccionado</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:"#9ca3af", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>Cambiar</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[["Nombre completo *","name","text","Juan Garcia"],["Email *","email","email","juan@gmail.com"],["Telefono / WhatsApp","phone","tel","+34 ..."]].map(([l,k,t,p])=>(
                <div key={k}>
                  <label style={{ fontSize:11, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:0.8, marginBottom:5, display:"block" }}>{l}</label>
                  <input type={t} placeholder={p} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ background:"#f9f7f4", border:"1px solid #e5e0d8", borderRadius:8, padding:"10px 14px", color:"#1a1a2e", fontSize:14, outline:"none", width:"100%", fontFamily:"inherit" }}/>
                </div>
              ))}
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:0.8, marginBottom:5, display:"block" }}>Mensaje (opcional)</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Cuentanos sobre ti, tu deporte, tu nivel academico..." style={{ background:"#f9f7f4", border:"1px solid #e5e0d8", borderRadius:8, padding:"10px 14px", color:"#1a1a2e", fontSize:14, outline:"none", width:"100%", minHeight:80, resize:"vertical", fontFamily:"inherit" }}/>
              </div>
              <button onClick={confirm} disabled={submitting||!form.name||!form.email} style={{ padding:"14px", borderRadius:10, border:"none", background:(!form.name||!form.email)?"#e8e3db":"#1a1a2e", color:(!form.name||!form.email)?"#9ca3af":"#fff", cursor:(!form.name||!form.email)?"default":"pointer", fontSize:14, fontWeight:700, fontFamily:"inherit", opacity:submitting?0.7:1 }}>
                {submitting?"Confirmando...":"Confirmar reunion"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── AVAILABILITY MANAGER (inside CRM) ────────────────────────────────────────
export const AvailabilityManager = ({ profile }) => {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ date:"", start_time:"10:00", end_time:"11:00", title:"Llamada con FUTBOLUAGENCY" });
  const [saving, setSaving] = useState(false);
  const [bookingLink, setBookingLink] = useState(`${window.location.origin}?booking=1`);
  const [copied, setCopied] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("availability_slots").select("*").gte("date", today).order("date").order("start_time");
    setSlots(data||[]);
  };

  const addSlot = async () => {
    if(!form.date||!form.start_time) return;
    setSaving(true);
    const {error} = await supabase.from("availability_slots").insert({ 
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
      title: form.title||"Llamada con FUTBOLUAGENCY",
      booked: false 
    });
    if(error) { alert(`Error: ${error.message}`); setSaving(false); return; }
    setForm(f=>({...f, date:"", start_time:"10:00", end_time:"11:00"}));
    await load();
    setSaving(false);
  };

  const delSlot = async (id) => {
    await supabase.from("availability_slots").delete().eq("id", id);
    await load();
  };

  const inp = { background:"#f9f7f4", border:"1px solid #e5e0d8", borderRadius:8, padding:"8px 12px", color:"#1a1a2e", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
  const today = new Date().toISOString().split("T")[0];
  const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const formatDate = (d) => { const dt = new Date(d+"T12:00:00"); return `${dt.getDate()} ${MONTHS[dt.getMonth()]}`; };

  const available = slots.filter(s=>!s.booked);
  const booked = slots.filter(s=>s.booked);

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#1a1a2e", letterSpacing:-0.3 }}>Reuniones</h1>
        <p style={{ color:"#6b7280", fontSize:13, marginTop:3 }}>Gestiona tu disponibilidad y envia el link a leads para que agenden contigo</p>
      </div>

      {/* Booking link */}
      <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:14, padding:"18px 20px", marginBottom:14, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e", textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Tu link de reserva</div>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ flex:1, background:"#f9f7f4", border:"1px solid #e8e3db", borderRadius:8, padding:"9px 12px", fontSize:13, color:"#374151", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{bookingLink}</div>
          <button onClick={()=>{ navigator.clipboard.writeText(bookingLink); setCopied(true); setTimeout(()=>setCopied(false),2000); }} style={{ padding:"9px 16px", borderRadius:8, border:"none", background:copied?"#10b981":"#1a1a2e", color:"#fff", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"inherit", whiteSpace:"nowrap" }}>{copied?"Copiado":"Copiar link"}</button>
          <a href={bookingLink} target="_blank" rel="noreferrer" style={{ padding:"9px 16px", borderRadius:8, border:"1px solid #e8e3db", background:"#fff", color:"#374151", textDecoration:"none", fontSize:12, fontWeight:600, whiteSpace:"nowrap" }}>Ver pagina</a>
        </div>
        <div style={{ fontSize:11, color:"#9ca3af", marginTop:8 }}>Comparte este link con tus leads para que elijan un hueco de reunion contigo</div>
      </div>

      {/* Add slot */}
      <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:14, padding:"18px 20px", marginBottom:14, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e", textTransform:"uppercase", letterSpacing:0.8, marginBottom:14 }}>Añadir hueco disponible</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:10, alignItems:"end" }}>
          <div>
            <label style={{ fontSize:10, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:0.8, marginBottom:5, display:"block" }}>Fecha</label>
            <input style={{ ...inp, width:"100%" }} type="date" min={today} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
          </div>
          <div>
            <label style={{ fontSize:10, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:0.8, marginBottom:5, display:"block" }}>Hora inicio</label>
            <input style={{ ...inp, width:"100%" }} type="time" value={form.start_time} onChange={e=>setForm(f=>({...f,start_time:e.target.value}))}/>
          </div>
          <div>
            <label style={{ fontSize:10, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:0.8, marginBottom:5, display:"block" }}>Hora fin</label>
            <input style={{ ...inp, width:"100%" }} type="time" value={form.end_time} onChange={e=>setForm(f=>({...f,end_time:e.target.value}))}/>
          </div>
          <button onClick={addSlot} disabled={saving||!form.date} style={{ padding:"9px 16px", borderRadius:8, border:"none", background:!form.date?"#e8e3db":"#1a1a2e", color:!form.date?"#9ca3af":"#fff", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit", whiteSpace:"nowrap" }}>
            {saving?"...":"+ Añadir"}
          </button>
        </div>
      </div>

      {/* Available slots */}
      <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:14, padding:"18px 20px", marginBottom:14, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e", textTransform:"uppercase", letterSpacing:0.8, marginBottom:14 }}>
          Huecos disponibles ({available.length})
        </div>
        {available.length===0&&<div style={{ color:"#9ca3af", fontSize:13, textAlign:"center", padding:"12px 0" }}>Sin huecos disponibles. Añade uno arriba.</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {available.map(slot=>(
            <div key={slot.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"rgba(16,185,129,0.04)", border:"1px solid rgba(16,185,129,0.15)", borderRadius:9 }}>
              <div style={{ flex:1 }}>
                <span style={{ fontSize:13, fontWeight:600, color:"#1a1a2e" }}>{formatDate(slot.date)}</span>
                <span style={{ fontSize:13, color:"#6b7280", marginLeft:10 }}>{slot.start_time} — {slot.end_time}</span>
              </div>
              <button onClick={()=>delSlot(slot.id)} style={{ background:"none", border:"1px solid #fecaca", color:"#ef4444", cursor:"pointer", fontSize:11, padding:"4px 10px", borderRadius:6, fontFamily:"inherit" }}>Eliminar</button>
            </div>
          ))}
        </div>
      </div>

      {/* Booked slots */}
      {booked.length>0&&(
        <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:14, padding:"18px 20px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e", textTransform:"uppercase", letterSpacing:0.8, marginBottom:14 }}>Reuniones reservadas ({booked.length})</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {booked.map(slot=>(
              <div key={slot.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"rgba(99,102,241,0.04)", border:"1px solid rgba(99,102,241,0.15)", borderRadius:9 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e" }}>{slot.booked_by_name}</div>
                  <div style={{ fontSize:11, color:"#6b7280" }}>{formatDate(slot.date)} {slot.start_time} · {slot.booked_by_email} {slot.booked_by_phone&&`· ${slot.booked_by_phone}`}</div>
                  {slot.notes&&<div style={{ fontSize:11, color:"#9ca3af", marginTop:2, fontStyle:"italic" }}>{slot.notes}</div>}
                </div>
                <button onClick={()=>delSlot(slot.id)} style={{ background:"none", border:"1px solid #fecaca", color:"#ef4444", cursor:"pointer", fontSize:11, padding:"4px 10px", borderRadius:6, fontFamily:"inherit" }}>Cancelar</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
