import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../../firebase.config';
import { CallHistory, ScheduledCall } from '../types';

interface CallItem extends CallHistory {
  scheduledCall?: ScheduledCall;
}

interface PastCallItem {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  type: 'wellness-check' | 'medication-reminder' | 'social-call' | 'emergency';
  status: 'completed' | 'missed' | 'no-answer' | 'scheduled' | 'cancelled';
  notes?: string;
  agentNotes?: string;
  createdAt: Date;
  scheduledTime?: Date;
  updatedAt?: Date;
}

export const CallHistoryScreen: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [callHistory, setCallHistory] = useState<PastCallItem[]>([]);
  const [scheduledCalls, setScheduledCalls] = useState<ScheduledCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!userProfile || !currentUser) return;

    try {
      const historyQuery = query(
        collection(db, 'callHistory'),
        where('userId', '==', currentUser.uid),
        orderBy('startTime', 'desc')
      );
      const historySnapshot = await getDocs(historyQuery);
      const historyData = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime?.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as CallHistory[];

      const scheduledQuery = query(
        collection(db, 'scheduledCalls'),
        where('userId', '==', currentUser.uid),
        orderBy('scheduledTime', 'desc')
      );
      const scheduledSnapshot = await getDocs(scheduledQuery);
      const scheduledData = scheduledSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledTime: doc.data().scheduledTime.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as ScheduledCall[];

      const currentTime = new Date();
      const activeScheduledCalls = scheduledData.filter(call => 
        call.status === 'scheduled' && call.scheduledTime > currentTime
      );
      
      const pastScheduledCalls = scheduledData.filter(call => 
        call.status !== 'scheduled' || call.scheduledTime <= currentTime
      ).map(call => ({
        id: call.id,
        userId: call.userId,
        startTime: call.scheduledTime,
        duration: call.duration,
        type: call.type,
        status: call.status,
        notes: call.notes,
        agentNotes: call.agentNotes,
        createdAt: call.createdAt,
        scheduledTime: call.scheduledTime,
        updatedAt: call.updatedAt,
      }));
      
      setCallHistory([...historyData, ...pastScheduledCalls]);
      setScheduledCalls(activeScheduledCalls);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userProfile, currentUser]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#27ae60';
      case 'scheduled':
        return '#3498db';
      case 'missed':
      case 'no-answer':
        return '#e74c3c';
      case 'cancelled':
        return '#95a5a6';
      default:
        return '#7f8c8d';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'wellness-check':
        return 'Wellness Check';
      case 'medication-reminder':
        return 'Medication Reminder';
      case 'social-call':
        return 'Social Call';
      case 'emergency':
        return 'Emergency';
      default:
        return type;
    }
  };

  const renderCallHistoryItem = ({ item }: { item: PastCallItem }) => (
    <View style={styles.callItem}>
      <View style={styles.callHeader}>
        <Text style={styles.callType}>{getTypeLabel(item.type)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.callDate}>
        {item.startTime.toLocaleDateString()} at {item.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      {item.duration && (
        <Text style={styles.callDuration}>Duration: {item.duration} minutes</Text>
      )}
      {item.notes && (
        <Text style={styles.callNotes}>Notes: {item.notes}</Text>
      )}
    </View>
  );

  const renderScheduledCallItem = ({ item }: { item: ScheduledCall }) => (
    <View style={styles.callItem}>
      <View style={styles.callHeader}>
        <Text style={styles.callType}>{getTypeLabel(item.type)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.callDate}>
        {item.scheduledTime.toLocaleDateString()} at {item.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <Text style={styles.callDuration}>Duration: {item.duration} minutes</Text>
      {item.notes && (
        <Text style={styles.callNotes}>Notes: {item.notes}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Call History</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scheduled Calls</Text>
        {scheduledCalls.length > 0 ? (
          <FlatList
            data={scheduledCalls}
            renderItem={renderScheduledCallItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <Text style={styles.emptyText}>No scheduled calls</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Past Calls</Text>
        {callHistory.length > 0 ? (
          <FlatList
            data={callHistory}
            renderItem={renderCallHistoryItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <Text style={styles.emptyText}>No call history</Text>
        )}
      </View>
    </View>
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
    flex: 1,
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  callItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  callType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  callDate: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  callDuration: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  callNotes: {
    fontSize: 14,
    color: '#2c3e50',
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 16,
    padding: 32,
  },
});
