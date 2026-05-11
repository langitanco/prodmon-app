import { memo } from 'react';
import { TrendingUp, AlertCircle, Package, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { DashboardStats } from '@/hooks/useDashboard';

// ─── Hero Stat Card ───────────────────────────────────────────────────────────

interface HeroStatCardProps {
  title: string;
  value: number;
  label: string;
  icon: React.ReactNode;
  gradient: string;
}

function HeroStatCard({ title, value, label, icon, gradient }: HeroStatCardProps) {
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
          <span className="text-xs md:text-sm text-white/70 font-medium">{label}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

interface HeroSectionProps {
  stats: DashboardStats;
}

const HeroSection = memo(function HeroSection({ stats }: HeroSectionProps) {
  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl dark:shadow-slate-900/50">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(30deg, #3b82f6 12%, transparent 12.5%, transparent 87%, #3b82f6 87.5%)',
            backgroundSize: '80px 140px',
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      <div
        className="absolute inset-0 opacity-3"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative z-10 p-6 md:p-8 lg:p-10">
        {/* Title + Badge Row */}
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

        {/* Stat Cards */}
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

export default HeroSection;