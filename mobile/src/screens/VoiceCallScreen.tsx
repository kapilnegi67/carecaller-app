import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIVoiceService } from '../services/AIVoiceService';
import { ScheduledCall } from '../types';

interface VoiceCallScreenProps {
  route: {
    params: {
      scheduledCall: ScheduledCall;
      userName: string;
      userId: string;
    };
  };
  navigation: any;
}

interface VoiceCallScreenNavigationProps {
  scheduledCall: ScheduledCall;
  userName: string;
  userId: string;
}

export const VoiceCallScreen: React.FC<any> = ({ route, navigation }) => {
  const { scheduledCall, userName, userId } = route.params;
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Connecting...');

  const aiVoiceService = useRef<AIVoiceService>(new AIVoiceService());
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const callTimer = useRef<NodeJS.Timeout | null>(null);
  const durationTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeCall();
    startDurationTimer();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isListening]);

  const initializeCall = async () => {
    try {
      setCurrentMessage('Initializing AI assistant...');
      
      await aiVoiceService.current.initializeConversation({
        callType: scheduledCall.type,
        userName,
        userId,
      });

      setIsConnected(true);
      setCurrentMessage('Connected! AI assistant is speaking...');
      
      setTimeout(() => {
        setCurrentMessage('Tap and hold to speak');
        setIsSpeaking(false);
      }, 3000);

    } catch (error) {
      console.error('Error initializing call:', error);
      Alert.alert(
        'Connection Error',
        'Failed to connect to AI assistant. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const startDurationTimer = () => {
    durationTimer.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleMicrophonePress = async () => {
    if (!isConnected || isSpeaking || isProcessing) return;

    try {
      setIsListening(true);
      setCurrentMessage('Listening...');
      await aiVoiceService.current.startListening();
    } catch (error) {
      console.error('Error starting to listen:', error);
      setIsListening(false);
      setCurrentMessage('Error occurred. Tap and hold to try again.');
    }
  };

  const handleMicrophoneRelease = async () => {
    if (!isListening) return;

    try {
      setIsListening(false);
      setIsProcessing(true);
      setCurrentMessage('Processing...');
      
      await aiVoiceService.current.stopListening();
      
      setTimeout(() => {
        const state = aiVoiceService.current.getConversationState();
        if (state.isSpeaking) {
          setIsSpeaking(true);
          setCurrentMessage('AI assistant is responding...');
        } else {
          setCurrentMessage('Tap and hold to speak');
        }
        setIsProcessing(false);
      }, 1000);

    } catch (error) {
      console.error('Error stopping listening:', error);
      setIsListening(false);
      setIsProcessing(false);
      setCurrentMessage('Error occurred. Tap and hold to try again.');
    }
  };

  const handleEndCall = async () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end this call?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Call', 
          style: 'destructive',
          onPress: async () => {
            try {
              await aiVoiceService.current.endConversation();
              cleanup();
              navigation.goBack();
            } catch (error) {
              console.error('Error ending call:', error);
              navigation.goBack();
            }
          }
        },
      ]
    );
  };

  const cleanup = () => {
    if (callTimer.current) {
      clearTimeout(callTimer.current);
      callTimer.current = null;
    }
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallTypeLabel = (type: string): string => {
    switch (type) {
      case 'wellness-check':
        return 'Wellness Check';
      case 'medication-reminder':
        return 'Medication Reminder';
      case 'social-call':
        return 'Social Call';
      case 'emergency':
        return 'Emergency Call';
      default:
        return 'Care Call';
    }
  };

  const getMicrophoneColor = (): string => {
    if (isListening) return '#e74c3c';
    if (isProcessing) return '#f39c12';
    if (isSpeaking) return '#95a5a6';
    return '#3498db';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.callType}>{getCallTypeLabel(scheduledCall.type)}</Text>
        <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
        <Text style={styles.status}>
          {isConnected ? 'Connected' : 'Connecting...'}
        </Text>
      </View>

      {/* AI Assistant Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="chatbubble-ellipses" size={60} color="#fff" />
        </View>
        <Text style={styles.assistantName}>CareCaller AI</Text>
      </View>

      {/* Status Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.message}>{currentMessage}</Text>
      </View>

      {/* Microphone Button */}
      <View style={styles.controlsContainer}>
        <Animated.View style={[styles.micContainer, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={[styles.micButton, { backgroundColor: getMicrophoneColor() }]}
            onPressIn={handleMicrophonePress}
            onPressOut={handleMicrophoneRelease}
            disabled={!isConnected || isSpeaking}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isListening ? "mic" : "mic-outline"} 
              size={40} 
              color="#fff" 
            />
          </TouchableOpacity>
        </Animated.View>
        
        <Text style={styles.micInstruction}>
          {isListening ? 'Release to send' : 'Hold to speak'}
        </Text>
      </View>

      {/* End Call Button */}
      <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
        <Ionicons name="call" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Status Indicators */}
      <View style={styles.statusIndicators}>
        <View style={[styles.indicator, { backgroundColor: isListening ? '#e74c3c' : '#bdc3c7' }]}>
          <Ionicons name="mic" size={16} color="#fff" />
        </View>
        <View style={[styles.indicator, { backgroundColor: isProcessing ? '#f39c12' : '#bdc3c7' }]}>
          <Ionicons name="cog" size={16} color="#fff" />
        </View>
        <View style={[styles.indicator, { backgroundColor: isSpeaking ? '#27ae60' : '#bdc3c7' }]}>
          <Ionicons name="volume-high" size={16} color="#fff" />
        </View>
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  callType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  duration: {
    fontSize: 18,
    color: '#ecf0f1',
    marginBottom: 5,
  },
  status: {
    fontSize: 14,
    color: '#95a5a6',
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  assistantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ecf0f1',
  },
  messageContainer: {
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  message: {
    fontSize: 16,
    color: '#ecf0f1',
    textAlign: 'center',
    lineHeight: 24,
  },
  controlsContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  micContainer: {
    marginBottom: 15,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micInstruction: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
  },
  endCallButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statusIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: 150,
    marginBottom: 20,
  },
  indicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
