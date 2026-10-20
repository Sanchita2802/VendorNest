import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  ShoppingCart,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { ClayCard } from '../components/common/ClayCard';
import { ClayButton } from '../components/common/ClayButton';
import { ClayInput } from '../components/common/ClayInput';
import { ClayChip } from '../components/common/ClayChip';
import { ClayModal } from '../components/common/ClayModal';
import { ClayDrawer } from '../components/common/ClayDrawer';
import { ConceptTooltip } from '../components/common/ConceptTooltip';
import { db } from '../db/db';
import { VendorWithDetails } from '../types/database';
import { useToast } from '../components/common/ClayToast';

export const VendorsPage: React.FC<{ onNavigateToOrder?: (vendorId: string) => void }> = () => {
  const [vendors, setVendors] = useState<VendorWithDetails[]>(db.getVendors());
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Sorting
  const [sortField, setSortField] = useState<keyof VendorWithDetails>('VendorID');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected vendor for detail drawer
  const [selectedVendor, setSelectedVendor] = useState<VendorWithDetails | null>(null);

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formStreet, setFormStreet] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formContacts, setFormContacts] = useState<string[]>(['']);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Delete Confirm Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<VendorWithDetails | null>(null);
  const [deleteBlockedReason, setDeleteBlockedReason] = useState<string | null>(null);

  const { showToast } = useToast();

  const refreshVendors = () => {
    setVendors(db.getVendors());
  };

  useEffect(() => {
    const unsub = db.subscribe(refreshVendors);
    return () => unsub();
  }, []);

  // Automatic Pincode -> City fill (3NF demonstration)
  useEffect(() => {
    if (formPincode.trim().length === 6) {
      const knownCity = db.getCityByPincode(formPincode.trim());
      if (knownCity) {
        setFormCity(knownCity);
      }
    }
  }, [formPincode]);

  const existingCategories = Array.from(new Set(vendors.map((v) => v.Category)));

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingVendorId(null);
    setFormName('');
    setFormCategory(existingCategories[0] || 'Office Supplies');
    setFormStreet('');
    setFormPincode('');
    setFormCity('');
    setFormContacts(['']);
    setFormErrors({});
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (vendor: VendorWithDetails) => {
    setEditingVendorId(vendor.VendorID);
    setFormName(vendor.VendorName);
    setFormCategory(vendor.Category);
    setFormStreet(vendor.Street);
    setFormPincode(vendor.Pincode);
    setFormCity(vendor.City);
    setFormContacts(vendor.Contacts.length > 0 ? [...vendor.Contacts] : ['']);
    setFormErrors({});
    setModalOpen(true);
  };

  // Open Delete Dialog with RESTRICT check
  const handleOpenDelete = (vendor: VendorWithDetails) => {
    setVendorToDelete(vendor);
    const raw = db.getRawData();
    const linkedOrders = raw.PURCHASE_ORDER.filter((o) => o.VendorID === vendor.VendorID);

    if (linkedOrders.length > 0) {
      const orderIds = linkedOrders.map((o) => o.OrderID).join(', ');
      setDeleteBlockedReason(
        `FOREIGN KEY RESTRICT RULE: Cannot delete vendor '${vendor.VendorName}' (${vendor.VendorID}) because active Purchase Orders [${orderIds}] reference it. Please delete or reassign those orders first.`
      );
    } else {
      setDeleteBlockedReason(null);
    }
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!vendorToDelete) return;

    const res = db.deleteVendor(vendorToDelete.VendorID);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Vendor Deleted',
        message: `Removed ${vendorToDelete.VendorName} and cascaded deletion to its contact records and catalog items.`,
      });
      setDeleteModalOpen(false);
      setVendorToDelete(null);
      if (selectedVendor?.VendorID === vendorToDelete.VendorID) {
        setSelectedVendor(null);
      }
    } else {
      showToast({
        type: 'error',
        title: 'Constraint Blocked Delete',
        message: res.error,
      });
    }
  };

  // Contact list management
  const handleAddContact = () => {
    setFormContacts([...formContacts, '']);
  };

  const handleRemoveContact = (index: number) => {
    if (formContacts.length <= 1) return;
    setFormContacts(formContacts.filter((_, i) => i !== index));
  };

  const handleContactChange = (index: number, val: string) => {
    const updated = [...formContacts];
    updated[index] = val.replace(/\D/g, '').substring(0, 10);
    setFormContacts(updated);
  };

  // Save Vendor Submit
  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!formName.trim()) errors.name = 'Vendor Name is required.';
    if (!formCategory.trim()) errors.category = 'Category is required.';
    if (!formStreet.trim()) errors.street = 'Street address is required.';
    if (!/^\d{6}$/.test(formPincode.trim())) errors.pincode = 'Pincode must be exactly 6 digits.';
    if (!formCity.trim()) errors.city = 'City name is required.';

    const validContacts = formContacts.map((c) => c.trim()).filter((c) => c.length > 0);
    if (validContacts.length === 0) {
      errors.contacts = 'At least one contact number is required.';
    } else {
      for (const c of validContacts) {
        if (!/^\d{10}$/.test(c)) {
          errors.contacts = 'All phone numbers must be 10 digits.';
          break;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingVendorId) {
      const res = db.updateVendor(editingVendorId, {
        VendorName: formName,
        Category: formCategory,
        Street: formStreet,
        Pincode: formPincode,
        City: formCity,
        Contacts: validContacts,
      });
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Vendor Updated',
          message: `Updated records for ${formName} (3NF Pincode and composite contacts).`,
        });
        setModalOpen(false);
      } else {
        setFormErrors({ general: res.error || 'Update failed' });
      }
    } else {
      const res = db.addVendor({
        VendorName: formName,
        Category: formCategory,
        Street: formStreet,
        Pincode: formPincode,
        City: formCity,
        Contacts: validContacts,
      });
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Vendor Created',
          message: `Created vendor ${res.vendorId} with multi-valued contact storage.`,
        });
        setModalOpen(false);
      } else {
        setFormErrors({ general: res.error || 'Creation failed' });
      }
    }
  };

  // Filtering & Sorting
  const filtered = vendors.filter((v) => {
    const matchesSearch =
      v.VendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.VendorID.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.City.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.Category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || v.Category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  filtered.sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') {
      return sortDirection === 'asc'
        ? (aVal as string).localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal as string);
    }
    return sortDirection === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSort = (field: keyof VendorWithDetails) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-3xl text-[var(--text-primary)]">
              Vendor Management Module
            </h1>
            <ConceptTooltip
              concept="3NF Normalization & Multi-Valued Attributes"
              explanation="VENDOR is split into PINCODE_CITY (eliminating the Pincode->City transitive dependency) and VENDOR_CONTACT (a 1:N Composite PK table resolving multi-valued contact numbers)."
              rule="Pincode PK in PINCODE_CITY; (VendorID, ContactNo) Composite PK in VENDOR_CONTACT"
            />
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Maintain complete vendor registries, multi-contact directories, and geographic 3NF mapping.
          </p>
        </div>

        <ClayButton
          variant="primary"
          onClick={handleOpenAdd}
          icon={<Plus className="w-4 h-4" />}
          className="text-xs font-semibold"
        >
          Add New Vendor
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by vendor name, category, city, or ID (e.g. V01)..."
              className="clay-input pl-10 pr-4 py-2 w-full text-xs font-sans"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="clay-input py-2 px-3 text-xs bg-[var(--surface-sunken)]"
            >
              <option value="ALL">All Categories ({vendors.length})</option>
              {existingCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-[var(--surface-sunken)] p-1 rounded-2xl border border-[var(--text-muted)]/15">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-xl transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </ClayCard>

      {/* Main Content: Table or Grid */}
      {paginated.length === 0 ? (
        <ClayCard className="py-12 text-center">
          <Building2 className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
          <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
            No Vendors Found
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
            No vendor records match your query or category filters. Try adjusting your search term.
          </p>
          <ClayButton variant="secondary" size="sm" onClick={() => setSearchQuery('')} className="mt-4">
            Clear Filters
          </ClayButton>
        </ClayCard>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="clay-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-elevated)] border-b border-[var(--text-muted)]/15 text-[var(--text-secondary)] font-heading font-semibold">
                <tr>
                  <th
                    onClick={() => toggleSort('VendorID')}
                    className="py-3.5 px-4 cursor-pointer hover:text-[var(--accent-primary)]"
                  >
                    <div className="flex items-center gap-1">
                      <span>ID (PK)</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('VendorName')}
                    className="py-3.5 px-4 cursor-pointer hover:text-[var(--accent-primary)]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Vendor Name</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Contact Numbers (1:N)</th>
                  <th className="py-3.5 px-4">Address & 3NF City</th>
                  <th className="py-3.5 px-3 text-center">Catalog</th>
                  <th className="py-3.5 px-3 text-center">Orders</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--text-muted)]/10 font-sans">
                {paginated.map((v) => (
                  <tr
                    key={v.VendorID}
                    onClick={() => setSelectedVendor(v)}
                    className="hover:bg-[var(--surface-sunken)]/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--accent-primary)]">
                      {v.VendorID}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-heading font-bold text-[var(--text-primary)] block">
                        {v.VendorName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <ClayChip label={v.Category} variant="secondary" className="text-[11px]" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {v.Contacts.map((c, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-sunken)] text-[var(--text-secondary)] border border-[var(--text-muted)]/15"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-[var(--text-secondary)]">
                      <span className="block truncate max-w-[180px]">{v.Street}</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {v.City} — {v.Pincode}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[11px]">
                        {v.ProductCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono font-bold text-[11px]">
                        {v.OrderCount}
                      </span>
                    </td>
                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="p-1.5 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          title="Edit Vendor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(v)}
                          className="p-1.5 rounded-full bg-[var(--surface-sunken)] hover:bg-rose-500/15 text-[var(--text-secondary)] hover:text-rose-500 transition-colors"
                          title="Delete Vendor"
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
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginated.map((v) => (
            <ClayCard
              key={v.VendorID}
              onClick={() => setSelectedVendor(v)}
              className="cursor-pointer hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
                    {v.VendorID}
                  </span>
                  <ClayChip label={v.Category} variant="secondary" className="text-[10px]" />
                </div>

                <h3 className="font-heading font-bold text-base text-[var(--text-primary)] mb-1">
                  {v.VendorName}
                </h3>

                <div className="space-y-1.5 text-xs text-[var(--text-secondary)] mt-3">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      {v.Street}, <strong className="text-[var(--text-primary)]">{v.City}</strong> ({v.Pincode})
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="font-mono text-[11px] truncate">
                      {v.Contacts.join(' • ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[var(--text-muted)]/15 flex items-center justify-between text-xs">
                <div className="flex gap-2">
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Products: <strong className="text-[var(--text-primary)]">{v.ProductCount}</strong>
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Orders: <strong className="text-[var(--text-primary)]">{v.OrderCount}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleOpenEdit(v)}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(v)}
                    className="p-1 text-[var(--text-muted)] hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </ClayCard>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-[var(--text-muted)]">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} vendors
          </span>
          <div className="flex items-center gap-2">
            <ClayButton
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Prev
            </ClayButton>
            <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-[var(--surface-sunken)]">
              {currentPage} / {totalPages}
            </span>
            <ClayButton
              variant="secondary"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              icon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </ClayButton>
          </div>
        </div>
      )}

      {/* VENDOR DETAIL DRAWER */}
      <ClayDrawer
        isOpen={Boolean(selectedVendor)}
        onClose={() => setSelectedVendor(null)}
        title={selectedVendor?.VendorName || 'Vendor Details'}
        subtitle={`Vendor ID: ${selectedVendor?.VendorID} • 3NF Normalized`}
        width="lg"
      >
        {selectedVendor && (
          <div className="space-y-6">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-[var(--surface-sunken)] text-center">
                <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block">Catalog</span>
                <span className="font-heading font-extrabold text-lg text-[var(--accent-primary)]">
                  {selectedVendor.ProductCount} items
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--surface-sunken)] text-center">
                <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block">Orders</span>
                <span className="font-heading font-extrabold text-lg text-emerald-500">
                  {selectedVendor.OrderCount} placed
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--surface-sunken)] text-center">
                <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block">Outstanding</span>
                <span className="font-heading font-bold text-sm text-rose-500 truncate block">
                  {formatINR(selectedVendor.TotalOutstanding)}
                </span>
              </div>
            </div>

            {/* Address & 3NF Normalization Info */}
            <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--text-muted)]/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-heading font-semibold text-xs text-[var(--text-primary)]">
                  Physical Location (3NF Decomposed)
                </span>
                <ClayChip label="PINCODE_CITY Join" variant="primary" className="text-[10px]" />
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{selectedVendor.Street}</p>
              <div className="flex items-center gap-3 text-xs pt-1">
                <span>
                  City: <strong className="text-[var(--text-primary)]">{selectedVendor.City}</strong>
                </span>
                <span>
                  Pincode: <strong className="font-mono text-[var(--accent-primary)]">{selectedVendor.Pincode}</strong>
                </span>
              </div>
            </div>

            {/* Multi-valued Contacts Table */}
            <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--text-muted)]/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-heading font-semibold text-xs text-[var(--text-primary)]">
                  Contact Directory (VENDOR_CONTACT)
                </span>
                <ClayChip label="Composite PK" variant="secondary" className="text-[10px]" />
              </div>
              <div className="space-y-1.5 pt-1">
                {selectedVendor.Contacts.map((c, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-[var(--surface-sunken)] flex items-center justify-between text-xs"
                  >
                    <span className="text-[var(--text-muted)] font-mono">Contact #{i + 1}</span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Products Supplied List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-semibold text-xs text-[var(--text-primary)]">
                  Catalog Products Supplied ({selectedVendor.ProductCount})
                </h4>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {db
                  .getProducts()
                  .filter((p) => p.VendorID === selectedVendor.VendorID)
                  .map((p) => (
                    <div
                      key={p.ProductID}
                      className="p-2.5 rounded-2xl bg-[var(--surface-sunken)] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[var(--text-primary)]">{p.ProductName}</span>
                        <span className="block text-[10px] text-[var(--text-muted)] font-mono">
                          {p.ProductID} • {p.Type} {p.HSNCode ? `(HSN: ${p.HSNCode})` : `(${p.ServiceHours} hrs)`}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatINR(p.Price)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Action buttons in Drawer */}
            <div className="flex gap-2 pt-2 border-t border-[var(--text-muted)]/15">
              <ClayButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  handleOpenEdit(selectedVendor);
                  setSelectedVendor(null);
                }}
                icon={<Edit2 className="w-3.5 h-3.5" />}
                className="flex-1"
              >
                Edit Vendor
              </ClayButton>
              <ClayButton
                variant="danger"
                size="sm"
                onClick={() => {
                  handleOpenDelete(selectedVendor);
                  setSelectedVendor(null);
                }}
                icon={<Trash2 className="w-3.5 h-3.5" />}
                className="flex-1"
              >
                Delete Vendor
              </ClayButton>
            </div>
          </div>
        )}
      </ClayDrawer>

      {/* ADD / EDIT VENDOR MODAL */}
      <ClayModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVendorId ? `Edit Vendor (${editingVendorId})` : 'Register New Vendor'}
        subtitle="Enforces 3NF: Pincode -> City functional dependency & Composite PK Contacts"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveVendor} className="space-y-4 pt-1">
          {formErrors.general && (
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 text-xs border border-rose-500/30">
              {formErrors.general}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ClayInput
              label="Vendor Name"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Apex Industrial Works"
              error={formErrors.name}
            />

            <div>
              <label className="font-heading font-medium text-xs text-[var(--text-secondary)] pl-1 block mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <input
                list="category-options"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Select or enter new category"
                className="clay-input w-full text-sm font-sans"
              />
              <datalist id="category-options">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {formErrors.category && (
                <p className="text-xs text-rose-500 mt-1 pl-1">{formErrors.category}</p>
              )}
            </div>
          </div>

          <ClayInput
            label="Street Address"
            required
            value={formStreet}
            onChange={(e) => setFormStreet(e.target.value)}
            placeholder="Plot / Street / MIDC Area"
            error={formErrors.street}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ClayInput
              label="Pincode (6 Digits)"
              required
              value={formPincode}
              onChange={(e) => setFormPincode(e.target.value.replace(/\D/g, '').substring(0, 6))}
              placeholder="422001"
              helper="Auto-fills City from PINCODE_CITY (3NF preserved)"
              error={formErrors.pincode}
            />

            <ClayInput
              label="City"
              required
              value={formCity}
              onChange={(e) => setFormCity(e.target.value)}
              placeholder="Nashik, Pune, Mumbai, etc."
              error={formErrors.city}
              helper={
                db.getCityByPincode(formPincode.trim())
                  ? 'Auto-resolved from PINCODE_CITY table'
                  : 'New pincode: will insert a new PINCODE_CITY entry'
              }
            />
          </div>

          {/* Dynamic Multi-valued Contacts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-heading font-medium text-xs text-[var(--text-secondary)] pl-1">
                Contact Numbers (Multi-Valued Attribute) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddContact}
                className="text-xs font-heading font-bold text-[var(--accent-primary)] hover:underline flex items-center gap-1"
              >
                + Add Another Number
              </button>
            </div>

            <div className="space-y-2">
              {formContacts.map((contact, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <ClayInput
                    value={contact}
                    onChange={(e) => handleContactChange(idx, e.target.value)}
                    placeholder="10-digit Indian Mobile (e.g. 9822014589)"
                    className="font-mono text-xs"
                  />
                  {formContacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(idx)}
                      className="p-2 text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                      title="Remove contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {formErrors.contacts && (
              <p className="text-xs text-rose-500 mt-1 pl-1">{formErrors.contacts}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--text-muted)]/15">
            <ClayButton variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </ClayButton>
            <ClayButton variant="primary" type="submit">
              {editingVendorId ? 'Save Changes' : 'Register Vendor'}
            </ClayButton>
          </div>
        </form>
      </ClayModal>

      {/* DELETE CONFIRM / RESTRICT IMPACT MODAL */}
      <ClayModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Vendor Record"
        subtitle="Referential Action Validation (RESTRICT vs CASCADE)"
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          {deleteBlockedReason ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-heading font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Action Blocked by DBMS RESTRICT Rule</span>
              </div>
              <p>{deleteBlockedReason}</p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-heading font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>CASCADE Delete Impact Preview</span>
              </div>
              <p>
                Deleting vendor <strong>{vendorToDelete?.VendorName}</strong> ({vendorToDelete?.VendorID}) has no active purchase orders and will perform a <strong>CASCADE delete</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>All contact numbers in VENDOR_CONTACT will be deleted</li>
                <li>All products belonging to this vendor in PRODUCT will be removed</li>
                <li>All specialized GOODS and SERVICE records will be cleaned up</li>
              </ul>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--text-muted)]/15">
            <ClayButton variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Close
            </ClayButton>
            {!deleteBlockedReason && (
              <ClayButton variant="danger" onClick={handleConfirmDelete}>
                Confirm CASCADE Delete
              </ClayButton>
            )}
          </div>
        </div>
      </ClayModal>
    </div>
  );
};
