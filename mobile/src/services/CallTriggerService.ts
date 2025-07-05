import * as Notifications from 'expo-notifications';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { ScheduledCall, CallHistory } from '../types';

export class CallTriggerService {
  static async setupNotifications(): Promise<void> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted. Local notifications may not work.');
        return;
      }

      await Notifications.setNotificationChannelAsync('call-reminders', {
        name: 'Call Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });

      console.log('Local notifications setup completed successfully');
    } catch (error) {
      console.warn('Notification setup warning (this is expected in Expo Go SDK 53):', error);
    }
  }

  static async scheduleCallNotification(scheduledCall: ScheduledCall): Promise<string> {
    const scheduledTime = new Date(scheduledCall.scheduledTime);
    const now = new Date();

    if (scheduledTime <= now) {
      throw new Error('Cannot schedule notification for past time');
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'CareCaller - Scheduled Call',
        body: `Your ${scheduledCall.type.replace('-', ' ')} is starting now`,
        data: {
          scheduledCallId: scheduledCall.id,
          callType: scheduledCall.type,
          userId: scheduledCall.userId,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: 'date',
        date: scheduledTime,
      } as any,
    });

    return notificationId;
  }

  static async cancelCallNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  static setupNotificationListener(
    onCallTriggered: (scheduledCall: ScheduledCall, userName: string, userId: string) => void
  ): () => void {
    const subscription = Notifications.addNotificationReceivedListener(async (notification) => {
      console.log('📞 Notification received:', notification.request.content.data);
      const { scheduledCallId, callType, userId } = notification.request.content.data || {};

      if (scheduledCallId && callType && userId) {
        try {
          console.log('🔍 Looking for scheduled call:', scheduledCallId);
          const scheduledCallDoc = await getDoc(doc(db as any, 'scheduledCalls', scheduledCallId));

          if (scheduledCallDoc.exists()) {
            const data = scheduledCallDoc.data();
            const scheduledCall = {
              id: scheduledCallDoc.id,
              ...data,
              scheduledTime: data?.scheduledTime.toDate(),
              createdAt: data?.createdAt.toDate(),
            } as ScheduledCall;

            console.log('📞 Found scheduled call:', scheduledCall);

            const userDoc = await getDoc(doc(db as any, 'users', userId));

            if (userDoc.exists()) {
              const userData = userDoc.data() as any;
              const userName = `${userData.firstName} ${userData.lastName}`;

              console.log('👤 Found user:', userName);

              await updateDoc(doc(db, 'scheduledCalls', scheduledCall.id), {
                status: 'in-progress',
                startTime: new Date(),
              });

              console.log('🚀 Triggering voice call for:', userName);
              onCallTriggered(scheduledCall, userName, scheduledCall.userId);
            } else {
              console.error('❌ User not found:', userId);
            }
          } else {
            console.error('❌ Scheduled call not found:', scheduledCallId);
          }
        } catch (error) {
          console.error('Error handling call notification:', error);
        }
      }
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      console.log('📞 Notification response received:', response.notification.request.content.data);
      const { scheduledCallId, callType, userId } = response.notification.request.content.data || {};

      if (scheduledCallId && callType && userId) {
        try {
          console.log('🔍 Response: Looking for scheduled call:', scheduledCallId);
          const scheduledCallDoc = await getDoc(doc(db as any, 'scheduledCalls', scheduledCallId));

          if (scheduledCallDoc.exists()) {
            const data = scheduledCallDoc.data();
            const scheduledCall = {
              id: scheduledCallDoc.id,
              ...data,
              scheduledTime: data?.scheduledTime.toDate(),
              createdAt: data?.createdAt.toDate(),
            } as ScheduledCall;

            console.log('📞 Response: Found scheduled call:', scheduledCall);

            const userDoc = await getDoc(doc(db as any, 'users', userId));

            if (userDoc.exists()) {
              const userData = userDoc.data() as any;
              const userName = `${userData.firstName} ${userData.lastName}`;

              console.log('👤 Response: Found user:', userName);

              await updateDoc(doc(db, 'scheduledCalls', scheduledCall.id), {
                status: 'in-progress',
                startTime: new Date(),
              });

              console.log('🚀 Response: Triggering voice call for:', userName);
              onCallTriggered(scheduledCall, userName, scheduledCall.userId);
            } else {
              console.error('❌ Response: User not found:', userId);
            }
          } else {
            console.error('❌ Response: Scheduled call not found:', scheduledCallId);
          }
        } catch (error) {
          console.error('Error handling call notification response:', error);
        }
      }
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }

  static async createCallHistory(
    scheduledCall: ScheduledCall,
    duration: number,
    status: 'completed' | 'missed' | 'no-answer',
    notes?: string,
    conversationSummary?: string
  ): Promise<void> {
    try {
      const callHistory: Omit<CallHistory, 'id'> = {
        userId: scheduledCall.userId,
        scheduledCallId: scheduledCall.id,
        type: scheduledCall.type,
        startTime: new Date(),
        endTime: new Date(Date.now() + duration * 60000), // duration in minutes
        duration,
        status,
        notes: notes || '',
        agentNotes: conversationSummary || '',
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'callHistory'), callHistory);

      await updateDoc(doc(db, 'scheduledCalls', scheduledCall.id), {
        status: 'completed',
        endTime: new Date(),
        duration,
        notes: conversationSummary,
      });
    } catch (error) {
      console.error('Error creating call history:', error);
      throw error;
    }
  }

  static async getUpcomingCalls(userId: string): Promise<ScheduledCall[]> {
    try {
      const now = new Date();
      const upcomingCallsQuery = query(
        collection(db, 'scheduledCalls'),
        where('userId', '==', userId),
        where('scheduledTime', '>', now),
        where('status', '==', 'scheduled')
      );

      const snapshot = await getDocs(upcomingCallsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledTime: doc.data().scheduledTime.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as ScheduledCall[];
    } catch (error) {
      console.error('Error fetching upcoming calls:', error);
      return [];
    }
  }
}
