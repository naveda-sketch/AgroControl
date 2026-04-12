import { supabase } from './supabase';

export async function deleteRecord(table: string, idField: string, id: string) {
  // First fetch the full record for undo capability
  const { data: record } = await supabase.from(table).select('*').eq(idField, id).single();

  if (!record) throw new Error('Registro no encontrado');

  // Delete
  const { error } = await supabase.from(table).delete().eq(idField, id);
  if (error) throw new Error(error.message);

  return record; // Return for undo
}

export async function restoreRecord(table: string, record: any) {
  const { error } = await supabase.from(table).insert(record);
  if (error) throw new Error('Error al restaurar: ' + error.message);
}
