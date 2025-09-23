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

// Target LINE user ID for สมชาย ผาสุก
const TARGET_LINE_USER_ID = "Ue529194c37fd43a24cf96d8648299d90";

export const useVisitorData = () => {
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState<VisitorRequest[]>([]);
  const [history, setHistory] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
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
      if (!user || user.role !== 'resident') {
        console.log('User is not a resident, proceeding without authentication');
        setIsCheckingAuth(false);
        return;
      }

      console.log('User is authenticated as resident:', user.username);
      setIsCheckingAuth(false);
    };

    checkAuthAndRole();
  }, [router]);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      console.log("🔄 Starting data load for LINE user ID:", TARGET_LINE_USER_ID);
      try {
        setLoading(true);
        setError(null);
        console.log("🚀 Starting API calls...");

        // Test backend connection first
        console.log("🔍 Testing backend connection...");
        const healthResponse = await fetch('/api/health');
        console.log("🏥 Backend health check:", healthResponse.status);

        // Fetch pending visitor requests and history separately
        console.log(`🔍 Fetching pending visitor requests for LINE user ID: ${TARGET_LINE_USER_ID}`);
        const pendingData = await fetchPendingVisitorRequests(TARGET_LINE_USER_ID);
        
        console.log(`🔍 Fetching visitor history for LINE user ID: ${TARGET_LINE_USER_ID}`);
        const historyData = await fetchVisitorHistory(TARGET_LINE_USER_ID);

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

    if (!isCheckingAuth) {
      loadData();
    }
  }, [TARGET_LINE_USER_ID, isCheckingAuth]);

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
    confirmationDialog,
    handleApprove,
    handleDeny,
    handleConfirmAction,
    handleCloseDialog,
  };
};
