import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
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

    // Use email as temporary ID to prevent duplicates if they haven't logged in yet
    // When they login via Google, we shouldn't overwrite the role, but update uid.
    // For simplicity, we just add them using an auto-ID or their email.
    try {
      await setDoc(doc(db, 'users', email), {
        email: email,
        name: 'Aguardando Login',
        role: newUserRole,
        invitedAt: serverTimestamp()
      }, { merge: true });
      
      setIsInviteModalOpen(false);
      setNewUserEmail('');
    } catch (error) {
      alert("Erro ao convidar: " + error.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
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
    if (user?.role === 'Admin') return true;
    if (user?.role === 'Gerente') {
      // Regra: Pode ver se o usuário está em uma de suas equipes E NÃO está em nenhuma equipe de terceiros
      const hasManagerTeam = u.teamIds?.some(tid => user.teamIds?.includes(tid)) || u.teamId === user.teamId;
      const onlyManagerTeams = (u.teamIds || []).every(tid => user.teamIds?.includes(tid));
      
      // Caso o usuário ainda não tenha equipes (novato), o gerente que o convidou ou do mesmo time base pode ver?
      // Pela especificação: "acesso aos demais usuários de nível abaixo dele. Desde que não esteja cadastrado como participante de outra equipe diferente do gerente"
      return hasManagerTeam && onlyManagerTeams;
    }
    
    // Membros normais só vêm a si mesmos? (Geralmente para perfil, mas aqui é painel de gestão)
    return u.email === auth.currentUser?.email;
  });

  return (
    <div className="flex-col gap-6" style={{ height: '100%' }}>
      <div className="flex justify-between items-center">
        <h1>Gestão de Usuários</h1>
        <button className="btn" onClick={() => setIsInviteModalOpen(true)}>
          <UserPlus size={18} /> Cadastrar / Convidar
        </button>
      </div>

      <div className="glass-panel p-4 flex gap-2 w-full" style={{ marginBottom: '1rem' }}>
        <Search size={18} color="var(--text-secondary)" />
        <input 
          type="text" 
          placeholder="Buscar usuário por nome ou email..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
        />
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)' }}>
              <th style={{ padding: '1rem' }}>Usuário</th>
              <th style={{ padding: '1rem' }}>Nível de Acesso</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Validade</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Carregando usuários...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhum usuário encontrado.</td></tr>
            ) : (
              filteredUsers.map(u => {
                const isExpired = u.expiresAt && new Date(u.expiresAt) < new Date();
                const isBlocked = u.status === 'blocked';
                const statusColor = isBlocked ? 'var(--danger)' : isExpired ? 'var(--warning)' : 'var(--success)';
                const statusText = isBlocked ? 'Bloqueado' : isExpired ? 'Expirado' : 'Ativo';

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div className="flex items-center gap-3">
                        {u.photo ? <img src={u.photo} alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} /> : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{u.name?.charAt(0) || u.email?.charAt(0)}</div>}
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', fontSize: '0.85rem' }}>
                        <Shield size={12} style={{ display: 'inline', marginRight: '4px' }}/> {u.role || 'Membro'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ color: statusColor, fontWeight: 600, fontSize: '0.9rem' }}>● {statusText}</span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {u.expiresAt ? new Date(u.expiresAt).toLocaleDateString() : 'Acesso Vitalício'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button className="btn btn-secondary text-sm" onClick={() => loadUserHistory(u.email)} style={{ padding: '0.4rem 0.6rem', background: 'transparent', border: 'none' }} title="Histórico de Ações">
                        <History size={16} color="var(--accent-primary)" />
                      </button>
                      <button className="btn btn-secondary text-sm" onClick={() => setEditingUser(u)} style={{ padding: '0.4rem 0.6rem', background: 'transparent', border: 'none' }} title="Editar Permissões">
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Convite */}
      {isInviteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form className="glass-panel p-8 flex-col gap-4" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-secondary)', position: 'relative' }} onSubmit={handleInviteUser}>
            <button type="button" onClick={() => setIsInviteModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
            <h2>Novo Usuário</h2>
            <p className="text-sm text-muted">Pré-cadastro para acesso ao sistema. Uma vez logado usando a conta Google com este e-mail, ele herdará este cargo.</p>
            
            <div className="mt-4">
              <label className="text-sm text-muted mb-2 block">E-mail do Usuário</label>
              <input required type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full p-3 rounded" style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)' }} />
            </div>
            
            <div>
              <label className="text-sm text-muted mb-2 block">Nível de Acesso Inicial</label>
              <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="w-full p-3 rounded" style={{ background: '#0f172a', color: 'white', border: '1px solid var(--border-color)' }}>
                <option value="Membro">Membro comum</option>
                <option value="Gerente">Gerente de Equipe</option>
                <option value="Admin">Administrador Global</option>
              </select>
            </div>
            
            <div className="flex gap-4 mt-4">
              <button type="button" className="btn btn-secondary flex-1" onClick={() => setIsInviteModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn flex-1">Registrar Acesso</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Edição */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form className="glass-panel p-8 flex-col gap-4" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-secondary)', position: 'relative' }} onSubmit={handleUpdateUser}>
            <button type="button" onClick={() => setEditingUser(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
            <h2>Editar Permissões</h2>
            <p className="text-sm text-muted">Ajuste o acesso para: <strong style={{color: 'white'}}>{editingUser.name || editingUser.email}</strong></p>
            
            <div className="mt-4">
              <label className="text-sm text-muted mb-2 block">Categoria / Função</label>
              <select value={editingUser.role || 'Membro'} onChange={e => setEditingUser({...editingUser, role: e.target.value})} className="w-full p-3 rounded" style={{ background: '#0f172a', color: 'white', border: '1px solid var(--border-color)' }}>
                <option value="Membro">Membro comum</option>
                <option value="Gerente">Gerente de Equipe</option>
                <option value="Admin">Administrador Global</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-muted mb-2 block flex items-center gap-2"><Clock size={16}/> Prazo de Acesso</label>
              <input type="date" value={editingUser.expiresAt || ''} onChange={e => setEditingUser({...editingUser, expiresAt: e.target.value})} className="w-full p-3 rounded" style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)' }} />
              <div className="text-xs text-muted mt-1">Deixe em branco para acesso sem vencimento.</div>
            </div>

            <div>
              <label className="text-sm text-muted mb-2 block">Status Geral</label>
              <select value={editingUser.status || 'active'} onChange={e => setEditingUser({...editingUser, status: e.target.value})} className="w-full p-3 rounded" style={{ background: '#0f172a', color: 'white', border: '1px solid var(--border-color)' }}>
                <option value="active">🟢 Ativo (Acesso Permitido)</option>
                <option value="blocked">🔴 Bloqueado (Acesso Negado)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="text-sm text-muted mb-2 block">Equipes Vinculadas</label>
                <div className="flex-col gap-1 overflow-y-auto p-2 glass-panel" style={{ maxHeight: '150px' }}>
                  {teams.map(t => (
                    <label key={t.id} className="flex items-center gap-2 text-xs p-1 hover:bg-white/5 cursor-pointer">
                      <input 
                        type="checkbox" 
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
                <label className="text-sm text-muted mb-2 block">Projetos Ativos</label>
                <div className="flex-col gap-1 overflow-y-auto p-2 glass-panel" style={{ maxHeight: '150px' }}>
                  {projects.map(p => (
                    <label key={p.id} className="flex items-center gap-2 text-xs p-1 hover:bg-white/5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(editingUser.projectIds || []).includes(p.id)} 
                        onChange={(e) => {
                          const ids = editingUser.projectIds || [];
                          const newIds = e.target.checked ? [...ids, p.id] : ids.filter(id => id !== p.id);
                          setEditingUser({ ...editingUser, projectIds: newIds });
                        }}
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button type="button" className="btn btn-secondary flex-1" onClick={() => setEditingUser(null)}>Cancelar</button>
              <button type="submit" className="btn flex-1">Salvar Alteraçoes</button>
            </div>
          </form>
        </div>
      )}

      {/* Slide de Histórico (Auditoria) */}
      {historyUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="glass-panel" style={{ width: '450px', height: '100%', borderRadius: 0, padding: '2rem', overflowY: 'auto', background: 'var(--bg-primary)', animation: 'slideIn 0.3s forwards', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="flex items-center gap-2"><FileText size={20} /> Histórico de Auditoria</h2>
              <button onClick={() => setHistoryUser(null)} className="btn btn-secondary" style={{ padding: '0.4rem', border: 'none' }}><X size={20} /></button>
            </div>
            <p className="text-muted text-sm mb-6">Visualizando as últimas ações computadas de: <strong>{historyUser}</strong></p>
            
            <div className="flex-col gap-4">
              {auditLogs.length === 0 ? (
                <div className="text-muted text-center p-8 bg-black/20 rounded">Nenhum registro encontrado para este usuário.</div>
              ) : (
                auditLogs.map(log => {
                  let logDateString = 'Processando instante...';
                  if (log.created_at && log.created_at.toDate) {
                    logDateString = log.created_at.toDate().toLocaleString();
                  }

                  return (
                    <div key={log.id} style={{ borderLeft: '2px solid var(--accent-primary)', paddingLeft: '1rem', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                        {logDateString} 
                        <span style={{ marginLeft: '1rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px' }}>{log.target_type} : {log.action}</span>
                      </div>
                      <div style={{ fontSize: '0.95rem' }}>{log.details}</div>
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
