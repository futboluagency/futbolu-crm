import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "./supabase";

// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// ─── ROLES & PERMISSIONS ──────────────────────────────────────────────────────
export const DEFAULT_PERMISSIONS = {
  view_dashboard: true,
  view_players: true,
  view_leads: true,
  view_offers: true,
  view_payments: false,
  view_commissions: false,
  view_team: true,
  view_all_agents: false,
  create_players: true,
  delete_players: false,
  manage_offers: true,
};

export const ADMIN_EMAIL = "futboluagency@gmail.com";
export const CEO_EMAILS = ["futboluagency@gmail.com", "ignaciofutboluagency@gmail.com"];

// ─── AUTH PROVIDER ────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId, email) => {
    const { data } = await supabase
      .from("agent_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      // Update role if CEO email
      if (CEO_EMAILS.includes(email) && data.role !== "ceo") {
        await supabase.from("agent_profiles").update({ role: "ceo" }).eq("id", data.id);
        setProfile({ ...data, role: "ceo" });
      } else {
        setProfile(data);
      }
    } else if (CEO_EMAILS.includes(email)) {
      // Auto-create CEO profile
      const name = email === "futboluagency@gmail.com" ? "Moha" : "Ignacio";
      const { data: newProfile } = await supabase
        .from("agent_profiles")
        .insert({ user_id: userId, email, role: "ceo", name, permissions: JSON.stringify(Object.fromEntries(Object.keys(DEFAULT_PERMISSIONS).map(k => [k, true]))) })
        .select()
        .single();
      setProfile(newProfile);
    } else {
      // New recruiter — create pending profile
      const { data: newProfile } = await supabase
        .from("agent_profiles")
        .insert({ user_id: userId, email, role: "recruiter", name: email.split("@")[0], permissions: JSON.stringify(DEFAULT_PERMISSIONS) })
        .select()
        .single();
      setProfile(newProfile);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id, session.user.email);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://futbolu-crm-wrjw.vercel.app" },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.role === "admin" || profile?.role === "ceo" || CEO_EMAILS.includes(user?.email);

  const can = (permission) => {
    if (isAdmin) return true;
    if (!profile?.permissions) return false;
    const perms = typeof profile.permissions === "string" ? JSON.parse(profile.permissions) : profile.permissions;
    return perms[permission] === true;
  };

  const updatePermissions = async (profileId, newPerms) => {
    await supabase.from("agent_profiles").update({ permissions: JSON.stringify(newPerms) }).eq("id", profileId);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, signInWithGoogle, signOut, can, updatePermissions }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    await signInWithGoogle();
  };

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif",background:"#050709",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{ width:"100%",maxWidth:380,textAlign:"center" }}>
        <img src="/logo.png" alt="FUTBOLUAGENCY" onError={e=>e.target.style.display="none"} style={{ height:64,objectFit:"contain",marginBottom:32 }}/>
        <div style={{ background:"#0a0c14",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:"36px 32px" }}>
          <h1 style={{ fontSize:22,fontWeight:800,color:"#f9fafb",marginBottom:8,letterSpacing:-0.5 }}>FUTBOLUAGENCY CRM</h1>
          <p style={{ fontSize:14,color:"#4b5563",marginBottom:32,lineHeight:1.6 }}>Inicia sesión con tu cuenta de Google para acceder al CRM.</p>
          <button onClick={handleLogin} disabled={loading} style={{ width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:12,padding:"13px 20px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#f9fafb",cursor:"pointer",fontSize:14,fontWeight:600,fontFamily:"inherit",transition:"all .15s" }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {loading ? "Conectando..." : "Continuar con Google"}
          </button>
          <p style={{ fontSize:11,color:"#374151",marginTop:20 }}>Solo los miembros del equipo FUTBOLUAGENCY tienen acceso.</p>
        </div>
        <p style={{ fontSize:12,color:"#374151",marginTop:20 }}>📱 WhatsApp: +34 603 331 990</p>
      </div>
    </div>
  );
};

// ─── ACCESS DENIED ────────────────────────────────────────────────────────────
export const AccessDenied = ({ section }) => (
  <div style={{ textAlign:"center",padding:"60px 20px",color:"#4b5563" }}>
    <div style={{ fontSize:36,marginBottom:12 }}>🔒</div>
    <div style={{ fontSize:16,fontWeight:600,color:"#6b7280",marginBottom:6 }}>Acceso restringido</div>
    <div style={{ fontSize:13 }}>No tienes permiso para ver {section}. Contacta con el administrador.</div>
  </div>
);
