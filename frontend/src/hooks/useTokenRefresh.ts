import { useEffect, useRef } from 'react';
import { LiffService } from '@/lib/liff';

/**
 * Hook to automatically refresh LIFF tokens
 * Checks token validity every 4 minutes and refreshes if needed
 */
export const useTokenRefresh = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const svc = LiffService.getInstance();

  useEffect(() => {
    // Start periodic token refresh
    const startTokenRefresh = () => {
      // Clear existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Check token every 4 minutes (240 seconds)
      intervalRef.current = setInterval(async () => {
        try {
          console.log('🔄 Periodic token refresh check...');
          const validToken = await svc.ensureValidToken();
          if (!validToken) {
            console.warn('⚠️ Token refresh failed, user may need to re-authenticate');
          } else {
            console.log('✅ Token is valid');
          }
        } catch (error) {
          console.error('Error during periodic token refresh:', error);
        }
      }, 4 * 60 * 1000); // 4 minutes
    };

    // Start the refresh cycle
    startTokenRefresh();

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [svc]);

  // Return a function to manually trigger token refresh
  const refreshToken = async () => {
    try {
      return await svc.ensureValidToken();
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      return null;
    }
  };

  return { refreshToken };
};
