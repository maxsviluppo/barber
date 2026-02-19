
import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Booking, ShopSettings } from '../types';
import { CheckCircle, Calendar, Clock, MapPin, Coffee, Heart, Phone, Navigation, Pencil, Trash2, X, AlertTriangle, CheckCircle2, CalendarPlus, Download, Share2 } from 'lucide-react';

interface ConfirmationViewProps {
  bookings: Booking[];
  settings: ShopSettings;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onDeleteBooking: (id: string) => void;
}

const ConfirmationView: React.FC<ConfirmationViewProps> = ({ bookings, settings, onUpdateBooking, onDeleteBooking }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const booking = bookings.find(b => b.id === id);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // For Edit Modal
  const [tempDate, setTempDate] = useState(booking?.date || '');
  const [tempTime, setTempTime] = useState(booking?.time || '');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const [startH, startM] = settings.openTime.split(':').map(Number);
    const [endH, endM] = settings.closeTime.split(':').map(Number);
    
    let cursor = new Date();
    cursor.setHours(startH, startM, 0, 0);
    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    const bookedTimes = new Set(
      bookings
        .filter(b => b.date === tempDate && b.status !== 'cancelled' && b.id !== id)
        .map(b => b.time)
    );

    while (cursor < end) {
      const timeStr = cursor.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      if (!bookedTimes.has(timeStr)) {
        slots.push(timeStr);
      }
      cursor.setMinutes(cursor.getMinutes() + settings.slotInterval);
    }
    return slots;
  }, [settings.openTime, settings.closeTime, settings.slotInterval, tempDate, bookings, id]);

  const handleDownloadICS = () => {
    if (!booking) return;

    const [year, month, day] = booking.date.split('-').map(Number);
    const [hour, min] = booking.time.split(':').map(Number);
    
    // Create Date objects for start and end
    const startDate = new Date(year, month - 1, day, hour, min);
    const endDate = new Date(startDate.getTime() + booking.service.duration * 60000);

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Barberia Smart//IT',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${booking.service.name} @ ${settings.name}`,
      `DESCRIPTION:Prenotazione confermata per ${booking.service.name}. Grazie per aver scelto ${settings.name}!`,
      `LOCATION:${settings.address}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `appuntamento-${booking.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("File calendario scaricato!");
  };

  const getGoogleCalendarUrl = () => {
    if (!booking) return '';
    const [year, month, day] = booking.date.split('-').map(Number);
    const [hour, min] = booking.time.split(':').map(Number);
    
    const startDate = new Date(year, month - 1, day, hour, min);
    const endDate = new Date(startDate.getTime() + booking.service.duration * 60000);

    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const title = encodeURIComponent(`${booking.service.name} @ ${settings.name}`);
    const details = encodeURIComponent(`Prenotazione per ${booking.service.name}. Ti aspettiamo!`);
    const location = encodeURIComponent(settings.address);
    const dates = `${formatDate(startDate)}/${formatDate(endDate)}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  if (!booking || booking.status === 'cancelled') {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-6 text-center animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6 text-zinc-400">
           <X size={40} />
        </div>
        <p className="text-zinc-500 mb-6 font-bold text-lg">Questa prenotazione è stata annullata o non esiste.</p>
        <Link to="/" className="bg-amber-600 text-white px-8 py-4 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-200 active:scale-95 transition-all">Torna alla Home</Link>
      </div>
    );
  }

  const handleCancelBooking = () => {
    onUpdateBooking(booking.id, { status: 'cancelled' });
    setIsCancelModalOpen(false);
    showToast("Prenotazione annullata con successo");
  };

  const handleUpdateBooking = () => {
    if (!tempTime) return;
    onUpdateBooking(booking.id, { date: tempDate, time: tempTime });
    setIsEditModalOpen(false);
    showToast("Prenotazione aggiornata correttamente!");
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.name} ${settings.address}`)}`;

  return (
    <div className="max-w-md mx-auto px-4 pt-12 pb-24 min-h-screen bg-zinc-50 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm animate-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-3 p-4 rounded-2xl shadow-2xl border ${
            toast.type === 'success' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-red-500 border-red-400 text-white'
          }`}>
            <CheckCircle2 size={20} className={toast.type === 'success' ? 'text-green-400' : 'text-white'} />
            <p className="text-sm font-bold">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[48px] shadow-2xl shadow-zinc-200 overflow-hidden relative border border-zinc-100 animate-in zoom-in-95 duration-500">
        <div className="bg-zinc-900 p-10 text-center text-white space-y-3">
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
            <CheckCircle className="text-amber-500" size={40} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Posto Riservato!</h1>
          <p className="text-amber-500/80 text-xs font-black uppercase tracking-[0.2em]">Prenotazione Confermata</p>
        </div>

        <div className="p-10 space-y-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Servizio</p>
                <p className="font-black text-lg text-zinc-800">{booking.service.name}</p>
              </div>
              {settings.showPrices && (
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Prezzo</p>
                  <p className="font-black text-lg text-amber-600">€{booking.service.price}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 bg-zinc-50 p-5 rounded-[28px] border border-zinc-100/50">
              <div className="flex-1 flex flex-col items-center gap-1">
                <Calendar size={18} className="text-amber-600" />
                <p className="font-black text-sm text-zinc-700">{booking.date}</p>
              </div>
              <div className="w-px h-10 bg-zinc-200" />
              <div className="flex-1 flex flex-col items-center gap-1">
                <Clock size={18} className="text-amber-600" />
                <p className="font-black text-sm text-zinc-700">{booking.time}</p>
              </div>
            </div>

            {/* Calendar Integration Section */}
            <div className="bg-zinc-50/50 border border-zinc-100 p-6 rounded-[32px] space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <CalendarPlus size={16} className="text-amber-600" />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ricordamelo</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a 
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white border border-zinc-200 py-4 rounded-2xl text-zinc-700 font-black text-[11px] uppercase tracking-wider active:scale-95 transition-all shadow-sm hover:border-amber-200"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-4 h-4" alt="Google" />
                  Google
                </a>
                <button 
                  onClick={handleDownloadICS}
                  className="flex items-center justify-center gap-2 bg-white border border-zinc-200 py-4 rounded-2xl text-zinc-700 font-black text-[11px] uppercase tracking-wider active:scale-95 transition-all shadow-sm hover:border-amber-200"
                >
                  <Download size={14} className="text-zinc-500" />
                  Apple / Outlook
                </button>
              </div>
            </div>

            {/* Quick Actions for User */}
            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 py-4 rounded-[20px] text-zinc-600 font-black text-xs uppercase tracking-widest active:scale-95 transition-all border border-zinc-200"
              >
                <Pencil size={14} /> Modifica
              </button>
              <button 
                onClick={() => setIsCancelModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-red-50 py-4 rounded-[20px] text-red-500 font-black text-xs uppercase tracking-widest active:scale-95 transition-all border border-red-100"
              >
                <Trash2 size={14} /> Annulla
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <a 
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 bg-amber-50/50 p-5 rounded-[28px] border border-amber-100 hover:bg-amber-100/60 transition-colors active:scale-[0.98] group"
              >
                <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 group-hover:bg-amber-200 transition-colors">
                  <MapPin size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-black text-zinc-800 flex items-center gap-2">
                    {settings.name}
                    <Navigation size={12} className="text-amber-500" />
                  </p>
                  <p className="text-xs text-zinc-500 font-medium">{settings.address}</p>
                  <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mt-2">Apri Navigatore &rarr;</p>
                </div>
              </a>

              {settings.phone && (
                <a 
                  href={`tel:${settings.phone}`}
                  className="flex items-center gap-4 bg-zinc-900 p-5 rounded-[28px] text-white hover:bg-zinc-800 transition-colors active:scale-[0.98]"
                >
                  <div className="p-3 bg-white/10 rounded-2xl text-amber-500">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Hai bisogno di noi?</p>
                    <p className="font-black text-base">Chiama il Salone</p>
                  </div>
                </a>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 text-center space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-amber-600 mb-2">
                 <Heart size={18} fill="currentColor" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Grazie di cuore</span>
              </div>
              <h2 className="text-2xl font-black text-zinc-900 leading-tight">
                Grazie per averci scelto, {booking.customerName.split(' ')[0]}!
              </h2>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed px-2">
                Abbiamo ricevuto la tua prenotazione. Prepara il tuo stile, ti aspettiamo con un sorriso e un'attesa che sarà gradita.
              </p>
            </div>

            <div className="bg-zinc-900/5 p-6 rounded-[32px] flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Coffee size={24} className="text-amber-600" />
              </div>
              <p className="text-xs font-bold text-zinc-600 text-left">
                Rilassati, ci prenderemo cura <br/> del tuo look alle <span className="text-zinc-900 font-black">{booking.time}</span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link to="/" className="text-zinc-400 font-black text-[10px] uppercase tracking-[0.3em] hover:text-amber-600 transition-colors">
          &larr; Torna alla home
        </Link>
      </div>

      {/* Cancellation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-zinc-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs rounded-[40px] p-8 relative animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-1">
                <AlertTriangle size={36} />
              </div>
              <h2 className="text-2xl font-black text-zinc-900">Sei sicuro?</h2>
              <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                Stai per annullare il tuo appuntamento. Potrai sempre prenotarne uno nuovo quando preferisci.
              </p>
              <div className="flex w-full gap-3 pt-4">
                <button 
                  onClick={() => setIsCancelModalOpen(false)}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-black text-sm active:scale-95 transition-transform"
                >
                  No, tieni
                </button>
                <button 
                  onClick={handleCancelBooking}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-red-200 active:scale-95 transition-transform"
                >
                  Sì, annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (Simple Date/Time selection) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-zinc-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-8 relative animate-in zoom-in-95 duration-300 shadow-2xl max-h-[85vh] flex flex-col">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-900 bg-zinc-100 p-2 rounded-full transition-colors z-10"
            >
              <X size={20} />
            </button>
            <div className="text-center space-y-2 mb-6 mt-4">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Modifica Orario</h2>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{booking.service.name}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
               <div className="space-y-3">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Scegli Data</p>
                  <input 
                    type="date"
                    value={tempDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setTempDate(e.target.value);
                      setTempTime('');
                    }}
                    className="w-full p-5 rounded-[28px] border-2 border-zinc-50 bg-zinc-50 focus:border-amber-600 outline-none font-black text-base transition-all"
                  />
               </div>

               <div className="space-y-3">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Scegli Orario</p>
                  <div className="grid grid-cols-3 gap-3">
                    {timeSlots.map(time => (
                      <button
                        key={time}
                        onClick={() => setTempTime(time)}
                        className={`py-4 rounded-2xl border-2 text-center font-black transition-all duration-300 ${
                          tempTime === time 
                            ? 'border-amber-600 bg-amber-600 text-white shadow-lg shadow-amber-200' 
                            : 'border-zinc-50 bg-zinc-50 text-zinc-500'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                    {timeSlots.length === 0 && (
                      <p className="col-span-3 text-center py-6 text-zinc-400 font-bold italic text-xs">Purtroppo nessun orario libero.</p>
                    )}
                  </div>
               </div>
            </div>

            <div className="pt-6">
               <button 
                onClick={handleUpdateBooking}
                disabled={!tempTime || (tempDate === booking.date && tempTime === booking.time)}
                className="w-full py-5 bg-zinc-900 text-white rounded-[28px] font-black text-base shadow-xl shadow-zinc-200 active:scale-95 transition-all disabled:opacity-30"
              >
                Salva Modifiche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfirmationView;
