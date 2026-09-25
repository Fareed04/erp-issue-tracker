import React, { useState, useEffect } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  LogIn, 
  LogOut, 
  User, 
  Settings, 
  X, 
  Save, 
  Bell, 
  HelpCircle, 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { updateUserProfile, getUserProfile, sendTestEmail } from '../services/api';
import { NotificationPreferences } from '../types';

export const Auth: React.FC = () => {
  const [user, loading] = useAuthState(auth);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({ 
    displayName: '', 
    photoURL: '', 
    notificationEmail: '' 
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notifyOnAssign: true,
    notifyOnStatusChange: true,
    notifyOnComment: true,
    notifyOnDeadline: true,
    emailNotificationsEnabled: true,
    emailOnAssign: true,
    emailOnStatusChange: true,
    emailOnComment: true,
    emailOnDeadline: true,
  });
  const [testEmailStatus, setTestEmailStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    previewUrl?: string | null;
  } | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // One Tap removed to prevent GSI_LOGGER FedCM errors in iframe
  }, [user, loading]);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        // Check if profile exists to not overwrite preferences
        const existingProfile = await getUserProfile(result.user.uid);
        if (!existingProfile) {
          await updateUserProfile({
            uid: result.user.uid,
            displayName: result.user.displayName || 'Anonymous',
            email: result.user.email || '',
            notificationEmail: result.user.email || '',
            photoURL: result.user.photoURL,
            role: result.user.email === 'ologundudufareed@gmail.com' ? 'Admin' : 'Developer',
            tutorialCompleted: false,
            tutorialStep: 0,
            preferences: {
              notifyOnAssign: true,
              notifyOnStatusChange: true,
              notifyOnComment: true,
              notifyOnDeadline: true,
              emailNotificationsEnabled: true,
              emailOnAssign: true,
              emailOnStatusChange: true,
              emailOnComment: true,
              emailOnDeadline: true,
            }
          });
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      setLoginError('Login failed. Please try again.');
      console.error('Login failed', err);
      setTimeout(() => setLoginError(null), 5000);
    }
  };

  const openProfileModal = async () => {
    setIsDropdownOpen(false);
    setTestEmailStatus(null);
    setSaveSuccess(false);
    if (user) {
      const profile = await getUserProfile(user.uid);
      setProfileData({
        displayName: profile?.displayName || user.displayName || '',
        photoURL: profile?.photoURL || user.photoURL || '',
        notificationEmail: profile?.notificationEmail !== undefined ? (profile.notificationEmail || '') : (user.email || ''),
      });
      
      if (profile?.preferences) {
        setPreferences({
          notifyOnAssign: profile.preferences.notifyOnAssign ?? true,
          notifyOnStatusChange: profile.preferences.notifyOnStatusChange ?? true,
          notifyOnComment: profile.preferences.notifyOnComment ?? true,
          notifyOnDeadline: profile.preferences.notifyOnDeadline ?? true,
          emailNotificationsEnabled: profile.preferences.emailNotificationsEnabled ?? true,
          emailOnAssign: profile.preferences.emailOnAssign ?? true,
          emailOnStatusChange: profile.preferences.emailOnStatusChange ?? true,
          emailOnComment: profile.preferences.emailOnComment ?? true,
          emailOnDeadline: profile.preferences.emailOnDeadline ?? true,
        });
      }
      
      setIsProfileModalOpen(true);
    }
  };

  const handleSendTestEmail = async () => {
    const targetEmail = profileData.notificationEmail.trim() || user?.email;
    if (!targetEmail) return;

    setTestEmailStatus({ loading: true });
    try {
      const result = await sendTestEmail(targetEmail, profileData.displayName || user?.displayName || undefined);
      if (result.success) {
        setTestEmailStatus({
          loading: false,
          success: true,
          message: `Test email dispatched to ${targetEmail}!`,
          previewUrl: result.previewUrl,
        });
      } else {
        setTestEmailStatus({
          loading: false,
          success: false,
          message: result.error || 'Failed to dispatch email.',
        });
      }
    } catch (err: any) {
      setTestEmailStatus({
        loading: false,
        success: false,
        message: err.message || 'Error sending test email',
      });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      try {
        const trimmedNotifEmail = profileData.notificationEmail.trim();
        await updateUserProfile({
          uid: user.uid,
          displayName: profileData.displayName,
          email: user.email || '',
          notificationEmail: trimmedNotifEmail ? trimmedNotifEmail : null,
          photoURL: profileData.photoURL,
          preferences,
        });
        setSaveSuccess(true);
        setTimeout(() => {
          setIsProfileModalOpen(false);
          window.location.reload(); 
        }, 600);
      } catch (err) {
        console.error('Failed to update profile', err);
      }
    }
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    signOut(auth);
  };

  if (loading) return <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-10 w-24 rounded-lg"></div>;

  if (user) {
    return (
      <>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-bold text-slate-900 dark:text-white">{user.displayName}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
          </div>
          <div className="relative shrink-0">
            {isDropdownOpen && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsDropdownOpen(false)}
              ></div>
            )}
            <div 
              className="cursor-pointer group flex items-center justify-center shrink-0"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || ''} 
                  className="w-10 h-10 rounded-full border-2 border-tawny-port object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold border-2 border-tawny-port">
                  {user.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            
            <div className={`absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden transition-all duration-200 origin-top-right ${isDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
              <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white truncate">{user.displayName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={openProfileModal}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <Settings size={16} />
                Profile & Email Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-slate-100 dark:border-slate-700"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {isProfileModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
                <div className="flex items-center gap-2">
                  <Settings size={20} className="text-tawny-port" />
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Settings & Preferences</h2>
                </div>
                <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto p-6 space-y-6">
                <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-6">
                  
                  {/* Basic Profile */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <User size={16} className="text-slate-500" /> User Profile
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                      <input
                        type="text"
                        required
                        value={profileData.displayName}
                        onChange={e => setProfileData({ ...profileData, displayName: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Google Account Email</label>
                      <input
                        type="text"
                        disabled
                        value={user.email || ''}
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed"
                      />
                      <span className="text-xs text-slate-400 mt-1 block">Used for authentication sign-in.</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Avatar URL</label>
                      <input
                        type="url"
                        value={profileData.photoURL}
                        onChange={e => setProfileData({ ...profileData, photoURL: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm"
                        placeholder="https://example.com/avatar.png"
                      />
                    </div>
                  </div>

                  {/* Notification Email Configuration */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Mail size={16} className="text-tawny-port" /> Notification Email Destination
                      </h3>
                      {user.email && profileData.notificationEmail !== user.email && (
                        <button
                          type="button"
                          onClick={() => setProfileData({ ...profileData, notificationEmail: user.email || '' })}
                          className="text-xs text-tawny-port hover:underline font-medium"
                        >
                          Use Google Account Email
                        </button>
                      )}
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      Enter the email address where you want to receive task assignment and project notifications. If left blank, notifications will be sent to your account email.
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Notification Delivery Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={profileData.notificationEmail}
                          onChange={e => setProfileData({ ...profileData, notificationEmail: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm"
                          placeholder={user.email || 'your-notification-email@example.com'}
                        />
                        <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      </div>
                    </div>

                    {/* Test Email Trigger */}
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Verify that your email is working:
                        </span>
                        <button
                          type="button"
                          disabled={testEmailStatus?.loading}
                          onClick={handleSendTestEmail}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                          {testEmailStatus?.loading ? (
                            <>
                              <Loader2 size={13} className="animate-spin text-tawny-port" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send size={13} />
                              Send Test Email
                            </>
                          )}
                        </button>
                      </div>

                      {testEmailStatus && !testEmailStatus.loading && (
                        <div className={`p-3 rounded-lg text-xs flex flex-col gap-1 border ${
                          testEmailStatus.success 
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                        }`}>
                          <div className="flex items-center gap-1.5 font-medium">
                            {testEmailStatus.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                            {testEmailStatus.message}
                          </div>
                          {testEmailStatus.previewUrl && (
                            <a 
                              href={testEmailStatus.previewUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 hover:underline mt-1"
                            >
                              <ExternalLink size={12} />
                              Open Delivered Email Preview (Ethereal Sandbox)
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email Notifications Preferences */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Bell size={16} className="text-tawny-port" /> Email Notifications
                      </h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={preferences.emailNotificationsEnabled !== false}
                          onChange={e => setPreferences({...preferences, emailNotificationsEnabled: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-tawny-port"></div>
                      </label>
                    </div>

                    <div className={`space-y-3 transition-opacity duration-200 ${preferences.emailNotificationsEnabled === false ? 'opacity-40 pointer-events-none' : ''}`}>
                      <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={preferences.emailOnAssign !== false}
                          onChange={e => setPreferences({...preferences, emailOnAssign: e.target.checked})}
                          className="w-4 h-4 text-tawny-port rounded border-slate-300 focus:ring-tawny-port mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                            When a task is assigned to me
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Receive an instant email containing task title, priority, due date, and details.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={preferences.emailOnStatusChange !== false}
                          onChange={e => setPreferences({...preferences, emailOnStatusChange: e.target.checked})}
                          className="w-4 h-4 text-tawny-port rounded border-slate-300 focus:ring-tawny-port mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block">
                            When task status changes
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Notify me if an issue I reported or am assigned to changes status (e.g. Blocked, In Progress, Done).
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={preferences.emailOnComment !== false}
                          onChange={e => setPreferences({...preferences, emailOnComment: e.target.checked})}
                          className="w-4 h-4 text-tawny-port rounded border-slate-300 focus:ring-tawny-port mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block">
                            When someone comments on my tasks
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Send the comment snippet and author info straight to my inbox.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={preferences.emailOnDeadline !== false}
                          onChange={e => setPreferences({...preferences, emailOnDeadline: e.target.checked})}
                          className="w-4 h-4 text-tawny-port rounded border-slate-300 focus:ring-tawny-port mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block">
                            Approaching deadline reminders (24h)
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Remind me when an assigned task deadline is due within 24 hours.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* In-App Notifications */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Bell size={16} className="text-slate-500" /> In-App Notification Bell
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={preferences.notifyOnAssign}
                          onChange={e => setPreferences({...preferences, notifyOnAssign: e.target.checked})}
                          className="w-4 h-4 text-tawny-port rounded border-slate-300 focus:ring-tawny-port"
                        />
                        <span>On Task Assignment</span>
                      </label>
                      
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={preferences.notifyOnStatusChange}
                          onChange={e => setPreferences({...preferences, notifyOnStatusChange: e.target.checked})}
                          className="w-4 h-4 text-tawny-port rounded border-slate-300 focus:ring-tawny-port"
                        />
                        <span>On Status Changes</span>
                      </label>
                      
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={preferences.notifyOnComment}
                          onChange={e => setPreferences({...preferences, notifyOnComment: e.target.checked})}
                          className="w-4 h-4 text-tawny-port rounded border-slate-300 focus:ring-tawny-port"
                        />
                        <span>On Comments</span>
                      </label>
                      
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={preferences.notifyOnDeadline}
                          onChange={e => setPreferences({...preferences, notifyOnDeadline: e.target.checked})}
                          className="w-4 h-4 text-tawny-port rounded border-slate-300 focus:ring-tawny-port"
                        />
                        <span>On Approaching Deadlines</span>
                      </label>
                    </div>
                  </div>

                  {/* Walkthrough */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                       Walkthrough
                    </h3>
                    <button
                      type="button"
                      onClick={async () => {
                        if (user) {
                          const trimmedNotifEmail = profileData.notificationEmail.trim();
                          await updateUserProfile({
                            uid: user.uid,
                            displayName: profileData.displayName || user.displayName || 'Anonymous',
                            email: user.email || '',
                            notificationEmail: trimmedNotifEmail ? trimmedNotifEmail : null,
                            photoURL: profileData.photoURL || user.photoURL,
                            tutorialCompleted: false,
                            tutorialStep: 0,
                            preferences: preferences,
                          });
                          window.location.reload();
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      <HelpCircle size={16} />
                      Restart Tutorial
                    </button>
                  </div>
                </form>
              </div>

              {saveSuccess && (
                <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 border-t border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 size={14} /> Preferences and email configuration saved successfully!
                </div>
              )}

              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="profile-form"
                  className="flex items-center gap-2 px-6 py-2 bg-tawny-port hover:bg-tawny-port/90 text-white rounded-lg transition-colors font-medium shadow-sm text-sm"
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleLogin}
        className="flex items-center gap-2 bg-tawny-port hover:bg-tawny-port/90 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
      >
        <LogIn size={18} />
        Sign In
      </button>
      {loginError && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium animate-pulse">{loginError}</p>
      )}
    </div>
  );
};
