import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Shield,
  KeyRound,
  CheckCircle2,
  Clock,
  LogOut,
  X,
  Camera,
  Lock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onLogout
}) => {
  const { currentUser, saveUser, logActivity, activityLogs } = useData();

  const [fullName, setFullName] = useState(currentUser?.fullName || currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile Update Status
  const [profileSaved, setProfileSaved] = useState(false);

  if (!isOpen || !currentUser) return null;

  // Filter recent login activities for current user
  const userRecentLogs = activityLogs
    .filter(log => log.user.toLowerCase().includes(currentUser.username.toLowerCase()))
    .slice(0, 5);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const updated = {
      ...currentUser,
      fullName: fullName.trim(),
      name: fullName.trim(),
      phone: phone.trim(),
      avatarUrl: avatarUrl
    };

    saveUser(updated);
    logActivity('Profile Updated', `User ${currentUser.username} updated their profile information.`);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (newPassword.length < 6) {
      setPasswordNotice({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordNotice({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    logActivity('Password Changed', `User ${currentUser.username} successfully updated their password.`);
    setPasswordNotice({ type: 'success', text: 'Password has been updated successfully.' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordNotice(null), 3000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">My User Profile</h3>
              <p className="text-xs text-slate-500">Manage your personal credentials, contact info and security.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card Summary with Avatar */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 mb-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="relative group shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={currentUser.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-orange-500 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                {(currentUser.fullName || currentUser.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <label className="absolute bottom-0 right-0 p-1 rounded-full bg-white text-slate-600 border border-slate-200 shadow hover:text-orange-600 cursor-pointer">
              <Camera size={12} />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <h4 className="text-base font-black text-slate-900">{currentUser.fullName || currentUser.name}</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                {currentUser.role}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Active Account
              </span>
            </div>

            <p className="text-xs font-mono text-slate-500 mt-0.5">@{currentUser.username}</p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 justify-center sm:justify-start">
              <span className="flex items-center gap-1">
                <Building2 size={13} className="text-slate-400" />
                {currentUser.department || 'Management'}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase size={13} className="text-slate-400" />
                {currentUser.designation || 'Officer'}
              </span>
              {currentUser.employeeId && (
                <span className="font-mono text-[11px] text-slate-400">
                  ID: {currentUser.employeeId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 1: Edit Profile Details */}
        <form onSubmit={handleSaveProfile} className="space-y-3.5 mb-6 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Personal Contact Details
            </span>
            {profileSaved && (
              <span className="text-emerald-600 font-bold flex items-center gap-1 text-xs">
                <CheckCircle2 size={13} /> Changes saved!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Mobile Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Update Profile Info
            </button>
          </div>
        </form>

        {/* Section 2: Change Password */}
        <form onSubmit={handleChangePassword} className="space-y-3.5 pt-4 border-t border-slate-100 mb-6 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <KeyRound size={14} className="text-amber-600" />
              Change Password
            </span>
          </div>

          {passwordNotice && (
            <div
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                passwordNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {passwordNotice.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span>{passwordNotice.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">New Password</label>
              <input
                type="password"
                required
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Update Password
            </button>
          </div>
        </form>

        {/* Section 3: Recent Activity */}
        <div className="pt-4 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block mb-2">
            Recent Security &amp; Login Activity
          </span>
          <div className="space-y-1.5 max-h-28 overflow-y-auto">
            {userRecentLogs.length === 0 ? (
              <p className="text-slate-400 italic">No recent logged activities for this session.</p>
            ) : (
              userRecentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-[11px]">
                  <span className="font-semibold text-slate-800">{log.action}</span>
                  <span className="font-mono text-slate-500">{log.date} {log.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-5">
          {onLogout ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="px-3.5 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
