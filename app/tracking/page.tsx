'use client';

import React, { useState } from 'react';
import { 
  Search, CheckCircle, Truck, Package, 
  AlertCircle, Loader2, Sparkles, Calendar, User,
  Clock, Box, Zap
} from 'lucide-react';

// --- MOCK DATA untuk demo ---
const MOCK_ORDERS: Record<string, any> = {
  'LCO-11/25-0001': {
    kode_produksi: 'LCO-11/25-0001',
    nama_pemesan: 'PT Maju Bersama',
    tanggal_masuk: '2025-11-15',
    deadline: '2025-12-01',
    jenis_produksi: 'Digital Print',
    status: 'On Process',
    link_approval: { timestamp: '2025-11-16' },
  },
  'LCO-11/25-0002': {
    kode_produksi: 'LCO-11/25-0002',
    nama_pemesan: 'CV Sukses Jaya',
    tanggal_masuk: '2025-11-10',
    deadline: '2025-11-25',
    jenis_produksi: 'Offset',
    status: 'Selesai',
    link_approval: { timestamp: '2025-11-11' },
    finishing_qc: { timestamp: '2025-11-20', isPassed: true },
    finishing_packing: { isPacked: true },
    shipping: { timestamp_kirim: '2025-11-22', bukti_kirim: 'uploaded' }
  },
};

// --- HELPER DATE ---
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
};

// --- SMART FORMAT FUNCTION ---
const smartFormatCode = (input: string): string => {
  const cleaned = input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const match = cleaned.match(/^([A-Z]{3})(\d{2})(\d{2})(\d{4})$/);
  
  if (match) {
    const [, prefix, part1, part2, part3] = match;
    return `${prefix}-${part1}/${part2}-${part3}`;
  }
  
  return input.toUpperCase().trim();
};

export default function TrackingPage() {
  const [searchCode, setSearchCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setResult(null);

    const formatted = smartFormatCode(searchCode);

    // Simulasi loading
    await new Promise(resolve => setTimeout(resolve, 800));

    // Cari di mock data
    const foundOrder = MOCK_ORDERS[formatted];
    if (foundOrder) {
      setResult(foundOrder);
    }
    
    setLoading(false);
  };

  const TimelineItem = ({ 
    title, 
    date, 
    isCompleted, 
    isActive, 
    isLast,
    icon: Icon 
  }: any) => (
    <div className="relative">
      <div className="flex gap-3 sm:gap-4">
        {/* Line */}
        {!isLast && (
          <div 
            className="absolute left-[19px] sm:left-[23px] top-[44px] sm:top-[48px] bottom-[-16px] w-[2px] sm:w-[3px] rounded-full"
            style={{
              backgroundColor: isCompleted ? '#10b981' : '#e2e8f0'
            }}
          ></div>
        )}
        
        {/* Icon Circle */}
        <div className="relative z-10">
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500"
            style={{
              background: isCompleted 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                : isActive 
                ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
              boxShadow: isCompleted 
                ? '0 10px 40px -10px rgba(16, 185, 129, 0.4)' 
                : isActive 
                ? '0 10px 40px -10px rgba(37, 99, 235, 0.5)'
                : '0 2px 8px -2px rgba(0, 0, 0, 0.1)',
              transform: isActive ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            {isCompleted ? (
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
            ) : isActive ? (
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
            ) : (
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" strokeWidth={2} />
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="pb-8 sm:pb-10 flex-1 pt-0.5 sm:pt-1">
          <h4 
            className="text-sm sm:text-base transition-all duration-300 mb-1"
            style={{
              color: isCompleted || isActive ? '#0f172a' : '#94a3b8',
              fontWeight: 500
            }}
          >
            {title}
          </h4>
          {date && (
            <div 
              className="flex items-center gap-1.5 text-xs"
              style={{
                color: isCompleted || isActive ? '#475569' : '#94a3b8'
              }}
            >
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{date}</span>
            </div>
          )}
          {isActive && (
            <div 
              className="flex items-center gap-2 mt-2 sm:mt-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl w-fit text-xs"
              style={{
                background: 'linear-gradient(90deg, #dbeafe 0%, #eff6ff 100%)',
                color: '#1e40af',
                border: '1px solid #bfdbfe'
              }}
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" />
              <span>Sedang Diproses</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="min-h-screen flex flex-col items-center p-3 sm:p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)'
      }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <div 
          className="absolute top-20 left-1/4 w-64 h-64 sm:w-96 sm:h-96 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)'
          }}
        ></div>
        <div 
          className="absolute bottom-20 right-1/4 w-64 h-64 sm:w-96 sm:h-96 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)'
          }}
        ></div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-2xl relative z-10 mt-4 sm:mt-6 md:mt-10">
        
        {/* Header Card */}
        <div 
          className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 mb-4 sm:mb-6"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="relative">
              <div 
                className="absolute inset-0 rounded-xl sm:rounded-2xl blur-xl opacity-50"
                style={{
                  background: 'linear-gradient(90deg, #2563eb 0%, #10b981 100%)'
                }}
              ></div>
              <div 
                className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #10b981 100%)',
                  boxShadow: '0 10px 40px -10px rgba(37, 99, 235, 0.6)'
                }}
              >
                <Truck className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>
          <h1 className="text-white text-center text-xl sm:text-2xl md:text-3xl mb-1.5 sm:mb-2" style={{ fontWeight: 600 }}>
            Tracking Pesanan
          </h1>
          <p className="text-blue-200 text-center text-xs sm:text-sm px-2 sm:px-4">
            Lacak status produksi Anda secara real-time
          </p>
        </div>

        {/* Search Card */}
        <div 
          className="rounded-2xl sm:rounded-3xl overflow-hidden"
          style={{
            background: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid #e2e8f0'
          }}
        >
          <div className="p-5 sm:p-6 md:p-8">
            <form onSubmit={handleSearch} className="space-y-3 sm:space-y-4">
              <div className="relative">
                <label className="block text-slate-700 text-sm mb-2" style={{ fontWeight: 500 }}>
                  Kode Produksi
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="lco11250001 atau LCO-11/25-0001" 
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 pr-28 sm:pr-32 rounded-xl sm:rounded-2xl text-xs sm:text-sm uppercase outline-none placeholder-slate-400 text-slate-900 transition-all duration-300"
                    style={{
                      border: '2px solid #e2e8f0',
                      background: '#f8fafc'
                    }}
                    value={searchCode}
                    onChange={e => setSearchCode(e.target.value)}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.background = 'white';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.background = '#f8fafc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {searchCode && (
                    <div 
                      className="absolute right-2 sm:right-3 top-1/2 text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl"
                      style={{
                        transform: 'translateY(-50%)',
                        color: '#2563eb',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe'
                      }}
                    >
                      {smartFormatCode(searchCode)}
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 sm:gap-3"
                style={{
                  background: '#2563eb',
                  color: 'white',
                  fontWeight: 500,
                  boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.5)',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#1d4ed8';
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(37, 99, 235, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(37, 99, 235, 0.5)';
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin"/>
                    <span className="text-sm sm:text-base">Mencari...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 sm:w-5 sm:h-5"/>
                    <span className="text-sm sm:text-base">Lacak Sekarang</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Result Area */}
          <div 
            className="min-h-[300px] sm:min-h-[400px] p-5 sm:p-6 md:p-8"
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)'
            }}
          >
            {!hasSearched && !loading && (
              <div className="text-center py-12 sm:py-16">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6">
                  <div 
                    className="absolute inset-0 rounded-2xl sm:rounded-3xl blur-xl"
                    style={{
                      background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)'
                    }}
                  ></div>
                  <div 
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
                    }}
                  >
                    <Package className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400"/>
                  </div>
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 absolute -top-1 sm:-top-2 -right-1 sm:-right-2 text-blue-500 opacity-70"/>
                </div>
                <p className="text-slate-600 mb-2 text-sm sm:text-base" style={{ fontWeight: 500 }}>Silakan masukkan kode produksi</p>
                <p className="text-slate-400 text-xs sm:text-sm">Format bebas - sistem akan otomatis menyesuaikan</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-12 sm:py-16">
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-blue-600 animate-spin mb-4"/>
                <p className="text-slate-600 text-sm sm:text-base" style={{ fontWeight: 500 }}>Mencari pesanan...</p>
              </div>
            )}

            {hasSearched && !loading && !result && (
              <div 
                className="text-center py-12 sm:py-16 rounded-2xl sm:rounded-3xl"
                style={{
                  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                  border: '2px solid #fecaca'
                }}
              >
                <div 
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    boxShadow: '0 10px 40px -10px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white"/>
                </div>
                <p className="text-red-700 mb-2 text-sm sm:text-base" style={{ fontWeight: 600 }}>Pesanan Tidak Ditemukan</p>
                <p className="text-red-500 text-xs sm:text-sm">Kode produksi tidak ada di sistem</p>
              </div>
            )}

            {result && (
              <div>
                {/* Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div 
                    className="rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300"
                    style={{
                      background: 'white',
                      boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          boxShadow: '0 8px 20px -6px rgba(59, 130, 246, 0.4)'
                        }}
                      >
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-white"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-0.5" style={{ fontWeight: 600 }}>Pemesan</div>
                        <div className="text-slate-900 text-sm sm:text-base truncate" style={{ fontWeight: 500 }}>{result.nama_pemesan}</div>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300"
                    style={{
                      background: 'white',
                      boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          boxShadow: '0 8px 20px -6px rgba(16, 185, 129, 0.4)'
                        }}
                      >
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-0.5" style={{ fontWeight: 600 }}>Deadline</div>
                        <div className="text-emerald-600 text-sm sm:text-base" style={{ fontWeight: 600 }}>{formatDate(result.deadline)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div 
                  className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8"
                  style={{
                    background: 'white',
                    boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                    <div 
                      className="h-0.5 sm:h-1 rounded-full flex-1"
                      style={{
                        background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)'
                      }}
                    ></div>
                    <h3 className="text-slate-700 text-xs sm:text-sm uppercase tracking-wide" style={{ fontWeight: 600 }}>
                      Timeline Produksi
                    </h3>
                    <div 
                      className="h-0.5 sm:h-1 rounded-full flex-1"
                      style={{
                        background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)'
                      }}
                    ></div>
                  </div>

                  <div className="space-y-0">
                    <TimelineItem 
                      icon={Package}
                      title="Pesanan Diterima" 
                      date={formatDate(result.tanggal_masuk)} 
                      isCompleted={true} 
                    />
                    
                    <TimelineItem 
                      icon={CheckCircle}
                      title="Approval Desain" 
                      date={result.link_approval?.timestamp ? formatDate(result.link_approval.timestamp) : null} 
                      isCompleted={!!result.link_approval} 
                      isActive={!result.link_approval}
                    />

                    <TimelineItem 
                      icon={Box}
                      title={`Produksi (${result.jenis_produksi})`} 
                      date={result.status === 'On Process' ? 'Sedang dikerjakan' : null}
                      isCompleted={result.status !== 'Pesanan Masuk' && result.status !== 'On Process' && result.status !== 'Ada Kendala'}
                      isActive={result.status === 'On Process'}
                    />

                    <TimelineItem 
                      icon={CheckCircle}
                      title="Quality Control & Packing" 
                      date={result.finishing_qc?.timestamp ? formatDate(result.finishing_qc.timestamp) : null}
                      isCompleted={result.finishing_qc?.isPassed && result.finishing_packing?.isPacked}
                      isActive={result.status === 'Finishing' || result.status === 'Revisi'}
                    />

                    <TimelineItem 
                      icon={Truck}
                      title="Pengiriman" 
                      date={result.shipping?.timestamp_kirim ? formatDate(result.shipping.timestamp_kirim) : null}
                      isCompleted={!!result.shipping?.bukti_kirim}
                      isActive={result.status === 'Kirim'}
                      isLast={true}
                    />
                  </div>
                  
                  {result.status === 'Selesai' && (
                    <div 
                      className="mt-6 sm:mt-8 p-5 sm:p-6 rounded-xl sm:rounded-2xl text-center text-white"
                      style={{
                        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.5)',
                        border: '2px solid #34d399'
                      }}
                    >
                      <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3" strokeWidth={2.5} />
                      <p className="text-base sm:text-lg mb-1" style={{ fontWeight: 600 }}>Pesanan Telah Selesai</p>
                      <p className="text-emerald-100 text-xs sm:text-sm">Terima kasih telah mempercayai layanan kami</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
