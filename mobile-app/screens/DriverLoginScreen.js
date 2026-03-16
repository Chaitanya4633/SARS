import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SERVER_URL = 'http://192.168.1.100:5002';

const DriverLoginScreen = () => {
  const navigation = useNavigation();
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!vehicleNumber.trim() || !driverName.trim()) {
      Alert.alert('Error', 'Please enter both vehicle number and driver name');
      return;
    }

    setLoading(true);
    
    try {
      // Find ambulance by vehicle number
      const response = await fetch(`${SERVER_URL}/ambulances`);
      const ambulances = await response.json();
      
      const ambulance = ambulances.find(
        a => a.vehicle_number.toLowerCase() === vehicleNumber.toLowerCase()
      );

      if (!ambulance) {
        Alert.alert('Error', 'Ambulance not found. Please check vehicle number.');
        setLoading(false);
        return;
      }

      // Verify driver name matches
      if (ambulance.driver_name.toLowerCase() !== driverName.toLowerCase()) {
        Alert.alert('Error', 'Driver name does not match our records.');
        setLoading(false);
        return;
      }

      // Success - navigate to driver home
      Alert.alert('Success', `Welcome, ${driverName}!`);
      navigation.navigate('DriverHome', { ambulanceId: ambulance.ambulance_id });
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginCard}>
        <Text style={styles.icon}>🚑</Text>
        <Text style={styles.title}>Ambulance Driver Login</Text>
        <Text style={styles.subtitle}>Smart Ambulance Routing System</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Vehicle Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., TS-01-AB-1234"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Driver Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={driverName}
            onChangeText={setDriverName}
          />
        </View>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.helpSection}>
        <Text style={styles.helpText}>Need help? Contact dispatcher: 108</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    padding: 20
  },
  loginCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  icon: {
    fontSize: 64,
    marginBottom: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 30
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  backButton: {
    marginTop: 20,
    padding: 10
  },
  backButtonText: {
    color: '#6b7280',
    fontSize: 14
  },
  helpSection: {
    marginTop: 30,
    alignItems: 'center'
  },
  helpText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14
  }
});

export default DriverLoginScreen;
