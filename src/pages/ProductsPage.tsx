import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  Edit2,
  Trash2,
  AlertTriangle,
  Building2,
  Clock,
  FileText,
  SlidersHorizontal,
  Loader2,
} from 'lucide-react';
import { ClayCard } from '../components/common/ClayCard';
import { ClayButton } from '../components/common/ClayButton';
import { ClayInput } from '../components/common/ClayInput';
import { ClaySelect } from '../components/common/ClaySelect';
import { ClayChip } from '../components/common/ClayChip';
import { ClayModal } from '../components/common/ClayModal';
import { ConceptTooltip } from '../components/common/ConceptTooltip';
import { db } from '../db/db';
import { ProductWithDetails } from '../types/database';
import { suggestProductDetails } from '../services/ai';
import { useToast } from '../components/common/ClayToast';
import { useTheme } from '../theme/ThemeContext';

export const ProductsPage: React.FC = () => {
  const { aiEnabled } = useTheme();
  const { showToast } = useToast();

  const [products, setProducts] = useState<ProductWithDetails[]>(db.getProducts());
  const [vendors, setVendors] = useState(db.getVendors());
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [groupByVendor, setGroupByVendor] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Goods' | 'Service'>('ALL');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(60000);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formVendorId, setFormVendorId] = useState('');
  const [formType, setFormType] = useState<'Goods' | 'Service'>('Goods');
  const [formHsnCode, setFormHsnCode] = useState('');
  const [formServiceHours, setFormServiceHours] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [aiSuggesting, setAiSuggesting] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductWithDetails | null>(null);
  const [deleteBlockedReason, setDeleteBlockedReason] = useState<string | null>(null);

  const refreshProducts = () => {
    setProducts(db.getProducts());
    setVendors(db.getVendors());
  };

  useEffect(() => {
    const unsub = db.subscribe(refreshProducts);
    return () => unsub();
  }, []);

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  // Open Add Product
  const handleOpenAdd = () => {
    setEditingProductId(null);
    setFormName('');
    setFormPrice('');
    setFormVendorId(vendors[0]?.VendorID || '');
    setFormType('Goods');
    setFormHsnCode('');
    setFormServiceHours('');
    setFormErrors({});
    setModalOpen(true);
  };

  // Open Edit Product
  const handleOpenEdit = (p: ProductWithDetails) => {
    setEditingProductId(p.ProductID);
    setFormName(p.ProductName);
    setFormPrice(String(p.Price));
    setFormVendorId(p.VendorID);
    setFormType(p.Type);
    setFormHsnCode(p.HSNCode || '');
    setFormServiceHours(p.ServiceHours ? String(p.ServiceHours) : '');
    setFormErrors({});
    setModalOpen(true);
  };

  // AI Smart Product Helper
  const handleAiSuggest = async () => {
    if (!formName.trim()) {
      setFormErrors({ name: 'Please enter a product name first before asking AI.' });
      return;
    }
    if (!aiEnabled) {
      showToast({
        type: 'info',
        title: 'AI is Disabled',
        message: 'Enable Gemini AI in Settings to use Smart Product suggestions.',
      });
      return;
    }

    const currentVendor = vendors.find((v) => v.VendorID === formVendorId);
    setAiSuggesting(true);
    const result = await suggestProductDetails(formName, currentVendor?.Category || 'General');
    setAiSuggesting(false);

    if (result) {
      setFormType(result.type);
      if (result.type === 'Goods' && result.hsnCode) {
        setFormHsnCode(result.hsnCode);
      }
      if (result.type === 'Service' && result.serviceHours) {
        setFormServiceHours(String(result.serviceHours));
      }
      if (result.estimatedPrice && !formPrice) {
        setFormPrice(String(result.estimatedPrice));
      }
      showToast({
        type: 'success',
        title: 'Smart Suggestions Applied',
        message: `Classified as ${result.type}. Please verify HSN code or hours before finalizing.`,
      });
    } else {
      showToast({
        type: 'warning',
        title: 'AI Unavailable',
        message: 'Could not contact Gemini. Using default heuristics.',
      });
      const isService = /service|audit|cabling|consulting|maintenance/i.test(formName);
      setFormType(isService ? 'Service' : 'Goods');
      if (isService) setFormServiceHours('16');
      else setFormHsnCode('84713010');
    }
  };

  // Save Product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!formName.trim()) errors.name = 'Product name is required.';
    const priceNum = Number(formPrice);
    if (!formPrice || isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be a valid positive number.';
    }
    if (!formVendorId) errors.vendor = 'Please select a vendor.';

    if (formType === 'Goods') {
      if (!formHsnCode.trim() || !/^\d{4,8}$/.test(formHsnCode.trim())) {
        errors.hsn = 'HSN Code must be 4 to 8 numeric digits.';
      }
    } else {
      const hoursNum = Number(formServiceHours);
      if (!formServiceHours || isNaN(hoursNum) || hoursNum <= 0) {
        errors.hours = 'Service hours must be greater than 0.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingProductId) {
      const res = db.updateProduct(editingProductId, {
        ProductName: formName,
        Price: priceNum,
        VendorID: formVendorId,
        Type: formType,
        HSNCode: formType === 'Goods' ? formHsnCode.trim() : undefined,
        ServiceHours: formType === 'Service' ? Number(formServiceHours) : undefined,
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Product Updated',
          message: `Updated product and updated disjoint subtype table (${formType}).`,
        });
        setModalOpen(false);
      } else {
        setFormErrors({ general: res.error || 'Update failed' });
      }
    } else {
      const res = db.addProduct({
        ProductName: formName,
        Price: priceNum,
        VendorID: formVendorId,
        Type: formType,
        HSNCode: formType === 'Goods' ? formHsnCode.trim() : undefined,
        ServiceHours: formType === 'Service' ? Number(formServiceHours) : undefined,
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Product Added',
          message: `Created product ${res.productId} with disjoint ${formType} record.`,
        });
        setModalOpen(false);
      } else {
        setFormErrors({ general: res.error || 'Creation failed' });
      }
    }
  };

  // Open Delete with RESTRICT check
  const handleOpenDelete = (p: ProductWithDetails) => {
    setProductToDelete(p);
    const raw = db.getRawData();
    const containsMatches = raw.CONTAINS.filter((c) => c.ProductID === p.ProductID);

    if (containsMatches.length > 0) {
      const orderIds = Array.from(new Set(containsMatches.map((c) => c.OrderID))).join(', ');
      setDeleteBlockedReason(
        `FOREIGN KEY RESTRICT RULE: Product '${p.ProductName}' (${p.ProductID}) cannot be deleted because it exists as a line item in Purchase Orders: [${orderIds}].`
      );
    } else {
      setDeleteBlockedReason(null);
    }
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!productToDelete) return;

    const res = db.deleteProduct(productToDelete.ProductID);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Product Deleted',
        message: `Deleted ${productToDelete.ProductName} and cascaded removal of its subtype ${productToDelete.Type} record.`,
      });
      setDeleteModalOpen(false);
      setProductToDelete(null);
    } else {
      showToast({
        type: 'error',
        title: 'Delete Blocked',
        message: res.error,
      });
    }
  };

  // Filtering
  const filtered = products.filter((p) => {
    const matchesSearch =
      p.ProductName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ProductID.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.VendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.HSNCode && p.HSNCode.includes(searchQuery));

    const matchesVendor = selectedVendorFilter === 'ALL' || p.VendorID === selectedVendorFilter;
    const matchesType = typeFilter === 'ALL' || p.Type === typeFilter;
    const matchesPrice = p.Price <= maxPriceFilter;

    return matchesSearch && matchesVendor && matchesType && matchesPrice;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-3xl text-[var(--text-primary)]">
              Product & Service Catalog
            </h1>
            <ConceptTooltip
              concept="Disjoint Specialization ('Is a' Relationship)"
              explanation="PRODUCT is a superclass partitioned into two mutually exclusive disjoint subtypes: GOODS (HSNCode) and SERVICE (ServiceHours). A product is strictly Goods OR Service, never both."
              rule="Disjoint specialization: PRODUCT (PK) = GOODS (PK, FK) XOR SERVICE (PK, FK)"
            />
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Maintain catalog offerings with pricing and disjoint Goods / Service attributes.
          </p>
        </div>

        <ClayButton
          variant="primary"
          onClick={handleOpenAdd}
          icon={<Plus className="w-4 h-4" />}
          className="text-xs font-semibold"
        >
          Add New Product
        </ClayButton>
      </div>

      {/* Filter Card */}
      <ClayCard className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name, ID, or HSN code..."
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

            {/* Goods / Service Segmented Toggle */}
            <div className="flex items-center bg-[var(--surface-sunken)] p-1 rounded-2xl border border-[var(--text-muted)]/15">
              {(['ALL', 'Goods', 'Service'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 rounded-xl text-xs font-heading font-medium transition-colors ${
                    typeFilter === t
                      ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Group by Vendor toggle */}
            <button
              onClick={() => setGroupByVendor(!groupByVendor)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-heading font-medium border transition-colors ${
                groupByVendor
                  ? 'bg-indigo-600 text-white border-transparent'
                  : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] border-[var(--text-muted)]/15'
              }`}
            >
              Group by Vendor
            </button>

            {/* Grid vs Table */}
            <div className="flex items-center bg-[var(--surface-sunken)] p-1 rounded-2xl border border-[var(--text-muted)]/15">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'text-[var(--text-secondary)]'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-xl transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'text-[var(--text-secondary)]'
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Price Slider Bar */}
        <div className="mt-4 pt-3 border-t border-[var(--text-muted)]/15 flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter by Max Price: <strong>{formatINR(maxPriceFilter)}</strong></span>
          </div>
          <input
            type="range"
            min="1000"
            max="60000"
            step="1000"
            value={maxPriceFilter}
            onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
            className="w-48 accent-[var(--accent-primary)]"
          />
        </div>
      </ClayCard>

      {/* Main Content */}
      {filtered.length === 0 ? (
        <ClayCard className="py-12 text-center">
          <Package className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
          <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
            No Products Found
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            No products match your current search and type filters.
          </p>
        </ClayCard>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <ClayCard
              key={p.ProductID}
              tiltOnHover
              className="flex flex-col justify-between hover:-translate-y-1.5 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--surface-sunken)] text-[var(--accent-primary)]">
                    {p.ProductID}
                  </span>
                  <ClayChip
                    label={p.Type}
                    variant={p.Type === 'Goods' ? 'mint' : 'sky'}
                    className="text-[10px]"
                  />
                </div>

                <h3 className="font-heading font-bold text-base text-[var(--text-primary)] mb-1">
                  {p.ProductName}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-3">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{p.VendorName}</span>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--surface-sunken)] space-y-1 text-xs">
                  {p.Type === 'Goods' ? (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)] font-heading">HSN Code (Goods):</span>
                      <span className="font-mono font-bold text-[var(--text-primary)]">{p.HSNCode}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)] font-heading">Service Duration:</span>
                      <span className="font-mono font-bold text-[var(--text-primary)]">{p.ServiceHours} Hours</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[var(--text-muted)]/15 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-heading">Unit Price</span>
                  <span className="font-heading font-extrabold text-lg text-emerald-600 dark:text-emerald-400">
                    {formatINR(p.Price)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-2 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    title="Edit Product"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(p)}
                    className="p-2 rounded-full bg-[var(--surface-sunken)] hover:bg-rose-500/15 text-[var(--text-secondary)] hover:text-rose-500 transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </ClayCard>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="clay-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-elevated)] border-b border-[var(--text-muted)]/15 text-[var(--text-secondary)] font-heading font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Product ID (PK)</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Subtype</th>
                  <th className="py-3.5 px-4">Disjoint Attribute</th>
                  <th className="py-3.5 px-4">Vendor (FK)</th>
                  <th className="py-3.5 px-4 text-right">Price (₹)</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--text-muted)]/10 font-sans">
                {filtered.map((p) => (
                  <tr key={p.ProductID} className="hover:bg-[var(--surface-sunken)]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--accent-primary)]">
                      {p.ProductID}
                    </td>
                    <td className="py-3.5 px-4 font-heading font-bold text-[var(--text-primary)]">
                      {p.ProductName}
                    </td>
                    <td className="py-3.5 px-4">
                      <ClayChip
                        label={p.Type}
                        variant={p.Type === 'Goods' ? 'mint' : 'sky'}
                        className="text-[10px]"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--text-secondary)]">
                      {p.Type === 'Goods' ? `HSN: ${p.HSNCode}` : `${p.ServiceHours} Hours`}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-[var(--text-secondary)]">
                      <span>{p.VendorName}</span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)] ml-1">({p.VendorID})</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINR(p.Price)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text-secondary)]"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(p)}
                          className="p-1.5 rounded-full bg-[var(--surface-sunken)] hover:bg-rose-500/15 text-[var(--text-secondary)] hover:text-rose-500"
                          title="Delete"
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

      {/* ADD / EDIT PRODUCT MODAL */}
      <ClayModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProductId ? `Edit Product (${editingProductId})` : 'Add Product to Catalog'}
        subtitle="Enforces Disjoint Specialization: PRODUCT is either Goods OR Service"
        maxWidth="md"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 pt-1">
          {formErrors.general && (
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 text-xs border border-rose-500/30">
              {formErrors.general}
            </div>
          )}

          <div className="space-y-1">
            <ClayInput
              label="Product / Service Name"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Cisco Gigabit Switch or Network Cabling"
              error={formErrors.name}
              rightElement={
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={aiSuggesting}
                  className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-indigo-500 text-white font-heading font-semibold text-[11px] flex items-center gap-1 shadow-sm hover:opacity-90 disabled:opacity-50"
                  title="Ask Gemini to suggest subtype & HSN Code"
                >
                  {aiSuggesting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-yellow-200" />
                  )}
                  <span>Smart Fill</span>
                </button>
              }
            />
            <span className="text-[10px] text-[var(--text-muted)] pl-1">
              Click &quot;Smart Fill&quot; to classify into Goods/Service and lookup HSN Code automatically.
            </span>
          </div>

          <ClaySelect
            label="Supplying Vendor (Foreign Key -> VENDOR)"
            required
            value={formVendorId}
            onChange={(e) => setFormVendorId(e.target.value)}
            options={vendors.map((v) => ({
              value: v.VendorID,
              label: `${v.VendorID} — ${v.VendorName} (${v.Category})`,
            }))}
            error={formErrors.vendor}
          />

          <ClayInput
            label="Price in ₹ (CHECK Price > 0)"
            required
            type="number"
            min="1"
            value={formPrice}
            onChange={(e) => setFormPrice(e.target.value)}
            placeholder="e.g. 14500"
            error={formErrors.price}
          />

          {/* Disjoint Specialization Segmented Toggle */}
          <div>
            <label className="font-heading font-medium text-xs text-[var(--text-secondary)] pl-1 block mb-1.5">
              Disjoint Specialization Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[var(--surface-sunken)] p-1.5 rounded-2xl border border-[var(--text-muted)]/15">
              <button
                type="button"
                onClick={() => setFormType('Goods')}
                className={`py-2 rounded-xl text-xs font-heading font-bold transition-all ${
                  formType === 'Goods'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                📦 Goods (with HSN Code)
              </button>
              <button
                type="button"
                onClick={() => setFormType('Service')}
                className={`py-2 rounded-xl text-xs font-heading font-bold transition-all ${
                  formType === 'Service'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                🛠️ Service (with Hours)
              </button>
            </div>
          </div>

          {/* Conditional Subtype Inputs */}
          {formType === 'Goods' ? (
            <ClayInput
              label="HSN Code (Goods Subtype)"
              required
              value={formHsnCode}
              onChange={(e) => setFormHsnCode(e.target.value.replace(/\D/g, '').substring(0, 8))}
              placeholder="e.g. 85176290 (4-8 digits)"
              helper="Inserted into GOODS table. Note: Verify HSN codes before real tax use."
              error={formErrors.hsn}
            />
          ) : (
            <ClayInput
              label="Service Hours (Service Subtype)"
              required
              type="number"
              min="1"
              value={formServiceHours}
              onChange={(e) => setFormServiceHours(e.target.value)}
              placeholder="e.g. 24"
              helper="Inserted into SERVICE table. Must be a positive integer."
              error={formErrors.hours}
            />
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--text-muted)]/15">
            <ClayButton variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </ClayButton>
            <ClayButton variant="primary" type="submit">
              {editingProductId ? 'Update Product' : 'Add to Catalog'}
            </ClayButton>
          </div>
        </form>
      </ClayModal>

      {/* DELETE CONFIRM MODAL (RESTRICT CHECK) */}
      <ClayModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Catalog Product"
        subtitle="Referential Action Check (RESTRICT on CONTAINS)"
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          {deleteBlockedReason ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-heading font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Deletion Blocked by RESTRICT Rule</span>
              </div>
              <p>{deleteBlockedReason}</p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-heading font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Confirm Product Deletion</span>
              </div>
              <p>
                Product <strong>{productToDelete?.ProductName}</strong> ({productToDelete?.ProductID}) does not appear in any purchase orders. Deleting it will CASCADE remove its specialized{' '}
                <strong>{productToDelete?.Type}</strong> record.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--text-muted)]/15">
            <ClayButton variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Close
            </ClayButton>
            {!deleteBlockedReason && (
              <ClayButton variant="danger" onClick={handleConfirmDelete}>
                Confirm Delete
              </ClayButton>
            )}
          </div>
        </div>
      </ClayModal>
    </div>
  );
};
