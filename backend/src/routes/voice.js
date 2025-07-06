const express = require('express');
const router = express.Router();
const VoiceCallService = require('../services/VoiceCallService');
const { db } = require('../config/firebase');

router.post('/twiml/:callId', async (req, res) => {
  try {
    const { callId } = req.params;
    
    const callDoc = await db.collection('scheduledCalls').doc(callId).get();
    if (!callDoc.exists) {
      throw new Error('Call not found');
    }

    const callData = callDoc.data();
    
    const userDoc = await db.collection('users').doc(callData.userId).get();
    const userData = userDoc.data();
    const userName = `${userData.firstName} ${userData.lastName}`;

    const twiml = VoiceCallService.generateTwiML(callData.type, userName);
    
    res.type('text/xml');
    res.send(twiml);

  } catch (error) {
    console.error('Error generating TwiML:', error);
    
    const twilio = require('twilio');
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Sorry, there was an error with your call. Please try again later.');
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

router.post('/respond', async (req, res) => {
  try {
    const { SpeechResult, CallSid } = req.body;
    
    const callsQuery = await db.collection('scheduledCalls')
      .where('twilioCallSid', '==', CallSid)
      .limit(1)
      .get();

    if (callsQuery.empty) {
      throw new Error('Call not found');
    }

    const callDoc = callsQuery.docs[0];
    const callData = callDoc.data();

    const aiResponse = await VoiceCallService.processUserResponse(SpeechResult, callData.type);

    const twilio = require('twilio');
    const twiml = new twilio.twiml.VoiceResponse();
    
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, aiResponse);

    const gather = twiml.gather({
      input: 'speech',
      timeout: 10,
      speechTimeout: 'auto',
      action: '/api/voice/respond',
      method: 'POST'
    });

    gather.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Is there anything else you\'d like to talk about?');

    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Thank you for talking with me today. Take care and have a wonderful day!');
    
    twiml.hangup();

    res.type('text/xml');
    res.send(twiml.toString());

  } catch (error) {
    console.error('Error processing voice response:', error);
    
    const twilio = require('twilio');
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Thank you for your time. Have a great day!');
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

router.post('/status/:callId', async (req, res) => {
  try {
    const { callId } = req.params;
    const { CallStatus, CallDuration, CallSid } = req.body;

    console.log(`Call status update for ${callId}: ${CallStatus}`);

    const callDoc = await db.collection('scheduledCalls').doc(callId).get();
    if (!callDoc.exists) {
      console.error(`Call ${callId} not found for status update`);
      return res.status(404).send('Call not found');
    }

    const callData = callDoc.data();

    const updateData = {
      status: CallStatus === 'completed' ? 'completed' : 
              CallStatus === 'no-answer' ? 'no-answer' :
              CallStatus === 'busy' ? 'missed' : 'in-progress',
      updatedAt: new Date()
    };

    if (CallStatus === 'completed' || CallStatus === 'no-answer' || CallStatus === 'busy') {
      updateData.endTime = new Date();
      updateData.actualDuration = parseInt(CallDuration) || 0;
    }

    await callDoc.ref.update(updateData);

    if (CallStatus === 'completed' || CallStatus === 'no-answer' || CallStatus === 'busy') {
      const historyRecord = {
        scheduledCallId: callId,
        userId: callData.userId,
        startTime: callData.startTime || new Date(),
        endTime: new Date(),
        duration: parseInt(CallDuration) || 0,
        type: callData.type,
        status: updateData.status,
        twilioCallSid: CallSid,
        createdAt: new Date()
      };

      await db.collection('callHistory').add(historyRecord);
      console.log(`Call history record created for completed call ${callId}`);
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('Error handling call status update:', error);
    res.status(500).send('Error processing status update');
  }
});

module.exports = router;
