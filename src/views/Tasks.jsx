import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Plus, Clock, AlertTriangle, AlertCircle, Edit2, Trash2, ArrowRight, ArrowLeft, Loader2, X, Calendar, User, FileText, Pencil, BellRing } from 'lucide-react';
import { logAction } from '../utils/audit';

const STATUS_COLUMNS = [
  { id: 'TODO', title: 'A Fazer', color: '#000000', dotClass: 'bg-black', borderClass: 'border-l-black', cardClass: 'bg-white border-2 border-slate-300 border-l-[6px] border-l-black shadow-sm' },
  { id: 'IN_PROGRESS', title: 'Em Andamento', color: '#eab308', dotClass: 'bg-yellow-400', borderClass: 'border-l-yellow-400', cardClass: 'bg-white border-2 border-slate-300 border-l-[6px] border-l-yellow-400 shadow-sm z-10' },
  { id: 'UNDER_REVIEW', title: 'Em Avaliação', color: '#3b82f6', dotClass: 'bg-blue-500', borderClass: 'border-l-blue-500', cardClass: 'bg-white border-2 border-slate-300 border-l-[6px] border-l-blue-500 shadow-sm' },
  { id: 'DONE', title: 'Concluído', color: '#10b981', dotClass: 'bg-emerald-500', borderClass: 'border-l-emerald-500', cardClass: 'bg-white border-2 border-slate-300 border-l-[6px] border-l-emerald-500 shadow-sm opacity-95 text-emerald-900 font-medium' }
];

export default function Tasks({ user }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null); // null = criar, {} = editar
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

    const unsubscribeProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      setProjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubscribeTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
      setTeams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribeTasks();
      unsubscribeUsers();
      unsubscribeTeams();
      unsubscribeProjects();
    };
  }, []);

  const openCreateModal = (initialStatus = 'TODO') => {
    setCurrentTask(null);
    
    // Tenta encontrar o projeto do usuário para pré-preencher
    const userProjectIds = user?.projectIds || [];
    const defaultProjectId = userProjectIds.length === 1 ? userProjectIds[0] : '';

    setNewTask({ 
      title: '', 
      description: '', 
      priority: 'Media', 
      status: initialStatus, 
      startDate: new Date().toISOString().split('T')[0], 
      dueDate: '', 
      assignee: user?.email || '', 
      teamId: '',
      projectId: defaultProjectId
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setCurrentTask(task);
    setNewTask({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'Media',
      status: task.status || 'TODO',
      startDate: task.startDate || '',
      dueDate: task.dueDate || '',
      assignee: task.assignee || '',
      teamId: task.teamId || '',
    });
    setIsModalOpen(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    setIsModalOpen(false);

    if (currentTask?.id) {
      // EDITAR tarefa existente
      try {
        const taskRef = doc(db, 'tasks', currentTask.id);
        await updateDoc(taskRef, newTask);
        logAction(auth.currentUser.email, 'UPDATE', 'TASK', `Editou a tarefa "${newTask.title}"`);
        alert('Tarefa atualizada com sucesso!');
      } catch (error) {
        console.error('Erro ao editar tarefa:', error);
        alert('Erro ao editar: ' + error.message);
      }
      setCurrentTask(null);
      setNewTask({ title: '', description: '', priority: 'Media', status: 'TODO', startDate: '', dueDate: '', assignee: '', teamId: '' });
      return;
    }

    if (!newTask.assignee) {
      alert("Por favor, atribua a tarefa a um usuário.");
      return;
    }

    addDoc(collection(db, 'tasks'), {
      ...newTask,
      created_by: auth.currentUser.uid,
      created_at: serverTimestamp(),
    }).then(() => {
      logAction(auth.currentUser.email, 'CREATE', 'TASK', `Criou a tarefa "${newTask.title}"`);
      alert("Tarefa criada com sucesso!");
    }).catch(error => {
      console.error("Error adding document: ", error);
      alert("Erro ao criar tarefa: " + error.message);
    });

    setNewTask({ title: '', description: '', priority: 'Media', status: 'TODO', startDate: '', dueDate: '', assignee: '', teamId: '' });
  };

  const updateTaskStatus = async (taskId, newStatus, taskTitle, currentAssignee) => {
    try {
      const isManager = user?.role === 'Admin' || user?.role === 'Gerente' || user?.role === 'Manager';
      
      let finalStatus = newStatus;
      let updatePayload = { status: finalStatus };

      // Regra: se não for gerente e tentar concluir, vai para avaliação
      if (newStatus === 'DONE' && !isManager) {
        finalStatus = 'UNDER_REVIEW';
        updatePayload.status = 'UNDER_REVIEW';
        alert("Enviado para avaliação do gerente!");
      }

      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, updatePayload);
      logAction(auth.currentUser.email, 'UPDATE', 'TASK', `Moveu a tarefa "${taskTitle}" para ${finalStatus}`);
      
      if (finalStatus !== newStatus) {
        // Notificar gerente (simplificado: log ou console por enquanto, ou add a doc in notifications)
      }

      alert("Status da tarefa atualizado!");
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const handleReviewAction = async (task, action) => {
    const isManager = user?.role === 'Admin' || user?.role === 'Gerente' || user?.role === 'Manager';
    if (!isManager) return alert("Apenas gerentes podem avaliar tarefas.");

    if (action === 'approve') {
      await updateDoc(doc(db, 'tasks', task.id), { 
        status: 'DONE', 
        rejectionNote: '',
        isValidated: true 
      });
      logAction(auth.currentUser.email, 'APPROVE', 'TASK', `Validou a tarefa "${task.title}"`);
    } else {
      const note = prompt("Motivo da não validação:");
      if (note === null) return; // cancelou o prompt

      await updateDoc(doc(db, 'tasks', task.id), { 
        status: 'IN_PROGRESS', 
        rejectionNote: note,
        isValidated: false 
      });

      // Notificação para o usuário
      if (task.assignee) {
        await addDoc(collection(db, 'notifications'), {
          to: task.assignee,
          from: auth.currentUser.email,
          title: 'Tarefa Não Validada',
          message: `A tarefa "${task.title}" foi devolvida pelo gerente. Motivo: ${note}`,
          type: 'warning',
          read: false,
          createdAt: serverTimestamp()
        });
      }

      logAction(auth.currentUser.email, 'REJECT', 'TASK', `Rejeitou a tarefa "${task.title}": ${note}`);
    }
    alert(action === 'approve' ? "Tarefa validada e concluída!" : "Tarefa devolvida para em andamento.");
  };

  const deleteTask = async (taskId, taskTitle) => {
    if (window.confirm("Certeza que deseja excluir esta tarefa?")) {
      await deleteDoc(doc(db, 'tasks', taskId));
      logAction(auth.currentUser.email, 'DELETE', 'TASK', `Excluiu a tarefa "${taskTitle}"`);
      alert("Tarefa excluída!");
    }
  };

  if (loading && !errorMsg) return (
    <div className="flex items-center justify-center w-full h-full gap-2 text-on-surface-variant font-body">
      <Loader2 className="animate-spin text-primary" size={24} /> Carregando tarefas...
    </div>
  );

  return (
    <div className="flex flex-col gap-6 h-full font-body">
      {errorMsg && (
        <div className="text-error bg-error-container/30 p-4 rounded-xl border border-error/50 flex items-center gap-2 shadow-sm font-medium">
          <AlertCircle size={20} />
          {errorMsg}
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-2">
        <div className="space-y-2">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface m-0">Painel Kanban de Tarefas</h1>
          <p className="text-on-surface-variant font-medium m-0">Acompanhamento visual de atividades com alto contraste.</p>
        </div>
        <button 
          className="bg-gradient-to-br from-primary-container to-primary text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 shadow-md active:scale-95 transition-all w-fit" 
          onClick={() => openCreateModal()}
        >
          <Plus size={20} /> Nova Tarefa
        </button>
      </div>

      <div className="flex gap-6 h-[calc(100vh-220px)] overflow-x-auto pb-4 snap-x pr-4 after:content-[''] after:w-4 after:shrink-0">
        {STATUS_COLUMNS.map(column => (
          <div key={column.id} className="flex-1 flex flex-col rounded-2xl border-2 border-slate-300 bg-slate-200/60 backdrop-blur-xl snap-start shrink-0 relative overflow-hidden" style={{ minWidth: '320px' }}>
            <div className="px-5 py-4 border-b-2 border-slate-300 bg-white sticky top-0 z-20 flex items-center justify-between shadow-sm">
              <h3 className="font-headline font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 text-slate-500 m-0">
                <span className={`w-3 h-3 rounded-full ${column.dotClass}`}></span>
                {column.title}
                <span className="ml-2 text-slate-400 text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300">
                   {tasks.filter(t => t.status === column.id).length}
                </span>
              </h3>
              <button 
                onClick={() => openCreateModal(column.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                title={`Adicionar em ${column.title}`}
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="flex-col gap-4 p-5 flex-1 overflow-y-auto">
              {tasks.filter(task => task.status === column.id).map(task => {
                const isOverdue = task.status !== 'DONE' && task.dueDate && new Date(task.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
                const cardBgClass = isOverdue ? 'bg-red-600 text-white border-red-700 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : column.cardClass;

                return (() => {
                  const today = new Date(); today.setHours(0,0,0,0);
                  const due = task.dueDate ? new Date(task.dueDate) : null;
                  if (due) due.setHours(0,0,0,0);
                  const daysLeft = due ? Math.round((due - today) / (1000 * 60 * 60 * 24)) : null;

                  return (
                  <div key={task.id} className={`p-5 rounded-xl flex flex-col gap-3 transition-transform hover:-translate-y-1 hover:shadow-lg duration-200 relative cursor-pointer ${cardBgClass}`}>
                    {isOverdue && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/20 px-2 py-1 rounded text-[10px] font-black uppercase text-white animate-pulse">
                        <BellRing size={14} fill="white" /> ATRASADO
                      </div>
                    )}

                    {/* Bloco de datas — topo direito */}
                    <div className={`absolute top-2 right-2 flex flex-col items-end gap-0.5 text-[10px] font-bold leading-tight rounded-lg px-2 py-1.5 ${isOverdue ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <span>📅 {task.startDate ? new Date(task.startDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'}</span>
                      <span>🏁 {task.dueDate ? new Date(task.dueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'}</span>
                      {daysLeft !== null && task.status !== 'DONE' && (
                        <span className={`font-black mt-0.5 ${isOverdue ? 'text-white' : daysLeft <= 2 ? 'text-red-600' : daysLeft <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {isOverdue ? `${Math.abs(daysLeft)}d atraso` : daysLeft === 0 ? 'Hoje!' : `${daysLeft}d restam`}
                        </span>
                      )}
                    </div>
                    

                    <div className={`flex justify-between items-start mb-1 ${(task.startDate || task.dueDate) ? 'pr-20' : 'pr-2'} ${isOverdue ? 'pt-5' : ''}`}>
                      <h4 className={`m-0 font-extrabold text-sm tracking-tight leading-tight ${column.id === 'DONE' ? 'line-through opacity-70' : ''}`} style={{ wordBreak: 'break-word' }}>
                        {task.title}
                      </h4>
                      {!isOverdue && task.priority !== 'Normal' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black whitespace-nowrap uppercase tracking-wider ${task.priority === 'Alta' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {task.priority || 'Normal'}
                        </span>
                      )}
                    </div>
                    
                    {task.description && (
                       <p className={`text-xs m-0 italic ${isOverdue ? 'text-red-100' : 'text-slate-500'}`} style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                         {task.description}
                       </p>
                    )}

                    {task.rejectionNote && task.status === 'IN_PROGRESS' && (
                       <div className="bg-red-50 p-2 rounded border border-red-200 text-red-700 text-[11px] font-bold animate-pulse">
                         🚨 REJEITADA: {task.rejectionNote}
                       </div>
                    )}

                    <div className={`flex items-center gap-1.5 text-xs font-bold mt-1 ${isOverdue ? 'text-white' : 'text-slate-500'}`}>
                      {task.assignee && <><User size={13} strokeWidth={3} className={isOverdue ? 'text-white' : 'text-primary'}/> {task.assignee}</>}
                    </div>

                    <div className={`flex justify-between items-center mt-auto pt-3 border-t ${isOverdue ? 'border-red-500/50' : 'border-slate-100'}`}>
                      <div className="flex gap-2">
                         <button className={`p-2 rounded-lg transition-all ${isOverdue ? 'bg-white/20 text-white hover:bg-white' : 'bg-slate-100 text-slate-500 hover:text-primary hover:bg-primary/10'}`} onClick={(e) => { e.stopPropagation(); deleteTask(task.id, task.title); }} title="Excluir">
                           <Trash2 size={16} />
                         </button>
                         <button className={`p-2 rounded-lg transition-all ${isOverdue ? 'bg-white/20 text-white hover:bg-white' : 'bg-slate-100 text-slate-500 hover:text-primary hover:bg-primary/10'}`} onClick={(e) => { e.stopPropagation(); openEditModal(task); }} title="Editar">
                           <Pencil size={16} />
                         </button>
                      </div>
                      
                      <div className="flex gap-1.5">
                        {/* Manager validation buttons */}
                        {task.status === 'UNDER_REVIEW' && (user?.role === 'Admin' || user?.role === 'Gerente' || user?.role === 'Manager') && (
                          <div className="flex gap-1 mr-2 px-2 border-r border-slate-200">
                             <button className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-all font-bold text-xs flex items-center gap-1" onClick={(e) => { e.stopPropagation(); handleReviewAction(task, 'approve'); }}>
                               ✓ Validar
                             </button>
                             <button className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-all font-bold text-xs flex items-center gap-1" onClick={(e) => { e.stopPropagation(); handleReviewAction(task, 'reject'); }}>
                               ✗ Rejeitar
                             </button>
                          </div>
                        )}

                        {column.id !== 'TODO' && column.id !== 'DONE' && (
                          <button className={`p-2 rounded-lg border border-transparent transition-all shadow-sm ${isOverdue ? 'bg-white/20 text-white hover:bg-white' : 'bg-white text-slate-400 hover:text-primary hover:border-primary'}`} onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, column.id === 'IN_PROGRESS' ? 'TODO' : 'IN_PROGRESS', task.title); }} title="Mover para Esquerda">
                            <ArrowLeft size={16} strokeWidth={3} />
                          </button>
                        )}
                        {column.id !== 'DONE' && column.id !== 'UNDER_REVIEW' && (
                          <button className={`p-2 rounded-lg border border-transparent transition-all shadow-sm ${isOverdue ? 'bg-white/20 text-white hover:bg-white' : 'bg-white text-slate-400 hover:text-primary hover:border-primary'}`} onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, column.id === 'TODO' ? 'IN_PROGRESS' : 'DONE', task.title); }} title="Mover para Direita">
                            <ArrowRight size={16} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })();
              })}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-2xl p-8 w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-outline-variant/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-container to-primary"></div>
            
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors">
              <X size={20} />
            </button>
            <h2 className="font-headline font-extrabold text-2xl mb-6 text-on-surface">{currentTask?.id ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
            
            <form onSubmit={handleCreateTask} className="flex flex-col gap-5 text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Título da Tarefa</label>
                <input required autoFocus type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-medium" placeholder="Ex: Relatório Semestral" />
              </div>
              
              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Descrição Detalhada</label>
                <textarea rows={3} value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface resize-y" placeholder="Adicione notas, links e contexto..." />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="font-bold text-on-surface-variant text-xs uppercase tracking-wider flex items-center gap-1.5">📅 Data de Início</label>
                  <input
                    type="date"
                    value={newTask.startDate}
                    onChange={e => setNewTask({...newTask, startDate: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-semibold cursor-pointer"
                  />
                </div>
                
                <div className="flex-1 space-y-1.5">
                  <label className="font-bold text-on-surface-variant text-xs uppercase tracking-wider flex items-center gap-1.5">📅 Data de Prazo</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-semibold cursor-pointer"
                  />
                  {newTask.dueDate && new Date(newTask.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && (
                    <p className="text-red-500 text-[11px] font-bold flex items-center gap-1">⚠️ Prazo no passado — tarefa ficará ATRASADA</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Equipe Responsável</label>
                  <select value={newTask.teamId} onChange={e => setNewTask({...newTask, teamId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-medium">
                    <option value="">Nenhuma Equipe</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Atribuído a *</label>
                  <select required value={newTask.assignee} onChange={e => setNewTask({...newTask, assignee: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary transition-all text-on-surface font-medium">
                    <option value="" disabled>Selecionar Responsável...</option>
                    {users.filter(u => {
                      if (user?.role === 'Admin') return true;
                      if (user?.role === 'Gerente') return u.teamIds?.includes(user?.teamId) || u.teamId === user?.teamId;
                      return u.email === (user?.email || auth.currentUser?.email);
                    }).map(u => (
                      <option key={u.id} value={u.email}>{u.name || u.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Prioridade de SLA</label>
                <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-medium">
                  <option value="Baixa">Baixa (Rotina)</option>
                  <option value="Media">Média (Padrão)</option>
                  <option value="Alta">Alta (Crítica)</option>
                </select>
              </div>

              <div className="flex gap-4 justify-end mt-4 pt-4 border-t border-outline-variant/30">
                <button type="button" className="px-6 py-3 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold shadow-md hover:brightness-110 active:scale-95 transition-all">
                  {currentTask?.id ? 'Salvar Alterações' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
