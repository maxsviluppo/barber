
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Booking, ShopSettings } from '../types';
import { getDailySummary } from '../services/geminiService';
import { Check, Phone, Calendar, Trash2, Sparkles, User, QrCode, X, AlertTriangle, Clock, ExternalLink, Copy, CheckCircle2, Share2, ChevronRight, Pencil } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface AdminDashboardViewProps {
  bookings: Booking[];
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onDelete: (id: string) => void;
  settings: ShopSettings;
}

const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ bookings, onUpdateBooking, onDelete, settings }) => {
  const [aiSummary, setAiSummary] = useState<string>('Analisi in corso...');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [showQR, setShowQR] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [copied, setCopied] = useState(false);
  const dateScrollRef = useRef<HTMLDivElement>(null);
  const activeDateRef = useRef<HTMLButtonElement>(null);

  const dates = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = -7; i < 21; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  const dayBookings = useMemo(() => {
    return bookings
      .filter(b => b.date === filterDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [filterDate, bookings]);

  const generateTimeSlots = (dateStr: string) => {
    const slots = [];
    const [startH, startM] = settings.openTime.split(':').map(Number);
    const [endH, endM] = settings.closeTime.split(':').map(Number);
    
    let current = new Date();
    current.setHours(startH, startM, 0, 0);
    
    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    const bookedTimes = new Set(
      bookings
        .filter(b => b.date === dateStr && b.status !== 'cancelled')
        .map(b => b.time)
    );

    while (current < end) {
      const timeStr = current.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      const isBooked = bookedTimes.has(timeStr);
      slots.push({ time: timeStr, isBooked });
      current.setMinutes(current.getMinutes() + settings.slotInterval);
    }
    return slots;
  };

  const timelineSlots = useMemo(() => {
    const slots = [];
    const allPossible = generateTimeSlots(filterDate);
    
    allPossible.forEach(({ time }) => {
      const booking = dayBookings.find(b => b.time === time);
      slots.push({ time, booking });
    });
    
    return slots;
  }, [settings.openTime, settings.closeTime, settings.slotInterval, dayBookings, filterDate]);

  useEffect(() => {
    if (activeDateRef.current && dateScrollRef.current) {
      const container = dateScrollRef.current;
      const target = activeDateRef.current;
      const scrollPos = target.offsetLeft - (container.offsetWidth / 2) + (target.offsetWidth / 2);
      container.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      if (dayBookings.length > 0) {
        const summary = await getDailySummary(dayBookings);
        setAiSummary(summary || '');
      } else {
        setAiSummary("Nessun appuntamento per oggi. È il momento ideale per far scansionare il tuo QR ai nuovi clienti!");
      }
    };
    fetchSummary();
  }, [filterDate, dayBookings.length]);

  const shopUrl = window.location.origin + window.location.pathname;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: settings.name,
          text: `Prenota il tuo appuntamento da ${settings.name}!`,
          url: shopUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingBookingId(id);
  };

  const handleDelete = () => {
    if (deletingBookingId) {
      onDelete(deletingBookingId);
      setDeletingBookingId(null);
    }
  };

  const handleUpdateTime = (newTime: string) => {
    if (editingBooking) {
      onUpdateBooking(editingBooking.id, { time: newTime });
      setEditingBooking(null);
    }
  };

  const isToday = (date: Date) => {
    return date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
  };

  const formatDateLabel = (date: Date) => {
    const day = date.getDate();
    const weekday = date.toLocaleDateString('it-IT', { weekday: 'short' });
    return { day, weekday };
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4 px-2">
         <h2 className="text-xl font-black text-zinc-900 tracking-tight">Agenda</h2>
         <button 
          onClick={() => setShowQR(true)}
          className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-zinc-100 shadow-sm text-xs font-bold text-zinc-600 active:scale-95 transition-transform"
        >
          <QrCode size={14} className="text-amber-600" /> Share QR
        </button>
      </div>

      <div className="relative mb-8">
        <div 
          ref={dateScrollRef}
          className="flex gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
        >
          {dates.map((date, idx) => {
            const dateStr = date.toISOString().split('T')[0];
            const active = filterDate === dateStr;
            const today = isToday(date);
            const { day, weekday } = formatDateLabel(date);
            
            return (
              <button
                key={idx}
                ref={today ? activeDateRef : null}
                onClick={() => setFilterDate(dateStr)}
                className={`flex-shrink-0 w-16 h-20 rounded-3xl flex flex-col items-center justify-center transition-all duration-300 ${
                  active 
                    ? 'bg-amber-600 text-white shadow-xl shadow-amber-200 scale-105' 
                    : today 
                      ? 'bg-amber-50 border border-amber-200 text-amber-600 shadow-sm'
                      : 'bg-white border border-zinc-100 text-zinc-400 hover:border-zinc-200 shadow-sm'
                }`}
              >
                <span className={`text-[10px] font-black uppercase mb-1 ${active ? 'text-amber-100' : today ? 'text-amber-600/60' : 'text-zinc-300'}`}>
                  {weekday}
                </span>
                <span className="text-xl font-black">{day}</span>
                {today && !active && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 rounded-[32px] text-white mb-8 relative overflow-hidden shadow-2xl border border-zinc-700">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Sparkles size={14} className="text-amber-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Intelligenza Artificiale</span>
          </div>
          <p className="text-base leading-relaxed font-medium text-zinc-100 italic">
            "{aiSummary}"
          </p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full" />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <Clock size={18} className="text-amber-600" /> Timeline
          </h3>
          <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
            {dayBookings.length} APPUNTAMENTI
          </span>
        </div>

        <div className="space-y-4">
          {timelineSlots.map(({ time, booking }) => (
            <div key={time} className="flex gap-4 items-start">
              <div className="w-14 pt-4 text-right">
                <span className={`text-xs font-black transition-colors ${booking ? 'text-zinc-900' : 'text-zinc-300'}`}>
                  {time}
                </span>
              </div>
              
              <div className="flex-1">
                {booking ? (
                  <div className={`p-5 rounded-[32px] border-2 transition-all duration-500 relative overflow-hidden ${
                    booking.status === 'completed' 
                      ? 'bg-zinc-100 border-zinc-100 opacity-60' 
                      : 'bg-white border-white shadow-md shadow-zinc-200/50 hover:shadow-xl hover:-translate-y-0.5'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${booking.status === 'completed' ? 'bg-zinc-200 text-zinc-400' : 'bg-amber-100 text-amber-700'}`}>
                          <User size={20} />
                        </div>
                        <div>
                          <h4 className={`font-black text-base ${booking.status === 'completed' ? 'text-zinc-400' : 'text-zinc-900'}`}>
                            {booking.customerName}
                          </h4>
                          <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-0.5">{booking.service.name}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setEditingBooking(booking)}
                          className="p-2.5 text-zinc-400 hover:text-amber-600 transition-colors bg-zinc-50 rounded-xl"
                        >
                          <Pencil size={18} />
                        </button>
                        <a 
                          href={`tel:${booking.customerPhone}`}
                          className="p-2.5 text-zinc-400 hover:text-amber-600 transition-colors bg-zinc-50 rounded-xl"
                        >
                          <Phone size={18} />
                        </a>
                        <button 
                          onClick={() => confirmDelete(booking.id)}
                          className="p-2.5 text-zinc-300 hover:text-red-500 transition-colors bg-zinc-50 rounded-xl"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-3">
                      {booking.status !== 'completed' ? (
                        <button 
                          onClick={() => onUpdateBooking(booking.id, { status: 'completed' })}
                          className="text-[11px] font-black bg-zinc-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-zinc-200"
                        >
                          <Check size={14} strokeWidth={3} /> COMPLETA
                        </button>
                      ) : (
                        <div className="animate-status-pop flex items-center gap-1.5 text-[11px] font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 uppercase tracking-widest">
                          <Check size={14} strokeWidth={3} /> Eseguito
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-[32px] border-2 border-dashed border-zinc-100 bg-white/50 flex items-center justify-between group cursor-pointer hover:bg-zinc-50 transition-colors">
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Disponibile</span>
                    <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={18} className="text-zinc-300" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {deletingBookingId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-zinc-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs rounded-[40px] p-8 relative animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-1">
                <AlertTriangle size={36} />
              </div>
              <h2 className="text-2xl font-black text-zinc-900">Elimina?</h2>
              <p className="text-sm text-zinc-500 font-medium">
                Questa operazione è definitiva e non può essere annullata.
              </p>
              <div className="flex w-full gap-3 pt-4">
                <button 
                  onClick={() => setDeletingBookingId(null)}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-black text-sm active:scale-95 transition-transform"
                >
                  No
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-red-200 active:scale-95 transition-transform"
                >
                  Elimina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Time Modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-zinc-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 relative animate-in zoom-in-95 duration-200 shadow-2xl max-h-[80vh] overflow-y-auto no-scrollbar">
            <button 
              onClick={() => setEditingBooking(null)}
              className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-900 bg-zinc-100 p-2 rounded-full transition-colors z-10"
            >
              <X size={20} />
            </button>
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-2xl font-black text-zinc-900">Modifica Orario</h2>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{editingBooking.customerName}</p>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {generateTimeSlots(editingBooking.date).map(({ time, isBooked }) => {
                const isCurrent = editingBooking.time === time;
                const isDisabled = isBooked && !isCurrent;
                return (
                  <button
                    key={time}
                    disabled={isDisabled}
                    onClick={() => handleUpdateTime(time)}
                    className={`py-4 rounded-2xl border-2 text-center font-black transition-all duration-300 relative ${
                      isCurrent 
                        ? 'border-amber-600 bg-amber-600 text-white shadow-lg shadow-amber-200 scale-105 z-10' 
                        : isDisabled
                          ? 'border-zinc-50 bg-zinc-50 text-zinc-200 cursor-not-allowed opacity-50'
                          : 'border-white bg-zinc-50 text-zinc-500 hover:border-zinc-200 active:scale-95'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>

            <div className="mt-8">
               <button 
                onClick={() => setEditingBooking(null)}
                className="w-full py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-black text-sm active:scale-95 transition-transform"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-8 relative animate-in zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
            <button 
              onClick={() => setShowQR(false)}
              className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-900 bg-zinc-100 p-2 rounded-full transition-colors z-10"
            >
              <X size={20} />
            </button>
            <div className="text-center space-y-2 mb-8 mt-4">
              <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Condividi</h2>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest opacity-70 px-4">Fai inquadrare il QR o invia il link diretto</p>
            </div>
            
            <div className="bg-white p-6 rounded-[40px] flex justify-center mb-8 border-4 border-zinc-50 shadow-inner relative group">
              <QRCodeSVG value={shopUrl} size={180} level="H" includeMargin={false} />
              <a 
                href={shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity rounded-[40px] flex-col gap-2 no-underline text-zinc-900"
              >
                 <ExternalLink className="text-amber-600" />
                 <span className="text-[10px] font-black uppercase">Vedi come Cliente</span>
              </a>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleShare}
                className="w-full bg-amber-600 text-white py-5 rounded-[28px] font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-amber-200 active:scale-95 transition-all"
              >
                <Share2 size={20} />
                Invia su WhatsApp / Social
              </button>

              <div className="bg-zinc-50 p-4 rounded-3xl border border-zinc-100">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3 text-center italic">Oppure clicca e copia il link</p>
                <div className="flex flex-col gap-3">
                  <a 
                    href={shopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-xs font-black text-amber-600 underline truncate px-4"
                  >
                    {shopUrl}
                  </a>
                  <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-zinc-200">
                    <button 
                      onClick={handleCopyLink}
                      className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${copied ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-zinc-900 text-white active:scale-95'}`}
                    >
                      {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                      <span className="text-[10px] font-black">{copied ? 'COPIATO!' : 'COPIA LINK'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-center pt-2">
                <div className="bg-amber-100 rounded-2xl py-3 px-5 inline-block border border-amber-200">
                  <p className="text-[10px] text-amber-700 font-black uppercase tracking-[0.3em]">{settings.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardView;
