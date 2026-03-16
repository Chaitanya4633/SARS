import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import io from 'socket.io-client';

const socket = io('http://10.0.2.2:5001');

export default function DispatcherScreen({ navigation }) {
  const [emergencies, setEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);

  useEffect(() => {
    // Fetch initial data
    fetch('http://10.0.2.2:5001/ambulances')
      .then(r => r.json())
      .then(data => setAmbulances(data))
      .catch(e => console.log('Ambulance fetch error:', e.message));

    // Listen for socket events
    socket.on('new_emergency', (data) => {
      setEmergencies((prev) => [...prev, data]);
      Alert.alert('New Emergency Alert!', `${data.emergency_type} - ${data.patient_name}`);
    });

    socket.on('location_update', (data) => {
      setAmbulances(prev => 
        prev.map(a => a.id === data.ambulance_id ? { ...a, lat: data.lat, lng: data.lng } : a)
      );
    });

    return () => {
      socket.off('new_emergency');
      socket.off('location_update');
    };
  }, []);

  const dispatchAmbulance = async (emergencyId) => {
    const availableAmb = ambulances.find(a => a.status === 'Available');
    if (!availableAmb) {
      Alert.alert('Error', 'No ambulances available!');
      return;
    }

    try {
      const resp = await fetch('http://10.0.2.2:5001/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergency_id: emergencyId,
          ambulance_id: availableAmb.id
        })
      });
      if (resp.ok) {
        Alert.alert('Success', `Ambulance ${availableAmb.vehicle_number} dispatched!`);
        // Update local state temporarily
        setEmergencies(prev => prev.filter(e => e.id !== emergencyId));
        setAmbulances(prev => prev.map(a => a.id === availableAmb.id ? { ...a, status: 'En Route' } : a));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView 
          style={styles.map}
          initialRegion={{
            latitude: 16.5062,
            longitude: 80.6480,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {ambulances.map(amb => (
            <Marker 
              key={`a-${amb.id}`}
              coordinate={{ latitude: amb.lat, longitude: amb.lng }}
              title={`Ambulance ${amb.vehicle_number}`}
              description={`Status: ${amb.status}`}
              pinColor={amb.status === 'Available' ? 'green' : 'orange'}
            />
          ))}
          {emergencies.map(em => (
            <Marker 
              key={`e-${em.id}`}
              coordinate={{ latitude: em.lat, longitude: em.lng }}
              title={`Emergency: ${em.emergency_type}`}
              description={`Patient: ${em.patient_name}`}
              pinColor="red"
            />
          ))}
        </MapView>
      </View>
      <View style={styles.listContainer}>
        <Text style={styles.header}>Pending Emergencies</Text>
        <FlatList 
          data={emergencies}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.patientName}>{item.patient_name}</Text>
                <Text style={styles.emergencyType}>{item.emergency_type}</Text>
              </View>
              <TouchableOpacity 
                style={styles.dispatchBtn} 
                onPress={() => dispatchAmbulance(item.id)}
              >
                <Text style={styles.dispatchText}>DISPATCH</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={{padding: 20}}>No active emergencies.</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  mapContainer: { flex: 0.5 },
  map: { width: '100%', height: '100%' },
  listContainer: { flex: 0.5, backgroundColor: '#F9FAFB' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 15, backgroundColor: '#E5E7EB', color: '#111827' },
  card: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' },
  patientName: { fontWeight: 'bold', fontSize: 16, color: '#374151' },
  emergencyType: { color: '#EF4444' },
  dispatchBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 6 },
  dispatchText: { color: '#FFF', fontWeight: 'bold' }
});
