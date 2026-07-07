import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { HargaConfig } from "./types";

const DEFAULT_CONFIG: HargaConfig = {
  id: 1,
  biaya_ukuran_besar: 5000,
  biaya_lengan_panjang: 10000,
};

export function useHargaConfig() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const [config, setConfig] = useState<HargaConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("harga_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (data) setConfig(data as HargaConfig);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  /** Simpan konfigurasi baru. Tidak memengaruhi total_harga order yang
   *  sudah pernah dihitung sebelumnya — itu sudah tersimpan permanen. */
  const saveConfig = useCallback(
    async (
      next: Pick<HargaConfig, "biaya_ukuran_besar" | "biaya_lengan_panjang">,
      updatedBy: string,
    ) => {
      const { data, error } = await supabase
        .from("harga_config")
        .update({
          ...next,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        })
        .eq("id", 1)
        .select()
        .maybeSingle();
      if (!error && data) setConfig(data as HargaConfig);
      return { error };
    },
    [supabase],
  );

  return { config, loading, saveConfig, refetch: fetchConfig };
}