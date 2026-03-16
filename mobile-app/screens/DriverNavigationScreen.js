import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRoute, useNavigation } from '@react-navigation/native';
import io from 'socket.io-client';

const SERVER_URL = 'http://192.168.1.100:5002'; // Update with your server IP

const DriverNavigationScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { ambulanceId, emergencyId, destination, type } = route.params || {};
  
  const [location, setLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('navigating');
  const socketRef = useRef(null);
  const locationSubscription = useRef(null);

  useEffect(() => {
    socketRef.current = io(SERVER_URL);
    
    // Listen for emergency updates
    socketRef.current.on('emergency_status_update', (data) => {
      if (data.request_id === emergencyId) {
        setEmergency(data);
      }
    });

    // Fetch emergency details
    fetchEmergencyDetails();
    
    // Start location tracking
    startLocationTracking();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (locationSubscription.current) locationSubscription.current.remove();
    };
  }, []);

  const fetchEmergencyDetails = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/requests?status=assigned`);
      const data = await response.json();
      const currentEmergency = data.find(e => e.request_id === emergencyId);
      if (currentEmergency) {
        setEmergency(currentEmergency);
        calculateRoute(currentEmergency);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching emergency:', error);
      setLoading(false);
    }
  };

  const startLocationTracking = async () => {
    let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
    if (permissionStatus !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required for navigation');
      return;
    }

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10
      },
      (newLocation) => {
        const coords = {
          latitude: newLocation.coords.latitude,
          longitude: newLocation.coords.longitude,
          speed: newLocation.coords.speed || 0
        };
        setLocation(coords);
        
        // Send location update to server
        if (socketRef.current && ambulanceId) {
          socketRef.current.emit('ambulance_location_update', {
            ambulance_id: ambulanceId,
            latitude: coords.latitude,
            longitude: coords.longitude,
            speed: coords.speed
          });
        }
      }
    );
  };

  const calculateRoute = async (emergencyData) => {
    try {
      // Get optimal route from server
      const response = await fetch(
        `${SERVER_URL}/route/optimal?ambulance_id=${ambulanceId}&emergency_id=${emergencyData.request_id}`
      );
      const routeData = await response.json();
      
      if (routeData.coordinates) {
        setRouteCoords(routeData.coordinates.map(coord => ({
          latitude: coord[0],
          longitude: coord[1]
        })));
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  const handleArrived = async () => {
    try {
      const newStatus = type === 'pickup' ? 'on_scene' : 'completed';
      
      await fetch(`${SERVER_URL}/request/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: emergencyId,
          status: newStatus,
          ambulance_id: ambulanceId
        })
      });

      if (type === 'pickup') {
        // Navigate to hospital
        Alert.alert(
          'Patient Picked Up',
          'Navigate to nearest hospital?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Go to Hospital', 
              onPress: () => navigation.navigate('NavigateToHospital', {
                ambulanceId,
                emergencyId,
                patientLocation: destination
              })
            }
          ]
        );
      } else {
        Alert.alert('Emergency Completed', 'Patient delivered to hospital successfully');
        navigation.navigate('DriverHome', { ambulanceId });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading navigation...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Emergency Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          {type === 'pickup' ? 'Navigate to Patient' : 'Navigate to Hospital'}
        </Text>
        {emergency && (
          <>
            <Text style={styles.infoText}>Patient: {emergency.patient_name}</Text>
            <Text style={styles.infoText}>Type: {emergency.emergency_type}</Text>
            <Text style={styles.infoText}>Severity: {emergency.severity_level}</Text>
          </>
        )}
        {location && (
          <Text style={styles.speedText}>Speed: {Math.round(location.speed * 3.6)} km/h</Text>
        )}
      </View>

      {/* Map */}
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        } : {
          latitude: 17.4065,
          longitude: 78.4772,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1
        }}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        {location && (
          <Marker
            coordinate={location}
            title="Your Location"
            pinColor="#3b82f6"
          />
        )}
        
        {destination && (
          <Marker
            coordinate={destination}
            title={type === 'pickup' ? 'Patient Location' : 'Hospital'}
            pinColor="#ef4444"
          />
        )}

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#3b82f6"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.arrivedButton} onPress={handleArrived}>
          <Text style={styles.arrivedButtonText}>
            {type === 'pickup' ? '✅ Patient Picked Up' : '✅ Arrived at Hospital'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  map: {
    flex: 1
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 15,
    margin: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 10
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4
  },
  speedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginTop: 8
  },
  actionBar: {
    backgroundColor: 'white',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  arrivedButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  arrivedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280'
  }
});

export default DriverNavigationScreen;
