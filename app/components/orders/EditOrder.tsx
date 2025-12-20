// app/components/orders/EditOrder.tsx

import React, { useState } from 'react';
import { Order, ProductionTypeData, UserData } from '@/types';

interface EditOrderProps {
  order: Order;
  productionTypes: ProductionTypeData[];
  users: UserData[]; // <-- Tambahan
  onCancel: () => void;
  onSubmit: (data: any) => void;
}

export default function EditOrder({ order, productionTypes, users, onCancel, onSubmit }: EditOrderProps) {
  const [form, setForm] = useState({ 
    nama: order.nama_pemesan, 
    hp: order.no_hp, 
    jumlah: order.jumlah.toString(), 
    deadline: order.deadline, 
    type: order.jenis_produksi,
    assigned_to: order.assigned_to || '' // <-- Tambahan: Load existing PIC
  });
  
  const isDisabled = !form.nama || !form.hp || !form.deadline || !form.jumlah || !form.assigned_to;

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl border shadow-sm max-w-2xl mx-auto">
      <h2 className="font-bold text-lg md:text-xl mb-4 md:mb-6 text-slate-800">Edit Pesanan</h2>
      <div className="space-y-3 md:space-y-5">
        <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1 md:mb-2">Nama Pemesan</label>
            <input className="w-full border-2 border-slate-200 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 text-sm placeholder-slate-400" placeholder="Masukkan nama pemesan" value={form.nama} onChange={e=>setForm({...form, nama: e.target.value})} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1 md:mb-2">No HP</label>
            <input className="w-full border-2 border-slate-200 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 text-sm placeholder-slate-400" placeholder="08xxxxxxxxxx" value={form.hp} onChange={e=>setForm({...form, hp: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1 md:mb-2">Jumlah</label>
            <input type="number" className="w-full border-2 border-slate-200 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 text-sm placeholder-slate-400" placeholder="0" value={form.jumlah} onChange={e=>setForm({...form, jumlah: e.target.value})} />
          </div>
        </div>

        {/* --- MODIFIKASI: Menambahkan Dropdown Penanggung Jawab --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1 md:mb-2">Jenis</label>
            <select className="w-full border-2 border-slate-200 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white text-slate-800 text-sm" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
              {productionTypes.map((pt) => (
                <option key={pt.id} value={pt.value}>{pt.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1 md:mb-2">Penanggung Jawab</label>
            <select 
              className="w-full border-2 border-slate-200 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white text-slate-800 text-sm" 
              value={form.assigned_to} 
              onChange={e=>setForm({...form, assigned_to: e.target.value})}
            >
              <option value="">Pilih PIC Produksi</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
              ))}
            </select>
          </div>
        </div>
        {/* --------------------------------------------------------- */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1 md:mb-2">Deadline</label>
            <input type="date" className="w-full border-2 border-slate-200 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 text-sm" value={form.deadline} onChange={e=>setForm({...form, deadline: e.target.value})} />
          </div>
        </div>

        <div className="flex gap-3 pt-4 md:pt-6">
            <button onClick={onCancel} className="flex-1 border-2 border-slate-200 py-2 md:py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition text-sm">Batal</button>
            <button onClick={()=>onSubmit(form)} disabled={isDisabled} className="flex-1 bg-blue-600 text-white py-2 md:py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition text-sm">Update</button>
        </div>
      </div>
    </div>
  )
}