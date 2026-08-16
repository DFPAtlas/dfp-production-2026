'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { motion } from '@/components/motion';
import {
  ArrowLeft, Award, Calendar, Mail, Shield, Star, Save, CheckCircle2,
  MonitorSmartphone, Clock, Settings, Heart,
  Loader2,
} from 'lucide-react';
import {
  DEVICE_OPTIONS, AVAILABILITY_HOURS_OPTIONS, DAY_OPTIONS, TIME_OPTIONS,
  RESPONSE_SPEED_OPTIONS, SESSION_LENGTH_OPTIONS, NOTICE_REQUIRED_OPTIONS,
  TESTING_INTEREST_OPTIONS, COMMUNICATION_METHOD_OPTIONS,
} from '@/lib/uat-application-types';
import { useUATTester } from '@/components/uat/UATTesterProvider';

interface Badge {
  id: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_type: string;
}

interface Rating {
  id: string;
  overall_score: number;
  created_at: string;
}

interface EditableProfile {
  devices: string[];
  availabilityHours: string;
  availabilityDays: string[];
  availabilityTimes: string[];
  responseSpeed: string;
  preferredSessionLength: string;
  noticeRequired: string;
  testingInterests: string[];
  communicationMethods: string[];
  capabilities: Record<string, boolean>;
}

function TagToggle({ label, selected, onClick, size }: { label: string; selected: boolean; onClick: () => void; size?: 'sm' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'} rounded-xl font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
        selected
          ? 'bg-[#2878d0]/10 border border-[#2878d0]/30 text-[#2878d0] shadow-sm'
          : 'bg-slate-50 border border-slate-200 text-slate-500 hover:border-[#2878d0]/20 hover:text-slate-700'
      }`}
    >
      {label}
    </button>
  );
}

export default function TesterProfilePage() {
  const router = useRouter();
  const { tester, userId, refreshTester } = useUATTester();
  const testerId = tester.id;
  const [badges, setBadges] = useState<Badge[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'devices' | 'availability' | 'preferences' | 'badges'>('devices');
  const [stats, setStats] = useState({ testsCompleted: 0, totalBugs: 0, avgRating: 0 });
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const defaultProfile: EditableProfile = {
    devices: [],
    availabilityHours: '',
    availabilityDays: [],
    availabilityTimes: [],
    responseSpeed: '',
    preferredSessionLength: '',
    noticeRequired: '',
    testingInterests: [],
    communicationMethods: [],
    capabilities: {},
  };

  const [profile, setProfile] = useState<EditableProfile>(defaultProfile);

  useEffect(() => {
    loadData();
  }, [testerId]);

  const loadData = async () => {
    const localKey = `uat_profile_${testerId}`;
    const stored = sessionStorage.getItem(localKey);

    const [
      { data: badgeRows },
      { data: ratingRows },
      { count: completedCount },
      { count: feedbackCount },
      { data: application },
    ] = await Promise.all([
      supabase.from('uat_tester_badges').select('*, uat_badges!inner(name, description, icon, badge_type)').eq('tester_id', testerId),
      supabase.from('uat_tester_ratings').select('*').eq('tester_id', testerId).order('created_at', { ascending: false }),
      supabase.from('uat_assignments').select('*', { count: 'exact', head: true }).eq('tester_id', testerId).eq('status', 'completed'),
      supabase.from('uat_feedback').select('*', { count: 'exact', head: true }).eq('tester_id', testerId),
      supabase.from('uat_tester_applications').select('id, application_data').eq('user_id', userId).eq('status', 'approved').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    let loadedProfile = { ...defaultProfile };

    if (stored) {
      try { loadedProfile = JSON.parse(stored); } catch {}
    } else if (application) {
      setApplicationId(application.id);
      const ad = (application.application_data as any) || {};
      loadedProfile = {
        devices: ad.devices || [],
        availabilityHours: ad.availabilityHours || '',
        availabilityDays: ad.availabilityDays || [],
        availabilityTimes: ad.availabilityTimes || [],
        responseSpeed: ad.responseSpeed || '',
        preferredSessionLength: ad.preferredSessionLength || '',
        noticeRequired: ad.noticeRequired || '',
        testingInterests: ad.testingInterests || [],
        communicationMethods: ad.communicationMethods || [],
        capabilities: ad.capabilities || {},
      };
    }

    setProfile(loadedProfile);

    const badgeList: Badge[] = (badgeRows || []).map((b: any) => ({
      id: b.id,
      badge_name: b.uat_badges?.name || 'Unknown',
      badge_description: b.uat_badges?.description || '',
      badge_icon: b.uat_badges?.icon || 'ri-medal-line',
      badge_type: b.uat_badges?.badge_type || '',
    }));

    const ratingList: Rating[] = (ratingRows || []).map((r: any) => ({
      id: r.id,
      overall_score: r.overall_score || 0,
      created_at: r.created_at,
    }));

    const avgRating = ratingList.length > 0
      ? ratingList.reduce((sum, r) => sum + r.overall_score, 0) / ratingList.length
      : 0;

    setBadges(badgeList);
    setRatings(ratingList);
    setStats({
      testsCompleted: completedCount ?? 0,
      totalBugs: feedbackCount ?? 0,
      avgRating: Math.round(avgRating * 10) / 10,
    });
    setLoading(false);
  };

  const handleSave = async () => {
    if (!tester) return;
    setSaving(true);
    try {
      const localKey = `uat_profile_${testerId}`;
      sessionStorage.setItem(localKey, JSON.stringify(profile));

      if (applicationId) {
        await supabase.from('uat_tester_applications').update({
          application_data: profile,
          updated_at: new Date().toISOString(),
        }).eq('id', applicationId).eq('user_id', userId);
      }
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
    refreshTester();
  };

  const toggleArray = (arr: string[], item: string): string[] =>
    arr.includes(item) ? arr.filter((a) => a !== item) : [...arr, item];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-[3px] border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { key: 'devices' as const, label: 'Devices', icon: MonitorSmartphone },
    { key: 'availability' as const, label: 'Availability', icon: Clock },
    { key: 'preferences' as const, label: 'Preferences', icon: Settings },
    { key: 'badges' as const, label: 'Badges & Ratings', icon: Award },
  ];

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#789265]">My Profile</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl text-[#17325c]">
          {tester?.full_name}
        </h1>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-slate-500">
          <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {tester?.email}</span>
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> {tester?.experience_level}</span>
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Joined {tester?.created_at ? new Date(tester.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '-'}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-[#17325c]">{stats.testsCompleted}</p>
          <p className="text-xs text-slate-400 mt-1">Tests Done</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-[#17325c]">{stats.totalBugs}</p>
          <p className="text-xs text-slate-400 mt-1">Bugs Found</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-[#17325c]">{stats.avgRating || '-'}</p>
          <p className="text-xs text-slate-400 mt-1">Avg Rating</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === key
                ? 'bg-[#2878d0] text-white shadow-md shadow-blue-200'
                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
        {activeTab === 'devices' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[#17325c]">Your Devices</h2>
                <p className="text-sm text-slate-500 mt-1">Select the devices you can test on. This helps us match you with suitable jobs.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-8">
              {DEVICE_OPTIONS.map((device) => (
                <TagToggle
                  key={device}
                  label={device}
                  selected={profile.devices.includes(device)}
                  onClick={() => setProfile((p) => ({ ...p, devices: p.devices.includes(device) ? p.devices.filter((d) => d !== device) : [...p.devices, device] }))}
                />
              ))}
            </div>
            {profile.devices.length === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-xl p-4">Select at least one device you can test with.</p>
            )}
            {profile.devices.length > 0 && (
              <div className="rounded-xl bg-sky-50 border border-sky-100 p-4">
                <p className="text-sm text-sky-700 font-medium">Your testing devices:</p>
                <p className="text-sm text-sky-600 mt-1">{profile.devices.join(' • ')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-[#17325c] mb-1">Weekly Availability</h2>
              <p className="text-sm text-slate-500 mb-4">How many hours are you normally available each week?</p>
              <div className="flex flex-wrap gap-2">
                {AVAILABILITY_HOURS_OPTIONS.map((opt) => (
                  <TagToggle key={opt} label={opt} selected={profile.availabilityHours === opt} onClick={() => setProfile((p) => ({ ...p, availabilityHours: p.availabilityHours === opt ? '' : opt }))} />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#17325c] mb-1">Preferred Days</h2>
              <p className="text-sm text-slate-500 mb-4">Which days are normally suitable for testing?</p>
              <div className="flex flex-wrap gap-2">
                {DAY_OPTIONS.map((day) => (
                  <TagToggle key={day} label={day} selected={profile.availabilityDays.includes(day)} onClick={() => setProfile((p) => ({ ...p, availabilityDays: toggleArray(p.availabilityDays, day) }))} />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#17325c] mb-1">Preferred Times</h2>
              <p className="text-sm text-slate-500 mb-4">When do you prefer to test?</p>
              <div className="flex flex-wrap gap-2">
                {TIME_OPTIONS.map((time) => (
                  <TagToggle key={time} label={time} selected={profile.availabilityTimes.includes(time)} onClick={() => setProfile((p) => ({ ...p, availabilityTimes: toggleArray(p.availabilityTimes, time) }))} />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#17325c] mb-1">Response Speed</h2>
              <p className="text-sm text-slate-500 mb-4">How quickly do you normally respond to testing invitations?</p>
              <div className="flex flex-wrap gap-2">
                {RESPONSE_SPEED_OPTIONS.map((opt) => (
                  <TagToggle key={opt} label={opt} selected={profile.responseSpeed === opt} onClick={() => setProfile((p) => ({ ...p, responseSpeed: p.responseSpeed === opt ? '' : opt }))} />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#17325c] mb-1">Preferred Session Length</h2>
              <p className="text-sm text-slate-500 mb-4">How long are you comfortable testing in one session?</p>
              <div className="flex flex-wrap gap-2">
                {SESSION_LENGTH_OPTIONS.map((opt) => (
                  <TagToggle key={opt} label={opt} selected={profile.preferredSessionLength === opt} onClick={() => setProfile((p) => ({ ...p, preferredSessionLength: p.preferredSessionLength === opt ? '' : opt }))} />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#17325c] mb-1">Notice Required</h2>
              <p className="text-sm text-slate-500 mb-4">How much notice do you need before a test?</p>
              <div className="flex flex-wrap gap-2">
                {NOTICE_REQUIRED_OPTIONS.map((opt) => (
                  <TagToggle key={opt} label={opt} selected={profile.noticeRequired === opt} onClick={() => setProfile((p) => ({ ...p, noticeRequired: p.noticeRequired === opt ? '' : opt }))} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-[#17325c] mb-1">Testing Interests</h2>
              <p className="text-sm text-slate-500 mb-4">What types of testing interest you?</p>
              <div className="flex flex-wrap gap-2">
                {TESTING_INTEREST_OPTIONS.map((interest) => (
                  <TagToggle key={interest} label={interest} selected={profile.testingInterests.includes(interest)} onClick={() => setProfile((p) => ({ ...p, testingInterests: toggleArray(p.testingInterests, interest) }))} />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#17325c] mb-1">Communication Methods</h2>
              <p className="text-sm text-slate-500 mb-4">How do you prefer to communicate during testing?</p>
              <div className="flex flex-wrap gap-2">
                {COMMUNICATION_METHOD_OPTIONS.map((method) => (
                  <TagToggle key={method} label={method} selected={profile.communicationMethods.includes(method)} onClick={() => setProfile((p) => ({ ...p, communicationMethods: toggleArray(p.communicationMethods, method) }))} />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#17325c] mb-1">Testing Capabilities</h2>
              <p className="text-sm text-slate-500 mb-4">What are you comfortable doing during tests?</p>
              <div className="space-y-2">
                {[
                  { key: 'screenshots', label: 'Taking screenshots' },
                  { key: 'screen_recording', label: 'Recording your screen' },
                  { key: 'follow_instructions', label: 'Following written test instructions' },
                  { key: 'describe_steps', label: 'Describing steps that caused a problem' },
                  { key: 'video_calls', label: 'Joining occasional video or telephone calls' },
                  { key: 'multiple_devices', label: 'Testing on more than one device' },
                ].map((cap) => (
                  <label key={cap.key} className="flex items-start gap-3 cursor-pointer rounded-xl bg-slate-50 p-4 transition hover:bg-sky-50">
                    <input
                      type="checkbox"
                      checked={profile.capabilities[cap.key] || false}
                      onChange={(e) => setProfile((p) => ({ ...p, capabilities: { ...p.capabilities, [cap.key]: e.target.checked } }))}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2878d0] focus:ring-[#2878d0] cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-700">{cap.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="space-y-8">
            {badges.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-[#17325c] mb-1">Badges Earned</h2>
                <p className="text-sm text-slate-500 mb-4">Badges you have earned through your testing work.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {badges.map((badge) => (
                    <div key={badge.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                      <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-2">
                        <Award className="w-5 h-5 text-[#2878d0]" />
                      </div>
                      <p className="text-sm font-semibold text-[#17325c]">{badge.badge_name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{badge.badge_description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {badges.length === 0 && (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-medium text-slate-500">No badges yet</p>
                <p className="text-sm text-slate-400 mt-1">Complete tests and submit quality feedback to earn badges</p>
              </div>
            )}

            {ratings.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-[#17325c] mb-1">Recent Ratings</h2>
                <p className="text-sm text-slate-500 mb-4">Your performance ratings from completed tests.</p>
                <div className="space-y-3">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-sm text-slate-500">{new Date(rating.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-lg font-bold text-[#17325c]">{rating.overall_score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ratings.length === 0 && (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-medium text-slate-500">No ratings yet</p>
                <p className="text-sm text-slate-400 mt-1">Ratings appear after you complete tests</p>
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab !== 'badges' && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {saved && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Profile updated
              </motion.span>
            )}
            {saving && (
              <span className="text-sm text-slate-400 flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2878d0] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-[#1e68b9] transition disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#17325c] mb-4">Quick Links</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Dashboard', href: '/uat/dashboard', desc: 'Back to your dashboard' },
            { label: 'Browse Jobs', href: '/uat/jobs', desc: 'Find new testing opportunities' },
            { label: 'My Applications', href: '/uat/applications', desc: 'Track your applications' },
            { label: 'My Tests', href: '/uat/my-tests', desc: 'View active assignments' },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex flex-col gap-1 rounded-xl border border-slate-200 p-4 transition hover:border-[#2878d0] hover:bg-sky-50 cursor-pointer"
            >
              <span className="font-semibold text-[#17325c]">{link.label}</span>
              <span className="text-xs text-slate-500">{link.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}