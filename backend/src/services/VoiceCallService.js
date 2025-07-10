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
        const wellnessGreetings = [
          `Hello ${userName}, this is your AI wellness assistant calling for your scheduled wellness check. How are you feeling today?`,
          `Hi ${userName}, it's your wellness companion checking in. How has your health been lately?`,
          `Hello ${userName}, this is your AI health assistant. I hope you're doing well today - how are you feeling?`,
          `Hi there ${userName}, your wellness assistant here for our scheduled check-in. How are things going with your health?`
        ];
        greeting = wellnessGreetings[Math.floor(Math.random() * wellnessGreetings.length)];
        break;
      case 'medication-reminder':
        const medicationGreetings = [
          `Hello ${userName}, this is your AI assistant calling to remind you about your medication. Have you taken your prescribed medication today?`,
          `Hi ${userName}, it's your medication reminder assistant. How are you doing with your medications today?`,
          `Hello ${userName}, this is your AI health companion checking in about your medications. Have you taken them as prescribed?`,
          `Hi there ${userName}, your medication assistant here. I wanted to check in about your daily medications - how are you managing?`
        ];
        greeting = medicationGreetings[Math.floor(Math.random() * medicationGreetings.length)];
        break;
      case 'social-call':
        const socialGreetings = [
          `Hello ${userName}, this is your AI companion calling for our scheduled chat. I hope you're having a wonderful day! What's been going on in your world lately?`,
          `Hi ${userName}, it's your friendly AI calling to catch up. How has your day been treating you?`,
          `Hello there ${userName}, your AI friend here for our regular chat. What's new and exciting in your life?`,
          `Hi ${userName}, this is your AI companion checking in. I'd love to hear how things have been going for you!`,
          `Hello ${userName}, it's your AI buddy calling for our chat time. What's been happening since we last talked?`
        ];
        greeting = socialGreetings[Math.floor(Math.random() * socialGreetings.length)];
        break;
      default:
        const defaultGreetings = [
          `Hello ${userName}, this is your AI assistant calling for your scheduled appointment. How can I help you today?`,
          `Hi ${userName}, it's your AI assistant here for our scheduled call. What can I assist you with?`,
          `Hello there ${userName}, your AI helper calling as scheduled. How may I support you today?`,
          `Hi ${userName}, this is your AI assistant checking in. What would you like to discuss today?`
        ];
        greeting = defaultGreetings[Math.floor(Math.random() * defaultGreetings.length)];
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


    const timeoutMessages = [
      'I didn\'t catch that. Feel free to call back anytime if you\'d like to chat!',
      'No worries if you\'re busy. Have a wonderful day and talk soon!',
      'I\'ll let you go for now. Take care and call back whenever you\'d like!',
      'Seems like you might be away. Have a great day and we\'ll talk later!'
    ];
    const randomTimeout = timeoutMessages[Math.floor(Math.random() * timeoutMessages.length)];
    
    twiml.say({
      voice: 'Polly.Joanna-Neural',
      language: 'en-US'
    }, randomTimeout);

    twiml.hangup();

    return twiml.toString();
  }

  async processUserResponse(speechResult, callType, callId, userName) {
    try {
      if (!this.openai) {
        console.log('🚨 FALLBACK: Using simulated OpenAI response (API key not configured)');
        console.log(`🚨 FALLBACK: User said: "${speechResult}" for ${callType} call`);
        
        const simulatedResponses = {
          'wellness-check': [
            `I'm glad to hear from you, ${userName}. It sounds like you're doing well today. Is there anything specific about your health you'd like to discuss?`,
            `Thank you for sharing that with me, ${userName}. Your health is important to me. What else would you like to talk about regarding your wellbeing?`,
            `That's good to know, ${userName}. I appreciate you keeping me updated. How are you feeling overall today?`,
            `I understand, ${userName}. It's great that we can check in like this. Is there anything else about your health on your mind?`
          ],
          'medication-reminder': [
            `Thank you for letting me know about your medication, ${userName}. It's important to stay on track with your prescribed treatments. How are you feeling today?`,
            `I appreciate the update, ${userName}. Staying consistent with medications is so important. How has your day been otherwise?`,
            `That's helpful to know, ${userName}. I'm glad we can keep track of this together. What else is going on with you today?`,
            `Thanks for sharing that with me, ${userName}. Your health management is really important. How are you feeling overall?`
          ],
          'social-call': [
            `That sounds really interesting, ${userName}! I'd love to hear more about what's been keeping you busy lately.`,
            `Oh that's wonderful, ${userName}! What's been the best part of your day so far?`,
            `That's great to hear, ${userName}! I always enjoy learning about what you've been up to. What else has been happening?`,
            `How nice, ${userName}! It sounds like you've had some good experiences. What's been on your mind recently?`,
            `That's lovely, ${userName}! I'm always curious about your adventures. What's been surprising you lately?`
          ],
          'default': [
            `I understand, ${userName}. Thank you for sharing that with me. What else would you like to talk about today?`,
            `That makes sense, ${userName}. I appreciate you telling me about that. What's been on your mind lately?`,
            `I see, ${userName}. Thanks for letting me know. Is there anything else you'd like to discuss?`,
            `That's interesting, ${userName}. I'm glad you shared that with me. What else has been happening in your life?`
          ]
        };
        
        const responseArray = simulatedResponses[callType] || simulatedResponses['default'];
        const randomResponse = responseArray[Math.floor(Math.random() * responseArray.length)];
        const timestamp = Date.now();
        const response = `${randomResponse} [Simulated response ${timestamp}]`;
        if (callId) {
          await this.saveConversationTurn(callId, speechResult, response);
        }
        return response;
      }

      const conversationHistory = callId ? await this.getConversationHistory(callId) : [];
      const systemPrompt = this.getSystemPrompt(callType, userName, conversationHistory);
      
      const isGoodbye = this.detectGoodbyeIntent(speechResult);
      
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(-5).flatMap(turn => [
          { role: "user", content: turn.user },
          { role: "assistant", content: turn.ai }
        ]),
        { role: "user", content: speechResult }
      ];
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: isGoodbye ? 40 : 120,
        temperature: 1.2,
        presence_penalty: 1.2,
        frequency_penalty: 1.0,
        stream: false
      });

      const aiResponse = completion.choices[0].message.content;
      console.log(`✅ OpenAI API Success - AI Response: ${aiResponse}`);

      if (callId) {
        await this.saveConversationTurn(callId, speechResult, aiResponse);
      }

      return aiResponse;

    } catch (error) {
      console.error('🚨 ERROR: OpenAI API failed, using fallback response:', error);
      const timestamp = Date.now();
      const fallbackResponse = `I understand. Thank you for sharing that with me. What else would you like to talk about? [Fallback ${timestamp}]`;
      if (callId) {
        await this.saveConversationTurn(callId, speechResult, fallbackResponse);
      }
      return fallbackResponse;
    }
  }

  detectGoodbyeIntent(message) {
    if (!message || typeof message !== 'string') return false;
    const goodbyeKeywords = ['goodbye', 'bye', 'gotta go', 'have to go', 'talk later', 'see you', 'thanks for', 'that\'s all', 'nothing else', 'i\'m done', 'end call', 'hang up'];
    return goodbyeKeywords.some(keyword => message.toLowerCase().includes(keyword));
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
- Keep responses under 120 characters including your follow-up question
- NEVER repeat the same response twice - be creative and varied
- ALWAYS end with a different follow-up question based on what they share
- Reference specific details they mention in your responses
- Be conversational, not formal or robotic
- Show genuine curiosity about their day, feelings, activities, interests
- Vary your conversation starters and responses naturally
- If they mention something specific (work, family, hobbies), ask about it
- Be encouraging and positive but authentic, not overly cheerful
- MUST include a natural follow-up question in every response
- If they seem to be saying goodbye, give a warm but brief farewell
- AVOID phrases like "That's wonderful" or "I enjoy our conversations" - be more specific
- Use varied sentence structures and conversation patterns
- React authentically to what they share rather than using generic responses

${conversationHistory.length > 0 ? `Previous conversation: ${conversationHistory.slice(-3).map(h => `User: ${h.user} | AI: ${h.ai}`).join(' | ')}` : ''}

Examples of good responses:
- "That sounds really nice! What made it so special?"
- "Oh wow, how did that turn out for you?"
- "That must have been quite an experience! What surprised you most?"
- "Sounds like a busy day! What's keeping you motivated?"
- "That's fascinating! How long have you been doing that?"
- "I can imagine! What's your favorite part about it?"
- "That sounds challenging. How are you handling it?"
- "What an adventure! Would you do it again?"

Remember: Each response should be unique, include a reaction to what they said, and end with a contextual follow-up question. If they're ending the conversation, be warm but concise.`;
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
