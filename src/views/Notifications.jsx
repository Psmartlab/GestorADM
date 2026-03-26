import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Bell, AlertTriangle, TrendingUp, Mail, Calendar, CheckCircle, Search, Filter, FileText, Send } from 'lucide-react';

export default function Notifications({ user }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    overdueCount: 0,
    performanceReport: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Basic data fetching for report generation
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(taskList);
      
      // Calculate stats
      const today = new Date();
      today.setHours(0,0,0,0);
      const overdue = taskList.filter(t => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < today);
      
      setStats(prev => ({ ...prev, overdueCount: overdue.length }));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => { unsubTasks(); unsubUsers(); };
  }, []);

  const generateReport = () => {
    // Simple report logic: users with most tasks and status
    const report = users.map(u => {
      const userTasks = tasks.filter(t => t.assignee === u.name || t.userId === u.id);
      const done = userTasks.filter(t => t.status === 'DONE').length;
      const total = userTasks.length;
      const perf = total > 0 ? Math.round((done / total) * 100) : 0;
      return { name: u.name, done, total, perf };
    }).sort((a, b) => b.perf - a.perf);

    setStats(prev => ({ ...prev, performanceReport: report }));
    alert("Relatórios de desempenho gerados com sucesso!");
  };

  const sendAlerts = () => {
    alert("Mensagens de alerta enviadas para responsáveis por tarefas atrasadas.");
  };

  if (user?.role !== 'Admin' && user?.role !== 'admin') {
    return (
      <div className="flex-col items-center justify-center h-full gap-4">
        <AlertTriangle size={48} color="var(--danger)" />
        <h2>Acesso Negado</h2>
        <p>Apenas administradores podem acessar a Central de Notificações.</p>
      </div>
    );
  }

  return (
    <div className="flex-col gap-6" style={{ height: '100%', padding: '2rem' }}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Bell size={32} color="var(--accent-primary)" />
          <h1>Central de Notificações</h1>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => alert("Configuração de alertas automáticos atualizada.")}>
            <Filter size={18} /> Configurações
          </button>
          <button className="btn btn-primary" onClick={generateReport}>
            <FileText size={18} /> Gerar Relatórios
          </button>
        </div>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Alertas Ativos */}
        <div className="glass-panel p-6 flex-col gap-4">
          <h3 className="flex items-center gap-2 text-warning"><AlertTriangle size={20} /> Alertas de Atraso</h3>
          <div className="flex-col gap-3">
            <div className="p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>{stats.overdueCount}</div>
              <div className="text-sm text-muted">Tarefas em atraso detectadas</div>
            </div>
            <button className="btn btn-secondary w-full justify-center" onClick={sendAlerts}>
              <Send size={16} /> Notificar Responsáveis
            </button>
          </div>
        </div>

        {/* Lembretes de Reuniões */}
        <div className="glass-panel p-6 flex-col gap-4">
          <h3 className="flex items-center gap-2 text-info"><Calendar size={20} /> Próximos Compromissos</h3>
          <div className="flex-col gap-2">
            <div className="p-3 text-sm rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <strong>Reunião de Alinhamento</strong> - Amanhã às 10:00
            </div>
            <div className="p-3 text-sm rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <strong>Review de Sprints</strong> - Sexta-feira às 14:00
            </div>
            <button className="btn btn-secondary w-full justify-center mt-2" onClick={() => alert("Lembretes agendados para todos os membros.")}>
               Enviar Lembretes
            </button>
          </div>
        </div>
      </div>

      {stats.performanceReport.length > 0 && (
        <div className="glass-panel p-6 flex-col gap-4 mt-4">
          <h3 className="flex items-center gap-2"><TrendingUp size={20} color="var(--success)" /> Desempenho da Equipe</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th className="p-2 text-xs text-muted uppercase">Membro</th>
                  <th className="p-2 text-xs text-muted uppercase">Concluídas</th>
                  <th className="p-2 text-xs text-muted uppercase">Total</th>
                  <th className="p-2 text-xs text-muted uppercase text-right">Aproveitamento</th>
                </tr>
              </thead>
              <tbody>
                {stats.performanceReport.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td className="p-3 font-medium">{r.name}</td>
                    <td className="p-3">{r.done}</td>
                    <td className="p-3">{r.total}</td>
                    <td className="p-3 text-right">
                      <span className={`p-1 px-2 rounded-full text-xs ${r.perf > 70 ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}>
                        {r.perf}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Mensagens Padrão */}
      <div className="glass-panel p-6 flex-col gap-4">
        <h3 className="flex items-center gap-2"><Mail size={20} /> Mensagens de Período</h3>
        <p className="text-sm text-muted">Configurar envio de feedback automático quinzenal para as equipes.</p>
        <div className="flex gap-4 items-center">
          <select className="btn btn-secondary" style={{ flex: 1 }}>
            <option>Relatório Quinzenal</option>
            <option>Feedback Mensal</option>
            <option>Lembrete de Metas</option>
          </select>
          <button className="btn btn-primary" onClick={() => alert("Campanha de mensagens iniciada.")}>
             Disparar Agora
          </button>
        </div>
      </div>
    </div>
  );
}
