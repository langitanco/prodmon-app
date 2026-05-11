import { memo, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import { Package } from 'lucide-react';
import { MonthlyDataPoint } from '@/hooks/useDashboard';

interface ChartBarProps {
  monthlyData: MonthlyDataPoint[];
}

const ChartBar = memo(function ChartBar({ monthlyData }: ChartBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors duration-200">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base md:text-lg flex items-center gap-2">
            <Package className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
            Tren Volume (PCS)
          </h3>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
            Jumlah item masuk 6 bulan terakhir
          </p>
        </div>
      </div>

      <div className="h-[200px] md:h-[300px] w-full">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#94a3b8"
                strokeOpacity={0.2}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
              />
              <RechartsTooltip
                cursor={{ fill: 'currentColor', opacity: 0.1 }}
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  fontSize: '10px',
                  backgroundColor: 'rgb(30, 41, 59)',
                  color: '#fff',
                }}
                formatter={(value: number) => [`${value} Pcs`, 'Total']}
              />
              <Bar dataKey="pcs" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} name="Total PCS" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});

export default ChartBar;