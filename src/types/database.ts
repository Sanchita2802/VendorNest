// Database Types for VendorNest — 10 Tables in 3NF

export interface PincodeCityRow {
  Pincode: string; // Primary Key (6 digits)
  City: string;
}

export interface VendorRow {
  VendorID: string; // Primary Key (e.g., 'V01')
  VendorName: string;
  Category: string;
  Street: string;
  Pincode: string; // Foreign Key -> PINCODE_CITY.Pincode
}

export interface VendorContactRow {
  VendorID: string; // Composite PK part 1, FK -> VENDOR.VendorID
  ContactNo: string; // Composite PK part 2 (10-digit Indian phone)
}

export interface ProductRow {
  ProductID: string; // Primary Key (e.g., 'P01')
  ProductName: string;
  Price: number; // CHECK (Price > 0)
  VendorID: string; // Foreign Key -> VENDOR.VendorID
}

// Specialization: Disjoint subtype of PRODUCT
export interface GoodsRow {
  ProductID: string; // PK & FK -> PRODUCT.ProductID
  HSNCode: string; // 4-8 digit HSN code
}

// Specialization: Disjoint subtype of PRODUCT
export interface ServiceRow {
  ProductID: string; // PK & FK -> PRODUCT.ProductID
  ServiceHours: number; // Service duration in hours (positive number)
}

export type OrderStatus = 'Pending' | 'Delivered';

export interface PurchaseOrderRow {
  OrderID: string; // Primary Key (e.g., 'PO001')
  OrderDate: string; // YYYY-MM-DD
  Status: OrderStatus;
  VendorID: string; // Foreign Key -> VENDOR.VendorID
}

export interface ContainsRow {
  OrderID: string; // Composite PK part 1, FK -> PURCHASE_ORDER.OrderID
  ProductID: string; // Composite PK part 2, FK -> PRODUCT.ProductID
  Quantity: number; // CHECK (Quantity > 0)
}

export type PaymentStatus = 'Paid' | 'Pending';

export interface PaymentRow {
  PaymentID: string; // Primary Key (e.g., 'PAY001')
  Amount: number; // CHECK (Amount > 0 and Amount <= derived TotalCost)
  PaymentDate: string; // YYYY-MM-DD
  Status: PaymentStatus; // Automatically set to 'Paid' when sum(installments) == Amount, else 'Pending'
  OrderID: string; // Foreign Key -> PURCHASE_ORDER.OrderID, UNIQUE (1:1 relationship)
}

// Weak Entity: Depends on PAYMENT for existence and identification
export interface PaymentInstallmentRow {
  PaymentID: string; // Identifying FK & Composite PK part 1 -> PAYMENT.PaymentID
  InstallmentNo: number; // Discriminator / Partial Key & Composite PK part 2 (1, 2, 3...)
  InstallmentAmount: number; // CHECK (InstallmentAmount > 0)
}

// Complete Database State Shape
export interface DatabaseSchema {
  PINCODE_CITY: PincodeCityRow[];
  VENDOR: VendorRow[];
  VENDOR_CONTACT: VendorContactRow[];
  PRODUCT: ProductRow[];
  GOODS: GoodsRow[];
  SERVICE: ServiceRow[];
  PURCHASE_ORDER: PurchaseOrderRow[];
  CONTAINS: ContainsRow[];
  PAYMENT: PaymentRow[];
  PAYMENT_INSTALLMENT: PaymentInstallmentRow[];
}

// Joined View Models for Rich Display
export interface VendorWithDetails extends VendorRow {
  City: string;
  Contacts: string[];
  ProductCount: number;
  OrderCount: number;
  TotalBilled: number;
  TotalPaid: number;
  TotalOutstanding: number;
}

export interface ProductWithDetails extends ProductRow {
  VendorName: string;
  VendorCategory: string;
  Type: 'Goods' | 'Service';
  HSNCode?: string;
  ServiceHours?: number;
}

export interface OrderLineItem {
  ProductID: string;
  ProductName: string;
  Price: number;
  Quantity: number;
  LineTotal: number; // Derived: Price * Quantity
}

export interface PurchaseOrderWithDetails extends PurchaseOrderRow {
  VendorName: string;
  VendorCategory: string;
  VendorCity: string;
  Items: OrderLineItem[];
  TotalCost: number; // Derived attribute: SUM(Price * Quantity)
  Payment?: PaymentRow;
  InstallmentsSum: number;
  PaymentStatus: 'Not Created' | 'Pending' | 'Paid';
}

export interface PaymentWithDetails extends PaymentRow {
  VendorID: string;
  VendorName: string;
  OrderDate: string;
  OrderStatus: OrderStatus;
  OrderTotalCost: number; // Derived TotalCost of order
  Installments: PaymentInstallmentRow[];
  InstallmentsSum: number;
  RemainingBalance: number; // Derived: Amount - InstallmentsSum
}

// SQL Log Entry for the Terminal Drawer
export interface SqlLogEntry {
  id: string;
  timestamp: string;
  action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'SCHEMA' | 'VIOLATION';
  sql: string;
  table?: keyof DatabaseSchema | string;
  isError?: boolean;
  errorMessage?: string;
  affectedRows?: number;
}
