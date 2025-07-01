import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { ScheduledCall, User } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Phone, User as UserIcon, Edit, Save, X } from 'lucide-react';

export const ScheduledCallsPage: React.FC = () => {
  const [scheduledCalls, setScheduledCalls] = useState<ScheduledCall[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [loading, setLoading] = useState(true);
  const [editingCall, setEditingCall] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<ScheduledCall['status']>('scheduled');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const callsQuery = query(
        collection(db, 'scheduledCalls'),
        orderBy('scheduledTime', 'asc')
      );
      const callsSnapshot = await getDocs(callsQuery);
      const callsData = callsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledTime: doc.data().scheduledTime.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as ScheduledCall[];

      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData: { [key: string]: User } = {};
      usersSnapshot.docs.forEach(doc => {
        usersData[doc.id] = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate(),
        } as User;
      });

      setScheduledCalls(callsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCall = (call: ScheduledCall) => {
    setEditingCall(call.id);
    setEditNotes(call.agentNotes || '');
    setEditStatus(call.status);
  };

  const handleSaveEdit = async (callId: string) => {
    try {
      const callRef = doc(db, 'scheduledCalls', callId);
      await updateDoc(callRef, {
        agentNotes: editNotes,
        status: editStatus,
        updatedAt: new Date(),
      });

      setScheduledCalls(prev => prev.map(call => 
        call.id === callId 
          ? { ...call, agentNotes: editNotes, status: editStatus, updatedAt: new Date() }
          : call
      ));

      setEditingCall(null);
    } catch (error) {
      console.error('Error updating call:', error);
    }
  };

  const getStatusColor = (status: ScheduledCall['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'wellness-check':
        return 'Wellness Check';
      case 'medication-reminder':
        return 'Medication Reminder';
      case 'social-call':
        return 'Social Call';
      case 'emergency':
        return 'Emergency';
      default:
        return type;
    }
  };

  const isCallUpcoming = (scheduledTime: Date) => {
    return scheduledTime > new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading scheduled calls...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const upcomingCalls = scheduledCalls.filter(call => isCallUpcoming(call.scheduledTime));
  const pastCalls = scheduledCalls.filter(call => !isCallUpcoming(call.scheduledTime));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Scheduled Calls</h2>
          <p className="text-gray-600">Manage and track all scheduled calls</p>
        </div>
        <div className="flex space-x-2">
          <Badge variant="secondary" className="px-3 py-1">
            {upcomingCalls.length} Upcoming
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {pastCalls.length} Past
          </Badge>
        </div>
      </div>

      {/* Upcoming Calls */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Calls</h3>
        {upcomingCalls.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingCalls.map((call) => {
              const user = users[call.userId];
              return (
                <Card key={call.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{getTypeLabel(call.type)}</CardTitle>
                        <CardDescription className="flex items-center space-x-1">
                          <UserIcon className="h-3 w-3" />
                          <span>{user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}</span>
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(call.status)}>
                        {call.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{call.scheduledTime.toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{call.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>({call.duration} min)</span>
                    </div>

                    {user?.phone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{user.phone}</span>
                      </div>
                    )}

                    {call.notes && (
                      <div className="bg-gray-50 p-2 rounded text-sm">
                        <p className="font-medium text-gray-700">Notes:</p>
                        <p className="text-gray-600">{call.notes}</p>
                      </div>
                    )}

                    {call.agentNotes && (
                      <div className="bg-blue-50 p-2 rounded text-sm">
                        <p className="font-medium text-blue-700">Agent Notes:</p>
                        <p className="text-blue-600">{call.agentNotes}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      {editingCall === call.id ? (
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor="status">Status</Label>
                            <Select value={editStatus} onValueChange={(value: ScheduledCall['status']) => setEditStatus(value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="missed">Missed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="notes">Agent Notes</Label>
                            <Textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Add agent notes..."
                              rows={3}
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => handleSaveEdit(call.id)}>
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingCall(null)}>
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEditCall(call)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No upcoming calls scheduled</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Past Calls */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Past Calls</h3>
        {pastCalls.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastCalls.slice(0, 6).map((call) => {
              const user = users[call.userId];
              return (
                <Card key={call.id} className="opacity-75">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{getTypeLabel(call.type)}</CardTitle>
                        <CardDescription className="flex items-center space-x-1">
                          <UserIcon className="h-3 w-3" />
                          <span>{user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}</span>
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(call.status)}>
                        {call.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{call.scheduledTime.toLocaleDateString()}</span>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>{call.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {call.agentNotes && (
                      <div className="bg-blue-50 p-2 rounded text-sm">
                        <p className="font-medium text-blue-700">Agent Notes:</p>
                        <p className="text-blue-600">{call.agentNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No past calls</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
