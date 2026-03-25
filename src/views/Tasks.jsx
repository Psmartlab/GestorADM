import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Plus, Clock, AlertCircle, Edit2, Trash2, ArrowRight, ArrowLeft, Loader2, X, Calendar, User, FileText } from 'lucide-react';
import { logAction } from '../utils/audit';

const STATUS_COLUMNS = [
  { id: 'TODO', title: 'A Fazer', color: 'var(--text-primary)' },
  { id: 'IN_PROGRESS', title: 'Em Andamento', color: 'var(--warning)' },
  { id: 'DONE', title: 'Concluído', color: 'var(--success)' }
];

export default function Tasks({ user }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Media', status: 'TODO', startDate: '', dueDate: '', assignee: '', teamId: '' });
  const [loading, setLoading] = useState(true);

  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const qTasks = query(collection(db, 'tasks'));
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      const taskData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(taskData);
      setLoading(false);
      setErrorMsg(null);
    }, (error) => {
      console.error("Firestore Error:", error);
      setErrorMsg("Erro de permissão ou conexão: " + error.message);
      setLoading(false);
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubscribeTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
      setTeams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribeTasks();
      unsubscribeUsers();
      unsubscribeTeams();
    };
  }, []);

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    // Fecha a janela imediatamente
    setIsModalOpen(false);

    addDoc(collection(db, 'tasks'), {
      ...newTask,
      created_by: auth.currentUser.uid,
      created_at: serverTimestamp(),
    }).then(() => {
      logAction(auth.currentUser.email, 'CREATE', 'TASK', `Criou a tarefa "${newTask.title}"`);
    }).catch(error => {
      console.error("Error adding document: ", error);
      alert("Erro ao criar tarefa: " + error.message);
    });

    setNewTask({ title: '', description: '', priority: 'Media', status: 'TODO', startDate: '', dueDate: '', assignee: '', teamId: '' });
  };

  const updateTaskStatus = async (taskId, newStatus, taskTitle) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { status: newStatus });
      logAction(auth.currentUser.email, 'UPDATE', 'TASK', `Moveu a tarefa "${taskTitle}" para ${newStatus}`);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const deleteTask = async (taskId, taskTitle) => {
    if (window.confirm("Certeza que deseja excluir esta tarefa?")) {
      await deleteDoc(doc(db, 'tasks', taskId));
      logAction(auth.currentUser.email, 'DELETE', 'TASK', `Excluiu a tarefa "${taskTitle}"`);
    }
  };

  if (loading && !errorMsg) return (
    <div className="flex items-center justify-center w-full h-full gap-2">
      <Loader2 className="animate-spin" size={24} color="var(--accent-primary)" /> Carregando tarefas...
    </div>
  );

  return (
    <div className="flex-col gap-6" style={{ height: '100%' }}>
      {errorMsg && (
        <div style={{ color: 'var(--danger)', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid var(--danger)' }}>
          <AlertCircle size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          {errorMsg}
        </div>
      )}
      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
        <h1>Painel Kanban de Tarefas</h1>
        <button className="btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Nova Tarefa
        </button>
      </div>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 160px)', overflowX: 'auto' }}>
        {STATUS_COLUMNS.map(column => (
          <div key={column.id} className="glass-panel flex-1 flex-col" style={{ minWidth: '300px', padding: '1rem', background: 'rgba(30, 41, 59, 0.4)' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1rem', color: column.color, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: column.color }}></div>
              {column.title} <span className="text-muted text-sm ml-auto">({tasks.filter(t => t.status === column.id).length})</span>
            </h3>

            <div className="flex-col gap-3" style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
              {tasks.filter(task => task.status === column.id).map(task => (
                <div key={task.id} className="glass-panel" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div className="flex justify-between items-start" style={{ marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', wordBreak: 'break-word' }}>{task.title}</h4>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '12px', background: task.priority === 'Alta' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: task.priority === 'Alta' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {task.priority || 'Normal'}
                    </span>
                  </div>
                  
                  {task.description && <p className="text-muted text-sm" style={{ marginBottom: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{task.description}</p>}
                  
                  <div className="flex-col gap-2 mb-3 text-xs text-muted">
                    {(task.startDate || task.dueDate) && (
                      <div className="flex items-center gap-1" style={{ color: (task.status !== 'DONE' && task.dueDate && new Date(task.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)) ? 'var(--danger)' : 'inherit' }}>
                        <Calendar size={12} /> 
                        {task.startDate ? new Date(task.startDate).toLocaleDateString() : '—'} 
                        {' até '} 
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                      </div>
                    )}
                    {task.assignee && <div className="flex items-center gap-1"><User size={12} /> {task.assignee}</div>}
                  </div>

                  <div className="flex justify-between items-center" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button className="btn btn-secondary text-sm" onClick={() => deleteTask(task.id, task.title)} style={{ padding: '0.3rem 0.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }} title="Excluir">
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="flex gap-2">
                      {column.id !== 'TODO' && (
                        <button className="btn btn-secondary" onClick={() => updateTaskStatus(task.id, column.id === 'DONE' ? 'IN_PROGRESS' : 'TODO', task.title)} style={{ padding: '0.4rem', borderRadius: '50%' }} title="Mover para Esquerda">
                          <ArrowLeft size={16} />
                        </button>
                      )}
                      {column.id !== 'DONE' && (
                        <button className="btn btn-secondary" onClick={() => updateTaskStatus(task.id, column.id === 'TODO' ? 'IN_PROGRESS' : 'DONE', task.title)} style={{ padding: '0.4rem', borderRadius: '50%' }} title="Mover para Direita">
                          <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel p-8" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.2)', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h2>Nova Tarefa</h2>
            <form onSubmit={handleCreateTask} className="flex-col gap-4" style={{ marginTop: '1.5rem' }}>
              <div>
                <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Título</label>
                <input required autoFocus type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
              </div>
              
              <div>
                <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Descrição</label>
                <textarea rows={4} value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white', resize: 'vertical' }} />
              </div>
              
              <div className="flex gap-4">
                <div style={{ flex: 1 }}>
                  <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Data Inicial</label>
                  <input type="date" value={newTask.startDate} onChange={e => setNewTask({...newTask, startDate: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#0f172a', color: 'white' }} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Data Final</label>
                  <input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#0f172a', color: 'white' }} />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Equipe</label>
                <select value={newTask.teamId} onChange={e => setNewTask({...newTask, teamId: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#0f172a', color: 'white' }}>
                  <option value="">Nenhuma Equipe</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Responsável</label>
                <select value={newTask.assignee} onChange={e => setNewTask({...newTask, assignee: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#0f172a', color: 'white' }}>
                  <option value="">Nenhum (Livre)</option>
                  {users.filter(u => {
                    if (user?.role === 'Admin') return true;
                    // Se gerente, vê apenas sua equipe
                    if (user?.role === 'Gerente') {
                       return u.teamIds?.includes(user?.teamId) || u.teamId === user?.teamId;
                    }
                    return u.email === auth.currentUser.email;
                  }).map(u => (
                    <option key={u.id} value={u.email}>{u.name || u.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Prioridade</label>
                <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#0f172a', color: 'white' }}>
                  <option value="Baixa">Baixa</option>
                  <option value="Media">Média</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>

              <div className="flex gap-4 justify-between" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary w-full" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn w-full">Criar Tarefa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
