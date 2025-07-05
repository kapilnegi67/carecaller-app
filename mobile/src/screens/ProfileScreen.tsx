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
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../../firebase.config';
import { DatePickerComponent } from '../components/DatePicker';
import { PhoneInput } from '../components/PhoneInput';

const validateAge = (dateOfBirth: string) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 18;
  }
  return age >= 18;
};

export const ProfileScreen: React.FC = () => {
  const { userProfile, logout, deleteAccount, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    countryCode: '1',
    dateOfBirth: new Date().toISOString().split('T')[0], // Store as YYYY-MM-DD string
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phone: userProfile.phone || '',
        countryCode: userProfile.countryCode || '1',
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
    if (!userProfile) return;

    if (!validateAge(formData.dateOfBirth)) {
      Alert.alert('Invalid Date of Birth', 'You must be at least 18 years old.');
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile(formData);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your data including scheduled calls and call history.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          onPress: async () => {
            try {
              await deleteAccount();
              Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete account: ' + error.message);
            }
          }, 
          style: 'destructive' 
        },
      ]
    );
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


  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
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

        <PhoneInput
          value={formData.phone}
          onChangeText={(value) => updateFormData('phone', value)}
          placeholder="Phone Number"
          initialCountryCode={formData.countryCode}
          onCountryChange={(countryCode) => updateFormData('countryCode', countryCode)}
        />

        <Text style={styles.inputLabel}>Date of Birth</Text>
        <DatePickerComponent
          value={formData.dateOfBirth}
          onDateChange={(date) => updateFormData('dateOfBirth', date)}
          placeholder="Select Date of Birth"
        />
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

        <PhoneInput
          value={formData.emergencyContact.phone}
          onChangeText={(value) => updateFormData('emergencyContact.phone', value)}
          placeholder="Contact Phone"
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
          {loading ? 'Saving...' : 'Save Profile'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeleteAccount}
      >
        <Text style={styles.deleteButtonText}>Delete Account</Text>
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 4,
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
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    margin: 16,
    marginTop: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#c0392b',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    margin: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#a93226',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
