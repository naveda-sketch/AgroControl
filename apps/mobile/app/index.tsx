import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const ETAPAS = [
  { tipo: 'PREPARACION', label: 'Preparación', icon: '🚜', color: '#d4a96e' },
  { tipo: 'SIEMBRA', label: 'Siembra', icon: '🌱', color: '#22c55e' },
  { tipo: 'DESARROLLO', label: 'Desarrollo', icon: '🌿', color: '#16a34a' },
  { tipo: 'COSECHA', label: 'Cosecha', icon: '🌽', color: '#a67635' },
] as const;

export default function SelectEtapa() {
  const router = useRouter();

  const handleSelectEtapa = (tipo: string) => {
    router.push({ pathname: '/captura', params: { etapa: tipo } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seleccionar Etapa</Text>
      <Text style={styles.subtitle}>Toque la etapa para registrar un gasto</Text>
      <View style={styles.grid}>
        {ETAPAS.map((etapa) => (
          <TouchableOpacity
            key={etapa.tipo}
            style={[styles.button, { backgroundColor: etapa.color }]}
            onPress={() => handleSelectEtapa(etapa.tipo)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{etapa.icon}</Text>
            <Text style={styles.buttonText}>{etapa.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#14532d',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#166534',
    textAlign: 'center',
    marginBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    width: '45%',
    minHeight: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  icon: {
    fontSize: 40,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});
