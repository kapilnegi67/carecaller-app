import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ScheduleCallScreen } from '../screens/ScheduleCallScreen';
import { CallHistoryScreen } from '../screens/CallHistoryScreen';
import { VoiceCallScreen } from '../screens/VoiceCallScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen 
      name="VoiceCall" 
      component={VoiceCallScreen}
      options={{ 
        gestureEnabled: false,
        headerShown: false 
      }}
    />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        if (route.name === 'Schedule') {
          iconName = focused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'History') {
          iconName = focused ? 'time' : 'time-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        } else {
          iconName = 'help-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#3498db',
      tabBarInactiveTintColor: '#7f8c8d',
      headerShown: false,
    })}
  >
    <Tab.Screen 
      name="Schedule" 
      component={ScheduleCallScreen}
      options={{ tabBarLabel: 'Schedule Call' }}
    />
    <Tab.Screen 
      name="History" 
      component={CallHistoryScreen}
      options={{ tabBarLabel: 'Call History' }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ tabBarLabel: 'Profile' }}
    />
  </Tab.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return null; // You could add a loading screen here
  }

  return (
    <NavigationContainer>
      {currentUser ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};
