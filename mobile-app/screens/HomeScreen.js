import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Ambulance Routing System</Text>
      <Text style={styles.subtitle}>Saving lives through optimized response</Text>

      <TouchableOpacity 
        style={[styles.button, styles.patientBtn]}
        onPress={() => navigation.navigate('Registration')}
      >
        <Text style={styles.btnText}>Emergency Registration</Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      <TouchableOpacity 
        style={[styles.button, styles.dispatchBtn]}
        onPress={() => navigation.navigate('Dispatcher')}
      >
        <Text style={styles.btnText}>Dispatcher Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.ambBtn]}
        onPress={() => navigation.navigate('DriverLogin')}
      >
        <Text style={styles.btnText}>Ambulance Driver Login</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.hospBtn]}
        onPress={() => navigation.navigate('Hospital')}
      >
        <Text style={styles.btnText}>Hospital View</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#F3F4F6'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center'
  },
  patientBtn: { backgroundColor: '#EF4444' }, // Red
  dispatchBtn: { backgroundColor: '#3B82F6' }, // Blue
  ambBtn: { backgroundColor: '#F59E0B' }, // Yellow/Orange
  hospBtn: { backgroundColor: '#10B981' }, // Green
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  separator: {
    height: 1,
    backgroundColor: '#D1D5DB',
    marginVertical: 20
  }
});
