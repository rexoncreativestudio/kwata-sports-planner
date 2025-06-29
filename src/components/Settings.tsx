// src/components/Settings.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import styles from './Settings.module.css';

export default function Settings() {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPassword, setLoadingPassword] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [user, setUser] = useState<any>(null);

  // State for the new password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else if (profile) {
          setFullName(profile.full_name || '');
        }
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoadingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date() })
      .eq('id', user.id);

    if (error) {
      alert('Error updating the profile: ' + error.message);
    } else {
      alert('Profile updated successfully!');
    }
    setLoadingProfile(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    setLoadingPassword(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      alert('Error updating password: ' + error.message);
    } else {
      alert('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoadingPassword(false);
  };

  return (
    <div className={styles.settingsContainer}>
      {/* Profile Update Card */}
      <div className={styles.formCard}>
        <h3 className={styles.cardTitle}>User Profile</h3>
        <p className={styles.cardSubtitle}>Manage your personal information.</p>
        <form onSubmit={handleUpdateProfile}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input id="email" type="text" value={user?.email || ''} disabled />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loadingProfile}
            />
          </div>
          <div className={styles.formFooter}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loadingProfile}
            >
              {loadingProfile ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Update Card */}
      <div className={styles.formCard}>
        <h3 className={styles.cardTitle}>Change Password</h3>
        <p className={styles.cardSubtitle}>Choose a new password.</p>
        <form onSubmit={handleUpdatePassword}>
          <div className={styles.formGroup}>
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loadingPassword}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loadingPassword}
            />
          </div>
          <div className={styles.formFooter}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loadingPassword}
            >
              {loadingPassword ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
