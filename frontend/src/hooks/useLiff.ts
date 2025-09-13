import { useState, useEffect, useCallback } from 'react';
import { LiffService } from '@/lib/liff';

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export function useLiff() {
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const svc = LiffService.getInstance();

  const initializeLiff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await svc.init();
      setIsInitialized(true);
      setIsInLine(svc.isInClient());
      setIsLoggedInState(svc.isLoggedIn());

      if (svc.isLoggedIn()) {
        const lineProfile = await svc.getProfile();
        const token = svc.getIDToken();
        
        if (lineProfile.userId !== "unknown") {
          setProfile(lineProfile);
        }
        setIdToken(token);
      }
    } catch (err) {
      console.error('LIFF initialization error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [svc]);

    initLiff();
  }, []);

  const logout = () => {
    if (window.liff) {
      window.liff.logout();
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (isInitialized && svc.isLoggedIn()) {
      try {
        const lineProfile = await svc.getProfile();
        const token = svc.getIDToken();
        
        if (lineProfile.userId !== "unknown") {
          setProfile(lineProfile);
        }
        setIdToken(token);
      } catch (err) {
        console.error('Failed to refresh profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to refresh profile');
      }
    }
  };

  useEffect(() => {
    initializeLiff();
  }, [initializeLiff]);

  return {
    isInitialized,
    isLoggedIn: isLoggedInState,
    profile,
    idToken,
    isInLine,
    loading,
    error,
    login,
    logout,
    refreshProfile,
  };
};
