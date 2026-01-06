/**
 * Authentication hook to get current user data
 */
import { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  fname?: string;
  lname?: string;
  role: string;
  resident_id?: string; // For residents
  guard_id?: string;    // For guards
  admin_id?: string;    // For admins
  village_id?: string;
  village_name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Try Demo authentication first (for demo mode)
        let response = await fetch('/api/auth/demo/me', {
          credentials: 'include',
        });

        // If demo auth fails, try LIFF authentication (for guards and residents)
        if (!response.ok) {
          response = await fetch('/api/auth/liff/me', {
            credentials: 'include',
          });
        }

        // If LIFF auth fails, try admin authentication
        if (!response.ok) {
          response = await fetch('/api/auth/me', {
            credentials: 'include',
          });
        }

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
}
