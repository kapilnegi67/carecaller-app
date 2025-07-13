// import Spokestack from 'react-native-spokestack'; // Temporarily disabled for rollback testing

interface VoiceConversationConfig {
  callType: 'wellness-check' | 'medication-reminder' | 'social-call' | 'emergency';
  userName: string;
  userId: string;
  callId?: string;
}

interface SpokestackCallState {
  isActive: boolean;
  isMuted: boolean;
  startTime: Date | null;
  config: VoiceConversationConfig | null;
  isListening: boolean;
}

export class SpokestackVoiceService {
  private callState: SpokestackCallState = {
    isActive: false,
    isMuted: false,
    startTime: null,
    config: null,
    isListening: false
  };
  
  private eventListeners: { [key: string]: Function[] } = {};

  constructor() {
    this.initializeSpokestack();
  }

  private async initializeSpokestack() {
    try {
      const clientId = process.env.EXPO_PUBLIC_SPOKESTACK_CLIENT_ID;
      const clientSecret = process.env.EXPO_PUBLIC_SPOKESTACK_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        console.warn('⚠️ Spokestack credentials not configured');
        return;
      }

      // await Spokestack.initialize(clientId, clientSecret, {
      //   pipeline: {
      //     profile: Spokestack.PipelineProfile.VAD_NATIVE_ASR
      //   }
      // });

      // this.setupEventListeners();
      console.log('✅ Spokestack initialization temporarily disabled for rollback testing');
    } catch (error) {
      console.error('❌ Failed to initialize Spokestack:', error);
    }
  }

  private setupEventListeners() {
    console.log('⚠️ Spokestack event listeners temporarily disabled for rollback testing');
    // Spokestack.addListener('recognize', ({ transcript }) => {
    //   console.log('🗣️ Recognized:', transcript);
    //   this.emit('transcript', transcript);
    // });

    // Spokestack.addListener('activate', () => {
    //   console.log('🎙️ Spokestack activated');
    //   this.callState.isListening = true;
    //   this.emit('listening-start');
    // });

    // Spokestack.addListener('deactivate', () => {
    //   console.log('🛑 Spokestack deactivated');
    //   this.callState.isListening = false;
    //   this.emit('listening-stop');
    // });

    // Spokestack.addListener('error', ({ error }) => {
    //   console.error('❌ Spokestack error:', error);
    //   this.emit('error', error);
    // });
  }

  async initializeConversation(config: VoiceConversationConfig): Promise<void> {
    try {
      console.log('🚀 Initializing Spokestack conversation for:', config.userName);
      
      this.callState.config = config;
      this.callState.isActive = true;
      this.callState.startTime = new Date();
      
      // await Spokestack.start(); // Temporarily disabled for rollback testing
      console.log('⚠️ Spokestack start temporarily disabled for rollback testing');
      this.emit('call-start');
      
      const greeting = this.getFirstMessage(config);
      await this.speakText(greeting);
      
    } catch (error) {
      console.error('❌ Failed to initialize Spokestack conversation:', error);
      throw error;
    }
  }

  private getFirstMessage(config: VoiceConversationConfig): string {
    const timeOfDay = this.getTimeOfDay();
    
    switch (config.callType) {
      case 'wellness-check':
        return `Good ${timeOfDay}, ${config.userName}! This is your CareCaller assistant calling for your scheduled wellness check. How are you feeling today?`;
      case 'medication-reminder':
        return `Hello ${config.userName}! This is your CareCaller assistant with a friendly reminder about your medications. Have you taken your medications today?`;
      case 'social-call':
        return `Hi ${config.userName}! This is your CareCaller assistant calling for our scheduled chat. How has your day been going?`;
      case 'emergency':
        return `Hello ${config.userName}, this is your CareCaller assistant. I'm calling to check on you. Are you okay and safe right now?`;
      default:
        return `Hello ${config.userName}! This is your CareCaller assistant. How are you doing today?`;
    }
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  async startListening(): Promise<void> {
    try {
      // await Spokestack.activate(); // Temporarily disabled for rollback testing
      console.log('👂 Started listening (temporarily disabled for rollback testing)');
    } catch (error) {
      console.error('❌ Error starting to listen:', error);
      throw error;
    }
  }

  async stopListening(): Promise<void> {
    try {
      // await Spokestack.deactivate(); // Temporarily disabled for rollback testing
      console.log('🛑 Stopped listening (temporarily disabled for rollback testing)');
    } catch (error) {
      console.error('❌ Error stopping listening:', error);
    }
  }

  async speakText(text: string): Promise<void> {
    try {
      // const url = await Spokestack.synthesize(text); // Temporarily disabled for rollback testing
      console.log('🗣️ Speaking (temporarily disabled for rollback testing):', text);
      this.emit('speech', { text, url: null });
    } catch (error) {
      console.error('❌ Error speaking text:', error);
    }
  }

  async endConversation(): Promise<void> {
    try {
      // await Spokestack.stop(); // Temporarily disabled for rollback testing
      this.callState.isActive = false;
      this.callState.startTime = null;
      this.callState.config = null;
      this.emit('call-end');
      console.log('📞 Conversation ended (temporarily disabled for rollback testing)');
    } catch (error) {
      console.error('❌ Error ending conversation:', error);
    }
  }

  isCallActive(): boolean {
    return this.callState.isActive;
  }

  isListening(): boolean {
    return this.callState.isListening;
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

  cleanup(): void {
    // Spokestack.removeAllListeners(); // Temporarily disabled for rollback testing
    console.log('🧹 Cleanup (temporarily disabled for rollback testing)');
  }
}
