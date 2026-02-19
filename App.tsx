
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import UserBookingView from './views/UserBookingView';
import AdminDashboardView from './views/AdminDashboardView';
import AdminSettingsView from './views/AdminSettingsView';
import ConfirmationView from './views/ConfirmationView';
import { Booking, ShopSettings, DEFAULT_SETTINGS } from './types';
import { Scissors, LayoutDashboard, Settings, User, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';

const Header: React.FC<{ settings: ShopSettings }> = ({ settings }) => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <header className={`sticky top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 shadow-md transition-colors duration-300 ${
      isAdminPath ? 'bg-zinc-900 text-white' : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
    }`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
          <Scissors size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight leading-none uppercase">{settings.name}</h1>
          <p className="text-[10px] font-bold opacity-70 tracking-widest uppercase">
            {isAdminPath ? 'Pannello Admin' : 'Booking Online'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <User size={16} />
        </div>
      </div>
    </header>
  );
};

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 flex justify-around items-center h-16 safe-area-bottom z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <button 
        onClick={() => navigate('/')}
        className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive('/') ? 'text-amber-600 scale-110' : 'text-zinc-400'}`}
      >
        <Scissors size={22} strokeWidth={isActive('/') ? 2.5 : 2} />
        <span className="text-[9px] font-bold uppercase tracking-wider">Prenota</span>
      </button>
      <button 
        onClick={() => navigate('/admin')}
        className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive('/admin') ? 'text-zinc-900 scale-110' : 'text-zinc-400'}`}
      >
        <LayoutDashboard size={22} strokeWidth={isActive('/admin') ? 2.5 : 2} />
        <span className="text-[9px] font-bold uppercase tracking-wider">Agenda</span>
      </button>
      <button 
        onClick={() => navigate('/admin/settings')}
        className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive('/admin/settings') ? 'text-zinc-900 scale-110' : 'text-zinc-400'}`}
      >
        <Settings size={22} strokeWidth={isActive('/admin/settings') ? 2.5 : 2} />
        <span className="text-[9px] font-bold uppercase tracking-wider">Config</span>
      </button>
    </nav>
  );
};

const App: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('barber_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<ShopSettings>(() => {
    const saved = localStorage.getItem('barber_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const notifiedBookingsRef = React.useRef<Set<string>>(new Set());

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // Check for upcoming appointments every minute
  useEffect(() => {
    const checkUpcomingAppointments = () => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;

      const now = new Date();
      const upcomingThreshold = 30 * 60 * 1000; // 30 minutes

      bookings.forEach(booking => {
        if (booking.status === 'cancelled' || booking.status === 'completed') return;
        if (notifiedBookingsRef.current.has(booking.id)) return;

        try {
          const [year, month, day] = booking.date.split('-').map(Number);
          const [hours, minutes] = booking.time.split(':').map(Number);
          const bookingTime = new Date(year, month - 1, day, hours, minutes);
          
          const timeDiff = bookingTime.getTime() - now.getTime();

          if (timeDiff > 0 && timeDiff <= upcomingThreshold) {
            new Notification("Promemoria Appuntamento", {
              body: `L'appuntamento di ${booking.customerName} per ${booking.service.name} è tra meno di 30 minuti (${booking.time}).`,
              icon: '/vite.svg', // Fallback icon
              tag: `booking-${booking.id}` // Prevent duplicate notifications on some platforms
            });
            
            notifiedBookingsRef.current.add(booking.id);
          }
        } catch (e) {
          console.error("Error parsing booking date:", e);
        }
      });
    };

    const intervalId = setInterval(checkUpcomingAppointments, 60000); // Check every minute
    checkUpcomingAppointments(); // Check immediately

    return () => clearInterval(intervalId);
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('barber_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('barber_settings', JSON.stringify(settings));
  }, [settings]);

  const sendSMS = async (booking: Booking) => {
    if (!settings.smsEnabled) return;

    // Simulation of an SMS API call
    console.log(`[SMS Gateway] Sending SMS to ${booking.customerPhone}...`);
    console.log(`Message: Ciao ${booking.customerName}, la tua prenotazione per ${booking.service.name} il ${booking.date} alle ${booking.time} è confermata!`);
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    showToast(`SMS di conferma inviato a ${booking.customerPhone}`, 'info');
  };

  const addBooking = (booking: Booking) => {
    setBookings(prev => [...prev, booking]);
    
    // Send simulated SMS
    sendSMS(booking);

    // Native Browser Notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Prenotazione Confermata!", { 
        body: `Ciao ${booking.customerName}, il tuo appuntamento per ${booking.service.name} è confermato alle ${booking.time}.`,
      });
    }
  };

  const updateBooking = (id: string, updates: Partial<Booking>) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    if (updates.date || updates.time) {
      const updated = bookings.find(b => b.id === id);
      if (updated) sendSMS({...updated, ...updates});
    }
  };

  const removeBooking = (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  return (
    <HashRouter>
      <div className="min-h-screen bg-zinc-50 pb-20 relative">
        {/* Global Toast Notification */}
        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-sm animate-in slide-in-from-top-4 duration-500">
            <div className={`flex items-center gap-4 p-5 rounded-[24px] shadow-2xl border ${
              toast.type === 'success' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-amber-600 border-amber-500 text-white'
            }`}>
              {toast.type === 'success' ? (
                <CheckCircle2 size={24} className="text-green-400 shrink-0" />
              ) : (
                <MessageSquare size={24} className="text-white shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">Notifica Sistema</p>
                <p className="text-xs font-black leading-tight">{toast.message}</p>
              </div>
            </div>
          </div>
        )}

        <Header settings={settings} />
        <Routes>
          <Route path="/" element={<UserBookingView onBooking={addBooking} settings={settings} bookings={bookings} />} />
          <Route path="/admin" element={<AdminDashboardView bookings={bookings} onUpdateBooking={updateBooking} onDelete={removeBooking} settings={settings} />} />
          <Route path="/admin/settings" element={<AdminSettingsView settings={settings} onUpdateSettings={setSettings} />} />
          <Route path="/confirmation/:id" element={<ConfirmationView bookings={bookings} settings={settings} onUpdateBooking={updateBooking} onDeleteBooking={removeBooking} />} />
        </Routes>
        <Navigation />
      </div>
    </HashRouter>
  );
};

export default App;
