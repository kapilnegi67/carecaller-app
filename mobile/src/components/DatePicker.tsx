import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DatePicker from 'react-native-date-picker';

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
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(value ? new Date(value) : new Date());

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return placeholder;
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleConfirm = (selectedDate: Date) => {
    setOpen(false);
    setDate(selectedDate);
    onDateChange(selectedDate.toISOString().split('T')[0]);
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.dateButton, error && styles.dateButtonError]}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.dateButtonText}>
          {formatDateForDisplay(value)}
        </Text>
      </TouchableOpacity>
      
      <DatePicker
        modal
        open={open}
        date={date}
        mode="date"
        maximumDate={new Date()}
        minimumDate={new Date(1900, 0, 1)}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
        title="Select Date of Birth"
      />
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
