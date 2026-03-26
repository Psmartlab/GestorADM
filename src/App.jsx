import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { auth, googleProvider, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { doc, setDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { LayoutDashboard, Users as UsersIcon, CheckSquare, Shield, LogOut, Loader2, AlertCircle, ClipboardCheck, Database, Bell } from 'lucide-react';
import Dashboard from './views/Dashboard';
import Tasks from './views/Tasks';
import Teams from './views/Teams';
import UsersPanel from './views/Users';
import Checkins from './views/Checkins';
import TaskControl from './views/TaskControl';
import Projects from './views/Projects';
import SeedData from './views/SeedData';
import Notifications from './views/Notifications';

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

  const handleMockLogin = () => {
    setUser({
      uid: 'mock-admin',
      displayName: 'Administrador (Demo)',
      email: 'admin@demo.com',
      role: 'Admin',
      photoURL: null
    });
  };

  return (
    <div className="flex-col items-center justify-center p-8 w-full h-full" style={{ minHeight: '100vh', display: 'flex', background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }}>
      <div className="glass-panel p-8 flex-col items-center gap-6" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ padding: '1rem', background: 'var(--accent-primary)', borderRadius: '12px', display: 'inline-block' }}>
          <LayoutDashboard size={48} color="white" />
        </div>
        <div>
          <h2>GestorADM</h2>
          <p className="text-muted">Plataforma de Gestão de Equipes</p>
        </div>
        {errorMsg && (
          <div style={{ color: 'var(--danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}
        <button className="btn w-full justify-center p-4" onClick={handleLogin} style={{ fontSize: '1.1rem' }}>
          Entrar com Google
        </button>
        <button className="btn w-full justify-center p-4 mt-2" onClick={handleMockLogin} style={{ fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          Entrar em Modo de Demonstração (Admin)
        </button>
        <p className="text-muted text-xs" style={{ marginTop: '1rem' }}>
          Problemas com o login? <button onClick={handlePopupLogin} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.75rem' }}>Tentar via Janela (Popup)</button>
        </p>
      </div>
    </div>
  );
};

// --- Dashboard Layout ---
const DashboardLayout = ({ children, user }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return (
    <div className="app-container">
      <aside className="sidebar glass-panel" style={{ borderRadius: 0 }}>
        <div className="user-card">
          <div className="user-avatar">
            {user?.photoURL ? <img src={user.photoURL} alt="Avatar" style={{width: '100%', borderRadius: '50%'}} /> : user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{user?.displayName || 'Usuário'}</div>
            <div className="text-sm">{user?.email}</div>
            {user?.role && <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{user.role}</div>}
          </div>
        </div>

        <nav className="flex-col gap-2 flex-1">
          <Link to="/" className={`btn w-full ${isActive('/') ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', textDecoration: 'none' }}><LayoutDashboard size={18} /> Dashboard</Link>
          <Link to="/tasks" className={`btn w-full ${isActive('/tasks') ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', textDecoration: 'none' }}><CheckSquare size={18} /> Minhas Tarefas</Link>
          <Link to="/checkins" className={`btn w-full ${isActive('/checkins') ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', textDecoration: 'none' }}><ClipboardCheck size={18} /> Check-ins</Link>
          
            <Link to="/control" className={`btn w-full ${isActive('/control') ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', textDecoration: 'none', background: isActive('/control') ? 'var(--accent-primary)' : 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <Shield size={18} /> Controle de Tarefas
            </Link>

          <Link to="/teams" className={`btn w-full ${isActive('/teams') ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', textDecoration: 'none' }}><UsersIcon size={18} /> Equipes</Link>
          <Link to="/projects" className={`btn w-full ${isActive('/projects') ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', textDecoration: 'none' }}><LayoutDashboard size={18} /> Projetos</Link>
          <Link to="/users" className={`btn w-full ${isActive('/users') ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', textDecoration: 'none' }}><Shield size={18} /> Admin e Usuários</Link>
          {isAdmin && (
            <Link to="/notifications" className={`btn w-full ${isActive('/notifications') ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', textDecoration: 'none', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <Bell size={18} /> Central de Notificações
            </Link>
          )}
          <Link to="/seed" className={`btn w-full ${isActive('/seed') ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', textDecoration: 'none', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}><Database size={18} /> Semear Dados</Link>
        </nav>

        <button className="btn btn-secondary" style={{ marginTop: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }} onClick={() => signOut(auth)}>
          <LogOut size={18} /> Sair
        </button>
      </aside>
      
      <main className="main-content" style={{ padding: location.pathname === '/' ? '0' : '2rem' }}>
        {children}
      </main>
    </div>
  );
};

// --- App Root ---
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
          // Recupera o cargo do usuário no Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          let role = userData.role || 'User';
          
          // Fallback: Se não encontrou cargo pelo UID, busca pelo Email (caso tenha sido semeado ou convidado)
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
            role: role // Garante que o role seja o encontrado (ou User)
          });
          
          // Salva/Atualiza o usuário no banco de dados em background
          setDoc(doc(db, 'users', currentUser.uid), {
            uid: currentUser.uid,
            name: currentUser.displayName || 'Sem Nome',
            email: currentUser.email || '',
            photo: currentUser.photoURL || null
          }, { merge: true }).catch(e => console.error("Erro ao salvar usuário:", e));
        } else {
          setUser(null);
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
            <DashboardLayout user={user}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/tasks" element={<Tasks user={user} />} />
                <Route path="/checkins" element={<Checkins />} />
                <Route path="/teams" element={<Teams />} />
                <Route path="/projects" element={<Projects user={user} />} />
                <Route path="/users" element={<UsersPanel user={user} />} />
                <Route path="/notifications" element={<Notifications user={user} />} />
                <Route path="/seed" element={<SeedData />} />
                <Route path="/control" element={<TaskControl />} />
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
