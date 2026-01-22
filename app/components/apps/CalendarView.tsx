// app/components/apps/CalendarView.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO 
} from 'date-fns';
import { id } from 'date-fns/locale'; 
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Package, X, Clock, User, Plus, Trash2, Check, Loader2, MapPin, AlignLeft 
} from 'lucide-react';
import { Order } from '@/types';
import { getStatusColor } from '@/lib/utils';

// 🟢 UPDATE TIPE DATA
interface CalendarEvent {
  id: string;
  title: string;
  date: string;       // YYYY-MM-DD
  event_time?: string; // HH:mm (Bisa kosong)
  location?: string;   // Tempat (Bisa kosong)
  color: string; 
}

interface CalendarViewProps {
  orders: Order[];
  onSelectOrder: (orderId: string) => void;
}

const EVENT_COLORS = [
  { name: 'Merah', value: 'bg-red-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Kuning', value: 'bg-amber-500' },
  { name: 'Hijau', value: 'bg-emerald-500' },
  { name: 'Biru', value: 'bg-blue-500' },
  { name: 'Ungu', value: 'bg-purple-500' },
  { name: 'Pink', value: 'bg-pink-500' },
  { name: 'Abu', value: 'bg-slate-500' },
];

export default function CalendarView({ orders, onSelectOrder }: CalendarViewProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);

  // 🟢 FORM STATE (Updated)
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Input Fields
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventColor, setNewEventColor] = useState(EVENT_COLORS[4].value); // Default Biru

  // Fetch Events
  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('event_time', { ascending: true }); // Urutkan berdasarkan jam
      
      if (data) setEvents(data);
    } catch (err) {
      console.error('Err fetch events:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const resetDate = () => setCurrentDate(new Date());

  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const handleDateClick = (day: Date, dayOrders: Order[]) => {
    // Filter dan urutkan agenda berdasarkan jam
    const dayEvents = events
      .filter(e => isSameDay(parseISO(e.date), day))
      .sort((a, b) => (a.event_time || '').localeCompare(b.event_time || ''));

    setSelectedDate(day);
    setSelectedOrders(dayOrders);
    setSelectedDayEvents(dayEvents);
    setIsModalOpen(true);
    setIsAddingEvent(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setSelectedOrders([]);
    setSelectedDayEvents([]);
    setIsAddingEvent(false);
  };

  const resetForm = () => {
    setNewEventTitle('');
    setNewEventTime('');
    setNewEventLocation('');
    setNewEventColor(EVENT_COLORS[4].value);
    setIsAddingEvent(false);
  };

  // 🟢 SIMPAN KE SUPABASE (Updated fields)
  const handleAddEvent = async () => {
    if (!newEventTitle.trim() || !selectedDate) return;
    setIsSaving(true);

    const payload = {
      title: newEventTitle,
      date: format(selectedDate, 'yyyy-MM-dd'),
      event_time: newEventTime || null, // Kirim null jika kosong
      location: newEventLocation || null,
      color: newEventColor
    };

    const { data, error } = await supabase
      .from('calendar_events')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      const updatedList = [...events, data];
      setEvents(updatedList);
      
      // Update tampilan modal langsung & urutkan ulang
      const updatedDayEvents = [...selectedDayEvents, data].sort((a, b) => 
        (a.event_time || '').localeCompare(b.event_time || '')
      );
      setSelectedDayEvents(updatedDayEvents);
      
      resetForm();
    } else {
      alert('Gagal menyimpan agenda.');
    }
    setIsSaving(false);
  };

  const handleDeleteEvent = async (id: string) => {
    const prevEvents = [...events];
    const prevSelected = [...selectedDayEvents];

    setEvents(events.filter(e => e.id !== id));
    setSelectedDayEvents(selectedDayEvents.filter(e => e.id !== id));

    const { error } = await supabase.from('calendar_events').delete().eq('id', id);

    if (error) {
      setEvents(prevEvents);
      setSelectedDayEvents(prevSelected);
      alert('Gagal menghapus.');
    }
  };

  // Helper Warna Status Order (Mobile Dots)
  const getDotColor = (status: string) => {
    switch (status) {
      case 'Selesai': return 'bg-green-600';
      case 'Ada Kendala': return 'bg-red-600';
      case 'Pesanan Masuk': return 'bg-blue-600';
      case 'Kirim': return 'bg-cyan-600';
      case 'On Process': return 'bg-yellow-500';
      case 'Finishing': return 'bg-orange-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="flex flex-col w-full p-4 md:p-0 mb-20 md:mb-0 h-auto md:h-[calc(100vh-120px)]">
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-2xl shadow-xl md:shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-auto md:h-full">
        
        {/* HEADER */}
        <div className="flex-none flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 hidden md:block">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 capitalize leading-none">
                {format(currentDate, 'MMMM yyyy', { locale: id })}
              </h2>
              <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium hidden md:block">
                {isLoadingEvents ? 'Memuat...' : 'Jadwal Produksi & Agenda'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button onClick={prevMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition shadow-sm text-slate-600 dark:text-slate-300">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={resetDate} className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-md transition shadow-sm">
              Hari Ini
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition shadow-sm text-slate-600 dark:text-slate-300">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* NAMA HARI */}
        <div className="flex-none grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
            <div key={day} className="py-3 text-center text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* GRID TANGGAL */}
        <div className="flex-none md:flex-1 h-auto md:h-full md:overflow-y-auto custom-scrollbar bg-slate-100 dark:bg-slate-800">
          <div className="grid grid-cols-7 gap-[1px] border-b border-slate-200 dark:border-slate-800">
            {daysInMonth.map((day, idx) => {
              const dayOrders = orders.filter(o => {
                if (!o.deadline) return false;
                return isSameDay(parseISO(o.deadline), day);
              });
              
              // Filter agenda & urutkan jam
              const dayEvents = events
                .filter(e => isSameDay(parseISO(e.date), day))
                .sort((a, b) => (a.event_time || '').localeCompare(b.event_time || ''));

              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div 
                  key={idx}
                  onClick={() => handleDateClick(day, dayOrders)}
                  className={`
                    relative p-1 md:p-2 flex flex-col gap-1 transition-colors cursor-pointer group outline-none
                    min-h-[5.5rem] md:min-h-[140px] items-center md:items-stretch
                    aspect-auto
                    ${isCurrentMonth 
                        ? 'bg-white dark:bg-slate-900 hover:bg-blue-50/30 dark:hover:bg-blue-900/10' 
                        : 'bg-slate-50/50 dark:bg-slate-900/40 text-slate-400'}
                  `}
                >
                  <div className="flex justify-center md:justify-between items-center w-full mt-1 md:mt-0">
                    <span className={`
                      text-xs md:text-sm font-semibold w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full transition-all
                      ${isToday 
                        ? 'bg-blue-600 text-white shadow-md scale-110' 
                        : isCurrentMonth ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}
                    `}>
                      {format(day, 'd')}
                    </span>
                    {(dayOrders.length > 0 || dayEvents.length > 0) && (
                      <span className="hidden md:block text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {dayOrders.length + dayEvents.length}
                      </span>
                    )}
                  </div>
                  
                  {/* DESKTOP LIST */}
                  <div className="hidden md:flex flex-col gap-1 mt-1 w-full">
                    {/* Event List dengan Jam */}
                    {dayEvents.map(event => (
                      <div key={event.id} className={`px-2 py-1 rounded-[4px] text-[10px] font-bold truncate shadow-sm text-white ${event.color} flex items-center gap-1`}>
                        {event.event_time && <span className="font-mono text-[9px] opacity-90">{event.event_time}</span>}
                        <span className="truncate">{event.title}</span>
                      </div>
                    ))}
                    
                    {/* Order List */}
                    {dayOrders.slice(0, 3).map(order => (
                      <div key={order.id} className={`px-2 py-1 rounded-[4px] border-l-[3px] text-[10px] font-bold truncate opacity-90 shadow-sm text-left ${getStatusColor(order.status)}`}>
                        {order.nama_pemesan}
                      </div>
                    ))}
                    {dayOrders.length > 3 && (
                      <div className="text-[9px] text-center text-slate-400 font-medium pt-1">
                        + {dayOrders.length - 3} order
                      </div>
                    )}
                  </div>

                  {/* MOBILE DOTS */}
                  <div className="flex md:hidden flex-wrap justify-center content-start gap-1 mt-1.5 px-0.5 w-full">
                     {dayEvents.map((event) => (
                        <div key={event.id} className={`w-1.5 h-1.5 rounded-full shadow-sm ${event.color}`}/>
                     ))}
                     {dayOrders.slice(0, 6).map((order, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full shadow-sm ${getDotColor(order.status)}`}/>
                     ))}
                     {(dayOrders.length + dayEvents.length) > 6 && (
                        <span className="text-[6px] text-slate-400 leading-none self-center">+</span>
                     )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🟢 MODAL POPUP */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 transition-opacity" onClick={closeModal}></div>
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 rounded-t-2xl">
              <div>
                <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white capitalize leading-tight">
                  {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })}
                </h3>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {selectedOrders.length} Pesanan • {selectedDayEvents.length} Agenda
                </p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 custom-scrollbar bg-slate-50 dark:bg-black/20">
              
              {/* 🟢 FORM TAMBAH AGENDA (Lebih Lengkap) */}
              {isAddingEvent ? (
                <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm animate-in slide-in-from-top-2">
                   <div className="flex items-center justify-between mb-3">
                     <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                       <Plus className="w-4 h-4 text-blue-500"/> Agenda Baru
                     </h4>
                     <button onClick={resetForm} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                       <X className="w-3.5 h-3.5 text-slate-400"/>
                     </button>
                   </div>
                   
                   {/* Input Judul */}
                   <input 
                      type="text" 
                      placeholder="Judul agenda"
                      className="w-full mb-3 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none font-reguler"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      autoFocus
                   />
                   
                   {/* Input Waktu & Lokasi */}
                   <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Clock className="w-4 h-4 text-slate-400"/>
                        </div>
                        <input 
                          type="time" 
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={newEventTime}
                          onChange={(e) => setNewEventTime(e.target.value)}
                        />
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="w-4 h-4 text-slate-400"/>
                        </div>
                        <input 
                          type="text" 
                          placeholder="Lokasi"
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none truncate"
                          value={newEventLocation}
                          onChange={(e) => setNewEventLocation(e.target.value)}
                        />
                      </div>
                   </div>

                   {/* Pilihan Warna */}
                   <div className="mb-4">
                      <p className="text-[10px] text-slate-500 mb-2 uppercase font-bold tracking-wider">Label Warna</p>
                      <div className="flex gap-2 flex-wrap">
                        {EVENT_COLORS.map((c) => (
                           <button 
                             key={c.value}
                             onClick={() => setNewEventColor(c.value)}
                             className={`w-6 h-6 rounded-full ${c.value} transition-transform hover:scale-110 flex items-center justify-center ${newEventColor === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                           >
                             {newEventColor === c.value && <Check className="w-3 h-3 text-white"/>}
                           </button>
                        ))}
                      </div>
                   </div>

                   <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-700">
                      <button onClick={handleAddEvent} disabled={isSaving} className="w-full py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm flex items-center justify-center gap-2">
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Simpan Agenda'}
                      </button>
                   </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAddingEvent(true)}
                  className="w-full mb-5 py-2.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:bg-white hover:border-blue-400 hover:text-blue-500 dark:hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-4 h-4"/> Tambah Agenda Baru
                </button>
              )}

              {/* 🟢 LIST DISPLAY (Updated UI) */}
              <div className="space-y-6">
                
                {/* Agenda Section */}
                {selectedDayEvents.length > 0 && (
                  <div>
                     <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <AlignLeft className="w-3 h-3"/> Agenda Kegiatan
                     </h5>
                     <div className="space-y-2">
                       {selectedDayEvents.map((event) => (
                          <div key={event.id} className="group flex items-start gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 transition-colors">
                             {/* Warna Bar Samping */}
                             <div className={`w-1 self-stretch rounded-full ${event.color} flex-shrink-0`}></div>
                             
                             <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{event.title}</h4>
                                {(event.event_time || event.location) && (
                                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {event.event_time && (
                                      <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {event.event_time}</span>
                                    )}
                                    {event.location && (
                                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {event.location}</span>
                                    )}
                                  </div>
                                )}
                             </div>
                             
                             <button onClick={() => handleDeleteEvent(event.id)} className="text-slate-300 hover:text-red-500 transition p-1 opacity-0 group-hover:opacity-100">
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                       ))}
                     </div>
                  </div>
                )}

                {/* Pesanan Section */}
                {selectedOrders.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <Package className="w-3 h-3"/> Deadline Produksi
                    </h5>
                    <div className="space-y-3">
                      {selectedOrders.map((order) => (
                        <div 
                          key={order.id}
                          onClick={() => { onSelectOrder(order.id); closeModal(); }}
                          className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-3 cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500">
                              {order.kode_produksi?.split('-').pop() || '#???'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {order.nama_pemesan}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span>{order.jumlah} pcs</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>{order.jenis_produksi}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {selectedDayEvents.length === 0 && selectedOrders.length === 0 && !isAddingEvent && (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 opacity-60">
                    <Clock className="w-12 h-12 mb-3 stroke-1" />
                    <p className="text-sm font-medium">Tidak ada kegiatan hari ini</p>
                  </div>
                )}
              </div>

            </div>
            
            {/* Footer */}
            <div className="p-3 md:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl flex justify-end">
              <button onClick={closeModal} className="px-5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}