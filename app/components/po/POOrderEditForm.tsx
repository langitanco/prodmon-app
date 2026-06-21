// app/components/po/POOrderEditForm.tsx
"use client";

import { useState } from "react";
import { updatePOOrderFull } from "@/lib/po/admin";
import { calculateItemPrice, formatRupiah } from "@/lib/po/pricing";
import { POOrder, POOrderItem, POProduct, POSetting } from "@/types/po";
import { ArrowLeft, Plus, Trash2, Save, X } from "lucide-react";

const inputCls =
  "w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-500 transition-all";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ── Baris untuk menambah item baru, pilih dari produk aktif ───── */
function AddItemRow({
  products,
  setting,
  onAdd,
  onCancel,
}: {
  products: POProduct[];
  setting: POSetting;
  onAdd: (item: POOrderItem) => void;
  onCancel: () => void;
}) {
  const [productId, setProductId] = useState("");
  const [ukuran, setUkuran] = useState("");
  const [lengan, setLengan] = useState("");
  const [warna, setWarna] = useState("");
  const [qty, setQty] = useState(1);

  const product = products.find((p) => p.id === productId);

  const pricingSettings = {
    sleeveSurcharge: setting.sleeve_surcharge ?? 0,
    xxlSurcharge: setting.xxl_surcharge ?? 0,
    sweaterXxlSurcharge: setting.sweater_xxl_surcharge ?? 0,
  };

  const hargaSatuan = product
    ? calculateItemPrice(
        product.base_price,
        ukuran || "-",
        lengan || "-",
        product,
        pricingSettings,
      )
    : 0;
  const subtotal = hargaSatuan * qty;

  function handleProductChange(id: string) {
    setProductId(id);
    setUkuran("");
    setLengan("");
    setWarna("");
  }

  function handleAdd() {
    if (!product) {
      alert("Pilih produk terlebih dahulu.");
      return;
    }
    if (product.available_sizes.length > 0 && !ukuran) {
      alert("Pilih ukuran terlebih dahulu.");
      return;
    }
    if (product.sleeve_types.length > 0 && !lengan) {
      alert("Pilih jenis lengan terlebih dahulu.");
      return;
    }
    if (product.colors.length > 0 && !warna) {
      alert("Pilih warna terlebih dahulu.");
      return;
    }
    if (qty <= 0) {
      alert("Qty harus lebih dari 0.");
      return;
    }

    onAdd({
      product_id: product.id,
      product_name: product.name,
      ukuran: ukuran || "-",
      lengan: lengan || "-",
      warna: warna || "-",
      qty,
      harga_satuan: hargaSatuan,
      subtotal,
    });
  }

  return (
    <div className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl p-4 space-y-3 bg-blue-50/30 dark:bg-blue-900/10">
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          Tambah Item Baru
        </p>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X size={16} />
        </button>
      </div>

      <Field label="Produk">
        <select
          value={productId}
          onChange={(e) => handleProductChange(e.target.value)}
          className={inputCls}
        >
          <option value="">— Pilih Produk —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({formatRupiah(p.base_price)})
            </option>
          ))}
        </select>
      </Field>

      {product && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {product.available_sizes.length > 0 && (
            <Field label="Ukuran">
              <select
                value={ukuran}
                onChange={(e) => setUkuran(e.target.value)}
                className={inputCls}
              >
                <option value="">—</option>
                {product.available_sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {product.sleeve_types.length > 0 && (
            <Field label="Lengan">
              <select
                value={lengan}
                onChange={(e) => setLengan(e.target.value)}
                className={inputCls}
              >
                <option value="">—</option>
                {product.sleeve_types.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {product.colors.length > 0 && (
            <Field label="Warna">
              <select
                value={warna}
                onChange={(e) => setWarna(e.target.value)}
                className={inputCls}
              >
                <option value="">—</option>
                {product.colors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Qty">
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {product && (
        <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Subtotal item ini
          </span>
          <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
            {formatRupiah(subtotal)}
          </span>
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={!product}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
      >
        Tambahkan ke Pesanan
      </button>
    </div>
  );
}

export default function POOrderEditForm({
  order,
  products,
  setting,
  onCancel,
  onSaved,
}: {
  order: POOrder;
  products: POProduct[];
  setting: POSetting;
  onCancel: () => void;
  onSaved: (updated: POOrder) => void;
}) {
  const [customerName, setCustomerName] = useState(order.customer_name);
  const [customerWa, setCustomerWa] = useState(order.customer_wa);
  const [deliveryMethod, setDeliveryMethod] = useState<"Diambil" | "Dikirim">(
    order.delivery_method,
  );
  const [shippingAddress, setShippingAddress] = useState(
    order.shipping_address || "",
  );
  const [notes, setNotes] = useState(order.notes || "");
  const [items, setItems] = useState<POOrderItem[]>([...order.order_items]);
  const [showAddRow, setShowAddRow] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeProducts = products.filter((p) => p.is_active);
  const grandTotal = items.reduce((sum, i) => sum + i.subtotal, 0);

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItemQty(index: number, qty: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, qty, subtotal: item.harga_satuan * qty }
          : item,
      ),
    );
  }

  function handleAddItem(newItem: POOrderItem) {
    setItems((prev) => [...prev, newItem]);
    setShowAddRow(false);
  }

  async function handleSave() {
    if (!customerName.trim() || !customerWa.trim()) {
      alert("Nama dan WhatsApp pemesan wajib diisi.");
      return;
    }
    if (deliveryMethod === "Dikirim" && !shippingAddress.trim()) {
      alert("Alamat pengiriman wajib diisi untuk metode Dikirim.");
      return;
    }
    if (items.length === 0) {
      alert("Pesanan harus memiliki minimal 1 item.");
      return;
    }

    setSaving(true);
    const result = await updatePOOrderFull(order.id, {
      customer_name: customerName.trim(),
      customer_wa: customerWa.trim(),
      delivery_method: deliveryMethod,
      shipping_address:
        deliveryMethod === "Dikirim" ? shippingAddress.trim() : null,
      notes: notes.trim() || null,
      order_items: items,
      total_amount: grandTotal,
    });
    setSaving(false);

    if (!result.success) {
      alert("Gagal menyimpan perubahan: " + result.error);
      return;
    }

    onSaved({
      ...order,
      customer_name: customerName.trim(),
      customer_wa: customerWa.trim(),
      delivery_method: deliveryMethod,
      shipping_address:
        deliveryMethod === "Dikirim" ? shippingAddress.trim() : null,
      notes: notes.trim() || null,
      order_items: items,
      total_amount: grandTotal,
    });
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={15} /> Batal, kembali ke detail
      </button>

      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
          Edit Pesanan
        </p>
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
          {order.po_number}
        </h2>
      </div>

      {/* Biodata */}
      <div className="space-y-4 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 md:p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Data Pemesan
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nama Lengkap">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="No. WhatsApp">
            <input
              type="text"
              value={customerWa}
              onChange={(e) => setCustomerWa(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Metode Pengambilan">
          <select
            value={deliveryMethod}
            onChange={(e) =>
              setDeliveryMethod(e.target.value as "Diambil" | "Dikirim")
            }
            className={inputCls}
          >
            <option value="Diambil">Diambil di Tempat</option>
            <option value="Dikirim">Dikirim ke Alamat</option>
          </select>
        </Field>

        {deliveryMethod === "Dikirim" && (
          <Field label="Alamat Lengkap Pengiriman">
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={3}
              className={`${inputCls} resize-y`}
            />
          </Field>
        )}

        <Field label="Catatan">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Catatan tambahan (opsional)"
            className={`${inputCls} resize-y`}
          />
        </Field>
      </div>

      {/* Items */}
      <div className="space-y-3 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 md:p-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Item Pesanan
          </p>
          {!showAddRow && (
            <button
              onClick={() => setShowAddRow(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Plus size={14} /> Tambah Item
            </button>
          )}
        </div>

        {items.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">
            Belum ada item. Tambahkan minimal 1 item.
          </p>
        )}

        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                  {item.product_name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {item.ukuran} · {item.lengan} · {item.warna} ·{" "}
                  {formatRupiah(item.harga_satuan)}/pcs
                </p>
              </div>
              <input
                type="number"
                min={1}
                value={item.qty}
                onChange={(e) =>
                  updateItemQty(i, Math.max(1, Number(e.target.value)))
                }
                className="w-16 text-sm text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5"
              />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 w-28 text-right">
                {formatRupiah(item.subtotal)}
              </span>
              <button
                onClick={() => removeItem(i)}
                className="text-red-400 hover:text-red-600 dark:hover:text-red-400 flex-shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {showAddRow && (
          <AddItemRow
            products={activeProducts}
            setting={setting}
            onAdd={handleAddItem}
            onCancel={() => setShowAddRow(false)}
          />
        )}

        <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
          <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Total Keseluruhan
          </span>
          <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatRupiah(grandTotal)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onCancel}
          className="w-full sm:w-auto px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl text-sm font-bold transition-colors"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save size={16} /> Simpan Perubahan
            </>
          )}
        </button>
      </div>
    </div>
  );
}
