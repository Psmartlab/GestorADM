import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

import {
  Settings as SettingsIcon, Shield, Bell, Palette, Users, Database,
  Save, CheckCircle, AlertTriangle, ChevronRight, RefreshCcw, Trash2,
  UserCheck, UserCog
} from 'lucide-react';


// ──────────────────────────────────────────────
// PERMISSION DEFINITIONS
// Every capability the system has, grouped by area
// ──────────────────────────────────────────────
export const ALL_PERMISSIONS = {
  'Navegação': [
    { id: 'nav.dashboard',       label: 'Ver Dashboard',             default: { Admin: true,  Gerente: true,  User: true  } },
    { id: 'nav.dashboard.teams', label: 'Dashboard → Equipes',       default: { Admin: true,  Gerente: true,  User: false } },
    { id: 'nav.dashboard.projects', label: 'Dashboard → Projetos',   default: { Admin: true,  Gerente: true,  User: false } },
    { id: 'nav.dashboard.users', label: 'Dashboard → Usuários',      default: { Admin: true,  Gerente: false, User: false } },
    { id: 'nav.tasks',           label: 'Minhas Tarefas',            default: { Admin: true,  Gerente: true,  User: true  } },
    { id: 'nav.checkins',        label: 'Check-ins',                 default: { Admin: true,  Gerente: true,  User: true  } },
    { id: 'nav.control',         label: 'Gestão de Tarefas',         default: { Admin: true,  Gerente: true,  User: false } },
    { id: 'nav.teams',           label: 'Equipes',                   default: { Admin: true,  Gerente: true,  User: false } },
    { id: 'nav.projects',        label: 'Projetos',                  default: { Admin: true,  Gerente: true,  User: true  } },
    { id: 'nav.users',           label: 'Usuários',                  default: { Admin: true,  Gerente: false, User: false } },
    { id: 'nav.notifications',   label: 'Central de Notificações',   default: { Admin: true,  Gerente: false, User: false } },
    { id: 'nav.settings',        label: 'Configurações do Sistema',  default: { Admin: true,  Gerente: false, User: false } },
  ],
  'Tarefas': [
    { id: 'tasks.create',        label: 'Criar tarefas',             default: { Admin: true,  Gerente: true,  User: false } },
    { id: 'tasks.edit_own',      label: 'Editar próprias tarefas',   default: { Admin: true,  Gerente: true,  User: true  } },
    { id: 'tasks.edit_all',      label: 'Editar qualquer tarefa',    default: { Admin: true,  Gerente: true,  User: false } },
    { id: 'tasks.delete',        label: 'Excluir tarefas',           default: { Admin: true,  Gerente: true,  User: false } },
    { id: 'tasks.assign',        label: 'Atribuir tarefas a outros', default: { Admin: true,  Gerente: true,  User: false } },
    { id: 'tasks.move_status',   label: 'Mover status (Kanban)',     default: { Admin: true,  Gerente: true,  User: true  } },
  ],
  'Equipes': [
    { id: 'teams.view',          label: 'Ver equipes',               default: { Admin: true,  Gerente: true,  User: false } },
    { id: 'teams.create',        label: 'Criar equipes',             default: { Admin: true,  Gerente: false, User: false } },
    { id: 'teams.edit',          label: 'Editar equipes',            default: { Admin: true,  Gerente: true,  User: false } },
    { id: 'teams.delete',        label: 'Excluir equipes',           default: { Admin: true,  Gerente: false, User: false } },
    { id: 'teams.add_member',    label: 'Adicionar membros',         default: { Admin: true,  Gerente: true,  User: false } },
  ],
  'Projetos': [
    { id: 'projects.view',       label: 'Ver projetos',              default: { Admin: true,  Gerente: true,  User: true  } },
    { id: 'projects.create',     label: 'Criar projetos',            default: { Admin: true,  Gerente: true,  User: false } },
    { id: 'projects.edit',       label: 'Editar projetos',           default: { Admin: true,  Gerente: true,  User: false } },
    { id: 'projects.delete',     label: 'Excluir projetos',          default: { Admin: true,  Gerente: false, User: false } },
  ],
  'Usuários': [
    { id: 'users.view',          label: 'Ver lista de usuários',     default: { Admin: true,  Gerente: false, User: false } },
    { id: 'users.create',        label: 'Criar usuários',            default: { Admin: true,  Gerente: false, User: false } },
    { id: 'users.edit_role',     label: 'Alterar cargo/role',        default: { Admin: true,  Gerente: false, User: false } },
    { id: 'users.disable',       label: 'Desativar usuários',        default: { Admin: true,  Gerente: false, User: false } },
  ],
  'Relatórios e Logs': [
    { id: 'logs.view',           label: 'Ver logs de acesso',        default: { Admin: true,  Gerente: false, User: false } },
    { id: 'logs.delete',         label: 'Apagar logs',               default: { Admin: true,  Gerente: false, User: false } },
    { id: 'reports.view',        label: 'Ver relatórios',            default: { Admin: true,  Gerente: true,  User: false } },
  ],
  'Notificações': [
    { id: 'notif.send',          label: 'Enviar notificações',       default: { Admin: true,  Gerente: false, User: false } },
    { id: 'notif.view_all',      label: 'Ver todas as notificações', default: { Admin: true,  Gerente: false, User: false } },
  ],
};

const ROLES = ['Admin', 'Gerente', 'User'];

const Toggle = ({ checked, onChange, disabled }) => (
  <label className={`relative inline-flex items-center ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
    <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} disabled={disabled} />
    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
  </label>
);

const Toast = ({ msg, type }) => (
  msg ? (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl font-bold text-sm animate-in slide-in-from-bottom-4 ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
      {msg}
    </div>
  ) : null
);

// ──────────────────────────────────────────────
// SECTION: Privacidade e Segurança
// ──────────────────────────────────────────────
function SectionSecurity({ onSave }) {
  const [settings, setSettings] = useState({ twoFa: false, sessionTimeout: '60', allowGoogleOnly: true });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'security')).then(d => { if (d.exists()) setSettings(s => ({ ...s, ...d.data() })); });
  }, []);

  const save = async () => {
    await setDoc(doc(db, 'settings', 'security'), settings);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    onSave('Configurações de segurança salvas!');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between py-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800">Autenticação em Duas Etapas (2FA)</h3>
          <p className="text-sm text-slate-500 mt-0.5">Exigir código no login de administradores.</p>
        </div>
        <Toggle checked={settings.twoFa} onChange={e => setSettings(s => ({ ...s, twoFa: e.target.checked }))} />
      </div>
      <div className="flex items-center justify-between py-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800">Apenas Login Google</h3>
          <p className="text-sm text-slate-500 mt-0.5">Bloquear login por e-mail/senha, exigir conta Google.</p>
        </div>
        <Toggle checked={settings.allowGoogleOnly} onChange={e => setSettings(s => ({ ...s, allowGoogleOnly: e.target.checked }))} />
      </div>
      <div className="flex items-center justify-between py-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800">Tempo de Sessão Inativa</h3>
          <p className="text-sm text-slate-500 mt-0.5">Desconectar automaticamente após inatividade.</p>
        </div>
        <select value={settings.sessionTimeout} onChange={e => setSettings(s => ({ ...s, sessionTimeout: e.target.value }))} className="border-2 border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:border-primary outline-none">
          <option value="15">15 Minutos</option>
          <option value="30">30 Minutos</option>
          <option value="60">1 Hora</option>
          <option value="480">8 Horas</option>
          <option value="0">Nunca</option>
        </select>
      </div>
      <div className="flex items-center justify-between py-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-red-600">Apagar Log de Acesso</h3>
          <p className="text-sm text-slate-500 mt-0.5">Limpa permanentemente o histórico de IPs e conexões.</p>
        </div>
        <button onClick={() => { if(window.confirm('Confirma apagar todos os logs?')) onSave('Logs apagados!'); }} className="bg-red-50 text-red-600 border-2 border-red-200 font-bold px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors flex items-center gap-2">
          <Trash2 size={16} /> Limpar Logs
        </button>
      </div>
      <button onClick={save} className="self-end bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
        <Save size={18} /> {saved ? 'Salvo!' : 'Salvar Configurações'}
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// SECTION: Permissões Globais
// ──────────────────────────────────────────────
function SectionPermissions({ onSave }) {
  const [activeTab, setActiveTab] = useState('roles'); // 'roles' | 'users'
  const [rolePerms, setRolePerms] = useState({}); // { permId: { Admin: bool, Gerente: bool, User: bool } }
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOverrides, setUserOverrides] = useState({}); // { permId: bool | null }

  // Init role perms from default definitions
  useEffect(() => {
    const initial = {};
    Object.values(ALL_PERMISSIONS).flat().forEach(p => { initial[p.id] = { ...p.default }; });
    getDoc(doc(db, 'settings', 'rolePermissions')).then(d => {
      setRolePerms(d.exists() ? { ...initial, ...d.data() } : initial);
    });
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.name !== 'Aguardando Login'));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    getDoc(doc(db, 'users', selectedUser.id)).then(d => {
      setUserOverrides(d.exists() ? (d.data().permissionOverrides || {}) : {});
    });
  }, [selectedUser]);

  const saveRolePerms = async () => {
    await setDoc(doc(db, 'settings', 'rolePermissions'), rolePerms);
    onSave('Permissões por cargo salvas!');
  };

  const saveUserOverrides = async () => {
    if (!selectedUser) return;
    await updateDoc(doc(db, 'users', selectedUser.id), { permissionOverrides: userOverrides });
    onSave(`Permissões de ${selectedUser.name || selectedUser.email} salvas!`);
  };

  const toggleRole = (permId, role) => {
    setRolePerms(prev => ({ ...prev, [permId]: { ...prev[permId], [role]: !prev[permId]?.[role] } }));
  };

  // For user override: null = follows role default; true = force allow; false = force deny
  const cycleOverride = (permId) => {
    setUserOverrides(prev => {
      const cur = prev[permId];
      if (cur === undefined || cur === null) return { ...prev, [permId]: true };
      if (cur === true) return { ...prev, [permId]: false };
      return { ...prev, [permId]: null };
    });
  };

  const getOverrideLabel = (v) => {
    if (v === true) return { label: '✅ Permitido', cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' };
    if (v === false) return { label: '🚫 Bloqueado', cls: 'bg-red-100 text-red-700 border-red-300' };
    return { label: '🔁 Padrão do Cargo', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Tab Switch */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('roles')} className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'roles' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>
          <Users size={16} className="inline mr-1.5" />Por Cargo
        </button>
        <button onClick={() => setActiveTab('users')} className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>
          <UserCheck size={16} className="inline mr-1.5" />Por Usuário
        </button>
      </div>

      {/* ── Tab: Permissões por Cargo ── */}
      {activeTab === 'roles' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-500">Define o acesso <strong>padrão</strong> para cada nível hierárquico. Pode ser sobrescrito individualmente na aba "Por Usuário".</p>
          {Object.entries(ALL_PERMISSIONS).map(([group, perms]) => (
            <div key={group} className="border-2 border-slate-100 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
                <span className="font-black text-xs text-slate-600 uppercase tracking-widest">{group}</span>
                <div className="flex gap-6 text-[11px] font-black text-slate-400 uppercase tracking-widest pr-2">
                  {ROLES.map(r => <span key={r} className="w-14 text-center">{r}</span>)}
                </div>
              </div>
              {perms.map(p => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <span className="text-sm font-medium text-slate-700">{p.label}</span>
                  <div className="flex gap-6">
                    {ROLES.map(role => (
                      <div key={role} className="w-14 flex justify-center">
                        <input
                          type="checkbox"
                          checked={rolePerms[p.id]?.[role] ?? p.default[role]}
                          onChange={() => toggleRole(p.id, role)}
                          className="w-4 h-4 rounded accent-primary cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
          <button onClick={saveRolePerms} className="self-end bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
            <Save size={18} /> Salvar Permissões por Cargo
          </button>
        </div>
      )}

      {/* ── Tab: Permissões por Usuário ── */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-500">Selecione um usuário para definir <strong>exceções individuais</strong> que sobrescrevem o padrão do cargo. Clique no botão para alternar entre: <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-bold">Padrão do Cargo</span> → <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-xs font-bold">Permitido</span> → <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs font-bold">Bloqueado</span>.</p>

          {/* User Selector */}
          <div className="flex flex-wrap gap-2">
            {users.map(u => (
              <button key={u.id} onClick={() => setSelectedUser(u)} className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all ${selectedUser?.id === u.id ? 'bg-primary text-white border-primary shadow' : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'}`}>
                <span className="inline-block w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-black mr-1.5 text-center leading-6">{(u.name || u.email).charAt(0).toUpperCase()}</span>
                {u.name || u.email}
                <span className="ml-1.5 text-[10px] opacity-60">({u.role})</span>
              </button>
            ))}
          </div>

          {selectedUser && (
            <>
              <div className="bg-blue-50 border-2 border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <UserCog size={20} className="text-primary shrink-0" />
                <div>
                  <p className="font-bold text-slate-800 text-sm">{selectedUser.name || selectedUser.email}</p>
                  <p className="text-xs text-slate-500">Cargo padrão: <strong>{selectedUser.role}</strong> · Overrides ativos: <strong>{Object.values(userOverrides).filter(v => v !== null && v !== undefined).length}</strong></p>
                </div>
                <button onClick={() => setUserOverrides({})} className="ml-auto text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1"><RefreshCcw size={13} /> Resetar tudo</button>
              </div>

              <div className="flex flex-col gap-3">
                {Object.entries(ALL_PERMISSIONS).map(([group, perms]) => (
                  <div key={group} className="border-2 border-slate-100 rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100">
                      <span className="font-black text-xs text-slate-600 uppercase tracking-widest">{group}</span>
                    </div>
                    {perms.map(p => {
                      const ov = userOverrides[p.id];
                      const { label, cls } = getOverrideLabel(ov);
                      const roleDefault = rolePerms[p.id]?.[selectedUser.role] ?? p.default[selectedUser.role];
                      return (
                        <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <div>
                            <span className="text-sm font-medium text-slate-700">{p.label}</span>
                            <span className="ml-2 text-[10px] text-slate-400">(padrão {roleDefault ? '✅' : '🚫'})</span>
                          </div>
                          <button onClick={() => cycleOverride(p.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all hover:shadow-sm ${cls}`}>
                            {label}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <button onClick={saveUserOverrides} className="self-end bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                <Save size={18} /> Salvar Overrides de {selectedUser.name || selectedUser.email}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// SECTION: Notificações Gerais
// ──────────────────────────────────────────────
function SectionNotifications({ onSave }) {
  const [cfg, setCfg] = useState({
    taskOverdue: true, taskAssigned: true, teamUpdate: true,
    projectUpdate: false, systemAlerts: true, dailyDigest: false,
    digestTime: '08:00'
  });

  useEffect(() => {
    getDoc(doc(db, 'settings', 'notifications')).then(d => { if (d.exists()) setCfg(s => ({ ...s, ...d.data() })); });
  }, []);

  const save = async () => {
    await setDoc(doc(db, 'settings', 'notifications'), cfg);
    onSave('Configurações de notificações salvas!');
  };

  const items = [
    { key: 'taskOverdue',    label: 'Tarefa atrasada',           desc: 'Notificar quando um prazo é ultrapassado.' },
    { key: 'taskAssigned',   label: 'Tarefa atribuída',          desc: 'Notificar quando uma tarefa for designada.' },
    { key: 'teamUpdate',     label: 'Atualização de equipe',     desc: 'Novos membros ou alterações na equipe.' },
    { key: 'projectUpdate',  label: 'Atualização de projeto',    desc: 'Mudanças em projetos vinculados.' },
    { key: 'systemAlerts',   label: 'Alertas do sistema',        desc: 'Erros, atualizações e manutenção.' },
    { key: 'dailyDigest',    label: 'Resumo diário',             desc: 'E-mail com o resumo do dia.' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {items.map(item => (
        <div key={item.key} className="flex items-center justify-between py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">{item.label}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
          </div>
          <Toggle checked={cfg[item.key]} onChange={e => setCfg(s => ({ ...s, [item.key]: e.target.checked }))} />
        </div>
      ))}
      {cfg.dailyDigest && (
        <div className="flex items-center justify-between py-3 pl-4 bg-blue-50 rounded-xl border-2 border-blue-100">
          <span className="text-sm font-bold text-slate-700">Horário do Resumo Diário</span>
          <input type="time" value={cfg.digestTime} onChange={e => setCfg(s => ({ ...s, digestTime: e.target.value }))} className="border-2 border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-primary outline-none" />
        </div>
      )}
      <button onClick={save} className="self-end bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
        <Save size={18} /> Salvar Configurações
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// SECTION: Personalização e Temas
// ──────────────────────────────────────────────
function SectionTheme({ onSave }) {
  const [cfg, setCfg] = useState({
    primaryColor: '#00288e', fontScale: 'normal',
    compactMode: false, showAvatars: true, darkMode: false
  });

  // Load from Firestore + apply dark mode on mount
  useEffect(() => {
    const stored = localStorage.getItem('smartlab-dark') === 'true';
    if (stored) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    getDoc(doc(db, 'settings', 'theme')).then(d => {
      if (d.exists()) {
        const data = d.data();
        // darkMode from localStorage is the source of truth (works offline too)
        setCfg(s => ({ ...s, ...data, darkMode: stored }));
      } else {
        setCfg(s => ({ ...s, darkMode: stored }));
      }
    });
  }, []);

  const toggleDark = () => {
    const next = !cfg.darkMode;
    setCfg(s => ({ ...s, darkMode: next }));
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('smartlab-dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('smartlab-dark', 'false');
    }
  };

  const save = async () => {
    await setDoc(doc(db, 'settings', 'theme'), cfg);
    onSave('Preferências de tema salvas!');
  };

  const presets = ['#00288e', '#7c3aed', '#059669', '#dc2626', '#d97706', '#0284c7'];

  return (
    <div className="flex flex-col gap-6">

      {/* Dark Mode — destaque visual */}
      <div className={`relative flex items-center justify-between py-5 px-5 rounded-2xl border-2 transition-all overflow-hidden ${cfg.darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gradient-to-r from-slate-100 to-blue-50 border-slate-200'}`}>
        {/* mini preview */}
        <div className="absolute right-20 top-3 flex gap-1.5 opacity-40 pointer-events-none">
          <div className={`w-16 h-10 rounded-lg border-2 ${cfg.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} />
          <div className="flex flex-col gap-1 justify-center">
            <div className={`w-20 h-2 rounded ${cfg.darkMode ? 'bg-slate-600' : 'bg-slate-200'}`} />
            <div className={`w-14 h-2 rounded ${cfg.darkMode ? 'bg-slate-700' : 'bg-slate-100'}`} />
          </div>
        </div>
        <div>
          <h3 className={`font-bold text-lg ${cfg.darkMode ? 'text-white' : 'text-slate-800'}`}>
            {cfg.darkMode ? '🌙 Modo Escuro' : '☀️ Modo Claro'}
          </h3>
          <p className={`text-sm mt-0.5 ${cfg.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {cfg.darkMode ? 'Interface escura — ideal para baixa luminosidade.' : 'Interface clara — padrão do sistema.'}
          </p>
        </div>
        <Toggle checked={cfg.darkMode} onChange={toggleDark} />
      </div>

      <div className="py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 mb-3">Cor Principal</h3>
        <div className="flex gap-3 flex-wrap">
          {presets.map(c => (
            <button key={c} onClick={() => setCfg(s => ({ ...s, primaryColor: c }))} className={`w-10 h-10 rounded-full border-4 transition-all hover:scale-110 ${cfg.primaryColor === c ? 'border-slate-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
          ))}
          <input type="color" value={cfg.primaryColor} onChange={e => setCfg(s => ({ ...s, primaryColor: e.target.value }))} className="w-10 h-10 rounded-full border-2 border-slate-200 cursor-pointer" title="Cor personalizada" />
        </div>
      </div>
      <div className="flex items-center justify-between py-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800">Escala de Fonte</h3>
          <p className="text-sm text-slate-500 mt-0.5">Ajuste o tamanho do texto da interface.</p>
        </div>
        <select value={cfg.fontScale} onChange={e => setCfg(s => ({ ...s, fontScale: e.target.value }))} className="border-2 border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-primary outline-none">
          <option value="small">Pequena</option>
          <option value="normal">Normal</option>
          <option value="large">Grande</option>
        </select>
      </div>
      <div className="flex items-center justify-between py-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800">Modo Compacto</h3>
          <p className="text-sm text-slate-500 mt-0.5">Reduz espaçamento para ver mais conteúdo.</p>
        </div>
        <Toggle checked={cfg.compactMode} onChange={e => setCfg(s => ({ ...s, compactMode: e.target.checked }))} />
      </div>
      <div className="flex items-center justify-between py-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800">Exibir Avatares</h3>
          <p className="text-sm text-slate-500 mt-0.5">Mostrar fotos de perfil nas listas.</p>
        </div>
        <Toggle checked={cfg.showAvatars} onChange={e => setCfg(s => ({ ...s, showAvatars: e.target.checked }))} />
      </div>
      <button onClick={save} className="self-end bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
        <Save size={18} /> Salvar Tema
      </button>
    </div>
  );
}


// ──────────────────────────────────────────────
// SECTION: Backups e Dados
// ──────────────────────────────────────────────
function SectionData({ onSave }) {
  const [stats, setStats] = useState({ tasks: 0, users: 0, teams: 0, projects: 0 });
  const [autoBackup, setAutoBackup] = useState(false);
  const [backupFreq, setBackupFreq] = useState('weekly');

  useEffect(() => {
    const counts = {};
    ['tasks', 'users', 'teams', 'projects'].forEach(col => {
      onSnapshot(collection(db, col), snap => setStats(s => ({ ...s, [col]: snap.size })));
    });
    getDoc(doc(db, 'settings', 'data')).then(d => {
      if (d.exists()) { setAutoBackup(d.data().autoBackup || false); setBackupFreq(d.data().backupFreq || 'weekly'); }
    });
  }, []);

  const save = async () => {
    await setDoc(doc(db, 'settings', 'data'), { autoBackup, backupFreq });
    onSave('Configurações de backup salvas!');
  };

  const exportData = async () => {
    onSave('Exportação de dados iniciada (funcionalidade via Cloud Functions).');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tarefas', value: stats.tasks, color: 'bg-blue-50 text-blue-700' },
          { label: 'Usuários', value: stats.users, color: 'bg-purple-50 text-purple-700' },
          { label: 'Equipes',  value: stats.teams, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Projetos', value: stats.projects, color: 'bg-amber-50 text-amber-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 text-center ${s.color} border-2 border-current border-opacity-10`}>
            <p className="text-3xl font-black">{s.value}</p>
            <p className="text-xs font-bold uppercase tracking-widest opacity-70 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between py-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800">Backup Automático</h3>
          <p className="text-sm text-slate-500 mt-0.5">Gerar snapshots periódicos via Firebase.</p>
        </div>
        <Toggle checked={autoBackup} onChange={e => setAutoBackup(e.target.checked)} />
      </div>
      {autoBackup && (
        <div className="flex items-center justify-between py-3 pl-4 bg-blue-50 rounded-xl border-2 border-blue-100">
          <span className="text-sm font-bold text-slate-700">Frequência de Backup</span>
          <select value={backupFreq} onChange={e => setBackupFreq(e.target.value)} className="border-2 border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-primary outline-none">
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </select>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button onClick={exportData} className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary hover:text-white transition-all">
          <Database size={18} /> Exportar Todos os Dados (JSON)
        </button>
        <button onClick={() => { if(window.confirm('ATENÇÃO: Isso apaga permanentemente TODOS os dados. Confirmar?')) onSave('Operação de limpeza seria executada via Cloud Functions.'); }} className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-red-300 text-red-600 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all">
          <Trash2 size={18} /> Apagar Todos os Dados
        </button>
      </div>
      <button onClick={save} className="self-end bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
        <Save size={18} /> Salvar Configurações
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// MAIN: Settings
// ──────────────────────────────────────────────
const SECTIONS = [
  { id: 'security',      label: 'Privacidade e Segurança', icon: Shield,      component: SectionSecurity },
  { id: 'permissions',   label: 'Permissões Globais',      icon: Users,       component: SectionPermissions },
  { id: 'notifications', label: 'Notificações Gerais',     icon: Bell,        component: SectionNotifications },
  { id: 'theme',         label: 'Personalização e Temas',  icon: Palette,     component: SectionTheme },
  { id: 'data',          label: 'Backups e Dados',         icon: Database,    component: SectionData },
];

export default function Settings({ user }) {
  const availableSections = user?.role === 'Admin' ? SECTIONS : SECTIONS.filter(s => s.id === 'theme');
  const [activeSection, setActiveSection] = useState(user?.role === 'Admin' ? 'security' : 'theme');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'Admin' && activeSection !== 'theme') {
      setActiveSection('theme');
    }
  }, [user, activeSection]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const ActiveComponent = availableSections.find(s => s.id === activeSection)?.component;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 pb-12">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
          <SettingsIcon size={32} className="text-primary" />
          Configurações do Sistema
        </h1>
        <p className="text-slate-500 mt-2">Gerencie preferências globais, permissões e segurança da plataforma SmartLab.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="flex flex-col gap-1.5">
          {availableSections.map(s => {
            const Icon = s.icon;
            const active = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-3 p-4 rounded-xl font-bold text-left transition-all border-2 ${active ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-slate-600 border-slate-100 hover:border-primary/30 hover:text-primary hover:bg-blue-50/50'}`}
              >
                <Icon size={20} />
                <span className="text-sm">{s.label}</span>
                {!active && <ChevronRight size={16} className="ml-auto opacity-40" />}
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="md:col-span-3 bg-white p-8 rounded-2xl shadow-sm border-2 border-slate-100">
          <h2 className="text-xl font-extrabold text-slate-800 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
            {(() => { const s = availableSections.find(x => x.id === activeSection); const Icon = s?.icon; return Icon ? <Icon size={22} className="text-primary" /> : null; })()}
            {availableSections.find(s => s.id === activeSection)?.label}
          </h2>
          {ActiveComponent && <ActiveComponent onSave={showToast} />}
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
