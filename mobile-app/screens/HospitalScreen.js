import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import io from 'socket.io-client';

const socket = io('http://10.0.2.2:5001');

export default function HospitalScreen() {
  const [incoming, setIncoming] = useState([]);

  useEffect(() => {
    socket.on('ambulance_dispatched', (data) => {
      setIncoming(prev => [...prev, data.emergency]);
    });

    return () => socket.off('ambulance_dispatched');
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.statsCard}>
        <Text style={styles.hospitalName}>Siddhartha General Hospital</Text>
        <Text style={styles.beds}>Available ICU Beds: 12</Text>
      </View>

      <Text style={styles.header}>Incoming Patients (ETA)</Text>
      <FlatList 
        data={incoming}
        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
        renderItem={({ item }) => (
          <View style={styles.patientCard}>
            <Text style={styles.type}>{item.emergency_type}</Text>
            <Text style={styles.details}>Patient: {item.patient_name}</Text>
            <Text style={styles.eta}>ETA: ~14 mins</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 50, color: '#6B7280'}}>No incoming patients matching this hospital.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  statsCard: { backgroundColor: '#1E3A8A', padding: 30, paddingBottom: 40 },
  hospitalName: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  beds: { color: '#BFDBFE', marginTop: 10, fontSize: 16 },
  header: { fontSize: 18, fontWeight: 'bold', margin: 20, color: '#111827' },
  patientCard: { backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 15, padding: 15, borderRadius: 8, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  type: { fontWeight: 'bold', fontSize: 16, color: '#D97706' },
  details: { color: '#374151', marginVertical: 5 },
  eta: { color: '#EF4444', fontWeight: 'bold' }
});
