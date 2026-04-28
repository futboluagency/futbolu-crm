import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import { useAuth, LoginPage, AccessDenied, DEFAULT_PERMISSIONS, ADMIN_EMAIL, CEO_EMAILS, LATAM_DIRECTOR_EMAIL } from "./Auth";
import { AdmissionChecklist } from "./Admission";
import { CoachesDB } from "./Coaches";
import { Analytics } from "./Analytics";
import { ALL_UNIVERSITIES, getAllUniversities } from "./Universities";
import { CalendarView } from "./Calendar";
import { RecruiterDashboard } from "./RecruiterDashboard";
import { TasksPanel, TasksDashboard } from "./Tasks";
import { AvailabilityManager, BookingPage } from "./Booking";
import { Pipeline } from "./Pipeline";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationBell, createNotification } from "./Notifications";
import { TeamChat } from "./TeamChat";

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ CONSTANTS Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
const SPORTS = ["All","Soccer","Tennis","Swimming","Baseball","Basketball","Track & Field","Golf","Volleyball"];
const STATUSES = ["All","Scholarship","In Process","Prospect","Inactive"];
const DIVISIONS = ["NCAA D1","NCAA D2","NCAA D3","NAIA","NJCAA"];
const OFFER_STATUSES = ["Interested","Formal Offer","Pre-accepted","Declined","Chosen Ã¢ÂÂ"];
const SEASONS = ["Fall 25","Spring 26","Fall 26","Spring 27","Fall 27","Spring 28","Fall 28","Spring 29"];
const STATUS_COLORS = {"Scholarship":"#10b981","In Process":"#f59e0b","Prospect":"#6366f1","Inactive":"#6b7280"};
const OFFER_COLORS = {"Interested":"#6366f1","Formal Offer":"#f59e0b","Pre-accepted":"#10b981","Declined":"#ef4444","Chosen Ã¢ÂÂ":"#22c55e"};

const POSITIONS_BY_SPORT = {
  "Soccer":["Goalkeeper","Center Back","Right Back","Left Back","Defensive Midfielder","Central Midfielder","Attacking Midfielder","Right Winger","Left Winger","Striker","Forward"],
  "Tennis":["Singles","Doubles","Singles & Doubles"],
  "Swimming":["Freestyle","Backstroke","Breaststroke","Butterfly","Individual Medley","Relay"],
  "Baseball":["Pitcher","Catcher","First Base","Second Base","Third Base","Shortstop","Left Field","Center Field","Right Field","DH"],
  "Basketball":["Point Guard","Shooting Guard","Small Forward","Power Forward","Center"],
  "Track & Field":["100m","200m","400m","800m","1500m","5000m","10000m","110m Hurdles","400m Hurdles","High Jump","Long Jump","Triple Jump","Pole Vault","Shot Put","Discus","Hammer","Javelin","Decathlon","Heptathlon"],
  "Golf":["Amateur","Professional"],
  "Volleyball":["Libero","Setter","Opposite","Middle Blocker","Outside Hitter","Right Side"],
};

const SPORT_FIELDS = {
  "Soccer":[["Dominant Foot","foot",["Right","Left","Both"]],["Height (cm)","height","number"],["Weight (kg)","weight","number"],["Goals this season","sport_goals","number"],["Assists","sport_assists","number"],["Games played","sport_games","number"],["Current team","sport_team","text"],["Current league","sport_league","text"]],
  "Tennis":[["Dominant Hand","foot",["Right","Left"]],["ITF Junior Ranking","sport_ranking","text"],["National Ranking","sport_national_ranking","text"],["Best tournament result","sport_best_result","text"],["Tournaments played","sport_games","number"],["Playing style","sport_style",["Aggressive Baseliner","Serve & Volley","All-Court","Defensive"]]],
  "Swimming":[["Best time 50m free","sport_time_50free","text"],["Best time 100m free","sport_time_100free","text"],["Best time 200m free","sport_time_200free","text"],["Best time 100m back","sport_time_100back","text"],["Best time 100m breast","sport_time_100breast","text"],["Best time 100m fly","sport_time_100fly","text"],["Current club","sport_team","text"],["National ranking","sport_national_ranking","text"]],
  "Baseball":[["Pitch velocity (mph)","sport_velocity","number"],["Batting average","sport_batting_avg","text"],["ERA","sport_era","text"],["Home runs","sport_goals","number"],["RBIs","sport_assists","number"],["Current team","sport_team","text"]],
  "Basketball":[["Height (cm)","height","number"],["Wingspan (cm)","sport_wingspan","number"],["Points per game","sport_goals","number"],["Rebounds per game","sport_rebounds","number"],["Assists per game","sport_assists","number"],["Current team","sport_team","text"]],
  "Track & Field":[["Personal best","sport_personal_best","text"],["National ranking","sport_national_ranking","text"],["World junior ranking","sport_world_ranking","text"],["Club/Team","sport_team","text"],["Current coach","sport_coach","text"]],
  "Golf":[["Handicap","sport_handicap","text"],["Best 18-hole score","sport_best_score","text"],["Amateur ranking","sport_ranking","text"],["Tournaments won","sport_goals","number"],["Current club","sport_team","text"]],
  "Volleyball":[["Height (cm)","height","number"],["Approach reach (cm)","sport_reach","number"],["Points per set","sport_goals","number"],["Aces per set","sport_assists","number"],["Current team","sport_team","text"]],
};

const NCAA_UNIVERSITIES = [
  {name:"Alabama",state:"AL",div:"NCAA D1"},{name:"Auburn",state:"AL",div:"NCAA D1"},{name:"Arizona",state:"AZ",div:"NCAA D1"},{name:"Arizona State",state:"AZ",div:"NCAA D1"},{name:"Arkansas",state:"AR",div:"NCAA D1"},{name:"UCLA",state:"CA",div:"NCAA D1"},{name:"USC",state:"CA",div:"NCAA D1"},{name:"Cal Berkeley",state:"CA",div:"NCAA D1"},{name:"Stanford",state:"CA",div:"NCAA D1"},{name:"San Diego State",state:"CA",div:"NCAA D1"},{name:"Colorado",state:"CO",div:"NCAA D1"},{name:"Connecticut",state:"CT",div:"NCAA D1"},{name:"Florida",state:"FL",div:"NCAA D1"},{name:"Florida State",state:"FL",div:"NCAA D1"},{name:"University of Miami",state:"FL",div:"NCAA D1"},{name:"FIU",state:"FL",div:"NCAA D1"},{name:"FAU",state:"FL",div:"NCAA D1"},{name:"USF",state:"FL",div:"NCAA D1"},{name:"UCF",state:"FL",div:"NCAA D1"},{name:"Georgia",state:"GA",div:"NCAA D1"},{name:"Georgia Tech",state:"GA",div:"NCAA D1"},{name:"Notre Dame",state:"IN",div:"NCAA D1"},{name:"Indiana",state:"IN",div:"NCAA D1"},{name:"Iowa",state:"IA",div:"NCAA D1"},{name:"Iowa State",state:"IA",div:"NCAA D1"},{name:"Kansas",state:"KS",div:"NCAA D1"},{name:"Kansas State",state:"KS",div:"NCAA D1"},{name:"Kentucky",state:"KY",div:"NCAA D1"},{name:"LSU",state:"LA",div:"NCAA D1"},{name:"Maryland",state:"MD",div:"NCAA D1"},{name:"Michigan",state:"MI",div:"NCAA D1"},{name:"Michigan State",state:"MI",div:"NCAA D1"},{name:"Minnesota",state:"MN",div:"NCAA D1"},{name:"Ole Miss",state:"MS",div:"NCAA D1"},{name:"Mississippi State",state:"MS",div:"NCAA D1"},{name:"Missouri",state:"MO",div:"NCAA D1"},{name:"Nebraska",state:"NE",div:"NCAA D1"},{name:"Rutgers",state:"NJ",div:"NCAA D1"},{name:"Syracuse",state:"NY",div:"NCAA D1"},{name:"North Carolina",state:"NC",div:"NCAA D1"},{name:"NC State",state:"NC",div:"NCAA D1"},{name:"Duke",state:"NC",div:"NCAA D1"},{name:"Wake Forest",state:"NC",div:"NCAA D1"},{name:"Ohio State",state:"OH",div:"NCAA D1"},{name:"Oklahoma",state:"OK",div:"NCAA D1"},{name:"Oklahoma State",state:"OK",div:"NCAA D1"},{name:"Oregon",state:"OR",div:"NCAA D1"},{name:"Penn State",state:"PA",div:"NCAA D1"},{name:"Pittsburgh",state:"PA",div:"NCAA D1"},{name:"South Carolina",state:"SC",div:"NCAA D1"},{name:"Clemson",state:"SC",div:"NCAA D1"},{name:"Tennessee",state:"TN",div:"NCAA D1"},{name:"Vanderbilt",state:"TN",div:"NCAA D1"},{name:"Texas",state:"TX",div:"NCAA D1"},{name:"Texas A&M",state:"TX",div:"NCAA D1"},{name:"Texas Tech",state:"TX",div:"NCAA D1"},{name:"SMU",state:"TX",div:"NCAA D1"},{name:"TCU",state:"TX",div:"NCAA D1"},{name:"Baylor",state:"TX",div:"NCAA D1"},{name:"Rice",state:"TX",div:"NCAA D1"},{name:"Houston",state:"TX",div:"NCAA D1"},{name:"Utah",state:"UT",div:"NCAA D1"},{name:"BYU",state:"UT",div:"NCAA D1"},{name:"Virginia",state:"VA",div:"NCAA D1"},{name:"Virginia Tech",state:"VA",div:"NCAA D1"},{name:"Washington",state:"WA",div:"NCAA D1"},{name:"Washington State",state:"WA",div:"NCAA D1"},{name:"West Virginia",state:"WV",div:"NCAA D1"},{name:"Wisconsin",state:"WI",div:"NCAA D1"},{name:"Harvard",state:"MA",div:"NCAA D1"},{name:"Yale",state:"CT",div:"NCAA D1"},{name:"Georgetown",state:"DC",div:"NCAA D1"},{name:"Boston College",state:"MA",div:"NCAA D1"},{name:"Northwestern",state:"IL",div:"NCAA D1"},{name:"Illinois",state:"IL",div:"NCAA D1"},{name:"Gonzaga",state:"WA",div:"NCAA D1"},{name:"Villanova",state:"PA",div:"NCAA D1"},{name:"Marquette",state:"WI",div:"NCAA D1"},
  {name:"Rollins College",state:"FL",div:"NCAA D2"},{name:"Barry University",state:"FL",div:"NCAA D2"},{name:"Lynn University",state:"FL",div:"NCAA D2"},{name:"University of Tampa",state:"FL",div:"NCAA D2"},{name:"Nova Southeastern",state:"FL",div:"NCAA D2"},{name:"Grand Canyon",state:"AZ",div:"NCAA D2"},{name:"Cal State LA",state:"CA",div:"NCAA D2"},{name:"Colorado School of Mines",state:"CO",div:"NCAA D2"},{name:"Charleston",state:"SC",div:"NCAA D2"},
  {name:"Williams College",state:"MA",div:"NCAA D3"},{name:"Amherst College",state:"MA",div:"NCAA D3"},{name:"Middlebury College",state:"VT",div:"NCAA D3"},{name:"Tufts University",state:"MA",div:"NCAA D3"},{name:"Emory University",state:"GA",div:"NCAA D3"},{name:"NYU",state:"NY",div:"NCAA D3"},
  {name:"Lindsey Wilson",state:"KY",div:"NAIA"},{name:"Indiana Tech",state:"IN",div:"NAIA"},{name:"Keiser University",state:"FL",div:"NAIA"},{name:"St. Thomas University",state:"FL",div:"NAIA"},{name:"Benedictine College",state:"KS",div:"NAIA"},{name:"Morningside",state:"IA",div:"NAIA"},
  {name:"Tyler Junior College",state:"TX",div:"NJCAA"},{name:"Eastern Florida State",state:"FL",div:"NJCAA"},{name:"Cowley College",state:"KS",div:"NJCAA"},{name:"Iowa Central CC",state:"IA",div:"NJCAA"},{name:"Monroe College",state:"NY",div:"NJCAA"},
];

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ HELPERS Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
const SUPA_URL = "https://jjgtgkqmxnlxkshykdxv.supabase.co";
const getPhotoUrl = (p) => !p?null:p.startsWith("http")?p:`${SUPA_URL}/storage/v1/object/public/avatars/${p}`;

const Avatar = ({ name, size=40, photoUrl }) => {
  const [err,setErr] = useState(false);
  const url = getPhotoUrl(photoUrl);
  if(url&&!err) return <img src={url} alt={name} onError={()=>setErr(true)} style={{ width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid rgba(255,255,255,0.08)" }}/>;
  const i=(name||"?").split(" ").map(n=>n[0]).slice(0,2).join("");
  const pal=["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6","#f97316"];
  const c=pal[(name||"A").charCodeAt(0)%pal.length];
  return <div style={{ width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${c}88,${c})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.34,fontWeight:700,color:"#fff",flexShrink:0,letterSpacing:-0.5 }}>{i}</div>;
};

const PhotoUpload = ({ currentUrl, onUpload, size=80 }) => {
  const ref=useRef(); const [uploading,setUploading]=useState(false); const [preview,setPreview]=useState(null);
  const upload = async (e) => {
    const file=e.target.files[0]; if(!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const filename=`${Date.now()}.${file.name.split(".").pop()}`;
      const {error}=await supabase.storage.from("avatars").upload(filename,file,{upsert:true});
      if(!error) onUpload(filename);
      else console.warn("Photo upload failed (non-blocking):", error.message);
    } catch(e) { console.warn("Photo upload error:", e); }
    setUploading(false);
  };
  const url=preview||getPhotoUrl(currentUrl);
  return (
    <div style={{ position:"relative",width:size,height:size,cursor:"pointer",flexShrink:0 }} onClick={()=>ref.current.click()}>
      {url?<img src={url} alt="" style={{ width:size,height:size,borderRadius:"50%",objectFit:"cover",border:"3px solid #e8e3db" }}/>
          :<div style={{ width:size,height:size,borderRadius:"50%",background:"#f0ebe3",border:"2px dashed #d1cfc7",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontSize:11,color:"#9ca3af",gap:3 }}><span style={{ fontSize:18 }}>+</span><span>Foto</span></div>}
      <div style={{ position:"absolute",bottom:2,right:2,width:20,height:20,background:uploading?"#f59e0b":"#6366f1",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff" }}>{uploading?"...":"Ã¢ÂÂ"}</div>
      <input ref={ref} type="file" accept="image/*" style={{ display:"none" }} onChange={upload}/>
    </div>
  );
};

const UniLogo = ({ name, logoUrl, size=36 }) => {
  const [err,setErr]=useState(false);
  const domainMap={"SMU":"smu.edu","UCLA":"ucla.edu","Stanford":"stanford.edu","University of Miami":"miami.edu","USC":"usc.edu","Cal Berkeley":"berkeley.edu","Texas A&M":"tamu.edu","FIU":"fiu.edu","FAU":"fau.edu","USF":"usf.edu","Duke":"duke.edu","Harvard":"harvard.edu","Notre Dame":"nd.edu","Georgetown":"georgetown.edu","Vanderbilt":"vanderbilt.edu","Wake Forest":"wfu.edu","Boston College":"bc.edu","Syracuse":"syr.edu","Alabama":"ua.edu","Auburn":"auburn.edu","Florida":"ufl.edu","Florida State":"fsu.edu","Georgia":"uga.edu","Texas":"utexas.edu","Ohio State":"osu.edu","Michigan":"umich.edu","Penn State":"psu.edu","Oregon":"uoregon.edu","Washington":"uw.edu","Clemson":"clemson.edu","LSU":"lsu.edu","TCU":"tcu.edu","Baylor":"baylor.edu","Rice":"rice.edu","BYU":"byu.edu","Virginia":"virginia.edu","Gonzaga":"gonzaga.edu","Villanova":"villanova.edu","Marquette":"marquette.edu","Arizona":"arizona.edu","Arizona State":"asu.edu","Arkansas":"uark.edu","Colorado":"colorado.edu","Connecticut":"uconn.edu","Georgia Tech":"gatech.edu","Indiana":"indiana.edu","Iowa":"uiowa.edu","Iowa State":"iastate.edu","Kansas":"ku.edu","Kansas State":"k-state.edu","Kentucky":"uky.edu","Maryland":"umd.edu","Michigan State":"msu.edu","Minnesota":"umn.edu","Missouri":"missouri.edu","Nebraska":"unl.edu","Rutgers":"rutgers.edu","NC State":"ncsu.edu","North Carolina":"unc.edu","Oklahoma":"ou.edu","Oklahoma State":"okstate.edu","Pittsburgh":"pitt.edu","South Carolina":"sc.edu","Tennessee":"utk.edu","Texas Tech":"ttu.edu","Utah":"utah.edu","Virginia Tech":"vt.edu","Washington State":"wsu.edu","West Virginia":"wvu.edu","Wisconsin":"wisc.edu","Harvard":"harvard.edu","Yale":"yale.edu","Northwestern":"northwestern.edu","Illinois":"illinois.edu","Houston":"uh.edu"};
  const url=!err&&logoUrl?getPhotoUrl(logoUrl):null;
  const d=!err&&!url&&Object.entries(domainMap).find(([k])=>name?.toLowerCase().includes(k.toLowerCase()))?.[1];
  const src=url||(d?`https://logo.clearbit.com/${d}`:null);
  if(src) return <img src={src} alt={name} onError={()=>setErr(true)} style={{ width:size,height:size,borderRadius:8,objectFit:"contain",background:"#fff",padding:2,flexShrink:0 }}/>;
  const ini=(name||"U").split(" ").map(w=>w[0]).slice(0,2).join("");
  return <div style={{ width:size,height:size,borderRadius:8,background:"linear-gradient(135deg,#1e3a8a,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.28,fontWeight:700,color:"#fff",flexShrink:0 }}>{ini}</div>;
};

// UI primitives
const Badge = ({ s }) => <span style={{ padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:600,background:`${STATUS_COLORS[s]}15`,color:STATUS_COLORS[s],border:`1px solid ${STATUS_COLORS[s]}30` }}>{s}</span>;
const OBadge = ({ s }) => <span style={{ padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:600,background:`${OFFER_COLORS[s]||"#6b7280"}15`,color:OFFER_COLORS[s]||"#6b7280",border:`1px solid ${OFFER_COLORS[s]||"#6b7280"}25` }}>{s}</span>;
const Tag = ({ label, color="#6b7280" }) => <span style={{ padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:500,background:`${color}10`,color,border:`1px solid ${color}20` }}>{label}</span>;
const Bar = ({ value, max, color="#6366f1", h=3 }) => <div style={{ width:"100%",background:"#e8e3db",borderRadius:99,height:h }}><div style={{ width:`${Math.min(100,max>0?(value/max)*100:0)}%`,background:color,height:"100%",borderRadius:99,transition:"width .4s" }}/></div>;
const Card = ({ children, style={} }) => <div style={{ background:"#f0ebe3",border:"1px solid #e8e3db",borderRadius:12,...style }}>{children}</div>;

const Stat = ({ label, value, sub, color="#6366f1" }) => (
  <div style={{ background:"#faf8f5",border:"1px solid #e8e3db",borderRadius:14,padding:"18px 20px",position:"relative",overflow:"hidden" }}>
    <div style={{ position:"absolute",top:-20,right:-20,width:70,height:70,background:`radial-gradient(circle,${color}18,transparent)`,borderRadius:"50%" }}/>
    <div style={{ fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:1.2,color:"#4b5563",marginBottom:10 }}>{label}</div>
    <div style={{ fontSize:26,fontWeight:800,color:"#1a1a2e",letterSpacing:-0.5,lineHeight:1 }}>{value}</div>
    {sub&&<div style={{ fontSize:11,color:color,marginTop:6,fontWeight:500 }}>{sub}</div>}
  </div>
);

// Icons
const I = {
  dash:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  players:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  fin:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h12"/><path d="M4 14h12"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/></svg>,
  uni:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  team:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  search:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  plus:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  back:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>,
  edit:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>,
  video:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  check:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>,
  x:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  share:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>,
  refresh:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  menu:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  link:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  copy:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
};

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ DB Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
const dbToPlayer = (row,offers=[],timeline=[]) => ({
  id:row.id,name:row.name,sport:row.sport||"FÃÂºtbol",nationality:row.nationality,age:row.age,
  position:row.position,foot:row.foot,height:row.height,weight:row.weight,
  status:row.status||"Prospecto",agent:row.agent,phone:row.phone,email:row.email,
  instagram:row.instagram,videoUrl:row.video_url,photoUrl:row.photo_url,
  gpa:row.gpa,satScore:row.sat_score,englishLevel:row.english_level,
  highSchool:row.high_school,graduationYear:row.graduation_year,major:row.major,
  toeflScore:row.toefl_score,university:row.university,state:row.state,
  scholarshipPct:row.scholarship_pct||0,startDate:row.start_date,contractEnd:row.contract_end,
  notes:row.notes,totalFee:row.total_fee||2700,payment1Amount:row.payment1_amount||900,payment2Amount:row.payment2_amount||1800,
  budget:row.budget||null,fafsa:row.fafsa||false,
  payment1:{paid:row.payment1_paid,paidBy:row.payment1_paid_by,date:row.payment1_date},
  payment2:{paid:row.payment2_paid,paidBy:row.payment2_paid_by,date:row.payment2_date},
  sportData:row.sport_data?(typeof row.sport_data==="string"?JSON.parse(row.sport_data):row.sport_data):{},
  offers:offers.map(o=>({id:o.id,university:o.university,state:o.state,division:o.division,scholarshipPct:o.scholarship_pct,amount:o.amount,season:o.season,status:o.status,notes:o.notes,logoUrl:o.logo_url})),
  timeline:timeline.map(t=>({id:t.id,date:t.date,event:t.event,type:t.type})),
});
const playerToDb = (p) => ({
  name:p.name,sport:p.sport,nationality:p.nationality,age:p.age||null,position:p.position,foot:p.foot,
  height:p.height||null,weight:p.weight||null,status:p.status,agent:p.agent,phone:p.phone,email:p.email,
  instagram:p.instagram,video_url:p.videoUrl,photo_url:p.photoUrl||null,
  gpa:p.gpa||null,sat_score:p.satScore||null,english_level:p.englishLevel,
  high_school:p.highSchool,graduation_year:p.graduationYear||null,major:p.major,
  toefl_score:p.toeflScore||null,university:p.university,state:p.state,
  scholarship_pct:p.scholarshipPct||0,start_date:p.startDate||null,contract_end:p.contractEnd||null,notes:p.notes,
  total_fee:p.totalFee||2700,payment1_amount:p.payment1Amount||900,payment2_amount:p.payment2Amount||1800,
  budget:p.budget||null,fafsa:p.fafsa||false,
  payment1_paid:p.payment1?.paid||false,payment1_paid_by:p.payment1?.paidBy||null,payment1_date:p.payment1?.date||null,
  payment2_paid:p.payment2?.paid||false,payment2_paid_by:p.payment2?.paidBy||null,payment2_date:p.payment2?.date||null,
  sport_data:p.sportData?JSON.stringify(p.sportData):null,
});

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ PUBLIC PROFILE (ENGLISH) Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
const PublicProfile = ({ player, onClose }) => {
  const [copied,setCopied]=useState(false);
  const url=`${window.location.origin}?player=${player.id}`;
  const copy=()=>{ navigator.clipboard.writeText(url); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const sd=player.sportData||{};
  const sportFields=SPORT_FIELDS[player.sport]||[];
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:16,overflowY:"auto" }}>
      <div style={{ background:"#ffffff",border:"1px solid #e0dbd3",borderRadius:20,width:"100%",maxWidth:540,maxHeight:"92vh",overflowY:"auto" }}>
        <div style={{ background:"linear-gradient(135deg,#0d1117 0%,#0f1320 100%)",padding:"24px 26px 20px",borderRadius:"20px 20px 0 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
            <img src="/logo.png" alt="FUA" style={{ height:30,objectFit:"contain" }} onError={e=>e.target.style.display="none"}/>
            <button onClick={onClose} style={{ background:"#e8e3db",border:"none",color:"#6b7280",cursor:"pointer",width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center" }}>{I.x}</button>
          </div>
          <div style={{ display:"flex",gap:16,alignItems:"center" }}>
            <Avatar name={player.name} size={72} photoUrl={player.photoUrl}/>
            <div>
              <h2 style={{ margin:0,fontSize:22,fontWeight:800,color:"#1a1a2e",letterSpacing:-0.5 }}>{player.name}</h2>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginTop:8 }}>
                <Tag label={player.sport} color="#6366f1"/>
                {player.position&&<Tag label={player.position} color="#8b5cf6"/>}
                {player.nationality&&<Tag label={player.nationality} color="#3b82f6"/>}
                {player.age&&<Tag label={`${player.age} yrs`} color="#6b7280"/>}
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding:"20px 26px 26px",display:"flex",flexDirection:"column",gap:14 }}>
          {player.videoUrl&&(
            <a href={player.videoUrl} target="_blank" rel="noreferrer" style={{ display:"flex",alignItems:"center",gap:14,padding:"16px 18px",background:"linear-gradient(135deg,rgba(239,68,68,0.1),rgba(239,68,68,0.05))",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,textDecoration:"none" }}>
              <div style={{ width:42,height:42,background:"#ef4444",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#fff" }}>{I.video}</div>
              <div style={{ flex:1 }}><div style={{ fontSize:14,fontWeight:700,color:"#1a1a2e" }}>Watch Highlight Video</div><div style={{ fontSize:12,color:"#6b7280",marginTop:2 }}>Full athletic performance reel</div></div>
              <span style={{ color:"#f87171",fontSize:18 }}>Ã¢ÂÂ</span>
            </a>
          )}
          <div style={{ background:"#faf8f5",borderRadius:12,padding:"16px 18px",border:"1px solid #ede8e0" }}>
            <div style={{ fontSize:10,fontWeight:700,color:"#4b5563",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12 }}>Academic Profile</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12 }}>
              {[["GPA",player.gpa||"Ã¢ÂÂ",player.gpa>=3.5?"#10b981":player.gpa>=3?"#f59e0b":"#9ca3af"],["SAT",player.satScore||"Ã¢ÂÂ","#6366f1"],["TOEFL",player.toeflScore||"Ã¢ÂÂ","#8b5cf6"],["English",player.englishLevel||"Ã¢ÂÂ","#3b82f6"]].map(([l,v,c])=>(
                <div key={l} style={{ background:"#f5f0e8",borderRadius:10,padding:"10px 8px",textAlign:"center" }}>
                  <div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:1,marginBottom:5,fontWeight:600 }}>{l}</div>
                  <div style={{ fontSize:18,fontWeight:800,color:c }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {[["High School",player.highSchool],["Graduation",player.graduationYear],["Intended Major",player.major],["English Level",player.englishLevel]].filter(([,v])=>v).map(([l,v])=>(
                <div key={l}><div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3,fontWeight:600 }}>{l}</div><div style={{ fontSize:12,color:"#374151",fontWeight:600 }}>{v}</div></div>
              ))}
            </div>
          </div>
          <div style={{ background:"#faf8f5",borderRadius:12,padding:"16px 18px",border:"1px solid #ede8e0" }}>
            <div style={{ fontSize:10,fontWeight:700,color:"#4b5563",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12 }}>Athletic Profile</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {[["Sport",player.sport],["Position",player.position],["Height",player.height?player.height+" cm":"Ã¢ÂÂ"],["Weight",player.weight?player.weight+" kg":"Ã¢ÂÂ"]].map(([l,v])=>(
                <div key={l}><div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3,fontWeight:600 }}>{l}</div><div style={{ fontSize:12,color:"#374151",fontWeight:600 }}>{v||"Ã¢ÂÂ"}</div></div>
              ))}
            </div>
          </div>
          {sportFields.length>0&&Object.keys(sd).length>0&&(
            <div style={{ background:"rgba(99,102,241,0.04)",borderRadius:12,padding:"16px 18px",border:"1px solid rgba(99,102,241,0.1)" }}>
              <div style={{ fontSize:10,fontWeight:700,color:"#4b5563",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12 }}>{player.sport} Stats</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                {sportFields.filter(([,k])=>sd[k]||(k==="height"&&player.height)||(k==="weight"&&player.weight)).map(([l,k])=>{
                  const v=(k==="foot"||k==="height"||k==="weight")?player[k]:sd[k];
                  if(!v) return null;
                  return <div key={k}><div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3,fontWeight:600 }}>{l}</div><div style={{ fontSize:12,color:"#818cf8",fontWeight:700 }}>{v}</div></div>;
                })}
              </div>
            </div>
          )}
          <div style={{ background:"rgba(99,102,241,0.05)",border:"1px solid rgba(99,102,241,0.12)",borderRadius:12,padding:"14px 16px" }}>
            <div style={{ fontSize:10,fontWeight:700,color:"#4b5563",textTransform:"uppercase",letterSpacing:1.2,marginBottom:8 }}>Share Profile Link</div>
            <div style={{ display:"flex",gap:8 }}>
              <div style={{ flex:1,background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"8px 10px",fontSize:11,color:"#6b7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{url}</div>
              <button onClick={copy} style={{ display:"flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:8,border:"none",background:copied?"#10b981":"#6366f1",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap" }}>{I.copy} {copied?"Copied!":"Copy"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ PAYMENT ROW Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
const PaymentRow = ({ label, amount, payment, onToggle, agents }) => (
  <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:payment.paid?"rgba(16,185,129,0.04)":"rgba(245,158,11,0.03)",borderRadius:10,border:`1px solid ${payment.paid?"rgba(16,185,129,0.15)":"rgba(245,158,11,0.12)"}` }}>
    <div style={{ width:28,height:28,borderRadius:8,background:payment.paid?"rgba(16,185,129,0.15)":"rgba(245,158,11,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
      {payment.paid?<span style={{ color:"#10b981" }}>{I.check}</span>:<span style={{ color:"#f59e0b",fontSize:12 }}>!</span>}
    </div>
    <div style={{ flex:1 }}>
      <div style={{ fontSize:13,fontWeight:600,color:"#374151" }}>{label} <span style={{ color:"#1a1a2e",fontWeight:800 }}>{amount}Ã¢ÂÂ¬</span></div>
      {payment.paid?<div style={{ fontSize:11,color:"#6b7280",marginTop:2 }}>Cobrado por <span style={{ color:"#818cf8",fontWeight:700 }}>{payment.paidBy}</span> ÃÂ· {payment.date}</div>:<div style={{ fontSize:11,color:"#f59e0b",marginTop:2 }}>Pendiente de cobro</div>}
    </div>
    <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
      {!payment.paid&&(agents||[]).map(a=><button key={a} onClick={()=>onToggle(a)} style={{ padding:"5px 10px",borderRadius:7,border:"1px solid rgba(99,102,241,0.3)",background:"rgba(99,102,241,0.1)",color:"#818cf8",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit" }}>Ã¢ÂÂ {a.split(" ")[0]}</button>)}
      {payment.paid&&<button onClick={()=>onToggle(null)} style={{ padding:"5px 10px",borderRadius:7,border:"1px solid #e0dbd3",background:"none",color:"#6b7280",cursor:"pointer",fontSize:11,fontFamily:"inherit" }}>Deshacer</button>}
    </div>
  </div>
);

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ MODALS Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
const Modal = ({ title, onClose, children, maxWidth=640 }) => (
  <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }}>
    <div style={{ background:"#ffffff",border:"1px solid #e8e3db",borderRadius:16,width:"100%",maxWidth,maxHeight:"92vh",overflowY:"auto" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px 0" }}>
        <h2 style={{ margin:0,fontSize:17,fontWeight:700,color:"#1a1a2e" }}>{title}</h2>
        <button onClick={onClose} style={{ background:"#e8e3db",border:"none",color:"#6b7280",cursor:"pointer",width:28,height:28,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center" }}>{I.x}</button>
      </div>
      <div style={{ padding:"18px 24px 24px" }}>{children}</div>
    </div>
  </div>
);

const inp = { background:"#f0ebe3",border:"1px solid #e0dbd3",borderRadius:8,padding:"9px 12px",color:"#1a1a2e",fontSize:13,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"inherit" };
const lbl = { fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:5,display:"block" };
const Sec = ({ t, c }) => <div style={{ fontSize:10,fontWeight:700,color:c,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${c}15` }}>{t}</div>;
const G2 = ({ children }) => <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>{children}</div>;
const Btn = ({ onClick, children, variant="primary", disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding:"10px 16px",borderRadius:9,border:variant==="ghost"?"1px solid rgba(255,255,255,0.08)":"none",background:variant==="primary"?"linear-gradient(135deg,#6366f1,#8b5cf6)":variant==="danger"?"rgba(239,68,68,0.1)":"none",color:variant==="danger"?"#ef4444":"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",opacity:disabled?0.6:1,width:"100%",borderColor:variant==="danger"?"rgba(239,68,68,0.2)":undefined }}>
    {children}
  </button>
);
const Field = ({ l, k, form, set, type="text", opts, sd=false }) => (
  <div><label style={lbl}>{l}</label>
    {opts?<select style={{ ...inp,cursor:"pointer" }} value={sd?form.sportData?.[k]||"":form[k]||""} onChange={e=>sd?set("sportData",{...form.sportData,[k]:e.target.value}):set(k,e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select>
        :<input style={inp} type={type} value={sd?form.sportData?.[k]||"":form[k]||""} onChange={e=>sd?set("sportData",{...form.sportData,[k]:e.target.value}):set(k,e.target.value)} placeholder={l}/>}
  </div>
);

const PlayerModal = ({ initial, onClose, onSave, agentList }) => {
  const blank = { name:"",sport:"Soccer",nationality:"",age:"",position:"",foot:"Right",height:"",weight:"",status:"Prospect",agent:agentList[0]||"",phone:"",email:"",instagram:"",videoUrl:"",photoUrl:"",gpa:"",satScore:"",englishLevel:"B2",highSchool:"",graduationYear:"",major:"",toeflScore:"",university:"",state:"",scholarshipPct:0,startDate:"",contractEnd:"",notes:"",totalFee:2700,payment1Amount:900,payment2Amount:1800,budget:"",fafsa:false,sportData:{} };
  const [form,setForm]=useState(initial?{...blank,...initial,sportData:initial.sportData||{}}:blank);
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const sf=SPORT_FIELDS[form.sport]||[];
  const save=async()=>{
    if(!form.name.trim()) return; setSaving(true);
      try {
    await onSave({...form,id:form.id||undefined,age:parseInt(form.age)||0,height:parseInt(form.height)||0,weight:parseInt(form.weight)||0,gpa:parseFloat(form.gpa)||0,satScore:parseInt(form.satScore)||null,toeflScore:parseInt(form.toeflScore)||null,scholarshipPct:parseInt(form.scholarshipPct)||0,totalFee:parseFloat(form.totalFee)||2700,payment1Amount:parseFloat(form.payment1Amount)||900,payment2Amount:parseFloat(form.payment2Amount)||1800,budget:parseFloat(form.budget)||null,fafsa:form.fafsa||false});
      } catch(e) {
        setError("Error al guardar. Inténtalo de nuevo.");
        console.error(e);
      } finally {
        setSaving(false);
      }
  };
  return (
    <Modal title={initial?"Edit Athlete":"New Athlete"} onClose={onClose} maxWidth={680}>
      <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <PhotoUpload currentUrl={form.photoUrl} onUpload={u=>set("photoUrl",u)} size={72}/>
          <div style={{ fontSize:12,color:"#6b7280" }}>Click to upload athlete photo</div>
        </div>
        <div><Sec t="Personal Information" c="#6366f1"/><G2><Field l="Full Name" k="name" form={form} set={set}/><Field l="Nationality" k="nationality" form={form} set={set}/><Field l="Age" k="age" form={form} set={set} type="number"/><Field l="Email" k="email" form={form} set={set} type="email"/><Field l="Phone" k="phone" form={form} set={set}/><Field l="Instagram" k="instagram" form={form} set={set}/></G2></div>
        <div><Sec t="Athletic Information" c="#10b981"/>
          <G2>
            <div><label style={lbl}>Sport</label><select style={{ ...inp,cursor:"pointer" }} value={form.sport} onChange={e=>{ const s=e.target.value; setForm(f=>({...f,sport:s,position:(POSITIONS_BY_SPORT[s]||[])[0]||""})); }}>{SPORTS.slice(1).map(o=><option key={o}>{o}</option>)}</select></div>
            <div><label style={lbl}>Position</label><select style={{ ...inp,cursor:"pointer" }} value={form.position||""} onChange={e=>set("position",e.target.value)}>{(POSITIONS_BY_SPORT[form.sport]||[]).map(o=><option key={o}>{o}</option>)}</select></div>
            <Field l="Assigned Agent" k="agent" form={form} set={set} opts={agentList}/>
            <Field l="Status" k="status" form={form} set={set} opts={STATUSES.slice(1)}/>
            <div style={{ gridColumn:"1/-1" }}><label style={lbl}>Highlight Video Link</label><input style={inp} type="url" value={form.videoUrl||""} onChange={e=>set("videoUrl",e.target.value)} placeholder="https://youtube.com/..."/></div>
            <Field l="Target University" k="university" form={form} set={set}/>
            <Field l="US State" k="state" form={form} set={set}/>
            <div><label style={lbl}>Scholarship %</label><input style={inp} type="number" min="0" max="100" value={form.scholarshipPct||0} onChange={e=>set("scholarshipPct",e.target.value)}/></div>
          </G2>
        </div>
        {sf.length>0&&<div><Sec t={`${form.sport} Statistics`} c="#f59e0b"/><G2>{sf.map(([l,k,t])=>{
          const isBase=k==="foot"||k==="height"||k==="weight";
          return Array.isArray(t)?<Field key={k} l={l} k={k} form={form} set={set} opts={t} sd={!isBase}/>:<Field key={k} l={l} k={k} form={form} set={set} type={t||"text"} sd={!isBase}/>;
        })}</G2></div>}
        <div><Sec t="Academic Information" c="#8b5cf6"/><G2><Field l="High School" k="highSchool" form={form} set={set}/><Field l="Graduation Year" k="graduationYear" form={form} set={set} type="number"/><Field l="GPA (0-4.0)" k="gpa" form={form} set={set} type="number"/><Field l="SAT Score" k="satScore" form={form} set={set} type="number"/><Field l="TOEFL Score" k="toeflScore" form={form} set={set} type="number"/><Field l="English Level" k="englishLevel" form={form} set={set} opts={["A1","A2","B1","B2","C1","C2","Native"]}/><div style={{ gridColumn:"1/-1" }}><label style={lbl}>Intended Major</label><input style={inp} value={form.major||""} onChange={e=>set("major",e.target.value)} placeholder="Business Administration, Kinesiology..."/></div></G2></div>
        <div><Sec t="Financial Information" c="#10b981"/><div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <div><label style={lbl}>Annual Budget max ($)</label><input style={inp} type="number" value={form.budget||""} onChange={e=>set("budget",e.target.value)} placeholder="e.g. 30000"/></div>
          <div style={{ display:"flex",flexDirection:"column",justifyContent:"flex-end" }}>
            <label style={lbl}>FAFSA Eligible</label>
            <div onClick={()=>set("fafsa",!form.fafsa)} style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"9px 12px",background:form.fafsa?"rgba(16,185,129,0.1)":"rgba(255,255,255,0.04)",border:`1px solid ${form.fafsa?"rgba(16,185,129,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:8 }}>
              <div style={{ width:18,height:18,borderRadius:4,background:form.fafsa?"#10b981":"transparent",border:`2px solid ${form.fafsa?"#10b981":"rgba(255,255,255,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff" }}>{form.fafsa?"Ã¢ÂÂ":""}</div>
              <span style={{ fontSize:13,color:form.fafsa?"#10b981":"#9ca3af",fontWeight:600 }}>{form.fafsa?"Yes Ã¢ÂÂ FAFSA Eligible":"Not FAFSA Eligible"}</span>
            </div>
          </div>
        </div></div>
        <div><Sec t="Payment Structure" c="#6366f1"/><div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}><div><label style={lbl}>Total Fee (Ã¢ÂÂ¬)</label><input style={inp} type="number" value={form.totalFee||2700} onChange={e=>set("totalFee",e.target.value)}/></div><div><label style={lbl}>First Payment (Ã¢ÂÂ¬)</label><input style={inp} type="number" value={form.payment1Amount||900} onChange={e=>set("payment1Amount",e.target.value)}/></div><div><label style={lbl}>Second Payment (Ã¢ÂÂ¬)</label><input style={inp} type="number" value={form.payment2Amount||1800} onChange={e=>set("payment2Amount",e.target.value)}/></div></div></div>
        <div><label style={lbl}>Internal Notes</label><textarea style={{ ...inp,minHeight:70,resize:"vertical" }} value={form.notes||""} onChange={e=>set("notes",e.target.value)} placeholder="Follow-up notes, observations..."/></div>
        <div style={{ display:"flex",gap:10 }}><div style={{ flex:1 }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn></div><div style={{ flex:2 }}><Btn onClick={save} disabled={saving}>{saving?"Saving...":initial?"Save Changes":"Create Profile"}</Btn></div></div>
      </div>
    </Modal>
  );
};

const OfferModal = ({ onClose, onAdd }) => {
  const [f,setF]=useState({ university:"",state:"",division:"NCAA D1",scholarshipPct:"",amount:"",season:"Fall 27",status:"Interesada",notes:"",logoUrl:"" });
  const [search,setSearch]=useState(""); const [saving,setSaving]=useState(false);
  const allUnis = getAllUniversities();
  const filtered=search.length>1?allUnis.filter(u=>u.name.toLowerCase().includes(search.toLowerCase())).slice(0,10):[];
  return (
    <Modal title="Nueva oferta universitaria" onClose={onClose} maxWidth={480}>
      <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
        <div><label style={lbl}>Buscar universidad</label>
          <input style={inp} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Escribe para buscar... Alabama, Florida, Stanford..."/>
          {filtered.length>0&&<div style={{ background:"#f0ebe3",border:"1px solid #e8e3db",borderRadius:9,marginTop:4,overflow:"hidden",maxHeight:200,overflowY:"auto" }}>
            {filtered.map(u=><div key={u.name+u.division} onClick={()=>{ setF(p=>({...p,university:u.name,division:u.division})); setSearch(""); }} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
              <UniLogo name={u.name} size={24}/><div><div style={{ fontSize:13,fontWeight:600,color:"#1a1a2e" }}>{u.name}</div><div style={{ fontSize:10,color:"#6b7280" }}>{u.division}</div></div>
            </div>)}
          </div>}
          {f.university&&!search&&<div style={{ marginTop:8,display:"flex",alignItems:"center",gap:8 }}><UniLogo name={f.university} logoUrl={f.logoUrl} size={24}/><span style={{ fontSize:13,fontWeight:600,color:"#10b981" }}>Ã¢ÂÂ {f.university}</span><button onClick={()=>setF(p=>({...p,university:"",division:"NCAA D1"}))} style={{ background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:11,fontFamily:"inherit" }}>cambiar</button></div>}
        </div>
        {!f.university&&<div><label style={lbl}>O escribe manualmente</label><input style={inp} value={f.university} onChange={e=>setF(p=>({...p,university:e.target.value}))} placeholder="Nombre universidad"/></div>}
        <G2>
          <div><label style={lbl}>Estado USA</label><input style={inp} value={f.state} onChange={e=>setF(p=>({...p,state:e.target.value}))} placeholder="TX, FL..."/></div>
          <div><label style={lbl}>DivisiÃÂ³n</label><select style={{ ...inp,cursor:"pointer" }} value={f.division} onChange={e=>setF(p=>({...p,division:e.target.value}))}>{DIVISIONS.map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label style={lbl}>% Beca</label><input style={inp} type="number" min="0" max="100" value={f.scholarshipPct} onChange={e=>setF(p=>({...p,scholarshipPct:e.target.value}))}/></div>
          <div><label style={lbl}>Importe anual (Ã¢ÂÂ¬)</label><input style={inp} type="number" value={f.amount} onChange={e=>setF(p=>({...p,amount:e.target.value}))} placeholder="20000"/></div>
          <div><label style={lbl}>Temporada</label><select style={{ ...inp,cursor:"pointer" }} value={f.season} onChange={e=>setF(p=>({...p,season:e.target.value}))}>{SEASONS.map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label style={lbl}>Estado</label><select style={{ ...inp,cursor:"pointer" }} value={f.status} onChange={e=>setF(p=>({...p,status:e.target.value}))}>{OFFER_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div style={{ gridColumn:"1/-1" }}><label style={lbl}>Logo (opcional)</label><PhotoUpload currentUrl={f.logoUrl} onUpload={u=>setF(p=>({...p,logoUrl:u}))} size={44}/></div>
          <div style={{ gridColumn:"1/-1" }}><label style={lbl}>Notas</label><input style={inp} value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Detalles..."/></div>
        </G2>
        <div style={{ display:"flex",gap:10,marginTop:6 }}><div style={{ flex:1 }}><Btn variant="ghost" onClick={onClose}>Cancelar</Btn></div><div style={{ flex:2 }}><Btn onClick={async()=>{ if(f.university&&!saving){ setSaving(true); await onAdd({...f,scholarshipPct:parseInt(f.scholarshipPct)||0,amount:parseFloat(f.amount)||null}); setSaving(false); onClose(); }}} disabled={saving}>{saving?"Guardando...":"AÃÂ±adir oferta"}</Btn></div></div>
      </div>
    </Modal>
  );
};

const AgentModal = ({ initial, onClose, onSave }) => {
  const [form,setForm]=useState(initial||{ name:"",role:"Reclutador",email:"",phone:"",photoUrl:"",region:"global" });
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=async()=>{ 
    if(!form.name.trim()) return; 
    setSaving(true); 
      try {
      await onSave(form); 
      onClose(); 
    } catch(e) { 
      console.error(e);
      const msg = e?.message||JSON.stringify(e)||"Error desconocido";
      alert("Error al guardar: " + msg);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title={initial?"Editar miembro":"Nuevo miembro"} onClose={onClose} maxWidth={420}>
      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
        <div><label style={lbl}>Nombre completo *</label><input style={inp} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Nombre completo..."/></div>
        <div><label style={lbl}>Cargo / Rol</label>
          <select style={{ ...inp,cursor:"pointer" }} value={form.role} onChange={e=>set("role",e.target.value)}>
            <option value="Reclutador">Reclutador</option>
            <option value="Director LATAM">Director LATAM</option>
            <option value="Director FUA Sports">Director FUA Sports</option>
            <option value="Scout">Scout</option>
            <option value="Closer">Closer</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div><label style={lbl}>Region</label>
          <select style={{ ...inp,cursor:"pointer" }} value={form.region||"global"} onChange={e=>set("region",e.target.value)}>
            <option value="global">Global (todas las regiones)</option>
            <option value="latam">LATAM (Latinoamerica)</option>
            <option value="europe">Europa</option>
            <option value="usa">USA</option>
          </select>
        </div>
        <div><label style={lbl}>Email Gmail (para acceso al CRM)</label><input style={inp} type="email" value={form.email||""} onChange={e=>set("email",e.target.value)} placeholder="gmail@gmail.com"/></div>
        <div><label style={lbl}>Telefono / WhatsApp</label><input style={inp} value={form.phone||""} onChange={e=>set("phone",e.target.value)} placeholder="+34 ..."/></div>
        <div style={{ background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:9,padding:"10px 14px",fontSize:12,color:"#6366f1" }}>
          Accede al CRM con su Gmail en: <strong>{window.location.origin}</strong>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:6 }}>
          <div style={{ flex:1 }}><Btn variant="ghost" onClick={onClose}>Cancelar</Btn></div>
          <div style={{ flex:2 }}><Btn onClick={save} disabled={saving||!form.name.trim()}>{saving?"Guardando...":initial?"Guardar":"Crear miembro"}</Btn></div>
        </div>
      </div>
    </Modal>
  );
};

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ PLAYER DETAIL Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
const PlayerDetail = ({ player, onBack, onRefresh, agentList, onGenerateToken }) => {
  const [tab,setTab]=useState("profile");
  const [editModal,setEditModal]=useState(false);
  const [offerModal,setOfferModal]=useState(false);
  const [publicModal,setPublicModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [tokenCopied,setTokenCopied]=useState(false);
  const [generatedLink,setGeneratedLink]=useState(null);
  const [localToken,setLocalToken]=useState(player.access_token||null);
  const [playerDocs,setPlayerDocs]=useState([]);
  const paid=(player.payment1?.paid?(player.payment1Amount||900):0)+(player.payment2?.paid?(player.payment2Amount||1800):0);
  const totalFee=player.totalFee||2700;
  const sd=player.sportData||{};
  const sf=SPORT_FIELDS[player.sport]||[];
  const portalUrl = localToken ? `${window.location.origin}?athlete=${localToken}` : null;

  useEffect(()=>{
    const loadDocs = async () => {
      const {data} = await supabase.from("documents").select("*").eq("player_id",player.id);
      setPlayerDocs(data||[]);
    };
    loadDocs();
  },[player.id]);

  const handlePayment=async(num,agent)=>{ setSaving(true); try { const date=agent?new Date().toISOString().split("T")[0]:null; const dbU=num===1?{payment1_paid:!!agent,payment1_paid_by:agent,payment1_date:date}:{payment2_paid:!!agent,payment2_paid_by:agent,payment2_date:date}; await supabase.from("players").update(dbU).eq("id",player.id); if(agent) await supabase.from("timeline").insert({player_id:player.id,date,event:`${num===1?`Pago inicial (${player.payment1Amount||900}Ã¢ÂÂ¬)`:`Segundo pago (${player.payment2Amount||1800}Ã¢ÂÂ¬)`} cobrado por ${agent}`,type:"payment"}); await onRefresh(); } catch(e){ setError("Error al guardar. Inténtalo de nuevo."); console.error(e); } finally { setSaving(false); } };
  const addOffer=async(o)=>{ await supabase.from("offers").insert({player_id:player.id,university:o.university,state:o.state,division:o.division,scholarship_pct:o.scholarshipPct,amount:o.amount,season:o.season,status:o.status,notes:o.notes,logo_url:o.logoUrl||null}); await onRefresh(); };
  const updateOfferStatus=async(id,status)=>{ await supabase.from("offers").update({status}).eq("id",id); await onRefresh(); };
  const removeOffer=async(id)=>{ await supabase.from("offers").delete().eq("id",id); await onRefresh(); };

  const tabs=[{id:"profile",l:"Perfil"},{id:"sports",l:"Deportivo"},{id:"academic",l:"AcadÃÂ©mico"},{id:"offers",l:`Ofertas (${player.offers?.length||0})`},{id:"payments",l:"Pagos"},{id:"admission",l:"Proceso"},{id:"documents",l:`Docs (${playerDocs.length}/${REQUIRED_DOCS.length})`},{id:"timeline",l:"Historial"}];
  const tlC={contact:"#6366f1",contract:"#8b5cf6",milestone:"#10b981",achievement:"#f59e0b",payment:"#22c55e"};
  const tlE={contact:"Ã°ÂÂÂ",contract:"Ã¢ÂÂÃ¯Â¸Â",milestone:"Ã°ÂÂÂ¯",achievement:"Ã°ÂÂÂ",payment:"Ã°ÂÂÂ°"};

  const InfoCard = ({ label, value, color }) => (
    <div style={{ background:"#fff",border:"1px solid #e8e3db",borderRadius:10,padding:"14px 16px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize:10,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:14,color:color||"#1a1a2e",fontWeight:600,lineHeight:1.3 }}>{value||<span style={{ color:"#d1d5db" }}>Ã¢ÂÂ</span>}</div>
    </div>
  );

  return (
    <div>
      {/* Top bar */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,gap:8,flexWrap:"wrap" }}>
        <button onClick={onBack} style={{ display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:13,padding:0,fontFamily:"inherit",fontWeight:500 }}>{I.back} Volver</button>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
          <button onClick={()=>setPublicModal(true)} style={{ padding:"7px 14px",borderRadius:8,border:"1px solid #e8e3db",background:"#fff",color:"#374151",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit" }}>Compartir perfil</button>
          <button onClick={()=>setEditModal(true)} style={{ padding:"7px 14px",borderRadius:8,border:"1px solid #e8e3db",background:"#fff",color:"#374151",cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:500 }}>Editar</button>
          <button onClick={async()=>{ if(window.confirm(`Eliminar a ${player.name}?`)){ await supabase.from("offers").delete().eq("player_id",player.id); await supabase.from("timeline").delete().eq("player_id",player.id); await supabase.from("players").delete().eq("id",player.id); await onRefresh(); onBack(); }}} style={{ padding:"7px 14px",borderRadius:8,border:"1px solid #fecaca",background:"none",color:"#ef4444",cursor:"pointer",fontSize:12,fontFamily:"inherit" }}>Eliminar</button>
        </div>
      </div>

      {/* Hero card */}
      <div style={{ background:"#fff",border:"1px solid #e8e3db",borderRadius:16,padding:"24px",marginBottom:16,boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex",gap:18,alignItems:"flex-start",flexWrap:"wrap" }}>
          <Avatar name={player.name} size={80} photoUrl={player.photoUrl}/>
          <div style={{ flex:1,minWidth:200 }}>
            <div style={{ display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:8 }}>
              <h1 style={{ margin:0,fontSize:24,fontWeight:800,color:"#1a1a2e",letterSpacing:-0.5 }}>{player.name}</h1>
              <Badge s={player.status}/>
            </div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:12 }}>
              {player.sport&&<span style={{ padding:"4px 12px",borderRadius:20,background:"rgba(99,102,241,0.1)",color:"#6366f1",fontSize:12,fontWeight:600,border:"1px solid rgba(99,102,241,0.2)" }}>{player.sport}</span>}
              {player.position&&<span style={{ padding:"4px 12px",borderRadius:20,background:"rgba(139,92,246,0.08)",color:"#8b5cf6",fontSize:12,fontWeight:600,border:"1px solid rgba(139,92,246,0.15)" }}>{player.position}</span>}
              {player.nationality&&<span style={{ padding:"4px 12px",borderRadius:20,background:"#f9f7f4",color:"#6b7280",fontSize:12,fontWeight:500,border:"1px solid #e8e3db" }}>{player.nationality}</span>}
              {player.age&&<span style={{ padding:"4px 12px",borderRadius:20,background:"#f9f7f4",color:"#6b7280",fontSize:12,fontWeight:500,border:"1px solid #e8e3db" }}>{player.age} aÃÂ±os</span>}
              {player.agent&&<span style={{ padding:"4px 12px",borderRadius:20,background:"rgba(16,185,129,0.08)",color:"#10b981",fontSize:12,fontWeight:600,border:"1px solid rgba(16,185,129,0.15)" }}>Agente: {player.agent}</span>}
            </div>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap",alignItems:"center" }}>
              <div style={{ padding:"6px 14px",borderRadius:8,background:paid>=totalFee?"rgba(16,185,129,0.08)":paid>0?"rgba(245,158,11,0.06)":"rgba(239,68,68,0.06)",border:`1px solid ${paid>=totalFee?"rgba(16,185,129,0.2)":paid>0?"rgba(245,158,11,0.2)":"rgba(239,68,68,0.15)"}` }}>
                <span style={{ fontSize:13,fontWeight:700,color:paid>=totalFee?"#10b981":paid>0?"#f59e0b":"#ef4444" }}>{paid>=totalFee?`Pagado ${totalFee}Ã¢ÂÂ¬`:`${paid}Ã¢ÂÂ¬ / ${totalFee}Ã¢ÂÂ¬`}</span>
              </div>
              {player.scholarshipPct>0&&<div style={{ padding:"6px 14px",borderRadius:8,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.15)" }}><span style={{ fontSize:13,fontWeight:700,color:"#6366f1" }}>Beca {player.scholarshipPct}%</span></div>}
              {player.videoUrl&&<a href={player.videoUrl} target="_blank" rel="noreferrer" style={{ padding:"6px 14px",borderRadius:8,background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",textDecoration:"none",color:"#ef4444",fontSize:12,fontWeight:600 }}>Ver video</a>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:2,marginBottom:16,background:"#f5f0e8",borderRadius:12,padding:4,overflowX:"auto" }}>
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"8px 16px",borderRadius:9,border:"none",cursor:"pointer",fontSize:13,fontWeight:tab===t.id?600:400,whiteSpace:"nowrap",background:tab===t.id?"#fff":"none",color:tab===t.id?"#1a1a2e":"#9ca3af",fontFamily:"inherit",boxShadow:tab===t.id?"0 1px 4px rgba(0,0,0,0.08)":"none" }}>{t.l}</button>)}
      </div>

      {tab==="profile"&&<div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10,marginBottom:12 }}>
          {[["Email",player.email],["Telefono",player.phone],["Instagram",player.instagram],["Nacionalidad",player.nationality],["Edad",player.age?`${player.age} aÃÂ±os`:null],["Agente",player.agent]].map(([l,v])=><InfoCard key={l} label={l} value={v}/>)}
        </div>
        {player.videoUrl&&<div style={{ background:"#fff",border:"1px solid rgba(239,68,68,0.15)",borderRadius:12,padding:"14px 18px",marginBottom:10 }}>
          <div style={{ fontSize:10,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:600 }}>Video highlight</div>
          <a href={player.videoUrl} target="_blank" rel="noreferrer" style={{ color:"#ef4444",textDecoration:"none",fontSize:13,fontWeight:600 }}>{player.videoUrl}</a>
        </div>}
        {player.notes&&<div style={{ background:"#fff",border:"1px solid #e8e3db",borderRadius:12,padding:"14px 18px" }}>
          <div style={{ fontSize:10,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8,fontWeight:600 }}>Notas internas</div>
          <div style={{ fontSize:14,color:"#374151",lineHeight:1.7 }}>{player.notes}</div>
        </div>}
      </div>}

      {tab==="sports"&&<div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10,marginBottom:14 }}>
          {[["Deporte",player.sport],["Posicion",player.position],["Altura",player.height?`${player.height} cm`:null],["Peso",player.weight?`${player.weight} kg`:null],["Universidad",player.university],["Beca",player.scholarshipPct?`${player.scholarshipPct}%`:null]].map(([l,v])=><InfoCard key={l} label={l} value={v} color={l==="Beca"?"#6366f1":undefined}/>)}
        </div>
        {sf.length>0&&<div>
          <div style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:10 }}>{player.sport} Ã¢ÂÂ Estadisticas</div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10 }}>
            {sf.map(([l,k])=>{ const v=(k==="foot"||k==="height"||k==="weight")?player[k]:sd[k]; if(!v) return null; return <InfoCard key={k} label={l} value={v} color="#6366f1"/>; })}
          </div>
        </div>}
      </div>}

      {tab==="academic"&&<div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12 }}>
          {[["GPA",player.gpa||"Ã¢ÂÂ",player.gpa>=3.5?"#10b981":player.gpa>=3?"#f59e0b":"#ef4444"],["SAT",player.satScore||"Ã¢ÂÂ","#6366f1"],["TOEFL",player.toeflScore||"Ã¢ÂÂ","#8b5cf6"],["InglÃÂ©s",player.englishLevel||"Ã¢ÂÂ","#3b82f6"]].map(([l,v,c])=>(
            <div key={l} style={{ background:"#f0ebe3",border:`1px solid ${c}15`,borderRadius:10,padding:"14px",textAlign:"center" }}><div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:600 }}>{l}</div><div style={{ fontSize:20,fontWeight:800,color:c }}>{v}</div></div>
          ))}
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8,marginBottom:12 }}>
          {[["High School",player.highSchool],["GraduaciÃÂ³n",player.graduationYear],["Carrera",player.major],["Nivel inglÃÂ©s",player.englishLevel]].map(([l,v])=><InfoCard key={l} label={l} value={v}/>)}
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
          {player.budget&&<div style={{ background:"rgba(16,185,129,0.05)",border:"1px solid rgba(16,185,129,0.12)",borderRadius:10,padding:"12px 14px" }}>
            <div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontWeight:600 }}>Budget anual mÃÂ¡ximo</div>
            <div style={{ fontSize:16,fontWeight:800,color:"#10b981" }}>${Number(player.budget).toLocaleString()}</div>
          </div>}
          <div style={{ background:player.fafsa?"rgba(16,185,129,0.05)":"rgba(239,68,68,0.04)",border:`1px solid ${player.fafsa?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.1)"}`,borderRadius:10,padding:"12px 14px" }}>
            <div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontWeight:600 }}>FAFSA</div>
            <div style={{ fontSize:14,fontWeight:700,color:player.fafsa?"#10b981":"#ef4444" }}>{player.fafsa?"Ã¢ÂÂ Aplica para FAFSA":"Ã¢ÂÂ No aplica"}</div>
          </div>
        </div>
      </div>}

      {tab==="offers"&&<div>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <span style={{ fontSize:12,color:"#6b7280" }}>{player.offers?.length||0} universidades</span>
          <button onClick={()=>setOfferModal(true)} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:"none",background:"#6366f1",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit" }}>{I.plus} Nueva oferta</button>
        </div>
        {(!player.offers||player.offers.length===0)&&<div style={{ textAlign:"center",padding:"40px",color:"#4b5563" }}><div style={{ fontSize:28,marginBottom:8 }}>Ã°ÂÂÂÃ¯Â¸Â</div><div>Sin ofertas registradas</div></div>}
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {(player.offers||[]).sort((a,b)=>(b.amount||0)-(a.amount||0)).map(offer=>(
            <div key={offer.id} style={{ background:"#f0ebe3",border:`1px solid ${offer.status==="Elegida Ã¢ÂÂ"?"rgba(34,197,94,0.2)":"rgba(255,255,255,0.05)"}`,borderRadius:12,padding:"14px 16px" }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:12 }}>
                <UniLogo name={offer.university} logoUrl={offer.logoUrl} size={38}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:5 }}>
                    <span style={{ fontSize:14,fontWeight:700,color:"#1a1a2e" }}>{offer.university}</span>
                    <OBadge s={offer.status}/><Tag label={offer.division} color="#6b7280"/>
                  </div>
                  <div style={{ display:"flex",gap:12,flexWrap:"wrap",fontSize:12,color:"#6b7280",marginBottom:7 }}>
                    {offer.state&&<span>{offer.state}</span>}
                    {offer.amount&&<span style={{ color:"#10b981",fontWeight:700 }}>{Number(offer.amount).toLocaleString()}Ã¢ÂÂ¬/aÃÂ±o</span>}
                    {offer.season&&<span style={{ color:"#f59e0b",fontWeight:600 }}>{offer.season}</span>}
                    <span>Beca: <span style={{ color:"#6366f1",fontWeight:700 }}>{offer.scholarshipPct}%</span></span>
                  </div>
                  {offer.notes&&<div style={{ fontSize:11,color:"#6b7280",fontStyle:"italic" }}>{offer.notes}</div>}
                  <div style={{ marginTop:8 }}><Bar value={offer.scholarshipPct} max={100} color={OFFER_COLORS[offer.status]||"#6366f1"} h={3}/></div>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
                  <select value={offer.status} onChange={e=>updateOfferStatus(offer.id,e.target.value)} style={{ background:"#f0ebe3",border:"1px solid #e8e3db",borderRadius:7,padding:"4px 7px",color:"#1a1a2e",fontSize:11,cursor:"pointer",outline:"none",fontFamily:"inherit" }}>{OFFER_STATUSES.map(s=><option key={s}>{s}</option>)}</select>
                  <button onClick={()=>removeOffer(offer.id)} style={{ background:"none",border:"1px solid rgba(239,68,68,0.15)",color:"#ef4444",cursor:"pointer",borderRadius:7,padding:"3px 7px",fontSize:10,fontFamily:"inherit" }}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>}

      {tab==="payments"&&<div style={{ display:"flex",flexDirection:"column",gap:12 }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
          <Stat label="Total acordado" value={`${totalFee.toLocaleString()}Ã¢ÂÂ¬`} color="#6366f1"/>
          <Stat label="Cobrado" value={`${paid}Ã¢ÂÂ¬`} color="#10b981" sub={`${Math.round((paid/totalFee)*100)}%`}/>
          <Stat label="Pendiente" value={`${(totalFee-paid)}Ã¢ÂÂ¬`} color={paid>=totalFee?"#10b981":"#f59e0b"}/>
        </div>
        <Card style={{ padding:"18px 20px" }}>
          <div style={{ fontSize:10,fontWeight:700,color:"#4b5563",textTransform:"uppercase",letterSpacing:1.2,marginBottom:12 }}>Estructura de pagos</div>
          {saving&&<div style={{ fontSize:11,color:"#6366f1",marginBottom:8 }}>Guardando...</div>}
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            <PaymentRow label="Pago inicial" amount={player.payment1Amount||900} payment={player.payment1||{paid:false}} onToggle={a=>handlePayment(1,a)} agents={agentList}/>
            <PaymentRow label="Segundo pago" amount={player.payment2Amount||1800} payment={player.payment2||{paid:false}} onToggle={a=>handlePayment(2,a)} agents={agentList}/>
          </div>
        </Card>
      </div>}

      {tab==="timeline"&&<div style={{ position:"relative",paddingLeft:24 }}>
        <div style={{ position:"absolute",left:8,top:6,bottom:0,width:1,background:"#ede8e0" }}/>
        {(player.timeline||[]).map((evt,i)=>{ const c=tlC[evt.type]||"#6b7280"; return <div key={i} style={{ position:"relative",marginBottom:14 }}><div style={{ position:"absolute",left:-19,top:9,width:10,height:10,borderRadius:"50%",background:c,border:`2px solid #080a10` }}/><div style={{ background:"#f0ebe3",border:"1px solid #ede8e0",borderRadius:10,padding:"10px 14px" }}><div style={{ fontSize:10,color:"#4b5563",marginBottom:3 }}>{evt.date}</div><div style={{ fontSize:13,color:"#374151",fontWeight:500 }}>{tlE[evt.type]} {evt.event}</div></div></div>; })}
        {(!player.timeline||player.timeline.length===0)&&<div style={{ textAlign:"center",padding:40,color:"#4b5563" }}>Sin eventos</div>}
      </div>}

      {tab==="admission"&&<AdmissionChecklist playerId={player.id} isAdmin={true}/>}

      {tab==="documents"&&<div>
        <div style={{ background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.12)",borderRadius:12,padding:"12px 16px",marginBottom:12,fontSize:12,color:"#818cf8" }}>
          Ã°ÂÂÂ Documentos subidos por el atleta desde su portal personal. Haz clic en cada archivo para descargarlo.
        </div>
        {/* Portal link */}
        <div style={{ background:"rgba(16,185,129,0.05)",border:"1px solid rgba(16,185,129,0.12)",borderRadius:12,padding:"12px 16px",marginBottom:12 }}>
          <div style={{ fontSize:10,fontWeight:700,color:"#10b981",textTransform:"uppercase",letterSpacing:1,marginBottom:6 }}>Link del portal del atleta</div>
          {portalUrl
            ? <div style={{ display:"flex",gap:8 }}>
                <div style={{ flex:1,fontSize:11,color:"#6b7280",background:"rgba(0,0,0,0.3)",borderRadius:7,padding:"7px 10px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{portalUrl}</div>
                <button onClick={()=>{ navigator.clipboard.writeText(portalUrl); setTokenCopied(true); setTimeout(()=>setTokenCopied(false),2000); }} style={{ padding:"7px 12px",borderRadius:7,border:"none",background:tokenCopied?"#10b981":"#6366f1",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap" }}>{tokenCopied?"Ã¢ÂÂ Copiado":"Copiar"}</button>
              </div>
            : <div style={{ fontSize:12,color:"#6b7280" }}>No hay portal creado. Pulsa <strong style={{ color:"#f59e0b" }}>"Crear portal"</strong> arriba para generar el link.</div>
          }
        </div>
        {/* Documents list */}
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {REQUIRED_DOCS.map(doc=>{
            const uploaded = playerDocs.find(d=>d.doc_type===doc.id);
            return (
              <div key={doc.id} style={{ display:"flex",alignItems:"center",gap:12,background:"#f0ebe3",border:`1px solid ${uploaded?"rgba(16,185,129,0.18)":"rgba(255,255,255,0.05)"}`,borderRadius:12,padding:"13px 16px" }}>
                <div style={{ fontSize:18,flexShrink:0 }}>{uploaded?"Ã¢ÂÂ":"Ã°ÂÂÂ"}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:13,fontWeight:600,color:"#1a1a2e" }}>{doc.label}</div>
                  <div style={{ fontSize:11,color:"#4b5563",marginTop:2 }}>{doc.desc}</div>
                  {uploaded&&<div style={{ fontSize:11,color:"#10b981",marginTop:3 }}>Ã¢ÂÂ Subido: {uploaded.file_name}</div>}
                </div>
                {uploaded
                  ? <a href={uploaded.file_url} target="_blank" rel="noreferrer" style={{ padding:"6px 12px",borderRadius:8,border:"1px solid rgba(16,185,129,0.25)",background:"rgba(16,185,129,0.08)",color:"#10b981",textDecoration:"none",fontSize:12,fontWeight:600,whiteSpace:"nowrap" }}>Ã¢Â¬Â Descargar</a>
                  : <span style={{ fontSize:11,color:"#4b5563",fontStyle:"italic" }}>Pendiente</span>
                }
              </div>
            );
          })}
        </div>
      </div>}

      {editModal&&<PlayerModal initial={player} onClose={()=>setEditModal(false)} onSave={async(p)=>{ await supabase.from("players").update(playerToDb(p)).eq("id",p.id); await onRefresh(); }} agentList={agentList}/>}
      {offerModal&&<OfferModal onClose={()=>setOfferModal(false)} onAdd={addOffer}/>}
      {publicModal&&<PublicProfile player={player} onClose={()=>setPublicModal(false)}/>}
    </div>
  );
};

const LeadDetail = ({ lead, onClose, onConvert, onDelete }) => {
  const sd = lead.sport_data ? (typeof lead.sport_data==="string"?JSON.parse(lead.sport_data):lead.sport_data) : {};
  const sportEmoji = { Soccer:"Ã¢ÂÂ½",Tennis:"Ã°ÂÂÂ¾",Swimming:"Ã°ÂÂÂ",Baseball:"Ã¢ÂÂ¾",Basketball:"Ã°ÂÂÂ","Track & Field":"Ã°ÂÂÂ",Golf:"Ã¢ÂÂ³",Volleyball:"Ã°ÂÂÂ" };
  const Section = ({ title, color, children }) => (
    <div style={{ background:"#faf8f5",borderRadius:12,padding:"16px 18px",border:"1px solid #ede8e0" }}>
      <div style={{ fontSize:10,fontWeight:700,color:color||"#4b5563",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12 }}>{title}</div>
      {children}
    </div>
  );
  const Row = ({ label, value, color }) => value ? (
    <div style={{ background:"#f5f0e8",borderRadius:8,padding:"9px 12px" }}>
      <div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3,fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:13,color:color||"#e5e7eb",fontWeight:600 }}>{value}</div>
    </div>
  ) : null;

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:16,overflowY:"auto" }}>
      <div style={{ background:"#ffffff",border:"1px solid #e0dbd3",borderRadius:20,width:"100%",maxWidth:600,maxHeight:"92vh",overflowY:"auto" }}>
        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#0d1117,#0f1320)",padding:"22px 24px 18px",borderRadius:"20px 20px 0 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                <span style={{ fontSize:24 }}>{sportEmoji[lead.sport]||"Ã°ÂÂÂ¯"}</span>
                <h2 style={{ margin:0,fontSize:22,fontWeight:800,color:"#1a1a2e",letterSpacing:-0.5 }}>{lead.name}</h2>
              </div>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                {lead.sport&&<Tag label={lead.sport} color="#6366f1"/>}
                {lead.position&&<Tag label={lead.position} color="#8b5cf6"/>}
                {lead.nationality&&<Tag label={lead.nationality} color="#3b82f6"/>}
                {lead.age&&<Tag label={`${lead.age} yrs`} color="#6b7280"/>}
              </div>
            </div>
            <button onClick={onClose} style={{ background:"#e8e3db",border:"none",color:"#6b7280",cursor:"pointer",width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{I.x}</button>
          </div>
          {/* Budget highlight */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14 }}>
            <div style={{ background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:12,padding:"14px 16px",textAlign:"center" }}>
              <div style={{ fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:600 }}>Ã°ÂÂÂ° Annual Budget</div>
              <div style={{ fontSize:22,fontWeight:900,color:"#10b981" }}>{lead.budget?`$${Number(lead.budget).toLocaleString()}`:"Not specified"}</div>
            </div>
            <div style={{ background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.18)",borderRadius:12,padding:"14px 16px",textAlign:"center" }}>
              <div style={{ fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:600 }}>Ã°ÂÂÂ Scholarship Sought</div>
              <div style={{ fontSize:22,fontWeight:900,color:"#818cf8" }}>{lead.scholarship_pct?`${lead.scholarship_pct}%`:"Ã¢ÂÂ"}</div>
            </div>
          </div>
          {/* FAFSA */}
          <div style={{ marginTop:10,padding:"8px 14px",background:lead.fafsa?"rgba(16,185,129,0.06)":"rgba(255,255,255,0.03)",border:`1px solid ${lead.fafsa?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.06)"}`,borderRadius:9,fontSize:13,color:lead.fafsa?"#10b981":"#6b7280",fontWeight:600 }}>
            {lead.fafsa?"Ã¢ÂÂ FAFSA Eligible":"Ã¢ÂÂ Not FAFSA Eligible"}
          </div>
        </div>

        <div style={{ padding:"18px 24px 24px",display:"flex",flexDirection:"column",gap:12 }}>
          {/* Contact */}
          <Section title="Contact Information" color="#6366f1">
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              <Row label="Email" value={lead.email}/>
              <Row label="Phone / WhatsApp" value={lead.phone}/>
              <Row label="Instagram" value={lead.instagram}/>
              <Row label="Submitted" value={new Date(lead.created_at).toLocaleDateString("es-ES")}/>
            </div>
          </Section>

          {/* Academic */}
          <Section title="Academic Profile" color="#8b5cf6">
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:10 }}>
              {[["GPA",lead.gpa,lead.gpa>=3.5?"#10b981":lead.gpa>=3?"#f59e0b":"#9ca3af"],["SAT",lead.sat_score,"#6366f1"],["TOEFL",lead.toefl_score,"#8b5cf6"],["English",lead.english_level,"#3b82f6"]].map(([l,v,c])=>(
                <div key={l} style={{ background:"#f5f0e8",border:`1px solid ${c}15`,borderRadius:10,padding:"12px 8px",textAlign:"center" }}>
                  <div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:1,marginBottom:5,fontWeight:600 }}>{l}</div>
                  <div style={{ fontSize:18,fontWeight:800,color:c }}>{v||"Ã¢ÂÂ"}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              <Row label="High School" value={lead.high_school}/>
              <Row label="Graduation Year" value={lead.graduation_year}/>
              <Row label="Intended Major" value={lead.major}/>
              <Row label="English Level" value={lead.english_level}/>
            </div>
          </Section>

          {/* Athletic */}
          <Section title="Athletic Profile" color="#10b981">
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              <Row label="Sport" value={lead.sport}/>
              <Row label="Position" value={lead.position}/>
              <Row label="Height" value={lead.height?`${lead.height} cm`:null}/>
              <Row label="Weight" value={lead.weight?`${lead.weight} kg`:null}/>
              {lead.video_url&&<div style={{ gridColumn:"1/-1" }}>
                <a href={lead.video_url} target="_blank" rel="noreferrer" style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:9,textDecoration:"none",color:"#f87171",fontSize:13,fontWeight:600 }}>Ã¢ÂÂ¶ Watch Highlight Video</a>
              </div>}
            </div>
          </Section>

          {/* Notes */}
          {lead.notes&&<Section title="Additional Notes" color="#f59e0b">
            <div style={{ fontSize:13,color:"#4b5563",lineHeight:1.7 }}>{lead.notes}</div>
          </Section>}

          {/* Actions */}
          <div style={{ display:"flex",gap:10,marginTop:4 }}>
            <button onClick={()=>{ if(window.confirm(`ÃÂ¿Convertir a ${lead.name} en atleta?`)){ onConvert(lead); onClose(); }}} style={{ flex:2,padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit" }}>Ã¢ÂÂ Convertir en atleta</button>
            <button onClick={()=>{ if(window.confirm(`ÃÂ¿Eliminar lead ${lead.name}?`)){ onDelete(lead.id); onClose(); }}} style={{ flex:1,padding:"12px",borderRadius:10,border:"1px solid rgba(239,68,68,0.2)",background:"rgba(239,68,68,0.06)",color:"#ef4444",cursor:"pointer",fontSize:13,fontFamily:"inherit" }}>Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CommissionForm = ({ players, onSave, onRefresh }) => {
  const [f,setF]=useState({ player_id:"",referred_by:"",percentage:10,amount:"",notes:"",paid:false });
  const [saving,setSaving]=useState(false);
  const inp2 = { background:"#f0ebe3",border:"1px solid #e0dbd3",borderRadius:8,padding:"8px 12px",color:"#1a1a2e",fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit" };
  const selectedPlayer = players.find(p=>p.id===f.player_id);
  const suggestedAmount = selectedPlayer ? Math.round((selectedPlayer.totalFee||2700)*(f.percentage/100)) : 0;
  const save = async () => {
    if(!f.player_id||!f.referred_by) return;
    setSaving(true);
      try {
    await onSave({ player_id:f.player_id, referred_by:f.referred_by, percentage:parseFloat(f.percentage)||10, amount:parseFloat(f.amount)||suggestedAmount, notes:f.notes, paid:false });
    setF({ player_id:"",referred_by:"",percentage:10,amount:"",notes:"",paid:false });
      } catch(e) {
        setError("Error al guardar. Inténtalo de nuevo.");
        console.error(e);
      } finally {
        setSaving(false);
      }
  };
  return (
    <Card style={{ padding:"18px 20px",border:"1px solid rgba(245,158,11,0.12)" }}>
      <div style={{ fontSize:11,fontWeight:700,color:"#f59e0b",textTransform:"uppercase",letterSpacing:1.2,marginBottom:14 }}>Nueva comisiÃÂ³n</div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
        <div><label style={{ fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:5,display:"block" }}>Atleta</label>
          <select style={{ ...inp2,width:"100%",cursor:"pointer" }} value={f.player_id} onChange={e=>setF(x=>({...x,player_id:e.target.value}))}>
            <option value="">Seleccionar atleta...</option>
            {players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div><label style={{ fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:5,display:"block" }}>Referido por</label>
          <input style={{ ...inp2,width:"100%" }} value={f.referred_by} onChange={e=>setF(x=>({...x,referred_by:e.target.value}))} placeholder="Nombre del referidor"/>
        </div>
        <div><label style={{ fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:5,display:"block" }}>% ComisiÃÂ³n</label>
          <input style={{ ...inp2,width:"100%" }} type="number" min="0" max="100" value={f.percentage} onChange={e=>setF(x=>({...x,percentage:e.target.value}))}/>
        </div>
        <div><label style={{ fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:5,display:"block" }}>Importe (Ã¢ÂÂ¬) {suggestedAmount>0&&<span style={{ color:"#f59e0b" }}>sugerido: {suggestedAmount}Ã¢ÂÂ¬</span>}</label>
          <input style={{ ...inp2,width:"100%" }} type="number" value={f.amount} onChange={e=>setF(x=>({...x,amount:e.target.value}))} placeholder={suggestedAmount||"0"}/>
        </div>
        <div style={{ gridColumn:"1/-1" }}><label style={{ fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:5,display:"block" }}>Notas</label>
          <input style={{ ...inp2,width:"100%" }} value={f.notes} onChange={e=>setF(x=>({...x,notes:e.target.value}))} placeholder="Detalles del acuerdo..."/>
        </div>
      </div>
      <button onClick={save} disabled={saving||!f.player_id||!f.referred_by} style={{ marginTop:14,width:"100%",padding:"10px",borderRadius:9,border:"none",background:(!f.player_id||!f.referred_by)?"rgba(255,255,255,0.04)":"linear-gradient(135deg,#f59e0b,#d97706)",color:(!f.player_id||!f.referred_by)?"#4b5563":"#fff",cursor:(!f.player_id||!f.referred_by)?"default":"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",opacity:saving?0.7:1 }}>
        {saving?"Guardando...":"+ AÃÂ±adir comisiÃÂ³n"}
      </button>
    </Card>
  );
};

const AgentLinkRow = ({ agent, link, IcCopy }) => {
  const [copied,setCopied] = useState(false);
  return (
    <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#faf8f5",borderRadius:9,border:"1px solid #ede8e0" }}>
      <Avatar name={agent.name} size={28} photoUrl={agent.photo_url}/>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:12,fontWeight:600,color:"#374151" }}>{agent.name}</div>
        <div style={{ fontSize:11,color:"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{link}</div>
      </div>
      <button onClick={()=>{ navigator.clipboard.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),2000); }} style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,border:"1px solid rgba(99,102,241,0.2)",background:copied?"rgba(16,185,129,0.1)":"rgba(99,102,241,0.08)",color:copied?"#10b981":"#818cf8",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap" }}>{IcCopy} {copied?"Ã¢ÂÂ Copiado":"Copiar link"}</button>
    </div>
  );
};

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ MAIN APP Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ PUBLIC PLAYER PAGE (for coaches) Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ PUBLIC LEAD FORM Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
const LeadForm = () => {
  const SPORTS_LIST = ["Soccer","Tennis","Golf","Volleyball","Track & Field"];
  const [step, setStep] = useState(1); // 3 steps
  const [form, setForm] = useState({ name:"",email:"",phone:"",nationality:"",age:"",instagram:"",referred_by:"",sport:"Soccer",position:"",height:"",weight:"",video_url:"",gpa:"",english_level:"B2",graduation_year:"",major:"",budget:"",scholarship_pct:"",notes:"" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const inp = { background:"#fff", border:"1px solid #e5e0d8", borderRadius:10, padding:"12px 16px", color:"#1a1a2e", fontSize:15, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" };
  const lbl = { fontSize:12, fontWeight:600, color:"#6b7280", textTransform:"uppercase", letterSpacing:0.8, marginBottom:6, display:"block" };

  const submit = async () => {
    if(!form.name.trim()||!form.email.trim()) { setError("Nombre y email son obligatorios."); return; }
    setSubmitting(true); setError("");
    try {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone||null,
      nationality: form.nationality||null,
      age: parseInt(form.age)||null,
      sport: form.sport,
      position: form.position||null,
      height: parseFloat(form.height)||null,
      weight: parseFloat(form.weight)||null,
      gpa: parseFloat(form.gpa)||null,
      english_level: form.english_level||null,
      graduation_year: parseInt(form.graduation_year)||null,
      major: form.major||null,
      scholarship_pct: parseInt(form.scholarship_pct)||null,
      budget: parseFloat(form.budget)||null,
      video_url: form.video_url||null,
      instagram: form.instagram||null,
      notes: form.notes||null,
      referred_by: form.referred_by||null,
    };
    const { error:err } = await supabase.from("leads").insert(payload);
    if(err) { setError(`Error: ${err.message}`); return; }
    // Notify CEO by email in background
    fetch("/api/send-email", { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ type:"calendar_invite", to:"futboluagency@gmail.com", eventTitle:`Nuevo lead: ${form.name}`, eventDate:new Date().toISOString().split("T")[0], body:`Deporte: ${form.sport}\nNacionalidad: ${form.nationality||"Ã¢ÂÂ"}\nEmail: ${form.email}\nReferido por: ${form.referred_by||"Ã¢ÂÂ"}`, senderName:"Formulario web" })
    }).catch(()=>{});
    setSubmitted(true);
    } catch(e) {
      setError("Error al enviar la solicitud. IntÃ©ntalo de nuevo.");
      console.error("Submit error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  if(submitted) return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:"#f5f0e8", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ textAlign:"center", maxWidth:440, background:"#fff", borderRadius:20, padding:"40px 32px", boxShadow:"0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#10b981)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 20px" }}>Ã¢ÂÂ</div>
        <h2 style={{ fontSize:24, fontWeight:800, color:"#1a1a2e", marginBottom:10 }}>Solicitud recibida</h2>
        <p style={{ fontSize:15, color:"#6b7280", lineHeight:1.7, marginBottom:24 }}>Hemos recibido tu perfil. Nuestro equipo lo revisara y se pondra en contacto contigo pronto.</p>
        <div style={{ background:"#f9f7f4", border:"1px solid #e8e3db", borderRadius:12, padding:"16px 20px" }}>
          <div style={{ fontSize:13, color:"#374151", fontWeight:600 }}>futboluagency@gmail.com</div>
          <div style={{ fontSize:13, color:"#374151", fontWeight:600, marginTop:4 }}>WhatsApp: +34 603 331 990</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:"#f5f0e8", minHeight:"100vh" }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}input,select,textarea{font-family:inherit}`}</style>

      {/* Header */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e8e3db", padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <img src="/logo.png" alt="FUTBOLUAGENCY" onError={e=>e.target.style.display="none"} style={{ height:30, objectFit:"contain" }}/>
        <div style={{ fontSize:12, color:"#9ca3af", fontWeight:500 }}>Solicitud de beca deportiva</div>
      </div>

      <div style={{ maxWidth:560, margin:"0 auto", padding:"32px 20px 80px" }}>
        {/* Title */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <h1 style={{ fontSize:26, fontWeight:800, color:"#1a1a2e", letterSpacing:-0.5, marginBottom:8 }}>Solicita tu beca deportiva</h1>
          <p style={{ fontSize:14, color:"#6b7280", lineHeight:1.6 }}>Rellena el formulario y evaluamos tu perfil gratuitamente</p>
        </div>

        {/* Progress */}
        <div style={{ display:"flex", gap:8, marginBottom:28 }}>
          {[1,2,3].map(s=>(
            <div key={s} style={{ flex:1, height:4, borderRadius:99, background:step>=s?"#6366f1":"#e8e3db", transition:"background .3s" }}/>
          ))}
        </div>
        <div style={{ textAlign:"center", fontSize:12, color:"#9ca3af", marginBottom:24, fontWeight:600 }}>
          Paso {step} de 3 Ã¢ÂÂ {["Datos personales","Perfil deportivo","Estudios y expectativas"][step-1]}
        </div>

        <div style={{ background:"#fff", borderRadius:16, padding:"28px 24px", boxShadow:"0 1px 8px rgba(0,0,0,0.06)", border:"1px solid #e8e3db" }}>

          {/* STEP 1 Ã¢ÂÂ Personal */}
          {step===1&&<div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#1a1a2e", marginBottom:4 }}>Datos personales</div>
            <div><label style={lbl}>Nombre completo *</label><input style={inp} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Juan Garcia"/></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><label style={lbl}>Email *</label><input style={inp} type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="juan@gmail.com"/></div>
              <div><label style={lbl}>WhatsApp</label><input style={inp} value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+34 ..."/></div>
              <div><label style={lbl}>Nacionalidad</label><input style={inp} value={form.nationality} onChange={e=>set("nationality",e.target.value)} placeholder="Colombiano, Espanol..."/></div>
              <div><label style={lbl}>Edad</label><input style={inp} type="number" value={form.age} onChange={e=>set("age",e.target.value)} placeholder="18"/></div>
            </div>
            <div><label style={lbl}>Instagram</label><input style={inp} value={form.instagram} onChange={e=>set("instagram",e.target.value)} placeholder="@usuario"/></div>
            <div><label style={lbl}>Referido por (agente)</label><input style={inp} value={form.referred_by} onChange={e=>set("referred_by",e.target.value)} placeholder="Nombre del agente que te contacto"/></div>
          </div>}

          {/* STEP 2 Ã¢ÂÂ Athletic */}
          {step===2&&<div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#1a1a2e", marginBottom:4 }}>Perfil deportivo</div>
            <div>
              <label style={lbl}>Deporte *</label>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
                {SPORTS_LIST.map(s=>(
                  <div key={s} onClick={()=>set("sport",s)} style={{ padding:"12px 6px", borderRadius:10, border:`2px solid ${form.sport===s?"#6366f1":"#e8e3db"}`, background:form.sport===s?"rgba(99,102,241,0.06)":"#f9f7f4", cursor:"pointer", textAlign:"center" }}>
                    <div style={{ fontSize:22, marginBottom:4 }}>{{ Soccer:"Ã¢ÂÂ½", Tennis:"Ã°ÂÂÂ¾", Golf:"Ã¢ÂÂ³", Volleyball:"Ã°ÂÂÂ", "Track & Field":"Ã°ÂÂÂ" }[s]}</div>
                    <div style={{ fontSize:10, fontWeight:600, color:form.sport===s?"#6366f1":"#9ca3af" }}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><label style={lbl}>Posicion / Especialidad</label><input style={inp} value={form.position} onChange={e=>set("position",e.target.value)} placeholder="Delantero, Backhand..."/></div>
              <div><label style={lbl}>Altura (cm)</label><input style={inp} type="number" value={form.height} onChange={e=>set("height",e.target.value)} placeholder="178"/></div>
            </div>
            <div><label style={lbl}>Video highlight (YouTube / Drive)</label><input style={inp} value={form.video_url} onChange={e=>set("video_url",e.target.value)} placeholder="https://youtube.com/..."/></div>
          </div>}

          {/* STEP 3 Ã¢ÂÂ Academic */}
          {step===3&&<div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#1a1a2e", marginBottom:4 }}>Estudios y expectativas</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><label style={lbl}>GPA (nota media)</label><input style={inp} type="number" step="0.1" value={form.gpa} onChange={e=>set("gpa",e.target.value)} placeholder="3.5"/></div>
              <div><label style={lbl}>Nivel de ingles</label>
                <select style={{ ...inp, cursor:"pointer" }} value={form.english_level} onChange={e=>set("english_level",e.target.value)}>
                  {["A1","A2","B1","B2","C1","C2","Native"].map(l=><option key={l}>{l}</option>)}
                </select>
              </div>
              <div><label style={lbl}>AÃÂ±o de graduacion</label><input style={inp} type="number" value={form.graduation_year} onChange={e=>set("graduation_year",e.target.value)} placeholder="2025"/></div>
              <div><label style={lbl}>Carrera deseada</label><input style={inp} value={form.major} onChange={e=>set("major",e.target.value)} placeholder="Business, Marketing..."/></div>
              <div><label style={lbl}>Beca buscada (%)</label><input style={inp} type="number" value={form.scholarship_pct} onChange={e=>set("scholarship_pct",e.target.value)} placeholder="50"/></div>
              <div><label style={lbl}>Presupuesto anual max (USD)</label><input style={inp} type="number" value={form.budget} onChange={e=>set("budget",e.target.value)} placeholder="25000"/></div>
            </div>
            <div><label style={lbl}>Algo mas que quieras contarnos</label><textarea style={{ ...inp, minHeight:80, resize:"vertical" }} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Logros deportivos, objetivos, preguntas..."/></div>
            {error&&<div style={{ padding:"12px 16px", background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, fontSize:13, color:"#ef4444" }}>{error}</div>}
          </div>}

          {/* Navigation */}
          <div style={{ display:"flex", gap:10, marginTop:24 }}>
            {step>1&&<button onClick={()=>setStep(s=>s-1)} style={{ flex:1, padding:"13px", borderRadius:10, border:"1px solid #e8e3db", background:"#fff", color:"#374151", cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"inherit" }}>Atras</button>}
            {step<3
              ? <button onClick={()=>{ if(step===1&&(!form.name.trim()||!form.email.trim())){ setError("Nombre y email son obligatorios"); return; } setError(""); setStep(s=>s+1); }} style={{ flex:2, padding:"13px", borderRadius:10, border:"none", background:"#1a1a2e", color:"#fff", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"inherit" }}>Siguiente</button>
              : <button onClick={submit} disabled={submitting} style={{ flex:2, padding:"13px", borderRadius:10, border:"none", background:submitting?"#9ca3af":"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", cursor:submitting?"default":"pointer", fontSize:14, fontWeight:700, fontFamily:"inherit" }}>{submitting?"Enviando...":"Enviar solicitud"}</button>
            }
          </div>
        </div>

        <div style={{ textAlign:"center", marginTop:20, fontSize:12, color:"#9ca3af" }}>
          ÃÂ¿Preguntas? <strong style={{ color:"#374151" }}>futboluagency@gmail.com</strong> ÃÂ· WhatsApp <strong style={{ color:"#374151" }}>+34 603 331 990</strong>
        </div>
      </div>
    </div>
  );
};


const PublicPlayerPage = ({ playerId }) => {
  const [player,setPlayer] = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    const load = async () => {
      const {data:row} = await supabase.from("players").select("*").eq("id",playerId).single();
      if(!row){ setLoading(false); return; }
      const {data:offers} = await supabase.from("offers").select("*").eq("player_id",playerId);
      setPlayer(dbToPlayer(row, offers||[], []));
      setLoading(false);
    };
    load();
  },[playerId]);

  if(loading) return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif",background:"#f5f0e8",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12 }}>
      <img src="/logo.png" alt="FUA" onError={e=>e.target.style.display="none"} style={{ height:44,objectFit:"contain" }}/>
      <div style={{ fontSize:13,color:"#374151" }}>Loading athlete profile...</div>
    </div>
  );

  if(!player) return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif",background:"#f5f0e8",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12 }}>
      <div style={{ fontSize:32 }}>Ã°ÂÂÂ</div>
      <div style={{ fontSize:16,fontWeight:600,color:"#1a1a2e" }}>Profile not found</div>
      <div style={{ fontSize:13,color:"#374151" }}>This athlete profile may have been removed.</div>
    </div>
  );

  const sd = player.sportData || {};
  const sportFields = SPORT_FIELDS[player.sport] || [];

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif",background:"#f5f0e8",minHeight:"100vh",color:"#1a1a2e" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.07);border-radius:4px}`}</style>

      {/* Header */}
      <div style={{ background:"#ffffff",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <img src="/logo.png" alt="FUTBOLUAGENCY" onError={e=>e.target.style.display="none"} style={{ height:32,objectFit:"contain" }}/>
        <div style={{ fontSize:11,color:"#374151",fontWeight:500 }}>Official Athlete Profile</div>
      </div>

      <div style={{ maxWidth:680,margin:"0 auto",padding:"32px 20px 60px" }}>
        {/* Hero */}
        <div style={{ background:"#f5f0e8",border:"1px solid #e8e3db",borderRadius:16,padding:"28px",marginBottom:16 }}>
          <div style={{ display:"flex",gap:20,alignItems:"center",flexWrap:"wrap" }}>
            <Avatar name={player.name} size={88} photoUrl={player.photoUrl}/>
            <div style={{ flex:1,minWidth:200 }}>
              <h1 style={{ fontSize:28,fontWeight:800,color:"#1a1a2e",letterSpacing:-0.5,marginBottom:8 }}>{player.name}</h1>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:12 }}>
                <span style={{ padding:"4px 12px",borderRadius:6,fontSize:12,fontWeight:600,background:"rgba(99,102,241,0.12)",color:"#818cf8",border:"1px solid rgba(99,102,241,0.2)" }}>{player.sport}</span>
                {player.position&&player.position!=="N/A"&&<span style={{ padding:"4px 12px",borderRadius:6,fontSize:12,fontWeight:600,background:"rgba(139,92,246,0.1)",color:"#a78bfa",border:"1px solid rgba(139,92,246,0.2)" }}>{player.position}</span>}
                {player.nationality&&<span style={{ padding:"4px 12px",borderRadius:6,fontSize:12,fontWeight:600,background:"rgba(59,130,246,0.1)",color:"#60a5fa",border:"1px solid rgba(59,130,246,0.2)" }}>{player.nationality}</span>}
                {player.age&&<span style={{ padding:"4px 12px",borderRadius:6,fontSize:12,fontWeight:600,background:"#ede8e0",color:"#6b7280",border:"1px solid #e0dbd3" }}>{player.age} years old</span>}
              </div>
              {player.videoUrl&&(
                <a href={player.videoUrl} target="_blank" rel="noreferrer" style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"10px 18px",background:"#ef4444",borderRadius:9,textDecoration:"none",color:"#fff",fontSize:13,fontWeight:700 }}>
                  Ã¢ÂÂ¶ Watch Highlight Video
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Academic */}
        <div style={{ background:"#f5f0e8",border:"1px solid #e8e3db",borderRadius:16,padding:"24px",marginBottom:12 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:1.5,marginBottom:16 }}>Academic Profile</div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16 }}>
            {[["GPA",player.gpa||"Ã¢ÂÂ",player.gpa>=3.5?"#10b981":player.gpa>=3?"#f59e0b":"#9ca3af"],["SAT",player.satScore||"Ã¢ÂÂ","#6366f1"],["TOEFL",player.toeflScore||"Ã¢ÂÂ","#8b5cf6"],["English",player.englishLevel||"Ã¢ÂÂ","#3b82f6"]].map(([l,v,c])=>(
              <div key={l} style={{ background:"#f5f0e8",border:`1px solid ${c}15`,borderRadius:10,padding:"14px 10px",textAlign:"center" }}>
                <div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:600 }}>{l}</div>
                <div style={{ fontSize:22,fontWeight:800,color:c }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {[["High School",player.highSchool],["Graduation Year",player.graduationYear],["Intended Major",player.major],["English Level",player.englishLevel]].filter(([,v])=>v).map(([l,v])=>(
              <div key={l} style={{ background:"#faf8f5",borderRadius:9,padding:"10px 14px" }}>
                <div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4,fontWeight:600 }}>{l}</div>
                <div style={{ fontSize:13,color:"#374151",fontWeight:600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Athletic */}
        <div style={{ background:"#f5f0e8",border:"1px solid #e8e3db",borderRadius:16,padding:"24px",marginBottom:12 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:1.5,marginBottom:16 }}>Athletic Profile</div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10 }}>
            {[["Sport",player.sport],["Position",player.position],["Height",player.height?`${player.height} cm`:"Ã¢ÂÂ"],["Weight",player.weight?`${player.weight} kg`:"Ã¢ÂÂ"],["Nationality",player.nationality],["Scholarship",`${player.scholarshipPct}%`]].filter(([,v])=>v&&v!=="Ã¢ÂÂ").map(([l,v])=>(
              <div key={l} style={{ background:"#faf8f5",borderRadius:9,padding:"10px 14px" }}>
                <div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4,fontWeight:600 }}>{l}</div>
                <div style={{ fontSize:13,color:l==="Scholarship"?"#6366f1":"#e5e7eb",fontWeight:600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sport stats */}
        {sportFields.length>0&&Object.values({...sd}).some(v=>v)&&(
          <div style={{ background:"#f5f0e8",border:"1px solid rgba(245,158,11,0.1)",borderRadius:16,padding:"24px",marginBottom:12 }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:1.5,marginBottom:16 }}>{player.sport} Statistics</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10 }}>
              {sportFields.map(([l,k])=>{ const v=(k==="foot"||k==="height"||k==="weight")?player[k]:sd[k]; if(!v) return null; return (
                <div key={k} style={{ background:"rgba(245,158,11,0.04)",border:"1px solid rgba(245,158,11,0.08)",borderRadius:9,padding:"10px 14px" }}>
                  <div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4,fontWeight:600 }}>{l}</div>
                  <div style={{ fontSize:13,color:"#fbbf24",fontWeight:700 }}>{v}</div>
                </div>
              ); })}
            </div>
          </div>
        )}

        {/* Budget & FAFSA */}
        {(player.budget||player.fafsa!==undefined)&&(
          <div style={{ background:"#f5f0e8",border:"1px solid rgba(16,185,129,0.1)",borderRadius:16,padding:"24px",marginBottom:12 }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:1.5,marginBottom:16 }}>Financial Information</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
              {player.budget&&<div style={{ background:"rgba(16,185,129,0.04)",border:"1px solid rgba(16,185,129,0.1)",borderRadius:9,padding:"14px" }}>
                <div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4,fontWeight:600 }}>Annual Budget (max)</div>
                <div style={{ fontSize:18,fontWeight:800,color:"#10b981" }}>${Number(player.budget).toLocaleString()}</div>
              </div>}
              <div style={{ background:player.fafsa?"rgba(16,185,129,0.06)":"rgba(255,255,255,0.02)",border:`1px solid ${player.fafsa?"rgba(16,185,129,0.15)":"rgba(255,255,255,0.05)"}`,borderRadius:9,padding:"14px" }}>
                <div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4,fontWeight:600 }}>FAFSA Eligible</div>
                <div style={{ fontSize:14,fontWeight:700,color:player.fafsa?"#10b981":"#ef4444" }}>{player.fafsa?"Ã¢ÂÂ Yes Ã¢ÂÂ FAFSA Eligible":"Ã¢ÂÂ Not Eligible"}</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign:"center",marginTop:32,paddingTop:24,borderTop:"1px solid rgba(255,255,255,0.04)" }}>
          <img src="/logo.png" alt="FUTBOLUAGENCY" onError={e=>e.target.style.display="none"} style={{ height:28,objectFit:"contain",marginBottom:8,opacity:0.5 }}/>
          <div style={{ fontSize:11,color:"#374151" }}>Profile provided by FUTBOLUAGENCY ÃÂ· Athlete recruitment specialists</div>
        </div>
      </div>
    </div>
  );
};

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ REQUIRED DOCUMENTS Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
const REQUIRED_DOCS = [
  { id:"passport", label:"Passport (scanned)", desc:"Valid passport Ã¢ÂÂ all pages" },
  { id:"grades_eso3", label:"3ÃÂº ESO Grades", desc:"Official transcript with school stamp & signature" },
  { id:"grades_eso4", label:"4ÃÂº ESO Grades", desc:"Official transcript with school stamp & signature" },
  { id:"grades_bach1", label:"1ÃÂº Bachillerato Grades", desc:"Official transcript with school stamp & signature" },
  { id:"grades_bach2", label:"2ÃÂº Bachillerato Grades", desc:"Official transcript with school stamp & signature" },
  { id:"vaccines", label:"Vaccination Record", desc:"Official vaccination certificate" },
  { id:"gpa_cert", label:"GPA Certificate", desc:"Official GPA document from school" },
  { id:"english_cert", label:"English Certificate", desc:"TOEFL, IELTS or equivalent" },
  { id:"sat_cert", label:"SAT Score Report", desc:"Official SAT score report" },
  { id:"photo", label:"Passport Photo", desc:"Recent passport-style photo" },
];

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ ATHLETE PORTAL Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
const AthletePortal = ({ token }) => {
  const [player,setPlayer] = useState(null);
  const [documents,setDocuments] = useState([]);
  const [offers,setOffers] = useState([]);
  const [loading,setLoading] = useState(true);
  const [uploading,setUploading] = useState({});
  const [tab,setTab] = useState("profile");
  const fileRefs = useRef({});

  useEffect(()=>{
    const load = async () => {
      const {data:row} = await supabase.from("players").select("*").eq("access_token",token).single();
      if(!row){ setLoading(false); return; }
      const {data:offersData} = await supabase.from("offers").select("*").eq("player_id",row.id);
      const {data:docsData} = await supabase.from("documents").select("*").eq("player_id",row.id);
      setPlayer(row);
      setOffers(offersData||[]);
      setDocuments(docsData||[]);
      setLoading(false);
    };
    load();
  },[token]);

  const uploadDoc = async (docType, docLabel, file) => {
    if(!file||!player) return;
    setUploading(u=>({...u,[docType]:true}));
    const ext = file.name.split(".").pop();
    const filename = `${player.id}/${docType}_${Date.now()}.${ext}`;
    const {error:upErr} = await supabase.storage.from("avatars").upload(filename, file, {upsert:true});
    if(!upErr){
      const fileUrl = `${SUPA_URL}/storage/v1/object/public/avatars/${filename}`;
      // Check if doc already exists
      const existing = documents.find(d=>d.doc_type===docType);
      if(existing){
        await supabase.from("documents").update({file_url:fileUrl,file_name:file.name,status:"Pendiente de revisiÃÂ³n",created_at:new Date().toISOString()}).eq("id",existing.id);
      } else {
        await supabase.from("documents").insert({player_id:player.id,name:docLabel,file_name:file.name,file_url:fileUrl,doc_type:docType,status:"Pendiente de revisiÃÂ³n"});
      }
      const {data:docsData} = await supabase.from("documents").select("*").eq("player_id",player.id);
      setDocuments(docsData||[]);
    }
    setUploading(u=>({...u,[docType]:false}));
  };

  if(loading) return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif",background:"#f5f0e8",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12 }}>
      <img src="/logo.png" alt="FUA" onError={e=>e.target.style.display="none"} style={{ height:44,objectFit:"contain" }}/>
      <div style={{ fontSize:13,color:"#374151" }}>Loading your profile...</div>
    </div>
  );

  if(!player) return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif",background:"#f5f0e8",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,padding:20 }}>
      <div style={{ fontSize:32,marginBottom:8 }}>Ã°ÂÂÂ</div>
      <div style={{ fontSize:18,fontWeight:700,color:"#1a1a2e" }}>Invalid access link</div>
      <div style={{ fontSize:13,color:"#6b7280",textAlign:"center" }}>This link is not valid. Please contact your agent at FUTBOLUAGENCY.</div>
      <div style={{ marginTop:16,fontSize:13,color:"#818cf8" }}>Ã°ÂÂÂ± WhatsApp: +34 603 331 990</div>
    </div>
  );

  const docsUploaded = documents.length;
  const docsTotal = REQUIRED_DOCS.length;
  const pct = Math.round((docsUploaded/docsTotal)*100);
  const statusColors = {"Scholarship":"#10b981","In Process":"#f59e0b","Prospect":"#6366f1","Inactive":"#6b7280"};
  const offerColors = {"Interested":"#6366f1","Formal Offer":"#f59e0b","Pre-accepted":"#10b981","Declined":"#ef4444","Chosen Ã¢ÂÂ":"#22c55e"};

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif",background:"#f5f0e8",minHeight:"100vh",color:"#1a1a2e" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.07)}`}</style>

      {/* Header */}
      <div style={{ background:"#f0ebe3",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10 }}>
        <img src="/logo.png" alt="FUTBOLUAGENCY" onError={e=>e.target.style.display="none"} style={{ height:30,objectFit:"contain" }}/>
        <div style={{ fontSize:12,color:"#4b5563" }}>My Athlete Portal</div>
      </div>

      <div style={{ maxWidth:680,margin:"0 auto",padding:"24px 16px 60px" }}>
        {/* Hero */}
        <div style={{ background:"#faf8f5",border:"1px solid #e8e3db",borderRadius:16,padding:"22px",marginBottom:14 }}>
          <div style={{ display:"flex",gap:16,alignItems:"center",flexWrap:"wrap" }}>
            {player.photo_url
              ? <img src={`${SUPA_URL}/storage/v1/object/public/avatars/${player.photo_url}`} alt={player.name} style={{ width:64,height:64,borderRadius:"50%",objectFit:"cover",border:"2px solid rgba(99,102,241,0.4)" }}/>
              : <div style={{ width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#6366f188,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#fff" }}>{player.name?.split(" ").map(n=>n[0]).slice(0,2).join("")}</div>
            }
            <div style={{ flex:1 }}>
              <h1 style={{ fontSize:22,fontWeight:800,color:"#1a1a2e",marginBottom:6 }}>{player.name}</h1>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                <span style={{ padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:600,background:`${statusColors[player.status]||"#6366f1"}15`,color:statusColors[player.status]||"#6366f1",border:`1px solid ${statusColors[player.status]||"#6366f1"}25` }}>{player.status}</span>
                {player.sport&&<span style={{ padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:600,background:"rgba(99,102,241,0.1)",color:"#818cf8",border:"1px solid rgba(99,102,241,0.2)" }}>{player.sport}</span>}
                {player.nationality&&<span style={{ padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:500,background:"#f0ebe3",color:"#6b7280",border:"1px solid #e8e3db" }}>{player.nationality}</span>}
              </div>
            </div>
          </div>
          {/* Docs progress */}
          <div style={{ marginTop:16 }}>
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6 }}>
              <span style={{ color:"#6b7280",fontWeight:500 }}>Documents uploaded</span>
              <span style={{ color:pct===100?"#10b981":"#f59e0b",fontWeight:700 }}>{docsUploaded}/{docsTotal}</span>
            </div>
            <div style={{ background:"#e8e3db",borderRadius:99,height:6 }}>
              <div style={{ width:`${pct}%`,background:pct===100?"#10b981":"linear-gradient(90deg,#6366f1,#8b5cf6)",height:"100%",borderRadius:99,transition:"width .4s" }}/>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex",gap:2,marginBottom:14,background:"#f5f0e8",borderRadius:12,padding:3 }}>
          {[{id:"profile",l:"My Profile"},{id:"offers",l:`Offers (${offers.filter(o=>o.status!=="Declined").length})`},{id:"process",l:"My Process"},{id:"documents",l:`Documents (${docsUploaded}/${docsTotal})`}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1,padding:"8px 10px",borderRadius:9,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:tab===t.id?"rgba(99,102,241,0.18)":"none",color:tab===t.id?"#a5b4fc":"#6b7280",fontFamily:"inherit" }}>{t.l}</button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {tab==="profile"&&<div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {player.video_url&&<a href={player.video_url} target="_blank" rel="noreferrer" style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 18px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:12,textDecoration:"none" }}>
            <div style={{ width:38,height:38,background:"#ef4444",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,flexShrink:0 }}>Ã¢ÂÂ¶</div>
            <div><div style={{ fontSize:14,fontWeight:700,color:"#1a1a2e" }}>My Highlight Video</div><div style={{ fontSize:12,color:"#6b7280",marginTop:2 }}>View your athletic reel</div></div>
          </a>}
          <div style={{ background:"#faf8f5",border:"1px solid #e8e3db",borderRadius:12,padding:"16px 18px" }}>
            <div style={{ fontSize:10,fontWeight:700,color:"#4b5563",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12 }}>Academic Profile</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12 }}>
              {[["GPA",player.gpa,player.gpa>=3.5?"#10b981":player.gpa>=3?"#f59e0b":"#9ca3af"],["SAT",player.sat_score,"#6366f1"],["TOEFL",player.toefl_score,"#8b5cf6"],["English",player.english_level,"#3b82f6"]].map(([l,v,c])=>(
                <div key={l} style={{ background:"#f5f0e8",borderRadius:10,padding:"10px 6px",textAlign:"center" }}>
                  <div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:1,marginBottom:5,fontWeight:600 }}>{l}</div>
                  <div style={{ fontSize:16,fontWeight:800,color:c }}>{v||"Ã¢ÂÂ"}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {[["Sport",player.sport],["Position",player.position],["High School",player.high_school],["Graduation",player.graduation_year],["Major",player.major],["University",player.university||"TBD"]].filter(([,v])=>v).map(([l,v])=>(
                <div key={l}><div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3,fontWeight:600 }}>{l}</div><div style={{ fontSize:12,color:"#374151",fontWeight:500 }}>{v}</div></div>
              ))}
            </div>
          </div>
          <div style={{ background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.12)",borderRadius:12,padding:"14px 18px",fontSize:12,color:"#818cf8" }}>
            Ã°ÂÂÂ¬ Questions? Contact your agent: <strong>futboluagency@gmail.com</strong> ÃÂ· WhatsApp <strong>+34 603 331 990</strong>
          </div>
        </div>}

        {/* OFFERS TAB */}
        {tab==="offers"&&<div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {offers.filter(o=>o.status!=="Declined").length===0&&<div style={{ textAlign:"center",padding:40,color:"#4b5563" }}><div style={{ fontSize:28,marginBottom:8 }}>Ã°ÂÂÂÃ¯Â¸Â</div><div>No offers yet Ã¢ÂÂ your agent is working on it!</div></div>}
          {offers.filter(o=>o.status!=="Declined").sort((a,b)=>(b.amount||0)-(a.amount||0)).map(o=>(
            <div key={o.id} style={{ background:"#faf8f5",border:`1px solid ${o.status==="Chosen Ã¢ÂÂ"?"rgba(34,197,94,0.2)":"rgba(255,255,255,0.06)"}`,borderRadius:14,padding:"16px 18px" }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:12 }}>
                <div style={{ width:40,height:40,borderRadius:9,background:"linear-gradient(135deg,#1e3a8a,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0 }}>{o.university?.split(" ").map(w=>w[0]).slice(0,2).join("")||"U"}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15,fontWeight:700,color:"#1a1a2e",marginBottom:5 }}>{o.university}</div>
                  <div style={{ display:"flex",gap:10,flexWrap:"wrap",fontSize:12,color:"#6b7280",marginBottom:8 }}>
                    {o.state&&<span>{o.state}</span>}
                    {o.division&&<span style={{ color:"#6b7280" }}>{o.division}</span>}
                    {o.season&&<span style={{ color:"#f59e0b",fontWeight:600 }}>{o.season}</span>}
                  </div>
                  <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
                    {o.scholarship_pct>0&&<span style={{ padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:700,background:"rgba(99,102,241,0.1)",color:"#818cf8" }}>Scholarship: {o.scholarship_pct}%</span>}
                    {o.amount&&<span style={{ padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:700,background:"rgba(16,185,129,0.1)",color:"#10b981" }}>{Number(o.amount).toLocaleString()}Ã¢ÂÂ¬/year</span>}
                    <span style={{ padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:600,background:`${offerColors[o.status]||"#6b7280"}15`,color:offerColors[o.status]||"#6b7280",border:`1px solid ${offerColors[o.status]||"#6b7280"}25` }}>{o.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>}

        {/* PROCESS TAB */}
        {tab==="process"&&<div>
          <div style={{ background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.12)",borderRadius:12,padding:"12px 16px",marginBottom:14,fontSize:13,color:"#818cf8" }}>
            Ã°ÂÂÂ¯ Track your admission process. Your agent will update each step as you progress.
          </div>
          <AdmissionChecklist playerId={player.id} isAdmin={false}/>
        </div>}

        {/* DOCUMENTS TAB */}
        {tab==="documents"&&<div>
          <div style={{ background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.15)",borderRadius:12,padding:"12px 16px",marginBottom:14,fontSize:13,color:"#fbbf24" }}>
            Ã°ÂÂÂ Upload all required documents. Files are securely stored and reviewed by FUTBOLUAGENCY. Accepted formats: PDF, JPG, PNG.
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {REQUIRED_DOCS.map(doc=>{
              const uploaded = documents.find(d=>d.doc_type===doc.id);
              const isUploading = uploading[doc.id];
              return (
                <div key={doc.id} style={{ background:"#faf8f5",border:`1px solid ${uploaded?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.06)"}`,borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:14 }}>
                  <div style={{ width:36,height:36,borderRadius:9,background:uploaded?"rgba(16,185,129,0.12)":"rgba(255,255,255,0.04)",border:`1px solid ${uploaded?"rgba(16,185,129,0.25)":"rgba(255,255,255,0.08)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0 }}>
                    {uploaded?"Ã¢ÂÂ":"Ã°ÂÂÂ"}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:"#1a1a2e",marginBottom:2 }}>{doc.label}</div>
                    <div style={{ fontSize:11,color:"#4b5563" }}>{doc.desc}</div>
                    {uploaded&&<div style={{ fontSize:11,color:"#10b981",marginTop:3 }}>Ã¢ÂÂ {uploaded.file_name} ÃÂ· {uploaded.status}</div>}
                  </div>
                  <div style={{ flexShrink:0 }}>
                    <input ref={el=>fileRefs.current[doc.id]=el} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:"none" }} onChange={e=>{ const f=e.target.files[0]; if(f) uploadDoc(doc.id,doc.label,f); }}/>
                    <button onClick={()=>fileRefs.current[doc.id]?.click()} disabled={isUploading} style={{ padding:"7px 14px",borderRadius:8,border:`1px solid ${uploaded?"rgba(16,185,129,0.3)":"rgba(99,102,241,0.3)"}`,background:uploaded?"rgba(16,185,129,0.08)":"rgba(99,102,241,0.1)",color:uploaded?"#10b981":"#818cf8",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap" }}>
                      {isUploading?"Uploading...":uploaded?"Replace":"Upload"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>}
      </div>
    </div>
  );
};

const FOLLOW_UP_STATUSES = [
  { id:"new", label:"Nuevo", color:"#6366f1" },
  { id:"eligible", label:"Elegible", color:"#10b981" },
  { id:"not_eligible", label:"No elegible", color:"#ef4444" },
  { id:"next_year", label:"Proximo aÃÂ±o", color:"#f59e0b" },
  { id:"in_progress", label:"En proceso", color:"#3b82f6" },
  { id:"signed", label:"Firmado", color:"#22c55e" },
];

const LeadDetailFull = ({ lead, onClose, onConvert, onDelete, onRefresh, profile, isAdmin, agentProfiles }) => {
  const [tab, setTab] = useState("profile");
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [followUpStatus, setFollowUpStatus] = useState(lead.follow_up_status||"new");
  const [followUpDate, setFollowUpDate] = useState(lead.follow_up_date||"");
  const [followUpNotes, setFollowUpNotes] = useState(lead.follow_up_notes||"");
  const [savingFollow, setSavingFollow] = useState(false);
  const msgEndRef = useRef(null);

  useEffect(() => { loadMessages(); }, [lead.id]);
  useEffect(() => { msgEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  const loadMessages = async () => {
    const {data} = await supabase.from("lead_messages").select("*").eq("lead_id",lead.id).order("created_at");
    setMessages(data||[]);
  };

  const sendMessage = async () => {
    if(!newMsg.trim()) return;
    setSending(true);
    const {error} = await supabase.from("lead_messages").insert({ 
      lead_id: lead.id, 
      sender_name: profile?.name||"CEO", 
      sender_role: isAdmin?"CEO":profile?.role==="latam_director"?"Director LATAM":"Reclutador", 
      message: newMsg.trim() 
    });
    if(error) { alert(`Error: ${error.message}`); setSending(false); return; }
    setNewMsg("");
    await loadMessages();
    setSending(false);

    // Send email to ALL recruiters + CEO when anyone writes in chat
    const msgText = newMsg.trim();
    const emailBody = `Nuevo mensaje en el lead ${lead.name}:\n\n"${msgText}"\n\nEscrito por: ${profile?.name||"Equipo"}\nDeporte: ${lead.sport||"Ã¢ÂÂ"} ÃÂ· ${lead.nationality||"Ã¢ÂÂ"}`;
    const CEO_EMAIL = "futboluagency@gmail.com";
    
    // Always notify CEO
    if(profile?.email !== CEO_EMAIL) {
      fetch("/api/send-email", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ type:"calendar_invite", to:CEO_EMAIL, eventTitle:`Chat lead ${lead.name}: nuevo mensaje`, eventDate:new Date().toISOString().split("T")[0], body:emailBody, senderName:profile?.name||"Equipo" })
      }).catch(()=>{});
    }
    // Notify the agent assigned to this lead
    if(lead.referred_by && agentProfiles?.length>0) {
      const agentProfile = agentProfiles.find(p=>
        p.name?.toLowerCase().includes((lead.referred_by||"").split(" ")[0].toLowerCase()) ||
        (lead.referred_by||"").toLowerCase().includes((p.name||"").split(" ")[0].toLowerCase())
      );
      if(agentProfile?.email && agentProfile.email !== profile?.email && agentProfile.email !== CEO_EMAIL) {
        fetch("/api/send-email", { method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ type:"calendar_invite", to:agentProfile.email, eventTitle:`Tu lead ${lead.name}: nuevo mensaje`, eventDate:new Date().toISOString().split("T")[0], body:emailBody, senderName:profile?.name||"Equipo" })
        }).catch(()=>{});
      }
    }
  };

  const saveFollowUp = async () => {
    setSavingFollow(true);
    const {error} = await supabase.from("leads").update({ 
      follow_up_status: followUpStatus, 
      follow_up_date: followUpDate||null, 
      follow_up_notes: followUpNotes 
    }).eq("id", lead.id);
    if(error) { alert(`Error: ${error.message}`); setSavingFollow(false); return; }
    await onRefresh();
    setSavingFollow(false);
  };

  const statusColors = {"Scholarship":"#10b981","In Process":"#f59e0b","Prospect":"#6366f1","Inactive":"#6b7280"};
  const inp = { background:"#f9f7f4", border:"1px solid #e5e0d8", borderRadius:8, padding:"9px 12px", color:"#1a1a2e", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:16 }}>
      <div style={{ background:"#fff",borderRadius:20,width:"100%",maxWidth:660,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        {/* Header */}
        <div style={{ padding:"22px 24px 16px",borderBottom:"1px solid #f0ebe3" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
            <div>
              <h2 style={{ fontSize:20,fontWeight:800,color:"#1a1a2e",marginBottom:6 }}>{lead.name}</h2>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                {lead.sport&&<span style={{ padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:600,background:"rgba(99,102,241,0.1)",color:"#6366f1" }}>{lead.sport}</span>}
                {lead.nationality&&<span style={{ padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:500,background:"#f5f0e8",color:"#6b7280" }}>{lead.nationality}</span>}
                {lead.referred_by&&<span style={{ padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:600,background:"rgba(16,185,129,0.1)",color:"#10b981" }}>Ref: {lead.referred_by}</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ background:"#f5f0e8",border:"none",color:"#6b7280",cursor:"pointer",width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center" }}>Ã¢ÂÂ</button>
          </div>
          {/* Budget highlight */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14 }}>
            <div style={{ background:lead.budget?"rgba(16,185,129,0.08)":"#f9f7f4",border:`1px solid ${lead.budget?"rgba(16,185,129,0.2)":"#e8e3db"}`,borderRadius:10,padding:"12px 16px",textAlign:"center" }}>
              <div style={{ fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontWeight:600 }}>Budget anual</div>
              <div style={{ fontSize:20,fontWeight:900,color:lead.budget?"#10b981":"#9ca3af" }}>{lead.budget?`$${Number(lead.budget).toLocaleString()}`:"No indicado"}</div>
            </div>
            <div style={{ background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:10,padding:"12px 16px",textAlign:"center" }}>
              <div style={{ fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontWeight:600 }}>Beca buscada</div>
              <div style={{ fontSize:20,fontWeight:900,color:"#6366f1" }}>{lead.scholarship_pct?`${lead.scholarship_pct}%`:"Ã¢ÂÂ"}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex",gap:2,padding:"10px 24px",borderBottom:"1px solid #f0ebe3",background:"#faf8f5" }}>
          {[{id:"profile",l:"Perfil"},{id:"followup",l:"Seguimiento"},{id:"tasks",l:"Tareas"},{id:"chat",l:`Chat (${messages.length})`}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:tab===t.id?"#fff":"none",color:tab===t.id?"#1a1a2e":"#6b7280",fontFamily:"inherit",boxShadow:tab===t.id?"0 1px 4px rgba(0,0,0,0.08)":"none" }}>{t.l}</button>
          ))}
        </div>

        <div style={{ padding:"20px 24px" }}>
          {/* PROFILE TAB */}
          {tab==="profile"&&<div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8 }}>
              {[["GPA",lead.gpa,lead.gpa>=3.5?"#10b981":lead.gpa>=3?"#f59e0b":"#9ca3af"],["SAT",lead.sat_score,"#6366f1"],["TOEFL",lead.toefl_score,"#8b5cf6"],["Ingles",lead.english_level,"#3b82f6"]].map(([l,v,c])=>(
                <div key={l} style={{ background:"#f9f7f4",border:"1px solid #e8e3db",borderRadius:10,padding:"12px 8px",textAlign:"center" }}>
                  <div style={{ fontSize:9,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:5,fontWeight:600 }}>{l}</div>
                  <div style={{ fontSize:18,fontWeight:800,color:c }}>{v||"Ã¢ÂÂ"}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {[["Email",lead.email],["Telefono",lead.phone],["Instituto",lead.high_school],["Graduacion",lead.graduation_year],["Major",lead.major],["Posicion",lead.position]].filter(([,v])=>v).map(([l,v])=>(
                <div key={l} style={{ background:"#f9f7f4",borderRadius:8,padding:"9px 12px",border:"1px solid #e8e3db" }}>
                  <div style={{ fontSize:9,color:"#9ca3af",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3,fontWeight:600 }}>{l}</div>
                  <div style={{ fontSize:13,color:"#1a1a2e",fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>
            {lead.video_url&&<a href={lead.video_url} target="_blank" rel="noreferrer" style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:10,textDecoration:"none",color:"#ef4444",fontSize:13,fontWeight:600 }}>Ver video highlight</a>}
            {lead.notes&&<div style={{ background:"#f9f7f4",border:"1px solid #e8e3db",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#374151" }}>{lead.notes}</div>}
            <div style={{ display:"flex",gap:10,marginTop:4 }}>
              {isAdmin&&<button onClick={()=>{ if(window.confirm(`Convertir a ${lead.name} en atleta?`)){ onConvert(lead); onClose(); }}} style={{ flex:2,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit" }}>Convertir en atleta</button>}
              {isAdmin&&<button onClick={()=>{ if(window.confirm(`Eliminar lead ${lead.name}?`)){ onDelete(lead.id); onClose(); }}} style={{ flex:1,padding:"11px",borderRadius:10,border:"1px solid #fecaca",background:"none",color:"#ef4444",cursor:"pointer",fontSize:13,fontFamily:"inherit" }}>Eliminar</button>}
            </div>
          </div>}

          {/* FOLLOW-UP TAB */}
          {tab==="followup"&&<div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <div>
              <div style={{ fontSize:11,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:10 }}>Estado del lead</div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8 }}>
                {FOLLOW_UP_STATUSES.map(s=>(
                  <div key={s.id} onClick={()=>setFollowUpStatus(s.id)} style={{ padding:"10px 12px",borderRadius:10,border:`2px solid ${followUpStatus===s.id?s.color:"#e8e3db"}`,background:followUpStatus===s.id?`${s.color}12`:"#f9f7f4",cursor:"pointer",textAlign:"center" }}>
                    <div style={{ fontSize:12,fontWeight:600,color:followUpStatus===s.id?s.color:"#6b7280" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            {(followUpStatus==="next_year"||followUpStatus==="not_eligible")&&(
              <div>
                <div style={{ fontSize:11,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:6 }}>Fecha de seguimiento</div>
                <input style={{ ...inp,width:"100%" }} type="date" value={followUpDate} onChange={e=>setFollowUpDate(e.target.value)}/>
              </div>
            )}
            <div>
              <div style={{ fontSize:11,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:6 }}>Notas del seguimiento</div>
              <textarea style={{ ...inp,width:"100%",minHeight:100,resize:"vertical" }} value={followUpNotes} onChange={e=>setFollowUpNotes(e.target.value)} placeholder="Razon por la que no es elegible ahora, que falta, cuando volver a contactar..."/>
            </div>
            {followUpStatus==="next_year"&&<div style={{ background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#92400e" }}>
              Este lead se guardara para el proximo aÃÂ±o. Aparecera en seguimientos pendientes cuando llegue la fecha.
            </div>}
            <button onClick={saveFollowUp} disabled={savingFollow} style={{ padding:"11px",borderRadius:10,border:"none",background:"#1a1a2e",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",opacity:savingFollow?0.7:1 }}>
              {savingFollow?"Guardando...":"Guardar seguimiento"}
            </button>
            {/* Send booking link */}
            <div style={{ marginTop:8,padding:"12px 14px",background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:10 }}>
              <div style={{ fontSize:12,fontWeight:600,color:"#6366f1",marginBottom:8 }}>Enviar link de reunion al lead</div>
              <div style={{ fontSize:11,color:"#6b7280",marginBottom:10 }}>El lead podra elegir un hueco de tu calendario para reunirse contigo</div>
              <div style={{ display:"flex",gap:8 }}>
                {lead.email&&<button onClick={async()=>{
                  const bookingUrl=`${window.location.origin}?booking=1`;
                  await fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"lead_meeting",to:lead.email,eventTitle:"Agenda una reunion con FUTBOLUAGENCY",eventDate:"",eventTime:"",body:`Hola ${lead.name},\n\nTe enviamos el link para que puedas agendar una llamada con nosotros cuando mejor te venga.\n\nElige tu hueco aqui: ${bookingUrl}\n\nEstamos encantados de hablar contigo sobre tu beca deportiva.\n\nUn saludo,\nEquipo FUTBOLUAGENCY`})});
                  alert(`Link enviado a ${lead.email}`);
                }} style={{ flex:1,padding:"8px",borderRadius:8,border:"none",background:"#6366f1",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit" }}>Enviar por email</button>}
                <button onClick={()=>{ navigator.clipboard.writeText(`${window.location.origin}?booking=1`); alert("Link copiado"); }} style={{ flex:1,padding:"8px",borderRadius:8,border:"1px solid #e8e3db",background:"#fff",color:"#374151",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit" }}>Copiar link</button>
              </div>
            </div>
          </div>}

          {/* TASKS TAB */}
          {tab==="tasks"&&<TasksPanel leadId={lead.id} agentNames={[]} currentUser={profile?.name}/>}

          {/* CHAT TAB */}
          {tab==="chat"&&<div>
            <div style={{ fontSize:12,color:"#9ca3af",marginBottom:12 }}>Chat interno entre el equipo sobre este lead. Solo visible internamente.</div>
            <div style={{ background:"#f9f7f4",border:"1px solid #e8e3db",borderRadius:12,padding:"14px",minHeight:200,maxHeight:300,overflowY:"auto",marginBottom:12 }}>
              {messages.length===0&&<div style={{ color:"#9ca3af",fontSize:13,textAlign:"center",padding:"20px 0" }}>Sin mensajes todavia</div>}
              {messages.map(m=>(
                <div key={m.id} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                    <div style={{ width:24,height:24,borderRadius:"50%",background:m.sender_role==="CEO"?"#6366f1":"#10b981",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff" }}>{(m.sender_name||"?")[0].toUpperCase()}</div>
                    <span style={{ fontSize:12,fontWeight:600,color:"#374151" }}>{m.sender_name}</span>
                    <span style={{ fontSize:10,color:"#9ca3af" }}>{m.sender_role}</span>
                    <span style={{ fontSize:10,color:"#9ca3af",marginLeft:"auto" }}>{new Date(m.created_at).toLocaleDateString("es-ES")} {new Date(m.created_at).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}</span>
                  </div>
                  <div style={{ marginLeft:32,fontSize:13,color:"#374151",background:"#fff",border:"1px solid #e8e3db",borderRadius:8,padding:"8px 12px" }}>{m.message}</div>
                </div>
              ))}
              <div ref={msgEndRef}/>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <input style={{ ...inp,flex:1 }} value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()} placeholder="Escribe un mensaje..."/>
              <button onClick={sendMessage} disabled={sending||!newMsg.trim()} style={{ padding:"9px 18px",borderRadius:8,border:"none",background:newMsg.trim()?"#1a1a2e":"#e8e3db",color:newMsg.trim()?"#fff":"#9ca3af",cursor:newMsg.trim()?"pointer":"default",fontSize:13,fontWeight:600,fontFamily:"inherit" }}>Enviar</button>
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
};

const EarningsForm = ({ players, agentProfiles, onSave }) => {
  const [f,setF]=useState({ player_id:"",referred_by:"",amount:"",percentage:"",notes:"" });
  const [saving,setSaving]=useState(false);
  const inp2 = { background:"#f0ebe3",border:"1px solid #e0dbd3",borderRadius:8,padding:"8px 12px",color:"#1a1a2e",fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit" };
  const selectedPlayer = players.find(p=>p.id===f.player_id);
  const suggested = selectedPlayer && f.percentage ? Math.round((selectedPlayer.totalFee||2700)*(parseFloat(f.percentage)/100)) : 0;
  const save = async () => {
    if(!f.player_id||!f.referred_by||!f.amount) return;
    setSaving(true);
      try {
    await onSave({ player_id:f.player_id, referred_by:f.referred_by, percentage:parseFloat(f.percentage)||0, amount:parseFloat(f.amount)||0, notes:f.notes, paid:false });
    setF({ player_id:"",referred_by:"",amount:"",percentage:"",notes:"" });
      } catch(e) {
        setError("Error al guardar. Inténtalo de nuevo.");
        console.error(e);
      } finally {
        setSaving(false);
      }
  };
  return (
    <Card style={{ padding:"18px 20px",border:"1px solid rgba(245,158,11,0.12)",marginBottom:16 }}>
      <div style={{ fontSize:11,fontWeight:700,color:"#f59e0b",textTransform:"uppercase",letterSpacing:1.2,marginBottom:14 }}>Registrar ganancia de reclutador</div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
        <div><label style={{ fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:5,display:"block" }}>Atleta</label>
          <select style={{ ...inp2,width:"100%",cursor:"pointer" }} value={f.player_id} onChange={e=>setF(x=>({...x,player_id:e.target.value}))}>
            <option value="">Seleccionar atleta...</option>
            {players.map(p=><option key={p.id} value={p.id}>{p.name} ({p.totalFee||2700}Ã¢ÂÂ¬)</option>)}
          </select>
        </div>
        <div><label style={{ fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:5,display:"block" }}>Reclutador</label>
          <select style={{ ...inp2,width:"100%",cursor:"pointer" }} value={f.referred_by} onChange={e=>setF(x=>({...x,referred_by:e.target.value}))}>
            <option value="">Seleccionar reclutador...</option>
            {agentProfiles.filter(p=>p.role!=="admin"&&p.role!=="ceo").map(p=><option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>
        <div><label style={{ fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:5,display:"block" }}>% ComisiÃÂ³n</label>
          <input style={{ ...inp2,width:"100%" }} type="number" min="0" max="100" value={f.percentage} onChange={e=>setF(x=>({...x,percentage:e.target.value,amount:Math.round((selectedPlayer?.totalFee||2700)*(parseFloat(e.target.value)/100))||""}))} placeholder="20"/>
        </div>
        <div><label style={{ fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:5,display:"block" }}>Importe (Ã¢ÂÂ¬) {suggested>0&&<span style={{ color:"#f59e0b" }}>sugerido: {suggested}Ã¢ÂÂ¬</span>}</label>
          <input style={{ ...inp2,width:"100%" }} type="number" value={f.amount} onChange={e=>setF(x=>({...x,amount:e.target.value}))} placeholder={suggested||"500"}/>
        </div>
        <div style={{ gridColumn:"1/-1" }}><label style={{ fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:5,display:"block" }}>Notas</label>
          <input style={{ ...inp2,width:"100%" }} value={f.notes} onChange={e=>setF(x=>({...x,notes:e.target.value}))} placeholder="Observaciones del acuerdo..."/>
        </div>
      </div>
      <button onClick={save} disabled={saving||!f.player_id||!f.referred_by||!f.amount} style={{ marginTop:14,width:"100%",padding:"10px",borderRadius:9,border:"none",background:(!f.player_id||!f.referred_by||!f.amount)?"rgba(255,255,255,0.04)":"linear-gradient(135deg,#f59e0b,#d97706)",color:(!f.player_id||!f.referred_by||!f.amount)?"#4b5563":"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",opacity:saving?0.7:1 }}>
        {saving?"Guardando...":"+ Registrar ganancia"}
      </button>
    </Card>
  );
};

const RecruiterProfileModal = ({ agentProfile, onClose, onSave, isAdmin }) => {
  const PERM_LABELS = {
    view_dashboard:"Ver Dashboard",
    view_players:"Ver Jugadores",
    view_leads:"Ver Leads",
    view_offers:"Ver Universidades y Entrenadores",
    view_payments:"Ver Pagos y Revenue",
    view_commissions:"Ver sus Ganancias",
    view_team:"Ver Equipo",
    create_players:"Crear jugadores",
    delete_players:"Eliminar jugadores",
    manage_offers:"Gestionar ofertas",
  };
  const current = typeof agentProfile.permissions==="string" ? JSON.parse(agentProfile.permissions) : (agentProfile.permissions||DEFAULT_PERMISSIONS);
  const [perms, setPerms] = useState({...DEFAULT_PERMISSIONS,...current});
  const [name, setName] = useState(agentProfile.display_name||agentProfile.name||"");
  const [region, setRegion] = useState(agentProfile.region||"global");
  const [phone, setPhone] = useState(agentProfile.phone||"");
  const [bio, setBio] = useState(agentProfile.bio||"");
  const [tab, setTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  const toggle = (k) => setPerms(p=>({...p,[k]:!p[k]}));

  const save = async () => {
    setSaving(true);
      try {
    // Update agent_profiles
    await supabase.from("agent_profiles").update({
      display_name: name||null,
      name: name||agentProfile.name,
      region,
      phone: phone||null,
      bio: bio||null,
      permissions: JSON.stringify(perms),
    }).eq("id", agentProfile.id);
    // Also update agents table if exists
    if(agentProfile.email) {
      await supabase.from("agents").update({ name, region, phone }).eq("email", agentProfile.email);
    }
    await onSave(agentProfile.id, perms);
      } catch(e) {
        setError("Error al guardar. Inténtalo de nuevo.");
        console.error(e);
      } finally {
        setSaving(false);
      }
    onClose();
  };

  const inp = { background:"#f9f7f4", border:"1px solid #e5e0d8", borderRadius:8, padding:"9px 12px", color:"#1a1a2e", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:16 }}>
      <div style={{ background:"#fff",borderRadius:18,width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        {/* Header */}
        <div style={{ padding:"20px 24px 0", borderBottom:"1px solid #f0ebe3" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
            <div>
              <h3 style={{ margin:0,fontSize:16,fontWeight:700,color:"#1a1a2e" }}>Perfil de {agentProfile.name}</h3>
              <div style={{ fontSize:11,color:"#9ca3af",marginTop:3 }}>{agentProfile.email}</div>
            </div>
            <button onClick={onClose} style={{ background:"#f5f0e8",border:"none",color:"#6b7280",cursor:"pointer",width:28,height:28,borderRadius:7 }}>Ã¢ÂÂ</button>
          </div>
          {/* Tabs */}
          <div style={{ display:"flex",gap:2 }}>
            {[{id:"profile",l:"Perfil"},{id:"permissions",l:"Permisos"},{id:"region",l:"Region"}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"7px 16px",borderRadius:"8px 8px 0 0",border:"none",cursor:"pointer",fontSize:12,fontWeight:tab===t.id?700:500,background:tab===t.id?"#fff":"#f9f7f4",color:tab===t.id?"#1a1a2e":"#9ca3af",fontFamily:"inherit",borderBottom:tab===t.id?"2px solid #6366f1":"2px solid transparent" }}>{t.l}</button>
            ))}
          </div>
        </div>

        <div style={{ padding:"20px 24px" }}>
          {/* PROFILE TAB */}
          {tab==="profile"&&<div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <div>
              <label style={{ fontSize:11,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:5,display:"block" }}>Nombre que se mostrara</label>
              <input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre del reclutador"/>
            </div>
            <div>
              <label style={{ fontSize:11,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:5,display:"block" }}>Telefono / WhatsApp</label>
              <input style={inp} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+34 ..."/>
            </div>
            <div>
              <label style={{ fontSize:11,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:0.8,marginBottom:5,display:"block" }}>Bio / Descripcion</label>
              <textarea style={{ ...inp,minHeight:70,resize:"vertical" }} value={bio} onChange={e=>setBio(e.target.value)} placeholder="Especialidad, paises, deportes que cubre..."/>
            </div>
            <div style={{ background:"#f9f7f4",border:"1px solid #e8e3db",borderRadius:10,padding:"12px 14px",fontSize:12,color:"#6b7280" }}>
              Email de acceso: <strong style={{ color:"#1a1a2e" }}>{agentProfile.email}</strong>
            </div>
          </div>}

          {/* PERMISSIONS TAB */}
          {tab==="permissions"&&<div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            <div style={{ fontSize:12,color:"#9ca3af",marginBottom:8 }}>Activa o desactiva las secciones a las que puede acceder este reclutador.</div>
            {Object.entries(PERM_LABELS).map(([k,label])=>(
              <div key={k} onClick={()=>toggle(k)} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:perms[k]?"rgba(99,102,241,0.06)":"#f9f7f4",border:`1px solid ${perms[k]?"rgba(99,102,241,0.2)":"#e8e3db"}`,borderRadius:9,cursor:"pointer" }}>
                <span style={{ fontSize:13,color:perms[k]?"#1a1a2e":"#9ca3af",fontWeight:perms[k]?500:400 }}>{label}</span>
                <div style={{ width:36,height:20,borderRadius:20,background:perms[k]?"#6366f1":"#e8e3db",position:"relative",transition:"background .2s",flexShrink:0 }}>
                  <div style={{ position:"absolute",top:2,left:perms[k]?18:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s" }}/>
                </div>
              </div>
            ))}
            <div style={{ display:"flex",gap:8,marginTop:8 }}>
              <button onClick={()=>setPerms(Object.fromEntries(Object.keys(PERM_LABELS).map(k=>[k,true])))} style={{ flex:1,padding:"8px",borderRadius:8,border:"1px solid #e8e3db",background:"#fff",color:"#6366f1",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit" }}>Todo on</button>
              <button onClick={()=>setPerms(DEFAULT_PERMISSIONS)} style={{ flex:1,padding:"8px",borderRadius:8,border:"1px solid #e8e3db",background:"#fff",color:"#9ca3af",cursor:"pointer",fontSize:12,fontFamily:"inherit" }}>Resetear</button>
            </div>
          </div>}

          {/* REGION TAB */}
          {tab==="region"&&<div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <div style={{ fontSize:12,color:"#9ca3af",marginBottom:4 }}>Define el area de trabajo de este reclutador. Determinara que atletas y leads puede ver.</div>
            {[
              {id:"global",l:"Global",d:"Ve todos los atletas y leads de todas las regiones",color:"#6366f1"},
              {id:"latam",l:"LATAM",d:"Solo atletas y leads de Latinoamerica (equipo de Miguel)",color:"#10b981"},
              {id:"europe",l:"Europa",d:"Solo atletas y leads de paises europeos",color:"#3b82f6"},
              {id:"usa",l:"USA",d:"Solo atletas y leads basados en USA",color:"#f59e0b"},
            ].map(r=>(
              <div key={r.id} onClick={()=>setRegion(r.id)} style={{ padding:"14px 16px",borderRadius:10,border:`2px solid ${region===r.id?r.color:"#e8e3db"}`,background:region===r.id?`${r.color}08`:"#f9f7f4",cursor:"pointer" }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <div style={{ fontSize:14,fontWeight:700,color:region===r.id?r.color:"#1a1a2e" }}>{r.l}</div>
                  {region===r.id&&<div style={{ width:20,height:20,borderRadius:"50%",background:r.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff" }}>Ã¢ÂÂ</div>}
                </div>
                <div style={{ fontSize:12,color:"#9ca3af",marginTop:4 }}>{r.d}</div>
              </div>
            ))}
          </div>}

          {/* Save button */}
          <div style={{ display:"flex",gap:10,marginTop:20 }}>
            <button onClick={onClose} style={{ flex:1,padding:"10px",borderRadius:9,border:"1px solid #e8e3db",background:"none",color:"#6b7280",cursor:"pointer",fontFamily:"inherit" }}>Cancelar</button>
            <button onClick={save} disabled={saving} style={{ flex:2,padding:"10px",borderRadius:9,border:"none",background:saving?"#e8e3db":"#1a1a2e",color:saving?"#9ca3af":"#fff",cursor:"pointer",fontWeight:600,fontFamily:"inherit" }}>{saving?"Guardando...":"Guardar cambios"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PermissionsModal = RecruiterProfileModal;

export default function App() {
  // Check public routes BEFORE any auth Ã¢ÂÂ prevents auth loading from blocking public pages
  const urlParams = new URLSearchParams(window.location.search);
  const isBooking = urlParams.get("booking");
  const isLeadForm = urlParams.get("form");
  const athleteToken = urlParams.get("athlete");
  const publicPlayerId = urlParams.get("player");
  if(isBooking) return <BookingPage/>;
  if(isLeadForm) return <LeadForm/>;
  if(athleteToken) return <AthletePortal token={athleteToken}/>;
  if(publicPlayerId) return <PublicPlayerPage playerId={publicPlayerId}/>;

  return <AppInner/>;
}

function AppInner() {
  const { user, profile, loading:authLoading, isAdmin, isLatamDirector, signOut, can, updatePermissions } = useAuth();
  const [agentProfiles, setAgentProfiles] = useState([]);
  const [permModal, setPermModal] = useState(null);
  const [players,setPlayers]=useState([]);
  const [agents,setAgents]=useState([]);
  const [leads,setLeads]=useState([]);
  const [commissions,setCommissions]=useState([]);
  const [loading,setLoading]=useState(true);
  const [nav,setNav]=useState("dashboard");
  const [selected,setSelected]=useState(null);
  const [search,setSearch]=useState("");
  const [fSport,setFSport]=useState("Todos");
  const [fStatus,setFStatus]=useState("Todos");
  const [fAgent,setFAgent]=useState("Todos");
  const [addModal,setAddModal]=useState(false);
  const [agentModal,setAgentModal]=useState(null);
  const [selectedLead,setSelectedLead]=useState(null);
  const [menuOpen,setMenuOpen]=useState(false);
  const [currentAgent,setCurrentAgent]=useState(null); // agent from URL

  const agentNames=agents.length>0?agents.map(a=>a.name):["Moha","Ignacio de BÃÂ©jar"];

  // Check URL for agent link
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const agentSlug=params.get("agent");
    if(agentSlug) setCurrentAgent(agentSlug);
  },[]);

  const loadAll=useCallback(async()=>{
    setLoading(true);
    try {
      const [{data:rows},{data:allOffers},{data:allTimeline},{data:agentRows},{data:leadRows},{data:commRows},{data:profileRows}]=await Promise.all([
        supabase.from("players").select("*").order("created_at",{ascending:false}),
        supabase.from("offers").select("*"),
        supabase.from("timeline").select("*").order("date",{ascending:true}),
        supabase.from("agents").select("*").order("created_at",{ascending:true}),
        supabase.from("leads").select("*").order("created_at",{ascending:false}),
        supabase.from("commissions").select("*").order("created_at",{ascending:false}),
        supabase.from("agent_profiles").select("*").order("created_at",{ascending:true}),
      ]);
      const mapped=(rows||[]).map(r=>dbToPlayer(r,(allOffers||[]).filter(o=>o.player_id===r.id),(allTimeline||[]).filter(t=>t.player_id===r.id)));
      setPlayers(mapped); setAgents(agentRows||[]); setLeads(leadRows||[]); setCommissions(commRows||[]); setAgentProfiles(profileRows||[]);
      setSelected(prev=>prev?(mapped.find(p=>p.id===prev.id)||prev):null);
      // Set current agent name from slug
      if(agentRows&&agentRows.length>0){
        const params=new URLSearchParams(window.location.search);
        const slug=params.get("agent");
        if(slug){ const found=agentRows.find(a=>a.name.toLowerCase().replace(/\s+/g,"-").includes(slug.toLowerCase())||slug.toLowerCase().includes(a.name.split(" ")[0].toLowerCase())); if(found) setCurrentAgent(found.name); }
      }
    } catch(e){ console.error(e); }
    setLoading(false);
  },[]); // eslint-disable-line

  useEffect(()=>{ loadAll(); },[]); // eslint-disable-line

  const addPlayer=async(p)=>{ const {data}=await supabase.from("players").insert(playerToDb(p)).select().single(); if(data) await supabase.from("timeline").insert({player_id:data.id,date:new Date().toISOString().split("T")[0],event:"Perfil creado",type:"contact"}); await loadAll(); };
  const saveAgent=async(a)=>{ 
    if(a.id) {
      const {error} = await supabase.from("agents").update({name:a.name,role:a.role,email:a.email||null,phone:a.phone||null,photo_url:a.photoUrl||null,region:a.region||"global"}).eq("id",a.id);
      if(error) throw error;
    } else {
      const {error} = await supabase.from("agents").insert({name:a.name,role:a.role||"Reclutador",email:a.email||null,phone:a.phone||null,photo_url:a.photoUrl||null,region:a.region||"global"});
      if(error) throw error;
    }
    if(a.email) {
      await supabase.from("agent_profiles").update({name:a.name,region:a.region||"global"}).eq("email",a.email);
    }
    await loadAll();
  };
  const deleteAgent=async(id)=>{ await supabase.from("agents").delete().eq("id",id); await loadAll(); };
  const deleteLead=async(id)=>{ await supabase.from("leads").delete().eq("id",id); await loadAll(); };
  const generateAthleteToken = async (playerId) => {
    const token = Math.random().toString(36).substring(2,10) + Math.random().toString(36).substring(2,10);
    const {error} = await supabase.from("players").update({access_token:token}).eq("id",playerId);
    if(error){ console.error(error); return null; }
    await loadAll();
    return token;
  };
  const saveCommission = async (c) => {
    if(c.id) await supabase.from("commissions").update(c).eq("id",c.id);
    else await supabase.from("commissions").insert(c);
    await loadAll();
  };
  const deleteCommission = async (id) => { await supabase.from("commissions").delete().eq("id",id); await loadAll(); };
  const convertLead=async(lead)=>{
    const p={ name:lead.name,sport:lead.sport||"Soccer",nationality:lead.nationality,age:lead.age,position:lead.position,foot:"Right",height:lead.height,weight:lead.weight,status:"Prospect",agent:agentNames[0]||"",phone:lead.phone,email:lead.email,instagram:lead.instagram,videoUrl:lead.video_url,photoUrl:null,gpa:lead.gpa,satScore:lead.sat_score,englishLevel:lead.english_level,highSchool:lead.high_school,graduationYear:lead.graduation_year,major:lead.major,toeflScore:lead.toefl_score,university:"",state:"",scholarshipPct:lead.scholarship_pct||0,startDate:"",contractEnd:"",notes:lead.notes||"",totalFee:2700,payment1Amount:900,payment2Amount:1800,budget:lead.budget,fafsa:lead.fafsa||false,sportData:{} };
    await addPlayer(p);
    await supabase.from("leads").delete().eq("id",lead.id);
    await loadAll();
  };

  const LATAM_COUNTRIES = ["Colombia","Venezuela","Mexico","Argentina","Brasil","Peru","Chile","Ecuador","Uruguay","Paraguay","Bolivia","Costa Rica","Panama","Cuba","Dominican Republic","Guatemala","Honduras","El Salvador","Nicaragua","Haiti"];

  const myAgentName = !isAdmin && profile ? (
    agents.find(a=>a.email&&a.email.toLowerCase()===profile.email?.toLowerCase())?.name ||
    agentProfiles.find(p=>p.email===profile.email)?.name ||
    profile.name
  ) : null;

  const matchesAgent = (playerAgent) => {
    if(!myAgentName) return false;
    if(!playerAgent) return false;
    const pa = playerAgent.toLowerCase().trim();
    const ma = myAgentName.toLowerCase().trim();
    return pa===ma || pa.includes(ma.split(" ")[0]) || ma.includes(pa.split(" ")[0]);
  };

  const matchesAgentName = (playerAgent, agentName) => {
    if(!agentName||!playerAgent) return false;
    const pa = playerAgent.toLowerCase().trim();
    const an = agentName.toLowerCase().trim();
    return pa===an || pa.includes(an.split(" ")[0]) || an.includes(pa.split(" ")[0]);
  };

  // LATAM director sees all LATAM players/leads
  // Regular recruiter sees only their own
  const visiblePlayers = isAdmin ? players :
    isLatamDirector ? players.filter(p=>LATAM_COUNTRIES.includes(p.nationality)) :
    players.filter(p=>matchesAgent(p.agent));

  const visibleLeads = isAdmin ? leads :
    isLatamDirector ? leads.filter(l=>LATAM_COUNTRIES.includes(l.nationality)) :
    leads.filter(l=>{
      if(!l.referred_by) return false;
      const rb = l.referred_by.toLowerCase().trim();
      const ma = (myAgentName||"").toLowerCase().trim();
      return rb===ma || rb.includes(ma.split(" ")[0]) || ma.split(" ")[0].includes(rb.split(" ")[0]);
    });

  const filtered=useMemo(()=>visiblePlayers.filter(p=>{ const s=search.toLowerCase(); return (p.name.toLowerCase().includes(s)||p.university?.toLowerCase().includes(s)||p.nationality?.toLowerCase().includes(s))&&(fSport==="Todos"||p.sport===fSport)&&(fStatus==="Todos"||p.status===fStatus)&&(fAgent==="Todos"||p.agent===fAgent); }),[visiblePlayers,search,fSport,fStatus,fAgent]);

  const totalFees=visiblePlayers.reduce((s,p)=>s+(p.totalFee||2700),0);
  const totalColl=visiblePlayers.reduce((s,p)=>s+(p.payment1?.paid?(p.payment1Amount||900):0)+(p.payment2?.paid?(p.payment2Amount||1800):0),0);
  const agentStats=agentNames.map(name=>({ name,agent:agents.find(a=>a.name===name),total:visiblePlayers.reduce((s,p)=>s+(p.payment1?.paid&&p.payment1?.paidBy===name?(p.payment1Amount||900):0)+(p.payment2?.paid&&p.payment2?.paidBy===name?(p.payment2Amount||1800):0),0),p1:visiblePlayers.filter(p=>p.payment1?.paid&&p.payment1?.paidBy===name).length,p2:visiblePlayers.filter(p=>p.payment2?.paid&&p.payment2?.paidBy===name).length,count:visiblePlayers.filter(p=>p.agent===name).length }));
  const allOffers=visiblePlayers.flatMap(p=>(p.offers||[]).map(o=>({...o,playerName:p.name,playerId:p.id})));
  const go=(n)=>{ setNav(n); setSelected(null); setMenuOpen(false); };
  const allNavItems=[
    {id:"dashboard",l:"Dashboard",icon:I.dash,perm:"view_dashboard"},
    {id:"pipeline",l:"Pipeline",icon:I.players,perm:"view_leads"},
    {id:"players",l:"Jugadores",icon:I.players,perm:"view_players"},
    {id:"leads",l:"Leads",icon:I.players,perm:"view_leads"},
    {id:"offers",l:"Universidades",icon:I.uni,perm:"view_offers"},
    {id:"coaches",l:"Entrenadores",icon:I.team,perm:"view_offers"},
    {id:"payments",l:"Pagos",icon:I.fin,perm:"view_payments"},
    {id:"earnings",l:"Ganancias",icon:I.fin,perm:"view_commissions"},
    {id:"calendar",l:"Calendario",icon:I.dash,perm:"view_dashboard"},
    {id:"reuniones",l:"Reuniones",icon:I.dash,perm:"view_dashboard"},
    {id:"chat",l:"Chat equipo",icon:I.team,perm:"view_dashboard"},
    {id:"analytics",l:"Analiticas",icon:I.dash,perm:"view_payments"},
    {id:"team",l:"Equipo",icon:I.team,perm:"view_team"},
  ];
  const navItems = isLatamDirector
    ? allNavItems.filter(i=>["dashboard","pipeline","players","leads","offers","coaches","earnings","calendar","reuniones","chat"].includes(i.id))
    : allNavItems.filter(item=>can(item.perm));

  // Greeting for agent link
  const agentObj=currentAgent?agents.find(a=>a.name===currentAgent||a.name.toLowerCase().includes(currentAgent.toLowerCase())):null;

  // Auth check Ã¢ÂÂ show login if not authenticated
  if(authLoading) return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif",background:"#f5f0e8",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14 }}>
      <img src="/logo.png" alt="FUA" onError={e=>e.target.style.display="none"} style={{ height:52,objectFit:"contain" }}/>
      <div style={{ fontSize:13,color:"#374151" }}>Cargando...</div>
    </div>
  );
  if(!user) return <LoginPage/>;

  if(loading) return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif",background:"#f5f0e8",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap')`}</style>
      <img src="/logo.png" alt="FUA" onError={e=>e.target.style.display="none"} style={{ height:52,objectFit:"contain" }}/>
      <div style={{ fontSize:13,fontWeight:500,color:"#374151",letterSpacing:0.3 }}>Cargando FUTBOLUAGENCY CRM...</div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif",background:"#f5f0e8",color:"#1a1a2e",minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:#d4cfc7;border-radius:4px}
        select option{background:#fff;color:#1a1a2e}
        input,select,textarea{color:#1a1a2e!important}
        .prow:hover{background:#ede8e0!important;border-color:rgba(99,102,241,0.25)!important}
        .nav-btn:hover{background:#f0ebe3!important;color:#374151!important}
        @media(max-width:768px){
          .sidebar{display:none!important}
          .sidebar.open{display:flex!important;position:fixed;inset:0;z-index:500;width:100vw!important;background:#f5f0e8!important}
          .main-pad{padding:16px!important}
          .g4{grid-template-columns:1fr 1fr!important}
          .g2{grid-template-columns:1fr!important}
          .topbar{display:flex!important}
        }
        @media(min-width:769px){.topbar{display:none!important}}
      `}</style>

      {/* Mobile topbar */}
      <div className="topbar" style={{ display:"none",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"#ffffff",borderBottom:"1px solid rgba(255,255,255,0.05)",position:"sticky",top:0,zIndex:100 }}>
        <img src="/logo.png" alt="FUA" onError={e=>e.target.style.display="none"} style={{ height:28,objectFit:"contain" }}/>
        <button onClick={()=>setMenuOpen(!menuOpen)} style={{ background:"#e8e3db",border:"1px solid #e0dbd3",color:"#6b7280",cursor:"pointer",width:34,height:34,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center" }}>{I.menu}</button>
      </div>

      <div style={{ display:"flex",height:"100vh",overflow:"hidden" }}>
        {/* Sidebar */}
        <div className={`sidebar${menuOpen?" open":""}`} style={{ width:220,background:"#ffffff",borderRight:"1px solid #e8e3db",padding:"0",display:"flex",flexDirection:"column",flexShrink:0,height:"100vh",overflow:"hidden" }}>

          {/* Logo Ã¢ÂÂ centered top */}
          <div style={{ padding:"24px 16px 20px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",alignItems:"center",gap:10 }}>
            <img src="/logo.png" alt="FUTBOLUAGENCY" onError={e=>{ e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} style={{ height:52,objectFit:"contain",width:"100%",maxWidth:140 }}/>
            <div style={{ display:"none",flexDirection:"column",alignItems:"center",gap:4 }}>
              <div style={{ width:40,height:40,background:"linear-gradient(135deg,#c8102e,#002868)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff" }}>FUA</div>
              <span style={{ fontSize:11,fontWeight:700,color:"#6b7280",letterSpacing:1 }}>FUTBOLUAGENCY</span>
            </div>
            {currentAgent&&agentObj&&(
              <div style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"rgba(99,102,241,0.08)",borderRadius:8,border:"1px solid rgba(99,102,241,0.15)",width:"100%" }}>
                <Avatar name={agentObj.name} size={24} photoUrl={agentObj.photo_url}/>
                <div><div style={{ fontSize:11,fontWeight:600,color:"#1a1a2e" }}>Hola, {agentObj.name.split(" ")[0]}</div><div style={{ fontSize:9,color:"#6b7280" }}>{agentObj.role}</div></div>
              </div>
            )}
          </div>

          {/* Nav */}
          <div style={{ padding:"12px 10px",flex:1,overflow:"auto" }}>
            {navItems.map(item=>(
              <button key={item.id} className="nav-btn" onClick={()=>go(item.id)} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:nav===item.id?600:400,background:nav===item.id?"rgba(99,102,241,0.1)":"none",color:nav===item.id?"#6366f1":"#6b7280",width:"100%",textAlign:"left",fontFamily:"inherit",marginBottom:2,transition:"all .1s" }}>
                <span style={{ opacity:nav===item.id?1:0.5,fontSize:14 }}>{item.icon}</span>{item.l}
                {item.id==="leads"&&leads.length>0&&<span style={{ marginLeft:"auto",background:"rgba(99,102,241,0.25)",color:"#818cf8",fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:20 }}>{leads.length}</span>}
              </button>
            ))}
            <button onClick={loadAll} className="nav-btn" style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:400,background:"none",color:"#374151",fontFamily:"inherit",width:"100%",marginTop:6 }}><span style={{ opacity:0.4,fontSize:13 }}>{I.refresh}</span>Actualizar</button>
          </div>

          {/* Agents bottom */}
          <div style={{ padding:"12px 14px 16px",borderTop:"1px solid rgba(255,255,255,0.05)" }}>
            {isAdmin&&agentStats.slice(0,4).map(s=>(
              <div key={s.name} onClick={()=>go("team")} style={{ display:"flex",gap:8,alignItems:"center",padding:"6px 4px",cursor:"pointer",borderRadius:7 }}>
                <Avatar name={s.name} size={22} photoUrl={s.agent?.photo_url}/>
                <div style={{ flex:1,minWidth:0 }}><div style={{ fontSize:11,fontWeight:500,color:"#6b7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.name.split(" ")[0]}</div></div>
                <div style={{ fontSize:10,color:"#4b5563",fontWeight:500 }}>{s.total}Ã¢ÂÂ¬</div>
              </div>
            ))}
            {/* Current user */}
            <div style={{ marginTop:8,padding:"8px 10px",background:"#f5f0e8",borderRadius:9,border:"1px solid #ede8e0" }}>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <div style={{ width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0 }}>{(user?.email||"?")[0].toUpperCase()}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:11,fontWeight:600,color:"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{profile?.name||user?.email?.split("@")[0]}</div>
                  <div style={{ fontSize:9,color:isAdmin?"#f59e0b":isLatamDirector?"#10b981":"#6b7280" }}>{isAdmin?"CEO":isLatamDirector?"Director LATAM":"Reclutador"}</div>
                </div>
                <button onClick={signOut} style={{ background:"none",border:"none",color:"#4b5563",cursor:"pointer",fontSize:11,fontFamily:"inherit",padding:"2px 6px",borderRadius:5 }} title="Cerrar sesiÃÂ³n">Ã¢ÂÂ©</button>
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="main-pad" style={{ flex:1,overflowY:"auto",padding:"0" }}>
          {/* Top header bar with logo centered */}
          <div style={{ background:"#ffffff",borderBottom:"1px solid #e8e3db",padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <img src="/logo.png" alt="FUTBOLUAGENCY" onError={e=>e.target.style.display="none"} style={{ height:34,objectFit:"contain" }}/>
            <GlobalSearch players={visiblePlayers} leads={visibleLeads} agents={agents} onSelectPlayer={p=>{ setSelected(p); setNav("players"); }} onSelectLead={l=>{ setSelectedLead(l); }} onNavigate={id=>setNav(id)}/>
            <NotificationBell userEmail={user?.email}/>
          </div>
          <div style={{ padding:"24px 28px" }}>

          {/* DASHBOARD */}
          {nav==="dashboard"&&!isAdmin&&<div><RecruiterDashboard profile={profile} players={visiblePlayers} leads={visibleLeads} commissions={commissions}/><div style={{ marginTop:14 }}><TasksDashboard agentName={profile?.name} isAdmin={false} players={visiblePlayers} leads={visibleLeads}/></div></div>}
          {nav==="dashboard"&&isAdmin&&(
            <div>
              <div style={{ marginBottom:20 }}>
                <h1 style={{ fontSize:22,fontWeight:700,color:"#1a1a2e",letterSpacing:-0.3 }}>Dashboard</h1>
                <p style={{ color:"#374151",fontSize:13,marginTop:3 }}>Resumen general ÃÂ· FUTBOLUAGENCY</p>
              </div>
              <div className="g4" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:18 }}>
                <Stat label="Atletas" value={visiblePlayers.length} sub={`${visiblePlayers.filter(p=>p.status==="Becado").length} becados`} color="#6366f1"/>
                <Stat label="Revenue" value={totalFees>0?`${(totalFees/1000).toFixed(1)}kÃ¢ÂÂ¬`:"Ã¢ÂÂ"} color="#8b5cf6"/>
                <Stat label="Cobrado" value={`${totalColl.toLocaleString()}Ã¢ÂÂ¬`} color="#10b981" sub={totalFees>0?`${Math.round((totalColl/totalFees)*100)}%`:"Ã¢ÂÂ"}/>
                <Stat label="Pendiente" value={`${(totalFees-totalColl).toLocaleString()}Ã¢ÂÂ¬`} color="#f59e0b" sub={`${visiblePlayers.filter(p=>!p.payment2?.paid).length} abiertos`}/>
              </div>
              <div className="g2" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
                <Card style={{ padding:"18px 20px" }}>
                  <div style={{ fontSize:10,fontWeight:600,color:"#374151",textTransform:"uppercase",letterSpacing:1.2,marginBottom:14 }}>Cobros por agente</div>
                  {agentStats.length===0?<div style={{ color:"#374151",fontSize:13 }}>Sin agentes</div>:
                  <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                    {agentStats.map(s=>(
                      <div key={s.name}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:8 }}><Avatar name={s.name} size={22} photoUrl={s.agent?.photo_url}/><span style={{ fontSize:13,fontWeight:600,color:"#374151" }}>{s.name}</span></div>
                          <span style={{ fontSize:14,fontWeight:700,color:"#1a1a2e" }}>{s.total}Ã¢ÂÂ¬</span>
                        </div>
                        <Bar value={s.total} max={totalColl||1} color="#6366f1"/>
                        <div style={{ fontSize:10,color:"#374151",marginTop:3 }}>{s.p1} iniciales ÃÂ· {s.p2} segundos ÃÂ· {s.count} atletas</div>
                      </div>
                    ))}
                  </div>}
                </Card>
                <Card style={{ padding:"18px 20px" }}>
                  <div style={{ fontSize:10,fontWeight:600,color:"#374151",textTransform:"uppercase",letterSpacing:1.2,marginBottom:14 }}>Estado atletas</div>
                  {visiblePlayers.length===0?<div style={{ color:"#374151",fontSize:13 }}>Sin atletas</div>:
                  <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                    {Object.entries(STATUS_COLORS).map(([status,color])=>{ const count=visiblePlayers.filter(p=>p.status===status).length; return <div key={status}><div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}><span style={{ fontSize:12,color:"#6b7280" }}>{status}</span><span style={{ fontSize:12,fontWeight:600,color }}>{count}</span></div><Bar value={count} max={visiblePlayers.length} color={color}/></div>; })}
                  </div>}
                </Card>
                <Card style={{ gridColumn:"1/-1",padding:"18px 20px" }}>
                  <div style={{ fontSize:10,fontWeight:600,color:"#374151",textTransform:"uppercase",letterSpacing:1.2,marginBottom:12 }}>Pagos pendientes</div>
                  {visiblePlayers.filter(p=>!p.payment1?.paid||!p.payment2?.paid).length===0
                    ?<div style={{ textAlign:"center",padding:16,color:"#10b981",fontWeight:600,fontSize:13 }}>Ã¢ÂÂ Todos al dÃÂ­a</div>
                    :<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:8 }}>
                      {visiblePlayers.filter(p=>!p.payment1?.paid||!p.payment2?.paid).map(p=>(
                        <div key={p.id} onClick={()=>{ setNav("players"); setSelected(p); }} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"rgba(245,158,11,0.04)",border:"1px solid rgba(245,158,11,0.1)",borderRadius:10,cursor:"pointer" }}>
                          <Avatar name={p.name} size={30} photoUrl={p.photoUrl}/>
                          <div style={{ flex:1,minWidth:0 }}><div style={{ fontSize:12,fontWeight:600,color:"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name}</div><div style={{ fontSize:10,color:"#f59e0b" }}>{!p.payment1?.paid?`${p.payment1Amount||900}Ã¢ÂÂ¬`:`${p.payment2Amount||1800}Ã¢ÂÂ¬`}</div></div>
                          <span style={{ fontSize:12,fontWeight:700,color:"#f59e0b",whiteSpace:"nowrap" }}>{!p.payment1?.paid?`Pago 1`:`Pago 2`}</span>
                        </div>
                      ))}
                    </div>}
                </Card>
              </div>
              {/* Tasks widget */}
              <div style={{ marginTop:14 }}>
                <TasksDashboard agentName={profile?.name} isAdmin={isAdmin} players={visiblePlayers} leads={visibleLeads}/>
              </div>
            </div>
          )}

          {/* PLAYERS */}
          {nav==="players"&&!selected&&(
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10 }}>
                <div><h1 style={{ fontSize:22,fontWeight:700,color:"#1a1a2e",letterSpacing:-0.3 }}>Jugadores</h1><p style={{ color:"#374151",fontSize:13,marginTop:3 }}>{visiblePlayers.length} atletas registrados</p></div>
                <button onClick={()=>setAddModal(true)} style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:9,border:"none",background:"#6366f1",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit" }}>{I.plus} Nuevo atleta</button>
              </div>
              <div style={{ display:"flex",gap:8,marginBottom:14,flexWrap:"wrap" }}>
                <div style={{ position:"relative",flex:"1 1 160px" }}>
                  <div style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#374151" }}>{I.search}</div>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." style={{ paddingLeft:30,padding:"8px 12px 8px 30px",background:"#f5f0e8",border:"1px solid #e8e3db",borderRadius:8,color:"#1a1a2e",fontSize:13,outline:"none",width:"100%",fontFamily:"inherit" }}/>
                </div>
                {[[SPORTS,fSport,setFSport],[STATUSES,fStatus,setFStatus],[["Todos",...agentNames],fAgent,setFAgent]].map(([opts,val,setter],i)=>(
                  <select key={i} value={val} onChange={e=>setter(e.target.value)} style={{ padding:"8px 12px",background:"#f5f0e8",border:"1px solid #e8e3db",borderRadius:8,color:val==="Todos"?"#374151":"#f9fafb",fontSize:13,outline:"none",cursor:"pointer",fontFamily:"inherit" }}>
                    {opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                ))}
              </div>
              {visiblePlayers.length===0&&<div style={{ textAlign:"center",padding:60,color:"#374151" }}><div style={{ fontSize:32,marginBottom:10 }}>Ã°ÂÂÂ¥</div><div style={{ fontWeight:600,color:"#6b7280" }}>Sin atletas todavÃÂ­a</div></div>}
              <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                {filtered.map(p=>{
                  const paid=(p.payment1?.paid?(p.payment1Amount||900):0)+(p.payment2?.paid?(p.payment2Amount||1800):0);
                  const total=p.totalFee||2700; const pct=(paid/total)*100;
                  return (
                    <div key={p.id} className="prow" onClick={()=>setSelected(p)} style={{ display:"flex",alignItems:"center",gap:16,background:"#faf8f5",border:"1px solid #ede8e0",borderRadius:12,padding:"14px 20px",cursor:"pointer",transition:"all .12s" }}>
                      {/* Photo only if exists, otherwise sport icon */}
                      {p.photoUrl
                        ? <Avatar name={p.name} size={40} photoUrl={p.photoUrl}/>
                        : <div style={{ width:40,height:40,borderRadius:10,background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>{{ Soccer:"Ã¢ÂÂ½",Tennis:"Ã°ÂÂÂ¾",Swimming:"Ã°ÂÂÂ",Baseball:"Ã¢ÂÂ¾",Basketball:"Ã°ÂÂÂ","Track & Field":"Ã°ÂÂÂ",Golf:"Ã¢ÂÂ³",Volleyball:"Ã°ÂÂÂ" }[p.sport]||"Ã°ÂÂÂ"}</div>
                      }
                      <div style={{ flex:2,minWidth:0 }}>
                        <div style={{ fontSize:14,fontWeight:600,color:"#1a1a2e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:3 }}>{p.name}</div>
                        <div style={{ fontSize:11,color:"#4b5563" }}>{p.sport}{p.nationality?` ÃÂ· ${p.nationality}`:""}{p.position&&p.position!=="N/A"?` ÃÂ· ${p.position}`:""}</div>
                      </div>
                      <Badge s={p.status}/>
                      <div style={{ display:"flex",gap:16,flexShrink:0 }}>
                        <div style={{ textAlign:"center" }}><div style={{ fontSize:9,color:"#4b5563",fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2 }}>Beca</div><div style={{ fontSize:13,fontWeight:700,color:"#6366f1" }}>{p.scholarshipPct}%</div></div>
                        <div style={{ textAlign:"center" }}><div style={{ fontSize:9,color:"#4b5563",fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2 }}>GPA</div><div style={{ fontSize:13,fontWeight:700,color:p.gpa>=3.5?"#10b981":p.gpa>=3?"#f59e0b":"#ef4444" }}>{p.gpa||"Ã¢ÂÂ"}</div></div>
                        <div style={{ textAlign:"center" }}><div style={{ fontSize:9,color:"#4b5563",fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2 }}>Agente</div><div style={{ fontSize:12,fontWeight:600,color:"#a5b4fc" }}>{p.agent?.split(" ")[0]||"Ã¢ÂÂ"}</div></div>
                      </div>
                      <div style={{ minWidth:120 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:"#4b5563",marginBottom:4 }}><span>Cobros</span><span style={{ color:pct>=100?"#10b981":pct>0?"#f59e0b":"#ef4444",fontWeight:600 }}>{paid}Ã¢ÂÂ¬</span></div>
                        <Bar value={paid} max={total} color={pct>=100?"#10b981":pct>0?"#f59e0b":"#6366f1"} h={3}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {nav==="players"&&selected&&<PlayerDetail player={selected} onBack={()=>setSelected(null)} onRefresh={loadAll} agentList={agentNames} onGenerateToken={generateAthleteToken}/>}

          {/* PIPELINE */}
          {nav==="pipeline"&&<Pipeline leads={visibleLeads} players={visiblePlayers} onLeadClick={l=>setSelectedLead(l)} onPlayerClick={p=>{ setSelected(p); setNav("players"); }} onRefresh={loadAll} isAdmin={isAdmin} myAgentName={myAgentName}/>}

          {/* LEADS */}
          {nav==="leads"&&(
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10 }}>
                <div>
                  <h1 style={{ fontSize:22,fontWeight:700,color:"#1a1a2e",letterSpacing:-0.3 }}>Leads & Prospectos</h1>
                  <p style={{ color:"#374151",fontSize:13,marginTop:3 }}>{visibleLeads.length} formularios recibidos</p>
                </div>
                {isAdmin&&<div style={{ display:"flex",gap:8,alignItems:"center" }}>
                  <div style={{ background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:9,padding:"8px 14px" }}>
                    <span style={{ fontSize:12,color:"#818cf8",fontWeight:600 }}>Ã°ÂÂÂ Link del formulario:</span>
                    <span style={{ fontSize:11,color:"#6b7280",marginLeft:6 }}>{window.location.origin}?form=1</span>
                    <button onClick={()=>{ navigator.clipboard.writeText(`${window.location.origin}?form=1`); }} style={{ marginLeft:8,background:"none",border:"none",color:"#6366f1",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit" }}>Copiar</button>
                  </div>
                </div>}
              </div>
              {visibleLeads.length===0&&<div style={{ textAlign:"center",padding:60,color:"#374151" }}>
                <div style={{ fontSize:36,marginBottom:10 }}>Ã°ÂÂÂ¯</div>
                <div style={{ fontWeight:600,color:"#6b7280",marginBottom:6 }}>Sin leads todavÃÂ­a</div>
                <div style={{ fontSize:13,color:"#374151" }}>Comparte el link del formulario con tus prospectos</div>
              </div>}
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {visibleLeads.map(lead=>(
                  <div key={lead.id} onClick={()=>setSelectedLead(lead)} style={{ display:"flex",alignItems:"center",gap:14,background:"#f5f0e8",border:"1px solid #e8e3db",borderRadius:14,padding:"14px 18px",cursor:"pointer",transition:"all .1s" }} className="prow">
                    {/* Sport icon */}
                    <div style={{ width:44,height:44,borderRadius:12,background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>
                      {{ Soccer:"Ã¢ÂÂ½",Tennis:"Ã°ÂÂÂ¾",Swimming:"Ã°ÂÂÂ",Baseball:"Ã¢ÂÂ¾",Basketball:"Ã°ÂÂÂ","Track & Field":"Ã°ÂÂÂ",Golf:"Ã¢ÂÂ³",Volleyball:"Ã°ÂÂÂ" }[lead.sport]||"Ã°ÂÂÂ¯"}
                    </div>
                    {/* Name + info */}
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap" }}>
                        <span style={{ fontSize:15,fontWeight:700,color:"#1a1a2e" }}>{lead.name}</span>
                        {lead.sport&&<Tag label={lead.sport} color="#6366f1"/>}
                        {lead.position&&<Tag label={lead.position} color="#8b5cf6"/>}
                        {lead.nationality&&<Tag label={lead.nationality} color="#3b82f6"/>}
                      </div>
                      <div style={{ display:"flex",gap:12,flexWrap:"wrap",fontSize:11,color:"#4b5563" }}>
                        {lead.email&&<span>Ã°ÂÂÂ§ {lead.email}</span>}
                        {lead.phone&&<span>Ã°ÂÂÂ± {lead.phone}</span>}
                        {lead.referred_by&&<span>Ã°ÂÂÂ¤ Ref: <strong style={{ color:"#818cf8" }}>{lead.referred_by}</strong></span>}
                        <span>Ã°ÂÂÂ {new Date(lead.created_at).toLocaleDateString("es-ES")}</span>
                      </div>
                    </div>
                    {/* Academic quick stats */}
                    <div style={{ display:"flex",gap:8,flexShrink:0 }}>
                      {lead.gpa&&<div style={{ textAlign:"center" }}><div style={{ fontSize:9,color:"#4b5563",fontWeight:600,marginBottom:2 }}>GPA</div><div style={{ fontSize:13,fontWeight:800,color:lead.gpa>=3.5?"#10b981":lead.gpa>=3?"#f59e0b":"#9ca3af" }}>{lead.gpa}</div></div>}
                      {lead.sat_score&&<div style={{ textAlign:"center" }}><div style={{ fontSize:9,color:"#4b5563",fontWeight:600,marginBottom:2 }}>SAT</div><div style={{ fontSize:13,fontWeight:800,color:"#6366f1" }}>{lead.sat_score}</div></div>}
                    </div>
                    {/* Budget Ã¢ÂÂ highlighted */}
                    <div style={{ background:lead.budget?"rgba(16,185,129,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${lead.budget?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.06)"}`,borderRadius:10,padding:"10px 14px",textAlign:"center",minWidth:110,flexShrink:0 }}>
                      <div style={{ fontSize:9,color:"#4b5563",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4,fontWeight:600 }}>Ã°ÂÂÂ° Budget/aÃÂ±o</div>
                      <div style={{ fontSize:15,fontWeight:900,color:lead.budget?"#10b981":"#4b5563" }}>{lead.budget?`$${Number(lead.budget).toLocaleString()}`:"No indicado"}</div>
                      {lead.scholarship_pct>0&&<div style={{ fontSize:10,color:"#818cf8",marginTop:3 }}>Busca {lead.scholarship_pct}% beca</div>}
                    </div>
                    <div style={{ color:"#374151",fontSize:16 }}>Ã¢ÂÂº</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OFFERS */}
          {nav==="offers"&&(
            <div>
              <div style={{ marginBottom:20 }}><h1 style={{ fontSize:22,fontWeight:700,color:"#1a1a2e",letterSpacing:-0.3 }}>Universidades</h1><p style={{ color:"#374151",fontSize:13,marginTop:3 }}>{allOffers.length} ofertas totales</p></div>
              <div className="g4" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18 }}>
                <Stat label="Total ofertas" value={allOffers.length} color="#6366f1"/>
                <Stat label="Confirmadas" value={allOffers.filter(o=>o.status==="Elegida Ã¢ÂÂ").length} color="#10b981"/>
                <Stat label="Negociando" value={allOffers.filter(o=>["Oferta formal","Pre-aceptada","Interesada"].includes(o.status)).length} color="#f59e0b"/>
              </div>
              {players.filter(p=>p.offers?.length>0).length===0&&<div style={{ textAlign:"center",padding:60,color:"#374151" }}><div style={{ fontSize:32,marginBottom:10 }}>Ã°ÂÂÂÃ¯Â¸Â</div><div style={{ fontWeight:600,color:"#6b7280" }}>Sin ofertas</div></div>}
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                {players.filter(p=>p.offers?.length>0).map(p=>(
                  <Card key={p.id} style={{ padding:"16px 18px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:14 }}>
                      <Avatar name={p.name} size={38} photoUrl={p.photoUrl}/>
                      <div><div style={{ fontSize:14,fontWeight:600,color:"#1a1a2e" }}>{p.name}</div><div style={{ fontSize:11,color:"#4b5563" }}>{p.sport} ÃÂ· {p.offers.length} {p.offers.length===1?"oferta":"ofertas"}</div></div>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8 }}>
                      {p.offers.sort((a,b)=>(b.amount||0)-(a.amount||0)).map(o=>(
                        <div key={o.id} onClick={()=>{ setNav("players"); setSelected(p); }} style={{ background:o.status==="Elegida Ã¢ÂÂ"?"rgba(34,197,94,0.05)":"rgba(255,255,255,0.02)",border:`1px solid ${o.status==="Elegida Ã¢ÂÂ"?"rgba(34,197,94,0.15)":"rgba(255,255,255,0.05)"}`,borderRadius:10,padding:"12px",cursor:"pointer" }}>
                          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:7 }}><UniLogo name={o.university} logoUrl={o.logoUrl} size={26}/><div style={{ fontSize:12,fontWeight:600,color:"#1a1a2e",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{o.university}</div></div>
                          <div style={{ fontSize:10,color:"#6b7280",marginBottom:6 }}>{o.state} ÃÂ· {o.division}</div>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:6 }}>
                            <div>{o.amount&&<div style={{ fontSize:13,fontWeight:700,color:"#10b981" }}>{Number(o.amount).toLocaleString()}Ã¢ÂÂ¬</div>}{o.season&&<div style={{ fontSize:10,color:"#f59e0b" }}>{o.season}</div>}</div>
                            <OBadge s={o.status}/>
                          </div>
                          <Bar value={o.scholarshipPct} max={100} color={OFFER_COLORS[o.status]||"#6366f1"} h={2}/>
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
              <div style={{ marginBottom:20 }}><h1 style={{ fontSize:22,fontWeight:700,color:"#1a1a2e",letterSpacing:-0.3 }}>Pagos & Cobros</h1><p style={{ color:"#374151",fontSize:13,marginTop:3 }}>Honorarios personalizados por atleta</p></div>
              <div className="g4" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:18 }}>
                <Stat label="Revenue" value={`${totalFees.toLocaleString()}Ã¢ÂÂ¬`} color="#6366f1"/>
                <Stat label="Cobrado" value={`${totalColl.toLocaleString()}Ã¢ÂÂ¬`} color="#10b981" sub={totalFees>0?`${Math.round((totalColl/totalFees)*100)}%`:"Ã¢ÂÂ"}/>
                <Stat label="Pendiente" value={`${(totalFees-totalColl).toLocaleString()}Ã¢ÂÂ¬`} color="#f59e0b"/>
                <Stat label="Completos" value={visiblePlayers.filter(p=>p.payment1?.paid&&p.payment2?.paid).length} color="#22c55e" sub={`de ${visiblePlayers.length}`}/>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12,marginBottom:16 }}>
                {agentStats.map(s=>(
                  <Card key={s.name} style={{ padding:"16px 18px",border:"1px solid rgba(99,102,241,0.1)" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
                      <Avatar name={s.name} size={38} photoUrl={s.agent?.photo_url}/>
                      <div style={{ flex:1 }}><div style={{ fontSize:14,fontWeight:600,color:"#1a1a2e" }}>{s.name}</div><div style={{ fontSize:11,color:"#6366f1" }}>{s.agent?.role||"Agente"}</div></div>
                      <div style={{ fontSize:18,fontWeight:700,color:"#1a1a2e" }}>{s.total}Ã¢ÂÂ¬</div>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                      <div style={{ background:"#f5f0e8",borderRadius:8,padding:"8px" }}><div style={{ fontSize:9,color:"#374151",fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:4 }}>Pagos iniciales</div><div style={{ fontSize:15,fontWeight:700,color:"#1a1a2e" }}>{s.p1}</div></div>
                      <div style={{ background:"#f5f0e8",borderRadius:8,padding:"8px" }}><div style={{ fontSize:9,color:"#374151",fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:4 }}>Segundos pagos</div><div style={{ fontSize:15,fontWeight:700,color:"#1a1a2e" }}>{s.p2}</div></div>
                    </div>
                  </Card>
                ))}
              </div>
              <Card style={{ padding:"18px 20px" }}>
                <div style={{ fontSize:10,fontWeight:600,color:"#374151",textTransform:"uppercase",letterSpacing:1.2,marginBottom:12 }}>Estado por atleta</div>
                {visiblePlayers.length===0&&<div style={{ color:"#374151",fontSize:13,textAlign:"center",padding:20 }}>Sin atletas</div>}
                <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                  {visiblePlayers.map(p=>{ const paid=(p.payment1?.paid?(p.payment1Amount||900):0)+(p.payment2?.paid?(p.payment2Amount||1800):0); const total=p.totalFee||2700; return (
                    <div key={p.id} onClick={()=>{ setNav("players"); setSelected(p); }} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"#faf8f5",borderRadius:10,border:"1px solid rgba(255,255,255,0.04)",cursor:"pointer" }}>
                      <Avatar name={p.name} size={32} photoUrl={p.photoUrl}/>
                      <div style={{ flex:2,minWidth:0 }}>
                        <div style={{ fontSize:13,fontWeight:600,color:"#1a1a2e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name}</div>
                        <div style={{ display:"flex",gap:6,marginTop:3,flexWrap:"wrap" }}>
                          <span style={{ fontSize:9,padding:"2px 6px",borderRadius:5,background:p.payment1?.paid?"rgba(16,185,129,0.1)":"rgba(245,158,11,0.08)",color:p.payment1?.paid?"#10b981":"#f59e0b",fontWeight:600 }}>P1: {p.payment1?.paid?`Ã¢ÂÂ ${p.payment1.paidBy}`:"Ã¢ÂÂ"}</span>
                          <span style={{ fontSize:9,padding:"2px 6px",borderRadius:5,background:p.payment2?.paid?"rgba(16,185,129,0.1)":"rgba(245,158,11,0.08)",color:p.payment2?.paid?"#10b981":"#f59e0b",fontWeight:600 }}>P2: {p.payment2?.paid?`Ã¢ÂÂ ${p.payment2.paidBy}`:"Ã¢ÂÂ"}</span>
                        </div>
                      </div>
                      <div style={{ flex:1,minWidth:100 }}><Bar value={paid} max={total} color={paid>=total?"#10b981":paid>0?"#f59e0b":"#374151"}/></div>
                      <div style={{ fontSize:12,fontWeight:700,color:paid>=total?"#10b981":"#f9fafb",minWidth:80,textAlign:"right" }}>{paid}Ã¢ÂÂ¬ / {total}Ã¢ÂÂ¬</div>
                    </div>
                  ); })}
                </div>
              </Card>
            </div>
          )}

          {/* FUA SPORTS */}
          {nav==="fua-sports"&&(
            <div>
              <div style={{ marginBottom:20 }}>
                <h1 style={{ fontSize:22,fontWeight:700,color:"#1a1a2e",letterSpacing:-0.3 }}>FUA Sports</h1>
                <p style={{ color:"#6b7280",fontSize:13,marginTop:3 }}>Departamentos de Volleyball, Tenis y otros deportes</p>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14,marginBottom:20 }}>
                {[
                  { sport:"Volleyball", color:"#6366f1", desc:"Director del departamento de Volleyball" },
                  { sport:"Tennis", color:"#10b981", desc:"Director del departamento de Tenis" },
                  { sport:"Swimming", color:"#3b82f6", desc:"Director del departamento de Natacion" },
                  { sport:"Golf", color:"#f59e0b", desc:"Director del departamento de Golf" },
                  { sport:"Baseball", color:"#ef4444", desc:"Director del departamento de Baseball" },
                  { sport:"Basketball", color:"#8b5cf6", desc:"Director del departamento de Basketball" },
                ].map(dept=>{
                  const deptPlayers = players.filter(p=>p.sport===dept.sport);
                  const deptLeads = leads.filter(l=>l.sport===dept.sport);
                  return (
                    <div key={dept.sport} style={{ background:"#fff",border:"1px solid #e8e3db",borderRadius:14,padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:14 }}>
                        <div style={{ width:44,height:44,borderRadius:12,background:`${dept.color}15`,border:`1px solid ${dept.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>
                          {{ Soccer:"Ã¢ÂÂ½",Tennis:"Ã°ÂÂÂ¾",Swimming:"Ã°ÂÂÂ",Baseball:"Ã¢ÂÂ¾",Basketball:"Ã°ÂÂÂ","Track & Field":"Ã°ÂÂÂ",Golf:"Ã¢ÂÂ³",Volleyball:"Ã°ÂÂÂ" }[dept.sport]||"Ã°ÂÂÂ"}
                        </div>
                        <div>
                          <div style={{ fontSize:15,fontWeight:700,color:"#1a1a2e" }}>FUA Sports Ã¢ÂÂ {dept.sport}</div>
                          <div style={{ fontSize:11,color:"#9ca3af",marginTop:2 }}>{dept.desc}</div>
                        </div>
                      </div>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                        <div style={{ background:"#f9f7f4",border:"1px solid #f0ebe3",borderRadius:9,padding:"10px 12px",textAlign:"center" }}>
                          <div style={{ fontSize:9,color:"#9ca3af",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4,fontWeight:600 }}>Atletas</div>
                          <div style={{ fontSize:18,fontWeight:800,color:dept.color }}>{deptPlayers.length}</div>
                        </div>
                        <div style={{ background:"#f9f7f4",border:"1px solid #f0ebe3",borderRadius:9,padding:"10px 12px",textAlign:"center" }}>
                          <div style={{ fontSize:9,color:"#9ca3af",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4,fontWeight:600 }}>Leads</div>
                          <div style={{ fontSize:18,fontWeight:800,color:"#6b7280" }}>{deptLeads.length}</div>
                        </div>
                      </div>
                      {deptPlayers.slice(0,3).map(p=>(
                        <div key={p.id} style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderTop:"1px solid #f5f0e8",marginTop:10 }}>
                          <Avatar name={p.name} size={28} photoUrl={p.photoUrl}/>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:12,fontWeight:600,color:"#1a1a2e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name}</div>
                            <div style={{ fontSize:10,color:"#9ca3af" }}>{p.status} ÃÂ· {p.nationality}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LATAM */}
          {nav==="latam"&&(
            <div>
              <div style={{ marginBottom:20 }}>
                <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:6,flexWrap:"wrap" }}>
                  <h1 style={{ fontSize:22,fontWeight:700,color:"#1a1a2e",letterSpacing:-0.3 }}>FutbolUAgency LATAM</h1>
                  <span style={{ padding:"4px 12px",borderRadius:20,background:"rgba(16,185,129,0.1)",color:"#10b981",fontSize:12,fontWeight:600,border:"1px solid rgba(16,185,129,0.2)" }}>Director: Miguel</span>
                  {(isAdmin||isLatamDirector)&&<button onClick={()=>setAgentModal({name:"",role:"Reclutador",email:"",phone:"",photoUrl:"",region:"latam"})} style={{ padding:"7px 14px",borderRadius:8,border:"none",background:"#1a1a2e",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit" }}>+ Nuevo reclutador LATAM</button>}
                </div>
                <p style={{ color:"#6b7280",fontSize:13 }}>Division Latinoamerica Ã¢ÂÂ gestion independiente de reclutadores y atletas</p>
              </div>

              {/* LATAM Stats */}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16 }}>
                {[
                  ["Paises",LATAM_COUNTRIES.filter(c=>players.some(p=>p.nationality===c)).length,"#6366f1"],
                  ["Atletas",visiblePlayers.filter(p=>LATAM_COUNTRIES.includes(p.nationality)).length,"#10b981"],
                  ["Leads",visibleLeads.filter(l=>LATAM_COUNTRIES.includes(l.nationality)).length,"#f59e0b"],
                  ["Revenue",`${visiblePlayers.filter(p=>LATAM_COUNTRIES.includes(p.nationality)).reduce((s,p)=>s+(p.totalFee||2700),0).toLocaleString()}Ã¢ÂÂ¬`,"#8b5cf6"],
                ].map(([l,v,c])=>(
                  <div key={l} style={{ background:"#fff",border:"1px solid #e8e3db",borderRadius:12,padding:"16px",textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div style={{ fontSize:9,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:600 }}>{l}</div>
                    <div style={{ fontSize:22,fontWeight:800,color:c }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* LATAM Reclutadores */}
              <div style={{ background:"#fff",border:"1px solid #e8e3db",borderRadius:14,padding:"20px",marginBottom:14,boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize:12,fontWeight:700,color:"#1a1a2e",textTransform:"uppercase",letterSpacing:0.8,marginBottom:14 }}>Reclutadores LATAM</div>
                {agentProfiles.filter(p=>p.role==="recruiter"&&(p.region==="latam"||agents.find(a=>a.email===p.email)?.region==="latam")).length===0&&
                  <div style={{ color:"#9ca3af",fontSize:13,textAlign:"center",padding:"16px 0" }}>Sin reclutadores LATAM. Crea uno con el boton de arriba Ã¢ÂÂ entran con su Gmail.</div>}
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {agentProfiles.filter(p=>p.role==="recruiter"&&(p.region==="latam"||agents.find(a=>a.email===p.email)?.region==="latam"||p.email?.includes("latam"))).map(ap=>{
                    const apPlayers = players.filter(p=>matchesAgentName(p.agent,ap.name)&&LATAM_COUNTRIES.includes(p.nationality));
                    const apLeads = leads.filter(l=>l.referred_by&&l.referred_by.toLowerCase().includes((ap.name||"").split(" ")[0].toLowerCase())&&LATAM_COUNTRIES.includes(l.nationality));
                    const apEarnings = commissions.filter(c=>c.referred_by===ap.name).reduce((s,c)=>s+(c.amount||0),0);
                    return (
                      <div key={ap.id} style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:"#f9f7f4",border:"1px solid #f0ebe3",borderRadius:10 }}>
                        <div style={{ width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff" }}>{(ap.name||"?")[0].toUpperCase()}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14,fontWeight:600,color:"#1a1a2e" }}>{ap.name}</div>
                          <div style={{ fontSize:11,color:"#9ca3af",marginTop:1 }}>{ap.email}</div>
                        </div>
                        <div style={{ display:"flex",gap:14,fontSize:12,color:"#6b7280" }}>
                          <div style={{ textAlign:"center" }}><div style={{ fontSize:16,fontWeight:700,color:"#1a1a2e" }}>{apPlayers.length}</div><div style={{ fontSize:10,color:"#9ca3af" }}>atletas</div></div>
                          <div style={{ textAlign:"center" }}><div style={{ fontSize:16,fontWeight:700,color:"#6366f1" }}>{apLeads.length}</div><div style={{ fontSize:10,color:"#9ca3af" }}>leads</div></div>
                          <div style={{ textAlign:"center" }}><div style={{ fontSize:16,fontWeight:700,color:"#10b981" }}>{apEarnings.toLocaleString()}Ã¢ÂÂ¬</div><div style={{ fontSize:10,color:"#9ca3af" }}>ganado</div></div>
                        </div>
                        {(isAdmin||isLatamDirector)&&<button onClick={()=>setPermModal(ap)} style={{ padding:"6px 12px",borderRadius:7,border:"1px solid #e8e3db",background:"#fff",color:"#374151",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit" }}>Permisos</button>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LATAM Athletes */}
              <div style={{ background:"#fff",border:"1px solid #e8e3db",borderRadius:14,padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize:12,fontWeight:700,color:"#1a1a2e",textTransform:"uppercase",letterSpacing:0.8,marginBottom:14 }}>Atletas LATAM</div>
                {["Colombia","Venezuela","Mexico","Argentina","Brasil","Peru","Chile","Ecuador","Uruguay","Paraguay","Bolivia"].map(country=>{
                  const countryPlayers = players.filter(p=>p.nationality===country);
                  if(countryPlayers.length===0) return null;
                  return (
                    <div key={country} style={{ marginBottom:12 }}>
                      <div style={{ fontSize:11,fontWeight:600,color:"#6b7280",marginBottom:6 }}>{country} ({countryPlayers.length})</div>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                        {countryPlayers.map(p=>(
                          <div key={p.id} style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 12px",background:"#f9f7f4",border:"1px solid #f0ebe3",borderRadius:8 }}>
                            <Avatar name={p.name} size={22} photoUrl={p.photoUrl}/>
                            <div>
                              <div style={{ fontSize:12,fontWeight:600,color:"#1a1a2e" }}>{p.name}</div>
                              <div style={{ fontSize:10,color:"#9ca3af" }}>{p.sport} ÃÂ· {p.status}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {players.filter(p=>["Colombia","Venezuela","Mexico","Argentina","Brasil","Peru","Chile","Ecuador","Uruguay","Paraguay","Bolivia"].includes(p.nationality)).length===0&&<div style={{ color:"#9ca3af",fontSize:13,textAlign:"center",padding:"20px 0" }}>Sin atletas de LATAM registrados</div>}
              </div>
            </div>
          )}

          {/* TEAM */}
          {nav==="team"&&(
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10 }}>
                <div><h1 style={{ fontSize:22,fontWeight:700,color:"#1a1a2e",letterSpacing:-0.3 }}>Equipo</h1><p style={{ color:"#374151",fontSize:13,marginTop:3 }}>CEOs y Reclutadores ÃÂ· {agents.length} miembros</p></div>
                {isAdmin&&<button onClick={()=>setAgentModal("new")} style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:9,border:"none",background:"#1a1a2e",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit" }}>{I.plus} Nuevo miembro</button>}
              </div>

              {/* Team overview stats Ã¢ÂÂ CEOs only */}
              {isAdmin&&<div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16 }}>
                <div style={{ background:"#fff",border:"1px solid #e8e3db",borderRadius:12,padding:"16px",textAlign:"center" }}>
                  <div style={{ fontSize:9,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:600 }}>Total atletas</div>
                  <div style={{ fontSize:22,fontWeight:800,color:"#1a1a2e" }}>{players.length}</div>
                </div>
                <div style={{ background:"#fff",border:"1px solid #e8e3db",borderRadius:12,padding:"16px",textAlign:"center" }}>
                  <div style={{ fontSize:9,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:600 }}>Total leads</div>
                  <div style={{ fontSize:22,fontWeight:800,color:"#6366f1" }}>{leads.length}</div>
                </div>
                <div style={{ background:"#fff",border:"1px solid #e8e3db",borderRadius:12,padding:"16px",textAlign:"center" }}>
                  <div style={{ fontSize:9,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:600 }}>Revenue total</div>
                  <div style={{ fontSize:22,fontWeight:800,color:"#10b981" }}>{(players.reduce((s,p)=>s+(p.totalFee||2700),0)/1000).toFixed(1)}kÃ¢ÂÂ¬</div>
                </div>
                <div style={{ background:"#fff",border:"1px solid #e8e3db",borderRadius:12,padding:"16px",textAlign:"center" }}>
                  <div style={{ fontSize:9,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:600 }}>Reclutadores</div>
                  <div style={{ fontSize:22,fontWeight:800,color:"#8b5cf6" }}>{agentProfiles.filter(p=>p.role==="recruiter").length}</div>
                </div>
              </div>}

              {/* CRM Access management Ã¢ÂÂ admin only */}
              {isAdmin&&agentProfiles.filter(p=>p.role!=="admin"&&p.role!=="ceo").length>0&&(
                <Card style={{ padding:"18px 20px",marginBottom:16,border:"1px solid #e8e3db" }}>
                  <div style={{ fontSize:11,fontWeight:700,color:"#1a1a2e",textTransform:"uppercase",letterSpacing:1.2,marginBottom:14 }}>Reclutadores con acceso al CRM</div>
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    {agentProfiles.filter(p=>p.role!=="admin"&&p.role!=="ceo").map(ap=>{
                      const apStats = { players:players.filter(p=>matchesAgentName(p.agent,ap.name)).length, leads:leads.filter(l=>l.referred_by&&l.referred_by.toLowerCase().includes((ap.name||"").split(" ")[0].toLowerCase())).length };
                      const regionColors = { latam:"#10b981", europe:"#3b82f6", usa:"#f59e0b", global:"#9ca3af" };
                      const regionColor = regionColors[ap.region||"global"]||"#9ca3af";
                      return (
                      <div key={ap.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"#faf8f5",borderRadius:12,border:"1px solid #f0ebe3" }}>
                        <div style={{ width:40,height:40,borderRadius:10,background:`linear-gradient(135deg,${regionColor}40,${regionColor}20)`,border:`1px solid ${regionColor}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:regionColor,flexShrink:0 }}>{(ap.display_name||ap.name||"?")[0].toUpperCase()}</div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
                            <div style={{ fontSize:14,fontWeight:600,color:"#1a1a2e" }}>{ap.display_name||ap.name||ap.email}</div>
                            {ap.region&&ap.region!=="global"&&<span style={{ padding:"2px 8px",borderRadius:20,background:`${regionColor}15`,color:regionColor,fontSize:10,fontWeight:700,border:`1px solid ${regionColor}25` }}>{ap.region.toUpperCase()}</span>}
                            <span style={{ padding:"2px 8px",borderRadius:20,background:"#f5f0e8",color:"#9ca3af",fontSize:10 }}>{ap.role==="latam_director"?"Director LATAM":"Reclutador"}</span>
                          </div>
                          <div style={{ fontSize:11,color:"#9ca3af",marginTop:2 }}>{ap.email}</div>
                          {ap.bio&&<div style={{ fontSize:11,color:"#6b7280",marginTop:3,fontStyle:"italic" }}>{ap.bio}</div>}
                        </div>
                        <div style={{ display:"flex",gap:10,fontSize:12,color:"#6b7280",flexShrink:0 }}>
                          <div style={{ textAlign:"center" }}><div style={{ fontSize:16,fontWeight:700,color:"#1a1a2e" }}>{apStats.players}</div><div style={{ fontSize:10,color:"#9ca3af" }}>atletas</div></div>
                          <div style={{ textAlign:"center" }}><div style={{ fontSize:16,fontWeight:700,color:"#6366f1" }}>{apStats.leads}</div><div style={{ fontSize:10,color:"#9ca3af" }}>leads</div></div>
                        </div>
                        <button onClick={()=>setPermModal(ap)} style={{ padding:"7px 14px",borderRadius:8,border:"1px solid #e8e3db",background:"#fff",color:"#374151",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap" }}>Editar perfil</button>
                      </div>
                    );})}
                  </div>
                  <div style={{ marginTop:12,padding:"10px 14px",background:"#f5f0e8",borderRadius:8,fontSize:12,color:"#6b7280" }}>
                    Los reclutadores entran con su Gmail en: <strong style={{ color:"#6366f1" }}>{window.location.origin}</strong>
                  </div>
                </Card>
              )}

              {agents.length===0&&<div style={{ textAlign:"center",padding:60,color:"#374151" }}><div style={{ fontSize:32,marginBottom:10 }}>Ã°ÂÂÂ¥</div><div style={{ fontWeight:600,color:"#6b7280",marginBottom:6 }}>Sin agentes</div><div style={{ fontSize:13 }}>AÃÂ±ade a Moha e Ignacio primero</div></div>}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12 }}>
                {agents.map(agent=>{ const s=agentStats.find(x=>x.name===agent.name)||{total:0,p1:0,p2:0,count:0}; return (
                  <Card key={agent.id} style={{ padding:"18px 20px",border:"1px solid #ede8e0" }}>
                    <div style={{ display:"flex",alignItems:"flex-start",gap:12,marginBottom:14 }}>
                      <Avatar name={agent.name} size={48} photoUrl={agent.photo_url}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:15,fontWeight:700,color:"#1a1a2e" }}>{agent.name}</div>
                        <div style={{ display:"flex",gap:6,marginTop:4,flexWrap:"wrap" }}>
                          <span style={{ fontSize:11,color:"#6366f1",fontWeight:500 }}>{agent.role}</span>
                          {agent.region&&agent.region!=="global"&&<span style={{ padding:"2px 8px",borderRadius:10,background:agent.region==="latam"?"rgba(16,185,129,0.1)":"rgba(99,102,241,0.1)",color:agent.region==="latam"?"#10b981":"#6366f1",fontSize:10,fontWeight:600,border:`1px solid ${agent.region==="latam"?"rgba(16,185,129,0.2)":"rgba(99,102,241,0.2)"}`}}>{agent.region.toUpperCase()}</span>}
                        </div>
                        {agent.email&&<div style={{ fontSize:11,color:"#9ca3af",marginTop:4 }}>{agent.email}</div>}
                      </div>
                      <button onClick={()=>setAgentModal({...agent,photoUrl:agent.photo_url})} style={{ background:"#f0ebe3",border:"none",color:"#6b7280",cursor:"pointer",width:26,height:26,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center" }}>{I.edit}</button>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12 }}>
                      {[["Atletas",s.count,"#6366f1"],["Cobrado",s.total+"Ã¢ÂÂ¬","#10b981"],["Deals",s.p1+s.p2,"#f59e0b"]].map(([l,v,c])=>(
                        <div key={l} style={{ background:"#f5f0e8",borderRadius:8,padding:"8px 10px",textAlign:"center" }}>
                          <div style={{ fontSize:9,color:"#374151",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4,fontWeight:600 }}>{l}</div>
                          <div style={{ fontSize:14,fontWeight:700,color:c }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={()=>{ if(window.confirm(`Eliminar a ${agent.name}?`)) deleteAgent(agent.id); }} style={{ width:"100%",padding:"7px",borderRadius:8,border:"1px solid rgba(239,68,68,0.12)",background:"none",color:"#ef4444",cursor:"pointer",fontSize:11,fontFamily:"inherit" }}>Eliminar</button>
                  </Card>
                ); })}
              </div>
            </div>
          )}

          {/* EARNINGS */}
          {nav==="earnings"&&(
            <div>
              <div style={{ marginBottom:20 }}>
                <h1 style={{ fontSize:22,fontWeight:700,color:"#1a1a2e",letterSpacing:-0.3 }}>Ã°ÂÂÂ¸ {isAdmin?"Ganancias por Reclutador":"Mis Ganancias"}</h1>
                <p style={{ color:"#374151",fontSize:13,marginTop:3 }}>{isAdmin?"Gestiona las comisiones de cada reclutador":"Tu resumen de comisiones"}</p>
              </div>

              {/* Summary cards */}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20 }}>
                {isAdmin
                  ? agentProfiles.filter(p=>p.role!=="admin"&&p.role!=="ceo").map(ap=>{
                      const apEarnings = commissions.filter(c=>c.referred_by===ap.name||c.referred_by===ap.email);
                      const total = apEarnings.reduce((s,c)=>s+(c.amount||0),0);
                      const paid = apEarnings.filter(c=>c.paid).reduce((s,c)=>s+(c.amount||0),0);
                      return (
                        <div key={ap.id} style={{ background:"#faf8f5",border:"1px solid rgba(99,102,241,0.15)",borderRadius:14,padding:"18px 20px" }}>
                          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
                            <div style={{ width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#6366f188,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff" }}>{(ap.name||"?")[0].toUpperCase()}</div>
                            <div><div style={{ fontSize:14,fontWeight:700,color:"#1a1a2e" }}>{ap.name}</div><div style={{ fontSize:11,color:"#4b5563" }}>{ap.email}</div></div>
                          </div>
                          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                            <div style={{ background:"rgba(16,185,129,0.06)",borderRadius:9,padding:"10px",textAlign:"center" }}><div style={{ fontSize:9,color:"#4b5563",fontWeight:600,textTransform:"uppercase",marginBottom:4 }}>Cobrado</div><div style={{ fontSize:16,fontWeight:800,color:"#10b981" }}>{paid.toLocaleString()}Ã¢ÂÂ¬</div></div>
                            <div style={{ background:"rgba(245,158,11,0.06)",borderRadius:9,padding:"10px",textAlign:"center" }}><div style={{ fontSize:9,color:"#4b5563",fontWeight:600,textTransform:"uppercase",marginBottom:4 }}>Pendiente</div><div style={{ fontSize:16,fontWeight:800,color:"#f59e0b" }}>{(total-paid).toLocaleString()}Ã¢ÂÂ¬</div></div>
                          </div>
                        </div>
                      );
                    })
                  : <>
                      <Stat label="Total ganado" value={`${commissions.filter(c=>c.referred_by===profile?.name||c.referred_by===profile?.email).reduce((s,c)=>s+(c.amount||0),0).toLocaleString()}Ã¢ÂÂ¬`} color="#f59e0b"/>
                      <Stat label="Cobrado" value={`${commissions.filter(c=>(c.referred_by===profile?.name||c.referred_by===profile?.email)&&c.paid).reduce((s,c)=>s+(c.amount||0),0).toLocaleString()}Ã¢ÂÂ¬`} color="#10b981"/>
                      <Stat label="Pendiente" value={`${commissions.filter(c=>(c.referred_by===profile?.name||c.referred_by===profile?.email)&&!c.paid).reduce((s,c)=>s+(c.amount||0),0).toLocaleString()}Ã¢ÂÂ¬`} color="#ef4444"/>
                    </>
                }
              </div>

              {/* Add earnings Ã¢ÂÂ admin only */}
              {isAdmin&&<EarningsForm players={players} agentProfiles={agentProfiles} onSave={saveCommission} />}

              {/* Earnings list */}
              <div style={{ display:"flex",flexDirection:"column",gap:8,marginTop:14 }}>
                <div style={{ fontSize:11,fontWeight:700,color:"#4b5563",textTransform:"uppercase",letterSpacing:1.2,marginBottom:8 }}>Detalle por atleta</div>
                {commissions.filter(c=>isAdmin||(c.referred_by===profile?.name||c.referred_by===profile?.email)).length===0&&
                  <div style={{ textAlign:"center",padding:40,color:"#4b5563" }}><div style={{ fontSize:28,marginBottom:8 }}>Ã°ÂÂÂ¸</div><div>Sin ganancias registradas</div></div>}
                {commissions.filter(c=>isAdmin||(c.referred_by===profile?.name||c.referred_by===profile?.email)).map(c=>{
                  const p=players.find(x=>x.id===c.player_id);
                  return (
                    <div key={c.id} style={{ display:"flex",alignItems:"center",gap:14,background:"#faf8f5",border:`1px solid ${c.paid?"rgba(16,185,129,0.15)":"rgba(245,158,11,0.12)"}`,borderRadius:12,padding:"13px 18px" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13,fontWeight:600,color:"#1a1a2e",marginBottom:3 }}>{p?.name||"Ã¢ÂÂ"}</div>
                        <div style={{ fontSize:11,color:"#4b5563" }}>
                          Reclutador: <span style={{ color:"#818cf8",fontWeight:600 }}>{c.referred_by||"Ã¢ÂÂ"}</span>
                          {c.percentage>0&&<span> ÃÂ· {c.percentage}% del total</span>}
                          {c.notes&&<span style={{ fontStyle:"italic" }}> ÃÂ· {c.notes}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:16,fontWeight:800,color:c.paid?"#10b981":"#f59e0b" }}>{(c.amount||0).toLocaleString()}Ã¢ÂÂ¬</div>
                        <div style={{ fontSize:10,color:c.paid?"#10b981":"#f59e0b",marginTop:2 }}>{c.paid?`Ã¢ÂÂ Pagado ${c.paid_date||""}`:"Pendiente"}</div>
                      </div>
                      {isAdmin&&<div style={{ display:"flex",flexDirection:"column",gap:5 }}>
                        {!c.paid&&<button onClick={async()=>{ await saveCommission({...c,paid:true,paid_date:new Date().toISOString().split("T")[0]}); }} style={{ padding:"5px 10px",borderRadius:7,border:"none",background:"rgba(16,185,129,0.15)",color:"#10b981",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit" }}>Ã¢ÂÂ Pagar</button>}
                        <button onClick={async()=>{ if(window.confirm("ÃÂ¿Eliminar?")) await deleteCommission(c.id); }} style={{ padding:"5px 10px",borderRadius:7,border:"1px solid rgba(239,68,68,0.15)",background:"none",color:"#ef4444",cursor:"pointer",fontSize:11,fontFamily:"inherit" }}>Ã¢ÂÂ</button>
                      </div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* COACHES */}
          {nav==="coaches"&&<CoachesDB players={visiblePlayers} isAdmin={isAdmin}/>}

          {/* ANALYTICS */}
          {nav==="analytics"&&<Analytics players={visiblePlayers} leads={visibleLeads} commissions={commissions} agents={agents} agentProfiles={agentProfiles}/>}

          {/* CALENDAR */}
          {nav==="calendar"&&<CalendarView profile={profile} isAdmin={isAdmin} agentProfiles={agentProfiles} players={visiblePlayers} leads={visibleLeads}/>}

          {/* REUNIONES */}
          {nav==="reuniones"&&<AvailabilityManager profile={profile}/>}

          {/* CHAT EQUIPO */}
          {nav==="chat"&&<TeamChat profile={profile} isAdmin={isAdmin||isLatamDirector}/>}

          </div>{/* end padding div */}
        </div>
      </div>

      {addModal&&<PlayerModal onClose={()=>setAddModal(false)} onSave={async(p)=>{ await addPlayer(p); setAddModal(false); }} agentList={agentNames}/>}
      {agentModal&&<AgentModal initial={agentModal==="new"?null:agentModal} onClose={()=>setAgentModal(null)} onSave={saveAgent}/>}
      {selectedLead&&<LeadDetailFull lead={selectedLead} onClose={()=>setSelectedLead(null)} onConvert={convertLead} onDelete={deleteLead} onRefresh={loadAll} profile={profile} isAdmin={isAdmin} agentProfiles={agentProfiles}/>}
      {permModal&&<PermissionsModal agentProfile={permModal} onClose={()=>setPermModal(null)} onSave={async(id,perms)=>{ await updatePermissions(id,perms); await loadAll(); }}/>}
    </div>
  );
}
