import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SPORTS = ["Todos","Fútbol","Tenis","Natación","Béisbol","Baloncesto","Atletismo","Golf","Voleibol"];
const STATUSES = ["Todos","Becado","En proceso","Prospecto","Inactivo"];
const DIVISIONS = ["NCAA D1","NCAA D2","NCAA D3","NAIA","NJCAA"];
const OFFER_STATUSES = ["Interesada","Oferta formal","Pre-aceptada","Rechazada","Elegida ✓"];
const SEASONS = ["Fall 25","Spring 26","Fall 26","Spring 27","Fall 27","Spring 28","Fall 28","Spring 29"];
const STATUS_COLORS = {"Becado":"#22c55e","En proceso":"#f59e0b","Prospecto":"#3b82f6","Inactivo":"#6b7280"};
const OFFER_COLORS = {"Interesada":"#6366f1","Oferta formal":"#f59e0b","Pre-aceptada":"#22c55e","Rechazada":"#ef4444","Elegida ✓":"#10b981"};
const POSITIONS_BY_SPORT = {
  "Fútbol": ["Portero","Defensa Central","Lateral Derecho","Lateral Izquierdo","Pivote","Centrocampista","Mediapunta","Extremo Derecho","Extremo Izquierdo","Delantero Centro"],
  "Tenis": ["Individual","Dobles","Individual y Dobles"],
  "Natación": ["Libre","Espalda","Braza","Mariposa","Estilos","Relevos"],
  "Béisbol": ["Pitcher","Catcher","First Base","Second Base","Third Base","Shortstop","Left Field","Center Field","Right Field","DH"],
  "Baloncesto": ["Base","Escolta","Alero","Ala-Pívot","Pívot"],
  "Atletismo": ["100m","200m","400m","800m","1500m","5000m","10000m","110m Vallas","400m Vallas","Salto de Altura","Salto de Longitud","Triple Salto","Salto con Pértiga","Lanzamiento de Peso","Lanzamiento de Disco","Lanzamiento de Martillo","Jabalina","Decatlón","Heptatlón"],
  "Golf": ["Amateur","Profesional"],
  "Voleibol": ["Líbero","Colocador","Opuesto","Central","Receptor","Punta"],
};
const SPORT_FIELDS = {
  "Fútbol": [["Pie dominante","foot",["Derecho","Zurdo","Ambidiestro"]],["Altura (cm)","height","number"],["Peso (kg)","weight","number"],["Goles temporada","sport_goals","number"],["Asistencias","sport_assists","number"],["Partidos jugados","sport_games","number"],["Equipo actual","sport_team","text"],["Liga/División actual","sport_league","text"]],
  "Tenis": [["Mano dominante","foot",["Derecha","Zurda"]],["Ranking ITF Junior","sport_ranking","text"],["Ranking Nacional","sport_national_ranking","text"],["Mejor resultado torneo","sport_best_result","text"],["Torneos jugados","sport_games","number"],["Estilo de juego","sport_style",["Agresivo de fondo","Serve & Volley","All-Court","Defensor"]]],
  "Natación": [["Mejor tiempo 50m libre","sport_time_50free","text"],["Mejor tiempo 100m libre","sport_time_100free","text"],["Mejor tiempo 200m libre","sport_time_200free","text"],["Mejor tiempo 100m espalda","sport_time_100back","text"],["Mejor tiempo 100m braza","sport_time_100breast","text"],["Mejor tiempo 100m mariposa","sport_time_100fly","text"],["Club actual","sport_team","text"],["Ranking nacional","sport_national_ranking","text"]],
  "Béisbol": [["Posición principal","sport_position2","text"],["Velocidad lanzamiento (mph)","sport_velocity","number"],["Batting average","sport_batting_avg","text"],["ERA (lanzadores)","sport_era","text"],["Home runs","sport_goals","number"],["RBIs","sport_assists","number"],["Equipo actual","sport_team","text"]],
  "Baloncesto": [["Altura (cm)","height","number"],["Envergadura (cm)","sport_wingspan","number"],["Puntos por partido","sport_goals","number"],["Rebotes por partido","sport_rebounds","number"],["Asistencias por partido","sport_assists","number"],["Equipo actual","sport_team","text"],["Liga actual","sport_league","text"]],
  "Atletismo": [["Mejor marca personal","sport_personal_best","text"],["Ranking nacional","sport_national_ranking","text"],["Ranking mundial junior","sport_world_ranking","text"],["Club/Equipo","sport_team","text"],["Entrenador actual","sport_coach","text"]],
  "Golf": [["Handicap","sport_handicap","text"],["Mejor score 18 hoyos","sport_best_score","text"],["Ranking Amateur","sport_ranking","text"],["Torneos ganados","sport_goals","number"],["Club actual","sport_team","text"]],
  "Voleibol": [["Altura (cm)","height","number"],["Alcance de remate (cm)","sport_reach","number"],["Puntos por set","sport_goals","number"],["Aces por set","sport_assists","number"],["Equipo actual","sport_team","text"],["Liga actual","sport_league","text"]],
};

const NCAA_UNIVERSITIES = [
  {name:"Alabama",state:"AL",division:"NCAA D1"},{name:"Auburn",state:"AL",division:"NCAA D1"},{name:"Arizona",state:"AZ",division:"NCAA D1"},{name:"Arizona State",state:"AZ",division:"NCAA D1"},{name:"Arkansas",state:"AR",division:"NCAA D1"},{name:"UCLA",state:"CA",division:"NCAA D1"},{name:"USC",state:"CA",division:"NCAA D1"},{name:"Cal Berkeley",state:"CA",division:"NCAA D1"},{name:"Stanford",state:"CA",division:"NCAA D1"},{name:"San Diego State",state:"CA",division:"NCAA D1"},{name:"Colorado",state:"CO",division:"NCAA D1"},{name:"Connecticut",state:"CT",division:"NCAA D1"},{name:"Florida",state:"FL",division:"NCAA D1"},{name:"Florida State",state:"FL",division:"NCAA D1"},{name:"University of Miami",state:"FL",division:"NCAA D1"},{name:"FIU",state:"FL",division:"NCAA D1"},{name:"FAU",state:"FL",division:"NCAA D1"},{name:"USF",state:"FL",division:"NCAA D1"},{name:"UCF",state:"FL",division:"NCAA D1"},{name:"Georgia",state:"GA",division:"NCAA D1"},{name:"Georgia Tech",state:"GA",division:"NCAA D1"},{name:"Notre Dame",state:"IN",division:"NCAA D1"},{name:"Indiana",state:"IN",division:"NCAA D1"},{name:"Iowa",state:"IA",division:"NCAA D1"},{name:"Iowa State",state:"IA",division:"NCAA D1"},{name:"Kansas",state:"KS",division:"NCAA D1"},{name:"Kansas State",state:"KS",division:"NCAA D1"},{name:"Kentucky",state:"KY",division:"NCAA D1"},{name:"LSU",state:"LA",division:"NCAA D1"},{name:"Maryland",state:"MD",division:"NCAA D1"},{name:"Michigan",state:"MI",division:"NCAA D1"},{name:"Michigan State",state:"MI",division:"NCAA D1"},{name:"Minnesota",state:"MN",division:"NCAA D1"},{name:"Ole Miss",state:"MS",division:"NCAA D1"},{name:"Mississippi State",state:"MS",division:"NCAA D1"},{name:"Missouri",state:"MO",division:"NCAA D1"},{name:"Nebraska",state:"NE",division:"NCAA D1"},{name:"Rutgers",state:"NJ",division:"NCAA D1"},{name:"Syracuse",state:"NY",division:"NCAA D1"},{name:"North Carolina",state:"NC",division:"NCAA D1"},{name:"NC State",state:"NC",division:"NCAA D1"},{name:"Duke",state:"NC",division:"NCAA D1"},{name:"Wake Forest",state:"NC",division:"NCAA D1"},{name:"Ohio State",state:"OH",division:"NCAA D1"},{name:"Oklahoma",state:"OK",division:"NCAA D1"},{name:"Oklahoma State",state:"OK",division:"NCAA D1"},{name:"Oregon",state:"OR",division:"NCAA D1"},{name:"Penn State",state:"PA",division:"NCAA D1"},{name:"Pittsburgh",state:"PA",division:"NCAA D1"},{name:"South Carolina",state:"SC",division:"NCAA D1"},{name:"Clemson",state:"SC",division:"NCAA D1"},{name:"Tennessee",state:"TN",division:"NCAA D1"},{name:"Vanderbilt",state:"TN",division:"NCAA D1"},{name:"Texas",state:"TX",division:"NCAA D1"},{name:"Texas A&M",state:"TX",division:"NCAA D1"},{name:"Texas Tech",state:"TX",division:"NCAA D1"},{name:"SMU",state:"TX",division:"NCAA D1"},{name:"TCU",state:"TX",division:"NCAA D1"},{name:"Baylor",state:"TX",division:"NCAA D1"},{name:"Rice",state:"TX",division:"NCAA D1"},{name:"Houston",state:"TX",division:"NCAA D1"},{name:"Utah",state:"UT",division:"NCAA D1"},{name:"BYU",state:"UT",division:"NCAA D1"},{name:"Virginia",state:"VA",division:"NCAA D1"},{name:"Virginia Tech",state:"VA",division:"NCAA D1"},{name:"Washington",state:"WA",division:"NCAA D1"},{name:"Washington State",state:"WA",division:"NCAA D1"},{name:"West Virginia",state:"WV",division:"NCAA D1"},{name:"Wisconsin",state:"WI",division:"NCAA D1"},{name:"Harvard",state:"MA",division:"NCAA D1"},{name:"Yale",state:"CT",division:"NCAA D1"},{name:"Georgetown",state:"DC",division:"NCAA D1"},{name:"Boston College",state:"MA",division:"NCAA D1"},{name:"Northwestern",state:"IL",division:"NCAA D1"},{name:"Illinois",state:"IL",division:"NCAA D1"},{name:"Gonzaga",state:"WA",division:"NCAA D1"},{name:"Creighton",state:"NE",division:"NCAA D1"},{name:"Xavier",state:"OH",division:"NCAA D1"},{name:"Providence",state:"RI",division:"NCAA D1"},{name:"Villanova",state:"PA",division:"NCAA D1"},{name:"Butler",state:"IN",division:"NCAA D1"},{name:"Marquette",state:"WI",division:"NCAA D1"},
  {name:"Rollins College",state:"FL",division:"NCAA D2"},{name:"Barry University",state:"FL",division:"NCAA D2"},{name:"Lynn University",state:"FL",division:"NCAA D2"},{name:"University of Tampa",state:"FL",division:"NCAA D2"},{name:"Nova Southeastern",state:"FL",division:"NCAA D2"},{name:"Grand Canyon",state:"AZ",division:"NCAA D2"},{name:"Cal State LA",state:"CA",division:"NCAA D2"},{name:"Colorado School of Mines",state:"CO",division:"NCAA D2"},{name:"Charleston",state:"SC",division:"NCAA D2"},{name:"Wingate University",state:"NC",division:"NCAA D2"},
  {name:"Williams College",state:"MA",division:"NCAA D3"},{name:"Amherst College",state:"MA",division:"NCAA D3"},{name:"Middlebury College",state:"VT",division:"NCAA D3"},{name:"Tufts University",state:"MA",division:"NCAA D3"},{name:"Emory University",state:"GA",division:"NCAA D3"},{name:"NYU",state:"NY",division:"NCAA D3"},{name:"Rochester",state:"NY",division:"NCAA D3"},
  {name:"Lindsey Wilson",state:"KY",division:"NAIA"},{name:"Indiana Tech",state:"IN",division:"NAIA"},{name:"Keiser University",state:"FL",division:"NAIA"},{name:"St. Thomas University",state:"FL",division:"NAIA"},{name:"Benedictine College",state:"KS",division:"NAIA"},{name:"Morningside",state:"IA",division:"NAIA"},{name:"Ottawa University",state:"KS",division:"NAIA"},
  {name:"Tyler Junior College",state:"TX",division:"NJCAA"},{name:"Eastern Florida State",state:"FL",division:"NJCAA"},{name:"Cowley College",state:"KS",division:"NJCAA"},{name:"Iowa Central CC",state:"IA",division:"NJCAA"},{name:"Monroe College",state:"NY",division:"NJCAA"},
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const SUPA_URL = "https://jjgtgkqmxnlxkshykdxv.supabase.co";
const getPhotoUrl = (p) => !p ? null : p.startsWith("http") ? p : `${SUPA_URL}/storage/v1/object/public/avatars/${p}`;

const Avatar = ({ name, size=40, photoUrl }) => {
  const [err,setErr] = useState(false);
  const url = getPhotoUrl(photoUrl);
  if(url&&!err) return <img src={url} alt={name} onError={()=>setErr(true)} style={{ width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid rgba(255,255,255,0.1)" }}/>;
  const i = (name||"?").split(" ").map(n=>n[0]).slice(0,2).join("");
  const pal=["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6","#f97316"];
  const c=pal[(name||"A").charCodeAt(0)%pal.length];
  return <div style={{ width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${c}88,${c})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.34,fontWeight:800,color:"#fff",flexShrink:0,border:"2px solid rgba(255,255,255,0.08)" }}>{i}</div>;
};

const PhotoUpload = ({ currentUrl, onUpload, size=80 }) => {
  const ref = useRef();
  const [uploading,setUploading] = useState(false);
  const [preview,setPreview] = useState(null);
  const upload = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    setUploading(true); setPreview(URL.createObjectURL(file));
    const filename = `${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(filename, file, {upsert:true});
    if(!error) onUpload(filename); else console.error(error);
    setUploading(false);
  };
  const url = preview || getPhotoUrl(currentUrl);
  return (
    <div style={{ position:"relative",width:size,height:size,cursor:"pointer",flexShrink:0 }} onClick={()=>ref.current.click()}>
      {url?<img src={url} alt="foto" style={{ width:size,height:size,borderRadius:"50%",objectFit:"cover",border:"3px solid rgba(99,102,241,0.5)" }}/>
          :<div style={{ width:size,height:size,borderRadius:"50%",background:"rgba(255,255,255,0.05)",border:"2px dashed rgba(99,102,241,0.4)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontSize:11,color:"#6b7280",gap:4 }}><span style={{ fontSize:20 }}>📷</span><span>Foto</span></div>}
      <div style={{ position:"absolute",bottom:2,right:2,width:22,height:22,background:"#6366f1",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11 }}>{uploading?"⏳":"✏️"}</div>
      <input ref={ref} type="file" accept="image/*" style={{ display:"none" }} onChange={upload}/>
    </div>
  );
};

const UniLogo = ({ name, logoUrl, size=36 }) => {
  const [err,setErr] = useState(false);
  const domainMap = {"SMU":"smu.edu","UCLA":"ucla.edu","Stanford":"stanford.edu","University of Miami":"miami.edu","USC":"usc.edu","Cal Berkeley":"berkeley.edu","Texas A&M":"tamu.edu","FIU":"fiu.edu","FAU":"fau.edu","USF":"usf.edu","Duke":"duke.edu","Harvard":"harvard.edu","Notre Dame":"nd.edu","Georgetown":"georgetown.edu","Vanderbilt":"vanderbilt.edu","Wake Forest":"wfu.edu","Boston College":"bc.edu","Syracuse":"syr.edu","Alabama":"ua.edu","Auburn":"auburn.edu","Florida":"ufl.edu","Florida State":"fsu.edu","Georgia":"uga.edu","Texas":"utexas.edu","Ohio State":"osu.edu","Michigan":"umich.edu","Penn State":"psu.edu","Oregon":"uoregon.edu","Washington":"uw.edu","Clemson":"clemson.edu","LSU":"lsu.edu","TCU":"tcu.edu","Baylor":"baylor.edu","Rice":"rice.edu","BYU":"byu.edu","Virginia":"virginia.edu","Gonzaga":"gonzaga.edu","Villanova":"villanova.edu","Marquette":"marquette.edu","Creighton":"creighton.edu"};
  const url = !err && logoUrl ? getPhotoUrl(logoUrl) : null;
  const d = !err && !url && Object.entries(domainMap).find(([k])=>name?.toLowerCase().includes(k.toLowerCase()))?.[1];
  const src = url || (d?`https://logo.clearbit.com/${d}`:null);
  if(src) return <img src={src} alt={name} onError={()=>setErr(true)} style={{ width:size,height:size,borderRadius:8,objectFit:"contain",background:"#fff",padding:2,flexShrink:0 }}/>;
  const ini=(name||"U").split(" ").map(w=>w[0]).slice(0,2).join("");
  return <div style={{ width:size,height:size,borderRadius:8,background:"linear-gradient(135deg,#1e3a8a,#1d4ed8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.28,fontWeight:800,color:"#fff",flexShrink:0 }}>{ini}</div>;
};

const Badge = ({ status }) => <span style={{ padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:`${STATUS_COLORS[status]}18`,color:STATUS_COLORS[status],border:`1px solid ${STATUS_COLORS[status]}30`,whiteSpace:"nowrap" }}>{status}</span>;
const OfferBadge = ({ status }) => <span style={{ padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:`${OFFER_COLORS[status]||"#6b7280"}18`,color:OFFER_COLORS[status]||"#6b7280",border:`1px solid ${OFFER_COLORS[status]||"#6b7280"}30` }}>{status}</span>;
const Pill = ({ label, color="#6b7280" }) => <span style={{ padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:600,background:`${color}12`,color,border:`1px solid ${color}25` }}>{label}</span>;
const Bar = ({ value, max, color="#6366f1", h=4 }) => <div style={{ width:"100%",background:"rgba(255,255,255,0.06)",borderRadius:99,height:h,overflow:"hidden" }}><div style={{ width:`${Math.min(100,max>0?(value/max)*100:0)}%`,background:`linear-gradient(90deg,${color}55,${color})`,height:"100%",borderRadius:99,transition:"width .4s" }}/></div>;

const Card = ({ children, style={} }) => <div style={{ background:"#13151f",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"20px 22px",...style }}>{children}</div>;
const StatCard = ({ label, value, sub, color="#6366f1", icon }) => (
  <div style={{ background:"#13151f",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"18px 20px",position:"relative",overflow:"hidden" }}>
    <div style={{ position:"absolute",top:-15,right:-15,width:60,height:60,borderRadius:"50%",background:`radial-gradient(circle,${color}25,transparent)` }}/>
    <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:10 }}><span style={{ color,fontSize:14 }}>{icon}</span><span style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:"#4b5563" }}>{label}</span></div>
    <div style={{ fontSize:26,fontWeight:900,color:"#f9fafb",lineHeight:1 }}>{value}</div>
    {sub&&<div style={{ fontSize:11,color:"#4b5563",marginTop:5 }}>{sub}</div>}
  </div>
);

const Svg = ({ d, size=16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
const Ic = {
  dash:<Svg d="M3 3h7v7H3zm11 0h7v7h-7zm0 11h7v7h-7zM3 14h7v7H3z"/>,
  players:<Svg d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm14 18v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>,
  fin:<Svg d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>,
  uni:<Svg d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10"/>,
  team:<Svg d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>,
  search:<Svg d="M21 21l-4.35-4.35M11 19A8 8 0 1 0 11 3a8 8 0 0 0 0 16z"/>,
  plus:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  back:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>,
  edit:<Svg d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>,
  video:<Svg d="M22.54 6.42A2.78 2.78 0 0 0 20.7 4.56C19.08 4 12 4 12 4s-7.08 0-8.7.56A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.3 19.44C4.92 20 12 20 12 20s7.08 0 8.7-.56a2.78 2.78 0 0 0 1.84-1.86A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02l5.5-3.02-5.5-3.02z"/>,
  check:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>,
  x:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  trophy:<Svg d="M8 21h8M12 17v4M7 4v6a5 5 0 0 0 10 0V4M17 4h2a2 2 0 0 1 2 2v1a3 3 0 0 1-3 3h-1M7 4H5a2 2 0 0 0-2 2v1a3 3 0 0 0 3 3h1"/>,
  alert:<Svg d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/>,
  share:<Svg d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>,
  refresh:<Svg d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>,
  menu:<Svg d="M3 12h18M3 6h18M3 18h18"/>,
};

// ─── DB HELPERS ───────────────────────────────────────────────────────────────
const dbToPlayer = (row, offers=[], timeline=[]) => ({
  id:row.id, name:row.name, sport:row.sport||"Fútbol", nationality:row.nationality, age:row.age,
  position:row.position, foot:row.foot, height:row.height, weight:row.weight,
  status:row.status||"Prospecto", agent:row.agent, phone:row.phone, email:row.email,
  instagram:row.instagram, videoUrl:row.video_url, photoUrl:row.photo_url,
  gpa:row.gpa, satScore:row.sat_score, englishLevel:row.english_level,
  highSchool:row.high_school, graduationYear:row.graduation_year, major:row.major,
  toeflScore:row.toefl_score, university:row.university, state:row.state,
  scholarshipPct:row.scholarship_pct||0, startDate:row.start_date, contractEnd:row.contract_end,
  notes:row.notes, totalFee:row.total_fee||2700, payment1Amount:row.payment1_amount||900, payment2Amount:row.payment2_amount||1800,
  payment1:{paid:row.payment1_paid,paidBy:row.payment1_paid_by,date:row.payment1_date},
  payment2:{paid:row.payment2_paid,paidBy:row.payment2_paid_by,date:row.payment2_date},
  sportData: row.sport_data ? (typeof row.sport_data === 'string' ? JSON.parse(row.sport_data) : row.sport_data) : {},
  offers:offers.map(o=>({id:o.id,university:o.university,state:o.state,division:o.division,scholarshipPct:o.scholarship_pct,amount:o.amount,season:o.season,status:o.status,notes:o.notes,logoUrl:o.logo_url})),
  timeline:timeline.map(t=>({id:t.id,date:t.date,event:t.event,type:t.type})),
});
const playerToDb = (p) => ({
  name:p.name, sport:p.sport, nationality:p.nationality, age:p.age||null,
  position:p.position, foot:p.foot, height:p.height||null, weight:p.weight||null,
  status:p.status, agent:p.agent, phone:p.phone, email:p.email,
  instagram:p.instagram, video_url:p.videoUrl, photo_url:p.photoUrl||null,
  gpa:p.gpa||null, sat_score:p.satScore||null, english_level:p.englishLevel,
  high_school:p.highSchool, graduation_year:p.graduationYear||null, major:p.major,
  toefl_score:p.toeflScore||null, university:p.university, state:p.state,
  scholarship_pct:p.scholarshipPct||0, start_date:p.startDate||null, contract_end:p.contractEnd||null, notes:p.notes,
  total_fee:p.totalFee||2700, payment1_amount:p.payment1Amount||900, payment2_amount:p.payment2Amount||1800,
  payment1_paid:p.payment1?.paid||false, payment1_paid_by:p.payment1?.paidBy||null, payment1_date:p.payment1?.date||null,
  payment2_paid:p.payment2?.paid||false, payment2_paid_by:p.payment2?.paidBy||null, payment2_date:p.payment2?.date||null,
  sport_data: p.sportData ? JSON.stringify(p.sportData) : null,
});

// ─── PUBLIC PROFILE (ENGLISH) ─────────────────────────────────────────────────
const PublicProfile = ({ player, onClose }) => {
  const [copied,setCopied] = useState(false);
  const url = `${window.location.origin}?player=${player.id}`;
  const copy = () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const sd = player.sportData || {};
  const sportFields = SPORT_FIELDS[player.sport] || [];
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:16,overflowY:"auto" }}>
      <div style={{ background:"#0a0c14",border:"1px solid rgba(255,255,255,0.08)",borderRadius:24,width:"100%",maxWidth:560,maxHeight:"92vh",overflowY:"auto" }}>
        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#0d1117,#161b27)",padding:"24px 26px 20px",borderRadius:"24px 24px 0 0",borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
            <img src="/logo.png" alt="FUA" style={{ height:32,objectFit:"contain" }} onError={e=>{ e.target.style.display="none"; }}/>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)",border:"none",color:"#9ca3af",cursor:"pointer",width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center" }}>{Ic.x}</button>
          </div>
          <div style={{ display:"flex",gap:18,alignItems:"center" }}>
            <Avatar name={player.name} size={76} photoUrl={player.photoUrl}/>
            <div>
              <h2 style={{ margin:0,fontSize:22,fontWeight:900,color:"#f9fafb",letterSpacing:-0.5 }}>{player.name}</h2>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginTop:8 }}>
                <Pill label={player.sport} color="#6366f1"/>
                {player.position&&<Pill label={player.position} color="#8b5cf6"/>}
                {player.nationality&&<Pill label={player.nationality} color="#3b82f6"/>}
                {player.age&&<Pill label={player.age+" yrs"} color="#6b7280"/>}
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding:"20px 26px 28px",display:"flex",flexDirection:"column",gap:14 }}>
          {/* Video destacado */}
          {player.videoUrl&&(
            <a href={player.videoUrl} target="_blank" rel="noreferrer" style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 18px",background:"linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.06))",border:"1px solid rgba(239,68,68,0.25)",borderRadius:14,textDecoration:"none" }}>
              <div style={{ width:40,height:40,background:"#ef4444",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{Ic.video}</div>
              <div><div style={{ fontSize:14,fontWeight:800,color:"#f9fafb" }}>Watch Highlight Video</div><div style={{ fontSize:12,color:"#9ca3af",marginTop:2 }}>Full athletic performance reel</div></div>
              <div style={{ marginLeft:"auto",color:"#f87171",fontSize:20 }}>→</div>
            </a>
          )}
          {/* Academic Stats */}
          <div>
            <div style={{ fontSize:10,fontWeight:800,color:"#6b7280",textTransform:"uppercase",letterSpacing:1.5,marginBottom:10 }}>Academic Profile</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8 }}>
              {[["GPA",player.gpa||"—",player.gpa>=3.5?"#22c55e":player.gpa>=3?"#f59e0b":"#9ca3af"],["SAT",player.satScore||"—","#6366f1"],["TOEFL",player.toeflScore||"—","#8b5cf6"],["English",player.englishLevel||"—","#3b82f6"]].map(([l,v,c])=>(
                <div key={l} style={{ background:"rgba(255,255,255,0.04)",border:`1px solid ${c}20`,borderRadius:12,padding:"12px 8px",textAlign:"center" }}>
                  <div style={{ fontSize:9,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:700 }}>{l}</div>
                  <div style={{ fontSize:18,fontWeight:900,color:c }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8 }}>
              {[["High School",player.highSchool],["Graduation",player.graduationYear],["Intended Major",player.major],["English Level",player.englishLevel]].filter(([,v])=>v).map(([l,v])=>(
                <div key={l} style={{ background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"10px 14px" }}>
                  <div style={{ fontSize:9,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:13,color:"#e5e7eb",fontWeight:600 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Athletic Stats */}
          <div>
            <div style={{ fontSize:10,fontWeight:800,color:"#6b7280",textTransform:"uppercase",letterSpacing:1.5,marginBottom:10 }}>Athletic Profile</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {[["Sport",player.sport],["Position",player.position],["Height",player.height?player.height+" cm":"—"],["Weight",player.weight?player.weight+" kg":"—"],["Scholarship",player.scholarshipPct+"%"],["University",player.university||"—"]].map(([l,v])=>(
                <div key={l} style={{ background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"10px 14px" }}>
                  <div style={{ fontSize:9,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:13,color:"#e5e7eb",fontWeight:600 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Sport-specific stats */}
          {sportFields.length>0&&Object.keys(sd).length>0&&(
            <div>
              <div style={{ fontSize:10,fontWeight:800,color:"#6b7280",textTransform:"uppercase",letterSpacing:1.5,marginBottom:10 }}>{player.sport} Stats</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                {sportFields.filter(([,k])=>sd[k]).map(([l,k])=>(
                  <div key={k} style={{ background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.12)",borderRadius:10,padding:"10px 14px" }}>
                    <div style={{ fontSize:9,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3 }}>{l}</div>
                    <div style={{ fontSize:13,color:"#818cf8",fontWeight:700 }}>{sd[k]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Share */}
          <div style={{ background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:14,padding:"14px 16px" }}>
            <div style={{ fontSize:10,fontWeight:800,color:"#6366f1",textTransform:"uppercase",letterSpacing:1,marginBottom:8 }}>Share Profile</div>
            <div style={{ display:"flex",gap:8 }}>
              <div style={{ flex:1,background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"8px 10px",fontSize:11,color:"#6b7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{url}</div>
              <button onClick={copy} style={{ padding:"8px 14px",borderRadius:8,border:"none",background:copied?"#22c55e":"#6366f1",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap" }}>{copied?"✓ Copied":"Copy link"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PAYMENT ROW ──────────────────────────────────────────────────────────────
const PaymentRow = ({ label, amount, payment, onToggle, agents }) => (
  <div style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:payment.paid?"rgba(34,197,94,0.05)":"rgba(245,158,11,0.04)",borderRadius:12,border:`1px solid ${payment.paid?"rgba(34,197,94,0.15)":"rgba(245,158,11,0.15)"}` }}>
    <div style={{ width:28,height:28,borderRadius:"50%",background:payment.paid?"rgba(34,197,94,0.15)":"rgba(245,158,11,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
      {payment.paid?<span style={{ color:"#22c55e" }}>{Ic.check}</span>:<span style={{ color:"#f59e0b" }}>{Ic.alert}</span>}
    </div>
    <div style={{ flex:1 }}>
      <div style={{ fontSize:13,fontWeight:700,color:"#e5e7eb" }}>{label} — <span style={{ color:"#f9fafb",fontWeight:900 }}>{amount}€</span></div>
      {payment.paid?<div style={{ fontSize:11,color:"#6b7280",marginTop:2 }}>Cobrado por <span style={{ color:"#818cf8",fontWeight:700 }}>{payment.paidBy}</span> · {payment.date}</div>:<div style={{ fontSize:11,color:"#f59e0b",marginTop:2 }}>Pendiente</div>}
    </div>
    <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
      {!payment.paid&&(agents||[]).map(a=><button key={a} onClick={()=>onToggle(a)} style={{ padding:"5px 10px",borderRadius:8,border:"none",background:"rgba(99,102,241,0.2)",color:"#818cf8",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit" }}>✓ {a.split(" ")[0]}</button>)}
      {payment.paid&&<button onClick={()=>onToggle(null)} style={{ padding:"5px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"none",color:"#6b7280",cursor:"pointer",fontSize:11,fontFamily:"inherit" }}>Deshacer</button>}
    </div>
  </div>
);

// ─── PLAYER MODAL ─────────────────────────────────────────────────────────────
const PlayerModal = ({ initial, onClose, onSave, agentList }) => {
  const sport = initial?.sport || "Fútbol";
  const blank = { name:"",sport,nationality:"",age:"",position:(POSITIONS_BY_SPORT[sport]||[])[0]||"",foot:"Derecho",height:"",weight:"",status:"Prospecto",agent:agentList[0]||"",phone:"",email:"",instagram:"",videoUrl:"",photoUrl:"",gpa:"",satScore:"",englishLevel:"B2",highSchool:"",graduationYear:"",major:"",toeflScore:"",university:"",state:"",scholarshipPct:0,startDate:"",contractEnd:"",notes:"",totalFee:2700,payment1Amount:900,payment2Amount:1800,sportData:{} };
  const [form,setForm] = useState(initial?{...blank,...initial,sportData:initial.sportData||{}}:blank);
  const [saving,setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const setSport = (s) => setForm(f=>({...f,sport:s,position:(POSITIONS_BY_SPORT[s]||[])[0]||""}));
  const setSportData = (k,v) => setForm(f=>({...f,sportData:{...f.sportData,[k]:v}}));
  const inp = { background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,padding:"9px 12px",color:"#f9fafb",fontSize:13,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"inherit" };
  const lbl = { fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:5,display:"block" };
  const F = ({ l,k,type="text",opts,sd }) => (
    <div><label style={lbl}>{l}</label>
      {opts?<select style={{ ...inp,cursor:"pointer" }} value={sd?form.sportData[k]||"":form[k]||""} onChange={e=>sd?setSportData(k,e.target.value):set(k,e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select>
           :<input style={inp} type={type} value={sd?form.sportData[k]||"":form[k]||""} onChange={e=>sd?setSportData(k,e.target.value):set(k,e.target.value)} placeholder={l}/>}
    </div>
  );
  const save = async () => {
    if(!form.name.trim()) return; setSaving(true);
    await onSave({...form,id:form.id||undefined,age:parseInt(form.age)||0,height:parseInt(form.height)||0,weight:parseInt(form.weight)||0,gpa:parseFloat(form.gpa)||0,satScore:parseInt(form.satScore)||null,toeflScore:parseInt(form.toeflScore)||null,scholarshipPct:parseInt(form.scholarshipPct)||0,totalFee:parseFloat(form.totalFee)||2700,payment1Amount:parseFloat(form.payment1Amount)||900,payment2Amount:parseFloat(form.payment2Amount)||1800});
    setSaving(false); onClose();
  };
  const sec = (l,c) => <div style={{ fontSize:10,fontWeight:800,color:c,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${c}18` }}>{l}</div>;
  const sportFieldsList = SPORT_FIELDS[form.sport] || [];
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }}>
      <div style={{ background:"#0d0f1a",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,width:"100%",maxWidth:680,maxHeight:"93vh",overflowY:"auto" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"22px 26px 0" }}>
          <h2 style={{ margin:0,fontSize:18,fontWeight:800,color:"#f9fafb" }}>{initial?"Editar atleta":"Nuevo atleta"}</h2>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)",border:"none",color:"#9ca3af",cursor:"pointer",width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center" }}>{Ic.x}</button>
        </div>
        <div style={{ padding:"18px 26px 26px",display:"flex",flexDirection:"column",gap:20 }}>
          <div style={{ display:"flex",alignItems:"center",gap:16 }}>
            <PhotoUpload currentUrl={form.photoUrl} onUpload={u=>set("photoUrl",u)} size={76}/>
            <div style={{ fontSize:13,color:"#6b7280" }}>Haz clic para subir foto del jugador</div>
          </div>
          <div>{sec("Datos personales","#6366f1")}<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}><F l="Nombre completo" k="name"/><F l="Nacionalidad" k="nationality"/><F l="Edad" k="age" type="number"/><F l="Email" k="email" type="email"/><F l="Teléfono" k="phone"/><F l="Instagram" k="instagram"/></div></div>
          <div>{sec("Deportivo","#22c55e")}<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            <div><label style={lbl}>Deporte</label><select style={{ ...inp,cursor:"pointer" }} value={form.sport} onChange={e=>setSport(e.target.value)}>{SPORTS.slice(1).map(o=><option key={o}>{o}</option>)}</select></div>
            <div><label style={lbl}>Posición</label><select style={{ ...inp,cursor:"pointer" }} value={form.position||""} onChange={e=>set("position",e.target.value)}>{(POSITIONS_BY_SPORT[form.sport]||[]).map(o=><option key={o}>{o}</option>)}</select></div>
            <F l="Agente asignado" k="agent" opts={agentList}/>
            <F l="Estado" k="status" opts={STATUSES.slice(1)}/>
            <div><label style={lbl}>Enlace vídeo</label><input style={inp} type="url" value={form.videoUrl||""} onChange={e=>set("videoUrl",e.target.value)} placeholder="https://youtube.com/..."/></div>
            <F l="Universidad destino" k="university"/>
            <F l="Estado USA" k="state"/>
            <div><label style={lbl}>% Beca</label><input style={inp} type="number" min="0" max="100" value={form.scholarshipPct||0} onChange={e=>set("scholarshipPct",e.target.value)}/></div>
          </div></div>
          {/* Sport-specific fields */}
          {sportFieldsList.length>0&&<div>{sec(`Estadísticas de ${form.sport}`,"#f59e0b")}<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            {sportFieldsList.map(([l,k,typeOrOpts])=>(
              Array.isArray(typeOrOpts)?<F key={k} l={l} k={k} opts={typeOrOpts} sd={k!=="foot"&&k!=="height"&&k!=="weight"}/> : <F key={k} l={l} k={k} type={typeOrOpts||"text"} sd={k!=="foot"&&k!=="height"&&k!=="weight"}/>
            ))}
          </div></div>}
          <div>{sec("Académico","#8b5cf6")}<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}><F l="High School" k="highSchool"/><F l="Año graduación" k="graduationYear" type="number"/><F l="GPA (0-4.0)" k="gpa" type="number"/><F l="SAT Score" k="satScore" type="number"/><F l="TOEFL Score" k="toeflScore" type="number"/><F l="Nivel inglés" k="englishLevel" opts={["A1","A2","B1","B2","C1","C2","Nativo"]}/><div style={{ gridColumn:"1/-1" }}><F l="Carrera de interés (Major)" k="major"/></div></div></div>
          <div>{sec("Estructura de pagos","#10b981")}<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
            <div><label style={lbl}>Total honorarios (€)</label><input style={inp} type="number" value={form.totalFee||2700} onChange={e=>set("totalFee",e.target.value)}/></div>
            <div><label style={lbl}>Primer pago (€)</label><input style={inp} type="number" value={form.payment1Amount||900} onChange={e=>set("payment1Amount",e.target.value)}/></div>
            <div><label style={lbl}>Segundo pago (€)</label><input style={inp} type="number" value={form.payment2Amount||1800} onChange={e=>set("payment2Amount",e.target.value)}/></div>
          </div></div>
          <div><label style={lbl}>Notas internas</label><textarea style={{ ...inp,minHeight:70,resize:"vertical" }} value={form.notes||""} onChange={e=>set("notes",e.target.value)} placeholder="Observaciones..."/></div>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"none",color:"#9ca3af",cursor:"pointer",fontSize:14,fontWeight:600,fontFamily:"inherit" }}>Cancelar</button>
            <button onClick={save} disabled={saving} style={{ flex:2,padding:12,borderRadius:10,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:800,fontFamily:"inherit",opacity:saving?0.7:1 }}>{saving?"Guardando...":initial?"Guardar cambios":"Crear perfil"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── OFFER MODAL ──────────────────────────────────────────────────────────────
const OfferModal = ({ onClose, onAdd }) => {
  const [f,setF] = useState({ university:"",state:"",division:"NCAA D1",scholarshipPct:"",amount:"",season:"Fall 27",status:"Interesada",notes:"",logoUrl:"" });
  const [search,setSearch] = useState(""); const [saving,setSaving] = useState(false);
  const inp = { background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,padding:"9px 12px",color:"#f9fafb",fontSize:13,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"inherit" };
  const lbl = { fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:5,display:"block" };
  const filtered = search.length>1 ? NCAA_UNIVERSITIES.filter(u=>u.name.toLowerCase().includes(search.toLowerCase())||u.state.toLowerCase().includes(search.toLowerCase())).slice(0,7) : [];
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:20 }}>
      <div style={{ background:"#0d0f1a",border:"1px solid rgba(255,255,255,0.08)",borderRadius:18,padding:26,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <h3 style={{ margin:0,fontSize:17,fontWeight:800,color:"#f9fafb" }}>Nueva oferta universitaria</h3>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)",border:"none",color:"#9ca3af",cursor:"pointer",width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center" }}>{Ic.x}</button>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={lbl}>Buscar universidad</label>
          <input style={inp} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Escribe para buscar... ej: SMU, UCLA"/>
          {filtered.length>0&&<div style={{ background:"#13151f",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,marginTop:4,overflow:"hidden",maxHeight:220,overflowY:"auto" }}>
            {filtered.map(u=>(
              <div key={u.name} onClick={()=>{ setF(p=>({...p,university:u.name,state:u.state,division:u.division})); setSearch(""); }} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <UniLogo name={u.name} size={26}/><div><div style={{ fontSize:13,fontWeight:700,color:"#f9fafb" }}>{u.name}</div><div style={{ fontSize:11,color:"#6b7280" }}>{u.state} · {u.division}</div></div>
              </div>
            ))}
          </div>}
          {f.university&&!search&&<div style={{ marginTop:8,display:"flex",alignItems:"center",gap:8 }}><UniLogo name={f.university} logoUrl={f.logoUrl} size={26}/><span style={{ fontSize:13,fontWeight:700,color:"#22c55e" }}>✓ {f.university}</span><button onClick={()=>setF(p=>({...p,university:"",state:"",division:"NCAA D1"}))} style={{ background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:11 }}>cambiar</button></div>}
        </div>
        {!f.university&&<div style={{ marginBottom:12 }}><label style={lbl}>O escribe manualmente</label><input style={inp} value={f.university} onChange={e=>setF(p=>({...p,university:e.target.value}))} placeholder="Nombre universidad"/></div>}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <div><label style={lbl}>Estado USA</label><input style={inp} value={f.state} onChange={e=>setF(p=>({...p,state:e.target.value}))} placeholder="TX, FL..."/></div>
          <div><label style={lbl}>División</label><select style={{ ...inp,cursor:"pointer" }} value={f.division} onChange={e=>setF(p=>({...p,division:e.target.value}))}>{DIVISIONS.map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label style={lbl}>% Beca</label><input style={inp} type="number" min="0" max="100" value={f.scholarshipPct} onChange={e=>setF(p=>({...p,scholarshipPct:e.target.value}))}/></div>
          <div><label style={lbl}>Importe anual (€)</label><input style={inp} type="number" value={f.amount} onChange={e=>setF(p=>({...p,amount:e.target.value}))} placeholder="20000"/></div>
          <div><label style={lbl}>Temporada</label><select style={{ ...inp,cursor:"pointer" }} value={f.season} onChange={e=>setF(p=>({...p,season:e.target.value}))}>{SEASONS.map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label style={lbl}>Estado</label><select style={{ ...inp,cursor:"pointer" }} value={f.status} onChange={e=>setF(p=>({...p,status:e.target.value}))}>{OFFER_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={lbl}>Logo universidad (opcional)</label>
            <PhotoUpload currentUrl={f.logoUrl} onUpload={u=>setF(p=>({...p,logoUrl:u}))} size={48}/>
          </div>
          <div style={{ gridColumn:"1/-1" }}><label style={lbl}>Notas</label><input style={inp} value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Detalles..."/></div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:18 }}>
          <button onClick={onClose} style={{ flex:1,padding:"10px",borderRadius:9,border:"1px solid rgba(255,255,255,0.08)",background:"none",color:"#9ca3af",cursor:"pointer",fontWeight:600,fontFamily:"inherit" }}>Cancelar</button>
          <button onClick={async()=>{ if(f.university&&!saving){ setSaving(true); await onAdd({...f,scholarshipPct:parseInt(f.scholarshipPct)||0,amount:parseFloat(f.amount)||null}); setSaving(false); onClose(); }}} style={{ flex:2,padding:"10px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:13,fontFamily:"inherit",opacity:saving?0.7:1 }}>{saving?"Guardando...":"Añadir oferta"}</button>
        </div>
      </div>
    </div>
  );
};

// ─── AGENT MODAL ──────────────────────────────────────────────────────────────
const AgentModal = ({ initial, onClose, onSave }) => {
  const [form,setForm] = useState(initial||{ name:"",role:"Agente",email:"",phone:"",photoUrl:"" });
  const [saving,setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const inp = { background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,padding:"9px 12px",color:"#f9fafb",fontSize:13,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"inherit" };
  const lbl = { fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:5,display:"block" };
  const save = async () => { if(!form.name.trim()) return; setSaving(true); await onSave(form); setSaving(false); onClose(); };
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }}>
      <div style={{ background:"#0d0f1a",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,width:"100%",maxWidth:420,padding:26 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22 }}>
          <h2 style={{ margin:0,fontSize:18,fontWeight:800,color:"#f9fafb" }}>{initial?"Editar agente":"Nuevo agente"}</h2>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)",border:"none",color:"#9ca3af",cursor:"pointer",width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center" }}>{Ic.x}</button>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:18 }}>
          <PhotoUpload currentUrl={form.photoUrl} onUpload={u=>set("photoUrl",u)} size={76}/>
          <div style={{ fontSize:13,color:"#6b7280" }}>Foto del agente</div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          <div><label style={lbl}>Nombre completo</label><input style={inp} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Nombre..."/></div>
          <div><label style={lbl}>Cargo / Rol</label><input style={inp} value={form.role} onChange={e=>set("role",e.target.value)} placeholder="Agente, Director, Scout..."/></div>
          <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.email||""} onChange={e=>set("email",e.target.value)}/></div>
          <div><label style={lbl}>Teléfono</label><input style={inp} value={form.phone||""} onChange={e=>set("phone",e.target.value)}/></div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:22 }}>
          <button onClick={onClose} style={{ flex:1,padding:11,borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"none",color:"#9ca3af",cursor:"pointer",fontWeight:600,fontFamily:"inherit" }}>Cancelar</button>
          <button onClick={save} disabled={saving} style={{ flex:2,padding:11,borderRadius:10,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",cursor:"pointer",fontWeight:800,fontFamily:"inherit",opacity:saving?0.7:1 }}>{saving?"Guardando...":initial?"Guardar":"Crear agente"}</button>
        </div>
      </div>
    </div>
  );
};

// ─── PLAYER DETAIL ────────────────────────────────────────────────────────────
const PlayerDetail = ({ player, onBack, onRefresh, agentList }) => {
  const [tab,setTab] = useState("profile");
  const [editModal,setEditModal] = useState(false);
  const [offerModal,setOfferModal] = useState(false);
  const [publicModal,setPublicModal] = useState(false);
  const [saving,setSaving] = useState(false);
  const paid=(player.payment1?.paid?(player.payment1Amount||900):0)+(player.payment2?.paid?(player.payment2Amount||1800):0);
  const totalFee=player.totalFee||2700;
  const pending=totalFee-paid;
  const sd=player.sportData||{};
  const sportFields=SPORT_FIELDS[player.sport]||[];

  const handlePayment = async (num,agent) => {
    setSaving(true);
    const date=agent?new Date().toISOString().split("T")[0]:null;
    const dbUpdate=num===1?{payment1_paid:!!agent,payment1_paid_by:agent,payment1_date:date}:{payment2_paid:!!agent,payment2_paid_by:agent,payment2_date:date};
    await supabase.from("players").update(dbUpdate).eq("id",player.id);
    if(agent) await supabase.from("timeline").insert({player_id:player.id,date,event:`${num===1?`Pago inicial (${player.payment1Amount||900}€)`:`Segundo pago (${player.payment2Amount||1800}€)`} cobrado por ${agent}`,type:"payment"});
    await onRefresh(); setSaving(false);
  };
  const addOffer = async (o) => { await supabase.from("offers").insert({player_id:player.id,university:o.university,state:o.state,division:o.division,scholarship_pct:o.scholarshipPct,amount:o.amount,season:o.season,status:o.status,notes:o.notes,logo_url:o.logoUrl||null}); await onRefresh(); };
  const updateOfferStatus = async (id,status) => { await supabase.from("offers").update({status}).eq("id",id); await onRefresh(); };
  const removeOffer = async (id) => { await supabase.from("offers").delete().eq("id",id); await onRefresh(); };

  const tabs=[{id:"profile",l:"Perfil"},{id:"sports",l:"Deportivo"},{id:"academic",l:"Académico"},{id:"offers",l:`Ofertas (${player.offers?.length||0})`},{id:"payments",l:"Pagos"},{id:"timeline",l:"Historial"}];
  const tlC={contact:"#6366f1",contract:"#8b5cf6",milestone:"#22c55e",achievement:"#f59e0b",payment:"#10b981"};
  const tlE={contact:"👋",contract:"✍️",milestone:"🎯",achievement:"🏆",payment:"💰"};

  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18 }}>
        <button onClick={onBack} style={{ display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:13,padding:0,fontFamily:"inherit" }}>{Ic.back} Volver</button>
        <button onClick={()=>setPublicModal(true)} style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:10,border:"1px solid rgba(99,102,241,0.25)",background:"rgba(99,102,241,0.08)",color:"#818cf8",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit" }}>{Ic.share} Compartir perfil</button>
      </div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:"flex",gap:16,alignItems:"flex-start",flexWrap:"wrap" }}>
          <Avatar name={player.name} size={70} photoUrl={player.photoUrl}/>
          <div style={{ flex:1,minWidth:180 }}>
            <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:7 }}>
              <h1 style={{ margin:0,fontSize:22,fontWeight:900,color:"#f9fafb",letterSpacing:-0.5 }}>{player.name}</h1>
              <Badge status={player.status}/>
            </div>
            <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:10 }}>
              {[[player.sport,"#6366f1"],[player.position,"#8b5cf6"],[player.nationality,"#6b7280"],[player.agent,"#818cf8"]].filter(([v])=>v).map(([v,c])=><span key={v} style={{ fontSize:12,color:c,fontWeight:600 }}>{v}</span>)}
            </div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              <div style={{ background:paid>=totalFee?"rgba(34,197,94,0.1)":paid>0?"rgba(245,158,11,0.08)":"rgba(239,68,68,0.08)",borderRadius:9,padding:"5px 12px",border:`1px solid ${paid>=totalFee?"rgba(34,197,94,0.2)":paid>0?"rgba(245,158,11,0.2)":"rgba(239,68,68,0.2)"}` }}>
                <span style={{ fontSize:12,fontWeight:800,color:paid>=totalFee?"#22c55e":paid>0?"#f59e0b":"#ef4444" }}>{paid>=totalFee?`✓ ${totalFee}€ cobrados`:`${paid}€ / ${totalFee}€`}</span>
              </div>
              {player.videoUrl&&<a href={player.videoUrl} target="_blank" rel="noreferrer" style={{ display:"flex",alignItems:"center",gap:5,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:9,padding:"5px 12px",textDecoration:"none",color:"#f87171",fontSize:12,fontWeight:700 }}>{Ic.video} Vídeo</a>}
            </div>
          </div>
          <button onClick={()=>setEditModal(true)} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:9,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)",color:"#9ca3af",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit" }}>{Ic.edit} Editar</button>
        </div>
      </Card>
      <div style={{ display:"flex",gap:2,marginBottom:18,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:3,overflowX:"auto" }}>
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"7px 14px",borderRadius:9,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap",background:tab===t.id?"rgba(99,102,241,0.2)":"none",color:tab===t.id?"#818cf8":"#6b7280",fontFamily:"inherit" }}>{t.l}</button>)}
      </div>
      {tab==="profile"&&<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10 }}>
        {[["Email",player.email||"—"],["Teléfono",player.phone||"—"],["Instagram",player.instagram||"—"],["Nacionalidad",player.nationality||"—"],["Edad",player.age?player.age+" años":"—"],["Agente",player.agent||"—"]].map(([l,v])=>(
          <div key={l} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,padding:"12px 16px" }}>
            <div style={{ fontSize:9,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontWeight:700 }}>{l}</div>
            <div style={{ fontSize:13,color:"#e5e7eb",fontWeight:600 }}>{v}</div>
          </div>
        ))}
        {player.videoUrl&&<div style={{ gridColumn:"1/-1",background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.12)",borderRadius:12,padding:"12px 16px" }}><div style={{ fontSize:9,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:5,fontWeight:700 }}>Vídeo</div><a href={player.videoUrl} target="_blank" rel="noreferrer" style={{ color:"#f87171",textDecoration:"none",fontSize:12,fontWeight:700 }}>{player.videoUrl}</a></div>}
        {player.notes&&<div style={{ gridColumn:"1/-1",background:"rgba(99,102,241,0.05)",border:"1px solid rgba(99,102,241,0.12)",borderRadius:12,padding:"12px 16px" }}><div style={{ fontSize:9,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:5,fontWeight:700 }}>Notas internas</div><div style={{ fontSize:13,color:"#d1d5db",lineHeight:1.7 }}>{player.notes}</div></div>}
      </div>}
      {tab==="sports"&&<div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10,marginBottom:14 }}>
          {[["Deporte",player.sport],["Posición",player.position],["Altura",player.height?player.height+" cm":"—"],["Peso",player.weight?player.weight+" kg":"—"],["Universidad",player.university||"—"],["% Beca",player.scholarshipPct+"%"]].map(([l,v])=>(
            <div key={l} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,padding:"12px 16px" }}>
              <div style={{ fontSize:9,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontWeight:700 }}>{l}</div>
              <div style={{ fontSize:13,color:l==="% Beca"?"#6366f1":"#e5e7eb",fontWeight:700 }}>{v}</div>
            </div>
          ))}
        </div>
        {sportFields.length>0&&<div>
          <div style={{ fontSize:10,fontWeight:800,color:"#f59e0b",textTransform:"uppercase",letterSpacing:1,marginBottom:12 }}>Estadísticas de {player.sport}</div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10 }}>
            {sportFields.map(([l,k])=>{
              const val = (k==="foot"||k==="height"||k==="weight") ? player[k] : sd[k];
              if(!val) return null;
              return <div key={k} style={{ background:"rgba(245,158,11,0.05)",border:"1px solid rgba(245,158,11,0.12)",borderRadius:12,padding:"12px 16px" }}><div style={{ fontSize:9,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontWeight:700 }}>{l}</div><div style={{ fontSize:13,color:"#fbbf24",fontWeight:700 }}>{val}</div></div>;
            })}
          </div>
        </div>}
      </div>}
      {tab==="academic"&&<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10 }}>
        <div style={{ gridColumn:"1/-1",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
          {[["GPA",player.gpa||"—",player.gpa>=3.5?"#22c55e":player.gpa>=3?"#f59e0b":"#ef4444"],["SAT",player.satScore||"—","#6366f1"],["TOEFL",player.toeflScore||"—","#8b5cf6"],["Inglés",player.englishLevel||"—","#3b82f6"]].map(([l,v,c])=>(
            <div key={l} style={{ background:"rgba(255,255,255,0.03)",border:`1px solid ${c}18`,borderRadius:12,padding:"14px",textAlign:"center" }}>
              <div style={{ fontSize:9,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:7,fontWeight:700 }}>{l}</div>
              <div style={{ fontSize:22,fontWeight:900,color:c }}>{v}</div>
            </div>
          ))}
        </div>
        {[["High School",player.highSchool||"—"],["Graduación",player.graduationYear||"—"],["Carrera",player.major||"—"],["Nivel inglés",player.englishLevel||"—"]].map(([l,v])=>(
          <div key={l} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,padding:"12px 16px" }}>
            <div style={{ fontSize:9,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontWeight:700 }}>{l}</div>
            <div style={{ fontSize:13,color:"#e5e7eb",fontWeight:600 }}>{v}</div>
          </div>
        ))}
      </div>}
      {tab==="offers"&&<div>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
          <span style={{ fontSize:13,color:"#6b7280" }}>{player.offers?.length||0} universidades</span>
          <button onClick={()=>setOfferModal(true)} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit" }}>{Ic.plus} Nueva oferta</button>
        </div>
        {(!player.offers||player.offers.length===0)&&<div style={{ textAlign:"center",padding:"40px 20px",color:"#4b5563" }}><div style={{ fontSize:32,marginBottom:8 }}>🏫</div><div style={{ color:"#6b7280" }}>Sin ofertas registradas</div></div>}
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {(player.offers||[]).sort((a,b)=>(b.amount||0)-(a.amount||0)).map(offer=>(
            <div key={offer.id} style={{ background:offer.status==="Elegida ✓"?"rgba(16,185,129,0.07)":"rgba(255,255,255,0.03)",border:`1px solid ${offer.status==="Elegida ✓"?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.06)"}`,borderRadius:14,padding:"14px 16px" }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:12 }}>
                <UniLogo name={offer.university} logoUrl={offer.logoUrl} size={40}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:5 }}>
                    <span style={{ fontSize:15,fontWeight:800,color:"#f9fafb" }}>{offer.university}</span>
                    <OfferBadge status={offer.status}/><Pill label={offer.division} color="#6b7280"/>
                  </div>
                  <div style={{ display:"flex",gap:12,flexWrap:"wrap",fontSize:12,color:"#9ca3af",marginBottom:7 }}>
                    {offer.state&&<span>{offer.state}</span>}
                    {offer.amount&&<span style={{ color:"#22c55e",fontWeight:800 }}>{Number(offer.amount).toLocaleString()}€/año</span>}
                    {offer.season&&<span style={{ color:"#f59e0b",fontWeight:700 }}>{offer.season}</span>}
                    <span>Beca: <span style={{ color:"#6366f1",fontWeight:800 }}>{offer.scholarshipPct}%</span></span>
                  </div>
                  {offer.notes&&<div style={{ fontSize:11,color:"#6b7280",fontStyle:"italic" }}>{offer.notes}</div>}
                  <div style={{ marginTop:8 }}><Bar value={offer.scholarshipPct} max={100} color={OFFER_COLORS[offer.status]||"#6366f1"} h={3}/></div>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                  <select value={offer.status} onChange={e=>updateOfferStatus(offer.id,e.target.value)} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"4px 7px",color:"#f9fafb",fontSize:11,cursor:"pointer",outline:"none",fontFamily:"inherit" }}>
                    {OFFER_STATUSES.map(s=><option key={s}>{s}</option>)}
                  </select>
                  <button onClick={()=>removeOffer(offer.id)} style={{ background:"none",border:"1px solid rgba(239,68,68,0.18)",color:"#ef4444",cursor:"pointer",borderRadius:7,padding:"3px 7px",fontSize:10,fontFamily:"inherit" }}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>}
      {tab==="payments"&&<div style={{ display:"flex",flexDirection:"column",gap:12 }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
          <StatCard label="Total acordado" value={`${totalFee.toLocaleString()}€`} color="#6366f1" icon="💰"/>
          <StatCard label="Cobrado" value={`${paid}€`} color="#22c55e" icon="✓" sub={`${Math.round((paid/totalFee)*100)}%`}/>
          <StatCard label="Pendiente" value={`${pending}€`} color={pending>0?"#f59e0b":"#22c55e"} icon="⚡"/>
        </div>
        <Card>
          <div style={{ fontSize:10,fontWeight:800,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:12 }}>Pagos FUTBOLUAGENCY</div>
          {saving&&<div style={{ fontSize:11,color:"#6366f1",marginBottom:8 }}>Guardando...</div>}
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            <PaymentRow label="Pago inicial" amount={player.payment1Amount||900} payment={player.payment1||{paid:false}} onToggle={a=>handlePayment(1,a)} agents={agentList}/>
            <PaymentRow label="Segundo pago" amount={player.payment2Amount||1800} payment={player.payment2||{paid:false}} onToggle={a=>handlePayment(2,a)} agents={agentList}/>
          </div>
        </Card>
      </div>}
      {tab==="timeline"&&<div style={{ position:"relative",paddingLeft:26 }}>
        <div style={{ position:"absolute",left:9,top:6,bottom:0,width:2,background:"rgba(255,255,255,0.05)",borderRadius:2 }}/>
        {(player.timeline||[]).map((evt,i)=>{
          const c=tlC[evt.type]||"#6b7280";
          return <div key={i} style={{ position:"relative",marginBottom:16 }}>
            <div style={{ position:"absolute",left:-21,top:10,width:12,height:12,borderRadius:"50%",background:c,border:"3px solid #0d0f1a",boxShadow:`0 0 8px ${c}44` }}/>
            <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,padding:"10px 14px" }}>
              <div style={{ fontSize:10,color:"#6b7280",marginBottom:3 }}>{evt.date}</div>
              <div style={{ fontSize:13,color:"#e5e7eb",fontWeight:600 }}>{tlE[evt.type]} {evt.event}</div>
            </div>
          </div>;
        })}
        {(!player.timeline||player.timeline.length===0)&&<div style={{ textAlign:"center",padding:40,color:"#6b7280" }}>Sin eventos</div>}
      </div>}
      {editModal&&<PlayerModal initial={player} onClose={()=>setEditModal(false)} onSave={async(p)=>{ await supabase.from("players").update(playerToDb(p)).eq("id",p.id); await onRefresh(); }} agentList={agentList}/>}
      {offerModal&&<OfferModal onClose={()=>setOfferModal(false)} onAdd={addOffer}/>}
      {publicModal&&<PublicProfile player={player} onClose={()=>setPublicModal(false)}/>}
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [players,setPlayers] = useState([]);
  const [agents,setAgents] = useState([]);
  const [loading,setLoading] = useState(true);
  const [nav,setNav] = useState("dashboard");
  const [selected,setSelected] = useState(null);
  const [search,setSearch] = useState("");
  const [fSport,setFSport] = useState("Todos");
  const [fStatus,setFStatus] = useState("Todos");
  const [fAgent,setFAgent] = useState("Todos");
  const [addModal,setAddModal] = useState(false);
  const [agentModal,setAgentModal] = useState(null);
  const [menuOpen,setMenuOpen] = useState(false);

  const agentNames = agents.length>0 ? agents.map(a=>a.name) : ["Moha","Ignacio de Béjar"];

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [{data:rows},{data:allOffers},{data:allTimeline},{data:agentRows}] = await Promise.all([
        supabase.from("players").select("*").order("created_at",{ascending:false}),
        supabase.from("offers").select("*"),
        supabase.from("timeline").select("*").order("date",{ascending:true}),
        supabase.from("agents").select("*").order("created_at",{ascending:true}),
      ]);
      const mapped=(rows||[]).map(r=>dbToPlayer(r,(allOffers||[]).filter(o=>o.player_id===r.id),(allTimeline||[]).filter(t=>t.player_id===r.id)));
      setPlayers(mapped); setAgents(agentRows||[]);
      setSelected(prev=>prev?(mapped.find(p=>p.id===prev.id)||prev):null);
    } catch(e){ console.error(e); }
    setLoading(false);
  },[]); // eslint-disable-line

  useEffect(()=>{ loadAll(); },[]); // eslint-disable-line

  const addPlayer = async (p) => {
    const {data} = await supabase.from("players").insert(playerToDb(p)).select().single();
    if(data) await supabase.from("timeline").insert({player_id:data.id,date:new Date().toISOString().split("T")[0],event:"Perfil creado",type:"contact"});
    await loadAll();
  };
  const saveAgent = async (a) => {
    if(a.id) await supabase.from("agents").update({name:a.name,role:a.role,email:a.email,phone:a.phone,photo_url:a.photoUrl||null}).eq("id",a.id);
    else await supabase.from("agents").insert({name:a.name,role:a.role||"Agente",email:a.email||null,phone:a.phone||null,photo_url:a.photoUrl||null});
    await loadAll();
  };
  const deleteAgent = async (id) => { await supabase.from("agents").delete().eq("id",id); await loadAll(); };

  const filtered = useMemo(()=>players.filter(p=>{
    const s=search.toLowerCase();
    return (p.name.toLowerCase().includes(s)||p.university?.toLowerCase().includes(s)||p.nationality?.toLowerCase().includes(s))&&(fSport==="Todos"||p.sport===fSport)&&(fStatus==="Todos"||p.status===fStatus)&&(fAgent==="Todos"||p.agent===fAgent);
  }),[players,search,fSport,fStatus,fAgent]);

  const totalFees=players.reduce((s,p)=>s+(p.totalFee||2700),0);
  const totalColl=players.reduce((s,p)=>s+(p.payment1?.paid?(p.payment1Amount||900):0)+(p.payment2?.paid?(p.payment2Amount||1800):0),0);
  const totalPend=totalFees-totalColl;
  const agentStats=agentNames.map(name=>({
    name, agent:agents.find(a=>a.name===name),
    total:players.reduce((s,p)=>s+(p.payment1?.paid&&p.payment1?.paidBy===name?(p.payment1Amount||900):0)+(p.payment2?.paid&&p.payment2?.paidBy===name?(p.payment2Amount||1800):0),0),
    p1:players.filter(p=>p.payment1?.paid&&p.payment1?.paidBy===name).length,
    p2:players.filter(p=>p.payment2?.paid&&p.payment2?.paidBy===name).length,
    count:players.filter(p=>p.agent===name).length,
  }));
  const allOffers=players.flatMap(p=>(p.offers||[]).map(o=>({...o,playerName:p.name,playerId:p.id})));
  const go=(n)=>{ setNav(n); setSelected(null); setMenuOpen(false); };
  const navItems=[{id:"dashboard",l:"Dashboard",icon:Ic.dash},{id:"players",l:"Jugadores",icon:Ic.players},{id:"offers",l:"Universidades",icon:Ic.uni},{id:"payments",l:"Pagos",icon:Ic.fin},{id:"team",l:"Equipo",icon:Ic.team}];

  if(loading) return (
    <div style={{ fontFamily:"'Outfit',sans-serif",background:"#080a12",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap')`}</style>
      <img src="/logo.png" alt="FUA" onError={e=>e.target.style.display="none"} style={{ height:56,objectFit:"contain" }}/>
      <div style={{ fontSize:14,fontWeight:600,color:"#4b5563",letterSpacing:0.5 }}>Cargando FUTBOLUAGENCY CRM...</div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif",background:"#080a12",color:"#f9fafb",minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:4px}
        select option{background:#13151f;color:#f9fafb}
        .prow:hover{background:rgba(99,102,241,0.06)!important;border-color:rgba(99,102,241,0.2)!important}
        @media(max-width:768px){
          .sidebar{display:none!important}
          .sidebar.open{display:flex!important;position:fixed;inset:0;z-index:500;width:100%!important;background:rgba(8,10,18,0.97)!important}
          .main-content{padding:16px!important}
          .stats-grid{grid-template-columns:1fr 1fr!important}
          .two-col{grid-template-columns:1fr!important}
          .topbar{display:flex!important}
        }
        @media(min-width:769px){.topbar{display:none!important}}
      `}</style>

      {/* Mobile topbar */}
      <div className="topbar" style={{ display:"none",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",background:"#0a0c16",borderBottom:"1px solid rgba(255,255,255,0.05)",position:"sticky",top:0,zIndex:100 }}>
        <img src="/logo.png" alt="FUA" onError={e=>e.target.style.display="none"} style={{ height:32,objectFit:"contain" }}/>
        <button onClick={()=>setMenuOpen(!menuOpen)} style={{ background:"rgba(255,255,255,0.06)",border:"none",color:"#9ca3af",cursor:"pointer",width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center" }}>{Ic.menu}</button>
      </div>

      <div style={{ display:"flex",minHeight:"calc(100vh - 0px)" }}>
        {/* Sidebar */}
        <div className={`sidebar${menuOpen?" open":""}`} style={{ width:220,background:"#0a0c16",borderRight:"1px solid rgba(255,255,255,0.04)",padding:"20px 12px",display:"flex",flexDirection:"column",gap:2,flexShrink:0 }}>
          <div style={{ padding:"0 8px 20px",borderBottom:"1px solid rgba(255,255,255,0.04)",marginBottom:8 }}>
            <img src="/logo.png" alt="FUTBOLUAGENCY" onError={e=>{ e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} style={{ height:42,objectFit:"contain",maxWidth:"100%" }}/>
            <div style={{ display:"none",alignItems:"center",gap:8 }}>
              <div style={{ width:32,height:32,background:"linear-gradient(135deg,#c8102e,#002868)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#fff" }}>FUA</div>
              <span style={{ fontSize:12,fontWeight:800,color:"#f9fafb",letterSpacing:0.5 }}>FUTBOLUAGENCY</span>
            </div>
          </div>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>go(item.id)} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:nav===item.id?"rgba(99,102,241,0.15)":"none",color:nav===item.id?"#818cf8":"#4b5563",transition:"all .15s",textAlign:"left",fontFamily:"inherit" }}>
              <span style={{ opacity:nav===item.id?1:0.5,fontSize:15 }}>{item.icon}</span>{item.l}
            </button>
          ))}
          <button onClick={loadAll} style={{ display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,fontWeight:500,background:"none",color:"#374151",fontFamily:"inherit",marginTop:4 }}><span style={{ fontSize:13 }}>{Ic.refresh}</span> Actualizar</button>
          <div style={{ marginTop:"auto",padding:"14px 8px 0",borderTop:"1px solid rgba(255,255,255,0.04)" }}>
            {agentStats.slice(0,3).map(s=>(
              <div key={s.name} onClick={()=>go("team")} style={{ display:"flex",gap:8,alignItems:"center",padding:"6px 4px",cursor:"pointer",borderRadius:8 }}>
                <Avatar name={s.name} size={26} photoUrl={s.agent?.photo_url}/>
                <div><div style={{ fontSize:11,fontWeight:700,color:"#e5e7eb" }}>{s.name.split(" ")[0]}</div><div style={{ fontSize:10,color:"#4b5563" }}>{s.total}€</div></div>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="main-content" style={{ flex:1,overflowY:"auto",padding:"26px 28px",maxWidth:"100%" }}>

          {/* DASHBOARD */}
          {nav==="dashboard"&&(
            <div>
              <div style={{ marginBottom:22 }}><h1 style={{ fontSize:24,fontWeight:800,color:"#f9fafb",letterSpacing:-0.5 }}>Dashboard</h1><p style={{ color:"#4b5563",fontSize:13,marginTop:4 }}>Resumen general · FUTBOLUAGENCY</p></div>
              <div className="stats-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
                <StatCard label="Atletas" value={players.length} sub={`${players.filter(p=>p.status==="Becado").length} becados`} color="#6366f1" icon="👥"/>
                <StatCard label="Revenue" value={totalFees>0?`${(totalFees/1000).toFixed(1)}k€`:"0€"} color="#8b5cf6" icon="💼"/>
                <StatCard label="Cobrado" value={`${totalColl.toLocaleString()}€`} color="#22c55e" icon="✅" sub={totalFees>0?`${Math.round((totalColl/totalFees)*100)}%`:"—"}/>
                <StatCard label="Pendiente" value={`${totalPend.toLocaleString()}€`} color="#f59e0b" icon="⏳" sub={`${players.filter(p=>!p.payment2?.paid).length} abiertos`}/>
              </div>
              <div className="two-col" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
                <Card>
                  <div style={{ fontSize:10,fontWeight:700,color:"#4b5563",textTransform:"uppercase",letterSpacing:1.2,marginBottom:14 }}>Cobros por agente</div>
                  {agentStats.length===0?<div style={{ color:"#374151",fontSize:13 }}>Sin agentes</div>:
                  <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                    {agentStats.map(s=>(
                      <div key={s.name}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:8 }}><Avatar name={s.name} size={24} photoUrl={s.agent?.photo_url}/><span style={{ fontSize:13,fontWeight:700,color:"#e5e7eb" }}>{s.name}</span></div>
                          <span style={{ fontSize:15,fontWeight:800,color:"#818cf8" }}>{s.total}€</span>
                        </div>
                        <Bar value={s.total} max={totalColl||1} color="#6366f1"/>
                        <div style={{ fontSize:10,color:"#4b5563",marginTop:4 }}>{s.p1} iniciales · {s.p2} segundos · {s.count} atletas</div>
                      </div>
                    ))}
                  </div>}
                </Card>
                <Card>
                  <div style={{ fontSize:10,fontWeight:700,color:"#4b5563",textTransform:"uppercase",letterSpacing:1.2,marginBottom:14 }}>Estado atletas</div>
                  {players.length===0?<div style={{ color:"#374151",fontSize:13 }}>Sin atletas</div>:
                  <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                    {Object.entries(STATUS_COLORS).map(([status,color])=>{
                      const count=players.filter(p=>p.status===status).length;
                      return <div key={status}><div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}><span style={{ fontSize:12,color:"#9ca3af" }}>{status}</span><span style={{ fontSize:12,fontWeight:700,color }}>{count}</span></div><Bar value={count} max={players.length} color={color}/></div>;
                    })}
                  </div>}
                </Card>
                <Card style={{ gridColumn:"1/-1" }}>
                  <div style={{ fontSize:10,fontWeight:700,color:"#4b5563",textTransform:"uppercase",letterSpacing:1.2,marginBottom:12 }}>Pagos pendientes</div>
                  {players.filter(p=>!p.payment1?.paid||!p.payment2?.paid).length===0
                    ?<div style={{ textAlign:"center",padding:16,color:"#22c55e",fontWeight:700,fontSize:13 }}>✓ Todos al día</div>
                    :<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8 }}>
                      {players.filter(p=>!p.payment1?.paid||!p.payment2?.paid).map(p=>(
                        <div key={p.id} onClick={()=>{ setNav("players"); setSelected(p); }} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"rgba(245,158,11,0.04)",border:"1px solid rgba(245,158,11,0.12)",borderRadius:12,cursor:"pointer" }}>
                          <Avatar name={p.name} size={32} photoUrl={p.photoUrl}/>
                          <div style={{ flex:1 }}><div style={{ fontSize:12,fontWeight:700,color:"#e5e7eb" }}>{p.name}</div><div style={{ fontSize:10,color:"#f59e0b" }}>{!p.payment1?.paid?`Pago inicial (${p.payment1Amount||900}€)`:`Segundo pago (${p.payment2Amount||1800}€)`}</div></div>
                          <span style={{ fontSize:13,fontWeight:800,color:"#f59e0b" }}>{!p.payment1?.paid?`${p.payment1Amount||900}€`:`${p.payment2Amount||1800}€`}</span>
                        </div>
                      ))}
                    </div>}
                </Card>
              </div>
            </div>
          )}

          {/* PLAYERS */}
          {nav==="players"&&!selected&&(
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10 }}>
                <div><h1 style={{ fontSize:24,fontWeight:800,color:"#f9fafb",letterSpacing:-0.5 }}>Jugadores</h1><p style={{ color:"#4b5563",fontSize:13,marginTop:4 }}>{players.length} atletas</p></div>
                <button onClick={()=>setAddModal(true)} style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 18px",borderRadius:11,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit" }}>{Ic.plus} Nuevo atleta</button>
              </div>
              <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" }}>
                <div style={{ position:"relative",flex:"1 1 180px" }}>
                  <div style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#4b5563",fontSize:14 }}>{Ic.search}</div>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." style={{ paddingLeft:32,padding:"9px 12px 9px 32px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,color:"#f9fafb",fontSize:13,outline:"none",width:"100%",fontFamily:"inherit" }}/>
                </div>
                {[[SPORTS,fSport,setFSport],[STATUSES,fStatus,setFStatus],[["Todos",...agentNames],fAgent,setFAgent]].map(([opts,val,setter],i)=>(
                  <select key={i} value={val} onChange={e=>setter(e.target.value)} style={{ padding:"9px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,color:val==="Todos"?"#4b5563":"#f9fafb",fontSize:13,outline:"none",cursor:"pointer",fontFamily:"inherit" }}>
                    {opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                ))}
              </div>
              {players.length===0&&<div style={{ textAlign:"center",padding:60,color:"#4b5563" }}><div style={{ fontSize:36,marginBottom:10 }}>👥</div><div style={{ fontWeight:700 }}>Sin atletas todavía</div></div>}
              <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                {filtered.map(p=>{
                  const paid=(p.payment1?.paid?(p.payment1Amount||900):0)+(p.payment2?.paid?(p.payment2Amount||1800):0);
                  const total=p.totalFee||2700;
                  const pct=(paid/total)*100;
                  return (
                    <div key={p.id} className="prow" onClick={()=>setSelected(p)} style={{ display:"flex",alignItems:"center",gap:12,background:"#13151f",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,padding:"12px 16px",cursor:"pointer",transition:"all .15s" }}>
                      <Avatar name={p.name} size={42} photoUrl={p.photoUrl}/>
                      <div style={{ flex:2,minWidth:0 }}><div style={{ fontSize:14,fontWeight:700,color:"#f9fafb",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{p.name}</div><div style={{ fontSize:11,color:"#4b5563",marginTop:2 }}>{p.sport} · {p.nationality}</div></div>
                      <Badge status={p.status}/>
                      <div style={{ textAlign:"center",minWidth:50,display:"flex",flexDirection:"column",alignItems:"center" }}><div style={{ fontSize:9,color:"#4b5563",marginBottom:2 }}>BECA</div><div style={{ fontSize:14,fontWeight:800,color:"#6366f1" }}>{p.scholarshipPct}%</div></div>
                      <div style={{ textAlign:"center",minWidth:46,display:"flex",flexDirection:"column",alignItems:"center" }}><div style={{ fontSize:9,color:"#4b5563",marginBottom:2 }}>GPA</div><div style={{ fontSize:14,fontWeight:800,color:p.gpa>=3.5?"#22c55e":p.gpa>=3?"#f59e0b":"#ef4444" }}>{p.gpa||"—"}</div></div>
                      <div style={{ flex:1,minWidth:90 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:"#4b5563",marginBottom:3 }}><span>Cobros</span><span style={{ color:pct>=100?"#22c55e":pct>0?"#f59e0b":"#ef4444",fontWeight:700 }}>{paid}€</span></div>
                        <Bar value={paid} max={total} color={pct>=100?"#22c55e":pct>0?"#f59e0b":"#6366f1"}/>
                      </div>
                      <div style={{ fontSize:11,color:"#818cf8",fontWeight:600,minWidth:50,textAlign:"right" }}>{p.agent?.split(" ")[0]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {nav==="players"&&selected&&<PlayerDetail player={selected} onBack={()=>setSelected(null)} onRefresh={loadAll} agentList={agentNames}/>}

          {/* OFFERS */}
          {nav==="offers"&&(
            <div>
              <div style={{ marginBottom:22 }}><h1 style={{ fontSize:24,fontWeight:800,color:"#f9fafb",letterSpacing:-0.5 }}>Universidades</h1><p style={{ color:"#4b5563",fontSize:13,marginTop:4 }}>{allOffers.length} ofertas totales</p></div>
              <div className="stats-grid" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20 }}>
                <StatCard label="Total" value={allOffers.length} color="#6366f1" icon="🏛️"/>
                <StatCard label="Confirmadas" value={allOffers.filter(o=>o.status==="Elegida ✓").length} color="#22c55e" icon="✅"/>
                <StatCard label="Negociando" value={allOffers.filter(o=>["Oferta formal","Pre-aceptada","Interesada"].includes(o.status)).length} color="#f59e0b" icon="🤝"/>
              </div>
              {players.filter(p=>p.offers?.length>0).length===0&&<div style={{ textAlign:"center",padding:60,color:"#4b5563" }}><div style={{ fontSize:36,marginBottom:10 }}>🏛️</div><div style={{ fontWeight:700 }}>Sin ofertas</div></div>}
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                {players.filter(p=>p.offers?.length>0).map(p=>(
                  <Card key={p.id}>
                    <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:14 }}>
                      <Avatar name={p.name} size={40} photoUrl={p.photoUrl}/>
                      <div><div style={{ fontSize:14,fontWeight:700,color:"#f9fafb" }}>{p.name}</div><div style={{ fontSize:11,color:"#4b5563" }}>{p.sport} · {p.offers.length} {p.offers.length===1?"oferta":"ofertas"}</div></div>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:8 }}>
                      {p.offers.sort((a,b)=>(b.amount||0)-(a.amount||0)).map(o=>(
                        <div key={o.id} onClick={()=>{ setNav("players"); setSelected(p); }} style={{ background:o.status==="Elegida ✓"?"rgba(16,185,129,0.07)":"rgba(255,255,255,0.03)",border:`1px solid ${OFFER_COLORS[o.status]||"#374151"}25`,borderRadius:12,padding:"12px",cursor:"pointer" }}>
                          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:7 }}><UniLogo name={o.university} logoUrl={o.logoUrl} size={28}/><div style={{ fontSize:12,fontWeight:700,color:"#f9fafb",lineHeight:1.2 }}>{o.university}</div></div>
                          <div style={{ fontSize:10,color:"#6b7280",marginBottom:6 }}>{o.state} · {o.division}</div>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:6 }}>
                            <div>{o.amount&&<div style={{ fontSize:14,fontWeight:900,color:"#22c55e" }}>{Number(o.amount).toLocaleString()}€</div>}{o.season&&<div style={{ fontSize:10,color:"#f59e0b" }}>{o.season}</div>}</div>
                            <OfferBadge status={o.status}/>
                          </div>
                          <Bar value={o.scholarshipPct} max={100} color={OFFER_COLORS[o.status]||"#6366f1"} h={3}/>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* PAYMENTS */}
          {nav==="payments"&&(
            <div>
              <div style={{ marginBottom:22 }}><h1 style={{ fontSize:24,fontWeight:800,color:"#f9fafb",letterSpacing:-0.5 }}>Pagos & Cobros</h1><p style={{ color:"#4b5563",fontSize:13,marginTop:4 }}>Honorarios personalizados por atleta</p></div>
              <div className="stats-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
                <StatCard label="Revenue" value={`${totalFees.toLocaleString()}€`} color="#6366f1" icon="💼"/>
                <StatCard label="Cobrado" value={`${totalColl.toLocaleString()}€`} color="#22c55e" icon="✅" sub={totalFees>0?`${Math.round((totalColl/totalFees)*100)}%`:"—"}/>
                <StatCard label="Pendiente" value={`${totalPend.toLocaleString()}€`} color="#f59e0b" icon="⏳"/>
                <StatCard label="Completos" value={players.filter(p=>p.payment1?.paid&&p.payment2?.paid).length} color="#10b981" icon="🏆" sub={`de ${players.length}`}/>
              </div>
              <div className="two-col" style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14,marginBottom:16 }}>
                {agentStats.map(s=>(
                  <Card key={s.name} style={{ border:"1px solid rgba(99,102,241,0.15)" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:14 }}>
                      <Avatar name={s.name} size={42} photoUrl={s.agent?.photo_url}/>
                      <div style={{ flex:1 }}><div style={{ fontSize:15,fontWeight:700,color:"#f9fafb" }}>{s.name}</div><div style={{ fontSize:11,color:"#6366f1" }}>{s.agent?.role||"Agente"}</div></div>
                      <div style={{ fontSize:20,fontWeight:900,color:"#818cf8" }}>{s.total}€</div>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                      <div style={{ background:"rgba(255,255,255,0.03)",borderRadius:9,padding:"9px" }}><div style={{ fontSize:9,color:"#4b5563",marginBottom:4 }}>PAGOS INICIALES</div><div style={{ fontSize:16,fontWeight:800,color:"#818cf8" }}>{s.p1}</div></div>
                      <div style={{ background:"rgba(255,255,255,0.03)",borderRadius:9,padding:"9px" }}><div style={{ fontSize:9,color:"#4b5563",marginBottom:4 }}>SEGUNDOS PAGOS</div><div style={{ fontSize:16,fontWeight:800,color:"#818cf8" }}>{s.p2}</div></div>
                    </div>
                  </Card>
                ))}
              </div>
              <Card>
                <div style={{ fontSize:10,fontWeight:700,color:"#4b5563",textTransform:"uppercase",letterSpacing:1.2,marginBottom:12 }}>Estado por atleta</div>
                {players.length===0&&<div style={{ color:"#374151",fontSize:13,textAlign:"center",padding:20 }}>Sin atletas</div>}
                <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
                  {players.map(p=>{
                    const paid=(p.payment1?.paid?(p.payment1Amount||900):0)+(p.payment2?.paid?(p.payment2Amount||1800):0);
                    const total=p.totalFee||2700;
                    return (
                      <div key={p.id} onClick={()=>{ setNav("players"); setSelected(p); }} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"rgba(255,255,255,0.02)",borderRadius:11,border:"1px solid rgba(255,255,255,0.04)",cursor:"pointer" }}>
                        <Avatar name={p.name} size={34} photoUrl={p.photoUrl}/>
                        <div style={{ flex:2,minWidth:0 }}>
                          <div style={{ fontSize:13,fontWeight:700,color:"#f9fafb" }}>{p.name}</div>
                          <div style={{ display:"flex",gap:6,marginTop:3,flexWrap:"wrap" }}>
                            <span style={{ fontSize:9,padding:"2px 7px",borderRadius:6,background:p.payment1?.paid?"rgba(34,197,94,0.12)":"rgba(245,158,11,0.1)",color:p.payment1?.paid?"#22c55e":"#f59e0b",fontWeight:700 }}>P1: {p.payment1?.paid?`✓ ${p.payment1.paidBy}`:"Pendiente"}</span>
                            <span style={{ fontSize:9,padding:"2px 7px",borderRadius:6,background:p.payment2?.paid?"rgba(34,197,94,0.12)":"rgba(245,158,11,0.1)",color:p.payment2?.paid?"#22c55e":"#f59e0b",fontWeight:700 }}>P2: {p.payment2?.paid?`✓ ${p.payment2.paidBy}`:"Pendiente"}</span>
                          </div>
                        </div>
                        <div style={{ flex:1,minWidth:100 }}><Bar value={paid} max={total} color={paid>=total?"#22c55e":paid>0?"#f59e0b":"#374151"}/></div>
                        <div style={{ fontSize:13,fontWeight:800,color:paid>=total?"#22c55e":"#f9fafb",minWidth:80,textAlign:"right" }}>{paid}€ / {total}€</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* TEAM */}
          {nav==="team"&&(
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22,flexWrap:"wrap",gap:10 }}>
                <div><h1 style={{ fontSize:24,fontWeight:800,color:"#f9fafb",letterSpacing:-0.5 }}>Equipo</h1><p style={{ color:"#4b5563",fontSize:13,marginTop:4 }}>FUTBOLUAGENCY · {agents.length} miembros</p></div>
                <button onClick={()=>setAgentModal("new")} style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 18px",borderRadius:11,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit" }}>{Ic.plus} Nuevo agente</button>
              </div>
              {agents.length===0&&<div style={{ textAlign:"center",padding:60,color:"#4b5563" }}><div style={{ fontSize:36,marginBottom:10 }}>👥</div><div style={{ fontWeight:700,marginBottom:6 }}>Sin agentes</div><div style={{ fontSize:13 }}>Añade a Moha e Ignacio para empezar</div></div>}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14 }}>
                {agents.map(agent=>{
                  const s=agentStats.find(x=>x.name===agent.name)||{total:0,p1:0,p2:0,count:0};
                  return (
                    <Card key={agent.id} style={{ border:"1px solid rgba(99,102,241,0.12)" }}>
                      <div style={{ display:"flex",alignItems:"flex-start",gap:14,marginBottom:14 }}>
                        <Avatar name={agent.name} size={54} photoUrl={agent.photo_url}/>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:15,fontWeight:800,color:"#f9fafb" }}>{agent.name}</div>
                          <div style={{ fontSize:12,color:"#6366f1",fontWeight:600,marginTop:3 }}>{agent.role}</div>
                          {agent.email&&<div style={{ fontSize:11,color:"#4b5563",marginTop:4 }}>{agent.email}</div>}
                          {agent.phone&&<div style={{ fontSize:11,color:"#4b5563" }}>{agent.phone}</div>}
                        </div>
                        <button onClick={()=>setAgentModal({...agent,photoUrl:agent.photo_url})} style={{ background:"rgba(255,255,255,0.05)",border:"none",color:"#9ca3af",cursor:"pointer",width:28,height:28,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13 }}>✏️</button>
                      </div>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12 }}>
                        {[["Atletas",s.count,"#6366f1"],["Cobrado",s.total+"€","#22c55e"],["Deals",s.p1+s.p2,"#f59e0b"]].map(([l,v,c])=>(
                          <div key={l} style={{ background:"rgba(255,255,255,0.03)",borderRadius:9,padding:"9px",textAlign:"center" }}>
                            <div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4 }}>{l}</div>
                            <div style={{ fontSize:15,fontWeight:800,color:c }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <button onClick={()=>{ if(window.confirm(`¿Eliminar a ${agent.name}?`)) deleteAgent(agent.id); }} style={{ width:"100%",padding:"7px",borderRadius:9,border:"1px solid rgba(239,68,68,0.15)",background:"none",color:"#ef4444",cursor:"pointer",fontSize:11,fontFamily:"inherit" }}>Eliminar agente</button>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {addModal&&<PlayerModal onClose={()=>setAddModal(false)} onSave={async(p)=>{ await addPlayer(p); setAddModal(false); }} agentList={agentNames}/>}
      {agentModal&&<AgentModal initial={agentModal==="new"?null:agentModal} onClose={()=>setAgentModal(null)} onSave={saveAgent}/>}
    </div>
  );
}
