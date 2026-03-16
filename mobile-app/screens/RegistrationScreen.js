import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export default function RegistrationScreen({ navigation }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');

  const submitEmergency = async () => {
    if (!name || !type) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const resp = await fetch('http://10.0.2.2:5001/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: name,
          emergency_type: type,
          severity_level: 'High',
          location: 'POINT(80.6480 16.5062)'
        })
      });
      if (resp.ok) {
        Alert.alert('Success', 'Emergency broadcasted to dispatchers!');
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert('Error', 'Could not connect to backend server. Make sure it is running.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Report Emergency</Text>

      <Text style={styles.label}>Patient Name:</Text>
      <TextInput 
        style={styles.input} 
        onChangeText={setName} 
        value={name} 
        placeholder="e.g. John Doe"
      />

      <Text style={styles.label}>Emergency Type:</Text>
      <TextInput 
        style={styles.input} 
        onChangeText={setType} 
        value={type} 
        placeholder="e.g. Cardiac Arrest, Accident"
      />

      <TouchableOpacity style={styles.button} onPress={submitEmergency}>
        <Text style={styles.buttonText}>Send Alert</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FFF' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#EF4444' },
  label: { fontSize: 16, marginBottom: 5, color: '#374151' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16 },
  button: { backgroundColor: '#EF4444', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});
