import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Users, FolderOpen, X, Check } from 'lucide-react';

const Projects = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState({ name: '', description: '', teamIds: [], userIds: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Timeout de segurança para o loading (modo demo sem Firestore)
    const timer = setTimeout(() => setLoading(false), 4000);

    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0)));
        setLoading(false);
        clearTimeout(timer);
      },
      (_err) => { setLoading(false); clearTimeout(timer); }
    );

    const unsubscribeTeams = onSnapshot(collection(db, 'teams'),
      (snapshot) => setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      () => {}
    );

    const unsubscribeUsers = onSnapshot(collection(db, 'users'),
      (snapshot) => setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      () => {}
    );

    return () => {
      clearTimeout(timer);
      unsubscribe();
      unsubscribeTeams();
      unsubscribeUsers();
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentProject.name) return;

    try {
      if (currentProject.id) {
        await updateDoc(doc(db, 'projects', currentProject.id), {
          ...currentProject,
          updatedAt: new Date()
        });
      } else {
        await addDoc(collection(db, 'projects'), {
          ...currentProject,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      setIsEditing(false);
      setCurrentProject({ name: '', description: '', teamIds: [], userIds: [] });
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este projeto?")) {
      await deleteDoc(doc(db, 'projects', id));
    }
  };

  const toggleTeam = (teamId) => {
    const newTeamIds = currentProject.teamIds.includes(teamId)
      ? currentProject.teamIds.filter(id => id !== teamId)
      : [...currentProject.teamIds, teamId];
    setCurrentProject({ ...currentProject, teamIds: newTeamIds });
  };

  const toggleUser = (userId) => {
    const newUserIds = currentProject.userIds.includes(userId)
      ? currentProject.userIds.filter(id => id !== userId)
      : [...currentProject.userIds, userId];
    setCurrentProject({ ...currentProject, userIds: newUserIds });
  };

  if (loading) return <div className="p-8">Carregando projetos...</div>;

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-950 font-headline m-0 uppercase italic">Projetos</h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest opacity-60">Gerencie os projetos e suas equipes vinculadas</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 shadow-lg active:scale-95" onClick={() => { setIsEditing(true); setCurrentProject({ name: '', description: '', teamIds: [], userIds: [] }); }}>
          <Plus size={18} /> Novo Projeto
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-8 rounded-[24px] border-2 border-slate-300 shadow-sm mb-12">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-950 font-headline tracking-tighter uppercase italic">{currentProject.id ? 'Editar Projeto' : 'Novo Projeto'}</h3>
            <button className="p-2 text-slate-400 hover:text-slate-900 border-2 border-slate-100 rounded-xl transition-all" onClick={() => setIsEditing(false)}><X size={20} /></button>
          </div>
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Nome do Projeto</label>
                <input 
                  className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 font-bold text-slate-800 focus:border-slate-800 outline-none transition-all" 
                  value={currentProject.name}
                  onChange={e => setCurrentProject({ ...currentProject, name: e.target.value })}
                  placeholder="Ex: Refatoração do App"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Descrição Curta</label>
                <input 
                  className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 font-bold text-slate-800 focus:border-slate-800 outline-none transition-all" 
                  value={currentProject.description}
                  onChange={e => setCurrentProject({ ...currentProject, description: e.target.value })}
                  placeholder="Uma breve descrição..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                   <Users size={16} /> Vincular Equipes
                </h4>
                <div className="flex flex-col gap-2 overflow-y-auto pr-2" style={{ maxHeight: '200px' }}>
                  {teams.map(team => (
                    <label key={team.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border-2 border-slate-100 cursor-pointer hover:border-slate-300 transition-all select-none">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-2 border-slate-300 text-slate-900 focus:ring-slate-900"
                        checked={(currentProject.teamIds || []).includes(team.id)} 
                        onChange={() => toggleTeam(team.id)}
                      />
                      <span className="font-bold text-slate-700">{team.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                   <Users size={16} /> Especialistas
                </h4>
                <div className="flex flex-col gap-2 overflow-y-auto pr-2" style={{ maxHeight: '200px' }}>
                  {allUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border-2 border-slate-100 cursor-pointer hover:border-slate-300 transition-all select-none">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-2 border-slate-300 text-slate-900 focus:ring-slate-900"
                        checked={(currentProject.userIds || []).includes(u.id)} 
                        onChange={() => toggleUser(u.id)}
                      />
                      <span className="font-bold text-slate-700">{u.name || u.email}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-slate-950 text-white p-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3">
              <Check size={20} /> Finalizar Configuração
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map(project => (
          <div key={project.id} className="bg-white rounded-[24px] p-8 border-2 border-slate-300 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1 pr-12">
                <h3 className="text-xl font-black text-slate-950 font-headline tracking-tighter uppercase italic mb-2 group-hover:text-slate-700 transition-colors">{project.name}</h3>
                <p className="text-slate-400 font-bold text-xs line-clamp-2 leading-relaxed">{project.description}</p>
              </div>
              <div className="absolute top-6 right-6 flex gap-2">
                <button className="p-2 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl transition-all" onClick={() => { setIsEditing(true); setCurrentProject(project); }}>
                  <Edit2 size={16} />
                </button>
                <button className="p-2 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all" onClick={() => handleDelete(project.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t-2 border-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                  <Users size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black text-slate-900 leading-none">{project.teamIds?.length || 0}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Equipes</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                  <FolderOpen size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black text-slate-900 leading-none">{project.userIds?.length || 0}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Usuários</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {projects.length === 0 && !isEditing && (
          <div className="col-span-full text-center p-12 glass-panel">
            <FolderOpen size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-muted">Nenhum projeto cadastrado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
