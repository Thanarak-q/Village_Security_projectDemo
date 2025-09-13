import { useState, useEffect, useCallback } from 'react';
import { LiffService } from '@/lib/liff';

interface LineProfile {
  userId: string;
  displayName?: string;
  pictureUrl?: string;
}

interface UseLiffReturn {
  isInitialized: boolean;
  isLoggedIn: boolean;
  profile: LineProfile | null;
  idToken: string | null;
  isInLine: boolean;
  loading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

export const useLiff = (): UseLiffReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggedInState, setIsLoggedInState] = useState(false);
  const [profile, setProfile] = useState<LineProfile | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isInLine, setIsInLine] = useState(false);
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

  const login = () => {
    if (isInitialized) {
      svc.login();
    }
  };

  const logout = () => {
    if (isInitialized) {
      setProfile(null);
      setIdToken(null);
      setIsLoggedInState(false);
      svc.logout();
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
