import { memo, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, TrendingUp, Clock, Share2, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { ActionItem, ActionItemType } from '@/hooks/useDashboard';
import { ShareTicket } from './ShareTicket';

// ─── Action Row ───────────────────────────────────────────────────────────────

interface ActionRowProps {
  item: ActionItem;
  onSelectOrder: (id: string) => void;
}

const ActionRow = memo(function ActionRow({ item, onSelectOrder }: ActionRowProps) {
  const [isSharing, setIsSharing] = useState(false);
  const { order, type, detail } = item;

  let indicatorColor = '';
  let badgeClass = '';
  let icon: React.ReactNode = null;
  let textColor = '';

  switch (type) {
    case 'KENDALA':
      indicatorColor = 'bg-purple-600';
      badgeClass = 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50';
      icon = <AlertTriangle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />;
      textColor = 'text-purple-700 dark:text-purple-300';
      break;
    case 'REVISI':
      indicatorColor = 'bg-rose-500';
      badgeClass = 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700/50';
      icon = <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />;
      textColor = 'text-rose-700 dark:text-rose-300';
      break;
    case 'TELAT':
      indicatorColor = 'bg-red-600';
      badgeClass = 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50';
      icon = <Clock className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />;
      textColor = 'text-red-700 dark:text-red-300';
      break;
    case 'URGENT':
      indicatorColor = 'bg-orange-400';
      badgeClass = 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/50';
      icon = <TrendingUp className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 flex-shrink-0" />;
      textColor = 'text-orange-700 dark:text-orange-300';
      break;
  }

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSharing(true);

    const ticketElement = document.createElement('div');
    Object.assign(ticketElement.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      zIndex: '-9999',
      width: '600px',
      height: 'auto',
      visibility: 'visible',
      background: '#ffffff',
    });
    document.body.appendChild(ticketElement);

    const root = (await import('react-dom/client')).createRoot(ticketElement);
    root.render(<ShareTicket item={item} />);

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const dataUrl = await toPng(ticketElement, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        width: 600,
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `Laporan-${type}-${order.kode_produksi}.png`, { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          title: `Laporan Langitan: ${type}`,
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
      className="group p-3 md:p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 transition cursor-pointer relative"
      onClick={() => onSelectOrder(order.id)}
    >
      <div className="flex flex-1 items-center gap-3 bg-white dark:bg-slate-900 pr-4 py-2 rounded-md h-full transition-colors">
        <div className={`w-1.5 self-stretch rounded-full ${indicatorColor} flex-shrink-0`} />
        <div className="flex-1 min-w-0 py-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-800 dark:text-slate-100 text-xs md:text-sm line-clamp-1">
              {order.nama_pemesan}
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono hidden md:inline-block">
              #{order.kode_produksi}
            </span>
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
          <p className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
            Deadline: {new Date(order.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>

      <button
        onClick={handleShare}
        disabled={isSharing}
        className="ml-2 p-2 text-slate-300 dark:text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-full transition-all flex-shrink-0 self-center active:scale-90"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        aria-label="Bagikan laporan"
      >
        {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
      </button>
    </div>
  );
}, (prevProps, nextProps) => prevProps.item.uniqueKey === nextProps.item.uniqueKey);

// ─── Action List ──────────────────────────────────────────────────────────────

interface ActionListProps {
  actionItems: ActionItem[];
  onSelectOrder: (id: string) => void;
}

const ActionList = memo(function ActionList({ actionItems, onSelectOrder }: ActionListProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-200">
      <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-700/50">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" /> Perlu Tindakan Segera
        </h3>
        <span className="text-[10px] bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 px-2 py-0.5 rounded-full font-bold">
          {actionItems.length} Isu
        </span>
      </div>

      <div className="divide-y divide-slate-50 dark:divide-slate-700">
        {actionItems.slice(0, 10).map((item) => (
          <ActionRow key={item.uniqueKey} item={item} onSelectOrder={onSelectOrder} />
        ))}

        {actionItems.length === 0 && (
          <div className="p-6 md:p-8 text-center flex flex-col items-center text-slate-400 dark:text-slate-500">
            <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 mb-2 text-green-400 opacity-50" />
            <p className="text-xs md:text-sm">Aman! Tidak ada kendala, telat, atau urgent.</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default ActionList;