import { supabase } from './supabase';

export interface SessionUser {
  id_usuario: string;
  nombre: string;
  rol: string;
  email: string | null;
}

export async function loginWithPin(pin: string): Promise<SessionUser | null> {
  const { data } = await supabase
    .from('usuario')
    .select('id_usuario, nombre, rol, email')
    .eq('pin_acceso', pin)
    .eq('activo', true)
    .single();

  return data;
}

export async function getUsuarios() {
  const { data } = await supabase
    .from('usuario')
    .select('id_usuario, nombre, rol')
    .eq('activo', true)
    .order('nombre');
  return data ?? [];
}
