import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, Alert, ActivityIndicator, Platform 
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';

const SERVER_URL = 'http://192.168.1.100:5002';

const CallerEmergencyScreen = () => {
  const navigation = useNavigation();
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [selectedType, setSelectedType] = useState('general');
  const [severity, setSeverity] = useState('medium');
  const [gpsLocation, setGpsLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const emergencyTypes = [
    { id: 'heart_attack', name: 'Heart Attack', icon: '❤️', color: '#fef2f2', borderColor: '#ef4444' },
    { id: 'stroke', name: 'Stroke', icon: '🧠', color: '#fffbeb', borderColor: '#f59e0b' },
    { id: 'accident', name: 'Accident', icon: '⚠️', color: '#f0fdf4', borderColor: '#22c55e' },
    { id: 'general', name: 'General', icon: '🚑', color: '#eff6ff', borderColor: '#3b82f6' },
  ];

  const severityLevels = [
    { id: 'low', name: 'Low', color: '#22c55e' },
    { id: 'medium', name: 'Medium', color: '#f59e0b' },
    { id: 'high', name: 'High', color: '#f97316' },
    { id: 'critical', name: 'Critical', color: '#ef4444' },
  ];

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      };
      setGpsLocation(coords);
      setLocation(`${coords.latitude}, ${coords.longitude}`);
    } catch (error) {
      console.log('Location error:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!patientName.trim() || !phone.trim() || !location.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const [lat, lng] = location.split(',').map(s => parseFloat(s.trim()));
      
      const response = await fetch(`${SERVER_URL}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patientName,
          phone: phone,
          location: location,
          latitude: lat || gpsLocation?.latitude || 17.4065,
          longitude: lng || gpsLocation?.longitude || 78.4772,
          emergency_type: selectedType,
          severity_level: severity
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Emergency Reported!',
          `Request #${data.request_id} created.\nAmbulance will be dispatched shortly.`,
          [
            { 
              text: 'Track Status', 
              onPress: () => navigation.navigate('TrackEmergency', { requestId: data.request_id })
            },
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to report emergency');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server. Please try again.');
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚨 Emergency Call</Text>
        <Text style={styles.headerSubtitle}>Report emergency for quick response</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>1</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>4</Text>
          <Text style={styles.statLabel}>Hospitals</Text>
        </View>
      </View>

      {/* Emergency Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Emergency Type</Text>
        <View style={styles.typeGrid}>
          {emergencyTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                { backgroundColor: type.color, borderColor: type.borderColor },
                selectedType === type.id && styles.typeCardSelected
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <Text style={styles.typeName}>{type.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Severity Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Severity Level</Text>
        <View style={styles.severityRow}>
          {severityLevels.map((sev) => (
            <TouchableOpacity
              key={sev.id}
              style={[
                styles.severityBtn,
                { backgroundColor: sev.color + '20', borderColor: sev.color },
                severity === sev.id && { backgroundColor: sev.color }
              ]}
              onPress={() => setSeverity(sev.id)}
            >
              <Text style={[
                styles.severityText,
                { color: sev.color },
                severity === sev.id && { color: 'white' }
              ]}>
                {sev.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Patient Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Patient Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter patient name"
            value={patientName}
            onChangeText={setPatientName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location *</Text>
          <View style={styles.locationRow}>
            <TextInput
              style={[styles.input, styles.locationInput]}
              placeholder="lat, lng or address"
              value={location}
              onChangeText={setLocation}
            />
            <TouchableOpacity 
              style={styles.gpsBtn}
              onPress={getCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.gpsBtnText}>📍</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Call Button */}
      <TouchableOpacity 
        style={styles.callButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" size="large" />
        ) : (
          <>
            <Text style={styles.callIcon}>🚑</Text>
            <Text style={styles.callButtonText}>CALL AMBULANCE</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    backgroundColor: '#dc2626',
    padding: 20,
    alignItems: 'center'
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold'
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4
  },
  statsRow: {
    flexDirection: 'row',
    padding: 15,
    gap: 10
  },
  statBox: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    elevation: 2
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e3a8a'
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 15
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  typeCard: {
    width: '47%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  typeCardSelected: {
    borderColor: '#1e3a8a'
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  typeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151'
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8
  },
  severityBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1
  },
  severityText: {
    fontSize: 12,
    fontWeight: '500'
  },
  inputGroup: {
    marginBottom: 15
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  locationRow: {
    flexDirection: 'row',
    gap: 8
  },
  locationInput: {
    flex: 1
  },
  gpsBtn: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 48
  },
  gpsBtnText: {
    fontSize: 20,
    textAlign: 'center'
  },
  callButton: {
    backgroundColor: '#dc2626',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10
  },
  callIcon: {
    fontSize: 24
  },
  callButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  spacer: {
    height: 30
  }
});

export default CallerEmergencyScreen;
