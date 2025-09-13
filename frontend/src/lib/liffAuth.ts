// LIFF Authentication Service
export interface LiffUser {
  id: string;
  lineUserId: string;
  email: string;
  fname: string;
  lname: string;
  username: string;
  phone: string;
  village_key: string;
  status: 'verified' | 'pending' | 'disable';
  profile_image_url?: string;
  role: 'resident' | 'guard';
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
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL environment variable is required');
}

// Verify LINE ID token with backend
export const verifyLiffToken = async (idToken: string, role?: 'resident' | 'guard'): Promise<LiffAuthResponse> => {
  try {
    
    const response = await fetch(`${API_BASE_URL}/api/liff/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken, role }),
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
    const data = JSON.parse(text);
    return data;
  } catch (error) {
    console.error('LIFF verification error:', error);
    return {
      success: false,
      error: `Failed to verify LINE token: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    const response = await fetch(`${API_BASE_URL}/api/liff/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        ...userData,
      }),
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
    const data = JSON.parse(text);
    return data;
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
    const response = await fetch(`${API_BASE_URL}/api/liff/profile/${lineUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const { user, token } = getAuthData();
  return !!(user && token);
};
