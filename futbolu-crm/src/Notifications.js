import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export const useNotifications = (userEmail) => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if(!userEmail) return;
    load();
    // Poll every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const load = async () => {
    const { data } = await supabase.from("notifications").select("*")
      .eq("user_email", userEmail).order("created_at", { ascending:false }).limit(20);
    setNotifications(data||[]);
    setUnread((data||[]).filter(n=>!n.read).length);
  };

  const markRead = async (id) => {
    await supabase.from("notifications").update({ read:true }).eq("id", id);
    await load();
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ read:true }).eq("user_email", userEmail).eq("read", false);
    await load();
  };

  return { notifications, unread, markRead, markAllRead, reload: load };
};

export const createNotification = async (userEmail, title, body, type="info", link="") => {
  if(!userEmail) return;
  await supabase.from("notifications").insert({ user_email:userEmail, title, body, type, link, read:false });
};

export const NotificationBell = ({ userEmail }) => {
  const { notifications, unread, markRead, markAllRead } = useNotifications(userEmail);
  const [open, setOpen] = useState(false);

  const TYPE_COLORS = { info:"#6366f1", success:"#10b981", warning:"#f59e0b", lead:"#8b5cf6", payment:"#10b981" };
  const TYPE_ICONS = { info:"ℹ", success:"✓", warning:"⚠", lead:"👤", payment:"€" };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff/60000);
    if(mins<1) return "Ahora";
    if(mins<60) return `${mins}m`;
    const hrs = Math.floor(mins/60);
    if(hrs<24) return `${hrs}h`;
    return `${Math.floor(hrs/24)}d`;
  };

  return (
    <div style={{ position:"relative" }}>
      <button onClick={()=>setOpen(!open)} style={{ position:"relative", background:"none", border:"1px solid #e8e3db", borderRadius:10, width:38, height:38, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, background:"#fff" }}>
        🔔
        {unread>0&&<div style={{ position:"absolute", top:-4, right:-4, width:18, height:18, borderRadius:"50%", background:"#ef4444", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#fff" }}>{unread>9?"9+":unread}</div>}
      </button>

      {open&&<>
        <div onClick={()=>setOpen(false)} style={{ position:"fixed", inset:0, zIndex:999 }}/>
        <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:340, background:"#fff", border:"1px solid #e8e3db", borderRadius:16, boxShadow:"0 8px 32px rgba(0,0,0,0.12)", zIndex:1000, maxHeight:420, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", borderBottom:"1px solid #f0ebe3" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#1a1a2e" }}>Notificaciones {unread>0&&<span style={{ background:"#ef4444", color:"#fff", borderRadius:20, fontSize:10, padding:"1px 6px", marginLeft:6 }}>{unread}</span>}</div>
            {unread>0&&<button onClick={markAllRead} style={{ fontSize:11, color:"#6366f1", fontWeight:600, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Marcar todo leido</button>}
          </div>
          <div style={{ overflowY:"auto", flex:1 }}>
            {notifications.length===0&&<div style={{ padding:"24px 16px", textAlign:"center", color:"#9ca3af", fontSize:13 }}>Sin notificaciones</div>}
            {notifications.map(n=>(
              <div key={n.id} onClick={()=>markRead(n.id)} style={{ display:"flex", gap:10, padding:"12px 16px", borderBottom:"1px solid #f9f7f4", background:n.read?"transparent":"rgba(99,102,241,0.03)", cursor:"pointer" }}
                onMouseEnter={e=>e.currentTarget.style.background="#f9f7f4"} onMouseLeave={e=>e.currentTarget.style.background=n.read?"transparent":"rgba(99,102,241,0.03)"}>
                <div style={{ width:32, height:32, borderRadius:8, background:`${TYPE_COLORS[n.type]||"#6366f1"}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                  {TYPE_ICONS[n.type]||"ℹ"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:n.read?500:700, color:"#1a1a2e", marginBottom:2 }}>{n.title}</div>
                  {n.body&&<div style={{ fontSize:11, color:"#6b7280", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.body}</div>}
                </div>
                <div style={{ fontSize:10, color:"#9ca3af", flexShrink:0 }}>{timeAgo(n.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      </>}
    </div>
  );
};
