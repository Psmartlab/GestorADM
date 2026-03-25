import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { UserPlus, Trash2, Mail, Loader2, AlertCircle, X, Plus } from 'lucide-react';

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]); // Will hold team members or generic users
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  
  // States para gerenciar a adição de membros
  const [activeTeamInvite, setActiveTeamInvite] = useState(null); // ID da equipe aberta para convite
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    const qTeams = query(collection(db, 'teams'));
    const unsubTeams = onSnapshot(qTeams, (snapshot) => {
      setTeams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
      setErrorMsg(null);
    }, (error) => {
      console.error("Erro ao carregar equipes:", error);
      setErrorMsg(error.message);
      setLoading(false);
    });

    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubTeams(); unsubUsers(); };
  }, []);

  const handleCreateTeam = (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    // Fecha o modal e limpa a tela instantaneamente (Optimistic Update)
    setIsModalOpen(false);
    
    addDoc(collection(db, 'teams'), {
      name: newTeamName,
      description: newTeamDesc,
      members: [], // Array de emails ou IDs
      created_at: serverTimestamp(),
    }).catch(error => {
      console.error(error);
      alert("Erro ao criar equipe: " + error.message);
    });

    setNewTeamName('');
    setNewTeamDesc('');
  };

  const deleteTeam = async (id) => {
    if (window.confirm("Deseja realmente excluir esta equipe? As tarefas associadas podem ficar órfãs.")) {
      await deleteDoc(doc(db, 'teams', id));
    }
  };

  const handleAddMember = async (teamId) => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      alert("Digite um email válido.");
      return;
    }
    try {
      await updateDoc(doc(db, 'teams', teamId), {
        members: arrayUnion(inviteEmail.trim().toLowerCase())
      });
      setInviteEmail('');
      setActiveTeamInvite(null);
    } catch (e) {
      alert("Erro ao adicionar membro: " + e.message);
    }
  };

  const handleRemoveMember = async (teamId, email) => {
    if (window.confirm(`Remover ${email} da equipe?`)) {
      await updateDoc(doc(db, 'teams', teamId), {
        members: arrayRemove(email)
      });
    }
  };

  if (loading) return <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Carregando equipes...</div>;

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1>Gestão de Equipes</h1>
        <button className="btn" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={18} /> Nova Equipe
        </button>
      </div>

      {errorMsg && (
        <div style={{ color: 'var(--danger)', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
          <AlertCircle size={20} className="inline mr-2" /> {errorMsg}
        </div>
      )}

      <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
        {teams.length === 0 ? (
          <div className="text-muted p-8 glass-panel w-full text-center">Nenhuma equipe criada. Crie sua primeira equipe!</div>
        ) : (
          teams.map(team => (
            <div key={team.id} className="glass-panel p-6 flex-col gap-4" style={{ width: '100%', maxWidth: '400px' }}>
              <div className="flex justify-between items-start">
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{team.name}</h3>
                <button className="btn btn-secondary" onClick={() => deleteTeam(team.id)} style={{ padding: '0.4rem', border: 'none' }} title="Excluir Equipe">
                  <Trash2 size={16} color="var(--danger)" />
                </button>
              </div>
              <p className="text-muted text-sm">{team.description || 'Sem descrição'}</p>
              
              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <span className="text-sm flex items-center gap-2 mb-3"><Mail size={16} /> {team.members?.length || 0} membros</span>
                
                {/* Lista de Membros */}
                {team.members && team.members.length > 0 && (
                  <div className="flex-col gap-2 mb-4">
                    {team.members.map(email => (
                      <div key={email} className="flex justify-between items-center bg-gray-800/50 p-2 rounded text-sm text-gray-300">
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</span>
                        <X size={14} className="cursor-pointer" color="var(--danger)" onClick={() => handleRemoveMember(team.id, email)} />
                      </div>
                    ))}
                  </div>
                )}

                {activeTeamInvite === team.id ? (
                  <div className="flex gap-2">
                    <select
                      className="flex-1 p-2 rounded text-sm" 
                      style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)' }}
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                    >
                      <option value="" disabled>Selecione um usuário...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.email}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                    <button className="btn btn-primary" style={{ padding: '0.5rem' }} onClick={() => handleAddMember(team.id)}><Plus size={16} /></button>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => setActiveTeamInvite(null)}><X size={16} /></button>
                  </div>
                ) : (
                  <button className="btn btn-secondary w-full" onClick={() => setActiveTeamInvite(team.id)}>Adicionar Membro</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nova Equipe */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form className="glass-panel p-8 flex-col gap-4" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-secondary)', position: 'relative' }} onSubmit={handleCreateTeam}>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h2>Nova Equipe</h2>
            <div>
              <label className="text-sm text-muted mb-2 block">Nome da Equipe</label>
              <input required autoFocus value={newTeamName} onChange={e => setNewTeamName(e.target.value)} type="text" className="w-full p-3 rounded" style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label className="text-sm text-muted mb-2 block">Descrição (Opcional)</label>
              <textarea value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} rows={3} className="w-full p-3 rounded" style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)' }} />
            </div>
            <div className="flex gap-4 mt-4">
              <button type="button" className="btn btn-secondary flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn flex-1">Criar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
