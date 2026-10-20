import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Lock,
  Edit2,
  Trash2,
  Building2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Terminal,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ClayCard } from '../components/common/ClayCard';
import { ClayButton } from '../components/common/ClayButton';
import { ClayInput } from '../components/common/ClayInput';
import { ClayChip } from '../components/common/ClayChip';
import { ClayModal } from '../components/common/ClayModal';
import { ClayDrawer } from '../components/common/ClayDrawer';
import { ConceptTooltip } from '../components/common/ConceptTooltip';
import { db } from '../db/db';
import { PurchaseOrderWithDetails, OrderStatus } from '../types/database';
import { useToast } from '../components/common/ClayToast';

export const PurchaseOrdersPage: React.FC<{ onNavigateToPayment?: (orderId: string) => void }> = () => {
  const [orders, setOrders] = useState<PurchaseOrderWithDetails[]>(db.getPurchaseOrders());
  const [vendors, setVendors] = useState(db.getVendors());
  const [products, setProducts] = useState(db.getProducts());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending' | 'Delivered'>('ALL');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('ALL');

  // Selected Order for detail drawer
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderWithDetails | null>(null);

  // Multi-step Wizard Modal for Creating Order
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Wizard Step 1: Vendor & Date
  const [wizardVendorId, setWizardVendorId] = useState('');
  const [wizardOrderDate, setWizardOrderDate] = useState(new Date().toISOString().split('T')[0]);

  // Wizard Step 2: Line Items
  const [wizardItems, setWizardItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [wizardError, setWizardError] = useState<string | null>(null);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<PurchaseOrderWithDetails | null>(null);

  const { showToast } = useToast();

  const refreshData = () => {
    setOrders(db.getPurchaseOrders());
    setVendors(db.getVendors());
    setProducts(db.getProducts());
  };

  useEffect(() => {
    const unsub = db.subscribe(refreshData);
    return () => unsub();
  }, []);

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  // Products available exclusively for the selected wizard vendor
  const availableVendorProducts = products.filter((p) => p.VendorID === wizardVendorId);

  // Open Wizard
  const handleOpenWizard = () => {
    setWizardStep(1);
    setWizardVendorId(vendors[0]?.VendorID || '');
    setWizardOrderDate(new Date().toISOString().split('T')[0]);
    setWizardItems([]);
    setWizardError(null);
    setWizardOpen(true);
  };

  // Add line item row in Wizard
  const handleAddLineItem = () => {
    if (availableVendorProducts.length === 0) return;
    const defaultProd = availableVendorProducts[0];
    setWizardItems([...wizardItems, { productId: defaultProd.ProductID, quantity: 1 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setWizardItems(wizardItems.filter((_, i) => i !== index));
  };

  const handleUpdateItemProduct = (index: number, pId: string) => {
    const updated = [...wizardItems];
    updated[index].productId = pId;
    setWizardItems(updated);
  };

  const handleUpdateItemQuantity = (index: number, qty: number) => {
    const updated = [...wizardItems];
    updated[index].quantity = Math.max(1, qty);
    setWizardItems(updated);
  };

  // Live Derived Total in Wizard
  const wizardTotalCost = wizardItems.reduce((sum, item) => {
    const prod = availableVendorProducts.find((p) => p.ProductID === item.productId);
    return sum + (prod ? prod.Price * item.quantity : 0);
  }, 0);

  // Wizard Step Advance
  const handleNextStep = () => {
    setWizardError(null);
    if (wizardStep === 1) {
      if (!wizardVendorId) {
        setWizardError('Please select a vendor.');
        return;
      }
      if (!wizardOrderDate) {
        setWizardError('Please select an order date.');
        return;
      }
      // Populate with first product if empty
      const prods = products.filter((p) => p.VendorID === wizardVendorId);
      if (prods.length === 0) {
        setWizardError('This vendor has no products registered yet! Please add products to this vendor first.');
        return;
      }
      if (wizardItems.length === 0) {
        setWizardItems([{ productId: prods[0].ProductID, quantity: 1 }]);
      }
      setWizardStep(2);
    } else if (wizardStep === 2) {
      if (wizardItems.length === 0) {
        setWizardError('Please add at least one line item.');
        return;
      }
      setWizardStep(3);
    }
  };

  // Wizard Final Save
  const handleFinalSaveOrder = () => {
    const res = db.createPurchaseOrder({
      VendorID: wizardVendorId,
      OrderDate: wizardOrderDate,
      Items: wizardItems.map((i) => ({
        ProductID: i.productId,
        Quantity: i.quantity,
      })),
    });

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Purchase Order Created',
        message: `Order ${res.orderId} placed with ${wizardItems.length} line items (CONTAINS M:N).`,
      });
      setWizardOpen(false);
    } else {
      setWizardError(res.error || 'Failed to create purchase order');
    }
  };

  // Toggle Order Status with Confetti
  const handleToggleStatus = (order: PurchaseOrderWithDetails) => {
    const nextStatus: OrderStatus = order.Status === 'Pending' ? 'Delivered' : 'Pending';

    const res = db.updateOrderStatus(order.OrderID, nextStatus);
    if (res.success) {
      if (nextStatus === 'Delivered') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7BE0A8', '#7C83FD', '#FFD97A'],
        });
        showToast({
          type: 'success',
          title: 'Order Marked as Delivered!',
          message: `Order ${order.OrderID} fulfilled. Line items are now locked.`,
        });
      } else {
        showToast({
          type: 'info',
          title: 'Status Reverted',
          message: `Order ${order.OrderID} is now Pending.`,
        });
      }
    }
  };

  // Delete Order with Cascade Preview
  const handleOpenDelete = (order: PurchaseOrderWithDetails) => {
    setOrderToDelete(order);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!orderToDelete) return;
    const res = db.deletePurchaseOrder(orderToDelete.OrderID);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Order Deleted',
        message: `Purchase Order ${orderToDelete.OrderID} and all linked line items & payments cascaded.`,
      });
      setDeleteModalOpen(false);
      setOrderToDelete(null);
      if (selectedOrder?.OrderID === orderToDelete.OrderID) {
        setSelectedOrder(null);
      }
    } else {
      showToast({
        type: 'error',
        title: 'Deletion Error',
        message: res.error,
      });
    }
  };

  // Filtering
  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.OrderID.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.VendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.Items.some((i) => i.ProductName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || o.Status === statusFilter;
    const matchesVendor = selectedVendorFilter === 'ALL' || o.VendorID === selectedVendorFilter;

    return matchesSearch && matchesStatus && matchesVendor;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-3xl text-[var(--text-primary)]">
              Purchase Order Module
            </h1>
            <ConceptTooltip
              concept="Derived TotalCost & M:N Resolution via CONTAINS"
              explanation="TotalCost is a derived attribute computed on-the-fly: SUM(Product.Price * Contains.Quantity). CONTAINS resolves the many-to-many relationship between PURCHASE_ORDER and PRODUCT."
              rule="Business Rule: Order items can only be selected from the order's chosen vendor."
            />
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Track procurement cycles, line-item quantities, derived valuations, and delivery milestones.
          </p>
        </div>

        <ClayButton
          variant="primary"
          onClick={handleOpenWizard}
          icon={<Plus className="w-4 h-4" />}
          className="text-xs font-semibold"
        >
          Create Purchase Order
        </ClayButton>
      </div>

      {/* Filter and Control Bar */}
      <ClayCard className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID (PO001), vendor name, or product..."
              className="clay-input pl-10 pr-4 py-2 w-full text-xs font-sans"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedVendorFilter}
              onChange={(e) => setSelectedVendorFilter(e.target.value)}
              className="clay-input py-2 px-3 text-xs bg-[var(--surface-sunken)]"
            >
              <option value="ALL">All Vendors ({vendors.length})</option>
              {vendors.map((v) => (
                <option key={v.VendorID} value={v.VendorID}>
                  {v.VendorName}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-[var(--surface-sunken)] p-1 rounded-2xl border border-[var(--text-muted)]/15">
              {(['ALL', 'Pending', 'Delivered'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-xl text-xs font-heading font-medium transition-colors ${
                    statusFilter === s
                      ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ClayCard>

      {/* Orders List Table */}
      {filtered.length === 0 ? (
        <ClayCard className="py-12 text-center">
          <ShoppingCart className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
          <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
            No Purchase Orders Found
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            No purchase order records match your criteria.
          </p>
        </ClayCard>
      ) : (
        <div className="clay-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-elevated)] border-b border-[var(--text-muted)]/15 text-[var(--text-secondary)] font-heading font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Order ID (PK)</th>
                  <th className="py-3.5 px-4">Order Date</th>
                  <th className="py-3.5 px-4">Vendor (FK)</th>
                  <th className="py-3.5 px-3 text-center">Line Items (CONTAINS)</th>
                  <th className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>Derived TotalCost</span>
                      <ClayChip label="Derived" variant="derived" className="text-[9px] py-0 px-1.5" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center">Fulfillment Status</th>
                  <th className="py-3.5 px-4 text-center">Payment Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--text-muted)]/10 font-sans">
                {filtered.map((o) => (
                  <tr
                    key={o.OrderID}
                    onClick={() => setSelectedOrder(o)}
                    className="hover:bg-[var(--surface-sunken)]/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--accent-primary)]">
                      {o.OrderID}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[var(--text-secondary)]">
                      {o.OrderDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-heading font-bold text-[var(--text-primary)] block">
                        {o.VendorName}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">{o.VendorID}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-[var(--surface-sunken)] font-mono text-xs">
                        {o.Items.length} item(s)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-base text-[var(--text-primary)]">
                      {formatINR(o.TotalCost)}
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleStatus(o)}
                        className={`clay-chip text-[11px] py-1 px-3 ${
                          o.Status === 'Delivered'
                            ? 'bg-[#7BE0A8]/30 text-[#0B4628] dark:text-[#A8F0C6] hover:opacity-80'
                            : 'bg-[#FFD97A]/40 text-[#614700] dark:text-[#FFE699] hover:opacity-80'
                        }`}
                        title="Click to toggle status"
                      >
                        {o.Status === 'Delivered' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Delivered</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Mark Delivered</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {o.PaymentStatus === 'Paid' ? (
                        <ClayChip label="Fully Paid" variant="delivered" className="text-[10px]" />
                      ) : o.PaymentStatus === 'Pending' ? (
                        <ClayChip label="Payment Pending" variant="pending" className="text-[10px]" />
                      ) : (
                        <ClayChip label="No Payment" variant="secondary" className="text-[10px]" />
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {o.Status === 'Delivered' ? (
                          <span
                            className="p-1.5 text-[var(--text-muted)] cursor-not-allowed"
                            title="Delivered orders are locked from editing"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="p-1.5 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text-secondary)]"
                            title="Inspect items"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenDelete(o)}
                          className="p-1.5 rounded-full bg-[var(--surface-sunken)] hover:bg-rose-500/15 text-[var(--text-secondary)] hover:text-rose-500"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDER DETAIL DRAWER */}
      <ClayDrawer
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder?.OrderID || 'Purchase Order'}
        subtitle={`Order Date: ${selectedOrder?.OrderDate} • Status: ${selectedOrder?.Status}`}
        width="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--text-muted)]/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)] font-heading">Supplying Vendor</span>
                <ClayChip label={selectedOrder.VendorCategory} variant="secondary" className="text-[10px]" />
              </div>
              <h4 className="font-heading font-bold text-base text-[var(--text-primary)]">
                {selectedOrder.VendorName} ({selectedOrder.VendorID})
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">Location: {selectedOrder.VendorCity}</p>
            </div>

            {/* Line Items (CONTAINS Join) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-semibold text-xs text-[var(--text-primary)]">
                  Line Items (CONTAINS JOIN PRODUCT)
                </h4>
                <ClayChip label={`${selectedOrder.Items.length} Products`} variant="primary" className="text-[10px]" />
              </div>

              <div className="space-y-2">
                {selectedOrder.Items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[var(--surface-sunken)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[var(--text-primary)]">{item.ProductName}</span>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono">
                        {item.ProductID} • {formatINR(item.Price)} × {item.Quantity} unit(s)
                      </p>
                    </div>
                    <span className="font-mono font-bold text-[var(--text-primary)]">
                      {formatINR(item.LineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Derived Total Cost Banner */}
              <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--accent-primary)]/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1">
                    Derived TotalCost <ConceptTooltip concept="Derived TotalCost" explanation="Computed dynamically: SUM(Price * Quantity) across CONTAINS table rows" />
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">SUM(Line items)</span>
                </div>
                <span className="font-heading font-extrabold text-2xl text-[var(--text-primary)]">
                  {formatINR(selectedOrder.TotalCost)}
                </span>
              </div>
            </div>

            {/* Linked Payment Record */}
            <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--text-muted)]/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-heading font-semibold text-xs text-[var(--text-primary)]">
                  Linked Payment Record (1:1 with Order)
                </span>
                <ClayChip
                  label={selectedOrder.PaymentStatus}
                  variant={selectedOrder.PaymentStatus === 'Paid' ? 'delivered' : 'pending'}
                  className="text-[10px]"
                />
              </div>

              {selectedOrder.Payment ? (
                <div className="text-xs space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Payment ID:</span>
                    <span className="font-mono font-bold text-[var(--accent-primary)]">{selectedOrder.Payment.PaymentID}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Installments Paid:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatINR(selectedOrder.InstallmentsSum)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)] pt-1">
                  No payment record has been initiated for this order yet.
                </p>
              )}
            </div>

            {/* Drawer Actions */}
            <div className="flex gap-2 pt-2 border-t border-[var(--text-muted)]/15">
              <ClayButton
                variant={selectedOrder.Status === 'Delivered' ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => handleToggleStatus(selectedOrder)}
                className="flex-1"
              >
                {selectedOrder.Status === 'Delivered' ? 'Revert to Pending' : 'Mark as Delivered'}
              </ClayButton>
              <ClayButton
                variant="danger"
                size="sm"
                onClick={() => {
                  handleOpenDelete(selectedOrder);
                  setSelectedOrder(null);
                }}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete
              </ClayButton>
            </div>
          </div>
        )}
      </ClayDrawer>

      {/* CREATE PURCHASE ORDER MULTI-STEP WIZARD MODAL */}
      <ClayModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <span>Create Purchase Order</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
              Step {wizardStep} of 3
            </span>
          </div>
        }
        subtitle="3-step procurement builder enforcing vendor-product integrity and derived total calculation"
        maxWidth="lg"
      >
        <div className="space-y-4 pt-1">
          {/* Progress Indicator */}
          <div className="grid grid-cols-3 gap-2 pb-2">
            {[
              { step: 1, label: 'Vendor & Date' },
              { step: 2, label: 'Line Items' },
              { step: 3, label: 'Review & SQL' },
            ].map((s) => (
              <div
                key={s.step}
                className={`p-2 rounded-xl text-center text-xs font-heading font-medium transition-colors ${
                  wizardStep === s.step
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                    : wizardStep > s.step
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-[var(--surface-sunken)] text-[var(--text-muted)]'
                }`}
              >
                {s.label}
              </div>
            ))}
          </div>

          {wizardError && (
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 text-xs border border-rose-500/30">
              {wizardError}
            </div>
          )}

          {/* STEP 1: Choose Vendor and Order Date */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="font-heading font-medium text-xs text-[var(--text-secondary)] pl-1 block mb-1.5">
                  Select Vendor <span className="text-rose-500">*</span>
                </label>
                <select
                  value={wizardVendorId}
                  onChange={(e) => {
                    setWizardVendorId(e.target.value);
                    setWizardItems([]); // Reset line items when vendor switches
                  }}
                  className="clay-input w-full text-sm font-sans"
                >
                  {vendors.map((v) => (
                    <option key={v.VendorID} value={v.VendorID}>
                      {v.VendorID} — {v.VendorName} ({v.Category})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[var(--text-muted)] pl-1 mt-1">
                  Enforces business rule: Once vendor is selected, only their products will be selectable in Step 2.
                </p>
              </div>

              <ClayInput
                label="Order Date"
                required
                type="date"
                value={wizardOrderDate}
                onChange={(e) => setWizardOrderDate(e.target.value)}
                helper="Defaulted to current date. Order date cannot be in the future."
              />
            </div>
          )}

          {/* STEP 2: Add Line Items */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-semibold text-xs text-[var(--text-primary)]">
                    Line Items (CONTAINS M:N Table)
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Only products supplied by vendor {wizardVendorId} are available.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="text-xs font-heading font-bold text-[var(--accent-primary)] hover:underline"
                >
                  + Add Line Item
                </button>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {wizardItems.map((item, idx) => {
                  const prod = availableVendorProducts.find((p) => p.ProductID === item.productId);
                  const lineTotal = prod ? prod.Price * item.quantity : 0;

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-[var(--surface-sunken)] grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="col-span-6">
                        <select
                          value={item.productId}
                          onChange={(e) => handleUpdateItemProduct(idx, e.target.value)}
                          className="clay-input py-1.5 px-2 text-xs w-full bg-[var(--surface)]"
                        >
                          {availableVendorProducts.map((p) => (
                            <option key={p.ProductID} value={p.ProductID}>
                              {p.ProductName} ({formatINR(p.Price)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItemQuantity(idx, Number(e.target.value))}
                          className="clay-input py-1.5 px-2 text-xs w-full font-mono text-center"
                          placeholder="Qty"
                        />
                      </div>

                      <div className="col-span-2 font-mono font-bold text-right text-[var(--text-primary)]">
                        {formatINR(lineTotal)}
                      </div>

                      <div className="col-span-1 text-center">
                        {wizardItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="text-[var(--text-muted)] hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Derived Total Banner */}
              <div className="p-3 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--accent-primary)]/30 flex items-center justify-between">
                <span className="font-heading font-bold text-xs text-[var(--text-secondary)]">
                  Running Derived Total:
                </span>
                <span className="font-heading font-extrabold text-xl text-[var(--accent-primary)]">
                  {formatINR(wizardTotalCost)}
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: Review & SQL Preview */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[var(--surface-sunken)] text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Vendor:</span>
                  <span className="font-bold text-[var(--text-primary)]">{wizardVendorId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Order Date:</span>
                  <span className="font-mono">{wizardOrderDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Line Items Count:</span>
                  <span className="font-mono">{wizardItems.length} products</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--text-muted)]/15">
                  <span className="font-heading font-bold text-[var(--text-primary)]">Grand Total (Derived):</span>
                  <span className="font-heading font-extrabold text-lg text-emerald-600 dark:text-emerald-400">
                    {formatINR(wizardTotalCost)}
                  </span>
                </div>
              </div>

              {/* Equivalent SQL preview */}
              <div className="p-3.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--text-muted)]/20 font-mono text-[11px]">
                <div className="flex items-center gap-1 text-[var(--accent-primary)] font-bold mb-1">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Equivalent SQL Transactions:</span>
                </div>
                <pre className="whitespace-pre-wrap text-[10px] text-[var(--text-secondary)]">
{`INSERT INTO PURCHASE_ORDER (OrderID, OrderDate, Status, VendorID)
VALUES ('[Auto-Generated]', '${wizardOrderDate}', 'Pending', '${wizardVendorId}');

${wizardItems
  .map(
    (i) =>
      `INSERT INTO CONTAINS (OrderID, ProductID, Quantity) VALUES ('[Auto-Generated]', '${i.productId}', ${i.quantity});`
  )
  .join('\n')}`}
                </pre>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--text-muted)]/15">
            {wizardStep > 1 ? (
              <ClayButton
                variant="secondary"
                size="sm"
                onClick={() => setWizardStep((prev) => (prev - 1) as any)}
              >
                Back
              </ClayButton>
            ) : (
              <ClayButton variant="secondary" size="sm" onClick={() => setWizardOpen(false)}>
                Cancel
              </ClayButton>
            )}

            {wizardStep < 3 ? (
              <ClayButton variant="primary" size="sm" onClick={handleNextStep}>
                Next Step
              </ClayButton>
            ) : (
              <ClayButton variant="primary" size="sm" onClick={handleFinalSaveOrder}>
                Confirm & Place Order
              </ClayButton>
            )}
          </div>
        </div>
      </ClayModal>

      {/* DELETE CONFIRM CASCADE MODAL */}
      <ClayModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Purchase Order"
        subtitle="CASCADE Referential Action Preview"
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-heading font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>CASCADE Delete Impact</span>
            </div>
            <p>
              Deleting Purchase Order <strong>{orderToDelete?.OrderID}</strong> will trigger a <strong>CASCADE</strong> deletion across:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>All associated line items in CONTAINS ({orderToDelete?.Items.length} items)</li>
              <li>Any recorded payment in PAYMENT</li>
              <li>All weak-entity installments in PAYMENT_INSTALLMENT</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--text-muted)]/15">
            <ClayButton variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </ClayButton>
            <ClayButton variant="danger" onClick={handleConfirmDelete}>
              Confirm CASCADE Delete
            </ClayButton>
          </div>
        </div>
      </ClayModal>
    </div>
  );
};
