export interface User {
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

export interface ScheduledCall {
  id: string;
  userId: string;
  scheduledTime: Date;
  duration: number; // in minutes
  type: 'wellness-check' | 'medication-reminder' | 'social-call' | 'emergency';
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
  notes?: string;
  agentNotes?: string;
  startTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CallHistory {
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

export interface Agent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'agent' | 'admin';
  createdAt: Date;
}
