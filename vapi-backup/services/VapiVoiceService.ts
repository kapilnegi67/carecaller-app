// import Vapi from '@vapi-ai/react-native';
// import { CallTriggerService } from './CallTriggerService'; // Temporarily disabled to isolate screen capture permission issue

interface VoiceConversationConfig {
  callType: 'wellness-check' | 'medication-reminder' | 'social-call' | 'emergency';
  userName: string;
  userId: string;
  callId?: string;
}

interface VapiCallState {
  isActive: boolean;
  isMuted: boolean;
  startTime: Date | null;
  config: VoiceConversationConfig | null;
}

export class VapiVoiceService {
  // private vapi: Vapi; // Temporarily disabled due to WebRTC conflicts
  private callState: VapiCallState = {
    isActive: false,
    isMuted: false,
    startTime: null,
    config: null
  };
  
  private eventListeners: { [key: string]: Function[] } = {};

  constructor() {
    const vapiPublicKey = process.env.EXPO_PUBLIC_VAPI_PUBLIC_KEY;
    if (!vapiPublicKey || vapiPublicKey === 'your_vapi_public_key_here') {
      console.warn('⚠️ VAPI public key not configured. Voice calls will not work.');
      console.warn('⚠️ Please set EXPO_PUBLIC_VAPI_PUBLIC_KEY in your .env file');
    }
    
    // this.vapi = new Vapi(vapiPublicKey || ''); // Temporarily disabled
    console.warn('⚠️ VAPI React Native SDK temporarily disabled due to WebRTC dependency conflicts');
    // this.setupEventListeners(); // Temporarily disabled
  }

  private setupEventListeners() {
    console.log('⚠️ VAPI event listeners disabled - WebRTC conflicts resolved');
    /*
    this.vapi.on('call-start', () => {
      console.log('🎙️ VAPI call started');
      this.callState.isActive = true;
      this.callState.startTime = new Date();
      this.emit('call-start');
    });

    this.vapi.on('call-end', async () => {
      console.log('📞 VAPI call ended');
      if (this.callState.config) {
        await this.saveCallHistory();
      }
      this.callState.isActive = false;
      this.callState.startTime = null;
      this.callState.config = null;
      this.emit('call-end');
    });

    this.vapi.on('speech-start', () => {
      console.log('🗣️ User started speaking');
      this.emit('speech-start');
    });

    this.vapi.on('speech-end', () => {
      console.log('🤐 User stopped speaking');
      this.emit('speech-end');
    });

    this.vapi.on('message', (message: any) => {
      console.log('💬 VAPI message:', message);
      this.emit('message', message);
    });

    this.vapi.on('error', (error: any) => {
      console.error('❌ VAPI error:', error);
      this.emit('error', error);
    });
    */
  }

  async initializeConversation(config: VoiceConversationConfig): Promise<void> {
    try {
      console.log('🚀 Initializing VAPI conversation for:', config.userName);
      
      this.callState.config = config;
      
      const assistantId = process.env.EXPO_PUBLIC_VAPI_ASSISTANT_ID;
      if (!assistantId || assistantId === 'your_vapi_assistant_id_here') {
        console.warn('⚠️ VAPI assistant ID not configured. Please set EXPO_PUBLIC_VAPI_ASSISTANT_ID in your .env file');
        throw new Error('VAPI assistant ID is required. Please configure EXPO_PUBLIC_VAPI_ASSISTANT_ID in your .env file');
      } else {
        console.log('🚀 Starting VAPI call with assistant ID:', assistantId);
        // await this.vapi.start(assistantId); // Temporarily disabled due to WebRTC conflicts
        console.warn('⚠️ VAPI call start temporarily disabled - WebRTC dependency conflicts resolved');
        throw new Error('VAPI React Native SDK temporarily disabled due to WebRTC dependency conflicts');
      }
    } catch (error) {
      console.error('❌ Failed to initialize VAPI conversation:', error);
      throw error;
    }
  }

  private createAssistant(config: VoiceConversationConfig) {
    const systemPrompt = this.getSystemPrompt(config);
    const firstMessage = this.getFirstMessage(config);

    const assistant = {
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          }
        ]
      },
      voice: {
        provider: 'playht',
        voiceId: 'jennifer'
      },
      firstMessage: firstMessage,
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en-US'
      },
      endCallMessage: 'Thank you for our wonderful conversation today. Take care and have a great day!',
      endCallPhrases: ['goodbye', 'bye', 'gotta go', 'have to go', 'talk later', 'see you later', 'end call', 'hang up']
    };

    return assistant;
  }

  private getSystemPrompt(config: VoiceConversationConfig): string {
    const basePrompt = `You are a caring AI assistant for CareCaller, conducting a ${config.callType.replace('-', ' ')} with ${config.userName}.`;
    
    switch (config.callType) {
      case 'wellness-check':
        return `${basePrompt} Your role is to check on their wellbeing, ask about their health, mood, and daily activities. Be empathetic, encouraging, and genuinely interested in their responses. Keep the conversation natural and flowing, asking follow-up questions based on their answers. If they mention any concerning health issues, gently suggest they speak with their healthcare provider.`;
        
      case 'medication-reminder':
        return `${basePrompt} Your role is to remind them about their medications and check if they've taken them today. Be gentle and supportive, not pushy. Ask about any side effects or concerns they might have. Encourage them to maintain their medication schedule and remind them of the importance of consistency.`;
        
      case 'social-call':
        return `${basePrompt} Your role is to provide friendly companionship and social interaction. Ask about their day, interests, hobbies, family, or anything they'd like to talk about. Be a good listener, show genuine interest, and help them feel less lonely. Share appropriate responses and keep the conversation engaging and positive.`;
        
      case 'emergency':
        return `${basePrompt} This is an emergency check-in call. Your role is to assess their immediate safety and wellbeing. Ask if they're okay, if they need immediate help, and if they can reach emergency services if needed. Be calm, reassuring, and ready to provide guidance on contacting emergency services if necessary.`;
        
      default:
        return `${basePrompt} Have a friendly, caring conversation with them. Ask about their wellbeing and be a good listener.`;
    }
  }

  private getFirstMessage(config: VoiceConversationConfig): string {
    const timeOfDay = this.getTimeOfDay();
    
    switch (config.callType) {
      case 'wellness-check':
        return `Good ${timeOfDay}, ${config.userName}! This is your CareCaller AI assistant calling for your scheduled wellness check. How are you feeling today?`;
        
      case 'medication-reminder':
        return `Hello ${config.userName}! This is your CareCaller AI assistant with a friendly reminder about your medications. Have you taken your medications today?`;
        
      case 'social-call':
        return `Hi ${config.userName}! This is your CareCaller AI assistant calling for our scheduled chat. How has your day been going?`;
        
      case 'emergency':
        return `Hello ${config.userName}, this is your CareCaller AI assistant. I'm calling to check on you. Are you okay and safe right now?`;
        
      default:
        return `Hello ${config.userName}! This is your CareCaller AI assistant. How are you doing today?`;
    }
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  async endConversation(): Promise<void> {
    try {
      // if (this.vapi && this.callState.isActive) {
      //   await this.vapi.stop();
      // }
      console.log('⚠️ VAPI end conversation temporarily disabled - WebRTC conflicts resolved');
      this.callState.isActive = false;
      this.callState.startTime = null;
      this.callState.config = null;
    } catch (error) {
      console.error('❌ Error ending VAPI conversation:', error);
    }
  }

  private async saveCallHistory(): Promise<void> {
    if (!this.callState.config || !this.callState.startTime) {
      console.warn('⚠️ Cannot save call history: missing call state');
      return;
    }

    try {
      const duration = Math.floor((new Date().getTime() - this.callState.startTime.getTime()) / 1000 / 60);
      
      const scheduledCall = {
        id: this.callState.config.callId || 'vapi-call-' + Date.now(),
        userId: this.callState.config.userId,
        type: this.callState.config.callType,
        scheduledTime: this.callState.startTime,
        status: 'completed' as const,
        duration: duration,
        createdAt: this.callState.startTime,
        updatedAt: new Date(),
        notes: 'VAPI conversation completed successfully'
      };
      
      console.log('⚠️ Call history saving temporarily disabled - CallTriggerService import removed');
      console.log('✅ Call history would be saved successfully (temporarily disabled)');
    } catch (error) {
      console.error('❌ Error saving call history:', error);
    }
  }

  setMuted(muted: boolean): void {
    try {
      // this.vapi.setMuted(muted); // Temporarily disabled due to WebRTC conflicts
      this.callState.isMuted = muted;
      console.log(`🔇 VAPI call ${muted ? 'muted' : 'unmuted'} (temporarily disabled)`);
    } catch (error) {
      console.error('❌ Error setting mute state:', error);
    }
  }

  isMuted(): boolean {
    return this.callState.isMuted;
  }

  isCallActive(): boolean {
    return this.callState.isActive;
  }

  getCallDuration(): number {
    if (!this.callState.startTime) return 0;
    return Math.floor((new Date().getTime() - this.callState.startTime.getTime()) / 1000);
  }

  on(event: string, callback: Function): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event: string, callback: Function): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data?: any): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  async setupAudio(): Promise<void> {
    console.log('📱 VAPI audio setup handled internally');
  }

  async startListening(): Promise<void> {
    console.log('👂 VAPI listening handled automatically');
  }

  async stopListening(): Promise<void> {
    console.log('🛑 VAPI listening handled automatically');
  }

  async processAudio(audioUri: string): Promise<string> {
    console.log('🎵 VAPI audio processing handled internally');
    return 'VAPI handles audio processing automatically';
  }

  async speakText(text: string): Promise<void> {
    console.log('🗣️ VAPI text-to-speech handled internally');
  }
}
