import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import io from 'socket.io-client';

const socket = io('http://10.0.2.2:5001');
const AMBULANCE_ID = 1; // Dummy ID for this device

export default function AmbulanceScreen() {
  const [mission, setMission] = useState(null);

  useEffect(() => {
    socket.on('ambulance_dispatched', (data) => {
      if (data.ambulance_id === AMBULANCE_ID) {
        setMission(data.emergency);
      }
    });

    return () => socket.off('ambulance_dispatched');
  }, []);

  const updateLocation = () => {
    // Simulate GPS movement
    socket.emit('update_location', {
      ambulance_id: AMBULANCE_ID,
      lat: 16.5062 + (Math.random() * 0.01),
      lng: 80.6480 + (Math.random() * 0.01)
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ambulance Navigation</Text>
      
      {mission ? (
        <View style={styles.missionCard}>
          <Text style={styles.alert}>NEW MISSION ASSIGNED</Text>
          <Text style={styles.details}>Patient: {mission.patient_name}</Text>
          <Text style={styles.details}>Type: {mission.emergency_type}</Text>
          
          <TouchableOpacity style={styles.locBtn} onPress={updateLocation}>
            <Text style={styles.locBtnText}>Simulate GPS Update</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.idleCard}>
          <Text style={styles.idleText}>Status: Idle / Available</Text>
          <Text style={styles.subText}>Waiting for dispatch orders...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 20 },
  missionCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 10, borderLeftWidth: 5, borderLeftColor: '#EF4444', elevation: 3 },
  alert: { fontSize: 18, color: '#EF4444', fontWeight: 'bold', marginBottom: 10 },
  details: { fontSize: 16, marginBottom: 5, color: '#4B5563' },
  locBtn: { marginTop: 20, backgroundColor: '#10B981', padding: 15, borderRadius: 8, alignItems: 'center' },
  locBtnText: { color: 'white', fontWeight: 'bold' },
  idleCard: { backgroundColor: '#ECFDF5', padding: 30, borderRadius: 10, alignItems: 'center', borderColor: '#34D399', borderWidth: 1 },
  idleText: { fontSize: 18, fontWeight: 'bold', color: '#065F46' },
  subText: { marginTop: 10, color: '#047857' }
});
