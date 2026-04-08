import { describe, it, expect } from 'vitest';
import { isDuplicate, resolveConflict, filterNewRecords, generateSyncId } from '../sync-dedup';
import type { SyncRecord } from '../sync-dedup';

describe('Regla 5 — Offline-First: Sync/Dedup', () => {
  describe('isDuplicate', () => {
    it('detecta duplicado por sync_id', () => {
      const existing = new Set(['aaa-111', 'bbb-222', 'ccc-333']);
      expect(isDuplicate(existing, 'bbb-222')).toBe(true);
    });

    it('retorna false para sync_id nuevo', () => {
      const existing = new Set(['aaa-111']);
      expect(isDuplicate(existing, 'ddd-444')).toBe(false);
    });

    it('funciona con set vacío', () => {
      const existing = new Set<string>();
      expect(isDuplicate(existing, 'aaa-111')).toBe(false);
    });
  });

  describe('resolveConflict (last-write-wins)', () => {
    const local: SyncRecord = {
      sync_id: 'abc-123',
      timestamp: '2026-04-08T15:30:00Z',
      data: { monto: 5000 },
    };

    const remote: SyncRecord = {
      sync_id: 'abc-123',
      timestamp: '2026-04-08T14:00:00Z',
      data: { monto: 4500 },
    };

    it('elige el registro local si es más reciente', () => {
      const winner = resolveConflict(local, remote);
      expect(winner).toBe(local);
    });

    it('elige el registro remoto si es más reciente', () => {
      const winner = resolveConflict(remote, { ...local, timestamp: '2026-04-08T12:00:00Z' });
      expect(winner).toBe(remote);
    });

    it('elige local si timestamps son iguales', () => {
      const sameTime: SyncRecord = { ...remote, timestamp: local.timestamp };
      const winner = resolveConflict(local, sameTime);
      expect(winner).toBe(local);
    });
  });

  describe('filterNewRecords', () => {
    it('filtra registros que ya existen', () => {
      const records: SyncRecord[] = [
        { sync_id: 'aaa', timestamp: '', data: null },
        { sync_id: 'bbb', timestamp: '', data: null },
        { sync_id: 'ccc', timestamp: '', data: null },
      ];
      const existing = new Set(['bbb']);
      const newOnes = filterNewRecords(records, existing);
      expect(newOnes).toHaveLength(2);
      expect(newOnes.map((r) => r.sync_id)).toEqual(['aaa', 'ccc']);
    });

    it('retorna todos si ninguno existe', () => {
      const records: SyncRecord[] = [{ sync_id: 'xxx', timestamp: '', data: null }];
      const existing = new Set<string>();
      expect(filterNewRecords(records, existing)).toHaveLength(1);
    });

    it('retorna vacío si todos existen', () => {
      const records: SyncRecord[] = [{ sync_id: 'aaa', timestamp: '', data: null }];
      const existing = new Set(['aaa']);
      expect(filterNewRecords(records, existing)).toHaveLength(0);
    });
  });

  describe('generateSyncId', () => {
    it('genera un UUID válido', () => {
      const id = generateSyncId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('genera IDs únicos', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateSyncId()));
      expect(ids.size).toBe(100);
    });
  });
});
