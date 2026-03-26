import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  User, Mail, Phone, MapPin, Camera, Save, CheckCircle, 
  MessageSquare, UserCircle, Globe, Hash
} from 'lucide-react';

export default function Profile({ user }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    nickname: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    photo: '',
    bio: ''
  });

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileData({
          name: data.name || user.displayName || '',
          nickname: data.nickname || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          address: data.address || '',
          photo: data.photo || user.photoURL || '',
          bio: data.bio || ''
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...profileData,
        updatedAt: new Date()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Erro ao salvar perfil: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <UserCircle size={32} className="text-primary" />
            Meu Perfil
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Gerencie suas informações pessoais e de contato.</p>
        </div>
        {success && (
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2 font-bold text-sm animate-bounce">
            <CheckCircle size={18} /> Perfil atualizado!
          </div>
        )}
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Avatar e Bio */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/10 shadow-inner bg-slate-50">
                {profileData.photo ? (
                  <img src={profileData.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-black text-primary/20 bg-primary/5">
                    {profileData.name.charAt(0)}
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                <Camera size={18} />
                <input 
                  type="text" 
                  placeholder="URL da Foto" 
                  className="hidden" 
                  onChange={(e) => setProfileData({...profileData, photo: e.target.value})}
                />
              </label>
            </div>
            <h3 className="mt-4 font-black text-slate-800 text-lg">{profileData.name}</h3>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{user?.role || 'Usuário'}</p>
            
            <div className="w-full mt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mini Bio</label>
                <textarea 
                  value={profileData.bio}
                  onChange={e => setProfileData({...profileData, bio: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-medium focus:border-primary focus:bg-white outline-none transition-all min-h-[120px] resize-none"
                  placeholder="Conte um pouco sobre você..."
                />
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50/50 p-6 rounded-[2rem] border-2 border-blue-100/50">
             <h4 className="font-bold text-blue-800 text-sm flex items-center gap-2 mb-2">
               <Globe size={16} /> Visibilidade
             </h4>
             <p className="text-xs text-blue-600 font-medium leading-relaxed">
               Suas informações de contato ficam visíveis para administradores e membros da sua equipe para facilitar a colaboração.
             </p>
          </div>
        </div>

        {/* Lado Direito: Campos de Formulário */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm space-y-8">
            
            {/* Seção: Identificação */}
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <User size={14} className="text-primary" /> Identificação básica
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">Nome Completo</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      value={profileData.name}
                      onChange={e => setProfileData({...profileData, name: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">Apelido (Como quer ser chamado)</label>
                  <div className="relative">
                    <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      value={profileData.nickname}
                      onChange={e => setProfileData({...profileData, nickname: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                      placeholder="Ex: Rick"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Seção: Contato */}
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Phone size={14} className="text-primary" /> Informações de Contato
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">E-mail Corporativo</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="email"
                      disabled
                      value={profileData.email}
                      className="w-full bg-slate-100 border-2 border-slate-100 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">Celular / Telefone</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="tel"
                      value={profileData.phone}
                      onChange={e => setProfileData({...profileData, phone: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">WhatsApp</label>
                  <div className="relative">
                    <MessageSquare size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="tel"
                      value={profileData.whatsapp}
                      onChange={e => setProfileData({...profileData, whatsapp: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 ml-1">Endereço Residencial / Comercial</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      value={profileData.address}
                      onChange={e => setProfileData({...profileData, address: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                      placeholder="Rua, Número, Bairro, Cidade - UF"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={saving}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save size={20} /> Salvar Alterações
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
