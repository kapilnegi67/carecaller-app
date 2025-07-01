# CareCaller App

A full-stack care calling application with React Native mobile frontend and React web dashboard for agents/admins.

## Project Structure

```
carecaller-app/
├── mobile/                 # React Native mobile app (Expo)
│   ├── src/
│   │   ├── screens/       # Login, Register, Profile, Schedule, History
│   │   ├── contexts/      # Authentication context
│   │   ├── navigation/    # App navigation setup
│   │   └── types/         # TypeScript interfaces
│   ├── firebase.config.ts # Firebase configuration
│   └── App.tsx           # Main app component
└── web-dashboard/         # React web dashboard for agents
    ├── src/
    │   ├── components/    # Login, Layout, Users, Calls, History pages
    │   ├── contexts/      # Authentication context
    │   └── types/         # TypeScript interfaces
    ├── firebase.config.ts # Firebase configuration
    └── App.tsx           # Main app component
```

## Features

### Mobile App (React Native + Expo)
- **Authentication**: Email/password registration and login with Firebase Auth
- **Profile Management**: User profile setup with personal info and emergency contacts
- **Call Scheduling**: Schedule wellness checks, medication reminders, and social calls
- **Call History**: View past and upcoming scheduled calls
- **Push Notifications**: Expo notifications for call reminders (ready for implementation)
- **Mobile-First Design**: Optimized for mobile devices with clean, accessible UI

### Web Dashboard (React + TypeScript)
- **Agent Authentication**: Secure login system for agents and admins
- **User Management**: View all registered users with detailed profiles
- **Scheduled Calls Management**: View upcoming calls, edit agent notes, update call statuses
- **Call History**: Comprehensive filtering and viewing of all completed calls
- **Responsive Design**: Professional dashboard with Tailwind CSS and shadcn/ui components
- **Real-time Updates**: Firebase Firestore integration for live data synchronization

### Backend (Firebase)
- **Authentication**: Firebase Auth configured for both mobile and web
- **Database**: Firestore with proper schema for users, agents, scheduled calls, and call history
- **Real-time Sync**: Live updates across all applications
- **Scalable Infrastructure**: Cloud-based solution that scales automatically

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- Firebase project with Authentication and Firestore enabled

### Firebase Setup
1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password provider
3. Enable Firestore Database
4. Get your Firebase configuration from Project Settings > General > Your apps
5. Update the Firebase config in both applications:
   - `mobile/firebase.config.ts`
   - `web-dashboard/src/firebase.config.ts`

### Mobile App Setup
```bash
cd mobile
npm install
npx expo start
```

Use the Expo Go app to scan the QR code and test on your mobile device.

### Web Dashboard Setup
```bash
cd web-dashboard
npm install
npm run dev
```

Open the provided public URL to access the web dashboard.

## Firebase Configuration

Replace the placeholder values in both `firebase.config.ts` files:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Database Schema

### Collections

#### `users`
```typescript
{
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### `agents`
```typescript
{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'agent' | 'admin';
  createdAt: Date;
}
```

#### `scheduledCalls`
```typescript
{
  id: string;
  userId: string;
  scheduledTime: Date;
  duration: number; // in minutes
  type: 'wellness-check' | 'medication-reminder' | 'social-call' | 'emergency';
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
  notes?: string;
  agentNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `callHistory`
```typescript
{
  id: string;
  userId: string;
  scheduledCallId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  type: 'wellness-check' | 'medication-reminder' | 'social-call' | 'emergency';
  status: 'completed' | 'missed' | 'no-answer';
  notes?: string;
  agentNotes?: string;
  createdAt: Date;
}
```

## Usage

### For End Users (Mobile App)
1. Download and install the mobile app
2. Register with email and password
3. Complete profile setup with personal information
4. Schedule care calls (wellness checks, medication reminders, etc.)
5. View call history and upcoming appointments
6. Receive push notifications for scheduled calls

### For Agents (Web Dashboard)
1. Access the web dashboard at the provided URL
2. Login with agent credentials
3. View all registered users and their profiles
4. Monitor scheduled calls and add agent notes
5. Review call history and track completion rates
6. Update call statuses and add follow-up notes

### For Admins
- All agent features plus:
- Full access to all user data and call records
- System-wide analytics and reporting capabilities
- User and agent management

## Development

### Mobile App Development
```bash
cd mobile
npm run start    # Start Expo development server
npm run android  # Run on Android emulator
npm run ios      # Run on iOS simulator
```

### Web Dashboard Development
```bash
cd web-dashboard
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Deployment

### Mobile App
- Use Expo Application Services (EAS) for building and distributing
- Configure app store deployment through Expo

### Web Dashboard
- Build the application: `npm run build`
- Deploy the `dist` folder to your hosting provider
- Ensure Firebase configuration is set for production

## Technologies Used

### Mobile App
- React Native with Expo
- TypeScript
- Firebase Auth & Firestore
- React Navigation
- Expo Notifications
- React Native DateTimePicker

### Web Dashboard
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui component library
- Firebase Auth & Firestore
- React Router DOM
- Lucide React icons

## Security Considerations

- All authentication handled by Firebase Auth
- Firestore security rules should be configured for production
- Agent access should be restricted to authorized personnel only
- User data is protected and only accessible to authenticated agents
- All communications encrypted in transit

## Support

For technical support or questions about the CareCaller app, please contact the development team.
