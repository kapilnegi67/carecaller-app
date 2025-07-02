import OpenAI from 'openai';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VoiceConversationConfig {
  callType: 'wellness-check' | 'medication-reminder' | 'social-call' | 'emergency';
  userName: string;
  userId: string;
}

interface ConversationState {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
}

export class AIVoiceService {
  private openai: OpenAI;
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private conversationState: ConversationState;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
    });
    
    this.conversationState = {
      messages: [],
      isListening: false,
      isProcessing: false,
      isSpeaking: false,
    };
  }

  async initializeConversation(config: VoiceConversationConfig): Promise<void> {
    const systemPrompt = this.getSystemPrompt(config);
    this.conversationState.messages = [
      { role: 'system', content: systemPrompt }
    ];

    await this.setupAudio();
    await this.startConversation(config);
  }

  private getSystemPrompt(config: VoiceConversationConfig): string {
    const basePrompt = `You are a caring AI assistant for CareCaller, conducting a ${config.callType} with ${config.userName}. 
    
    Guidelines:
    - Be warm, empathetic, and professional
    - Keep responses concise (1-2 sentences)
    - Ask relevant questions based on call type
    - Listen actively and respond appropriately
    - End the call naturally after 3-5 minutes
    - If emergency concerns arise, advise contacting emergency services`;

    switch (config.callType) {
      case 'wellness-check':
        return `${basePrompt}
        
        Focus on:
        - How they're feeling today
        - Any health concerns
        - Social connections
        - Daily activities
        - Overall wellbeing`;

      case 'medication-reminder':
        return `${basePrompt}
        
        Focus on:
        - Medication adherence
        - Any side effects
        - Questions about medications
        - Reminder to take medications as prescribed`;

      case 'social-call':
        return `${basePrompt}
        
        Focus on:
        - Friendly conversation
        - How their day is going
        - Interests and hobbies
        - Family and friends
        - Providing companionship`;

      case 'emergency':
        return `${basePrompt}
        
        Focus on:
        - Immediate safety assessment
        - Current emergency situation
        - Whether emergency services are needed
        - Providing calm support`;

      default:
        return basePrompt;
    }
  }

  private async setupAudio(): Promise<void> {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
      throw new Error('Failed to setup audio permissions');
    }
  }

  private async startConversation(config: VoiceConversationConfig): Promise<void> {
    const greeting = `Hello ${config.userName}! This is your CareCaller AI assistant. I'm calling for your scheduled ${config.callType.replace('-', ' ')}. How are you doing today?`;
    
    this.conversationState.messages.push({
      role: 'assistant',
      content: greeting
    });

    await this.speakText(greeting);
  }

  async startListening(): Promise<void> {
    if (this.conversationState.isListening || this.conversationState.isSpeaking) {
      return;
    }

    try {
      this.conversationState.isListening = true;
      
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(recordingOptions);
      await this.recording.startAsync();
    } catch (error) {
      console.error('Error starting recording:', error);
      this.conversationState.isListening = false;
      throw new Error('Failed to start recording');
    }
  }

  async stopListening(): Promise<void> {
    if (!this.conversationState.isListening || !this.recording) {
      return;
    }

    try {
      this.conversationState.isListening = false;
      await this.recording.stopAndUnloadAsync();
      
      const uri = this.recording.getURI();
      if (uri) {
        await this.processAudioInput(uri);
      }
      
      this.recording = null;
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw new Error('Failed to stop recording');
    }
  }

  private async processAudioInput(audioUri: string): Promise<void> {
    try {
      this.conversationState.isProcessing = true;

      const transcription = await this.transcribeAudio(audioUri);
      
      if (transcription.trim()) {
        this.conversationState.messages.push({
          role: 'user',
          content: transcription
        });

        const response = await this.generateAIResponse();
        
        this.conversationState.messages.push({
          role: 'assistant',
          content: response
        });

        await this.speakText(response);
      }
    } catch (error) {
      console.error('Error processing audio input:', error);
      await this.speakText("I'm sorry, I didn't catch that. Could you please repeat?");
    } finally {
      this.conversationState.isProcessing = false;
    }
  }

  private async transcribeAudio(audioUri: string): Promise<string> {
    try {
      const audioFile = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await this.openai.audio.transcriptions.create({
        file: new File([Buffer.from(audioFile, 'base64')], 'audio.m4a', { type: 'audio/m4a' }),
        model: 'whisper-1',
        language: 'en',
      });

      return response.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  private async generateAIResponse(): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: this.conversationState.messages,
        max_tokens: 150,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || "I'm here to help. Please continue.";
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm having trouble processing right now. How else can I help you?";
    }
  }

  private async speakText(text: string): Promise<void> {
    try {
      this.conversationState.isSpeaking = true;

      const response = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: 'nova',
        input: text,
      });

      const audioBuffer = await response.arrayBuffer();
      const audioUri = `${FileSystem.documentDirectory}speech_${Date.now()}.mp3`;
      
      await FileSystem.writeAsStringAsync(
        audioUri,
        Buffer.from(audioBuffer).toString('base64'),
        { encoding: FileSystem.EncodingType.Base64 }
      );

      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      this.sound = sound;
      
      await sound.playAsync();
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.conversationState.isSpeaking = false;
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Error speaking text:', error);
      this.conversationState.isSpeaking = false;
      throw new Error('Failed to speak text');
    }
  }

  async endConversation(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }
      
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      const farewell = "Thank you for taking the time to talk with me today. Take care, and I'll speak with you again soon!";
      await this.speakText(farewell);

      await this.saveConversationHistory();
    } catch (error) {
      console.error('Error ending conversation:', error);
    }
  }

  private async saveConversationHistory(): Promise<void> {
    try {
      const conversationData = {
        messages: this.conversationState.messages,
        timestamp: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(
        `conversation_${Date.now()}`,
        JSON.stringify(conversationData)
      );
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  }

  getConversationState(): ConversationState {
    return { ...this.conversationState };
  }

  isConversationActive(): boolean {
    return this.conversationState.isListening || 
           this.conversationState.isProcessing || 
           this.conversationState.isSpeaking;
  }
}
