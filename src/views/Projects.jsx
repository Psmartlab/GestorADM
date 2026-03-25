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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="mb-1">Projetos</h1>
          <p className="text-muted">Gerencie os projetos e suas equipes vinculadas</p>
        </div>
        <button className="btn" onClick={() => { setIsEditing(true); setCurrentProject({ name: '', description: '', teamIds: [], userIds: [] }); }}>
          <Plus size={20} /> Novo Projeto
        </button>
      </div>

      {isEditing && (
        <div className="glass-panel p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3>{currentProject.id ? 'Editar Projeto' : 'Novo Projeto'}</h3>
            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}><X size={20} /></button>
          </div>
          <form onSubmit={handleSave} className="flex-col gap-6">
            <div className="flex-col gap-2">
              <label>Nome do Projeto</label>
              <input 
                className="btn btn-secondary w-full" 
                style={{ textAlign: 'left', cursor: 'text' }}
                value={currentProject.name}
                onChange={e => setCurrentProject({ ...currentProject, name: e.target.value })}
                placeholder="Ex: Refatoração do App"
              />
            </div>
            <div className="flex-col gap-2">
              <label>Descrição</label>
              <textarea 
                className="btn btn-secondary w-full" 
                style={{ textAlign: 'left', cursor: 'text', minHeight: '100px' }}
                value={currentProject.description}
                onChange={e => setCurrentProject({ ...currentProject, description: e.target.value })}
                placeholder="Detalhes do projeto..."
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="mb-4 flex items-center gap-2"><Users size={18} /> Equipes com Acesso</h4>
                <div className="flex-col gap-2 overflow-y-auto" style={{ maxHeight: '200px' }}>
                  {teams.map(team => (
                    <label key={team.id} className="flex items-center gap-3 p-3 glass-panel cursor-pointer hover:bg-white/5 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={currentProject.teamIds.includes(team.id)} 
                        onChange={() => toggleTeam(team.id)}
                      />
                      <span>{team.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-4 flex items-center gap-2"><Users size={18} /> Usuários Adicionais</h4>
                <div className="flex-col gap-2 overflow-y-auto" style={{ maxHeight: '200px' }}>
                  {allUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-3 p-3 glass-panel cursor-pointer hover:bg-white/5 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={currentProject.userIds.includes(u.id)} 
                        onChange={() => toggleUser(u.id)}
                      />
                      <span>{u.name || u.email}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" className="btn w-full p-4 mt-4">
              <Check size={20} /> Salvar Projeto
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project.id} className="glass-panel p-6 flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="mb-1">{project.name}</h3>
                <p className="text-sm line-clamp-2">{project.description}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-secondary p-2" onClick={() => { setIsEditing(true); setCurrentProject(project); }}>
                  <Edit2 size={16} />
                </button>
                <button className="btn btn-secondary p-2" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(project.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Users size={16} /> {project.teamIds?.length || 0} Equipes
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <FolderOpen size={16} /> {project.userIds?.length || 0} Usuários
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
