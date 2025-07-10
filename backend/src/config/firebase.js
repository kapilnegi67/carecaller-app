const admin = require('firebase-admin');
require('dotenv').config();

let db;

try {
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName] || process.env[varName].includes('placeholder'));

  if (missingVars.length > 0) {
    console.warn('⚠️  Firebase credentials not configured properly. Missing or placeholder values for:', missingVars.join(', '));
    console.warn('⚠️  Backend server will start but Firebase operations will fail.');
    console.warn('⚠️  Please configure real Firebase credentials in .env file to enable voice calling.');
    
    const createMockQuery = () => {
      const mockQuery = {
        where: () => mockQuery,
        orderBy: () => mockQuery,
        limit: () => mockQuery,
        get: () => Promise.resolve({ empty: true, docs: [] })
      };
      return mockQuery;
    };

    db = {
      collection: () => ({
        ...createMockQuery(),
        doc: () => ({
          get: () => Promise.resolve({ exists: false }),
          update: () => Promise.resolve(),
          ref: {
            update: () => Promise.resolve()
          }
        }),
        add: () => Promise.resolve()
      })
    };
  } else {
    let serviceAccount;
    
    try {
      const fs = require('fs');
      const path = require('path');
      const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
      
      if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        console.log('✅ Using Firebase service account file');
      } else {
        throw new Error('Service account file not found, using environment variables');
      }
    } catch (error) {
      console.log('📋 Using Firebase environment variables');
      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
      };
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    }

    db = admin.firestore();
    console.log('✅ Firebase Admin SDK initialized successfully');
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error.message);
  console.warn('⚠️  Backend server will start but Firebase operations will fail.');
  
  const createMockQuery = () => {
    const mockQuery = {
      where: () => mockQuery,
      orderBy: () => mockQuery,
      limit: () => mockQuery,
      get: () => Promise.resolve({ empty: true, docs: [] })
    };
    return mockQuery;
  };

  db = {
    collection: () => ({
      ...createMockQuery(),
      doc: () => ({
        get: () => Promise.resolve({ exists: false }),
        update: () => Promise.resolve(),
        ref: {
          update: () => Promise.resolve()
        }
      }),
      add: () => Promise.resolve()
    })
  };
}

module.exports = { admin, db };
