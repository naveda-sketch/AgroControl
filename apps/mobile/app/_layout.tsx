import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#15803d' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'AgroControl' }} />
        <Stack.Screen name="captura" options={{ title: 'Capturar Ticket' }} />
        <Stack.Screen name="confirmar" options={{ title: 'Confirmar Gasto' }} />
      </Stack>
    </>
  );
}
