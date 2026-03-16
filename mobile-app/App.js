import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Screens
import HomeScreen from './screens/HomeScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import DispatcherScreen from './screens/DispatcherScreen';
import AmbulanceScreen from './screens/AmbulanceScreen';
import HospitalScreen from './screens/HospitalScreen';
import DriverLoginScreen from './screens/DriverLoginScreen';
import DriverHomeScreen from './screens/DriverHomeScreen';
import DriverNavigationScreen from './screens/DriverNavigationScreen';
import CallerEmergencyScreen from './screens/CallerEmergencyScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#1E3A8A' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'SARS - Smart Ambulance' }} 
        />
        <Stack.Screen 
          name="Registration" 
          component={RegistrationScreen} 
          options={{ title: 'Report Emergency' }} 
        />
        <Stack.Screen 
          name="Dispatcher" 
          component={DispatcherScreen} 
          options={{ title: 'Dispatcher Dashboard' }} 
        />
        <Stack.Screen 
          name="Ambulance" 
          component={AmbulanceScreen} 
          options={{ title: 'Ambulance Login' }} 
        />
        <Stack.Screen 
          name="Hospital" 
          component={HospitalScreen} 
          options={{ title: 'Hospital Intake' }} 
        />
        <Stack.Screen 
          name="DriverLogin" 
          component={DriverLoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="DriverHome" 
          component={DriverHomeScreen} 
          options={{ title: 'Driver Dashboard' }} 
        />
        <Stack.Screen 
          name="DriverNavigation" 
          component={DriverNavigationScreen} 
          options={{ title: 'Navigation' }} 
        />
        <Stack.Screen 
          name="CallerEmergency" 
          component={CallerEmergencyScreen} 
          options={{ title: 'Report Emergency', headerStyle: { backgroundColor: '#dc2626' } }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
