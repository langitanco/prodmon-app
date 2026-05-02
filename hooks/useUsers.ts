// hooks/useUsers.ts
import { useState, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserData, ProductionTypeData } from '@/types';
import { DEFAULT_PRODUCTION_TYPES } from '@/lib/utils';

interface UseUsersProps {
  supabase: SupabaseClient;
  showAlert: (title: string, message: string, type?: 'success' | 'error') => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export function useUsers({ supabase, showAlert, showConfirm }: UseUsersProps) {
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [productionTypes, setProductionTypes] = useState<ProductionTypeData[]>([]);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from('users').select('*').order('name');
    if (data) setUsersList(data);
  }, [supabase]);

  const fetchProductionTypes = useCallback(async () => {
    const { data } = await supabase.from('production_types').select('*').order('name');
    if (data) setProductionTypes(data);
    else setProductionTypes(DEFAULT_PRODUCTION_TYPES);
  }, [supabase]);

  // ─── User CRUD ────────────────────────────────────────────────────────────

  const handleSaveUser = useCallback(async (u: any) => {
    const p: any = { name: u.name, role: u.role, username: u.username };
    if (u.permissions) p.permissions = u.permissions;
    if (u.password?.trim()) p.password = u.password;
    const { error } = u.id
      ? await supabase.from('users').update(p).eq('id', u.id)
      : await supabase.from('users').insert([p]);
    if (!error) { fetchUsers(); showAlert('Sukses', 'User tersimpan'); }
  }, [supabase, fetchUsers, showAlert]);

  const handleDeleteUser = useCallback(async (id: string) => {
    showConfirm('Hapus User?', 'User akan dihapus.', async () => {
      await supabase.from('users').delete().eq('id', id);
      fetchUsers();
      showAlert('Sukses', 'Dihapus');
    });
  }, [showConfirm, supabase, fetchUsers, showAlert]);

  // ─── Production Type CRUD ─────────────────────────────────────────────────

  const handleSaveType = useCallback(async (t: any) => {
    const p = { name: t.name, value: t.value };
    const { error } = t.id
      ? await supabase.from('production_types').update(p).eq('id', t.id)
      : await supabase.from('production_types').insert([p]);
    if (!error) { fetchProductionTypes(); showAlert('Sukses', 'Tipe tersimpan'); }
  }, [supabase, fetchProductionTypes, showAlert]);

  const handleDeleteType = useCallback(async (id: string) => {
    showConfirm('Hapus Tipe?', 'Yakin hapus?', async () => {
      await supabase.from('production_types').delete().eq('id', id);
      fetchProductionTypes();
      showAlert('Sukses', 'Dihapus');
    });
  }, [showConfirm, supabase, fetchProductionTypes, showAlert]);

  return {
    usersList,
    productionTypes,
    fetchUsers,
    fetchProductionTypes,
    handleSaveUser,
    handleDeleteUser,
    handleSaveType,
    handleDeleteType,
  };
}