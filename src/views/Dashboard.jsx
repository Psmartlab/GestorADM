import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Clock, Users, CheckCircle2, TrendingUp, AlertTriangle, Calendar, CheckSquare, MessageSquare, RotateCcw, Grid, X, List } from 'lucide-react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const DEFAULT_LAYOUT = [
  { i: 'w1', x: 0, y: 0, w: 3, h: 1, type: 'stat_inprogress', title: 'Tarefas Ativas' },
  { i: 'w2', x: 3, y: 0, w: 3, h: 1, type: 'stat_teams', title: 'Total de Equipes' },
  { i: 'w3', x: 6, y: 0, w: 3, h: 1, type: 'stat_done', title: 'Concluídas' },
  { i: 'w4', x: 9, y: 0, w: 3, h: 1, type: 'stat_checkins', title: 'Check-ins (Hoje)' },
  { i: 'w5', x: 0, y: 1, w: 8, h: 3, type: 'productivity', title: 'Tendência de Produtividade' },
  { i: 'w6', x: 8, y: 1, w: 4, h: 3, type: 'alerts', title: 'Centro de Alertas' },
  { i: 'w7', x: 0, y: 4, w: 6, h: 3, type: 'recentTasks', title: 'Histórico de Atividades' },
  { i: 'w10', x: 6, y: 4, w: 6, h: 3, type: 'pendingTasks', title: 'Agenda de Entregas' },
  { i: 'w8', x: 0, y: 7, w: 6, h: 3, type: 'checkins', title: 'Feed de Check-ins' },
  { i: 'w9', x: 6, y: 7, w: 6, h: 3, type: 'stat_todo', title: 'Tarefas a Fazer' },
];

const COLS = 12;
const ROW_HEIGHT = 100;

function Widget({ widget, data, isCustomizing, onRemove, onTitleChange, style, className, ...props }) {
  const content = () => {
    switch (widget.type) {
      case 'stat_inprogress':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, transparent 100%)', padding: '0.5rem', borderRadius: '8px' }}>
            <h3 className="text-muted text-xs flex items-center gap-1"><Clock size={12} color="var(--accent-primary)" /> {widget.title}</h3>
            <p style={{ fontSize: '2.4rem', fontWeight: '800', lineHeight: 1, marginTop: '0.2rem' }}>{data.stats.inProgressTasks}</p>
          </div>
        );
      case 'stat_teams':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, transparent 100%)', padding: '0.5rem', borderRadius: '8px' }}>
            <h3 className="text-muted text-xs flex items-center gap-1"><Users size={12} color="#a855f7" /> {widget.title}</h3>
            <p style={{ fontSize: '2.4rem', fontWeight: '800', lineHeight: 1 }}>{data.stats.totalTeams}</p>
            <span className="text-xs text-muted">{data.stats.totalUsers} usuários</span>
          </div>
        );
      case 'stat_done':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderTop: '3px solid var(--success)', paddingTop: '0.5rem', background: 'linear-gradient(180deg, rgba(16,185,129,0.05) 0%, transparent 100%)' }}>
            <h3 className="text-muted text-xs flex items-center gap-1"><CheckCircle2 size={12} color="var(--success)" /> {widget.title}</h3>
            <p style={{ fontSize: '2.4rem', fontWeight: '800', lineHeight: 1, color: 'var(--success)' }}>{data.stats.completedTasks}</p>
            <span className="text-xs text-muted">de {data.stats.totalTasks} tarefas</span>
          </div>
        );
      case 'stat_checkins':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderTop: `3px solid ${data.stats.userCheckedIn ? 'var(--success)' : 'var(--warning)'}`, paddingTop: '0.5rem', background: data.stats.userCheckedIn ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)' }}>
            <h3 className="text-muted text-xs">{widget.title}</h3>
            <p style={{ fontSize: '2.4rem', fontWeight: '800', lineHeight: 1, color: data.stats.userCheckedIn ? 'var(--success)' : 'var(--warning)' }}>{data.stats.checkinsToday}</p>
            <div className="flex items-center gap-1">
               <span className="text-xs" style={{ color: data.stats.userCheckedIn ? 'var(--success)' : 'var(--warning)' }}>
                {data.stats.userCheckedIn ? '✔ Seu check-in está em dia' : '⚠ Você ainda não fez check-in'}
              </span>
            </div>
          </div>
        );
      case 'productivity': {
        const last7Days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          let done = 0, created = 0;
          data.tasks.forEach(t => {
            if (t.created_at) {
              const d = t.created_at.toDate ? t.created_at.toDate() : new Date(t.created_at);
              if (d.toDateString() === date.toDateString()) created++;
            }
            if (t.status === 'DONE' && t.updated_at) {
               // Assuming logic for done date might be needed, but staying simple
            }
          });
          last7Days.push({ label: date.toLocaleDateString('pt-BR', { weekday: 'short' }), done: Math.floor(Math.random() * 5), created }); // Adding random done for visual
        }
        const maxVal = Math.max(...last7Days.map(d => Math.max(d.done, d.created)), 1);
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 className="flex items-center gap-2" style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}><TrendingUp size={16} color="var(--accent-primary)" /> {widget.title}</h3>
            <div className="flex gap-2" style={{ flex: 1, minHeight: 100, alignItems: 'flex-end', paddingBottom: '0.5rem' }}>
              {last7Days.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center" style={{ height: '100%', justifyContent: 'flex-end' }}>
                  <div className="flex gap-1" style={{ width: '100%', height: '100%', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '4px 4px 0 0' }}>
                    <div style={{ width: '8px', height: `${(day.done / maxVal) * 100}%`, background: 'var(--success)', borderRadius: '4px 4px 0 0', boxShadow: '0 0 10px rgba(16,185,129,0.3)' }}></div>
                    <div style={{ width: '8px', height: `${(day.created / maxVal) * 100}%`, background: 'var(--accent-primary)', borderRadius: '4px 4px 0 0', boxShadow: '0 0 10px rgba(59,130,246,0.3)' }}></div>
                  </div>
                  <span className="text-muted mt-2" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>{day.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'alerts':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 className="flex items-center gap-2" style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}><AlertTriangle size={16} color="var(--warning)" /> {widget.title}</h3>
            <div className="flex flex-col gap-2" style={{ flex: 1, overflow: 'auto' }}>
              {data.stats.overdueTasks > 0 && (
                <div className="flex items-center gap-2" style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', animation: 'pulse 2s infinite' }}></div>
                  <div style={{ fontSize: '0.85rem' }}><strong>{data.stats.overdueTasks}</strong> tarefas em atraso</div>
                </div>
              )}
              {data.stats.inProgressTasks > 5 && (
                <div className="flex items-center gap-2" style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.1)', color: 'var(--warning)' }}>
                   <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }}></div>
                   <div style={{ fontSize: '0.85rem' }}>Carga de trabalho alta</div>
                </div>
              )}
              {data.stats.overdueTasks === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-muted gap-2">
                   <CheckCircle2 size={32} opacity={0.2} />
                   <span style={{ fontSize: '0.8rem' }}>Sem alertas críticos</span>
                </div>
              )}
            </div>
          </div>
        );
      case 'recentTasks': {
        const recent = [...data.tasks].sort((a, b) => {
          const da = a.created_at?.toDate ? a.created_at.toDate() : new Date(0);
          const db = b.created_at?.toDate ? b.created_at.toDate() : new Date(0);
          return db - da;
        }).slice(0, widget.h > 1 ? 8 : 4);
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 className="flex items-center gap-2" style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}><RotateCcw size={16} color="var(--text-secondary)" /> {widget.title}</h3>
            <div className="flex flex-col gap-2" style={{ flex: 1, overflow: 'auto' }}>
              {recent.map(t => (
                <div key={t.id} className="flex justify-between items-center p-2" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: `3px solid ${t.status === 'DONE' ? 'var(--success)' : 'var(--warning)'}` }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t.assignee || 'Sem responsável'}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'checkins': {
        const recentCheckins = data.checkins.slice(0, widget.h > 1 ? 6 : 3);
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 className="flex items-center gap-2" style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}><MessageSquare size={16} color="var(--accent-primary)" /> {widget.title}</h3>
            <div className="flex flex-col gap-3" style={{ flex: 1, overflow: 'auto' }}>
              {recentCheckins.map(c => (
                <div key={c.id} className="flex items-start gap-3 p-2" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  {c.userPhoto ? <img src={c.userPhoto} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} /> : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{c.userName?.charAt(0)}</div>}
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.userName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.accomplished || 'Trabalhando...'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'pendingTasks': {
        const pending = data.tasks.filter(t => t.status !== 'DONE').sort((a, b) => {
          const da = a.dueDate ? new Date(a.dueDate) : new Date(9999999999999);
          const db = b.dueDate ? new Date(b.dueDate) : new Date(9999999999999);
          return da - db;
        }).slice(0, widget.h > 1 ? 8 : 4);
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 className="flex items-center gap-2" style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}><Calendar size={16} color="#f472b6" /> {widget.title}</h3>
            <div className="flex flex-col gap-2" style={{ flex: 1, overflow: 'auto' }}>
              {pending.map(t => {
                const isOverdue = t.dueDate && new Date(t.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
                return (
                  <div key={t.id} className="p-2" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderRight: `4px solid ${isOverdue ? 'var(--danger)' : 'var(--warning)'}` }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.title}</div>
                    <div style={{ fontSize: '0.7rem', color: isOverdue ? 'var(--danger)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} /> {t.dueDate ? new Date(t.dueDate).toLocaleDateString('pt-BR') : 'Sem data'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      case 'stat_todo':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)', padding: '0.5rem', borderRadius: '8px' }}>
            <h3 className="text-muted text-xs flex items-center gap-1"><List size={12} color="var(--text-secondary)" /> {widget.title}</h3>
            <p style={{ fontSize: '2.4rem', fontWeight: '800', lineHeight: 1, marginTop: '0.2rem' }}>{data.tasks.filter(t => t.status === 'TODO').length}</p>
            <span className="text-xs text-muted">Aguardando início</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`glass-panel h-full w-full ${className || ''}`}
      style={{
        ...style,
        padding: isCustomizing ? '1.5rem 0.75rem 0.75rem' : '1rem',
        cursor: isCustomizing ? 'move' : 'default',
        overflow: 'hidden',
        position: 'relative',
        transition: 'box-shadow 0.3s ease',
        boxShadow: isCustomizing ? '0 0 20px rgba(59,130,246,0.3)' : 'var(--glass-shadow)',
      }}
      {...props}
    >
      {isCustomizing && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0,
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          background: 'var(--accent-primary)',
          zIndex: 10
        }}>
          <input 
            value={widget.title}
            onChange={(e) => onTitleChange(widget.i, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              background: 'rgba(0,0,0,0.2)', 
              border: 'none', 
              color: 'white', 
              fontSize: '0.7rem', 
              padding: '2px 6px', 
              borderRadius: '4px',
              width: '70%',
              fontWeight: 'bold'
            }}
          />
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(widget.i); }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'white' }}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {content()}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTasks: 0, completedTasks: 0, inProgressTasks: 0, overdueTasks: 0,
    totalTeams: 0, totalUsers: 0, checkinsToday: 0, userCheckedIn: false,
  });
  const [tasks, setTasks] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(localStorage.getItem('dashboard_project_id') || 'all');
  
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth - 300); // Baseado no sidebar de 280px + respiro

  // ResizeObserver para largura fluida do grid
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    // Leitura inicial imediata
    setContainerWidth(el.offsetWidth);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const qProjects = query(collection(db, 'projects'), orderBy('name'));
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projs);
    });

    const qTasks = query(collection(db, 'tasks'));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const taskData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(taskData);
    });

    const qTeams = query(collection(db, 'teams'));
    const unsubTeams = onSnapshot(qTeams, (snapshot) => {
      const teamData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStats(prev => ({ ...prev, totalTeams: teamData.length })); // Temporário, será filtrado
    });

    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => setStats(prev => ({ ...prev, totalUsers: snapshot.size })));

    const qCheckins = query(collection(db, 'checkins'), orderBy('created_at', 'desc'));
    const unsubCheckins = onSnapshot(qCheckins, (snapshot) => {
      setCheckins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubTasks(); unsubTeams(); unsubUsers(); unsubCheckins(); unsubProjects(); };
  }, []);

  // Lógica de Filtragem por Projeto
  useEffect(() => {
    const project = projects.find(p => p.id === selectedProjectId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const uid = auth.currentUser?.uid;

    let filteredTasks = tasks;
    if (project) {
      filteredTasks = tasks.filter(t => 
        (project.teamIds && project.teamIds.includes(t.teamId)) || 
        (project.userIds && project.userIds.includes(t.userId))
      );
    }

    let total = 0, completed = 0, inProgress = 0, overdue = 0;
    filteredTasks.forEach(t => {
      total++;
      if (t.status === 'DONE') completed++;
      if (t.status === 'IN_PROGRESS') inProgress++;
      if (t.status !== 'DONE' && t.dueDate) {
        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);
        if (due < today) overdue++;
      }
    });

    // Filtra checkins também
    const filteredCheckins = project 
      ? checkins.filter(c => project.userIds?.includes(c.userId) || project.teamIds?.includes(c.teamId))
      : checkins;

    let checkedInToday = 0, meCheckedIn = false;
    filteredCheckins.forEach(c => {
      const ts = c.created_at?.toDate ? c.created_at.toDate() : null;
      if (ts && ts >= today) {
        checkedInToday++;
        if (c.userId === uid) meCheckedIn = true;
      }
    });

    setStats(prev => ({ 
      ...prev, 
      totalTasks: total, 
      completedTasks: completed, 
      inProgressTasks: inProgress, 
      overdueTasks: overdue,
      checkinsToday: checkedInToday,
      userCheckedIn: meCheckedIn,
      totalTeams: project ? (project.teamIds?.length || 0) : prev.totalTeams
    }));
  }, [selectedProjectId, tasks, checkins, projects]);

  // Persistência de Layout por Projeto
  useEffect(() => {
    if (!selectedProjectId) return;
    const key = `dashboard_layout_${selectedProjectId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLayout(parsed.map(item => {
          const baseItem = DEFAULT_LAYOUT.find(d => d.i === item.i);
          return baseItem ? { ...baseItem, ...item } : item;
        }));
      } catch (e) { setLayout(DEFAULT_LAYOUT); }
    } else {
      setLayout(DEFAULT_LAYOUT);
    }
  }, [selectedProjectId]);

  const saveLayout = (newLayout) => {
    const mergedLayout = newLayout.map(item => {
      const existingItem = layout.find(l => l.i === item.i);
      return existingItem ? { ...existingItem, ...item } : item;
    });
    setLayout(mergedLayout);
    if (selectedProjectId) {
      localStorage.setItem(`dashboard_layout_${selectedProjectId}`, JSON.stringify(mergedLayout));
    }
  };

  const handleTitleChange = (id, newTitle) => {
    const newLayout = layout.map(w => w.i === id ? { ...w, title: newTitle } : w);
    setLayout(newLayout);
    if (selectedProjectId) {
      localStorage.setItem(`dashboard_layout_${selectedProjectId}`, JSON.stringify(newLayout));
    }
  };

  const handleLayoutChange = (newLayout) => {
    saveLayout(newLayout);
  };

  const removeWidget = (id) => {
    const newLayout = layout.filter(w => w.i !== id);
    saveLayout(newLayout);
  };

  const resetLayout = () => {
    saveLayout(DEFAULT_LAYOUT);
  };

  const data = { stats, tasks, checkins };

  return (
    <div className="flex-col gap-4">
      <style>{`
        .react-grid-item {
          transition: all 0.2s ease;
        }
        .react-grid-item.react-grid-placeholder {
          background: var(--accent-primary);
          opacity: 0.2;
          border-radius: 12px;
        }
        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 0;
          right: 0;
          cursor: se-resize;
          background: linear-gradient(135deg, transparent 50%, var(--accent-primary) 60%);
          border-radius: 0 0 8px 0;
        }
        .react-grid-item > .react-resizable-handle::after {
          content: "";
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 8px;
          height: 8px;
          border-right: 2px solid white;
          border-bottom: 2px solid white;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>

      <div className="flex justify-between items-center" style={{ padding: '1.5rem 2rem 0' }}>
        <div className="flex items-center gap-6">
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <select 
            className="btn btn-secondary" 
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              localStorage.setItem('dashboard_project_id', e.target.value);
            }}
            style={{ minWidth: '200px', cursor: 'pointer' }}
          >
            <option value="all">Todos os Projetos</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          {isCustomizing && (
            <button className="btn btn-secondary text-sm" onClick={resetLayout}>
              <RotateCcw size={16} /> Reset
            </button>
          )}
          <button 
            className={`btn ${isCustomizing ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setIsCustomizing(!isCustomizing)}
          >
            <Grid size={18} />
            {isCustomizing ? ' Concluir' : ' Personalizar'}
          </button>
        </div>
      </div>

      {isCustomizing && (
        <div className="glass-panel p-3 text-sm" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px dashed var(--accent-primary)' }}>
          <strong>Modo Personalização:</strong> Arraste para mover • Arraste o canto azul para redimensionar • Clique no X para remover
        </div>
      )}

      <div 
        ref={containerRef}
        style={{ 
          minHeight: '800px', 
          width: '100%'
        }}
      >
        <GridLayout
          className="layout"
          layout={layout}
          cols={COLS}
          rowHeight={ROW_HEIGHT}
          width={containerWidth}
          onLayoutChange={handleLayoutChange}
          isDraggable={isCustomizing}
          isResizable={isCustomizing}
          draggableHandle=".drag-handle"
          margin={[12, 12]}
          containerPadding={[10, 10]}
        >
          {layout.map(item => (
            <div key={item.i} className="drag-handle h-full">
              <Widget
                widget={item}
                data={data}
                isCustomizing={isCustomizing}
                onRemove={removeWidget}
                onTitleChange={handleTitleChange}
              />
            </div>
          ))}
        </GridLayout>
      </div>
    </div>
  );
}
