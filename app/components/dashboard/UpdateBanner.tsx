'use client';

import { memo } from 'react';
import { RefreshCw, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { UpdateInfo } from '@/hooks/useUpdateCheck';

interface UpdateBannerProps {
  updateInfo: UpdateInfo;
  onUpdate: () => void;
  onDismiss: () => void;
}

const UpdateBanner = memo(function UpdateBanner({
  updateInfo,
  onUpdate,
  onDismiss,
}: UpdateBannerProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = () => {
    setIsUpdating(true);
    // Beri sedikit delay agar spinner terlihat sebelum reload
    setTimeout(() => {
      onUpdate();
    }, 400);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className="
        flex items-center justify-between gap-3
        bg-blue-50 dark:bg-blue-950/40
        border border-blue-200 dark:border-blue-800/60
        border-l-4 border-l-blue-500
        rounded-2xl px-4 py-3
        shadow-sm
        transition-all duration-300
        animate-in slide-in-from-top-2 fade-in
      "
    >
      {/* Icon + Teks */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
          <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-blue-800 dark:text-blue-200 leading-tight">
            Pembaruan tersedia —{' '}
            <span className="font-extrabold">{updateInfo.newVersion}</span>
          </p>
          <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-0.5 line-clamp-1">
            {updateInfo.releaseNotes}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onDismiss}
          disabled={isUpdating}
          className="
            p-1.5 rounded-lg text-blue-400 dark:text-blue-600
            hover:bg-blue-100 dark:hover:bg-blue-900/50
            hover:text-blue-600 dark:hover:text-blue-300
            transition-colors disabled:opacity-50
          "
          aria-label="Tutup notifikasi"
        >
          <X className="w-4 h-4" />
        </button>

        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="
            flex items-center gap-1.5
            bg-blue-600 hover:bg-blue-700 active:bg-blue-800
            text-white text-xs font-bold
            px-3 py-2 rounded-xl
            transition-all duration-200 active:scale-95
            disabled:opacity-70 disabled:cursor-not-allowed
            shadow-sm shadow-blue-600/20
          "
        >
          {isUpdating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Memperbarui...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update sekarang</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
});

export default UpdateBanner;