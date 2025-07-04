import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Phone Number',
  error
}) => {
  return (
    <View style={[styles.container, error && styles.containerError]}>
      <View style={styles.countryCodeContainer}>
        <Text style={styles.countryCodeText}>+1</Text>
      </View>
      <TextInput
        style={styles.phoneInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType="phone-pad"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  containerError: {
    borderColor: '#e74c3c',
  },
  countryCodeContainer: {
    paddingLeft: 15,
    paddingRight: 10,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  countryCodeText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    padding: 18,
    fontSize: 16,
  },
});
