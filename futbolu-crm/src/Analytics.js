import { useState, useMemo } from "react";

const BAR_COLORS = ["#6366f1","#8b5cf6","#10b981","#f59e0b","#3b82f6","#ef4444","#22c55e","#ec4899"];

const MiniBar = ({ value, max, color="#6366f1", label, sub }) => (
  <div style={{ marginBottom:10 }}>
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
      <span style={{ fontSize:12, color:"#9ca3af" }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:700, color }}>{sub||value}</span>
    </div>
    <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:99, height:6 }}>
      <div style={{ width:`${Math.min(100,Math.round((value/(max||1))*100))}%`, background:color, height:"100%", borderRadius:99, transition:"width .5s" }}/>
    </div>
  </div>
);

export const Analytics = ({ players, leads, commissions, agents, agentProfiles }) => {
  const [period, setPeriod] = useState("all");

  const now = new Date();
  const filtered = useMemo(() => {
    if(period==="all") return players;
    const months = period==="3m"?3:period==="6m"?6:12;
    const cutoff = new Date(now.getFullYear(), now.getMonth()-months, 1);
    return players.filter(p => p.createdAt ? new Date(p.createdAt) >= cutoff : true);
  }, [players, period]);

  // Revenue
  const totalRevenue = filtered.reduce((s,p)=>s+(p.totalFee||2700),0);
  const totalCollected = filtered.reduce((s,p)=>s+(p.payment1?.paid?(p.payment1Amount||900):0)+(p.payment2?.paid?(p.payment2Amount||1800):0),0);
  const pending = totalRevenue - totalCollected;
  const collectionRate = totalRevenue > 0 ? Math.round((totalCollected/totalRevenue)*100) : 0;

  // By sport
  const bySport = {};
  filtered.forEach(p => { bySport[p.sport||"Unknown"] = (bySport[p.sport||"Unknown"]||0)+1; });
  const sportEntries = Object.entries(bySport).sort((a,b)=>b[1]-a[1]);

  // By status
  const byStatus = {};
  filtered.forEach(p => { byStatus[p.status||"Unknown"] = (byStatus[p.status||"Unknown"]||0)+1; });

  // By nationality
  const byNat = {};
  filtered.forEach(p => { if(p.nationality) byNat[p.nationality] = (byNat[p.nationality]||0)+1; });
  const natEntries = Object.entries(byNat).sort((a,b)=>b[1]-a[1]).slice(0,6);

  // Recruiter performance
  const recruiterStats = agentProfiles.filter(p=>p.role!=="admin"&&p.role!=="ceo").map(ap => {
    const myPlayers = players.filter(p=>p.agent&&(p.agent.toLowerCase().includes(ap.name?.toLowerCase()||"")));
    const myLeads = leads.filter(l=>l.referred_by&&l.referred_by.toLowerCase().includes((ap.name||"").split(" ")[0]?.toLowerCase()||""));
    const myEarnings = commissions.filter(c=>c.referred_by===ap.name).reduce((s,c)=>s+(c.amount||0),0);
    const conversion = myLeads.length > 0 ? Math.round((myPlayers.length/myLeads.length)*100) : 0;
    return { name:ap.name, players:myPlayers.length, leads:myLeads.length, earnings:myEarnings, conversion };
  }).sort((a,b)=>b.players-a.players);

  // Scholarship distribution
  const scholarshipBuckets = { "0-25%":0, "26-50%":0, "51-75%":0, "76-100%":0 };
  filtered.forEach(p => {
    const pct = p.scholarshipPct||0;
    if(pct<=25) scholarshipBuckets["0-25%"]++;
    else if(pct<=50) scholarshipBuckets["26-50%"]++;
    else if(pct<=75) scholarshipBuckets["51-75%"]++;
    else scholarshipBuckets["76-100%"]++;
  });

  // Lead conversion
  const convertedLeads = players.length;
  const totalLeads = leads.length + convertedLeads;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads/totalLeads)*100) : 0;

  const Card = ({ title, children, color="#6366f1" }) => (
    <div style={{ background:"#0a0c14", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"18px 20px" }}>
      <div style={{ fontSize:11, fontWeight:700, color, textTransform:"uppercase", letterSpacing:1.2, marginBottom:14 }}>{title}</div>
      {children}
    </div>
  );

  const BigStat = ({ label, value, sub, color="#f9fafb" }) => (
    <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"14px 16px", textAlign:"center" }}>
      <div style={{ fontSize:9, color:"#4b5563", textTransform:"uppercase", letterSpacing:1, marginBottom:6, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:900, color, letterSpacing:-0.5 }}>{value}</div>
      {sub&&<div style={{ fontSize:11, color:"#6b7280", marginTop:4 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#f9fafb", letterSpacing:-0.3 }}>Analíticas</h1>
          <p style={{ color:"#374151", fontSize:13, marginTop:3 }}>Rendimiento general de FUTBOLUAGENCY</p>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {[["all","Todo"],["12m","12 meses"],["6m","6 meses"],["3m","3 meses"]].map(([v,l])=>(
            <button key={v} onClick={()=>setPeriod(v)} style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${period===v?"rgba(99,102,241,0.4)":"rgba(255,255,255,0.08)"}`, background:period===v?"rgba(99,102,241,0.15)":"rgba(255,255,255,0.03)", color:period===v?"#818cf8":"#6b7280", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"inherit" }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Main stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        <BigStat label="Atletas" value={filtered.length} sub={`${filtered.filter(p=>p.status==="Scholarship").length} becados`} color="#6366f1"/>
        <BigStat label="Revenue total" value={`${(totalRevenue/1000).toFixed(1)}k€`} color="#8b5cf6"/>
        <BigStat label="Cobrado" value={`${(totalCollected/1000).toFixed(1)}k€`} sub={`${collectionRate}% del total`} color="#10b981"/>
        <BigStat label="Pendiente" value={`${(pending/1000).toFixed(1)}k€`} color="#f59e0b"/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        {/* Leads conversion */}
        <Card title="Conversión de Leads" color="#10b981">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
            <BigStat label="Leads totales" value={leads.length} color="#6b7280"/>
            <BigStat label="Convertidos" value={players.length} color="#10b981"/>
            <BigStat label="Tasa" value={`${conversionRate}%`} color="#f59e0b"/>
          </div>
          <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:9, padding:"10px 12px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:12, color:"#9ca3af" }}>
              <span>Tasa de conversión</span>
              <span style={{ color:"#10b981", fontWeight:700 }}>{conversionRate}%</span>
            </div>
            <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:99, height:8 }}>
              <div style={{ width:`${conversionRate}%`, background:"linear-gradient(90deg,#10b981,#059669)", height:"100%", borderRadius:99 }}/>
            </div>
          </div>
        </Card>

        {/* By sport */}
        <Card title="Atletas por Deporte" color="#6366f1">
          {sportEntries.slice(0,6).map(([sport,count],i)=>(
            <MiniBar key={sport} label={sport} value={count} max={filtered.length} color={BAR_COLORS[i%BAR_COLORS.length]} sub={`${count} (${Math.round((count/filtered.length)*100)}%)`}/>
          ))}
          {sportEntries.length===0&&<div style={{ color:"#4b5563", fontSize:13 }}>Sin datos</div>}
        </Card>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        {/* By nationality */}
        <Card title="Nacionalidades" color="#3b82f6">
          {natEntries.map(([nat,count],i)=>(
            <MiniBar key={nat} label={nat} value={count} max={filtered.length} color={BAR_COLORS[i%BAR_COLORS.length]} sub={`${count}`}/>
          ))}
          {natEntries.length===0&&<div style={{ color:"#4b5563", fontSize:13 }}>Sin datos</div>}
        </Card>

        {/* Scholarship distribution */}
        <Card title="Distribución de Becas" color="#f59e0b">
          {Object.entries(scholarshipBuckets).map(([range,count],i)=>(
            <MiniBar key={range} label={range} value={count} max={Math.max(...Object.values(scholarshipBuckets),1)} color={["#ef4444","#f59e0b","#10b981","#6366f1"][i]} sub={`${count} atletas`}/>
          ))}
        </Card>
      </div>

      {/* Recruiter ranking */}
      {recruiterStats.length>0&&(
        <Card title="🏆 Ranking Reclutadores" color="#f59e0b">
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {recruiterStats.map((r,i)=>(
              <div key={r.name} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 14px", background:"rgba(255,255,255,0.02)", borderRadius:10, border:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:["linear-gradient(135deg,#f59e0b,#d97706)","linear-gradient(135deg,#9ca3af,#6b7280)","linear-gradient(135deg,#92400e,#78350f)"][i]||"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#fff", flexShrink:0 }}>#{i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#f9fafb" }}>{r.name}</div>
                  <div style={{ fontSize:11, color:"#4b5563", marginTop:2 }}>{r.leads} leads · {r.conversion}% conversión</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:14, fontWeight:800, color:"#10b981" }}>{r.earnings.toLocaleString()}€</div>
                  <div style={{ fontSize:11, color:"#6b7280" }}>{r.players} atletas</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Status breakdown */}
      <div style={{ marginTop:12 }}>
        <Card title="Estado de Atletas" color="#8b5cf6">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
            {Object.entries({ "Scholarship":"#10b981","In Process":"#f59e0b","Prospect":"#6366f1","Inactive":"#6b7280" }).map(([status,color])=>(
              <div key={status} style={{ background:`${color}10`, border:`1px solid ${color}25`, borderRadius:10, padding:"12px", textAlign:"center" }}>
                <div style={{ fontSize:9, color:"#4b5563", textTransform:"uppercase", letterSpacing:0.8, marginBottom:6, fontWeight:600 }}>{status}</div>
                <div style={{ fontSize:20, fontWeight:800, color }}>{byStatus[status]||0}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
