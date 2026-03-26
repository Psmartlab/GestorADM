import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Briefcase, BarChart3, AlertCircle, PlayCircle } from 'lucide-react';

export default function ProjectDashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubProjects(); unsubTasks(); };
  }, []);

  const today = new Date();
  today.setHours(0,0,0,0);

  // Aggregations
  const activeProjects = projects.filter(p => p.status === 'Active' || p.status === 'Ativo').length;
  const overdueTasks = tasks.filter(t => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < today).length;

  // Project progress table
  const projectProgress = projects.map(proj => {
    const projTasks = tasks.filter(t => t.projectId === proj.name || t.projectId === proj.id);
    const done = projTasks.filter(t => t.status === 'DONE').length;
    const total = projTasks.length;
    const overdue = projTasks.filter(t => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < today).length;
    const progress = total ? Math.round((done / total) * 100) : 0;

    return { ...proj, done, total, overdue, progress };
  }).sort((a, b) => b.progress - a.progress);

  return (
    <div className="animate-in pb-12">
      <header className="mb-10">
        <h2 className="text-3xl font-black text-slate-950 font-headline tracking-tighter uppercase italic flex items-center gap-4">
          <Briefcase size={32} className="text-slate-950" />
          Project Radar
        </h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 opacity-60">Visão consolidada do progresso, prazos e marcos dos projetos.</p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-[24px] shadow-sm border-2 border-slate-300 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-slate-950 group-hover:text-white transition-all">
              <Briefcase size={20} />
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-slate-300 italic">Portfolio</span>
          </div>
          <p className="text-4xl font-black text-slate-950 tracking-tighter leading-none">{projects.length}</p>
          <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Total de Projetos</h3>
        </div>

        <div className="bg-white p-6 rounded-[24px] shadow-sm border-2 border-slate-300 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <PlayCircle size={20} />
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-emerald-200 italic">Core</span>
          </div>
          <p className="text-4xl font-black text-slate-950 tracking-tighter leading-none">{activeProjects}</p>
          <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Projetos Ativos</h3>
        </div>

        <div className="bg-white p-6 rounded-[24px] shadow-sm border-2 border-slate-300 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-all">
              <BarChart3 size={20} />
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-blue-200 italic">Métrica</span>
          </div>
          <p className="text-4xl font-black text-slate-950 tracking-tighter leading-none">
            {projects.length ? Math.round(projectProgress.reduce((acc, curr) => acc + curr.progress, 0) / projects.length) : 0}%
          </p>
          <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Média de Progresso</h3>
        </div>

        <div className="bg-red-50 p-6 rounded-[24px] shadow-sm border-2 border-red-100 hover:shadow-md transition-all group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2 bg-red-600 rounded-xl text-white">
              <AlertCircle size={20} />
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-red-300 italic">Risco</span>
          </div>
          <p className="text-4xl font-black text-red-700 tracking-tighter leading-none relative z-10">{overdueTasks}</p>
          <h3 className="text-red-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 relative z-10">Tarefas em Atraso</h3>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-red-950">
             <span className="material-symbols-outlined text-9xl">warning</span>
          </div>
        </div>
      </section>

      {/* Progress Table */}
      <section className="bg-white rounded-[24px] shadow-sm border-2 border-slate-300 overflow-hidden mb-12">
        <div className="p-8 border-b-2 border-slate-100 bg-slate-50/30">
          <h2 className="text-2xl font-black text-slate-950 font-headline tracking-tighter uppercase italic">Saúde dos Projetos</h2>
          <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-[0.2em] mt-1">Acompanhamento de OEE e tarefas por projeto</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-100 italic">
                <th className="px-8 py-5">Projeto</th>
                <th className="px-8 py-5">Equipe Responsável</th>
                <th className="px-8 py-5">Alertas</th>
                <th className="px-8 py-5">Progresso Geral</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectProgress.map(proj => (
                <tr key={proj.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <span className="font-black text-slate-950 block tracking-tight uppercase italic">{proj.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                      {proj.status === 'Active' || proj.status === 'Ativo' ? 'Em andamento' : proj.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">{proj.teamId || '-'}</span>
                  </td>
                  <td className="px-8 py-6">
                    {proj.overdue > 0 ? (
                      <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">
                        {proj.overdue} Atrasadas
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">Normal</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2 w-full max-w-[200px]">
                      <div className="flex justify-between items-end">
                        <span className="text-[11px] font-black text-slate-950">{proj.progress}%</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{proj.done}/{proj.total} TAREFAS</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${proj.progress === 100 ? 'bg-emerald-500' : proj.progress < 30 ? 'bg-red-500' : 'bg-slate-950'}`} 
                          style={{ width: `${proj.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {projectProgress.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px] italic">
                    Nenhum projeto encontrado ou dados indisponíveis.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
