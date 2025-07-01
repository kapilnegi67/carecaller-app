import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase.config';
import { CallHistory, User } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Phone, User as UserIcon, Search } from 'lucide-react';

export const CallHistoryPage: React.FC = () => {
  const [callHistory, setCallHistory] = useState<CallHistory[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [filteredHistory, setFilteredHistory] = useState<CallHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = callHistory;

    if (searchTerm) {
      filtered = filtered.filter(call => {
        const user = users[call.userId];
        return user && (
          user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(call => call.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(call => call.type === typeFilter);
    }

    setFilteredHistory(filtered);
  }, [callHistory, users, searchTerm, statusFilter, typeFilter]);

  const fetchData = async () => {
    try {
      const historyQuery = query(
        collection(db, 'callHistory'),
        orderBy('startTime', 'desc')
      );
      const historySnapshot = await getDocs(historyQuery);
      const historyData = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime?.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as CallHistory[];

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

      setCallHistory(historyData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: CallHistory['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      case 'no-answer':
        return 'bg-yellow-100 text-yellow-800';
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading call history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Call History</h2>
          <p className="text-gray-600">View and analyze all completed calls</p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {callHistory.length} Total Calls
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by user name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
                <SelectItem value="no-answer">No Answer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="wellness-check">Wellness Check</SelectItem>
                <SelectItem value="medication-reminder">Medication Reminder</SelectItem>
                <SelectItem value="social-call">Social Call</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Call History List */}
      {filteredHistory.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredHistory.map((call) => {
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
                    <span>{call.startTime.toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{call.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {call.duration && <span>({call.duration} min)</span>}
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

                  <div className="pt-2 border-t text-xs text-gray-500">
                    {call.endTime ? (
                      <span>
                        Duration: {Math.round((call.endTime.getTime() - call.startTime.getTime()) / 60000)} minutes
                      </span>
                    ) : (
                      <span>Call ended at unknown time</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No call history found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'No calls have been completed yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
