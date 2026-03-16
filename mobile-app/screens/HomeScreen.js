import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Ambulance Routing System</Text>
      <Text style={styles.subtitle}>Saving lives through optimized response</Text>

      {/* BIG RED CALL BUTTON - For Public */}
      <TouchableOpacity 
        style={[styles.button, styles.callBtn]}
        onPress={() => navigation.navigate('CallerEmergency')}
      >
        <Text style={styles.callIcon}>🚨</Text>
        <Text style={styles.callBtnText}>CALL AMBULANCE</Text>
        <Text style={styles.callSubtext}>Emergency? Tap here!</Text>
      </TouchableOpacity>

      <View style={styles.separator} />
      <Text style={styles.sectionTitle}>Staff Login</Text>

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
  callBtn: {
    backgroundColor: '#dc2626',
    padding: 30,
    borderRadius: 16,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  callIcon: {
    fontSize: 48,
    marginBottom: 10
  },
  callBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24
  },
  callSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 5
  },
  sectionTitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500'
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center'
  },
  dispatchBtn: { backgroundColor: '#3B82F6' },
  ambBtn: { backgroundColor: '#F59E0B' },
  hospBtn: { backgroundColor: '#10B981' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  separator: {
    height: 1,
    backgroundColor: '#D1D5DB',
    marginVertical: 20
  }
});
