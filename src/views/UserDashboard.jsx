import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserCheck, PieChart, BadgeCheck, Timer } from 'lucide-react';

export default function UserDashboard() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubUsers(); unsubTasks(); };
  }, []);

  // Use the email or name to match assignee for users
  const userPerformance = users.map(u => {
    // some tasks might match by user.name or user.email
    const userTasks = tasks.filter(t => t.assignee === u.name || t.assignee === u.email);
    const done = userTasks.filter(t => t.status === 'DONE').length;
    const underReview = userTasks.filter(t => t.status === 'UNDER_REVIEW').length;
    const inProgress = userTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const total = userTasks.length;
    
    return { ...u, done, underReview, inProgress, total };
  }).sort((a, b) => b.done - a.done);

  const activeAssignees = new Set(tasks.map(t => t.assignee).filter(Boolean)).size;
  const totalCompleted = tasks.filter(t => t.status === 'DONE').length;
  
  return (
    <div className="animate-in pb-12">
      <header className="mb-10">
        <h2 className="text-3xl font-black text-slate-950 font-headline tracking-tighter uppercase italic flex items-center gap-4">
          <UserCheck size={32} className="text-slate-950" />
          Access Control
        </h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 opacity-60">Visão consolidada da assiduidade e performance individual.</p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-[24px] shadow-sm border-2 border-slate-300 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-slate-950 group-hover:text-white transition-all">
              <UserCheck size={20} />
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-slate-300 italic">Rede</span>
          </div>
          <p className="text-4xl font-black text-slate-950 tracking-tighter leading-none">{users.length}</p>
          <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Total de Usuários</h3>
        </div>

        <div className="bg-white p-6 rounded-[24px] shadow-sm border-2 border-slate-300 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <Timer size={20} />
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-emerald-200 italic">Fluxo</span>
          </div>
          <p className="text-4xl font-black text-slate-950 tracking-tighter leading-none">{activeAssignees}</p>
          <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Trabalhando Ativamente</h3>
        </div>

        <div className="bg-white p-6 rounded-[24px] shadow-sm border-2 border-slate-300 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-all">
              <BadgeCheck size={20} />
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-blue-200 italic">Entrega</span>
          </div>
          <p className="text-4xl font-black text-slate-950 tracking-tighter leading-none">{totalCompleted}</p>
          <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Tarefas Entregues</h3>
        </div>

        <div className="bg-white p-6 rounded-[24px] shadow-sm border-2 border-slate-300 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
              <PieChart size={20} />
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-amber-200 italic">OEE</span>
          </div>
          <p className="text-4xl font-black text-slate-950 tracking-tighter leading-none">
            {users.length && tasks.length ? Math.round((activeAssignees / users.length) * 100) : 0}%
          </p>
          <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Engajamento Médio</h3>
        </div>
      </section>

      {/* Hero Table */}
      <section className="bg-white rounded-[24px] shadow-sm border-2 border-slate-300 overflow-hidden mb-12">
        <div className="p-8 border-b-2 border-slate-100 bg-slate-50/30 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-950 font-headline tracking-tighter uppercase italic">Top Performance Individual</h2>
            <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-[0.2em] mt-1">Ranking de produtividade da equipe</p>
          </div>
          <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center text-white shadow-lg">
            <BadgeCheck size={24} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-100 italic">
                <th className="px-8 py-5">Usuário / Cargo</th>
                <th className="px-8 py-5 text-center">Entregues</th>
                <th className="px-8 py-5 text-center">Em Avaliação</th>
                <th className="px-8 py-5 text-center">Em Andamento</th>
                <th className="px-8 py-5 text-center">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {userPerformance.map((user, index) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xs border-2 transition-all ${index === 0 ? 'bg-slate-950 text-white border-slate-200 scale-110 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      {index === 0 ? <BadgeCheck size={20} /> : user.name?.charAt(0) || user.email?.charAt(0)}
                    </div>
                    <div>
                      <span className="font-black text-slate-950 block tracking-tight uppercase italic">{user.name || user.email}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">{user.role || 'Membro'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-lg font-black font-headline text-emerald-600">{user.done}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-lg font-black font-headline text-blue-600">{user.underReview}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-lg font-black font-headline text-slate-400">{user.inProgress}</span>
                  </td>
                   <td className="px-8 py-6 text-center">
                    <span className="text-xl font-black font-headline text-slate-900 border-b-2 border-slate-900 pb-1">{user.total}</span>
                  </td>
                </tr>
              ))}
              {userPerformance.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px] italic">
                    Nenhum usuário encontrado ou dados indisponíveis.
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
