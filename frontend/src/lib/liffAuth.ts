
// LIFF Authentication Service
export interface LiffUser {
  id: string;
  guard_id?: string; // For guards
  resident_id?: string; // For residents
  lineUserId: string;
  email: string;
  fname: string;
  lname: string;
  phone: string;
  village_id: string;
  village_name?: string;
  status: 'verified' | 'pending' | 'disable';
  line_profile_url?: string;
  role: 'resident' | 'guard';
  selected_house_id?: string | null;
  selected_house_address?: string | null;
}

export interface LiffAuthResponse {
  success: boolean;
  user?: LiffUser;
  token?: string;
  error?: string;
  lineUserId?: string;
  expectedRole?: 'resident' | 'guard';
  availableRoles?: string[]; // Roles user can access
  existingRoles?: string[]; // Roles user already has
  canRegisterAs?: string[]; // Roles user can still register for
  message?: string; // Custom success/error message
  needsRedirect?: boolean; // Indicates if redirect is needed
  redirectTo?: string; // Where to redirect
  tokenExpired?: boolean; // Indicates if the token expired
}

// Use relative paths for API calls so Caddy can route them properly
const API_BASE_URL = '';
const RESIDENT_SELECTION_STORAGE_KEY = 'residentRoleSelection';
const GUARD_SELECTION_STORAGE_KEY = 'guardRoleSelection';

// Import LiffService for role switching
import { LiffService } from './liff';

// Verify LINE ID token with backend
export const verifyLiffToken = async (
  idToken: string,
  role?: 'resident' | 'guard',
  context?: {
    residentId?: string;
    guardId?: string;
    villageId?: string;
    houseId?: string | null;
  }
): Promise<LiffAuthResponse> => {
  try {
    const apiUrl = `${API_BASE_URL}/api/liff/verify`;
    
    const payload: Record<string, unknown> = { idToken };
    if (role) {
      payload.role = role;
    }
    if (context) {
      if (context.residentId) payload.residentId = context.residentId;
      if (context.guardId) payload.guardId = context.guardId;
      if (context.villageId) payload.villageId = context.villageId;
      if (context.houseId !== undefined) payload.houseId = context.houseId;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // This is crucial for cookies to be sent and received
      body: JSON.stringify(payload),
    });


    // Check if response is ok
    if (!response.ok) {
      console.error('HTTP Error:', response.status, response.statusText);
      
      // Try to get error details
      let errorMessage = `Server error: ${response.status}`;
      let lineUserId = undefined;
      
      try {
        const errorText = await response.text();
        if (errorText) {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
          lineUserId = errorData.lineUserId; // Extract lineUserId from error response
        }
      } catch (e) {
        console.warn('Could not parse error response:', e);
      }
      
      // Handle specific error cases
      if (response.status === 401) {
        return {
          success: false,
          error: 'LINE token expired. Please refresh the page and try again.',
          tokenExpired: true,
        };
      }
      
      // For 404 (user not found), return the lineUserId so frontend can redirect to register
      if (response.status === 404 && lineUserId) {
        return {
          success: false,
          error: errorMessage,
          lineUserId: lineUserId,
        };
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Check if response has content
    const text = await response.text();
    
    if (!text) {
      console.error('Empty response from server');
      return {
        success: false,
        error: 'Empty response from server',
      };
    }

    // Try to parse JSON
    try {
      const data = JSON.parse(text);
      
      // Ensure the response has the expected structure
      if (data.success === undefined) {
        // If no success field, it's an error response
        return {
          success: false,
          error: data.error || 'Unknown error',
          lineUserId: data.lineUserId
        };
      }
      
      return data;
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      console.error('Response text:', text);
      return {
        success: false,
        error: 'Server returned invalid response format',
      };
    }
  } catch (error) {
    console.error('LIFF verification error:', error);
    return {
      success: false,
      error: `Failed to verify LINE token: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

// Switch user role by re-authenticating with specific role
export const switchUserRole = async (
  targetRole: 'resident' | 'guard',
  options: {
    residentId?: string;
    guardId?: string;
    villageId?: string;
    houseId?: string | null;
    houseAddress?: string | null;
    villageName?: string | null;
  } = {}
): Promise<LiffAuthResponse> => {
  try {
    const svc = LiffService.getInstance();
    const selectionOptions: {
      residentId?: string;
      guardId?: string;
      villageId?: string;
      houseId?: string | null;
      houseAddress?: string | null;
      villageName?: string | null;
    } = { ...options };

    if (targetRole === 'resident' && typeof window !== 'undefined') {
      try {
        const storedSelectionRaw = localStorage.getItem(RESIDENT_SELECTION_STORAGE_KEY);
        if (storedSelectionRaw) {
          const storedSelection = JSON.parse(storedSelectionRaw);
          if (!selectionOptions.residentId && storedSelection.residentId) {
            selectionOptions.residentId = storedSelection.residentId;
          }
          if (!selectionOptions.villageId && storedSelection.villageId) {
            selectionOptions.villageId = storedSelection.villageId;
          }
          if (selectionOptions.houseId === undefined && storedSelection.houseId !== undefined) {
            selectionOptions.houseId = storedSelection.houseId;
          }
          if (!selectionOptions.houseAddress && storedSelection.houseAddress) {
            selectionOptions.houseAddress = storedSelection.houseAddress;
          }
          if (!selectionOptions.villageName && storedSelection.villageName) {
            selectionOptions.villageName = storedSelection.villageName;
          }
        }
      } catch (storageError) {
        console.warn('⚠️ Unable to read stored resident selection:', storageError);
      }
    }
    if (targetRole === 'guard' && typeof window !== 'undefined') {
      try {
        const storedSelectionRaw = localStorage.getItem(GUARD_SELECTION_STORAGE_KEY);
        if (storedSelectionRaw) {
          const storedSelection = JSON.parse(storedSelectionRaw);
          if (!selectionOptions.guardId && storedSelection.guardId) {
            selectionOptions.guardId = storedSelection.guardId;
          }
          if (!selectionOptions.villageId && storedSelection.villageId) {
            selectionOptions.villageId = storedSelection.villageId;
          }
          if (!selectionOptions.villageName && storedSelection.villageName) {
            selectionOptions.villageName = storedSelection.villageName;
          }
        }
      } catch (storageError) {
        console.warn('⚠️ Unable to read stored guard selection:', storageError);
      }
    }
    
    // Check if user has stored authentication data first
    const { user: storedUser, token: storedToken } = getAuthData();
    
    // If user has stored auth data but LIFF session is not active, 
    // redirect them to the appropriate page first
    if (storedUser && storedToken && !svc.isLoggedIn()) {
      console.log(`🔄 User has stored auth data but LIFF session inactive. Redirecting to ${targetRole} page first...`);
      
      // Return a special response that indicates redirect is needed
      return {
        success: false,
        error: `Please go to ${targetRole} page first, then you will be redirected to LIFF for authentication.`,
        needsRedirect: true,
        redirectTo: targetRole === 'resident' ? '/Resident' : '/guard'
      };
    }
    
    // Check if user is logged in to LIFF
    if (!svc.isLoggedIn()) {
      return {
        success: false,
        error: 'User not logged in. Please login first.',
      };
    }

    // Get fresh ID token
    const idToken = svc.getIDToken();
    if (!idToken) {
      return {
        success: false,
        error: 'No ID token available. Please refresh the page.',
      };
    }

    console.log(`🔄 Switching to ${targetRole} role...`);
    
    // Re-authenticate with the specific role
    const authResult = await verifyLiffToken(idToken, targetRole, selectionOptions);
    
    if (authResult.success && authResult.user && authResult.token) {
      // Store the new authentication data
      localStorage.setItem('liffUser', JSON.stringify(authResult.user));
      localStorage.setItem('liffToken', authResult.token);

      if (targetRole === 'resident') {
        if (typeof window !== 'undefined') {
          const selectionToPersist = {
            residentId: selectionOptions.residentId ?? authResult.user.resident_id ?? null,
            villageId: selectionOptions.villageId ?? authResult.user.village_id ?? null,
            houseId: selectionOptions.houseId ?? authResult.user.selected_house_id ?? null,
            houseAddress: selectionOptions.houseAddress ?? authResult.user.selected_house_address ?? null,
            villageName: selectionOptions.villageName ?? authResult.user.village_name ?? null,
          };
          try {
            localStorage.setItem(RESIDENT_SELECTION_STORAGE_KEY, JSON.stringify(selectionToPersist));
          } catch (storageError) {
            console.warn('⚠️ Unable to persist resident selection:', storageError);
          }
        }
      }
      if (targetRole === 'guard') {
        if (typeof window !== 'undefined') {
          const selectionToPersist = {
            guardId: selectionOptions.guardId ?? authResult.user.guard_id ?? null,
            villageId: selectionOptions.villageId ?? authResult.user.village_id ?? null,
            villageName: selectionOptions.villageName ?? authResult.user.village_name ?? null,
          };
          try {
            localStorage.setItem(GUARD_SELECTION_STORAGE_KEY, JSON.stringify(selectionToPersist));
          } catch (storageError) {
            console.warn('⚠️ Unable to persist guard selection:', storageError);
          }
        }
      }
      
      console.log(`✅ Successfully switched to ${targetRole} role:`, authResult.user);
      
      return {
        success: true,
        user: authResult.user,
        token: authResult.token,
        message: `Successfully switched to ${targetRole} role`,
      };
    } else {
      console.error(`❌ Failed to switch to ${targetRole} role:`, authResult.error);
      return authResult;
    }
  } catch (error) {
    console.error('Error switching user role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Register new user with LINE ID
export const registerLiffUser = async (
  idToken: string,
  userData: {
    email: string;
    fname: string;
    lname: string;
    phone: string;
    village_key: string;
    userType: 'resident' | 'guard';
    profile_image_url: string;
    role?: 'resident' | 'guard'; // Optional role parameter for LINE Login channels
  }
): Promise<LiffAuthResponse> => {
  try {
    const requestBody = {
      idToken,
      ...userData,
      // Pass role parameter if provided
      ...(userData.role && { role: userData.role }),
    };
    
    console.log('Registration request:', {
      url: '/api/liff/register',
      method: 'POST',
      body: requestBody
    });
    
    const response = await fetch('/api/liff/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('Registration response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Check if response is ok
    if (!response.ok) {
      console.error('HTTP Error:', response.status, response.statusText);
      
      // Try to get error message from response
      let errorMessage = `Server error: ${response.status}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        }
      } catch (e) {
        console.warn('Could not parse error response:', e);
      }
      
      // Handle specific error cases
      if (response.status === 401) {
        return {
          success: false,
          error: 'LINE token expired. Please refresh the page and try again.',
          tokenExpired: true,
        };
      }
      
      if (response.status === 409) {
        return {
          success: false,
          error: 'Email or username already exists. Please use different information.',
        };
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Check if response has content
    const text = await response.text();
    if (!text) {
      console.error('Empty response from server');
      return {
        success: false,
        error: 'Empty response from server',
      };
    }

    // Try to parse JSON
    try {
      const data = JSON.parse(text);
      return data;
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      console.error('Response text:', text);
      return {
        success: false,
        error: 'Server returned invalid response format',
      };
    }
  } catch (error) {
    console.error('LIFF registration error:', error);
    return {
      success: false,
      error: 'Failed to register user',
    };
  }
};

// Get user profile by LINE user ID
export const getLiffUserProfile = async (lineUserId: string): Promise<LiffAuthResponse> => {
  try {
    const response = await fetch(`/api/liff/profile/${lineUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('HTTP Error:', response.status, response.statusText);
      return {
        success: false,
        error: `Server error: ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get LIFF profile error:', error);
    return {
      success: false,
      error: 'Failed to get user profile',
    };
  }
};

// Store authentication data in localStorage
export const storeAuthData = (user: LiffUser, token: string) => {
  localStorage.setItem('liffUser', JSON.stringify(user));
  localStorage.setItem('liffToken', token);
};

// Get authentication data from localStorage
export const getAuthData = (): { user: LiffUser | null; token: string | null } => {
  const userStr = localStorage.getItem('liffUser');
  const token = localStorage.getItem('liffToken');
  
  return {
    user: userStr ? JSON.parse(userStr) : null,
    token,
  };
};

// Clear authentication data
export const clearAuthData = () => {
  localStorage.removeItem('liffUser');
  localStorage.removeItem('liffToken');
  localStorage.removeItem('lineProfile');
  localStorage.removeItem('lineIdToken');
};

// Centralized logout function
export const logout = () => {
  console.log('🚀 Performing full logout...');
  // Clear local application auth data
  clearAuthData();

  // Get LIFF service instance and perform LIFF logout
  try {
    const svc = LiffService.getInstance();
    if (svc.isLoggedIn()) {
      svc.logout();
      console.log('✅ LIFF session logged out.');
    }
  } catch (error) {
    console.warn('⚠️ Could not perform LIFF logout:', error);
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const { user, token } = getAuthData();
  return !!(user && token);
};
