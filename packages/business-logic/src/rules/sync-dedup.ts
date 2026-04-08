/**
 * REGLA 5 — Offline-First: Sincronización y Deduplicación
 * Cola de sincronización con deduplicación por sync_id.
 * Conflictos se resuelven por timestamp (last-write-wins).
 */
export interface SyncRecord {
  sync_id: string;
  timestamp: string;
  data: unknown;
}

export function isDuplicate(existingSyncIds: Set<string>, syncId: string): boolean {
  return existingSyncIds.has(syncId);
}

export function resolveConflict(local: SyncRecord, remote: SyncRecord): SyncRecord {
  const localTime = new Date(local.timestamp).getTime();
  const remoteTime = new Date(remote.timestamp).getTime();
  return localTime >= remoteTime ? local : remote;
}

export function filterNewRecords(
  records: SyncRecord[],
  existingSyncIds: Set<string>,
): SyncRecord[] {
  return records.filter((r) => !existingSyncIds.has(r.sync_id));
}

export function generateSyncId(): string {
  return crypto.randomUUID();
}
