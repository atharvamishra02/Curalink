'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save, Clock } from 'lucide-react';

export default function ResearcherSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    bio: '',
    institution: '',
    location: '',
    specialties: [],
    researchInterests: [],
    availableForMeetings: false,
    meetingSchedule: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/researcher/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfile({
            bio: data.profile.bio || '',
            institution: data.profile.institution || '',
            location: data.profile.location || '',
            specialties: data.profile.specialties || [],
            researchInterests: data.profile.researchInterests || [],
            availableForMeetings: data.profile.availableForMeetings || false,
            meetingSchedule: data.profile.meetingSchedule || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/researcher/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <p className="text-gray-600">Loading profile...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/researcher/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder="Tell us about yourself and your research..."
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />
            </div>

            {/* Institution */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Institution
              </label>
              <Input
                type="text"
                placeholder="University or Organization"
                value={profile.institution}
                onChange={(e) => setProfile({ ...profile, institution: e.target.value })}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location
              </label>
              <Input
                type="text"
                placeholder="City, State, Country"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              />
            </div>

            {/* Available for Meetings */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.availableForMeetings}
                  onChange={(e) => setProfile({ ...profile, availableForMeetings: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Available for Meetings
                </span>
              </label>
            </div>

            {/* Meeting Schedule */}
            {profile.availableForMeetings && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Meeting Availability Schedule
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  placeholder="e.g., Monday-Friday: 9 AM - 5 PM EST&#10;Available for virtual meetings via Zoom&#10;Please schedule at least 24 hours in advance"
                  value={profile.meetingSchedule}
                  onChange={(e) => setProfile({ ...profile, meetingSchedule: e.target.value })}
                />
                <p className="text-xs text-gray-600 mt-2">
                  Specify your available meeting times, time zone, and any preferences. This will be visible to patients viewing your profile.
                </p>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="px-6"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
