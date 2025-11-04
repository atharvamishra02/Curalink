'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Mail,
  Briefcase,
  BookOpen,
  ExternalLink,
  Award,
  Users,
  FileText,
  UserPlus,
  Bell,
  Video,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

export default function ExpertProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showNudgeModal, setShowNudgeModal] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState({
    message: '',
    preferredDate: '',
    preferredTime: '',
  });
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchExpertProfile = async () => {
    try {
      const response = await fetch(`/api/experts/${params.id}`);
      const data = await response.json();
      setExpert(data.expert);
      
      // Check if user is already following
      const followStatusResponse = await fetch(`/api/experts/${params.id}/follow`);
      if (followStatusResponse.ok) {
        const followData = await followStatusResponse.json();
        setIsFollowing(followData.isFollowing);
      }
    } catch (error) {
      console.error('Error fetching expert:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      setActionLoading(true);
      // API call to follow/unfollow expert
      const response = await fetch(`/api/experts/${params.id}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isFollowing ? 'unfollow' : 'follow' }),
      });
      
      if (response.ok) {
        setIsFollowing(!isFollowing);
        alert(isFollowing ? 'Unfollowed successfully!' : 'Following this expert!');
      }
    } catch (error) {
      console.error('Error following expert:', error);
      alert('Failed to update follow status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNudgeToJoin = async () => {
    try {
      setActionLoading(true);
      // API call to send nudge notification
      const response = await fetch(`/api/experts/${params.id}/nudge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: nudgeMessage }),
      });
      
      if (response.ok) {
        alert('Nudge sent successfully! The expert will be notified.');
        setShowNudgeModal(false);
        setNudgeMessage('');
      }
    } catch (error) {
      console.error('Error sending nudge:', error);
      alert('Failed to send nudge. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestMeeting = async () => {
    if (!meetingDetails.message || !meetingDetails.preferredDate) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      setActionLoading(true);
      // API call to request meeting
      const response = await fetch(`/api/experts/${params.id}/request-meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingDetails),
      });
      
      if (response.ok) {
        alert('Meeting request sent successfully! The expert will review and respond.');
        setShowMeetingModal(false);
        setMeetingDetails({ message: '', preferredDate: '', preferredTime: '' });
      }
    } catch (error) {
      console.error('Error requesting meeting:', error);
      alert('Failed to send meeting request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewProfile = () => {
    // Scroll to top or navigate to detailed profile view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (params.id) {
      fetchExpertProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">Expert not found</p>
          <Button onClick={() => router.push('/experts')}>Back to Experts</Button>
        </Card>
      </div>
    );
  }

  const profile = expert.researcherProfile;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/experts')}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Experts
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              {/* Avatar */}
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4">
                {expert.name.charAt(0)}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                {expert.name}
              </h1>

              {profile?.institution && (
                <div className="flex items-center justify-center text-gray-600 mb-4">
                  <Briefcase className="w-4 h-4 mr-2" />
                  <span className="text-sm">{profile.institution}</span>
                </div>
              )}

              {profile?.availableForMeetings && (
                <div className="flex justify-center mb-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Available for Meetings
                  </span>
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                {expert.email && (
                  <a
                    href={`mailto:${expert.email}`}
                    className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {expert.email}
                  </a>
                )}
              </div>

              {/* External Links */}
              <div className="space-y-2 pt-6 border-t border-gray-200">
                {profile?.orcidId && (
                  <a
                    href={`https://orcid.org/${profile.orcidId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">ORCID Profile</span>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                )}
                {profile?.researchGateUrl && (
                  <a
                    href={profile.researchGateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">ResearchGate</span>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                )}
                {profile?.googleScholarUrl && (
                  <a
                    href={profile.googleScholarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">Google Scholar</span>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-6 border-t border-gray-200">
                {/* View Full Profile */}
                <Button 
                  variant="primary"
                  fullWidth
                  onClick={handleViewProfile}
                  icon={Eye}
                >
                  View Full Profile
                </Button>

                {/* Follow Button */}
                <Button 
                  variant={isFollowing ? "secondary" : "outline"}
                  fullWidth
                  onClick={handleFollow}
                  disabled={actionLoading}
                  icon={UserPlus}
                >
                  {isFollowing ? 'Following' : 'Follow Expert'}
                </Button>

                {/* Nudge to Join Button */}
                <Button 
                  variant="ghost"
                  fullWidth
                  onClick={() => setShowNudgeModal(true)}
                  disabled={actionLoading}
                  icon={Bell}
                >
                  Nudge to Join
                </Button>

                {/* Request Meeting Button */}
                <Button 
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowMeetingModal(true)}
                  disabled={actionLoading || !profile?.availableForMeetings}
                  icon={Video}
                >
                  Request Meeting
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {profile?.bio && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  About
                </h2>
                <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
              </Card>
            )}

            {/* Specialties */}
            {profile?.specialties && profile.specialties.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-blue-600" />
                  Specialties
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((specialty, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Research Interests */}
            {profile?.researchInterests && profile.researchInterests.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  Research Interests
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.researchInterests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Publications Section (Placeholder) */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Recent Publications
              </h2>
              <p className="text-gray-500 text-center py-8">
                Publication history coming soon...
              </p>
            </Card>
          </div>
        </div>
      </main>

      {/* Nudge Modal */}
      <Modal
        isOpen={showNudgeModal}
        onClose={() => setShowNudgeModal(false)}
        title="Nudge Expert to Join"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Send a friendly nudge to encourage this expert to be more active on CuraLink.
            They&apos;ll receive a notification with your message.
          </p>
          <textarea
            value={nudgeMessage}
            onChange={(e) => setNudgeMessage(e.target.value)}
            placeholder="Write a personalized message... (optional)"
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors resize-none"
          />
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowNudgeModal(false);
                setNudgeMessage('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleNudgeToJoin}
              disabled={actionLoading}
              icon={Bell}
            >
              {actionLoading ? 'Sending...' : 'Send Nudge'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Request Meeting Modal */}
      <Modal
        isOpen={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
        title="Request a Meeting"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Request a meeting with {expert?.name}. They will review your request and get back to you.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={meetingDetails.message}
              onChange={(e) => setMeetingDetails({...meetingDetails, message: e.target.value})}
              placeholder="Describe the purpose of your meeting..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Date *
              </label>
              <input
                type="date"
                value={meetingDetails.preferredDate}
                onChange={(e) => setMeetingDetails({...meetingDetails, preferredDate: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time
              </label>
              <input
                type="time"
                value={meetingDetails.preferredTime}
                onChange={(e) => setMeetingDetails({...meetingDetails, preferredTime: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowMeetingModal(false);
                setMeetingDetails({ message: '', preferredDate: '', preferredTime: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestMeeting}
              disabled={actionLoading}
              icon={Video}
            >
              {actionLoading ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
