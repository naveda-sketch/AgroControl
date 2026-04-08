import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

export default function ConfirmarGasto() {
  const { etapa } = useLocalSearchParams<{ etapa: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [isOnline] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // TODO: Save to local SQLite + sync queue
    setTimeout(() => {
      setSaving(false);
      router.replace('/');
    }, 500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, isOnline ? styles.online : styles.offline]} />
        <Text style={styles.statusText}>{isOnline ? 'En línea' : 'Sin conexión'}</Text>
      </View>

      <Text style={styles.title}>Confirmar Gasto</Text>

      <View style={styles.summary}>
        <View style={styles.row}>
          <Text style={styles.label}>Etapa:</Text>
          <Text style={styles.value}>{etapa}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Concepto:</Text>
          <Text style={styles.value}>--</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tipo:</Text>
          <Text style={styles.value}>OPEX</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Monto:</Text>
          <Text style={styles.value}>$0.00</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        activeOpacity={0.7}
        disabled={saving}
      >
        <Text style={styles.saveText}>{saving ? 'GUARDANDO...' : 'GUARDAR GASTO'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4', padding: 20 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  online: { backgroundColor: '#22c55e' },
  offline: { backgroundColor: '#ef4444' },
  statusText: { fontSize: 14, color: '#6b7280' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#14532d',
    marginBottom: 24,
  },
  summary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  label: { fontSize: 16, color: '#6b7280' },
  value: { fontSize: 16, fontWeight: '600', color: '#14532d' },
  saveButton: {
    backgroundColor: '#15803d',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 64,
    justifyContent: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#86efac' },
  saveText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});
