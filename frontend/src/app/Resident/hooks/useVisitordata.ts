"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthData, isAuthenticated } from "@/lib/liffAuth";
import { 
  fetchPendingVisitorRequests, 
  fetchVisitorHistory, 
  approveVisitorRequest, 
  denyVisitorRequest, 
  transformApiData 
} from "../utils/visitorUtils";
import { 
  VisitorRequest, 
  ConfirmationDialogState 
} from "../types/visitor";

export const useVisitorData = () => {
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState<VisitorRequest[]>([]);
  const [history, setHistory] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [villageName, setVillageName] = useState<string>('');
  
  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialogState>({
    isOpen: false,
    type: 'approve',
    request: null,
    isLoading: false,
  });

  // Check authentication and role on component mount
  useEffect(() => {
    const checkAuthAndRole = () => {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        console.log('User not authenticated, proceeding without authentication');
        setIsCheckingAuth(false);
        return;
      }

      // Get user data and check role
      const { user } = getAuthData();
      if (!user) {
        console.log('No user data found, proceeding without authentication');
        setIsCheckingAuth(false);
        return;
      }

      console.log('User data found:', user);
      setCurrentUser(user);
      setIsCheckingAuth(false);
      
      // Fetch village name
      if (user.village_key) {
        fetchVillageName(user.village_key);
      }
    };

    checkAuthAndRole();
  }, [router]);

  // Function to fetch village name
  const fetchVillageName = async (villageKey: string) => {
    try {
      const { token } = getAuthData();
      const apiUrl = '';
      
      const response = await fetch(`${apiUrl}/api/villages/validate?key=${encodeURIComponent(villageKey)}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      console.log('🔍 Village validation response status:', response.status);
      console.log('🔍 Village validation response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        console.error('❌ Non-JSON response received:', responseText);
        throw new Error(`Response is not JSON. Status: ${response.status}, Content-Type: ${contentType}`);
      }
      
      const data = await response.json();
      console.log('🔍 Village validation data:', data);
      
      if (data.success && data.village) {
        setVillageName(data.village.village_name);
        console.log('✅ Village name set:', data.village.village_name);
      } else {
        console.error('❌ Village validation failed:', data);
      }
    } catch (error) {
      console.error('❌ Error fetching village name:', error);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        console.log("No current user, skipping data load");
        return;
      }

      console.log("🔄 Starting data load for user:", currentUser);
      try {
        setLoading(true);
        setError(null);
        console.log("🚀 Starting API calls...");

        // Test backend connection first
        console.log("🔍 Testing backend connection...");
        const healthResponse = await fetch('/api/health');
        console.log("🏥 Backend health check:", healthResponse.status);

        // Check if user has LINE user ID
        if (!currentUser.lineUserId) {
          console.log("⚠️ No LINE user ID found, trying to fetch all visitor records for testing");
          
          // For testing, fetch all visitor records
          const testResponse = await fetch('/api/test-visitor-records');
          const testData = await testResponse.json();
          
          if (testData.success) {
            console.log("📋 Test visitor records:", testData.records);
            // Transform test data to match expected format
            const transformedRecords = testData.records.map((record: any) => ({
              id: record.visitor_record_id,
              plateNumber: record.license_plate || 'ไม่ระบุ',
              visitorName: record.visitor_id_card || 'ไม่ระบุ',
              destination: record.house?.address || 'ไม่ระบุ',
              time: new Date(record.createdAt).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }),
              carImage: record.picture_key || 'car1.jpg',
              status: record.record_status === 'approved' ? 'approved' : 
                     record.record_status === 'rejected' ? 'denied' : undefined,
            }));
            
            setPendingRequests(transformedRecords.filter((r: any) => !r.status));
            setHistory(transformedRecords.filter((r: any) => r.status));
          }
          setLoading(false);
          return;
        }

        // Fetch pending visitor requests and history separately
        console.log(`🔍 Fetching pending visitor requests for LINE user ID: ${currentUser.lineUserId}`);
        const pendingData = await fetchPendingVisitorRequests(currentUser.lineUserId);
        
        console.log(`🔍 Fetching visitor history for LINE user ID: ${currentUser.lineUserId}`);
        const historyData = await fetchVisitorHistory(currentUser.lineUserId);

        // Debug: Log raw data before transformation
        console.log("Raw API data:", {
          pendingData: pendingData,
          historyData: historyData,
          pendingCount: pendingData?.length || 0,
          historyCount: historyData?.length || 0
        });

        // Transform API data to component format
        const transformedPending = pendingData.map(transformApiData);
        const transformedHistory = historyData.map(transformApiData);

        setPendingRequests(transformedPending);
        setHistory(transformedHistory);

        console.log("Transformed data:", { 
          pending: transformedPending.length, 
          history: transformedHistory.length,
          historyItems: transformedHistory
        });

      } catch (err) {
        console.error('❌ Error loading visitor data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`ไม่สามารถโหลดข้อมูลได้: ${errorMessage}`);

        // Fallback to mock data for development
        setPendingRequests([
          {
            id: "1",
            plateNumber: "กข 1234",
            visitorName: "ส่งของ",
            destination: "รปภ. สมชาย",
            time: "09:12",
            carImage: "car1.jpg",
          },
          {
            id: "2",
            plateNumber: "ขก 5678",
            visitorName: "เยี่ยม",
            destination: "รปภ. วิทยา",
            time: "09:45",
            carImage: "car2.jpg",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (!isCheckingAuth && currentUser) {
      loadData();
    }
  }, [currentUser, isCheckingAuth]);

  const handleApprove = (id: string) => {
    const request = pendingRequests.find((req) => req.id === id);
    if (!request) return;

    setConfirmationDialog({
      isOpen: true,
      type: 'approve',
      request,
      isLoading: false,
    });
  };

  const handleDeny = (id: string) => {
    const request = pendingRequests.find((req) => req.id === id);
    if (!request) return;

    setConfirmationDialog({
      isOpen: true,
      type: 'reject',
      request,
      isLoading: false,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmationDialog.request) return;

    const { request, type } = confirmationDialog;
    
    setConfirmationDialog(prev => ({ ...prev, isLoading: true }));

    try {
      // Optimistic update - remove from pending immediately
      setPendingRequests(prev => prev.filter((req) => req.id !== request.id));
      setHistory(prev => [{ ...request, status: type === 'approve' ? 'approved' : 'denied' }, ...prev]);

      // Call API
      if (type === 'approve') {
        await approveVisitorRequest(request.id);
        console.log("Approved for:", request.plateNumber);
      } else {
        await denyVisitorRequest(request.id);
        console.log("Denied for:", request.plateNumber);
      }

      // Close dialog
      setConfirmationDialog({
        isOpen: false,
        type: 'approve',
        request: null,
        isLoading: false,
      });
    } catch (error) {
      console.error(`Error ${type === 'approve' ? 'approving' : 'denying'} request:`, error);
      
      // Rollback on error
      setPendingRequests(prev => [...prev, request]);
      setHistory(prev => prev.filter((req) => req.id !== request.id));
      
      // Show error and close dialog
      setConfirmationDialog({
        isOpen: false,
        type: 'approve',
        request: null,
        isLoading: false,
      });
      
      alert(`เกิดข้อผิดพลาดในการ${type === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'} กรุณาลองใหม่อีกครั้ง`);
    }
  };

  const handleCloseDialog = () => {
    if (confirmationDialog.isLoading) return; // Prevent closing while loading
    
    setConfirmationDialog({
      isOpen: false,
      type: 'approve',
      request: null,
      isLoading: false,
    });
  };

  return {
    pendingRequests,
    history,
    loading,
    error,
    isCheckingAuth,
    currentUser,
    villageName,
    confirmationDialog,
    handleApprove,
    handleDeny,
    handleConfirmAction,
    handleCloseDialog,
  };
};
