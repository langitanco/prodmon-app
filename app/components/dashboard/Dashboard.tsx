'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Order } from '@/types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, AlertCircle, CheckCircle2, Package, AlertTriangle, Share2, Loader2 } from 'lucide-react'; 
import { getDeadlineStatus } from '@/lib/utils';
import { toPng } from 'html-to-image'; 

interface DashboardProps {
  role: string;
  orders: Order[];
  onSelectOrder: (id: string) => void;
}

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444']; 

export default function Dashboard({ role, orders, onSelectOrder }: DashboardProps) {
  
  // State untuk melacak bagian Pie Chart mana yang sedang di-hover
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // --- 1. LOGIKA PENGOLAHAN DATA ---

  // A. Data Grafik Batang (Tren PCS)
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6Months: { name: string; monthIndex: number; year: number; total: number; pcs: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        last6Months.push({
            name: months[d.getMonth()],
            monthIndex: d.getMonth(),
            year: d.getFullYear(),
            total: 0,
            pcs: 0
        });
    }

    orders.forEach(order => {
        const d = new Date(order.tanggal_masuk);
        const item = last6Months.find(m => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
        if (item) {
            item.total += 1;
            item.pcs += order.jumlah;
        }
    });
    return last6Months;
  }, [orders]);

  // B. Data Grafik Lingkaran
  const productionTypeData = useMemo(() => {
    const types: {[key: string]: number} = {};
    orders.forEach(order => {
        const type = order.jenis_produksi || 'Lainnya'; 
        types[type] = (types[type] || 0) + 1;
    });

    return Object.keys(types).map(key => ({
        name: key.toUpperCase(),
        value: types[key]
    }));
  }, [orders]);

  // C. Statistik Ringkasan
  const stats = {
    totalOrders: orders.length,
    totalPcs: orders.reduce((acc, curr) => acc + curr.jumlah, 0),
    warning: orders.filter(o => getDeadlineStatus(o.deadline, o.status) === 'warning').length,
    overdue: orders.filter(o => getDeadlineStatus(o.deadline, o.status) === 'overdue').length,
    trouble: orders.filter(o => o.status === 'Ada Kendala').length, 
  };

  // --- LOGIKA TAMPILAN TENGAH PIE CHART (DINAMIS) ---
  const activeItem = activeIndex !== null ? productionTypeData[activeIndex] : null;
  const centerValue = activeItem ? activeItem.value : stats.totalOrders;
  const centerLabel = activeItem ? activeItem.name : 'TOTAL ORDER';
  const centerColor = activeItem ? COLORS[activeIndex! % COLORS.length] : '#1e293b'; // Warna teks mengikuti slice

  return (
    <div className="space-y-4 md:space-y-6 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
        <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Dashboard Produksi</h2>
            <p className="text-slate-500 text-xs md:text-sm">Ringkasan performa dan analitik produksi.</p>
        </div>
        
        {/* TAMPILAN STATUS */}
        <div className="flex w-full md:w-auto gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {stats.trouble > 0 && (
                <div className="flex-1 md:flex-none justify-center bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-xs font-bold border border-purple-100 flex items-center gap-1.5 shadow-sm md:shadow-none min-w-[100px] animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" /> {stats.trouble} Kendala
                </div>
            )}
            <div className="flex-1 md:flex-none justify-center bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-1.5 shadow-sm md:shadow-none min-w-[90px]">
                <AlertCircle className="w-3.5 h-3.5" /> {stats.overdue} Telat
            </div>
            <div className="flex-1 md:flex-none justify-center bg-orange-50 text-orange-700 px-3 py-2 rounded-lg text-xs font-bold border border-orange-100 flex items-center gap-1.5 shadow-sm md:shadow-none min-w-[90px]">
                <TrendingUp className="w-3.5 h-3.5" /> {stats.warning} Urgent
            </div>
        </div>
      </div>

      {/* SECTION 1: KARTU STATISTIK */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Total Pesanan" value={stats.totalOrders} label="Lifetime" color="bg-blue-50 text-blue-700 border-blue-100" />
        <StatCard title="Total PCS" value={stats.totalPcs} label="Produksi" color="bg-indigo-50 text-indigo-700 border-indigo-100" />
        <StatCard title="On Process" value={orders.filter(o => o.status === 'On Process').length} label="Sedang Jalan" color="bg-yellow-50 text-yellow-700 border-yellow-100" />
        <StatCard title="Selesai" value={orders.filter(o => o.status === 'Selesai').length} label="Completed" color="bg-green-50 text-green-700 border-green-100" />
      </div>

      {/* SECTION 2: GRAFIK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* GRAFIK 1: TREN VOLUME PCS */}
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                    <h3 className="font-bold text-slate-800 text-base md:text-lg flex items-center gap-2">
                        <Package className="w-4 h-4 md:w-5 md:h-5 text-blue-600" /> Tren Volume (PCS)
                    </h3>
                    <p className="text-[10px] md:text-xs text-slate-500">Jumlah item masuk 6 bulan terakhir</p>
                </div>
            </div>
            <div className="h-[200px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                        <RechartsTooltip 
                            cursor={{fill: '#f1f5f9'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                            formatter={(value: number) => [`${value} Pcs`, 'Total']}
                        />
                        <Bar dataKey="pcs" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} name="Total PCS" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* GRAFIK 2: PIE CHART (DIPERBAIKI) */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="mb-2 md:mb-4">
                <h3 className="font-bold text-slate-800 text-base md:text-lg flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 md:w-5 md:h-5 text-purple-600" /> Jenis Produksi
                </h3>
                <p className="text-[10px] md:text-xs text-slate-500">Distribusi tipe order keseluruhan</p>
            </div>
            <div className="flex-1 min-h-[200px] md:min-h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={productionTypeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            onMouseEnter={(_, index) => setActiveIndex(index)} // SET INDEX SAAT HOVER
                            onMouseLeave={() => setActiveIndex(null)} // RESET SAAT MOUSE KELUAR
                        >
                            {productionTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                        </Pie>
                        {/* TOOLTIP DIHAPUS agar tidak menutupi tengah. Keterangan muncul di tengah secara dinamis */}
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                    </PieChart>
                </ResponsiveContainer>
                
                {/* TEXT TENGAH DINAMIS */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-6">
                    <span 
                        className="text-2xl md:text-3xl font-extrabold transition-colors duration-300"
                        style={{ color: centerColor }}
                    >
                        {centerValue}
                    </span>
                    <p className="text-[8px] md:text-[10px] text-slate-400 uppercase font-bold transition-all duration-300">
                        {centerLabel}
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* SECTION 3: LIST PERLU TINDAKAN */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-center">
             <h3 className="font-bold text-slate-800 text-sm md:text-base">Perlu Tindakan Segera</h3>
        </div>
        <div className="divide-y divide-slate-50">
             {orders
                .filter(o => {
                    const deadlineStatus = getDeadlineStatus(o.deadline, o.status);
                    const hasUnresolvedKendala = o.kendala && o.kendala.some(k => !k.isResolved);
                    return deadlineStatus === 'overdue' || deadlineStatus === 'warning' || hasUnresolvedKendala;
                })
                .sort((a, b) => {
                    const aHasUnresolvedKendala = a.kendala && a.kendala.some(k => !k.isResolved);
                    const bHasUnresolvedKendala = b.kendala && b.kendala.some(k => !k.isResolved);
                    if (aHasUnresolvedKendala && !bHasUnresolvedKendala) return -1;
                    if (!aHasUnresolvedKendala && bHasUnresolvedKendala) return 1;
                    const aDeadline = getDeadlineStatus(a.deadline, a.status);
                    const bDeadline = getDeadlineStatus(b.deadline, b.status);
                    if (aDeadline === 'overdue' && bDeadline !== 'overdue') return -1;
                    if (aDeadline !== 'overdue' && bDeadline === 'overdue') return 1;
                    return 0; 
                })
                .slice(0, 5) 
                .map(o => (
                    <ActionRow key={o.id} order={o} onSelectOrder={onSelectOrder} />
                ))}
             
             {orders.filter(o => ['overdue', 'warning'].includes(getDeadlineStatus(o.deadline, o.status)) || (o.kendala && o.kendala.some(k => !k.isResolved))).length === 0 && (
                 <div className="p-6 md:p-8 text-center flex flex-col items-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 mb-2 text-green-400 opacity-50" />
                    <p className="text-xs md:text-sm">Aman! Tidak ada kendala, telat, atau urgent.</p>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SUB-COMPONENT: ACTION ROW (FIX WRAPPING & SHARE)
// ==========================================
function ActionRow({ order, onSelectOrder }: { order: Order, onSelectOrder: (id: string) => void }) {
    const ticketRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);

    const deadlineStatus = getDeadlineStatus(order.deadline, order.status);
    const unresolvedKendala = order.kendala 
        ? order.kendala.filter(k => !k.isResolved).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        : [];
    const latestKendalaNote = unresolvedKendala.length > 0 ? unresolvedKendala[0].notes : null;

    let badgeClass = '';
    let badgeLabel = '';
    let indicatorColor = '';
    
    if (latestKendalaNote) {
        badgeClass = 'bg-purple-100 text-purple-700 border-purple-200';
        badgeLabel = 'KENDALA';
        indicatorColor = 'bg-purple-600';
    } else if (deadlineStatus === 'overdue') {
        badgeClass = 'bg-red-50 text-red-600 border-red-100';
        badgeLabel = 'TELAT';
        indicatorColor = 'bg-red-500';
    } else {
        badgeClass = 'bg-orange-50 text-orange-600 border-orange-100';
        badgeLabel = 'URGENT';
        indicatorColor = 'bg-orange-400';
    }

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation(); 
        if (!ticketRef.current) return;
        
        setIsSharing(true);
        try {
            const dataUrl = await toPng(ticketRef.current, { 
                cacheBust: true, 
                backgroundColor: '#ffffff', 
                pixelRatio: 2 
            });
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `kendala-${order.kode_produksi}.png`, { type: 'image/png' });

            if (navigator.share) {
                await navigator.share({
                    title: 'Info Produksi',
                    text: `Cek kendala pada: ${order.nama_pemesan} (${order.kode_produksi})`,
                    files: [file],
                });
            } else {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `kendala-${order.kode_produksi}.png`;
                link.click();
            }
        } catch (err) {
            console.error('Gagal membuat gambar:', err);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div 
            className="group p-3 md:p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer relative" 
            onClick={() => onSelectOrder(order.id)}
        >
            {/* AREA TIKET */}
            <div 
                ref={ticketRef} 
                className="flex flex-1 items-center gap-3 bg-white pr-4 py-2 rounded-md h-full"
            >
                {/* Indicator Bar - Menggunakan h-auto self-stretch agar mengikuti tinggi konten */}
                <div className={`w-1.5 self-stretch rounded-full ${indicatorColor} flex-shrink-0`}></div>
                
                {/* Konten Text - min-w-0 agar flex tidak overflow */}
                <div className="flex-1 min-w-0 py-1"> 
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 text-xs md:text-sm line-clamp-1">{order.nama_pemesan}</p>
                        {latestKendalaNote && <AlertTriangle className="w-3 h-3 text-purple-600 flex-shrink-0" />}
                    </div>
                    
                    {latestKendalaNote ? (
                        // FIX TEXT WRAPPING: line-clamp dihapus, break-words ditambahkan
                        <p className="text-[10px] md:text-xs text-red-500 font-semibold mt-0.5 leading-relaxed break-words whitespace-normal">
                            Kendala: {latestKendalaNote}
                        </p>
                    ) : (
                        <p className="text-[10px] md:text-xs text-slate-500 font-mono mt-0.5">{order.kode_produksi}</p>
                    )}
                </div>

                <div className="text-right pl-2 flex-shrink-0 self-start">
                    <span className={`text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded border ${badgeClass}`}>
                        {badgeLabel}
                    </span>
                    <p className="text-[9px] md:text-[10px] text-slate-400 mt-1">{new Date(order.deadline).toLocaleDateString('id-ID')}</p>
                </div>
            </div>

            <button 
                onClick={handleShare}
                disabled={isSharing}
                className="ml-2 p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all flex-shrink-0 self-center"
            >
                {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
            </button>
        </div>
    );
}

function PieChartIcon(props: any) {
    return <PieIcon {...props} />;
}

function StatCard({ title, value, label, color }: { title: string, value: number, label: string, color: string }) {
    return (
        <div className={`p-3 md:p-4 rounded-xl border ${color} flex flex-col justify-between h-24 md:h-32 shadow-sm transition-transform active:scale-95 md:active:scale-100`}>
            <span className="text-[9px] md:text-[10px] uppercase font-bold opacity-70 tracking-wider truncate">{title}</span>
            <div>
                <span className="text-2xl md:text-4xl font-extrabold block md:inline">{value}</span>
                <span className="text-[9px] md:text-[10px] opacity-80 block md:inline md:ml-1">{label}</span>
            </div>
        </div>
    );
}