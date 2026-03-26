import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import TeamDashboard from './TeamDashboard';
import ProjectDashboard from './ProjectDashboard';
import UserDashboard from './UserDashboard';

const Dashboard = ({ user }) => {
  const [currentTab, setCurrentTab] = useState('geral');
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [expandedKpi, setExpandedKpi] = useState(null);
  
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.email === 'henrique@smartlab.com.br';

  useEffect(() => {
    // Escuta tarefas em tempo real
    const qTasks = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      const t = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(t);
    }, (err) => console.error("Erro ao buscar tarefas:", err));

    // Escuta projetos em tempo real
    const qProjects = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubProjects = onSnapshot(qProjects, (snap) => {
      const p = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(p);
    }, (err) => console.error("Erro ao buscar projetos:", err));

    return () => {
      unsubTasks();
      unsubProjects();
    };
  }, []);

  const todoTasks = tasks.filter(t => t.status === 'TODO');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const underReviewTasks = tasks.filter(t => t.status === 'UNDER_REVIEW');
  const doneTasks = tasks.filter(t => t.status === 'DONE');
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'DONE') return false;
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  });

  const handleKpiClick = (status) => {
    setExpandedKpi(expandedKpi === status ? null : status);
  };

  const renderExpandedList = () => {
    if (!expandedKpi) return null;
    let list = [];
    if (expandedKpi === 'TODO') list = todoTasks;
    if (expandedKpi === 'IN_PROGRESS') list = inProgressTasks;
    if (expandedKpi === 'UNDER_REVIEW') list = underReviewTasks;
    if (expandedKpi === 'DONE') list = doneTasks;
    if (expandedKpi === 'OVERDUE') list = overdueTasks;

    const getKpiTitle = () => {
      switch(expandedKpi) {
        case 'TODO': return 'Tarefas Pendentes';
        case 'IN_PROGRESS': return 'Em Andamento';
        case 'UNDER_REVIEW': return 'Em Avaliação';
        case 'DONE': return 'Concluídas';
        case 'OVERDUE': return 'Atrasadas';
        default: return '';
      }
    };

    return (
      <div className="mb-8 p-6 bg-slate-50 rounded-xl border-2 border-slate-200 animate-in fade-in zoom-in duration-300 shadow-inner">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline font-bold text-lg text-slate-800 uppercase tracking-tight">
            Detalhes: {getKpiTitle()}
          </h3>
          <button onClick={() => setExpandedKpi(null)} className="text-slate-400 hover:text-slate-900 transition-colors">
            <span className="material-symbols-outlined font-black">close</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.length === 0 ? (
            <p className="text-slate-400 text-sm italic col-span-full">Nenhuma tarefa encontrada neste status.</p>
          ) : list.map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-slate-200/60 hover:border-slate-300 transition-colors">
              <span className="font-medium text-slate-700 truncate mr-2" title={t.title}>{t.title}</span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md shrink-0 uppercase tracking-tighter border border-slate-100">{t.projectName || 'Geral'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGeral = () => (
    <>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div onClick={() => handleKpiClick('TODO')} className={`bg-white p-6 rounded-[24px] shadow-sm border-2 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${expandedKpi === 'TODO' ? 'border-slate-800 ring-4 ring-slate-800/5' : 'border-slate-300'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-xl transition-colors ${expandedKpi === 'TODO' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
              <span className="material-symbols-outlined">list_alt</span>
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Pendente</span>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{todoTasks.length}</p>
            <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">A Fazer</h3>
          </div>
        </div>

        <div onClick={() => handleKpiClick('IN_PROGRESS')} className={`bg-white p-6 rounded-[24px] shadow-sm border-2 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${expandedKpi === 'IN_PROGRESS' ? 'border-yellow-500 ring-4 ring-yellow-500/5' : 'border-slate-300'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-xl transition-colors ${expandedKpi === 'IN_PROGRESS' ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-600 group-hover:bg-yellow-100'}`}>
              <span className="material-symbols-outlined">pending</span>
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-yellow-600/50">Fluxo</span>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{inProgressTasks.length}</p>
            <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Em Andamento</h3>
          </div>
        </div>

        <div onClick={() => handleKpiClick('UNDER_REVIEW')} className={`bg-white p-6 rounded-[24px] shadow-sm border-2 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${expandedKpi === 'UNDER_REVIEW' ? 'border-blue-500 ring-4 ring-blue-500/5' : 'border-slate-300'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-xl transition-colors ${expandedKpi === 'UNDER_REVIEW' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>
              <span className="material-symbols-outlined">rate_review</span>
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-blue-600/50">Revisão</span>
          </div>
          <div>
            <p className="text-4xl font-black text-blue-900 tracking-tighter leading-none">{underReviewTasks.length}</p>
            <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Em Avaliação</h3>
          </div>
        </div>

        <div onClick={() => handleKpiClick('DONE')} className={`bg-white p-6 rounded-[24px] shadow-sm border-2 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${expandedKpi === 'DONE' ? 'border-emerald-500 ring-4 ring-emerald-500/5' : 'border-slate-300'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-xl transition-colors ${expandedKpi === 'DONE' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'}`}>
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-emerald-600/50">Fim</span>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{doneTasks.length}</p>
            <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Concluídas</h3>
          </div>
        </div>

        <div onClick={() => handleKpiClick('OVERDUE')} className={`bg-white p-6 rounded-[24px] shadow-sm border-2 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${expandedKpi === 'OVERDUE' ? 'border-red-600 ring-4 ring-red-600/5' : 'border-slate-300'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-xl transition-colors ${expandedKpi === 'OVERDUE' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 group-hover:bg-red-100'}`}>
              <span className="material-symbols-outlined">error</span>
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-red-600/50">Alerta</span>
          </div>
          <div>
            <p className="text-4xl font-black text-red-700 tracking-tighter leading-none">{overdueTasks.length}</p>
            <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Atrasadas</h3>
          </div>
        </div>
      </section>

      {renderExpandedList()}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 bg-white p-8 rounded-[24px] shadow-sm border-2 border-slate-300 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-950 font-headline tracking-tighter uppercase italic">Fluxo de Produtividade</h2>
              <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-[0.2em] mt-1">Análise de Rendimento Operacional</p>
            </div>
            <select className="bg-slate-50 border-2 border-slate-200 rounded-xl font-black text-[10px] py-2.5 px-5 focus:border-slate-800 outline-none uppercase tracking-widest text-slate-500 transition-all">
              <option>Esta Semana</option>
              <option>Última Semana</option>
            </select>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-3 sm:gap-6 mt-auto border-b border-slate-100 pb-2 pt-8 min-h-[250px]">
            {[
              {"day": "SEG", "height": "40%", "active": false},
              {"day": "TER", "height": "65%", "active": false},
              {"day": "QUA", "height": "85%", "active": true},
              {"day": "QUI", "height": "50%", "active": false},
              {"day": "SEX", "height": "75%", "active": false},
              {"day": "SÁB", "height": "30%", "active": false}
            ].map((bar) => (
              <div key={bar.day} className="flex flex-col items-center gap-3 flex-1 justify-end group">
                <div 
                  className={`w-full max-w-16 rounded-t-lg transition-all duration-500 cursor-pointer ${bar.active ? 'bg-slate-950 shadow-[0_0_20px_rgba(0,0,0,0.1)]' : 'bg-slate-200 hover:bg-slate-300'}`}
                  style={{ height: bar.height }}
                ></div>
                <span className={`text-[10px] font-black tracking-tighter ${bar.active ? 'text-slate-950' : 'text-slate-400'}`}>{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-[24px] shadow-2xl relative overflow-hidden flex flex-col justify-between border-2 border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.03] rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-6 font-headline tracking-tighter uppercase italic">Ações Rápidas</h2>
            <div className="space-y-4">
              <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white text-white hover:text-slate-900 rounded-xl transition-all border-2 border-white/10 group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-inherit">person_add</span>
                  <span className="font-black text-[10px] uppercase tracking-[0.2em]">Convidar Membro</span>
                </div>
                <span className="material-symbols-outlined text-inherit opacity-30 group-hover:opacity-100 transition-all">chevron_right</span>
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white text-white hover:text-slate-900 rounded-xl transition-all border-2 border-white/10 group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-inherit">rocket_launch</span>
                  <span className="font-black text-[10px] uppercase tracking-[0.2em]">Lançar Projeto</span>
                </div>
                <span className="material-symbols-outlined text-inherit opacity-30 group-hover:opacity-100 transition-all">chevron_right</span>
              </button>
            </div>
          </div>
          <div className="relative z-10 mt-8 pt-6 border-t-2 border-white/5">
            <p className="text-white/40 text-[10px] font-black leading-relaxed flex items-center gap-2 uppercase tracking-[0.2em]">
               <span className="material-symbols-outlined text-[16px] animate-pulse">cloud_done</span>
               Sincronizado com SmartCloud
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[24px] shadow-sm border-2 border-slate-300 overflow-hidden mb-12">
        <div className="p-8 border-b-2 border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4 bg-slate-50/30">
          <div>
            <h2 className="text-2xl font-black text-slate-950 font-headline tracking-tighter uppercase italic">Status de Projetos</h2>
            <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-[0.2em] mt-1">Monitoramento de Iniciativas Críticas</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">Projeto</th>
                <th className="px-8 py-5">Líder</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Progresso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-12 text-center text-slate-400 italic font-medium">Nenhum projeto registrado no sistema.</td>
                </tr>
              ) : projects.slice(0, 5).map(proj => (
                <tr key={proj.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <span className="font-bold text-slate-900 block group-hover:text-black transition-colors">{proj.name}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block font-black uppercase tracking-widest">{proj.area || 'Diversos'}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                        {proj.leader?.charAt(0) || 'L'}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{proj.leader || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 text-[9px] font-black rounded border uppercase tracking-widest shadow-sm ${proj.status === 'Crítico' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {proj.status || 'Ativo'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="w-full max-w-[120px] h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${proj.progress > 80 ? 'bg-emerald-500' : proj.progress < 30 ? 'bg-red-500' : 'bg-slate-950'}`} style={{ width: `${proj.progress || 0}%` }}></div>
                    </div>
                    <span className="text-[10px] font-black mt-2 block text-slate-400 uppercase tracking-tighter">{proj.progress || 0}% concluído</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'teams': return <TeamDashboard />;
      case 'projects': return <ProjectDashboard />;
      case 'users': return <UserDashboard />;
      default: return renderGeral();
    }
  };

  return (
    <div className="animate-in pb-12">
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-5xl font-black tracking-tighter text-slate-950 font-headline m-0 uppercase italic leading-none">
            {currentTab === 'geral' ? 'Intelligence Hub' : 
             currentTab === 'teams' ? 'Squad Analytics' :
             currentTab === 'projects' ? 'Project Radar' : 'Access Control'}
          </h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] opacity-60">
            {currentTab === 'geral' ? 'Visão consolidada da operação SmartLab' : 'Métricas granulares por contexto estratégico'}
          </p>
        </div>

        <div className="flex gap-2 p-2 bg-white rounded-2xl border-2 border-slate-300 shadow-sm transition-all">
          {[
            { id: 'geral', label: 'Geral', icon: 'dashboard' },
            { id: 'teams', label: 'Equipes', icon: 'groups' },
            { id: 'projects', label: 'Projetos', icon: 'engineering' },
            { id: 'users', label: 'Usuários', icon: 'manage_accounts' }
          ].filter(tab => {
            if (tab.id === 'users') return isAdmin;
            if (tab.id === 'teams' || tab.id === 'projects') return isAdmin || user?.role === 'Gerente';
            return true;
          }).map(tab => (
            <button 
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${currentTab === tab.id ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'}`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default Dashboard;
