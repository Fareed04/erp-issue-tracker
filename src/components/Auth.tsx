import React, { useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LogIn, LogOut, User, Settings, X, Save } from 'lucide-react';
import { updateUserProfile } from '../services/api';

export const Auth: React.FC = () => {
  const [user, loading] = useAuthState(auth);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({ displayName: '', photoURL: '' });
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await updateUserProfile({
          uid: result.user.uid,
          displayName: result.user.displayName || 'Anonymous',
          email: result.user.email || '',
          photoURL: result.user.photoURL,
        });
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

  const openProfileModal = () => {
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
      });
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
        });
        setIsProfileModalOpen(false);
        // Note: In a real app, you'd also update the auth profile or use a Firestore listener for the user doc
        window.location.reload(); // Simple way to refresh the UI with new profile data
      } catch (err) {
        console.error('Failed to update profile', err);
      }
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) return <div className="animate-pulse bg-slate-200 h-10 w-24 rounded-lg"></div>;

  if (user) {
    return (
      <>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-bold text-slate-900">{user.displayName}</span>
            <span className="text-xs text-slate-500">{user.email}</span>
          </div>
          <div className="relative group">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || ''} 
                className="w-10 h-10 rounded-full border-2 border-tawny-port cursor-pointer"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold border-2 border-tawny-port cursor-pointer">
                {user.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity invisible group-hover:visible z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <p className="font-bold text-slate-900 truncate">{user.displayName}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={openProfileModal}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings size={16} />
                Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {isProfileModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-bold text-slate-800">Edit Profile</h2>
                <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={profileData.displayName}
                    onChange={e => setProfileData({ ...profileData, displayName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Avatar URL</label>
                  <input
                    type="url"
                    value={profileData.photoURL}
                    onChange={e => setProfileData({ ...profileData, photoURL: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all"
                    placeholder="https://example.com/avatar.png"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2 bg-tawny-port hover:bg-tawny-port/90 text-white rounded-lg transition-colors font-medium shadow-sm"
                  >
                    <Save size={18} />
                    Save Changes
                  </button>
                </div>
              </form>
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
        <p className="text-xs text-red-600 font-medium animate-pulse">{loginError}</p>
      )}
    </div>
  );
};
