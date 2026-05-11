import { memo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { ProductionTypeDataPoint } from '@/hooks/useDashboard';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

interface ChartPieProps {
  productionTypeData: ProductionTypeDataPoint[];
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
  centerValue: number;
  centerLabel: string;
  centerColor?: string;
}

const ChartPie = memo(function ChartPie({
  productionTypeData,
  activeIndex,
  setActiveIndex,
  centerValue,
  centerLabel,
  centerColor,
}: ChartPieProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col transition-colors duration-200">
      <div className="mb-2 md:mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base md:text-lg flex items-center gap-2">
          <PieIcon className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
          Jenis Produksi
        </h3>
        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
          Distribusi tipe order keseluruhan
        </p>
      </div>

      <div className="flex-1 min-h-[200px] md:min-h-[250px] relative">
        {mounted && (
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
                stroke="none"
              >
                {productionTypeData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* Center Label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-6">
          <span
            className="text-2xl md:text-3xl font-extrabold transition-colors duration-300 text-slate-800 dark:text-white"
            style={{ color: centerColor || undefined }}
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

export default ChartPie;