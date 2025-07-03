import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import MonthPicker from 'react-native-month-year-picker';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../../firebase.config';

export const ProfileEditScreen: React.FC = () => {
  const { userProfile, markProfileComplete, currentUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: new Date().toISOString().split('T')[0],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phone: userProfile.phone || '',
        dateOfBirth: userProfile.dateOfBirth || new Date().toISOString().split('T')[0],
        emergencyContact: userProfile.emergencyContact || {
          name: '',
          phone: '',
          relationship: '',
        },
      });
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...formData,
        updatedAt: new Date(),
      });
      markProfileComplete();
      Alert.alert('Success', 'Profile completed successfully');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    if (field.startsWith('emergencyContact.')) {
      const contactField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [contactField]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const onDateSelect = (day: any) => {
    setFormData(prev => ({ ...prev, dateOfBirth: day.dateString }));
    setShowCalendar(false);
  };

  const onMonthYearChange = (event: any, newDate: Date | undefined) => {
    setShowMonthPicker(false);
    if (newDate) {
      setFormData(prev => ({ ...prev, dateOfBirth: newDate.toISOString().split('T')[0] }));
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'Select Date of Birth';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Please fill in your details to continue</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={formData.firstName}
          onChangeText={(value) => updateFormData('firstName', value)}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={formData.lastName}
          onChangeText={(value) => updateFormData('lastName', value)}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={formData.phone}
          onChangeText={(value) => updateFormData('phone', value)}
          keyboardType="phone-pad"
        />

        <View style={styles.datePickerContainer}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowMonthPicker(true)}
          >
            <Text style={styles.dateButtonText}>
              Month/Year: {formatDateForDisplay(formData.dateOfBirth)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowCalendar(true)}
          >
            <Text style={styles.dateButtonText}>
              Exact Date: {formatDateForDisplay(formData.dateOfBirth)}
            </Text>
          </TouchableOpacity>
        </View>

        {showMonthPicker && (
          <MonthPicker
            onChange={onMonthYearChange}
            value={new Date(formData.dateOfBirth)}
            minimumDate={new Date(1900, 0)}
            maximumDate={new Date()}
            locale="en"
          />
        )}

        <Modal
          visible={showCalendar}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCalendar(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>Select Date of Birth</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowCalendar(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Calendar
                onDayPress={onDateSelect}
                markedDates={{
                  [formData.dateOfBirth]: {
                    selected: true,
                    selectedColor: '#3498db',
                    selectedTextColor: 'white',
                  },
                }}
                maxDate={new Date().toISOString().split('T')[0]}
                theme={{
                  backgroundColor: '#ffffff',
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: '#b6c1cd',
                  selectedDayBackgroundColor: '#3498db',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#3498db',
                  dayTextColor: '#2d4150',
                  textDisabledColor: '#d9e1e8',
                  arrowColor: '#3498db',
                  monthTextColor: '#2d4150',
                  indicatorColor: '#3498db',
                }}
              />
            </View>
          </View>
        </Modal>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contact</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Contact Name"
          value={formData.emergencyContact.name}
          onChangeText={(value) => updateFormData('emergencyContact.name', value)}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Contact Phone"
          value={formData.emergencyContact.phone}
          onChangeText={(value) => updateFormData('emergencyContact.phone', value)}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Relationship"
          value={formData.emergencyContact.relationship}
          onChangeText={(value) => updateFormData('emergencyContact.relationship', value)}
          autoCapitalize="words"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Saving...' : 'Complete Profile'}
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
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 8,
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
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  datePickerContainer: {
    marginBottom: 12,
  },
  dateButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#4a5568',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#3498db',
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
});
