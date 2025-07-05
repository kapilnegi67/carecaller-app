import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../../firebase.config';
import { ScheduledCall } from '../types';
import { CallTriggerService } from '../services/CallTriggerService';

export const ScheduleCallScreen: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [callType, setCallType] = useState<'wellness-check' | 'medication-reminder' | 'social-call'>('wellness-check');
  const [duration, setDuration] = useState(15);
  const [customDuration, setCustomDuration] = useState('');
  const [useCustomDuration, setUseCustomDuration] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleScheduleCall = async () => {
    if (!userProfile || !currentUser) return;

    let finalDuration = duration;
    if (useCustomDuration) {
      const customDurationNum = parseInt(customDuration);
      if (!customDuration || isNaN(customDurationNum) || customDurationNum < 1 || customDurationNum > 180) {
        Alert.alert('Error', 'Please enter a valid duration between 1 and 180 minutes');
        return;
      }
      finalDuration = customDurationNum;
    }

    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(selectedTime.getHours());
    scheduledDateTime.setMinutes(selectedTime.getMinutes());

    if (scheduledDateTime <= new Date()) {
      Alert.alert('Error', 'Please select a future date and time');
      return;
    }

    setLoading(true);
    try {
      const newCall: Omit<ScheduledCall, 'id'> = {
        userId: currentUser.uid,
        scheduledTime: scheduledDateTime,
        duration: finalDuration,
        type: callType,
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'scheduledCalls'), newCall);
      
      const scheduledCallWithId = { ...newCall, id: docRef.id };
      await CallTriggerService.scheduleCallNotification(scheduledCallWithId);
      
      Alert.alert('Success', 'Call scheduled successfully! You will receive a notification when it\'s time for your AI assistant call.');
      
      setSelectedDate(new Date());
      setSelectedTime(new Date());
      setCallType('wellness-check');
      setDuration(15);
      setCustomDuration('');
      setUseCustomDuration(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to schedule call: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setSelectedTime(selectedTime);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule a Call</Text>
        <Text style={styles.subtitle}>Set up your next care call</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date & Time</Text>
        
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            Date: {selectedDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            Time: {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Call Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={callType}
            onValueChange={(itemValue) => setCallType(itemValue)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Wellness Check" value="wellness-check" color="#2c3e50" />
            <Picker.Item label="Medication Reminder" value="medication-reminder" color="#2c3e50" />
            <Picker.Item label="Social Call" value="social-call" color="#2c3e50" />
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Duration (minutes)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={useCustomDuration ? 'custom' : duration}
            onValueChange={(itemValue) => {
              if (itemValue === 'custom') {
                setUseCustomDuration(true);
              } else {
                setUseCustomDuration(false);
                setDuration(Number(itemValue));
              }
            }}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="15 minutes" value={15} color="#2c3e50" />
            <Picker.Item label="30 minutes" value={30} color="#2c3e50" />
            <Picker.Item label="45 minutes" value={45} color="#2c3e50" />
            <Picker.Item label="60 minutes" value={60} color="#2c3e50" />
            <Picker.Item label="Custom minutes" value="custom" color="#2c3e50" />
          </Picker>
        </View>
        
        {useCustomDuration && (
          <View style={styles.customInputContainer}>
            <TextInput
              style={styles.customInput}
              placeholder="Enter custom minutes (1-180)"
              value={customDuration}
              onChangeText={setCustomDuration}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleScheduleCall}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Scheduling...' : 'Schedule Call'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  dateButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  pickerContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    overflow: 'hidden',
    minHeight: Platform.OS === 'android' ? 60 : 50,
    paddingVertical: Platform.OS === 'android' ? 0 : 8,
  },
  picker: {
    height: Platform.OS === 'android' ? 60 : 50,
    color: '#2c3e50',
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  button: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    margin: 16,
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  customInputContainer: {
    marginTop: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  customInput: {
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#2c3e50',
  },
  pickerItem: {
    fontSize: Platform.OS === 'android' ? 18 : 16,
    color: '#2c3e50',
    height: Platform.OS === 'android' ? 60 : 50,
    fontWeight: Platform.OS === 'android' ? '500' : 'normal',
  },
});
