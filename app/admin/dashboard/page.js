'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Users, Calendar, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [handledRequests, setHandledRequests] = useState({}); // Track handled meeting requests

  useEffect(() => {
    fetchUser();
    fetchNotifications();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        console.log('User data:', data.user); // Debug log
        console.log('User role:', data.user.role); // Debug log
        if (data.user.role !== 'ADMIN') {
          alert('Access Denied: You must be an admin to access this page');
          router.push('/login');
        } else {
          setUser(data.user);
          setLoading(false);
        }
      } else {
        console.log('Response not ok:', response.status);
        router.push('/login');
      }
    } catch (error) {
      console.error('Error:', error);
      router.push('/login');
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingResponse = async (notification, action) => {
    try {
      const isExternal = notification.metadata?.isExternal;
      const patientId = notification.metadata?.requesterId;
      const researcherName = notification.metadata?.targetResearcherName;
      const notificationId = notification.id;
      
      // Send notification to patient based on researcher type
      let notificationMessage = '';
      let notificationTitle = '';
      
      if (action === 'accept') {
        if (isExternal) {
          // External researcher - admin will arrange
          notificationTitle = 'Meeting Request Approved';
          notificationMessage = `We will try to connect you with ${researcherName}. Please confirm if you would like us to proceed with arranging this meeting.`;
        } else {
          // Internal researcher who is unavailable
          notificationTitle = 'Researcher Will Be Available Soon';
          notificationMessage = `${researcherName} is currently unavailable but will be back soon. We'll notify you when they're ready to schedule the meeting.`;
        }

        // Send notification to patient
        await fetch('/api/notifications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: patientId,
            type: 'MEETING_ACCEPTED',
            title: notificationTitle,
            message: notificationMessage,
            metadata: {
              researcherName: researcherName,
              isExternal: isExternal,
              adminHandled: true
            }
          })
        });

        // Mark as handled locally
        setHandledRequests(prev => ({
          ...prev,
          [notificationId]: 'arranged'
        }));

        alert(`✅ Notification sent to patient!\n\n${notificationTitle}\n${notificationMessage}`);
      } else {
        // Decline
        await fetch('/api/notifications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: patientId,
            type: 'MEETING_REJECTED',
            title: 'Meeting Request Declined',
            message: `Unfortunately, we cannot arrange a meeting with ${researcherName} at this time.`,
            metadata: {
              researcherName: researcherName
            }
          })
        });

        // Mark as declined locally
        setHandledRequests(prev => ({
          ...prev,
          [notificationId]: 'declined'
        }));

        alert('❌ Meeting request declined and patient notified.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send notification. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const meetingRequests = notifications.filter(n => n.type === 'MEETING_REQUEST');
  const followRequests = notifications.filter(n => 
    n.type === 'SYSTEM' && n.title.includes('Follow Request')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                CuraLink Admin
              </h1>
              <p className="text-sm text-gray-600 mt-1">Meeting Request Management</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Meeting Requests</p>
                <p className="text-2xl font-bold text-gray-900">{meetingRequests.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Follow Requests</p>
                <p className="text-2xl font-bold text-gray-900">{followRequests.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Bell className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.filter(n => !n.read).length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">External Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {meetingRequests.filter(n => n.metadata?.isExternal).length + followRequests.length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Follow Requests */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">External Researcher Follow Requests</h2>

          {followRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Follow Requests</h3>
              <p className="text-gray-600">External researcher follow requests will appear here</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {followRequests.map((notification) => (
                <Card key={notification.id} className={`p-6 ${!notification.read ? 'border-l-4 border-purple-500 bg-purple-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                        {notification.metadata?.isExternal && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                            External Researcher
                          </span>
                        )}
                        {!notification.read && (
                          <span className="px-2 py-1 bg-purple-500 text-white text-xs font-medium rounded-full">
                            New
                          </span>
                        )}
                      </div>

                      <p className="text-gray-700 mb-4">{notification.message}</p>

                      {/* Patient Details */}
                      <div className="bg-white rounded-lg p-4 mb-4 space-y-2">
                        <h4 className="font-semibold text-gray-800 text-sm mb-2">Patient Information:</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Name:</span>
                            <span className="ml-2 font-medium">{notification.metadata?.patientName}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Patient ID:</span>
                            <span className="ml-2 font-medium text-xs">{notification.metadata?.patientId}</span>
                          </div>
                        </div>
                      </div>

                      {/* External Researcher Details */}
                      <div className="bg-orange-50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-gray-800 text-sm mb-2">External Researcher:</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-gray-600">Name:</span> <span className="ml-2 font-medium">{notification.metadata?.researcherName}</span></p>
                          <p><span className="text-gray-600">ID:</span> <span className="ml-2 font-medium text-xs">{notification.metadata?.researcherId}</span></p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mt-4">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>

                      {/* Action Button */}
                      <div className="flex gap-3 mt-4">
                        <Button
                          onClick={() => {
                            const patientInfo = `Patient: ${notification.metadata?.patientName} (ID: ${notification.metadata?.patientId})`;
                            const researcherInfo = `Researcher: ${notification.metadata?.researcherName}`;
                            alert(`Please coordinate this connection manually:\n\n${patientInfo}\n${researcherInfo}\n\nReach out to the patient to provide researcher contact information or vice versa.`);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Send Message to Patient
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Meeting Requests */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Meeting Requests</h2>

          {meetingRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Meeting Requests</h3>
              <p className="text-gray-600">All meeting requests will appear here</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {meetingRequests.map((notification) => (
                <Card key={notification.id} className={`p-6 ${!notification.read ? 'border-l-4 border-blue-500 bg-blue-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                        {notification.metadata?.isExternal && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                            External Researcher
                          </span>
                        )}
                        {!notification.read && (
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                            New
                          </span>
                        )}
                      </div>

                      <p className="text-gray-700 mb-4">{notification.message}</p>

                      {/* Patient Details */}
                      <div className="bg-white rounded-lg p-4 mb-4 space-y-2">
                        <h4 className="font-semibold text-gray-800 text-sm mb-2">Patient Information:</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Name:</span>
                            <span className="ml-2 font-medium">{notification.metadata?.requesterName}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Email:</span>
                            <span className="ml-2 font-medium">{notification.metadata?.requesterEmail}</span>
                          </div>
                          {notification.metadata?.patientAge && (
                            <div>
                              <span className="text-gray-600">Age:</span>
                              <span className="ml-2 font-medium">{notification.metadata.patientAge}</span>
                            </div>
                          )}
                          {notification.metadata?.patientCondition && (
                            <div>
                              <span className="text-gray-600">Condition:</span>
                              <span className="ml-2 font-medium">{notification.metadata.patientCondition}</span>
                            </div>
                          )}
                          {notification.metadata?.patientLocation && (
                            <div>
                              <span className="text-gray-600">Location:</span>
                              <span className="ml-2 font-medium">{notification.metadata.patientLocation}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Researcher Details */}
                      {notification.metadata?.targetResearcherName && (
                        <div className="bg-purple-50 rounded-lg p-4 mb-4">
                          <h4 className="font-semibold text-gray-800 text-sm mb-2">
                            Target Researcher: {notification.metadata.targetResearcherName}
                          </h4>
                        </div>
                      )}

                      {/* Meeting Details */}
                      {(notification.metadata?.preferredDate || notification.metadata?.message) && (
                        <div className="space-y-2 text-sm">
                          {notification.metadata.preferredDate && (
                            <p className="text-gray-700">
                              <span className="font-medium">Preferred Date:</span>{' '}
                              {new Date(notification.metadata.preferredDate).toLocaleDateString()}
                            </p>
                          )}
                          {notification.metadata.preferredTime && (
                            <p className="text-gray-700">
                              <span className="font-medium">Preferred Time:</span>{' '}
                              {notification.metadata.preferredTime}
                            </p>
                          )}
                          {notification.metadata.message && (
                            <p className="text-gray-700 italic mt-2">
                              &quot;{notification.metadata.message}&quot;
                            </p>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-4">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-4">
                        {handledRequests[notification.id] === 'arranged' ? (
                          <div className="px-6 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                            ✓ Arranged
                          </div>
                        ) : handledRequests[notification.id] === 'declined' ? (
                          <div className="px-6 py-2 bg-red-100 text-red-700 rounded-lg font-medium">
                            ✗ Declined
                          </div>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleMeetingResponse(notification, 'accept')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Coordinate Meeting
                            </Button>
                            <Button
                              onClick={() => handleMeetingResponse(notification, 'reject')}
                              variant="outline"
                              className="border-red-600 text-red-600 hover:bg-red-50"
                            >
                              Decline Request
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
