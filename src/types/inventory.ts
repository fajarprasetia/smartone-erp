export enum ActionType {
  ADDED = "ADDED",
  EDITED = "EDITED",
  REMOVED = "REMOVED",
  REQUESTED = "REQUESTED",
  ALLOCATED = "ALLOCATED",
  APPROVED_REQUEST = "APPROVED_REQUEST",
  APPROVED_REQUEST_EXISTING_STOCK = "APPROVED_REQUEST_EXISTING_STOCK",
  REJECTED_REQUEST = "REJECTED_REQUEST"
}

export interface PaperLog {
  id: string;
  paper_stock_id: string | null;
  request_id: string | null;
  action: string;
  performed_by: string;
  notes: string | null;
  created_at: string;
  user_name?: string;
  barcode_id?: string;
}

export interface PaperStock {
  id: string;
  barcode_id: string;
  supplier: string;
  type: string;
  gsm: string;
  width: string;
  length: string;
  date_added: string;
  is_available: boolean;
  notes?: string | null;
}

export interface PaperRequest {
  id: string;
  user_id: string;
  paper_type: string;
  gsm: string;
  width: string;
  length: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  paper_stock_id?: string | null;
  user_notes?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export enum InkActionType {
  ADDED = "ADDED",
  EDITED = "EDITED",
  REMOVED = "REMOVED",
  REQUESTED = "REQUESTED",
  ALLOCATED = "ALLOCATED",
  APPROVED_REQUEST = "APPROVED_REQUEST",
  APPROVED_REQUEST_EXISTING_STOCK = "APPROVED_REQUEST_EXISTING_STOCK",
  REJECTED = "REJECTED"
}

export interface InkStock {
  id: string;
  barcode_id: string;
  supplier: string;
  type: string;
  color: string;
  quantity: number;
  unit: string;
  date_added: string;
  added_by: string;
  user_name?: string;
  is_available: boolean;
  notes?: string | null;
}

export interface InkRequest {
  id: string;
  user_id: string;
  ink_type: string;
  color: string;
  quantity: number;
  unit: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  ink_stock_id?: string | null;
  user_notes?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
  requester_name?: string;
}

export interface InkLog {
  id: string;
  ink_stock_id: string | null;
  request_id: string | null;
  action: string;
  performed_by: string;
  notes: string | null;
  created_at: string;
  user_name?: string;
  barcode_id?: string;
} 