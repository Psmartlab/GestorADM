import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const SeedData = () => {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [log, setLog] = useState([]);

  const addLog = (msg) => setLog(prev => [...prev, msg]);

  const handleSeed = async () => {
    setStatus('loading');
    setLog([]);
    try {
      addLog("Iniciando semeadura de dados...");

      // 1. Equipes
      const teams = [
        { id: 'eng-team', name: 'Engineering', description: 'Desenvolvimento e Infraestrutura' },
        { id: 'design-team', name: 'Design', description: 'UI/UX e Identidade Visual' },
        { id: 'marketing-team', name: 'Marketing', description: 'Crescimento e Conteúdo' }
      ];

      for (const t of teams) {
        await setDoc(doc(db, 'teams', t.id), {
          name: t.name,
          description: t.description,
          createdAt: serverTimestamp()
        });
        addLog(`Equipe ${t.name} criada.`);
      }

      // 2. Usuários
      const users = [
        { id: 'user-smartlab', name: 'Smart Lab (Admin)', email: 'propostas.smartlab@gmail.com', role: 'Admin', teamIds: ['eng-team', 'design-team'] },
        { id: 'user-manager', name: 'Marcos Gerente', email: 'marcos@test.com', role: 'Manager', teamIds: ['eng-team'] },
        { id: 'user-dev1', name: 'Ana Dev', email: 'ana@test.com', role: 'User', teamIds: ['design-team'] },
        { id: 'user-dev2', name: 'Bruno Backend', email: 'bruno@test.com', role: 'User', teamIds: ['eng-team'] },
        { id: 'user-marketing', name: 'Clara Mkt', email: 'clara@test.com', role: 'User', teamIds: ['marketing-team'] }
      ];

      for (const u of users) {
        await setDoc(doc(db, 'users', u.id), {
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: serverTimestamp()
        });
        addLog(`Usuário ${u.name} criado.`);
      }

      // 3. Projetos
      const projects = [
        { id: 'proj-gestor', name: 'GestorADM', status: 'Active', members: ['user-manager', 'user-dev1'] },
        { id: 'proj-x', name: 'Projeto X (Inovação)', status: 'Planning', members: ['user-manager', 'user-dev2'] }
      ];

      for (const p of projects) {
        await setDoc(doc(db, 'projects', p.id), {
          name: p.name,
          status: p.status,
          members: p.members,
          createdAt: serverTimestamp()
        });
        addLog(`Projeto ${p.name} criado.`);
      }

      // 4. Tarefas
      const tasks = [
        { title: 'Refatorar Login', status: 'In Progress', priority: 'High', team: 'eng-team', assignee: 'user-dev1' },
        { title: 'Criar Landing Page', status: 'Done', priority: 'Medium', team: 'design-team', assignee: 'user-dev1' },
        { title: 'Configurar DB', status: 'Backlog', priority: 'High', team: 'eng-team', assignee: 'user-dev2' },
        { title: 'Campanha Social', status: 'To Do', priority: 'Low', team: 'marketing-team', assignee: 'user-manager' },
        { title: 'Ajustar Cores', status: 'In Progress', priority: 'Medium', team: 'design-team', assignee: 'user-dev1' }
      ];

      for (const t of tasks) {
        await addDoc(collection(db, 'tasks'), {
          ...t,
          createdAt: serverTimestamp()
        });
        addLog(`Tarefa "${t.title}" criada.`);
      }

      // 5. Check-ins
      const checkins = [
        { userName: 'Ana Dev', mood: 'Happy', accomplishment: 'Finalizei o CSS do dashboard', teamwork: 'Discuti com Bruno sobre o back', date: new Date().toISOString() },
        { userName: 'Bruno Backend', mood: 'Productive', accomplishment: 'Indices do Firestore configurados', teamwork: 'Ajudei a Ana no front', date: new Date().toISOString() }
      ];

      for (const c of checkins) {
        await addDoc(collection(db, 'checkins'), {
          ...c,
          timestamp: serverTimestamp()
        });
        addLog(`Check-in de ${c.userName} criado.`);
      }

      setStatus('success');
      addLog("Sucesso! Todos os dados foram semeados.");
    } catch (error) {
      console.error(error);
      setStatus('error');
      addLog(`Erro: ${error.message}`);
    }
  };

  return (
    <div className="flex-col items-center justify-center p-8 gap-6" style={{ minHeight: '80vh', display: 'flex' }}>
      <div className="glass-panel p-8 w-full max-w-lg flex-col gap-4">
        <div className="flex items-center gap-3 mb-4">
          <Database size={32} color="var(--accent-primary)" />
          <h2 style={{ margin: 0 }}>Gerador de Dados de Exemplo</h2>
        </div>
        
        <p className="text-muted">
          Este utilitário irá criar Equipes, Usuários, Projetos e Tarefas fictícias no seu Firestore para que você possa visualizar o Dashboard completo.
        </p>

        <button 
          className="btn btn-primary w-full justify-center p-4" 
          onClick={handleSeed}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? <Loader2 className="animate-spin" /> : <Database size={18} />}
          {status === 'loading' ? 'Semeando...' : 'Semear Banco de Dados'}
        </button>

        {status !== 'idle' && (
          <div className={`p-4 rounded-lg mt-4 flex-col gap-2 ${status === 'error' ? 'bg-danger-light' : 'bg-success-light'}`} style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
            {log.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                {status === 'success' && i === log.length - 1 ? <CheckCircle size={14} color="var(--success)" /> : null}
                {item}
              </div>
            ))}
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-2 text-success mt-2">
            <CheckCircle size={18} />
            <span>Dados carregados com sucesso! Vá para o Dashboard.</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-danger mt-2">
            <AlertCircle size={18} />
            <span>Ocorreu um erro ao carregar os dados. Verifique o console.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeedData;
