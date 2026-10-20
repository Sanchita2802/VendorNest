// SQL utility functions and query definitions for VendorNest

export function formatSql(sql: string): string {
  return sql.trim();
}

// Prebuilt analytical and multi-table queries for Schema Explorer demo
export interface PrebuiltQuery {
  id: string;
  title: string;
  description: string;
  sql: string;
  category: 'Join' | 'Aggregate' | 'Subquery' | 'Specialization' | 'Weak Entity';
}

export const PREBUILT_QUERIES: PrebuiltQuery[] = [
  {
    id: 'q1',
    title: 'Vendor Directory with City (3NF Join)',
    description: 'Demonstrates resolution of the transitive dependency via PINCODE_CITY join',
    category: 'Join',
    sql: `SELECT v.VendorID, v.VendorName, v.Category, v.Street, v.Pincode, pc.City
FROM VENDOR v
INNER JOIN PINCODE_CITY pc ON v.Pincode = pc.Pincode
ORDER BY v.VendorID;`,
  },
  {
    id: 'q2',
    title: 'Derived TotalCost per Purchase Order',
    description: 'Computes derived attribute TotalCost = SUM(Price * Quantity) with GROUP BY',
    category: 'Aggregate',
    sql: `SELECT po.OrderID, po.OrderDate, po.Status, v.VendorName,
       COUNT(c.ProductID) AS ItemCount,
       SUM(p.Price * c.Quantity) AS DerivedTotalCost
FROM PURCHASE_ORDER po
JOIN VENDOR v ON po.VendorID = v.VendorID
JOIN CONTAINS c ON po.OrderID = c.OrderID
JOIN PRODUCT p ON c.ProductID = p.ProductID
GROUP BY po.OrderID, po.OrderDate, po.Status, v.VendorName
ORDER BY DerivedTotalCost DESC;`,
  },
  {
    id: 'q3',
    title: 'Disjoint Specialization: Goods vs Services',
    description: 'Shows full product catalog joined with subtype tables (HSNCode or ServiceHours)',
    category: 'Specialization',
    sql: `SELECT p.ProductID, p.ProductName, p.Price, v.VendorName,
       CASE 
         WHEN g.HSNCode IS NOT NULL THEN 'Goods'
         WHEN s.ServiceHours IS NOT NULL THEN 'Service'
       END AS Subtype,
       g.HSNCode,
       s.ServiceHours
FROM PRODUCT p
JOIN VENDOR v ON p.VendorID = v.VendorID
LEFT JOIN GOODS g ON p.ProductID = g.ProductID
LEFT JOIN SERVICE s ON p.ProductID = s.ProductID;`,
  },
  {
    id: 'q4',
    title: 'Weak Entity: Payment Installments Progress',
    description: 'Audits payment status and checks installment sum vs total payment amount',
    category: 'Weak Entity',
    sql: `SELECT pay.PaymentID, pay.OrderID, pay.Amount AS TotalDue, pay.Status,
       COUNT(pi.InstallmentNo) AS TotalInstallments,
       COALESCE(SUM(pi.InstallmentAmount), 0) AS PaidSoFar,
       (pay.Amount - COALESCE(SUM(pi.InstallmentAmount), 0)) AS Balance
FROM PAYMENT pay
LEFT JOIN PAYMENT_INSTALLMENT pi ON pay.PaymentID = pi.PaymentID
GROUP BY pay.PaymentID, pay.OrderID, pay.Amount, pay.Status;`,
  },
  {
    id: 'q5',
    title: 'Multi-Valued Attribute: All Vendor Contacts',
    description: 'Aggregates multi-valued contact phone numbers per vendor using 1:N composite PK table',
    category: 'Join',
    sql: `SELECT v.VendorID, v.VendorName, v.Category,
       GROUP_CONCAT(vc.ContactNo, ', ') AS AllContactNumbers
FROM VENDOR v
LEFT JOIN VENDOR_CONTACT vc ON v.VendorID = vc.VendorID
GROUP BY v.VendorID, v.VendorName, v.Category;`,
  },
  {
    id: 'q6',
    title: 'High-Value Vendors (HAVING Aggregate Filter)',
    description: 'Identifies vendors with total cumulative purchase order value exceeding ₹50,000',
    category: 'Aggregate',
    sql: `SELECT v.VendorID, v.VendorName, v.Category,
       COUNT(DISTINCT po.OrderID) AS OrdersCount,
       SUM(p.Price * c.Quantity) AS CumulativeBilled
FROM VENDOR v
JOIN PURCHASE_ORDER po ON v.VendorID = po.VendorID
JOIN CONTAINS c ON po.OrderID = c.OrderID
JOIN PRODUCT p ON c.ProductID = p.ProductID
GROUP BY v.VendorID, v.VendorName, v.Category
HAVING CumulativeBilled > 50000
ORDER BY CumulativeBilled DESC;`,
  },
];
