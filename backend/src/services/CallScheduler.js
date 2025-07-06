const cron = require('node-cron');
const { db } = require('../config/firebase');
const VoiceCallService = require('./VoiceCallService');

class CallScheduler {
  constructor() {
    this.isRunning = false;
    this.pollInterval = process.env.POLL_INTERVAL_MINUTES || 1;
  }

  start() {
    if (this.isRunning) {
      console.log('Call scheduler is already running');
      return;
    }

    console.log(`Starting call scheduler with ${this.pollInterval} minute intervals`);
    this.isRunning = true;

    this.cronJob = cron.schedule(`*/${this.pollInterval} * * * *`, async () => {
      await this.checkScheduledCalls();
    });

    this.checkScheduledCalls();
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('Call scheduler stopped');
    }
  }

  async checkScheduledCalls() {
    try {
      console.log('Checking for scheduled calls...');
      const now = new Date();
      
      const scheduledCallsRef = db.collection('scheduledCalls');
      const query = scheduledCallsRef
        .where('status', '==', 'scheduled')
        .where('scheduledTime', '<=', now)
        .orderBy('scheduledTime', 'asc')
        .limit(10); // Process max 10 calls at a time

      const snapshot = await query.get();
      
      if (snapshot.empty) {
        console.log('No scheduled calls found');
        return;
      }

      console.log(`Found ${snapshot.size} scheduled calls to process`);

      const promises = snapshot.docs.map(doc => this.processScheduledCall(doc));
      await Promise.allSettled(promises);

    } catch (error) {
      console.error('Error checking scheduled calls:', error);
    }
  }

  async processScheduledCall(callDoc) {
    const callData = callDoc.data();
    const callId = callDoc.id;

    try {
      console.log(`Processing scheduled call ${callId} for user ${callData.userId}`);

      await callDoc.ref.update({
        status: 'in-progress',
        startTime: new Date(),
        updatedAt: new Date()
      });

      const userDoc = await db.collection('users').doc(callData.userId).get();
      if (!userDoc.exists) {
        throw new Error(`User ${callData.userId} not found`);
      }

      const userData = userDoc.data();
      const userPhone = userData.phone;
      const countryCode = userData.countryCode || '1';
      
      if (!userPhone) {
        throw new Error(`No phone number found for user ${callData.userId}`);
      }

      const fullPhoneNumber = `+${countryCode}${userPhone}`;
      const userName = `${userData.firstName} ${userData.lastName}`;

      console.log(`Initiating voice call to ${userName} at ${fullPhoneNumber}`);
      console.log(`Call details: Type=${callData.type}, Duration=${callData.duration} minutes`);

      const callResult = await VoiceCallService.initiateCall({
        callId,
        userPhone: fullPhoneNumber,
        userName,
        callType: callData.type,
        duration: callData.duration
      });

      await callDoc.ref.update({
        twilioCallSid: callResult.callSid,
        updatedAt: new Date()
      });

      console.log(`Voice call initiated successfully for ${userName}, Twilio SID: ${callResult.callSid}`);

    } catch (error) {
      console.error(`Error processing scheduled call ${callId}:`, error);
      console.error(`Error details:`, {
        message: error.message,
        stack: error.stack,
        callData: callData
      });

      await callDoc.ref.update({
        status: 'failed',
        error: error.message,
        updatedAt: new Date()
      });

      await this.createCallHistoryRecord(callId, callData, 'failed', error.message);
    }
  }

  async createCallHistoryRecord(callId, callData, status, error = null) {
    try {
      const historyRecord = {
        scheduledCallId: callId,
        userId: callData.userId,
        startTime: callData.startTime || new Date(),
        endTime: new Date(),
        duration: 0,
        type: callData.type,
        status: status,
        notes: error ? `Call failed: ${error}` : '',
        createdAt: new Date()
      };

      await db.collection('callHistory').add(historyRecord);
      console.log(`Call history record created for call ${callId}`);
    } catch (error) {
      console.error(`Error creating call history record for ${callId}:`, error);
    }
  }
}

module.exports = CallScheduler;
