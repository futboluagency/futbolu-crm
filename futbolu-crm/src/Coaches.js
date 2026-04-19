import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { getSportPrograms, SPORT_OPTIONS, GENDER_OPTIONS, DIVISION_OPTIONS } from "./UniversitiesBySport";

const EMAIL_TEMPLATES = {
  Soccer: (player, gender) => `Subject: ${gender} Soccer Student-Athlete Recruitment – ${player.name}

Dear Coach,

I am writing on behalf of ${player.name}, a talented ${player.position||"soccer"} player seeking scholarship opportunities in the United States.

Athletic Profile:
• Position: ${player.position||"—"}
• Height: ${player.height||"—"} cm | Weight: ${player.weight||"—"} kg
• Nationality: ${player.nationality||"—"}
• Current Team: ${player.sportData?.sport_team||"—"}
• Goals this season: ${player.sportData?.sport_goals||"—"}
• Assists: ${player.sportData?.sport_assists||"—"}

Academic Profile:
• GPA: ${player.gpa||"—"} | SAT: ${player.satScore||"—"}
• TOEFL: ${player.toeflScore||"—"} | English: ${player.englishLevel||"—"}
• Graduation Year: ${player.graduationYear||"—"}
• Intended Major: ${player.major||"—"}

Highlight Video: ${player.videoUrl||"Available upon request"}

${player.name} is highly motivated, academically strong, and ready to contribute to your program at the highest level.

Please feel free to contact me for more information.

Best regards,
FUTBOLUAGENCY
futboluagency@gmail.com | +34 603 331 990`,

  Tennis: (player, gender) => `Subject: ${gender} Tennis Student-Athlete – ${player.name} | Ranking ${player.sportData?.sport_ranking||"—"}

Dear Coach,

I would like to introduce ${player.name}, a competitive tennis player seeking a scholarship at your university.

Athletic Profile:
• Playing Style: ${player.position||"—"}
• ITF Ranking: ${player.sportData?.sport_ranking||"—"}
• National Ranking: ${player.sportData?.sport_national_ranking||"—"}
• Best Tournament Result: ${player.sportData?.sport_best_result||"—"}

Academic Profile:
• GPA: ${player.gpa||"—"} | SAT: ${player.satScore||"—"}
• TOEFL: ${player.toeflScore||"—"} | Graduation: ${player.graduationYear||"—"}

Highlight Video: ${player.videoUrl||"Available upon request"}

Best regards,
FUTBOLUAGENCY | futboluagency@gmail.com | +34 603 331 990`,

  Golf: (player, gender) => `Subject: ${gender} Golf Recruit – ${player.name} | Handicap ${player.sportData?.sport_handicap||"—"}

Dear Coach,

I am reaching out regarding ${player.name}, a talented golfer looking for scholarship opportunities.

Athletic Profile:
• Handicap: ${player.sportData?.sport_handicap||"—"}
• Best 18-hole score: ${player.sportData?.sport_best_score||"—"}
• Amateur Ranking: ${player.sportData?.sport_ranking||"—"}
• Nationality: ${player.nationality||"—"}

Academic Profile:
• GPA: ${player.gpa||"—"} | SAT: ${player.satScore||"—"}
• TOEFL: ${player.toeflScore||"—"} | Graduation: ${player.graduationYear||"—"}
• Intended Major: ${player.major||"—"}

Best regards,
FUTBOLUAGENCY | futboluagency@gmail.com | +34 603 331 990`,

  Volleyball: (player, gender) => `Subject: ${gender} Volleyball Recruit – ${player.name}

Dear Coach,

I would like to introduce ${player.name}, a ${player.position||"volleyball"} player seeking a scholarship.

Athletic Profile:
• Position: ${player.position||"—"}
• Height: ${player.height||"—"} cm
• Approach Reach: ${player.sportData?.sport_reach||"—"} cm
• Nationality: ${player.nationality||"—"}
• Current Team: ${player.sportData?.sport_team||"—"}

Academic Profile:
• GPA: ${player.gpa||"—"} | SAT: ${player.satScore||"—"}
• TOEFL: ${player.toeflScore||"—"} | Graduation: ${player.graduationYear||"—"}

Highlight Video: ${player.videoUrl||"Available upon request"}

Best regards,
FUTBOLUAGENCY | futboluagency@gmail.com | +34 603 331 990`,

  Baseball: (player) => `Subject: Baseball Student-Athlete Recruitment – ${player.name}

Dear Coach,

I am writing on behalf of ${player.name}, a baseball player seeking scholarship opportunities.

Athletic Profile:
• Position: ${player.position||"—"}
• Height: ${player.height||"—"} cm | Weight: ${player.weight||"—"} kg
• Pitch Velocity: ${player.sportData?.sport_velocity||"—"} mph
• Batting Average: ${player.sportData?.sport_batting_avg||"—"}
• ERA: ${player.sportData?.sport_era||"—"}
• Nationality: ${player.nationality||"—"}

Academic Profile:
• GPA: ${player.gpa||"—"} | SAT: ${player.satScore||"—"}
• TOEFL: ${player.toeflScore||"—"} | Graduation: ${player.graduationYear||"—"}

Highlight Video: ${player.videoUrl||"Available upon request"}

Best regards,
FUTBOLUAGENCY | futboluagency@gmail.com | +34 603 331 990`,

  Basketball: (player, gender) => `Subject: ${gender} Basketball Student-Athlete – ${player.name}

Dear Coach,

I would like to introduce ${player.name}, a ${player.position||"basketball"} player seeking a scholarship.

Athletic Profile:
• Position: ${player.position||"—"}
• Height: ${player.height||"—"} cm | Wingspan: ${player.sportData?.sport_wingspan||"—"} cm
• Points per game: ${player.sportData?.sport_goals||"—"}
• Rebounds per game: ${player.sportData?.sport_rebounds||"—"}
• Nationality: ${player.nationality||"—"}

Academic Profile:
• GPA: ${player.gpa||"—"} | SAT: ${player.satScore||"—"}
• TOEFL: ${player.toeflScore||"—"} | Graduation: ${player.graduationYear||"—"}

Highlight Video: ${player.videoUrl||"Available upon request"}

Best regards,
FUTBOLUAGENCY | futboluagency@gmail.com | +34 603 331 990`,

  "Track & Field": (player, gender) => `Subject: ${gender} Track & Field Recruit – ${player.name} | ${player.position||"—"}

Dear Coach,

I am reaching out regarding ${player.name}, a track & field athlete seeking scholarship opportunities.

Athletic Profile:
• Event: ${player.position||"—"}
• Personal Best: ${player.sportData?.sport_personal_best||"—"}
• National Ranking: ${player.sportData?.sport_national_ranking||"—"}
• World Junior Ranking: ${player.sportData?.sport_world_ranking||"—"}
• Nationality: ${player.nationality||"—"}

Academic Profile:
• GPA: ${player.gpa||"—"} | SAT: ${player.satScore||"—"}
• TOEFL: ${player.toeflScore||"—"} | Graduation: ${player.graduationYear||"—"}

Best regards,
FUTBOLUAGENCY | futboluagency@gmail.com | +34 603 331 990`,

  Swimming: (player, gender) => `Subject: ${gender} Swimming Recruit – ${player.name}

Dear Coach,

I am reaching out regarding ${player.name}, a competitive swimmer seeking scholarship opportunities.

Athletic Profile:
• Main Stroke: ${player.position||"—"}
• 50m Free: ${player.sportData?.sport_time_50free||"—"}
• 100m Free: ${player.sportData?.sport_time_100free||"—"}
• 100m Back: ${player.sportData?.sport_time_100back||"—"}
• 100m Breast: ${player.sportData?.sport_time_100breast||"—"}
• National Ranking: ${player.sportData?.sport_national_ranking||"—"}
• Nationality: ${player.nationality||"—"}

Academic Profile:
• GPA: ${player.gpa||"—"} | SAT: ${player.satScore||"—"}
• TOEFL: ${player.toeflScore||"—"} | Graduation: ${player.graduationYear||"—"}

Best regards,
FUTBOLUAGENCY | futboluagency@gmail.com | +34 603 331 990`,
};

export const CoachesDB = ({ players, isAdmin }) => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [emailModal, setEmailModal] = useState(null);
  const [filterSport, setFilterSport] = useState("All");
  const [filterDivision, setFilterDivision] = useState("All");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name:"", university:"", sport:"Soccer", gender:"Men", division:"NCAA D1", email:"", phone:"", notes:"" });
  const [uniSearch, setUniSearch] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("coaches").select("*").order("created_at", { ascending:false });
    setCoaches(data||[]);
    setLoading(false);
  };

  const save = async () => {
    if(!form.name||!form.university) return;
    const toSave = { ...form };
    if(form.id) await supabase.from("coaches").update(toSave).eq("id",form.id);
    else await supabase.from("coaches").insert(toSave);
    await load();
    setModal(null);
    resetForm();
  };

  const resetForm = () => setForm({ name:"", university:"", sport:"Soccer", gender:"Men", division:"NCAA D1", email:"", phone:"", notes:"" });

  const del = async (id) => {
    if(!window.confirm("¿Eliminar entrenador?")) return;
    await supabase.from("coaches").delete().eq("id",id);
    await load();
  };

  const getTemplate = (coach, player) => {
    const fn = EMAIL_TEMPLATES[coach.sport] || EMAIL_TEMPLATES["Soccer"];
    return fn(player, coach.gender||"Men");
  };

  const openEmail = (coach) => setEmailModal({ coach, player:null, template:"" });
  const selectPlayer = (coach, player) => setEmailModal(prev => ({ ...prev, player, template: getTemplate(coach, player) }));

  const inp = { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"8px 12px", color:"#f9fafb", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
  const lbl = { fontSize:10, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:0.8, marginBottom:5, display:"block" };

  // Get university list for current form
  const uniList = getSportPrograms(form.sport, form.gender, form.division);
  const filteredUnis = uniSearch.length > 1
    ? uniList.filter(u => u.name.toLowerCase().includes(uniSearch.toLowerCase())).slice(0,10)
    : [];

  const filtered = coaches.filter(c =>
    (filterSport==="All"||c.sport===filterSport) &&
    (filterDivision==="All"||c.division===filterDivision) &&
    (search===""||c.name.toLowerCase().includes(search.toLowerCase())||c.university?.toLowerCase().includes(search.toLowerCase()))
  );

  if(loading) return <div style={{ color:"#4b5563", padding:20 }}>Cargando...</div>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#f9fafb", letterSpacing:-0.3 }}>Entrenadores NCAA</h1>
          <p style={{ color:"#374151", fontSize:13, marginTop:3 }}>{coaches.length} contactos · Soccer, Tennis, Golf, Volleyball, Baseball, Basketball, Track & Field, Swimming</p>
        </div>
        {isAdmin&&<button onClick={()=>{ resetForm(); setModal(true); }} style={{ padding:"9px 16px", borderRadius:9, border:"none", background:"#6366f1", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>+ Añadir entrenador</button>}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <input style={{ ...inp, flex:2, minWidth:200 }} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre o universidad..."/>
        <select style={{ ...inp, cursor:"pointer" }} value={filterSport} onChange={e=>setFilterSport(e.target.value)}>
          <option value="All">Todos los deportes</option>
          {SPORT_OPTIONS.map(s=><option key={s}>{s}</option>)}
        </select>
        <select style={{ ...inp, cursor:"pointer" }} value={filterDivision} onChange={e=>setFilterDivision(e.target.value)}>
          <option value="All">Todas las divisiones</option>
          {DIVISION_OPTIONS.map(d=><option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        {SPORT_OPTIONS.map(s=>{
          const count = coaches.filter(c=>c.sport===s).length;
          if(count===0) return null;
          return <div key={s} style={{ padding:"4px 12px", borderRadius:20, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", fontSize:12, color:"#818cf8", fontWeight:600 }}>{s}: {count}</div>;
        })}
      </div>

      {/* List */}
      {filtered.length===0&&<div style={{ textAlign:"center", padding:40, color:"#4b5563" }}>
        <div style={{ fontSize:28, marginBottom:8 }}>🏈</div>
        <div>Sin entrenadores. Añade contactos para enviarles perfiles de atletas.</div>
      </div>}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {filtered.map(c=>(
          <div key={c.id} style={{ display:"flex", alignItems:"center", gap:14, background:"#0a0c14", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"14px 18px" }}>
            <div style={{ width:44, height:44, borderRadius:10, background:"linear-gradient(135deg,#1e3a8a,#2563eb)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff", flexShrink:0 }}>
              {c.university?.split(" ").map(w=>w[0]).slice(0,2).join("")||"U"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#f9fafb", marginBottom:3 }}>{c.name}</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", fontSize:12, color:"#6b7280" }}>
                <span>{c.university}</span>
                <span style={{ color:"#4b5563" }}>·</span>
                <span style={{ color:"#818cf8", fontWeight:600 }}>{c.division}</span>
                <span style={{ color:"#4b5563" }}>·</span>
                <span>{c.sport}{c.gender?` (${c.gender})`:""}</span>
              </div>
              {c.email&&<div style={{ fontSize:11, color:"#4b5563", marginTop:2 }}>📧 {c.email}</div>}
            </div>
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              <button onClick={()=>openEmail(c)} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid rgba(99,102,241,0.25)", background:"rgba(99,102,241,0.08)", color:"#818cf8", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"inherit" }}>📧 Email</button>
              {isAdmin&&<button onClick={()=>{ setForm({...c}); setModal(true); }} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", background:"none", color:"#9ca3af", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>Editar</button>}
              {isAdmin&&<button onClick={()=>del(c.id)} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid rgba(239,68,68,0.15)", background:"none", color:"#ef4444", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>✕</button>}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {modal&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, padding:16, overflowY:"auto" }}>
          <div style={{ background:"#080a10", border:"1px solid rgba(255,255,255,0.08)", borderRadius:18, width:"100%", maxWidth:520, padding:24, maxHeight:"92vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#f9fafb" }}>{form.id?"Editar":"Nuevo"} Entrenador</h3>
              <button onClick={()=>{ setModal(null); resetForm(); }} style={{ background:"rgba(255,255,255,0.06)", border:"none", color:"#9ca3af", cursor:"pointer", width:28, height:28, borderRadius:7 }}>✕</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={lbl}>Nombre del entrenador</label>
                <input style={{ ...inp, width:"100%" }} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Coach John Smith"/>
              </div>

              {/* Sport + Gender */}
              <div>
                <label style={lbl}>Deporte</label>
                <select style={{ ...inp, width:"100%", cursor:"pointer" }} value={form.sport} onChange={e=>{ setForm(f=>({...f,sport:e.target.value,university:""})); setUniSearch(""); }}>
                  {SPORT_OPTIONS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Género</label>
                <select style={{ ...inp, width:"100%", cursor:"pointer" }} value={form.gender||"Men"} onChange={e=>{ setForm(f=>({...f,gender:e.target.value,university:""})); setUniSearch(""); }}>
                  {GENDER_OPTIONS.map(g=><option key={g}>{g}</option>)}
                </select>
              </div>

              {/* Division */}
              <div>
                <label style={lbl}>División</label>
                <select style={{ ...inp, width:"100%", cursor:"pointer" }} value={form.division} onChange={e=>{ setForm(f=>({...f,division:e.target.value,university:""})); setUniSearch(""); }}>
                  {DIVISION_OPTIONS.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>

              {/* University search */}
              <div>
                <label style={lbl}>Universidad ({uniList.length} disponibles)</label>
                {form.university
                  ? <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:8 }}>
                      <span style={{ flex:1, fontSize:13, color:"#10b981", fontWeight:600 }}>{form.university}</span>
                      <button onClick={()=>{ setForm(f=>({...f,university:""})); setUniSearch(""); }} style={{ background:"none", border:"none", color:"#6b7280", cursor:"pointer", fontSize:14 }}>✕</button>
                    </div>
                  : <div style={{ position:"relative" }}>
                      <input style={{ ...inp, width:"100%" }} value={uniSearch} onChange={e=>setUniSearch(e.target.value)} placeholder="Buscar universidad..."/>
                      {filteredUnis.length>0&&<div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#0f1117", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, zIndex:10, maxHeight:180, overflowY:"auto", marginTop:4 }}>
                        {filteredUnis.map(u=>(
                          <div key={u.name} onClick={()=>{ setForm(f=>({...f,university:u.name})); setUniSearch(""); }} style={{ padding:"9px 14px", cursor:"pointer", borderBottom:"1px solid rgba(255,255,255,0.03)", fontSize:13, color:"#e5e7eb" }}>
                            {u.name}
                          </div>
                        ))}
                      </div>}
                    </div>
                }
              </div>

              <div>
                <label style={lbl}>Email</label>
                <input style={{ ...inp, width:"100%" }} type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="coach@university.edu"/>
              </div>
              <div>
                <label style={lbl}>Teléfono</label>
                <input style={{ ...inp, width:"100%" }} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+1 ..."/>
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={lbl}>Notas</label>
                <textarea style={{ ...inp, width:"100%", minHeight:60, resize:"vertical" }} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notas sobre este entrenador..."/>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button onClick={()=>{ setModal(null); resetForm(); }} style={{ flex:1, padding:"10px", borderRadius:9, border:"1px solid rgba(255,255,255,0.08)", background:"none", color:"#9ca3af", cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
              <button onClick={save} disabled={!form.name||!form.university} style={{ flex:2, padding:"10px", borderRadius:9, border:"none", background:(!form.name||!form.university)?"rgba(255,255,255,0.04)":"linear-gradient(135deg,#6366f1,#8b5cf6)", color:(!form.name||!form.university)?"#4b5563":"#fff", cursor:(!form.name||!form.university)?"default":"pointer", fontWeight:600, fontFamily:"inherit" }}>Guardar entrenador</button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {emailModal&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, padding:16, overflowY:"auto" }}>
          <div style={{ background:"#080a10", border:"1px solid rgba(255,255,255,0.08)", borderRadius:18, width:"100%", maxWidth:620, maxHeight:"92vh", overflowY:"auto", padding:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#f9fafb" }}>📧 Email a {emailModal.coach.name}</h3>
                <div style={{ fontSize:12, color:"#6b7280", marginTop:3 }}>{emailModal.coach.university} · {emailModal.coach.division} · {emailModal.coach.sport} ({emailModal.coach.gender||"Men"})</div>
              </div>
              <button onClick={()=>setEmailModal(null)} style={{ background:"rgba(255,255,255,0.06)", border:"none", color:"#9ca3af", cursor:"pointer", width:28, height:28, borderRadius:7 }}>✕</button>
            </div>

            {/* Player selector */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>
                Selecciona el atleta ({emailModal.coach.sport})
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {players.filter(p=>p.sport===emailModal.coach.sport).map(p=>(
                  <button key={p.id} onClick={()=>selectPlayer(emailModal.coach, p)} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${emailModal.player?.id===p.id?"rgba(99,102,241,0.4)":"rgba(255,255,255,0.08)"}`, background:emailModal.player?.id===p.id?"rgba(99,102,241,0.15)":"rgba(255,255,255,0.03)", color:emailModal.player?.id===p.id?"#818cf8":"#9ca3af", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>{p.name}</button>
                ))}
                {players.filter(p=>p.sport===emailModal.coach.sport).length===0&&<div style={{ fontSize:12, color:"#4b5563" }}>No hay atletas de {emailModal.coach.sport} en el CRM</div>}
              </div>
            </div>

            {/* Email template */}
            {emailModal.template&&<>
              <div style={{ fontSize:11, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>Plantilla generada</div>
              <textarea value={emailModal.template} onChange={e=>setEmailModal(prev=>({...prev,template:e.target.value}))} style={{ width:"100%", minHeight:300, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"12px 14px", color:"#e5e7eb", fontSize:12, fontFamily:"monospace", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
              <div style={{ display:"flex", gap:10, marginTop:12 }}>
                <button onClick={()=>{ navigator.clipboard.writeText(emailModal.template); setCopied(true); setTimeout(()=>setCopied(false),2000); }} style={{ flex:1, padding:"10px", borderRadius:9, border:"none", background:copied?"#10b981":"#6366f1", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>{copied?"✓ Copiado":"📋 Copiar email"}</button>
                {emailModal.coach.email&&<a href={`mailto:${emailModal.coach.email}?subject=${encodeURIComponent(`${emailModal.coach.sport} Recruit – ${emailModal.player?.name||""}`)}&body=${encodeURIComponent(emailModal.template)}`} style={{ flex:1, padding:"10px", borderRadius:9, border:"1px solid #e8e3db", background:"#f9f7f4", color:"#374151", textDecoration:"none", fontSize:13, fontWeight:600, textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center" }}>Abrir en Mail</a>}
                {emailModal.coach.email&&emailModal.player&&<button onClick={async()=>{ try{ await fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"athlete_profile",to:emailModal.coach.email,athleteName:emailModal.player.name,coachName:emailModal.coach.name,profileUrl:`${window.location.origin}?player=${emailModal.player.id}`,body:emailModal.template})}); alert("Email enviado correctamente"); }catch(e){ alert("Error al enviar"); }}} style={{ flex:1, padding:"10px", borderRadius:9, border:"none", background:"#1a1a2e", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>Enviar desde CRM</button>}
              </div>
            </>}
          </div>
        </div>
      )}
    </div>
  );
};
