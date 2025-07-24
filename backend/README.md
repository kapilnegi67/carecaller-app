# CareCaller Backend Server

Backend server for the CareCaller voice calling system that monitors scheduled calls and initiates AI-powered voice conversations with users.

## Features

- Firebase integration for user authentication and data storage
- Health check endpoints for monitoring
- Comprehensive error handling and logging

## Prerequisites

- Node.js 16+ 
- Firebase project with Firestore database
- Twilio account with phone number
- OpenAI API key

## Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Set up environment variables (see Configuration section below)

3. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## Configuration

Create a `.env` file in the backend directory with the following variables:

### Firebase Configuration
```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```


### Server Configuration
```env
PORT=3001
NODE_ENV=development
BASE_URL=http://localhost:3001
POLL_INTERVAL_MINUTES=1
```

## Firebase Service Account Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Extract the values and add them to your `.env` file:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key_id` → `FIREBASE_PRIVATE_KEY_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and newlines)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `client_id` → `FIREBASE_CLIENT_ID`

## Additional Setup

The backend is now simplified to focus on Firebase integration and health monitoring.

## OpenAI Setup

1. Create an [OpenAI account](https://platform.openai.com)
2. Generate an API key from the API Keys section
3. Add the key to your `.env` file

## API Endpoints

### Health Check
- `GET /health` - Returns server status


## How It Works

1. **Polling**: Server polls Firebase every minute for scheduled calls where:
   - `status = 'scheduled'`
   - `scheduledTime <= current time`

2. **Health Monitoring**: The backend provides:
   - Health check endpoints for monitoring service status
   - Firebase connectivity verification
   - User speech is captured and sent to OpenAI for processing
   - AI generates contextual responses based on call type

4. **Call Completion**: When call ends:
   - Updates call status to 'completed', 'missed', or 'no-answer'
   - Creates call history record in Firebase

## Call Types

- **wellness-check**: General health and wellbeing check
- **medication-reminder**: Medication adherence reminder
- **social-call**: Companionship and social interaction
- **emergency**: Emergency response call

## Testing

### Local Testing

1. Start the backend server:
```bash
npm run dev
```

2. Schedule a test call in the mobile app for 2-3 minutes in the future

3. Monitor server logs to verify:
   - Server starts successfully
   - Firebase connection is established
   - Health endpoints respond correctly

### Integration Testing

1. Use a real phone number for testing
2. Schedule a call and answer when it comes in
3. Test the AI conversation flow
4. Verify call history is created after completion

## Troubleshooting

### Common Issues

1. **Firebase connection errors**
   - Verify service account credentials are correct
   - Check Firebase project ID matches your database

2. **Service connectivity issues**
   - Verify network connectivity
   - Check firewall settings

### Debugging

Enable detailed logging by setting `NODE_ENV=development` in your `.env` file.

Check logs for:
- Firebase connection status
- Server startup messages
- Health check responses

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure `BASE_URL` to your production domain
3. Ensure webhook URLs are publicly accessible
4. Set up proper monitoring and alerting
5. Configure Firebase security rules for backend access

## Security Notes

- Never commit `.env` file to version control
- Use Firebase security rules to restrict backend access
- Rotate API keys regularly
- Monitor for unusual call patterns or costs
