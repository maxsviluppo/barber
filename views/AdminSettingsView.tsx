
import React, { useState } from 'react';
import { ShopSettings, Service } from '../types';
import { Plus, Trash2, Save, Clock, Scissors, Info, MapPin, Eye, EyeOff, Phone, MessageSquare, Timer, Bell } from 'lucide-react';

interface AdminSettingsViewProps {
  settings: ShopSettings;
  onUpdateSettings: (settings: ShopSettings) => void;
}

const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const [localSettings, setLocalSettings] = useState<ShopSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(
    "Notification" in window ? Notification.permission : 'unsupported'
  );

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      new Notification("Notifiche Attivate", {
        body: "Ora riceverai promemoria per gli appuntamenti imminenti.",
        icon: '/vite.svg'
      });
    }
  };

  const sendTestNotification = () => {
    if (notificationPermission === 'granted') {
      new Notification("Test Notifica", {
        body: "Le notifiche push funzionano correttamente!",
        icon: '/vite.svg'
      });
    } else {
      requestNotificationPermission();
    }
  };

  const addService = () => {
    const newService: Service = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Nuovo Servizio',
      price: 20,
      duration: 30,
      customInterval: undefined
    };
    setLocalSettings({ ...localSettings, services: [...localSettings.services, newService] });
  };

  const removeService = (id: string) => {
    setLocalSettings({
      ...localSettings,
      services: localSettings.services.filter(s => s.id !== id)
    });
  };

  const updateService = (id: string, field: keyof Service, value: any) => {
    setLocalSettings({
      ...localSettings,
      services: localSettings.services.map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  const togglePrices = () => {
    setLocalSettings({ ...localSettings, showPrices: !localSettings.showPrices });
  };

  const toggleSMS = () => {
    setLocalSettings({ ...localSettings, smsEnabled: !localSettings.smsEnabled });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-32">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Impostazioni</h1>
          <p className="text-zinc-500 mt-1">Configura il tuo salone.</p>
        </div>
        <button 
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-lg ${
            isSaved ? 'bg-green-600 text-white' : 'bg-amber-600 text-white shadow-amber-200'
          }`}
        >
          {isSaved ? 'Salvato!' : <><Save size={18} /> Salva</>}
        </button>
      </header>

      <div className="space-y-8">
        {/* Info Generali */}
        <section className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
            <Info size={18} className="text-amber-600" /> Informazioni Base
          </h2>
          <div className="space-y-4">
            <div className="relative">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest absolute left-4 top-3">Nome Salone</label>
              <input 
                type="text"
                value={localSettings.name}
                onChange={(e) => setLocalSettings({...localSettings, name: e.target.value})}
                className="w-full pt-8 pb-3 px-4 rounded-2xl border-2 border-zinc-50 bg-zinc-50/50 focus:border-amber-600 outline-none font-bold text-base"
              />
            </div>
            <div className="relative">
              <MapPin size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300" />
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest absolute left-4 top-3">Indirizzo</label>
              <input 
                type="text"
                value={localSettings.address}
                onChange={(e) => setLocalSettings({...localSettings, address: e.target.value})}
                className="w-full pt-8 pb-3 px-4 rounded-2xl border-2 border-zinc-50 bg-zinc-50/50 focus:border-amber-600 outline-none font-medium text-base"
              />
            </div>
            <div className="relative">
              <Phone size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300" />
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest absolute left-4 top-3">Telefono Salone</label>
              <input 
                type="tel"
                value={localSettings.phone || ''}
                onChange={(e) => setLocalSettings({...localSettings, phone: e.target.value})}
                className="w-full pt-8 pb-3 px-4 rounded-2xl border-2 border-zinc-50 bg-zinc-50/50 focus:border-amber-600 outline-none font-medium text-base"
              />
            </div>
          </div>
        </section>

        {/* Notifiche SMS e Visibilità Prezzi */}
        <div className="grid gap-4">
          <section className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <MessageSquare size={18} className={localSettings.smsEnabled ? "text-amber-600" : "text-zinc-400"} />
                  Notifiche SMS
                </h2>
                <p className="text-xs text-zinc-500">Invia un SMS di conferma automatico ad ogni prenotazione.</p>
              </div>
              <button 
                onClick={toggleSMS}
                className={`w-14 h-8 rounded-full transition-colors relative ${localSettings.smsEnabled ? 'bg-amber-600' : 'bg-zinc-200'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${localSettings.smsEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Bell size={18} className={notificationPermission === 'granted' ? "text-amber-600" : "text-zinc-400"} />
                  Notifiche Push
                </h2>
                <p className="text-xs text-zinc-500">
                  {notificationPermission === 'granted' 
                    ? 'Le notifiche sono attive. Riceverai promemoria per gli appuntamenti.' 
                    : notificationPermission === 'denied'
                    ? 'Le notifiche sono bloccate. Abilitale nelle impostazioni del browser.'
                    : 'Abilita le notifiche per ricevere promemoria.'}
                </p>
              </div>
              <button 
                onClick={notificationPermission === 'granted' ? sendTestNotification : requestNotificationPermission}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  notificationPermission === 'granted' 
                    ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' 
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
              >
                {notificationPermission === 'granted' ? 'Test Notifica' : 'Attiva Ora'}
              </button>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  {localSettings.showPrices ? <Eye size={18} className="text-amber-600" /> : <EyeOff size={18} className="text-zinc-400" />}
                  Mostra Prezzi
                </h2>
                <p className="text-xs text-zinc-500">Se disattivato, i prezzi non saranno visibili ai clienti.</p>
              </div>
              <button 
                onClick={togglePrices}
                className={`w-14 h-8 rounded-full transition-colors relative ${localSettings.showPrices ? 'bg-amber-600' : 'bg-zinc-200'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${localSettings.showPrices ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </section>
        </div>

        {/* Orari */}
        <section className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
            <Clock size={18} className="text-amber-600" /> Orari di Lavoro Globali
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest absolute left-4 top-3">Apertura</label>
              <input 
                type="time"
                value={localSettings.openTime}
                onChange={(e) => setLocalSettings({...localSettings, openTime: e.target.value})}
                className="w-full pt-8 pb-3 px-4 rounded-2xl border-2 border-zinc-50 bg-zinc-50/50 outline-none font-bold text-base"
              />
            </div>
            <div className="relative">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest absolute left-4 top-3">Chiusura</label>
              <input 
                type="time"
                value={localSettings.closeTime}
                onChange={(e) => setLocalSettings({...localSettings, closeTime: e.target.value})}
                className="w-full pt-8 pb-3 px-4 rounded-2xl border-2 border-zinc-50 bg-zinc-50/50 outline-none font-bold text-base"
              />
            </div>
          </div>
          <div className="relative">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest absolute left-4 top-3">Intervallo Standard (min)</label>
            <select 
              value={localSettings.slotInterval}
              onChange={(e) => setLocalSettings({...localSettings, slotInterval: Number(e.target.value)})}
              className="w-full pt-8 pb-3 px-4 rounded-2xl border-2 border-zinc-50 bg-zinc-50/50 outline-none font-bold appearance-none text-base"
            >
              <option value={15}>Ogni 15 minuti</option>
              <option value={20}>Ogni 20 minuti</option>
              <option value={30}>Ogni 30 minuti</option>
              <option value={45}>Ogni 45 minuti</option>
              <option value={60}>Ogni 60 minuti</option>
            </select>
          </div>
        </section>

        {/* Servizi */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Scissors size={18} className="text-amber-600" /> Listino Servizi
            </h2>
            <button 
              onClick={addService}
              className="p-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            {localSettings.services.map((service) => (
              <div key={service.id} className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => removeService(service.id)}
                    className="p-2 text-zinc-300 hover:text-red-500 transition-colors bg-red-50 rounded-xl"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="space-y-5">
                  <div className="relative">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1 block">Nome Servizio</label>
                    <input 
                      type="text"
                      value={service.name}
                      placeholder="Esempio: Taglio e Barba"
                      onChange={(e) => updateService(service.id, 'name', e.target.value)}
                      className="w-full text-lg font-black text-zinc-900 border-b-2 border-zinc-50 focus:border-amber-600 pb-1 outline-none transition-colors"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] block">Prezzo (€)</label>
                      <div className="flex items-center gap-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-100 focus-within:border-amber-600 transition-colors">
                        <span className="text-zinc-400 font-bold">€</span>
                        <input 
                          type="number"
                          value={service.price}
                          onChange={(e) => updateService(service.id, 'price', Number(e.target.value))}
                          className="w-full bg-transparent font-bold outline-none text-zinc-900"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] block">Durata (min)</label>
                      <div className="flex items-center gap-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-100 focus-within:border-amber-600 transition-colors">
                        <Clock size={14} className="text-zinc-400" />
                        <input 
                          type="number"
                          value={service.duration}
                          onChange={(e) => updateService(service.id, 'duration', Number(e.target.value))}
                          className="w-full bg-transparent font-bold outline-none text-zinc-900"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em] block">Slot (min)</label>
                      <div className="flex items-center gap-2 bg-amber-50/50 p-3 rounded-2xl border border-amber-100 focus-within:border-amber-600 transition-colors">
                        <Timer size={14} className="text-amber-500" />
                        <input 
                          type="number"
                          placeholder="Auto"
                          value={service.customInterval || ''}
                          onChange={(e) => updateService(service.id, 'customInterval', e.target.value ? Number(e.target.value) : undefined)}
                          className="w-full bg-transparent font-bold outline-none text-amber-900 placeholder:text-amber-200"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-zinc-400 font-medium italic">
                    * Lo "Slot" definisce ogni quanti minuti il cliente può prenotare questo specifico servizio. Se vuoto, usa l'intervallo globale ({localSettings.slotInterval} min).
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminSettingsView;
