/**
 * LINE LIFF hook for authentication and user profile
 */
import { useState, useEffect } from 'react';

declare global {
  interface Window {
    liff: any;
  }
}

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export function useLiff() {
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        // Check if LIFF SDK is loaded
        if (typeof window !== 'undefined' && window.liff) {
          // Initialize LIFF
          await window.liff.init({
            liffId: process.env.NEXT_PUBLIC_LIFF_ID || ''
          });

          // Check if user is logged in
          if (window.liff.isLoggedIn()) {
            // Get user profile
            const userProfile = await window.liff.getProfile();
            setProfile(userProfile);
          } else {
            // Redirect to LINE login
            window.liff.login();
          }
        } else {
          // Load LIFF SDK
          const script = document.createElement('script');
          script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
          script.onload = () => {
            // Retry initialization after SDK loads
            initLiff();
          };
          document.head.appendChild(script);
          return;
        }
      } catch (err) {
        console.error('LIFF initialization failed:', err);
        setError('ไม่สามารถเชื่อมต่อ LINE ได้');
      } finally {
        setLoading(false);
      }
    };

    initLiff();
  }, []);

  const logout = () => {
    if (window.liff) {
      window.liff.logout();
      setProfile(null);
    }
  };

  return { profile, loading, error, logout };
}