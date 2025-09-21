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
  village_key?: string;
  village_name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

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
