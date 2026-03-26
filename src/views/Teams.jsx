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
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-950 font-headline m-0 uppercase italic">Gestão de Equipes</h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest opacity-60">Organize seus departamentos e colaboradores</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 shadow-lg active:scale-95" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={18} /> Nova Equipe
        </button>
      </div>

      {errorMsg && (
        <div style={{ color: 'var(--danger)', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
          <AlertCircle size={20} className="inline mr-2" /> {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {teams.length === 0 ? (
          <div className="col-span-full text-center p-16 bg-white rounded-[24px] border-2 border-slate-300 border-dashed">
            <UserPlus size={48} className="mx-auto mb-4 text-slate-200" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhuma equipe criada ainda.</p>
          </div>
        ) : (
          teams.map(team => (
            <div key={team.id} className="bg-white rounded-[24px] p-8 border-2 border-slate-300 shadow-sm flex flex-col gap-6 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-slate-950 font-headline tracking-tighter uppercase italic group-hover:text-slate-700 transition-colors">{team.name}</h3>
                  <p className="text-slate-400 font-bold text-xs mt-1 leading-relaxed line-clamp-2">{team.description || 'Sem descrição'}</p>
                </div>
                <button className="p-2 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all" onClick={() => deleteTeam(team.id)} title="Excluir Equipe">
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="mt-auto pt-6 border-t-2 border-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Mail size={14} /> {team.members?.length || 0} Membros
                  </span>
                </div>
                
                {/* Lista de Membros */}
                {team.members && team.members.length > 0 && (
                  <div className="flex flex-col gap-2 mb-6">
                    {team.members.map(email => (
                      <div key={email} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border-2 border-slate-100 text-[11px] font-bold text-slate-600">
                        <span className="truncate pr-4 italic">{email}</span>
                        <button onClick={() => handleRemoveMember(team.id, email)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {activeTeamInvite === team.id ? (
                  <div className="flex flex-col gap-2">
                    <select
                      className="w-full bg-slate-950 text-white p-3 rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-0 appearance-none cursor-pointer" 
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                    >
                      <option value="" disabled>Selecionar Usuário</option>
                      {users.map(u => (
                        <option key={u.id} value={u.email} className="font-bold">{u.name || u.email}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-slate-900 text-white p-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all" onClick={() => handleAddMember(team.id)}>Confirmar</button>
                      <button className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-all" onClick={() => setActiveTeamInvite(null)}><X size={16} /></button>
                    </div>
                  </div>
                ) : (
                  <button className="w-full py-4 bg-slate-50 text-slate-900 border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-slate-300 hover:bg-white transition-all shadow-sm" onClick={() => setActiveTeamInvite(team.id)}>Vincular Membro</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nova Equipe */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <form className="bg-white rounded-[32px] p-10 border-2 border-slate-300 shadow-2xl w-full max-w-[440px] relative animate-in fade-in zoom-in duration-300" onSubmit={handleCreateTeam}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-slate-950 font-headline tracking-tighter uppercase italic mb-8">Nova Equipe</h2>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Nome da Unidade</label>
                <input required autoFocus value={newTeamName} onChange={e => setNewTeamName(e.target.value)} type="text" className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 font-bold text-slate-800 focus:border-slate-800 outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Missão / Descrição</label>
                <textarea value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} rows={3} className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 font-bold text-slate-800 focus:border-slate-800 outline-none transition-all resize-none" />
              </div>
              <div className="flex gap-4 mt-4">
                <button type="button" className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all" onClick={() => setIsModalOpen(false)}>Descartar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95">Criar Unidade</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
