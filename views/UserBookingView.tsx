
import React, { useState, useMemo } from 'react';
import { ShopSettings, Service, Booking } from '../types';
import { Calendar, Clock, User, Phone, CheckCircle2, ChevronRight, MapPin, Scissors } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserBookingViewProps {
  onBooking: (booking: Booking) => void;
  settings: ShopSettings;
  bookings: Booking[];
}

const UserBookingView: React.FC<UserBookingViewProps> = ({ onBooking, settings, bookings }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const timeSlots = useMemo(() => {
    const slots: { time: string; isPast: boolean; isBooked: boolean }[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isToday = selectedDate === todayStr;

    // Get list of booked times for the current selected date
    const bookedTimes = new Set(
      bookings
        .filter(b => b.date === selectedDate && b.status !== 'cancelled')
        .map(b => b.time)
    );

    const [startH, startM] = settings.openTime.split(':').map(Number);
    const [endH, endM] = settings.closeTime.split(':').map(Number);
    
    let cursor = new Date();
    cursor.setHours(startH, startM, 0, 0);
    
    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    // Determine interval: use service-specific interval if set, otherwise global
    const interval = (selectedService?.customInterval && selectedService.customInterval > 0) 
      ? selectedService.customInterval 
      : settings.slotInterval;

    while (cursor < end) {
      const timeStr = cursor.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      
      let isPast = false;
      if (isToday) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const cursorMinutes = cursor.getHours() * 60 + cursor.getMinutes();
        if (cursorMinutes <= currentMinutes + 10) {
          isPast = true;
        }
      }

      const isBooked = bookedTimes.has(timeStr);

      slots.push({
        time: timeStr,
        isPast,
        isBooked
      });
      
      cursor.setMinutes(cursor.getMinutes() + interval);
    }
    return slots;
  }, [settings.openTime, settings.closeTime, settings.slotInterval, selectedDate, bookings, selectedService]);

  const handleBooking = () => {
    if (!selectedService || !selectedTime || !customerName || !customerPhone) return;

    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      customerName,
      customerPhone,
      service: selectedService,
      date: selectedDate,
      time: selectedTime,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    onBooking(newBooking);
    navigate(`/confirmation/${newBooking.id}`);
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-20">
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div 
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-amber-600 shadow-sm' : 'bg-zinc-200'}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
              <CheckCircle2 className="text-amber-600" size={22} />
              Servizi
            </h2>
            <div className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Step 1/3</div>
          </div>
          <div className="grid gap-3">
            {settings.services.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={`p-5 rounded-[28px] border-2 text-left transition-all duration-300 active:scale-[0.98] ${
                  selectedService?.id === service.id 
                  ? 'border-amber-600 bg-amber-50 shadow-lg shadow-amber-100 animate-selected-pop' 
                  : 'border-white bg-white shadow-sm hover:border-zinc-200 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`font-black text-lg ${selectedService?.id === service.id ? 'text-amber-900' : 'text-zinc-900'}`}>{service.name}</p>
                    <div className="flex gap-2 mt-0.5">
                       <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{service.duration} MINUTI</p>
                       {service.customInterval && (
                         <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">• Slot ogni {service.customInterval}m</p>
                       )}
                    </div>
                  </div>
                  {settings.showPrices && (
                    <div className={`px-4 py-2 rounded-2xl font-black text-lg ${selectedService?.id === service.id ? 'bg-amber-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                      €{service.price}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          <button
            disabled={!selectedService}
            onClick={() => {
              setSelectedTime(''); // Reset time when service changes just in case
              setStep(2);
            }}
            className="w-full bg-zinc-900 text-white py-5 rounded-[28px] font-black text-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-50 transition-all active:scale-95 shadow-xl shadow-zinc-200"
          >
            Scegli Data e Ora <ChevronRight size={22} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                <Calendar className="text-amber-600" size={22} />
                Quando?
              </h2>
              <div className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Step 2/3</div>
            </div>
            <input 
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-5 rounded-[28px] border-2 border-white bg-white shadow-sm focus:border-amber-600 outline-none font-black text-base md:text-lg transition-all"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                <Clock className="text-amber-600" size={22} />
                Orario
              </h2>
              {selectedService?.customInterval && (
                <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-widest">
                  Griglia: {selectedService.customInterval} min
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {timeSlots.some(slot => !slot.isPast && !slot.isBooked) ? (
                timeSlots.map(({ time, isPast, isBooked }) => {
                  const isDisabled = isPast || isBooked;
                  return (
                    <button
                      key={time}
                      disabled={isDisabled}
                      onClick={() => !isDisabled && setSelectedTime(time)}
                      className={`py-4 rounded-2xl border-2 text-center font-black transition-all duration-300 relative ${
                        selectedTime === time 
                        ? 'border-amber-600 bg-amber-600 text-white shadow-lg shadow-amber-200 animate-selected-pop z-10' 
                        : isDisabled
                          ? 'border-zinc-100 bg-zinc-100 text-zinc-300 cursor-not-allowed opacity-50'
                          : 'border-white bg-white text-zinc-500 shadow-sm hover:border-zinc-200 active:scale-[0.95]'
                      }`}
                    >
                      {time}
                      {isBooked && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-[7px] text-white px-1.5 py-0.5 rounded-full font-black uppercase">Full</span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="col-span-3 py-10 bg-white rounded-[32px] text-center border-2 border-dashed border-zinc-100">
                  <p className="text-zinc-400 font-bold italic">Nessun orario disponibile per oggi.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-white border border-zinc-200 py-5 rounded-[28px] font-black text-zinc-600 active:scale-95 transition-transform"
            >
              Indietro
            </button>
            <button
              disabled={!selectedTime}
              onClick={() => setStep(3)}
              className="flex-[2] bg-zinc-900 text-white py-5 rounded-[28px] font-black text-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 shadow-xl shadow-zinc-200"
            >
              Dati Contatto <ChevronRight size={22} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
              <User className="text-amber-600" size={22} />
              Chi sei?
            </h2>
            <div className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Step 3/3</div>
          </div>
          
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-amber-600 transition-colors">
                <User size={20} />
              </div>
              <input 
                type="text"
                placeholder="Nome Completo"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-14 pr-6 py-5 rounded-[28px] border-2 border-white bg-white shadow-sm focus:border-amber-600 outline-none font-bold placeholder:text-zinc-300 text-base transition-all"
              />
            </div>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-amber-600 transition-colors">
                <Phone size={20} />
              </div>
              <input 
                type="tel"
                placeholder="Telefono"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full pl-14 pr-6 py-5 rounded-[28px] border-2 border-white bg-white shadow-sm focus:border-amber-600 outline-none font-bold placeholder:text-zinc-300 text-base transition-all"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[32px] text-white shadow-xl shadow-amber-100 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Dettaglio Appuntamento</p>
              <h3 className="text-2xl font-black mb-1">{selectedService?.name}</h3>
              <div className="flex items-center gap-4 text-sm font-bold opacity-90 mt-4">
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                  <Calendar size={14} /> {selectedDate}
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                  <Clock size={14} /> {selectedTime}
                </div>
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 text-white/10 transform rotate-12">
               <Scissors size={120} />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-white border border-zinc-200 py-5 rounded-[28px] font-black text-zinc-600 active:scale-95 transition-transform"
            >
              Back
            </button>
            <button
              disabled={!customerName || !customerPhone}
              onClick={handleBooking}
              className="flex-[2] bg-amber-600 text-white py-5 rounded-[28px] font-black text-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 shadow-xl shadow-amber-200"
            >
              Conferma Ora
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBookingView;
