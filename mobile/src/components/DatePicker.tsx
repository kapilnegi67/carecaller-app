import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerComponentProps {
  value: string; // YYYY-MM-DD format
  onDateChange: (date: string) => void;
  placeholder?: string;
  error?: string;
}

export const DatePickerComponent: React.FC<DatePickerComponentProps> = ({
  value,
  onDateChange,
  placeholder = 'Select Date of Birth',
  error
}) => {
  const [show, setShow] = useState(false);
  
  const getDateFromValue = () => {
    if (value && value !== '') {
      const parsedDate = new Date(value);
      return !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
    }
    return new Date();
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString || dateString === '') return placeholder;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return placeholder;
    return date.toLocaleDateString();
  };

  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || getDateFromValue();
    setShow(Platform.OS === 'ios');
    onDateChange(currentDate.toISOString().split('T')[0]);
  };

  const showDatepicker = () => {
    setShow(true);
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.dateButton, error && styles.dateButtonError]}
        onPress={showDatepicker}
      >
        <Text style={styles.dateButtonText}>
          {formatDateForDisplay(value)}
        </Text>
      </TouchableOpacity>
      
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={getDateFromValue()}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={onChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dateButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dateButtonError: {
    borderColor: '#e74c3c',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#4a5568',
  },
});
