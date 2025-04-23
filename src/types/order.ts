export interface Order {
  id: string;
  spk: string;
  customerName: string;
  customerId: string;
  productName: string;
  quantity: number;
  unit: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;

  // Production Fields
  productionType: {
    PRINT: boolean;
    PRESS: boolean;
    CUTTING: boolean;
    DTF: boolean;
    SEWING: boolean;
  };
  
  // Print Status
  printStartedAt?: string;
  printCompletedAt?: string;
  printAssignee?: string;
  printNotes?: string;
  
  // Press Status
  pressStartedAt?: string;
  pressCompletedAt?: string;
  pressAssignee?: string;
  pressNotes?: string;
  
  // Cutting Status
  cuttingStartedAt?: string;
  cuttingCompletedAt?: string;
  cuttingAssignee?: string;
  cuttingNotes?: string;
  cuttingWasteQuantity?: number;
  
  // DTF Status
  dtfStartedAt?: string;
  dtfCompletedAt?: string;
  dtfAssignee?: string;
  dtfNotes?: string;
  
  // Additional Fields
  targetCompletionDate?: string;
  price?: number;
  discount?: number;
  discountType?: string;
  tax?: number;
  totalPrice?: number;
  notes?: string;
}