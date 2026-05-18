import { useMemo } from 'react';
import { Order } from '@/types';
import { getDeadlineStatus } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ActionItemType = 'KENDALA' | 'REVISI' | 'TELAT' | 'URGENT';

export type ActionItem = {
  uniqueKey: string;
  order: Order;
  type: ActionItemType;
  detail: string;
  timestamp?: string;
};

export interface DashboardStats {
  totalOrders: number;
  totalPcs: number;
  warning: number;
  overdue: number;
  trouble: number;
  onProcess: number;
  selesai: number;
  monthlyOrders: number; // pesanan masuk bulan aktif
  monthlyPcs: number;    // pcs terproduksi bulan aktif
}

export interface MonthlyDataPoint {
  name: string;
  monthIndex: number;
  year: number;
  total: number;
  pcs: number;
}

export interface ProductionTypeDataPoint {
  name: string;
  value: number;
  [key: string]: unknown; // diperlukan oleh Recharts v3 ChartDataInput
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function formatDateDiff(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseDashboardReturn {
  stats: DashboardStats;
  monthlyData: MonthlyDataPoint[];
  productionTypeData: ProductionTypeDataPoint[];
  actionItems: ActionItem[];
}

export function useDashboard(orders: Order[]): UseDashboardReturn {

  const monthlyData = useMemo<MonthlyDataPoint[]>(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6Months: MonthlyDataPoint[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push({
        name: months[d.getMonth()],
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        total: 0,
        pcs: 0,
      });
    }

    orders.forEach((order) => {
      const d = new Date(order.tanggal_masuk);
      const item = last6Months.find(
        (m) => m.monthIndex === d.getMonth() && m.year === d.getFullYear()
      );
      if (item) {
        item.total += 1;
        item.pcs += order.jumlah;
      }
    });

    return last6Months;
  }, [orders]);

  const productionTypeData = useMemo<ProductionTypeDataPoint[]>(() => {
    const types: Record<string, number> = {};
    orders.forEach((order) => {
      const type = order.jenis_produksi || 'Lainnya';
      types[type] = (types[type] || 0) + 1;
    });
    return Object.keys(types).map((key) => ({
      name: key.toUpperCase(),
      value: types[key],
    }));
  }, [orders]);

  const stats = useMemo<DashboardStats>(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthOrders = orders.filter((o) => {
      const d = new Date(o.tanggal_masuk);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    return {
      totalOrders: orders.length,
      totalPcs: orders.reduce((acc, curr) => acc + curr.jumlah, 0),
      warning: orders.filter((o) => getDeadlineStatus(o.deadline, o.status) === 'warning').length,
      overdue: orders.filter((o) => getDeadlineStatus(o.deadline, o.status) === 'overdue').length,
      trouble: orders.filter((o) => o.kendala && o.kendala.some((k) => !k.isResolved)).length,
      onProcess: orders.filter((o) => o.status === 'On Process').length,
      selesai: orders.filter((o) => o.status === 'Selesai').length,
      monthlyOrders: thisMonthOrders.length,
      monthlyPcs: thisMonthOrders.reduce((acc, curr) => acc + curr.jumlah, 0),
    };
  }, [orders]);

  const actionItems = useMemo<ActionItem[]>(() => {
    const items: ActionItem[] = [];

    orders.forEach((order) => {
      const deadlineStatus = getDeadlineStatus(order.deadline, order.status);

      const activeKendala = order.kendala ? order.kendala.filter((k) => !k.isResolved) : [];
      if (activeKendala.length > 0) {
        const latest = [...activeKendala].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];
        items.push({
          uniqueKey: `${order.id}-kendala`,
          order,
          type: 'KENDALA',
          detail: latest.notes,
          timestamp: latest.timestamp,
        });
      }

      if (order.status === 'Revisi') {
        items.push({
          uniqueKey: `${order.id}-revisi`,
          order,
          type: 'REVISI',
          detail: order.finishing_qc?.notes || 'Perbaikan QC diperlukan',
        });
      }

      if (deadlineStatus === 'overdue') {
        items.push({
          uniqueKey: `${order.id}-telat`,
          order,
          type: 'TELAT',
          detail: `Telat ${formatDateDiff(order.deadline)} hari`,
        });
      } else if (deadlineStatus === 'warning') {
        items.push({
          uniqueKey: `${order.id}-urgent`,
          order,
          type: 'URGENT',
          detail: 'Deadline < 2 hari',
        });
      }
    });

    const priority: Record<ActionItemType, number> = { KENDALA: 4, REVISI: 3, TELAT: 2, URGENT: 1 };
    return items.sort((a, b) => priority[b.type] - priority[a.type]);
  }, [orders]);

  return { stats, monthlyData, productionTypeData, actionItems };
}