import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export const ADMISSION_STEPS = [
  { id:"contract_signed", label:"Contrato firmado", desc:"Contrato FutbolUAgency firmado por atleta y familia", category:"legal", icon:"✍️" },
  { id:"passport_valid", label:"Pasaporte válido", desc:"Pasaporte con al menos 1 año de validez", category:"documents", icon:"🛂" },
  { id:"transcripts_translated", label:"Notas traducidas", desc:"Notas oficiales traducidas y apostilladas", category:"documents", icon:"📋" },
  { id:"gpa_verified", label:"GPA verificado", desc:"Certificado GPA oficial obtenido", category:"academic", icon:"📊" },
  { id:"english_test", label:"Examen inglés", desc:"TOEFL/IELTS completado y puntuaciones enviadas", category:"academic", icon:"🗣️" },
  { id:"sat_sent", label:"SAT enviado", desc:"Puntuaciones SAT enviadas a universidades", category:"academic", icon:"📝" },
  { id:"university_applied", label:"Solicitudes enviadas", desc:"Aplicaciones enviadas a universidades objetivo", category:"admission", icon:"🏛️" },
  { id:"offer_received", label:"Oferta recibida", desc:"Carta de oferta de beca recibida", category:"admission", icon:"📨" },
  { id:"offer_accepted", label:"Oferta aceptada", desc:"Atleta ha aceptado la oferta de beca", category:"admission", icon:"✅" },
  { id:"i20_received", label:"I-20 recibido", desc:"Formulario I-20 recibido de la universidad", category:"visa", icon:"📄" },
  { id:"sevis_paid", label:"SEVIS pagado", desc:"Tasa SEVIS pagada ($350)", category:"visa", icon:"💳" },
  { id:"visa_interview", label:"Entrevista visado", desc:"Entrevista visado F-1 en embajada EEUU completada", category:"visa", icon:"🎙️" },
  { id:"visa_approved", label:"Visado aprobado", desc:"Visado F-1 aprobado y sellado", category:"visa", icon:"🛃" },
  { id:"flight_booked", label:"Vuelo reservado", desc:"Vuelo a EEUU reservado y confirmado", category:"travel", icon:"✈️" },
  { id:"accommodation_arranged", label:"Alojamiento listo", desc:"Residencia universitaria o piso acordado", category:"travel", icon:"🏠" },
  { id:"health_insurance", label:"Seguro médico", desc:"Seguro médico estudiantil contratado", category:"travel", icon:"🏥" },
  { id:"arrived_usa", label:"Llegada a EEUU", desc:"Atleta ha llegado y hecho check-in", category:"travel", icon:"🇺🇸" },
];

export const ADMISSION_CATEGORIES = {
  legal:     { label:"Legal",     color:"#8b5cf6" },
  documents: { label:"Documentos", color:"#3b82f6" },
  academic:  { label:"Académico", color:"#f59e0b" },
  admission: { label:"Admisión",  color:"#6366f1" },
  visa:      { label:"Visado",    color:"#ef4444" },
  travel:    { label:"Viaje",     color:"#10b981" },
};

export const AdmissionChecklist = ({ playerId, isAdmin }) => {
  const [steps, setSteps] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [playerId]);

  const load = async () => {
    try {
      const { data } = await supabase.from("admission_steps").select("*").eq("player_id", playerId);
      const map = {};
      (data || []).forEach(s => { map[s.step_id] = s.completed; });
      setSteps(map);
    } catch(e) {
      console.error("Error loading admission steps:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (stepId) => {
    if (!isAdmin) return;
    const newVal = !steps[stepId];
    setSteps(s => ({ ...s, [stepId]: newVal }));
    const { data: existing } = await supabase.from("admission_steps").select("id").eq("player_id", playerId).eq("step_id", stepId).single();
    if (existing) {
      await supabase.from("admission_steps").update({ completed: newVal, completed_date: newVal ? new Date().toISOString().split("T")[0] : null }).eq("id", existing.id);
    } else {
      await supabase.from("admission_steps").insert({ player_id: playerId, step_id: stepId, completed: newVal, completed_date: newVal ? new Date().toISOString().split("T")[0] : null });
    }
  };

  const completed = ADMISSION_STEPS.filter(s => steps[s.id]).length;
  const pct = Math.round((completed / ADMISSION_STEPS.length) * 100);

  if (loading) return <div style={{ color:"#4b5563", padding:20 }}>Cargando...</div>;

  return (
    <div>
      <div style={{ background:"#0a0c14", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"16px 20px", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#f9fafb" }}>Progreso del proceso</div>
          <div style={{ fontSize:14, fontWeight:800, color:pct===100?"#10b981":"#6366f1" }}>{completed}/{ADMISSION_STEPS.length} · {pct}%</div>
        </div>
        <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:99, height:8 }}>
          <div style={{ width:`${pct}%`, background:pct===100?"#10b981":"linear-gradient(90deg,#6366f1,#8b5cf6)", height:"100%", borderRadius:99, transition:"width .4s" }}/>
        </div>
      </div>
      {Object.entries(ADMISSION_CATEGORIES).map(([catId, cat]) => {
        const catSteps = ADMISSION_STEPS.filter(s => s.category === catId);
        const catDone = catSteps.filter(s => steps[s.id]).length;
        return (
          <div key={catId} style={{ marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:cat.color, textTransform:"uppercase", letterSpacing:1.2 }}>{cat.label}</div>
              <div style={{ fontSize:11, color:"#4b5563" }}>{catDone}/{catSteps.length}</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {catSteps.map(step => {
                const done = !!steps[step.id];
                return (
                  <div key={step.id} onClick={() => toggle(step.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", background:done?"rgba(16,185,129,0.05)":"rgba(255,255,255,0.02)", border:`1px solid ${done?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.05)"}`, borderRadius:10, cursor:isAdmin?"pointer":"default" }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:done?`${cat.color}20`:"rgba(255,255,255,0.04)", border:`1px solid ${done?cat.color:"rgba(255,255,255,0.08)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                      {done ? "✅" : step.icon}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:done?600:400, color:done?"#f9fafb":"#9ca3af" }}>{step.label}</div>
                      <div style={{ fontSize:11, color:"#4b5563", marginTop:2 }}>{step.desc}</div>
                    </div>
                    {done && <div style={{ fontSize:10, color:"#10b981", fontWeight:600 }}>✓</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
