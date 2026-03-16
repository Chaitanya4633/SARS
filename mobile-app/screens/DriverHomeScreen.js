import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import io from 'socket.io-client';

const SERVER_URL = 'http://192.168.1.100:5002';

const DriverHomeScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { ambulanceId } = route.params || {};
  
  const [assignedEmergency, setAssignedEmergency] = useState(null);
  const [ambulanceStatus, setAmbulanceStatus] = useState('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = io(SERVER_URL);
    
    // Listen for new assignments
    socket.on('ambulance_assigned', (data) => {
      if (data.ambulance_id === ambulanceId) {
        Alert.alert(
          'New Emergency Assigned',
          `Emergency #${data.request_id} assigned to you`,
          [
            { 
              text: 'View Details', 
              onPress: () => fetchAssignedEmergency()
            },
            { text: 'Later', style: 'cancel' }
          ]
        );
      }
    });

    fetchAssignedEmergency();
    fetchAmbulanceStatus();

    return () => socket.disconnect();
  }, []);

  const fetchAssignedEmergency = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/requests?status=assigned`);
      const data = await response.json();
      const myEmergency = data.find(e => e.ambulance_id === ambulanceId);
      setAssignedEmergency(myEmergency || null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching emergency:', error);
      setLoading(false);
    }
  };

  const fetchAmbulanceStatus = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/ambulances`);
      const data = await response.json();
      const myAmbulance = data.find(a => a.ambulance_id === ambulanceId);
      if (myAmbulance) {
        setAmbulanceStatus(myAmbulance.status);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      await fetch(`${SERVER_URL}/ambulance/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ambulance_id: ambulanceId, status: newStatus })
      });
      setAmbulanceStatus(newStatus);
      Alert.alert('Status Updated', `Ambulance is now ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleStartNavigation = () => {
    if (!assignedEmergency) {
      Alert.alert('No Assignment', 'You have no active emergency assigned');
      return;
    }
    
    navigation.navigate('DriverNavigation', {
      ambulanceId,
      emergencyId: assignedEmergency.request_id,
      destination: {
        latitude: parseFloat(assignedEmergency.latitude) || 17.4065,
        longitude: parseFloat(assignedEmergency.longitude) || 78.4772
      },
      type: 'pickup'
    });
  };

  const getStatusColor = () => {
    switch(ambulanceStatus) {
      case 'active': return '#22c55e';
      case 'busy': return '#ef4444';
      case 'returning': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Driver Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ambulance Driver</Text>
        <Text style={styles.ambulanceId}>Vehicle #{ambulanceId}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{ambulanceStatus.toUpperCase()}</Text>
        </View>
      </View>

      {/* Active Emergency Card */}
      {assignedEmergency ? (
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyHeader}>
            <Text style={styles.emergencyTitle}>🚨 Active Emergency</Text>
            <View style={[styles.severityBadge, { 
              backgroundColor: assignedEmergency.severity_level === 'critical' ? '#fee2e2' : 
                              assignedEmergency.severity_level === 'high' ? '#fef3c7' : '#dbeafe'
            }]}>
              <Text style={[styles.severityText, { 
                color: assignedEmergency.severity_level === 'critical' ? '#dc2626' : 
                       assignedEmergency.severity_level === 'high' ? '#d97706' : '#2563eb'
              }]}>
                {assignedEmergency.severity_level.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Patient:</Text>
            <Text style={styles.infoValue}>{assignedEmergency.patient_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Emergency Type:</Text>
            <Text style={styles.infoValue}>{assignedEmergency.emergency_type}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{assignedEmergency.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{assignedEmergency.phone || 'N/A'}</Text>
          </View>

          <TouchableOpacity 
            style={styles.navigateButton}
            onPress={handleStartNavigation}
          >
            <Text style={styles.navigateButtonText}>🧭 Start Navigation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noEmergencyCard}>
          <Text style={styles.noEmergencyIcon}>✅</Text>
          <Text style={styles.noEmergencyText}>No Active Emergencies</Text>
          <Text style={styles.noEmergencySubtext}>You are on standby</Text>
        </View>
      )}

      {/* Status Control */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Update Status</Text>
        <View style={styles.statusButtons}>
          <TouchableOpacity 
            style={[styles.statusBtn, ambulanceStatus === 'active' && styles.statusBtnActive]}
            onPress={() => updateStatus('active')}
          >
            <Text style={styles.statusBtnText}>Active</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statusBtn, ambulanceStatus === 'returning' && styles.statusBtnActive]}
            onPress={() => updateStatus('returning')}
          >
            <Text style={styles.statusBtnText}>Returning</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statusBtn, ambulanceStatus === 'maintenance' && styles.statusBtnActive]}
            onPress={() => updateStatus('maintenance')}
          >
            <Text style={styles.statusBtnText}>Maintenance</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('DriverHistory', { ambulanceId })}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Help', 'Contact dispatcher at 108')}>
            <Text style={styles.actionIcon}>🆘</Text>
            <Text style={styles.actionText}>SOS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtn} onPress={fetchAssignedEmergency}>
            <Text style={styles.actionIcon}>🔄</Text>
            <Text style={styles.actionText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  header: {
    backgroundColor: '#1e3a8a',
    padding: 20,
    alignItems: 'center'
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold'
  },
  ambulanceId: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4
  },
  statusBadge: {
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12
  },
  emergencyCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a'
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    color: '#6b7280'
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500'
  },
  navigateButton: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  noEmergencyCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  noEmergencyIcon: {
    fontSize: 48,
    marginBottom: 10
  },
  noEmergencyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a'
  },
  noEmergencySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 5
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 15
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 10
  },
  statusBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  statusBtnActive: {
    backgroundColor: '#3b82f6'
  },
  statusBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151'
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  actionBtn: {
    alignItems: 'center',
    padding: 15
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 5
  },
  actionText: {
    fontSize: 12,
    color: '#4b5563'
  }
});

export default DriverHomeScreen;
