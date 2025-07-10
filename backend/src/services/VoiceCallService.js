const twilio = require('twilio');
const OpenAI = require('openai');
const { db } = require('../config/firebase');

class VoiceCallService {
  constructor() {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!twilioSid || !twilioToken || twilioSid.includes('placeholder') || twilioToken.includes('placeholder') || !twilioSid.startsWith('AC')) {
      console.warn('⚠️  Twilio credentials not configured properly.');
      console.warn('⚠️  Voice calling will be simulated. Configure real Twilio credentials to enable actual calls.');
      this.twilioClient = null;
    } else {
      this.twilioClient = twilio(twilioSid, twilioToken);
      console.log('✅ Twilio client initialized successfully');
    }
    
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey || openaiKey.includes('placeholder')) {
      console.warn('⚠️  OpenAI API key not configured properly.');
      console.warn('⚠️  AI responses will be simulated. Configure real OpenAI API key to enable AI conversations.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: openaiKey
      });
      console.log('✅ OpenAI client initialized successfully');
    }

    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  async initiateCall({ callId, userPhone, userName, callType, duration }) {
    try {
      console.log(`Initiating voice call to ${userPhone} for ${userName}`);
      console.log(`Call parameters: callId=${callId}, type=${callType}, duration=${duration}`);

      if (!this.twilioClient) {
        console.log('🎭 SIMULATED: Twilio call would be initiated (credentials not configured)');
        console.log(`🎭 SIMULATED: Call to ${userPhone} for ${userName} - Type: ${callType}, Duration: ${duration} minutes`);
        
        return {
          callSid: `SIM${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
          status: 'initiated'
        };
      }

      if (!this.twilioPhoneNumber) {
        throw new Error('TWILIO_PHONE_NUMBER environment variable not configured');
      }

      const twimlUrl = `${process.env.BASE_URL || 'http://carecaller-backend-prod.eba-d3mug7pe.us-east-1.elasticbeanstalk.com'}/api/voice/twiml/${callId}`;
      const statusCallbackUrl = `${process.env.BASE_URL || 'http://carecaller-backend-prod.eba-d3mug7pe.us-east-1.elasticbeanstalk.com'}/api/voice/status/${callId}`;

      console.log(`TwiML URL: ${twimlUrl}`);
      console.log(`Status callback URL: ${statusCallbackUrl}`);

      const call = await this.twilioClient.calls.create({
        to: userPhone,
        from: this.twilioPhoneNumber,
        url: twimlUrl,
        method: 'POST',
        timeout: 30,
        record: true,
        statusCallback: statusCallbackUrl,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
      });

      console.log(`Twilio call created successfully with SID: ${call.sid}`);

      return {
        callSid: call.sid,
        status: 'initiated'
      };

    } catch (error) {
      console.error('Error initiating voice call:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        moreInfo: error.moreInfo
      });
      throw error;
    }
  }

  generateTwiML(callType, userName) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    let greeting = '';
    switch (callType) {
      case 'wellness-check':
        greeting = `Hello ${userName}, this is your AI wellness assistant calling for your scheduled wellness check. How are you feeling today?`;
        break;
      case 'medication-reminder':
        greeting = `Hello ${userName}, this is your AI assistant calling to remind you about your medication. Have you taken your prescribed medication today?`;
        break;
      case 'social-call':
        greeting = `Hello ${userName}, this is your AI companion calling for our scheduled chat. I hope you're having a wonderful day! How has your day been so far?`;
        break;
      default:
        greeting = `Hello ${userName}, this is your AI assistant calling for your scheduled appointment. How can I help you today?`;
    }

    twiml.say({
      voice: 'Polly.Joanna-Neural',
      language: 'en-US'
    }, greeting);

    const gather = twiml.gather({
      input: 'speech',
      timeout: 3,
      speechTimeout: 'auto',
      action: '/api/voice/respond',
      method: 'POST'
    });

    gather.say({
      voice: 'Polly.Joanna-Neural',
      language: 'en-US'
    }, 'Please tell me how you\'re doing, and I\'ll be here to listen and help.');

    twiml.say({
      voice: 'Polly.Joanna-Neural',
      language: 'en-US'
    }, 'I didn\'t hear a response. Please call us back if you need assistance. Take care!');

    twiml.hangup();

    return twiml.toString();
  }

  async processUserResponse(speechResult, callType, callId, userName) {
    try {
      if (!this.openai) {
        console.log('🎭 SIMULATED: OpenAI response would be generated (API key not configured)');
        console.log(`🎭 SIMULATED: User said: "${speechResult}" for ${callType} call`);
        
        const simulatedResponses = {
          'wellness-check': "I'm glad to hear from you. It sounds like you're doing well today. Is there anything specific about your health you'd like to discuss?",
          'medication-reminder': "Thank you for letting me know about your medication. It's important to stay on track with your prescribed treatments.",
          'social-call': "That's wonderful to hear! I enjoy our conversations. Tell me more about what's been happening in your day.",
          'default': "I understand. Thank you for sharing that with me. Is there anything else I can help you with today?"
        };
        
        const response = simulatedResponses[callType] || simulatedResponses['default'];
        if (callId) {
          await this.saveConversationTurn(callId, speechResult, response);
        }
        return response;
      }

      const conversationHistory = callId ? await this.getConversationHistory(callId) : [];
      const systemPrompt = this.getSystemPrompt(callType, userName, conversationHistory);
      
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(-3).flatMap(turn => [
          { role: "user", content: turn.user },
          { role: "assistant", content: turn.ai }
        ]),
        { role: "user", content: speechResult }
      ];
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 80,
        temperature: 0.9,
        presence_penalty: 0.8,
        frequency_penalty: 0.5,
        stream: false
      });

      const aiResponse = completion.choices[0].message.content;
      console.log(`AI Response: ${aiResponse}`);

      if (callId) {
        await this.saveConversationTurn(callId, speechResult, aiResponse);
      }

      return aiResponse;

    } catch (error) {
      console.error('Error processing user response with OpenAI:', error);
      const fallbackResponse = "I understand. Thank you for sharing that with me. Is there anything else I can help you with today?";
      if (callId) {
        await this.saveConversationTurn(callId, speechResult, fallbackResponse);
      }
      return fallbackResponse;
    }
  }

  getSystemPrompt(callType, userName = '', conversationHistory = []) {
    let basePrompt = "";
    
    switch (callType) {
      case 'wellness-check':
        basePrompt = "You are a caring AI wellness assistant. Be empathetic, supportive, and keep responses under 100 characters including a follow-up question. Focus on the person's physical and emotional wellbeing. Always end with a relevant follow-up question about their health or wellbeing.";
        break;
      case 'medication-reminder':
        basePrompt = "You are a caring AI medication assistant. Be empathetic, supportive, and keep responses under 100 characters including a follow-up question. Focus on medication adherence. Be encouraging about taking medications as prescribed. Always end with a relevant follow-up question about their medication or how they're feeling.";
        break;
      case 'social-call':
        basePrompt = `You are a warm, caring AI companion having a natural conversation with ${userName || 'your friend'}. You're genuinely interested in their life and experiences.

CRITICAL RULES:
- Keep responses under 100 characters including your follow-up question
- NEVER repeat the same response twice - be creative and varied
- ALWAYS end with a different follow-up question based on what they share
- Reference specific details they mention in your responses
- Be conversational, not formal or robotic
- Show genuine curiosity about their day, feelings, activities, interests
- Vary your conversation starters and responses naturally
- If they mention something specific (work, family, hobbies), ask about it
- Be encouraging and positive but authentic, not overly cheerful
- MUST include a natural follow-up question in every response

${conversationHistory.length > 0 ? `Previous conversation: ${conversationHistory.slice(-3).map(h => `User: ${h.user} | AI: ${h.ai}`).join(' | ')}` : ''}

Examples of good responses:
- "That sounds wonderful! What was the best part of your day?"
- "I'm glad to hear that. How did that make you feel?"
- "That's interesting! Tell me more about your work."
- "Sounds like you're busy! What are you looking forward to?"

Remember: Each response should be unique, include a reaction to what they said, and end with a contextual follow-up question.`;
        break;
      default:
        basePrompt = "You are a caring AI assistant. Be empathetic, supportive, and keep responses under 100 characters including a follow-up question. Provide general support and assistance based on what the person shares with you. Always end with a relevant follow-up question.";
    }
    
    return basePrompt;
  }

  async getConversationHistory(callId) {
    try {
      const conversationDoc = await db.collection('conversationHistory').doc(callId).get();
      if (conversationDoc.exists) {
        return conversationDoc.data().messages || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  async saveConversationTurn(callId, userMessage, aiResponse) {
    try {
      const conversationRef = db.collection('conversationHistory').doc(callId);
      const conversationDoc = await conversationRef.get();
      
      const newTurn = {
        timestamp: new Date(),
        user: userMessage,
        ai: aiResponse,
        topics: this.extractTopics(userMessage),
        sentiment: this.analyzeSentiment(userMessage)
      };

      if (conversationDoc.exists) {
        const existingMessages = conversationDoc.data().messages || [];
        const updatedMessages = [...existingMessages, newTurn].slice(-5);
        await conversationRef.update({ 
          messages: updatedMessages,
          updatedAt: new Date(),
          lastTopics: newTurn.topics,
          overallSentiment: newTurn.sentiment
        });
      } else {
        await conversationRef.set({
          callId,
          messages: [newTurn],
          createdAt: new Date(),
          updatedAt: new Date(),
          lastTopics: newTurn.topics,
          overallSentiment: newTurn.sentiment
        });
      }
    } catch (error) {
      console.error('Error saving conversation turn:', error);
    }
  }

  extractTopics(message) {
    const topics = [];
    const keywords = ['work', 'family', 'health', 'weather', 'food', 'travel', 'hobby', 'friend', 'home', 'exercise'];
    keywords.forEach(keyword => {
      if (message.toLowerCase().includes(keyword)) {
        topics.push(keyword);
      }
    });
    return topics;
  }

  analyzeSentiment(message) {
    const positiveWords = ['good', 'great', 'happy', 'wonderful', 'excellent', 'amazing', 'love', 'enjoy'];
    const negativeWords = ['bad', 'sad', 'terrible', 'awful', 'hate', 'worried', 'stressed', 'difficult'];
    
    const positive = positiveWords.some(word => message.toLowerCase().includes(word));
    const negative = negativeWords.some(word => message.toLowerCase().includes(word));
    
    if (positive && !negative) return 'positive';
    if (negative && !positive) return 'negative';
    return 'neutral';
  }

  async generateNaturalSpeech(text, voice = 'nova') {
    try {
      if (!this.openai) {
        return null;
      }

      const speech = await this.openai.audio.speech.create({
        model: "tts-1",
        voice: voice,
        input: text,
        response_format: "mp3",
        speed: 1.1
      });

      return await speech.arrayBuffer();
    } catch (error) {
      console.error('Error generating OpenAI speech:', error);
      return null;
    }
  }
}

module.exports = new VoiceCallService();
