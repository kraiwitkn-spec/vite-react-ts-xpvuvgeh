export enum UserRole {
  ADMIN = 'ADMIN',
  APPROVER = 'APPROVER', // KraiwitN
  OPERATOR = 'OPERATOR'  // Others
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  canApprove: boolean;
  password?: string;
}

export interface SparePart {
  id: string;
  name: string;
  model: string;
  spec: string;
  area: string; // Store Area ID e.g., 'A1', 'B2'
  quantity: number;
  minLevel: number;
  imageUrl: string;
  lastUpdated: string;
}

export enum TransactionType {
  IN = 'IN',
  OUT = 'OUT',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVAL = 'APPROVAL'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED' // For 'IN' transactions which don't need approval
}

export interface Transaction {
  id: string;
  partId: string;
  userId: string;
  userName: string;
  type: TransactionType;
  quantity: number;
  timestamp: string;
  status: TransactionStatus;
  note?: string;
  approverName?: string;
  relatedTransactionId?: string;
  partData?: SparePart; // Optional: Stores the full part object for CREATE requests
}

export interface StoreArea {
  id: string;
  name: string;
  row: number;
  col: number;
}