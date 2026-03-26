import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { auth, googleProvider, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { doc, setDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { LayoutDashboard, Users as UsersIcon, CheckSquare, Shield, LogOut, Loader2, AlertCircle, ClipboardCheck, Database, Bell, Settings } from 'lucide-react';
import Dashboard from './views/Dashboard';
import Tasks from './views/Tasks';
import Teams from './views/Teams';
import UsersPanel from './views/Users';
import Checkins from './views/Checkins';
import TaskControl from './views/TaskControl';
import Projects from './views/Projects';
import SeedData from './views/SeedData';
import Notifications from './views/Notifications';
import SettingsPage from './views/Settings';
import TeamDashboard from './views/TeamDashboard';
import ProjectDashboard from './views/ProjectDashboard';
import UserDashboard from './views/UserDashboard';
import Profile from './views/Profile';

// --- Login Screen ---
const Login = ({ setUser }) => {
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLogin = async () => {
    try {
      console.log("Iniciando login (Popup)...");
      setErrorMsg("Carregando (Abrindo Janela)...");
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
      setErrorMsg(`Erro: ${error.message}`);
    }
  };

  const handlePopupLogin = async () => {
    try {
      console.log("Iniciando login (Popup)...");
      setErrorMsg("Abrindo janela de login...");
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Popup Login Error:", error);
      setErrorMsg(`Erro no Popup: ${error.message}`);
    }
  };

  const handleMockLogin = (role = 'Admin') => {
    const roleConfig = {
      'Admin': {
        uid: 'demo-admin-id',
        email: 'henrique@smartlab.com.br',
        displayName: 'Henrique Admin (Demo)',
      },
      'Gerente': {
        uid: 'demo-manager-id',
        email: 'gerente@smartlab.com.br',
        displayName: 'Carlos Gerente (Demo)',
      },
      'User': {
        uid: 'demo-user-id',
        email: 'usuario@smartlab.com.br',
        displayName: 'Ana Operacional (Demo)',
      }
    };

    const config = roleConfig[role] || roleConfig['Admin'];
    
    const demoUser = {
      ...config,
      role: role,
      isDemo: true,
      photoURL: null
    };
    setUser(demoUser);
    localStorage.setItem('smartlab-user', JSON.stringify(demoUser));
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 w-full min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-12 flex flex-col items-center gap-8 w-full max-w-[480px] border-2 border-slate-300 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-950 rounded-[24px] md:rounded-[28px] flex items-center justify-center shadow-2xl border-4 border-white -mt-14 md:-mt-20 group-hover:rotate-6 transition-transform">
          <LayoutDashboard size={32} className="text-white" />
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-black text-slate-950 font-headline tracking-tighter uppercase italic leading-none">SmartLab</h1>
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em] mt-3">Gestão de Alto Desempenho</p>
        </div>

        {errorMsg && (
          <div className="w-full bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <p className="text-[11px] font-bold text-red-600 leading-tight uppercase tracking-tight">{errorMsg}</p>
          </div>
        )}

        <div className="w-full flex flex-col gap-6">
          <button className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border-2 border-slate-950" onClick={handleLogin}>
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,11.033H12V12c0,0.552,0.448,1,1,1h3.333c-0.34,1.434-1.5,2.542-3.131,2.9 c-1.631,0.358-3.102-0.301-3.921-1.666c-0.126-0.211-0.37-0.32-0.597-0.258c-0.228,0.061-0.372,0.283-0.342,0.517 c0.124,0.966,0.725,1.802,1.6,2.296C10.749,17.293,11.85,17.5,13,17.5c2.481,0,4.5-2.019,4.5-4.5c0-0.552-0.448-1-1-1h-3.955 L16,11.033z"/></svg>
            Entrar com Google
          </button>

          <div className="grid grid-cols-1 gap-3 w-full">
            <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest text-center mb-1">Acesso Demonstração</p>
            <div className="flex flex-col gap-2 w-full">
              <button className="w-full py-4 bg-white text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] border-2 border-slate-100 hover:border-slate-950 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group shadow-sm" onClick={() => handleMockLogin('Admin')}>
                <Shield size={16} className="text-slate-400 group-hover:text-slate-950" />
                Admin
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-4 px-2 bg-white text-slate-950 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-wider md:tracking-[0.15em] border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-1.5 group shadow-sm" onClick={() => handleMockLogin('Gerente')}>
                  <UsersIcon size={14} className="text-slate-400 group-hover:text-blue-500" />
                  Gerente
                </button>
                <button className="py-4 px-2 bg-white text-slate-950 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-wider md:tracking-[0.15em] border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center justify-center gap-1.5 group shadow-sm" onClick={() => handleMockLogin('User')}>
                  <ClipboardCheck size={16} className="text-slate-400 group-hover:text-emerald-500" />
                  Equipe
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t-2 border-slate-50 w-full text-center">
          <button onClick={handlePopupLogin} className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-950 transition-colors">
            Problemas? Tente via Popup
          </button>
        </div>
      </div>
      
      <p className="absolute bottom-8 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">v3.1 // BOARD PERFORMANCE EDITION</p>
    </div>
  );
};

// --- Dashboard Layout ---
const DashboardLayout = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  const isActive = (path) => location.pathname === path;
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // Fechar popover se clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased flex overflow-x-hidden w-full">
      {/* TopNavBar - Refined Slate-300 */}
      <nav className="fixed top-0 left-0 w-full flex justify-between items-center px-4 md:px-10 py-4 md:py-5 bg-white/90 backdrop-blur-md border-b-2 border-slate-300 shadow-sm z-50">
        <div className="flex items-center gap-4 md:gap-10">
          <div className="flex items-center gap-3 md:gap-4 group cursor-pointer">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-950 rounded-xl md:rounded-2xl flex items-center justify-center transition-transform shadow-lg group-hover:rotate-6">
              <span className="text-white font-black text-xl md:text-2xl italic font-headline">S</span>
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tighter text-slate-950 font-headline uppercase italic leading-none hidden sm:block">SmartLab</span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          {user?.isDemo && (
            <Link to="/seed" className="flex items-center gap-2 px-3 md:px-5 py-2.5 bg-amber-50 text-amber-600 border-2 border-amber-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all italic">
              <Database size={16} /> 
              <span className="hidden sm:inline">Sincronizar Board</span>
            </Link>
          )}
          
          <Link to="/settings" className="p-2.5 md:p-3 bg-slate-50 text-slate-400 border-2 border-slate-100 rounded-2xl hover:border-slate-300 hover:text-slate-900 transition-all">
            <Settings size={20} />
          </Link>

          <div className="relative flex items-center" ref={notifRef}>
            <button onClick={() => setShowNotifs(!showNotifs)} className={`p-3 rounded-2xl transition-all relative outline-none flex items-center justify-center bg-slate-50 border-2 ${showNotifs ? 'border-slate-950 text-slate-950' : 'border-slate-100 text-slate-400 hover:border-slate-300'}`}>
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-16 w-[360px] bg-white rounded-[32px] shadow-2xl border-2 border-slate-300 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-8 border-b-2 border-slate-50 flex justify-between items-end">
                   <div>
                     <h3 className="text-xl font-black text-slate-950 font-headline tracking-tighter uppercase italic leading-none">Alertas</h3>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">Atividade recente</p>
                   </div>
                   <Link to="/notifications" onClick={() => setShowNotifs(false)} className="text-[10px] font-black text-slate-400 hover:text-slate-950 uppercase tracking-widest border-b-2 border-transparent hover:border-slate-950 transition-all pb-1">Board Completo</Link>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                   <div className="p-6 border-b-2 border-slate-50 hover:bg-slate-50 cursor-pointer transition-all flex gap-4 pr-10">
                      <div className="w-1.5 h-10 bg-indigo-500 rounded-full shrink-0" />
                      <div>
                        <p className="text-xs font-black text-slate-950 uppercase tracking-tight leading-tight">Reunião Start-up</p>
                        <p className="text-[11px] font-bold text-slate-500 mt-1 leading-relaxed">Em 15 minutos na sala principal.</p>
                      </div>
                   </div>
                   <div className="p-6 border-b-2 border-slate-50 hover:bg-red-50/30 cursor-pointer transition-all flex gap-4 pr-10">
                      <div className="w-1.5 h-10 bg-red-500 rounded-full shrink-0 animate-pulse" />
                      <div>
                        <p className="text-xs font-black text-red-600 uppercase tracking-tight leading-tight">Alerta: Atraso Crítico</p>
                        <p className="text-[11px] font-bold text-slate-500 mt-1 leading-relaxed italic">Projeto H2N2 com pendências.</p>
                      </div>
                   </div>
                </div>
                <div className="p-4 bg-slate-50 text-center">
                   <button onClick={() => setShowNotifs(false)} className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-950 transition-colors">Limpar Central</button>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => onLogout()} className="p-2.5 md:p-3 bg-red-50 text-red-500 border-2 border-red-100 rounded-2xl hover:border-red-500 hover:text-white hover:bg-red-500 transition-all">
            <LogOut size={20} />
          </button>
          
          <Link to="/profile" className="ml-2 flex items-center gap-3 pl-1 pr-4 py-1.5 bg-slate-950 rounded-full border-2 border-slate-950 hover:scale-105 transition-all shadow-lg shadow-slate-950/20">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-slate-950 text-xs overflow-hidden border-2 border-slate-800">
               {user?.photoURL ? <img src={user.photoURL} alt="A" className="w-full h-full object-cover" /> : user?.email?.charAt(0).toUpperCase()}
            </div>
            <span className="text-[11px] font-black text-white uppercase tracking-widest hidden lg:block">{user?.displayName?.split(' ')[0] || 'Admin'}</span>
          </Link>
        </div>
      </nav>

      {/* Sidebar - Slate-300 Board Look */}
      <aside className="fixed left-0 top-0 h-screen hidden md:flex flex-col p-8 bg-white w-[280px] pt-32 border-r-2 border-slate-300 z-40">
        <nav className="flex-1 flex flex-col gap-2">
          <Link to="/" className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${isActive('/') ? 'bg-slate-950 text-white shadow-xl translate-x-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-950'}`}>
            <LayoutDashboard size={20} />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] italic font-headline">Geral</span>
          </Link>
          <Link to="/tasks" className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${isActive('/tasks') ? 'bg-slate-950 text-white shadow-xl translate-x-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-950'}`}>
            <CheckSquare size={20} />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] italic font-headline">Tarefas</span>
          </Link>
          <Link to="/checkins" className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${isActive('/checkins') ? 'bg-slate-950 text-white shadow-xl translate-x-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-950'}`}>
            <Shield size={20} />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] italic font-headline">Check-ins</span>
          </Link>
          
          <div className="h-px bg-slate-100 my-6 mx-2" />
          
          <Link to="/control" className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${isActive('/control') ? 'bg-slate-950 text-white shadow-xl translate-x-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-950'}`}>
            <ClipboardCheck size={20} />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] italic font-headline">Gestão</span>
          </Link>
          {(user?.role === 'Admin' || user?.role === 'Gerente') && (
            <>
              <Link to="/dashboard/teams" className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${isActive('/dashboard/teams') ? 'bg-slate-950 text-white shadow-xl translate-x-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-950'}`}>
                <UsersIcon size={20} />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] italic font-headline">Equipes</span>
              </Link>
              <Link to="/dashboard/projects" className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${isActive('/dashboard/projects') ? 'bg-slate-950 text-white shadow-xl translate-x-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-950'}`}>
                <Database size={20} />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] italic font-headline">Projetos</span>
              </Link>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[280px] pt-24 md:pt-32 px-4 md:px-10 pb-32 md:pb-12 min-h-screen bg-slate-50 min-w-0 flex flex-col items-center">
        <div className="w-full max-w-[2560px] mx-auto">
          {children}
        </div>
      </main>

      {/* BottomNavBar - Mobile Slate-300 */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-slate-950/90 backdrop-blur-xl border-2 border-slate-800 rounded-[32px] px-8 flex justify-between items-center z-50 shadow-2xl">
        <Link to="/" className={`flex flex-col items-center gap-1.5 ${isActive('/') ? 'text-white scale-110' : 'text-slate-500'}`}>
          <LayoutDashboard size={24} />
          <span className="text-[8px] font-black uppercase tracking-widest italic leading-none">Main</span>
        </Link>
        <Link to="/tasks" className={`flex flex-col items-center gap-1.5 ${isActive('/tasks') ? 'text-white scale-110' : 'text-slate-500'}`}>
          <CheckSquare size={24} />
          <span className="text-[8px] font-black uppercase tracking-widest italic leading-none">Log</span>
        </Link>
        <div className="relative -top-8">
          <Link to="/control" className="flex items-center justify-center bg-white w-16 h-16 rounded-[24px] text-slate-950 shadow-[0_0_30px_rgba(255,255,255,0.4)] border-4 border-slate-950">
            <span className="text-3xl font-black">+</span>
          </Link>
        </div>
        <Link to="/checkins" className={`flex flex-col items-center gap-1.5 ${isActive('/checkins') ? 'text-white scale-110' : 'text-slate-500'}`}>
          <Shield size={24} />
          <span className="text-[8px] font-black uppercase tracking-widest italic leading-none">Safe</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center gap-1.5 ${isActive('/profile') ? 'text-white scale-110' : 'text-slate-500'}`}>
          <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-700 font-black flex items-center justify-center text-[10px]">P</div>
          <span className="text-[8px] font-black uppercase tracking-widest italic leading-none">Me</span>
        </Link>
      </nav>
    </div>
  );
};

// --- App Root ---
function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('smartlab-user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.isDemo) return parsed;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('smartlab-user');
      setUser(null);
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  useEffect(() => {
    console.log("App mounted. Checking auth...");
    
    // Timeout de segurança para não ficar travado no loading
    const timer = setTimeout(() => {
      setLoading(false);
      console.warn("Auth timeout: Force loading to false.");
    }, 5000);

    // Captura o resultado do login por redirecionamento
    getRedirectResult(auth).then(async (res) => {
      if (res?.user) {
        console.log("Login por redirecionamento sucesso:", res.user.email);
        const userDoc = await getDoc(doc(db, 'users', res.user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        setUser({ ...res.user, role: userData.role || 'User' });
        setLoading(false);
      }
    }).catch(e => {
      if (e.code !== 'auth/redirect-cancelled-by-user') {
        console.error("Erro no redirecionamento:", e);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth State Changed:", currentUser?.email);
      clearTimeout(timer);
      try {
        if (currentUser) {
          // Remove o demo user se um real entrar
          localStorage.removeItem('smartlab-user');
          
          // Recupera o cargo do usuário no Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          let role = userData.role || 'User';
          
          // Fallback: Se não encontrou cargo pelo UID...
          if (!userData.role && currentUser.email) {
            try {
              const q = query(collection(db, 'users'), where('email', '==', currentUser.email));
              const snap = await getDocs(q);
              if (!snap.empty) {
                const emailDoc = snap.docs[0].data();
                role = emailDoc.role || 'User';
                console.log("Cargo recuperado via Email:", role);
              }
            } catch (e) {
              console.error("Erro ao buscar cargo por email:", e);
            }
          }

          setUser({
            ...currentUser,
            ...userData,
            role: role
          });
          
          setDoc(doc(db, 'users', currentUser.uid), {
            uid: currentUser.uid,
            name: currentUser.displayName || 'Sem Nome',
            email: currentUser.email || '',
            photo: currentUser.photoURL || null
          }, { merge: true }).catch(e => console.error("Erro ao salvar usuário:", e));
        } else {
          // Só limpa o user se NÃO for um demo user
          setUser(prev => (prev?.isDemo ? prev : null));
        }
      } catch (error) {
        console.error("Auth state error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full" style={{ minHeight: '100vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--accent-primary)" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login setUser={setUser} />} 
          />
        <Route path="/*" element={
          user ? (
            <DashboardLayout user={user} onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Dashboard user={user} />} />
                {/* Dashboard Hub sub-paths point back to the Hub component which handles internal routing now */}
                <Route path="/dashboard/teams" element={<TeamDashboard user={user} />} />
                <Route path="/dashboard/projects" element={<ProjectDashboard user={user} />} />
                <Route path="/dashboard/users" element={<UserDashboard user={user} />} />
                
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/users" element={<UsersPanel user={user} />} />
                <Route path="/projects" element={<Projects user={user} />} />
                <Route path="/teams" element={<Teams user={user} />} />
                <Route path="/tasks" element={<Tasks user={user} />} />
                <Route path="/checkins" element={<Checkins user={user} />} />
                <Route path="/notifications" element={<Notifications user={user} />} />
                <Route path="/settings" element={<SettingsPage user={user} />} />
                <Route path="/profile" element={<Profile user={user} />} />
                <Route path="/seed" element={<SeedData user={user} />} />
                <Route path="/control" element={<TaskControl user={user} />} />
              </Routes>
            </DashboardLayout>
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
