import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';

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
  const [countryCode, setCountryCode] = useState<CountryCode>('US');
  const [country, setCountry] = useState<Country | null>(null);
  const [withCountryNameButton, setWithCountryNameButton] = useState(false);
  const [withFlag, setWithFlag] = useState(true);
  const [withEmoji, setWithEmoji] = useState(true);
  const [withFilter, setWithFilter] = useState(true);
  const [withAlphaFilter, setWithAlphaFilter] = useState(false);
  const [withCallingCode, setWithCallingCode] = useState(true);

  const onSelect = (country: Country) => {
    setCountryCode(country.cca2);
    setCountry(country);
  };

  return (
    <View style={[styles.container, error && styles.containerError]}>
      <View style={styles.countryPickerContainer}>
        <CountryPicker
          countryCode={countryCode}
          withFilter={withFilter}
          withFlag={withFlag}
          withCountryNameButton={withCountryNameButton}
          withAlphaFilter={withAlphaFilter}
          withCallingCode={withCallingCode}
          withEmoji={withEmoji}
          onSelect={onSelect}
          containerButtonStyle={styles.countryButton}
        />
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
  countryPickerContainer: {
    paddingLeft: 15,
    paddingRight: 10,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  countryButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneInput: {
    flex: 1,
    padding: 18,
    fontSize: 16,
  },
});
