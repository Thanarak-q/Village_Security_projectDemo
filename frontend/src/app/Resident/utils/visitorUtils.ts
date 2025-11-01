import { ApiVisitorRequest, VisitorRequest } from '../types/visitor';
import { getAuthData } from '@/lib/liffAuth';

type VisitorFilters = {
  villageId?: string | null;
  houseId?: string | null;
};

const buildQuery = (filters?: VisitorFilters) => {
  const params = new URLSearchParams();
  if (filters?.villageId) {
    params.set('village_id', filters.villageId);
  }
  if (filters?.houseId) {
    params.set('house_id', filters.houseId);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
};

// API functions for fetching visitor records by LINE user ID
export const fetchPendingVisitorRequests = async (
  lineUserId: string,
  filters?: VisitorFilters
): Promise<ApiVisitorRequest[]> => {
  const { token } = getAuthData();

  const response = await fetch(
    `/api/visitor-requests/pending/line/${encodeURIComponent(lineUserId)}${buildQuery(filters)}`,
    {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch pending visitor requests: ${response.statusText}`);
  }
  const result = await response.json();
  return result.success ? result.data : [];
};

export const fetchVisitorHistory = async (
  lineUserId: string,
  filters?: VisitorFilters
): Promise<ApiVisitorRequest[]> => {
  const { token } = getAuthData();

  const response = await fetch(
    `/api/visitor-requests/history/line/${encodeURIComponent(lineUserId)}${buildQuery(filters)}`,
    {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch visitor history: ${response.statusText}`);
  }
  const result = await response.json();
  return result.success ? result.data : [];
};

export const approveVisitorRequest = async (id: string): Promise<void> => {
  const { token } = getAuthData();

  const response = await fetch(`/api/visitor-requests/${id}/approve`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to approve request: ${response.statusText}`);
  }
};

export const denyVisitorRequest = async (id: string): Promise<void> => {
  const { token } = getAuthData();

  const response = await fetch(`/api/visitor-requests/${id}/deny`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to deny request: ${response.statusText}`);
  }
};

export const transformApiData = (apiData: ApiVisitorRequest): VisitorRequest => {
  // Format the entry time to display format with date
  const entryTime = new Date(apiData.entry_time);
  const timeString = entryTime.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const dateString = entryTime.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timeWithDate = `${timeString} ${dateString}`;

  let exitTimeWithDate: string | undefined;
  if (apiData.exit_time) {
    const exitTime = new Date(apiData.exit_time);
    const exitTimeString = exitTime.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const exitDateString = exitTime.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    exitTimeWithDate = `${exitTimeString} ${exitDateString}`;
  }

  // Construct proper image URL from picture_key
  let carImageUrl = 'car1.jpg'; // fallback to default image
  if (apiData.picture_key) {
    // Use the backend image serving endpoint
    carImageUrl = `/api/images/file/${apiData.picture_key}`;
  }

  return {
    id: apiData.visitor_record_id,  
    plateNumber: apiData.license_plate || 'ไม่ระبุ',
    visitorName: apiData.visit_purpose || apiData.visitor_name || '',
    destination: apiData.house_address ? `บ้านเลขที่ ${apiData.house_address}` : '',
    time: timeWithDate,
    exitTime: exitTimeWithDate,
    isInside: apiData.is_in,
    carImage: carImageUrl,
    status: apiData.record_status === 'approved' ? 'approved' :
      apiData.record_status === 'rejected' ? 'denied' : undefined,
  };
};
