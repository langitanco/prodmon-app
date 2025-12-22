// app/components/orders/EditOrder.tsx

import React, { useState } from 'react';
import { Order, ProductionTypeData, UserData } from '@/types';

interface EditOrderProps {
  order: Order;
  productionTypes: ProductionTypeData[];
  users: UserData[]; 
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
    assigned_to: order.assigned_to || '' 
  });
  
  const isDisabled = !form.nama || !form.hp || !form.deadline || !form.jumlah || !form.assigned_to;

  return (
    <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl border dark:border-slate-800 shadow-sm max-w-2xl mx-auto">
      <h2 className="font-bold text-lg md:text-xl mb-4 md:mb-6 text-slate-800 dark:text-white">Edit Pesanan</h2>
      <div className="space-y-3 md:space-y-5">
        <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1 md:mb-2">Nama Pemesan</label>
            <input 
              className="w-full border-2 border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 dark:placeholder-slate-500" 
              placeholder="Masukkan nama pemesan" 
              value={form.nama} 
              onChange={e=>setForm({...form, nama: e.target.value})} 
            />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1 md:mb-2">No HP</label>
            <input 
              className="w-full border-2 border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 dark:placeholder-slate-500" 
              placeholder="08xxxxxxxxxx" 
              value={form.hp} 
              onChange={e=>setForm({...form, hp: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1 md:mb-2">Jumlah</label>
            <input 
              type="number" 
              className="w-full border-2 border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 dark:placeholder-slate-500" 
              placeholder="0" 
              value={form.jumlah} 
              onChange={e=>setForm({...form, jumlah: e.target.value})} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1 md:mb-2">Jenis</label>
            <select 
              className="w-full border-2 border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm" 
              value={form.type} 
              onChange={e=>setForm({...form, type: e.target.value})}
            >
              {productionTypes.map((pt) => (
                <option key={pt.id} value={pt.value}>{pt.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1 md:mb-2">Penanggung Jawab</label>
            <select 
              className="w-full border-2 border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm" 
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1 md:mb-2">Deadline</label>
            <input 
              type="date" 
              className="w-full border-2 border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm" 
              value={form.deadline} 
              onChange={e=>setForm({...form, deadline: e.target.value})} 
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 md:pt-6">
            <button 
              onClick={onCancel} 
              className="flex-1 border-2 border-slate-200 dark:border-slate-700 py-2 md:py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm"
            >
              Batal
            </button>
            <button 
              onClick={()=>onSubmit(form)} 
              disabled={isDisabled} 
              className="flex-1 bg-blue-600 text-white py-2 md:py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
            >
              Update
            </button>
        </div>
      </div>
    </div>
  )
}