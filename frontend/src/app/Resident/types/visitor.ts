export interface VisitorRequest {
  id: string;
  plateNumber: string;
  visitorName: string;
  destination: string;
  time: string;
  carImage: string;
  status?: "approved" | "denied";
}

export interface ApprovalCardsProps {
  items: VisitorRequest[];
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}

export interface ApiVisitorRequest {
  visitor_record_id: string;
  resident_id: string;
  guard_id: string;
  house_id: string;
  picture_key?: string;
  visitor_name?: string;
  visitor_id_card?: string;
  license_plate?: string;
  entry_time: string;
  record_status: 'pending' | 'approved' | 'rejected';
  visit_purpose?: string;
  createdAt: string;
  updatedAt: string;
  resident_name: string;
  resident_email: string;
  guard_name: string;
  guard_email: string;
  house_address: string;
  village_id: string;
}

export interface ConfirmationDialogState {
  isOpen: boolean;
  type: 'approve' | 'reject';
  request: VisitorRequest | null;
  isLoading: boolean;
}
