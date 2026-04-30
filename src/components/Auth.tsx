import React, { useState, useEffect } from 'react';
import { signInWithPopup, signOut, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LogIn, LogOut, User, Settings, X, Save, Bell, HelpCircle } from 'lucide-react';
import { updateUserProfile, getUserProfile } from '../services/api';
import { NotificationPreferences } from '../types';

const GOOGLE_CLIENT_ID = "1085029246456-vr523qhq1kb3paofppt0vsbsu0etdcq4.apps.googleusercontent.com";

export const Auth: React.FC = () => {
  const [user, loading] = useAuthState(auth);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({ displayName: '', photoURL: '' });
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notifyOnAssign: true,
    notifyOnStatusChange: true,
    notifyOnComment: true,
    notifyOnDeadline: true,
  });
  const [loginError, setLoginError] = useState<string | null>(null);

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
            photoURL: result.user.photoURL,
            tutorialCompleted: false,
            tutorialStep: 0,
            preferences: {
              notifyOnAssign: true,
              notifyOnStatusChange: true,
              notifyOnComment: true,
              notifyOnDeadline: true,
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
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
      });
      
      const profile = await getUserProfile(user.uid);
      if (profile?.preferences) {
        setPreferences(profile.preferences);
      }
      
      setIsProfileModalOpen(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      try {
        await updateUserProfile({
          uid: user.uid,
          displayName: profileData.displayName,
          email: user.email || '',
          photoURL: profileData.photoURL,
          preferences,
        });
        setIsProfileModalOpen(false);
        window.location.reload(); 
      } catch (err) {
        console.error('Failed to update profile', err);
      }
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) return <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-10 w-24 rounded-lg"></div>;

  if (user) {
    return (
      <>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-bold text-slate-900 dark:text-white">{user.displayName}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
          </div>
          <div className="relative group shrink-0">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || ''} 
                className="w-10 h-10 rounded-full border-2 border-tawny-port cursor-pointer shrink-0 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold border-2 border-tawny-port cursor-pointer shrink-0">
                {user.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity invisible group-hover:visible z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white truncate">{user.displayName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={openProfileModal}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <Settings size={16} />
                Settings
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
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Settings</h2>
                <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto p-6">
                <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <User size={16} /> Profile
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                      <input
                        type="text"
                        required
                        value={profileData.displayName}
                        onChange={e => setProfileData({ ...profileData, displayName: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Avatar URL</label>
                      <input
                        type="url"
                        value={profileData.photoURL}
                        onChange={e => setProfileData({ ...profileData, photoURL: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                        placeholder="https://example.com/avatar.png"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Bell size={16} /> Notifications
                    </h3>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.notifyOnAssign}
                        onChange={e => setPreferences({...preferences, notifyOnAssign: e.target.checked})}
                        className="w-4 h-4 text-tawny-port rounded border-slate-300 focus:ring-tawny-port"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">When I am assigned an issue</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.notifyOnStatusChange}
                        onChange={e => setPreferences({...preferences, notifyOnStatusChange: e.target.checked})}
                        className="w-4 h-4 text-tawny-port rounded border-slate-300 focus:ring-tawny-port"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">When status changes on my issues</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.notifyOnComment}
                        onChange={e => setPreferences({...preferences, notifyOnComment: e.target.checked})}
                        className="w-4 h-4 text-tawny-port rounded border-slate-300 focus:ring-tawny-port"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">When someone comments on my issues</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.notifyOnDeadline}
                        onChange={e => setPreferences({...preferences, notifyOnDeadline: e.target.checked})}
                        className="w-4 h-4 text-tawny-port rounded border-slate-300 focus:ring-tawny-port"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">When a deadline is approaching (24h)</span>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                       Walkthrough
                    </h3>
                    <button
                      type="button"
                      onClick={async () => {
                        if (user) {
                          await updateUserProfile({
                            uid: user.uid,
                            displayName: profileData.displayName || user.displayName || 'Anonymous',
                            email: user.email || '',
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
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="profile-form"
                  className="flex items-center gap-2 px-6 py-2 bg-tawny-port hover:bg-tawny-port/90 text-white rounded-lg transition-colors font-medium shadow-sm"
                >
                  <Save size={18} />
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
