'use client';

import { useState, useEffect } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useRouter } from 'next/navigation';
import { userApi, UserProfileResponse } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Linkedin,
  Github,
  Globe,
  Save,
  Edit2,
  X,
  FileText,
  Award,
  TrendingUp,
  Clock,
  CalendarCheck,
  Upload,
} from 'lucide-react';

type UserProfile = UserProfileResponse;

export default function ProfilePage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    bio: '',
    avatarUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    websiteUrl: '',
  });

  useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
  }, [authLoading]);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await userApi.getMe();
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        phone: response.data.phone || '',
        location: response.data.location || '',
        bio: response.data.bio || '',
        avatarUrl: response.data.avatarUrl || '',
        linkedinUrl: response.data.linkedinUrl || '',
        githubUrl: response.data.githubUrl || '',
        websiteUrl: response.data.websiteUrl || '',
      });
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await userApi.updateMe(formData);
      setProfile(response.data);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload JPEG, PNG, WEBP, or GIF.');
      event.target.value = '';
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError('File size must be 5MB or less.');
      event.target.value = '';
      return;
    }

    setAvatarUploading(true);
    try {
      const response = await userApi.uploadAvatar(file);
      const payload = response.data as
        | { avatarUrl?: string; url?: string }
        | UserProfileResponse;

      const uploadedUrl =
        (payload as UserProfileResponse).avatarUrl ||
        (payload as { avatarUrl?: string; url?: string }).avatarUrl ||
        (payload as { avatarUrl?: string; url?: string }).url ||
        '';

      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, avatarUrl: uploadedUrl }));
        setProfile((prev) => (prev ? { ...prev, avatarUrl: uploadedUrl } : prev));
      }

      setSuccess('Avatar uploaded successfully.');
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
      event.target.value = '';
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
        githubUrl: profile.githubUrl || '',
        websiteUrl: profile.websiteUrl || '',
      });
    }
    setIsEditing(false);
    setError('');
  };

  const cardBase = 'rounded-3xl border border-[#cfd8d2] bg-[#eff4f0]';

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e7efe9]">
        <div className="text-slate-800 text-xl font-semibold">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e7efe9]">
        <div className="text-rose-700 text-xl font-semibold">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e7efe9] px-3 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="h-11 w-11 rounded-full border border-[#bac7bf] bg-[#dde6df] text-slate-900 transition hover:bg-[#d4dfd7]"
              aria-label="Go back"
            >
              <ArrowLeft className="mx-auto" size={20} />
            </button>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">My Profile</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-2xl border border-[#bac7bf] bg-[#dde6df] px-4 py-2 text-sm font-semibold text-slate-700">
              {isEditing ? 'Editing' : 'View Mode'}
            </div>
            <div className="rounded-2xl border border-[#bac7bf] bg-[#dde6df] px-4 py-2 text-sm font-semibold text-slate-700">
              {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <span className="inline-flex items-center gap-2">
                  <Edit2 size={16} />
                  Edit
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="rounded-2xl border border-[#bac7bf] bg-[#dde6df] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#d4dfd7]"
                >
                  <span className="inline-flex items-center gap-2">
                    <X size={16} />
                    Cancel
                  </span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </header>

        {(error || success) && (
          <div className="mb-4 space-y-2">
            {error && (
              <div className="rounded-2xl border border-rose-300 bg-rose-100 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-700">
                {success}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <section className={`${cardBase} p-5 xl:col-span-4`}>
            <div className="mb-5 flex items-start gap-4">
              {formData.avatarUrl ? (
                // External avatars are user-provided URLs and may not be from configured Next domains.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formData.avatarUrl}
                  alt="Avatar"
                  className="h-24 w-24 rounded-full border-4 border-[#e4b35a] object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#e4b35a]">
                  <User className="text-slate-900" size={42} />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-4xl font-black leading-tight text-slate-900">
                  {profile.name || 'Your Name'}
                </h2>
                <p className="mt-1 text-xl font-semibold text-slate-600">{profile.role}</p>
                <p className="mt-2 truncate text-sm text-slate-600">{profile.email}</p>
              </div>
            </div>

            <div className="mb-5">
              <label
                htmlFor="avatarUpload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#bac7bf] bg-[#dde6df] px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#d4dfd7]"
              >
                <Upload size={16} />
                {avatarUploading ? 'Uploading...' : 'Upload Avatar'}
              </label>
              <input
                id="avatarUpload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={avatarUploading}
              />
              <p className="mt-2 text-xs font-medium text-slate-500">
                JPEG/PNG/WEBP/GIF up to 5MB.
              </p>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              <div className="rounded-full border border-[#bac7bf] bg-black p-3 text-white">
                <Mail size={18} />
              </div>
              <div className="rounded-full border border-[#bac7bf] bg-[#e8eeea] p-3 text-slate-700">
                <Phone size={18} />
              </div>
              <div className="rounded-full border border-[#bac7bf] bg-[#e8eeea] p-3 text-slate-700">
                <Linkedin size={18} />
              </div>
              <div className="rounded-full border border-[#bac7bf] bg-[#e8eeea] p-3 text-slate-700">
                <Github size={18} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#bac7bf] bg-[#e8eeea] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Member Since</p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="rounded-2xl border border-[#bac7bf] bg-[#e8eeea] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Update</p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'Not updated'}
                </p>
              </div>
            </div>
          </section>

          <section className={`${cardBase} p-5 xl:col-span-8`}>
            <div className="mb-5 flex items-center justify-between">
              <div className="rounded-2xl bg-black px-5 py-2 text-sm font-bold text-white">Profile Snapshot</div>
              <div className="rounded-full border border-[#bac7bf] bg-[#e8eeea] p-2 text-slate-600">
                <CalendarCheck size={18} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-[#dbc98e] bg-[#f0e3bd] p-4">
                <div className="mb-3 inline-flex rounded-xl border border-[#8f8f8f] bg-[#ede6cd] px-3 py-1 text-xs font-semibold text-slate-700">
                  Resumes
                </div>
                <p className="text-xl font-black text-slate-800">{profile.totalResumes}</p>
                <p className="text-sm font-semibold text-slate-600">Uploaded Files</p>
                <div className="mt-3 h-1.5 rounded-full bg-[#c7b06f]" />
              </div>

              <div className="rounded-3xl border border-[#b8cde3] bg-[#cfe1f0] p-4">
                <div className="mb-3 inline-flex rounded-xl border border-[#8f8f8f] bg-[#dceaf4] px-3 py-1 text-xs font-semibold text-slate-700">
                  Best Score
                </div>
                <p className="text-xl font-black text-slate-800">{profile.bestScore ?? '-'}</p>
                <p className="text-sm font-semibold text-slate-600">Top ATS Match</p>
                <div className="mt-3 h-1.5 rounded-full bg-[#4d99d8]" />
              </div>

              <div className="rounded-3xl border border-[#e0bfc2] bg-[#efd4d7] p-4">
                <div className="mb-3 inline-flex rounded-xl border border-[#8f8f8f] bg-[#f1e2e4] px-3 py-1 text-xs font-semibold text-slate-700">
                  Average
                </div>
                <p className="text-xl font-black text-slate-800">
                  {profile.averageScore !== null ? profile.averageScore.toFixed(1) : '-'}
                </p>
                <p className="text-sm font-semibold text-slate-600">Overall Performance</p>
                <div className="mt-3 h-1.5 rounded-full bg-[#df6d72]" />
              </div>
            </div>
          </section>

          <section className={`${cardBase} p-5 xl:col-span-5`}>
            <h3 className="mb-4 text-3xl font-black text-slate-900">Detailed Information</h3>

            <div className="space-y-3">
              <div className="rounded-2xl border border-[#cad4ce] bg-[#e8eeea] p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-[#bac7bf] bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500"
                    placeholder="Enter your name"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-800">{profile.name || 'Not set'}</p>
                )}
              </div>

              <div className="rounded-2xl border border-[#cad4ce] bg-[#e8eeea] p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Email Address</p>
                <p className="text-sm font-semibold text-slate-800">{profile.email}</p>
              </div>

              <div className="rounded-2xl border border-[#cad4ce] bg-[#e8eeea] p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Contact Number</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-[#bac7bf] bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500"
                    placeholder="+91 98765 43210"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-800">{profile.phone || 'Not set'}</p>
                )}
              </div>

              <div className="rounded-2xl border border-[#cad4ce] bg-[#e8eeea] p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Location</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-xl border border-[#bac7bf] bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500"
                    placeholder="City, Country"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-800">{profile.location || 'Not set'}</p>
                )}
              </div>

              <div className="rounded-2xl border border-[#cad4ce] bg-[#e8eeea] p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Bio</p>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="min-h-[90px] w-full rounded-xl border border-[#bac7bf] bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500"
                    placeholder="Tell recruiters about your profile"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-800">{profile.bio || 'Not set'}</p>
                )}
              </div>
            </div>
          </section>

          <section className={`${cardBase} p-5 xl:col-span-3`}>
            <h3 className="mb-4 text-3xl font-black text-slate-900">Activity</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#dde6df] p-3 text-center">
                <FileText className="mx-auto mb-2 text-slate-700" size={18} />
                <p className="text-xs font-semibold text-slate-500">Total</p>
                <p className="text-lg font-black text-slate-900">{profile.totalResumes}</p>
              </div>
              <div className="rounded-2xl bg-[#dde6df] p-3 text-center">
                <Award className="mx-auto mb-2 text-slate-700" size={18} />
                <p className="text-xs font-semibold text-slate-500">Best</p>
                <p className="text-lg font-black text-slate-900">{profile.bestScore ?? '-'}</p>
              </div>
              <div className="rounded-2xl bg-[#dde6df] p-3 text-center">
                <TrendingUp className="mx-auto mb-2 text-slate-700" size={18} />
                <p className="text-xs font-semibold text-slate-500">Average</p>
                <p className="text-lg font-black text-slate-900">
                  {profile.averageScore !== null ? profile.averageScore.toFixed(1) : '-'}
                </p>
              </div>
              <div className="rounded-2xl bg-[#dde6df] p-3 text-center">
                <Clock className="mx-auto mb-2 text-slate-700" size={18} />
                <p className="text-xs font-semibold text-slate-500">Last Upload</p>
                <p className="text-sm font-black text-slate-900">
                  {profile.lastUploadedAt ? new Date(profile.lastUploadedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </section>

          <section className={`${cardBase} p-5 xl:col-span-4`}>
            <h3 className="mb-4 text-3xl font-black text-slate-900">Links</h3>
            <div className="space-y-3">
              <div className="rounded-2xl border border-[#cad4ce] bg-[#e8eeea] p-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Linkedin size={14} /> LinkedIn
                </div>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    className="w-full rounded-xl border border-[#bac7bf] bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500"
                    placeholder="https://linkedin.com/in/username"
                  />
                ) : (
                  <p className="break-all text-sm font-semibold text-slate-800">{profile.linkedinUrl || 'Not set'}</p>
                )}
              </div>

              <div className="rounded-2xl border border-[#cad4ce] bg-[#e8eeea] p-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Github size={14} /> GitHub
                </div>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    className="w-full rounded-xl border border-[#bac7bf] bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500"
                    placeholder="https://github.com/username"
                  />
                ) : (
                  <p className="break-all text-sm font-semibold text-slate-800">{profile.githubUrl || 'Not set'}</p>
                )}
              </div>

              <div className="rounded-2xl border border-[#cad4ce] bg-[#e8eeea] p-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Globe size={14} /> Website
                </div>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="w-full rounded-xl border border-[#bac7bf] bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500"
                    placeholder="https://yourwebsite.com"
                  />
                ) : (
                  <p className="break-all text-sm font-semibold text-slate-800">{profile.websiteUrl || 'Not set'}</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
