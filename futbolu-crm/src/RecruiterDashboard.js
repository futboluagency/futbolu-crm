import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const BAR_COLORS = ["#6366f1","#8b5cf6","#10b981","#f59e0b","#3b82f6","#ef4444"];

const MiniBar = ({ value, max, color="#6366f1", label, sub }) => (
  <div style={{ marginBottom:10 }}>
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
      <span style={{ fontSize:12, color:"#6b7280" }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:700, color }}>{sub||value}</span>
    </div>
    <div style={{ background:"#f0ebe3", borderRadius:99, height:6 }}>
      <div style={{ width:`${Math.min(100,max>0?Math.round((value/max)*100):0)}%`, background:color, height:"100%", borderRadius:99, transition:"width .5s" }}/>
    </div>
  </div>
);

export const RecruiterDashboard = ({ profile, players, leads, commissions }) => {
  const [goals, setGoals] = useState({ monthly_leads:5, monthly_players:2 });
  const [editGoals, setEditGoals] = useState(false);
  const [tempGoals, setTempGoals] = useState({ monthly_leads:5, monthly_players:2 });

  useEffect(() => { loadGoals(); }, [profile?.id]);

  const loadGoals = async () => {
    if(!profile?.id) return;
    const {data} = await supabase.from("recruiter_goals").select("*").eq("profile_id", profile.id).single();
    if(data) { setGoals(data); setTempGoals(data); }
  };

  const saveGoals = async () => {
    if(!profile?.id) return;
    const existing = await supabase.from("recruiter_goals").select("id").eq("profile_id", profile.id).single();
    if(existing.data) await supabase.from("recruiter_goals").update(tempGoals).eq("profile_id", profile.id);
    else await supabase.from("recruiter_goals").insert({...tempGoals, profile_id:profile.id});
    setGoals(tempGoals);
    setEditGoals(false);
  };

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const lastMonth = now.getMonth()===0
    ? `${now.getFullYear()-1}-12`
    : `${now.getFullYear()}-${String(now.getMonth()).padStart(2,"0")}`;

  // Stats
  const myLeads = leads || [];
  const myPlayers = players || [];
  const myEarnings = commissions.filter(c=>c.referred_by===profile?.name||c.referred_by===profile?.email);

  const leadsThisMonth = myLeads.filter(l=>l.created_at?.startsWith(thisMonth)).length;
  const leadsLastMonth = myLeads.filter(l=>l.created_at?.startsWith(lastMonth)).length;
  const playersThisMonth = myPlayers.filter(p=>p.createdAt?.startsWith(thisMonth)).length;
  const totalEarned = myEarnings.reduce((s,c)=>s+(c.amount||0),0);
  const pendingEarnings = myEarnings.filter(c=>!c.paid).reduce((s,c)=>s+(c.amount||0),0);
  const paidEarnings = myEarnings.filter(c=>c.paid).reduce((s,c)=>s+(c.amount||0),0);
  const conversionRate = myLeads.length>0 ? Math.round((myPlayers.length/myLeads.length)*100) : 0;

  // Weekly leads (last 4 weeks)
  const weeklyData = Array.from({length:4}).map((_,i)=>{
    const d = new Date();
    d.setDate(d.getDate() - (i*7));
    const weekStart = new Date(d); weekStart.setDate(d.getDate()-d.getDay());
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6);
    const ws = weekStart.toISOString().split("T")[0];
    const we = weekEnd.toISOString().split("T")[0];
    const count = myLeads.filter(l=>l.created_at>=ws&&l.created_at<=we).length;
    return { label:`S-${i}`, count };
  }).reverse();

  const maxWeekly = Math.max(...weeklyData.map(w=>w.count), goals.monthly_leads/4, 1);

  // Monthly last 6 months
  const monthlyData = Array.from({length:6}).map((_,i)=>{
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    return {
      label: MONTHS[d.getMonth()],
      leads: myLeads.filter(l=>l.created_at?.startsWith(key)).length,
      players: myPlayers.filter(p=>p.createdAt?.startsWith(key)).length,
    };
  }).reverse();

  const maxMonthly = Math.max(...monthlyData.map(m=>m.leads), goals.monthly_leads, 1);

  const Card = ({children, style={}}) => (
    <div style={{ background:"#fff", border:"1px solid #e8e3db", borderRadius:14, padding:"18px 20px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)", ...style }}>{children}</div>
  );

  const StatBox = ({label, value, sub, color="#1a1a2e"}) => (
    <div style={{ background:"#f9f7f4", border:"1px solid #e8e3db", borderRadius:10, padding:"14px 16px", textAlign:"center" }}>
      <div style={{ fontSize:9, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1, marginBottom:6, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:900, color, letterSpacing:-0.5 }}>{value}</div>
      {sub&&<div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#1a1a2e", letterSpacing:-0.3 }}>Mi Dashboard</h1>
        <p style={{ color:"#6b7280", fontSize:13, marginTop:3 }}>Bienvenido, {profile?.name}. Aqui esta tu rendimiento.</p>
      </div>

      {/* Main stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
        <StatBox label="Mis leads" value={myLeads.length} sub={`${leadsThisMonth} este mes`} color="#6366f1"/>
        <StatBox label="Mis atletas" value={myPlayers.length} sub={`${playersThisMonth} este mes`} color="#1a1a2e"/>
        <StatBox label="Tasa conversion" value={`${conversionRate}%`} color="#10b981"/>
        <StatBox label="Total ganado" value={`${totalEarned.toLocaleString()}€`} sub={`${pendingEarnings}€ pendiente`} color="#f59e0b"/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        {/* Monthly goals */}
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e", textTransform:"uppercase", letterSpacing:0.8 }}>Objetivos del mes</div>
            <button onClick={()=>{ setTempGoals(goals); setEditGoals(!editGoals); }} style={{ fontSize:11, color:"#6366f1", fontWeight:600, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>{editGoals?"Cancelar":"Editar"}</button>
          </div>
          {editGoals ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div>
                <label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Objetivo leads/mes</label>
                <input type="number" value={tempGoals.monthly_leads} onChange={e=>setTempGoals(g=>({...g,monthly_leads:parseInt(e.target.value)||0}))} style={{ background:"#f9f7f4", border:"1px solid #e8e3db", borderRadius:8, padding:"8px 12px", color:"#1a1a2e", fontSize:13, outline:"none", width:"100%", fontFamily:"inherit" }}/>
              </div>
              <div>
                <label style={{ fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 }}>Objetivo atletas/mes</label>
                <input type="number" value={tempGoals.monthly_players} onChange={e=>setTempGoals(g=>({...g,monthly_players:parseInt(e.target.value)||0}))} style={{ background:"#f9f7f4", border:"1px solid #e8e3db", borderRadius:8, padding:"8px 12px", color:"#1a1a2e", fontSize:13, outline:"none", width:"100%", fontFamily:"inherit" }}/>
              </div>
              <button onClick={saveGoals} style={{ padding:"9px", borderRadius:8, border:"none", background:"#1a1a2e", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>Guardar objetivos</button>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:13, color:"#374151", fontWeight:500 }}>Leads este mes</span>
                  <span style={{ fontSize:13, fontWeight:700, color:leadsThisMonth>=goals.monthly_leads?"#10b981":"#6366f1" }}>{leadsThisMonth}/{goals.monthly_leads}</span>
                </div>
                <div style={{ background:"#f0ebe3", borderRadius:99, height:10 }}>
                  <div style={{ width:`${Math.min(100,goals.monthly_leads>0?Math.round((leadsThisMonth/goals.monthly_leads)*100):0)}%`, background:leadsThisMonth>=goals.monthly_leads?"#10b981":"#6366f1", height:"100%", borderRadius:99, transition:"width .5s" }}/>
                </div>
                {leadsThisMonth>=goals.monthly_leads&&<div style={{ fontSize:11, color:"#10b981", fontWeight:600, marginTop:4 }}>Objetivo conseguido!</div>}
              </div>
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:13, color:"#374151", fontWeight:500 }}>Atletas este mes</span>
                  <span style={{ fontSize:13, fontWeight:700, color:playersThisMonth>=goals.monthly_players?"#10b981":"#8b5cf6" }}>{playersThisMonth}/{goals.monthly_players}</span>
                </div>
                <div style={{ background:"#f0ebe3", borderRadius:99, height:10 }}>
                  <div style={{ width:`${Math.min(100,goals.monthly_players>0?Math.round((playersThisMonth/goals.monthly_players)*100):0)}%`, background:playersThisMonth>=goals.monthly_players?"#10b981":"#8b5cf6", height:"100%", borderRadius:99, transition:"width .5s" }}/>
                </div>
              </div>
              <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>
                Mes anterior: {leadsLastMonth} leads
              </div>
            </div>
          )}
        </Card>

        {/* Earnings breakdown */}
        <Card>
          <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e", textTransform:"uppercase", letterSpacing:0.8, marginBottom:14 }}>Mis ganancias</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
            <div style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.15)", borderRadius:10, padding:"12px", textAlign:"center" }}>
              <div style={{ fontSize:9, color:"#9ca3af", textTransform:"uppercase", letterSpacing:0.8, marginBottom:4, fontWeight:600 }}>Cobrado</div>
              <div style={{ fontSize:18, fontWeight:800, color:"#10b981" }}>{paidEarnings.toLocaleString()}€</div>
            </div>
            <div style={{ background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.15)", borderRadius:10, padding:"12px", textAlign:"center" }}>
              <div style={{ fontSize:9, color:"#9ca3af", textTransform:"uppercase", letterSpacing:0.8, marginBottom:4, fontWeight:600 }}>Pendiente</div>
              <div style={{ fontSize:18, fontWeight:800, color:"#f59e0b" }}>{pendingEarnings.toLocaleString()}€</div>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {myEarnings.slice(0,4).map(c=>{
              const p = players.find(x=>x.id===c.player_id);
              return (
                <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", background:"#f9f7f4", borderRadius:8, border:"1px solid #f0ebe3" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#1a1a2e" }}>{p?.name||"Atleta"}</div>
                    <div style={{ fontSize:10, color:"#9ca3af" }}>{c.percentage>0?`${c.percentage}% comision`:""}</div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:c.paid?"#10b981":"#f59e0b" }}>{(c.amount||0).toLocaleString()}€</div>
                  <div style={{ fontSize:10, color:c.paid?"#10b981":"#f59e0b", fontWeight:600 }}>{c.paid?"Cobrado":"Pendiente"}</div>
                </div>
              );
            })}
            {myEarnings.length===0&&<div style={{ color:"#9ca3af", fontSize:13, textAlign:"center", padding:"10px 0" }}>Sin ganancias registradas aun</div>}
          </div>
        </Card>
      </div>

      {/* Weekly chart */}
      <Card style={{ marginBottom:12 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e", textTransform:"uppercase", letterSpacing:0.8, marginBottom:16 }}>Leads por semana (ultimas 4 semanas)</div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:80 }}>
          {weeklyData.map((w,i)=>(
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ fontSize:11, fontWeight:700, color:BAR_COLORS[i%BAR_COLORS.length] }}>{w.count}</div>
              <div style={{ width:"100%", background:BAR_COLORS[i%BAR_COLORS.length], borderRadius:"4px 4px 0 0", height:`${Math.max(4,Math.round((w.count/maxWeekly)*60))}px`, transition:"height .5s" }}/>
              <div style={{ fontSize:10, color:"#9ca3af" }}>{w.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Monthly chart */}
      <Card>
        <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e", textTransform:"uppercase", letterSpacing:0.8, marginBottom:16 }}>Rendimiento mensual (6 meses)</div>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:"#6b7280", marginBottom:10, fontWeight:500 }}>Leads</div>
            {monthlyData.map((m,i)=>(
              <MiniBar key={i} label={m.label} value={m.leads} max={maxMonthly} color="#6366f1" sub={`${m.leads}`}/>
            ))}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:"#6b7280", marginBottom:10, fontWeight:500 }}>Atletas firmados</div>
            {monthlyData.map((m,i)=>(
              <MiniBar key={i} label={m.label} value={m.players} max={Math.max(...monthlyData.map(x=>x.players),1)} color="#10b981" sub={`${m.players}`}/>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
