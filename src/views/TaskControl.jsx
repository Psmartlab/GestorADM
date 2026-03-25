import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, User, LayoutGrid, List, ChevronRight, ChevronDown, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const STATUS_COLUMNS = [
  { id: 'TODO', title: 'A Fazer', color: 'var(--text-primary)' },
  { id: 'IN_PROGRESS', title: 'Em Andamento', color: 'var(--warning)' },
  { id: 'DONE', title: 'Concluído', color: 'var(--success)' }
];

export default function TaskControl() {
  const [viewMode, setViewMode] = useState('team'); // 'team' or 'user'
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null); // null for new, {id, ...} for edit
  const [editingTaskData, setEditingTaskData] = useState({ title: '', description: '', priority: 'Media', status: 'TODO', assignee: '', teamId: '' });

  useEffect(() => {
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
      setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => { unsubTasks(); unsubTeams(); unsubUsers(); };
  }, []);

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      if (currentTask?.id) {
        await updateDoc(doc(db, 'tasks', currentTask.id), editingTaskData);
      } else {
        await addDoc(collection(db, 'tasks'), {
          ...editingTaskData,
          created_at: new Date()
        });
      }
      setIsModalOpen(false);
    } catch (e) { alert(e.message); }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm("Excluir tarefa?")) {
      await deleteDoc(doc(db, 'tasks', id));
    }
  };

  const openModal = (task = null, defaults = {}) => {
    setCurrentTask(task);
    setEditingTaskData(task ? { ...task } : { title: '', description: '', priority: 'Media', status: 'TODO', assignee: '', teamId: '', ...defaults });
    setIsModalOpen(true);
  };

  const renderTaskCard = (task) => (
    <div key={task.id} className="glass-panel group" style={{ 
      padding: '0.5rem', 
      fontSize: '0.8rem', 
      background: 'rgba(255,255,255,0.03)', 
      borderLeft: `3px solid ${task.priority === 'Alta' ? 'var(--danger)' : 'rgba(255,255,255,0.1)'}`,
      position: 'relative'
    }}>
      <div className="flex justify-between items-start gap-2">
        <div style={{ fontWeight: 500, marginBottom: '0.2rem', flex: 1 }}>{task.title}</div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => openModal(task)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--accent-primary)' }}><Clock size={12} /></button>
          <button onClick={() => handleDeleteTask(task.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--danger)' }}><X size={12} /></button>
        </div>
      </div>
      <div className="flex justify-between items-center text-xs text-muted">
        <span>{task.assignee ? task.assignee.split('@')[0] : 'Livre'}</span>
        {task.priority === 'Alta' && <AlertTriangle size={10} color="var(--danger)" />}
      </div>
    </div>
  );

  const swimlanes = viewMode === 'team' ? teams : users.filter(u => u.name !== 'Aguardando Login');

  return (
    <div className="flex-col gap-6" style={{ height: '100%' }}>
      <header className="flex justify-between items-center">
        <div>
          <h1>Controle de Tarefas</h1>
          <p className="text-muted">Visão administrativa por {viewMode === 'team' ? 'equipes' : 'usuários'}</p>
        </div>
        <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
          <button 
            className={`btn btn-sm ${viewMode === 'team' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('team')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <Users size={16} /> Por Equipes
          </button>
          <button 
            className={`btn btn-sm ${viewMode === 'user' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('user')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <User size={16} /> Por Usuários
          </button>
        </div>
      </header>

      <div className="flex-col gap-4" style={{ overflowY: 'auto', flex: 1, paddingBottom: '2rem' }}>
        {swimlanes.map(item => {
          const isExpanded = expandedRows[item.id] !== false; // Default expanded
          const itemTasks = viewMode === 'team' 
            ? tasks.filter(t => t.teamId === item.id)
            : tasks.filter(t => t.assignee === item.email);

          return (
            <div key={item.id} className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div 
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5" 
                onClick={() => toggleRow(item.id)}
                style={{ background: 'rgba(0,0,0,0.2)', borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none' }}
              >
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                {viewMode === 'team' ? <Users size={20} color="var(--accent-primary)" /> : <User size={20} color="var(--accent-primary)" />}
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.name || item.email}</h3>
                <span className="text-sm text-muted">({itemTasks.length} tarefas)</span>
              </div>

              {isExpanded && (
                <div className="flex gap-4 p-4" style={{ overflowX: 'auto', minHeight: '150px' }}>
                  {STATUS_COLUMNS.map(col => (
                    <div key={col.id} className="flex-1 min-w-[200px] flex-col gap-2">
                      <div className="text-xs text-muted mb-2 uppercase tracking-wide flex items-center gap-2">
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }}></div>
                        {col.title} ({itemTasks.filter(t => t.status === col.id).length})
                      </div>
                      <div className="flex-col gap-2">
                        {itemTasks.filter(t => t.status === col.id).map(renderTaskCard)}
                        {itemTasks.filter(t => t.status === col.id).length === 0 && (
                          <div className="text-gray-600 text-[0.7rem] italic border border-dashed border-gray-700/30 rounded p-2">Sem tarefas</div>
                        )}
                        <button 
                          className="btn btn-secondary w-full p-2 text-xs border-dashed" 
                          style={{ background: 'transparent', borderStyle: 'dashed' }}
                          onClick={() => openModal(null, { 
                            status: col.id, 
                            teamId: viewMode === 'team' ? item.id : '',
                            assignee: viewMode === 'user' ? item.email : ''
                          })}
                        >
                          + Adicionar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {swimlanes.length === 0 && (
          <div className="glass-panel p-12 text-center text-muted">
            Nenhuma tarefa encontrada para os critérios atuais.
          </div>
        )}
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form className="glass-panel p-8 flex-col gap-4" style={{ width: '100%', maxWidth: '450px', backgroundColor: 'var(--bg-secondary)', position: 'relative' }} onSubmit={handleSaveTask}>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
            <h2>{currentTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
            
            <div className="mt-4">
              <label className="text-sm text-muted mb-2 block">Título</label>
              <input required value={editingTaskData.title} onChange={e => setEditingTaskData({...editingTaskData, title: e.target.value})} className="w-full p-3 rounded" style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)' }} />
            </div>

            <div>
              <label className="text-sm text-muted mb-2 block">Equipe</label>
              <select value={editingTaskData.teamId} onChange={e => setEditingTaskData({...editingTaskData, teamId: e.target.value})} className="w-full p-3 rounded" style={{ background: '#0f172a', color: 'white', border: '1px solid var(--border-color)' }}>
                <option value="">Sem Equipe</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm text-muted mb-2 block">Responsável</label>
              <select value={editingTaskData.assignee} onChange={e => setEditingTaskData({...editingTaskData, assignee: e.target.value})} className="w-full p-3 rounded" style={{ background: '#0f172a', color: 'white', border: '1px solid var(--border-color)' }}>
                <option value="">Livre</option>
                {users.map(u => <option key={u.id} value={u.email}>{u.name || u.email}</option>)}
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm text-muted mb-2 block">Status</label>
                <select value={editingTaskData.status} onChange={e => setEditingTaskData({...editingTaskData, status: e.target.value})} className="w-full p-3 rounded" style={{ background: '#0f172a', color: 'white', border: '1px solid var(--border-color)' }}>
                  {STATUS_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm text-muted mb-2 block">Prioridade</label>
                <select value={editingTaskData.priority} onChange={e => setEditingTaskData({...editingTaskData, priority: e.target.value})} className="w-full p-3 rounded" style={{ background: '#0f172a', color: 'white', border: '1px solid var(--border-color)' }}>
                  <option value="Baixa">Baixa</option>
                  <option value="Media">Média</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn w-full p-4 mt-4">Salvar Alterações</button>
          </form>
        </div>
      )}
    </div>
  );
}
