// VendorNest Relational Engine (3NF In-Browser DBMS Layer)
// Enforces Primary Keys, Composite PKs, Foreign Keys, Unique, Check Constraints,
// Weak Entity identification, Disjoint Specialization, and Referential Actions (RESTRICT / CASCADE).

import {
  DatabaseSchema,
  PincodeCityRow,
  VendorRow,
  VendorContactRow,
  ProductRow,
  GoodsRow,
  ServiceRow,
  PurchaseOrderRow,
  ContainsRow,
  PaymentRow,
  PaymentInstallmentRow,
  VendorWithDetails,
  ProductWithDetails,
  PurchaseOrderWithDetails,
  PaymentWithDetails,
  SqlLogEntry,
  OrderStatus,
  PaymentStatus,
} from '../types/database';

const DB_STORAGE_KEY = 'vendornest_db_state_v1';
const SQL_LOG_STORAGE_KEY = 'vendornest_sql_logs_v1';

// Seed Data definition satisfying all relational constraints
const SEED_DATA: DatabaseSchema = {
  PINCODE_CITY: [
    { Pincode: '422001', City: 'Nashik' },
    { Pincode: '422007', City: 'Nashik' },
    { Pincode: '411004', City: 'Pune' },
    { Pincode: '411057', City: 'Pune' },
    { Pincode: '400001', City: 'Mumbai' },
    { Pincode: '400076', City: 'Mumbai' },
    { Pincode: '440010', City: 'Nagpur' },
    { Pincode: '440022', City: 'Nagpur' },
  ],
  VENDOR: [
    { VendorID: 'V01', VendorName: 'Metro Supplies Pvt Ltd', Category: 'Office Supplies', Street: '22 Industrial Rd, Satpur MIDC', Pincode: '422001' },
    { VendorID: 'V02', VendorName: 'Apex Electronics & Hardware', Category: 'Electronics', Street: '8 FC Road, Deccan Gymkhana', Pincode: '411004' },
    { VendorID: 'V03', VendorName: 'Godavari Paper Mills', Category: 'Paper & Packaging', Street: '5 MIDC Ambad, Plot 44', Pincode: '422007' },
    { VendorID: 'V04', VendorName: 'Sahyadri Tech Solutions', Category: 'IT & Software', Street: 'Phase 1 Hinjewadi Tech Park', Pincode: '411057' },
    { VendorID: 'V05', VendorName: 'Bombay Industrial Tools', Category: 'Industrial Equipment', Street: '14 Fort Business Hub, Ballard Estate', Pincode: '400001' },
    { VendorID: 'V06', VendorName: 'Powai Logistics & Fleet', Category: 'Logistics', Street: 'Building 7, Powai Tech Area', Pincode: '400076' },
    { VendorID: 'V07', VendorName: 'OrangeCity Chemical Corp', Category: 'Chemicals & Raw Materials', Street: 'Plot 12 Hingna Industrial Estate', Pincode: '440010' },
    { VendorID: 'V08', VendorName: 'Vidarbha Engineering Works', Category: 'Machinery & Fabrication', Street: '88 MIDC Butibori', Pincode: '440022' },
  ],
  // Multi-valued attribute Contact decomposed into 1:N Composite PK table
  VENDOR_CONTACT: [
    { VendorID: 'V01', ContactNo: '9822014589' },
    { VendorID: 'V01', ContactNo: '9423056123' },
    { VendorID: 'V02', ContactNo: '9850123984' },
    { VendorID: 'V02', ContactNo: '9763445566' },
    { VendorID: 'V03', ContactNo: '9422789012' },
    { VendorID: 'V04', ContactNo: '9923456789' },
    { VendorID: 'V04', ContactNo: '9890112233' },
    { VendorID: 'V05', ContactNo: '9820011224' },
    { VendorID: 'V06', ContactNo: '9833456781' },
    { VendorID: 'V06', ContactNo: '9867012345' },
    { VendorID: 'V07', ContactNo: '9422114455' },
    { VendorID: 'V08', ContactNo: '9823098765' },
    { VendorID: 'V08', ContactNo: '9422890123' },
  ],
  PRODUCT: [
    // V01 Metro Supplies (Office Supplies)
    { ProductID: 'P01', ProductName: 'Ergonomic Mesh Chair', Price: 6500, VendorID: 'V01' },
    { ProductID: 'P02', ProductName: 'Executive Teakwood Desk', Price: 18500, VendorID: 'V01' },
    { ProductID: 'P03', ProductName: 'Office Workspace Layout Design', Price: 12000, VendorID: 'V01' },

    // V02 Apex Electronics (Electronics)
    { ProductID: 'P04', ProductName: 'CAT6 Gigabit Cable Drum (305m)', Price: 4200, VendorID: 'V02' },
    { ProductID: 'P05', ProductName: '24-Port Managed Gigabit Switch', Price: 14500, VendorID: 'V02' },
    { ProductID: 'P06', ProductName: 'Structured Network Cabling Service', Price: 8500, VendorID: 'V02' },

    // V03 Godavari Paper Mills (Paper & Packaging)
    { ProductID: 'P07', ProductName: 'A4 Copier Paper Ream (75 GSM)', Price: 290, VendorID: 'V03' },
    { ProductID: 'P08', ProductName: 'Heavy-Duty Corrugated Boxes (100pk)', Price: 3400, VendorID: 'V03' },
    { ProductID: 'P09', ProductName: 'Custom Brand Box Printing Service', Price: 5000, VendorID: 'V03' },

    // V04 Sahyadri Tech Solutions (IT & Software)
    { ProductID: 'P10', ProductName: 'Enterprise Cloud Firewall License', Price: 32000, VendorID: 'V04' },
    { ProductID: 'P11', ProductName: 'Database Optimization & Tuning', Price: 25000, VendorID: 'V04' },
    { ProductID: 'P12', ProductName: 'Annual IT Infrastructure Maintenance', Price: 48000, VendorID: 'V04' },

    // V05 Bombay Industrial Tools (Industrial Equipment)
    { ProductID: 'P13', ProductName: 'High-Torque Pneumatic Impact Wrench', Price: 9800, VendorID: 'V05' },
    { ProductID: 'P14', ProductName: 'Precision Digital Vernier Caliper', Price: 2200, VendorID: 'V05' },
    { ProductID: 'P15', ProductName: 'Tool Calibration & Certification', Price: 3500, VendorID: 'V05' },

    // V06 Powai Logistics (Logistics)
    { ProductID: 'P16', ProductName: 'Heavy Cargo Transit Insurance Policy', Price: 4500, VendorID: 'V06' },
    { ProductID: 'P17', ProductName: 'Intercity Container Freight Transit', Price: 22000, VendorID: 'V06' },
    { ProductID: 'P18', ProductName: 'Express Same-Day Courier Dispatch', Price: 6500, VendorID: 'V06' },

    // V07 OrangeCity Chemical Corp (Chemicals & Raw Materials)
    { ProductID: 'P19', ProductName: 'Industrial Surface Degreaser (50L)', Price: 5800, VendorID: 'V07' },
    { ProductID: 'P20', ProductName: 'High-Grade Silicone Thermal Grease', Price: 1950, VendorID: 'V07' },
    { ProductID: 'P21', ProductName: 'Hazardous Waste Neutralization Audit', Price: 15000, VendorID: 'V07' },

    // V08 Vidarbha Engineering Works (Machinery & Fabrication)
    { ProductID: 'P22', ProductName: 'CNC Precision Mild-Steel Flanges (10pk)', Price: 12500, VendorID: 'V08' },
    { ProductID: 'P23', ProductName: 'Heavy Machine Foundation Rigging', Price: 28000, VendorID: 'V08' },
  ],
  // Disjoint specialization: GOODS (HSNCode)
  GOODS: [
    { ProductID: 'P01', HSNCode: '94031000' },
    { ProductID: 'P02', HSNCode: '94033000' },
    { ProductID: 'P04', HSNCode: '85444999' },
    { ProductID: 'P05', HSNCode: '85176290' },
    { ProductID: 'P07', HSNCode: '48025610' },
    { ProductID: 'P08', HSNCode: '48191010' },
    { ProductID: 'P10', HSNCode: '85238020' },
    { ProductID: 'P13', HSNCode: '84671110' },
    { ProductID: 'P14', HSNCode: '90173010' },
    { ProductID: 'P19', HSNCode: '34029099' },
    { ProductID: 'P20', HSNCode: '38249900' },
    { ProductID: 'P22', HSNCode: '73079100' },
  ],
  // Disjoint specialization: SERVICE (ServiceHours)
  SERVICE: [
    { ProductID: 'P03', ServiceHours: 16 },
    { ProductID: 'P06', ServiceHours: 24 },
    { ProductID: 'P09', ServiceHours: 8 },
    { ProductID: 'P11', ServiceHours: 35 },
    { ProductID: 'P12', ServiceHours: 80 },
    { ProductID: 'P15', ServiceHours: 6 },
    { ProductID: 'P16', ServiceHours: 12 },
    { ProductID: 'P17', ServiceHours: 48 },
    { ProductID: 'P18', ServiceHours: 10 },
    { ProductID: 'P21', ServiceHours: 20 },
    { ProductID: 'P23', ServiceHours: 40 },
  ],
  PURCHASE_ORDER: [
    { OrderID: 'PO001', OrderDate: '2026-09-02', Status: 'Delivered', VendorID: 'V01' },
    { OrderID: 'PO002', OrderDate: '2026-09-10', Status: 'Delivered', VendorID: 'V02' },
    { OrderID: 'PO003', OrderDate: '2026-09-18', Status: 'Delivered', VendorID: 'V03' },
    { OrderID: 'PO004', OrderDate: '2026-09-25', Status: 'Delivered', VendorID: 'V04' },
    { OrderID: 'PO005', OrderDate: '2026-10-01', Status: 'Delivered', VendorID: 'V05' },
    { OrderID: 'PO006', OrderDate: '2026-10-04', Status: 'Pending', VendorID: 'V06' },
    { OrderID: 'PO007', OrderDate: '2026-10-08', Status: 'Pending', VendorID: 'V01' },
    { OrderID: 'PO008', OrderDate: '2026-10-10', Status: 'Pending', VendorID: 'V07' },
    { OrderID: 'PO009', OrderDate: '2026-10-12', Status: 'Pending', VendorID: 'V02' },
    { OrderID: 'PO010', OrderDate: '2026-10-14', Status: 'Pending', VendorID: 'V08' },
    { OrderID: 'PO011', OrderDate: '2026-10-15', Status: 'Pending', VendorID: 'V04' },
  ],
  // M:N relationship resolved between PURCHASE_ORDER and PRODUCT
  CONTAINS: [
    // PO001: Chairs + Desk (V01) -> Total = 4 * 6500 + 2 * 18500 = 26000 + 37000 = 63,000
    { OrderID: 'PO001', ProductID: 'P01', Quantity: 4 },
    { OrderID: 'PO001', ProductID: 'P02', Quantity: 2 },

    // PO002: Switches + Cable (V02) -> Total = 2 * 14500 + 3 * 4200 = 29000 + 12600 = 41,600
    { OrderID: 'PO002', ProductID: 'P05', Quantity: 2 },
    { OrderID: 'PO002', ProductID: 'P04', Quantity: 3 },

    // PO003: Paper + Boxes (V03) -> Total = 50 * 290 + 5 * 3400 = 14500 + 17000 = 31,500
    { OrderID: 'PO003', ProductID: 'P07', Quantity: 50 },
    { OrderID: 'PO003', ProductID: 'P08', Quantity: 5 },

    // PO004: Cloud Firewall + Tuning (V04) -> Total = 1 * 32000 + 1 * 25000 = 57,000
    { OrderID: 'PO004', ProductID: 'P10', Quantity: 1 },
    { OrderID: 'PO004', ProductID: 'P11', Quantity: 1 },

    // PO005: Wrench + Caliper (V05) -> Total = 3 * 9800 + 4 * 2200 = 29400 + 8800 = 38,200
    { OrderID: 'PO005', ProductID: 'P13', Quantity: 3 },
    { OrderID: 'PO005', ProductID: 'P14', Quantity: 4 },

    // PO006: Freight + Courier (V06) -> Total = 1 * 22000 + 2 * 6500 = 35,000
    { OrderID: 'PO006', ProductID: 'P17', Quantity: 1 },
    { OrderID: 'PO006', ProductID: 'P18', Quantity: 2 },

    // PO007: Chairs + Layout Design (V01) -> Total = 5 * 6500 + 1 * 12000 = 32500 + 12000 = 44,500
    { OrderID: 'PO007', ProductID: 'P01', Quantity: 5 },
    { OrderID: 'PO007', ProductID: 'P03', Quantity: 1 },

    // PO008: Degreaser + Thermal Grease (V07) -> Total = 4 * 5800 + 6 * 1950 = 23200 + 11700 = 34,900
    { OrderID: 'PO008', ProductID: 'P19', Quantity: 4 },
    { OrderID: 'PO008', ProductID: 'P20', Quantity: 6 },

    // PO009: Cabling Service + Cable Drum (V02) -> Total = 1 * 8500 + 2 * 4200 = 16,900
    { OrderID: 'PO009', ProductID: 'P06', Quantity: 1 },
    { OrderID: 'PO009', ProductID: 'P04', Quantity: 2 },

    // PO010: Machine Rigging + Flanges (V08) -> Total = 1 * 28000 + 2 * 12500 = 53,000
    { OrderID: 'PO010', ProductID: 'P23', Quantity: 1 },
    { OrderID: 'PO010', ProductID: 'P22', Quantity: 2 },

    // PO011: Annual Maintenance (V04) -> Total = 1 * 48000 = 48,000
    { OrderID: 'PO011', ProductID: 'P12', Quantity: 1 },
  ],
  // 1:1 with PURCHASE_ORDER (UNIQUE OrderID constraint)
  PAYMENT: [
    { PaymentID: 'PAY001', OrderID: 'PO001', Amount: 63000, PaymentDate: '2026-09-08', Status: 'Paid' },
    { PaymentID: 'PAY002', OrderID: 'PO002', Amount: 41600, PaymentDate: '2026-09-15', Status: 'Paid' },
    { PaymentID: 'PAY003', OrderID: 'PO003', Amount: 31500, PaymentDate: '2026-09-22', Status: 'Paid' },
    { PaymentID: 'PAY004', OrderID: 'PO004', Amount: 57000, PaymentDate: '2026-09-30', Status: 'Pending' },
    { PaymentID: 'PAY005', OrderID: 'PO005', Amount: 38200, PaymentDate: '2026-10-05', Status: 'Pending' },
    { PaymentID: 'PAY006', OrderID: 'PO006', Amount: 35000, PaymentDate: '2026-10-07', Status: 'Pending' },
    { PaymentID: 'PAY007', OrderID: 'PO007', Amount: 44500, PaymentDate: '2026-10-10', Status: 'Pending' },
    { PaymentID: 'PAY008', OrderID: 'PO008', Amount: 34900, PaymentDate: '2026-10-12', Status: 'Pending' },
  ],
  // Weak Entity PAYMENT_INSTALLMENT (identifying FK PaymentID + partial key InstallmentNo)
  PAYMENT_INSTALLMENT: [
    // PAY001: 63,000 fully paid across 2 installments
    { PaymentID: 'PAY001', InstallmentNo: 1, InstallmentAmount: 30000 },
    { PaymentID: 'PAY001', InstallmentNo: 2, InstallmentAmount: 33000 },

    // PAY002: 41,600 fully paid in 1 installment
    { PaymentID: 'PAY002', InstallmentNo: 1, InstallmentAmount: 41600 },

    // PAY003: 31,500 fully paid across 3 installments
    { PaymentID: 'PAY003', InstallmentNo: 1, InstallmentAmount: 10000 },
    { PaymentID: 'PAY003', InstallmentNo: 2, InstallmentAmount: 10000 },
    { PaymentID: 'PAY003', InstallmentNo: 3, InstallmentAmount: 11500 },

    // PAY004: 57,000 total due, 35,000 paid (Pending balance 22,000)
    { PaymentID: 'PAY004', InstallmentNo: 1, InstallmentAmount: 20000 },
    { PaymentID: 'PAY004', InstallmentNo: 2, InstallmentAmount: 15000 },

    // PAY005: 38,200 total due, 20,000 paid (Pending balance 18,200)
    { PaymentID: 'PAY005', InstallmentNo: 1, InstallmentAmount: 20000 },

    // PAY006: 35,000 total due, 15,000 paid (Pending balance 20,000)
    { PaymentID: 'PAY006', InstallmentNo: 1, InstallmentAmount: 15000 },

    // PAY007: 44,500 total due, 0 paid (no installment yet)
    // PAY008: 34,900 total due, 10,000 paid (Pending balance 24,900)
    { PaymentID: 'PAY008', InstallmentNo: 1, InstallmentAmount: 10000 },
  ],
};

type DbChangeListener = () => void;
type SqlLogListener = (entry: SqlLogEntry) => void;

class RelationalDatabase {
  private data: DatabaseSchema;
  private sqlLogs: SqlLogEntry[] = [];
  private changeListeners: Set<DbChangeListener> = new Set();
  private sqlListeners: Set<SqlLogListener> = new Set();

  constructor() {
    this.data = this.loadDatabase();
    this.sqlLogs = this.loadSqlLogs();
  }

  // Safe localStorage loader
  private loadDatabase(): DatabaseSchema {
    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.VENDOR && parsed.PRODUCT && parsed.PURCHASE_ORDER) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read database from localStorage, initializing seed data:', e);
    }
    this.saveDatabase(SEED_DATA);
    return JSON.parse(JSON.stringify(SEED_DATA));
  }

  private loadSqlLogs(): SqlLogEntry[] {
    try {
      const stored = localStorage.getItem(SQL_LOG_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to read SQL logs from localStorage:', e);
    }
    return [
      {
        id: 'init-1',
        timestamp: new Date().toLocaleTimeString(),
        action: 'SCHEMA',
        sql: '-- Database initialized with 10 tables (3NF normalized)\nSELECT * FROM VENDOR JOIN PINCODE_CITY USING (Pincode);',
      },
    ];
  }

  private saveDatabase(dataToSave: DatabaseSchema = this.data) {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Error saving database to localStorage:', e);
    }
  }

  private saveSqlLogs() {
    try {
      localStorage.setItem(SQL_LOG_STORAGE_KEY, JSON.stringify(this.sqlLogs.slice(-25)));
    } catch (e) {
      console.error('Error saving SQL logs to localStorage:', e);
    }
  }

  // Event dispatchers
  private emitChange() {
    this.saveDatabase();
    this.changeListeners.forEach((listener) => listener());
  }

  public logSql(entry: Omit<SqlLogEntry, 'id' | 'timestamp'>) {
    const fullEntry: SqlLogEntry = {
      ...entry,
      id: 'sql_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleTimeString(),
    };
    this.sqlLogs.unshift(fullEntry);
    if (this.sqlLogs.length > 25) {
      this.sqlLogs = this.sqlLogs.slice(0, 25);
    }
    this.saveSqlLogs();
    this.sqlListeners.forEach((listener) => listener(fullEntry));
  }

  public subscribe(listener: DbChangeListener): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  public subscribeSql(listener: SqlLogListener): () => void {
    this.sqlListeners.add(listener);
    return () => this.sqlListeners.delete(listener);
  }

  public getSqlLogs(): SqlLogEntry[] {
    return [...this.sqlLogs];
  }

  public clearSqlLogs() {
    this.sqlLogs = [];
    this.saveSqlLogs();
    this.emitChange();
  }

  public resetToSampleData() {
    this.data = JSON.parse(JSON.stringify(SEED_DATA));
    this.saveDatabase();
    this.logSql({
      action: 'SCHEMA',
      sql: '/* RELOAD SEED DATA */\nTRUNCATE ALL TABLES;\n-- Re-populated 10 tables with standard seed catalog',
    });
    this.emitChange();
  }

  public exportJson(): string {
    return JSON.stringify(this.data, null, 2);
  }

  public importJson(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.VENDOR || !parsed.PRODUCT || !parsed.PURCHASE_ORDER) {
        throw new Error('Invalid database format: missing core tables.');
      }
      this.data = parsed;
      this.saveDatabase();
      this.logSql({
        action: 'SCHEMA',
        sql: '/* IMPORT EXTERNAL JSON */\n-- Restored database from JSON backup snapshot',
      });
      this.emitChange();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  // ==========================================
  // ID GENERATORS
  // ==========================================
  public generateVendorId(): string {
    const ids = this.data.VENDOR.map((v) => parseInt(v.VendorID.replace('V', ''), 10) || 0);
    const max = ids.length > 0 ? Math.max(...ids) : 0;
    return `V${String(max + 1).padStart(2, '0')}`;
  }

  public generateProductId(): string {
    const ids = this.data.PRODUCT.map((p) => parseInt(p.ProductID.replace('P', ''), 10) || 0);
    const max = ids.length > 0 ? Math.max(...ids) : 0;
    return `P${String(max + 1).padStart(2, '0')}`;
  }

  public generateOrderId(): string {
    const ids = this.data.PURCHASE_ORDER.map((o) => parseInt(o.OrderID.replace('PO', ''), 10) || 0);
    const max = ids.length > 0 ? Math.max(...ids) : 0;
    return `PO${String(max + 1).padStart(3, '0')}`;
  }

  public generatePaymentId(): string {
    const ids = this.data.PAYMENT.map((p) => parseInt(p.PaymentID.replace('PAY', ''), 10) || 0);
    const max = ids.length > 0 ? Math.max(...ids) : 0;
    return `PAY${String(max + 1).padStart(3, '0')}`;
  }

  // ==========================================
  // 3NF FUNCTIONAL DEPENDENCY: PINCODE -> CITY
  // ==========================================
  public getCityByPincode(pincode: string): string | undefined {
    const match = this.data.PINCODE_CITY.find((pc) => pc.Pincode === pincode.trim());
    return match?.City;
  }

  public ensurePincodeCity(pincode: string, city: string) {
    const cleanPin = pincode.trim();
    const cleanCity = city.trim();
    const existing = this.data.PINCODE_CITY.find((pc) => pc.Pincode === cleanPin);
    if (!existing) {
      this.data.PINCODE_CITY.push({ Pincode: cleanPin, City: cleanCity });
      this.logSql({
        action: 'INSERT',
        table: 'PINCODE_CITY',
        sql: `INSERT INTO PINCODE_CITY (Pincode, City) VALUES ('${cleanPin}', '${cleanCity}');`,
      });
    } else if (existing.City.toLowerCase() !== cleanCity.toLowerCase()) {
      existing.City = cleanCity;
      this.logSql({
        action: 'UPDATE',
        table: 'PINCODE_CITY',
        sql: `UPDATE PINCODE_CITY SET City = '${cleanCity}' WHERE Pincode = '${cleanPin}';`,
      });
    }
  }

  // ==========================================
  // DERIVED ATTRIBUTES
  // ==========================================
  // PURCHASE_ORDER.TotalCost = SUM(Product.Price * Contains.Quantity)
  // Never stored directly; dynamically derived.
  public calculateOrderTotalCost(orderId: string): number {
    const items = this.data.CONTAINS.filter((c) => c.OrderID === orderId);
    let total = 0;
    for (const item of items) {
      const prod = this.data.PRODUCT.find((p) => p.ProductID === item.ProductID);
      if (prod) {
        total += prod.Price * item.Quantity;
      }
    }
    return total;
  }

  public getPaymentInstallmentsSum(paymentId: string): number {
    return this.data.PAYMENT_INSTALLMENT
      .filter((pi) => pi.PaymentID === paymentId)
      .reduce((sum, pi) => sum + pi.InstallmentAmount, 0);
  }

  // ==========================================
  // VENDOR OPERATIONS
  // ==========================================
  public getVendors(): VendorWithDetails[] {
    return this.data.VENDOR.map((v) => {
      const city = this.getCityByPincode(v.Pincode) || 'Unknown';
      const contacts = this.data.VENDOR_CONTACT.filter((vc) => vc.VendorID === v.VendorID).map((vc) => vc.ContactNo);
      const productCount = this.data.PRODUCT.filter((p) => p.VendorID === v.VendorID).length;
      const orders = this.data.PURCHASE_ORDER.filter((o) => o.VendorID === v.VendorID);
      const orderCount = orders.length;

      let totalBilled = 0;
      let totalPaid = 0;

      for (const order of orders) {
        const orderTotal = this.calculateOrderTotalCost(order.OrderID);
        totalBilled += orderTotal;
        const payment = this.data.PAYMENT.find((pay) => pay.OrderID === order.OrderID);
        if (payment) {
          const paidInstallments = this.getPaymentInstallmentsSum(payment.PaymentID);
          totalPaid += paidInstallments;
        }
      }

      return {
        ...v,
        City: city,
        Contacts: contacts,
        ProductCount: productCount,
        OrderCount: orderCount,
        TotalBilled: totalBilled,
        TotalPaid: totalPaid,
        TotalOutstanding: Math.max(0, totalBilled - totalPaid),
      };
    });
  }

  public addVendor(vendorData: {
    VendorName: string;
    Category: string;
    Street: string;
    Pincode: string;
    City: string;
    Contacts: string[];
  }): { success: boolean; vendorId?: string; error?: string } {
    try {
      // Input Validation
      if (!vendorData.VendorName.trim()) throw new Error('Vendor Name is required.');
      if (!vendorData.Category.trim()) throw new Error('Category is required.');
      if (!vendorData.Street.trim()) throw new Error('Street address is required.');
      if (!/^\d{6}$/.test(vendorData.Pincode.trim())) throw new Error('Pincode must be exactly 6 digits.');
      if (!vendorData.City.trim()) throw new Error('City is required.');
      if (!vendorData.Contacts || vendorData.Contacts.length === 0) throw new Error('At least one contact number is required.');

      for (const contact of vendorData.Contacts) {
        if (!/^\d{10}$/.test(contact.trim())) {
          throw new Error(`Contact number '${contact}' must be a valid 10-digit number.`);
        }
      }

      // 1. Maintain 3NF: Ensure PINCODE_CITY row exists
      this.ensurePincodeCity(vendorData.Pincode, vendorData.City);

      // 2. Generate and Insert VENDOR
      const vendorId = this.generateVendorId();
      const newVendor: VendorRow = {
        VendorID: vendorId,
        VendorName: vendorData.VendorName.trim(),
        Category: vendorData.Category.trim(),
        Street: vendorData.Street.trim(),
        Pincode: vendorData.Pincode.trim(),
      };

      this.data.VENDOR.push(newVendor);
      this.logSql({
        action: 'INSERT',
        table: 'VENDOR',
        sql: `INSERT INTO VENDOR (VendorID, VendorName, Category, Street, Pincode)\nVALUES ('${vendorId}', '${newVendor.VendorName.replace(/'/g, "''")}', '${newVendor.Category.replace(/'/g, "''")}', '${newVendor.Street.replace(/'/g, "''")}', '${newVendor.Pincode}');`,
      });

      // 3. Insert VENDOR_CONTACT multi-valued entries (Composite PK: VendorID + ContactNo)
      const uniqueContacts = Array.from(new Set(vendorData.Contacts.map((c) => c.trim())));
      for (const c of uniqueContacts) {
        this.data.VENDOR_CONTACT.push({
          VendorID: vendorId,
          ContactNo: c,
        });
        this.logSql({
          action: 'INSERT',
          table: 'VENDOR_CONTACT',
          sql: `INSERT INTO VENDOR_CONTACT (VendorID, ContactNo) VALUES ('${vendorId}', '${c}');`,
        });
      }

      this.emitChange();
      return { success: true, vendorId };
    } catch (err: any) {
      this.logSql({
        action: 'VIOLATION',
        table: 'VENDOR',
        isError: true,
        errorMessage: err.message,
        sql: `-- Constraint violation on VENDOR insert:\n-- ${err.message}`,
      });
      return { success: false, error: err.message };
    }
  }

  public updateVendor(
    vendorId: string,
    updates: {
      VendorName: string;
      Category: string;
      Street: string;
      Pincode: string;
      City: string;
      Contacts: string[];
    }
  ): { success: boolean; error?: string } {
    try {
      const vendor = this.data.VENDOR.find((v) => v.VendorID === vendorId);
      if (!vendor) throw new Error(`Vendor '${vendorId}' not found.`);

      if (!updates.VendorName.trim()) throw new Error('Vendor Name is required.');
      if (!updates.Category.trim()) throw new Error('Category is required.');
      if (!updates.Street.trim()) throw new Error('Street address is required.');
      if (!/^\d{6}$/.test(updates.Pincode.trim())) throw new Error('Pincode must be exactly 6 digits.');
      if (!updates.City.trim()) throw new Error('City is required.');
      if (!updates.Contacts || updates.Contacts.length === 0) throw new Error('At least one contact is required.');

      // 1. Ensure Pincode City
      this.ensurePincodeCity(updates.Pincode, updates.City);

      // 2. Update Vendor
      vendor.VendorName = updates.VendorName.trim();
      vendor.Category = updates.Category.trim();
      vendor.Street = updates.Street.trim();
      vendor.Pincode = updates.Pincode.trim();

      this.logSql({
        action: 'UPDATE',
        table: 'VENDOR',
        sql: `UPDATE VENDOR\nSET VendorName = '${vendor.VendorName.replace(/'/g, "''")}', Category = '${vendor.Category.replace(/'/g, "''")}', Street = '${vendor.Street.replace(/'/g, "''")}', Pincode = '${vendor.Pincode}'\nWHERE VendorID = '${vendorId}';`,
      });

      // 3. Update VENDOR_CONTACT (delete existing and insert updated)
      this.data.VENDOR_CONTACT = this.data.VENDOR_CONTACT.filter((vc) => vc.VendorID !== vendorId);
      const uniqueContacts = Array.from(new Set(updates.Contacts.map((c) => c.trim())));
      for (const c of uniqueContacts) {
        this.data.VENDOR_CONTACT.push({
          VendorID: vendorId,
          ContactNo: c,
        });
      }
      this.logSql({
        action: 'UPDATE',
        table: 'VENDOR_CONTACT',
        sql: `DELETE FROM VENDOR_CONTACT WHERE VendorID = '${vendorId}';\n-- Re-inserted ${uniqueContacts.length} contact rows for ${vendorId}`,
      });

      this.emitChange();
      return { success: true };
    } catch (err: any) {
      this.logSql({
        action: 'VIOLATION',
        table: 'VENDOR',
        isError: true,
        errorMessage: err.message,
        sql: `-- Constraint violation on VENDOR update:\n-- ${err.message}`,
      });
      return { success: false, error: err.message };
    }
  }

  // Delete VENDOR with RESTRICT if orders exist, else CASCADE to contacts & products
  public deleteVendor(vendorId: string): { success: boolean; error?: string } {
    try {
      // 1. RESTRICT check: Has any purchase orders?
      const existingOrders = this.data.PURCHASE_ORDER.filter((o) => o.VendorID === vendorId);
      if (existingOrders.length > 0) {
        const orderIds = existingOrders.map((o) => o.OrderID).join(', ');
        throw new Error(
          `FOREIGN KEY RESTRICT: Cannot delete vendor '${vendorId}' because active Purchase Orders (${orderIds}) reference it.`
        );
      }

      // 2. CASCADE to VENDOR_CONTACT
      const contactsToDelete = this.data.VENDOR_CONTACT.filter((vc) => vc.VendorID === vendorId).length;
      this.data.VENDOR_CONTACT = this.data.VENDOR_CONTACT.filter((vc) => vc.VendorID !== vendorId);

      // 3. CASCADE to PRODUCT (and through product to GOODS and SERVICE)
      const productsToDelete = this.data.PRODUCT.filter((p) => p.VendorID === vendorId);
      for (const prod of productsToDelete) {
        this.data.GOODS = this.data.GOODS.filter((g) => g.ProductID !== prod.ProductID);
        this.data.SERVICE = this.data.SERVICE.filter((s) => s.ProductID !== prod.ProductID);
      }
      this.data.PRODUCT = this.data.PRODUCT.filter((p) => p.VendorID !== vendorId);

      // 4. Delete VENDOR row
      this.data.VENDOR = this.data.VENDOR.filter((v) => v.VendorID !== vendorId);

      this.logSql({
        action: 'DELETE',
        table: 'VENDOR',
        sql: `DELETE FROM VENDOR WHERE VendorID = '${vendorId}';\n-- CASCADE deleted ${contactsToDelete} contact(s) and ${productsToDelete.length} product(s) along with their subtype records`,
      });

      this.emitChange();
      return { success: true };
    } catch (err: any) {
      this.logSql({
        action: 'VIOLATION',
        table: 'VENDOR',
        isError: true,
        errorMessage: err.message,
        sql: `-- Constraint violation on DELETE VENDOR:\n-- ${err.message}`,
      });
      return { success: false, error: err.message };
    }
  }

  // ==========================================
  // PRODUCT OPERATIONS (DISJOINT SPECIALIZATION: GOODS / SERVICE)
  // ==========================================
  public getProducts(): ProductWithDetails[] {
    return this.data.PRODUCT.map((p) => {
      const vendor = this.data.VENDOR.find((v) => v.VendorID === p.VendorID);
      const goods = this.data.GOODS.find((g) => g.ProductID === p.ProductID);
      const service = this.data.SERVICE.find((s) => s.ProductID === p.ProductID);

      const type: 'Goods' | 'Service' = goods ? 'Goods' : 'Service';

      return {
        ...p,
        VendorName: vendor?.VendorName || 'Unknown Vendor',
        VendorCategory: vendor?.Category || '',
        Type: type,
        HSNCode: goods?.HSNCode,
        ServiceHours: service?.ServiceHours,
      };
    });
  }

  public addProduct(productData: {
    ProductName: string;
    Price: number;
    VendorID: string;
    Type: 'Goods' | 'Service';
    HSNCode?: string;
    ServiceHours?: number;
  }): { success: boolean; productId?: string; error?: string } {
    try {
      if (!productData.ProductName.trim()) throw new Error('Product Name is required.');
      if (productData.Price <= 0) throw new Error('CHECK CONSTRAINT VIOLATION: Price must be greater than 0.');

      // FK Check
      const vendor = this.data.VENDOR.find((v) => v.VendorID === productData.VendorID);
      if (!vendor) throw new Error(`FOREIGN KEY VIOLATION: VendorID '${productData.VendorID}' does not exist.`);

      // Disjoint specialization validation
      if (productData.Type === 'Goods') {
        if (!productData.HSNCode || !/^\d{4,8}$/.test(productData.HSNCode.trim())) {
          throw new Error('HSN Code for Goods must be a 4 to 8 digit numeric string.');
        }
      } else {
        if (!productData.ServiceHours || productData.ServiceHours <= 0) {
          throw new Error('Service Hours must be a positive number.');
        }
      }

      const productId = this.generateProductId();
      const newProduct: ProductRow = {
        ProductID: productId,
        ProductName: productData.ProductName.trim(),
        Price: Number(productData.Price),
        VendorID: productData.VendorID,
      };

      // Insert base product
      this.data.PRODUCT.push(newProduct);
      this.logSql({
        action: 'INSERT',
        table: 'PRODUCT',
        sql: `INSERT INTO PRODUCT (ProductID, ProductName, Price, VendorID)\nVALUES ('${productId}', '${newProduct.ProductName.replace(/'/g, "''")}', ${newProduct.Price}, '${newProduct.VendorID}');`,
      });

      // Insert subtype row (disjoint specialization)
      if (productData.Type === 'Goods') {
        this.data.GOODS.push({
          ProductID: productId,
          HSNCode: productData.HSNCode!.trim(),
        });
        this.logSql({
          action: 'INSERT',
          table: 'GOODS',
          sql: `INSERT INTO GOODS (ProductID, HSNCode) VALUES ('${productId}', '${productData.HSNCode!.trim()}');`,
        });
      } else {
        this.data.SERVICE.push({
          ProductID: productId,
          ServiceHours: Number(productData.ServiceHours),
        });
        this.logSql({
          action: 'INSERT',
          table: 'SERVICE',
          sql: `INSERT INTO SERVICE (ProductID, ServiceHours) VALUES ('${productId}', ${productData.ServiceHours});`,
        });
      }

      this.emitChange();
      return { success: true, productId };
    } catch (err: any) {
      this.logSql({
        action: 'VIOLATION',
        table: 'PRODUCT',
        isError: true,
        errorMessage: err.message,
        sql: `-- Constraint violation on PRODUCT insert:\n-- ${err.message}`,
      });
      return { success: false, error: err.message };
    }
  }

  public updateProduct(
    productId: string,
    updates: {
      ProductName: string;
      Price: number;
      VendorID: string;
      Type: 'Goods' | 'Service';
      HSNCode?: string;
      ServiceHours?: number;
    }
  ): { success: boolean; error?: string } {
    try {
      const prod = this.data.PRODUCT.find((p) => p.ProductID === productId);
      if (!prod) throw new Error(`Product '${productId}' not found.`);

      if (!updates.ProductName.trim()) throw new Error('Product Name is required.');
      if (updates.Price <= 0) throw new Error('CHECK CONSTRAINT VIOLATION: Price must be greater than 0.');

      const vendor = this.data.VENDOR.find((v) => v.VendorID === updates.VendorID);
      if (!vendor) throw new Error(`FOREIGN KEY VIOLATION: VendorID '${updates.VendorID}' does not exist.`);

      prod.ProductName = updates.ProductName.trim();
      prod.Price = Number(updates.Price);
      prod.VendorID = updates.VendorID;

      this.logSql({
        action: 'UPDATE',
        table: 'PRODUCT',
        sql: `UPDATE PRODUCT\nSET ProductName = '${prod.ProductName.replace(/'/g, "''")}', Price = ${prod.Price}, VendorID = '${prod.VendorID}'\nWHERE ProductID = '${productId}';`,
      });

      // Specialization transition: Remove from both, add to selected
      this.data.GOODS = this.data.GOODS.filter((g) => g.ProductID !== productId);
      this.data.SERVICE = this.data.SERVICE.filter((s) => s.ProductID !== productId);

      if (updates.Type === 'Goods') {
        if (!updates.HSNCode || !/^\d{4,8}$/.test(updates.HSNCode.trim())) {
          throw new Error('HSN Code for Goods must be 4 to 8 digits.');
        }
        this.data.GOODS.push({
          ProductID: productId,
          HSNCode: updates.HSNCode.trim(),
        });
        this.logSql({
          action: 'UPDATE',
          table: 'GOODS',
          sql: `DELETE FROM SERVICE WHERE ProductID = '${productId}';\nINSERT INTO GOODS (ProductID, HSNCode) VALUES ('${productId}', '${updates.HSNCode.trim()}');`,
        });
      } else {
        if (!updates.ServiceHours || updates.ServiceHours <= 0) {
          throw new Error('Service Hours must be greater than 0.');
        }
        this.data.SERVICE.push({
          ProductID: productId,
          ServiceHours: Number(updates.ServiceHours),
        });
        this.logSql({
          action: 'UPDATE',
          table: 'SERVICE',
          sql: `DELETE FROM GOODS WHERE ProductID = '${productId}';\nINSERT INTO SERVICE (ProductID, ServiceHours) VALUES ('${productId}', ${updates.ServiceHours});`,
        });
      }

      this.emitChange();
      return { success: true };
    } catch (err: any) {
      this.logSql({
        action: 'VIOLATION',
        table: 'PRODUCT',
        isError: true,
        errorMessage: err.message,
        sql: `-- Constraint violation on PRODUCT update:\n-- ${err.message}`,
      });
      return { success: false, error: err.message };
    }
  }

  // Delete PRODUCT: RESTRICT if it appears in any CONTAINS row; otherwise CASCADE to GOODS/SERVICE
  public deleteProduct(productId: string): { success: boolean; error?: string } {
    try {
      // 1. RESTRICT check
      const containsRows = this.data.CONTAINS.filter((c) => c.ProductID === productId);
      if (containsRows.length > 0) {
        const orderIds = Array.from(new Set(containsRows.map((c) => c.OrderID))).join(', ');
        throw new Error(
          `FOREIGN KEY RESTRICT: Cannot delete product '${productId}' because it is part of Purchase Orders (${orderIds}).`
        );
      }

      // 2. CASCADE to GOODS / SERVICE
      this.data.GOODS = this.data.GOODS.filter((g) => g.ProductID !== productId);
      this.data.SERVICE = this.data.SERVICE.filter((s) => s.ProductID !== productId);

      // 3. Delete from PRODUCT
      this.data.PRODUCT = this.data.PRODUCT.filter((p) => p.ProductID !== productId);

      this.logSql({
        action: 'DELETE',
        table: 'PRODUCT',
        sql: `DELETE FROM PRODUCT WHERE ProductID = '${productId}';\n-- CASCADE removed specialization rows from GOODS/SERVICE`,
      });

      this.emitChange();
      return { success: true };
    } catch (err: any) {
      this.logSql({
        action: 'VIOLATION',
        table: 'PRODUCT',
        isError: true,
        errorMessage: err.message,
        sql: `-- Constraint violation on DELETE PRODUCT:\n-- ${err.message}`,
      });
      return { success: false, error: err.message };
    }
  }

  // ==========================================
  // PURCHASE ORDER OPERATIONS
  // ==========================================
  public getPurchaseOrders(): PurchaseOrderWithDetails[] {
    return this.data.PURCHASE_ORDER.map((po) => {
      const vendor = this.data.VENDOR.find((v) => v.VendorID === po.VendorID);
      const vendorCity = vendor ? this.getCityByPincode(vendor.Pincode) || '' : '';

      const contains = this.data.CONTAINS.filter((c) => c.OrderID === po.OrderID);
      const items = contains.map((c) => {
        const product = this.data.PRODUCT.find((p) => p.ProductID === c.ProductID);
        const price = product?.Price || 0;
        return {
          ProductID: c.ProductID,
          ProductName: product?.ProductName || 'Unknown Product',
          Price: price,
          Quantity: c.Quantity,
          LineTotal: price * c.Quantity,
        };
      });

      const totalCost = items.reduce((sum, item) => sum + item.LineTotal, 0);
      const payment = this.data.PAYMENT.find((pay) => pay.OrderID === po.OrderID);
      const installmentsSum = payment ? this.getPaymentInstallmentsSum(payment.PaymentID) : 0;

      let paymentStatus: 'Not Created' | 'Pending' | 'Paid' = 'Not Created';
      if (payment) {
        paymentStatus = payment.Status;
      }

      return {
        ...po,
        VendorName: vendor?.VendorName || 'Unknown Vendor',
        VendorCategory: vendor?.Category || '',
        VendorCity: vendorCity,
        Items: items,
        TotalCost: totalCost,
        Payment: payment,
        InstallmentsSum: installmentsSum,
        PaymentStatus: paymentStatus,
      };
    });
  }

  public createPurchaseOrder(orderData: {
    VendorID: string;
    OrderDate: string;
    Items: { ProductID: string; Quantity: number }[];
  }): { success: boolean; orderId?: string; error?: string } {
    try {
      // 1. FK check
      const vendor = this.data.VENDOR.find((v) => v.VendorID === orderData.VendorID);
      if (!vendor) throw new Error(`FOREIGN KEY VIOLATION: VendorID '${orderData.VendorID}' does not exist.`);

      if (!orderData.OrderDate) throw new Error('Order Date is required.');
      if (!orderData.Items || orderData.Items.length === 0) throw new Error('Purchase Order must have at least one line item.');

      // 2. Validate Items:
      // Business Rule: Product added must belong to the SAME vendor as the order
      // Quantity CHECK constraint > 0
      for (const item of orderData.Items) {
        if (item.Quantity <= 0 || !Number.isInteger(item.Quantity)) {
          throw new Error('CHECK CONSTRAINT VIOLATION: Quantity must be a positive integer.');
        }
        const prod = this.data.PRODUCT.find((p) => p.ProductID === item.ProductID);
        if (!prod) throw new Error(`FOREIGN KEY VIOLATION: Product '${item.ProductID}' does not exist.`);
        if (prod.VendorID !== orderData.VendorID) {
          throw new Error(
            `BUSINESS RULE VIOLATION: Product '${prod.ProductName}' (${item.ProductID}) belongs to vendor ${prod.VendorID}, but order is for vendor ${orderData.VendorID}.`
          );
        }
      }

      const orderId = this.generateOrderId();
      const newOrder: PurchaseOrderRow = {
        OrderID: orderId,
        OrderDate: orderData.OrderDate,
        Status: 'Pending',
        VendorID: orderData.VendorID,
      };

      // Insert into PURCHASE_ORDER
      this.data.PURCHASE_ORDER.push(newOrder);
      this.logSql({
        action: 'INSERT',
        table: 'PURCHASE_ORDER',
        sql: `INSERT INTO PURCHASE_ORDER (OrderID, OrderDate, Status, VendorID)\nVALUES ('${orderId}', '${newOrder.OrderDate}', 'Pending', '${newOrder.VendorID}');`,
      });

      // Insert into CONTAINS (Composite PK: OrderID + ProductID)
      for (const item of orderData.Items) {
        this.data.CONTAINS.push({
          OrderID: orderId,
          ProductID: item.ProductID,
          Quantity: item.Quantity,
        });
        this.logSql({
          action: 'INSERT',
          table: 'CONTAINS',
          sql: `INSERT INTO CONTAINS (OrderID, ProductID, Quantity) VALUES ('${orderId}', '${item.ProductID}', ${item.Quantity});`,
        });
      }

      this.emitChange();
      return { success: true, orderId };
    } catch (err: any) {
      this.logSql({
        action: 'VIOLATION',
        table: 'PURCHASE_ORDER',
        isError: true,
        errorMessage: err.message,
        sql: `-- Constraint violation on PURCHASE_ORDER creation:\n-- ${err.message}`,
      });
      return { success: false, error: err.message };
    }
  }

  public updateOrderStatus(orderId: string, status: OrderStatus): { success: boolean; error?: string } {
    try {
      const order = this.data.PURCHASE_ORDER.find((o) => o.OrderID === orderId);
      if (!order) throw new Error(`Order '${orderId}' not found.`);

      order.Status = status;
      this.logSql({
        action: 'UPDATE',
        table: 'PURCHASE_ORDER',
        sql: `UPDATE PURCHASE_ORDER SET Status = '${status}' WHERE OrderID = '${orderId}';`,
      });

      this.emitChange();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public updateOrderItems(
    orderId: string,
    items: { ProductID: string; Quantity: number }[]
  ): { success: boolean; error?: string } {
    try {
      const order = this.data.PURCHASE_ORDER.find((o) => o.OrderID === orderId);
      if (!order) throw new Error(`Order '${orderId}' not found.`);

      if (order.Status === 'Delivered') {
        throw new Error('LOCK VIOLATION: Delivered orders cannot be edited.');
      }

      if (!items || items.length === 0) throw new Error('Order must contain at least one item.');

      for (const item of items) {
        if (item.Quantity <= 0 || !Number.isInteger(item.Quantity)) {
          throw new Error('CHECK CONSTRAINT VIOLATION: Quantity must be a positive integer.');
        }
        const prod = this.data.PRODUCT.find((p) => p.ProductID === item.ProductID);
        if (!prod) throw new Error(`Product '${item.ProductID}' does not exist.`);
        if (prod.VendorID !== order.VendorID) {
          throw new Error('Business Rule: All items must belong to the order vendor.');
        }
      }

      // Replace CONTAINS rows
      this.data.CONTAINS = this.data.CONTAINS.filter((c) => c.OrderID !== orderId);
      for (const item of items) {
        this.data.CONTAINS.push({
          OrderID: orderId,
          ProductID: item.ProductID,
          Quantity: item.Quantity,
        });
      }

      this.logSql({
        action: 'UPDATE',
        table: 'CONTAINS',
        sql: `DELETE FROM CONTAINS WHERE OrderID = '${orderId}';\n-- Re-inserted updated line items for order ${orderId}`,
      });

      this.emitChange();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // Delete PURCHASE_ORDER: CASCADE to CONTAINS, PAYMENT, and PAYMENT_INSTALLMENT
  public deletePurchaseOrder(orderId: string): { success: boolean; error?: string } {
    try {
      // 1. Find linked payment to cascade installments
      const linkedPayment = this.data.PAYMENT.find((p) => p.OrderID === orderId);
      if (linkedPayment) {
        this.data.PAYMENT_INSTALLMENT = this.data.PAYMENT_INSTALLMENT.filter(
          (pi) => pi.PaymentID !== linkedPayment.PaymentID
        );
        this.data.PAYMENT = this.data.PAYMENT.filter((p) => p.PaymentID !== linkedPayment.PaymentID);
      }

      // 2. Cascade delete from CONTAINS
      const containsCount = this.data.CONTAINS.filter((c) => c.OrderID === orderId).length;
      this.data.CONTAINS = this.data.CONTAINS.filter((c) => c.OrderID !== orderId);

      // 3. Delete from PURCHASE_ORDER
      this.data.PURCHASE_ORDER = this.data.PURCHASE_ORDER.filter((o) => o.OrderID !== orderId);

      this.logSql({
        action: 'DELETE',
        table: 'PURCHASE_ORDER',
        sql: `DELETE FROM PURCHASE_ORDER WHERE OrderID = '${orderId}';\n-- CASCADE deleted ${containsCount} CONTAINS row(s) and linked payment & installments`,
      });

      this.emitChange();
      return { success: true };
    } catch (err: any) {
      this.logSql({
        action: 'VIOLATION',
        table: 'PURCHASE_ORDER',
        isError: true,
        errorMessage: err.message,
        sql: `-- Constraint violation on DELETE PURCHASE_ORDER:\n-- ${err.message}`,
      });
      return { success: false, error: err.message };
    }
  }

  // ==========================================
  // PAYMENT & WEAK ENTITY INSTALLMENT OPERATIONS
  // ==========================================
  public getPayments(): PaymentWithDetails[] {
    return this.data.PAYMENT.map((pay) => {
      const order = this.data.PURCHASE_ORDER.find((o) => o.OrderID === pay.OrderID);
      const vendor = order ? this.data.VENDOR.find((v) => v.VendorID === order.VendorID) : null;
      const orderTotal = order ? this.calculateOrderTotalCost(order.OrderID) : 0;
      const installments = this.data.PAYMENT_INSTALLMENT.filter((pi) => pi.PaymentID === pay.PaymentID);
      const installmentsSum = installments.reduce((sum, pi) => sum + pi.InstallmentAmount, 0);

      return {
        ...pay,
        VendorID: vendor?.VendorID || '',
        VendorName: vendor?.VendorName || 'Unknown Vendor',
        OrderDate: order?.OrderDate || '',
        OrderStatus: order?.Status || 'Pending',
        OrderTotalCost: orderTotal,
        Installments: installments,
        InstallmentsSum: installmentsSum,
        RemainingBalance: Math.max(0, pay.Amount - installmentsSum),
      };
    });
  }

  public recordPayment(paymentData: {
    OrderID: string;
    Amount: number;
    PaymentDate: string;
    Installments?: number[];
  }): { success: boolean; paymentId?: string; error?: string } {
    try {
      // 1. FK check
      const order = this.data.PURCHASE_ORDER.find((o) => o.OrderID === paymentData.OrderID);
      if (!order) throw new Error(`FOREIGN KEY VIOLATION: OrderID '${paymentData.OrderID}' does not exist.`);

      // 2. UNIQUE constraint on OrderID (One-to-one relationship)
      const existingPayment = this.data.PAYMENT.find((p) => p.OrderID === paymentData.OrderID);
      if (existingPayment) {
        throw new Error(`UNIQUE CONSTRAINT VIOLATION: A payment record (${existingPayment.PaymentID}) already exists for Order '${paymentData.OrderID}'.`);
      }

      // 3. CHECK constraint: Amount > 0 and Amount <= derived TotalCost
      const derivedTotalCost = this.calculateOrderTotalCost(order.OrderID);
      if (paymentData.Amount <= 0) {
        throw new Error('CHECK CONSTRAINT VIOLATION: Payment Amount must be greater than 0.');
      }
      if (paymentData.Amount > derivedTotalCost) {
        throw new Error(
          `BUSINESS RULE VIOLATION: Payment Amount (₹${paymentData.Amount}) cannot exceed Order's Derived TotalCost (₹${derivedTotalCost}).`
        );
      }

      // 4. Validate Installments
      const installmentsList = paymentData.Installments || [];
      const sumInstallments = installmentsList.reduce((a, b) => a + b, 0);
      if (sumInstallments > paymentData.Amount) {
        throw new Error(
          `BUSINESS RULE VIOLATION: Sum of installments (₹${sumInstallments}) cannot exceed total payment Amount (₹${paymentData.Amount}).`
        );
      }

      // Automatic Status Rule:
      // Automatically set to 'Paid' when installments sum equals Amount, otherwise 'Pending'
      const status: PaymentStatus = sumInstallments === paymentData.Amount && paymentData.Amount > 0 ? 'Paid' : 'Pending';

      const paymentId = this.generatePaymentId();
      const newPayment: PaymentRow = {
        PaymentID: paymentId,
        OrderID: paymentData.OrderID,
        Amount: Number(paymentData.Amount),
        PaymentDate: paymentData.PaymentDate,
        Status: status,
      };

      // Insert PAYMENT
      this.data.PAYMENT.push(newPayment);
      this.logSql({
        action: 'INSERT',
        table: 'PAYMENT',
        sql: `INSERT INTO PAYMENT (PaymentID, Amount, PaymentDate, Status, OrderID)\nVALUES ('${paymentId}', ${newPayment.Amount}, '${newPayment.PaymentDate}', '${newPayment.Status}', '${newPayment.OrderID}');`,
      });

      // Insert PAYMENT_INSTALLMENT (Weak entity)
      installmentsList.forEach((amt, index) => {
        if (amt > 0) {
          this.data.PAYMENT_INSTALLMENT.push({
            PaymentID: paymentId,
            InstallmentNo: index + 1,
            InstallmentAmount: amt,
          });
          this.logSql({
            action: 'INSERT',
            table: 'PAYMENT_INSTALLMENT',
            sql: `INSERT INTO PAYMENT_INSTALLMENT (PaymentID, InstallmentNo, InstallmentAmount) VALUES ('${paymentId}', ${index + 1}, ${amt});`,
          });
        }
      });

      this.emitChange();
      return { success: true, paymentId };
    } catch (err: any) {
      this.logSql({
        action: 'VIOLATION',
        table: 'PAYMENT',
        isError: true,
        errorMessage: err.message,
        sql: `-- Constraint violation on PAYMENT insert:\n-- ${err.message}`,
      });
      return { success: false, error: err.message };
    }
  }

  public addInstallment(paymentId: string, amount: number): { success: boolean; error?: string } {
    try {
      const payment = this.data.PAYMENT.find((p) => p.PaymentID === paymentId);
      if (!payment) throw new Error(`Payment '${paymentId}' not found.`);

      if (amount <= 0) throw new Error('Installment amount must be greater than 0.');

      const currentSum = this.getPaymentInstallmentsSum(paymentId);
      if (currentSum + amount > payment.Amount) {
        throw new Error(
          `Installment of ₹${amount} exceeds remaining balance of ₹${payment.Amount - currentSum}.`
        );
      }

      // Weak entity: next InstallmentNo discriminator
      const existingInstallments = this.data.PAYMENT_INSTALLMENT.filter((pi) => pi.PaymentID === paymentId);
      const nextNo = existingInstallments.length + 1;

      this.data.PAYMENT_INSTALLMENT.push({
        PaymentID: paymentId,
        InstallmentNo: nextNo,
        InstallmentAmount: amount,
      });

      this.logSql({
        action: 'INSERT',
        table: 'PAYMENT_INSTALLMENT',
        sql: `INSERT INTO PAYMENT_INSTALLMENT (PaymentID, InstallmentNo, InstallmentAmount)\nVALUES ('${paymentId}', ${nextNo}, ${amount});`,
      });

      // Update payment status automatically
      const newSum = currentSum + amount;
      if (newSum === payment.Amount) {
        payment.Status = 'Paid';
        this.logSql({
          action: 'UPDATE',
          table: 'PAYMENT',
          sql: `UPDATE PAYMENT SET Status = 'Paid' WHERE PaymentID = '${paymentId}'; -- Full balance satisfied`,
        });
      }

      this.emitChange();
      return { success: true };
    } catch (err: any) {
      this.logSql({
        action: 'VIOLATION',
        table: 'PAYMENT_INSTALLMENT',
        isError: true,
        errorMessage: err.message,
        sql: `-- Constraint violation on installment insert:\n-- ${err.message}`,
      });
      return { success: false, error: err.message };
    }
  }

  // Delete PAYMENT: CASCADE to PAYMENT_INSTALLMENT
  public deletePayment(paymentId: string): { success: boolean; error?: string } {
    try {
      const installmentCount = this.data.PAYMENT_INSTALLMENT.filter((pi) => pi.PaymentID === paymentId).length;
      this.data.PAYMENT_INSTALLMENT = this.data.PAYMENT_INSTALLMENT.filter((pi) => pi.PaymentID !== paymentId);
      this.data.PAYMENT = this.data.PAYMENT.filter((p) => p.PaymentID !== paymentId);

      this.logSql({
        action: 'DELETE',
        table: 'PAYMENT',
        sql: `DELETE FROM PAYMENT WHERE PaymentID = '${paymentId}';\n-- CASCADE deleted ${installmentCount} weak entity installment(s)`,
      });

      this.emitChange();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

// Singleton database instance exported across the application
export const db = new RelationalDatabase();
