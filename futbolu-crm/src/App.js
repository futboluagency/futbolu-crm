import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SPORTS = ["Todos","Fútbol","Tenis","Natación","Béisbol","Baloncesto","Atletismo","Golf","Voleibol"];
const STATUSES = ["Todos","Becado","En proceso","Prospecto","Inactivo"];
const POSITIONS = ["Portero","Defensa Central","Lateral Derecho","Lateral Izquierdo","Pivote","Centrocampista","Mediapunta","Extremo Derecho","Extremo Izquierdo","Delantero Centro","N/A"];
const FEET = ["Derecho","Zurdo","Ambidiestro"];
const DIVISIONS = ["NCAA D1","NCAA D2","NCAA D3","NAIA","NJCAA"];
const OFFER_STATUSES = ["Interesada","Oferta formal","Pre-aceptada","Rechazada","Elegida ✓"];
const SEASONS = ["Fall 25","Spring 26","Fall 26","Spring 27","Fall 27","Spring 28","Fall 28","Spring 29","Fall 29"];
const STATUS_COLORS = {"Becado":"#22c55e","En proceso":"#f59e0b","Prospecto":"#3b82f6","Inactivo":"#6b7280"};
const OFFER_COLORS = {"Interesada":"#6366f1","Oferta formal":"#f59e0b","Pre-aceptada":"#22c55e","Rechazada":"#ef4444","Elegida ✓":"#10b981"};

// Large NCAA university database
const NCAA_UNIVERSITIES = [
  // NCAA D1 Football
  {name:"Alabama",state:"Alabama",division:"NCAA D1"},{name:"Auburn",state:"Alabama",division:"NCAA D1"},
  {name:"Arizona",state:"Arizona",division:"NCAA D1"},{name:"Arizona State",state:"Arizona",division:"NCAA D1"},
  {name:"Arkansas",state:"Arkansas",division:"NCAA D1"},{name:"UCLA",state:"California",division:"NCAA D1"},
  {name:"USC",state:"California",division:"NCAA D1"},{name:"Cal Berkeley",state:"California",division:"NCAA D1"},
  {name:"Stanford",state:"California",division:"NCAA D1"},{name:"San Diego State",state:"California",division:"NCAA D1"},
  {name:"Colorado",state:"Colorado",division:"NCAA D1"},{name:"Colorado State",state:"Colorado",division:"NCAA D1"},
  {name:"Connecticut",state:"Connecticut",division:"NCAA D1"},{name:"Florida",state:"Florida",division:"NCAA D1"},
  {name:"Florida State",state:"Florida",division:"NCAA D1"},{name:"Miami",state:"Florida",division:"NCAA D1"},
  {name:"University of Miami",state:"Florida",division:"NCAA D1"},{name:"FIU",state:"Florida",division:"NCAA D1"},
  {name:"FAU",state:"Florida",division:"NCAA D1"},{name:"USF",state:"Florida",division:"NCAA D1"},
  {name:"UCF",state:"Florida",division:"NCAA D1"},{name:"Georgia",state:"Georgia",division:"NCAA D1"},
  {name:"Georgia Tech",state:"Georgia",division:"NCAA D1"},{name:"Illinois",state:"Illinois",division:"NCAA D1"},
  {name:"Northwestern",state:"Illinois",division:"NCAA D1"},{name:"Notre Dame",state:"Indiana",division:"NCAA D1"},
  {name:"Indiana",state:"Indiana",division:"NCAA D1"},{name:"Iowa",state:"Iowa",division:"NCAA D1"},
  {name:"Iowa State",state:"Iowa",division:"NCAA D1"},{name:"Kansas",state:"Kansas",division:"NCAA D1"},
  {name:"Kansas State",state:"Kansas",division:"NCAA D1"},{name:"Kentucky",state:"Kentucky",division:"NCAA D1"},
  {name:"LSU",state:"Louisiana",division:"NCAA D1"},{name:"Maryland",state:"Maryland",division:"NCAA D1"},
  {name:"Michigan",state:"Michigan",division:"NCAA D1"},{name:"Michigan State",state:"Michigan",division:"NCAA D1"},
  {name:"Minnesota",state:"Minnesota",division:"NCAA D1"},{name:"Mississippi State",state:"Mississippi",division:"NCAA D1"},
  {name:"Ole Miss",state:"Mississippi",division:"NCAA D1"},{name:"Missouri",state:"Missouri",division:"NCAA D1"},
  {name:"Nebraska",state:"Nebraska",division:"NCAA D1"},{name:"UNLV",state:"Nevada",division:"NCAA D1"},
  {name:"Rutgers",state:"New Jersey",division:"NCAA D1"},{name:"New Mexico",state:"New Mexico",division:"NCAA D1"},
  {name:"Syracuse",state:"New York",division:"NCAA D1"},{name:"North Carolina",state:"North Carolina",division:"NCAA D1"},
  {name:"NC State",state:"North Carolina",division:"NCAA D1"},{name:"Duke",state:"North Carolina",division:"NCAA D1"},
  {name:"Wake Forest",state:"North Carolina",division:"NCAA D1"},{name:"Ohio State",state:"Ohio",division:"NCAA D1"},
  {name:"Oklahoma",state:"Oklahoma",division:"NCAA D1"},{name:"Oklahoma State",state:"Oklahoma",division:"NCAA D1"},
  {name:"Oregon",state:"Oregon",division:"NCAA D1"},{name:"Oregon State",state:"Oregon",division:"NCAA D1"},
  {name:"Penn State",state:"Pennsylvania",division:"NCAA D1"},{name:"Pittsburgh",state:"Pennsylvania",division:"NCAA D1"},
  {name:"Temple",state:"Pennsylvania",division:"NCAA D1"},{name:"South Carolina",state:"South Carolina",division:"NCAA D1"},
  {name:"Clemson",state:"South Carolina",division:"NCAA D1"},{name:"Tennessee",state:"Tennessee",division:"NCAA D1"},
  {name:"Vanderbilt",state:"Tennessee",division:"NCAA D1"},{name:"Texas",state:"Texas",division:"NCAA D1"},
  {name:"Texas A&M",state:"Texas",division:"NCAA D1"},{name:"Texas Tech",state:"Texas",division:"NCAA D1"},
  {name:"SMU",state:"Texas",division:"NCAA D1"},{name:"TCU",state:"Texas",division:"NCAA D1"},
  {name:"Baylor",state:"Texas",division:"NCAA D1"},{name:"Rice",state:"Texas",division:"NCAA D1"},
  {name:"Houston",state:"Texas",division:"NCAA D1"},{name:"UTSA",state:"Texas",division:"NCAA D1"},
  {name:"Utah",state:"Utah",division:"NCAA D1"},{name:"BYU",state:"Utah",division:"NCAA D1"},
  {name:"Virginia",state:"Virginia",division:"NCAA D1"},{name:"Virginia Tech",state:"Virginia",division:"NCAA D1"},
  {name:"Washington",state:"Washington",division:"NCAA D1"},{name:"Washington State",state:"Washington",division:"NCAA D1"},
  {name:"West Virginia",state:"West Virginia",division:"NCAA D1"},{name:"Wisconsin",state:"Wisconsin",division:"NCAA D1"},
  {name:"Harvard",state:"Massachusetts",division:"NCAA D1"},{name:"Yale",state:"Connecticut",division:"NCAA D1"},
  {name:"Georgetown",state:"DC",division:"NCAA D1"},{name:"Boston College",state:"Massachusetts",division:"NCAA D1"},
  {name:"Providence",state:"Rhode Island",division:"NCAA D1"},{name:"Xavier",state:"Ohio",division:"NCAA D1"},
  {name:"Gonzaga",state:"Washington",division:"NCAA D1"},{name:"Saint Mary's",state:"California",division:"NCAA D1"},
  // NCAA D2
  {name:"Rollins College",state:"Florida",division:"NCAA D2"},{name:"Barry University",state:"Florida",division:"NCAA D2"},
  {name:"Lynn University",state:"Florida",division:"NCAA D2"},{name:"Eckerd College",state:"Florida",division:"NCAA D2"},
  {name:"Colorado School of Mines",state:"Colorado",division:"NCAA D2"},{name:"Cal State LA",state:"California",division:"NCAA D2"},
  {name:"Cal State Dominguez Hills",state:"California",division:"NCAA D2"},{name:"Grand Canyon",state:"Arizona",division:"NCAA D2"},
  {name:"Drury University",state:"Missouri",division:"NCAA D2"},{name:"Quincy University",state:"Illinois",division:"NCAA D2"},
  {name:"University of Tampa",state:"Florida",division:"NCAA D2"},{name:"Nova Southeastern",state:"Florida",division:"NCAA D2"},
  {name:"Charleston",state:"South Carolina",division:"NCAA D2"},{name:"Wingate University",state:"North Carolina",division:"NCAA D2"},
  // NCAA D3
  {name:"Williams College",state:"Massachusetts",division:"NCAA D3"},{name:"Amherst College",state:"Massachusetts",division:"NCAA D3"},
  {name:"Middlebury College",state:"Vermont",division:"NCAA D3"},{name:"Trinity College",state:"Connecticut",division:"NCAA D3"},
  {name:"Tufts University",state:"Massachusetts",division:"NCAA D3"},{name:"Emory University",state:"Georgia",division:"NCAA D3"},
  {name:"Pomona-Pitzer",state:"California",division:"NCAA D3"},{name:"Claremont McKenna",state:"California",division:"NCAA D3"},
  {name:"NYU",state:"New York",division:"NCAA D3"},{name:"Rochester",state:"New York",division:"NCAA D3"},
  // NAIA
  {name:"Lindsey Wilson College",state:"Kentucky",division:"NAIA"},{name:"Indiana Tech",state:"Indiana",division:"NAIA"},
  {name:"William Carey University",state:"Mississippi",division:"NAIA"},{name:"Keiser University",state:"Florida",division:"NAIA"},
  {name:"St. Thomas University",state:"Florida",division:"NAIA"},{name:"Benedictine College",state:"Kansas",division:"NAIA"},
  {name:"Morningside University",state:"Iowa",division:"NAIA"},{name:"Ottawa University",state:"Kansas",division:"NAIA"},
  {name:"Graceland University",state:"Iowa",division:"NAIA"},{name:"Columbia College",state:"Missouri",division:"NAIA"},
  // NJCAA
  {name:"Tyler Junior College",state:"Texas",division:"NJCAA"},{name:"Eastern Florida State",state:"Florida",division:"NJCAA"},
  {name:"Cowley College",state:"Kansas",division:"NJCAA"},{name:"Hutchinson CC",state:"Kansas",division:"NJCAA"},
  {name:"Iowa Central CC",state:"Iowa",division:"NJCAA"},{name:"Seward County CC",state:"Kansas",division:"NJCAA"},
  {name:"Monroe College",state:"New York",division:"NJCAA"},{name:"New Mexico Military",state:"New Mexico",division:"NJCAA"},
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const getPhotoUrl = (photoUrl) => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http")) return photoUrl;
  return `https://jjgtgkqmxnlxkshykdxv.supabase.co/storage/v1/object/public/avatars/${photoUrl}`;
};

const Avatar = ({ name, size = 40, photoUrl }) => {
  const [imgErr, setImgErr] = useState(false);
  const url = getPhotoUrl(photoUrl);
  if (url && !imgErr) return <img src={url} alt={name} onError={() => setImgErr(true)} style={{ width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid rgba(255,255,255,0.1)" }}/>;
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("");
  const pal = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6","#f97316"];
  const c = pal[name.charCodeAt(0) % pal.length];
  return <div style={{ width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${c}99,${c})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.34,fontWeight:800,color:"#fff",flexShrink:0,border:"2px solid rgba(255,255,255,0.08)" }}>{initials}</div>;
};

const PhotoUpload = ({ currentUrl, onUpload, size = 80 }) => {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    const ext = file.name.split(".").pop();
    const filename = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(filename, file, { upsert: true });
    if (!error) onUpload(filename);
    setUploading(false);
  };
  const url = preview || getPhotoUrl(currentUrl);
  return (
    <div style={{ position:"relative",width:size,height:size,cursor:"pointer" }} onClick={() => ref.current.click()}>
      {url ? <img src={url} alt="foto" style={{ width:size,height:size,borderRadius:"50%",objectFit:"cover",border:"3px solid rgba(99,102,241,0.5)" }}/> : <div style={{ width:size,height:size,borderRadius:"50%",background:"rgba(255,255,255,0.06)",border:"2px dashed rgba(99,102,241,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#6b7280",textAlign:"center" }}>📷<br/>Foto</div>}
      <div style={{ position:"absolute",bottom:0,right:0,width:24,height:24,background:"#6366f1",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12 }}>{uploading?"⏳":"✏️"}</div>
      <input ref={ref} type="file" accept="image/*" style={{ display:"none" }} onChange={upload}/>
    </div>
  );
};

const UniLogo = ({ name, logoUrl, size = 36 }) => {
  const [err, setErr] = useState(false);
  const url = logoUrl ? getPhotoUrl(logoUrl) : null;
  const domainMap = { "SMU":"smu.edu","UCLA":"ucla.edu","Stanford":"stanford.edu","Miami":"miami.edu","University of Miami":"miami.edu","USC":"usc.edu","Cal Berkeley":"berkeley.edu","Texas A&M":"tamu.edu","FIU":"fiu.edu","FAU":"fau.edu","USF":"usf.edu","Duke":"duke.edu","Harvard":"harvard.edu","Notre Dame":"nd.edu","Georgetown":"georgetown.edu","Vanderbilt":"vanderbilt.edu","Wake Forest":"wfu.edu","Boston College":"bc.edu","Syracuse":"syr.edu","Alabama":"ua.edu","Auburn":"auburn.edu","Florida":"ufl.edu","Florida State":"fsu.edu","Georgia":"uga.edu","Texas":"utexas.edu","Ohio State":"osu.edu","Michigan":"umich.edu","Penn State":"psu.edu","Oregon":"uoregon.edu","Washington":"uw.edu","Clemson":"clemson.edu","LSU":"lsu.edu","TCU":"tcu.edu","Baylor":"baylor.edu","Rice":"rice.edu","Houston":"uh.edu","BYU":"byu.edu","Virginia":"virginia.edu" };
  const d = Object.entries(domainMap).find(([k]) => name?.toLowerCase().includes(k.toLowerCase()))?.[1];
  const logoSrc = url && !err ? url : (d && !err ? `https://logo.clearbit.com/${d}` : null);
  if (logoSrc) return <img src={logoSrc} alt={name} onError={() => setErr(true)} style={{ width:size,height:size,borderRadius:8,objectFit:"contain",background:"#fff",padding:2,flexShrink:0 }}/>;
  const initials = (name||"U").split(" ").map(w=>w[0]).slice(0,2).join("");
  return <div style={{ width:size,height:size,borderRadius:8,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.3,fontWeight:800,color:"#fff",flexShrink:0 }}>{initials}</div>;
};

const Badge = ({ status }) => <span style={{ padding:"3px 11px",borderRadius:20,fontSize:11,fontWeight:700,background:`${STATUS_COLORS[status]}18`,color:STATUS_COLORS[status],border:`1px solid ${STATUS_COLORS[status]}33`,whiteSpace:"nowrap" }}>{status}</span>;
const OfferBadge = ({ status }) => <span style={{ padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:`${OFFER_COLORS[status]||"#6b7280"}18`,color:OFFER_COLORS[status]||"#6b7280",border:`1px solid ${OFFER_COLORS[status]||"#6b7280"}33` }}>{status}</span>;
const Pill = ({ label, color="#6b7280" }) => <span style={{ padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:`${color}15`,color,border:`1px solid ${color}28` }}>{label}</span>;
const Bar = ({ value, max, color="#6366f1", h=5 }) => <div style={{ width:"100%",background:"rgba(255,255,255,0.06)",borderRadius:99,height:h }}><div style={{ width:`${Math.min(100,max>0?(value/max)*100:0)}%`,background:`linear-gradient(90deg,${color}66,${color})`,height:"100%",borderRadius:99 }}/></div>;
const Card = ({ children, style={} }) => <div style={{ background:"linear-gradient(145deg,#181b2a,#111420)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"20px 22px",...style }}>{children}</div>;
const StatCard = ({ label, value, sub, color="#6366f1", icon }) => (
  <div style={{ background:"linear-gradient(145deg,#181b2a,#111420)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"18px 22px",position:"relative",overflow:"hidden" }}>
    <div style={{ position:"absolute",top:-20,right:-20,width:70,height:70,borderRadius:"50%",background:`radial-gradient(circle,${color}20,transparent)` }}/>
    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}><span style={{ color }}>{icon}</span><span style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:"#6b7280" }}>{label}</span></div>
    <div style={{ fontSize:28,fontWeight:900,color:"#f9fafb",lineHeight:1 }}>{value}</div>
    {sub&&<div style={{ fontSize:12,color:"#6b7280",marginTop:6 }}>{sub}</div>}
  </div>
);
const Svg = ({ d, size=16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
const Ic = {
  dash:<Svg d="M3 3h7v7H3zm11 0h7v7h-7zm0 11h7v7h-7zM3 14h7v7H3z"/>,
  players:<Svg d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm14 18v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>,
  fin:<Svg d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>,
  uni:<Svg d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10"/>,
  team:<Svg d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>,
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
};

// ─── DB HELPERS ───────────────────────────────────────────────────────────────
const dbToPlayer = (row, offers=[], timeline=[]) => ({
  id:row.id, name:row.name, sport:row.sport, nationality:row.nationality, age:row.age,
  position:row.position, foot:row.foot, height:row.height, weight:row.weight,
  status:row.status, agent:row.agent, phone:row.phone, email:row.email,
  instagram:row.instagram, videoUrl:row.video_url, photoUrl:row.photo_url,
  gpa:row.gpa, satScore:row.sat_score, englishLevel:row.english_level,
  highSchool:row.high_school, graduationYear:row.graduation_year, major:row.major,
  toeflScore:row.toefl_score, university:row.university, state:row.state,
  scholarshipPct:row.scholarship_pct, startDate:row.start_date, contractEnd:row.contract_end,
  notes:row.notes,
  totalFee:row.total_fee||2700,
  payment1Amount:row.payment1_amount||900,
  payment2Amount:row.payment2_amount||1800,
  payment1:{paid:row.payment1_paid,paidBy:row.payment1_paid_by,date:row.payment1_date},
  payment2:{paid:row.payment2_paid,paidBy:row.payment2_paid_by,date:row.payment2_date},
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
});

// ─── PUBLIC PROFILE ───────────────────────────────────────────────────────────
const PublicProfile = ({ player, onClose }) => {
  const [copied, setCopied] = useState(false);
  const publicUrl = `${window.location.origin}?player=${player.id}`;
  const copy = () => { navigator.clipboard.writeText(publicUrl); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:16,overflowY:"auto" }}>
      <div style={{ background:"#0d0f1a",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,width:"100%",maxWidth:580,maxHeight:"92vh",overflowY:"auto" }}>
        <div style={{ background:"linear-gradient(135deg,#181b2a,#111420)",padding:"24px 28px",borderRadius:"20px 20px 0 0",borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <img src="/logo.png" alt="FUA" onError={e=>e.target.style.display="none"} style={{ height:28 }}/>
              <span style={{ fontSize:12,fontWeight:800,color:"#9ca3af",letterSpacing:1 }}>FUTBOLUAGENCY</span>
            </div>
            <button onClick={onClose} style={{ background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:18 }}>✕</button>
          </div>
          <div style={{ display:"flex",gap:16,alignItems:"center" }}>
            <Avatar name={player.name} size={72} photoUrl={player.photoUrl}/>
            <div>
              <h2 style={{ margin:0,fontSize:22,fontWeight:900,color:"#f9fafb" }}>{player.name}</h2>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginTop:6 }}>
                <Pill label={player.sport} color="#6366f1"/>
                {player.position&&player.position!=="N/A"&&<Pill label={player.position} color="#8b5cf6"/>}
                {player.nationality&&<Pill label={player.nationality} color="#3b82f6"/>}
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding:"20px 28px 28px",display:"flex",flexDirection:"column",gap:16 }}>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
            {[["GPA",player.gpa||"—",player.gpa>=3.5?"#22c55e":player.gpa>=3?"#f59e0b":"#9ca3af"],["SAT",player.satScore||"—","#6366f1"],["TOEFL",player.toeflScore||"—","#8b5cf6"],["Inglés",player.englishLevel||"—","#3b82f6"]].map(([l,v,c])=>(
              <div key={l} style={{ background:"rgba(255,255,255,0.04)",border:`1px solid ${c}22`,borderRadius:12,padding:"12px",textAlign:"center" }}>
                <div style={{ fontSize:9,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:700 }}>{l}</div>
                <div style={{ fontSize:20,fontWeight:900,color:c }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background:"rgba(255,255,255,0.03)",borderRadius:14,padding:"14px 18px",border:"1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize:10,fontWeight:800,color:"#6366f1",textTransform:"uppercase",letterSpacing:1,marginBottom:10 }}>Deportivo</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {[["Deporte",player.sport],["Posición",player.position],["Pie",player.foot],["Altura",player.height?player.height+" cm":"—"],["Peso",player.weight?player.weight+" kg":"—"],["Universidad",player.university||"—"]].map(([l,v])=>(
                <div key={l}><div style={{ fontSize:9,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3 }}>{l}</div><div style={{ fontSize:13,color:"#e5e7eb",fontWeight:600 }}>{v}</div></div>
              ))}
            </div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.03)",borderRadius:14,padding:"14px 18px",border:"1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize:10,fontWeight:800,color:"#f59e0b",textTransform:"uppercase",letterSpacing:1,marginBottom:10 }}>Académico</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {[["High School",player.highSchool||"—"],["Graduación",player.graduationYear||"—"],["Carrera",player.major||"—"],["Inglés",player.englishLevel||"—"]].map(([l,v])=>(
                <div key={l}><div style={{ fontSize:9,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3 }}>{l}</div><div style={{ fontSize:13,color:"#e5e7eb",fontWeight:600 }}>{v}</div></div>
              ))}
            </div>
          </div>
          {player.videoUrl&&<a href={player.videoUrl} target="_blank" rel="noreferrer" style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,textDecoration:"none",color:"#f87171",fontWeight:700,fontSize:13 }}>{Ic.video} Ver vídeo deportivo</a>}
          {player.offers?.filter(o=>o.status!=="Rechazada").length>0&&(
            <div>
              <div style={{ fontSize:10,fontWeight:800,color:"#22c55e",textTransform:"uppercase",letterSpacing:1,marginBottom:10 }}>Ofertas universitarias</div>
              {player.offers.filter(o=>o.status!=="Rechazada").map(o=>(
                <div key={o.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"rgba(255,255,255,0.03)",borderRadius:12,marginBottom:8,border:`1px solid ${OFFER_COLORS[o.status]||"#374151"}33` }}>
                  <UniLogo name={o.university} logoUrl={o.logoUrl} size={32}/>
                  <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:800,color:"#f9fafb" }}>{o.university}</div><div style={{ fontSize:11,color:"#9ca3af" }}>{o.division} · {o.state}</div></div>
                  <div style={{ textAlign:"right" }}>{o.amount&&<div style={{ fontSize:14,fontWeight:900,color:"#22c55e" }}>{Number(o.amount).toLocaleString()}€</div>}{o.season&&<div style={{ fontSize:11,color:"#f59e0b" }}>{o.season}</div>}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:12,padding:"12px 16px" }}>
            <div style={{ fontSize:10,fontWeight:800,color:"#6366f1",textTransform:"uppercase",letterSpacing:1,marginBottom:8 }}>Compartir este perfil</div>
            <div style={{ display:"flex",gap:8 }}>
              <div style={{ flex:1,background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"7px 10px",fontSize:11,color:"#9ca3af",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{publicUrl}</div>
              <button onClick={copy} style={{ padding:"7px 14px",borderRadius:8,border:"none",background:copied?"#22c55e":"#6366f1",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap" }}>{copied?"✓ Copiado":"Copiar"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PAYMENT ROW ──────────────────────────────────────────────────────────────
const PaymentRow = ({ label, amount, payment, onToggle, agents }) => (
  <div style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 16px",background:payment.paid?"rgba(34,197,94,0.06)":"rgba(245,158,11,0.05)",borderRadius:12,border:`1px solid ${payment.paid?"rgba(34,197,94,0.18)":"rgba(245,158,11,0.18)"}` }}>
    <div style={{ width:30,height:30,borderRadius:"50%",background:payment.paid?"rgba(34,197,94,0.2)":"rgba(245,158,11,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
      {payment.paid?<span style={{ color:"#22c55e" }}>{Ic.check}</span>:<span style={{ color:"#f59e0b" }}>{Ic.alert}</span>}
    </div>
    <div style={{ flex:1 }}>
      <div style={{ fontSize:13,fontWeight:700,color:"#e5e7eb" }}>{label} — <span style={{ color:"#f9fafb" }}>{amount}€</span></div>
      {payment.paid?<div style={{ fontSize:11,color:"#6b7280",marginTop:2 }}>Cobrado por <span style={{ color:"#818cf8",fontWeight:700 }}>{payment.paidBy}</span> · {payment.date}</div>:<div style={{ fontSize:11,color:"#f59e0b",marginTop:2 }}>Pendiente de cobro</div>}
    </div>
    <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
      {!payment.paid&&(agents||[]).map(a=>(
        <button key={a} onClick={()=>onToggle(a)} style={{ padding:"5px 10px",borderRadius:8,border:"none",background:"rgba(99,102,241,0.25)",color:"#818cf8",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit" }}>✓ {a.split(" ")[0]}</button>
      ))}
      {payment.paid&&<button onClick={()=>onToggle(null)} style={{ padding:"5px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"none",color:"#6b7280",cursor:"pointer",fontSize:11,fontFamily:"inherit" }}>Deshacer</button>}
    </div>
  </div>
);

// ─── PLAYER MODAL ─────────────────────────────────────────────────────────────
const PlayerModal = ({ initial, onClose, onSave, agentList }) => {
  const blank = { name:"",sport:"Fútbol",nationality:"",age:"",position:"Delantero Centro",foot:"Derecho",height:"",weight:"",status:"Prospecto",agent:agentList[0]||"",phone:"",email:"",instagram:"",videoUrl:"",photoUrl:"",gpa:"",satScore:"",englishLevel:"B2",highSchool:"",graduationYear:"",major:"",toeflScore:"",university:"",state:"",scholarshipPct:0,startDate:"",contractEnd:"",notes:"",totalFee:2700,payment1Amount:900,payment2Amount:1800 };
  const [form,setForm] = useState(initial?{...initial,videoUrl:initial.videoUrl||"",satScore:initial.satScore||"",toeflScore:initial.toeflScore||""}:blank);
  const [saving,setSaving] = useState(false);
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
    await onSave({...form,id:form.id||undefined,age:parseInt(form.age)||0,height:parseInt(form.height)||0,weight:parseInt(form.weight)||0,gpa:parseFloat(form.gpa)||0,satScore:parseInt(form.satScore)||null,toeflScore:parseInt(form.toeflScore)||null,scholarshipPct:parseInt(form.scholarshipPct)||0,totalFee:parseFloat(form.totalFee)||2700,payment1Amount:parseFloat(form.payment1Amount)||900,payment2Amount:parseFloat(form.payment2Amount)||1800});
    setSaving(false); onClose();
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
          {/* Photo */}
          <div style={{ display:"flex",alignItems:"center",gap:16 }}>
            <PhotoUpload currentUrl={form.photoUrl} onUpload={url=>set("photoUrl",url)} size={80}/>
            <div style={{ fontSize:13,color:"#6b7280" }}>Haz clic en el círculo para subir foto del jugador</div>
          </div>
          <div>{sec("Datos personales","#6366f1")}<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}><F l="Nombre completo" k="name"/><F l="Nacionalidad" k="nationality"/><F l="Edad" k="age" type="number"/><F l="Email" k="email" type="email"/><F l="Teléfono" k="phone"/><F l="Instagram" k="instagram"/></div></div>
          <div>{sec("Información deportiva","#22c55e")}<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}><F l="Deporte" k="sport" opts={SPORTS.slice(1)}/><F l="Posición" k="position" opts={POSITIONS}/><F l="Pie dominante" k="foot" opts={FEET}/><F l="Agente asignado" k="agent" opts={agentList}/><F l="Altura (cm)" k="height" type="number"/><F l="Peso (kg)" k="weight" type="number"/><F l="Estado" k="status" opts={STATUSES.slice(1)}/><div><label style={lbl}>Enlace vídeo</label><input style={inp} type="url" value={form.videoUrl||""} onChange={e=>set("videoUrl",e.target.value)} placeholder="https://youtube.com/..."/></div></div></div>
          <div>{sec("Información académica","#f59e0b")}<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}><F l="Colegio / High School" k="highSchool"/><F l="Año graduación" k="graduationYear" type="number"/><F l="GPA (sobre 4.0)" k="gpa" type="number"/><F l="SAT Score" k="satScore" type="number"/><F l="TOEFL Score" k="toeflScore" type="number"/><F l="Nivel de inglés" k="englishLevel" opts={["A1","A2","B1","B2","C1","C2","Nativo"]}/><div style={{ gridColumn:"1/-1" }}><F l="Carrera de interés (Major)" k="major"/></div></div></div>
          <div>{sec("Beca / Universidad","#8b5cf6")}<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}><F l="Universidad destino" k="university"/><F l="Estado USA" k="state"/><div><label style={lbl}>% Beca</label><input style={inp} type="number" min="0" max="100" value={form.scholarshipPct||0} onChange={e=>set("scholarshipPct",e.target.value)}/></div><F l="Inicio temporada" k="startDate" type="date"/></div></div>
          <div>{sec("Estructura de pagos","#10b981")}<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
            <div><label style={lbl}>Total honorarios (€)</label><input style={inp} type="number" value={form.totalFee||2700} onChange={e=>set("totalFee",e.target.value)}/></div>
            <div><label style={lbl}>Primer pago (€)</label><input style={inp} type="number" value={form.payment1Amount||900} onChange={e=>set("payment1Amount",e.target.value)}/></div>
            <div><label style={lbl}>Segundo pago (€)</label><input style={inp} type="number" value={form.payment2Amount||1800} onChange={e=>set("payment2Amount",e.target.value)}/></div>
          </div></div>
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

// ─── OFFER MODAL ──────────────────────────────────────────────────────────────
const OfferModal = ({ onClose, onAdd }) => {
  const [f,setF] = useState({ university:"",state:"",division:"NCAA D1",scholarshipPct:"",amount:"",season:"Fall 27",status:"Interesada",notes:"",logoUrl:"" });
  const [search,setSearch] = useState("");
  const [saving,setSaving] = useState(false);
  const inp = { background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,padding:"9px 13px",color:"#f9fafb",fontSize:13,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"inherit" };
  const lbl = { fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:5,display:"block" };
  const filtered = search.length>1 ? NCAA_UNIVERSITIES.filter(u=>u.name.toLowerCase().includes(search.toLowerCase())||u.state.toLowerCase().includes(search.toLowerCase())).slice(0,8) : [];
  const selectUni = (u) => { setF(p=>({...p,university:u.name,state:u.state,division:u.division})); setSearch(""); };
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:20 }}>
      <div style={{ background:"#12141f",border:"1px solid rgba(255,255,255,0.1)",borderRadius:18,padding:28,width:"100%",maxWidth:500,maxHeight:"90vh",overflowY:"auto" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <h3 style={{ margin:0,fontSize:17,fontWeight:800,color:"#f9fafb" }}>Nueva oferta universitaria</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#6b7280",cursor:"pointer" }}>{Ic.x}</button>
        </div>
        {/* University search */}
        <div style={{ marginBottom:16 }}>
          <label style={lbl}>Buscar universidad</label>
          <input style={inp} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Escribe el nombre... ej: SMU, UCLA, Stanford"/>
          {filtered.length>0&&(
            <div style={{ background:"#1a1d2e",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,marginTop:4,overflow:"hidden" }}>
              {filtered.map(u=>(
                <div key={u.name} onClick={()=>selectUni(u)} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <UniLogo name={u.name} size={28}/>
                  <div><div style={{ fontSize:13,fontWeight:700,color:"#f9fafb" }}>{u.name}</div><div style={{ fontSize:11,color:"#6b7280" }}>{u.state} · {u.division}</div></div>
                </div>
              ))}
            </div>
          )}
          {f.university&&<div style={{ marginTop:8,display:"flex",alignItems:"center",gap:8 }}><UniLogo name={f.university} logoUrl={f.logoUrl} size={28}/><span style={{ fontSize:13,fontWeight:700,color:"#22c55e" }}>✓ {f.university}</span></div>}
        </div>
        {/* Or enter manually */}
        {!f.university&&<div style={{ marginBottom:12 }}><label style={lbl}>O escribe manualmente</label><input style={inp} value={f.university} onChange={e=>setF(p=>({...p,university:e.target.value}))} placeholder="Nombre de la universidad"/></div>}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <div><label style={lbl}>Estado USA</label><input style={inp} value={f.state} onChange={e=>setF(p=>({...p,state:e.target.value}))} placeholder="Texas..."/></div>
          <div><label style={lbl}>División</label><select style={{ ...inp,cursor:"pointer" }} value={f.division} onChange={e=>setF(p=>({...p,division:e.target.value}))}>{DIVISIONS.map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label style={lbl}>% Beca ofrecida</label><input style={inp} type="number" min="0" max="100" value={f.scholarshipPct} onChange={e=>setF(p=>({...p,scholarshipPct:e.target.value}))}/></div>
          <div><label style={lbl}>Importe anual (€)</label><input style={inp} type="number" value={f.amount} onChange={e=>setF(p=>({...p,amount:e.target.value}))} placeholder="20000"/></div>
          <div><label style={lbl}>Temporada</label><select style={{ ...inp,cursor:"pointer" }} value={f.season} onChange={e=>setF(p=>({...p,season:e.target.value}))}>{SEASONS.map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label style={lbl}>Estado oferta</label><select style={{ ...inp,cursor:"pointer" }} value={f.status} onChange={e=>setF(p=>({...p,status:e.target.value}))}>{OFFER_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={lbl}>Logo universidad (opcional)</label>
            <PhotoUpload currentUrl={f.logoUrl} onUpload={url=>setF(p=>({...p,logoUrl:url}))} size={50}/>
          </div>
          <div style={{ gridColumn:"1/-1" }}><label style={lbl}>Notas</label><input style={inp} value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Detalles adicionales..."/></div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:20 }}>
          <button onClick={onClose} style={{ flex:1,padding:"10px",borderRadius:9,border:"1px solid rgba(255,255,255,0.1)",background:"none",color:"#9ca3af",cursor:"pointer",fontWeight:600,fontFamily:"inherit" }}>Cancelar</button>
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
  const inp = { background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,padding:"9px 13px",color:"#f9fafb",fontSize:13,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"inherit" };
  const lbl = { fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:5,display:"block" };
  const save = async () => { if(!form.name.trim()) return; setSaving(true); await onSave(form); setSaving(false); onClose(); };
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }}>
      <div style={{ background:"#12141f",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,width:"100%",maxWidth:440,padding:28 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
          <h2 style={{ margin:0,fontSize:19,fontWeight:800,color:"#f9fafb" }}>{initial?"Editar agente":"Nuevo agente"}</h2>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#6b7280",cursor:"pointer" }}>{Ic.x}</button>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:20 }}>
          <PhotoUpload currentUrl={form.photoUrl} onUpload={url=>set("photoUrl",url)} size={80}/>
          <div style={{ fontSize:13,color:"#6b7280" }}>Foto del agente</div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          <div><label style={lbl}>Nombre completo</label><input style={inp} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Nombre..."/></div>
          <div><label style={lbl}>Cargo / Rol</label><input style={inp} value={form.role} onChange={e=>set("role",e.target.value)} placeholder="Agente, Director, Scout..."/></div>
          <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.email||""} onChange={e=>set("email",e.target.value)} placeholder="email@futboluagency.com"/></div>
          <div><label style={lbl}>Teléfono</label><input style={inp} value={form.phone||""} onChange={e=>set("phone",e.target.value)} placeholder="+34 ..."/></div>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:24 }}>
          <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"none",color:"#9ca3af",cursor:"pointer",fontWeight:600,fontFamily:"inherit" }}>Cancelar</button>
          <button onClick={save} disabled={saving} style={{ flex:2,padding:12,borderRadius:10,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",cursor:"pointer",fontWeight:800,fontFamily:"inherit",opacity:saving?0.7:1 }}>{saving?"Guardando...":initial?"Guardar":"Crear agente"}</button>
        </div>
      </div>
    </div>
  );
};

// ─── PLAYER DETAIL ────────────────────────────────────────────────────────────
const PlayerDetail = ({ player, onBack, onUpdate, onRefresh, agentList }) => {
  const [tab,setTab] = useState("profile");
  const [editModal,setEditModal] = useState(false);
  const [offerModal,setOfferModal] = useState(false);
  const [publicModal,setPublicModal] = useState(false);
  const [saving,setSaving] = useState(false);

  const paid=(player.payment1?.paid?(player.payment1Amount||900):0)+(player.payment2?.paid?(player.payment2Amount||1800):0);
  const totalFee=player.totalFee||2700;
  const pending=totalFee-paid;

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

  const tabs=[{id:"profile",label:"Perfil"},{id:"sports",label:"Deportivo"},{id:"academic",label:"Académico"},{id:"offers",label:`Ofertas (${player.offers?.length||0})`},{id:"payments",label:"Pagos"},{id:"timeline",label:"Historial"}];
  const tlColor={contact:"#6366f1",contract:"#8b5cf6",milestone:"#22c55e",achievement:"#f59e0b",payment:"#10b981"};
  const tlEmoji={contact:"👋",contract:"✍️",milestone:"🎯",achievement:"🏆",payment:"💰"};

  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
        <button onClick={onBack} style={{ display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:13,padding:0,fontFamily:"inherit" }}>{Ic.back} Volver</button>
        <button onClick={()=>setPublicModal(true)} style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:10,border:"1px solid rgba(99,102,241,0.3)",background:"rgba(99,102,241,0.1)",color:"#818cf8",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit" }}>{Ic.share} Compartir perfil</button>
      </div>
      <Card style={{ marginBottom:20 }}>
        <div style={{ display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap" }}>
          <Avatar name={player.name} size={76} photoUrl={player.photoUrl}/>
          <div style={{ flex:1,minWidth:200 }}>
            <div style={{ display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:7 }}>
              <h1 style={{ margin:0,fontSize:24,fontWeight:900,color:"#f9fafb" }}>{player.name}</h1>
              <Badge status={player.status}/>
              <Pill label={player.sport} color="#6366f1"/>
            </div>
            <div style={{ display:"flex",gap:16,flexWrap:"wrap",marginBottom:12 }}>
              {[[player.nationality,"#9ca3af"],[player.age&&player.age+" años","#9ca3af"],[player.university,"#22c55e"],[player.agent,"#818cf8"]].filter(([v])=>v).map(([v,c])=><span key={v} style={{ fontSize:13,color:c,fontWeight:600 }}>{v}</span>)}
            </div>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
              <div style={{ background:paid>=totalFee?"rgba(34,197,94,0.12)":paid>0?"rgba(245,158,11,0.1)":"rgba(239,68,68,0.1)",borderRadius:10,padding:"6px 14px",border:`1px solid ${paid>=totalFee?"rgba(34,197,94,0.25)":paid>0?"rgba(245,158,11,0.25)":"rgba(239,68,68,0.25)"}` }}>
                <span style={{ fontSize:13,fontWeight:800,color:paid>=totalFee?"#22c55e":paid>0?"#f59e0b":"#ef4444" }}>{paid>=totalFee?`✓ ${totalFee}€ cobrados`:`${paid}€ / ${totalFee}€`}</span>
              </div>
              {player.videoUrl&&<a href={player.videoUrl} target="_blank" rel="noreferrer" style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"6px 14px",textDecoration:"none",color:"#f87171",fontSize:13,fontWeight:700 }}>{Ic.video} Ver vídeo</a>}
            </div>
          </div>
          <button onClick={()=>setEditModal(true)} style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"#9ca3af",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit" }}>{Ic.edit} Editar</button>
        </div>
      </Card>
      <div style={{ display:"flex",gap:2,marginBottom:20,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:4,overflowX:"auto" }}>
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"8px 15px",borderRadius:9,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap",background:tab===t.id?"rgba(99,102,241,0.25)":"none",color:tab===t.id?"#818cf8":"#6b7280",fontFamily:"inherit" }}>{t.label}</button>)}
      </div>
      {tab==="profile"&&(
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          {[["Email",player.email||"—"],["Teléfono",player.phone||"—"],["Instagram",player.instagram||"—"],["Nacionalidad",player.nationality||"—"],["Edad",player.age?player.age+" años":"—"],["Agente",player.agent||"—"]].map(([l,v])=>(
            <div key={l} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 16px" }}>
              <div style={{ fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontWeight:700 }}>{l}</div>
              <div style={{ fontSize:14,color:"#e5e7eb",fontWeight:600 }}>{v}</div>
            </div>
          ))}
          {player.videoUrl&&<div style={{ gridColumn:"1/-1",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:12,padding:"12px 16px" }}><div style={{ fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:700 }}>Vídeo</div><a href={player.videoUrl} target="_blank" rel="noreferrer" style={{ color:"#f87171",textDecoration:"none",fontSize:13,fontWeight:700 }}>{player.videoUrl}</a></div>}
          {player.notes&&<div style={{ gridColumn:"1/-1",background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:12,padding:"14px 18px" }}><div style={{ fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:700 }}>Notas internas</div><div style={{ fontSize:14,color:"#d1d5db",lineHeight:1.7 }}>{player.notes}</div></div>}
        </div>
      )}
      {tab==="sports"&&(
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          {[["Deporte",player.sport],["Posición",player.position],["Pie",player.foot],["Altura",player.height?player.height+" cm":"—"],["Peso",player.weight?player.weight+" kg":"—"],["Universidad",player.university||"—"],["Estado USA",player.state||"—"],["% Beca",player.scholarshipPct+"%"]].map(([l,v])=>(
            <div key={l} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 16px" }}>
              <div style={{ fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontWeight:700 }}>{l}</div>
              <div style={{ fontSize:14,color:l==="% Beca"?"#6366f1":"#e5e7eb",fontWeight:700 }}>{v}</div>
            </div>
          ))}
          <div style={{ gridColumn:"1/-1" }}><div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}><span style={{ fontSize:13,color:"#9ca3af" }}>Beca</span><span style={{ fontSize:14,fontWeight:900,color:"#6366f1" }}>{player.scholarshipPct}%</span></div><Bar value={player.scholarshipPct} max={100} color="#6366f1" h={8}/></div>
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
          {[["High School",player.highSchool||"—"],["Graduación",player.graduationYear||"—"],["Carrera",player.major||"—"],["Inglés",player.englishLevel||"—"]].map(([l,v])=>(
            <div key={l} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 16px" }}>
              <div style={{ fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontWeight:700 }}>{l}</div>
              <div style={{ fontSize:14,color:"#e5e7eb",fontWeight:600 }}>{v}</div>
            </div>
          ))}
        </div>
      )}
      {tab==="offers"&&(
        <div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
            <span style={{ fontSize:13,color:"#6b7280" }}>{player.offers?.length||0} universidades</span>
            <button onClick={()=>setOfferModal(true)} style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit" }}>{Ic.plus} Nueva oferta</button>
          </div>
          {(!player.offers||player.offers.length===0)&&<div style={{ textAlign:"center",padding:"50px 20px",color:"#4b5563" }}><div style={{ fontSize:36,marginBottom:10 }}>🏫</div><div style={{ fontSize:15,fontWeight:600,color:"#6b7280" }}>Sin ofertas</div></div>}
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {(player.offers||[]).sort((a,b)=>(b.amount||0)-(a.amount||0)).map(offer=>(
              <div key={offer.id} style={{ background:offer.status==="Elegida ✓"?"rgba(16,185,129,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${offer.status==="Elegida ✓"?"rgba(16,185,129,0.25)":"rgba(255,255,255,0.07)"}`,borderRadius:14,padding:"16px 18px" }}>
                <div style={{ display:"flex",alignItems:"flex-start",gap:14 }}>
                  <UniLogo name={offer.university} logoUrl={offer.logoUrl} size={44}/>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:6 }}>
                      <span style={{ fontSize:16,fontWeight:800,color:"#f9fafb" }}>{offer.university}</span>
                      <OfferBadge status={offer.status}/>
                      <Pill label={offer.division} color="#6b7280"/>
                    </div>
                    <div style={{ display:"flex",gap:16,flexWrap:"wrap",fontSize:13,color:"#9ca3af",marginBottom:8 }}>
                      <span>{offer.state}</span>
                      {offer.amount&&<span style={{ color:"#22c55e",fontWeight:800 }}>{Number(offer.amount).toLocaleString()}€/año</span>}
                      {offer.season&&<span style={{ color:"#f59e0b",fontWeight:700 }}>{offer.season}</span>}
                      <span>Beca: <span style={{ color:"#6366f1",fontWeight:800 }}>{offer.scholarshipPct}%</span></span>
                    </div>
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
            <StatCard label="Total acordado" value={`${totalFee.toLocaleString()}€`} color="#6366f1" icon={Ic.fin}/>
            <StatCard label="Cobrado" value={`${paid}€`} color="#22c55e" icon={Ic.check} sub={`${Math.round((paid/totalFee)*100)}%`}/>
            <StatCard label="Pendiente" value={`${pending}€`} color={pending>0?"#f59e0b":"#22c55e"} icon={Ic.alert}/>
          </div>
          <Card>
            <div style={{ fontSize:10,fontWeight:800,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:14 }}>Pagos FUTBOLUAGENCY</div>
            {saving&&<div style={{ fontSize:12,color:"#6366f1",marginBottom:10 }}>Guardando...</div>}
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              <PaymentRow label="Pago inicial" amount={player.payment1Amount||900} payment={player.payment1||{paid:false}} onToggle={a=>handlePayment(1,a)} agents={agentList}/>
              <PaymentRow label="Segundo pago" amount={player.payment2Amount||1800} payment={player.payment2||{paid:false}} onToggle={a=>handlePayment(2,a)} agents={agentList}/>
            </div>
          </Card>
        </div>
      )}
      {tab==="timeline"&&(
        <div style={{ position:"relative",paddingLeft:28 }}>
          <div style={{ position:"absolute",left:10,top:8,bottom:0,width:2,background:"rgba(255,255,255,0.06)",borderRadius:2 }}/>
          {(player.timeline||[]).map((evt,i)=>{
            const c=tlColor[evt.type]||"#6b7280";
            return (<div key={i} style={{ position:"relative",marginBottom:18 }}>
              <div style={{ position:"absolute",left:-22,top:11,width:14,height:14,borderRadius:"50%",background:c,border:"3px solid #0d0f1a",boxShadow:`0 0 10px ${c}55` }}/>
              <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 16px" }}>
                <div style={{ fontSize:11,color:"#6b7280",marginBottom:4 }}>{evt.date}</div>
                <div style={{ fontSize:14,color:"#e5e7eb",fontWeight:600 }}>{tlEmoji[evt.type]} {evt.event}</div>
              </div>
            </div>);
          })}
          {(!player.timeline||player.timeline.length===0)&&<div style={{ textAlign:"center",padding:40,color:"#6b7280" }}>Sin eventos</div>}
        </div>
      )}
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
  const [agentModal,setAgentModal] = useState(null); // null | "new" | agent object

  const agentNames = agents.length>0 ? agents.map(a=>a.name) : ["Moha","Ignacio de Béjar"];

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data:rows },{ data:allOffers },{ data:allTimeline },{ data:agentRows }] = await Promise.all([
        supabase.from("players").select("*").order("created_at",{ascending:false}),
        supabase.from("offers").select("*"),
        supabase.from("timeline").select("*").order("date",{ascending:true}),
        supabase.from("agents").select("*").order("created_at",{ascending:true}),
      ]);
      const mapped=(rows||[]).map(r=>dbToPlayer(r,(allOffers||[]).filter(o=>o.player_id===r.id),(allTimeline||[]).filter(t=>t.player_id===r.id)));
      setPlayers(mapped);
      setAgents(agentRows||[]);
      setSelected(prev=>prev?(mapped.find(p=>p.id===prev.id)||prev):null);
    } catch(e){ console.error(e); }
    setLoading(false);
  },[]); // eslint-disable-line

  useEffect(()=>{ loadAll(); },[]); // eslint-disable-line

  const addPlayer = async (p) => {
    const { data } = await supabase.from("players").insert(playerToDb(p)).select().single();
    if(data) await supabase.from("timeline").insert({player_id:data.id,date:new Date().toISOString().split("T")[0],event:"Perfil creado",type:"contact"});
    await loadAll();
  };

  const saveAgent = async (a) => {
    if(a.id) await supabase.from("agents").update({name:a.name,role:a.role,email:a.email,phone:a.phone,photo_url:a.photoUrl||null}).eq("id",a.id);
    else await supabase.from("agents").insert({name:a.name,role:a.role,email:a.email||null,phone:a.phone||null,photo_url:a.photoUrl||null});
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
    players:players.filter(p=>p.agent===name).length,
  }));
  const allOffers=players.flatMap(p=>(p.offers||[]).map(o=>({...o,playerName:p.name,playerId:p.id})));
  const go=(n)=>{ setNav(n); setSelected(null); };

  const navItems=[{id:"dashboard",label:"Dashboard",icon:Ic.dash},{id:"players",label:"Jugadores",icon:Ic.players},{id:"offers",label:"Universidades",icon:Ic.uni},{id:"payments",label:"Pagos",icon:Ic.fin},{id:"team",label:"Equipo",icon:Ic.team}];

  if(loading) return (
    <div style={{ fontFamily:"'Syne','DM Sans',sans-serif",background:"#0d0f1a",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap')`}</style>
      <img src="/logo.png" alt="FUA" onError={e=>e.target.style.display="none"} style={{ height:60,objectFit:"contain" }}/>
      <div style={{ fontSize:15,fontWeight:700,color:"#6b7280" }}>Cargando FUTBOLUAGENCY CRM...</div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Syne','DM Sans',sans-serif",background:"#0d0f1a",color:"#f9fafb",minHeight:"100vh",display:"flex" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:4px}select option{background:#181b2a;color:#f9fafb}.prow:hover{border-color:rgba(99,102,241,.3)!important}`}</style>

      {/* Sidebar */}
      <div style={{ width:228,background:"#0a0c16",borderRight:"1px solid rgba(255,255,255,0.05)",padding:"20px 14px",display:"flex",flexDirection:"column",gap:3,flexShrink:0 }}>
        {/* Logo only - no text */}
        <div style={{ padding:"0 8px 20px",borderBottom:"1px solid rgba(255,255,255,0.05)",marginBottom:8 }}>
          <img src="/logo.png" alt="FUTBOLUAGENCY" onError={e=>{ e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} style={{ height:44,objectFit:"contain",maxWidth:"100%" }}/>
          <div style={{ display:"none",alignItems:"center",gap:8 }}>
            <div style={{ width:34,height:34,background:"linear-gradient(135deg,#c8102e,#002868)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#fff" }}>FUA</div>
            <span style={{ fontSize:13,fontWeight:800,color:"#f9fafb" }}>FUTBOLUAGENCY</span>
          </div>
        </div>
        {navItems.map(item=>(
          <button key={item.id} onClick={()=>go(item.id)} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 13px",borderRadius:11,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,background:nav===item.id?"rgba(99,102,241,0.18)":"none",color:nav===item.id?"#818cf8":"#5b6280",transition:"all .15s",textAlign:"left",fontFamily:"inherit" }}>
            <span style={{ opacity:nav===item.id?1:0.6 }}>{item.icon}</span>{item.label}
          </button>
        ))}
        <button onClick={loadAll} style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 13px",borderRadius:11,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:"none",color:"#4b5563",fontFamily:"inherit",marginTop:4 }}>{Ic.refresh} Actualizar</button>
        <div style={{ marginTop:"auto",padding:"14px 8px 0",borderTop:"1px solid rgba(255,255,255,0.05)" }}>
          {agentStats.slice(0,3).map(s=>(
            <div key={s.name} style={{ display:"flex",gap:9,alignItems:"center",padding:"6px 4px",cursor:"pointer" }} onClick={()=>go("team")}>
              <Avatar name={s.name} size={28} photoUrl={s.agent?.photo_url}/>
              <div><div style={{ fontSize:11,fontWeight:700,color:"#e5e7eb" }}>{s.name.split(" ")[0]}</div><div style={{ fontSize:10,color:"#6b7280" }}>{s.total}€</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1,overflowY:"auto",padding:"28px 30px" }}>

        {/* DASHBOARD */}
        {nav==="dashboard"&&(
          <div>
            <div style={{ marginBottom:24 }}><h1 style={{ fontSize:26,fontWeight:800,color:"#f9fafb",letterSpacing:-0.5 }}>Dashboard</h1><p style={{ color:"#6b7280",fontSize:14,marginTop:4 }}>Resumen general · FUTBOLUAGENCY</p></div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22 }}>
              <StatCard label="Atletas" value={players.length} sub={`${players.filter(p=>p.status==="Becado").length} becados`} color="#6366f1" icon={Ic.players}/>
              <StatCard label="Revenue total" value={totalFees>0?`${(totalFees/1000).toFixed(1)}k€`:"0€"} color="#8b5cf6" icon={Ic.fin}/>
              <StatCard label="Cobrado" value={`${totalColl.toLocaleString()}€`} color="#22c55e" sub={totalFees>0?`${Math.round((totalColl/totalFees)*100)}%`:"—"} icon={Ic.check}/>
              <StatCard label="Pendiente" value={`${totalPend.toLocaleString()}€`} color="#f59e0b" sub={`${players.filter(p=>!p.payment2?.paid).length} pagos abiertos`} icon={Ic.alert}/>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18 }}>
              <Card>
                <div style={{ fontSize:11,fontWeight:800,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:16 }}>Cobros por agente</div>
                {agentStats.length===0?<div style={{ color:"#4b5563",fontSize:13 }}>Sin agentes</div>:
                <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                  {agentStats.map(s=>(
                    <div key={s.name}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <Avatar name={s.name} size={24} photoUrl={s.agent?.photo_url}/>
                          <span style={{ fontSize:13,fontWeight:700,color:"#e5e7eb" }}>{s.name}</span>
                        </div>
                        <span style={{ fontSize:16,fontWeight:900,color:"#818cf8" }}>{s.total}€</span>
                      </div>
                      <Bar value={s.total} max={totalColl||1} color="#6366f1"/>
                      <div style={{ fontSize:11,color:"#6b7280",marginTop:4 }}>{s.p1} pagos iniciales · {s.p2} segundos pagos · {s.players} atletas</div>
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
                {players.filter(p=>!p.payment1?.paid||!p.payment2?.paid).length===0
                  ?<div style={{ textAlign:"center",padding:20,color:"#22c55e",fontWeight:700 }}>✓ Todos los pagos al día</div>
                  :<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10 }}>
                    {players.filter(p=>!p.payment1?.paid||!p.payment2?.paid).map(p=>(
                      <div key={p.id} onClick={()=>{ setNav("players"); setSelected(p); }} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(245,158,11,0.15)",borderRadius:12,cursor:"pointer" }}>
                        <Avatar name={p.name} size={36} photoUrl={p.photoUrl}/>
                        <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:700,color:"#e5e7eb" }}>{p.name}</div><div style={{ fontSize:11,color:"#f59e0b" }}>{!p.payment1?.paid?`Pago inicial (${p.payment1Amount||900}€)`:`Segundo pago (${p.payment2Amount||1800}€)`}</div></div>
                        <span style={{ fontSize:14,fontWeight:900,color:"#f59e0b" }}>{!p.payment1?.paid?`${p.payment1Amount||900}€`:`${p.payment2Amount||1800}€`}</span>
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
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22 }}>
              <div><h1 style={{ fontSize:26,fontWeight:800,color:"#f9fafb",letterSpacing:-0.5 }}>Jugadores & Atletas</h1><p style={{ color:"#6b7280",fontSize:14,marginTop:4 }}>{players.length} atletas</p></div>
              <button onClick={()=>setAddModal(true)} style={{ display:"flex",alignItems:"center",gap:8,padding:"11px 20px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:800,fontFamily:"inherit",boxShadow:"0 4px 20px rgba(99,102,241,0.35)" }}>{Ic.plus} Nuevo atleta</button>
            </div>
            <div style={{ display:"flex",gap:10,marginBottom:18,flexWrap:"wrap" }}>
              <div style={{ position:"relative",flex:"1 1 200px" }}>
                <div style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#6b7280" }}>{Ic.search}</div>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." style={{ paddingLeft:34,padding:"9px 13px 9px 34px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#f9fafb",fontSize:13,outline:"none",width:"100%",fontFamily:"inherit" }}/>
              </div>
              {[[SPORTS,fSport,setFSport],[STATUSES,fStatus,setFStatus],[["Todos",...agentNames],fAgent,setFAgent]].map(([opts,val,setter],i)=>(
                <select key={i} value={val} onChange={e=>setter(e.target.value)} style={{ padding:"9px 13px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:val==="Todos"?"#6b7280":"#f9fafb",fontSize:13,outline:"none",cursor:"pointer",fontFamily:"inherit" }}>
                  {opts.map(o=><option key={o}>{o}</option>)}
                </select>
              ))}
            </div>
            {players.length===0&&<div style={{ textAlign:"center",padding:60,color:"#6b7280" }}><div style={{ fontSize:40,marginBottom:12 }}>👥</div><div style={{ fontSize:16,fontWeight:700 }}>Sin atletas todavía</div></div>}
            <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
              {filtered.map(p=>{
                const paid=(p.payment1?.paid?(p.payment1Amount||900):0)+(p.payment2?.paid?(p.payment2Amount||1800):0);
                const total=p.totalFee||2700;
                const pct=(paid/total)*100;
                return (
                  <div key={p.id} className="prow" onClick={()=>setSelected(p)} style={{ display:"flex",alignItems:"center",gap:14,background:"linear-gradient(145deg,#181b2a,#111420)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"14px 18px",cursor:"pointer",transition:"all .15s" }}>
                    <Avatar name={p.name} size={44} photoUrl={p.photoUrl}/>
                    <div style={{ flex:2 }}><div style={{ fontSize:15,fontWeight:800,color:"#f9fafb" }}>{p.name}</div><div style={{ fontSize:12,color:"#6b7280",marginTop:2 }}>{p.sport} · {p.nationality} · {p.position}</div></div>
                    <Badge status={p.status}/>
                    <div style={{ textAlign:"center",minWidth:56 }}><div style={{ fontSize:10,color:"#6b7280",marginBottom:2 }}>Beca</div><div style={{ fontSize:14,fontWeight:900,color:"#6366f1" }}>{p.scholarshipPct}%</div></div>
                    <div style={{ textAlign:"center",minWidth:50 }}><div style={{ fontSize:10,color:"#6b7280",marginBottom:2 }}>GPA</div><div style={{ fontSize:14,fontWeight:900,color:p.gpa>=3.5?"#22c55e":p.gpa>=3?"#f59e0b":"#ef4444" }}>{p.gpa||"—"}</div></div>
                    <div style={{ flex:1,minWidth:100 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,color:"#6b7280",marginBottom:4 }}><span>Cobros</span><span style={{ color:pct>=100?"#22c55e":pct>0?"#f59e0b":"#ef4444",fontWeight:700 }}>{paid}€</span></div>
                      <Bar value={paid} max={total} color={pct>=100?"#22c55e":pct>0?"#f59e0b":"#6366f1"}/>
                    </div>
                    <div style={{ fontSize:11,color:"#818cf8",fontWeight:700,minWidth:55,textAlign:"right" }}>{p.agent?.split(" ")[0]}</div>
                    <div style={{ color:"#4b5563" }}>{Ic.back}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {nav==="players"&&selected&&<PlayerDetail player={selected} onBack={()=>setSelected(null)} onUpdate={async(p)=>{ await supabase.from("players").update(playerToDb(p)).eq("id",p.id); await loadAll(); }} onRefresh={loadAll} agentList={agentNames}/>}

        {/* UNIVERSITIES/OFFERS */}
        {nav==="offers"&&(
          <div>
            <div style={{ marginBottom:24 }}><h1 style={{ fontSize:26,fontWeight:800,color:"#f9fafb",letterSpacing:-0.5 }}>Ofertas universitarias</h1><p style={{ color:"#6b7280",fontSize:14,marginTop:4 }}>{allOffers.length} ofertas totales</p></div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:22 }}>
              <StatCard label="Total ofertas" value={allOffers.length} color="#6366f1" icon={Ic.uni}/>
              <StatCard label="Confirmadas" value={allOffers.filter(o=>o.status==="Elegida ✓").length} color="#22c55e" icon={Ic.check}/>
              <StatCard label="En negociación" value={allOffers.filter(o=>["Oferta formal","Pre-aceptada","Interesada"].includes(o.status)).length} color="#f59e0b" icon={Ic.trophy}/>
            </div>
            {players.filter(p=>p.offers?.length>0).length===0&&<div style={{ textAlign:"center",padding:60,color:"#6b7280" }}><div style={{ fontSize:40,marginBottom:12 }}>🏛️</div><div style={{ fontSize:16,fontWeight:700 }}>Sin ofertas todavía</div></div>}
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              {players.filter(p=>p.offers?.length>0).map(p=>(
                <Card key={p.id}>
                  <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}>
                    <Avatar name={p.name} size={42} photoUrl={p.photoUrl}/>
                    <div><div style={{ fontSize:15,fontWeight:800,color:"#f9fafb" }}>{p.name}</div><div style={{ fontSize:12,color:"#6b7280" }}>{p.sport} · {p.offers.length} {p.offers.length===1?"oferta":"ofertas"}</div></div>
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10 }}>
                    {p.offers.sort((a,b)=>(b.amount||0)-(a.amount||0)).map(o=>(
                      <div key={o.id} onClick={()=>{ setNav("players"); setSelected(p); }} style={{ background:o.status==="Elegida ✓"?"rgba(16,185,129,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${OFFER_COLORS[o.status]||"#374151"}33`,borderRadius:12,padding:"14px",cursor:"pointer" }}>
                        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                          <UniLogo name={o.university} logoUrl={o.logoUrl} size={30}/>
                          <div style={{ fontSize:13,fontWeight:800,color:"#f9fafb",lineHeight:1.2 }}>{o.university}</div>
                        </div>
                        <div style={{ fontSize:11,color:"#9ca3af",marginBottom:6 }}>{o.state} · {o.division}</div>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8 }}>
                          <div>{o.amount&&<div style={{ fontSize:15,fontWeight:900,color:"#22c55e" }}>{Number(o.amount).toLocaleString()}€</div>}{o.season&&<div style={{ fontSize:11,color:"#f59e0b" }}>{o.season}</div>}</div>
                          <OfferBadge status={o.status}/>
                        </div>
                        <Bar value={o.scholarshipPct} max={100} color={OFFER_COLORS[o.status]||"#6366f1"} h={4}/>
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
            <div style={{ marginBottom:24 }}><h1 style={{ fontSize:26,fontWeight:800,color:"#f9fafb",letterSpacing:-0.5 }}>Pagos & Cobros</h1><p style={{ color:"#6b7280",fontSize:14,marginTop:4 }}>Honorarios personalizados por atleta</p></div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22 }}>
              <StatCard label="Revenue total" value={`${totalFees.toLocaleString()}€`} color="#6366f1" icon={Ic.fin}/>
              <StatCard label="Cobrado" value={`${totalColl.toLocaleString()}€`} color="#22c55e" icon={Ic.check} sub={totalFees>0?`${Math.round((totalColl/totalFees)*100)}%`:"—"}/>
              <StatCard label="Pendiente" value={`${totalPend.toLocaleString()}€`} color="#f59e0b" icon={Ic.alert}/>
              <StatCard label="Completos" value={players.filter(p=>p.payment1?.paid&&p.payment2?.paid).length} color="#10b981" icon={Ic.trophy} sub={`de ${players.length}`}/>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14,marginBottom:18 }}>
              {agentStats.map(s=>(
                <Card key={s.name} style={{ border:"1px solid rgba(99,102,241,0.2)" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:14 }}>
                    <Avatar name={s.name} size={44} photoUrl={s.agent?.photo_url}/>
                    <div style={{ flex:1 }}><div style={{ fontSize:15,fontWeight:800,color:"#f9fafb" }}>{s.name}</div><div style={{ fontSize:11,color:"#6b7280" }}>{s.agent?.role||"Agente"}</div></div>
                    <div style={{ fontSize:22,fontWeight:900,color:"#818cf8" }}>{s.total}€</div>
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                    <div style={{ background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px" }}><div style={{ fontSize:10,color:"#6b7280",marginBottom:4 }}>PAGOS INICIALES</div><div style={{ fontSize:18,fontWeight:900,color:"#818cf8" }}>{s.p1}</div></div>
                    <div style={{ background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px" }}><div style={{ fontSize:10,color:"#6b7280",marginBottom:4 }}>SEGUNDOS PAGOS</div><div style={{ fontSize:18,fontWeight:900,color:"#818cf8" }}>{s.p2}</div></div>
                  </div>
                </Card>
              ))}
            </div>
            <Card>
              <div style={{ fontSize:11,fontWeight:800,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:14 }}>Estado por atleta</div>
              {players.length===0&&<div style={{ color:"#4b5563",fontSize:13,textAlign:"center",padding:20 }}>Sin atletas</div>}
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {players.map(p=>{
                  const paid=(p.payment1?.paid?(p.payment1Amount||900):0)+(p.payment2?.paid?(p.payment2Amount||1800):0);
                  const total=p.totalFee||2700;
                  return (
                    <div key={p.id} onClick={()=>{ setNav("players"); setSelected(p); }} style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 16px",background:"rgba(255,255,255,0.03)",borderRadius:12,border:"1px solid rgba(255,255,255,0.05)",cursor:"pointer" }}>
                      <Avatar name={p.name} size={36} photoUrl={p.photoUrl}/>
                      <div style={{ flex:2 }}>
                        <div style={{ fontSize:14,fontWeight:700,color:"#f9fafb" }}>{p.name}</div>
                        <div style={{ display:"flex",gap:7,marginTop:4 }}>
                          <span style={{ fontSize:10,padding:"2px 8px",borderRadius:6,background:p.payment1?.paid?"rgba(34,197,94,0.15)":"rgba(245,158,11,0.12)",color:p.payment1?.paid?"#22c55e":"#f59e0b",fontWeight:700 }}>P1: {p.payment1?.paid?`✓ ${p.payment1.paidBy}`:"Pendiente"}</span>
                          <span style={{ fontSize:10,padding:"2px 8px",borderRadius:6,background:p.payment2?.paid?"rgba(34,197,94,0.15)":"rgba(245,158,11,0.12)",color:p.payment2?.paid?"#22c55e":"#f59e0b",fontWeight:700 }}>P2: {p.payment2?.paid?`✓ ${p.payment2.paidBy}`:"Pendiente"}</span>
                        </div>
                      </div>
                      <div style={{ flex:1.5,minWidth:120 }}><Bar value={paid} max={total} color={paid>=total?"#22c55e":paid>0?"#f59e0b":"#374151"}/></div>
                      <div style={{ fontWeight:900,fontSize:14,color:paid>=total?"#22c55e":"#f9fafb",minWidth:90,textAlign:"right" }}>{paid}€ / {total}€</div>
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
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
              <div><h1 style={{ fontSize:26,fontWeight:800,color:"#f9fafb",letterSpacing:-0.5 }}>Equipo FUTBOLUAGENCY</h1><p style={{ color:"#6b7280",fontSize:14,marginTop:4 }}>{agents.length} miembros del equipo</p></div>
              <button onClick={()=>setAgentModal("new")} style={{ display:"flex",alignItems:"center",gap:8,padding:"11px 20px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:800,fontFamily:"inherit" }}>{Ic.plus} Nuevo agente</button>
            </div>
            {agents.length===0&&(
              <div style={{ textAlign:"center",padding:60,color:"#6b7280" }}>
                <div style={{ fontSize:40,marginBottom:12 }}>👥</div>
                <div style={{ fontSize:16,fontWeight:700,marginBottom:6 }}>Sin agentes todavía</div>
                <div style={{ fontSize:13 }}>Añade a Moha, Ignacio y el resto del equipo</div>
              </div>
            )}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16 }}>
              {agents.map(agent=>{
                const stats=agentStats.find(s=>s.name===agent.name)||{total:0,p1:0,p2:0,players:0};
                return (
                  <Card key={agent.id} style={{ border:"1px solid rgba(99,102,241,0.15)" }}>
                    <div style={{ display:"flex",alignItems:"flex-start",gap:14,marginBottom:16 }}>
                      <Avatar name={agent.name} size={56} photoUrl={agent.photo_url}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:16,fontWeight:800,color:"#f9fafb" }}>{agent.name}</div>
                        <div style={{ fontSize:12,color:"#6366f1",fontWeight:700,marginTop:3 }}>{agent.role}</div>
                        {agent.email&&<div style={{ fontSize:11,color:"#6b7280",marginTop:4 }}>{agent.email}</div>}
                        {agent.phone&&<div style={{ fontSize:11,color:"#6b7280" }}>{agent.phone}</div>}
                      </div>
                      <button onClick={()=>setAgentModal(agent)} style={{ background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:18 }}>✏️</button>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
                      {[["Atletas",stats.players,"#6366f1"],["Cobrado",stats.total+"€","#22c55e"],["Deals",stats.p1+stats.p2,"#f59e0b"]].map(([l,v,c])=>(
                        <div key={l} style={{ background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px",textAlign:"center" }}>
                          <div style={{ fontSize:9,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4 }}>{l}</div>
                          <div style={{ fontSize:16,fontWeight:900,color:c }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={()=>{ if(window.confirm(`¿Eliminar a ${agent.name}?`)) deleteAgent(agent.id); }} style={{ marginTop:12,width:"100%",padding:"8px",borderRadius:9,border:"1px solid rgba(239,68,68,0.2)",background:"none",color:"#ef4444",cursor:"pointer",fontSize:12,fontFamily:"inherit" }}>Eliminar agente</button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {addModal&&<PlayerModal onClose={()=>setAddModal(false)} onSave={async(p)=>{ await addPlayer(p); setAddModal(false); }} agentList={agentNames}/>}
      {agentModal&&<AgentModal initial={agentModal==="new"?null:{...agents.find(a=>a.id===agentModal?.id)||agentModal,photoUrl:agentModal?.photo_url}} onClose={()=>setAgentModal(null)} onSave={saveAgent}/>}
    </div>
  );
}
