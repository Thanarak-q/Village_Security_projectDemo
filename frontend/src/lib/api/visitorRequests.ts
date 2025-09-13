/**
 * API service functions for visitor requests
 */

export interface VisitorRequest {
  visitor_record_id: string;
  resident_id: string;
  guard_id: string;
  house_id: string;
  picture_key?: string;
  license_plate?: string;
  entry_time: string;
  exit_time?: string;
  record_status: "pending" | "approved" | "rejected";
  visit_purpose?: string;
  created_at: string;
  updated_at: string;
  // Joined data from related tables
  resident_name?: string;
  guard_name?: string;
  house_address?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  total?: number;
  message?: string;
  error?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Fetch pending visitor requests for a resident
 */
export async function fetchPendingRequests(residentId: string): Promise<VisitorRequest[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/visitor-requests/pending/${residentId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<VisitorRequest[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch pending requests');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    throw error;
  }
}

/**
 * Approve a visitor request
 */
export async function approveVisitorRequest(recordId: string): Promise<VisitorRequest> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/visitor-requests/${recordId}/approve`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<VisitorRequest> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to approve request');
    }

    return result.data!;
  } catch (error) {
    console.error('Error approving visitor request:', error);
    throw error;
  }
}

/**
 * Deny a visitor request
 */
export async function denyVisitorRequest(recordId: string): Promise<VisitorRequest> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/visitor-requests/${recordId}/deny`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<VisitorRequest> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to deny request');
    }

    return result.data!;
  } catch (error) {
    console.error('Error denying visitor request:', error);
    throw error;
  }
}

/**
 * Fetch visitor request history for a resident
 */
export async function fetchVisitorHistory(residentId: string): Promise<VisitorRequest[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/visitor-requests/history/${residentId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<VisitorRequest[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch history');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching visitor history:', error);
    throw error;
  }
}

/**
 * Fetch pending visitor requests by LINE ID
 */
export async function fetchPendingRequestsByLineId(lineUserId: string): Promise<VisitorRequest[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/visitor-requests/pending/line/${lineUserId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<VisitorRequest[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch pending requests');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching pending requests by LINE ID:', error);
    throw error;
  }
}

/**
 * Fetch visitor request history by LINE ID
 */
export async function fetchVisitorHistoryByLineId(lineUserId: string): Promise<VisitorRequest[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/visitor-requests/history/line/${lineUserId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<VisitorRequest[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch history');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching visitor history by LINE ID:', error);
    throw error;
  }
}