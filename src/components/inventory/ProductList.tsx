import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  Edit,
  Trash2,
  ArrowUpDown,
  TrendingDown,
  Warehouse,
  DollarSign,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Product } from '../../types';
import { formatCurrency, getTodayDateString } from '../../utils/formatters';
import { exportToExcel } from '../../utils/exportImport';
import { ConfirmModal } from '../common/ConfirmModal';

export const ProductList: React.FC = () => {
  const { products, saveProduct, deleteProduct, adjustStock } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Adjust stock state
  const [adjustType, setAdjustType] = useState<'add' | 'reduce'>('add');
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustReason, setAdjustReason] = useState('Stock Receipt / Import Clearance');

  // Product Form state
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Machinery & Equipment');
  const [brand, setBrand] = useState('');
  const [originCountry, setOriginCountry] = useState('Bangladesh');
  const [unit, setUnit] = useState('Pcs');
  const [hsCode, setHsCode] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [minStockLevel, setMinStockLevel] = useState(5);
  const [warehouseLocation, setWarehouseLocation] = useState('Mirpur Central Depot');
  const [description, setDescription] = useState('');

  const categoriesList = Array.from(
    new Set(products.map(p => p.categoryName || (p as any).category).filter(Boolean) as string[])
  );

  const openAddModal = () => {
    setSelectedProduct(null);
    setProductCode('PRD-' + (products.length + 1).toString().padStart(4, '0'));
    setProductName('');
    setCategory(categoriesList[0] || 'Pain Relief Balm & Healthcare');
    setBrand('');
    setOriginCountry('Bangladesh');
    setUnit('Pcs');
    setHsCode('');
    setPurchasePrice(0);
    setSellingPrice(0);
    setStockQuantity(10);
    setMinStockLevel(5);
    setWarehouseLocation('Mirpur Central Depot');
    setDescription('');
    setShowProductModal(true);
  };

  const openEditModal = (p: Product) => {
    setSelectedProduct(p);
    setProductCode(p.productCode || p.sku || p.productId || '');
    setProductName(p.productName);
    setCategory(p.category || p.categoryName || 'General');
    setBrand(p.brand || '');
    setOriginCountry(p.originCountry || p.countryOfOrigin || 'Bangladesh');
    setUnit(p.unit);
    setHsCode(p.hsCode || '');
    setPurchasePrice(p.purchasePrice);
    setSellingPrice(p.sellingPrice);
    setStockQuantity(p.stockQuantity);
    setMinStockLevel(p.minStockLevel || p.minimumStock || 5);
    setWarehouseLocation(p.warehouseLocation || 'Mirpur Central Depot');
    setDescription(p.description || '');
    setShowProductModal(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      alert('Product name is required.');
      return;
    }

    const newProd: Product = {
      id: selectedProduct?.id || 'prod-' + Date.now(),
      productId: selectedProduct?.productId || ('PROD-' + Date.now().toString().slice(-4)),
      sku: productCode || selectedProduct?.sku || ('SKU-' + Date.now().toString().slice(-4)),
      productCode,
      productName,
      categoryId: selectedProduct?.categoryId || 'cat-1',
      categoryName: category,
      category,
      brand,
      countryOfOrigin: originCountry,
      originCountry,
      unit,
      hsCode,
      purchasePrice,
      sellingPrice,
      wholesalePrice: selectedProduct?.wholesalePrice || sellingPrice,
      stockQuantity,
      reservedStock: selectedProduct?.reservedStock || 0,
      minimumStock: minStockLevel,
      minStockLevel,
      weight: selectedProduct?.weight || 0,
      cbm: selectedProduct?.cbm || 0,
      warehouseLocation,
      description,
      vatRate: selectedProduct?.vatRate || 0,
      taxRate: selectedProduct?.taxRate || 0,
      status: 'Active',
      createdAt: selectedProduct?.createdAt || getTodayDateString(),
      updatedAt: getTodayDateString()
    };

    saveProduct(newProd);
    setShowProductModal(false);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (adjustQty <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    adjustStock(selectedProduct.id, adjustQty, adjustType === 'add' ? 'Adjustment In' : 'Adjustment Out', adjustReason);
    setShowAdjustModal(false);
  };

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      p.productName.toLowerCase().includes(q) ||
      (p.productCode && p.productCode.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.hsCode && p.hsCode.includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q));

    const matchCat = categoryFilter === 'all' || p.category === categoryFilter || p.categoryName === categoryFilter;
    return matchSearch && matchCat;
  });

  const lowStockCount = products.filter(p => p.stockQuantity <= (p.minStockLevel || p.minimumStock || 5)).length;

  const handleExportExcel = () => {
    const data = filteredProducts.map(p => ({
      'Code': p.productCode || p.sku || p.productId,
      'Product Name': p.productName,
      'Category': p.category,
      'HS Code': p.hsCode || '',
      'Unit': p.unit,
      'Cost Price': p.purchasePrice,
      'Selling Price': p.sellingPrice,
      'Current Stock': p.stockQuantity,
      'Min Stock Level': p.minStockLevel,
      'Depot Location': p.warehouseLocation || '',
      'Stock Value (Cost)': p.stockQuantity * p.purchasePrice
    }));
    exportToExcel(data, `Inventory_Stock_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div>
          <h1 className="text-xl font-black text-zinc-100 uppercase tracking-tight flex items-center gap-2">
            <Package size={22} className="text-amber-400" />
            Inventory &amp; Stock Register
          </h1>
          <p className="text-xs text-zinc-400">
            Real-time stock tracking, HS code tracking, warehouse locations, and automated delivery deductions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs shadow-md active:scale-[0.98] transition-all"
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockCount > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/60 p-3 rounded-xl flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-400" />
            <span>
              <strong>{lowStockCount} product(s)</strong> have reached or fallen below minimum reorder thresholds.
            </span>
          </div>
          <span className="font-semibold text-amber-400">Action Required: Initiate Purchase / Import</span>
        </div>
      )}

      {/* Search & Category Filter Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by Product Name, Code, HS Code, Brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((c, idx) => (
                <option key={`cat-opt-${idx}-${c}`} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold">
                <th className="p-3">Product Info</th>
                <th className="p-3">Category / HS Code</th>
                <th className="p-3">Warehouse Location</th>
                <th className="p-3 text-right">Cost Price</th>
                <th className="p-3 text-right">Selling Price</th>
                <th className="p-3 text-center">Available Stock</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No products found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const isLow = prod.stockQuantity <= (prod.minStockLevel || prod.minimumStock || 5);

                  return (
                    <tr key={prod.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-bold text-zinc-100">{prod.productName}</p>
                            <span className="font-mono text-[11px] text-amber-400 font-semibold">
                              {prod.productCode || prod.sku || prod.productId}
                            </span>
                            {prod.brand && (
                              <span className="text-[10px] text-zinc-400 ml-2 font-medium">
                                ({prod.brand})
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-zinc-300">{prod.category}</p>
                        {prod.hsCode && (
                          <p className="font-mono text-[10px] text-zinc-500">HS: {prod.hsCode}</p>
                        )}
                      </td>
                      <td className="p-3 text-zinc-400 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Warehouse size={12} className="text-zinc-500" />
                          <span>{prod.warehouseLocation || 'Mirpur Central Depot'}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono text-zinc-300">
                        {formatCurrency(prod.purchasePrice)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-amber-400">
                        {formatCurrency(prod.sellingPrice)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-mono font-black text-sm ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>
                            {prod.stockQuantity} {prod.unit}
                          </span>
                          {isLow && (
                            <span className="text-[10px] text-red-400 font-semibold flex items-center gap-0.5">
                              <TrendingDown size={11} /> Low Stock (Min: {prod.minStockLevel})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedProduct(prod);
                              setAdjustQty(10);
                              setAdjustType('add');
                              setShowAdjustModal(true);
                            }}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-blue-400 rounded"
                            title="Adjust Stock (Add / Deduct)"
                          >
                            <ArrowUpDown size={14} />
                          </button>
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                            title="Edit Product"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setProductToDelete(prod)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 rounded"
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Add / Edit Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h2 className="text-base font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
                <Package size={18} className="text-amber-400" />
                {selectedProduct ? 'Edit Product Item' : 'Add New Product Item'}
              </h2>
              <button onClick={() => setShowProductModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Product Code *</label>
                  <input
                    type="text"
                    required
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-amber-400 font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Brand / Manufacturer</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">HS Code (Customs Tariff)</label>
                  <input
                    type="text"
                    placeholder="e.g. 8479.89.00"
                    value={hsCode}
                    onChange={(e) => setHsCode(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Unit of Measure</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  >
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Sets">Sets</option>
                    <option value="Kgs">Kgs (Kilograms)</option>
                    <option value="MT">MT (Metric Ton)</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Cartons">Cartons / Boxes</option>
                    <option value="Meters">Meters</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Cost / Purchase Price (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Selling / Invoicing Price (BDT) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-amber-400 font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Current Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Min Alert Stock Level</label>
                  <input
                    type="number"
                    min="0"
                    value={minStockLevel}
                    onChange={(e) => setMinStockLevel(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Warehouse / Depot</label>
                  <input
                    type="text"
                    value={warehouseLocation}
                    onChange={(e) => setWarehouseLocation(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-2">
                  <ArrowUpDown size={16} className="text-blue-400" />
                  Manual Stock Adjustment
                </h2>
                <p className="text-zinc-400 text-[11px]">
                  {selectedProduct.productName} (Current: {selectedProduct.stockQuantity} {selectedProduct.unit})
                </p>
              </div>
              <button onClick={() => setShowAdjustModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block text-zinc-400 mb-1">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`py-2 rounded font-bold transition-colors ${
                      adjustType === 'add'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    + Add to Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('reduce')}
                    className={`py-2 rounded font-bold transition-colors ${
                      adjustType === 'reduce'
                        ? 'bg-red-600 text-white'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    - Deduct Stock
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Quantity ({selectedProduct.unit}) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 font-bold text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Reason / Reference *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physical inventory audit / Damage write-off"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!productToDelete}
        title="Delete Product"
        message={`Are you sure you want to delete product "${productToDelete?.productName}" (${productToDelete?.sku})?`}
        confirmText="Delete Product"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (productToDelete) {
            deleteProduct(productToDelete.id);
            setProductToDelete(null);
          }
        }}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
};
