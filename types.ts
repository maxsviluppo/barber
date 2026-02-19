
export enum ServiceType {
  HAIRCUT = 'Taglio',
  BEARD = 'Barba',
  COMBO = 'Taglio & Barba',
  SHAVE = 'Rasatura Completa',
  CUSTOM = 'Altro'
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // minutes
  customInterval?: number; // minutes (optional override for shop-wide slotInterval)
}

export interface ShopSettings {
  name: string;
  address: string;
  phone: string;
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
  slotInterval: number; // minutes
  services: Service[];
  showPrices: boolean;
  smsEnabled: boolean;
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  service: Service;
  date: string; // ISO string
  time: string; // HH:mm
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

export const DEFAULT_SETTINGS: ShopSettings = {
  name: 'Barberia Smart',
  address: 'Via Roma 12, Milano',
  phone: '+39 0123 456789',
  openTime: '09:00',
  closeTime: '19:00',
  slotInterval: 30,
  showPrices: true,
  smsEnabled: true,
  services: [
    { id: '1', name: 'Taglio Classico', price: 25, duration: 30 },
    { id: '2', name: 'Cura Barba', price: 15, duration: 20 },
    { id: '3', name: 'Taglio & Barba', price: 35, duration: 50 },
  ]
};
