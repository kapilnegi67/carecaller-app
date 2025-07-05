const admin = require('firebase-admin');

const serviceAccount = require('./firebase-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'carecaller-app'
});

const db = admin.firestore();

async function createFirebaseIndexes() {
  console.log('Creating Firebase indexes for CareCaller app...');
  
  try {
    
    console.log('\n🔥 Firebase Index Creation Instructions:');
    console.log('==========================================');
    
    console.log('\n📋 Required Indexes:');
    console.log('\n1. Call History Index:');
    console.log('   Collection: callHistory');
    console.log('   Fields: userId (Ascending), startTime (Descending)');
    
    console.log('\n2. Scheduled Calls Index:');
    console.log('   Collection: scheduledCalls');
    console.log('   Fields: userId (Ascending), scheduledTime (Descending)');
    
    console.log('\n🛠️ Creation Methods:');
    console.log('\nMethod 1 - Firebase Console (Recommended):');
    console.log('1. Go to: https://console.firebase.google.com/project/carecaller-app/firestore/indexes');
    console.log('2. Click "Create Index"');
    console.log('3. Add the fields as specified above');
    
    console.log('\nMethod 2 - Firebase CLI:');
    console.log('1. Install: npm install -g firebase-tools');
    console.log('2. Login: firebase login');
    console.log('3. Create firestore.indexes.json file (see below)');
    console.log('4. Deploy: firebase deploy --only firestore:indexes');
    
    console.log('\n📄 firestore.indexes.json content:');
    const indexesConfig = {
      indexes: [
        {
          collectionGroup: "callHistory",
          queryScope: "COLLECTION",
          fields: [
            { fieldPath: "userId", order: "ASCENDING" },
            { fieldPath: "startTime", order: "DESCENDING" }
          ]
        },
        {
          collectionGroup: "scheduledCalls", 
          queryScope: "COLLECTION",
          fields: [
            { fieldPath: "userId", order: "ASCENDING" },
            { fieldPath: "scheduledTime", order: "DESCENDING" }
          ]
        }
      ]
    };
    
    console.log(JSON.stringify(indexesConfig, null, 2));
    
    console.log('\n✅ After creating indexes:');
    console.log('- Wait 2-5 minutes for completion');
    console.log('- Restart your Expo app');
    console.log('- Test call history functionality');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createFirebaseIndexes();
