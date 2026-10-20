import React, { useState } from 'react';
import {
  Network,
  Key,
  Link,
  Layers,
  Database,
  CheckCircle2,
  Table as TableIcon,
  Play,
  Copy,
  Check,
  Terminal,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ClayCard } from '../components/common/ClayCard';
import { ClayButton } from '../components/common/ClayButton';
import { ClayChip } from '../components/common/ClayChip';
import { ConceptTooltip } from '../components/common/ConceptTooltip';
import { db } from '../db/db';
import { PREBUILT_QUERIES, PrebuiltQuery } from '../db/sql';
import { DatabaseSchema } from '../types/database';

interface TableMeta {
  name: keyof DatabaseSchema;
  title: string;
  category: 'Core Entity' | 'Decomposed 3NF' | 'Subtype Specialization' | 'Relationship' | 'Weak Entity';
  pk: string[];
  fk: { col: string; refTable: string; refCol: string }[];
  normalForm: '1NF, 2NF, 3NF Certified';
  columns: { name: string; type: string; isPk?: boolean; isFk?: boolean; isUnique?: boolean; check?: string }[];
  description: string;
}

const SCHEMA_TABLES: TableMeta[] = [
  {
    name: 'PINCODE_CITY',
    title: 'PINCODE_CITY',
    category: 'Decomposed 3NF',
    pk: ['Pincode'],
    fk: [],
    normalForm: '1NF, 2NF, 3NF Certified',
    description: 'Stores unique pincodes and geographic city mappings, eliminating transitive dependency.',
    columns: [
      { name: 'Pincode', type: 'VARCHAR(6)', isPk: true },
      { name: 'City', type: 'VARCHAR(100)' },
    ],
  },
  {
    name: 'VENDOR',
    title: 'VENDOR',
    category: 'Core Entity',
    pk: ['VendorID'],
    fk: [{ col: 'Pincode', refTable: 'PINCODE_CITY', refCol: 'Pincode' }],
    normalForm: '1NF, 2NF, 3NF Certified',
    description: 'Main vendor entity with street address and reference to PINCODE_CITY.',
    columns: [
      { name: 'VendorID', type: 'VARCHAR(10)', isPk: true },
      { name: 'VendorName', type: 'VARCHAR(150)' },
      { name: 'Category', type: 'VARCHAR(80)' },
      { name: 'Street', type: 'VARCHAR(255)' },
      { name: 'Pincode', type: 'VARCHAR(6)', isFk: true },
    ],
  },
  {
    name: 'VENDOR_CONTACT',
    title: 'VENDOR_CONTACT',
    category: 'Relationship',
    pk: ['VendorID', 'ContactNo'],
    fk: [{ col: 'VendorID', refTable: 'VENDOR', refCol: 'VendorID' }],
    normalForm: '1NF, 2NF, 3NF Certified',
    description: 'Decomposed multi-valued attribute Contact. A vendor can have multiple phone numbers.',
    columns: [
      { name: 'VendorID', type: 'VARCHAR(10)', isPk: true, isFk: true },
      { name: 'ContactNo', type: 'VARCHAR(15)', isPk: true, check: '10-digit numeric' },
    ],
  },
  {
    name: 'PRODUCT',
    title: 'PRODUCT',
    category: 'Core Entity',
    pk: ['ProductID'],
    fk: [{ col: 'VendorID', refTable: 'VENDOR', refCol: 'VendorID' }],
    normalForm: '1NF, 2NF, 3NF Certified',
    description: 'Superclass entity for products and services supplied by vendors.',
    columns: [
      { name: 'ProductID', type: 'VARCHAR(10)', isPk: true },
      { name: 'ProductName', type: 'VARCHAR(150)' },
      { name: 'Price', type: 'DECIMAL(10,2)', check: 'Price > 0' },
      { name: 'VendorID', type: 'VARCHAR(10)', isFk: true },
    ],
  },
  {
    name: 'GOODS',
    title: 'GOODS',
    category: 'Subtype Specialization',
    pk: ['ProductID'],
    fk: [{ col: 'ProductID', refTable: 'PRODUCT', refCol: 'ProductID' }],
    normalForm: '1NF, 2NF, 3NF Certified',
    description: 'Disjoint subtype of PRODUCT for physical goods with HSN taxation codes.',
    columns: [
      { name: 'ProductID', type: 'VARCHAR(10)', isPk: true, isFk: true },
      { name: 'HSNCode', type: 'VARCHAR(10)', check: '4-8 numeric digits' },
    ],
  },
  {
    name: 'SERVICE',
    title: 'SERVICE',
    category: 'Subtype Specialization',
    pk: ['ProductID'],
    fk: [{ col: 'ProductID', refTable: 'PRODUCT', refCol: 'ProductID' }],
    normalForm: '1NF, 2NF, 3NF Certified',
    description: 'Disjoint subtype of PRODUCT for professional services measured in hours.',
    columns: [
      { name: 'ProductID', type: 'VARCHAR(10)', isPk: true, isFk: true },
      { name: 'ServiceHours', type: 'INT', check: 'ServiceHours > 0' },
    ],
  },
  {
    name: 'PURCHASE_ORDER',
    title: 'PURCHASE_ORDER',
    category: 'Core Entity',
    pk: ['OrderID'],
    fk: [{ col: 'VendorID', refTable: 'VENDOR', refCol: 'VendorID' }],
    normalForm: '1NF, 2NF, 3NF Certified',
    description: 'Procurement orders placed with vendors. Has derived TotalCost computed dynamically.',
    columns: [
      { name: 'OrderID', type: 'VARCHAR(10)', isPk: true },
      { name: 'OrderDate', type: 'DATE' },
      { name: 'Status', type: 'ENUM', check: "'Pending' | 'Delivered'" },
      { name: 'VendorID', type: 'VARCHAR(10)', isFk: true },
    ],
  },
  {
    name: 'CONTAINS',
    title: 'CONTAINS',
    category: 'Relationship',
    pk: ['OrderID', 'ProductID'],
    fk: [
      { col: 'OrderID', refTable: 'PURCHASE_ORDER', refCol: 'OrderID' },
      { col: 'ProductID', refTable: 'PRODUCT', refCol: 'ProductID' },
    ],
    normalForm: '1NF, 2NF, 3NF Certified',
    description: 'Resolves M:N relationship between PURCHASE_ORDER and PRODUCT with Quantity.',
    columns: [
      { name: 'OrderID', type: 'VARCHAR(10)', isPk: true, isFk: true },
      { name: 'ProductID', type: 'VARCHAR(10)', isPk: true, isFk: true },
      { name: 'Quantity', type: 'INT', check: 'Quantity > 0' },
    ],
  },
  {
    name: 'PAYMENT',
    title: 'PAYMENT',
    category: 'Core Entity',
    pk: ['PaymentID'],
    fk: [{ col: 'OrderID', refTable: 'PURCHASE_ORDER', refCol: 'OrderID' }],
    normalForm: '1NF, 2NF, 3NF Certified',
    description: 'Tracks billing against orders. Enforces 1:1 UNIQUE OrderID constraint.',
    columns: [
      { name: 'PaymentID', type: 'VARCHAR(10)', isPk: true },
      { name: 'Amount', type: 'DECIMAL(10,2)', check: 'Amount > 0 AND Amount <= Order.TotalCost' },
      { name: 'PaymentDate', type: 'DATE' },
      { name: 'Status', type: 'ENUM', check: "'Paid' | 'Pending'" },
      { name: 'OrderID', type: 'VARCHAR(10)', isFk: true, isUnique: true },
    ],
  },
  {
    name: 'PAYMENT_INSTALLMENT',
    title: 'PAYMENT_INSTALLMENT',
    category: 'Weak Entity',
    pk: ['PaymentID', 'InstallmentNo'],
    fk: [{ col: 'PaymentID', refTable: 'PAYMENT', refCol: 'PaymentID' }],
    normalForm: '1NF, 2NF, 3NF Certified',
    description: 'Weak entity dependent on PAYMENT. InstallmentNo is the partial discriminator key.',
    columns: [
      { name: 'PaymentID', type: 'VARCHAR(10)', isPk: true, isFk: true },
      { name: 'InstallmentNo', type: 'INT', isPk: true, check: 'Partial Key (1, 2, 3...)' },
      { name: 'InstallmentAmount', type: 'DECIMAL(10,2)', check: 'InstallmentAmount > 0' },
    ],
  },
];

export const SchemaExplorerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'er' | 'normalization' | 'sql'>('er');
  const [selectedTableName, setSelectedTableName] = useState<keyof DatabaseSchema>('VENDOR');

  // SQL Runner state
  const [activeQuery, setActiveQuery] = useState<PrebuiltQuery>(PREBUILT_QUERIES[0]);
  const [queryResultRows, setQueryResultRows] = useState<any[]>([]);
  const [copiedSql, setCopiedSql] = useState(false);

  const selectedTable = SCHEMA_TABLES.find((t) => t.name === selectedTableName) || SCHEMA_TABLES[1];
  const liveTableRows = db.getRawData()[selectedTableName] || [];

  // Execute Prebuilt Queries against the in-browser relational model
  const executePrebuiltQuery = (q: PrebuiltQuery) => {
    setActiveQuery(q);
    const raw = db.getRawData();

    let rows: any[] = [];
    if (q.id === 'q1') {
      rows = raw.VENDOR.map((v) => {
        const pc = raw.PINCODE_CITY.find((p) => p.Pincode === v.Pincode);
        return {
          VendorID: v.VendorID,
          VendorName: v.VendorName,
          Category: v.Category,
          Street: v.Street,
          Pincode: v.Pincode,
          City: pc?.City || 'N/A',
        };
      });
    } else if (q.id === 'q2') {
      rows = raw.PURCHASE_ORDER.map((po) => {
        const v = raw.VENDOR.find((ven) => ven.VendorID === po.VendorID);
        const contains = raw.CONTAINS.filter((c) => c.OrderID === po.OrderID);
        const derivedCost = contains.reduce((sum, c) => {
          const p = raw.PRODUCT.find((pr) => pr.ProductID === c.ProductID);
          return sum + (p ? p.Price * c.Quantity : 0);
        }, 0);
        return {
          OrderID: po.OrderID,
          OrderDate: po.OrderDate,
          Status: po.Status,
          VendorName: v?.VendorName || 'Unknown',
          ItemCount: contains.length,
          DerivedTotalCost: `₹${derivedCost.toLocaleString('en-IN')}`,
        };
      }).sort((a, b) => Number(b.DerivedTotalCost.replace(/\D/g, '')) - Number(a.DerivedTotalCost.replace(/\D/g, '')));
    } else if (q.id === 'q3') {
      rows = raw.PRODUCT.map((p) => {
        const v = raw.VENDOR.find((ven) => ven.VendorID === p.VendorID);
        const g = raw.GOODS.find((good) => good.ProductID === p.ProductID);
        const s = raw.SERVICE.find((srv) => srv.ProductID === p.ProductID);
        return {
          ProductID: p.ProductID,
          ProductName: p.ProductName,
          Price: `₹${p.Price.toLocaleString('en-IN')}`,
          VendorName: v?.VendorName || 'Unknown',
          Subtype: g ? 'Goods' : 'Service',
          HSNCode: g?.HSNCode || '—',
          ServiceHours: s ? `${s.ServiceHours} hrs` : '—',
        };
      });
    } else if (q.id === 'q4') {
      rows = raw.PAYMENT.map((pay) => {
        const insts = raw.PAYMENT_INSTALLMENT.filter((pi) => pi.PaymentID === pay.PaymentID);
        const paidSoFar = insts.reduce((sum, i) => sum + i.InstallmentAmount, 0);
        return {
          PaymentID: pay.PaymentID,
          OrderID: pay.OrderID,
          TotalDue: `₹${pay.Amount.toLocaleString('en-IN')}`,
          Status: pay.Status,
          TotalInstallments: insts.length,
          PaidSoFar: `₹${paidSoFar.toLocaleString('en-IN')}`,
          Balance: `₹${(pay.Amount - paidSoFar).toLocaleString('en-IN')}`,
        };
      });
    } else if (q.id === 'q5') {
      rows = raw.VENDOR.map((v) => {
        const contacts = raw.VENDOR_CONTACT.filter((vc) => vc.VendorID === v.VendorID).map((vc) => vc.ContactNo);
        return {
          VendorID: v.VendorID,
          VendorName: v.VendorName,
          Category: v.Category,
          AllContactNumbers: contacts.join(', '),
        };
      });
    } else if (q.id === 'q6') {
      rows = raw.VENDOR.map((v) => {
        const vOrders = raw.PURCHASE_ORDER.filter((po) => po.VendorID === v.VendorID);
        let cumulative = 0;
        vOrders.forEach((o) => {
          const cItems = raw.CONTAINS.filter((c) => c.OrderID === o.OrderID);
          cItems.forEach((c) => {
            const p = raw.PRODUCT.find((prod) => prod.ProductID === c.ProductID);
            if (p) cumulative += p.Price * c.Quantity;
          });
        });
        return {
          VendorID: v.VendorID,
          VendorName: v.VendorName,
          Category: v.Category,
          OrdersCount: vOrders.length,
          CumulativeBilled: cumulative,
        };
      })
        .filter((r) => r.CumulativeBilled > 50000)
        .map((r) => ({
          ...r,
          CumulativeBilled: `₹${r.CumulativeBilled.toLocaleString('en-IN')}`,
        }));
    }

    setQueryResultRows(rows);
    db.logSql({
      action: 'SELECT',
      sql: `-- Evaluated Prebuilt SQL: ${q.title}\n${q.sql}`,
    });
  };

  // Initialize query on mount
  React.useEffect(() => {
    executePrebuiltQuery(PREBUILT_QUERIES[0]);
  }, []);

  const handleCopySql = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-3xl text-[var(--text-primary)]">
              Database Schema & ER Architecture
            </h1>
            <ConceptTooltip
              concept="Relational 3NF Schema (10 Tables)"
              explanation="Features Primary Keys, Foreign Keys, Weak Entities, Disjoint Specialization, 1:1, 1:N and M:N resolved relations."
            />
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Complete database blueprint, normalization decompositions, and interactive SQL query runner.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-[var(--surface-sunken)] p-1 rounded-2xl border border-[var(--text-muted)]/15">
          <button
            onClick={() => setActiveTab('er')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-medium transition-colors ${
              activeTab === 'er'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            ER Diagram (10 Tables)
          </button>
          <button
            onClick={() => setActiveTab('normalization')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-medium transition-colors ${
              activeTab === 'normalization'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            3NF Normalization
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-medium transition-colors ${
              activeTab === 'sql'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Run SQL Queries
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE ER DIAGRAM & TABLE INSPECTOR */}
      {activeTab === 'er' && (
        <div className="space-y-6">
          {/* Visual ER Map */}
          <ClayCard elevated className="p-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="font-heading font-bold text-sm text-[var(--text-primary)]">
                Relational Model: 10 Tables Architecture
              </span>
              <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] font-mono">
                <span className="flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-500" /> PK (Primary Key)
                </span>
                <span className="flex items-center gap-1">
                  <Link className="w-3 h-3 text-blue-500" /> FK (Foreign Key)
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-600 dark:text-amber-400 font-bold">
                  (d) Disjoint
                </span>
                <span className="border border-dashed border-indigo-400 px-2 py-0.5 rounded text-indigo-400">
                  Derived TotalCost
                </span>
              </div>
            </div>

            {/* Grid of 10 Tables styled as tactile cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {SCHEMA_TABLES.map((table) => {
                const isSelected = selectedTableName === table.name;
                const isWeak = table.category === 'Weak Entity';
                const isSpecialization = table.category === 'Subtype Specialization';

                return (
                  <div
                    key={table.name}
                    onClick={() => setSelectedTableName(table.name)}
                    className={`p-3.5 rounded-3xl cursor-pointer transition-all duration-200 select-none flex flex-col justify-between ${
                      isSelected
                        ? 'clay-card-elevated border-2 border-[var(--accent-primary)] shadow-xl scale-[1.02]'
                        : 'clay-card hover:-translate-y-1'
                    } ${isWeak ? 'border-2 border-dashed border-blue-400' : ''}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-xs text-[var(--text-primary)] truncate">
                          {table.title}
                        </span>
                        {isSpecialization && (
                          <span className="w-4 h-4 rounded-full bg-amber-400/25 text-amber-600 dark:text-amber-300 font-bold text-[10px] flex items-center justify-center">
                            d
                          </span>
                        )}
                        {isWeak && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-500 font-bold">
                            Weak
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-sunken)] text-[var(--text-muted)] font-mono block mb-2 w-fit">
                        {table.category}
                      </span>

                      <div className="space-y-1 text-[11px] font-mono">
                        {table.columns.map((c) => (
                          <div
                            key={c.name}
                            className={`flex items-center justify-between p-1 rounded ${
                              c.isPk ? 'bg-amber-400/10 font-bold text-amber-700 dark:text-amber-300' : 'text-[var(--text-secondary)]'
                            }`}
                          >
                            <span className="truncate flex items-center gap-1">
                              {c.isPk && <Key className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                              {c.isFk && <Link className="w-2.5 h-2.5 text-blue-500 shrink-0" />}
                              {c.name}
                            </span>
                            <span className="text-[9px] opacity-70 shrink-0">{c.type.split('(')[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[var(--text-muted)]/15 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                      <span>Rows: {db.getRawData()[table.name]?.length || 0}</span>
                      <span className="text-emerald-500 font-bold">3NF ✔</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ClayCard>

          {/* TABLE INSPECTOR & LIVE ROWS VIEWER */}
          <ClayCard>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-lg text-[var(--text-primary)]">
                    Table Inspector: {selectedTable.title}
                  </h3>
                  <ClayChip label={selectedTable.normalForm} variant="mint" className="text-[10px]" />
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {selectedTable.description}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-[var(--text-muted)]">Live in-browser rows:</span>
                <span className="font-bold text-[var(--accent-primary)]">{liveTableRows.length}</span>
              </div>
            </div>

            {/* Column Schema Definition Table */}
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[var(--surface-sunken)] border-b border-[var(--text-muted)]/15 text-[var(--text-secondary)]">
                  <tr>
                    <th className="py-2.5 px-3">Column Name</th>
                    <th className="py-2.5 px-3">SQL Data Type</th>
                    <th className="py-2.5 px-3">Key Constraint</th>
                    <th className="py-2.5 px-3">Check & Business Rules</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--text-muted)]/10">
                  {selectedTable.columns.map((col) => (
                    <tr key={col.name}>
                      <td className="py-2 px-3 font-bold text-[var(--text-primary)]">
                        {col.name}
                      </td>
                      <td className="py-2 px-3 text-[var(--text-secondary)]">{col.type}</td>
                      <td className="py-2 px-3">
                        {col.isPk && col.isFk ? (
                          <span className="text-amber-500 font-bold">Composite PK & FK</span>
                        ) : col.isPk ? (
                          <span className="text-amber-500 font-bold">PRIMARY KEY</span>
                        ) : col.isFk ? (
                          <span className="text-blue-500 font-bold">FOREIGN KEY</span>
                        ) : col.isUnique ? (
                          <span className="text-indigo-400 font-bold">UNIQUE (1:1)</span>
                        ) : (
                          <span className="text-[var(--text-muted)]">None</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[var(--text-muted)]">
                        {col.check ? `CHECK (${col.check})` : 'NOT NULL enforced'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Live Rows Data Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-semibold text-xs text-[var(--text-primary)]">
                  Live Database Table Snapshot ({liveTableRows.length} records)
                </span>
              </div>

              <div className="overflow-x-auto max-h-56 overflow-y-auto rounded-2xl bg-[var(--surface-sunken)] p-1">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[var(--surface-elevated)] sticky top-0 border-b border-[var(--text-muted)]/15">
                    <tr>
                      {selectedTable.columns.map((c) => (
                        <th key={c.name} className="py-2 px-3 text-[var(--text-secondary)]">
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--text-muted)]/10">
                    {liveTableRows.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[var(--surface-elevated)]/50">
                        {selectedTable.columns.map((c) => (
                          <td key={c.name} className="py-2 px-3 text-[var(--text-primary)]">
                            {String(row[c.name] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ClayCard>
        </div>
      )}

      {/* TAB 2: 3NF NORMALIZATION & TRANSITIVE DEPENDENCY DECOMPOSITION */}
      {activeTab === 'normalization' && (
        <div className="space-y-6">
          <ClayCard className="space-y-6">
            <div>
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-[var(--accent-primary)] block mb-1">
                Normalization Proof (Third Normal Form)
              </span>
              <h3 className="font-heading font-extrabold text-2xl text-[var(--text-primary)]">
                Eliminating Transitive Dependency: Pincode → City
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed max-w-3xl">
                A relational schema is in Third Normal Form (3NF) if it is in 2NF and no non-prime
                attribute is transitively dependent on the primary key. In a standard vendor table,
                City is functionally determined by Pincode (<code className="font-mono text-[var(--accent-primary)]">Pincode → City</code>), creating a transitive dependency
                via <code className="font-mono text-[var(--accent-primary)]">VendorID → Pincode → City</code>.
              </p>
            </div>

            {/* Before vs After Animated Visual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Before 3NF (Transitive Flaw) */}
              <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-sm text-rose-600 dark:text-rose-300">
                    Before: 2NF Table with Transitive Dependency
                  </span>
                  <ClayChip label="Redundancy Flaw" variant="error" className="text-[10px]" />
                </div>

                <div className="font-mono text-xs p-3 rounded-2xl bg-[var(--surface-elevated)] border border-rose-500/20 text-[var(--text-primary)] space-y-1">
                  <div className="font-bold text-rose-500">VENDOR (Unnormalized)</div>
                  <div className="text-[var(--text-secondary)] pl-2">
                    (<span className="underline font-bold">VendorID</span>, VendorName, Category, Street, <span className="text-amber-500 font-bold">Pincode</span>, <span className="text-rose-500 font-bold">City</span>)
                  </div>
                </div>

                <div className="space-y-1 text-xs text-rose-700 dark:text-rose-300">
                  <p>• <strong>Transitive Dependency:</strong> VendorID → Pincode and Pincode → City</p>
                  <p>• <strong>Insertion Anomaly:</strong> Cannot register a city without registering a vendor</p>
                  <p>• <strong>Deletion Anomaly:</strong> Deleting the last vendor in Nashik loses city record</p>
                  <p>• <strong>Update Redundancy:</strong> Changing a city name requires updates to hundreds of vendor rows</p>
                </div>
              </div>

              {/* After 3NF (Lossless Decomposition) */}
              <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-sm text-emerald-600 dark:text-emerald-300">
                    After: Lossless 3NF Decomposition
                  </span>
                  <ClayChip label="3NF Certified ✔" variant="mint" className="text-[10px]" />
                </div>

                <div className="font-mono text-xs p-3 rounded-2xl bg-[var(--surface-elevated)] border border-emerald-500/20 text-[var(--text-primary)] space-y-2">
                  <div>
                    <span className="font-bold text-emerald-500">1. PINCODE_CITY:</span>
                    <span className="text-[var(--text-secondary)] ml-1">
                      (<span className="underline font-bold">Pincode</span>, City)
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-500">2. VENDOR:</span>
                    <span className="text-[var(--text-secondary)] ml-1">
                      (<span className="underline font-bold">VendorID</span>, VendorName, Category, Street, <span className="italic font-bold text-blue-500">Pincode FK</span>)
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-emerald-700 dark:text-emerald-300">
                  <p>• <strong>Dependency Preserved:</strong> Pincode → City isolated in dedicated relation</p>
                  <p>• <strong>Zero Redundancy:</strong> City stored exactly once per postal code</p>
                  <p>• <strong>No Anomalies:</strong> Cities exist independently; vendor updates only touch foreign key</p>
                  <p>• <strong>Lossless Join:</strong> Reconstructed via simple <code className="font-bold font-mono">NATURAL JOIN / JOIN USING (Pincode)</code></p>
                </div>
              </div>
            </div>

            {/* Interactive Demo */}
            <div className="p-5 rounded-3xl bg-[var(--surface-sunken)] border border-[var(--text-muted)]/15">
              <h4 className="font-heading font-bold text-sm text-[var(--text-primary)] mb-2">
                Live 3NF Reconstitution Join Query
              </h4>
              <pre className="font-mono text-xs p-3 rounded-2xl bg-[var(--surface-elevated)] text-[var(--text-primary)] overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`SELECT v.VendorID, v.VendorName, v.Street, pc.Pincode, pc.City
FROM VENDOR v
INNER JOIN PINCODE_CITY pc ON v.Pincode = pc.Pincode
ORDER BY v.VendorID;`}
              </pre>
            </div>
          </ClayCard>
        </div>
      )}

      {/* TAB 3: RUN SQL QUERIES MINI-CONSOLE */}
      {activeTab === 'sql' && (
        <div className="space-y-6">
          <ClayCard className="space-y-5">
            <div>
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-[var(--accent-primary)] block mb-1">
                Mini SQL Execution Engine
              </span>
              <h3 className="font-heading font-extrabold text-2xl text-[var(--text-primary)]">
                Interactive Analytical Queries & Multi-Table Joins
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
                Select any prebuilt analytical query below to execute real relational joins, aggregations,
                derived attributes, and specialization filters against the in-browser database.
              </p>
            </div>

            {/* Prebuilt Queries Selector Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PREBUILT_QUERIES.map((q) => {
                const isSelected = activeQuery.id === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => executePrebuiltQuery(q)}
                    className={`p-3.5 rounded-2xl text-left transition-all border ${
                      isSelected
                        ? 'bg-[var(--accent-primary)] text-white border-transparent shadow-md'
                        : 'bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text-primary)] border-[var(--text-muted)]/15'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-80">
                        {q.category}
                      </span>
                      {isSelected && <Play className="w-3 h-3 text-white fill-current" />}
                    </div>
                    <h5 className="font-heading font-bold text-xs">{q.title}</h5>
                    <p className={`text-[11px] mt-1 leading-snug line-clamp-2 ${isSelected ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                      {q.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Active SQL Statement Box */}
            <div className="p-4 rounded-3xl bg-[var(--surface-sunken)] border border-[var(--text-muted)]/15 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-heading font-bold text-[var(--text-primary)]">
                  <Terminal className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>{activeQuery.title}</span>
                </div>
                <button
                  onClick={() => handleCopySql(activeQuery.sql)}
                  className="px-2.5 py-1 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--surface)] text-[var(--text-secondary)] font-mono text-xs flex items-center gap-1"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-2xl bg-[var(--surface-elevated)] font-mono text-xs text-[var(--text-primary)] overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {activeQuery.sql}
              </pre>
            </div>

            {/* Execution Output Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-heading font-bold text-xs text-[var(--text-primary)]">
                  Query Execution Results ({queryResultRows.length} rows returned)
                </span>
                <span className="text-[10px] text-emerald-500 font-mono font-bold">Status: 200 OK</span>
              </div>

              {queryResultRows.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)] font-mono">
                  No records returned for this query.
                </div>
              ) : (
                <div className="clay-card p-0 overflow-hidden">
                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[var(--surface-elevated)] sticky top-0 border-b border-[var(--text-muted)]/15 text-[var(--text-secondary)] font-semibold">
                        <tr>
                          {Object.keys(queryResultRows[0]).map((key) => (
                            <th key={key} className="py-2.5 px-3 whitespace-nowrap">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--text-muted)]/10">
                        {queryResultRows.map((row, i) => (
                          <tr key={i} className="hover:bg-[var(--surface-sunken)]/60">
                            {Object.values(row).map((val: any, j) => (
                              <td key={j} className="py-2 px-3 whitespace-nowrap text-[var(--text-primary)]">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </ClayCard>
        </div>
      )}
    </div>
  );
};
