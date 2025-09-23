import { ApiVisitorRequest, VisitorRequest } from '../types/visitor';

// API functions for fetching visitor records by LINE user ID
export const fetchPendingVisitorRequests = async (lineUserId: string): Promise<ApiVisitorRequest[]> => {
  const response = await fetch(`/api/visitor-requests/pending/line/${encodeURIComponent(lineUserId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch pending visitor requests: ${response.statusText}`);
  }
  const result = await response.json();
  return result.success ? result.data : [];
};

export const fetchVisitorHistory = async (lineUserId: string): Promise<ApiVisitorRequest[]> => {
  const response = await fetch(`/api/visitor-requests/history/line/${encodeURIComponent(lineUserId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch visitor history: ${response.statusText}`);
  }
  const result = await response.json();
  return result.success ? result.data : [];
};

export const approveVisitorRequest = async (id: string): Promise<void> => {
  const response = await fetch(`/api/visitor-requests/${id}/approve`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to approve request: ${response.statusText}`);
  }
};

export const denyVisitorRequest = async (id: string): Promise<void> => {
  const response = await fetch(`/api/visitor-requests/${id}/deny`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to deny request: ${response.statusText}`);
  }
};

export const transformApiData = (apiData: ApiVisitorRequest): VisitorRequest => {
  // Format the entry time to display format
  const entryTime = new Date(apiData.entry_time);
  const timeString = entryTime.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return {
    id: apiData.visitor_record_id,
    plateNumber: apiData.license_plate || 'ไม่ระบุ',
    visitorName: apiData.visitor_name || apiData.visit_purpose || 'ไม่ระบุ',
    destination: apiData.house_address,
    time: timeString,
    carImage: apiData.picture_key || 'car1.jpg', // fallback to default image
    status: apiData.record_status === 'approved' ? 'approved' : 
             apiData.record_status === 'rejected' ? 'denied' : undefined,
  };
};
