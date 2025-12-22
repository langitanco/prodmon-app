// app/components/dashboard/Dashboard.tsx - PART 1
// VERSI ULTRA OPTIMASI - Komponen Utama & Logic

'use client';

import React, { useMemo, useState, useCallback, memo } from 'react';
import { Order } from '@/types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, AlertCircle, CheckCircle2, Package, AlertTriangle, Share2, Loader2, Clock } from 'lucide-react'; 

import { getDeadlineStatus, formatDate } from '@/lib/utils';
import { toPng } from 'html-to-image';

interface DashboardProps {
  role: string;
  orders: Order[];
  onSelectOrder: (id: string) => void;
}

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444']; 

type ActionItem = {
    uniqueKey: string;
    order: Order;
    type: 'KENDALA' | 'REVISI' | 'TELAT' | 'URGENT';
    detail: string;
    timestamp?: string;
};

export default function Dashboard({ role, orders, onSelectOrder }: DashboardProps) {
  
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // OPTIMASI 1: Data Grafik dengan useMemo
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

  // OPTIMASI 2: Stats dengan useMemo
  const stats = useMemo(() => ({
    totalOrders: orders.length,
    totalPcs: orders.reduce((acc, curr) => acc + curr.jumlah, 0),
    warning: orders.filter(o => getDeadlineStatus(o.deadline, o.status) === 'warning').length,
    overdue: orders.filter(o => getDeadlineStatus(o.deadline, o.status) === 'overdue').length,
    trouble: orders.filter(o => o.kendala && o.kendala.some(k => !k.isResolved)).length,
    onProcess: orders.filter(o => o.status === 'On Process').length,
    selesai: orders.filter(o => o.status === 'Selesai').length,
  }), [orders]);

  // OPTIMASI 3: Action Items
  const actionItems: ActionItem[] = useMemo(() => {
    const items: ActionItem[] = [];

    orders.forEach(order => {
        const deadlineStatus = getDeadlineStatus(order.deadline, order.status);
        
        const activeKendala = order.kendala ? order.kendala.filter(k => !k.isResolved) : [];
        if (activeKendala.length > 0) {
            const latest = activeKendala.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
            items.push({
                uniqueKey: `${order.id}-kendala`,
                order: order,
                type: 'KENDALA',
                detail: latest.notes,
                timestamp: latest.timestamp
            });
        }

        if (order.status === 'Revisi') {
             items.push({
                uniqueKey: `${order.id}-revisi`,
                order: order,
                type: 'REVISI',
                detail: order.finishing_qc?.notes || 'Perbaikan QC diperlukan'
            });
        }

        if (deadlineStatus === 'overdue') {
             items.push({
                uniqueKey: `${order.id}-telat`,
                order: order,
                type: 'TELAT',
                detail: `Telat ${formatDateDiff(order.deadline)} hari`
            });
        }
        else if (deadlineStatus === 'warning') {
             items.push({
                uniqueKey: `${order.id}-urgent`,
                order: order,
                type: 'URGENT',
                detail: 'Deadline < 2 hari'
            });
        }
    });

    return items.sort((a, b) => {
        const priority = { 'KENDALA': 4, 'REVISI': 3, 'TELAT': 2, 'URGENT': 1 };
        return priority[b.type] - priority[a.type];
    });

  }, [orders]);

  const activeItem = activeIndex !== null ? productionTypeData[activeIndex] : null;
  const centerValue = activeItem ? activeItem.value : stats.totalOrders;
  const centerLabel = activeItem ? activeItem.name : 'TOTAL ORDER';
  const centerColor = activeItem ? COLORS[activeIndex! % COLORS.length] : '#1e293b';

  return (
    <div className="space-y-4 md:space-y-6 pb-10">
      
      {/* HERO SECTION */}
      <HeroSectionOptimized stats={stats} />

      {/* SECTION GRAFIK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* BAR CHART */}
        <ChartBarMemo monthlyData={monthlyData} />

        {/* PIE CHART */}
        <ChartPieMemo 
          productionTypeData={productionTypeData}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          centerValue={centerValue}
          centerLabel={centerLabel}
          centerColor={centerColor}
        />
      </div>

      {/* ACTION ITEMS */}
      <ActionListOptimized actionItems={actionItems} onSelectOrder={onSelectOrder} />
    </div>
  );
}

// ==========================================
// MEMOIZED: HERO SECTION
// ==========================================
const HeroSectionOptimized = memo(({ stats }: { stats: any }) => {
  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl">
      {/* Background - SIMPLIFIED */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Pattern sederhana */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(30deg, #3b82f6 12%, transparent 12.5%, transparent 87%, #3b82f6 87.5%)',
          backgroundSize: '80px 140px'
        }} />
        
        {/* Glow tanpa animasi */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      
      {/* Grid */}
      <div className="absolute inset-0 opacity-3" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />
      
      <div className="relative z-10 p-6 md:p-8 lg:p-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
          <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">
                Dashboard Produksi
              </h2>
              <p className="text-slate-200 text-sm md:text-base mt-1 drop-shadow">
                Ringkasan performa dan analitik produksi
              </p>
          </div>
          
          <div className="flex w-full md:w-auto gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {stats.trouble > 0 && (
                  <div className="flex-1 md:flex-none justify-center bg-purple-500/90 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl text-xs font-bold border border-purple-400/30 flex items-center gap-2 shadow-lg min-w-[100px]">
                      <AlertTriangle className="w-4 h-4" /> {stats.trouble} Kendala
                  </div>
              )}
              <div className="flex-1 md:flex-none justify-center bg-red-500/90 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl text-xs font-bold border border-red-400/30 flex items-center gap-2 shadow-lg min-w-[90px]">
                  <AlertCircle className="w-4 h-4" /> {stats.overdue} Telat
              </div>
              <div className="flex-1 md:flex-none justify-center bg-orange-500/90 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl text-xs font-bold border border-orange-400/30 flex items-center gap-2 shadow-lg min-w-[90px]">
                  <TrendingUp className="w-4 h-4" /> {stats.warning} Urgent
              </div>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <HeroStatCard 
            title="Total Pesanan" 
            value={stats.totalOrders} 
            label="Lifetime" 
            icon={<Package className="w-5 h-5" />}
            gradient="from-blue-500 to-blue-600"
          />
          <HeroStatCard 
            title="Total PCS" 
            value={stats.totalPcs} 
            label="Produksi" 
            icon={<TrendingUp className="w-5 h-5" />}
            gradient="from-indigo-500 to-indigo-600"
          />
          <HeroStatCard 
            title="On Process" 
            value={stats.onProcess} 
            label="Sedang Jalan" 
            icon={<Clock className="w-5 h-5" />}
            gradient="from-yellow-500 to-yellow-600"
          />
          <HeroStatCard 
            title="Selesai" 
            value={stats.selesai} 
            label="Completed" 
            icon={<CheckCircle2 className="w-5 h-5" />}
            gradient="from-green-500 to-green-600"
          />
        </div>
        
      </div>
    </div>
  );
});
HeroSectionOptimized.displayName = 'HeroSectionOptimized';

// ==========================================
// HERO STAT CARD
// ==========================================
function HeroStatCard({ title, value, label, icon, gradient }: { 
  title: string; value: number; label: string; icon: React.ReactNode; gradient: string;
}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 p-4 md:p-5 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl will-change-transform">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs md:text-sm text-white/80 font-semibold uppercase tracking-wider">
                        {title}
                    </span>
                    <div className="text-white/60 group-hover:text-white/90 transition-colors">
                        {icon}
                    </div>
                </div>
                
                <div className="space-y-1">
                    <span className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white block drop-shadow-lg">
                        {value}
                    </span>
                    <span className="text-xs md:text-sm text-white/70 font-medium">
                        {label}
                    </span>
                </div>
            </div>
        </div>
    );
}

// Helper
function formatDateDiff(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
}

// ==========================================
// MEMOIZED: BAR CHART
// ==========================================
const ChartBarMemo = memo(({ monthlyData }: { monthlyData: any[] }) => {
  return (
    <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl border border-slate-200">
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
  );
});
ChartBarMemo.displayName = 'ChartBarMemo';

// ==========================================
// MEMOIZED: PIE CHART
// ==========================================
const ChartPieMemo = memo(({ 
  productionTypeData, 
  activeIndex, 
  setActiveIndex, 
  centerValue, 
  centerLabel, 
  centerColor 
}: any) => {
  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 flex flex-col">
        <div className="mb-2 md:mb-4">
            <h3 className="font-bold text-slate-800 text-base md:text-lg flex items-center gap-2">
                <PieIcon className="w-4 h-4 md:w-5 md:h-5 text-purple-600" /> Jenis Produksi
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
                        onMouseEnter={(_, index) => setActiveIndex(index)} 
                        onMouseLeave={() => setActiveIndex(null)}
                    >
                        {productionTypeData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                </PieChart>
            </ResponsiveContainer>
            
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
  );
});
ChartPieMemo.displayName = 'ChartPieMemo';

// ==========================================
// MEMOIZED: ACTION LIST
// ==========================================
const ActionListOptimized = memo(({ actionItems, onSelectOrder }: { actionItems: any[], onSelectOrder: (id: string) => void }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500"/> Perlu Tindakan Segera
           </h3>
           <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{actionItems.length} Isu</span>
      </div>
      
      <div className="divide-y divide-slate-50">
           {actionItems.slice(0, 10).map((item: any) => (
              <ActionRowMemo key={item.uniqueKey} item={item} onSelectOrder={onSelectOrder} />
           ))}
           
           {actionItems.length === 0 && (
               <div className="p-6 md:p-8 text-center flex flex-col items-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 mb-2 text-green-400 opacity-50" />
                  <p className="text-xs md:text-sm">Aman! Tidak ada kendala, telat, atau urgent.</p>
               </div>
           )}
      </div>
    </div>
  );
});
ActionListOptimized.displayName = 'ActionListOptimized';

// ==========================================
// MEMOIZED: ACTION ROW
// ==========================================
const ActionRowMemo = memo(({ item, onSelectOrder }: { item: any, onSelectOrder: (id: string) => void }) => {
    const [isSharing, setIsSharing] = useState(false);
    const { order, type, detail } = item;

    let indicatorColor = '';
    let badgeClass = '';
    let icon = null;
    let textColor = '';

    switch (type) {
        case 'KENDALA':
            indicatorColor = 'bg-purple-600';
            badgeClass = 'bg-purple-100 text-purple-700 border-purple-200';
            icon = <AlertTriangle className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />;
            textColor = 'text-purple-700';
            break;
        case 'REVISI':
            indicatorColor = 'bg-rose-500';
            badgeClass = 'bg-rose-100 text-rose-700 border-rose-200';
            icon = <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />;
            textColor = 'text-rose-700';
            break;
        case 'TELAT':
            indicatorColor = 'bg-red-600';
            badgeClass = 'bg-red-100 text-red-700 border-red-200';
            icon = <Clock className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />;
            textColor = 'text-red-700';
            break;
        case 'URGENT':
            indicatorColor = 'bg-orange-400';
            badgeClass = 'bg-orange-100 text-orange-700 border-orange-200';
            icon = <TrendingUp className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />;
            textColor = 'text-orange-700';
            break;
    }

    const handleShare = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation(); 
        setIsSharing(true);
        
        // 1. Buat elemen container
        const ticketElement = document.createElement('div');
        
        // PERBAIKAN PENTING:
        // Jangan gunakan left: -9999px. Browser modern sering skip rendering area itu.
        // Taruh di belakang layar (z-index negative) tapi tetap di viewport.
        Object.assign(ticketElement.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            zIndex: '-9999', // Di belakang segalanya
            width: '600px',  // Lebar fix sesuai desain ShareTicket
            height: 'auto',
            visibility: 'visible', // Harus visible agar bisa dicapture
            background: '#ffffff'  // Pastikan background putih, bukan transparan
        });

        document.body.appendChild(ticketElement);
        
        // 2. Render komponen React ke dalam elemen tersebut
        const root = (await import('react-dom/client')).createRoot(ticketElement);
        root.render(<ShareTicket item={item} />);
        
        // 3. Beri waktu React & Tailwind untuk render sepenuhnya
        // Naikkan ke 300ms - 500ms untuk keamanan (terutama di HP yang lambat)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            // 4. Capture
            const dataUrl = await toPng(ticketElement, { 
                cacheBust: true, 
                backgroundColor: '#ffffff',
                pixelRatio: 2, // Kualitas tinggi (Retina)
                width: 600,    // Paksa lebar capture
                // Filter node yang tidak perlu jika ada
            });

            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `Laporan-${type}-${order.kode_produksi}.png`, { type: 'image/png' });

            if (navigator.share) {
                await navigator.share({
                    title: `Laporan Langitan: ${type}`, // Branding kamu
                    text: `Detail laporan produksi untuk pesanan ${order.nama_pemesan}`,
                    files: [file],
                });
            } else {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `Laporan-${type}-${order.kode_produksi}.png`;
                link.click();
            }
        } catch (err) {
            console.error('Gagal membuat gambar:', err);
            alert('Gagal generate gambar. Coba lagi.');
        } finally {
            // 5. Cleanup
            // Gunakan timeout kecil saat unmount agar tidak crash di beberapa browser mobile
            setTimeout(() => {
                root.unmount();
                if (document.body.contains(ticketElement)) {
                    document.body.removeChild(ticketElement);
                }
                setIsSharing(false);
            }, 100);
        }
    }, [item, order, type]);

    return (
        <div 
            className="group p-3 md:p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer relative" 
            onClick={() => onSelectOrder(order.id)}
        >
            <div className="flex flex-1 items-center gap-3 bg-white pr-4 py-2 rounded-md h-full">
                <div className={`w-1.5 self-stretch rounded-full ${indicatorColor} flex-shrink-0`}></div>
                <div className="flex-1 min-w-0 py-1"> 
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 text-xs md:text-sm line-clamp-1">{order.nama_pemesan}</p>
                        <span className="text-[10px] text-slate-400 font-mono hidden md:inline-block">#{order.kode_produksi}</span>
                    </div>
                    <div className={`flex items-start gap-1.5 mt-1 ${textColor}`}>
                        {icon}
                        <p className="text-[10px] md:text-xs font-semibold leading-relaxed break-words whitespace-normal">
                            {type === 'KENDALA' ? `Kendala: ${detail}` : detail}
                        </p>
                    </div>
                </div>
                <div className="text-right pl-2 flex-shrink-0 self-start">
                    <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded border ${badgeClass}`}>
                        {type}
                    </span>
                    <p className="text-[9px] md:text-[10px] text-slate-400 mt-1.5 font-medium">
                      Deadline: {new Date(order.deadline).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                    </p>
                </div>
            </div>

            <button 
                onClick={handleShare}
                disabled={isSharing}
                className="ml-2 p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all flex-shrink-0 self-center active:scale-90"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
            </button>
        </div>
    );
}, (prevProps, nextProps) => {
  return prevProps.item.uniqueKey === nextProps.item.uniqueKey;
});
ActionRowMemo.displayName = 'ActionRowMemo';

// ==========================================
// SHARE TICKET COMPONENT
// ==========================================
function ShareTicket({ item }: { item: any }) {
    const { order, type, detail } = item;
    
    let themeColor = 'bg-slate-800';
    let borderColor = 'border-slate-200';
    let alertBg = 'bg-slate-50';
    let alertText = 'text-slate-700';
    let label = 'INFO';

    switch (type) {
        case 'KENDALA':
            themeColor = 'bg-purple-600';
            borderColor = 'border-purple-200';
            alertBg = 'bg-purple-50';
            alertText = 'text-purple-800';
            label = 'KENDALA PRODUKSI';
            break;
        case 'REVISI':
            themeColor = 'bg-rose-600';
            borderColor = 'border-rose-200';
            alertBg = 'bg-rose-50';
            alertText = 'text-rose-800';
            label = 'REVISI QC';
            break;
        case 'TELAT':
            themeColor = 'bg-red-600';
            borderColor = 'border-red-200';
            alertBg = 'bg-red-50';
            alertText = 'text-red-800';
            label = 'TELAT DEADLINE';
            break;
        case 'URGENT':
            themeColor = 'bg-orange-500';
            borderColor = 'border-orange-200';
            alertBg = 'bg-orange-50';
            alertText = 'text-orange-800';
            label = 'MENDESAK (URGENT)';
            break;
    }

    return (
        <div className="w-[600px] bg-white p-8 rounded-3xl border border-slate-200 shadow-xl font-sans">
            {/* HEADER */}
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className={`px-3 py-1 rounded text-white text-xs font-bold tracking-widest uppercase ${themeColor}`}>
                            {label}
                        </span>
                        <span className="text-slate-400 font-mono text-sm">#{order.kode_produksi}</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 mt-2">{order.nama_pemesan}</h1>
                    <p className="text-slate-500 text-sm mt-1">Dibuat: {formatDate(order.tanggal_masuk)}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-lg font-bold text-slate-700">LCO Production</h2>
                    <p className="text-xs text-slate-400">Production Control Card</p>
                </div>
            </div>

            {/* ORDER DETAILS */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Jumlah</span>
                    <span className="text-xl font-bold text-slate-800">{order.jumlah} Pcs</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Tipe</span>
                    <span className="text-xl font-bold text-slate-800 uppercase">{order.jenis_produksi}</span>
                </div>
                <div className={`p-4 rounded-xl border ${type === 'TELAT' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                    <span className={`text-xs uppercase font-bold block mb-1 ${type === 'TELAT' ? 'text-red-500' : 'text-slate-500'}`}>Deadline</span>
                    <span className={`text-xl font-bold ${type === 'TELAT' ? 'text-red-700' : 'text-slate-800'}`}>{formatDate(order.deadline)}</span>
                </div>
            </div>

            {/* ALERT MESSAGE */}
            <div className={`p-5 rounded-2xl border-2 border-dashed ${borderColor} ${alertBg}`}>
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${themeColor} text-white`}>
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className={`font-bold text-sm uppercase mb-1 ${alertText}`}>Catatan {type === 'KENDALA' ? 'Produksi' : 'Sistem'}:</h3>
                        <p className={`text-lg font-bold leading-relaxed ${alertText}`}>
                            {detail}
                        </p>
                        <p className="text-xs text-slate-800 mt-2">
                           Laporan dibuat pada: {new Date().toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// EXPORT SEMUA KOMPONEN YANG DIBUTUHKAN
export { ChartBarMemo, ChartPieMemo, ActionListOptimized, ActionRowMemo, ShareTicket };