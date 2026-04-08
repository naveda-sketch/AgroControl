import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

export default function CapturaTicket() {
  const { etapa } = useLocalSearchParams<{ etapa: string }>();
  const router = useRouter();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  const handleTakePhoto = async () => {
    // TODO: Integrate expo-camera / expo-image-picker
    setOcrProcessing(true);
    // Simulate OCR processing
    setTimeout(() => setOcrProcessing(false), 1500);
  };

  const handleContinue = () => {
    router.push({ pathname: '/confirmar', params: { etapa } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.etapaLabel}>Etapa: {etapa}</Text>

      <TouchableOpacity style={styles.cameraArea} onPress={handleTakePhoto} activeOpacity={0.7}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.cameraText}>Tomar foto del ticket</Text>
          </View>
        )}
      </TouchableOpacity>

      {ocrProcessing && (
        <View style={styles.ocrBanner}>
          <Text style={styles.ocrText}>OCR procesando...</Text>
        </View>
      )}

      <View style={styles.ocrResults}>
        <Text style={styles.ocrTitle}>Datos extraídos:</Text>
        <Text style={styles.ocrField}>Proveedor: --</Text>
        <Text style={styles.ocrField}>Fecha: --</Text>
        <Text style={styles.ocrField}>Subtotal: --</Text>
        <Text style={styles.ocrField}>IVA: --</Text>
        <Text style={styles.ocrField}>Total: --</Text>
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.7}>
        <Text style={styles.continueText}>CONTINUAR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4', padding: 20 },
  etapaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803d',
    marginBottom: 16,
  },
  cameraArea: {
    height: 250,
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: { fontSize: 60, marginBottom: 8 },
  cameraText: { fontSize: 18, color: '#6b7280' },
  preview: { width: '100%', height: '100%' },
  ocrBanner: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  ocrText: { color: '#92400e', fontWeight: '600' },
  ocrResults: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  ocrTitle: { fontSize: 16, fontWeight: 'bold', color: '#14532d', marginBottom: 8 },
  ocrField: { fontSize: 14, color: '#374151', marginBottom: 4 },
  continueButton: {
    backgroundColor: '#15803d',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
