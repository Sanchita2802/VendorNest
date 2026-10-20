import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { ClayCard } from '../components/common/ClayCard';
import { ClayButton } from '../components/common/ClayButton';
import { ClayInput } from '../components/common/ClayInput';
import { ClaySelect } from '../components/common/ClaySelect';
import { ClayChip } from '../components/common/ClayChip';
import { ClayModal } from '../components/common/ClayModal';
import { ClayDrawer } from '../components/common/ClayDrawer';
import { ConceptTooltip } from '../components/common/ConceptTooltip';
import { db } from '../db/db';
import { PaymentWithDetails, PurchaseOrderWithDetails } from '../types/database';
import { draftPaymentReminder, PaymentReminderResponse } from '../services/ai';
import { useToast } from '../components/common/ClayToast';
import { useTheme } from '../theme/ThemeContext';

export const PaymentsPage: React.FC = () => {
  const { aiEnabled } = useTheme();
  const { showToast } = useToast();

  const [payments, setPayments] = useState<PaymentWithDetails[]>(db.getPayments());
  const [orders, setOrders] = useState<PurchaseOrderWithDetails[]>(db.getPurchaseOrders());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Paid' | 'Pending'>('ALL');

  // Selected Payment for Drawer
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null);

  // Record Payment Modal
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [formOrderId, setFormOrderId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formInstallments, setFormInstallments] = useState<string[]>(['']);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Add Installment Modal inside Drawer
  const [addInstallmentModalOpen, setAddInstallmentModalOpen] = useState(false);
  const [newInstallmentAmount, setNewInstallmentAmount] = useState('');
  const [installmentError, setInstallmentError] = useState<string | null>(null);

  // AI Payment Reminder Modal
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderTarget, setReminderTarget] = useState<PaymentWithDetails | null>(null);
  const [reminderContent, setReminderContent] = useState<PaymentReminderResponse | null>(null);
  const [loadingReminder, setLoadingReminder] = useState(false);
  const [copiedReminder, setCopiedReminder] = useState(false);

  // Delete payment
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentWithDetails | null>(null);

  const refreshData = () => {
    setPayments(db.getPayments());
    setOrders(db.getPurchaseOrders());
  };

  useEffect(() => {
    const unsub = db.subscribe(refreshData);
    return () => unsub();
  }, []);

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  // Summary Metrics
  const totalPaid = payments.reduce((sum, p) => sum + p.InstallmentsSum, 0);
  const totalDue = payments.reduce((sum, p) => sum + p.RemainingBalance, 0);
  const overduePayments = payments.filter((p) => p.Status === 'Pending' && p.OrderStatus === 'Delivered');

  // Eligible orders that DO NOT have a payment record yet (1:1 UNIQUE constraint)
  const eligibleOrders = orders.filter((o) => !o.Payment);

  // Open Record Payment Modal
  const handleOpenRecord = (orderId?: string) => {
    const targetOrder = orderId
      ? orders.find((o) => o.OrderID === orderId)
      : eligibleOrders[0];

    if (!targetOrder && !orderId) {
      showToast({
        type: 'info',
        title: 'All Orders Paid',
        message: 'Every purchase order currently has an associated payment record.',
      });
      return;
    }

    const orderToUse = targetOrder || orders[0];
    setFormOrderId(orderToUse.OrderID);
    setFormAmount(String(orderToUse.TotalCost));
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormInstallments(['']);
    setFormErrors({});
    setRecordModalOpen(true);
  };

  // Live remaining calculation in record modal
  const selectedOrderForPayment = orders.find((o) => o.OrderID === formOrderId);
  const orderDerivedTotal = selectedOrderForPayment ? selectedOrderForPayment.TotalCost : 0;
  const numPaymentAmount = Number(formAmount) || 0;
  const sumModalInstallments = formInstallments.reduce((sum, v) => sum + (Number(v) || 0), 0);
  const modalRemaining = Math.max(0, numPaymentAmount - sumModalInstallments);

  // Add installment row in record modal
  const handleAddModalInstallment = () => {
    setFormInstallments([...formInstallments, '']);
  };

  const handleUpdateModalInstallment = (idx: number, val: string) => {
    const updated = [...formInstallments];
    updated[idx] = val;
    setFormInstallments(updated);
  };

  const handleRemoveModalInstallment = (idx: number) => {
    setFormInstallments(formInstallments.filter((_, i) => i !== idx));
  };

  // Submit Record Payment
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!formOrderId) errors.order = 'Please select a purchase order.';
    if (numPaymentAmount <= 0) errors.amount = 'Amount must be greater than 0.';
    if (numPaymentAmount > orderDerivedTotal) {
      errors.amount = `Amount cannot exceed Order Derived TotalCost (₹${orderDerivedTotal}).`;
    }

    const validInstallmentNums = formInstallments
      .map((i) => Number(i))
      .filter((n) => !isNaN(n) && n > 0);

    const sumInst = validInstallmentNums.reduce((a, b) => a + b, 0);
    if (sumInst > numPaymentAmount) {
      errors.installments = `Installments sum (₹${sumInst}) exceeds Payment Amount (₹${numPaymentAmount}).`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const res = db.recordPayment({
      OrderID: formOrderId,
      Amount: numPaymentAmount,
      PaymentDate: formDate,
      Installments: validInstallmentNums,
    });

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Payment Recorded',
        message: `Payment ${res.paymentId} generated with 1:1 relation to Order ${formOrderId}.`,
      });
      setRecordModalOpen(false);
    } else {
      setFormErrors({ general: res.error || 'Recording payment failed' });
    }
  };

  // Add individual installment to existing payment
  const handleAddInstallmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    const amt = Number(newInstallmentAmount);
    if (isNaN(amt) || amt <= 0) {
      setInstallmentError('Amount must be greater than 0.');
      return;
    }

    const res = db.addInstallment(selectedPayment.PaymentID, amt);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Installment Added',
        message: `Recorded weak entity installment of ₹${amt}.`,
      });
      setAddInstallmentModalOpen(false);
      setNewInstallmentAmount('');
      setInstallmentError(null);
      // Refresh current selected payment in drawer
      const updatedPay = db.getPayments().find((p) => p.PaymentID === selectedPayment.PaymentID);
      if (updatedPay) setSelectedPayment(updatedPay);
    } else {
      setInstallmentError(res.error || 'Failed to add installment');
    }
  };

  // AI Draft Payment Reminder
  const handleOpenReminder = async (payment: PaymentWithDetails) => {
    setReminderTarget(payment);
    setReminderModalOpen(true);
    setCopiedReminder(false);

    if (!aiEnabled) {
      setReminderContent({
        subject: `Payment Reminder: Pending Balance for Order ${payment.OrderID}`,
        body: `Dear ${payment.VendorName},\n\nThis is a friendly reminder regarding Purchase Order ${payment.OrderID}. Outstanding balance is ${formatINR(payment.RemainingBalance)}. Please verify invoice details.\n\nBest regards,\nProcurement Team`,
      });
      return;
    }

    setLoadingReminder(true);
    const res = await draftPaymentReminder({
      vendorName: payment.VendorName,
      orderId: payment.OrderID,
      amount: payment.Amount,
      remainingBalance: payment.RemainingBalance,
      paymentDate: payment.PaymentDate,
      installmentsCount: payment.Installments.length,
    });
    setLoadingReminder(false);

    if (res) {
      setReminderContent(res);
    } else {
      showToast({
        type: 'warning',
        title: 'AI Unavailable',
        message: 'Could not reach Gemini. Generated standard reminder template.',
      });
      setReminderContent({
        subject: `Payment Follow-up: Order ${payment.OrderID}`,
        body: `Dear ${payment.VendorName},\n\nWe would like to confirm that payment ${payment.PaymentID} for Order ${payment.OrderID} has an outstanding balance of ${formatINR(payment.RemainingBalance)}. Kindly update us regarding installment milestones.\n\nThank you,\nVendor Management`,
      });
    }
  };

  const handleCopyReminder = () => {
    if (!reminderContent) return;
    navigator.clipboard.writeText(`Subject: ${reminderContent.subject}\n\n${reminderContent.body}`);
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 2000);
  };

  // Delete payment
  const handleOpenDelete = (pay: PaymentWithDetails) => {
    setPaymentToDelete(pay);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!paymentToDelete) return;
    const res = db.deletePayment(paymentToDelete.PaymentID);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Payment Deleted',
        message: `Removed ${paymentToDelete.PaymentID} and cascaded deletion of all installment records.`,
      });
      setDeleteModalOpen(false);
      setPaymentToDelete(null);
      if (selectedPayment?.PaymentID === paymentToDelete.PaymentID) {
        setSelectedPayment(null);
      }
    }
  };

  // Filtered payments list
  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.PaymentID.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.OrderID.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.VendorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.Status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-3xl text-[var(--text-primary)]">
              Payment Monitoring Module
            </h1>
            <ConceptTooltip
              concept="Weak Entity & 1:1 Relationship"
              explanation="PAYMENT has a 1:1 UNIQUE relationship with PURCHASE_ORDER. PAYMENT_INSTALLMENT is a WEAK ENTITY that cannot exist without PAYMENT; its composite PK is (PaymentID, InstallmentNo)."
              rule="Weak entity discriminator: InstallmentNo (partial key)"
            />
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Track disbursements, automated status derivation, and weak-entity installment progress.
          </p>
        </div>

        <ClayButton
          variant="primary"
          onClick={() => handleOpenRecord()}
          icon={<Plus className="w-4 h-4" />}
          className="text-xs font-semibold"
        >
          Record Payment
        </ClayButton>
      </div>

      {/* SUMMARY HEADER (TOTAL PAID, TOTAL PENDING, OVERDUE) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <ClayCard className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-heading font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Total Disbursed (Paid)
            </span>
            <span className="font-heading font-extrabold text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400">
              {formatINR(totalPaid)}
            </span>
            <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
              Accumulated across all installments
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </ClayCard>

        <ClayCard className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-heading font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Outstanding Balance
            </span>
            <span className="font-heading font-extrabold text-2xl sm:text-3xl text-amber-500">
              {formatINR(totalDue)}
            </span>
            <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
              Pending future installment dates
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-500">
            <Clock className="w-6 h-6" />
          </div>
        </ClayCard>

        <ClayCard className="p-5 flex items-center justify-between border-rose-500/20">
          <div>
            <span className="text-xs font-heading font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Overdue Milestones
            </span>
            <span className="font-heading font-extrabold text-2xl sm:text-3xl text-rose-500">
              {overduePayments.length} order(s)
            </span>
            <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
              Orders marked Delivered but not Paid
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-500">
            <AlertCircle className="w-6 h-6" />
          </div>
        </ClayCard>
      </div>

      {/* Filter Bar */}
      <ClayCard className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Payment ID (PAY001), Order ID, or vendor..."
              className="clay-input pl-10 pr-4 py-2 w-full text-xs font-sans"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[var(--surface-sunken)] p-1 rounded-2xl border border-[var(--text-muted)]/15">
              {(['ALL', 'Paid', 'Pending'] as const).map((s) => (
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

      {/* Payments Table */}
      {filtered.length === 0 ? (
        <ClayCard className="py-12 text-center">
          <CreditCard className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
          <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
            No Payment Records Found
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            No payments match your current query or filter status.
          </p>
        </ClayCard>
      ) : (
        <div className="clay-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-elevated)] border-b border-[var(--text-muted)]/15 text-[var(--text-secondary)] font-heading font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Payment ID (PK)</th>
                  <th className="py-3.5 px-4">Order ID (FK & UNIQUE)</th>
                  <th className="py-3.5 px-4">Vendor</th>
                  <th className="py-3.5 px-4 text-right">Total Amount (₹)</th>
                  <th className="py-3.5 px-4">Installment Progress (Weak Entity)</th>
                  <th className="py-3.5 px-4 text-center">Derived Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--text-muted)]/10 font-sans">
                {filtered.map((p) => {
                  const percentPaid = p.Amount > 0 ? Math.min(100, Math.round((p.InstallmentsSum / p.Amount) * 100)) : 0;

                  return (
                    <tr
                      key={p.PaymentID}
                      onClick={() => setSelectedPayment(p)}
                      className="hover:bg-[var(--surface-sunken)]/60 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[var(--accent-primary)]">
                        {p.PaymentID}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[var(--text-primary)]">
                        {p.OrderID}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-heading font-bold text-[var(--text-primary)] block">
                          {p.VendorName}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">{p.PaymentDate}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[var(--text-primary)]">
                        {formatINR(p.Amount)}
                      </td>
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              {formatINR(p.InstallmentsSum)}
                            </span>
                            <span className="text-[var(--text-muted)] font-mono">
                              {percentPaid}% ({p.Installments.length} installment{p.Installments.length === 1 ? '' : 's'})
                            </span>
                          </div>
                          {/* Animated Clay Progress Bar */}
                          <div className="w-full h-2 rounded-full bg-[var(--surface-sunken)] overflow-hidden shadow-inner">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-mint)] to-[var(--accent-primary)] transition-all duration-500"
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <ClayChip
                          label={p.Status}
                          variant={p.Status === 'Paid' ? 'delivered' : 'pending'}
                          className="text-[11px]"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {p.Status === 'Pending' && (
                            <button
                              onClick={() => handleOpenReminder(p)}
                              className="p-1.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition-colors"
                              title="Draft AI Payment Reminder"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="p-1.5 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text-secondary)]"
                            title="Inspect Installments"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(p)}
                            className="p-1.5 rounded-full bg-[var(--surface-sunken)] hover:bg-rose-500/15 text-[var(--text-secondary)] hover:text-rose-500"
                            title="Delete Payment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAYMENT DETAIL DRAWER WITH WEAK ENTITY TIMELINE */}
      <ClayDrawer
        isOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        title={selectedPayment?.PaymentID || 'Payment Details'}
        subtitle={`Linked to Order ${selectedPayment?.OrderID} • Unique 1:1`}
        width="lg"
      >
        {selectedPayment && (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--text-muted)]/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)] font-heading">Vendor Payee</span>
                <ClayChip
                  label={selectedPayment.Status}
                  variant={selectedPayment.Status === 'Paid' ? 'delivered' : 'pending'}
                />
              </div>
              <h4 className="font-heading font-bold text-base text-[var(--text-primary)]">
                {selectedPayment.VendorName}
              </h4>
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div>
                  <span className="text-[var(--text-muted)] block">Total Billed:</span>
                  <span className="font-mono font-bold text-base text-[var(--text-primary)]">
                    {formatINR(selectedPayment.Amount)}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block">Remaining Due:</span>
                  <span className="font-mono font-bold text-base text-rose-500">
                    {formatINR(selectedPayment.RemainingBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Weak Entity Timeline: PAYMENT_INSTALLMENT */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-heading font-semibold text-xs text-[var(--text-primary)]">
                    Weak Entity: PAYMENT_INSTALLMENT
                  </h4>
                  <ConceptTooltip
                    concept="Weak Entity with Partial Key"
                    explanation="PAYMENT_INSTALLMENT is identified through identifying relationship 'Has Installment'. InstallmentNo is the discriminator / partial key."
                    rule="Composite PK = (PaymentID, InstallmentNo)"
                  />
                </div>
                {selectedPayment.RemainingBalance > 0 && (
                  <button
                    onClick={() => setAddInstallmentModalOpen(true)}
                    className="text-xs font-heading font-bold text-[var(--accent-primary)] hover:underline"
                  >
                    + Add Installment
                  </button>
                )}
              </div>

              {selectedPayment.Installments.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[var(--surface-sunken)] text-center text-xs text-[var(--text-muted)]">
                  No installment disbursements recorded yet.
                </div>
              ) : (
                <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--accent-primary)]/30">
                  {selectedPayment.Installments.map((inst) => (
                    <div
                      key={inst.InstallmentNo}
                      className="relative p-3 rounded-2xl bg-[var(--surface-sunken)] flex items-center justify-between text-xs"
                    >
                      {/* Connected Clay Bead */}
                      <span className="absolute -left-[22px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[var(--accent-primary)] border-2 border-[var(--surface-elevated)] shadow-sm" />
                      <div>
                        <span className="font-heading font-bold text-[var(--text-primary)]">
                          Installment #{inst.InstallmentNo}
                        </span>
                        <span className="block text-[10px] text-[var(--text-muted)]">
                          Partial Key Discriminator: {inst.InstallmentNo}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatINR(inst.InstallmentAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Action button */}
            {selectedPayment.Status === 'Pending' && (
              <ClayButton
                variant="secondary"
                onClick={() => handleOpenReminder(selectedPayment)}
                icon={<Sparkles className="w-4 h-4 text-amber-500" />}
                className="w-full text-xs"
              >
                Draft Payment Reminder Email (Gemini AI)
              </ClayButton>
            )}
          </div>
        )}
      </ClayDrawer>

      {/* RECORD PAYMENT MODAL */}
      <ClayModal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        title="Record Vendor Payment"
        subtitle="Enforces 1:1 UNIQUE OrderID constraint & auto-derives Paid/Pending status"
        maxWidth="lg"
      >
        <form onSubmit={handleSavePayment} className="space-y-4 pt-1">
          {formErrors.general && (
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 text-xs border border-rose-500/30">
              {formErrors.general}
            </div>
          )}

          <div>
            <label className="font-heading font-medium text-xs text-[var(--text-secondary)] pl-1 block mb-1.5">
              Target Purchase Order (1:1 UNIQUE) <span className="text-rose-500">*</span>
            </label>
            <select
              value={formOrderId}
              onChange={(e) => {
                setFormOrderId(e.target.value);
                const order = orders.find((o) => o.OrderID === e.target.value);
                if (order) setFormAmount(String(order.TotalCost));
              }}
              className="clay-input w-full text-sm font-sans"
            >
              {orders.map((o) => {
                const hasPay = Boolean(o.Payment);
                return (
                  <option key={o.OrderID} value={o.OrderID} disabled={hasPay}>
                    {o.OrderID} — {o.VendorName} (Total: {formatINR(o.TotalCost)}) {hasPay ? '[Payment Exists]' : ''}
                  </option>
                );
              })}
            </select>
            {formErrors.order && (
              <p className="text-xs text-rose-500 mt-1 pl-1">{formErrors.order}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ClayInput
              label="Payment Amount in ₹"
              required
              type="number"
              min="1"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              helper={`Order Derived TotalCost: ${formatINR(orderDerivedTotal)}`}
              error={formErrors.amount}
            />

            <ClayInput
              label="Payment Date"
              required
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />
          </div>

          {/* Optional Installment Plan Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="font-heading font-medium text-xs text-[var(--text-secondary)] pl-1">
                  Initial Installment Disbursements (Weak Entity)
                </label>
                <p className="text-[11px] text-[var(--text-muted)] pl-1">
                  If installments sum equals Payment Amount, status automatically sets to &quot;Paid&quot;.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddModalInstallment}
                className="text-xs font-heading font-bold text-[var(--accent-primary)] hover:underline"
              >
                + Add Installment
              </button>
            </div>

            <div className="space-y-2">
              {formInstallments.map((inst, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[var(--text-muted)] w-8">
                    #{idx + 1}
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={inst}
                    onChange={(e) => handleUpdateModalInstallment(idx, e.target.value)}
                    placeholder="Installment amount in ₹"
                    className="clay-input flex-1 py-1.5 px-3 text-xs font-mono"
                  />
                  {formInstallments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveModalInstallment(idx)}
                      className="p-1 text-[var(--text-muted)] hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {formErrors.installments && (
              <p className="text-xs text-rose-500 mt-1 pl-1">{formErrors.installments}</p>
            )}

            <div className="p-3 rounded-2xl bg-[var(--surface-sunken)] mt-3 flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Remaining Balance:</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">
                {formatINR(modalRemaining)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--text-muted)]/15">
            <ClayButton variant="secondary" type="button" onClick={() => setRecordModalOpen(false)}>
              Cancel
            </ClayButton>
            <ClayButton variant="primary" type="submit">
              Save Payment Record
            </ClayButton>
          </div>
        </form>
      </ClayModal>

      {/* ADD SINGLE INSTALLMENT MODAL */}
      <ClayModal
        isOpen={addInstallmentModalOpen}
        onClose={() => setAddInstallmentModalOpen(false)}
        title="Add Weak Entity Installment"
        subtitle={`Payment ID: ${selectedPayment?.PaymentID} • Remaining: ${formatINR(selectedPayment?.RemainingBalance || 0)}`}
        maxWidth="sm"
      >
        <form onSubmit={handleAddInstallmentSubmit} className="space-y-4 pt-1">
          {installmentError && (
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 text-xs border border-rose-500/30">
              {installmentError}
            </div>
          )}

          <ClayInput
            label="Installment Amount in ₹"
            required
            type="number"
            min="1"
            max={selectedPayment?.RemainingBalance}
            value={newInstallmentAmount}
            onChange={(e) => setNewInstallmentAmount(e.target.value)}
            placeholder="e.g. 15000"
            helper={`Cannot exceed remaining balance of ${formatINR(selectedPayment?.RemainingBalance || 0)}`}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--text-muted)]/15">
            <ClayButton variant="secondary" size="sm" type="button" onClick={() => setAddInstallmentModalOpen(false)}>
              Cancel
            </ClayButton>
            <ClayButton variant="primary" size="sm" type="submit">
              Record Installment
            </ClayButton>
          </div>
        </form>
      </ClayModal>

      {/* AI DRAFT PAYMENT REMINDER MODAL */}
      <ClayModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>AI Payment Reminder Drafter</span>
          </div>
        }
        subtitle={`Recipient: ${reminderTarget?.VendorName} (Due: ${formatINR(reminderTarget?.RemainingBalance || 0)})`}
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          {loadingReminder ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-xs text-[var(--text-muted)]">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
              <span>Drafting polite professional payment notice with Gemini...</span>
            </div>
          ) : reminderContent ? (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--text-muted)]/15 text-xs">
                <span className="font-heading font-semibold text-[var(--text-muted)] block mb-0.5">Subject:</span>
                <span className="font-heading font-bold text-[var(--text-primary)]">{reminderContent.subject}</span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--accent-primary)]/20 text-xs font-sans whitespace-pre-wrap leading-relaxed text-[var(--text-primary)] shadow-inner">
                {reminderContent.body}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => reminderTarget && handleOpenReminder(reminderTarget)}
                  className="text-xs font-heading text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate draft</span>
                </button>

                <div className="flex gap-2">
                  <ClayButton variant="secondary" size="sm" onClick={() => setReminderModalOpen(false)}>
                    Close
                  </ClayButton>
                  <ClayButton
                    variant="primary"
                    size="sm"
                    onClick={handleCopyReminder}
                    icon={copiedReminder ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copiedReminder ? 'Copied to Clipboard' : 'Copy Message'}
                  </ClayButton>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </ClayModal>

      {/* DELETE PAYMENT MODAL */}
      <ClayModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Payment Record"
        subtitle="Referential CASCADE Rule Preview"
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-heading font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Confirm Payment Deletion</span>
            </div>
            <p>
              Deleting Payment <strong>{paymentToDelete?.PaymentID}</strong> will CASCADE delete all associated weak-entity installment rows in PAYMENT_INSTALLMENT ({paymentToDelete?.Installments.length} installment records).
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--text-muted)]/15">
            <ClayButton variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </ClayButton>
            <ClayButton variant="danger" onClick={handleConfirmDelete}>
              Confirm Delete
            </ClayButton>
          </div>
        </div>
      </ClayModal>
    </div>
  );
};
