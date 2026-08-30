import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import * as api from '../services/api';
import { Avatar } from './Avatar';

interface UsersManagementProps {
  currentUserProfile: UserProfile;
}

export const UsersManagement: React.FC<UsersManagementProps> = ({ currentUserProfile }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const allUsers = await api.getAllUserProfiles();
      setUsers(allUsers);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    const userToUpdate = users.find(u => u.uid === uid);
    if (!userToUpdate) return;
    
    // Optimistic update
    setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    
    try {
      await api.updateUserProfile({ ...userToUpdate, role: newRole });
    } catch (err) {
      console.error('Failed to update user role', err);
      // Revert optimistic update
      fetchUsers();
    }
  };

  if (currentUserProfile.role !== 'Admin') {
    return (
      <div className="flex-1 p-4 lg:p-8 pt-6 flex flex-col items-center justify-center text-slate-500">
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p>You need Admin privileges to view this page.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-8 pt-6 flex flex-col h-[calc(100vh-73px)]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage user roles and permissions</p>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 justify-center flex">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tawny-port"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {users.map(u => (
                  <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.photoURL || null} name={u.displayName} size="sm" className="w-8 h-8 text-xs" />
                        <span className="font-medium text-slate-900 dark:text-slate-100">{u.displayName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role || 'Developer'}
                        onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                        disabled={u.uid === currentUserProfile.uid}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Developer">Developer</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
