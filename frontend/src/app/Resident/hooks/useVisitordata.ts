"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthData, isAuthenticated } from "@/lib/liffAuth";
import type { LiffUser } from "@/lib/liffAuth";
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

interface TestVisitorRecord {
  visitor_record_id: string;
  createdAt: string;
  license_plate?: string;
  visit_purpose?: string;
  visitor_name?: string;
  house_address?: string;
  visitor_id_card?: string;
  visitor_name?: string;
  house?: {
    address?: string;
  } | null;
  house_address?: string;
  picture_key?: string;
  record_status?: string;
}

interface TestVisitorResponse {
  success: boolean;
  records: TestVisitorRecord[];
}

export const useVisitorData = () => {
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState<VisitorRequest[]>([]);
  const [history, setHistory] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<LiffUser | null>(null);
  
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
      
      // Note: village_name is not directly available in LIFF auth user data
      // It would need to be fetched separately if needed
    };

    checkAuthAndRole();
  }, [router]);


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
          const testData: TestVisitorResponse = await testResponse.json();
          
          if (testData.success) {
            console.log("📋 Test visitor records:", testData.records);
            // Transform test data to match expected format
            const transformedRecords: VisitorRequest[] = testData.records.map((record) => {
              const entryTime = new Date(record.createdAt);
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
              
              console.log("🖼️ Record image info:", {
                id: record.visitor_record_id,
                picture_key: record.picture_key,
                license_plate: record.license_plate
              });
              
              // Construct proper image URL from picture_key
              let carImageUrl = 'car1.jpg'; // fallback to default image
              if (record.picture_key) {
                // Use the backend image serving endpoint
                carImageUrl = `/api/images/file/${record.picture_key}`;
              }

              return {
                id: record.visitor_record_id,
                plateNumber: record.license_plate || 'ไม่ระบุ',
                visitorName: record.visit_purpose || record.visitor_name || '',
                destination: record.house?.address ? `บ้านเลขที่ ${record.house.address}` : '',
                time: timeWithDate,
                carImage: carImageUrl,
                status: record.record_status === 'approved' ? 'approved' : 
                       record.record_status === 'rejected' ? 'denied' : undefined,
              };
            });
            
            const pending = transformedRecords.filter((record) => !record.status);
            const historyRecords = transformedRecords.filter((record) => Boolean(record.status));

            setPendingRequests(pending);
            setHistory(historyRecords);
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
        const currentDate = new Date().toLocaleDateString('th-TH', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        setPendingRequests([
          {
            id: "1",
            plateNumber: "กข 1234",
            visitorName: "ส่งของ",
            destination: "บ้านเลขที่ สมชาย",
            time: `09:12 ${currentDate}`,
            carImage: "car1.jpg",
          },
          {
            id: "2",
            plateNumber: "ขก 5678",
            visitorName: "เยี่ยม",
            destination: "บ้านเลขที่ วิทยา",
            time: `09:45 ${currentDate}`,
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
    confirmationDialog,
    handleApprove,
    handleDeny,
    handleConfirmAction,
    handleCloseDialog,
  };
};
