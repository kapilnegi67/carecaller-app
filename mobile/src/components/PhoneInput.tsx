import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Modal, FlatList } from 'react-native';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: boolean;
  initialCountryCode?: string;
  onCountryChange?: (countryCode: string) => void;
}

interface Country {
  name: string;
  code: string;
  callingCode: string;
  flag: string;
}

const countries: Country[] = [
  { name: 'United States', code: 'US', callingCode: '1', flag: '🇺🇸' },
  { name: 'Canada', code: 'CA', callingCode: '1', flag: '🇨🇦' },
  { name: 'United Kingdom', code: 'GB', callingCode: '44', flag: '🇬🇧' },
  { name: 'Australia', code: 'AU', callingCode: '61', flag: '🇦🇺' },
  { name: 'Germany', code: 'DE', callingCode: '49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', callingCode: '33', flag: '🇫🇷' },
  { name: 'India', code: 'IN', callingCode: '91', flag: '🇮🇳' },
  { name: 'Japan', code: 'JP', callingCode: '81', flag: '🇯🇵' },
  { name: 'China', code: 'CN', callingCode: '86', flag: '🇨🇳' },
  { name: 'Brazil', code: 'BR', callingCode: '55', flag: '🇧🇷' },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Phone Number',
  error,
  initialCountryCode,
  onCountryChange
}) => {
  const getInitialCountry = () => {
    if (initialCountryCode) {
      const country = countries.find(c => c.callingCode === initialCountryCode || c.code === initialCountryCode);
      if (country) return country;
    }
    return countries[0];
  };

  const [selectedCountry, setSelectedCountry] = useState<Country>(() => getInitialCountry());
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchText, setSearchText] = useState('');

  React.useEffect(() => {
    if (initialCountryCode) {
      const country = countries.find(c => c.callingCode === initialCountryCode || c.code === initialCountryCode);
      if (country && country.code !== selectedCountry.code) {
        setSelectedCountry(country);
      }
    }
  }, [initialCountryCode, selectedCountry.code]);

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchText.toLowerCase()) ||
    country.callingCode.includes(searchText)
  );

  const selectCountry = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    setSearchText('');
    if (onCountryChange) {
      onCountryChange(country.callingCode);
    }
  };

  return (
    <View style={[styles.container, error && styles.containerError]}>
      <TouchableOpacity 
        style={styles.countryPickerContainer}
        onPress={() => setShowCountryPicker(true)}
      >
        <Text style={styles.flagText}>{selectedCountry.flag}</Text>
        <Text style={styles.callingCodeText}>+{selectedCountry.callingCode}</Text>
      </TouchableOpacity>
      
      <TextInput
        style={styles.phoneInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType="phone-pad"
      />

      <Modal
        visible={showCountryPicker}
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCountryPicker(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.searchInput}
            placeholder="Search countries..."
            value={searchText}
            onChangeText={setSearchText}
          />
          
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryItem}
                onPress={() => selectCountry(item)}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryCode}>+{item.callingCode}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    minHeight: 60,
    justifyContent: 'center',
  },
  flagText: {
    fontSize: 20,
    marginRight: 5,
  },
  callingCodeText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    padding: 18,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#7f8c8d',
  },
  searchInput: {
    margin: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    fontSize: 16,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 15,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  countryCode: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
  },
});
