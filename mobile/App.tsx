import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
// import { CallTriggerService } from './src/services/CallTriggerService'; // Temporarily disabled to isolate screen capture permission issue

export default function App() {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        console.log('Notifications setup temporarily disabled for debugging');
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
