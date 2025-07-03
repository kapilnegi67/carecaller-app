import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../contexts/AuthContext';

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: new Date().toISOString().split('T')[0], // Store as YYYY-MM-DD string
  });
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    const { email, password, confirmPassword, firstName, lastName, phone } = formData;

    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!disclaimerAccepted) {
      Alert.alert('Error', 'Please read and accept the Terms of Service and Disclaimer to continue');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, {
        firstName,
        lastName,
        phone: phone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
      });
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const onDateSelect = (day: any) => {
    setFormData(prev => ({ ...prev, dateOfBirth: day.dateString }));
    setShowCalendar(false);
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'Select Date of Birth';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join CareCaller today</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="First Name *"
            value={formData.firstName}
            onChangeText={(value) => updateFormData('firstName', value)}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Last Name *"
            value={formData.lastName}
            onChangeText={(value) => updateFormData('lastName', value)}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Email *"
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={formData.phone}
            onChangeText={(value) => updateFormData('phone', value)}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowCalendar(true)}
          >
            <Text style={styles.dateButtonText}>
              {formatDateForDisplay(formData.dateOfBirth)}
            </Text>
          </TouchableOpacity>

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
                      selectedColor: '#4299e1',
                      selectedTextColor: 'white',
                    },
                  }}
                  maxDate={new Date().toISOString().split('T')[0]}
                  theme={{
                    backgroundColor: '#ffffff',
                    calendarBackground: '#ffffff',
                    textSectionTitleColor: '#b6c1cd',
                    selectedDayBackgroundColor: '#4299e1',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#4299e1',
                    dayTextColor: '#2d4150',
                    textDisabledColor: '#d9e1e8',
                    arrowColor: '#4299e1',
                    monthTextColor: '#2d4150',
                    indicatorColor: '#4299e1',
                  }}
                />
              </View>
            </View>
          </Modal>

          <TextInput
            style={styles.input}
            placeholder="Password *"
            value={formData.password}
            onChangeText={(value) => updateFormData('password', value)}
            secureTextEntry
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password *"
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData('confirmPassword', value)}
            secureTextEntry
            autoCapitalize="none"
          />

          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerTitle}>Terms of Service & Disclaimer</Text>
            <ScrollView style={styles.disclaimerTextContainer}>
              <Text style={styles.disclaimerText}>
                By creating an account, you acknowledge and agree to the following:
              </Text>
              <Text style={styles.disclaimerSection}>
                <Text style={styles.disclaimerBold}>COMPANIONSHIP SERVICE ONLY:</Text> CareCaller is designed solely to provide companionship and social interaction services. This application is NOT a medical device, healthcare service, or medical advice platform.
              </Text>
              <Text style={styles.disclaimerSection}>
                <Text style={styles.disclaimerBold}>NO MEDICAL ADVICE:</Text> CareCaller does not provide medical advice, diagnosis, or treatment. Any health-related conversations are for companionship purposes only. Always consult qualified healthcare professionals for medical concerns.
              </Text>
              <Text style={styles.disclaimerSection}>
                <Text style={styles.disclaimerBold}>APPROPRIATE USE ONLY:</Text> This service is intended for appropriate, family-friendly conversations. Adult content, inappropriate language, or explicit conversations are strictly prohibited and may result in account termination.
              </Text>
              <Text style={styles.disclaimerSection}>
                <Text style={styles.disclaimerBold}>EMERGENCY SITUATIONS:</Text> CareCaller is not an emergency service. In case of medical emergencies, call 911 or your local emergency services immediately.
              </Text>
              <Text style={styles.disclaimerSection}>
                <Text style={styles.disclaimerBold}>USER RESPONSIBILITY:</Text> You are responsible for your own health and safety. Use this service as a supplement to, not a replacement for, professional healthcare and human social connections.
              </Text>
              <Text style={styles.disclaimerText}>
                By proceeding, you confirm you are 18+ years old and agree to use this service responsibly and in accordance with all applicable laws.
              </Text>
            </ScrollView>
            
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setDisclaimerAccepted(!disclaimerAccepted)}
            >
              <View style={[styles.checkbox, disclaimerAccepted && styles.checkboxChecked]}>
                {disclaimerAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I have read, understood, and agree to the Terms of Service and Disclaimer above
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, (loading || !disclaimerAccepted) && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading || !disclaimerAccepted}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  dateButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#4a5568',
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
    color: '#2c5282',
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
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    padding: 8,
  },
  linkText: {
    color: '#3498db',
    fontSize: 14,
  },
  disclaimerContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  disclaimerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  disclaimerTextContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  disclaimerText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#4a5568',
    textAlign: 'left',
  },
  disclaimerSection: {
    fontSize: 13,
    lineHeight: 18,
    color: '#4a5568',
    textAlign: 'left',
    marginBottom: 12,
  },
  disclaimerBold: {
    fontWeight: '600',
    color: '#2c3e50',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#cbd5e0',
    backgroundColor: 'white',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4299e1',
    borderColor: '#4299e1',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#4a5568',
  },
});
