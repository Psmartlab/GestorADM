import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Shield, Clock, Search, Edit2, History, X, UserPlus, FileText } from 'lucide-react';

export default function Users({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Membro');
  
  const [editingUser, setEditingUser] = useState(null);
  const [newUserProjectId, setNewUserProjectId] = useState('');
  
  const [historyUser, setHistoryUser] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 4000);

    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q,
      (snapshot) => { setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setLoading(false); clearTimeout(timer); },
      () => { setLoading(false); clearTimeout(timer); }
    );

    const unsubTeams = onSnapshot(collection(db, 'teams'),
      (snapshot) => setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      () => {}
    );

    const unsubProjects = onSnapshot(collection(db, 'projects'),
      (snapshot) => setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      () => {}
    );

    return () => { clearTimeout(timer); unsub(); unsubTeams(); unsubProjects(); };
  }, []);

  const handleInviteUser = async (e) => {
    e.preventDefault();
    const email = newUserEmail.trim().toLowerCase();
    if (!email) return;
    if (!(editingUser?.projectIds?.length > 0) && !newUserProjectId) {
       alert("Selecione pelo menos um projeto para o usuário.");
       return;
    }

    try {
      await setDoc(doc(db, 'users', email), {
        email: email,
        name: 'Aguardando Login',
        role: newUserRole,
        projectIds: [newUserProjectId],
        invitedAt: serverTimestamp()
      }, { merge: true });
      
      setIsInviteModalOpen(false);
      setNewUserEmail('');
      setNewUserProjectId('');
    } catch (error) {
      alert("Erro ao convidar: " + error.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editingUser.projectIds || editingUser.projectIds.length === 0) {
      alert("O usuário deve estar atrelado a pelo menos um projeto.");
      return;
    }
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        role: editingUser.role,
        expiresAt: editingUser.expiresAt || null,
        status: editingUser.status,
        teamIds: editingUser.teamIds || [],
        projectIds: editingUser.projectIds || []
      });
      setEditingUser(null);
    } catch (error) {
      alert("Erro ao atualizar: " + error.message);
    }
  };

  const loadUserHistory = async (email) => {
    setHistoryUser(email);
    setAuditLogs([]);
    try {
      // Query without orderBy to bypass Firestore's composite index requirement
      const q = query(collection(db, 'audit_logs'), where('user', '==', email));
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort descending by timestamp in memory to guarantee no missing index errors
      logs.sort((a, b) => {
        const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : 0;
        const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : 0;
        return timeB - timeA;
      });
      
      setAuditLogs(logs);
    } catch (e) {
      console.error(e);
      alert("Erro ao ler logs: " + e.message);
    }
  };

  const filteredUsers = users.filter(u => {
    // Busca por termo
    const matchesSearch = (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
                          (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    // Filtro de Hierarquia
    // Se for Admin, vê tudo
    if (user?.role?.toLowerCase() === 'admin') return true;

    // Se for Gerente, vê sua equipe
    if (user?.role === 'Gerente' || user?.role === 'Manager') {
      const hasManagerTeam = (u.teamIds || []).some(tid => (user.teamIds || []).includes(tid)) || u.teamId === user.teamId;
      const onlyManagerTeams = (u.teamIds || []).every(tid => (user.teamIds || []).includes(tid));
      return hasManagerTeam && onlyManagerTeams;
    }
    
    // Usuário normal vê a si mesmo
    const currentUserEmail = user?.email || auth.currentUser?.email;
    return u.email === currentUserEmail;
  });

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-950 font-headline m-0 uppercase italic">Gestão de Usuários</h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest opacity-60">Controle de acessos, permissões e auditoria</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 shadow-lg active:scale-95" onClick={() => setIsInviteModalOpen(true)}>
          <UserPlus size={18} /> Cadastrar / Convidar
        </button>
      </div>

      <div className="bg-white p-6 rounded-[24px] border-2 border-slate-300 shadow-sm flex items-center gap-4 mb-10 group focus-within:border-slate-950 transition-all">
        <Search size={20} className="text-slate-300 group-focus-within:text-slate-950 transition-colors" />
        <input 
          type="text" 
          placeholder="BUSCAR USUÁRIO POR NOME OU EMAIL..." 
          className="flex-1 bg-transparent border-none text-slate-900 font-bold placeholder:text-slate-200 uppercase tracking-widest text-[11px] outline-none"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border-2 border-slate-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-100 italic uppercase tracking-[0.2em] text-[10px] font-black text-slate-500">
                <th className="px-8 py-5">Usuário</th>
                <th className="px-8 py-5">Nível</th>
                <th className="px-8 py-5">Projetos Ativos</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Acesso</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="6" className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando usuários...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="6" className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum usuário encontrado.</td></tr>
            ) : (
              filteredUsers.map(u => {
                const isExpired = u.expiresAt && new Date(u.expiresAt) < new Date();
                const isBlocked = u.status === 'blocked';
                const statusClass = isBlocked ? 'bg-red-50 text-red-600 border-red-100' : isExpired ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100';
                const statusText = isBlocked ? 'Bloqueado' : isExpired ? 'Expirado' : 'Ativo';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-slate-200 flex items-center justify-center text-white font-black text-xs">
                          {u.photo ? <img src={u.photo} alt="" className="w-full h-full rounded-full" /> : (u.name?.charAt(0) || u.email?.charAt(0))}
                        </div>
                        <div>
                          <div className="font-black text-slate-950 tracking-tight">{u.name || 'Sem Nome'}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 border-2 border-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit">
                        <Shield size={12}/> {u.role || 'Membro'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-2 max-w-[200px]">
                        {(u.projectIds || []).length > 0 ? (
                          u.projectIds.map(pid => {
                            const p = projects.find(proj => proj.id === pid);
                            return (
                              <span key={pid} className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border-2 border-blue-100 uppercase tracking-tight">
                                {p ? p.name || p.title : 'N/A'}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[9px] font-black text-slate-300 uppercase italic">Nenhum</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${statusClass}`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-[10px] font-black text-slate-400 italic">
                      {u.expiresAt ? new Date(u.expiresAt).toLocaleDateString() : 'VITALÍCIO'}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-950 hover:text-white rounded-xl transition-all" onClick={() => loadUserHistory(u.email)} title="Auditoria">
                          <History size={16} />
                        </button>
                        <button type="button" className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-950 hover:text-white rounded-xl transition-all" onClick={() => setEditingUser(u)} title="Permissões">
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>

      {/* Modal de Convite */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <form className="bg-white rounded-[32px] p-10 border-2 border-slate-300 shadow-2xl w-full max-w-[440px] relative animate-in fade-in zoom-in duration-300" onSubmit={handleInviteUser}>
            <button type="button" onClick={() => setIsInviteModalOpen(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-slate-950 font-headline tracking-tighter uppercase italic mb-2">Novo Usuário</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 leading-relaxed">Pré-cadastro para acesso ao sistema via Google Auth.</p>
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">E-mail Corporativo</label>
                <input required type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 font-bold text-slate-800 focus:border-slate-800 outline-none transition-all placeholder:text-slate-200" placeholder="ex: usuario@empresa.com" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Nível de Acesso</label>
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 font-black uppercase tracking-widest text-xs text-slate-800 focus:border-slate-800 outline-none transition-all appearance-none cursor-pointer">
                  <option value="Membro">Membro comum</option>
                  <option value="Gerente">Gerente de Equipe</option>
                  <option value="Admin">Administrador Global</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Projeto Obrigatório</label>
                <select required value={newUserProjectId} onChange={e => setNewUserProjectId(e.target.value)} className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 font-black uppercase tracking-widest text-xs text-slate-800 focus:border-slate-800 outline-none transition-all appearance-none cursor-pointer">
                  <option value="">Selecione...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title || p.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-4 mt-4">
                <button type="button" className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all" onClick={() => setIsInviteModalOpen(false)}>Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95">Registrar</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Edição */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <form className="bg-white rounded-[32px] p-10 border-2 border-slate-300 shadow-2xl w-full max-w-[500px] relative animate-in fade-in zoom-in duration-300" onSubmit={handleUpdateUser}>
            <button type="button" onClick={() => setEditingUser(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-slate-950 font-headline tracking-tighter uppercase italic mb-2">Editar Acessos</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 leading-relaxed">Configurando: <span className="text-slate-950 italic">{editingUser.name || editingUser.email}</span></p>
            
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Categoria</label>
                  <select value={editingUser.role || 'Membro'} onChange={e => setEditingUser({...editingUser, role: e.target.value})} className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 font-black uppercase tracking-widest text-xs text-slate-800 focus:border-slate-800 outline-none transition-all appearance-none cursor-pointer">
                    <option value="Membro">Membro comum</option>
                    <option value="Gerente">Gerente de Equipe</option>
                    <option value="Admin">Administrador Global</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Status</label>
                  <select value={editingUser.status || 'active'} onChange={e => setEditingUser({...editingUser, status: e.target.value})} className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 font-black uppercase tracking-widest text-xs text-slate-800 focus:border-slate-800 outline-none transition-all appearance-none cursor-pointer">
                    <option value="active">🟢 Ativo</option>
                    <option value="blocked">🔴 Bloqueado</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 flex items-center gap-2"><Clock size={16}/> Validade da Licença</label>
                <input type="date" value={editingUser.expiresAt || ''} onChange={e => setEditingUser({...editingUser, expiresAt: e.target.value})} className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 font-bold text-slate-800 focus:border-slate-800 outline-none transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Equipes</label>
                  <div className="flex flex-col gap-2 overflow-y-auto p-4 bg-slate-50 rounded-2xl border-2 border-slate-100" style={{ maxHeight: '120px' }}>
                    {teams.map(t => (
                      <label key={t.id} className="flex items-center gap-3 text-[10px] font-bold text-slate-600 uppercase tracking-tight cursor-pointer hover:text-slate-950 transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-3.5 h-3.5 rounded border-2 border-slate-300 text-slate-950 focus:ring-0"
                          checked={(editingUser.teamIds || []).includes(t.id)} 
                          onChange={(e) => {
                            const ids = editingUser.teamIds || [];
                            const newIds = e.target.checked ? [...ids, t.id] : ids.filter(id => id !== t.id);
                            setEditingUser({ ...editingUser, teamIds: newIds });
                          }}
                        />
                        {t.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Projetos *</label>
                  <div className="flex flex-col gap-2 overflow-y-auto p-4 bg-slate-50 rounded-2xl border-2 border-slate-100" style={{ maxHeight: '120px' }}>
                    {projects.map(p => (
                      <label key={p.id} className="flex items-center gap-3 text-[10px] font-bold text-slate-600 uppercase tracking-tight cursor-pointer hover:text-slate-950 transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-3.5 h-3.5 rounded border-2 border-slate-300 text-slate-950 focus:ring-0"
                          checked={(editingUser.projectIds || []).includes(p.id)} 
                          onChange={(e) => {
                            const ids = editingUser.projectIds || [];
                            const newIds = e.target.checked ? [...ids, p.id] : ids.filter(id => id !== p.id);
                            setEditingUser({ ...editingUser, projectIds: newIds });
                          }}
                        />
                        {p.name || p.title}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 mt-4">
                <button type="button" className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all" onClick={() => setEditingUser(null)}>Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95">Salvar</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Slide de Histórico (Auditoria) */}
      {historyUser && (
        <div className="fixed inset-0 z-[90] flex justify-end bg-slate-950/20 backdrop-blur-[2px] animate-in fade-in duration-300">
          <div className="w-full max-w-[480px] bg-white h-full shadow-2xl border-l-4 border-slate-950 p-10 overflow-y-auto animate-in slide-in-from-right duration-500">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-2xl font-black text-slate-950 font-headline tracking-tighter uppercase italic flex items-center gap-3">
                  <FileText size={24} /> Trilha de Auditoria
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Registros de atividade para: <span className="text-slate-900 border-b-2 border-slate-950">{historyUser}</span></p>
              </div>
              <button onClick={() => setHistoryUser(null)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-950 hover:text-white transition-all shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-6">
              {auditLogs.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-slate-100 border-dashed">
                  <History size={48} className="mx-auto mb-4 text-slate-200" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Nenhuma ação registrada.</p>
                </div>
              ) : (
                auditLogs.map((log, index) => {
                  let logDateString = '...';
                  if (log.created_at && log.created_at.toDate) {
                    logDateString = log.created_at.toDate().toLocaleString('pt-BR');
                  }

                  return (
                    <div key={log.id} className="relative pl-8 group">
                      {index !== auditLogs.length - 1 && (
                        <div className="absolute left-[3px] top-8 bottom-[-24px] w-0.5 bg-slate-100" />
                      )}
                      <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-slate-950 ring-4 ring-slate-50" />
                      
                      <div className="flex flex-col gap-1 mb-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 italic">{logDateString}</span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-tighter italic">{log.target_type}</span>
                          <span className="text-[11px] font-black text-slate-950 uppercase tracking-tight">{log.action}</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 text-xs font-bold text-slate-600 leading-relaxed italic border-dashed group-hover:border-slate-300 transition-all">
                        "{log.details}"
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
