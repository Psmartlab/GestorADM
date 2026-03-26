import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, TrendingUp, Target, Activity } from 'lucide-react';

export default function TeamDashboard() {
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const unsubTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
      setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubTeams(); unsubTasks(); };
  }, []);

  // Aggregations
  const activeTeams = new Set(tasks.map(t => t.teamId).filter(Boolean)).size;
  const avgTasksPerTeam = teams.length ? Math.round(tasks.length / teams.length) : 0;

  // Team performance table
  const teamPerformance = teams.map(team => {
    const teamTasks = tasks.filter(t => t.teamId === team.name || t.teamId === team.id);
    const todo = teamTasks.filter(t => t.status === 'TODO').length;
    const inProgress = teamTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const done = teamTasks.filter(t => t.status === 'DONE').length;
    const total = teamTasks.length;
    const completionRate = total ? Math.round((done / total) * 100) : 0;

    return { ...team, todo, inProgress, done, total, completionRate };
  }).sort((a, b) => b.completionRate - a.completionRate);

  return (
    <div className="animate-in pb-12">
      <header className="mb-10">
        <h2 className="text-3xl font-black text-slate-950 font-headline tracking-tighter uppercase italic flex items-center gap-4">
          <Users size={32} className="text-slate-950" />
          Squad Analytics
        </h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 opacity-60">Visão consolidada do desempenho e alocação das equipes.</p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-[24px] shadow-sm border-2 border-slate-300 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-slate-950 group-hover:text-white transition-all">
              <Users size={20} />
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-slate-300 italic">Estrutura</span>
          </div>
          <p className="text-4xl font-black text-slate-950 tracking-tighter leading-none">{teams.length}</p>
          <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Total de Equipes</h3>
        </div>

        <div className="bg-white p-6 rounded-[24px] shadow-sm border-2 border-slate-300 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <Activity size={20} />
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-emerald-200 italic">Live</span>
          </div>
          <p className="text-4xl font-black text-slate-950 tracking-tighter leading-none">{activeTeams}</p>
          <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Equipes Ativas</h3>
        </div>

        <div className="bg-white p-6 rounded-[24px] shadow-sm border-2 border-slate-300 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-all">
              <Target size={20} />
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-blue-200 italic">Volume</span>
          </div>
          <p className="text-4xl font-black text-slate-950 tracking-tighter leading-none">{tasks.length}</p>
          <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Tarefas Registradas</h3>
        </div>

        <div className="bg-white p-6 rounded-[24px] shadow-sm border-2 border-slate-300 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
              <TrendingUp size={20} />
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-amber-200 italic">Média</span>
          </div>
          <p className="text-4xl font-black text-slate-950 tracking-tighter leading-none">{avgTasksPerTeam}</p>
          <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Tarefas / Equipe</h3>
        </div>
      </section>

      {/* Performance Table */}
      <section className="bg-white rounded-[24px] shadow-sm border-2 border-slate-300 overflow-hidden mb-12">
        <div className="p-8 border-b-2 border-slate-100 bg-slate-50/30">
          <h2 className="text-2xl font-black text-slate-950 font-headline tracking-tighter uppercase italic">Carga de Trabalho por Equipe</h2>
          <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-[0.2em] mt-1">Distribuição de tarefas e velocidade de entrega</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-100 italic">
                <th className="px-8 py-5">Equipe</th>
                <th className="px-8 py-5">A Fazer</th>
                <th className="px-8 py-5">Em Andamento</th>
                <th className="px-8 py-5">Concluídas</th>
                <th className="px-8 py-5">Taxa de Conclusão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamPerformance.map(team => (
                <tr key={team.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <span className="font-black text-slate-950 block tracking-tight uppercase italic">{team.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Membros: {team.members?.length || 0}</span>
                  </td>
                  <td className="px-8 py-6 text-[11px] font-black text-slate-400">{team.todo}</td>
                  <td className="px-8 py-6 text-[11px] font-black text-blue-600">{team.inProgress}</td>
                  <td className="px-8 py-6 text-[11px] font-black text-emerald-600">{team.done}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-full max-w-[120px] h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-950 rounded-full transition-all duration-1000" style={{ width: `${team.completionRate}%` }}></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-950">{team.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {teamPerformance.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px] italic">
                    Nenhuma equipe encontrada ou dados indisponíveis.
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
