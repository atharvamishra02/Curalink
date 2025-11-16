'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, MessageSquare, UserPlus, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Always show the bell, even if user is not logged in (for visibility)
  if (!user) {
    console.log('Rendering bell for non-logged-in user');
    return (
      <button
        className="fixed top-4 right-[120px] sm:right-[140px] z-[9999] p-2 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg shadow-2xl hover:shadow-3xl transition-all duration-200 hover:scale-110 border-2 border-white animate-pulse"
        aria-label="Notifications"
        title="Login to see notifications"
        style={{ boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </button>
    );
  }

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    fetchNotifications();

    // Use polling for Vercel deployment (WebSocket not supported in serverless)
    // Check for new notifications every 10 seconds
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 10000);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      clearInterval(pollInterval);
    };
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: { 'Cache-Control': 'max-age=5' } // Cache for 5 seconds
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Then update server - use the correct endpoint
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert on error
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

      // Then update server
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Revert on error
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const getNotificationIcon = useCallback((type) => {
    switch (type) {
      case 'MEETING_REQUEST':
        return <Video className="w-5 h-5 text-blue-600" />;
      case 'MEETING_ACCEPTED':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'MEETING_DECLINED':
        return <X className="w-5 h-5 text-red-600" />;
      case 'FORUM_REPLY':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'NEW_FOLLOWER':
        return <UserPlus className="w-5 h-5 text-indigo-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  }, []);

  const formatTime = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }, []);

  console.log('Rendering bell for logged-in user, unread count:', unreadCount);

  return (
    <>
      {/* Notification Bell Button - SUPER VISIBLE */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-[88px] sm:right-[96px] z-[9999] p-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-2xl hover:shadow-3xl transition-all duration-200 hover:scale-110 border-2 border-white"
        aria-label="Notifications"
        style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold rounded-full min-w-7 h-7 flex items-center justify-center px-2 border-4 border-white shadow-lg animate-bounce"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Notification Dropdown - Responsive */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-16 sm:top-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 max-h-[70vh] sm:max-h-[600px] z-[80] bg-white rounded-xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg text-gray-800">Notifications</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-white rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <Bell className="w-16 h-16 text-gray-300 mb-3" />
                    <p className="text-gray-500 text-center">No notifications yet</p>
                    <p className="text-gray-400 text-sm text-center mt-1">
                      We'll notify you when something happens
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                        }}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTime(notification.createdAt)}
                            </p>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                              >
                                Okay
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedNotification(notification);
                                  setShowReplyModal(true);
                                  setIsOpen(false);
                                }}
                                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Reply Modal */}
      {showReplyModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Reply to Notification</h3>
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setSelectedNotification(null);
                  setReplyMessage('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{selectedNotification.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatTime(selectedNotification.createdAt)}
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!replyMessage.trim() || sending) return;

                setSending(true);
                try {
                  const response = await fetch('/api/notifications/reply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      notificationId: selectedNotification.id,
                      replyMessage: replyMessage.trim()
                    })
                  });

                  if (response.ok) {
                    // Mark as read and close modal
                    await markAsRead(selectedNotification.id);
                    setShowReplyModal(false);
                    setSelectedNotification(null);
                    setReplyMessage('');
                    
                    // Refresh notifications to show updated state
                    fetchNotifications();
                  } else {
                    alert('Failed to send reply. Please try again.');
                  }
                } catch (error) {
                  console.error('Error sending reply:', error);
                  alert('Failed to send reply. Please try again.');
                } finally {
                  setSending(false);
                }
              }}
            >
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="4"
                disabled={sending}
              />

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyModal(false);
                    setSelectedNotification(null);
                    setReplyMessage('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={sending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!replyMessage.trim() || sending}
                  className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
}
